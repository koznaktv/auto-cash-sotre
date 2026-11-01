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
          await postOrderCompletedToChannel({
            id: order.id,
            serviceName: order.serviceName,
            packageTitle: order.packageTitle,
            amount: order.amount,
            targetAccount: order.targetAccount,
            userEmail: order.userEmail,
            details: order.details,
          }).catch(() => null);
        }
      }
    } catch (smsErr: any) {
      console.warn('[Cron SMS Poll]:', smsErr?.message);
    }

    // Catch-up: ensure any recently completed orders from the last 3 hours that missed channel broadcast get posted immediately
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      if (sb) {
        const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
        const { data: missedOrders } = await sb
          .from('orders')
          .select('*')
          .eq('status', 'completed')
          .gte('created_at', threeHoursAgo)
          .limit(20);

        if (Array.isArray(missedOrders)) {
          const { postOrderCompletedToChannel } = await import('@/lib/telegram');
          for (const ord of missedOrders) {
            if (!ord.details?.channelBroadcasted) {
              await postOrderCompletedToChannel({
                id: ord.id,
                serviceName: ord.service_name || ord.serviceName,
                packageTitle: ord.package_title || ord.packageTitle,
                amount: ord.amount,
                targetAccount: ord.target_account || ord.targetAccount || ord.details?.targetAccount || ord.details?.playerId,
                userName: ord.user_name || ord.userName,
                userEmail: ord.user_email || ord.userEmail,
                details: ord.details,
              }).catch(() => {});
            }
          }
        }
      }
    } catch (catchUpErr: any) {
      console.warn('[Cron Missed Broadcast Notice]:', catchUpErr?.message);
    }

    return NextResponse.json({ success: true, summary, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'poll failed' }, { status: 500 });
  }
}
