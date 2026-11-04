import { NextResponse } from 'next/server';
import { handleMaxBazarWebhook, callMaxBazarBotApi } from '@/lib/maxbazarBot';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const update = await req.json();
    await handleMaxBazarWebhook(update);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[MaxBazar Webhook Error]:', err?.message);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 200 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'setWebhook') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.auto-cash.app';
    const webhookUrl = `${siteUrl}/api/telegram/maxbazar`;
    const res = await callMaxBazarBotApi('setWebhook', { url: webhookUrl });
    return NextResponse.json({ ok: true, webhookUrl, telegramResponse: res });
  }

  if (action === 'setMenuButton') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.auto-cash.app';
    const res = await callMaxBazarBotApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🛍️ MAX-BAZAR',
        web_app: { url: `${siteUrl}/maxbazar` },
      },
    });
    return NextResponse.json({ ok: true, telegramResponse: res });
  }

  const info = await callMaxBazarBotApi('getMe', {});
  const webhookInfo = await callMaxBazarBotApi('getWebhookInfo', {});

  return NextResponse.json({
    status: 'online',
    bot: info,
    webhook: webhookInfo,
  });
}
