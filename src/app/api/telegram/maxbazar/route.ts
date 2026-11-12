import { NextResponse } from 'next/server';
import { handleMaxBazarWebhook, callMaxBazarBotApi } from '@/lib/maxbazarBot';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const processedUpdateIds = new Map<number, number>();

export async function POST(req: Request) {
  try {
    const update = await req.json();
    if (update && typeof update.update_id === 'number') {
      const lastSeen = processedUpdateIds.get(update.update_id);
      if (lastSeen && Date.now() - lastSeen < 120000) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      processedUpdateIds.set(update.update_id, Date.now());
      if (processedUpdateIds.size > 500) {
        const cutoff = Date.now() - 120000;
        processedUpdateIds.forEach((time, id) => {
          if (time < cutoff) processedUpdateIds.delete(id);
        });
      }
    }
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
