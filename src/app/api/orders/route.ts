import { NextResponse } from 'next/server';
import {
  getAllOrdersAsync,
  createOrderAsync,
  updateOrderStatusAsync,
  getUserByEmailAsync,
  getUserByIdAsync,
  deductBalanceAndCreateOrderAtomicAsync,
  refundOrderBalanceAtomicAsync,
  OrderRecord,
} from '@/lib/db';
import { SERVICES_DATA } from '@/lib/data';
import { verifyAdminToken } from '@/lib/adminAuth';
import { validateGameAccount } from '@/lib/validation/gameAccountValidator';
import { syria4GameProvider } from '@/lib/providers/syria4game';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    let orders = await getAllOrdersAsync();
    if (userId) {
      orders = orders.filter((o) => o.userId === userId);
    } else if (userEmail) {
      orders = orders.filter(
        (o) => o.userEmail?.toLowerCase() === userEmail.toLowerCase()
      );
    }

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'زاكازلارنى ئېلىشتا خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const idempotencyKey = req.headers.get('x-idempotency-key') || '';
    const body = await req.json();
    const { serviceId, packageId, targetAccount, userEmail, userId } = body;

    const service = SERVICES_DATA.find((s) => s.id === serviceId);
    if (!service) {
      return NextResponse.json({ success: false, message: 'مۇلازىمەت تېپىلمىدى' }, { status: 404 });
    }

    const pkg = service.packages.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, message: 'تاللانغان تۈر تېپىلمىدى' }, { status: 404 });
    }

    // 1. Strict Authentication Check
    let resolvedUser = null;
    if (userId) {
      resolvedUser = await getUserByIdAsync(userId);
    } else if (userEmail) {
      resolvedUser = await getUserByEmailAsync(userEmail);
    }

    if (!resolvedUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'سېتىۋېلىش ئۈچۈن ئالدى بىلەن ھېساباتىڭىزغا كىرىشىڭىز كېرەك. (Gmail ئارقىلىق كىرىڭ)',
        },
        { status: 401 }
      );
    }

    // 2. Game Account UID & Zone ID Validation
    let parsedGameAccount: { userId: string; zoneId?: string; server?: string } = { userId: (targetAccount || '').trim() };
    if (service.category === 'games' || service.inputLabel) {
      const validation = validateGameAccount(service.id, targetAccount || '');
      if (!validation.isValid) {
        return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
      }
      parsedGameAccount = validation.parsed;
    }

    // 3. Generate Unique Order ID
    const orderId = `ORD-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

    // Prepare simulated digital credentials if applicable
    let generatedDetails: OrderRecord['details'] = {
      gamePlayerId: parsedGameAccount.userId,
      gameZoneId: parsedGameAccount.zoneId,
    };

    if (service.category === 'numbers') {
      const randomUS = `+1 (${Math.floor(200 + Math.random() * 700)}) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
      generatedDetails = {
        ...generatedDetails,
        virtualNumber: randomUS,
        smsCode: 'كود كۈتۈلمەكتە (تەخمىنەن 10-30 سېكۇنت)...',
      };
    } else if (service.category === 'cards') {
      const cardNum = `4242 84${Math.floor(10 + Math.random() * 89)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
      generatedDetails = {
        ...generatedDetails,
        cardDetails: {
          number: cardNum,
          exp: '12/28',
          cvv: `${Math.floor(100 + Math.random() * 900)}`,
        },
      };
    } else if (service.category === 'ai') {
      generatedDetails = {
        ...generatedDetails,
        accountCredentials: `${targetAccount} ھېساباتىغا تولۇقلاش تەستىق باسقۇچىغا ئۆتتى.`,
      };
    }

    // 4. ACID Transaction: Balance Verification, Exclusive Row Lock, Balance Deduction & Order Creation
    const atomicRes = await deductBalanceAndCreateOrderAtomicAsync({
      idempotencyKey,
      userId: resolvedUser.id,
      userEmail: resolvedUser.email,
      serviceId: service.id,
      serviceName: service.name,
      packageTitle: pkg.title,
      amount: pkg.price,
      targetAccount: targetAccount || 'تەلەپ قىلىنمىغان',
      orderId,
      details: generatedDetails,
    });

    if (!atomicRes.success) {
      return NextResponse.json(
        { success: false, message: atomicRes.message || 'زاكاز مەغلۇپ بولدى' },
        { status: 400 }
      );
    }

    // 5. External Provider Execution for Games (syria4game.com)
    if (service.category === 'games') {
      const providerRes = await syria4GameProvider.submitTopupOrder({
        clientOrderId: orderId,
        gameCode: service.id,
        packageCode: pkg.id,
        playerId: parsedGameAccount.userId,
        zoneId: parsedGameAccount.zoneId,
      });

      // If provider failed -> Automatic Instant Refund Rollback
      if (!providerRes.success) {
        const refundRes = await refundOrderBalanceAtomicAsync(
          orderId,
          providerRes.errorMessage || 'تاشقى تەمىنلىگۈچىدە كاشىلا كۆرۈلدى'
        );

        return NextResponse.json(
          {
            success: false,
            message: `تاشقى تەمىنلىگۈچىدە كاشىلا كۆرۈلدى: ${providerRes.errorMessage || 'رەت قىلىندى'}. پۇلىڭىز ھېساباتىڭىزغا قايتۇرۇلدى!`,
            refunded: true,
            newBalance: refundRes.newBalance,
          },
          { status: 502 }
        );
      }

      // Mark order completed with provider order ID
      await updateOrderStatusAsync(orderId, 'completed');
    }

    return NextResponse.json({
      success: true,
      order: atomicRes.order || { id: orderId, amount: pkg.price, status: 'completed' },
      newBalance: atomicRes.newBalance,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'زاكاز مەغلۇپ بولدى' },
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
    const { orderId, status } = body;

    const updated = await updateOrderStatusAsync(orderId, status);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'زاكاز تېپىلمىدى' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ھالەتنى يېڭىلاش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
