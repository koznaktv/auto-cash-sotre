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
} from './db';

export const TELEGRAM_CONFIG = {
  botUsername: 'Autocash_24_bot',
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
  return process.env.TELEGRAM_BOT_TOKEN || '';
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
      headers: { 'Content-Type': 'application/json' },
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
    return Boolean(data.ok);
  } catch (err: any) {
    console.error('[Telegram] editMessageText error:', err?.message);
    return false;
  }
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
⚡️ <b>يېڭى مەھسۇلات زاكازى چۈشتى! | New Order</b> ⚡️
━━━━━━━━━━━━━━━━━━
🆔 <b>زاكاز نومۇرى:</b> <code>${order.id}</code>
🎮 <b>مەھسۇلات:</b> <b>${order.serviceName || 'مەھسۇلات'}</b> - ${order.packageTitle || ''}
💰 <b>سوممىسى:</b> <b>$${Number(order.amount || 0).toFixed(2)} USD</b>
🎯 <b>قاچىلاش ھېساباتى / ID:</b> <code>${order.targetAccount || '—'}</code>
${fieldsText ? `📝 <b>قوشۇمچە ئۇچۇرلار:</b>\n${fieldsText}\n` : ''}👤 <b>خېرىدار:</b> ${order.userName || 'ئەزا'} (<code>${order.userEmail || '—'}</code>)
📊 <b>ھالىتى:</b> ⏳ <b>${order.status || 'سۈرۈشتۈرۈلمەكتە'}</b>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
`.trim();

    await sendAdminAlert(message, {
      inline_keyboard: [
        [
          { text: '🛒 دۇكاننى ئېچىش', url: TELEGRAM_CONFIG.storeUrl },
          { text: '📊 باشقۇرۇش كۆزنىكى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
        ],
      ],
    });
  } catch (e) {
    console.warn('[Telegram] notifyNewOrder error:', e);
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
💳 <b>يېڭى شامكەش پۇل كىرگۈزۈش تالونى! | New Deposit</b> 💳
━━━━━━━━━━━━━━━━━━
💰 <b>سوممىسى:</b> <b>$${Number(deposit.amount || 0).toFixed(2)} USD</b>
🏦 <b>تۈرى:</b> <b>${deposit.method || 'ShamCash (شامكەش)'}</b>
🧾 <b>تالون نومۇرى (TxID):</b> <code>${deposit.txId || '—'}</code>
👤 <b>خېرىدار:</b> ${deposit.userName || 'ئەزا'} (<code>${deposit.userEmail || '—'}</code>)
📊 <b>ھالىتى:</b> ⏳ <b>${deposit.status || 'تەكشۈرۈلمەكتە'}</b>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
👇 <b>بىۋاسىتە تېلېگرامدىن 1 كۇنۇپكا بىلەن بىر تەرەپ قىلىڭ:</b>
`.trim();

    const inlineKeyboard: any[][] = [];
    if (depositId) {
      inlineKeyboard.push([
        { text: '✅ تەستىقلاش (Approve)', callback_data: `dep_approve:${depositId}` },
        { text: '❌ رەت قىلىش (Reject)', callback_data: `dep_reject:${depositId}` },
      ]);
      inlineKeyboard.push([
        { text: '⚠️ ساختىلىق دەپ بەلگىلەش', callback_data: `dep_fraud:${depositId}` },
        { text: '📊 باشقۇرۇش مەركىزى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
      ]);
    } else {
      inlineKeyboard.push([
        { text: '📊 باشقۇرۇش مەركىزى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
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
🎉 <b>يېڭى خېرىدار تىزىملاتتى! | New Member Joined</b> 🎉
━━━━━━━━━━━━━━━━━━
👤 <b>ئىسمى:</b> <b>${user.name}</b>
📧 <b>ئېلخەت:</b> <code>${user.email}</code>
🆔 <b>خېرىدار ID:</b> <code>${user.id || '—'}</code>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
🔗 <a href="${TELEGRAM_CONFIG.storeUrl}/admin">باشقۇرۇش مەركىزىدىن كۆرۈش</a>
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
🚨 <b>خەتەر ئاگاھلاندۇرۇشى: ساختا / تەكرار شامكەش تالونى بايقالدى!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>گۇمانلىق خېرىدار:</b> ${data.userName || 'ئەزا'} (<code>${data.userEmail || '—'}</code>)
🧾 <b>تالون نومۇرى (TxID):</b> <code>${data.txId}</code>
💰 <b>ئىلتىماس قىلغان سوممىسى:</b> $${Number(data.amount || 0).toFixed(2)} USD
⚠️ <b>بايقالغان سەۋەب:</b> <b>${data.reason}</b>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
⚠️ <i>بۇ تەلەپ سىستېما تەرىپىدىن ئاپتوماتىك توسۇلدى ۋە پۇل كىرگۈزۈلمىدى.</i>
`.trim();

    await sendAdminAlert(message, {
      inline_keyboard: [
        [
          { text: '🛡️ بىخەتەرلىك تەڭشەكلىرى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
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
⚠️ <b>دىققەت: زاكاز مەغلۇپ بولدى (خاتا Player ID / تەمىنلىگۈچى رەت قىلدى)!</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>زاكاز نومۇرى:</b> <code>${data.orderId}</code>
🎮 <b>مەھسۇلات:</b> <b>${data.serviceName || 'ئويۇن مەھسۇلاتى'}</b> - ${data.packageTitle || ''}
🎯 <b>كىرگۈزگەن خاتا ID:</b> <code>${data.targetAccount || 'نامەلۇم'}</code>
💰 <b>سوممىسى:</b> $${Number(data.amount || 0).toFixed(2)} USD
👤 <b>خېرىدار:</b> ${data.userName || 'ئەزا'} (<code>${data.userEmail || '—'}</code>)
⚠️ <b>تەمىنلىگۈچى قايتۇرغان سەۋەب:</b> <code>${data.errorMessage}</code>
⏰ <b>ۋاقتى:</b> ${new Date().toLocaleString('ug-CN', { timeZone: 'Asia/Urumqi' })}
━━━━━━━━━━━━━━━━━━
👇 <b>ئەگەر پۇل قايتۇرۇلمىغان بولسا، تېلېگرامدىن 1 كۇنۇپكا بىلەن خېرىدار ھەميانىغا پۇلنى قايتۇرۇپ بېرەلەيسىز:</b>
`.trim();

    await sendAdminAlert(message, {
      inline_keyboard: [
        [
          { text: '💰 خېرىدارغا پۇل قايتۇرۇش (Refund)', callback_data: `ord_refund:${data.orderId}` },
        ],
        [
          { text: '📊 باشقۇرۇش مەركىزىدىن كۆرۈش', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
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
📊 <b>AUTO CASH كۈنلۈك سودا ۋە كىرىم دوكلاتى</b>
━━━━━━━━━━━━━━━━━━
📅 <b>تارىخ:</b> ${todayDate} (${nowUrumqi})

💰 <b>بۈگۈنكى ئومۇمىي سېتىش كىرىمى:</b> <b>$${todayRevenue.toFixed(2)} USD</b>
📈 <b>تەخمىنىي ساپ پايدا:</b> <b>+$${todayProfit.toFixed(2)} USD</b>
💳 <b>بۈگۈن كىرگەن شامكەش پۇلى:</b> <b>$${todayDepositsTotal.toFixed(2)} USD</b> (${completedDeposits.length} تال)
⏳ <b>تەستىق كۈتۈۋاتقان تالونلار:</b> <b>${allPendingDeposits.length} تال</b>

📦 <b>بۈگۈنكى زاكازلار:</b> <b>${todayOrders.length} تال</b>
  • ✅ تاماملانغىنى: <b>${completedOrders.length} تال</b>
  • ⏳ بىر تەرەپ قىلىنىۋاتقىنى: <b>${processingOrders.length} تال</b>
  • ❌ ئەمەلدىن قالغان / رەت قىلىنغان: <b>${failedOrders.length} تال</b>

👥 <b>بۈگۈنكى يېڭى ئەزالار:</b> <b>${todayUsers.length} كىشى</b> (ئومۇمىي: ${users.length} ئەزا)
🌐 <b>بۈگۈنكى توربەت زىيارەت سانى:</b> <b>${visits} قېتىم</b>
━━━━━━━━━━━━━━━━━━
👑 <i>AUTO CASH ئاپتوماتىك باشقۇرۇش مەركىزى</i>
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
📢 <b>AUTO CASH رەسمىي ئېلانى | Official Announcement</b>
━━━━━━━━━━━━━━━━━━
${content}
━━━━━━━━━━━━━━━━━━
⚡️ <b>ئەڭ ئەرزان باھادا ئويۇن ۋە ئەپلەرگە پۇل قاچىلاشنى باشلاڭ:</b>
🛒 دۇكان: ${TELEGRAM_CONFIG.storeUrl}
💬 مۇلازىمەت: @${TELEGRAM_CONFIG.supportUsername}
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

    // Security check: Only designated Admins (@nasrulla0996, @autochah_UYGHUR) can approve/reject/refund
    registerAdminChatId(fromId, fromUser);
    const isAdmin = isTelegramAdmin(fromId, fromUser);

    if (!isAdmin) {
      await answerCallbackQuery(cqId, '⚠️ كەچۈرۈڭ، بۇ مەشغۇلاتنى پەقەت مەسئۇل باشقۇرغۇچىلا قىلالايدۇ!', true);
      return;
    }

    // 1. Approve Deposit (dep_approve:<depositId>)
    if (data.startsWith('dep_approve:')) {
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

    // 2. Reject Deposit (dep_reject:<depositId>)
    if (data.startsWith('dep_reject:')) {
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

    // 3. Flag Fraud (dep_fraud:<depositId>)
    if (data.startsWith('dep_fraud:')) {
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

    // 4. Refund Failed Order (ord_refund:<orderId>)
    if (data.startsWith('ord_refund:')) {
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
    const welcomeText = `
👋 <b>ھۆرمەتلىك ${from?.first_name || 'خېرىدار'}، AUTO CASH سۇپىسىغا خۇش كەپسىز!</b>

🎮 <b>AUTO CASH</b> — بارلىق تور ئويۇنلىرى (PUBG, Free Fire)، ئەپلەر، رەقەملىك سوۋغات كارتىلىرى، سۈنئىي ئەقىل (AI) ئابۇنىتلىقى ۋە مەۋھۇم نومۇرلارغا پۇل قاچىلاشنىڭ ئەڭ ئەرزان ۋە ئىشەنچلىك رەسمىي سۇپىسى.

🚀 تۆۋەندىكى <b>«🛒 دۇكاننى ئېچىش»</b> كۇنۇپكىسىنى بېسىپ، تېلېگرام ئىچىدىن چىقمايلا دەرھال مال سېتىۋېلىڭ ۋە پۇل قاچىلاڭ!
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
              text: '📢 رەسمىي قانال',
              url: TELEGRAM_CONFIG.channelUrl,
            },
            {
              text: '💬 خېرىدارلار مۇلازىمىتى',
              url: TELEGRAM_CONFIG.supportUrl,
            },
          ],
          [
            {
              text: '📲 تېلېفون ئەپنى چۈشۈرۈش',
              url: `${TELEGRAM_CONFIG.storeUrl}/download`,
            },
          ],
        ],
      },
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
            { text: '🔄 دوكلاتنى قايتا يېڭىلاش', callback_data: 'refresh_stats' },
            { text: '📊 باشقۇرۇش كۆزنىكى', url: `${TELEGRAM_CONFIG.storeUrl}/admin` },
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
💳 <b>شامكەش (Sham Cash) ئارقىلىق پۇل كىرگۈزۈش</b>
━━━━━━━━━━━━━━━━━━
📌 <b>بىزنىڭ رەسمىي شامكەش ھېسابات ئادرېسىمىز:</b>
<code>efe8a2b200d66411c7c7e296369cbba8</code>
<i>(ئۈستىدىكى ئادرېسنى باسسىڭىز ئاپتوماتىك كۆچۈرۈلىدۇ)</i>

🚀 <b>پۇل كىرگۈزۈش باسقۇچلىرى:</b>
1. Sham Cash ئەپىنى ئېچىپ، يۇقىرىقى ئادرېسقا پۇل يوللاڭ.
2. پۇل يوللانغاندىن كېيىن چىققان تالون نومۇرى (رقم العملية / TxID) نى ساقلىۋېلىڭ.
3. دۇكانغا كىرىپ، «ھەميانغا پۇل كىرگۈزۈش» كۆزنىكىدىن تالون نومۇرىنى كىرگۈزۈپ «دەلىللەش» كۇنۇپكىسىنى بېسىڭ.
4. پۇل دەرھال سېكۇنت ئىچىدە ھەميىنىڭىزگە كىرىدۇ!
━━━━━━━━━━━━━━━━━━
`.trim();

    await sendTelegramMessage(chatId, shamcashText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💳 ھەميانغا پۇل سېلىش كۆزنىكى', web_app: { url: `${TELEGRAM_CONFIG.storeUrl}/deposit` } },
          ],
          [
            { text: '💬 خېرىدارلار مۇلازىمىتى', url: TELEGRAM_CONFIG.supportUrl },
          ],
        ],
      },
    });
    return;
  }

  // 5. Command /catalog or /games
  if (text.startsWith('/catalog') || text.startsWith('/games') || text.startsWith('/dukan')) {
    const catalogText = `
🎮 <b>AUTO CASH ئەڭ ئالقىشلىق مەھسۇلاتلار</b>
━━━━━━━━━━━━━━━━━━
• 🔫 <b>PUBG Mobile:</b> بارلىق 60 UC تىن 8100 UC غىچە شۇئان قاچىلاش
• 🔥 <b>Free Fire:</b> بارلىق ئالماس (Diamonds) تۈرلىرى
• 🎵 <b>TikTok:</b> ئالقىش پۇلى (TikTok Coins) ئەڭ ئەرزان باھادا
• 🤖 <b>AI ئابۇنىتلىرى:</b> ChatGPT Plus، Claude Pro، Midjourney
• 📱 <b>مەۋھۇم نومۇرلار:</b> Telegram، WhatsApp، Google دەلىللەش كودى
━━━━━━━━━━━━━━━━━━
تۆۋەندىكى كۇنۇپكىنى بېسىپ دەرھال سېتىۋېلىڭ:
`.trim();

    await sendTelegramMessage(chatId, catalogText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🛒 بارلىق مەھسۇلاتلارنى كۆرۈش', web_app: { url: TELEGRAM_CONFIG.storeUrl } },
          ],
        ],
      },
    });
    return;
  }

  // 6. Command /help
  if (text.startsWith('/help')) {
    const helpText = `
ℹ️ <b>AUTO CASH ياردەم مەركىزى & بۇيرۇقلار</b>
━━━━━━━━━━━━━━━━━━
• 🛒 <b>/start</b> — دۇكاننى ئېچىش & قارشى ئېلىش
• 💳 <b>/deposit</b> — شامكەش ئادرېسى ۋە پۇل كىرگۈزۈش
• 🎮 <b>/catalog</b> — ئالقىشلىق ئويۇن ۋە ئەپلەر تىزىملىكى
• 💬 <b>/support</b> — خېرىدارلار مۇلازىمىتى بىلەن ئۇلىنىش
${isAdmin ? `\n👑 <b>باشقۇرغۇچى مەخسۇس بۇيرۇقلىرى:</b>\n• <b>/stats</b> — كۈنلۈك سودا، ساپ پايدا ۋە زاكاز دوكلاتى\n• <b>/post &lt;ئېلان&gt;</b> — قانال ۋە بارلىق خېرىدارلارغا ئېلان تارقىتىش\n` : ''}
━━━━━━━━━━━━━━━━━━
• 📢 رەسمىي قانال: @${TELEGRAM_CONFIG.channelUsername}
• 💬 خېرىدارلار مۇلازىمىتى: @${TELEGRAM_CONFIG.supportUsername}
`.trim();

    await sendTelegramMessage(chatId, helpText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🛒 دۇكانغا كىرىش', web_app: { url: TELEGRAM_CONFIG.storeUrl } },
            { text: '📢 رەسمىي قانال', url: TELEGRAM_CONFIG.channelUrl },
          ],
          [
            { text: '💬 خېرىدارلار مۇلازىمىتى', url: TELEGRAM_CONFIG.supportUrl },
          ],
        ],
      },
    });
    return;
  }

  // 7. General fallback for direct messages
  const defaultReply = `
سالام ھۆرمەتلىك خېرىدار!
AUTO CASH ئاپتوماتىك دۇكىنىنى ئېچىش ئۈچۈن تۆۋەندىكى <b>«🛒 دۇكاننى ئېچىش»</b> كۇنۇپكىسىنى بېسىڭ.

سۇئال ياكى ياردەم لازىم بولسا خېرىدارلار مۇلازىمىتىگە ئالاقىلىشىڭ:
👉 @${TELEGRAM_CONFIG.supportUsername}
`.trim();

  await sendTelegramMessage(chatId, defaultReply, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🛒 دۇكاننى ئېچىش | Open Store', web_app: { url: TELEGRAM_CONFIG.storeUrl } },
        ],
        [
          { text: '💬 خېرىدارلار مۇلازىمىتى', url: TELEGRAM_CONFIG.supportUrl },
        ],
      ],
    },
  });
}
