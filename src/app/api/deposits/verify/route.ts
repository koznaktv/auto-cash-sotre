import { NextResponse } from 'next/server';
import {
  getDepositByIdAsync,
  updateDepositStatusAsync,
  isTxIdAlreadyCompletedAsync,
} from '@/lib/db';
import { verifyAdminToken, hasAdminBearer } from '@/lib/adminAuth';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import {
  getTsaConfig,
  normalizeTxId,
  verifyShamcashTransaction,
} from '@/lib/providers/tsaShamcash';

export async function POST(req: Request) {
  try {
    const isAdmin = hasAdminBearer(req) || verifyAdminToken(req);
    const user = await getSessionUser(req);

    if (!isAdmin && !user) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const { depositId } = body;

    if (!depositId || typeof depositId !== 'string') {
      return NextResponse.json({ success: false, message: 'Deposit ID كىرگۈزۈلمىدى' }, { status: 400 });
    }

    const deposit = await getDepositByIdAsync(depositId);
    if (!deposit) {
      return NextResponse.json({ success: false, message: 'پۇل كىرگۈزۈش خاتىرىسى تېپىلمىدى' }, { status: 404 });
    }

    // Ownership check: regular users can only verify their own deposits
    if (!isAdmin) {
      const isOwner =
        (deposit.userId && user?.id && deposit.userId === user.id) ||
        (deposit.userEmail && user?.email && deposit.userEmail.toLowerCase() === user.email.toLowerCase());
      if (!isOwner) {
        return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Forbidden)' }, { status: 403 });
      }
    }

    if (deposit.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: `بۇ تالون ئاللىقاچان بىر تەرەپ قىلىنغان (ھالىتى: ${deposit.status})`,
      });
    }

    const cleanTxId = normalizeTxId(deposit.txId || '');
    if (!cleanTxId) {
      return NextResponse.json({ success: false, message: 'بۇ خاتىرىدە تالون نومۇرى يوق' }, { status: 400 });
    }

    // Anti-replay check
    const alreadyCompleted = await isTxIdAlreadyCompletedAsync(cleanTxId);
    if (alreadyCompleted) {
      return NextResponse.json({
        success: false,
        message: 'بۇ تالون نومۇرى بۇرۇن باشقا بىر خاتىرىدە ئاللىقاچان ئىشلىتىلگەن!',
      });
    }

    const tsaConfig = await getTsaConfig();
    if (!tsaConfig.apiKey || !tsaConfig.shamcashAddress) {
      return NextResponse.json({
        success: false,
        message: 'TSA API ياكى شامكەش ئادرېسى تېخى تولۇق تەڭشەلمىگەن',
      });
    }

    const verifyRes = await verifyShamcashTransaction(cleanTxId, {
      apiKey: tsaConfig.apiKey,
      accountAddress: tsaConfig.shamcashAddress,
      exchangeRate: tsaConfig.exchangeRate,
    });

    if (!verifyRes.success) {
      return NextResponse.json({
        success: false,
        message: verifyRes.error || verifyRes.message || 'TSA API دەلىللەش مەغلۇپ بولدى',
      });
    }

    if (!verifyRes.found || !verifyRes.transaction) {
      return NextResponse.json({
        success: true,
        verified: false,
        message: 'شامكەشتىن بۇ تالون تېخى تېپىلمىدى. 10-30 سېكۇنت ساقلاپ قايتا سىناڭ.',
      });
    }

    const tx = verifyRes.transaction;

    // Check tranId from TSA
    if (tx.tranId !== cleanTxId && (await isTxIdAlreadyCompletedAsync(tx.tranId))) {
      return NextResponse.json({
        success: false,
        message: 'بۇ تالون نومۇرى باشقا بىر تالوندا ئاللىقاچان ئىشلىتىلگەن!',
      });
    }

    // Approve deposit and credit user wallet
    const updated = await updateDepositStatusAsync(deposit.id, 'completed');

    return NextResponse.json({
      success: true,
      verified: true,
      deposit: updated,
      creditedAmount: tx.usdAmount,
      rawAmount: tx.amount,
      currency: tx.currency,
      message: `تالون دەلىللەندى! ھېساباتىڭىزغا $${tx.usdAmount} قوشۇلدى.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'دەلىللەش مەغلۇپ بولدى' }, { status: 500 });
  }
}
