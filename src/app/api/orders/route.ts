import { NextResponse } from 'next/server';
import {
  getAllOrdersAsync,
  createOrderAsync,
  updateOrderStatusAsync,
  getUserByEmailAsync,
  getUserByIdAsync,
  adjustUserBalanceAsync,
  OrderRecord,
} from '@/lib/db';
import { SERVICES_DATA } from '@/lib/data';
import { verifyAdminToken } from '@/lib/adminAuth';

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

    // Check user and balance (Authentication is strictly required)
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

    if (resolvedUser.balance < pkg.price) {
      return NextResponse.json(
        {
          success: false,
          message: `ھەميان قالدۇقى يەتمىدى! ھازىرقى قالدۇقىڭىز $${resolvedUser.balance.toFixed(2)}، تەلەپ قىلىنغىنى $${pkg.price.toFixed(2)}. ئالدى بىلەن پۇل كىرگۈزۈڭ.`,
        },
        { status: 400 }
      );
    }

    // Deduct balance
    await adjustUserBalanceAsync(resolvedUser.id, -pkg.price);

    let generatedDetails: OrderRecord['details'] = {};

    if (service.category === 'numbers') {
      const randomUS = `+1 (${Math.floor(200 + Math.random() * 700)}) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
      generatedDetails = {
        virtualNumber: randomUS,
        smsCode: 'كود كۈتۈلمەكتە (تەخمىنەن 10-30 سېكۇنت)...',
      };
    } else if (service.category === 'cards') {
      const cardNum = `4242 84${Math.floor(10 + Math.random() * 89)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
      generatedDetails = {
        cardDetails: {
          number: cardNum,
          exp: '12/28',
          cvv: `${Math.floor(100 + Math.random() * 900)}`,
        },
      };
    } else if (service.category === 'ai') {
      generatedDetails = {
        accountCredentials: `${targetAccount} ھېساباتىغا سىستېما تەرىپىدىن تولۇقلاش تەستىق باسقۇچىغا ئۆتتى.`,
      };
    }

    const newOrder = await createOrderAsync({
      userId: resolvedUser?.id,
      userEmail: resolvedUser?.email || userEmail,
      serviceId: service.id,
      serviceName: service.name,
      packageTitle: pkg.title,
      amount: pkg.price,
      targetAccount: targetAccount || 'تەلەپ قىلىنمىغان',
      status: service.category === 'numbers' ? 'processing' : 'completed',
      details: generatedDetails,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      newBalance: resolvedUser ? resolvedUser.balance - pkg.price : undefined,
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
