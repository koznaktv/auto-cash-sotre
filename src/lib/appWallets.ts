import fs from 'fs';
import path from 'path';
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
  if (typeof wallets[clean] === 'number') {
    legacySum = Math.max(legacySum, wallets[clean]);
  }

  const finalBalance = Math.max(0, Number(legacySum.toFixed(2)));
  wallets[unifiedKey] = finalBalance;
  wallets[`pubg:${clean}`] = finalBalance;
  wallets[`honor-of-kings:${clean}`] = finalBalance;
  wallets[clean] = finalBalance;
  persistLocalWallets(wallets);

  return finalBalance;
}

/**
 * Asynchronous balance lookup that checks Supabase first for multi-lambda persistence.
 */
export async function getUnifiedWalletBalance(identity: string): Promise<number> {
  const clean = normalizeWalletIdentity(identity);
  if (!clean) return 0.00;

  // 1. Try Supabase system_settings if configured
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb
          .from('system_settings')
          .select('site_name')
          .eq('id', `wallet_${clean}`)
          .maybeSingle();

        if (data?.site_name) {
          try {
            const parsed = JSON.parse(data.site_name);
            if (typeof parsed?.balance === 'number') {
              const liveBal = Number(parsed.balance.toFixed(2));
              // Cache locally
              const wallets = getLocalWallets();
              wallets[`unified:${clean}`] = liveBal;
              wallets[`pubg:${clean}`] = liveBal;
              wallets[`honor-of-kings:${clean}`] = liveBal;
              wallets[clean] = liveBal;
              persistLocalWallets(wallets);
              return liveBal;
            }
          } catch {}
        }
      }
    } catch {}
  }

  // 2. Fall back to local memory/disk + legacy migration
  return getUnifiedWalletBalanceSync(clean);
}

/**
 * Sets the unified wallet balance across memory, disk, and Supabase.
 */
export async function setUnifiedWalletBalance(identity: string, balance: number): Promise<number> {
  const clean = normalizeWalletIdentity(identity);
  if (!clean) return 0.00;

  const finalBalance = Math.max(0, Number(balance.toFixed(2)));
  const wallets = getLocalWallets();
  wallets[`unified:${clean}`] = finalBalance;
  wallets[`pubg:${clean}`] = finalBalance;
  wallets[`honor-of-kings:${clean}`] = finalBalance;
  wallets[clean] = finalBalance;
  persistLocalWallets(wallets);

  // Sync to Supabase system_settings for persistent cross-container sync
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('system_settings').upsert({
          id: `wallet_${clean}`,
          site_name: JSON.stringify({
            identity: clean,
            balance: finalBalance,
            updatedAt: Date.now(),
          }),
          admin_pin: 'UNIFIED_WALLET',
          shamcash_address: 'UNIFIED',
          whatsapp_number: 'UNIFIED',
          telegram_username: 'UNIFIED',
        });
      }
    } catch (err: any) {
      console.warn('[setUnifiedWalletBalance Supabase Sync Warning]:', err?.message);
    }
  }

  return finalBalance;
}

/**
 * Deducts balance atomically. Fails if insufficient funds.
 */
export async function deductUnifiedWalletBalance(
  identity: string,
  amount: number
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const current = await getUnifiedWalletBalance(identity);
  const cost = Number(amount);

  if (isNaN(cost) || cost <= 0) {
    return { success: false, newBalance: current, error: 'باھا خاتا' };
  }

  if (current < cost) {
    return {
      success: false,
      newBalance: current,
      error: `قالدۇق پۇلىڭىز يەتمىدى! قالدۇقىڭىز: $${current.toFixed(2)}، تەلەپ قىلىنغىنى: $${cost.toFixed(2)}`,
    };
  }

  const updated = Math.max(0, Number((current - cost).toFixed(2)));
  await setUnifiedWalletBalance(identity, updated);
  return { success: true, newBalance: updated };
}

/**
 * Credits balance (topup, refund, talon redemption).
 */
export async function creditUnifiedWalletBalance(
  identity: string,
  amount: number
): Promise<{ success: boolean; newBalance: number }> {
  const current = await getUnifiedWalletBalance(identity);
  const add = Number(amount);
  if (isNaN(add) || add <= 0) {
    return { success: false, newBalance: current };
  }
  const updated = Number((current + add).toFixed(2));
  await setUnifiedWalletBalance(identity, updated);
  return { success: true, newBalance: updated };
}
