import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getOrderByIdAsync, getAllOrdersAsync, getInFlightProviderOrdersAsync } from '@/lib/db';
import { pollProviderOrders } from '@/lib/provider/orderPoller';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Asks the provider for in-flight orders' status now, ignoring the polling backoff. */
export async function POST(req: Request) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    let targetIds: string[] = [];
    if (Array.isArray(body.orderIds) && body.orderIds.length > 0) {
      targetIds = body.orderIds.filter((id: unknown) => typeof id === 'string');
    } else if (typeof body.orderId === 'string' && body.orderId.trim()) {
      targetIds = [body.orderId.trim()];
    } else {
      const inFlight = await getInFlightProviderOrdersAsync(20).catch(() => []);
      targetIds = inFlight.map((o) => o.id);
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ success: true, message: 'تەكشۈرىدىغان چالا زاكاز يوق', orders: await getAllOrdersAsync() });
    }

    const summary = await pollProviderOrders({
      deadlineMs: Date.now() + 25_000,
      orderIds: targetIds,
      force: true,
    });

    const updatedTarget = targetIds.length === 1 ? await getOrderByIdAsync(targetIds[0]) : undefined;
    if (updatedTarget && updatedTarget.status === 'completed' && !updatedTarget.details?.channelBroadcasted) {
      try {
        const { postOrderCompletedToChannel } = await import('@/lib/telegram');
        await postOrderCompletedToChannel({
          id: updatedTarget.id,
          serviceName: updatedTarget.serviceName,
          packageTitle: updatedTarget.packageTitle,
          amount: updatedTarget.amount,
          targetAccount: (updatedTarget as any).targetAccount || updatedTarget.details?.targetAccount || updatedTarget.details?.playerId,
          userName: (updatedTarget as any).userName,
          userEmail: updatedTarget.userEmail,
          details: updatedTarget.details,
          force: true,
        });
      } catch (bcErr: any) {
        console.warn('[Recheck] Channel broadcast error:', bcErr?.message);
      }
    }

    const allOrders = await getAllOrdersAsync();
    return NextResponse.json({
      success: true,
      summary,
      orders: allOrders,
      order: updatedTarget,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'تەكشۈرۈش مەغلۇپ بولدى' }, { status: 500 });
  }
}
