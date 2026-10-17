import { NextResponse } from 'next/server';
import { getUserByEmailAsync, verifyPassword } from '@/lib/db';
import { setSessionCookie, toSafeUser } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'ئېلخەت ۋە پارولنى كىرگۈزۈڭ' },
        { status: 400 }
      );
    }

    const user = await getUserByEmailAsync(email);
    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      return NextResponse.json(
        { success: false, message: 'ئېلخەت ئادرېسى ياكى پارول خاتا' },
        { status: 401 }
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, message: 'بۇ ھېسابات توختىتىلغان' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ success: true, user: toSafeUser(user) });
    setSessionCookie(response, user.id);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'كىرىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
