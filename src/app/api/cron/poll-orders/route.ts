import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { pollProviderOrders } from '@/lib/provider/orderPoller';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Called by Vercel Cron (Pro) or Supabase pg_cron / an external scheduler with the CRON_SECRET header
export async function GET(req: Request) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const summary = await pollProviderOrders({ deadlineMs: Date.now() + 50_000, limit: 100, housekeeping: true });
    return NextResponse.json({ success: true, summary });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'poll failed' }, { status: 500 });
  }
}
