import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { runCatalogSync } from '@/lib/catalog/sync';
import { runProviderAutoMonitor } from '@/lib/providerMonitorService';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`
export async function GET(req: Request) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // 1. Run live real-time price & stock availability monitor
  const monitorRes = await runProviderAutoMonitor({ notifyAdmin: true });

  // 2. Also run underlying catalog hierarchy sync
  const result: any = await runCatalogSync({ trigger: 'cron' }).catch((e) => ({ ok: false, error: e?.message }));

  return NextResponse.json({
    success: monitorRes.success || result?.ok,
    monitor: monitorRes,
    catalog: result,
  });
}
