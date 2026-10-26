import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { pollProviderOrders } from '@/lib/provider/orderPoller';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Called by Vercel Cron or an external 24/7 ping (Cron-Job.org, UptimeRobot, etc.)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const isPublicPing = url.searchParams.get('ping') === '1' || url.searchParams.get('auto') === '1';

  if (!isPublicPing && !verifyCronRequest(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await pollProviderOrders({
      deadlineMs: Date.now() + 45_000,
      limit: 50,
      housekeeping: true,
    });
    return NextResponse.json({ success: true, summary, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'poll failed' }, { status: 500 });
  }
}
