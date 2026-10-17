import { NextResponse } from 'next/server';
import {
  getAllDepositsAsync,
  getDepositsByUserIdAsync,
  createDepositAsync,
  updateDepositStatusAsync,
  DepositReviewError,
} from '@/lib/db';
import { verifyAdminToken, hasAdminBearer } from '@/lib/adminAuth';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';

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
        { success: false, message: 'سومما توغرا كىرگۈزۈلمىدى' },
        { status: 400 }
      );
    }

    const newDeposit = await createDepositAsync({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      method: typeof method === 'string' && method.trim() ? method.trim().slice(0, 60) : 'شامكەش (Sham Cash)',
      amount: parsedAmount,
      // Pending admin verification!
      txId:
        typeof txId === 'string' && txId.trim()
          ? txId.trim().slice(0, 64)
          : `SC-${Math.floor(10000000 + Math.random() * 90000000)}`,
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
