import { NextResponse } from 'next/server';
import { verifyTelegramWebAppData } from '@/lib/telegramAuthSessions';
import { getOrCreateTelegramUser } from '@/lib/telegramShop';
import { setSessionCookie, toSafeUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { initData } = body;

    if (!initData) {
      return NextResponse.json(
        { success: false, message: 'Telegram initData is required' },
        { status: 400 }
      );
    }

    const tgUser = verifyTelegramWebAppData(initData);
    if (!tgUser || !tgUser.id) {
      return NextResponse.json(
        { success: false, message: 'Telegram authentication failed / invalid signature' },
        { status: 401 }
      );
    }

    const user = await getOrCreateTelegramUser(
      tgUser.id,
      tgUser.username,
      tgUser.first_name || tgUser.username || `User_${tgUser.id}`
    );

    const res = NextResponse.json({
      success: true,
      user: toSafeUser(user),
    });

    setSessionCookie(res, user.id);
    return res;
  } catch (err: any) {
    console.error('[telegram-webapp-login] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Login failed' },
      { status: 500 }
    );
  }
}
