import { NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import { createTelegramLinkUrl, unlinkTelegramAccount } from '@/lib/telegramLink';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
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
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { url } = createTelegramLinkUrl(user.id);

    return NextResponse.json({
      success: true,
      linkUrl: url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to generate link' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser(req);
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
