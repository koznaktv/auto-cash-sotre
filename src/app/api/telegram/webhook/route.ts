import { NextResponse } from 'next/server';
import {
  handleTelegramWebhook,
  sendAdminAlert,
  getBotToken,
  TELEGRAM_CONFIG,
} from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/**
 * Telegram Webhook Handler (POST)
 */
export async function POST(req: Request) {
  try {
    const update = await req.json();
    await handleTelegramWebhook(update);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Telegram Webhook Error]:', err?.message);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 200 });
  }
}

/**
 * Diagnostic & Setup Endpoint (GET)
 * - /api/telegram/webhook?action=setWebhook
 * - /api/telegram/webhook?action=test
 * - /api/telegram/webhook?action=status
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const token = getBotToken();

  if (!token) {
    return NextResponse.json({
      success: false,
      message: 'TELEGRAM_BOT_TOKEN تېخى سەپلەنمىگەن (.env.local ياكى Vercel غا قوشۇڭ)',
      config: {
        botUsername: TELEGRAM_CONFIG.botUsername,
        adminUsername: TELEGRAM_CONFIG.adminUsername,
        adminChatId: TELEGRAM_CONFIG.adminChatId,
      },
    });
  }

  // 1. Set Webhook & Menu Button
  if (action === 'setWebhook') {
    const webhookUrl = `${TELEGRAM_CONFIG.storeUrl}/api/telegram/webhook`;
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=["message","callback_query"]`
      );
      const data = await res.json();

      // Configure Chat Menu Button (Default clean input box without overlapping pill)
      let menuButtonOk = false;
      try {
        const menuRes = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_button: {
              type: 'default',
            },
          }),
        });
        const menuData = await menuRes.json();
        menuButtonOk = Boolean(menuData.ok);
      } catch {}

      return NextResponse.json({
        success: data.ok,
        telegramResponse: data,
        menuButtonConfigured: menuButtonOk,
        webhookUrl,
        botUsername: TELEGRAM_CONFIG.botUsername,
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
    }
  }

  // 2. Test Alert
  if (action === 'test') {
    try {
      const sent = await sendAdminAlert(`
🤖 <b>AUTO CASH تېلېگرام سىستېمىسى سىناق ئۇچۇرى</b>
━━━━━━━━━━━━━━━━━━
ئەسسالامۇ ئەلەيكۇم، ھۆرمەتلىك باشقۇرغۇچى @${TELEGRAM_CONFIG.adminUsername}!
AUTO CASH تېلېگرام بوتى مۇۋەپپەقىيەتلىك ئۇلاندى.
ئەمدى يېڭى زاكاز ۋە پۇل كىرگۈزۈش تالونلىرى شۇئان سىزگە يەتكۈزۈلىدۇ.
⏰ ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
`.trim());

      return NextResponse.json({
        success: sent,
        message: sent ? 'سىناق ئۇچۇرى باشقۇرغۇچىنىڭ تېلېگرام ھېسابىغا ئەۋەتىلدى!' : 'ئۇچۇر ئەۋەتىش مەغلۇپ بولدى',
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
    }
  }

  // 3. Status check
  try {
    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const info = await infoRes.json();

    const webhookRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const webhookInfo = await webhookRes.json();

    return NextResponse.json({
      success: true,
      bot: info?.result,
      webhook: webhookInfo?.result,
      admin: {
        username: TELEGRAM_CONFIG.adminUsername,
        chatId: TELEGRAM_CONFIG.adminChatId,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
