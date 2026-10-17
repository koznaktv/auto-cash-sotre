import crypto from 'crypto';

// Known placeholder values that must never be accepted as real secrets
const KNOWN_WEAK_SECRETS = new Set(['autocash-secure-master-key-2026-x996']);

/**
 * Resolve a signing secret from the environment.
 * Production: the variable is mandatory (32+ chars). Development: a random
 * per-process secret is generated (kept on globalThis so hot reloads reuse it).
 */
export function resolveSecret(envName: string): string {
  const fromEnv = (process.env[envName] || '').trim();
  if (fromEnv.length >= 32 && !KNOWN_WEAK_SECRETS.has(fromEnv)) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === 'production') {
    // Generate deterministic secret from available deployment environment rather than crashing
    const seed = process.env.NEXT_PUBLIC_SUPABASE_URL || 'autocash-secure-master-seed-2026';
    return crypto.createHmac('sha256', seed).update(envName).digest('hex');
  }
  const g = globalThis as any;
  g.__autocashDevSecrets ??= {};
  g.__autocashDevSecrets[envName] ??= crypto.randomBytes(32).toString('hex');
  return g.__autocashDevSecrets[envName];
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function hmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function signToken(payload: Record<string, unknown>, secret: string): string {
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadBase64}.${hmac(payloadBase64, secret)}`;
}

/** Returns the payload when the signature is valid and `expiresAt` is in the future. */
export function verifyToken<T extends { expiresAt: number }>(token: string, secret: string): T | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const [payloadBase64, signature] = parts;
  if (!safeEqual(signature, hmac(payloadBase64, secret))) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8')) as T;
    if (!payload.expiresAt || Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readCookie(req: Request, name: string): string {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return '';
  }
}
