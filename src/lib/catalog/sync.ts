import crypto from 'crypto';
import { syria4GameProvider } from '../providers/syria4game';
import { buildProviderCatalog, invalidateCatalogCache } from './storefront';
import {
  acquireLock,
  finishSyncRun,
  getProviderSettings,
  listCatalogOverrides,
  listStoredCategories,
  listStoredProducts,
  markUnseenRemoved,
  releaseLock,
  startSyncRun,
  updateProviderSettings,
  upsertStoredCategories,
  upsertStoredProducts,
} from './store';
import type { ProviderCategory, StoredCategory, StoredProduct, SyncStats } from './types';

const LOCK_NAME = 'catalog-sync';
// A catalog that shrank this much is more likely a partial / maintenance response than real removals
const MIN_KEEP_RATIO = 0.6;

export interface SyncResult {
  ok: boolean;
  skipped?: boolean;
  aborted?: boolean;
  stats?: SyncStats;
  error?: string;
}

function withHierarchy(categories: ProviderCategory[], runId: number): StoredCategory[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return categories.map((category) => {
    let depth = 0;
    let root = category;
    const seen = new Set<number>([category.id]);
    while (root.parentId !== null && byId.has(root.parentId) && !seen.has(root.parentId) && depth < 20) {
      root = byId.get(root.parentId)!;
      seen.add(root.id);
      depth++;
    }
    return { ...category, rootId: root.id === category.id ? null : root.id, depth, lastSeenRunId: runId, removedAt: null };
  });
}

/** Pulls the full syria4game catalog into provider_categories / provider_products. */
export async function runCatalogSync(options: { trigger: 'admin' | 'cron' }): Promise<SyncResult> {
  const holder = crypto.randomUUID();
  if (!(await acquireLock(LOCK_NAME, 300, holder))) return { ok: false, skipped: true, error: 'Sync ئاللىقاچان ئىجرا بولۇۋاتىدۇ' };

  const started = Date.now();
  let runId = 0;
  try {
    runId = await startSyncRun(options.trigger);
    const result = await syria4GameProvider.getCatalog();
    if (!result.success || !result.catalog) throw new Error(result.error?.message || 'تىزىملىكنى ئېلىش مەغلۇپ بولدى');

    const { categories, products } = result.catalog;
    const existingProducts = await listStoredProducts();
    const previousActive = existingProducts.filter((p) => !p.removedAt).length;

    if (products.length === 0 || (previousActive > 0 && products.length < previousActive * MIN_KEEP_RATIO)) {
      const message = `بىخەتەرلىك توسقۇچى: ${products.length} مەھسۇلات كەلدى (ئالدىنقىسى ${previousActive}). ھېچنېمە ئۆزگەرتىلمىدى.`;
      await finishSyncRun(runId, 'aborted', null, message);
      await updateProviderSettings({ lastSyncAt: new Date().toISOString(), lastSyncStatus: 'aborted', lastSyncError: message });
      return { ok: false, aborted: true, error: message };
    }

    const now = new Date().toISOString();
    const existingById = new Map(existingProducts.map((p) => [p.id, p]));
    let added = 0;
    let priceChanged = 0;

    const productRows: StoredProduct[] = products.map((product) => {
      const previous = existingById.get(product.id);
      if (!previous) added++;
      const changed = previous && Math.abs(previous.costPrice - product.costPrice) > 1e-10;
      if (changed) priceChanged++;
      return {
        ...product,
        prevCostPrice: changed ? previous!.costPrice : previous?.prevCostPrice ?? null,
        priceChangedAt: changed ? now : previous?.priceChangedAt ?? null,
        lastSeenRunId: runId,
        syncedAt: now,
        removedAt: null,
      };
    });

    await upsertStoredCategories(withHierarchy(categories, runId));
    await upsertStoredProducts(productRows);
    const removed = await markUnseenRemoved(runId);

    // Auto-protect website prices: If any provider products increased costPrice, auto-raise selling price
    if (priceChanged > 0) {
      try {
        const { getServicesListAsync, saveServicesListAsync, invalidateServicesCache } = await import('../servicesDb');
        const currentServices = await getServicesListAsync();
        let anyUpdated = false;
        const prodMap = new Map(products.map((p) => [p.id, p]));

        for (const srv of currentServices) {
          for (const pkg of srv.packages || []) {
            if (pkg.providerProductId && prodMap.has(pkg.providerProductId)) {
              const liveProd = prodMap.get(pkg.providerProductId);
              if (liveProd && (liveProd.costPrice >= pkg.price || (pkg.costPrice && liveProd.costPrice > pkg.costPrice))) {
                const targetMarkup = 0.15;
                const newPrice = Number(Math.max(liveProd.costPrice * (1 + targetMarkup), liveProd.costPrice + 0.08).toFixed(2));
                pkg.costPrice = Number(liveProd.costPrice.toFixed(4));
                pkg.price = newPrice;
                pkg.originalPrice = Number((newPrice * 1.15).toFixed(2));
                anyUpdated = true;
              }
            }
          }
        }
        if (anyUpdated) {
          await saveServicesListAsync(currentServices);
          invalidateServicesCache();
        }
      } catch (err) {
        console.warn('Sync auto-adjust services error:', err);
      }
    }

    const [storedCategories, storedProducts, overrides, settings] = await Promise.all([
      listStoredCategories(),
      listStoredProducts(),
      listCatalogOverrides(),
      getProviderSettings(),
    ]);
    const built = buildProviderCatalog({ categories: storedCategories, products: storedProducts, overrides, settings });

    const stats: SyncStats = {
      categories: categories.length,
      products: products.length,
      added,
      removed: removed.products,
      priceChanged,
      unavailable: products.filter((p) => !p.available).length,
      unmappedCategories: built.stats.unmappedCategories,
      nonUsd: products.filter((p) => p.currency !== 'USD').length,
      durationMs: Date.now() - started,
    };

    const profile = await syria4GameProvider.getProfile();
    await finishSyncRun(runId, 'success', stats, null);
    await updateProviderSettings({
      lastSyncAt: now,
      lastSyncStatus: 'success',
      lastSyncStats: stats,
      lastSyncError: null,
      catalogSource: 'provider',
      ...(profile.success && profile.balance !== null ? { lastBalance: profile.balance, lastBalanceAt: now } : {}),
    });
    invalidateCatalogCache();
    return { ok: true, stats };
  } catch (err: any) {
    const message = err?.message || 'Sync مەغلۇپ بولدى';
    if (runId) await finishSyncRun(runId, 'failed', null, message).catch(() => {});
    await updateProviderSettings({ lastSyncAt: new Date().toISOString(), lastSyncStatus: 'failed', lastSyncError: message }).catch(() => {});
    return { ok: false, error: message };
  } finally {
    await releaseLock(LOCK_NAME, holder).catch(() => {});
  }
}
