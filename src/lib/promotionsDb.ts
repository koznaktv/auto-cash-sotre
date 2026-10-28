import fs from 'fs';
import path from 'path';
import { getServicesList, saveServicesListAsync } from './servicesDb';
import { ServiceItem } from './data';
import { getSupabase } from './supabase';
import { sendChannelBroadcast } from './telegram';

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');
const PROMOTIONS_FILE = path.join(DATA_DIR, 'autocash_promotions.json');
const BUNDLED_PROMOTIONS_FILE = path.join(BUNDLED_DATA_DIR, 'autocash_promotions.json');

export interface ActivePromotion {
  id: string;
  serviceId: string;
  serviceName: string;
  packageId: string;
  packageTitle: string;
  category: string;
  serviceImage?: string;
  providerProductId?: number;
  costPrice: number;
  regularPrice: number;
  promoPrice: number;
  profitMargin: number; // promoPrice - costPrice
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  enabled: boolean;
  broadcastToChannel?: boolean;
  channelMessageId?: number;
  createdAt: string;
}

let cachedPromos: ActivePromotion[] | null = null;
let lastPromosFetch = 0;
const PROMOS_CACHE_TTL = 15_000; // 15 seconds

export function invalidatePromotionsCache(): void {
  cachedPromos = null;
  lastPromosFetch = 0;
}

export function getPromotionsList(): ActivePromotion[] {
  if (cachedPromos && Date.now() - lastPromosFetch < PROMOS_CACHE_TTL) {
    return filterActive(cachedPromos);
  }

  const fileToRead = fs.existsSync(PROMOTIONS_FILE)
    ? PROMOTIONS_FILE
    : fs.existsSync(BUNDLED_PROMOTIONS_FILE)
    ? BUNDLED_PROMOTIONS_FILE
    : null;

  if (fileToRead) {
    try {
      const raw = fs.readFileSync(fileToRead, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        cachedPromos = list;
        lastPromosFetch = Date.now();
        return filterActive(list);
      }
    } catch (e) {
      console.warn('Error reading promotions file:', e);
    }
  }

  cachedPromos = [];
  lastPromosFetch = Date.now();
  return [];
}

export async function getPromotionsListAsync(): Promise<ActivePromotion[]> {
  const local = getPromotionsList();
  const sb = getSupabase();

  if (sb) {
    try {
      const { data, error } = await sb
        .from('system_settings')
        .select('site_name')
        .eq('id', 'custom_promotions')
        .single();
      if (!error && data?.site_name) {
        const parsed = JSON.parse(data.site_name);
        if (Array.isArray(parsed)) {
          cachedPromos = parsed;
          lastPromosFetch = Date.now();
          return filterActive(parsed);
        }
      }
    } catch {}
  }

  return local;
}

function filterActive(list: ActivePromotion[]): ActivePromotion[] {
  const now = Date.now();
  return list.filter((p) => {
    if (p.enabled === false) return false;
    if (new Date(p.endsAt).getTime() <= now) return false;
    // Strict Anti-Loss Guard: Auto-deactivate any promotion if promoPrice <= costPrice
    if (p.costPrice && p.promoPrice <= p.costPrice) return false;
    return true;
  });
}

/**
 * Unified calculation of wholesale cost price for any service package.
 * Used identically across admin display, validation, and real-time order guards.
 */
export function resolvePackageCostPrice(pkg: any): number {
  if (!pkg) return 0;

  // 1. Explicit costPrice on package
  const directCost = Number(pkg.costPrice);
  if (Number.isFinite(directCost) && directCost > 0) {
    return Number(directCost.toFixed(2));
  }

  // 2. Check provider catalog for matching providerProductId
  if (pkg.providerProductId) {
    try {
      const catalogPath = path.join(process.cwd(), 'data', 'provider_catalog.json');
      if (fs.existsSync(catalogPath)) {
        const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        const found = (cat.products || []).find((pr: any) => pr.id === pkg.providerProductId);
        if (found && Number(found.costPrice) > 0) {
          return Number(Number(found.costPrice).toFixed(2));
        }
      }
    } catch {}
  }

  // 3. Standard store wholesale base: price / 1.15 (15% standard retail markup)
  const regularPrice = Number(pkg.regularPrice || pkg.price);
  if (Number.isFinite(regularPrice) && regularPrice > 0) {
    return Number((regularPrice / 1.15).toFixed(2));
  }

  return 0;
}

export async function savePromotionsListAsync(promos: ActivePromotion[]): Promise<void> {
  cachedPromos = promos;
  lastPromosFetch = Date.now();

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${PROMOTIONS_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(promos, null, 2), 'utf-8');
    fs.renameSync(temp, PROMOTIONS_FILE);
  } catch (err) {
    console.error('Error saving PROMOTIONS_FILE:', err);
  }

  // Also save to bundled directory locally if possible
  if (PROMOTIONS_FILE !== BUNDLED_PROMOTIONS_FILE && fs.existsSync(BUNDLED_DATA_DIR)) {
    try {
      fs.writeFileSync(BUNDLED_PROMOTIONS_FILE, JSON.stringify(promos, null, 2), 'utf-8');
    } catch {}
  }

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('system_settings').upsert({
        id: 'custom_promotions',
        site_name: JSON.stringify(promos),
        admin_pin: 'PROMOTIONS_BACKUP',
        shamcash_address: 'META',
        whatsapp_number: 'META',
        telegram_username: 'META',
      });
    } catch (e: any) {
      console.warn('Supabase promotions sync notice:', e?.message);
    }
  }
}

/**
 * Creates or updates an active promotion with STRICT Anti-Loss Guard.
 */
export async function createOrUpdatePromotion(input: {
  serviceId: string;
  packageId: string;
  promoPrice: number;
  endsAt: string;
  startsAt?: string;
  broadcastToChannel?: boolean;
}): Promise<{ success: boolean; promotion?: ActivePromotion; error?: string }> {
  const services = getServicesList();
  const service = services.find((s) => s.id === input.serviceId);
  if (!service) {
    return { success: false, error: 'مۇلازىمەت تېپىلمىدى' };
  }

  const pkg = service.packages?.find((p) => p.id === input.packageId);
  if (!pkg) {
    return { success: false, error: 'تاللانغان بولاق تېپىلمىدى' };
  }

  // Determine wholesale cost floor using unified calculation
  const costPrice = resolvePackageCostPrice(pkg);
  const promoPrice = Number(Number(input.promoPrice).toFixed(2));
  const regularPrice = Number(Number((pkg as any).regularPrice || pkg.price).toFixed(2));

  // ==========================================
  // STRICT ANTI-LOSS FLOOR GUARD
  // ==========================================
  if (promoPrice <= costPrice) {
    const minSafePrice = (costPrice + 0.01).toFixed(2);
    return {
      success: false,
      error: `⚠️ زىيان تارتىش خەۋپى بار! «${pkg.title}» بولىقىنىڭ پائالىيەت باھاسى ($${promoPrice}) باش مۇلازىمەتچىنىڭ تەننەرخىدىن ($${costPrice.toFixed(2)}) تۆۋەن ياكى تەڭ بولۇپ قالدى. ئەڭ تۆۋەن بىخەتەر سېتىش باھاسى: $${minSafePrice}`,
    };
  }

  const endsAtTime = new Date(input.endsAt).getTime();
  if (isNaN(endsAtTime) || endsAtTime <= Date.now()) {
    return { success: false, error: 'پائالىيەتنىڭ ئاخىرلىشىش ۋاقتى خاتا ياكى ئۆتۈپ كەتكەن ۋاقىت بولۇپ قالدى' };
  }

  const discountPercent = regularPrice > promoPrice
    ? Math.round(((regularPrice - promoPrice) / regularPrice) * 100)
    : 0;

  const currentList = getPromotionsList();
  const existingIdx = currentList.findIndex((p) => p.serviceId === input.serviceId && p.packageId === input.packageId);

  const promoRecord: ActivePromotion = {
    id: existingIdx !== -1 ? currentList[existingIdx].id : `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    serviceId: service.id,
    serviceName: service.name,
    packageId: pkg.id,
    packageTitle: pkg.title,
    category: service.category,
    serviceImage: service.image,
    providerProductId: pkg.providerProductId,
    costPrice: Number(costPrice.toFixed(4)),
    regularPrice,
    promoPrice,
    profitMargin: Number((promoPrice - costPrice).toFixed(2)),
    discountPercent,
    startsAt: input.startsAt || new Date().toISOString(),
    endsAt: input.endsAt,
    enabled: true,
    broadcastToChannel: Boolean(input.broadcastToChannel),
    createdAt: new Date().toISOString(),
  };

  // 1. Sync directly into autocash_services.json package
  (pkg as any).promoPrice = promoPrice;
  (pkg as any).regularPrice = regularPrice;
  (pkg as any).regularOriginalPrice = (pkg as any).regularOriginalPrice || pkg.originalPrice || regularPrice;
  pkg.originalPrice = regularPrice;
  pkg.price = promoPrice;
  (pkg as any).promoEndsAt = input.endsAt;
  (pkg as any).costPrice = costPrice;

  await saveServicesListAsync(services);

  // 2. Save to promotions list
  if (existingIdx !== -1) {
    currentList[existingIdx] = promoRecord;
  } else {
    currentList.unshift(promoRecord);
  }
  await savePromotionsListAsync(currentList);

  // 3. Optional: Broadcast to official Telegram Channel
  if (input.broadcastToChannel) {
    try {
      const channelMsg = [
        `⚡️🔥 <b>يېڭى ئېتىبار پائالىيىتى | FLASH SALE</b> 🔥⚡️`,
        ``,
        `🎮 <b>مۇلازىمەت:</b> ${service.name}`,
        `📦 <b>بولاق:</b> ${pkg.title}`,
        `💰 <b>پائالىيەت باھاسى:</b> <b>$${promoPrice}</b> <s>$${regularPrice}</s> (${discountPercent}% ئېتىبار)`,
        `⏰ <b>ئاخىرلىشىش ۋاقتى:</b> ${new Date(input.endsAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        ``,
        `⚡️ كۈچكە ئىگە ۋاقىت چەكلىك، ھازىرلا كىرىپ ئېلىۋېلىڭ!`,
      ].join('\n');

      const broadcastRes = await sendChannelBroadcast(channelMsg);
      if (broadcastRes.success && broadcastRes.messageId) {
        promoRecord.channelMessageId = broadcastRes.messageId;
      }
    } catch (bcErr) {
      console.warn('Channel broadcast notice:', bcErr);
    }
  }

  return { success: true, promotion: promoRecord };
}

/**
 * Creates or updates MULTIPLE active promotions in bulk with STRICT Anti-Loss Guard.
 */
export async function createOrUpdatePromotionsBulk(input: {
  serviceId: string;
  items: Array<{ packageId: string; promoPrice: number }>;
  endsAt: string;
  startsAt?: string;
  broadcastToChannel?: boolean;
}): Promise<{ success: boolean; promotions?: ActivePromotion[]; error?: string }> {
  const services = getServicesList();
  const service = services.find((s) => s.id === input.serviceId);
  if (!service) {
    return { success: false, error: 'مۇلازىمەت تېپىلمىدى' };
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { success: false, error: 'كەم دېگەندە بىر بولاق تاللىنىشى كېرەك' };
  }

  const endsAtTime = new Date(input.endsAt).getTime();
  if (isNaN(endsAtTime) || endsAtTime <= Date.now()) {
    return { success: false, error: 'پائالىيەتنىڭ ئاخىرلىشىش ۋاقتى خاتا ياكى ئۆتۈپ كەتكەن ۋاقىت بولۇپ قالدى' };
  }

  let catalog: any = null;
  try {
    const catalogPath = path.join(process.cwd(), 'data', 'provider_catalog.json');
    if (fs.existsSync(catalogPath)) {
      catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    }
  } catch {}

  const currentList = getPromotionsList();
  const createdPromos: ActivePromotion[] = [];

  // 1. Strict Anti-Loss Guard Check across all items FIRST
  for (const item of input.items) {
    const pkg = service.packages?.find((p) => p.id === item.packageId);
    if (!pkg) continue;

    const costPrice = resolvePackageCostPrice(pkg);
    const promoPrice = Number(Number(item.promoPrice).toFixed(2));
    if (promoPrice <= costPrice) {
      const minSafePrice = (costPrice + 0.01).toFixed(2);
      return {
        success: false,
        error: `⛔️ زىيان تارتىش خەۋپى بار! «${pkg.title}» بولىقىنىڭ پائالىيەت باھاسى ($${promoPrice}) باش مۇلازىمەتچى تەننەرخىدىن ($${costPrice.toFixed(2)}) تۆۋەن ياكى تەڭ بولۇپ قالدى! ئەڭ تۆۋەن بىخەتەر باھا: $${minSafePrice}`,
      };
    }
  }

  // 2. Apply all promotions
  for (const item of input.items) {
    const pkg = service.packages?.find((p) => p.id === item.packageId);
    if (!pkg) continue;

    const costPrice = resolvePackageCostPrice(pkg);

    const promoPrice = Number(Number(item.promoPrice).toFixed(2));
    const regularPrice = Number(Number((pkg as any).regularPrice || pkg.price).toFixed(2));
    const discountPercent = regularPrice > promoPrice
      ? Math.round(((regularPrice - promoPrice) / regularPrice) * 100)
      : 0;

    const existingIdx = currentList.findIndex((p) => p.serviceId === input.serviceId && p.packageId === item.packageId);

    const promoRecord: ActivePromotion = {
      id: existingIdx !== -1 ? currentList[existingIdx].id : `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      serviceId: service.id,
      serviceName: service.name,
      packageId: pkg.id,
      packageTitle: pkg.title,
      category: service.category,
      serviceImage: service.image,
      providerProductId: pkg.providerProductId,
      costPrice: Number(costPrice.toFixed(4)),
      regularPrice,
      promoPrice,
      profitMargin: Number((promoPrice - costPrice).toFixed(2)),
      discountPercent,
      startsAt: input.startsAt || new Date().toISOString(),
      endsAt: input.endsAt,
      enabled: true,
      broadcastToChannel: Boolean(input.broadcastToChannel),
      createdAt: new Date().toISOString(),
    };

    (pkg as any).promoPrice = promoPrice;
    (pkg as any).regularPrice = regularPrice;
    (pkg as any).regularOriginalPrice = (pkg as any).regularOriginalPrice || pkg.originalPrice || regularPrice;
    pkg.originalPrice = regularPrice;
    pkg.price = promoPrice;
    (pkg as any).promoEndsAt = input.endsAt;
    (pkg as any).costPrice = costPrice;

    if (existingIdx !== -1) {
      currentList[existingIdx] = promoRecord;
    } else {
      currentList.unshift(promoRecord);
    }
    createdPromos.push(promoRecord);
  }

  await saveServicesListAsync(services);
  await savePromotionsListAsync(currentList);

  // 3. Optional: Broadcast to Telegram Channel
  if (input.broadcastToChannel && createdPromos.length > 0) {
    try {
      const channelLines = [
        `🔥 <b>${service.name} | ئالاھىدە چوڭ ئېتىبار پائالىيىتى!</b> 🔥`,
        `⏰ <b>ئاخىرلىشىش ۋاقتى:</b> بۈگۈن كېچە سائەت ${new Date(input.endsAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} گىچە پۇرسەت غەنىيمەت!`,
        ``,
        `💎 <b>ئېتىبار بولاقلار تىزىملىكى:</b>`,
      ];

      createdPromos.forEach((p) => {
        channelLines.push(`🔹 <b>${p.packageTitle}</b> ➔ <s>$${p.regularPrice}</s> | <b>$${p.promoPrice}</b>`);
      });

      channelLines.push(``);
      channelLines.push(`⚡️ 24/7 سېكۇنتتا ئاپتوماتىك قاچىلىنىدۇ!`);

      await sendChannelBroadcast(channelLines.join('\n'));
    } catch (bcErr) {
      console.warn('Channel broadcast notice:', bcErr);
    }
  }

  return { success: true, promotions: createdPromos };
}

/**
 * Removes or cancels a promotion and reverts package to regular price.
 */
export async function removePromotion(promoId: string): Promise<{ success: boolean; error?: string }> {
  const currentList = getPromotionsList();
  const target = currentList.find((p) => p.id === promoId);
  if (!target) {
    return { success: false, error: 'پائالىيەت تېپىلمىدى' };
  }

  // 1. Revert service package
  const services = getServicesList();
  const service = services.find((s) => s.id === target.serviceId);
  if (service && service.packages) {
    const pkg = service.packages.find((p) => p.id === target.packageId);
    if (pkg) {
      pkg.price = target.regularPrice;
      if ((pkg as any).regularOriginalPrice !== undefined) {
        pkg.originalPrice = (pkg as any).regularOriginalPrice;
      }
      delete (pkg as any).promoPrice;
      delete (pkg as any).regularPrice;
      delete (pkg as any).regularOriginalPrice;
      delete (pkg as any).promoEndsAt;
    }
    await saveServicesListAsync(services);
  }

  // 2. Remove from promotions list
  const filtered = currentList.filter((p) => p.id !== promoId);
  await savePromotionsListAsync(filtered);

  return { success: true };
}
