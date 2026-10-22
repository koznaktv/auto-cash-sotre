/**
 * Telegram Bot & Notification & Real-Time Management Service for AUTO CASH
 * Bot: @Autocash_24_bot
 * Admin: @nasrulla0996 (ID: 7575664493)
 * Channel: @autocash_cannel
 * Support: @autocash_UYGHUR
 */

import fs from 'fs';
import path from 'path';
import {
  getAllOrdersAsync,
  getAllDepositsAsync,
  getAllUsersAsync,
  updateDepositStatusAsync,
  refundOrderBalanceAtomicAsync,
  getDepositByIdAsync,
  getOrderByIdAsync,
  getSystemSettingsAsync,
  OrderRecord,
} from './db';

export const TELEGRAM_CONFIG = {
  botUsername: 'Autocash_24_bot',
  channelId: '-1004310150591',
  channelUrl: 'https://t.me/autocash_cannel',
  channelUsername: 'autocash_cannel',
  supportUrl: 'https://t.me/autocash_UYGHUR',
  supportUsername: 'autocash_UYGHUR',
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493',
  adminUsername: 'nasrulla0996',
  // Designated Admin Telegram accounts (@nasrulla0996 and @autochah_UYGHUR / @autocash_UYGHUR)
  adminUsernames: ['nasrulla0996', 'autochah_uyghur', 'autocash_uyghur'],
  adminChatIds: ['7575664493'],
  storeUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://auto-cash-sotre.vercel.app',
};

// Set of active admin chat IDs that receive instant alerts
const activeAdminChatIds = new Set<string | number>(['7575664493', 7575664493]);

/**
 * Check if a given Telegram user ID or username is a platform administrator
 */
export function isTelegramAdmin(fromId?: number | string, fromUsername?: string): boolean {
  if (fromId) {
    const sId = String(fromId);
    const nId = Number(fromId);
    if (activeAdminChatIds.has(sId) || activeAdminChatIds.has(nId)) {
      return true;
    }
  }
  if (fromUsername) {
    const cleanUser = fromUsername.toLowerCase().replace(/^@/, '');
    if (TELEGRAM_CONFIG.adminUsernames.includes(cleanUser)) {
      return true;
    }
  }
  return false;
}

/**
 * Auto-register admin chat ID so all alerts are delivered to both admins
 */
export function registerAdminChatId(fromId?: number | string, fromUsername?: string): void {
  if (!fromId) return;
  if (isTelegramAdmin(fromId, fromUsername)) {
    activeAdminChatIds.add(fromId);
    activeAdminChatIds.add(String(fromId));
    activeAdminChatIds.add(Number(fromId));
  }
}

export function getBotToken(): string {
  return (
    process.env.TELEGRAM_BOT_TOKEN ||
    '8886426395:AAGYz2nDCPrtOyqDH-mmqSwq_ctIAvIBcKY'
  );
}

// In-memory traffic & subscriber cache
let dailySiteVisits = 0;
let lastVisitDate = new Date().toISOString().slice(0, 10);
const memorySubscribers = new Set<number>([7575664493]);

/**
 * Record a site visit for daily statistics
 */
export function recordSiteVisit(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastVisitDate) {
    dailySiteVisits = 0;
    lastVisitDate = today;
  }
  dailySiteVisits++;
}

/**
 * Get current day visitor count
 */
export function getDailySiteVisits(): number {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastVisitDate) {
    dailySiteVisits = 0;
    lastVisitDate = today;
  }
  return dailySiteVisits;
}

/**
 * Persistent helper for bot subscribers
 */
function getSubscribersFilePath(): string {
  return path.join(process.cwd(), 'data', 'telegram_subscribers.json');
}

export function recordSubscriber(from: { id: number; first_name?: string; username?: string }): void {
  if (!from || !from.id) return;
  memorySubscribers.add(from.id);

  try {
    const filePath = getSubscribersFilePath();
    let subscribers: Array<{ id: number; username?: string; firstName?: string; date: string }> = [];
    if (fs.existsSync(filePath)) {
      try {
        subscribers = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }
    const existingIndex = subscribers.findIndex((s) => s.id === from.id);
    const info = {
      id: from.id,
      username: from.username,
      firstName: from.first_name,
      date: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      subscribers[existingIndex] = info;
    } else {
      subscribers.push(info);
    }
    fs.writeFileSync(filePath, JSON.stringify(subscribers, null, 2), 'utf8');
  } catch (e) {
    // Non-fatal on serverless
  }
}

export function getAllSubscribers(): number[] {
  try {
    const filePath = getSubscribersFilePath();
    if (fs.existsSync(filePath)) {
      const subscribers = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(subscribers)) {
        subscribers.forEach((s) => {
          if (s.id) memorySubscribers.add(Number(s.id));
        });
      }
    }
  } catch {}
  return Array.from(memorySubscribers);
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
    console.warn('[Telegram] BOT_TOKEN is not configured');
    return { ok: false, description: 'TELEGRAM_BOT_TOKEN missing' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
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
      // Fallback: If parse error, send as plain text
      if (options.parse_mode && data.description?.includes("can't parse entities")) {
        const plainText = text.replace(/<[^>]+>/g, '');
        const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: plainText,
            disable_web_page_preview: options.disable_web_page_preview ?? true,
            reply_markup: options.reply_markup,
          }),
        });
        return await retryRes.json();
      }
    }
    return data;
  } catch (err: any) {
    console.error('[Telegram] Network exception:', err?.message);
    return { ok: false, description: err?.message };
  }
}

/**
 * Edit an existing Telegram message in-place
 */
export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  options: {
    parse_mode?: 'HTML' | 'Markdown';
    reply_markup?: any;
    disable_web_page_preview?: boolean;
  } = {}
): Promise<boolean> {
  const token = getBotToken();
  if (!token) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: options.parse_mode || 'HTML',
        disable_web_page_preview: options.disable_web_page_preview ?? true,
        reply_markup: options.reply_markup,
      }),
    });
    const data = await res.json();
    if (!data.ok && options.parse_mode && data.description?.includes("can't parse entities")) {
      const plainText = text.replace(/<[^>]+>/g, '');
      const retryRes = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: plainText,
          disable_web_page_preview: options.disable_web_page_preview ?? true,
          reply_markup: options.reply_markup,
        }),
      });
      const retryData = await retryRes.json();
      return Boolean(retryData.ok);
    }
    return Boolean(data.ok);
  } catch (err: any) {
    console.error('[Telegram] editMessageText error:', err?.message);
    return false;
  }
}

/**
 * Helper to smoothly edit message in-place or fallback to sending a new one
 */
async function showOrEditMessage(
  chatId: number | string,
  messageId: number | undefined,
  text: string,
  replyMarkup: any
): Promise<void> {
  if (chatId && messageId) {
    const edited = await editTelegramMessage(chatId, messageId, text, {
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
    if (edited) return;
  }
  await sendTelegramMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

/**
 * Answer inline button callback query with toast notification
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<boolean> {
  const token = getBotToken();
  if (!token) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch (err: any) {
    console.error('[Telegram] answerCallbackQuery error:', err?.message);
    return false;
  }
}

/**
 * Send instant alert to all registered Admin Telegram accounts (@nasrulla0996, @autochah_UYGHUR)
 */
export async function sendAdminAlert(htmlMessage: string, replyMarkup?: any): Promise<boolean> {
  const adminIds = Array.from(new Set(Array.from(activeAdminChatIds).map(String)));
  if (!adminIds.includes('7575664493')) adminIds.push('7575664493');

  let anySuccess = false;
  for (const chatId of adminIds) {
    try {
      const res = await sendTelegramMessage(chatId, htmlMessage, {
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });
      if (res.ok) anySuccess = true;
    } catch {}
  }
  return anySuccess;
}

/**
 * 1. Notify Admin when a customer places an order
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
    const fieldsText =
      order.fields && Object.keys(order.fields).length > 0
        ? Object.entries(order.fields)
            .map(([k, v]) => `  • <b>${k}:</b> <code>${v}</code>`)
            .join('\n')
        : '';

    const message = `
╭━━━ ⚡️🛍️ <b>يېڭى مەھسۇلات زاكازى چۈشتى!</b> 🛍️⚡️ ━━━╮
      💎 <i>AUTO CASH ئاپتوماتىك قاچىلاش سىستېمىسى</i> 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📦 <b>زاكاز نومۇرى:</b> <code>${order.id}</code>
🎮 <b>مەھسۇلات:</b> <b>${order.serviceName || 'مەھسۇلات'}</b> - ${order.packageTitle || ''}
💰 <b>سوممىسى:</b> <b>$${Number(order.amount || 0).toFixed(2)} USD</b>
🎯 <b>قاچىلاش ھېساباتى / ID:</b> <code>${order.targetAccount || '—'}</code>
${fieldsText ? `📝 <b>قوشۇمچە ئۇچۇرلار:</b>\n${fieldsText}\n` : ''}👤 <b>خېرىدار:</b> ${order.userName || 'ئەزا'} (<code>${order.userEmail || '—'}</code>)
⏳ <b>ھالىتى:</b> <b>${order.status || 'سۈرۈشتۈرۈلمەكتە'}</b>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

    await sendAdminAlert(message, {
      inline_keyboard: [
        [
          { text: '🛍️⚡️ دۇكاننى ئېچىش ➔', url: TELEGRAM_CONFIG.storeUrl },
          { text: '📊🖥️ باشقۇرۇش كۆزنىكى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
        ],
      ],
    });
  } catch (e) {
    console.warn('[Telegram] notifyNewOrder error:', e);
  }
}

/**
 * 1.1 Automatically broadcast completed / fulfilled orders to the official channel (@autocash_cannel)
 * Builds trust, transparency, and social proof for visitors and customers.
 */
export async function postOrderCompletedToChannel(order: {
  id: string;
  serviceName?: string;
  packageTitle?: string;
  amount?: number | string;
  targetAccount?: string;
  userName?: string;
  userEmail?: string;
}): Promise<boolean> {
  const token = getBotToken();
  if (!token) return false;

  const targetChannel = TELEGRAM_CONFIG.channelId || `@${TELEGRAM_CONFIG.channelUsername}`;

  // Mask sensitive parts for user privacy and security
  const cleanId = order.id.slice(0, 8);
  const rawTarget = String(order.targetAccount || '').trim();
  const maskedTarget =
    rawTarget.length > 4
      ? `${rawTarget.slice(0, 2)}***${rawTarget.slice(-2)}`
      : rawTarget ? '***' : '—';

  const cleanAmount = Number(order.amount || 0).toFixed(2);
  const timeStr = new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' });

  const channelText = `
╭━━━ 👑 <b>AUTO CASH | يېڭى زاكاز تاماملاندى!</b> 👑 ━━━╮
      ⚡️ <i>ئاپتوماتىك پۇل قاچىلاش مۇۋەپپەقىيەتلىك بولدى</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📦 <b>زاكاز نومۇرى:</b> <code>#${cleanId}</code>
🎮 <b>مەھسۇلات:</b> <b>${order.serviceName || 'رەقەملىك مەھسۇلات'}</b> - ${order.packageTitle || ''}
💎 <b>سوممىسى:</b> <b>$${cleanAmount} USD</b>
🎯 <b>قاچىلانغان ID:</b> <code>${maskedTarget}</code>
⚡️ <b>سۈرئىتى:</b> سېكۇنتتا ئاپتوماتىك كىردى 🚀
⏰ <b>ۋاقتى:</b> ${timeStr}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ <i>خېرىدارىمىزنىڭ ھېساباتىغا پۇل مۇۋەپپەقىيەتلىك يەتكۈزۈپ بېرىلدى. AUTO CASH نى تاللىغىنىڭىزغا كۆپ رەھمەت!</i>

🛒 <b>سىزمۇ ئەڭ ئەرزان باھادا پۇل قاچىلاڭ:</b>
👇 تۆۋەندىكى كۇنۇپكىنى بېسىپ دۇكاننى ئېچىڭ!
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        chat_id: targetChannel,
        text: channelText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⚡️🛍️ زاكاز بېرىش | دۇكاننى ئېچىش ➔',
                url: `https://t.me/${TELEGRAM_CONFIG.botUsername}?start=channel`,
              },
            ],
            [
              {
                text: '💬✨ خېرىدارلار مۇلازىمىتى (24/7) 👨‍💻',
                url: TELEGRAM_CONFIG.supportUrl,
              },
            ],
          ],
        },
      }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch (err: any) {
    console.error('[Telegram] postOrderCompletedToChannel error:', err?.message);
    return false;
  }
}

/**
 * 2. Notify Admin when a customer submits a deposit request with 1-Click interactive action buttons
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
    const depositId = deposit.id || '';
    const message = `
╭━━━ 💸💳 <b>يېڭى شامكەش پۇل كىرگۈزۈش تالونى!</b> 💳💸 ━━━╮
       💎 <i>شامكەش (ShamCash) تەكشۈرۈش مەركىزى</i> 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

💰 <b>سوممىسى:</b> <b>$${Number(deposit.amount || 0).toFixed(2)} USD</b>
🏦 <b>تۈرى:</b> <b>${deposit.method || 'ShamCash (شامكەش)'}</b>
🧾 <b>تالون نومۇرى (TxID):</b> <code>${deposit.txId || '—'}</code>
👤 <b>خېرىدار:</b> ${deposit.userName || 'ئەزا'} (<code>${deposit.userEmail || '—'}</code>)
⏳ <b>ھالىتى:</b> <b>${deposit.status || 'تەكشۈرۈلمەكتە'}</b>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 <b>بىۋاسىتە تېلېگرامدىن 1 كۇنۇپكا بىلەن بىر تەرەپ قىلىڭ:</b>
`.trim();

    const inlineKeyboard: any[][] = [];
    if (depositId) {
      inlineKeyboard.push([
        { text: '✅⚡️ تەستىقلاش (Approve)', callback_data: `dep_approve:${depositId}` },
        { text: '❌🛑 رەت قىلىش (Reject)', callback_data: `dep_reject:${depositId}` },
      ]);
      inlineKeyboard.push([
        { text: '🚨⚠️ ساختىلىق دەپ بەلگىلەش', callback_data: `dep_fraud:${depositId}` },
        { text: '📊🖥️ باشقۇرۇش مەركىزى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
      ]);
    } else {
      inlineKeyboard.push([
        { text: '📊🖥️ باشقۇرۇش مەركىزى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
      ]);
    }

    await sendAdminAlert(message, { inline_keyboard: inlineKeyboard });
  } catch (e) {
    console.warn('[Telegram] notifyNewDeposit error:', e);
  }
}

/**
 * 3. Notify Admin when a new customer registers on the website
 */
export async function notifyNewUser(user: {
  name: string;
  email: string;
  id?: string;
}): Promise<void> {
  try {
    const message = `
╭━━━ 🎉✨ <b>يېڭى خېرىدار تىزىملاتتى!</b> ✨🎉 ━━━╮
      👑 <i>AUTO CASH يېڭى ئەزا قوشۇلدى</i> 👑
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 <b>ئىسمى:</b> <b>${user.name}</b>
📧 <b>ئېلخەت:</b> <code>${user.email}</code>
🆔 <b>خېرىدار ID:</b> <code>${user.id || '—'}</code>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 <a href="${TELEGRAM_CONFIG.storeUrl}/admin">📊🖥️ باشقۇرۇش مەركىزىدىن تەپسىلاتىنى كۆرۈش</a>
`.trim();

    await sendAdminAlert(message);
  } catch (e) {
    console.warn('[Telegram] notifyNewUser error:', e);
  }
}

/**
 * 4. Alert Admin when a customer submits a fake/duplicate/invalid ShamCash TXID
 */
export async function notifyFraudulentDeposit(data: {
  userName?: string;
  userEmail?: string;
  txId: string;
  amount: number | string;
  reason: string;
}): Promise<void> {
  try {
    const message = `
╭━━━ 🚨⚠️ <b>ساختا / تەكرار شامكەش تالونى بايقالدى!</b> ⚠️🚨 ━━━╮
       🛑 <i>AUTO CASH ئەقلىي بىخەتەرلىك قوغداش سىستېمىسى</i> 🛑
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 <b>گۇمانلىق خېرىدار:</b> ${data.userName || 'ئەزا'} (<code>${data.userEmail || '—'}</code>)
🧾 <b>تالون نومۇرى (TxID):</b> <code>${data.txId}</code>
💰 <b>ئىلتىماس قىلغان سوممىسى:</b> $${Number(data.amount || 0).toFixed(2)} USD
⚠️ <b>بايقالغان سەۋەب:</b> <b>${data.reason}</b>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 <i>بۇ تەلەپ سىستېما تەرىپىدىن ئاپتوماتىك توسۇلدى، مەبلەغ سېلىنمىدى.</i>
`.trim();

    await sendAdminAlert(message, {
      inline_keyboard: [
        [
          { text: '🛡️🔐 بىخەتەرلىك تەڭشەكلىرى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
        ],
      ],
    });
  } catch (e) {
    console.warn('[Telegram] notifyFraudulentDeposit error:', e);
  }
}

/**
 * 5. Alert Admin when an order fails due to invalid Game Player ID / account
 */
export async function notifyInvalidAccountId(data: {
  orderId: string;
  serviceName?: string;
  packageTitle?: string;
  targetAccount?: string;
  userName?: string;
  userEmail?: string;
  amount: number | string;
  errorMessage: string;
}): Promise<void> {
  try {
    const message = `
╭━━━ ⚠️🎯 <b>زاكاز مەغلۇپ بولدى (خاتا Player ID / تەمىنلىگۈچى رەت قىلدى)!</b> ━━━╮
       🛑 <i>تەمىنلىگۈچى API قايتۇرغان سىستېما سىگنالى</i> 🛑
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📦 <b>زاكاز نومۇرى:</b> <code>${data.orderId}</code>
🎮 <b>مەھسۇلات:</b> <b>${data.serviceName || 'ئويۇن مەھسۇلاتى'}</b> - ${data.packageTitle || ''}
🎯 <b>كىرگۈزگەن خاتا ID:</b> <code>${data.targetAccount || 'نامەلۇم'}</code>
💰 <b>سوممىسى:</b> $${Number(data.amount || 0).toFixed(2)} USD
👤 <b>خېرىدار:</b> ${data.userName || 'ئەزا'} (<code>${data.userEmail || '—'}</code>)
⚠️ <b>تەمىنلىگۈچى قايتۇرغان سەۋەب:</b> <code>${data.errorMessage}</code>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 <b>ئەگەر پۇل قايتۇرۇلمىغان بولسا، تېلېگرامدىن 1 كۇنۇپكا بىلەن پۇلنى قايتۇرۇڭ:</b>
`.trim();

    await sendAdminAlert(message, {
      inline_keyboard: [
        [
          { text: '💰↩️ خېرىدارغا پۇل قايتۇرۇش (Refund)', callback_data: `ord_refund:${data.orderId}` },
        ],
        [
          { text: '📊🖥️ باشقۇرۇش مەركىزىدىن كۆرۈش', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
        ],
      ],
    });
  } catch (e) {
    console.warn('[Telegram] notifyInvalidAccountId error:', e);
  }
}

/**
 * 6. Calculate comprehensive daily financial statistics for the Admin
 */
export async function getDailyFinancialStats(): Promise<string> {
  try {
    const orders = await getAllOrdersAsync().catch(() => []);
    const deposits = await getAllDepositsAsync().catch(() => []);
    const users = await getAllUsersAsync().catch(() => []);

    const todayDate = new Date().toISOString().slice(0, 10);
    const nowUrumqi = new Date().toLocaleTimeString('ug-CN', { timeZone: 'Asia/Urumqi' });

    // Filter today's orders
    const todayOrders = orders.filter((o) => {
      const d = o.createdAt || (o as any).date || (o as any).created_at || '';
      return d.startsWith(todayDate);
    });

    const completedOrders = todayOrders.filter((o) => o.status === 'completed');
    const processingOrders = todayOrders.filter((o) => o.status === 'processing' || o.status === 'pending_provider');
    const failedOrders = todayOrders.filter((o) => o.status === 'failed' || o.status === 'refunded' || o.status === 'cancelled');

    const todayRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const todayCost = completedOrders.reduce((sum, o) => {
      const cost = o.details?.costTotal || o.details?.unitCost;
      return sum + (cost ? Number(cost) : Number(o.amount) * 0.85);
    }, 0);
    const todayProfit = Math.max(0, todayRevenue - todayCost);

    // Filter today's deposits
    const todayDeposits = deposits.filter((d) => {
      const dDate = d.date || (d as any).created_at || '';
      return dDate.startsWith(todayDate);
    });
    const completedDeposits = todayDeposits.filter((d) => d.status === 'completed');
    const todayDepositsTotal = completedDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const allPendingDeposits = deposits.filter((d) => d.status === 'pending');

    // New users today
    const todayUsers = users.filter((u) => {
      const uDate = u.createdAt || (u as any).date || (u as any).created_at || '';
      return uDate.startsWith(todayDate);
    });

    const visits = getDailySiteVisits();

    return `
╭━━━ 📊💰 <b>AUTO CASH كۈنلۈك سودا ۋە كىرىم دوكلاتى</b> 💰📊 ━━━╮
       📈 <i>ئاپتوماتىك سېتىش، شامكەش قالدۇق ۋە پايدا سىتاستىكىسى</i> 📈
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📅 <b>تارىخ:</b> <code>${todayDate}</code> (${nowUrumqi})

💎 <b>بۈگۈنكى ئومۇمىي سېتىش كىرىمى:</b> <b>$${todayRevenue.toFixed(2)} USD</b>
🚀 <b>تەخمىنىي ساپ پايدا:</b> <b>+$${todayProfit.toFixed(2)} USD</b>
💳 <b>بۈگۈن كىرگەن شامكەش پۇلى:</b> <b>$${todayDepositsTotal.toFixed(2)} USD</b> (${completedDeposits.length} تال)
⏳ <b>تەستىق كۈتۈۋاتقان تالونلار:</b> <b>${allPendingDeposits.length} تال</b>

📦 <b>بۈگۈنكى زاكازلار تىزىملىكى:</b> <b>${todayOrders.length} تال</b>
  • ✅ تاماملانغىنى: <b>${completedOrders.length} تال</b>
  • ⏳ بىر تەرەپ قىلىنىۋاتقىنى: <b>${processingOrders.length} تال</b>
  • ❌ ئەمەلدىن قالغان / رەت قىلىنغان: <b>${failedOrders.length} تال</b>

👥 <b>بۈگۈنكى يېڭى ئەزالار:</b> <b>${todayUsers.length} كىشى</b> (ئومۇمىي: ${users.length} ئەزا)
🌐 <b>بۈگۈنكى توربەت زىيارەت سانى:</b> <b>${visits} قېتىم</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 <i>AUTO CASH يۇقىرى سۈرئەتلىك رەقەملىك دۇكان مەركىزى</i>
`.trim();
  } catch (err: any) {
    return `❌ كۈنلۈك دوكلاتنى ھېسابلاشتا خاتالىق كۆرۈلدى: ${err?.message}`;
  }
}

/**
 * 7. Broadcast promotional announcement to Channel (@autocash_cannel) and Bot Subscribers
 */
export async function broadcastAnnouncement(
  content: string,
  fromUser: { id: number; username?: string }
): Promise<{ channelSuccess: boolean; usersSent: number; error?: string }> {
  const token = getBotToken();
  if (!token) return { channelSuccess: false, usersSent: 0, error: 'Bot token missing' };

  const formattedMessage = `
🔥 <b>AUTO CASH | ئالاھىدە تەشۋىقات ۋە ئېتىبار خەۋىرى</b> 🔥
━━━━━━━━━━━━━━━━━━
${content}
━━━━━━━━━━━━━━━━━━
⚡️ <b>ئەڭ ئەرزان باھا • 24/7 شۇئان قاچىلاش • بىخەتەر كاپالەت</b>
🛒 <b>رەسمىي دۇكان:</b> ${TELEGRAM_CONFIG.storeUrl}
📢 <b>تېلېگرام قانىلىمىز:</b> @${TELEGRAM_CONFIG.channelUsername}
💬 <b>خېرىدارلار مۇلازىمىتى:</b> @${TELEGRAM_CONFIG.supportUsername}
`.trim();

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🛒 دۇكاننى ئېچىش | Open Store', web_app: { url: TELEGRAM_CONFIG.storeUrl } },
      ],
      [
        { text: '📢 رەسمىي قانال', url: TELEGRAM_CONFIG.channelUrl },
        { text: '💬 خېرىدارلار مۇلازىمىتى', url: TELEGRAM_CONFIG.supportUrl },
      ],
    ],
  };

  let channelSuccess = false;
  // 1. Send to Official Channel (@autocash_cannel)
  try {
    const chanRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: `@${TELEGRAM_CONFIG.channelUsername}`,
        text: formattedMessage,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }),
    });
    const chanData = await chanRes.json();
    channelSuccess = Boolean(chanData.ok);
  } catch (err) {
    console.warn('[Telegram Broadcast] Channel error:', err);
  }

  // 2. Broadcast to all known bot subscribers
  const subscriberIds = getAllSubscribers();
  let usersSent = 0;
  for (const sId of subscriberIds) {
    try {
      const res = await sendTelegramMessage(sId, formattedMessage, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
      if (res.ok) usersSent++;
    } catch {}
  }

  return { channelSuccess, usersSent };
}

/**
 * Find order safely by exact ID, ID without prefix, or prefix search
 */
async function findOrderSafely(query: string): Promise<OrderRecord | null> {
  const clean = query.replace(/^#/, '').trim();
  if (!clean) return null;
  let order = await getOrderByIdAsync(clean);
  if (order) return order;
  if (!clean.startsWith('ord_')) {
    order = await getOrderByIdAsync(`ord_${clean}`);
    if (order) return order;
  }
  const all = await getAllOrdersAsync();
  const matched = all.find(
    (o) =>
      o.id.toLowerCase() === clean.toLowerCase() ||
      o.id.toLowerCase().startsWith(clean.toLowerCase()) ||
      o.id.toLowerCase().replace('ord_', '').startsWith(clean.toLowerCase())
  );
  return matched || null;
}

/**
 * Format real-time luxury order tracking card
 */
function formatOrderTrackingCard(order: OrderRecord) {
  const cleanId = order.id.replace('ord_', '');
  const amountStr = Number(order.amount || 0).toFixed(2);
  const target = order.targetAccount || '—';
  const timeStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })
    : '—';

  let statusBadge = '';
  if (order.status === 'completed') {
    statusBadge = '✅ <b>تاماملاندى (مۇۋەپپەقىيەتلىك كىردى)</b> 🚀\n<i>⚡️ پۇل ھېساباتىڭىزغا كىرگۈزۈلدى، AUTO CASH نى تاللىغىنىڭىزغا رەھمەت!</i>';
  } else if (order.status === 'processing') {
    statusBadge = '⏳ <b>بىر تەرەپ قىلىنىۋاتىدۇ (قاچىلىنىۋاتىدۇ)</b> ⚡️\n<i>ئادەتتە 1-3 مىنۇتتا پۈتىدۇ، تېز پۈتۈشىگە ئاز قالدى.</i>';
  } else if (order.status === 'failed') {
    statusBadge = '❌ <b>مەغلۇپ بولدى (پۇل ھەميانغا تولۇق قايتۇرۇلدى)</b> 💰\n<i>خاتا ئويۇن ID ياكى مەھسۇلات پۈتمىگەنلىكى سەۋەبىدىن پۇل ھەميىنىڭىزگە چۈشتى.</i>';
  } else if (order.status === 'refunded') {
    statusBadge = '💰 <b>پۇل قايتۇرۇلدى (ھەميان قالدۇقىغا كىردى)</b>';
  } else {
    statusBadge = `ℹ️ <b>ھالىتى:</b> <code>${order.status}</code>`;
  }

  const text = `
╭━━━ 📦🔍 <b>AUTO CASH زاكاز تەپسىلاتى</b> 🔍📦 ━━━╮
      ⚡️ <i>24/7 نەق مەيدان جانلىق تەكشۈرۈش مەركىزى</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🆔 <b>زاكاز نومۇرى:</b> <code>#${cleanId}</code>
🎮 <b>مەھسۇلات:</b> <b>${order.serviceName || 'رەقەملىك مەھسۇلات'}</b> - ${order.packageTitle || ''}
💎 <b>سوممىسى:</b> <b>$${amountStr} USD</b>
🎯 <b>قاچىلانغان ID:</b> <code>${target}</code>
⏰ <b>زاكاز ۋاقتى:</b> ${timeStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${statusBadge}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 يەنە باشقا زاكاز نومۇرىڭىزنى يېزىپ ئەۋەتسىڭىزمۇ دەرھال سۈرۈشتۈرۈپ بېرىدۇ.
`.trim();

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔄 زاكازنى قايتا تەكشۈرۈش ⚡️', callback_data: `recheck_ord:${order.id}` },
        { text: '💬 خېرىدارلار مۇلازىمىتى 👨‍💻', url: TELEGRAM_CONFIG.supportUrl },
      ],
      [
        { text: '📦 بارلىق زاكازلىرىم (توربەت) ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/orders` } },
        { text: '🔙 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' },
      ],
    ],
  };

  return { text, keyboard };
}

/**
 * Live Exchange Rates Message
 */
function getExchangeRatesMessage(effectiveRate: number): string {
  const sypRate = Math.round(effectiveRate || 15000);
  return `
╭━━━ 💱📊 <b>AUTO CASH — نەق مەيدان پېرېۋوت باھاسى</b> 📊💱 ━━━╮
      ⚡️ <i>24/7 ئاپتوماتىك سېكۇنتتا ھەميانغا پۇل كىرىش كاپالىتى</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

💵 <b>1.00 USD (دوللار)</b> = <b>${sypRate.toLocaleString()} SYP (شامكەش لىراسى)</b>

📊 <b>كۆپ ئۇچرايدىغان شامكەش تالون مىساللىرى:</b>
• <b>75,000 SYP</b> ➔ <b>$5.00 USD</b> (325 PUBG UC ياكى 530 Free Fire Diamonds)
• <b>150,000 SYP</b> ➔ <b>$10.00 USD</b> (660 PUBG UC ياكى 1080 Free Fire Diamonds)
• <b>375,000 SYP</b> ➔ <b>$25.00 USD</b> (1800 PUBG UC + ئارتۇقچە قالدۇق)
• <b>750,000 SYP</b> ➔ <b>$50.00 USD</b> (3850 PUBG UC + VIP كەش بەك)

🚀 <b>قانداق سالىسىز؟</b>
Sham Cash ئەپى ئارقىلىق پۇل ئەۋەتىپ، تالون نومۇرىنى (TxID) دۇكاننىڭ «پۇل كىرگۈزۈش» بېتىدىن كىرگۈزسىڭىز، سېكۇنتتا ھەميىنىڭىزگە چۈشىدۇ!
`.trim();
}

/**
 * Customer FAQ Message
 */
function getFaqMessage(): string {
  return `
╭━━━ ❓💡 <b>AUTO CASH — كۆپ سورىلىدىغان سوئاللار (FAQ)</b> 💡❓ ━━━╮
      💎 <i>قەدىرلىك خېرىدارلار ئەڭ كۆپ سورايدىغان مەسىلىلەر</i> 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

<b>1. شامكەشتىن پۇل سالسام قاچان كىرىدۇ؟</b>
✅ تالون نومۇرى (TxID) نى دۇكاننىڭ «ھەميانغا پۇل كىرگۈزۈش» بېتىگە كىرگۈزۈپ «دەلىللەش» كۇنۇپكىسىنى باسسىڭىز، سېكۇنت ئىچىدە ئاپتوماتىك تەستىقلىنىپ كىرىدۇ!

<b>2. زاكاز بەرگەندىن كېيىن قانچىلىك ۋاقىتتا پۈتىدۇ؟</b>
⚡️ سىستېمىمىز پۈتۈنلەي ئاپتوماتلاشقان! زاكازلارنىڭ %95 ى 1-3 مىنۇتتا بىۋاسىتە ئويۇن ياكى ئەپ ھېساباتىڭىزغا قاچىلىنىدۇ.

<b>3. ئەگەر مەھسۇلات مەغلۇپ بولسا پۇلۇم كۆيۈپ كېتەمدۇ؟</b>
💰 ھەرگىز كۆيمەيدۇ! زاكاز مەغلۇپ بولسا ياكى ئويۇن ID خاتا بولسا، پۇل دەرھال AUTO CASH ھەميان قالدۇقىڭىزغا سېكۇنتتا تولۇق قايتۇرۇلىدۇ. سىز قايتا زاكاز بېرەلەيسىز ياكى باشقا مەھسۇلات ئالالايسىز.

<b>4. قايسى خىل تۆلەش ئۇسۇللىرىنى قوللايدۇ؟</b>
💳 سۈرىيە شامكەش (Sham Cash)، تۈركىيە لىراسى، كرىپتو (USDT) ۋە خەلقئارالىق قولايلىق ئۇسۇللار تەمىنلەنگەن.

<b>5. سۈرۈشتۈرۈش ياكى باغلانماقچى بولسامچۇ؟</b>
👨‍💻 24/7 خېرىدارلار مۇلازىمەت مەسئۇلىمىز سىزگە ياردەم بېرىشكە تەييار: @${TELEGRAM_CONFIG.supportUsername}
`.trim();
}

/**
 * VIP Membership System Message
 */
function getVipMembershipMessage(): string {
  return `
╭━━━ 👑💎 <b>AUTO CASH VIP ئەزالىق ۋە ئېتىبار تۈزۈمى</b> 💎👑 ━━━╮
      🌟 <i>قانداق قىلىپ تېخىمۇ كۆپ ئېتىبار ۋە قايتۇرما پۇلغا ئېرىشىسىز؟</i> 🌟
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🥇 <b>VIP 1 ئەزالىق:</b>
• مەبلەغ ئومۇمىي مىقدارى: $50+
• ئېتىبار: ھەر بىر زاكازدىن %1.0 كەش بەك (Cashback) ھەميانغا قايتىدۇ
• ئالاھىدىلىكى: 24/7 تېز يول ئارقىلىق بىر تەرەپ قىلىش

🥈 <b>VIP 2 ئالتۇن ئەزالىق:</b>
• مەبلەغ ئومۇمىي مىقدارى: $200+
• ئېتىبار: بارلىق زاكازلاردىن %2.5 كەش بەك
• ئالاھىدىلىكى: مەخسۇس ئېتىبار باھالار ۋە كۈندىلىك سوۋغات پائالىيەتلىرى

💎 <b>VIP 3 ئالماس ئەزالىق:</b>
• مەبلەغ ئومۇمىي مىقدارى: $500+
• ئېتىبار: ئەڭ يۇقىرى %5.0 كەش بەك
• ئالاھىدىلىكى: 1 گە 1 مەخسۇس تېز مۇلازىمەت، يېڭى مەھسۇلاتلارنى ئالدىن سېتىۋېلىش

👇 تۆۋەندىكى كۇنۇپكىنى بېسىپ ئەزالىق ئەھۋالىڭىزنى كۆرۈڭ:
`.trim();
}

/**
 * App Download Message
 */
function getAppDownloadMessage(): string {
  return `
╭━━━ 📲⚡️ <b>AUTO CASH رەسمىي يانفون ئەپى (Android APK)</b> ⚡️📲 ━━━╮
      🚀 <i>تېلېفوندا تېخىمۇ راۋان، تېز ۋە قولايلىق سېتىۋېلىش</i> 🚀
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📱 <b>ئەپ ئۇچۇرى:</b>
• ئەڭ يېڭى نەشرى: <b>v1.4.0 (سەرخىل يۇمىلاق ھەشەمەتلىك لوگولۇق)</b>
• سىستېما تەلىپى: Android 7.0+
• سىغىمى: ~8.06 MB
• ئالاھىدىلىكى: سېكۇنتتا ئېچىلىش، تېز پۇل كىرگۈزۈش، زاكاز ئاپتوماتىك ئۇقتۇرۇشى.

👇 <b>تۆۋەندىكى كۇنۇپكىنى بېسىپ ئەپنى بىۋاسىتە تېلېفونىڭىزغا چۈشۈرۈۋېلىڭ:</b>
`.trim();
}

/**
 * Publish & Pin Master Guide to Channel (@autocash_cannel)
 */
export async function pinChannelMasterGuide(): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const token = getBotToken();
  if (!token) return { ok: false, error: 'Token missing' };
  const targetChannel = TELEGRAM_CONFIG.channelId || `@${TELEGRAM_CONFIG.channelUsername}`;

  const pinText = `
╭━━━ 🌟👑 <b>AUTO CASH | رەسمىي تېز سۈرئەتلىك دۇكان</b> 👑🌟 ━━━╮
      💎 <i>ئويۇن، ئەپ ۋە رەقەملىك دۇنياغا پۇل قاچىلاش سۇپىسى</i> 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👋 <b>ھۆرمەتلىك قەدىرلىك قېرىنداشلار ۋە دوستلار!</b>
<b>AUTO CASH</b> رەسمىي تېلېگرام قانىلىمىزغا خۇش كەپسىز!

⚡️ <b>بىزنىڭ كاپالىتىمىز ۋە ئەۋزەللىكلىرىمىز:</b>
• 🚀 <b>24/7 سېكۇنتتا ئاپتوماتىك قاچىلاش:</b> زاكاز بەرگەن ھامان سېكۇنتتا يېتىپ كېلىدۇ!
• 💰 <b>شامكەش (Sham Cash) ئاپتوماتىك كىرىش:</b> 24 سائەت تالون نومۇرى بىلەن سېكۇنتتا ھەميانغا پۇل كىرىدۇ!
• 🎮 <b>بارلىق دۇنياۋى ئويۇن ۋە ئەپلەر:</b> PUBG UC، Free Fire، TikTok Coins، Telegram Premium، ChatGPT Plus ۋە مەۋھۇم نومۇرلار.
• 🛡️ <b>%100 كاپالەتلىك:</b> مەھسۇلات پۈتمىسە ياكى خاتا كىرسە پۇلىڭىز سېكۇنتتا ھەميانغا تولۇق قايتىدۇ.
• 📱 <b>رەسمىي ئەپ نۇسخىسى:</b> تېلېفوندا قولايلىق ئىشلىتىش ئۈچۈن Android APK تەمىنلەندى.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 <b>رەسمىي ئادرېسلىرىمىز:</b>
• 🛍️ <b>توربەت دۇكىنى:</b> ${TELEGRAM_CONFIG.storeUrl}
• 🤖 <b>تېلېگرام بوتى:</b> @${TELEGRAM_CONFIG.botUsername}
• 💬 <b>24/7 خېرىدارلار مۇلازىمىتى:</b> @${TELEGRAM_CONFIG.supportUsername}
• 📥 <b>ئەپ چۈشۈرۈش:</b> ${TELEGRAM_CONFIG.storeUrl}/download

👇 <b>سېتىۋېلىش، باھا كۆرۈش ياكى پۇل كىرگۈزۈش ئۈچۈن تۆۋەندىكى كۇنۇپكىلارنى بېسىڭ:</b>
`.trim();

  const keyboard = {
    inline_keyboard: [
      [
        { text: '⚡️🛍️ دۇكاننى ئېچىش | Open Store ➔', url: `https://t.me/${TELEGRAM_CONFIG.botUsername}?start=channel` },
        { text: '🤖 تېلېگرام بوتىغا كىرىش ➔', url: `https://t.me/${TELEGRAM_CONFIG.botUsername}` },
      ],
      [
        { text: '💎💳 شامكەشتىن پۇل سېلىش ⚡️', url: `https://t.me/${TELEGRAM_CONFIG.botUsername}?start=deposit` },
        { text: '📲 يانفون ئەپىنى چۈشۈرۈش (APK) 📥', url: `${TELEGRAM_CONFIG.storeUrl}/download` },
      ],
      [
        { text: '💬✨ خېرىدارلار مۇلازىمىتى (24/7) 👨‍💻', url: TELEGRAM_CONFIG.supportUrl },
      ],
    ],
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        chat_id: targetChannel,
        text: pinText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: keyboard,
      }),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.description };

    const messageId = data.result?.message_id;
    await fetch(`https://api.telegram.org/bot${token}/pinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        chat_id: targetChannel,
        message_id: messageId,
        disable_notification: false,
      }),
    });

    return { ok: true, messageId };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Helper to build rich interactive store inline keyboard with vibrant animated-feel badges
 */
function getStoreInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '⚡️🛍️ دۇكاننى ئېچىش | Open Store ➔',
          web_app: { url: TELEGRAM_CONFIG.storeUrl },
        },
      ],
      [
        {
          text: '💎💳 شامكەشتىن پۇل سېلىش ⚡️',
          callback_data: 'quick_deposit',
        },
        {
          text: '🔍 زاكاز سۈرۈشتۈرۈش 📦',
          callback_data: 'quick_track',
        },
      ],
      [
        {
          text: '🔥🎮 تۈرلەر ۋە باھالار 💎',
          callback_data: 'quick_catalog',
        },
        {
          text: '💱 پۇل پېرېۋوت باھاسى 📊',
          callback_data: 'quick_rates',
        },
      ],
      [
        {
          text: '❓ كۆپ سورىلىدىغان سوئاللار 💡',
          callback_data: 'quick_faq',
        },
        {
          text: '👑 VIP ئەزالىق تۈزۈمى 🌟',
          callback_data: 'quick_vip',
        },
      ],
      [
        {
          text: '🌟💡 ئىشلىتىش قوللانمىسى 📖',
          callback_data: 'quick_guide',
        },
        {
          text: '📲 ئەپ نۇسخىسى (APK) 📥',
          callback_data: 'quick_download',
        },
      ],
      [
        {
          text: '📢🔥 رەسمىي تېلېگرام قانال 🪐',
          url: TELEGRAM_CONFIG.channelUrl,
        },
        {
          text: '💬✨ خېرىدارلار مۇلازىمىتى (24/7) 👨‍💻',
          url: TELEGRAM_CONFIG.supportUrl,
        },
      ],
    ],
  };
}

/**
 * Build prestigious welcome card for new and returning visitors
 */
function getWelcomeMessage(firstName?: string): string {
  const customerName = firstName ? `<b>${firstName}</b>` : 'ھۆرمەتلىك قەدىرلىك خېرىدارىمىز';
  return `
╭━━━ ✨ <b>AUTO CASH DIGITAL STORE</b> ✨ ━━━╮
      💎 <i>رەسمىي تېز سۈرئەتلىك پۇل قاچىلاش دۇكىنى</i> 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👋 <b>ئەسسالامۇ ئەلەيكۇم، ${customerName}!</b>

⚡️ <b>AUTO CASH</b> — سىزگە ئەڭ ئەرزان، ئەڭ بىخەتەر ۋە سېكۇنتتا يېتىپ كېلىدىغان 24/7 ئاپتوماتلاشقان رەقەملىك دۇنيا دەرۋازىسىنى ئاچىدۇ!

┏━━━━━━━━━ 🎮 <b>ئالقىشلىق پۇل قاچىلاشلار</b> ━━━━━━━━━┓
 🔫 <b>PUBG Mobile UC:</b> 60 UC تىن 8100 UC غىچە شۇئان كىرىدۇ ⚡️
 🔥 <b>Free Fire:</b> بارلىق ئالماس (Diamonds) ئەڭ ئەرزان 💎
 🎵 <b>TikTok Coins:</b> ئەڭ يۇقىرى ئېتىبار پىرسەنتى 💫
 🤖 <b>AI ئابۇنىتلىرى:</b> ChatGPT Plus، Claude Pro 🚀
 📱 <b>مەۋھۇم نومۇرلار:</b> Telegram، WhatsApp دەلىللەش 💬
 💳 <b>شامكەش (Sham Cash):</b> 24/7 سېكۇنتتا ئاپتوماتىك كىرىش 💰
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

👇 <b>سېتىۋېلىش ياكى باھالارنى كۆرۈش ئۈچۈن تۆۋەندىكى كۇنۇپكىنى بېسىپ دۇكاننى ئېچىڭ:</b>
`.trim();
}

/**
 * Build Admin VIP Control Panel Welcome Message
 */
function getAdminWelcomeMessage(adminName?: string): string {
  const name = adminName ? `@${adminName}` : 'ھۆرمەتلىك مەسئۇل باشقۇرغۇچى';
  return `
╭━━━ 👑 <b>AUTO CASH VIP باشقۇرۇش مەركىزى</b> 👑 ━━━╮
      🛡️ <i>ئاپتوماتىك نازارەت ۋە سىستېما تىزگىنلىگۈچى</i> 🛡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👋 <b>ھۆرمەتلىك باشقۇرغۇچى ${name}!</b> سۇپىنىڭ ئاپتوماتىك باشقۇرۇش مەركىزىگە خۇش كەپسىز!

⚡️ <b>سىستېما خىزمەت ھالىتى:</b> %100 پۈتۈنلەي تىرىك ۋە نورمال 🟢
🔔 <b>ئاپتوماتىك سىگنال:</b> يېڭى كەلگەن زاكازلار، شامكەش تالونلىرى ۋە ساختا تالونلار شۇئان سىزگە يەتكۈزۈلىدۇ.

👇 <b>سودا دوكلاتى ۋە دۇكاننى تۆۋەندىكى كۇنۇپكىلاردىن باشقۇرۇڭ:</b>
`.trim();
}

function getAdminInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '📊💰 بۈگۈنكى كۈنلۈك سودا دوكلاتى (/stats) 📈',
          callback_data: 'refresh_stats',
        },
      ],
      [
        {
          text: '⚡️🛍️ دۇكاننى تەكشۈرۈش | Open Store ➔',
          web_app: { url: TELEGRAM_CONFIG.storeUrl },
        },
        {
          text: '💎💳 شامكەش ئادرېسى كۆرۈش ⚡️',
          callback_data: 'quick_deposit',
        },
      ],
      [
        {
          text: '🌐🖥️ باشقۇرۇش كۆزنىكى تورى (Admin) 🔐',
          url: `${TELEGRAM_CONFIG.storeUrl}/admin`,
        },
        {
          text: '📢🔥 رەسمىي تېلېگرام قانال 🪐',
          url: TELEGRAM_CONFIG.channelUrl,
        },
      ],
    ],
  };
}

/**
 * Step-by-step Interactive Tutorial / How-to Guide
 */
function getTutorialGuideMessage(firstName?: string): string {
  const customerName = firstName ? `<b>${firstName}</b>` : 'ھۆرمەتلىك خېرىدارىمىز';
  return `
╭━━━ 💡 <b>AUTO CASH قولايلىق ئىشلىتىش قوللانمىسى</b> 💡 ━━━╮
     🚀 <i>تېز، ئاددىي ۋە 1 مىنۇتتا پۇل قاچىلاش سىرلىرى</i> 🚀
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👋 <b>سالام، ${customerName}!</b>
سۇپىمىزدىن مال سېتىۋېلىش پەقەت 4 تاللا ئاددىي باسقۇچ:

① 🛍️ <b>1-قەدەم: دۇكاننى ئېچىش</b> ➔
• تۆۋەندىكى <b>«🛍️✨ 1-قەدەم: دۇكاننى ئېچىش»</b> كۇنۇپكىسىنى بېسىڭ. تېلېگرام ئىچىدىلا دۇكان ئېچىلىدۇ!

② 🎯 <b>2-قەدەم: مەھسۇلات ۋە ID كىرگۈزۈش</b>
• قاچىلىماقچى بولغان ئويۇن ياكى ئەپنى تاللاپ (مەسىلەن: PUBG UC)، ئويۇندىكى ID نومۇرىڭىزنى چاپلاڭ.

③ 💎 <b>3-قەدەم: شامكەشتىن پۇل سېلىش</b> 💳
• <b>«💎💳 2-قەدەم: شامكەش ئادرېسى ئېلىش»</b> كۇنۇپكىسىنى باسسىڭىز شامكەش نومۇرىمىز چىقىدۇ. پۇل ئەۋەتكەندىن كېيىن تالون نومۇرى (TxID) نى دۇكاندا دەلىللىسىڭىز، سېكۇنتتا ھەميانغا چۈشىدۇ!

④ ⚡️ <b>4-قەدەم: سېكۇنتتا ئاپتوماتىك قاچىلاش</b> 🚀
• ھەميان قالدۇقىڭىز بىلەن «سېتىۋېلىش»نى باسسىڭىز، سىستېما سېكۇنت ئىچىدە ئويۇنىڭىزغا ئۇدۇل قاچىلاپ بېرىدۇ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 <b>سىناپ كۆرۈش ئۈچۈن تۆۋەندىكى كۇنۇپكىلارنىڭ بىرىنى بېسىڭ:</b>
`.trim();
}

function getTutorialInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '🛍️✨ 1-قەدەم: دۇكاننى ئېچىش | Open Store ➔',
          web_app: { url: TELEGRAM_CONFIG.storeUrl },
        },
      ],
      [
        {
          text: '💎💳 2-قەدەم: شامكەش ئادرېسى ئېلىش ⚡️',
          callback_data: 'quick_deposit',
        },
        {
          text: '🔥🎮 3-قەدەم: ئالقىشلىق مەھسۇلاتلار 🚀',
          callback_data: 'quick_catalog',
        },
      ],
      [
        {
          text: '💬✨ خېرىدارلار مۇلازىمىتىگە يېزىش 👨‍💻',
          url: TELEGRAM_CONFIG.supportUrl,
        },
        {
          text: '📢🔥 رەسمىي تېلېگرام قانال 🪐',
          url: TELEGRAM_CONFIG.channelUrl,
        },
      ],
      [
        {
          text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️',
          callback_data: 'back_to_main',
        },
      ],
    ],
  };
}

/**
 * Handle incoming Telegram Webhook Updates (Messages & Interactive Inline Buttons)
 */
export async function handleTelegramWebhook(update: any): Promise<void> {
  if (!update) return;

  const adminChatIdNum = Number(TELEGRAM_CONFIG.adminChatId);

  // A. Handle Interactive Inline Button Clicks (callback_query)
  if (update.callback_query) {
    const cq = update.callback_query;
    const cqId = cq.id;
    const fromId = Number(cq.from?.id);
    const fromUser = cq.from?.username || '';
    const data = cq.data || '';
    const message = cq.message;
    const chatId = message?.chat?.id;
    const messageId = message?.message_id;

    // Security check: register admin chat ID if from an authorized admin account
    registerAdminChatId(fromId, fromUser);
    const isAdmin = isTelegramAdmin(fromId, fromUser);

    // 1. Approve Deposit (dep_approve:<depositId>) [ADMIN ONLY]
    if (data.startsWith('dep_approve:')) {
      if (!isAdmin) {
        await answerCallbackQuery(cqId, '⚠️ كەچۈرۈڭ، بۇ مەشغۇلاتنى پەقەت مەسئۇل باشقۇرغۇچىلا قىلالايدۇ!', true);
        return;
      }
      const depositId = data.replace('dep_approve:', '').trim();
      try {
        const deposit = await getDepositByIdAsync(depositId);
        if (!deposit) {
          await answerCallbackQuery(cqId, '❌ بۇ تالون خاتىرىسى تېپىلمىدى', true);
          return;
        }
        if (deposit.status !== 'pending') {
          await answerCallbackQuery(cqId, `⚠️ بۇ تالون ئاللىقاچان بىر تەرەپ قىلىنغان (${deposit.status})`, true);
          return;
        }

        const updated = await updateDepositStatusAsync(depositId, 'completed');
        if (updated) {
          await answerCallbackQuery(cqId, `✅ $${deposit.amount} خېرىدار ھەميانىغا كىرگۈزۈلدى!`, false);

          const updatedText = `
✅ <b>پۇل كىرگۈزۈش تەستىقلاندى! (COMPLETED)</b>
━━━━━━━━━━━━━━━━━━
💰 <b>سوممىسى:</b> <b>$${Number(deposit.amount).toFixed(2)} USD</b>
🏦 <b>تۈرى:</b> ${deposit.method}
🧾 <b>تالون نومۇرى (TxID):</b> <code>${deposit.txId || '—'}</code>
👤 <b>خېرىدار:</b> ${deposit.userName} (<code>${deposit.userEmail}</code>)
👑 <b>تەستىقلىغۇچى:</b> @${fromUser || 'Admin'}
⏰ <b>تەستىقلانغان ۋاقىت:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
✨ <i>مەبلەغ سۇپا سانداندىكى خېرىدار ھەميانىغا مۇۋەپپەقىيەتلىك كىرگۈزۈلدى.</i>
`.trim();

          if (chatId && messageId) {
            await editTelegramMessage(chatId, messageId, updatedText, {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📊 باشقۇرۇش كۆزنىكى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` }],
                ],
              },
            });
          }
        }
      } catch (err: any) {
        await answerCallbackQuery(cqId, `❌ تەستىقلاش مەغلۇپ بولدى: ${err?.message}`, true);
      }
      return;
    }

    // 2. Reject Deposit (dep_reject:<depositId>) [ADMIN ONLY]
    if (data.startsWith('dep_reject:')) {
      if (!isAdmin) {
        await answerCallbackQuery(cqId, '⚠️ رۇخسەت يوق: پەقەت مەسئۇل باشقۇرغۇچىلا قىلالايدۇ!', true);
        return;
      }
      const depositId = data.replace('dep_reject:', '').trim();
      try {
        const deposit = await getDepositByIdAsync(depositId);
        if (!deposit || deposit.status !== 'pending') {
          await answerCallbackQuery(cqId, '⚠️ بۇ تالون ئاللىقاچان بىر تەرەپ قىلىنغان', true);
          return;
        }
        await updateDepositStatusAsync(depositId, 'rejected');
        await answerCallbackQuery(cqId, '❌ تالون رەت قىلىندى', false);

        const updatedText = `
❌ <b>پۇل كىرگۈزۈش رەت قىلىندى! (REJECTED)</b>
━━━━━━━━━━━━━━━━━━
💰 <b>سوممىسى:</b> $${Number(deposit.amount).toFixed(2)} USD
🧾 <b>تالون نومۇرى (TxID):</b> <code>${deposit.txId || '—'}</code>
👤 <b>خېرىدار:</b> ${deposit.userName} (<code>${deposit.userEmail}</code>)
👑 <b>بىر تەرەپ قىلغۇچى:</b> @${fromUser || 'Admin'}
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
⚠️ <i>بۇ تەلەپ باشقۇرغۇچى تەرىپىدىن رەت قىلىندى، ھەميانغا پۇل قوشۇلمىدى.</i>
`.trim();

        if (chatId && messageId) {
          await editTelegramMessage(chatId, messageId, updatedText);
        }
      } catch (err: any) {
        await answerCallbackQuery(cqId, `❌ مەغلۇپ بولدى: ${err?.message}`, true);
      }
      return;
    }

    // 3. Flag Fraud (dep_fraud:<depositId>) [ADMIN ONLY]
    if (data.startsWith('dep_fraud:')) {
      if (!isAdmin) {
        await answerCallbackQuery(cqId, '⚠️ رۇخسەت يوق: پەقەت مەسئۇل باشقۇرغۇچىلا قىلالايدۇ!', true);
        return;
      }
      const depositId = data.replace('dep_fraud:', '').trim();
      try {
        const deposit = await getDepositByIdAsync(depositId);
        if (deposit && deposit.status === 'pending') {
          await updateDepositStatusAsync(depositId, 'rejected');
        }
        await answerCallbackQuery(cqId, '🚨 تالون ساختا دەپ بەلگىلەندى ۋە رەت قىلىندى!', true);

        const updatedText = `
🚨 <b>ساختىلىق دەپ بەلگىلەندى ۋە رەت قىلىندى! (FRAUD FLAGGED)</b>
━━━━━━━━━━━━━━━━━━
💰 <b>سوممىسى:</b> $${deposit ? Number(deposit.amount).toFixed(2) : '—'} USD
🧾 <b>تالون نومۇرى (TxID):</b> <code>${deposit?.txId || '—'}</code>
👤 <b>خېرىدار:</b> ${deposit?.userName || 'ئەزا'} (<code>${deposit?.userEmail || '—'}</code>)
👑 <b>بەلگىلىگۈچى:</b> @${fromUser || 'Admin'}
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
🚫 <i>بۇ ئىسپات ساختا ياكى تەكرار دەپ باھالىنىپ بىكار قىلىندى.</i>
`.trim();

        if (chatId && messageId) {
          await editTelegramMessage(chatId, messageId, updatedText);
        }
      } catch (err: any) {
        await answerCallbackQuery(cqId, `خاتالىق: ${err?.message}`, true);
      }
      return;
    }

    // 4. Refund Failed Order (ord_refund:<orderId>) [ADMIN ONLY]
    if (data.startsWith('ord_refund:')) {
      if (!isAdmin) {
        await answerCallbackQuery(cqId, '⚠️ رۇخسەت يوق: پەقەت مەسئۇل باشقۇرغۇچىلا قىلالايدۇ!', true);
        return;
      }
      const orderId = data.replace('ord_refund:', '').trim();
      try {
        const refundRes = await refundOrderBalanceAtomicAsync(
          orderId,
          'باشقۇرغۇچى تېلېگرام كۇنۇپكىسى ئارقىلىق پۇلنى قايتۇردى (خاتا ID)'
        );
        if (refundRes.success) {
          await answerCallbackQuery(cqId, '💰 پۇل خېرىدار ھەميانىغا مۇۋەپپەقىيەتلىك قايتۇرۇلدى!', true);
          if (chatId && messageId) {
            await editTelegramMessage(
              chatId,
              messageId,
              `✅ <b>زاكاز پۇلى خېرىدار ھەميانىغا تولۇق قايتۇرۇلدى! (REFUNDED)</b>\n🆔 زاكاز: <code>${orderId}</code>\n👑 بىر تەرەپ قىلغۇچى: @${fromUser}\n⏰ ۋاقتى: ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}`
            );
          }
        } else {
          await answerCallbackQuery(cqId, `⚠️ پۇل قايتۇرۇلمىدى: ${refundRes.message}`, true);
        }
      } catch (err: any) {
        await answerCallbackQuery(cqId, `❌ مەغلۇپ بولدى: ${err?.message}`, true);
      }
      return;
    }

    // 5. Quick ShamCash Deposit
    if (data === 'quick_deposit') {
      await answerCallbackQuery(cqId);
      const shamcashText = `
╭━━━ 💎💳 <b>شامكەش (Sham Cash) ئارقىلىق پۇل سېلىش</b> 💳💎 ━━━╮
       ⚡️ <i>24/7 سائەت ئاپتوماتىك سېكۇنتتا ھەميانغا كىرىش</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📌 <b>رەسمىي شامكەش ھېسابات ئادرېسىمىز (چەكسىڭىز كۆچۈرۈلىدۇ):</b>
<code>efe8a2b200d66411c7c7e296369cbba8</code>

🚀 <b>قانداق قىلىپ پۇل كىرگۈزىسز؟</b>
① يۇقىرىقى ئادرېسقا پۇل ئەۋەتىڭ.
② چىققان تالون نومۇرى (رقم العملية / TxID) نى ساقلاڭ.
③ دۇكاننىڭ «ھەميانغا پۇل كىرگۈزۈش» بېتىگە كىرگۈزۈپ «دەلىللەش» كۇنۇپكىسىنى بېسىڭ.
⚡️ تالون سېكۇنت ئىچىدە تەستىقلىنىپ، مەبلەغ ھەميىنىڭىزگە چۈشىدۇ!
`.trim();
      await showOrEditMessage(chatId, messageId, shamcashText, {
        inline_keyboard: [
          [{ text: '💎💳 ھەميانغا پۇل كىرگۈزۈش كۆزنىكى ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/deposit` } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      });
      return;
    }

    // 6. Quick Popular Catalog (Interactive Sub-Categories)
    if (data === 'quick_catalog') {
      await answerCallbackQuery(cqId);
      const catalogText = `
╭━━━ 🔥🎮 <b>AUTO CASH — مەھسۇلات ۋە باھالار</b> 🎮🔥 ━━━╮
      💎 <i>تۆۋەندىكى تۈرلەرنى بېسىپ تەپسىلىي باھالارنى كۆرۈڭ</i> 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

• 🔫 <b>PUBG Mobile UC:</b> 60 تىن 8100 UC غىچە سېكۇنتتا ⚡️
• 🔥 <b>Free Fire:</b> بارلىق ئالماس (Diamonds) تۈرلىرى 💎
• 🎵 <b>TikTok Coins:</b> ئەڭ يۇقىرى باھا ئېتىبارى 💫
• 🤖 <b>ChatGPT Plus & Claude Pro:</b> سۈنئىي ئەقىل كارتىلىرى 🧠
• 📱 <b>مەۋھۇم نومۇرلار:</b> Telegram، WhatsApp شۇئان دەلىللەش 📲
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 <b>ئۆزىڭىز قىزىققان ئويۇن ياكى ئەپنى تاللاڭ:</b>
`.trim();
      await showOrEditMessage(chatId, messageId, catalogText, {
        inline_keyboard: [
          [
            { text: '🔫 PUBG Mobile UC باھالىرى ➔', callback_data: 'cat_pubg' },
            { text: '🔥 Free Fire ئالماس باھالىرى ➔', callback_data: 'cat_freefire' },
          ],
          [
            { text: '🎵 TikTok تەڭگە باھالىرى ➔', callback_data: 'cat_tiktok' },
            { text: '🤖 ChatGPT & AI كارتىلىرى ➔', callback_data: 'cat_ai' },
          ],
          [
            { text: '⚡️🛍️ بارلىق دۇكاننى ئېچىش | WebApp ➔', web_app: { url: TELEGRAM_CONFIG.storeUrl } },
          ],
          [
            { text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' },
          ],
        ],
      });
      return;
    }

    // 6.1 Category: PUBG Mobile UC
    if (data === 'cat_pubg') {
      await answerCallbackQuery(cqId);
      const pubgText = `
╭━━━ 🔫🔥 <b>PUBG Mobile UC تېز قاچىلاش باھالىرى</b> 🔥🔫 ━━━╮
      ⚡️ <i>ID نومۇرىڭىزغا سېكۇنتتا ئاپتوماتىك كىرىدۇ</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

• 📦 <b>60 UC:</b> <b>$0.98 USD</b>
• 📦 <b>325 UC:</b> <b>$4.85 USD</b> (ئالقىشلىق 🔥)
• 📦 <b>660 UC:</b> <b>$9.60 USD</b> (Royale Pass ئۈچۈن 👑)
• 📦 <b>1800 UC:</b> <b>$23.80 USD</b>
• 📦 <b>3850 UC:</b> <b>$47.50 USD</b>
• 📦 <b>8100 UC:</b> <b>$95.00 USD</b> (چوڭ يۇقىرى دەرىجە 💎)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 سېتىۋېلىش ئۈچۈن تۆۋەندىكى كۇنۇپكىنى بېسىڭ:
`.trim();
      await showOrEditMessage(chatId, messageId, pubgText, {
        inline_keyboard: [
          [{ text: '🔫 دۇكاندىن PUBG UC ئېلىش ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/?category=games` } }],
          [{ text: '🔙🎮 بارلىق تۈرلەرگە قايتىش ↩️', callback_data: 'quick_catalog' }],
        ],
      });
      return;
    }

    // 6.2 Category: Free Fire Diamonds
    if (data === 'cat_freefire') {
      await answerCallbackQuery(cqId);
      const ffText = `
╭━━━ 🔥💎 <b>Free Fire ئالماس (Diamonds) باھالىرى</b> 💎🔥 ━━━╮
      ⚡️ <i>Player ID ئارقىلىق شۇئان قاچىلاش</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

• 💎 <b>100 + 10 ئالماس:</b> <b>$1.00 USD</b>
• 💎 <b>210 + 21 ئالماس:</b> <b>$1.95 USD</b>
• 💎 <b>530 + 53 ئالماس:</b> <b>$4.80 USD</b>
• 💎 <b>1080 + 108 ئالماس:</b> <b>$9.50 USD</b> (ئەڭ كۆپ سېتىلغان 🚀)
• 💎 <b>2200 + 220 ئالماس:</b> <b>$19.00 USD</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 سېتىۋېلىش ئۈچۈن تۆۋەندىكى كۇنۇپكىنى بېسىڭ:
`.trim();
      await showOrEditMessage(chatId, messageId, ffText, {
        inline_keyboard: [
          [{ text: '🔥 Free Fire ئالماس سېتىۋېلىش ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/?category=games` } }],
          [{ text: '🔙🎮 بارلىق تۈرلەرگە قايتىش ↩️', callback_data: 'quick_catalog' }],
        ],
      });
      return;
    }

    // 6.3 Category: TikTok Coins
    if (data === 'cat_tiktok') {
      await answerCallbackQuery(cqId);
      const ttText = `
╭━━━ 🎵💫 <b>TikTok تەڭگە (Coins) باھالىرى</b> 💫🎵 ━━━╮
      ⚡️ <i>شەخسىي ھېساباتقا شۇئان بىخەتەر قاچىلاش</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

• 🪙 <b>70 Coins:</b> <b>$0.90 USD</b>
• 🪙 <b>350 Coins:</b> <b>$4.40 USD</b>
• 🪙 <b>700 Coins:</b> <b>$8.75 USD</b>
• 🪙 <b>1400 Coins:</b> <b>$17.50 USD</b>
• 🪙 <b>3500 Coins:</b> <b>$43.50 USD</b>
• 🪙 <b>7000 Coins:</b> <b>$87.00 USD</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 سېتىۋېلىش ئۈچۈن تۆۋەندىكى كۇنۇپكىنى بېسىڭ:
`.trim();
      await showOrEditMessage(chatId, messageId, ttText, {
        inline_keyboard: [
          [{ text: '🎵 TikTok تەڭگە سېتىۋېلىش ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/?category=apps` } }],
          [{ text: '🔙🎮 بارلىق تۈرلەرگە قايتىش ↩️', callback_data: 'quick_catalog' }],
        ],
      });
      return;
    }

    // 6.4 Category: ChatGPT & AI
    if (data === 'cat_ai') {
      await answerCallbackQuery(cqId);
      const aiText = `
╭━━━ 🤖🧠 <b>سۈنئىي ئەقىل (AI) & رەقەملىك كارتىلار</b> 🧠🤖 ━━━╮
      ⚡️ <i>رەسمىي، تەستىقلانغان يۇقىرى سۈرئەتلىك مۇلازىمەت</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

• 🧠 <b>ChatGPT Plus (1 ئايلىق):</b> <b>$22.50 USD</b>
• 💡 <b>Claude Pro (1 ئايلىق):</b> <b>$22.50 USD</b>
• ✈️ <b>Telegram Premium (3 ئايلىق):</b> <b>$14.50 USD</b>
• ✈️ <b>Telegram Premium (1 يىللىق):</b> <b>$38.00 USD</b>
• 📱 <b>مەۋھۇم نومۇرلار (Telegram/WhatsApp):</b> <b>$0.50 - $2.00 USD</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 سېتىۋېلىش ئۈچۈن تۆۋەندىكى كۇنۇپكىنى بېسىڭ:
`.trim();
      await showOrEditMessage(chatId, messageId, aiText, {
        inline_keyboard: [
          [{ text: '🤖 AI ۋە مۇشتەرىلىكلەرنى ئېچىش ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/?category=subscriptions` } }],
          [{ text: '🔙🎮 بارلىق تۈرلەرگە قايتىش ↩️', callback_data: 'quick_catalog' }],
        ],
      });
      return;
    }

    // 6.5 Quick Order Tracking (Customer click)
    if (data === 'quick_track') {
      await answerCallbackQuery(cqId);
      const trackPrompt = `
╭━━━ 🔍📦 <b>AUTO CASH — زاكاز سۈرۈشتۈرۈش مەركىزى</b> 📦🔍 ━━━╮
      ⚡️ <i>24/7 نەق مەيدان جانلىق زاكاز تەكشۈرۈش</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📌 <b>زاكاز ھالىتىڭىزنى بىلمەكچىمۇسىز؟</b>
بۇ يەرگە زاكاز نومۇرىڭىزنى بىۋاسىتە يېزىپ ئەۋەتىڭ!

مەسىلەن:
<code>ord_1729000000000</code> ياكى <code>#12345678</code>

💡 <i>زاكاز نومۇرىنى توربەتتىكى «زاكازلىرىم» بېتىدىن ياكى سېتىۋالغاندىكى تالوندىن كۆچۈرۈۋالسىڭىز بولىدۇ. سىستېما سېكۇنتتا نەتىجىسىنى چىقىرىپ بېرىدۇ.</i>
`.trim();
      await showOrEditMessage(chatId, messageId, trackPrompt, {
        inline_keyboard: [
          [{ text: '📦 بارلىق زاكازلىرىم (توربەت) ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/orders` } }],
          [{ text: '💬 خېرىدارلار مۇلازىمىتى 👨‍💻', url: TELEGRAM_CONFIG.supportUrl }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      });
      return;
    }

    // 6.6 Recheck specific order
    if (data.startsWith('recheck_ord:')) {
      const ordId = data.replace('recheck_ord:', '').trim();
      await answerCallbackQuery(cqId, 'زاكاز تەكشۈرۈلۈۋاتىدۇ...');
      const order = await findOrderSafely(ordId);
      if (order) {
        const card = formatOrderTrackingCard(order);
        await showOrEditMessage(chatId, messageId, card.text, card.keyboard);
      } else {
        await answerCallbackQuery(cqId, '❌ زاكاز تېپىلمىدى', true);
      }
      return;
    }

    // 6.7 Quick Exchange Rates
    if (data === 'quick_rates') {
      await answerCallbackQuery(cqId);
      let rate = 15000;
      try {
        const s = await getSystemSettingsAsync();
        if (s?.shamcashExchangeRate) rate = s.shamcashExchangeRate;
      } catch {}
      const rateText = getExchangeRatesMessage(rate);
      await showOrEditMessage(chatId, messageId, rateText, {
        inline_keyboard: [
          [{ text: '💎💳 ھەميانغا پۇل سېلىش كۆزنىكى ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/deposit` } }],
          [{ text: '⚡️🛍️ دۇكاننى ئېچىش ➔', web_app: { url: TELEGRAM_CONFIG.storeUrl } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      });
      return;
    }

    // 6.8 Customer FAQ
    if (data === 'quick_faq') {
      await answerCallbackQuery(cqId);
      const faqText = getFaqMessage();
      await showOrEditMessage(chatId, messageId, faqText, {
        inline_keyboard: [
          [{ text: '💬✨ خېرىدارلار مۇلازىمىتى 👨‍💻', url: TELEGRAM_CONFIG.supportUrl }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      });
      return;
    }

    // 6.9 VIP Membership Perks
    if (data === 'quick_vip') {
      await answerCallbackQuery(cqId);
      const vipText = getVipMembershipMessage();
      await showOrEditMessage(chatId, messageId, vipText, {
        inline_keyboard: [
          [{ text: '👑💎 VIP ئەزالىق كۆزنىكى ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/membership` } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      });
      return;
    }

    // 6.10 App Download
    if (data === 'quick_download') {
      await answerCallbackQuery(cqId);
      const appText = getAppDownloadMessage();
      await showOrEditMessage(chatId, messageId, appText, {
        inline_keyboard: [
          [{ text: '📥 توربەتتىن APK نى بىۋاسىتە چۈشۈرۈش ➔', url: `${TELEGRAM_CONFIG.storeUrl}/download/autocash.apk` }],
          [{ text: '📲 چۈشۈرۈش مەركىزىنى ئېچىش ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/download` } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      });
      return;
    }

    // 7. Quick Guide / Tutorial
    if (data === 'quick_guide') {
      await answerCallbackQuery(cqId);
      const guideText = getTutorialGuideMessage(cq.from?.first_name);
      await showOrEditMessage(chatId, messageId, guideText, getTutorialInlineKeyboard());
      return;
    }

    // 8. Refresh Stats (Admin)
    if (data === 'refresh_stats') {
      if (!isAdmin) {
        await answerCallbackQuery(cqId, 'رۇخسەت يوق', true);
        return;
      }
      await answerCallbackQuery(cqId, 'دوكلات يېڭىلاندى!');
      const report = await getDailyFinancialStats();
      await showOrEditMessage(chatId, messageId, report, {
        inline_keyboard: [
          [
            { text: '🔄⚡️ دوكلاتنى قايتا يېڭىلاش 📊', callback_data: 'refresh_stats' },
            { text: '📊🖥️ باشقۇرۇش كۆزنىكى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
          ],
          [
            { text: '🔙🏠 باشقۇرۇش باش بېتىگە قايتىش ↩️', callback_data: 'back_to_main' },
          ],
        ],
      });
      return;
    }

    // 9. Back to Main Menu (Universal In-Place Return for Customer & Admin)
    if (data === 'back_to_main') {
      await answerCallbackQuery(cqId);
      if (isAdmin) {
        const adminWelcome = getAdminWelcomeMessage(fromUser || cq.from?.first_name);
        await showOrEditMessage(chatId, messageId, adminWelcome, getAdminInlineKeyboard());
      } else {
        const welcomeText = getWelcomeMessage(cq.from?.first_name);
        await showOrEditMessage(chatId, messageId, welcomeText, getStoreInlineKeyboard());
      }
      return;
    }

    return;
  }

  // B. Handle Text Messages & Commands
  if (!update.message) return;

  const msg = update.message;
  const chatId = msg.chat?.id;
  const text = (msg.text || '').trim();
  const from = msg.from;

  if (!chatId) return;

  // Record subscriber
  if (from) recordSubscriber(from);

  // Register admin chat ID if from an authorized admin account
  registerAdminChatId(from?.id, from?.username);
  registerAdminChatId(chatId, from?.username);

  const isAdmin = isTelegramAdmin(from?.id, from?.username) || isTelegramAdmin(chatId);

  // 1. Command /start
  if (text.startsWith('/start')) {
    if (isAdmin) {
      const adminWelcome = getAdminWelcomeMessage(from?.username || from?.first_name);
      await sendTelegramMessage(chatId, adminWelcome, {
        parse_mode: 'HTML',
        reply_markup: getAdminInlineKeyboard(),
      });
      return;
    }

    const welcomeText = getWelcomeMessage(from?.first_name);
    await sendTelegramMessage(chatId, welcomeText, {
      parse_mode: 'HTML',
      reply_markup: getStoreInlineKeyboard(),
    });
    return;
  }

  // 1.1 Command /guide, /how, /ogren (Interactive Teaching & How-To Mode)
  if (
    text.startsWith('/guide') ||
    text.startsWith('/how') ||
    text.startsWith('/ogren') ||
    text.startsWith('/tutorial') ||
    text.startsWith('/kollanma')
  ) {
    const guideText = getTutorialGuideMessage(from?.first_name);
    await sendTelegramMessage(chatId, guideText, {
      parse_mode: 'HTML',
      reply_markup: getTutorialInlineKeyboard(),
    });
    return;
  }

  // 2. Admin Command: /stats or /today (Daily Revenue & Financial Report)
  if (text === '/stats' || text === '/today' || text === '/hisob') {
    if (!isAdmin) {
      await sendTelegramMessage(chatId, '⚠️ كەچۈرۈڭ، بۇ بۇيرۇق پەقەت دۇكان باشقۇرغۇچىسىغا ئېچىۋېتىلگەن.');
      return;
    }
    const report = await getDailyFinancialStats();
    await sendTelegramMessage(chatId, report, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄⚡️ دوكلاتنى قايتا يېڭىلاش 📊', callback_data: 'refresh_stats' },
            { text: '📊🖥️ باشقۇرۇش كۆزنىكى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
          ],
          [
            { text: '🔙🏠 باشقۇرۇش باش بېتىگە قايتىش ↩️', callback_data: 'back_to_main' },
          ],
        ],
      },
    });
    return;
  }

  // 3. Admin Command: /post or /broadcast (Publish promotional ad to Channel and Users)
  if (text.startsWith('/post') || text.startsWith('/broadcast') || text.startsWith('/ad')) {
    if (!isAdmin) {
      await sendTelegramMessage(chatId, '⚠️ كەچۈرۈڭ، پەقەت دۇكان باشقۇرغۇچىسىلا ئېلان يوللىيالايدۇ.');
      return;
    }

    const content = text
      .replace(/^\/(post|broadcast|ad)/, '')
      .trim();

    if (!content) {
      await sendTelegramMessage(
        chatId,
        `💡 <b>ئېلان يوللاش ئۇسۇلى:</b>\n\n<code>/post بۇ يەرگە ئېلان مەزمۇنىنى يېزىڭ</code>\n\nمەسىلەن:\n<code>/post 🎮 بۈگۈن PUBG UC باھاسىدا %15 ئېتىبار! ھەميانغا شامكەشتىن پۇل سېلىپ، ئېتىبار باھادا سېتىۋېلىڭ.</code>`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    await sendTelegramMessage(chatId, '⏳ تەشۋىقات ئېلانى @autocash_cannel قانىلىغا ۋە بارلىق خېرىدارلارغا تارقىتىلىۋاتىدۇ...');

    const res = await broadcastAnnouncement(content, from);

    let replyResult = `📢 <b>ئېلان تارقىتىش تامام Rome:</b>\n━━━━━━━━━━━━━━━━━━\n`;
    replyResult += res.channelSuccess
      ? `✅ <b>@${TELEGRAM_CONFIG.channelUsername} قانىلىغا:</b> مۇۋەپپەقىيەتلىك تارقىتىلدى!\n`
      : `⚠️ <b>@${TELEGRAM_CONFIG.channelUsername} قانىلىغا:</b> چىقمىدى (بوتنى قانالغا باشقۇرغۇچى قىلىپ قوشۇڭ)\n`;
    replyResult += `👥 <b>خېرىدارلارغا ئەۋەتىلگىنى:</b> ${res.usersSent} كىشى\n━━━━━━━━━━━━━━━━━━`;

    await sendTelegramMessage(chatId, replyResult, { parse_mode: 'HTML' });
    return;
  }

  // 4. Command /deposit (ShamCash payment info for customers)
  if (text.startsWith('/deposit') || text.startsWith('/shamcash') || text.startsWith('/pul')) {
    const shamcashText = `
╭━━━ 💎💳 <b>شامكەش (Sham Cash) ئارقىلىق پۇل كىرگۈزۈش</b> 💳💎 ━━━╮
       ⚡️ <i>24/7 سائەت ئاپتوماتىك سېكۇنتتا كىرىش كاپالىتى</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📌 <b>بىزنىڭ رەسمىي شامكەش ھېسابات ئادرېسىمىز (چەكسىڭىز كۆچۈرۈلىدۇ):</b>
<code>efe8a2b200d66411c7c7e296369cbba8</code>

🚀 <b>پۇل كىرگۈزۈش باسقۇچلىرى:</b>
1. Sham Cash ئەپىنى ئېچىپ، يۇقىرىقى ئادرېسقا پۇل يوللاڭ.
2. پۇل يوللانغاندىن كېيىن چىققان تالون نومۇرى (رقم العملية / TxID) نى كۆچۈرۈۋېلىڭ.
3. دۇكانغا كىرىپ، «ھەميانغا پۇل كىرگۈزۈش» كۆزنىكىدىن تالون نومۇرىنى كىرگۈزۈپ «دەلىللەش» كۇنۇپكىسىنى بېسىڭ.
4. ⚡️ پۇل دەرھال سېكۇنت ئىچىدە ھەميىنىڭىزگە كىرىدۇ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

    await sendTelegramMessage(chatId, shamcashText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💎💳 ھەميانغا پۇل سېلىش كۆزنىكى ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/deposit` } },
          ],
          [
            { text: '💬✨ خېرىدارلار مۇلازىمىتى 👨‍💻', url: TELEGRAM_CONFIG.supportUrl },
            { text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' },
          ],
        ],
      },
    });
    return;
  }

  // 5. Command /catalog or /games
  if (text.startsWith('/catalog') || text.startsWith('/games') || text.startsWith('/dukan')) {
    const catalogText = `
╭━━━ 🔥🎮 <b>AUTO CASH ئەڭ ئالقىشلىق مەھسۇلاتلار</b> 🎮🔥 ━━━╮
      💎 <i>تېز سۈرئەتلىك ۋە ئەڭ ئەرزان رەقەملىك تۈرلەر</i> 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

• 🔫 <b>PUBG Mobile:</b> بارلىق 60 UC تىن 8100 UC غىچە شۇئان قاچىلاش ⚡️
• 🔥 <b>Free Fire:</b> بارلىق ئالماس (Diamonds) ئەڭ ئەرزان باھادا 💎
• 🎵 <b>TikTok:</b> ئالقىش پۇلى (TikTok Coins) ئەڭ يۇقىرى ئېتىبار 💫
• 🤖 <b>AI ئابۇنىتلىرى:</b> ChatGPT Plus، Claude Pro، Midjourney 🧠
• 📱 <b>مەۋھۇم نومۇرلار:</b> Telegram، WhatsApp، Google دەلىللەش كودى 📲
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 تۆۋەندىكى كۇنۇپكىنى بېسىپ دەرھال سېتىۋېلىڭ:
`.trim();

    await sendTelegramMessage(chatId, catalogText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⚡️🛍️ بارلىق مەھسۇلاتلارنى كۆرۈش ➔', web_app: { url: TELEGRAM_CONFIG.storeUrl } },
          ],
          [
            { text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' },
          ],
        ],
      },
    });
    return;
  }

  // 6. Command /help
  if (text.startsWith('/help')) {
    const helpText = `
╭━━━ ℹ️✨ <b>AUTO CASH ياردەم مەركىزى & بۇيرۇقلار</b> ✨ℹ️ ━━━╮
      💎 <i>24/7 سائەت سىز ئۈچۈن خىزمەت قىلىمىز</i> 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

• 🛍️ <b>/start</b> — دۇكاننى ئېچىش & قارشى ئېلىش كۆزنىكى
• 🔍 <b>/track &lt;زاكاز نومۇرى&gt;</b> — زاكاز ھالىتىنى جانلىق سۈرۈشتۈرۈش
• 💱 <b>/rates</b> — نەق مەيدان پېرېۋوت باھاسى (شامكەش / دوللار)
• 💡 <b>/guide</b> — 4 باسقۇچلۇق ئىشلىتىش قوللانمىسى
• 💳 <b>/deposit</b> — شامكەش ئادرېسى ۋە پۇل كىرگۈزۈش
• 🎮 <b>/catalog</b> — ئالقىشلىق ئويۇن ۋە ئەپلەر باھاسى
• 👑 <b>/vip</b> — VIP ئەزالىق ۋە كەش بەك ئېتىبارلىرى
• 📲 <b>/app</b> — Android ئەپ نۇسخىسىنى چۈشۈرۈش
• ❓ <b>/faq</b> — كۆپ سورىلىدىغان سوئاللار
• 💬 <b>/support</b> — خېرىدارلار مۇلازىمىتى بىلەن ئۇلىنىش
${isAdmin ? `\n👑 <b>باشقۇرغۇچى مەخسۇس بۇيرۇقلىرى:</b>\n• <b>/stats</b> — كۈنلۈك سودا، ساپ پايدا ۋە زاكاز دوكلاتى\n• <b>/post &lt;ئېلان&gt;</b> — قانال ۋە بارلىق خېرىدارلارغا ئېلان تارقىتىش\n• <b>/pinchannel</b> — قانالغا رەسمىي يېتەكچى ئېلاننى مىخلاش (Pin)\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 📢 رەسمىي قانال: @${TELEGRAM_CONFIG.channelUsername}
• 💬 خېرىدارلار مۇلازىمىتى: @${TELEGRAM_CONFIG.supportUsername}
`.trim();

    await sendTelegramMessage(chatId, helpText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⚡️🛍️ دۇكانغا كىرىش ➔', web_app: { url: TELEGRAM_CONFIG.storeUrl } },
            { text: '📢🔥 رەسمىي قانال 🪐', url: TELEGRAM_CONFIG.channelUrl },
          ],
          [
            { text: '💬✨ خېرىدارلار مۇلازىمىتى 👨‍💻', url: TELEGRAM_CONFIG.supportUrl },
            { text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' },
          ],
        ],
      },
    });
    return;
  }

  // 6.1 Command /track or /order (Live Order Status Tracking)
  if (text.startsWith('/track') || text.startsWith('/order') || text.startsWith('/status')) {
    const query = text.replace(/^\/(track|order|status)/, '').trim();
    if (!query) {
      await sendTelegramMessage(
        chatId,
        `🔍 <b>زاكاز سۈرۈشتۈرۈش ئۇسۇلى:</b>\n\n<code>/track زاكاز_نومۇرى</code>\n\nمەسىلەن:\n<code>/track ord_1729000000000</code> ياكى پەقەت زاكاز نومۇرىڭىزنى بۇ يەرگە بىۋاسىتە يېزىپ ئەۋەتسىڭىزمۇ بولىدۇ.`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📦 بارلىق زاكازلىرىم (توربەت) ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/orders` } }],
              [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
            ],
          },
        }
      );
      return;
    }

    const order = await findOrderSafely(query);
    if (order) {
      const card = formatOrderTrackingCard(order);
      await sendTelegramMessage(chatId, card.text, {
        parse_mode: 'HTML',
        reply_markup: card.keyboard,
      });
      return;
    } else {
      await sendTelegramMessage(
        chatId,
        `❌ <b>بۇنداق زاكاز نومۇرى تېپىلمىدى:</b> <code>#${query}</code>\n\nئەگەر زاكازنى يېڭىلا بەرگەن بولسىڭىز، سىستېما تەكشۈرۈشى ئۈچۈن بىر نەچچە سېكۇنت ساقلاپ قايتا سىناڭ ياكى خېرىدارلار مۇلازىمىتىمىزگە ئەۋەتىپ بېرىڭ: @${TELEGRAM_CONFIG.supportUsername}`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📦 بارلىق زاكازلىرىم (توربەت) ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/orders` } }],
              [{ text: '💬 خېرىدارلار مۇلازىمىتى 👨‍💻', url: TELEGRAM_CONFIG.supportUrl }],
              [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
            ],
          },
        }
      );
      return;
    }
  }

  // 6.2 Command /rates or /kurs (Live Exchange Rates)
  if (text.startsWith('/rates') || text.startsWith('/kurs') || text.startsWith('/rate') || text.startsWith('/perewot')) {
    let rate = 15000;
    try {
      const s = await getSystemSettingsAsync();
      if (s?.shamcashExchangeRate) rate = s.shamcashExchangeRate;
    } catch {}
    const rateMsg = getExchangeRatesMessage(rate);
    await sendTelegramMessage(chatId, rateMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎💳 ھەميانغا پۇل سېلىش كۆزنىكى ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/deposit` } }],
          [{ text: '⚡️🛍️ دۇكاننى ئېچىش ➔', web_app: { url: TELEGRAM_CONFIG.storeUrl } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      },
    });
    return;
  }

  // 6.3 Command /faq or /sorak
  if (text.startsWith('/faq') || text.startsWith('/sorak') || text.startsWith('/suallar')) {
    const faqMsg = getFaqMessage();
    await sendTelegramMessage(chatId, faqMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬✨ خېرىدارلار مۇلازىمىتى بىلەن كۆرۈشۈش 👨‍💻', url: TELEGRAM_CONFIG.supportUrl }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      },
    });
    return;
  }

  // 6.4 Command /vip or /ezaliq
  if (text.startsWith('/vip') || text.startsWith('/ezaliq') || text.startsWith('/membership')) {
    const vipMsg = getVipMembershipMessage();
    await sendTelegramMessage(chatId, vipMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '👑💎 VIP ئەزالىق كۆزنىكى ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/membership` } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      },
    });
    return;
  }

  // 6.5 Command /app or /apk or /download
  if (text.startsWith('/app') || text.startsWith('/apk') || text.startsWith('/download') || text.startsWith('/yanfon')) {
    const appMsg = getAppDownloadMessage();
    await sendTelegramMessage(chatId, appMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📥 توربەتتىن APK نى بىۋاسىتە چۈشۈرۈش ➔', url: `${TELEGRAM_CONFIG.storeUrl}/download/autocash.apk` }],
          [{ text: '📲 چۈشۈرۈش مەركىزىنى ئېچىش ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/download` } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      },
    });
    return;
  }

  // 6.6 Admin Command: /pinchannel (Publish and Pin Official Store Guide in Channel)
  if (text.startsWith('/pinchannel') || text.startsWith('/channelguide')) {
    if (!isAdmin) {
      await sendTelegramMessage(chatId, '⚠️ كەچۈرۈڭ، بۇ مەشغۇلات پەقەت باشقۇرغۇچىغىلا ئېچىۋېتىلگەن.');
      return;
    }
    await sendTelegramMessage(chatId, '⏳ @autocash_cannel قانىلىغا رەسمىي ئېلان يوللىنىپ، مىخلاندۇرۇلىۋاتىدۇ...');
    const pinRes = await pinChannelMasterGuide();
    if (pinRes.ok) {
      await sendTelegramMessage(
        chatId,
        `✅ <b>@${TELEGRAM_CONFIG.channelUsername} قانىلىغا رەسمىي يېتەكچى ئېلان مۇۋەپپەقىيەتلىك چىقىرىلدى ھەم مىخلاندى (Pinned)!</b>\n\n🆔 ئۇچۇر ID: <code>${pinRes.messageId}</code>`,
        { parse_mode: 'HTML' }
      );
    } else {
      await sendTelegramMessage(chatId, `⚠️ قانالغا مىخلاش مەغلۇپ بولدى: ${pinRes.error}`, { parse_mode: 'HTML' });
    }
    return;
  }

  // 7. Automatic Order ID Detection
  // If customer simply pastes an Order ID (like ord_..., #ord_..., or 10-36 chars alphanumeric)
  const cleanPotentialId = text.replace(/^#/, '').trim();
  if (
    cleanPotentialId.startsWith('ord_') ||
    (/^[a-zA-Z0-9_-]{8,36}$/.test(cleanPotentialId) && !text.startsWith('/'))
  ) {
    const detectedOrder = await findOrderSafely(cleanPotentialId);
    if (detectedOrder) {
      const card = formatOrderTrackingCard(detectedOrder);
      await sendTelegramMessage(chatId, card.text, {
        parse_mode: 'HTML',
        reply_markup: card.keyboard,
      });
      return;
    }
  }

  // 8. Smart Keyword Assistant for Natural Customer Messages
  const lowerText = text.toLowerCase();

  // If customer asks about exchange rate / currency / kurs
  if (
    lowerText.includes('كۇرس') ||
    lowerText.includes('پېرېۋوت') ||
    lowerText.includes('rates') ||
    lowerText.includes('kurs') ||
    lowerText.includes('لىرا')
  ) {
    let rate = 15000;
    try {
      const s = await getSystemSettingsAsync();
      if (s?.shamcashExchangeRate) rate = s.shamcashExchangeRate;
    } catch {}
    const rateMsg = getExchangeRatesMessage(rate);
    await sendTelegramMessage(chatId, rateMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎💳 ھەميانغا پۇل سېلىش كۆزنىكى ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/deposit` } }],
          [{ text: '⚡️🛍️ دۇكاننى ئېچىش ➔', web_app: { url: TELEGRAM_CONFIG.storeUrl } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      },
    });
    return;
  }

  // If customer asks about order tracking / check
  if (
    lowerText.includes('زاكاز') ||
    lowerText.includes('سۈرۈشتۈرۈش') ||
    lowerText.includes('تەكشۈرۈش') ||
    lowerText.includes('سۈرۈشتە') ||
    lowerText.includes('نومۇر')
  ) {
    const trackPrompt = `
╭━━━ 🔍📦 <b>AUTO CASH — زاكاز سۈرۈشتۈرۈش مەركىزى</b> 📦🔍 ━━━╮
      ⚡️ <i>24/7 نەق مەيدان جانلىق زاكاز تەكشۈرۈش</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📌 <b>زاكازىڭىزنىڭ ھالىتىنى كۆرمەكچىمۇسىز؟</b>
زاكاز نومۇرىڭىزنى بۇ يەرگە بىۋاسىتە يېزىپ ئەۋەتسىڭىزلا، سىستېمىمىز سېكۇنتتا تەكشۈرۈپ تەپسىلاتىنى چىقىرىپ بېرىدۇ!

مەسىلەن:
<code>ord_1729000000000</code> ياكى <code>#12345678</code>
`.trim();
    await sendTelegramMessage(chatId, trackPrompt, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📦 بارلىق زاكازلىرىم (توربەت) ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/orders` } }],
          [{ text: '💬 خېرىدارلار مۇلازىمىتى 👨‍💻', url: TELEGRAM_CONFIG.supportUrl }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      },
    });
    return;
  }

  // If customer asks about mobile app / apk
  if (
    lowerText.includes('ئەپ') ||
    lowerText.includes('apk') ||
    lowerText.includes('app') ||
    lowerText.includes('يانفون') ||
    lowerText.includes('چۈشۈر')
  ) {
    const appMsg = getAppDownloadMessage();
    await sendTelegramMessage(chatId, appMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📥 توربەتتىن APK نى بىۋاسىتە چۈشۈرۈش ➔', url: `${TELEGRAM_CONFIG.storeUrl}/download/autocash.apk` }],
          [{ text: '📲 چۈشۈرۈش مەركىزىنى ئېچىش ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/download` } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      },
    });
    return;
  }

  // If customer asks about VIP membership
  if (
    lowerText.includes('vip') ||
    lowerText.includes('ئەزالىق') ||
    lowerText.includes('كەش بەك') ||
    lowerText.includes('قايتۇرما')
  ) {
    const vipMsg = getVipMembershipMessage();
    await sendTelegramMessage(chatId, vipMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '👑💎 VIP ئەزالىق كۆزنىكى ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/membership` } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      },
    });
    return;
  }

  // If customer asks about ShamCash deposit
  if (
    lowerText.includes('شامكەش') ||
    lowerText.includes('پۇل') ||
    lowerText.includes('deposit') ||
    lowerText.includes('ھەميان') ||
    lowerText.includes('cash')
  ) {
    const shamcashText = `
╭━━━ 💎💳 <b>شامكەش (Sham Cash) ئارقىلىق پۇل سېلىش</b> 💳💎 ━━━╮
       ⚡️ <i>سېكۇنتتا ئاپتوماتىك ھەميانغا پۇل كىرگۈزۈش</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📌 <b>رەسمىي شامكەش ھېسابات ئادرېسىمىز (چەكسىڭىز كۆچۈرۈلىدۇ):</b>
<code>efe8a2b200d66411c7c7e296369cbba8</code>

🚀 پۇلنى يوللاپ بولۇپ، تالون نومۇرى (TxID) بىلەن دۇكاننىڭ «ھەميانغا پۇل كىرگۈزۈش» بېتىدىن دەلىللىسىڭىز، سېكۇنت ئىچىدە كىرىدۇ!
`.trim();

    await sendTelegramMessage(chatId, shamcashText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎💳 ھەميانغا پۇل كىرگۈزۈش كۆزنىكى ➔', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/deposit` } }],
          [
            { text: '💬✨ مۇلازىمەت بىلەن كۆرۈشۈش 👨‍💻', url: TELEGRAM_CONFIG.supportUrl },
            { text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' },
          ],
        ],
      },
    });
    return;
  }

  // If customer asks about popular games
  if (
    lowerText.includes('pubg') ||
    lowerText.includes('uc') ||
    lowerText.includes('free fire') ||
    lowerText.includes('tiktok') ||
    lowerText.includes('ئويۇن') ||
    lowerText.includes('باھا')
  ) {
    const catalogText = `
╭━━━ 🔥🎮 <b>AUTO CASH — ئالقىشلىق مەھسۇلاتلىرىمىز</b> 🎮🔥 ━━━╮
      💎 <i>تېز، بىخەتەر ۋە ئەرزان باھادا سېتىۋېلىش</i> 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

• 🔫 <b>PUBG Mobile UC:</b> 60 UC تىن 8100 UC غىچە ئەڭ ئەرزان باھادا ⚡️
• 🔥 <b>Free Fire:</b> بارلىق ئالماس (Diamonds) كارتىلىرى 💎
• 🎵 <b>TikTok Coins:</b> شۇئان قاچىلاش 💫
• 🤖 <b>AI ئابۇنىتلىرى:</b> ChatGPT Plus، Claude Pro 🧠

👇 تۆۋەندىكى كۇنۇپكىلارنى بېسىپ باھالارنى تاللاڭ ياكى دۇكاننى ئېچىڭ:
`.trim();

    await sendTelegramMessage(chatId, catalogText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔫 PUBG UC باھالىرى ➔', callback_data: 'cat_pubg' },
            { text: '🔥 Free Fire باھالىرى ➔', callback_data: 'cat_freefire' },
          ],
          [
            { text: '🎵 TikTok باھالىرى ➔', callback_data: 'cat_tiktok' },
            { text: '🤖 AI كارتىلىرى ➔', callback_data: 'cat_ai' },
          ],
          [{ text: '⚡️🛍️ دۇكاننى ئېچىش | Open Store ➔', web_app: { url: TELEGRAM_CONFIG.storeUrl } }],
          [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      },
    });
    return;
  }

  // If customer asks about support / contact
  if (
    lowerText.includes('مۇلازىمەت') ||
    lowerText.includes('ئالاقە') ||
    lowerText.includes('سۇئال') ||
    lowerText.includes('support') ||
    lowerText.includes('ياردەم') ||
    lowerText.includes('باشقۇرغۇچى')
  ) {
    const supportReply = `
╭━━━ 💬✨ <b>AUTO CASH خېرىدارلار مۇلازىمەت مەركىزى</b> ✨💬 ━━━╮
      👨‍💻 <i>24/7 سىز ئۈچۈن بىر تەرەپ قىلىمىز</i> 👨‍💻
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

سوئالىڭىز ياكى بىر تەرەپ قىلىشقا تېگىشلىك زاكازلىرىڭىز بولسا، رەسمىي خېرىدارلار مۇلازىمىتىمىزگە دەرھال يېزىڭ:
👉 @${TELEGRAM_CONFIG.supportUsername}

شۇنداقلا رەسمىي تېلېگرام قانىلىمىزغا قوشۇلۇپ ئەڭ يېڭى ئېتىبار باھالاردىن خەۋەردار بولۇڭ:
📢 @${TELEGRAM_CONFIG.channelUsername}
`.trim();

    await sendTelegramMessage(chatId, supportReply, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬✨ خېرىدارلار مۇلازىمىتىگە ئۇلىنىش 👨‍💻', url: TELEGRAM_CONFIG.supportUrl }],
          [
            { text: '📢🔥 رەسمىي قانال 🪐', url: TELEGRAM_CONFIG.channelUrl },
            { text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' },
          ],
        ],
      },
    });
    return;
  }

  // 9. Admin Quick Help Menu
  if (isAdmin) {
    const adminHelpReply = `
╭━━━ 👑🛡️ <b>AUTO CASH — باشقۇرغۇچى قولايلىق ياردەمچىسى</b> 🛡️👑 ━━━╮
      ⚡️ <i>سىستېما تېز بۇيرۇقلىرى ۋە تەڭشەكلەر</i> ⚡️
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👋 <b>ھۆرمەتلىك باشقۇرغۇچى @${from?.username || from?.first_name}!</b>
سىز سىستېمىغا بۇيرۇق ياكى ئېلان يوللىيالايسىز:

📊 <b>/stats</b> — كۈنلۈك كىرىم، ساپ پايدا ۋە زاكاز دوكلاتىنى كۆرۈش
📢 <b>/post &lt;ئېلان مەزمۇنى&gt;</b> — تېلېگرام قانىلى ۋە بارلىق خېرىدارلارغا ئېلان تارقىتىش
📌 <b>/pinchannel</b> — قانالغا رەسمىي دۇكان يېتەكچىسىنى چىقىرىش ۋە مىخلاش (Pin)
🛒 <b>/start</b> — باشقۇرغۇچى باش بەت كۆزنىكىنى ئېچىش
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 ياكى تۆۋەندىكى كۇنۇپكىلار ئارقىلىق تېز باشقۇرۇڭ:
`.trim();

    await sendTelegramMessage(chatId, adminHelpReply, {
      parse_mode: 'HTML',
      reply_markup: getAdminInlineKeyboard(),
    });
    return;
  }

  // 10. If Customer types ANY other text or question, switch to the interactive 4-step tutorial guide ("قانداق قىلىشنى ئۆگىتىش ھالىتى")
  const teachingGuideMessage = getTutorialGuideMessage(from?.first_name);

  await sendTelegramMessage(chatId, teachingGuideMessage, {
    parse_mode: 'HTML',
    reply_markup: getTutorialInlineKeyboard(),
  });
}
