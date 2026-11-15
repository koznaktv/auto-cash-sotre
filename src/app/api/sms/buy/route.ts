import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getSessionUser } from '@/lib/session';
import {
  createOrderDirectAsync,
  adjustUserBalanceAsync,
  randomId,
} from '@/lib/db';
import {
  getUnifiedWalletBalance,
  deductUnifiedWalletBalance,
  findOrCreateDbUserForIdentity,
} from '@/lib/appWallets';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';
import { notifyNewOrder } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const SESSIONS_DIR = IS_SERVERLESS ? path.join('/tmp', 'micro_apps') : path.join(process.cwd(), 'data', 'micro_apps');

function saveMicroAppOrder(order: any) {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
    const filePath = path.join(SESSIONS_DIR, 'orders.json');
    let orders: any[] = [];
    if (fs.existsSync(filePath)) {
      orders = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    orders.unshift(order);
    fs.writeFileSync(filePath, JSON.stringify(orders.slice(0, 500), null, 2), 'utf-8');
  } catch {}
}

// In-memory user buy lock to strictly prevent duplicate rapid order clicks
const activeBuyLocks = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: 'مەلۇمات خاتا يوللاندى' }, { status: 400 });
    }

    let verifiedUser: any = null;
    try {
      verifiedUser = await getSessionUser(req);
    } catch {}

    const { serviceCode, countryId, serviceName, countryName, identity, user_id } = body;
    let cleanIdentity = (identity || user_id || '').trim().replace(/^@/, '');
    if (verifiedUser) {
      cleanIdentity = verifiedUser.telegramUsername || verifiedUser.telegramChatId || verifiedUser.email || verifiedUser.phone || verifiedUser.name || cleanIdentity;
    }

    if (!cleanIdentity || cleanIdentity.toLowerCase() === 'user') {
      if (verifiedUser) {
        cleanIdentity = verifiedUser.email || verifiedUser.id;
      } else {
        return NextResponse.json({ success: false, message: 'ئالدى بىلەن ھېساباتىڭىزغا كىرىڭ ياكى تېلېگرام بىلەن كىرىڭ' }, { status: 401 });
      }
    }

    // Rate-limit rapid clicks per identity
    const lastBuy = activeBuyLocks.get(cleanIdentity);
    const now = Date.now();
    if (lastBuy && now - lastBuy < 2500) {
      return NextResponse.json(
        { success: false, message: 'زاكازىڭىز بىر تەرەپ قىلىنىۋاتىدۇ، تەكرار باسماڭ' },
        { status: 429 }
      );
    }
    activeBuyLocks.set(cleanIdentity, now);

    if (!serviceCode || countryId === undefined) {
      return NextResponse.json(
        { success: false, message: 'مۇلازىمەت ياكى دۆلەت كودى تەمىنلەنمىدى' },
        { status: 400 }
      );
    }

    // 1. Fetch live service price
    const services = await phonecashProvider.getServices(Number(countryId));
    const targetService = services.find(
      (s: any) => String(s.service_code).toLowerCase() === String(serviceCode).toLowerCase()
    );

    if (!targetService) {
      return NextResponse.json(
        { success: false, message: 'بۇ دۆلەتكە مۇناسىپ مۇلازىمەت تېپىلمىدى' },
        { status: 404 }
      );
    }

    if (targetService.count <= 0) {
      return NextResponse.json(
        { success: false, message: 'بۇ مۇلازىمەتكە نۆۋەتتە بوش نومۇر قالمىدى، باشقا دۆلەتنى سىناپ كۆرۈڭ' },
        { status: 400 }
      );
    }

    const sellPrice = targetService.sellPrice;
    const costPrice = targetService.costPrice;

    // Check unified balance
    let currentBalance = await getUnifiedWalletBalance(cleanIdentity);
    if (user_id && String(user_id).trim() !== cleanIdentity) {
      const altBalance = await getUnifiedWalletBalance(String(user_id).trim());
      if (altBalance > currentBalance) {
        currentBalance = altBalance;
        cleanIdentity = String(user_id).trim();
      }
    }
    if (verifiedUser && typeof verifiedUser.balance === 'number' && verifiedUser.balance > currentBalance) {
      currentBalance = Number(verifiedUser.balance.toFixed(2));
    }

    if (currentBalance < sellPrice) {
      return NextResponse.json(
        {
          success: false,
          message: `ھېساباتىڭىزدىكى قالدۇق پۇل يېتىشمىدى. باھاسى: $${sellPrice}، قالدۇقىڭىز: $${currentBalance.toFixed(2)}`,
          current_balance: currentBalance,
        },
        { status: 400 }
      );
    }

    // 2. Request virtual number from PhoneCash API FIRST!
    // Protect customer funds: If provider has no number or fails, DO NOT deduct funds!
    const buyRes = await phonecashProvider.buyNumber(serviceCode, Number(countryId));

    if (!buyRes.success || !buyRes.activationId || !buyRes.phone) {
      return NextResponse.json(
        {
          success: false,
          code: buyRes.errorCode || (buyRes.error?.includes('NO_NUMBERS') ? 'NO_NUMBERS' : undefined),
          message: buyRes.error || 'نومۇر ئېلىش مەغلۇپ بولدى، باھايىڭىز كېسىلمىدى. باشقا دۆلەتنى سىناپ كۆرۈڭ.',
          current_balance: currentBalance,
        },
        { status: 502 }
      );
    }

    // 3. Provider succeeded! Now deduct the balance from user's unified wallet
    let newBalance = currentBalance - sellPrice;
    if (verifiedUser && verifiedUser.id) {
      try {
        const updated = await adjustUserBalanceAsync(verifiedUser.id, -sellPrice);
        if (updated && typeof updated.balance === 'number') {
          newBalance = updated.balance;
        }
      } catch {}
      try {
        await deductUnifiedWalletBalance(cleanIdentity, sellPrice);
      } catch {}
    } else {
      const deductRes = await deductUnifiedWalletBalance(cleanIdentity, sellPrice);
      if (!deductRes.success) {
        // In rare race condition if balance wasn't enough, cancel on provider
        await phonecashProvider.cancelActivation(buyRes.activationId, {
          service: serviceCode,
          country: Number(countryId),
        }).catch(() => null);
        return NextResponse.json(
          { success: false, message: deductRes.error || 'قالدۇق پۇل يېتىشمىدى' },
          { status: 400 }
        );
      }
      newBalance = deductRes.newBalance;
    }

    // 4. Create central order in database
    const dbUser = verifiedUser || await findOrCreateDbUserForIdentity(cleanIdentity);
    const orderId = randomId('SMS');

    const details = {
      isSmsActivation: true,
      serviceCode,
      countryId,
      serviceName: serviceName || targetService.name,
      countryName: countryName || String(countryId),
      costPrice,
      sellPrice,
      activationId: buyRes.activationId,
      phone: buyRes.phone,
      virtualNumber: buyRes.phone,
      allocatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      identity: cleanIdentity,
    };

    await createOrderDirectAsync({
      id: orderId,
      userId: dbUser?.id,
      userEmail: dbUser?.email || (cleanIdentity.includes('@') ? cleanIdentity : `${cleanIdentity}@maxbazar.user`),
      serviceId: `sms_${serviceCode}_${countryId}`,
      serviceName: `مەۋھۇم نومۇر - ${serviceName || targetService.nameUg || serviceCode} (${countryName || countryId})`,
      packageTitle: `${targetService.name || serviceCode} SMS Verification`,
      amount: sellPrice,
      targetAccount: buyRes.phone,
      status: 'processing',
      createdAt: new Date().toISOString(),
      details,
    });

    saveMicroAppOrder({
      order_id: orderId,
      app_id: 'sms',
      identity: cleanIdentity,
      phone: buyRes.phone,
      service_code: serviceCode,
      country_id: countryId,
      price: sellPrice,
      status: 'processing',
      activation_id: buyRes.activationId,
      created_at: new Date().toISOString(),
    });

    // Notify Telegram Admin
    notifyNewOrder({
      id: orderId,
      serviceName: `مەۋھۇم نومۇر - ${serviceName || targetService.nameUg || serviceCode}`,
      packageTitle: `${targetService.name || serviceCode} (${countryName || countryId})`,
      amount: sellPrice,
      userEmail: dbUser?.email || cleanIdentity,
      userName: dbUser?.name || cleanIdentity,
      targetAccount: buyRes.phone,
      status: 'processing',
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      orderId,
      activationId: buyRes.activationId,
      phone: buyRes.phone,
      sellPrice,
      newBalance,
      current_balance: newBalance,
      expiresAt: Date.now() + 15 * 60 * 1000,
      message: 'مەۋھۇم نومۇر مۇۋەپپەقىيەتلىك تەقسىملەندى',
    });
  } catch (err: any) {
    console.error('[SMS Buy Error]:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'نومۇر سېتىۋېلىشتا كۈتۈلمىگەن خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}
