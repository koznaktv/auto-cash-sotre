import { NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import {
  deductBalanceAndCreateOrderAtomicAsync,
  refundOrderBalanceAtomicAsync,
  updateOrderAsync,
  randomId,
} from '@/lib/db';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';
import { notifyNewOrder } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: 'مەلۇمات خاتا يوللاندى' }, { status: 400 });
    }

    const { serviceCode, countryId, serviceName, countryName } = body;
    if (!serviceCode || countryId === undefined) {
      return NextResponse.json(
        { success: false, message: 'مۇلازىمەت ياكى دۆلەت كودى تەمىنلەنمىدى' },
        { status: 400 }
      );
    }

    // 1. Fetch live service price to ensure exact 20% margin calculation
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

    // Check user balance
    const userBalance = Number(user.balance || 0);
    if (userBalance < sellPrice) {
      return NextResponse.json(
        {
          success: false,
          message: `ھېساباتىڭىزدىكى قالدۇق پۇل يېتىشمىدى. باھاسى: $${sellPrice}، قالدۇقىڭىز: $${userBalance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // 2. Atomically deduct wallet balance and create order
    const orderId = randomId('SMS');
    const atomicRes = await deductBalanceAndCreateOrderAtomicAsync({
      userId: user.id,
      userEmail: user.email,
      orderId,
      serviceId: `sms_${serviceCode}_${countryId}`,
      serviceName: `مەۋھۇم نومۇر - ${serviceName || targetService.nameUg || serviceCode} (${countryName || countryId})`,
      packageTitle: `${targetService.name || serviceCode} SMS Verification`,
      amount: sellPrice,
      targetAccount: 'نومۇر ئېلىنىۋاتىدۇ...',
      initialStatus: 'processing',
      details: {
        isSmsActivation: true,
        serviceCode,
        countryId,
        serviceName: serviceName || targetService.name,
        countryName: countryName || String(countryId),
        costPrice,
        sellPrice,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
    });

    if (!atomicRes.success || !atomicRes.order) {
      return NextResponse.json(
        { success: false, message: atomicRes.message || 'زاكاز قۇرۇش مەغلۇپ بولدى' },
        { status: 400 }
      );
    }

    // 3. Request virtual number from PhoneCash API
    const buyRes = await phonecashProvider.buyNumber(serviceCode, Number(countryId));

    if (!buyRes.success || !buyRes.activationId || !buyRes.phone) {
      // Auto-refund atomically since provider did not deliver
      console.warn('[PhoneCash] buyNumber failed, refunding user:', buyRes.error);
      await refundOrderBalanceAtomicAsync(
        orderId,
        buyRes.error || 'تەمىنلىگۈچىدىن نومۇر چىقمىدى (پۇل قايتۇرۇلدى)',
        true
      ).catch((refErr) => console.error('[PhoneCash] Refund Error:', refErr));

      return NextResponse.json(
        {
          success: false,
          message: buyRes.error || 'نومۇر ئېلىش مەغلۇپ بولدى، پۇلىڭىز ھېساباتىڭىزغا قايتۇرۇلدى',
        },
        { status: 502 }
      );
    }

    // 4. Update order with allocated phone and activation ID
    const updatedDetails = {
      ...(atomicRes.order.details || {}),
      activationId: buyRes.activationId,
      phone: buyRes.phone,
      allocatedAt: new Date().toISOString(),
    };

    await updateOrderAsync(orderId, {
      status: 'processing',
      detailsPatch: {
        targetAccount: buyRes.phone,
        ...updatedDetails,
      },
    });

    // Notify Telegram Admin
    notifyNewOrder({
      id: orderId,
      serviceName: atomicRes.order.serviceName,
      packageTitle: atomicRes.order.packageTitle,
      amount: sellPrice,
      userEmail: user.email,
      userName: user.name,
      targetAccount: buyRes.phone,
      status: 'processing',
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      orderId,
      activationId: buyRes.activationId,
      phone: buyRes.phone,
      sellPrice,
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
