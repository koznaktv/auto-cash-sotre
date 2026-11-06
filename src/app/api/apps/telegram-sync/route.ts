import { NextResponse } from 'next/server';
import {
  createTelegramLoginSessionAsync,
  checkTelegramLoginSessionAsync,
} from '@/lib/telegramAuthSessions';
import { getUserByIdAsync } from '@/lib/db';
import { setSessionCookie, toSafeUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const syncToken = url.searchParams.get('sync_token') || url.searchParams.get('token');

    // 1. Action: create new sync session
    if (action === 'create' || !syncToken) {
      const customBot = process.env.MAXBAZAR_BOT_USERNAME || 'maxbazar_bot';
      const { token, botUrl } = await createTelegramLoginSessionAsync(customBot);
      return NextResponse.json({
        ok: true,
        success: true,
        sync_token: token,
        token,
        botUrl,
      });
    }

    // 2. Action: poll sync session
    const check = await checkTelegramLoginSessionAsync(syncToken);
    if (!check.approved || !check.userId) {
      return NextResponse.json({
        ok: true,
        authenticated: false,
        approved: false,
        status: check.status,
      });
    }

    const user = await getUserByIdAsync(check.userId);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'ئىشلەتكۈچى تېپىلمىدى' }, { status: 404 });
    }

    const sessionObj = {
      token: 'mb_' + user.id,
      identity: user.name || user.email || user.telegramUsername || 'User',
      balance: Number(user.balance) || 0,
      photo_url: user.avatarUrl || '',
      telegram_id: user.telegramChatId || '',
      user: toSafeUser(user),
    };

    const res = NextResponse.json({
      ok: true,
      authenticated: true,
      approved: true,
      session: sessionObj,
      user: toSafeUser(user),
    });

    setSessionCookie(res, user.id);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Sync operation failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
