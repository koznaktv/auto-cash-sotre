import { NextResponse } from 'next/server';
import { initServerKeepAlive } from '@/lib/serverKeepAlive';
import { getSystemSettingsAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Ensure background keep-alive and crash guards are active
  initServerKeepAlive();

  const url = new URL(req.url);
  const isInternal = url.searchParams.get('internal') === '1';

  let dbOk = false;
  try {
    const settings = await getSystemSettingsAsync();
    if (settings && settings.adminPin) {
      dbOk = true;
    }
  } catch {
    dbOk = false;
  }

  const uptimeSeconds = typeof process !== 'undefined' && typeof process.uptime === 'function'
    ? Math.floor(process.uptime())
    : 0;

  const responseData = {
    status: 'healthy',
    message: 'AUTO CASH Server 24/7 Active',
    dbConnected: dbOk,
    uptimeSeconds,
    uptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
    timestamp: new Date().toISOString(),
    isInternalHeartbeat: isInternal,
  };

  return NextResponse.json(responseData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'X-Server-KeepAlive': 'active',
    },
  });
}
