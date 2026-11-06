import fs from 'fs';
import path from 'path';
import { verifySyncSession } from './syncSessions';
import { createAdminToken } from './adminAuth';

/**
 * MAX-BAZAR Telegram Mini App Bot Service
 * Bot: @maxbazar_bot
 */

const MAXBAZAR_BOT_TOKEN =
  (process.env.MAXBAZAR_BOT_TOKEN || '9030046429:AAFNApZlCn8JoafL1B1P6A81aOgqk_srlC0').trim();

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

        // Also save incoming chat messages to log
        if (text) {
          const logsFile = path.join(SESSIONS_DIR, 'bot_chat_logs.json');
          let logs: any[] = [];
          if (fs.existsSync(logsFile)) {
            try {
              logs = JSON.parse(fs.readFileSync(logsFile, 'utf-8'));
            } catch {}
          }
          logs.push({
            time: new Date().toISOString(),
            chatId,
            username,
            firstName,
            text,
          });
          if (logs.length > 300) logs = logs.slice(-300);
          fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2), 'utf-8');
        }
      } catch {}
    }

    // Handle /start sync_XXXX (Instant 1-Click App Linking from Phone)
    const syncMatch = text.match(/^\/start\s+(sync_[a-zA-Z0-9_]+)/);
    if (syncMatch) {
      const syncToken = syncMatch[1];
      const verified = await verifySyncSession(syncToken, {
        username: message.from?.username,
        firstName: message.from?.first_name,
        chatId,
      });

      if (verified) {
        const appName = verified.app_id === 'honor-of-kings' ? 'Honor of Kings' : 'PUBG Mobile UC';
        const appUrl = `${SITE_URL}/apps/${verified.app_id || 'pubg'}?sync_token=${syncToken}`;

        await callMaxBazarBotApi('sendMessage', {
          chat_id: chatId,
          text:
            `🎉 *ھېساباتىڭىز تېلېفوندىكى ئەپكە دەرھال ئۇلاندى!*\n\n` +
            `🎮 ئەپ: *${appName}*\n` +
            `👤 كىملىكىڭىز: *${verified.identity}*\n` +
            `💰 قالدۇقىڭىز: *$${verified.balance.toFixed(2)}*\n\n` +
            `📱 تېلېفوندىكى ئەپىڭىز ئۆزلۈكىدىن كىردى، ئەپكە قايتىپ بىمالال داۋاملاشتۇرۇڭ.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📱 ئەپكە قايتىش',
                  url: appUrl,
                },
              ],
            ],
          },
        });
      }
      return;
    }

    const ADMIN_CHAT_ID = String(process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493');
    const ADMIN_USERNAME = (process.env.TELEGRAM_ADMIN_USERNAME || 'nasrulla0996').toLowerCase().replace(/^@/, '');
    const isAdmin = String(chatId) === ADMIN_CHAT_ID || (Boolean(username) && username === ADMIN_USERNAME);

    // Dedicated Admin command handler: /admin or /manage or 'باشقۇرۇش'
    if (text === '/admin' || text === '/manage' || text === 'باشقۇرۇش' || text === 'باش تاختا') {
      if (!isAdmin) {
        await callMaxBazarBotApi('sendMessage', {
          chat_id: chatId,
          text: '⚠️ *كەچۈرۈڭ، بۇ مەشغۇلات پەقەت ئاساسىي دۇكان باشقۇرغۇچىسىغىلا مەخسۇس ئېچىۋېتىلگەن.*',
          parse_mode: 'Markdown',
        });
        return;
      }

      const adminToken = createAdminToken();
      const adminMaxBazarUrl = `${SITE_URL}/admin?tab=maxbazar&token=${adminToken}`;

      await callMaxBazarBotApi('sendMessage', {
        chat_id: chatId,
        text:
          `👑 *ھۆرمەتلىك دۇكان باشقۇرغۇچىسى @${ADMIN_USERNAME}!*\n\n` +
          `📱 *MAX-BAZAR ۋە AUTO CASH باشقۇرغۇچى مەركىزى*\n` +
          `(Auto Cash تۈزۈلۈشى بويىچە MAX-BAZAR باش تاختىسى)\n\n` +
          `• بارلىق ئەپلەرنىڭ (PUBG, HOK, MLBB, MTN, Syriatel) زاكازلىرىنى بىۋاسىتە باشقۇرۇش\n` +
          `• تەمىنلىگۈچى (MaxStore) ھالىتىنى تەكشۈرۈش ۋە زاكازلارنى تاماملاش\n` +
          `• تېلېگرامما قانىلىغا «📢 قانالغا» كۇنۇپكىسى بىلەن 1لا بېسىپ تالون چىقىرىش\n\n` +
          `تۆۋەندىكى كۇنۇپكىنى بېسىپ دەرھال باشقۇرۇش كۆزنىكىگە كىرىڭ:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📱 👑 MAX-BAZAR باش تاختىسىغا كىرىش (تېلېگرامدا ئېچىش)',
                web_app: { url: adminMaxBazarUrl },
              },
            ],
            [
              {
                text: '🌐 تور كۆرگۈچتە ئېچىش (Chrome / Safari)',
                url: adminMaxBazarUrl,
              },
            ],
          ],
        },
      });
      return;
    }

    // Handle /start or any message
    let welcomeText =
      `🛍️ *MAX-BAZAR رەسمىي بوت سىستېمىسىغا كەلگىنىڭىزنى قارشى ئالىمىز!*\n\n` +
      `تۆۋەندىكى تۈگمىلەردىن بىرىنى تاللاپ دەرھال كىرىڭ:`;

    if (isAdmin) {
      welcomeText =
        `👑 *ئەسسالامۇ ئەلەيكۇم ھۆرمەتلىك باشقۇرغۇچى (@${ADMIN_USERNAME})!*\n\n` +
        `MAX-BAZAR ۋە AUTO CASH سىستېمىسى خىزمىتىڭىزگە تەييار.\n` +
        `📱 سىزنىڭ تېلېگرامما ئادرىسىڭىز ئۈچۈن مەخسۇس تەييارلانغان *MAX-BAZAR باش تاختىسى* كۇنۇپكىسى تۆۋەندە ئېچىلدى:`;
    }

    const autoCashUrl = SITE_URL;
    const maxBazarUrl = `${SITE_URL}/apps`;

    const inlineKeyboard: any[] = [
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
    ];

    // ONLY SHOW THIS BUTTON FOR THE ADMIN'S TELEGRAM ACCOUNT!
    if (isAdmin) {
      const adminToken = createAdminToken();
      const adminMaxBazarUrl = `${SITE_URL}/admin?tab=maxbazar&token=${adminToken}`;
      inlineKeyboard.push([
        {
          text: '📱 3. 👑 باشقۇرغۇچى مەركىزى (MAX-BAZAR باش تاختىسى)',
          web_app: { url: adminMaxBazarUrl },
        },
      ]);
      inlineKeyboard.push([
        {
          text: '🌐 باشقۇرۇش مەركىزىنى كۆرگۈچتە ئېچىش',
          url: adminMaxBazarUrl,
        },
      ]);
    }

    await callMaxBazarBotApi('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  } catch (err: any) {
    console.error('[handleMaxBazarWebhook Error]:', err?.message);
  }
}
