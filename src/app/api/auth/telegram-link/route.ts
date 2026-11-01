import { NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import { getUserByIdAsync } from '@/lib/db';
import { createTelegramLinkUrl, unlinkTelegramAccount } from '@/lib/telegramLink';

export const dynamic = 'force-dynamic';

async function resolveUserFromRequest(req: Request): Promise<any> {
  const sessionUser = await getSessionUser(req);
  if (sessionUser) return sessionUser;

  try {
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get('userId');
    const headerUserId = req.headers.get('x-user-id');
    const uid = queryUserId || headerUserId;
    if (uid) {
      const user = await getUserByIdAsync(uid);
      if (user && !user.isBanned) return user;
    }
  } catch {}

  return null;
}

export async function GET(req: Request) {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const isLinked = Boolean(user.telegramChatId);
    let linkUrl: string | undefined;

    if (!isLinked) {
      const generated = createTelegramLinkUrl(user.id);
      linkUrl = generated.url;
    }

    return NextResponse.json({
      success: true,
      isLinked,
      telegramChatId: user.telegramChatId,
      telegramUsername: user.telegramUsername,
      telegramLinkedAt: user.telegramLinkedAt || (isLinked ? user.createdAt : undefined),
      linkUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to check telegram link' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try { body = await req.json(); } catch {}

    let user = await resolveUserFromRequest(req);
    if (!user && body?.userId) {
      user = await getUserByIdAsync(body.userId);
    }
    if (!user) return unauthorizedResponse();

    // 1. Verify 6-digit code if submitted
    if (body?.code) {
      const { verifyAndConsumeLinkCode } = await import('@/lib/telegramLink');
      const res = await verifyAndConsumeLinkCode(body.code, user.id);
      if (!res.success) {
        return NextResponse.json(
          { success: false, message: res.error || 'كود الربط غير صحيح أو منتهي الصلاحية' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        isLinked: true,
        mergedBalance: res.mergedBalance,
        telegramChatId: res.user?.telegramChatId,
        telegramUsername: res.user?.telegramUsername,
        telegramLinkedAt: res.user?.telegramLinkedAt,
      });
    }

    // 2. Otherwise generate 1-click link URL
    const { url } = createTelegramLinkUrl(user.id);

    return NextResponse.json({
      success: true,
      linkUrl: url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    let user = await resolveUserFromRequest(req);
    if (!user) {
      try {
        const body = await req.json();
        if (body?.userId) {
          user = await getUserByIdAsync(body.userId);
        }
      } catch {}
    }
    if (!user) return unauthorizedResponse();

    const unlinked = await unlinkTelegramAccount(user.id);

    return NextResponse.json({
      success: unlinked,
      message: unlinked ? 'تېلېگرامما ئالاقىسى بىكار قىلىندى' : 'بىكار قىلىش مەغلۇپ بولدى',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to unlink' },
      { status: 500 }
    );
  }
}
