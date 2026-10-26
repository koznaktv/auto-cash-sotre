import fs from 'fs';
import path from 'path';
import { getSupabase } from './supabase';

export interface WifiCardItem {
  id: string;
  serviceId: 'fursan_net' | 'azez_net' | string;
  serviceName: string;
  packageId: string;
  packageTitle: string;
  username: string;
  password: string;
  cardNumber: string;
  validityDays?: number;
  status: 'available' | 'sold';
  soldToUserId?: string;
  soldToUserEmail?: string;
  soldOrderId?: string;
  soldAt?: string;
  createdAt: string;
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');
const WIFI_CARDS_FILE = path.join(DATA_DIR, 'autocash_wifi_cards.json');
const BUNDLED_WIFI_CARDS_FILE = path.join(BUNDLED_DATA_DIR, 'autocash_wifi_cards.json');

// In-memory cache for ultra-fast, consistent read operations within the process
let cachedWifiCards: WifiCardItem[] | null = null;
let lastWifiFetch = 0;
const WIFI_CACHE_TTL = 3_000; // 3 seconds TTL

export function invalidateWifiCardsCache(): void {
  lastWifiFetch = 0;
  cachedWifiCards = null;
}

function ensureLocalCardsFile(): WifiCardItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(WIFI_CARDS_FILE)) {
      const content = fs.readFileSync(WIFI_CARDS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
    if (fs.existsSync(BUNDLED_WIFI_CARDS_FILE)) {
      const content = fs.readFileSync(BUNDLED_WIFI_CARDS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        try {
          fs.writeFileSync(WIFI_CARDS_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        } catch {}
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading wifi cards file:', err);
  }
  return [];
}

function saveLocalCardsFile(cards: WifiCardItem[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${WIFI_CARDS_FILE}.${Date.now()}-${Math.random().toString(36).slice(2, 6)}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(cards, null, 2), 'utf-8');
    fs.renameSync(temp, WIFI_CARDS_FILE);

    // Also persist to bundled file if not serverless
    if (!IS_SERVERLESS && BUNDLED_WIFI_CARDS_FILE !== WIFI_CARDS_FILE) {
      try {
        fs.writeFileSync(BUNDLED_WIFI_CARDS_FILE, JSON.stringify(cards, null, 2), 'utf-8');
      } catch {}
    }
  } catch (err) {
    console.error('Error saving local wifi cards file:', err);
  }
}

/**
 * Get all cards in inventory (with multi-layer persistence fallback)
 */
export async function getAllWifiCardsAsync(): Promise<WifiCardItem[]> {
  if (cachedWifiCards && Date.now() - lastWifiFetch < WIFI_CACHE_TTL) {
    return cachedWifiCards;
  }

  const sb = getSupabase();
  if (sb) {
    // 1. Try dedicated wifi_cards table if it exists in Supabase
    try {
      const { data, error } = await sb
        .from('wifi_cards')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: WifiCardItem[] = data.map((d: any) => ({
          id: d.id,
          serviceId: d.service_id,
          serviceName: d.service_name,
          packageId: d.package_id,
          packageTitle: d.package_title,
          username: d.username,
          password: d.password,
          cardNumber: d.card_number,
          validityDays: d.validity_days,
          status: d.status,
          soldToUserId: d.sold_to_user_id,
          soldToUserEmail: d.sold_to_user_email,
          soldOrderId: d.sold_order_id,
          soldAt: d.sold_at,
          createdAt: d.created_at,
        }));
        cachedWifiCards = mapped;
        lastWifiFetch = Date.now();
        saveLocalCardsFile(mapped);
        return mapped;
      }
    } catch {}

    // 2. Try Supabase system_settings backing store (matches custom_categories & custom_banners pattern)
    try {
      const { data: setRes, error: setErr } = await sb
        .from('system_settings')
        .select('site_name')
        .eq('id', 'wifi_inventory_cards')
        .maybeSingle();

      if (!setErr && setRes?.site_name) {
        const parsed = JSON.parse(setRes.site_name);
        if (Array.isArray(parsed)) {
          cachedWifiCards = parsed;
          lastWifiFetch = Date.now();
          saveLocalCardsFile(parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Fallback to local / bundled JSON file
  const local = ensureLocalCardsFile();
  cachedWifiCards = local;
  lastWifiFetch = Date.now();
  return local;
}

/**
 * Universal save function that commits cards to memory cache, Supabase system_settings,
 * optional wifi_cards table, and local disk.
 */
export async function saveAllWifiCardsAsync(cards: WifiCardItem[]): Promise<void> {
  cachedWifiCards = cards;
  lastWifiFetch = Date.now();

  // 1. Save locally
  saveLocalCardsFile(cards);

  // 2. Persist to Supabase
  const sb = getSupabase();
  if (sb) {
    // 2a. Always save full inventory into system_settings under 'wifi_inventory_cards'
    try {
      await sb.from('system_settings').upsert({
        id: 'wifi_inventory_cards',
        site_name: JSON.stringify(cards),
        admin_pin: 'WIFI_BACKUP',
        shamcash_address: 'WIFI_CARDS',
        whatsapp_number: 'WIFI_CARDS',
        telegram_username: 'WIFI_CARDS',
      });
    } catch (e) {
      console.warn('Failed saving wifi cards to system_settings:', e);
    }

    // 2b. Also try to sync to wifi_cards table if configured
    try {
      const rows = cards.map((c) => ({
        id: c.id,
        service_id: c.serviceId,
        service_name: c.serviceName,
        package_id: c.packageId,
        package_title: c.packageTitle,
        username: c.username,
        password: c.password,
        card_number: c.cardNumber,
        validity_days: c.validityDays,
        status: c.status,
        sold_to_user_id: c.soldToUserId,
        sold_to_user_email: c.soldToUserEmail,
        sold_order_id: c.soldOrderId,
        sold_at: c.soldAt,
        created_at: c.createdAt,
      }));
      await sb.from('wifi_cards').upsert(rows);
    } catch {}
  }
}

/**
 * Get inventory stock counts grouped by serviceId and packageId
 */
export async function getWifiStockSummaryAsync(): Promise<
  Record<string, { available: number; sold: number }>
> {
  const cards = await getAllWifiCardsAsync();
  const summary: Record<string, { available: number; sold: number }> = {};

  for (const card of cards) {
    const key = `${card.serviceId}:${card.packageId}`;
    if (!summary[key]) {
      summary[key] = { available: 0, sold: 0 };
    }
    if (card.status === 'available') {
      summary[key].available++;
    } else {
      summary[key].sold++;
    }
  }

  return summary;
}

/**
 * Atomically claim 1 available card for purchase
 */
export async function claimAvailableWifiCardAsync(params: {
  serviceId: string;
  packageId: string;
  userId: string;
  userEmail: string;
  orderId: string;
}): Promise<WifiCardItem | null> {
  const allCards = await getAllWifiCardsAsync();
  const now = new Date().toISOString();

  const idx = allCards.findIndex(
    (c) => c.serviceId === params.serviceId && c.packageId === params.packageId && c.status === 'available'
  );

  if (idx === -1) return null;

  const card = allCards[idx];
  card.status = 'sold';
  card.soldToUserId = params.userId;
  card.soldToUserEmail = params.userEmail;
  card.soldOrderId = params.orderId;
  card.soldAt = now;

  await saveAllWifiCardsAsync(allCards);
  return card;
}

/**
 * Release / unclaim a card back to available if order creation fails
 */
export async function unclaimWifiCardAsync(cardId: string): Promise<boolean> {
  const allCards = await getAllWifiCardsAsync();
  const card = allCards.find((c) => c.id === cardId);
  if (card) {
    card.status = 'available';
    delete card.soldToUserId;
    delete card.soldToUserEmail;
    delete card.soldOrderId;
    delete card.soldAt;
    await saveAllWifiCardsAsync(allCards);
    return true;
  }
  return false;
}

/**
 * Bulk add cards from raw text input without losing previously added cards.
 */
export async function bulkAddWifiCardsAsync(params: {
  serviceId: string;
  serviceName: string;
  packageId: string;
  packageTitle: string;
  rawText: string;
}): Promise<{ addedCount: number; errors: string[] }> {
  const lines = params.rawText.split('\n');
  const newCards: WifiCardItem[] = [];
  const errors: string[] = [];
  const now = new Date().toISOString();

  // Load existing inventory safely
  const allCards = await getAllWifiCardsAsync();
  let maxSeq = 1000;
  for (const c of allCards) {
    const num = parseInt(c.cardNumber.replace('#', ''), 10);
    if (!isNaN(num) && num > maxSeq) maxSeq = num;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const parts = rawLine.split(/[\s:,\t|-]+/).filter(Boolean);
    if (parts.length < 1) continue;

    const username = parts[0];
    const password = parts[1] || '';

    if (!username) {
      errors.push(`قۇر ${i + 1}: نومۇر تېپىلمىدى`);
      continue;
    }

    maxSeq++;
    const cardItem: WifiCardItem = {
      id: `WIFI-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      packageId: params.packageId,
      packageTitle: params.packageTitle,
      username,
      password,
      cardNumber: `#${maxSeq}`,
      status: 'available',
      createdAt: now,
    };
    newCards.push(cardItem);
    allCards.push(cardItem);
  }

  if (newCards.length === 0) {
    return { addedCount: 0, errors: errors.length ? errors : ['ھېچقانداق كۈچكە ئىگە كارتىلار تېپىلمىدى'] };
  }

  // Persist the combined inventory to memory, Supabase and disk
  await saveAllWifiCardsAsync(allCards);

  return { addedCount: newCards.length, errors };
}

/**
 * Delete an unsold card
 */
export async function deleteWifiCardAsync(cardId: string): Promise<boolean> {
  const allCards = await getAllWifiCardsAsync();
  const filtered = allCards.filter((c) => !(c.id === cardId && c.status === 'available'));
  if (filtered.length !== allCards.length) {
    await saveAllWifiCardsAsync(filtered);
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('wifi_cards').delete().eq('id', cardId).eq('status', 'available');
      } catch {}
    }
    return true;
  }
  return false;
}

/**
 * Bulk delete unsold cards by an array of IDs
 */
export async function bulkDeleteWifiCardsAsync(cardIds: string[]): Promise<number> {
  if (!cardIds || !cardIds.length) return 0;
  const idSet = new Set(cardIds);
  const allCards = await getAllWifiCardsAsync();
  const filtered = allCards.filter((c) => !(idSet.has(c.id) && c.status === 'available'));
  const deletedCount = allCards.length - filtered.length;
  if (deletedCount > 0) {
    await saveAllWifiCardsAsync(filtered);
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('wifi_cards').delete().in('id', cardIds).eq('status', 'available');
      } catch {}
    }
  }
  return deletedCount;
}

/**
 * Clear all unsold cards for a specific network and package
 */
export async function clearAvailableWifiCardsByPackageAsync(params: {
  serviceId: string;
  packageId: string;
}): Promise<number> {
  const allCards = await getAllWifiCardsAsync();
  const filtered = allCards.filter(
    (c) => !(c.serviceId === params.serviceId && c.packageId === params.packageId && c.status === 'available')
  );
  const deletedCount = allCards.length - filtered.length;
  if (deletedCount > 0) {
    await saveAllWifiCardsAsync(filtered);
    const sb = getSupabase();
    if (sb) {
      try {
        await sb
          .from('wifi_cards')
          .delete()
          .eq('service_id', params.serviceId)
          .eq('package_id', params.packageId)
          .eq('status', 'available');
      } catch {}
    }
  }
  return deletedCount;
}
