import { NextResponse } from 'next/server';
import {
  getAllDepositsAsync,
  getDepositsByUserIdAsync,
  createDepositAsync,
  updateDepositStatusAsync,
  isTxIdAlreadyCompletedAsync,
  DepositReviewError,
} from '@/lib/db';
import { verifyAdminToken, hasAdminBearer } from '@/lib/adminAuth';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import {
  getTsaConfig,
  normalizeTxId,
  verifyShamcashTransaction,
} from '@/lib/providers/tsaShamcash';
import { notifyNewDeposit, notifyFraudulentDeposit } from '@/lib/telegram';

const MAX_DEPOSIT_AMOUNT = 10000;

export async function GET(req: Request) {
  try {
    if (hasAdminBearer(req)) {
      return NextResponse.json({ success: true, deposits: await getAllDepositsAsync() });
    }

    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    return NextResponse.json({ success: true, deposits: await getDepositsByUserIdAsync(user.id, user.email) });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تالونلارنى ئېلىشتا خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'ھەميانغا پۇل كىرگۈزۈش ئۈچۈن ئالدى بىلەن ھېساباتىڭىزغا كىرىشىڭىز كېرەك. (Gmail ئارقىلىق كىرىڭ)',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, method, txId } = body;

    const parsedAmount = Math.round(Number(amount) * 100) / 100;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > MAX_DEPOSIT_AMOUNT) {
      return NextResponse.json(
        { success: false, message: 'سومما توغرا كىرگۈزۈلمىدى (0 دىن يۇقىرى كىرگۈزۈڭ)' },
        { status: 400 }
      );
    }

    const cleanTxId = normalizeTxId(typeof txId === 'string' ? txId : '');
    if (!cleanTxId) {
      return NextResponse.json(
        { success: false, message: 'شامكەش تالون نومۇرى (رقم العملية) كىرگۈزۈلمىدى' },
        { status: 400 }
      );
    }

    // Anti-replay / anti-fraud: check if this transaction ID has already been credited!
    const alreadyCompleted = await isTxIdAlreadyCompletedAsync(cleanTxId);
    if (alreadyCompleted) {
      notifyFraudulentDeposit({
        userName: user.name,
        userEmail: user.email,
        txId: cleanTxId,
        amount: parsedAmount,
        reason: 'بۇ تالون بۇرۇن ئاللىقاچان سانداندا تەستىقلانغان (تەكرار تالون كىرگۈزۈش ھەرىكىتى)',
      }).catch(() => {});

      return NextResponse.json(
        {
          success: false,
          message: 'بۇ تالون نومۇرى (رقم العملية) بۇرۇن ئاللىقاچان تەستىقلانغان ۋە ئىشلىتىلگەن! قايتا كىرگۈزۈشكە بولمايدۇ.',
        },
        { status: 400 }
      );
    }

    const depositMethod =
      typeof method === 'string' && method.trim() ? method.trim().slice(0, 60) : 'شامكەش (Sham Cash)';

    // Check TSA API configuration
    const tsaConfig = await getTsaConfig();

    if (tsaConfig.autoDepositEnabled && tsaConfig.apiKey && tsaConfig.shamcashAddress) {
      try {
        const verifyRes = await verifyShamcashTransaction(cleanTxId, {
          apiKey: tsaConfig.apiKey,
          accountAddress: tsaConfig.shamcashAddress,
          exchangeRate: tsaConfig.exchangeRate,
        });

        if (verifyRes.success && verifyRes.found && verifyRes.transaction) {
          const tx = verifyRes.transaction;

          // Double check the transaction's tranId from TSA
          if (await isTxIdAlreadyCompletedAsync(tx.tranId)) {
            return NextResponse.json(
              { success: false, message: 'بۇ تالون نومۇرى بۇرۇن ئاللىقاچان ئىشلىتىلگەن!' },
              { status: 400 }
            );
          }

          // Use the exact credited USD amount from the verified Sham Cash transaction
          const finalCreditAmount = tx.usdAmount > 0 ? tx.usdAmount : parsedAmount;

          const created = await createDepositAsync({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            method: depositMethod,
            amount: finalCreditAmount,
            txId: tx.tranId,
          });

          // Atomically approve and credit user wallet
          const completedDeposit = await updateDepositStatusAsync(created.id, 'completed');

          notifyNewDeposit({
            id: created.id,
            amount: finalCreditAmount,
            method: 'ShamCash (ئاپتوماتىك دەلىللەندى)',
            txId: tx.tranId,
            userName: user.name,
            userEmail: user.email,
            status: 'completed',
          }).catch(() => {});

          return NextResponse.json({
            success: true,
            autoApproved: true,
            deposit: completedDeposit || created,
            creditedAmount: finalCreditAmount,
            currency: tx.currency,
            originalAmount: tx.amount,
            message: `شامكەش تالونى مۇۋەپپەقىيەتلىك دەلىللەندى! ھېساباتىڭىزغا $${finalCreditAmount} قوشۇلدى.`,
          });
        }
      } catch (tsaErr) {
        console.warn('TSA verification exception, falling back to pending deposit:', tsaErr);
      }
    }

    // Fallback: If not auto-approved, record as pending deposit for admin review / manual retry
    const newDeposit = await createDepositAsync({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      method: depositMethod,
      amount: parsedAmount,
      txId: cleanTxId,
    });

    notifyNewDeposit({
      id: newDeposit.id,
      amount: parsedAmount,
      method: depositMethod,
      txId: cleanTxId,
      userName: user.name,
      userEmail: user.email,
      status: 'pending (تەكشۈرۈلمەكتە)',
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      autoApproved: false,
      deposit: newDeposit,
      message:
        'تالون يوللاندى. شامكەش سىستېمىسىدا 10-30 سېكۇنت كېچىكىش بولۇشى مۇمكىن؛ بىر ئازدىن كېيىن تىزىملىكتىكى «دەلىللەش» كۇنۇپكىسىنى بېسىپ ئاپتوماتىك تەستىقلىيالايسىز.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'پۇل كىرگۈزۈش ئىلتىماسى ئەۋەتىلمىدى' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json(
        { success: false, message: 'باشقۇرغۇچى سالاھىيىتى دەلىللەنمىدى (Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { depositId, status } = body;

    if (typeof depositId !== 'string' || (status !== 'completed' && status !== 'rejected')) {
      return NextResponse.json(
        { success: false, message: 'ھالەت تۈرى خاتا' },
        { status: 400 }
      );
    }

    const updated = await updateDepositStatusAsync(depositId, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'پۇل كىرگۈزۈش خاتىرىسى تېپىلمىدى' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deposit: updated });
  } catch (err: any) {
    if (err instanceof DepositReviewError) {
      return NextResponse.json({ success: false, message: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, message: err?.message || 'ھالەتنى يېڭىلاش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
