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
        const IS_SERVERLESS = Boolean(
          process.env.VERCEL ||
          process.env.AWS_LAMBDA_FUNCTION_NAME ||
          (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
        );
        const SESSIONS_DIR = IS_SERVERLESS ? path.join('/tmp', 'micro_apps') : path.join(process.cwd(), 'data', 'micro_apps');
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

        // Also record in globalThis for instant in-memory lookup
        const globalStore = globalThis as any;
        if (!globalStore.__maxbazarUsers) globalStore.__maxbazarUsers = {};
        if (username) globalStore.__maxbazarUsers[username] = String(chatId);
        globalStore.__maxbazarUsers[String(chatId)] = String(chatId);
      } catch {}
    }

    // Handle /start or any message - strictly 2 clean buttons as requested
    const welcomeText =
      `🛍️ *MAX-BAZAR رەسمىي بوت سىستېمىسىغا كەلگىنىڭىزنى قارشى ئالىمىز!*\n\n` +
      `تۆۋەندىكى تۈگمىلەردىن بىرىنى تاللاپ دەرھال كىرىڭ:`;

    const autoCashUrl = SITE_URL;
    const maxBazarUrl = `${SITE_URL}/apps`;

    await callMaxBazarBotApi('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🌐 1. auto-cash.app تور بېكىتىگە كىرىش',
              url: autoCashUrl,
            },
          ],
          [
            {
              text: '🚀 2. MAX-BAZAR ئەپ بازىرىغا كىرىش',
              web_app: { url: maxBazarUrl },
            },
          ],
        ],
      },
    });
  } catch (err: any) {
    console.error('[handleMaxBazarWebhook Error]:', err?.message);
  }
}
