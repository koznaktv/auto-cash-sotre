/**
 * Builds the storefront catalog (ServiceItem[]) from the synced provider catalog.
 *
 * - Service = a provider category that directly holds at least one visible product (id `s4g-c{id}`)
 * - Package = a provider product (id `s4g-p{id}`), cheapest first
 * Admin overrides (catalog_overrides) win over provider data and over the keyword mapping.
 */
import type { ServiceItem, ServicePackage } from '../data';
import { getServicesList, getServicesListAsync } from '../servicesDb';
import { normalizeFields, normalizeQtyRule } from '../providers/syria4gameNormalize';
import { guessStorefrontCategory, resolveServiceArtwork, STOREFRONT_ICONS } from './categoryMapping';
import { computeSellPrice, resolveMarkup, unitSellPrice } from './pricing';
import { minQty } from './fieldValidation';
import { detectServiceInputs } from './productBios';
import {
  getProviderSettings,
  listCatalogOverrides,
  listStoredCategories,
  listStoredProducts,
} from './store';
import type {
  CatalogOverride,
  CheckoutField,
  ProviderSettings,
  QtyRule,
  StorefrontCategory,
  StoredCategory,
  StoredProduct,
} from './types';

export const SERVICE_PREFIX = 's4g-c';
export const PACKAGE_PREFIX = 's4g-p';
const CACHE_TTL_MS = 60_000;

// Assumption until real API responses confirm it: game top-ups with an empty schema still need a player id
const DEFAULT_FIELDS: Partial<Record<StorefrontCategory, CheckoutField[]>> = {
  games: [{ key: 'playerId', label: 'ئويۇنچى ID (Player ID)', type: 'text', required: true }],
};

export interface OrderableProduct {
  product: StoredProduct;
  category: StoredCategory;
  serviceId: string;
  packageId: string;
  serviceName: string;
  packageTitle: string;
  storefrontCategory: StorefrontCategory;
  markupPercent: number;
  fields: CheckoutField[];
  qty: QtyRule;
}

export interface CategoryInfo {
  category: StoredCategory;
  storefrontCategory: StorefrontCategory | null;
  mappedBy: 'override' | 'keyword' | null;
  hidden: boolean;
  productCount: number;
  visibleProductCount: number;
  override?: CatalogOverride;
}

export interface ProviderCatalog {
  services: ServiceItem[];
  orderable: Map<number, OrderableProduct>;
  categoryInfo: CategoryInfo[];
  stats: {
    services: number;
    products: number;
    unmappedCategories: number;
    unavailable: number;
    removed: number;
    nonUsd: number;
    needsFieldMapping: number;
  };
}

/** Pure: assembles the storefront from stored rows (exported for tests). */
export function buildProviderCatalog(input: {
  categories: StoredCategory[];
  products: StoredProduct[];
  overrides: CatalogOverride[];
  settings: ProviderSettings;
}): ProviderCatalog {
  const { settings } = input;
  const categoryById = new Map(input.categories.map((c) => [c.id, c]));
  const productById = new Map(input.products.map((p) => [p.id, p]));
  const categoryOverride = new Map<number, CatalogOverride>();
  const productOverride = new Map<number, CatalogOverride>();
  for (const o of input.overrides) (o.scope === 'category' ? categoryOverride : productOverride).set(o.targetId, o);

  // Ancestor chain (self first), guarded against cycles
  const chainCache = new Map<number, StoredCategory[]>();
  const chainOf = (id: number): StoredCategory[] => {
    const cached = chainCache.get(id);
    if (cached) return cached;
    const chain: StoredCategory[] = [];
    const seen = new Set<number>();
    let current = categoryById.get(id);
    while (current && !seen.has(current.id) && chain.length < 20) {
      chain.push(current);
      seen.add(current.id);
      current = current.parentId !== null ? categoryById.get(current.parentId) : undefined;
    }
    chainCache.set(id, chain);
    return chain;
  };

  const resolveCategory = (id: number): { category: StorefrontCategory | null; mappedBy: CategoryInfo['mappedBy'] } => {
    const chain = chainOf(id);
    for (const c of chain) {
      const mapped = categoryOverride.get(c.id)?.storefrontCategory;
      if (mapped) return { category: mapped, mappedBy: 'override' };
    }
    // Root first, then the leaf: root names ("ألعاب") are the most reliable signal
    const guessed = guessStorefrontCategory([...chain].reverse().map((c) => c.name));
    return { category: guessed, mappedBy: guessed ? 'keyword' : null };
  };

  const isCategoryHidden = (id: number) => chainOf(id).some((c) => c.removedAt || categoryOverride.get(c.id)?.hidden);

  const stats = { services: 0, products: 0, unmappedCategories: 0, unavailable: 0, removed: 0, nonUsd: 0, needsFieldMapping: 0 };
  const orderable = new Map<number, OrderableProduct>();
  const packagesByCategory = new Map<number, ServicePackage[]>();
  const counts = new Map<number, { total: number; visible: number }>();

  for (const product of input.products) {
    const count = counts.get(product.categoryId) || { total: 0, visible: 0 };
    count.total++;
    counts.set(product.categoryId, count);

    if (product.removedAt) {
      stats.removed++;
      continue;
    }
    if (product.currency !== 'USD') {
      stats.nonUsd++;
      continue;
    }
    const category = categoryById.get(product.categoryId);
    if (!category || isCategoryHidden(category.id) || productOverride.get(product.id)?.hidden) continue;
    const { category: storefrontCategory } = resolveCategory(category.id);
    if (!storefrontCategory) continue;
    if (!product.available) {
      stats.unavailable++;
      if (!settings.showUnavailable) continue;
    }

    const chain = chainOf(category.id);
    const override = productOverride.get(product.id);
    const markupPercent = resolveMarkup(
      [override?.markupPercent, ...chain.map((c) => categoryOverride.get(c.id)?.markupPercent)],
      settings.globalMarkupPercent
    );
    const parsedFields = normalizeFields(product.inputSchema, product.params);
    const fields =
      override?.inputFieldsOverride ||
      chain.map((c) => categoryOverride.get(c.id)?.inputFieldsOverride).find(Boolean) ||
      (parsedFields.length ? parsedFields : DEFAULT_FIELDS[storefrontCategory] || []);
    // Inputs whose provider param name is unknown can't be sent: keep these off the storefront
    if (fields.some((f) => f.unconfirmed)) {
      stats.needsFieldMapping++;
      continue;
    }
    const qty = normalizeQtyRule(product.qtyValues, product.productType);
    const isAmount = qty.kind !== 'fixed';
    const fixedMarkup = override?.fixedMarkupUsd ?? settings.fixedMarkupUsd ?? 0;
    let price: number;
    try {
      price = computeSellPrice({
        unitCost: product.costPrice,
        qty: minQty(qty),
        markupPercent,
        fixedMarkupUsd: fixedMarkup,
        minProfit: settings.minProfitUsd,
      });
    } catch {
      continue;
    }

    const packageId = `${PACKAGE_PREFIX}${product.id}`;
    const serviceId = `${SERVICE_PREFIX}${category.id}`;
    const pkg: ServicePackage = {
      id: packageId,
      title: override?.customName || product.name,
      price,
      duration: 'دەرھال',
      providerProductId: product.id,
      productType: isAmount ? 'amount' : 'fixed',
      ...(isAmount ? { unitPrice: unitSellPrice(product.costPrice, markupPercent, fixedMarkup) } : {}),
      qty,
      fields,
      available: product.available,
    };
    const list = packagesByCategory.get(category.id) || [];
    list.push(pkg);
    packagesByCategory.set(category.id, list);
    count.visible++;
    stats.products++;

    if (product.available) {
      orderable.set(product.id, {
        product,
        category,
        serviceId,
        packageId,
        serviceName: categoryOverride.get(category.id)?.customName || category.name,
        packageTitle: pkg.title,
        storefrontCategory,
        markupPercent,
        fields,
        qty,
      });
    }
  }

  const services: ServiceItem[] = [];
  packagesByCategory.forEach((packages, categoryId) => {
    const category = categoryById.get(categoryId)!;
    const override = categoryOverride.get(categoryId);
    const { category: storefrontCategory } = resolveCategory(categoryId);
    if (!storefrontCategory) return;
    const parent = category.parentId !== null ? categoryById.get(category.parentId) : undefined;
    const firstImage = packages.map((p) => productById.get(p.providerProductId!)?.image).find(Boolean);
    packages.sort((a, b) => a.price - b.price);
    const serviceName = override?.customName || category.name;
    const candidateImage = override?.customImage || category.image || firstImage;
    const isCleanImage =
      typeof candidateImage === 'string' &&
      candidateImage.trim() !== '' &&
      candidateImage.trim() !== '/' &&
      candidateImage !== 'https://api.sahl-cash.com/' &&
      candidateImage !== 'https://api.sahl-cash.com' &&
      candidateImage !== 'https://syria4game.com/' &&
      candidateImage !== 'https://syria4game.com' &&
      !candidateImage.endsWith('sahl-cash.com/') &&
      !candidateImage.endsWith('syria4game.com/');
    const image = isCleanImage ? candidateImage : resolveServiceArtwork(serviceName, storefrontCategory);

    const detected = detectServiceInputs(serviceName, storefrontCategory);
    services.push({
      id: `${SERVICE_PREFIX}${categoryId}`,
      name: serviceName,
      category: storefrontCategory,
      icon: STOREFRONT_ICONS[storefrontCategory],
      image,
      description: override?.customDescription || parent?.name || category.name,
      badge: override?.customBadge || undefined,
      inputLabel: detected.inputLabel,
      inputPlaceholder: detected.inputPlaceholder,
      requiresZoneId: detected.requiresZoneId,
      zoneIdLabel: detected.zoneIdLabel,
      zoneIdPlaceholder: detected.zoneIdPlaceholder,
      bioContent: detected.defaultBio,
      packages,
      source: 'provider',
    });
  });

  const sortOrder = (id: string) => categoryOverride.get(Number(id.slice(SERVICE_PREFIX.length)))?.sortOrder ?? 1000;
  services.sort((a, b) => sortOrder(a.id) - sortOrder(b.id) || a.name.localeCompare(b.name));
  stats.services = services.length;

  const categoryInfo: CategoryInfo[] = input.categories.map((category) => {
    const { category: storefrontCategory, mappedBy } = resolveCategory(category.id);
    const count = counts.get(category.id) || { total: 0, visible: 0 };
    if (count.total > 0 && !storefrontCategory && !category.removedAt) stats.unmappedCategories++;
    return {
      category,
      storefrontCategory,
      mappedBy,
      hidden: isCategoryHidden(category.id),
      productCount: count.total,
      visibleProductCount: count.visible,
      override: categoryOverride.get(category.id),
    };
  });

  return { services, orderable, categoryInfo, stats };
}

// ---------------------------------------------------------------- cached access

let cache: { at: number; catalog: ProviderCatalog } | null = null;

export function invalidateCatalogCache(): void {
  cache = null;
}

export async function getProviderCatalog(options: { fresh?: boolean } = {}): Promise<ProviderCatalog> {
  if (!options.fresh && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.catalog;
  const [categories, products, overrides, settings] = await Promise.all([
    listStoredCategories(),
    listStoredProducts(),
    listCatalogOverrides(),
    getProviderSettings(),
  ]);
  const catalog = buildProviderCatalog({ categories, products, overrides, settings });
  cache = { at: Date.now(), catalog };
  return catalog;
}

/** The storefront buyers see: ONLY products chosen, edited, and published by the admin. */
export async function getCatalogServices(options: { source?: 'legacy' | 'provider' } = {}): Promise<ServiceItem[]> {
  // Only if an admin preview explicitly asks for ?source=provider do we show raw provider catalog
  if (options.source === 'provider') {
    const providerCatalog = await getProviderCatalog();
    return providerCatalog.services || [];
  }

  const customServices = (await getServicesListAsync()) || [];

  // Strictly only services that are saved and not hidden (published !== false)
  const publishedCustom: ServiceItem[] = customServices
    .filter((s) => s.published !== false)
    .map((s) => ({
      ...s,
      published: true,
      source: (s.source || 'provider') as 'legacy' | 'provider',
    }));

  return publishedCustom;
}

export type ResolveResult =
  | { ok: true; item: OrderableProduct }
  | { ok: false; status: number; message: string };

/** Re-checks at order time that the package is a visible, available provider product of that service. */
export async function resolveOrderableProduct(serviceId: string, packageId: string): Promise<ResolveResult> {
  if (!serviceId.startsWith(SERVICE_PREFIX) || !packageId.startsWith(PACKAGE_PREFIX)) {
    return { ok: false, status: 410, message: 'مەھسۇلات تىزىملىكى يېڭىلاندى، بەتنى يېڭىلاپ قايتا تاللاڭ' };
  }
  const productId = Number(packageId.slice(PACKAGE_PREFIX.length));
  // The 60s cache is fine here: price and availability are re-checked live before charging
  const catalog = await getProviderCatalog();
  const item = catalog.orderable.get(productId);
  if (!item || item.serviceId !== serviceId) {
    return { ok: false, status: 409, message: 'بۇ مەھسۇلات ھازىر سېتىلمايدۇ' };
  }
  return { ok: true, item };
}
