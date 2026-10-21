/**
 * Telegram Bot & Notification Service for AUTO CASH
 * Bot: @Autocash_store_bot
 * Admin: @nasrulla0996 (ID: 7575664493)
 */

export const TELEGRAM_CONFIG = {
  botUsername: 'Autocash_store_bot',
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493',
  adminUsername: 'nasrulla0996',
  storeUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://auto-cash-sotre.vercel.app',
};

export function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || '8896726108:AAEpcnmK5Chmu5RxXLWoK0M34bkIHjQbeck';
}

/**
 * Send raw Telegram message via Bot API
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    reply_markup?: any;
    disable_web_page_preview?: boolean;
  } = {}
): Promise<{ ok: boolean; description?: string; result?: any }> {
  const token = getBotToken();
  if (!token) {
    console.warn('[Telegram] BOT_TOKEN is not configured in environment variables');
    return { ok: false, description: 'TELEGRAM_BOT_TOKEN missing' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode || 'HTML',
        disable_web_page_preview: options.disable_web_page_preview ?? true,
        reply_markup: options.reply_markup,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram] API error:', data.description);
    }
    return data;
  } catch (err: any) {
    console.error('[Telegram] Network exception:', err?.message);
    return { ok: false, description: err?.message };
  }
}

/**
 * Send instant alert to the Admin Telegram account (@nasrulla0996)
 */
export async function sendAdminAlert(htmlMessage: string, replyMarkup?: any): Promise<boolean> {
  const res = await sendTelegramMessage(TELEGRAM_CONFIG.adminChatId, htmlMessage, {
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
  return res.ok;
}

/**
 * Notify Admin when a customer places an order
 */
export async function notifyNewOrder(order: {
  id: string;
  serviceName?: string;
  packageTitle?: string;
  amount: number | string;
  userName?: string;
  userEmail?: string;
  targetAccount?: string;
  status?: string;
  fields?: Record<string, any>;
}): Promise<void> {
  try {
    const fieldsText = order.fields && Object.keys(order.fields).length > 0
      ? Object.entries(order.fields)
          .map(([k, v]) => `  • <b>${k}:</b> <code>${v}</code>`)
          .join('\n')
      : '';

    const message = `
⚡️ <b>يېڭى زاكاز چۈشتى! | New Order Placed</b> ⚡️
━━━━━━━━━━━━━━━━━━
🆔 <b>زاكاز نومۇرى:</b> <code>${order.id}</code>
🎮 <b>مەھسۇلات:</b> <b>${order.serviceName || 'مەھسۇلات'}</b> - ${order.packageTitle || ''}
💰 <b>سوممىسى:</b> <b>$${Number(order.amount || 0).toFixed(2)} USD</b>
🎯 <b>قاچىلاش ھېساباتى / ID:</b> <code>${order.targetAccount || '—'}</code>
${fieldsText ? `📝 <b>ئۇچۇرلار:</b>\n${fieldsText}\n` : ''}👤 <b>خېرىدار:</b> ${order.userName || 'ئەزا'} (<code>${order.userEmail || '—'}</code>)
📊 <b>ھالىتى:</b> ⏳ <b>${order.status || 'سۈرۈشتۈرۈلمەكتە'}</b>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
🔗 <a href="${TELEGRAM_CONFIG.storeUrl}/admin">باشقۇرۇش مەركىزىدىن كۆرۈش</a>
`.trim();

    await sendAdminAlert(message, {
      inline_keyboard: [
        [
          { text: '🛒 دۇكانغا كىرىش', url: TELEGRAM_CONFIG.storeUrl },
          { text: '📊 باشقۇرۇش كۆزنىكى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
        ],
      ],
    });
  } catch (e) {
    console.warn('[Telegram] notifyNewOrder error:', e);
  }
}

/**
 * Notify Admin when a customer submits a deposit request
 */
export async function notifyNewDeposit(deposit: {
  id?: string;
  amount: number | string;
  method?: string;
  txId?: string;
  userName?: string;
  userEmail?: string;
  status?: string;
}): Promise<void> {
  try {
    const message = `
💳 <b>يېڭى پۇل كىرگۈزۈش تالونى! | New Deposit</b> 💳
━━━━━━━━━━━━━━━━━━
💰 <b>سوممىسى:</b> <b>$${Number(deposit.amount || 0).toFixed(2)} USD</b>
🏦 <b>تۈرى:</b> <b>${deposit.method || 'ShamCash (شامكەش)'}</b>
🧾 <b>تالون نومۇرى (TxID):</b> <code>${deposit.txId || '—'}</code>
👤 <b>خېرىدار:</b> ${deposit.userName || 'ئەزا'} (<code>${deposit.userEmail || '—'}</code>)
📊 <b>ھالىتى:</b> <b>${deposit.status || 'تەكشۈرۈلمەكتە'}</b>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
🔗 <a href="${TELEGRAM_CONFIG.storeUrl}/admin">باشقۇرۇش مەركىزىدىن تەكشۈرۈش</a>
`.trim();

    await sendAdminAlert(message, {
      inline_keyboard: [
        [
          { text: '✅ تەستىقلاش كۆزنىكى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
        ],
      ],
    });
  } catch (e) {
    console.warn('[Telegram] notifyNewDeposit error:', e);
  }
}

/**
 * Notify Admin when a new customer registers
 */
export async function notifyNewUser(user: {
  name: string;
  email: string;
  id?: string;
}): Promise<void> {
  try {
    const message = `
🎉 <b>يېڭى خېرىدار تىزىملاتتى! | New Customer</b> 🎉
━━━━━━━━━━━━━━━━━━
👤 <b>ئىسمى:</b> <b>${user.name}</b>
📧 <b>ئېلخەت:</b> <code>${user.email}</code>
🆔 <b>خېرىدار ID:</b> <code>${user.id || '—'}</code>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
`.trim();

    await sendAdminAlert(message);
  } catch (e) {
    console.warn('[Telegram] notifyNewUser error:', e);
  }
}

/**
 * Handle incoming Telegram Webhook Updates
 */
export async function handleTelegramWebhook(update: any): Promise<void> {
  if (!update || !update.message) return;

  const msg = update.message;
  const chatId = msg.chat?.id;
  const text = (msg.text || '').trim();
  const from = msg.from;

  if (!chatId) return;

  // 1. Command /start
  if (text.startsWith('/start')) {
    const welcomeText = `
👋 <b>ھۆرمەتلىك ${from?.first_name || 'خېرىدار'}، AUTO CASH سۇپىسىغا خۇش كەپسىز!</b>

🎮 <b>AUTO CASH</b> — بارلىق ئەپلەر، تور ئويۇنلىرى، رەقەملىك كارتىلار، سۈنئىي ئەقىل (AI) ھېساباتلىرى ۋە مەۋھۇم نومۇرلارغا پۇل قاچىلاشنىڭ ئەڭ ئەرزان ۋە ئىشەنچلىك رەسمىي سۇپىسى.

🚀 تۆۋەندىكى <b>«🛒 دۇكاننى ئېچىش»</b> كۇنۇپكىسىنى بېسىپ، تېلېگرام ئىچىدىن چىقمايلا دەرھال پۇل قاچىلاڭ ۋە مال سېتىۋېلىڭ!
`.trim();

    await sendTelegramMessage(chatId, welcomeText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🛒 دۇكاننى ئېچىش | Open Store',
              web_app: { url: TELEGRAM_CONFIG.storeUrl },
            },
          ],
          [
            {
              text: '📲 تېلېفون ئەپنى چۈشۈرۈش',
              url: `${TELEGRAM_CONFIG.storeUrl}/download`,
            },
            {
              text: '💬 خېرىدارلار مۇلازىمىتى',
              url: 'https://t.me/autocash_UYGHUR',
            },
          ],
        ],
      },
    });
    return;
  }

  // 2. Command /help
  if (text.startsWith('/help')) {
    const helpText = `
ℹ️ <b>AUTO CASH مۇلازىمەت ياردەم مەركىزى</b>

• سۇپا ئادرېسى: ${TELEGRAM_CONFIG.storeUrl}
• خېرىدارلار مۇلازىمىتى: @autocash_UYGHUR
• مەسئۇل باشقۇرغۇچى: @${TELEGRAM_CONFIG.adminUsername}

پۇل كىرگۈزۈش ياكى زاكاز توغرىسىدا سوئاللىرىڭىز بولسا بىۋاسىتە خېرىدارلار مۇلازىمىتىگە ئالاقىلىشىڭ:
👉 @autocash_UYGHUR
`.trim();

    await sendTelegramMessage(chatId, helpText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🛒 دۇكانغا كىرىش',
              web_app: { url: TELEGRAM_CONFIG.storeUrl },
            },
            {
              text: '💬 خېرىدارلار مۇلازىمىتى',
              url: 'https://t.me/autocash_UYGHUR',
            },
          ],
        ],
      },
    });
    return;
  }
}
