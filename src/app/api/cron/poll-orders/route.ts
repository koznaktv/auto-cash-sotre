import { NextResponse } from 'next/server';
import '@/lib/serverKeepAlive';
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

    // Also follow-up in-flight SMS activations
    try {
      const { getInFlightProviderOrdersAsync, updateOrderAsync } = await import('@/lib/db');
      const { phonecashProvider } = await import('@/lib/providers/phonecashProvider');
      const { postOrderCompletedToChannel } = await import('@/lib/telegram');
      const inFlightOrders = await getInFlightProviderOrdersAsync(20).catch(() => []);
      const smsOrders = inFlightOrders.filter((o) => o.details?.isSmsActivation && o.details?.activationId);

      for (const order of smsOrders) {
        const activationId = order.details?.activationId;
        if (!activationId) continue;

        const check = await phonecashProvider.checkStatus(activationId, 1);
        if (check.status === 'RECEIVED' && check.code) {
          await updateOrderAsync(order.id, {
            status: 'completed',
            detailsPatch: { code: check.code, completedAt: new Date().toISOString() },
          });
          phonecashProvider.finishActivation(activationId).catch(() => null);
          postOrderCompletedToChannel({
            id: order.id,
            serviceName: order.serviceName,
            packageTitle: order.packageTitle,
            amount: order.amount,
            targetAccount: order.targetAccount,
            userEmail: order.userEmail,
          }).catch(() => null);
        }
      }
    } catch (smsErr: any) {
      console.warn('[Cron SMS Poll]:', smsErr?.message);
    }

    return NextResponse.json({ success: true, summary, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'poll failed' }, { status: 500 });
  }
}
