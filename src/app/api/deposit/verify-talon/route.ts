import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getSessionUser } from '@/lib/session';
import { normalizeTxId, verifyShamcashTransaction, getTsaConfig } from '@/lib/providers/tsaShamcash';
import { isTxIdAlreadyCompletedAsync, createDepositAsync, updateDepositStatusAsync } from '@/lib/db';
import { creditUnifiedWalletBalance, getUnifiedWalletBalance } from '@/lib/appWallets';

export const dynamic = 'force-dynamic';

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const SESSIONS_DIR = IS_SERVERLESS ? path.join('/tmp', 'micro_apps') : path.join(process.cwd(), 'data', 'micro_apps');

function ensureDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    try {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    } catch {}
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req).catch(() => null);
    const body = await req.json().catch(() => ({}));
    const { talon, identity } = body;

    const rawTalon = typeof talon === 'string' ? talon : '';
    const cleanTalon = normalizeTxId(rawTalon);

    if (!cleanTalon || cleanTalon.length < 5) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: 'شامكەش تالون نومۇرى كەم دېگەندە 5 خانىلىق بولۇشى كېرەك!',
          message: 'شامكەش تالون نومۇرى كەم دېگەندە 5 خانىلىق بولۇشى كېرەك!',
        },
        { status: 400 }
      );
    }

    // Resolve user identity
    const targetIdentity = (
      (sessionUser?.email || sessionUser?.name || identity || '').trim()
    );

    if (!targetIdentity) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: 'قالدۇق قاچىلاش ئۈچۈن ئالدى بىلەن ھېساباتىڭىزغا كىرىڭ!',
          message: 'قالدۇق قاچىلاش ئۈچۈن ئالدى بىلەن ھېساباتىڭىزغا كىرىڭ!',
        },
        { status: 401 }
      );
    }

    // 1. Anti-Double-Spend Protection (Database + Local Used Talons)
    const alreadyCompleted = await isTxIdAlreadyCompletedAsync(cleanTalon).catch(() => false);
    if (alreadyCompleted) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: 'بۇ تالون نومۇرى بۇرۇن ئاللىقاچان تەستىقلانغان ۋە ئىشلىتىلگەن!',
          message: 'بۇ تالون نومۇرى بۇرۇن ئاللىقاچان تەستىقلانغان ۋە ئىشلىتىلگەن!',
        },
        { status: 400 }
      );
    }

    ensureDir();
    const usedTalonsFile = path.join(SESSIONS_DIR, 'used_shamcash_talons.json');
    let usedTalons: string[] = [];
    try {
      if (fs.existsSync(usedTalonsFile)) {
        usedTalons = JSON.parse(fs.readFileSync(usedTalonsFile, 'utf-8'));
      }
    } catch {}

    if (usedTalons.includes(cleanTalon)) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: 'بۇ شامكەش تالونى ئاللىقاچان ئىشلىتىلگەن! قايتا پۇل قاچىلىيالمايسىز.',
          message: 'بۇ شامكەش تالونى ئاللىقاچان ئىشلىتىلگەن! قايتا پۇل قاچىلىيالمايسىز.',
        },
        { status: 400 }
      );
    }

    // 2. Strict Real ShamCash Verification via TSA API
    const tsaConfig = await getTsaConfig().catch(() => null);
    let topupAmount = 0;
    let isRealTsaVerified = false;

    if (!tsaConfig?.apiKey || !tsaConfig?.shamcashAddress) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: 'شامكەش ئاپتوماتىك دەلىللەش قاچىلانمىغان. تالونىڭىزنى تېلېگرام بوتقا ئەۋەتىپ دەلىللىتىڭ.',
          message: 'شامكەش ئاپتوماتىك دەلىللەش قاچىلانمىغان. تالونىڭىزنى تېلېگرام بوتقا ئەۋەتىپ دەلىللىتىڭ.',
        },
        { status: 503 }
      );
    }

    const verifyRes = await verifyShamcashTransaction(cleanTalon, {
      apiKey: tsaConfig.apiKey,
      accountAddress: tsaConfig.shamcashAddress,
      exchangeRate: tsaConfig.exchangeRate,
    }).catch(() => null);

    if (verifyRes?.expired) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: 'بۇ تالوننىڭ مۇددىتى ئۆتۈپ كەتكەن (كونا تالون)!',
          message: 'بۇ تالوننىڭ مۇددىتى ئۆتۈپ كەتكەن (كونا تالون)!',
        },
        { status: 400 }
      );
    }

    if (verifyRes?.success && verifyRes.found && verifyRes.transaction) {
      isRealTsaVerified = true;
      if (verifyRes.transaction.usdAmount > 0) {
        topupAmount = Number(verifyRes.transaction.usdAmount.toFixed(2));
      } else if (verifyRes.transaction.amount > 0 && tsaConfig.exchangeRate > 0) {
        topupAmount = Number((verifyRes.transaction.amount / tsaConfig.exchangeRate).toFixed(2));
      }
    } else {
      // STRICT: Talon is invalid, not found, or not arrived yet!
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: verifyRes?.message || verifyRes?.error || 'خاتا ياكى مەۋجۇت بولمىغان شامكەش تالونى! پۇل يۆتكەش تالون نومۇرى شامكەش سىستېمىسىدا تېپىلمىدى.',
          message: verifyRes?.message || verifyRes?.error || 'خاتا ياكى مەۋجۇت بولمىغان شامكەش تالونى! پۇل يۆتكەش تالون نومۇرى شامكەش سىستېمىسىدا تېپىلمىدى.',
        },
        { status: 400 }
      );
    }

    if (topupAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: 'تالوندىكى پۇل سوممىسى نۆل ياكى ئېنىق ئەمەس!',
          message: 'تالوندىكى پۇل سوممىسى نۆل ياكى ئېنىق ئەمەس!',
        },
        { status: 400 }
      );
    }

    // Mark talon as used
    usedTalons.push(cleanTalon);
    try {
      fs.writeFileSync(usedTalonsFile, JSON.stringify(usedTalons.slice(-500), null, 2), 'utf-8');
    } catch {}

    // Credit unified wallet balance
    const creditRes = await creditUnifiedWalletBalance(targetIdentity, topupAmount);
    let newBalance = creditRes.newBalance;

    // Record deposit in central DB
    try {
      const dep = await createDepositAsync({
        userId: sessionUser?.id,
        userName: sessionUser?.name || targetIdentity,
        userEmail: sessionUser?.email || `${targetIdentity}@maxbazar.user`,
        amount: topupAmount,
        method: isRealTsaVerified ? 'Sham Cash (TSA Verified)' : 'Sham Cash (MAX-BAZAR Wallet)',
        txId: cleanTalon,
      });
      if (dep?.id) {
        await updateDepositStatusAsync(dep.id, 'completed').catch(() => null);
        newBalance = await getUnifiedWalletBalance(targetIdentity).catch(() => newBalance);
      }
    } catch (e: any) {
      console.warn('[createDepositAsync in verify-talon warn]:', e?.message);
    }

    // Broadcast Telegram notification to Channels
    try {
      const botToken = process.env.MAXBAZAR_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        const text =
          `💳 *يېڭى شامكەش قالدۇق قاچىلاندى*\n\n` +
          `👤 خېرىدار: *${sessionUser?.name || targetIdentity}*\n` +
          `🧾 تالون: \`${cleanTalon}\`\n` +
          `💰 تولۇقلانغان سومما: *$${topupAmount.toFixed(2)}*\n` +
          `💵 يېڭى قالدۇق: *$${newBalance.toFixed(2)}*\n\n` +
          `⚡ سىستېما تەرىپىدىن تەستىقلاندى.`;

        // Send to @autocashkirim
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: '@autocashkirim', text, parse_mode: 'Markdown' }),
        }).catch(() => {});
      }
    } catch {}

    return NextResponse.json({
      success: true,
      ok: true,
      amount: topupAmount,
      newBalance,
      message: `✅ تالون تەستىقلاندى! $${topupAmount.toFixed(2)} قالدۇقىڭىزغا دەرھال قوشۇلدى.`,
    });
  } catch (err: any) {
    console.error('[verify-talon error]:', err);
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: err?.message || 'تالون دەلىللەشتە كاشىلا كۆرۈلدى',
        message: err?.message || 'تالون دەلىللەشتە كاشىلا كۆرۈلدى',
      },
      { status: 500 }
    );
  }
}
