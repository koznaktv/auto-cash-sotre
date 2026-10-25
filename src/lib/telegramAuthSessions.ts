import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getSupabase } from './supabase';
import { getBotToken } from './telegram';
import { getOrCreateTelegramUser } from './telegramShop';
import { getUserByIdAsync, UserRecord } from './db';

interface TelegramLoginSession {
  token: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  userId?: string;
  createdAt: number;
  expiresAt: number;
}

const MEMORY_SESSIONS = new Map<string, TelegramLoginSession>();
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'tg_login_sessions.json');

function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
}

function loadLocalSessions(): Map<string, TelegramLoginSession> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        const map = new Map<string, TelegramLoginSession>();
        const now = Date.now();
        for (const item of data) {
          if (item && item.token && item.expiresAt > now) {
            map.set(item.token, item);
          }
        }
        return map;
      }
    }
  } catch {}
  return new Map();
}

function saveLocalSessions(map: Map<string, TelegramLoginSession>) {
  try {
    ensureDataDir();
    const arr = Array.from(map.values()).filter((s) => s.expiresAt > Date.now());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch {}
}

/**
 * Creates a new short-lived Telegram Login Session (valid for 5 minutes).
 */
export async function createTelegramLoginSessionAsync(): Promise<{ token: string; botUrl: string }> {
  const token = crypto.randomBytes(12).toString('hex');
  const now = Date.now();
  const session: TelegramLoginSession = {
    token,
    status: 'pending',
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000,
  };

  MEMORY_SESSIONS.set(token, session);
  const localMap = loadLocalSessions();
  localMap.set(token, session);
  saveLocalSessions(localMap);

  // Sync to Supabase for multi-instance / serverless support
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('system_settings').upsert({
        id: `tg_auth_${token}`,
        site_name: JSON.stringify(session),
        admin_pin: 'AUTH_SESSION',
        shamcash_address: 'META',
        whatsapp_number: 'META',
        telegram_username: 'META',
      });
    } catch (e: any) {
      console.warn('[Telegram Auth Session] Supabase write notice:', e?.message);
    }
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'Autocash_24_bot';
  const botUrl = `https://t.me/${botUsername}?start=auth_${token}`;

  return { token, botUrl };
}

/**
 * Approves a Telegram Login Session when user hits /start auth_<token> in Telegram.
 */
export async function approveTelegramLoginSessionAsync(
  token: string,
  userId: string
): Promise<{ success: boolean; session?: TelegramLoginSession }> {
  const cleanToken = token.trim();
  let session = MEMORY_SESSIONS.get(cleanToken);

  if (!session) {
    const localMap = loadLocalSessions();
    session = localMap.get(cleanToken);
  }

  const sb = getSupabase();
  if (!session && sb) {
    try {
      const { data } = await sb
        .from('system_settings')
        .select('site_name')
        .eq('id', `tg_auth_${cleanToken}`)
        .single();
      if (data?.site_name) {
        session = JSON.parse(data.site_name);
      }
    } catch {}
  }

  if (!session) {
    // If session wasn't found before, create it directly as approved
    session = {
      token: cleanToken,
      status: 'approved',
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  } else {
    session.status = 'approved';
    session.userId = userId;
  }

  MEMORY_SESSIONS.set(cleanToken, session);
  const localMap = loadLocalSessions();
  localMap.set(cleanToken, session);
  saveLocalSessions(localMap);

  if (sb) {
    try {
      await sb.from('system_settings').upsert({
        id: `tg_auth_${cleanToken}`,
        site_name: JSON.stringify(session),
        admin_pin: 'AUTH_SESSION',
        shamcash_address: 'META',
        whatsapp_number: 'META',
        telegram_username: 'META',
      });
    } catch {}
  }

  return { success: true, session };
}

/**
 * Checks the status of a Telegram Login Session.
 */
export async function checkTelegramLoginSessionAsync(
  token: string
): Promise<{ approved: boolean; userId?: string; status: string }> {
  const cleanToken = token.trim();
  let session = MEMORY_SESSIONS.get(cleanToken);

  if (!session) {
    const localMap = loadLocalSessions();
    session = localMap.get(cleanToken);
  }

  const sb = getSupabase();
  if (!session && sb) {
    try {
      const { data } = await sb
        .from('system_settings')
        .select('site_name')
        .eq('id', `tg_auth_${cleanToken}`)
        .single();
      if (data?.site_name) {
        session = JSON.parse(data.site_name);
      }
    } catch {}
  }

  if (!session) {
    return { approved: false, status: 'not_found' };
  }

  if (session.expiresAt <= Date.now()) {
    return { approved: false, status: 'expired' };
  }

  if (session.status === 'approved' && session.userId) {
    return { approved: true, userId: session.userId, status: 'approved' };
  }

  return { approved: false, status: session.status || 'pending' };
}

/**
 * Validates Telegram WebApp initData cryptographically using HMAC-SHA256.
 * Returns parsed Telegram user if authentic, or null if tampered/invalid.
 */
export function verifyTelegramWebAppData(
  initData: string
): { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string } | null {
  if (!initData) return null;
  const botToken = getBotToken();
  if (!botToken) return null;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');
    const sorted = Array.from(params.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(sorted).digest('hex');

    if (computedHash.length !== hash.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash))) {
      return null;
    }

    const userRaw = params.get('user');
    if (!userRaw) return null;

    return JSON.parse(userRaw);
  } catch (err) {
    console.error('[verifyTelegramWebAppData] Error:', err);
    return null;
  }
}
