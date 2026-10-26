import { safeEqual } from './signedToken';
import { verifyAdminToken } from './adminAuth';

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically;
 * Linux crontab / curl / external schedulers can send `Authorization: Bearer <CRON_SECRET>` or `?key=<CRON_SECRET>`.
 * Admin sessions are also accepted.
 */
export function verifyCronRequest(req: Request): boolean {
  if (verifyAdminToken(req)) return true;

  // Vercel Cron infrastructure sends User-Agent: vercel-cron/1.0
  const userAgent = (req.headers.get('user-agent') || '').toLowerCase();
  if (userAgent.includes('vercel-cron')) return true;

  const secret = (process.env.CRON_SECRET || '').trim();
  if (secret.length >= 8) {
    const header = req.headers.get('authorization') || '';
    if (safeEqual(header, `Bearer ${secret}`)) return true;

    try {
      const url = new URL(req.url);
      const queryKey = url.searchParams.get('key') || url.searchParams.get('secret');
      if (queryKey && safeEqual(queryKey, secret)) return true;
    } catch {}
  }

  // Allow in development mode if no secret is set
  if (process.env.NODE_ENV !== 'production' && !secret) {
    return true;
  }

  return false;
}
