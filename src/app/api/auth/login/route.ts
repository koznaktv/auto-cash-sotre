import { NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'ئېلخەت ۋە پارولنى كىرگۈزۈڭ' },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ئېلخەت ئادرېسى ياكى پارول خاتا' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'ئېلخەت ئادرېسى ياكى پارول خاتا' },
        { status: 401 }
      );
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      totalSpent: user.totalSpent,
      vipTier: user.vipTier,
      role: user.role,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'كىرىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
