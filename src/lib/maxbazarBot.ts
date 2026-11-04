/**
 * MAX-BAZAR Telegram Mini App Bot Service
 * Bot: @maxbazar_bot
 */

const MAXBAZAR_BOT_TOKEN =
  process.env.MAXBAZAR_BOT_TOKEN || '9030046429:AAGgis0NFr7PPAZpsri7AJbvckZboj81J7c';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.auto-cash.app';

export async function callMaxBazarBotApi(method: string, payload: any) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${MAXBAZAR_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    console.error(`[MaxBazar Bot API Error] ${method}:`, err?.message);
    return { ok: false, error: err?.message };
  }
}

export async function handleMaxBazarWebhook(update: any) {
  try {
    if (!update) return;

    const message = update.message;
    if (!message || !message.chat) return;

    const chatId = message.chat.id;
    const text = (message.text || '').trim();
    const firstName = message.from?.first_name || 'صديقنا';

    // Handle /start, /hok or any message
    const welcomeText =
      `🛍️ *MAX-BAZAR رەسمىي تېلېگرامما Mini App دۇكىنىغا كەلگىنىڭىزنى قارشى ئالىمىز!*\n\n` +
      `✦ *Honor of Kings (داڭلىقلار سەپىرى)* ئويۇن توكېنلىرى ئەڭ ئەرزان باھادا، سېكۇنتتا ئاپتوماتىك قاچىلىنىدۇ.\n` +
      `✦ كۆپ ھېساباتلارنى ساقلاش، شامكەش ئارقىلىق 100% بىخەتەر قالدۇق قاچىلاش سىستېمىسى تەييارلاندى.\n\n` +
      `⚡ *تۆۋەندىكى تۈگۈمىنى بېسىپ ئەپنى دەرھال ئېچىڭ:*`;

    const hokAppUrl = `${SITE_URL}/apps/honor-of-kings`;
    const maxbazarAppUrl = `${SITE_URL}/maxbazar`;

    await callMaxBazarBotApi('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⚔️ Honor of Kings تېز قاچىلاش (Mini App)',
              web_app: { url: hokAppUrl },
            },
          ],
          [
            {
              text: '🛍️ MAX-BAZAR باش دۇكان (تولۇق كۆرۈش)',
              web_app: { url: maxbazarAppUrl },
            },
          ],
          [
            {
              text: '🌐 AUTO CASH باش سۇپا',
              url: SITE_URL,
            },
          ],
          [
            {
              text: '💬 باشقۇرغۇچى بىلەن ئالاقىلىشىش',
              url: 'https://t.me/nasrulla0996',
            },
            {
              text: '📢 رەسمىي قانال',
              url: 'https://t.me/autocash_cannel',
            },
          ],
        ],
      },
    });
  } catch (err: any) {
    console.error('[handleMaxBazarWebhook Error]:', err?.message);
  }
}
