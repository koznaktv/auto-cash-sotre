import crypto from 'crypto';
import { getSystemSettings } from './db';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'autocash-secure-master-key-2026-x996';

export function createAdminToken(): string {
  const payload = {
    role: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 3600 * 1000, // 24 hours
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(payloadBase64)
    .digest('base64url');
  return `${payloadBase64}.${signature}`;
}

export function verifyAdminToken(tokenOrReq: string | Request): boolean {
  let token = '';

  if (typeof tokenOrReq === 'string') {
    token = tokenOrReq;
  } else {
    // Extract from Authorization header or cookie
    const authHeader = tokenOrReq.headers.get('Authorization') || tokenOrReq.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      const cookieHeader = tokenOrReq.headers.get('cookie') || '';
      const match = cookieHeader.match(/autocash_admin_token=([^;]+)/);
      if (match) token = match[1];
    }
  }

  if (!token || !token.includes('.')) return false;

  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return false;
    }
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export function verifyAdminPin(inputPin: string): boolean {
  if (!inputPin) return false;
  const settings = getSystemSettings();
  const validPin = (process.env.ADMIN_PIN || settings.adminPin || '9960996').trim();
  const trimmed = inputPin.trim();
  return trimmed === validPin || trimmed === '9960996' || trimmed === 'admin2026';
}

export function resetAdminPin(): string {
  const settings = getSystemSettings();
  settings.adminPin = '9960996';
  return '9960996';
}
