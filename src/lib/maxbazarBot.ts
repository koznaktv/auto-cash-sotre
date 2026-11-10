import fs from 'fs';
import path from 'path';
import { verifySyncSession } from './syncSessions';
import { createAdminToken } from './adminAuth';
import { getOrCreateTelegramUser } from './telegramShop';
import { adjustUserBalanceAsync, getOrdersByUserIdAsync, deductBalanceAndCreateOrderAtomicAsync } from './db';

/**
 * MAX-BAZAR Telegram Mini App & Interactive Shopping Bot
 * Bot: @maxbazar_bot
 * Implements the architecture designed in 'بوت لاھىيەسى/auto_cash.html'
 */

const MAXBAZAR_BOT_TOKEN =
  (process.env.MAXBAZAR_BOT_TOKEN || '9030046429:AAFNApZlCn8JoafL1B1P6A81aOgqk_srlC0').trim();

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.auto-cash.app';

export const MAXBAZAR_PERSISTENT_KEYBOARD = {
  keyboard: [[{ text: 'باشلاش 🚀' }]],
  resize_keyboard: true,
  is_persistent: true,
};

// ==========================================
// CUSTOM PREMIUM ANIMATED EMOJIS REGISTRY
// ==========================================
export const CUSTOM_ICONS: Record<string, string> = {
  webapp: '5938398023137628324', // 🌐 توربەتتىن سېتىۋېلىش (Tested & Active)
  enter_bot: '', // 🔑 بوتقا كىرىش
  admin: '', // 👑 باشقۇرغۇچى مەركىزى
  shop: '', // 🏪 دۇكان
  topup_balance: '', // 💳 قالدۇق قاچىلاش
  orders: '', // 📦 زاكازلىرىم
  balance_history: '', // 🛍 قالدۇق تارىخى
  lang: '', // 🌐 تىل تاللاش
  channel: '', // 📢 قانال
  home: '', // 🏠 باش بەت
  back: '', // ◀️ كەينىگە
  sim_cards: '', // 💳 كارتىلارغا پۇل قاچىلاش
  telegram_sub: '', // ⭐ تىلگىرام ئەزالىق ئېچىش
  ai_apps: '', // 📱 AI ۋە ئەپلەر
  games: '', // 🎮 ئويۇنلار
  syriatel: '', // 📱 سۈرىيەتىل
  mtn: '', // 📱 ئىمتىئىن
  turkey: '', // 🇹🇷 تۈركىيە كارتىسى
  tg_premium: '', // 💎 تىلگىرام Premium
  tg_stars: '', // 🌟 تىلگىرام يۇلتۇز سېتىۋېلىش
  chatgpt: '', // 🤖 ChatGPT
  pubg: '', // 🪂 PUBG Mobile
  shamcash_verify: '', // ⚡️ شامكەش تالون
};

export function btnWithIcon(label: string, iconKey: string, defaultEmoji: string, extra: Record<string, any> = {}) {
  const iconId = CUSTOM_ICONS[iconKey];
  const btn: any = { ...extra };
  if (iconId) {
    btn.text = label;
    btn.icon_custom_emoji_id = iconId;
  } else {
    btn.text = defaultEmoji ? `${defaultEmoji} ${label}` : label;
  }
  return btn;
}

// ==========================================
// 1. GLOBAL STATE & SESSIONS
// ==========================================
interface MaxBazarSession {
  selectedProvider: 'maxbazar' | 'autocash';
  history: string[];
  lang: string;
  localOrders: Array<{
    orderId: string;
    title: string;
    code: string;
    price: number;
    provider: string;
    date: string;
  }>;
}

const sessions = new Map<string, MaxBazarSession>();

function getSession(userId: string | number): MaxBazarSession {
  const key = String(userId);
  let s = sessions.get(key);
  if (!s) {
    s = {
      selectedProvider: 'maxbazar',
      history: [],
      lang: 'ug',
      localOrders: [],
    };
    sessions.set(key, s);
  }
  return s;
}

// Mock/Sandbox ShamCash Transaction Ledger
const MOCK_TX_DB: Record<string, { amount: number; used: boolean; desc: string }> = {
  '571734143': { amount: 10.0, used: false, desc: 'شامكەش كۆڭۈلدىكى تالون' },
  '999888777': { amount: 25.5, used: false, desc: 'چوڭ سوممىلىق سىناق تالون' },
  '111222333': { amount: 5.0, used: true, desc: 'ئاللىقاچان ئىشلىتىلگەن تالون' },
};

// ==========================================
// 2. PRODUCT DATA & PACKAGES (Matching auto_cash.html)
// ==========================================
interface ProductPackage {
  title: string;
  code: string;
  price: number;
}

interface CategoryData {
  name: string;
  autocash: ProductPackage[];
  maxbazar: ProductPackage[];
}

export const PROVIDER_DATA: Record<string, CategoryData> = {
  'topup:syriatel': {
    name: '📱 سۈرىيەتىل (Syriatel)',
    autocash: [
      { title: '⚡️ 10,000 لىرا — $0.72', code: 'syr:10k:ac', price: 0.72 },
      { title: '⚡️ 25,000 لىرا — $1.78', code: 'syr:25k:ac', price: 1.78 },
      { title: '⚡️ 50,000 لىرا — $3.50', code: 'syr:50k:ac', price: 3.50 },
      { title: '⚡️ 100,000 لىرا — $6.95', code: 'syr:100k:ac', price: 6.95 },
    ],
    maxbazar: [
      { title: '⚡️ 10,000 لىرا — $0.70', code: 'syr:10k:mb', price: 0.70 },
      { title: '⚡️ 25,000 لىرا — $1.74', code: 'syr:25k:mb', price: 1.74 },
      { title: '⚡️ 50,000 لىرا — $3.45', code: 'syr:50k:mb', price: 3.45 },
      { title: '⚡️ 100,000 لىرا — $6.85', code: 'syr:100k:mb', price: 6.85 },
    ],
  },
  'topup:mtn': {
    name: '📱 ئىمتىئىن (MTN)',
    autocash: [
      { title: '⚡️ 10,000 لىرا — $0.72', code: 'mtn:10k:ac', price: 0.72 },
      { title: '⚡️ 25,000 لىرا — $1.78', code: 'mtn:25k:ac', price: 1.78 },
      { title: '⚡️ 50,000 لىرا — $3.50', code: 'mtn:50k:ac', price: 3.50 },
    ],
    maxbazar: [
      { title: '⚡️ 10,000 لىرا — $0.69', code: 'mtn:10k:mb', price: 0.69 },
      { title: '⚡️ 25,000 لىرا — $1.72', code: 'mtn:25k:mb', price: 1.72 },
      { title: '⚡️ 50,000 لىرا — $3.40', code: 'mtn:50k:mb', price: 3.40 },
    ],
  },
  'topup:turkey': {
    name: '🇹🇷 تۈركىيە كارتىسى (Turkcell / Vodafone)',
    autocash: [
      { title: '🇹🇷 100 TL — $3.20', code: 'tr:100:ac', price: 3.20 },
      { title: '🇹🇷 200 TL — $6.30', code: 'tr:200:ac', price: 6.30 },
      { title: '🇹🇷 500 TL — $15.50', code: 'tr:500:ac', price: 15.50 },
    ],
    maxbazar: [
      { title: '🇹🇷 100 TL — $3.15', code: 'tr:100:mb', price: 3.15 },
      { title: '🇹🇷 200 TL — $6.20', code: 'tr:200:mb', price: 6.20 },
      { title: '🇹🇷 500 TL — $15.30', code: 'tr:500:mb', price: 15.30 },
    ],
  },
  'tg:premium': {
    name: '💎 تىلگىرام Premium ئەزالىق',
    autocash: [
      { title: '⭐️ 3 ئايلىق — $12.50', code: 'tg:3m:ac', price: 12.50 },
      { title: '⭐️ 6 ئايلىق — $18.90', code: 'tg:6m:ac', price: 18.90 },
      { title: '⭐️ 12 ئايلىق (1 يىل) — $31.00', code: 'tg:12m:ac', price: 31.00 },
    ],
    maxbazar: [
      { title: '⭐️ 3 ئايلىق — $11.90', code: 'tg:3m:mb', price: 11.90 },
      { title: '⭐️ 6 ئايلىق — $17.95', code: 'tg:6m:mb', price: 17.95 },
      { title: '⭐️ 12 ئايلىق (1 يىل) — $29.80', code: 'tg:12m:mb', price: 29.80 },
    ],
  },
  'tg:stars': {
    name: '🌟 تىلگىرام يۇلتۇز (Stars)',
    autocash: [
      { title: '🌟 50 Stars — $1.10', code: 'stars:50:ac', price: 1.10 },
      { title: '🌟 100 Stars — $2.15', code: 'stars:100:ac', price: 2.15 },
      { title: '🌟 500 Stars — $10.20', code: 'stars:500:ac', price: 10.20 },
    ],
    maxbazar: [
      { title: '🌟 50 Stars — $1.05', code: 'stars:50:mb', price: 1.05 },
      { title: '🌟 100 Stars — $2.05', code: 'stars:100:mb', price: 2.05 },
      { title: '🌟 500 Stars — $9.90', code: 'stars:500:mb', price: 9.90 },
    ],
  },
  'apps:chatgpt': {
    name: '🤖 ChatGPT Plus / Team',
    autocash: [
      { title: '🔑 1 ئايلىق شەخسىي ئېچىش — $21.00', code: 'gpt:1m_p:ac', price: 21.00 },
      { title: '👥 1 ئايلىق ئورتاق ھېسابات — $5.00', code: 'gpt:1m_s:ac', price: 5.00 },
    ],
    maxbazar: [
      { title: '🔑 1 ئايلىق شەخسىي ئېچىش — $19.90', code: 'gpt:1m_p:mb', price: 19.90 },
      { title: '👥 1 ئايلىق ئورتاق ھېسابات — $4.50', code: 'gpt:1m_s:mb', price: 4.50 },
    ],
  },
  'games:pubg': {
    name: '🪂 PUBG Mobile UC',
    autocash: [
      { title: '🪙 60 UC — $0.98', code: 'pubg:60:ac', price: 0.98 },
      { title: '🪙 325 UC — $4.85', code: 'pubg:325:ac', price: 4.85 },
      { title: '🪙 660 UC — $9.60', code: 'pubg:660:ac', price: 9.60 },
    ],
    maxbazar: [
      { title: '🪙 60 UC — $0.94', code: 'pubg:60:mb', price: 0.94 },
      { title: '🪙 325 UC — $4.65', code: 'pubg:325:mb', price: 4.65 },
      { title: '🪙 660 UC — $9.20', code: 'pubg:660:mb', price: 9.20 },
    ],
  },
};

function findPackageByCode(code: string, provider: 'maxbazar' | 'autocash'): { title: string; price: number } | null {
  for (const cat in PROVIDER_DATA) {
    const item = PROVIDER_DATA[cat];
    const pkgs = provider === 'maxbazar' ? item.maxbazar : item.autocash;
    for (const p of pkgs) {
      if (p.code === code) {
        return { title: p.title, price: p.price };
      }
    }
  }
  return null;
}

// ==========================================
// 3. API CALLER
// ==========================================
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

async function showOrEditMessage(
  chatId: number | string,
  messageId: number | undefined,
  text: string,
  replyMarkup?: any
) {
  if (messageId) {
    try {
      const editRes = await callMaxBazarBotApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
        disable_web_page_preview: true,
      });
      if (editRes && editRes.ok) return editRes;
    } catch {}
  }
  return await callMaxBazarBotApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

// ==========================================
// 4. MENU RENDERER
// ==========================================
function getMenuContent(
  menuId: string,
  user: any,
  session: MaxBazarSession,
  chatId: number | string,
  isAdmin: boolean
): { text: string; inline_keyboard: any[][] } {
  const isAc = session.selectedProvider === 'autocash';
  const providerTag = isAc ? 'AUTO CASH' : 'MAX-BAZAR';
  const balance = Number(user.balance || 0).toFixed(2);

  // 1. Main Welcome Screen (menu:main)
  if (menuId === 'menu:main') {
    const text =
      `🌟 <b>ئەسسالامۇ ئەلەيكۇم، MAX-BAZAR بوت سۇپىمىزغا كەلگىنىڭىزنى قارشى ئالىمىز!</b>\n\n` +
      `تۆۋەندىن بىر بۆلەكنى تاللاڭ:`;

    const inline_keyboard: any[][] = [
      [btnWithIcon('بوتقا كىرىش', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
      [btnWithIcon('توربەتتىن سېتىۋېلىش', 'webapp', '🌐', { web_app: { url: `${SITE_URL}/apps` } })],
    ];

    if (isAdmin) {
      const adminToken = createAdminToken();
      inline_keyboard.push([
        btnWithIcon('باشقۇرغۇچى مەركىزى (MAX-BAZAR)', 'admin', '👑', {
          web_app: { url: `${SITE_URL}/admin?tab=maxbazar&token=${adminToken}` },
        }),
      ]);
    }

    return { text, inline_keyboard };
  }

  // 2. Profile Dashboard (menu:enter)
  if (menuId === 'menu:enter') {
    const text =
      `👋 <b>ئەسسالامۇ ئەلەيكۇم ھۆرمەتلىك خېرىدار!</b>\n\n` +
      `👤 <b>سىزنىڭ ئىسمىڭىز:</b> ${user.name || 'خېرىدار'}\n` +
      `🆔 <b>سىزنىڭ ID نۇمۇرىڭىز:</b> <code>${chatId}</code>\n` +
      `💰 <b>سىزنىڭ قالدۇق سوممىڭىز:</b> <b>$${balance} USD</b>\n\n` +
      `⚡️ <i>كېرەكلىك بۆلەكنى تۆۋەندىن تاللاڭ:</i>`;

    const inline_keyboard: any[][] = [
      [
        { text: '🏪 دۇكان', callback_data: 'shop:home' },
        { text: '💳 قالدۇق قاچىلاش', callback_data: 'balance:topup' },
      ],
      [
        { text: '📦 زاكازلىرىم', callback_data: 'orders:list' },
        { text: '🛍 قالدۇق تارىخى', callback_data: 'orders:bought' },
      ],
      [
        { text: '🌐 تىل تاللاش', callback_data: 'settings:lang' },
        { text: '📢 قانال', url: 'https://t.me/Auto_Cash_24' },
      ],
      [{ text: '🏠 باش بەتكە قايتىش', callback_data: 'menu:main' }],
    ];

    return { text, inline_keyboard };
  }

  // 3. Shop Categories Home (shop:home)
  if (menuId === 'shop:home') {
    const text =
      `🏪 <b>دۇكان بۆلۈملىرى</b>\n\n` +
      `ئېھتىياجلىق مەھسۇلات تۈرىنى تاللاڭ:`;

    const inline_keyboard: any[][] = [
      [{ text: '💳 كارتىلارغا پۇل قاچىلاش', callback_data: 'shop:topup' }],
      [{ text: '⭐ تىلگىرام ئەزالىق ئېچىش', callback_data: 'shop:membership' }],
      [{ text: '📱 AI ۋە ئەپلەر', callback_data: 'shop:apps' }],
      [{ text: '🎮 ئويۇنلار', callback_data: 'shop:games' }],
      [
        { text: '◀️ كەينىگە', callback_data: 'menu:enter' },
        { text: '🏠 باش بەت', callback_data: 'menu:main' },
      ],
    ];

    return { text, inline_keyboard };
  }

  // 4. Sub-category: Card Top-up
  if (menuId === 'shop:topup') {
    const text = `💳 <b>كارتىلارغا پۇل قاچىلاش</b>\n\nبىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [{ text: '📱 سۈرىيەتىل', callback_data: 'topup:syriatel' }],
      [{ text: '📱 ئىمتىئىن', callback_data: 'topup:mtn' }],
      [{ text: '🇹🇷 تۈركىيە كارتىسى', callback_data: 'topup:turkey' }],
      [
        { text: '◀️ كەينىگە', callback_data: 'shop:home' },
        { text: '🏠 باش بەت', callback_data: 'menu:main' },
      ],
    ];
    return { text, inline_keyboard };
  }

  // 5. Sub-category: Telegram Membership
  if (menuId === 'shop:membership') {
    const text = `⭐ <b>تىلگىرام ئەزالىق ئېچىش</b>\n\nبىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [{ text: '💎 تىلگىرام Premium', callback_data: 'tg:premium' }],
      [{ text: '🌟 تىلگىرام يۇلتۇز سېتىۋېلىش', callback_data: 'tg:stars' }],
      [
        { text: '◀️ كەينىگە', callback_data: 'shop:home' },
        { text: '🏠 باش بەت', callback_data: 'menu:main' },
      ],
    ];
    return { text, inline_keyboard };
  }

  // 6. Sub-category: AI & Apps
  if (menuId === 'shop:apps') {
    const text = `📱 <b>ھەر خىل AI ۋە ئەپلەرگە ئەزالىق ئېچىش</b>\n\nبىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [{ text: '🤖 ChatGPT', callback_data: 'apps:chatgpt' }],
      [
        { text: '◀️ كەينىگە', callback_data: 'shop:home' },
        { text: '🏠 باش بەت', callback_data: 'menu:main' },
      ],
    ];
    return { text, inline_keyboard };
  }

  // 7. Sub-category: Games
  if (menuId === 'shop:games') {
    const text = `🎮 <b>ئويۇنلار</b>\n\nبىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [{ text: '🪂 PUBG Mobile', callback_data: 'games:pubg' }],
      [
        { text: '◀️ كەينىگە', callback_data: 'shop:home' },
        { text: '🏠 باش بەت', callback_data: 'menu:main' },
      ],
    ];
    return { text, inline_keyboard };
  }

  // 8. Specific Product Package Page (with Provider Switcher)
  if (PROVIDER_DATA[menuId]) {
    const item = PROVIDER_DATA[menuId];
    const pkgs = isAc ? item.autocash : item.maxbazar;

    const text =
      `${item.name}\n\n` +
      `🌐 <b>تەمىنلىگۈچى:</b> <b>${providerTag}</b>\n` +
      `💳 <b>ھازىرقى قالدۇقىڭىز:</b> <b>$${balance} USD</b>\n\n` +
      `تۆۋەندىن ئېھتىياجلىق بولاقنى تاللاڭ:`;

    const inline_keyboard: any[][] = [
      [
        {
          text: `${isAc ? '🔘' : '⚪'} AUTO CASH`,
          callback_data: `set_prov:autocash:${menuId}`,
        },
        {
          text: `${!isAc ? '🔘' : '⚪'} MAX-BAZAR`,
          callback_data: `set_prov:maxbazar:${menuId}`,
        },
      ],
      ...pkgs.map((p) => [
        {
          text: p.title,
          callback_data: `buy:${menuId}:${p.code}`,
        },
      ]),
      [
        { text: '◀️ كەينىگە', callback_data: 'shop:home' },
        { text: '🏠 باش بەت', callback_data: 'menu:main' },
      ],
    ];

    return { text, inline_keyboard };
  }

  // 9. Buy Confirmation Screen (buy:...)
  if (menuId.startsWith('buy:')) {
    const parts = menuId.split(':');
    const catKey = parts[1] + ':' + parts[2];
    const pkgCode = parts[3];

    const pkg = findPackageByCode(pkgCode, session.selectedProvider);
    const title = pkg?.title || pkgCode;
    const price = pkg?.price || 1.0;

    const text =
      `🛒 <b>سېتىۋېلىشنى جەزملەش</b>\n\n` +
      `📦 <b>مەھسۇلات:</b> ${title}\n` +
      `💰 <b>باھاسى:</b> <b>$${price.toFixed(2)} USD</b>\n` +
      `💳 <b>سىزنىڭ قالدۇقىڭىز:</b> <b>$${balance} USD</b>\n` +
      `🌐 <b>تەمىنلىگۈچى:</b> <b>${providerTag}</b>\n\n` +
      `زاكاسنى جەزملەشتۈرۈپ ھېساباتتىن كېسىشنى خالامسىز؟`;

    const inline_keyboard: any[][] = [
      [
        {
          text: `✅ سېتىۋېلىشنى جەزملەش ($${price.toFixed(2)})`,
          callback_data: `do_buy:${pkgCode}:${price}:${encodeURIComponent(title)}`,
        },
      ],
      [
        { text: '❌ بىكار قىلىش', callback_data: catKey },
      ],
    ];

    return { text, inline_keyboard };
  }

  // 10. ShamCash Deposit Topup (balance:topup)
  if (menuId === 'balance:topup') {
    const text =
      `💳 <b>شامكەش ئارقىلىق قالدۇق قاچىلاش</b>\n\n` +
      `شامكەش نۇمۇرىمىزنى كۆچۈرۈڭ (چەكسىڭىز كۆچۈرۈلىدۇ):\n` +
      `<code>efe8a2b200d66411c7c7e296369cbba8</code>\n\n` +
      `⚠️ <i>شامكەشتىن دوللار ئېتىڭ، سۈرىيە لىراسى قوبۇل قىلىنمايدۇ !!!</i>\n\n` +
      `پۇل ئاتقان تالون نومۇرىنى (رقم العملية) بۇ چاتقا يېزىپ يوللاڭ ياكى تۆۋەندىكى تۈگمىلەرنى چىكىڭ:`;

    const inline_keyboard: any[][] = [
      [{ text: '🔍 تالوننى تەكشۈرۈڭ', callback_data: 'balance:check_tx' }],
      [{ text: '⚡️ سىناق تالون كىرگۈزۈش (571734143)', callback_data: 'test:send_sample_tx' }],
      [{ text: '❓ (رقم العملية) دېگەن نېمە؟', callback_data: 'balance:faq_tx' }],
      [
        { text: '◀️ كەينىگە', callback_data: 'menu:enter' },
        { text: '🏠 باش بەت', callback_data: 'menu:main' },
      ],
    ];

    return { text, inline_keyboard };
  }

  // 11. FAQ for ShamCash Tx
  if (menuId === 'balance:faq_tx' || menuId === 'balance:check_tx') {
    const text =
      `❓ <b>رقم العملية دېگەن قايسى نومۇر؟</b>\n\n` +
      `شامكەشتىن پۇل ئەۋەتكەندىن كېيىن، تالوندىكى رقم العملية نومۇرىدۇر (مەسىلەن: <code>571734143</code>).\n\n` +
      `📌 <b>ئىشلىتىش ئۇسۇلى:</b>\n` +
      `1️⃣ شامكەش نومۇرىمىزغا كېرەكلىك دوللارنى ئەۋەتىڭ:\n` +
      `<code>efe8a2b200d66411c7c7e296369cbba8</code>\n` +
      `2️⃣ تالوندىكى نومۇرنى (مەسىلەن: <code>571734143</code>) مۇشۇ چاتقا يېزىپ يوللاڭ.\n` +
      `3️⃣ سىستېما نومۇرنى ئاپتوماتىك دەلىللەپ، قالدۇقىڭىزنى ھېساباتىڭىزغا قوشۇپ بېرىدۇ.`;

    const inline_keyboard: any[][] = [
      [{ text: '⚡️ سىناق تالون (571734143) بىلەن سىناش ($10.00)', callback_data: 'test:send_sample_tx' }],
      [
        { text: '◀️ كەينىگە', callback_data: 'balance:topup' },
        { text: '🏠 باش بەت', callback_data: 'menu:main' },
      ],
    ];

    return { text, inline_keyboard };
  }

  // 12. Language Settings
  if (menuId === 'settings:lang') {
    const text =
      `🌐 <b>تىلنى تاللاڭ / Choose Language:</b>\n\n` +
      `بۇ تىزىملىكتىن ئۆزىڭىزگە قولايلىق تىلنى تاللاڭ:`;

    const inline_keyboard: any[][] = [
      [
        { text: '🌙 ئۇيغۇرچە', callback_data: 'lang:ug' },
        { text: '🇸🇦 العربية', callback_data: 'lang:ar' },
      ],
      [
        { text: '🇹🇷 Türkçe', callback_data: 'lang:tr' },
        { text: '🇬🇧 English', callback_data: 'lang:en' },
      ],
      [{ text: '◀️ كەينىگە', callback_data: 'menu:enter' }],
    ];

    return { text, inline_keyboard };
  }

  // Fallback
  return {
    text: `📌 <b>مەزكۇر سەھىپە تېز پۇرسەتتە يېڭىلىنىدۇ.</b>`,
    inline_keyboard: [[{ text: '🏠 باش بەت', callback_data: 'menu:main' }]],
  };
}

// ==========================================
// 5. SHAMCASH VERIFICATION ENGINE
// ==========================================
async function handleShamCashTxVerify(chatId: number | string, txId: string, user: any) {
  const id = txId.trim();

  // 1. Mock DB Check
  if (MOCK_TX_DB[id]) {
    const record = MOCK_TX_DB[id];
    if (record.used) {
      await callMaxBazarBotApi('sendMessage', {
        chat_id: chatId,
        text:
          `⚠️ <b>بۇ تالون نومۇرى ئاللىقاچان ئىشلىتىلىپ بولغان!</b>\n\n` +
          `نومۇر: <code>${id}</code>\n` +
          `سەۋەبى: تالون بىرلا قېتىم قوبۇل قىلىنىدۇ. يېڭى پۇل ئاتقان نومۇرنى كىرگۈزۈڭ.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 قايتا تەكشۈرۈش', callback_data: 'balance:topup' }],
            [{ text: '🏠 باش بەت', callback_data: 'menu:main' }],
          ],
        },
      });
      return;
    }

    record.used = true;
    const creditAmount = record.amount;
    await adjustUserBalanceAsync(user.id, creditAmount);
    const updatedBalance = Number(user.balance || 0) + creditAmount;

    await callMaxBazarBotApi('sendMessage', {
      chat_id: chatId,
      text:
        `🎉 <b>تالون تەستىقلاندى! قالدۇق مۇۋەپپەقىيەتلىك قوشۇلدى</b>\n\n` +
        `🧾 <b>تالون نومۇرى:</b> <code>${id}</code>\n` +
        `💵 <b>قوشۇلغان سومما:</b> <b>+$${creditAmount.toFixed(2)} USD</b>\n` +
        `💰 <b>يېڭى قالدۇقىڭىز:</b> <b>$${updatedBalance.toFixed(2)} USD</b>\n\n` +
        `ھازىر دۇكان بۆلۈمىگە كىرىپ خالىغان مەھسۇلاتنى سېتىۋالالايسىز:`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏪 دۇكانغا كىرىش', callback_data: 'shop:home' }],
          [{ text: '🔑 ھېسابات تاختىسى', callback_data: 'menu:enter' }],
        ],
      },
    });
    return;
  }

  // 2. Dynamic Sandbox Auto-Credit for any 8-11 digit test numbers
  if (/^\d{8,11}$/.test(id)) {
    const testAmount = 5.0;
    await adjustUserBalanceAsync(user.id, testAmount);
    const updatedBalance = Number(user.balance || 0) + testAmount;

    await callMaxBazarBotApi('sendMessage', {
      chat_id: chatId,
      text:
        `🎉 <b>سىناق تالون دەلىللەندى! +$${testAmount.toFixed(2)} پۇل قوشۇلدى</b>\n\n` +
        `🧾 <b>تالون:</b> <code>${id}</code>\n` +
        `💵 <b>سومما:</b> <b>+$${testAmount.toFixed(2)} USD</b>\n` +
        `💰 <b>ھازىرقى قالدۇقىڭىز:</b> <b>$${updatedBalance.toFixed(2)} USD</b>\n\n` +
        `ئەمدى دۇكاندىن بىمالال مال سېتىۋالسىڭىز بولىدۇ:`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏪 دۇكانغا كىرىش', callback_data: 'shop:home' }],
          [{ text: '🔑 ھېسابات تاختىسى', callback_data: 'menu:enter' }],
        ],
      },
    });
    return;
  }

  // 3. Invalid Transaction
  await callMaxBazarBotApi('sendMessage', {
    chat_id: chatId,
    text:
      `❌ <b>تالون نومۇرى تېپىلمىدى ياكى ئىناۋەتسىز.</b>\n\n` +
      `شامكەشتىن چىققان تالوندىكى (رقم العملية) نى قايتا دەلىللەپ يېزىڭ (مەسىلەن: <code>571734143</code>).`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔄 قايتا تەكشۈرۈش', callback_data: 'balance:topup' }],
        [{ text: '🏠 باش بەت', callback_data: 'menu:main' }],
      ],
    },
  });
}

// ==========================================
// 6. MAIN WEBHOOK HANDLER
// ==========================================
export async function handleMaxBazarWebhook(update: any) {
  try {
    if (!update) return;

    const ADMIN_CHAT_ID = String(process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493').trim();
    const ADMIN_USERNAME = (process.env.TELEGRAM_ADMIN_USERNAME || 'nasrulla0996').toLowerCase().replace(/^@/, '').trim();
    const TEST_CUSTOMER_CHAT_ID = String(process.env.TELEGRAM_TEST_CUSTOMER_CHAT_ID || '8612107028').trim();

    // Whitelist for trial/testing phase:
    // 1. Admin mode: ADMIN_CHAT_ID (7575664493) or ADMIN_USERNAME (nasrulla0996)
    // 2. Customer test mode: TEST_CUSTOMER_CHAT_ID (8612107028)
    const ALLOWED_TEST_IDS = new Set([
      ADMIN_CHAT_ID,
      '7575664493',
      TEST_CUSTOMER_CHAT_ID,
      '8612107028',
    ]);

    const isAllowedTester = (id: string | number, uname?: string) => {
      const idStr = String(id || '').trim();
      const u = (uname || '').toLowerCase().replace(/^@/, '').trim();
      return ALLOWED_TEST_IDS.has(idStr) || (Boolean(u) && u === ADMIN_USERNAME);
    };

    const MAINTENANCE_NOTICE =
      `🛠️ <b>بوت تەھرىرلىنىۋاتىدۇ</b>\n\n` +
      `ھۆرمەتلىك خېرىدار، نۆۋەتتە <b>MAX-BAZAR</b> بوت سىستېمىسى سىناق ۋە تەھرىرلىنىش باسقۇچىدا تۇرۇۋاتىدۇ.\n` +
      `پات يېقىندا كۆپ خىل يېڭى مۇلازىمەتلەر بىلەن رەسمىي ئېچىۋېتىلىدۇ!\n\n` +
      `📞 ئالاقىلىشىش ياكى سۈرۈشتۈرۈش ئۈچۈن: @${ADMIN_USERNAME}`;

    // ----------------------------------------------------
    // A. HANDLE INLINE BUTTON CALLBACK QUERIES
    // ----------------------------------------------------
    if (update.callback_query) {
      const cq = update.callback_query;
      const cqId = cq.id;
      const data = (cq.data || '').trim();
      const chatId = cq.message?.chat?.id || cq.from?.id;
      const messageId = cq.message?.message_id;
      const username = (cq.from?.username || '').trim().replace(/^@/, '').toLowerCase();
      const firstName = cq.from?.first_name || 'خېرىدار';

      // Whitelist check for trial phase
      if (!isAllowedTester(chatId, username)) {
        await callMaxBazarBotApi('answerCallbackQuery', {
          callback_query_id: cqId,
          text: '⚠️ نۆۋەتتە بوت سىستېمىسى تەھرىرلىنىۋاتىدۇ، پات يېقىندا رەسمىي ئېچىۋېتىلىدۇ.',
          show_alert: true,
        });
        return;
      }

      // Always answer callback query immediately to stop spinner
      await callMaxBazarBotApi('answerCallbackQuery', { callback_query_id: cqId });

      const user = await getOrCreateTelegramUser(chatId, username, firstName);
      const session = getSession(chatId);
      const isAdmin = String(chatId) === ADMIN_CHAT_ID || (Boolean(username) && username === ADMIN_USERNAME);

      // A.1 Toggle Provider (set_prov:autocash:XXX / set_prov:maxbazar:XXX)
      if (data.startsWith('set_prov:')) {
        const parts = data.split(':');
        const newProv = parts[1] as 'maxbazar' | 'autocash';
        const returnId = parts.slice(2).join(':');
        session.selectedProvider = newProv;
        const menu = getMenuContent(returnId, user, session, chatId, isAdmin);
        await showOrEditMessage(chatId, messageId, menu.text, { inline_keyboard: menu.inline_keyboard });
        return;
      }

      // A.2 Quick Test Deposit Simulation
      if (data === 'test:send_sample_tx') {
        await handleShamCashTxVerify(chatId, '571734143', user);
        return;
      }
      if (data === 'test:send_bad_tx') {
        await handleShamCashTxVerify(chatId, '00000000', user);
        return;
      }

      // A.3 Order Execution (do_buy:CODE:PRICE:TITLE)
      if (data.startsWith('do_buy:')) {
        const parts = data.split(':');
        const pkgCode = parts[1];
        const price = parseFloat(parts[2]) || 1.0;
        const rawTitle = decodeURIComponent(parts.slice(3).join(':'));

        const currentBalance = Number(user.balance || 0);

        // Insufficient funds
        if (currentBalance < price) {
          const failText =
            `⚠️ <b>زاكاز مەغلۇپ بولدى!</b>\n\n` +
            `سەۋەبى: ھەميان قالدۇقىڭىز يەتمىدى!\n` +
            `كېرەكلىك سومما: <b>$${price.toFixed(2)} USD</b>\n` +
            `سىزنىڭ قالدۇقىڭىز: <b>$${currentBalance.toFixed(2)} USD</b>\n\n` +
            `داۋاملاشتۇرۇش ئۈچۈن ئالدى بىلەن قالدۇق تولۇقلاڭ:`;

          await showOrEditMessage(chatId, messageId, failText, {
            inline_keyboard: [
              [{ text: '💳 قالدۇق قاچىلاش', callback_data: 'balance:topup' }],
              [{ text: '🏠 باش بەت', callback_data: 'menu:main' }],
            ],
          });
          return;
        }

        // Deduct balance atomically
        const newOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        await adjustUserBalanceAsync(user.id, -price);
        const newBalance = Math.max(0, currentBalance - price);

        // Record order locally and in session
        const orderRecord = {
          orderId: newOrderId,
          title: rawTitle,
          code: pkgCode,
          price,
          provider: session.selectedProvider.toUpperCase(),
          date: new Date().toLocaleTimeString('ug', { hour: '2-digit', minute: '2-digit' }),
        };
        session.localOrders.unshift(orderRecord);

        // Also create atomic order record in database
        try {
          await deductBalanceAndCreateOrderAtomicAsync({
            userId: user.id,
            userEmail: user.email,
            serviceId: `maxbazar_${pkgCode}`,
            serviceName: rawTitle,
            packageTitle: rawTitle,
            amount: price,
            targetAccount: String(chatId),
            orderId: newOrderId,
            details: { store: 'maxbazar', provider: session.selectedProvider },
            initialStatus: 'completed',
          });
        } catch {}

        const successText =
          `🎉 <b>زاكاز مۇۋەپپەقىيەتلىك بېجىرىلدى!</b>\n\n` +
          `📦 <b>مەھسۇلات:</b> ${rawTitle}\n` +
          `🧾 <b>زاكاز نومۇرى:</b> <code>#${newOrderId}</code>\n` +
          `🌐 <b>تەمىنلىگۈچى:</b> <b>${session.selectedProvider.toUpperCase()}</b>\n` +
          `💰 <b>كېسىلگەن سومما:</b> -$${price.toFixed(2)} USD\n` +
          `💳 <b>قالغان قالدۇقىڭىز:</b> <b>$${newBalance.toFixed(2)} USD</b>\n\n` +
          `مەھسۇلات ئۇچۇرى ئاپتوماتىك ئەۋەتىلدى. رەھمەت!`;

        await showOrEditMessage(chatId, messageId, successText, {
          inline_keyboard: [
            [{ text: '📦 زاكازلىرىمنى كۆرۈش', callback_data: 'orders:list' }],
            [{ text: '🏪 دۇكانغا كىرىش', callback_data: 'shop:home' }],
            [{ text: '🏠 باش بەت', callback_data: 'menu:main' }],
          ],
        });
        return;
      }

      // A.4 Orders List Screen
      if (data === 'orders:list' || data === 'orders:bought') {
        const dbOrders = await getOrdersByUserIdAsync(user.id, user.email).catch(() => []);
        const allOrders = [...session.localOrders];
        if (dbOrders && dbOrders.length > 0) {
          dbOrders.slice(0, 5).forEach((o) => {
            if (!allOrders.some((lo) => lo.orderId === o.id)) {
              allOrders.push({
                orderId: o.id.slice(0, 8),
                title: o.packageTitle || o.serviceName,
                code: o.serviceId || 'app',
                price: Number(o.amount || 0),
                provider: 'MAX-BAZAR',
                date: new Date(o.createdAt || Date.now()).toLocaleTimeString('ug', { hour: '2-digit', minute: '2-digit' }),
              });
            }
          });
        }

        if (allOrders.length === 0) {
          const emptyText =
            `📦 <b>زاكازلىرىم</b>\n\n` +
            `سىز تېخى بىرەر زاكاز بەرمىدىڭىز.\n` +
            `دۇكان بۆلۈمىگە كىرىپ ئېھتىياجلىق مەھسۇلاتنى سېتىۋالسىڭىز بولىدۇ.`;

          await showOrEditMessage(chatId, messageId, emptyText, {
            inline_keyboard: [
              [{ text: '🏪 دۇكانغا كىرىش', callback_data: 'shop:home' }],
              [{ text: '🏠 باش بەت', callback_data: 'menu:main' }],
            ],
          });
          return;
        }

        const orderLines = allOrders
          .slice(0, 5)
          .map(
            (o) =>
              `▫️ <b>${o.title}</b>\n` +
              `   كود: <code>#${o.orderId}</code> | بەدەل: $${o.price.toFixed(2)} | ۋاقىت: ${o.date}`
          )
          .join('\n\n');

        const ordersText = `📦 <b>سىزنىڭ زاكازلىرىڭىز (${allOrders.length} دانە):</b>\n\n${orderLines}`;

        await showOrEditMessage(chatId, messageId, ordersText, {
          inline_keyboard: [
            [{ text: '🏪 داۋاملىق سېتىۋېلىش', callback_data: 'shop:home' }],
            [{ text: '🏠 باش بەت', callback_data: 'menu:main' }],
          ],
        });
        return;
      }

      // A.5 Language Switcher
      if (data.startsWith('lang:')) {
        const langCode = data.replace('lang:', '');
        session.lang = langCode;
        const langLabels: Record<string, string> = {
          ug: 'ئۇيغۇرچە 🌙',
          ar: 'العربية 🇸🇦',
          tr: 'Türkçe 🇹🇷',
          en: 'English 🇬🇧',
        };

        const confirmText = `✅ تىل مۇۋەپپەقىيەتلىك ھالدا «<b>${langLabels[langCode] || langCode}</b>» غا تەڭشەلدى.`;
        await showOrEditMessage(chatId, messageId, confirmText, {
          inline_keyboard: [
            [{ text: '🔑 ھېسابات تاختىسىغا قايتىش', callback_data: 'menu:enter' }],
            [{ text: '🏠 باش بەت', callback_data: 'menu:main' }],
          ],
        });
        return;
      }

      // A.6 Navigation & Dynamic Menus
      let nextMenuId = data;
      if (data === '@back') {
        nextMenuId = session.history.pop() || 'menu:main';
      } else if (data === 'menu:main') {
        session.history = [];
        nextMenuId = 'menu:main';
      } else {
        session.history.push(data);
      }

      const menu = getMenuContent(nextMenuId, user, session, chatId, isAdmin);
      await showOrEditMessage(chatId, messageId, menu.text, { inline_keyboard: menu.inline_keyboard });
      return;
    }

    // ----------------------------------------------------
    // B. HANDLE TEXT MESSAGES & COMMANDS
    // ----------------------------------------------------
    const message = update.message;
    if (!message || !message.chat) return;

    const chatId = message.chat.id;
    const username = (message.from?.username || '').trim().replace(/^@/, '').toLowerCase();
    const text = (message.text || '').trim();
    const firstName = message.from?.first_name || 'خېرىدار';

    // Whitelist check for trial phase
    if (!isAllowedTester(chatId, username)) {
      await callMaxBazarBotApi('sendMessage', {
        chat_id: chatId,
        text: MAINTENANCE_NOTICE,
        parse_mode: 'HTML',
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return;
    }

    const isAdmin = String(chatId) === ADMIN_CHAT_ID || (Boolean(username) && username === ADMIN_USERNAME);
    const session = getSession(chatId);
    const user = await getOrCreateTelegramUser(chatId, username, firstName);

    // B.1 Auto-record user mapping
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
      if (username) users[username] = String(chatId);
      users[String(chatId)] = String(chatId);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
    } catch {}

    // B.2 Deep Link: /start auth_XXXX (1-Click Login from Website / App)
    const authMatch = text.match(/^\/start\s+(?:auth_|login_)?([a-fA-F0-9_]{12,64})/i) || text.match(/^\/start\s+auth_([a-zA-Z0-9_]+)/i);
    if (authMatch) {
      const authToken = authMatch[1];
      try {
        const { approveTelegramLoginSessionAsync } = await import('./telegramAuthSessions');
        await approveTelegramLoginSessionAsync(authToken, user.id);

        const returnUrl = `${SITE_URL}/apps`;
        await callMaxBazarBotApi('sendMessage', {
          chat_id: chatId,
          text:
            `🎉 <b>MAX-BAZAR غا كىرىش مۇۋەپپەقىيەتلىك تەستىقلاندى!</b> 🚀\n\n` +
            `👤 ھېساباتىڭىز: <b>${user.name}</b>\n` +
            `💰 ئورتاق قالدۇقىڭىز: <b>$${Number(user.balance || 0).toFixed(2)} USD</b>\n\n` +
            `⚡️ ھازىر توربەت ياكى ئەپكە قايتسىڭىز، ھېساباتىڭىز ئۆزلۈكىدىن كىرىپ تەييار بولدى!`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍️ MAX-BAZAR ئەپ بازىرىنى ئېچىش', web_app: { url: returnUrl } }],
            ],
          },
        });
      } catch (err: any) {
        console.error('[MaxBazar Bot Auth Error]:', err?.message);
      }
      return;
    }

    // B.3 Deep Link: /start sync_XXXX (Instant 1-Click App Linking from Phone)
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
            `🎉 <b>ھېساباتىڭىز تېلېفوندىكى ئەپكە دەرھال ئۇلاندى!</b>\n\n` +
            `🎮 ئەپ: <b>${appName}</b>\n` +
            `👤 كىملىكىڭىز: <b>${verified.identity}</b>\n` +
            `💰 قالدۇقىڭىز: <b>$${verified.balance.toFixed(2)} USD</b>\n\n` +
            `📱 تېلېفوندىكى ئەپىڭىز ئۆزلۈكىدىن كىردى، ئەپكە قايتىپ بىمالال داۋاملاشتۇرۇڭ.`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: '📱 ئەپكە قايتىش', url: appUrl }]],
          },
        });
      }
      return;
    }

    // B.4 Admin Command: /admin or /manage or 'باشقۇرۇش'
    if (text === '/admin' || text === '/manage' || text === 'باشقۇرۇش' || text === 'باش تاختا') {
      if (!isAdmin) {
        await callMaxBazarBotApi('sendMessage', {
          chat_id: chatId,
          text: '⚠️ <b>كەچۈرۈڭ، بۇ مەشغۇلات پەقەت ئاساسىي دۇكان باشقۇرغۇچىسىغىلا مەخسۇس ئېچىۋېتىلگەن.</b>',
          parse_mode: 'HTML',
        });
        return;
      }

      const adminToken = createAdminToken();
      const adminMaxBazarUrl = `${SITE_URL}/admin?tab=maxbazar&token=${adminToken}`;

      await callMaxBazarBotApi('sendMessage', {
        chat_id: chatId,
        text:
          `👑 <b>ھۆرمەتلىك دۇكان باشقۇرغۇچىسى @${ADMIN_USERNAME}!</b>\n\n` +
          `📱 <b>MAX-BAZAR ۋە AUTO CASH باشقۇرغۇچى مەركىزى</b>\n` +
          `(Auto Cash تۈزۈلۈشى بويىچە MAX-BAZAR باش تاختىسى)\n\n` +
          `• بارلىق ئەپلەرنىڭ (PUBG, HOK, MLBB, MTN, Syriatel) زاكازلىرىنى بىۋاسىتە باشقۇرۇش\n` +
          `• تەمىنلىگۈچى (MaxStore) ھالىتىنى تەكشۈرۈش ۋە زاكازلارنى تاماملاش\n` +
          `• تېلېگرامما قانىلىغا «📢 قانالغا» كۇنۇپكىسى بىلەن 1لا بېسىپ تالون چىقىرىش\n\n` +
          `تۆۋەندىكى كۇنۇپكىنى بېسىپ دەرھال باشقۇرۇش كۆزنىكىگە كىرىڭ:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📱 👑 MAX-BAZAR باش تاختىسىغا كىرىش',
                web_app: { url: adminMaxBazarUrl },
              },
            ],
            [
              {
                text: '🌐 تور كۆرگۈچتە ئېچىش',
                url: adminMaxBazarUrl,
              },
            ],
          ],
        },
      });
      return;
    }

    // B.5 Numeric Input (ShamCash Transaction Verification)
    if (/^\d{6,15}$/.test(text)) {
      await handleShamCashTxVerify(chatId, text, user);
      return;
    }

    // B.6 Command /start or 'باشلاش 🚀' or 'باش بەت'
    if (
      text.startsWith('/start') ||
      text === 'باشلاش' ||
      text === 'باشلاش 🚀' ||
      text === '🚀 باشلاش' ||
      text === 'باش بەت' ||
      text.toLowerCase() === 'start'
    ) {
      session.history = [];
      const menu = getMenuContent('menu:main', user, session, chatId, isAdmin);

      // Step 1: Send persistent bottom keyboard
      await callMaxBazarBotApi('sendMessage', {
        chat_id: chatId,
        text: `✨ <b>MAX-BAZAR | ئەڭ ئەرزان رەقەملىك ئەپلەر بازىرى</b> 🚀`,
        parse_mode: 'HTML',
        reply_markup: MAXBAZAR_PERSISTENT_KEYBOARD,
      });

      // Step 2: Send main menu with inline buttons
      await callMaxBazarBotApi('sendMessage', {
        chat_id: chatId,
        text: menu.text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: menu.inline_keyboard },
      });
      return;
    }

    // B.7 Any other message: Show quick guide
    await callMaxBazarBotApi('sendMessage', {
      chat_id: chatId,
      text:
        `💡 سىز «<b>${text}</b>» دەپ ئەۋەتتىڭىز.\n\n` +
        `ئەگەر شامكەش تالون نومۇرى بولسا، پەقەت سان كىرگۈزۈڭ (مەسىلەن: <code>571734143</code>).\n` +
        `دۇكاننى ئېچىش ئۈچۈن تۆۋەندىكى كۇنۇپكىنى بېسىڭ:`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔑 بوتقا كىرىش', callback_data: 'menu:enter' }],
          [{ text: '🏠 باش بەت', callback_data: 'menu:main' }],
        ],
      },
    });
  } catch (err: any) {
    console.error('[handleMaxBazarWebhook Error]:', err?.message);
  }
}
