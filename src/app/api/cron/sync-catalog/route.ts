import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { runCatalogSync } from '@/lib/catalog/sync';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`
export async function GET(req: Request) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const result = await runCatalogSync({ trigger: 'cron' });
  return NextResponse.json({ success: result.ok, ...result }, { status: result.ok || result.skipped ? 200 : 502 });
}
