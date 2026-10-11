import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'ئېلخەت ئادرېسى خاتا' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'پارول ئەڭ ئاز بولغاندا 6 ھەرپ بولۇشى كېرەك' },
        { status: 400 }
      );
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'بۇ ئېلخەت ئادرېسى بىلەن ئاللىقاچان ھېسابات ئېچىلغان' },
        { status: 400 }
      );
    }

    const newUser = createUser({
      name: name || email.split('@')[0],
      email,
      password,
      phone,
    });

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      balance: newUser.balance,
      totalSpent: newUser.totalSpent,
      vipTier: newUser.vipTier,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تىزىملىتىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
