import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { runCatalogSync } from '@/lib/catalog/sync';
import { runProviderAutoMonitor } from '@/lib/providerMonitorService';
import { runScheduledRateCheck } from '@/lib/exchangeRateService';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`
export async function GET(req: Request) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // 1. Run live real-time price & stock availability monitor (silent background sync, no unsolicited alerts)
  const monitorRes = await runProviderAutoMonitor({ notifyAdmin: false }).catch((e) => ({ success: false, error: e?.message }));

  // 2. Run scheduled twice-daily exchange rate check
  const rateRes = await runScheduledRateCheck(false).catch((e) => ({ success: false, error: e?.message }));

  // 3. Also run underlying catalog hierarchy sync
  const result: any = await runCatalogSync({ trigger: 'cron' }).catch((e) => ({ ok: false, error: e?.message }));

  return NextResponse.json({
    success: (monitorRes as any)?.success || result?.ok || (rateRes as any)?.success,
    monitor: monitorRes,
    exchangeRate: rateRes,
    catalog: result,
  });
}
