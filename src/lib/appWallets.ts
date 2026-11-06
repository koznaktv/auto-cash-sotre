import fs from 'fs';
import path from 'path';
import {
  UserRecord,
  getUserByTelegramUsernameAsync,
  getUserByTelegramChatIdAsync,
  getUserByEmailAsync,
  getAllUsersAsync,
  createUserAsync,
  adjustUserBalanceAsync,
  setUserBalanceExactAsync,
} from './db';
import { getSupabase, isSupabaseConfigured } from './supabase';

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? path.join('/tmp', 'micro_apps') : path.join(process.cwd(), 'data', 'micro_apps');
const WALLETS_FILE = path.join(DATA_DIR, 'app_wallets.json');

const globalStore = globalThis as unknown as {
  __maxbazarWallets?: Record<string, number>;
};

if (!globalStore.__maxbazarWallets) {
  globalStore.__maxbazarWallets = {};
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
}

function getLocalWallets(): Record<string, number> {
  const mem = globalStore.__maxbazarWallets!;
  ensureDir();
  try {
    if (fs.existsSync(WALLETS_FILE)) {
      const disk = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf-8'));
      Object.assign(mem, disk);
    }
  } catch {}
  return mem;
}

function persistLocalWallets(wallets: Record<string, number>) {
  globalStore.__maxbazarWallets = wallets;
  ensureDir();
  try {
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2), 'utf-8');
  } catch {}
}

export function normalizeWalletIdentity(identity: string): string {
  return (identity || '').trim().replace(/^@/, '').toLowerCase();
}

/**
 * Reads known Telegram mapping from telegram_users.json
 */
function getTelegramChatIdForUser(identifier: string): string | null {
  const clean = normalizeWalletIdentity(identifier);
  if (/^\d{6,15}$/.test(clean)) return clean;

  const usersFile = path.join(DATA_DIR, 'telegram_users.json');
  try {
    if (fs.existsSync(usersFile)) {
      const mapping = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      if (mapping[clean]) return String(mapping[clean]);
    }
  } catch {}

  // Fallback check bundled data dir if on serverless
  if (IS_SERVERLESS) {
    try {
      const bundled = path.join(process.cwd(), 'data', 'micro_apps', 'telegram_users.json');
      if (fs.existsSync(bundled)) {
        const mapping = JSON.parse(fs.readFileSync(bundled, 'utf-8'));
        if (mapping[clean]) return String(mapping[clean]);
      }
    } catch {}
  }

  // Admin fallback
  const adminUser = (process.env.TELEGRAM_ADMIN_USERNAME || 'nasrulla0996').toLowerCase();
  const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493';
  if (clean === adminUser && adminChat) {
    return adminChat;
  }

  return null;
}

function syncLocalWalletCache(clean: string, finalBalance: number) {
  const wallets = getLocalWallets();
  wallets[`unified:${clean}`] = finalBalance;
  wallets[`pubg:${clean}`] = finalBalance;
  wallets[`honor-of-kings:${clean}`] = finalBalance;
  wallets[`mobile-legends:${clean}`] = finalBalance;
  wallets[clean] = finalBalance;
  persistLocalWallets(wallets);
}

/**
 * Resolves an identity (Telegram username, chat ID, phone, email, or nickname)
 * to an existing central UserRecord in db.ts (Supabase / local DB).
 * If the user does not exist yet, automatically creates one and carries over any legacy balance.
 */
export async function findOrCreateDbUserForIdentity(identity: string): Promise<UserRecord | null> {
  const clean = normalizeWalletIdentity(identity);
  if (!clean) return null;

  // 1. Direct email lookup
  if (clean.includes('@') && clean.includes('.')) {
    try {
      const byEmail = await getUserByEmailAsync(clean);
      if (byEmail) return byEmail;
    } catch {}
  }

  // 2. Telegram username lookup
  try {
    const byTgUser = await getUserByTelegramUsernameAsync(clean);
    if (byTgUser) return byTgUser;
  } catch {}

  // 3. Telegram Chat ID lookup (numeric)
  if (/^\d{6,15}$/.test(clean)) {
    try {
      const byTgChat = await getUserByTelegramChatIdAsync(clean);
      if (byTgChat) return byTgChat;
    } catch {}
  }

  // 4. Mapped Telegram Chat ID
  const mappedChatId = getTelegramChatIdForUser(clean);
  if (mappedChatId && mappedChatId !== clean) {
    try {
      const byMappedTg = await getUserByTelegramChatIdAsync(mappedChatId);
      if (byMappedTg) return byMappedTg;
    } catch {}
  }

  // 5. Synthetic micro-app email lookup
  try {
    const bySynthetic = await getUserByEmailAsync(`${clean}@maxbazar.user`);
    if (bySynthetic) return bySynthetic;
  } catch {}

  // 6. Broad search across all registered users for phone or name matches
  try {
    const allUsers = await getAllUsersAsync();
    const cleanPhone = clean.replace(/[\s\-\(\)]/g, '');
    const matched = allUsers.find((u) => {
      if (u.name && u.name.trim().toLowerCase() === clean) return true;
      if (u.telegramUsername && u.telegramUsername.trim().replace(/^@/, '').toLowerCase() === clean) return true;
      if (u.phone) {
        const uPhone = u.phone.replace(/[\s\-\(\)]/g, '');
        if (uPhone === cleanPhone || uPhone === '+' + cleanPhone || '+' + uPhone === cleanPhone) return true;
      }
      if (u.email && (u.email.toLowerCase() === clean || u.email.toLowerCase().startsWith(clean + '@'))) return true;
      return false;
    });
    if (matched) return matched;
  } catch (err: any) {
    console.warn('[findOrCreateDbUser broad search warn]:', err?.message);
  }

  // 7. User does NOT exist in central database yet!
  // Auto-create them in the unified database so their money is permanently saved and shared!
  try {
    const isEmail = clean.includes('@') && clean.includes('.');
    const isDigits = /^\d{6,15}$/.test(clean);
    const isPhone = /^\+?\d{8,15}$/.test(clean);

    const email = isEmail ? clean : `${clean}@maxbazar.user`;
    const name = clean;
    const phone = isPhone ? clean : undefined;
    const chatId = isDigits ? clean : (mappedChatId || undefined);
    const tgUsername = !isDigits && !isEmail ? clean : undefined;

    // Check if there was any legacy balance in app_wallets.json to carry over
    const localWallets = getLocalWallets();
    let legacyBal = 0;
    if (typeof localWallets[`unified:${clean}`] === 'number') {
      legacyBal = localWallets[`unified:${clean}`];
    } else if (typeof localWallets[`honor-of-kings:${clean}`] === 'number') {
      legacyBal = localWallets[`honor-of-kings:${clean}`];
    } else if (typeof localWallets[`pubg:${clean}`] === 'number') {
      legacyBal = localWallets[`pubg:${clean}`];
    } else if (typeof localWallets[clean] === 'number') {
      legacyBal = localWallets[clean];
    }

    const newUser = await createUserAsync({
      name,
      email,
      phone,
      telegramChatId: chatId,
      telegramUsername: tgUsername,
      balance: Math.max(0, Number(legacyBal.toFixed(2))),
      role: 'user',
    });

    return newUser;
  } catch (createErr: any) {
    console.error('[Auto-create unified user error]:', createErr);
    return null;
  }
}

/**
 * Synchronous balance lookup from local memory/disk with legacy key aggregation.
 */
export function getUnifiedWalletBalanceSync(identity: string): number {
  const clean = normalizeWalletIdentity(identity);
  if (!clean) return 0.00;

  const wallets = getLocalWallets();
  const unifiedKey = `unified:${clean}`;

  if (typeof wallets[unifiedKey] === 'number') {
    return Number(wallets[unifiedKey].toFixed(2));
  }

  // Aggregate any legacy app-isolated balances into the unified wallet
  let legacySum = 0;
  if (typeof wallets[`pubg:${clean}`] === 'number') {
    legacySum += wallets[`pubg:${clean}`];
  }
  if (typeof wallets[`honor-of-kings:${clean}`] === 'number') {
    legacySum += wallets[`honor-of-kings:${clean}`];
  }
  if (typeof wallets[`mobile-legends:${clean}`] === 'number') {
    legacySum += wallets[`mobile-legends:${clean}`];
  }
  if (typeof wallets[clean] === 'number') {
    legacySum = Math.max(legacySum, wallets[clean]);
  }

  const finalBalance = Math.max(0, Number(legacySum.toFixed(2)));
  syncLocalWalletCache(clean, finalBalance);
  return finalBalance;
}

/**
 * Asynchronous balance lookup: Retrieves customer balance directly from the central database (db.ts / Supabase).
 * Auto-creates the user record if new, guaranteeing balance persistence across all restarts.
 */
export async function getUnifiedWalletBalance(identity: string): Promise<number> {
  const clean = normalizeWalletIdentity(identity);
  if (!clean) return 0.00;

  // 1. Look up or auto-register user in central database
  try {
    const dbUser = await findOrCreateDbUserForIdentity(clean);
    if (dbUser) {
      const liveBal = Number((dbUser.balance || 0).toFixed(2));
      syncLocalWalletCache(clean, liveBal);
      return liveBal;
    }
  } catch (err: any) {
    console.warn('[getUnifiedWalletBalance DB warn]:', err?.message);
  }

  // 2. Fall back to local memory/disk if DB temporarily unreachable
  return getUnifiedWalletBalanceSync(clean);
}

/**
 * Sets the unified wallet balance across central database and local cache.
 */
export async function setUnifiedWalletBalance(identity: string, balance: number): Promise<number> {
  const clean = normalizeWalletIdentity(identity);
  if (!clean) return 0.00;

  const finalBalance = Math.max(0, Number(balance.toFixed(2)));

  try {
    const dbUser = await findOrCreateDbUserForIdentity(clean);
    if (dbUser) {
      await setUserBalanceExactAsync(dbUser.id, finalBalance);
    }
  } catch (err: any) {
    console.warn('[setUnifiedWalletBalance DB warn]:', err?.message);
  }

  syncLocalWalletCache(clean, finalBalance);
  return finalBalance;
}

/**
 * Deducts balance atomically from the central user database.
 * Fails if insufficient funds.
 */
export async function deductUnifiedWalletBalance(
  identity: string,
  amount: number
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const clean = normalizeWalletIdentity(identity);
  if (!clean) return { success: false, newBalance: 0, error: 'ئىشلەتكۈچى كىملىكى يوق' };

  const cost = Number(amount);
  if (isNaN(cost) || cost <= 0) {
    return { success: false, newBalance: await getUnifiedWalletBalance(clean), error: 'باھا خاتا' };
  }

  try {
    const dbUser = await findOrCreateDbUserForIdentity(clean);
    if (!dbUser) {
      return { success: false, newBalance: 0, error: 'ئىشلەتكۈچى ھېساباتى تېپىلمىدى' };
    }

    if (dbUser.balance < cost) {
      return {
        success: false,
        newBalance: dbUser.balance,
        error: `قالدۇق پۇلىڭىز يەتمىدى! قالدۇقىڭىز: $${dbUser.balance.toFixed(2)}، تەلەپ قىلىنغىنى: $${cost.toFixed(2)}`,
      };
    }

    const updated = await adjustUserBalanceAsync(dbUser.id, -cost);
    const newBal = updated ? updated.balance : Math.max(0, Number((dbUser.balance - cost).toFixed(2)));
    syncLocalWalletCache(clean, newBal);
    return { success: true, newBalance: newBal };
  } catch (err: any) {
    console.error('[deductUnifiedWalletBalance DB error]:', err);
    // Fallback local memory/disk deduction
    const cur = getUnifiedWalletBalanceSync(clean);
    if (cur < cost) {
      return {
        success: false,
        newBalance: cur,
        error: `قالدۇق پۇلىڭىز يەتمىدى! قالدۇقىڭىز: $${cur.toFixed(2)}، تەلەپ قىلىنغىنى: $${cost.toFixed(2)}`,
      };
    }
    const newBal = Math.max(0, Number((cur - cost).toFixed(2)));
    syncLocalWalletCache(clean, newBal);
    return { success: true, newBalance: newBal };
  }
}

/**
 * Credits balance (topup, refund, talon redemption) to central user database.
 */
export async function creditUnifiedWalletBalance(
  identity: string,
  amount: number
): Promise<{ success: boolean; newBalance: number }> {
  const clean = normalizeWalletIdentity(identity);
  if (!clean) return { success: false, newBalance: 0 };

  const add = Number(amount);
  if (isNaN(add) || add <= 0) {
    return { success: false, newBalance: await getUnifiedWalletBalance(clean) };
  }

  try {
    const dbUser = await findOrCreateDbUserForIdentity(clean);
    if (dbUser) {
      const updated = await adjustUserBalanceAsync(dbUser.id, add);
      const newBal = updated ? updated.balance : Number((dbUser.balance + add).toFixed(2));
      syncLocalWalletCache(clean, newBal);
      return { success: true, newBalance: newBal };
    }
  } catch (err: any) {
    console.error('[creditUnifiedWalletBalance DB error]:', err);
  }

  // Fallback local memory/disk
  const cur = getUnifiedWalletBalanceSync(clean);
  const newBal = Number((cur + add).toFixed(2));
  syncLocalWalletCache(clean, newBal);
  return { success: true, newBalance: newBal };
}

/**
 * Synchronizes order status into micro_apps/orders.json file atomically
 */
export function updateMicroAppOrderSync(orderId: string, status: string, completedAt?: string) {
  try {
    ensureDir();
    const filePath = path.join(DATA_DIR, 'orders.json');
    if (fs.existsSync(filePath)) {
      const orders = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(orders)) {
        let changed = false;
        for (const o of orders) {
          if (o && (o.order_id === orderId || o.id === orderId)) {
            o.status = status;
            if (completedAt) o.completed_at = completedAt;
            changed = true;
          }
        }
        if (changed) {
          fs.writeFileSync(filePath, JSON.stringify(orders.slice(0, 500), null, 2), 'utf-8');
        }
      }
    }
  } catch {}
}
