import { getSystemSettingsAsync } from './db';
import { readCookie, resolveSecret, safeEqual, signToken, verifyToken } from './signedToken';

// The PIN shipped in the public source / schema seed: never accepted in production
export const PUBLIC_DEFAULT_PIN = '9960996';

const MAX_FAILED_ATTEMPTS = 5;
// X-Forwarded-For can be spoofed, so also cap failures across all clients
const MAX_GLOBAL_FAILED_ATTEMPTS = 50;
const MAX_TRACKED_IPS = 10_000;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; firstAt: number }>();
let globalFailures = { count: 0, firstAt: 0 };

export function createAdminToken(): string {
  return signToken(
    {
      role: 'admin',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 3600 * 1000, // 24 hours
    },
    resolveSecret('ADMIN_SECRET')
  );
}

export function verifyAdminToken(tokenOrReq: string | Request): boolean {
  let token = '';

  if (typeof tokenOrReq === 'string') {
    token = tokenOrReq;
  } else {
    // Extract from Authorization header or cookie
    const authHeader = tokenOrReq.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = readCookie(tokenOrReq, 'autocash_admin_token');
    }
  }

  const payload = verifyToken<{ role: string; expiresAt: number }>(token, resolveSecret('ADMIN_SECRET'));
  return payload?.role === 'admin';
}

/**
 * Admin check that only accepts an explicit Authorization header (not the cookie), for
 * endpoints shared with regular users, so an admin's cookie doesn't change what user pages see.
 */
export function hasAdminBearer(req: Request): boolean {
  const authHeader = req.headers.get('authorization') || '';
  return authHeader.startsWith('Bearer ') && verifyAdminToken(authHeader.substring(7).trim());
}

export function getClientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
}

export function isAdminLoginLocked(ip: string): boolean {
  if (Date.now() - globalFailures.firstAt > LOCKOUT_WINDOW_MS) {
    globalFailures = { count: 0, firstAt: 0 };
  } else if (globalFailures.count >= MAX_GLOBAL_FAILED_ATTEMPTS) {
    return true;
  }
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

export function recordAdminLoginFailure(ip: string): void {
  if (!globalFailures.firstAt || Date.now() - globalFailures.firstAt > LOCKOUT_WINDOW_MS) {
    globalFailures = { count: 1, firstAt: Date.now() };
  } else {
    globalFailures.count += 1;
  }
  if (failedAttempts.size >= MAX_TRACKED_IPS) {
    // Drop expired entries; if still full, start over rather than grow without bound
    failedAttempts.forEach((value, key) => {
      if (Date.now() - value.firstAt > LOCKOUT_WINDOW_MS) failedAttempts.delete(key);
    });
    if (failedAttempts.size >= MAX_TRACKED_IPS) failedAttempts.clear();
  }
  const entry = failedAttempts.get(ip);
  if (!entry || Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearAdminLoginFailures(ip: string): void {
  failedAttempts.delete(ip);
}

export async function verifyAdminPin(inputPin: string): Promise<boolean> {
  if (!inputPin) return false;
  const trimmed = inputPin.trim();

  let settingsPin = '';
  try {
    const settings = await getSystemSettingsAsync();
    settingsPin = (settings.adminPin || '').trim();
  } catch (err) {
    console.warn('Could not read adminPin from system_settings, checking ADMIN_PIN env:', err);
  }

  const envPin = (process.env.ADMIN_PIN || '').trim();

  // 1. Check if input matches ADMIN_PIN from environment variables
  if (envPin && safeEqual(trimmed, envPin)) {
    return true;
  }

  // 2. Check if input matches adminPin from Supabase database (provided it is not the public default)
  if (settingsPin && settingsPin !== PUBLIC_DEFAULT_PIN && safeEqual(trimmed, settingsPin)) {
    return true;
  }

  // 3. Fallback: if no custom PIN was ever set, check if env matches input
  if (!envPin && !settingsPin && process.env.NODE_ENV !== 'production') {
    return safeEqual(trimmed, PUBLIC_DEFAULT_PIN);
  }

  return false;
}
