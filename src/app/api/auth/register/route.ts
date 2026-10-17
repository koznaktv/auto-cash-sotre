import { NextResponse } from 'next/server';
import { createUserAsync, getUserByEmailAsync } from '@/lib/db';
import { setSessionCookie, toSafeUser } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: 'ئېلخەت ئادرېسى خاتا' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'پارول ئەڭ ئاز بولغاندا 6 ھەرپ بولۇشى كېرەك' },
        { status: 400 }
      );
    }

    const existing = await getUserByEmailAsync(email);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'بۇ ئېلخەت ئادرېسى بىلەن ئاللىقاچان ھېسابات ئېچىلغان' },
        { status: 400 }
      );
    }

    const newUser = await createUserAsync({
      name: typeof name === 'string' && name.trim() ? name : email.split('@')[0],
      email,
      password,
      phone: typeof phone === 'string' ? phone : undefined,
    });

    const response = NextResponse.json({ success: true, user: toSafeUser(newUser) });
    setSessionCookie(response, newUser.id);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تىزىملىتىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
