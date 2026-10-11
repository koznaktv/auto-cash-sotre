import { NextResponse } from 'next/server';
import {
  getAllDepositsAsync,
  createDepositAsync,
  updateDepositStatusAsync,
  getUserByEmailAsync,
  getUserByIdAsync,
} from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    let deposits = await getAllDepositsAsync();
    if (userId) {
      deposits = deposits.filter((d) => d.userId === userId);
    } else if (userEmail) {
      deposits = deposits.filter(
        (d) => d.userEmail?.toLowerCase() === userEmail.toLowerCase()
      );
    }

    return NextResponse.json({ success: true, deposits });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تالونلارنى ئېلىشتا خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, method, txId, userName, userEmail, userId } = body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'سومما توغرا كىرگۈزۈلمىدى' },
        { status: 400 }
      );
    }

    let resolvedUserId = userId;
    let resolvedUserName = userName || 'خېرىدار';
    let resolvedUserEmail = userEmail || 'client@autocash.shop';

    if (resolvedUserId) {
      const u = await getUserByIdAsync(resolvedUserId);
      if (u) {
        resolvedUserName = u.name;
        resolvedUserEmail = u.email;
      }
    } else if (resolvedUserEmail) {
      const u = await getUserByEmailAsync(resolvedUserEmail);
      if (u) {
        resolvedUserId = u.id;
        resolvedUserName = u.name;
      }
    }

    const newDeposit = await createDepositAsync({
      userId: resolvedUserId,
      userName: resolvedUserName,
      userEmail: resolvedUserEmail,
      method: method || 'شامكەش (Sham Cash)',
      amount: parsedAmount,
      status: 'pending', // Pending admin verification!
      txId: txId || `SC-${Math.floor(10000000 + Math.random() * 90000000)}`,
    });

    return NextResponse.json({ success: true, deposit: newDeposit });
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

    if (status !== 'completed' && status !== 'rejected') {
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
    return NextResponse.json(
      { success: false, message: err?.message || 'ھالەتنى يېڭىلاش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
