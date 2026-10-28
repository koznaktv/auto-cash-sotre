import { NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import { getOrderByIdAsync, updateOrderAsync, refundOrderBalanceAtomicAsync } from '@/lib/db';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';
import { postOrderCompletedToChannel } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId') || '';
    const activationId = searchParams.get('activationId') || '';

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

    // Verify ownership
    if (order.userId !== user.id && user.role !== 'admin') {
      return unauthorizedResponse();
    }

    // If order was already completed, return existing code immediately
    if (order.status === 'completed' && order.details?.code) {
      return NextResponse.json({
        success: true,
        status: 'RECEIVED',
        code: order.details.code,
        message: 'SMS كودى تەييار',
      });
    }

    // Check with PhoneCash
    const statusRes = await phonecashProvider.checkStatus(activationId, 1);

    if (statusRes.status === 'RECEIVED' && statusRes.code) {
      // Save code to order and mark completed!
      const updatedDetails = {
        ...(order.details || {}),
        code: statusRes.code,
        smsCode: statusRes.code,
        statusText: statusRes.statusText,
        completedAt: new Date().toISOString(),
      };

      await updateOrderAsync(orderId, {
        status: 'completed',
        detailsPatch: updatedDetails,
      });

      // Confirm to provider that code was received (status_action=3)
      phonecashProvider.finishActivation(activationId).catch(() => null);

      // Post to channel
      postOrderCompletedToChannel({
        id: order.id,
        serviceName: order.serviceName,
        packageTitle: order.packageTitle,
        amount: order.amount,
        targetAccount: order.targetAccount,
        userEmail: order.userEmail,
        userName: user.name || order.userEmail,
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        status: 'RECEIVED',
        code: statusRes.code,
        message: 'SMS كودى كەلدى!',
      });
    }

    // Auto-detect cancellation or expiration from PhoneCash provider
    const isExpired = order.details?.expiresAt && Date.now() > new Date(order.details.expiresAt).getTime();
    if (statusRes.status === 'CANCELED' || isExpired) {
      if (order.status !== 'refunded' && order.status !== 'cancelled') {
        const refundRes = await refundOrderBalanceAtomicAsync(
          orderId,
          isExpired
            ? '15 مىنۇتتا SMS كەلمىگەنلىكى ئۈچۈن بىكار قىلىندى (پۇل قايتۇرۇلدى)'
            : 'تەمىنلىگۈچى تەرەپتىن نومۇر بىكار قىلىندى (پۇل قايتۇرۇلدى)',
          true
        ).catch(() => ({ success: false, newBalance: undefined }));

        return NextResponse.json({
          success: true,
          status: 'CANCELED',
          refunded: true,
          newBalance: refundRes?.newBalance,
          message: 'تەمىنلىگۈچى تەرەپتىن كود كەلمىدى، نومۇر بىكار قىلىنىپ پۇلىڭىز ھېساباتىڭىزغا دەل ۋاقتىدا قايتۇرۇلدى!',
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: statusRes.status,
      statusText: statusRes.statusText,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'كود تەكشۈرۈش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
