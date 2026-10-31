/**
 * 24/7 Server Keep-Alive & Crash Prevention Guard for AUTO CASH
 *
 * 1. Prevents unexpected unhandled exceptions / promise rejections from crashing the server
 * 2. Self-ping heartbeat loop prevents Render free tier from sleeping (15-minute spin-down)
 * 3. Keeps database connection and API tokens fresh
 */

let isInitialized = false;
let keepAliveTimer: NodeJS.Timeout | null = null;

export function initServerKeepAlive(): void {
  if (isInitialized) return;
  isInitialized = true;

  // 1. Process-level crash prevention guards
  if (typeof process !== 'undefined') {
    process.on('uncaughtException', (err: any) => {
      console.error('[CRASH GUARD] Caught uncaughtException (server kept alive):', err?.message || err);
      if (err?.stack) console.error(err.stack);
    });

    process.on('unhandledRejection', (reason: any) => {
      console.error('[CRASH GUARD] Caught unhandledRejection (server kept alive):', reason?.message || reason);
    });
  }

  // 2. Self-ping heartbeat interval (every 8 minutes) to prevent Render inactivity spin-down
  const isServer = typeof window === 'undefined';
  if (isServer && !keepAliveTimer) {
    const PING_INTERVAL_MS = 8 * 60 * 1000; // 8 minutes

    keepAliveTimer = setInterval(async () => {
      try {
        const siteUrl = (
          process.env.NEXT_PUBLIC_SITE_URL ||
          (process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL}` : '') ||
          'https://www.auto-cash.app'
        ).replace(/\/+$/, '');

        if (siteUrl && !siteUrl.includes('localhost')) {
          const pingUrl = `${siteUrl}/api/health?internal=1`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(pingUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'AutoCash-KeepAlive-Heartbeat/2.0' },
            signal: controller.signal,
            cache: 'no-store',
          }).catch(() => null);

          clearTimeout(timeout);
          if (res && res.ok) {
            // Heartbeat successful
          }
        }
      } catch (err: any) {
        console.warn('[KeepAlive Heartbeat Ping Warning]:', err?.message);
      }
    }, PING_INTERVAL_MS);

    // Ensure timer doesn't prevent graceful shutdown
    if (keepAliveTimer.unref) {
      keepAliveTimer.unref();
    }

    // 3. Automated Exchange Rate Check (twice daily: every 12 hours)
    const TWICE_DAILY_MS = 12 * 60 * 60 * 1000;
    const rateTimer = setInterval(async () => {
      try {
        const { runScheduledRateCheck } = await import('./exchangeRateService');
        await runScheduledRateCheck(false);
      } catch (err: any) {
        console.warn('[KeepAlive Rate Check Warning]:', err?.message);
      }
    }, TWICE_DAILY_MS);

    if (rateTimer.unref) {
      rateTimer.unref();
    }
  }
}

// Auto-run initialization when this module is imported
initServerKeepAlive();
