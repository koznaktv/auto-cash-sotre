import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import {
  getOrderByIdAsync,
  getOrderByActivationIdAsync,
  updateOrderAsync,
  refundOrderBalanceAtomicAsync,
} from '@/lib/db';
import {
  creditUnifiedWalletBalance,
  updateMicroAppOrderSync,
} from '@/lib/appWallets';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';
import { postOrderCompletedToChannel } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    let user: any = null;
    try {
      user = await getSessionUser(req);
    } catch {}

    const { searchParams } = new URL(req.url);
    const orderIdParam = (searchParams.get('orderId') || searchParams.get('order_id') || '').trim();
    const activationIdParam = (
      searchParams.get('activationId') ||
      searchParams.get('activation_id') ||
      searchParams.get('id') ||
      ''
    ).trim();
    const identityParam = (
      searchParams.get('identity') ||
      searchParams.get('userId') ||
      searchParams.get('user_id') ||
      searchParams.get('tgId') ||
      ''
    ).trim().replace(/^@/, '');
    const serviceParam = (searchParams.get('service') || searchParams.get('serviceCode') || '').trim();
    const countryParam = (searchParams.get('country') || searchParams.get('countryId') || '').trim();

    if (!activationIdParam && !orderIdParam) {
      return NextResponse.json(
        { success: false, message: 'ئاكتىپلاش كودى ياكى زاكاز نومۇرى كەم' },
        { status: 400 }
      );
    }

    // 1. Locate Order (support lookup by orderId or activationId)
    let order: any = null;
    if (orderIdParam) {
      order = await getOrderByIdAsync(orderIdParam);
    }
    if (!order && activationIdParam) {
      order = await getOrderByActivationIdAsync(activationIdParam);
    }

    const orderId = order?.id || orderIdParam;
    const activationId = activationIdParam || order?.details?.activationId || order?.id;
    const targetService = serviceParam || order?.details?.serviceCode;
    const targetCountry = countryParam || order?.details?.countryId;

    // 2. If order is already completed and has stored code, return it instantly
    if (order && order.status === 'completed' && (order.details?.code || order.details?.smsCode)) {
      const existingCode = String(order.details.code || order.details.smsCode).trim();
      return NextResponse.json({
        success: true,
        status: 'RECEIVED',
        code: existingCode,
        smsCode: existingCode,
        message: 'SMS كودى تەييار',
      });
    }

    // 3. Query PhoneCash upstream API
    const statusRes = await phonecashProvider.checkStatus(activationId, 1, {
      service: targetService,
      country: targetCountry,
    });

    // 4. Code Received from upstream provider!
    if (statusRes.status === 'RECEIVED' && statusRes.code) {
      const finalCode = statusRes.code;

      if (order && orderId) {
        const updatedDetails = {
          ...(order.details || {}),
          code: finalCode,
          smsCode: finalCode,
          statusText: statusRes.statusText,
          completedAt: new Date().toISOString(),
        };

        await updateOrderAsync(orderId, {
          status: 'completed',
          detailsPatch: updatedDetails,
        });

        updateMicroAppOrderSync(orderId, 'completed', new Date().toISOString());

        // Notify PhoneCash that activation is complete (status_action=3)
        phonecashProvider
          .finishActivation(activationId, {
            service: targetService,
            country: targetCountry,
          })
          .catch(() => null);

        // Telegram Channel broadcast
        postOrderCompletedToChannel({
          id: order.id,
          serviceName: order.serviceName,
          packageTitle: order.packageTitle,
          amount: order.amount,
          targetAccount: order.targetAccount,
          userEmail: order.userEmail,
          userName: user?.name || order.userEmail,
        }).catch(() => null);
      }

      return NextResponse.json({
        success: true,
        status: 'RECEIVED',
        code: finalCode,
        smsCode: finalCode,
        statusText: statusRes.statusText || 'SMS كودى كەلدى!',
        message: 'SMS كودى كەلدى!',
      });
    }

    // 5. Provider Cancellation or Timeout Auto-Refund
    const isExpired = order?.details?.expiresAt && Date.now() > new Date(order.details.expiresAt).getTime();
    if (statusRes.status === 'CANCELED' || isExpired) {
      if (order && order.status !== 'refunded' && order.status !== 'cancelled') {
        const refundRes = await refundOrderBalanceAtomicAsync(
          orderId,
          isExpired
            ? '15 مىنۇتتا SMS كەلمىگەنلىكى ئۈچۈن بىكار قىلىندى (پۇل قايتۇرۇلدى)'
            : 'تەمىنلىگۈچى تەرەپتىن نومۇر بىكار قىلىندى (پۇل قايتۇرۇلدى)',
          true
        ).catch(() => ({ success: false, newBalance: undefined }));

        const targetIdent = identityParam || order.details?.identity || order.userEmail;
        if (targetIdent) {
          await creditUnifiedWalletBalance(targetIdent, order.amount);
        }
        updateMicroAppOrderSync(orderId, 'cancelled');

        return NextResponse.json({
          success: true,
          status: 'CANCELED',
          refunded: true,
          newBalance: refundRes?.newBalance,
          message: 'تەمىنلىگۈچى تەرەپتىن نومۇر بىكار قىلىندى، پۇلىڭىز ھېساباتىڭىزغا دەل ۋاقتىدا قايتۇرۇلدى!',
        });
      }
    }

    // 6. Active and waiting for incoming SMS
    return NextResponse.json({
      success: true,
      status: 'WAIT_CODE',
      statusText: statusRes.statusText || 'SMS كودى كۈتۈلمەكتە...',
      code: null,
    });
  } catch (err: any) {
    console.error('[SMS Check Error]:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'كود تەكشۈرۈش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
