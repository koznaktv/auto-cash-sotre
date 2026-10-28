import { NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import { getOrderByIdAsync, refundOrderBalanceAtomicAsync } from '@/lib/db';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json().catch(() => null);
    const { orderId, activationId, reason } = body || {};

    if (!orderId || !activationId) {
      return NextResponse.json(
        { success: false, message: 'زاكاز ياكى ئاكتىپلاش كودى كەم' },
        { status: 400 }
      );
    }

    const order = await getOrderByIdAsync(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'زاكاز تېپىلمىدى' }, { status: 404 });
    }

    if (order.userId !== user.id && user.role !== 'admin') {
      return unauthorizedResponse();
    }

    if (order.status === 'completed') {
      return NextResponse.json(
        { success: false, message: 'پۈتۈپ بولغان نومۇرنى بىكار قىلغىلى بولمايدۇ' },
        { status: 400 }
      );
    }

    if (order.status === 'refunded' || order.status === 'cancelled') {
      return NextResponse.json({ success: true, message: 'بۇ نومۇر ئاللىقاچان بىكار قىلىنغان' });
    }

    // 1. Cancel on PhoneCash provider
    await phonecashProvider.cancelActivation(activationId).catch((err) => {
      console.warn('[PhoneCash Cancel Notice]:', err?.message);
    });

    // 2. Atomically refund the order balance back to user's wallet
    const refundRes = await refundOrderBalanceAtomicAsync(
      orderId,
      reason || 'خېرىدار SMS كەلمىگەنلىكى ئۈچۈن بىكار قىلدى',
      true
    );

    if (!refundRes.success) {
      return NextResponse.json(
        { success: false, message: refundRes.message || 'پۇل قايتۇرۇشتا خاتالىق كۆرۈلدى' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'نومۇر مۇۋەپپەقىيەتلىك بىكار قىلىندى، پۇلىڭىز ھېساباتىڭىزغا قايتۇرۇلدى',
      newBalance: refundRes.newBalance,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'بىكار قىلىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
