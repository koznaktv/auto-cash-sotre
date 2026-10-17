import { safeEqual } from './signedToken';

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically; Supabase pg_cron / external
 * schedulers must send the same header. Without CRON_SECRET configured, cron endpoints are closed.
 */
export function verifyCronRequest(req: Request): boolean {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (secret.length < 16) return false;
  const header = req.headers.get('authorization') || '';
  return safeEqual(header, `Bearer ${secret}`);
}
