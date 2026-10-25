import { NextResponse } from 'next/server';
import {
  createTelegramLoginSessionAsync,
  checkTelegramLoginSessionAsync,
} from '@/lib/telegramAuthSessions';
import { getUserByIdAsync } from '@/lib/db';
import { setSessionCookie, toSafeUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const { token, botUrl } = await createTelegramLoginSessionAsync();
    return NextResponse.json({
      success: true,
      token,
      botUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to create login session' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 });
    }

    const check = await checkTelegramLoginSessionAsync(token);
    if (!check.approved || !check.userId) {
      return NextResponse.json({
        success: true,
        approved: false,
        status: check.status,
      });
    }

    const user = await getUserByIdAsync(check.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const res = NextResponse.json({
      success: true,
      approved: true,
      user: toSafeUser(user),
    });

    setSessionCookie(res, user.id);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Check failed' },
      { status: 500 }
    );
  }
}
