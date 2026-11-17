import { NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import {
  getOrderByIdAsync,
  getOrderByActivationIdAsync,
  updateOrderAsync,
  refundOrderBalanceAtomicAsync,
} from '@/lib/db';
import {
  creditUnifiedWalletBalance,
  getUnifiedWalletBalance,
  updateMicroAppOrderSync,
} from '@/lib/appWallets';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { orderId: rawOrderId, activationId: rawActivationId, reason, identity, user_id, tgId, service, country } = body || {};

    const activationId = String(rawActivationId || '').trim();
    let orderId = String(rawOrderId || '').trim();

    if (!orderId && !activationId) {
      return NextResponse.json(
        { success: false, message: 'زاكاز ياكى ئاكتىپلاش كودى كەم' },
        { status: 400 }
      );
    }

    let verifiedUser: any = null;
    try {
      verifiedUser = await getSessionUser(req);
    } catch {}

    let cleanIdentity = String(identity || user_id || tgId || '').trim().replace(/^@/, '');
    if (verifiedUser) {
      cleanIdentity = verifiedUser.telegramUsername || verifiedUser.telegramChatId || verifiedUser.email || verifiedUser.phone || verifiedUser.name || cleanIdentity;
    }

    let order: any = null;
    if (orderId) {
      order = await getOrderByIdAsync(orderId);
    }
    if (!order && activationId) {
      order = await getOrderByActivationIdAsync(activationId);
      if (order) orderId = order.id;
    }

    if (!order) {
      // If order is not found, but we have activationId, cancel on provider anyway
      if (activationId) {
        await phonecashProvider
          .cancelActivation(activationId, {
            service,
            country,
          })
          .catch(() => null);
      }
      return NextResponse.json({
        success: true,
        message: 'مەۋھۇم نومۇر بىكار قىلىندى',
      });
    }

    // Verify ownership (allow if holder has matching activationId)
    const isOwner =
      (verifiedUser && (order.userId === verifiedUser.id || verifiedUser.role === 'admin')) ||
      (cleanIdentity && order.details?.identity && order.details.identity.toLowerCase() === cleanIdentity.toLowerCase()) ||
      (cleanIdentity && order.userEmail && order.userEmail.toLowerCase().includes(cleanIdentity.toLowerCase())) ||
      (cleanIdentity && order.userId === cleanIdentity) ||
      (activationId && (order.details?.activationId === activationId || order.id === activationId));

    if (!isOwner) {
      return unauthorizedResponse();
    }

    if (order.status === 'completed') {
      return NextResponse.json(
        { success: false, message: 'پۈتۈپ بولغان نومۇرنى بىكار قىلغىلى بولمايدۇ' },
        { status: 400 }
      );
    }

    if (order.status === 'refunded' || order.status === 'cancelled') {
      const currentBal = await getUnifiedWalletBalance(cleanIdentity || order.details?.identity || order.userEmail || '');
      return NextResponse.json({
        success: true,
        message: 'بۇ نومۇر ئاللىقاچان بىكار قىلىنغان',
        newBalance: currentBal,
        current_balance: currentBal,
      });
    }

    // CRITICAL ADMIN ASSET PROTECTION:
    // Check with PhoneCash first. If the code already arrived, DO NOT cancel or refund!
    const targetActId = activationId || order.details?.activationId;
    const targetSvc = service || order.details?.serviceCode;
    const targetCtry = country || order.details?.countryId;

    if (targetActId) {
      const liveCheck = await phonecashProvider.checkStatus(targetActId, 1, {
        service: targetSvc,
        country: targetCtry,
      });

      if (liveCheck.status === 'RECEIVED' && liveCheck.code) {
        // The code has already arrived! Provider charges wholesale cost.
        // Complete the order so customer receives code and admin keeps customer payment!
        await updateOrderAsync(order.id, {
          status: 'completed',
          detailsPatch: {
            code: liveCheck.code,
            smsCode: liveCheck.code,
            statusText: liveCheck.statusText,
            completedAt: new Date().toISOString(),
          },
        });
        updateMicroAppOrderSync(order.id, 'completed', new Date().toISOString());
        phonecashProvider.finishActivation(targetActId, { service: targetSvc, country: targetCtry }).catch(() => null);

        return NextResponse.json({
          success: false,
          codeArrived: true,
          code: liveCheck.code,
          message: 'بۇ نومۇرغا دەلىللەش كودى كېلىپ بولدى، شۇڭا بىكار قىلغىلى بولمايدۇ. تەستىقلاش كودى زاكازلىرىڭىزغا چىقىرىلدى!',
        });
      }
    }

    // 1. Cancel on PhoneCash provider (since no SMS code arrived, provider charges $0.00)
    await phonecashProvider
      .cancelActivation(targetActId, {
        service: targetSvc,
        country: targetCtry,
      })
      .catch((err) => {
        console.warn('[PhoneCash Cancel Notice]:', err?.message);
      });

    // 2. Atomically refund the order balance back to user's wallet
    const refundRes = await refundOrderBalanceAtomicAsync(
      order.id,
      reason || 'خېرىدار SMS كەلمىگەنلىكى ئۈچۈن بىكار قىلدى',
      true
    );

    const targetIdentity = cleanIdentity || order.details?.identity || order.userEmail || '';
    if (targetIdentity && typeof order.amount === 'number' && order.amount > 0) {
      await creditUnifiedWalletBalance(targetIdentity, order.amount);
    }

    updateMicroAppOrderSync(order.id, 'cancelled');

    const finalBalance = await getUnifiedWalletBalance(targetIdentity);

    return NextResponse.json({
      success: true,
      message: 'نومۇر مۇۋەپپەقىيەتلىك بىكار قىلىندى، پۇلىڭىز ھېساباتىڭىزغا قايتۇرۇلدى',
      newBalance: finalBalance,
      current_balance: finalBalance,
    });
  } catch (err: any) {
    console.error('[SMS Cancel Error]:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'نومۇرنى بىكار قىلىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
