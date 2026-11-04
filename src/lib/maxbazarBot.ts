import fs from 'fs';
import path from 'path';

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
    const username = (message.from?.username || '').trim().replace(/^@/, '').toLowerCase();
    const text = (message.text || '').trim();
    const firstName = message.from?.first_name || 'صديقنا';

    // Auto-record Telegram user mapping for OTP dispatch
    if (chatId) {
      try {
        const SESSIONS_DIR = path.join(process.cwd(), 'data', 'micro_apps');
        if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
        const usersFile = path.join(SESSIONS_DIR, 'telegram_users.json');
        let users: Record<string, any> = {};
        if (fs.existsSync(usersFile)) {
          users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
        }
        if (username) {
          users[username] = String(chatId);
        }
        users[String(chatId)] = String(chatId);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
      } catch {}
    }

    // Handle /start, /hok or any message
    const welcomeText =
      `🛍️ *MAX-BAZAR رەسمىي تېلېگرامما Mini App دۇكىنىغا كەلگىنىڭىزنى قارشى ئالىمىز!*\n\n` +
      `🪖 *PUBG Mobile (پابجى كۆچمە نۇسخىسى)* ۋە ⚔️ *Honor of Kings* ئويۇنلىرى ئەڭ ئەرزان باھادا، سېكۇنتتا ئاپتوماتىك قاچىلىنىدۇ.\n` +
      `✦ كۆپ ھېساباتلارنى ساقلاش، شامكەش ئارقىلىق 100% بىخەتەر قالدۇق قاچىلاش سىستېمىسى تەييارلاندى.\n\n` +
      `⚡ *تۆۋەندىكى تۈگۈمىنى بېسىپ ئەپنى دەرھال ئېچىڭ:*`;

    const appsHubUrl = `${SITE_URL}/apps`;
    const pubgAppUrl = `${SITE_URL}/apps/pubg`;
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
              text: '🚀 MAX-BAZAR ئەپ بازىرى (بارلىق ئەپلەر)',
              web_app: { url: appsHubUrl },
            },
          ],
          [
            {
              text: '🪖 PUBG Mobile UC تېز قاچىلاش (Mini App)',
              web_app: { url: pubgAppUrl },
            },
          ],
          [
            {
              text: '⚔️ Honor of Kings تېز قاچىلاش (Mini App)',
              web_app: { url: hokAppUrl },
            },
          ],
          [
            {
              text: '🛍️ MAX-BAZAR كارتىلار دۇكىنى',
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
