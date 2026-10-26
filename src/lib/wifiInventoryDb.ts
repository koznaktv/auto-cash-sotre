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

function ensureCardsFile(): WifiCardItem[] {
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

function saveCardsFile(cards: WifiCardItem[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${WIFI_CARDS_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(cards, null, 2), 'utf-8');
    fs.renameSync(temp, WIFI_CARDS_FILE);

    // Also persist to bundled file if not serverless
    if (!IS_SERVERLESS && BUNDLED_WIFI_CARDS_FILE !== WIFI_CARDS_FILE) {
      try {
        fs.writeFileSync(BUNDLED_WIFI_CARDS_FILE, JSON.stringify(cards, null, 2), 'utf-8');
      } catch {}
    }
  } catch (err) {
    console.error('Error saving wifi cards file:', err);
  }
}

/**
 * Get all cards in inventory
 */
export async function getAllWifiCardsAsync(): Promise<WifiCardItem[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('wifi_cards')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map((d: any) => ({
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
    }
  }
  return ensureCardsFile();
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
  const sb = getSupabase();
  const now = new Date().toISOString();

  if (sb) {
    // 1. Fetch 1 available card
    const { data, error } = await sb
      .from('wifi_cards')
      .select('*')
      .eq('service_id', params.serviceId)
      .eq('package_id', params.packageId)
      .eq('status', 'available')
      .limit(1);

    if (!error && data && data.length > 0) {
      const targetCard = data[0];
      // 2. Mark as sold
      const { data: updated, error: updateErr } = await sb
        .from('wifi_cards')
        .update({
          status: 'sold',
          sold_to_user_id: params.userId,
          sold_to_user_email: params.userEmail,
          sold_order_id: params.orderId,
          sold_at: now,
        })
        .eq('id', targetCard.id)
        .eq('status', 'available')
        .select()
        .single();

      if (!updateErr && updated) {
        return {
          id: updated.id,
          serviceId: updated.service_id,
          serviceName: updated.service_name,
          packageId: updated.package_id,
          packageTitle: updated.package_title,
          username: updated.username,
          password: updated.password,
          cardNumber: updated.card_number,
          validityDays: updated.validity_days,
          status: updated.status,
          soldToUserId: updated.sold_to_user_id,
          soldToUserEmail: updated.sold_to_user_email,
          soldOrderId: updated.sold_order_id,
          soldAt: updated.sold_at,
          createdAt: updated.created_at,
        };
      }
    }
  }

  // Fallback to local file store
  const allCards = ensureCardsFile();
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

  saveCardsFile(allCards);
  return card;
}

/**
 * Release / unclaim a card back to available if order creation fails
 */
export async function unclaimWifiCardAsync(cardId: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    await sb
      .from('wifi_cards')
      .update({
        status: 'available',
        sold_to_user_id: null,
        sold_to_user_email: null,
        sold_order_id: null,
        sold_at: null,
      })
      .eq('id', cardId);
  }
  const allCards = ensureCardsFile();
  const card = allCards.find((c) => c.id === cardId);
  if (card) {
    card.status = 'available';
    delete card.soldToUserId;
    delete card.soldToUserEmail;
    delete card.soldOrderId;
    delete card.soldAt;
    saveCardsFile(allCards);
    return true;
  }
  return false;
}

/**
 * Bulk add cards from raw text input:
 * Supports lines like:
 * 519637 681
 * 90991:571
 * 90992,572
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

  // Determine starting card sequence
  const existingCards = await getAllWifiCardsAsync();
  let maxSeq = 1000;
  for (const c of existingCards) {
    const num = parseInt(c.cardNumber.replace('#', ''), 10);
    if (!isNaN(num) && num > maxSeq) maxSeq = num;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Match username and password separated by space, tab, colon, comma or dash
    const parts = rawLine.split(/[\s:,\t|-]+/).filter(Boolean);
    if (parts.length < 1) continue;

    const username = parts[0];
    const password = parts[1] || ''; // Password might be empty for some PIN-only cards

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
  }

  if (newCards.length === 0) {
    return { addedCount: 0, errors: errors.length ? errors : ['ھېچقانداق كۈچكە ئىگە كارتىلار تېپىلمىدى'] };
  }

  const sb = getSupabase();
  if (sb) {
    const rows = newCards.map((c) => ({
      id: c.id,
      service_id: c.serviceId,
      service_name: c.serviceName,
      package_id: c.packageId,
      package_title: c.packageTitle,
      username: c.username,
      password: c.password,
      card_number: c.cardNumber,
      status: c.status,
      created_at: c.createdAt,
    }));
    const { error } = await sb.from('wifi_cards').insert(rows);
    if (error) {
      console.warn('Supabase bulk insert warning, saving locally:', error.message);
    }
  }

  // Always save to file as well
  const all = ensureCardsFile();
  all.push(...newCards);
  saveCardsFile(all);

  return { addedCount: newCards.length, errors };
}

/**
 * Delete an unsold card
 */
export async function deleteWifiCardAsync(cardId: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    await sb.from('wifi_cards').delete().eq('id', cardId).eq('status', 'available');
  }
  const all = ensureCardsFile();
  const filtered = all.filter((c) => !(c.id === cardId && c.status === 'available'));
  saveCardsFile(filtered);
  return true;
}

/**
 * Bulk delete unsold cards by an array of IDs
 */
export async function bulkDeleteWifiCardsAsync(cardIds: string[]): Promise<number> {
  if (!cardIds || !cardIds.length) return 0;
  const idSet = new Set(cardIds);
  const sb = getSupabase();
  if (sb) {
    await sb.from('wifi_cards').delete().in('id', cardIds).eq('status', 'available');
  }
  const all = ensureCardsFile();
  const filtered = all.filter((c) => !(idSet.has(c.id) && c.status === 'available'));
  const deletedCount = all.length - filtered.length;
  saveCardsFile(filtered);
  return deletedCount;
}

/**
 * Clear all unsold cards for a specific network and package
 */
export async function clearAvailableWifiCardsByPackageAsync(params: {
  serviceId: string;
  packageId: string;
}): Promise<number> {
  const sb = getSupabase();
  if (sb) {
    await sb
      .from('wifi_cards')
      .delete()
      .eq('service_id', params.serviceId)
      .eq('package_id', params.packageId)
      .eq('status', 'available');
  }
  const all = ensureCardsFile();
  const filtered = all.filter(
    (c) => !(c.serviceId === params.serviceId && c.packageId === params.packageId && c.status === 'available')
  );
  const deletedCount = all.length - filtered.length;
  saveCardsFile(filtered);
  return deletedCount;
}
