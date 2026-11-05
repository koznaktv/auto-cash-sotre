import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getSupabase, isSupabaseConfigured } from './supabase';

export interface SyncSessionData {
  token: string;
  appId: string;
  status: 'pending' | 'verified' | 'expired';
  createdAt: number;
  expiresAt: number;
  verifiedUser?: {
    token: string;
    identity: string;
    app_id: string;
    balance: number;
    currency: string;
    photo_url: string | null;
    telegram_id?: string;
    logged_in_at: number;
  };
}

const globalStore = globalThis as unknown as {
  __maxbazarSyncSessions?: Map<string, SyncSessionData>;
  __maxbazarWallets?: Record<string, number>;
};

if (!globalStore.__maxbazarSyncSessions) {
  globalStore.__maxbazarSyncSessions = new Map<string, SyncSessionData>();
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const SESSIONS_DIR = IS_SERVERLESS ? path.join('/tmp', 'micro_apps') : path.join(process.cwd(), 'data', 'micro_apps');

function ensureDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    try {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    } catch {}
  }
}

function getLocalSyncMap(): Map<string, SyncSessionData> {
  const map = globalStore.__maxbazarSyncSessions!;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'sync_sessions.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const now = Date.now();
      for (const [k, v] of Object.entries(data)) {
        if ((v as SyncSessionData).expiresAt > now) {
          map.set(k, v as SyncSessionData);
        }
      }
    }
  } catch {}
  return map;
}

function saveLocalSyncMap(map: Map<string, SyncSessionData>) {
  globalStore.__maxbazarSyncSessions = map;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'sync_sessions.json');
  try {
    const obj: Record<string, SyncSessionData> = {};
    const now = Date.now();
    map.forEach((v, k) => {
      if (v.expiresAt > now) obj[k] = v;
    });
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {}
}

function getAppWallets(): Record<string, number> {
  if (!globalStore.__maxbazarWallets) globalStore.__maxbazarWallets = {};
  const mem = globalStore.__maxbazarWallets;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_wallets.json');
  try {
    if (fs.existsSync(filePath)) {
      const disk = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      Object.assign(mem, disk);
    }
  } catch {}
  return mem;
}

function saveAppWallet(key: string, balance: number) {
  const wallets = getAppWallets();
  wallets[key] = Math.max(0, Number(balance.toFixed(2)));
  globalStore.__maxbazarWallets = wallets;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_wallets.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2), 'utf-8');
  } catch {}
}

export async function createSyncSession(appId: string = 'pubg'): Promise<{ token: string; botUrl: string }> {
  const rand = crypto.randomBytes(4).toString('hex');
  const token = `sync_${rand}`;
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  const sessionData: SyncSessionData = {
    token,
    appId,
    status: 'pending',
    createdAt: now,
    expiresAt,
  };

  // 1. Save in-memory and local disk
  const map = getLocalSyncMap();
  map.set(token, sessionData);
  saveLocalSyncMap(map);

  // 2. Save in Supabase for cross-serverless resilience
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('system_settings').upsert({
          id: `tg_${token}`,
          site_name: JSON.stringify(sessionData),
          admin_pin: 'SYNC_SESSION',
          shamcash_address: 'SYNC',
          whatsapp_number: 'SYNC',
          telegram_username: 'SYNC',
        });
      }
    } catch {}
  }

  const botUsername = 'maxbazar_bot';
  const botUrl = `https://t.me/${botUsername}?start=${token}`;
  return { token, botUrl };
}

export async function verifySyncSession(
  token: string,
  user: { username?: string; firstName?: string; chatId: string | number }
): Promise<SyncSessionData['verifiedUser']> {
  const map = getLocalSyncMap();
  let session = map.get(token);

  // Check Supabase if not in memory
  if (!session && isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb
          .from('system_settings')
          .select('site_name')
          .eq('id', `tg_${token}`)
          .maybeSingle();
        if (data?.site_name) {
          session = JSON.parse(data.site_name);
        }
      }
    } catch {}
  }

  const cleanIdentity = (user.username || user.firstName || String(user.chatId)).trim().replace(/@/g, '');
  const appId = session?.appId || 'pubg';

  // Retrieve or initialize wallet
  const walletKey = `${appId}:${cleanIdentity.toLowerCase()}`;
  const wallets = getAppWallets();
  if (wallets[walletKey] === undefined) {
    wallets[walletKey] = 0.00;
    saveAppWallet(walletKey, 0.00);
  }

  const sessionToken = 'mb_app_' + crypto.randomBytes(16).toString('hex');
  const photo_url = user.chatId
    ? `/api/apps/avatar?user=${encodeURIComponent(String(user.chatId))}`
    : null;

  const verifiedUser: NonNullable<SyncSessionData['verifiedUser']> = {
    token: sessionToken,
    identity: cleanIdentity,
    app_id: appId,
    balance: wallets[walletKey],
    currency: 'USD',
    photo_url,
    telegram_id: String(user.chatId),
    logged_in_at: Date.now(),
  };

  const updatedSession: SyncSessionData = {
    token,
    appId,
    status: 'verified',
    createdAt: session?.createdAt || Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    verifiedUser,
  };

  // 1. Update in-memory & disk
  map.set(token, updatedSession);
  saveLocalSyncMap(map);

  // 2. Update Supabase
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('system_settings').upsert({
          id: `tg_${token}`,
          site_name: JSON.stringify(updatedSession),
          admin_pin: 'SYNC_SESSION',
          shamcash_address: 'SYNC',
          whatsapp_number: 'SYNC',
          telegram_username: 'SYNC',
        });
      }
    } catch {}
  }

  return verifiedUser;
}

export async function getSyncSession(token: string): Promise<SyncSessionData | null> {
  const map = getLocalSyncMap();
  let session = map.get(token);

  if (session && session.status === 'verified') {
    return session;
  }

  // Check Supabase
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb
          .from('system_settings')
          .select('site_name')
          .eq('id', `tg_${token}`)
          .maybeSingle();
        if (data?.site_name) {
          const parsed: SyncSessionData = JSON.parse(data.site_name);
          if (parsed && parsed.expiresAt > Date.now()) {
            map.set(token, parsed);
            return parsed;
          }
        }
      }
    } catch {}
  }

  if (session && session.expiresAt > Date.now()) {
    return session;
  }

  return null;
}
