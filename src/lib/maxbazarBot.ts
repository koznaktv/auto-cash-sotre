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
  keyboard: [[{ text: 'باشلاش', icon_custom_emoji_id: '5807943566957223210' }]],
  resize_keyboard: true,
  is_persistent: true,
};

// ==========================================
// CUSTOM PREMIUM ANIMATED EMOJIS REGISTRY
// ==========================================
export const CUSTOM_ICONS: Record<string, string> = {
  webapp: '5204382305455467942', // 🌍 توربەتكە كىرىش / تېخىمۇ كۆپ (Animated Spinning Globe)
  enter_bot: '5998929578515504488', // 🔑 بوتقا كىرىش (Logo Custom Emoji)
  admin: '5998929578515504488', // 👑 باشقۇرغۇچى مەركىزى (Logo)
  shop: '5807531546449549750', // 🔴 دۇكان (Animated Red Icon)
  topup_balance: '5264895611517300926', // 🏦 قالدۇق قاچىلاش (Animated Bank)
  orders: '5204324795843375748', // 🛍 زاكازلىرىم (Animated 3D Shopping bag)
  balance_history: '5816480536012527182', // 🚨 قالدۇق تارىخى (Animated Beacon)
  lang: '5397753673130463064', // 🌏 تىل تاللاش (Animated Earth Globe)
  channel: '6127360976250474761', // 📢 قانال (Animated 3D Megaphone)
  home: '5416041192905265756', // 🏠 باش بەت (Animated 3D Home)
  back: '5807540866528581427', // ⬅️ كەينىگە (Animated Back arrow)
  sim_cards: '5807943566957223210', // 🔽 كارتىلارغا پۇل قاچىلاش (Animated Arrow)
  wifi: '5807653471981149580', // 📍 Wi-Fi بېتاقە كارتىلىرى (Animated Pin)
  telegram_sub: '5202036282649244841', // ⭐️ تىلگىرام ئەزالىق ئېچىش (Animated 3D Star)
  ai_apps: '5204437027633786910', // 🍏 AI ۋە ئەپلەر (Animated Apple/Apps)
  games: '5336838590057974764', // 🤩 ئويۇنلار (Animated Star-Eyes Gamer)
  arena: '5202206616757238053', // 🛡️ Arena Breakout (Animated 3D Shield)
  syriatel: '5005811690890069852', // 🇸🇾 سۈرىيەتىل (Free Syria Flag animated video sticker)
  mtn: '5008131840813303418', // 🇸🇾 ئىمتىئىن (Free Syria Flag animated video sticker)
  turkey: '5807943566957223210', // 🔽 تۈركىيە كارتىسى
  tg_premium: '5202036282649244841', // ⭐️ تىلگىرام Premium (Animated 3D Star)
  tg_stars: '6136464120779638846', // ⭐ تىلگىرام يۇلتۇز سېتىۋېلىش (Animated Stars)
  chatgpt: '5204437027633786910', // 🍏 ChatGPT (Animated App)
  pubg: '5397808249279909223', // 🤓 PUBG Mobile (Animated Gamer)
  freefire: '6125128297631190435', // ❤️‍🔥 Free Fire (Animated Flaming Fire)
  card_codes: '5204096174734207869', // ✉️ كارتا كودلىرى (Animated Envelope/SMS)
  shamcash_verify: '5807943566957223210', // 🔽 شامكەش تالون
  confirm: '5317020017521359483', // ✔️ جەزملەش (Animated Green Check)
  cancel: '5316999925664347033', // ❌ بىكار قىلىش (Animated Red Cross)
  money: '5348576314771144671', // 💵 پۇل / باھا (Animated Dollar)
  order_processing: '5370896319210595146', // 🤔 زاكاز ماقۇللىنىۋاتىدۇ (Animated Thinking/Processing Emoji)
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
  'wifi:fursan_kafraya': {
    name: '📶 فۇرسان نىت (كەفەريا) - Fursan Net Kafraya',
    autocash: [
      { title: '📶 1 جيجا (3 كۈنلۈك) — $0.12', code: 'wifi:fursan_kf:1gb:ac', price: 0.12 },
      { title: '📶 2 جيجا (5 كۈنلۈك) — $0.23', code: 'wifi:fursan_kf:2gb:ac', price: 0.23 },
      { title: '📶 4 جيجا (7 كۈنلۈك) — $0.34', code: 'wifi:fursan_kf:4gb:ac', price: 0.34 },
      { title: '📶 6 جيجا (7 كۈنلۈك) — $0.45', code: 'wifi:fursan_kf:6gb:ac', price: 0.45 },
    ],
    maxbazar: [
      { title: '📶 1 جيجا (3 كۈنلۈك) — $0.11', code: 'wifi:fursan_kf:1gb:mb', price: 0.11 },
      { title: '📶 2 جيجا (5 كۈنلۈك) — $0.22', code: 'wifi:fursan_kf:2gb:mb', price: 0.22 },
      { title: '📶 4 جيجا (7 كۈنلۈك) — $0.32', code: 'wifi:fursan_kf:4gb:mb', price: 0.32 },
      { title: '📶 6 جيجا (7 كۈنلۈك) — $0.43', code: 'wifi:fursan_kf:6gb:mb', price: 0.43 },
    ],
  },
  'wifi:fursan_kafer_jalis': {
    name: '📶 فۇرسان نىت (كەفەر جالىس) - Fursan Net Kafer Jalis',
    autocash: [
      { title: '📶 1 جيجا (3 كۈنلۈك) — $0.12', code: 'wifi:fursan_kj:1gb:ac', price: 0.12 },
      { title: '📶 2 جيجا (5 كۈنلۈك) — $0.23', code: 'wifi:fursan_kj:2gb:ac', price: 0.23 },
      { title: '📶 4 جيجا (7 كۈنلۈك) — $0.34', code: 'wifi:fursan_kj:4gb:ac', price: 0.34 },
      { title: '📶 6 جيجا (7 كۈنلۈك) — $0.45', code: 'wifi:fursan_kj:6gb:ac', price: 0.45 },
    ],
    maxbazar: [
      { title: '📶 1 جيجا (3 كۈنلۈك) — $0.11', code: 'wifi:fursan_kj:1gb:mb', price: 0.11 },
      { title: '📶 2 جيجا (5 كۈنلۈك) — $0.22', code: 'wifi:fursan_kj:2gb:mb', price: 0.22 },
      { title: '📶 4 جيجا (7 كۈنلۈك) — $0.32', code: 'wifi:fursan_kj:4gb:mb', price: 0.32 },
      { title: '📶 6 جيجا (7 كۈنلۈك) — $0.43', code: 'wifi:fursan_kj:6gb:mb', price: 0.43 },
    ],
  },
  'wifi:azez_net': {
    name: '📶 ئەزىز نىت (Azez Net)',
    autocash: [
      { title: '📶 1 جيجا (3 كۈنلۈك) — $0.12', code: 'wifi:azez:1gb:ac', price: 0.12 },
      { title: '📶 2 جيجا (5 كۈنلۈك) — $0.23', code: 'wifi:azez:2gb:ac', price: 0.23 },
      { title: '📶 4 جيجا (7 كۈنلۈك) — $0.34', code: 'wifi:azez:4gb:ac', price: 0.34 },
      { title: '📶 6 جيجا (7 كۈنلۈك) — $0.45', code: 'wifi:azez:6gb:ac', price: 0.45 },
    ],
    maxbazar: [
      { title: '📶 1 جيجا (3 كۈنلۈك) — $0.11', code: 'wifi:azez:1gb:mb', price: 0.11 },
      { title: '📶 2 جيجا (5 كۈنلۈك) — $0.22', code: 'wifi:azez:2gb:mb', price: 0.22 },
      { title: '📶 4 جيجا (7 كۈنلۈك) — $0.32', code: 'wifi:azez:4gb:mb', price: 0.32 },
      { title: '📶 6 جيجا (7 كۈنلۈك) — $0.43', code: 'wifi:azez:6gb:mb', price: 0.43 },
    ],
  },
  'wifi:almujahid_net': {
    name: '📶 مۇجاھىد نىت (Al Mujahid Net)',
    autocash: [
      { title: '📶 1 جيجا (3 كۈنلۈك) — $0.12', code: 'wifi:mujahid:1gb:ac', price: 0.12 },
      { title: '📶 2 جيجا (5 كۈنلۈك) — $0.23', code: 'wifi:mujahid:2gb:ac', price: 0.23 },
      { title: '📶 4 جيجا (7 كۈنلۈك) — $0.34', code: 'wifi:mujahid:4gb:ac', price: 0.34 },
      { title: '📶 6 جيجا (7 كۈنلۈك) — $0.45', code: 'wifi:mujahid:6gb:ac', price: 0.45 },
    ],
    maxbazar: [
      { title: '📶 1 جيجا (3 كۈنلۈك) — $0.11', code: 'wifi:mujahid:1gb:mb', price: 0.11 },
      { title: '📶 2 جيجا (5 كۈنلۈك) — $0.22', code: 'wifi:mujahid:2gb:mb', price: 0.22 },
      { title: '📶 4 جيجا (7 كۈنلۈك) — $0.32', code: 'wifi:mujahid:4gb:mb', price: 0.32 },
      { title: '📶 6 جيجا (7 كۈنلۈك) — $0.43', code: 'wifi:mujahid:6gb:mb', price: 0.43 },
    ],
  },
  'topup:syriatel': {
    name: '<tg-emoji emoji-id="5005811690890069852">🇸🇾</tg-emoji> سۈرىيەتىل (Syriatel پۇل بىرلىكلىرى)',
    autocash: [],
    maxbazar: [
      { title: '🛍️ 20.19 سۈري — 0.16$', code: 'syr:20_19:mb', price: 0.16 },
      { title: '🛍️ 30.76 سۈري — 0.25$', code: 'syr:30_76:mb', price: 0.25 },
      { title: '🛍️ 40.38 سۈري — 0.33$', code: 'syr:40_38:mb', price: 0.33 },
      { title: '🛍️ 52.88 سۈري — 0.43$', code: 'syr:52_88:mb', price: 0.43 },
      { title: '🛍️ 68.27 سۈري — 0.56$', code: 'syr:68_27:mb', price: 0.56 },
      { title: '🛍️ 72.12 سۈري — 0.59$', code: 'syr:72_12:mb', price: 0.59 },
      { title: '🛍️ 77.88 سۈري — 0.63$', code: 'syr:77_88:mb', price: 0.63 },
      { title: '🛍️ 81.73 سۈري — 0.67$', code: 'syr:81_73:mb', price: 0.67 },
      { title: '🛍️ 86.54 سۈري — 0.71$', code: 'syr:86_54:mb', price: 0.71 },
      { title: '🛍️ 96.15 سۈري — 0.78$', code: 'syr:96_15:mb', price: 0.78 },
      { title: '🛍️ 100.96 سۈري — 0.82$', code: 'syr:100_96:mb', price: 0.82 },
      { title: '🛍️ 105.77 سۈري — 0.86$', code: 'syr:105_77:mb', price: 0.86 },
      { title: '🛍️ 115.38 سۈري — 0.94$', code: 'syr:115_38:mb', price: 0.94 },
      { title: '🛍️ 130.77 سۈري — 1.07$', code: 'syr:130_77:mb', price: 1.07 },
      { title: '🛍️ 144.23 سۈري — 1.18$', code: 'syr:144_23:mb', price: 1.18 },
      { title: '🛍️ 160.58 سۈري — 1.31$', code: 'syr:160_58:mb', price: 1.31 },
      { title: '🛍️ 163.46 سۈري — 1.33$', code: 'syr:163_46:mb', price: 1.33 },
      { title: '🛍️ 173.08 سۈري — 1.41$', code: 'syr:173_08:mb', price: 1.41 },
      { title: '🛍️ 183.65 سۈري — 1.50$', code: 'syr:183_65:mb', price: 1.50 },
      { title: '🛍️ 192.31 سۈري — 1.57$', code: 'syr:192_31:mb', price: 1.57 },
      { title: '🛍️ 211.54 سۈري — 1.72$', code: 'syr:211_54:mb', price: 1.72 },
      { title: '🛍️ 240.38 سۈري — 1.96$', code: 'syr:240_38:mb', price: 1.96 },
      { title: '🛍️ 288.46 سۈري — 2.35$', code: 'syr:288_46:mb', price: 2.35 },
      { title: '🛍️ 317.31 سۈري — 2.59$', code: 'syr:317_31:mb', price: 2.59 },
      { title: '🛍️ 370.19 سۈري — 3.02$', code: 'syr:370_19:mb', price: 3.02 },
      { title: '🛍️ 432.69 سۈري — 3.53$', code: 'syr:432_69:mb', price: 3.53 },
      { title: '🛍️ 480.77 سۈري — 3.92$', code: 'syr:480_77:mb', price: 3.92 },
      { title: '🛍️ 951.92 سۈري — 7.76$', code: 'syr:951_92:mb', price: 7.76 },
      { title: '🛍️ 1057.69 سۈري — 8.54$', code: 'syr:1057_69:mb', price: 8.54 },
      { title: '🛍️ 2403.85 سۈري — 19.41$', code: 'syr:2403_85:mb', price: 19.41 },
    ],
  },
  'topup:syriatel_monthly': {
    name: '<tg-emoji emoji-id="5005811690890069852">🇸🇾</tg-emoji> SyriaTel ئايلىق تورلىرى (تور + سۆزلىشىش)',
    autocash: [],
    maxbazar: [
      { title: '📦 6 GB تور + 400 دەقىقە سۆزلىشىش — $3.88', code: 'syr_m:6gb:mb', price: 3.88 },
      { title: '📦 10 GB تور + 500 دەقىقە سۆزلىشىش — $5.66', code: 'syr_m:10gb:mb', price: 5.66 },
      { title: '📦 20 GB تور + 600 دەقىقە سۆزلىشىش — $9.69', code: 'syr_m:20gb:mb', price: 9.69 },
      { title: '📦 35 GB تور + 700 دەقىقە سۆزلىشىش — $15.34', code: 'syr_m:35gb:mb', price: 15.34 },
      { title: '📦 75 GB تور + 800 دەقىقە سۆزلىشىش — $24.22', code: 'syr_m:75gb:mb', price: 24.22 },
    ],
  },
  'topup:mtn': {
    name: '<tg-emoji emoji-id="5008131840813303418">🇸🇾</tg-emoji> ئىمتىئىن (MTN سۈرىيە لىراسى)',
    autocash: [],
    maxbazar: [
      { title: '🛍️ 10 سۈرىيە لىراسى — 0.08$', code: 'mtn:10:mb', price: 0.08 },
      { title: '🛍️ 20 سۈرىيە لىراسى — 0.16$', code: 'mtn:20:mb', price: 0.16 },
      { title: '🛍️ 25 سۈرىيە لىراسى — 0.20$', code: 'mtn:25:mb', price: 0.20 },
      { title: '🛍️ 30 سۈرىيە لىراسى — 0.24$', code: 'mtn:30:mb', price: 0.24 },
      { title: '🛍️ 40 سۈرىيە لىراسى — 0.33$', code: 'mtn:40:mb', price: 0.33 },
      { title: '🛍️ 50 سۈرىيە لىراسى — 0.41$', code: 'mtn:50:mb', price: 0.41 },
      { title: '🛍️ 60 سۈرىيە لىراسى — 0.49$', code: 'mtn:60:mb', price: 0.49 },
      { title: '🛍️ 70 سۈرىيە لىراسى — 0.57$', code: 'mtn:70:mb', price: 0.57 },
      { title: '🛍️ 85 سۈرىيە لىراسى — 0.69$', code: 'mtn:85:mb', price: 0.69 },
      { title: '🛍️ 100 سۈرىيە لىراسى — 0.82$', code: 'mtn:100:mb', price: 0.82 },
      { title: '🛍️ 170 سۈرىيە لىراسى — 1.39$', code: 'mtn:170:mb', price: 1.39 },
      { title: '🛍️ 200 سۈرىيە لىراسى — 1.63$', code: 'mtn:200:mb', price: 1.63 },
      { title: '🛍️ 280 سۈرىيە لىراسى — 2.28$', code: 'mtn:280:mb', price: 2.28 },
      { title: '🛍️ 360 سۈرىيە لىراسى — 2.94$', code: 'mtn:360:mb', price: 2.94 },
      { title: '🛍️ 400 سۈرىيە لىراسى — 3.26$', code: 'mtn:400:mb', price: 3.26 },
      { title: '🛍️ 500 سۈرىيە لىراسى — 4.08$', code: 'mtn:500:mb', price: 4.08 },
      { title: '🛍️ 600 سۈرىيە لىراسى — 4.89$', code: 'mtn:600:mb', price: 4.89 },
      { title: '🛍️ 750 سۈرىيە لىراسى — 6.12$', code: 'mtn:750:mb', price: 6.12 },
      { title: '🛍️ 1000 سۈرىيە لىراسى — 8.15$', code: 'mtn:1000:mb', price: 8.15 },
      { title: '🛍️ 1500 سۈرىيە لىراسى — 12.23$', code: 'mtn:1500:mb', price: 12.23 },
      { title: '🛍️ 2000 سۈرىيە لىراسى — 16.31$', code: 'mtn:2000:mb', price: 16.31 },
      { title: '🛍️ 2500 سۈرىيە لىراسى — 20.38$', code: 'mtn:2500:mb', price: 20.38 },
      { title: '🛍️ 3000 سۈرىيە لىراسى — 24.46$', code: 'mtn:3000:mb', price: 24.46 },
      { title: '🛍️ 5000 سۈرىيە لىراسى — 40.77$', code: 'mtn:5000:mb', price: 40.77 },
    ],
  },
  'topup:mtn_monthly': {
    name: '📦 MTN ئايلىق تورلىرى (تور + سۆزلىشىش)',
    autocash: [],
    maxbazar: [
      { title: '📦 6 GB تور + 400 دەقىقە سۆزلىشىش — $4.02', code: 'mtn_m:6gb:mb', price: 4.02 },
      { title: '📦 10 GB تور + 500 دەقىقە سۆزلىشىش — $5.88', code: 'mtn_m:10gb:mb', price: 5.88 },
      { title: '📦 15 GB تور + 600 دەقىقە سۆزلىشىش — $7.57', code: 'mtn_m:15gb:mb', price: 7.57 },
      { title: '📦 25 GB تور + 700 دەقىقە سۆزلىشىش — $10.46', code: 'mtn_m:25gb:mb', price: 10.46 },
    ],
  },
  'topup:turkey': {
    name: '🇹🇷 تۈركىيە كارتىسى (Turkcell لىرا قاچىلاش)',
    autocash: [
      { title: '🇹🇷 50 TL لىرا قاچىلاش — $2.41', code: 'tr:50tl:ac', price: 2.41 },
      { title: '🇹🇷 150 TL لىرا قاچىلاش — $7.07', code: 'tr:150tl:ac', price: 7.07 },
    ],
    maxbazar: [
      { title: '🇹🇷 50 TL لىرا قاچىلاش — $2.41', code: 'tr:50tl:ac', price: 2.41 },
      { title: '🇹🇷 150 TL لىرا قاچىلاش — $7.07', code: 'tr:150tl:ac', price: 7.07 },
    ],
  },
  'topup:turkey_monthly': {
    name: '🇹🇷 Turkcell ئايلىق تور بوغچىلىرى (تور + سۆزلىشىش)',
    autocash: [
      { title: '📦 2 GB تور + 1000 دەقىقە سۆزلىشىش — $13.95', code: 'tr:1000dk_2gb:ac', price: 13.95 },
      { title: '📦 4 GB تور + 1000 دەقىقە سۆزلىشىش — $16.03', code: 'tr:1000dk_4gb:ac', price: 16.03 },
      { title: '📦 8 GB تور + 1000 دەقىقە سۆزلىشىش — $19.25', code: 'tr:1000dk_8gb:ac', price: 19.25 },
      { title: '📦 12 GB تور + 1000 دەقىقە سۆزلىشىش — $27.19', code: 'tr:1000dk_12gb:ac', price: 27.19 },
      { title: '📦 20 GB تور + 1000 دەقىقە سۆزلىشىش — $29.55', code: 'tr:1000dk_20gb:ac', price: 29.55 },
      { title: '📦 34 GB تور + 1000 دەقىقە سۆزلىشىش — $24.13', code: 'tr:1000dk_34gb:ac', price: 24.13 },
      { title: '📦 50 GB تور + 1000 دەقىقە سۆزلىشىش — $24.51', code: 'tr:1000dk_50gb:ac', price: 24.51 },
    ],
    maxbazar: [
      { title: '📦 2 GB تور + 1000 دەقىقە سۆزلىشىش — $13.95', code: 'tr:1000dk_2gb:ac', price: 13.95 },
      { title: '📦 4 GB تور + 1000 دەقىقە سۆزلىشىش — $16.03', code: 'tr:1000dk_4gb:ac', price: 16.03 },
      { title: '📦 8 GB تور + 1000 دەقىقە سۆزلىشىش — $19.25', code: 'tr:1000dk_8gb:ac', price: 19.25 },
      { title: '📦 12 GB تور + 1000 دەقىقە سۆزلىشىش — $27.19', code: 'tr:1000dk_12gb:ac', price: 27.19 },
      { title: '📦 20 GB تور + 1000 دەقىقە سۆزلىشىش — $29.55', code: 'tr:1000dk_20gb:ac', price: 29.55 },
      { title: '📦 34 GB تور + 1000 دەقىقە سۆزلىشىش — $24.13', code: 'tr:1000dk_34gb:ac', price: 24.13 },
      { title: '📦 50 GB تور + 1000 دەقىقە سۆزلىشىش — $24.51', code: 'tr:1000dk_50gb:ac', price: 24.51 },
    ],
  },
  'tg:premium': {
    name: '💎 تىلگىرام Premium ئەزالىق',
    autocash: [
      { title: '⭐️ 3 ئايلىق Premium — $14.09', code: 'tg:3m:ac', price: 14.09 },
      { title: '⭐️ 6 ئايلىق Premium — $18.79', code: 'tg:6m:ac', price: 18.79 },
      { title: '⭐️ 12 ئايلىق (1 يىل) — $34.07', code: 'tg:12m:ac', price: 34.07 },
    ],
    maxbazar: [
      { title: '⭐️ 3 ئايلىق Premium — $14.38', code: 'tg:3m:mb', price: 14.38 },
      { title: '⭐️ 6 ئايلىق Premium — $19.18', code: 'tg:6m:mb', price: 19.18 },
      { title: '⭐️ 12 ئايلىق (1 يىل) — $34.77', code: 'tg:12m:mb', price: 34.77 },
    ],
  },
  'tg:stars': {
    name: '🌟 تىلگىرام يۇلتۇز (Stars)',
    autocash: [
      { title: '🌟 50 Stars — $0.88', code: 'stars:50:ac', price: 0.88 },
      { title: '🌟 75 Stars — $1.32', code: 'stars:75:ac', price: 1.32 },
      { title: '🌟 100 Stars — $1.76', code: 'stars:100:ac', price: 1.76 },
      { title: '🌟 150 Stars — $2.64', code: 'stars:150:ac', price: 2.64 },
      { title: '🌟 250 Stars — $4.41', code: 'stars:250:ac', price: 4.41 },
      { title: '🌟 350 Stars — $6.17', code: 'stars:350:ac', price: 6.17 },
      { title: '🌟 500 Stars — $8.81', code: 'stars:500:ac', price: 8.81 },
      { title: '🌟 750 Stars — $13.22', code: 'stars:750:ac', price: 13.22 },
      { title: '🌟 1000 Stars — $17.63', code: 'stars:1000:ac', price: 17.63 },
      { title: '🌟 1500 Stars — $26.44', code: 'stars:1500:ac', price: 26.44 },
      { title: '🌟 2500 Stars — $44.07', code: 'stars:2500:ac', price: 44.07 },
      { title: '🌟 5000 Stars — $88.14', code: 'stars:5000:ac', price: 88.14 },
    ],
    maxbazar: [
      { title: '🌟 50 Stars — $0.90', code: 'stars:50:mb', price: 0.90 },
      { title: '🌟 75 Stars — $1.34', code: 'stars:75:mb', price: 1.34 },
      { title: '🌟 100 Stars — $1.78', code: 'stars:100:mb', price: 1.78 },
      { title: '🌟 150 Stars — $2.67', code: 'stars:150:mb', price: 2.67 },
      { title: '🌟 250 Stars — $4.46', code: 'stars:250:mb', price: 4.46 },
      { title: '🌟 350 Stars — $6.24', code: 'stars:350:mb', price: 6.24 },
      { title: '🌟 500 Stars — $8.91', code: 'stars:500:mb', price: 8.91 },
      { title: '🌟 750 Stars — $13.37', code: 'stars:750:mb', price: 13.37 },
      { title: '🌟 1000 Stars — $17.82', code: 'stars:1000:mb', price: 17.82 },
      { title: '🌟 1500 Stars — $26.73', code: 'stars:1500:mb', price: 26.73 },
      { title: '🌟 2500 Stars — $44.55', code: 'stars:2500:mb', price: 44.55 },
      { title: '🌟 5000 Stars — $89.11', code: 'stars:5000:mb', price: 89.11 },
    ],
  },
  'apps:chatgpt': {
    name: '🤖 ChatGPT (Plus / Go)',
    autocash: [
      { title: '🤖 ChatGPT GO (1 ئايلىق) — $12.93', code: 'gpt:go_1m:ac', price: 12.93 },
      { title: '🔑 ChatGPT Plus (1 ئايلىق) — $27.04', code: 'gpt:plus_1m:ac', price: 27.04 },
    ],
    maxbazar: [
      { title: '🔑 ChatGPT Plus (1 ئايلىق - كاپالەتلىك) — $10.39', code: 'gpt:plus_1m:mb', price: 10.39 },
    ],
  },
  'apps:gemini': {
    name: '🔮 Google Gemini AI',
    autocash: [
      { title: '🔮 Gemini AI Pro (1 ئايلىق - شەخسىي ئېلخەت) — $6.01', code: 'gemini:1m:ac', price: 6.01 },
      { title: '🔮 Gemini AI Pro (3 ئايلىق - شەخسىي ئېلخەت) — $17.44', code: 'gemini:3m:ac', price: 17.44 },
      { title: '🔮 Gemini AI Pro (6 ئايلىق - شەخسىي ئېلخەت) — $30.09', code: 'gemini:6m:ac', price: 30.09 },
    ],
    maxbazar: [
      { title: '🔮 Gemini Plus 400GB (12 ئايلىق / 1 يىل) — $2.99', code: 'gemini:12m:mb', price: 2.99 },
    ],
  },
  'apps:capcut': {
    name: '🎬 CapCut PRO (سۈرەت / سىن تەھرىرلەش)',
    autocash: [
      { title: '🎬 CapCut Pro (1 ئايلىق شەخسىي ھېسابات) — $3.76', code: 'capcut:1m_p:ac', price: 3.76 },
    ],
    maxbazar: [
      { title: '🎬 CapCut Pro (1 ئايلىق ھېسابات) — $2.92', code: 'capcut:1m_mb:mb', price: 2.92 },
      { title: '⚡️ CapCut Pro (1600 نومۇر / Credits) — $2.61', code: 'capcut:1600cr:mb', price: 2.61 },
    ],
  },
  'apps:canva': {
    name: '🎨 Canva PRO (لايىھىلەش ئەپى)',
    autocash: [
      { title: '🎨 Canva Pro (1 يىللىق ئېچىش) — $3.52', code: 'canva:1y:ac', price: 3.52 },
      { title: '🎨 Canva Pro (2 يىللىق ئېچىش) — $7.02', code: 'canva:2y:ac', price: 7.02 },
      { title: '🎨 Canva Pro (3 يىللىق ئېچىش) — $10.52', code: 'canva:3y:ac', price: 10.52 },
      { title: '🎨 Canva Pro (4 يىللىق ئېچىش) — $14.03', code: 'canva:4y:ac', price: 14.03 },
    ],
    maxbazar: [
      { title: '🎨 Canva Pro (2 يىللىق تەكلىپنامە) — $0.84', code: 'canva:2y_inv:mb', price: 0.84 },
      { title: '🎨 Canva Pro (2 يىللىق 500 تەكلىپنامىلىك) — $27.51', code: 'canva:2y_500:mb', price: 27.51 },
    ],
  },
'games:mlbb_global': {
    name: '⚔️ MLBB — گىلوبال',
    autocash: [
      { title: '💎 78 ئالماس — $1.32', code: 'mlbb_g:415:ac', price: 1.32 },
      { title: '💎 156 ئالماس — $2.61', code: 'mlbb_g:416:ac', price: 2.61 },
      { title: '💎 234 ئالماس — $3.77', code: 'mlbb_g:417:ac', price: 3.77 },
      { title: '💎 625 ئالماس — $10.12', code: 'mlbb_g:418:ac', price: 10.12 },
      { title: '💎 1860 ئالماس — $31.00', code: 'mlbb_g:419:ac', price: 31.0 },
      { title: '💎 3099 ئالماس — $51.05', code: 'mlbb_g:420:ac', price: 51.05 },
      { title: '💎 4649 ئالماس — $77.10', code: 'mlbb_g:421:ac', price: 77.1 },
      { title: '💎 7740 ئالماس — $128.04', code: 'mlbb_g:422:ac', price: 128.04 },
    ],
    maxbazar: [
      { title: '💎 55 ئالماس — $0.84', code: 'mlbb_g:1891:mb', price: 0.84 },
      { title: '💎 86 ئالماس — $1.33', code: 'mlbb_g:1893:mb', price: 1.33 },
      { title: '💎 165 ئالماس — $2.52', code: 'mlbb_g:1883:mb', price: 2.52 },
      { title: '💎 275 ئالماس — $4.04', code: 'mlbb_g:1886:mb', price: 4.04 },
      { title: '💎 429 ئالماس — $6.39', code: 'mlbb_g:1890:mb', price: 6.39 },
      { title: '💎 706 ئالماس — $10.35', code: 'mlbb_g:1892:mb', price: 10.35 },
      { title: '💎 1050 ئالماس — $15.60', code: 'mlbb_g:1880:mb', price: 15.6 },
      { title: '💎 1308 ئالماس — $19.56', code: 'mlbb_g:1881:mb', price: 19.56 },
      { title: '💎 1498 ئالماس — $22.01', code: 'mlbb_g:1882:mb', price: 22.01 },
      { title: '💎 1756 ئالماس — $25.94', code: 'mlbb_g:1884:mb', price: 25.94 },
      { title: '💎 2195 ئالماس — $31.29', code: 'mlbb_g:1885:mb', price: 31.29 },
      { title: '💎 3073 ئالماس — $44.27', code: 'mlbb_g:1887:mb', price: 44.27 },
      { title: '💎 3774 ئالماس — $53.54', code: 'mlbb_g:1888:mb', price: 53.54 },
      { title: '💎 4204 ئالماس — $60.09', code: 'mlbb_g:1889:mb', price: 60.09 },
    ],
  },
  'games:mlbb_turkey': {
    name: '⚔️ MLBB — تۈركىيە',
    autocash: [
      { title: '💎 88 ئالماس (TR) — $1.47', code: 'mlbb_tr:428:ac', price: 1.47 },
      { title: '💎 133 ئالماس (TR) — $2.23', code: 'mlbb_tr:429:ac', price: 2.23 },
      { title: '💎 221 ئالماس (TR) — $3.69', code: 'mlbb_tr:430:ac', price: 3.69 },
      { title: '💎 494 ئالماس (TR) — $8.21', code: 'mlbb_tr:431:ac', price: 8.21 },
      { title: '💎 1041 ئالماس (TR) — $16.42', code: 'mlbb_tr:432:ac', price: 16.42 },
      { title: '💎 2645 ئالماس (TR) — $41.01', code: 'mlbb_tr:433:ac', price: 41.01 },
    ],
    maxbazar: [
      { title: '💎 16 ئالماس (TR) — $0.27', code: 'mlbb_tr:958:mb', price: 0.27 },
      { title: '💎 44 ئالماس (TR) — $0.74', code: 'mlbb_tr:961:mb', price: 0.74 },
      { title: '💎 88 ئالماس (TR) — $1.48', code: 'mlbb_tr:964:mb', price: 1.48 },
      { title: '💎 133 ئالماس (TR) — $2.23', code: 'mlbb_tr:957:mb', price: 2.23 },
      { title: '💎 221 ئالماس (TR) — $3.71', code: 'mlbb_tr:959:mb', price: 3.71 },
      { title: '💎 494 ئالماس (TR) — $8.26', code: 'mlbb_tr:962:mb', price: 8.26 },
      { title: '💎 1041 ئالماس (TR) — $16.54', code: 'mlbb_tr:956:mb', price: 16.54 },
      { title: '💎 2645 ئالماس (TR) — $41.29', code: 'mlbb_tr:960:mb', price: 41.29 },
      { title: '💎 6146 ئالماس (TR) — $94.26', code: 'mlbb_tr:963:mb', price: 94.26 },
    ],
  },
  'games:mlbb_special': {
    name: '⚔️ MLBB — ئاسىيا فىلىپپىن',
    autocash: [
    ],
    maxbazar: [
      { title: '💎 14 ئالماس (ئاسىيا فىلىپپىن) — $0.28', code: 'mlbb_sp:941:mb', price: 0.28 },
      { title: '💎 28 ئالماس (ئاسىيا فىلىپپىن) — $0.57', code: 'mlbb_sp:948:mb', price: 0.57 },
      { title: '💎 42 ئالماس (ئاسىيا فىلىپپىن) — $0.85', code: 'mlbb_sp:951:mb', price: 0.85 },
      { title: '💎 55 ئالماس (ئاسىيا فىلىپپىن) — $1.11', code: 'mlbb_sp:952:mb', price: 1.11 },
      { title: '💎 140 ئالماس (ئاسىيا فىلىپپىن) — $2.82', code: 'mlbb_sp:942:mb', price: 2.82 },
      { title: '💎 165 ئالماس (ئاسىيا فىلىپپىن) — $3.29', code: 'mlbb_sp:943:mb', price: 3.29 },
      { title: '💎 182 ئالماس (ئاسىيا فىلىپپىن) — $3.67', code: 'mlbb_sp:944:mb', price: 3.67 },
      { title: '💎 210 ئالماس (ئاسىيا فىلىپپىن) — $4.23', code: 'mlbb_sp:945:mb', price: 4.23 },
      { title: '💎 275 ئالماس (ئاسىيا فىلىپپىن) — $5.48', code: 'mlbb_sp:947:mb', price: 5.48 },
      { title: '💎 355 ئالماس (ئاسىيا فىلىپپىن) — $7.06', code: 'mlbb_sp:950:mb', price: 7.06 },
      { title: '💎 1060 ئالماس (ئاسىيا فىلىپپىن) — $21.04', code: 'mlbb_sp:936:mb', price: 21.04 },
      { title: '💎 1084 ئالماس (ئاسىيا فىلىپپىن) — $21.12', code: 'mlbb_sp:938:mb', price: 21.12 },
      { title: '💎 1071 ئالماس (ئاسىيا فىلىپپىن) — $21.18', code: 'mlbb_sp:937:mb', price: 21.18 },
      { title: '💎 1085 ئالماس (ئاسىيا فىلىپپىن) — $21.47', code: 'mlbb_sp:939:mb', price: 21.47 },
      { title: '💎 1285 ئالماس (ئاسىيا فىلىپپىن) — $25.41', code: 'mlbb_sp:940:mb', price: 25.41 },
      { title: '💎 2162 ئالماس (ئاسىيا فىلىپپىن) — $42.28', code: 'mlbb_sp:946:mb', price: 42.28 },
      { title: '💎 3005 ئالماس (ئاسىيا فىلىپپىن) — $52.14', code: 'mlbb_sp:949:mb', price: 52.14 },
    ],
  },
  'games:mlbb_passes': {
    name: '🎟️ MLBB — ھەپتىلىك كارتىلار',
    autocash: [
      { title: '🎟️ ھەپتىلىك (گىلوبال) — $1.61', code: 'mlbb_pass:425:ac', price: 1.61 },
      { title: '🎟️ ھەپتىلىك (تۈركىيە) — $2.21', code: 'mlbb_pass:438:ac', price: 2.21 },
    ],
    maxbazar: [
      { title: '🎟️ ھەپتىلىك (گىلوبال) — $1.63', code: 'mlbb_pass:1896:mb', price: 1.63 },
      { title: '🎟️ ھەپتىلىك (تۈركىيە) — $1.90', code: 'mlbb_pass:967:mb', price: 1.9 },
    ],
  },
  'games:pubg_uc': {
    name: '🪂 PUBG Mobile UC قاچىلاش (Direct UC)',
    autocash: [
      { title: '🪙 60 UC — $1.01', code: 'pubg_uc:346:ac', price: 1.01 },
      { title: '🪙 325 UC — $5.08', code: 'pubg_uc:350:ac', price: 5.08 },
      { title: '🪙 660 UC — $10.19', code: 'pubg_uc:347:ac', price: 10.19 },
      { title: '🪙 1800 UC — $25.73', code: 'pubg_uc:348:ac', price: 25.73 },
      { title: '🪙 3850 UC — $49.47', code: 'pubg_uc:349:ac', price: 49.47 },
      { title: '🪙 8100 UC — $98.12', code: 'pubg_uc:351:ac', price: 98.12 },
    ],
    maxbazar: [
      { title: '🪙 60 UC — $1.05', code: 'pubg_uc:60:mb', price: 1.05 },
      { title: '🪙 325 UC — $5.38', code: 'pubg_uc:54:mb', price: 5.38 },
      { title: '🪙 660 UC — $10.76', code: 'pubg_uc:62:mb', price: 10.76 },
      { title: '🪙 985 UC — $16.15', code: 'pubg_uc:67:mb', price: 16.15 },
      { title: '🪙 1320 UC — $21.53', code: 'pubg_uc:49:mb', price: 21.53 },
      { title: '🪙 1800 UC — $26.61', code: 'pubg_uc:51:mb', price: 26.61 },
      { title: '🪙 2460 UC — $37.67', code: 'pubg_uc:53:mb', price: 37.67 },
      { title: '🪙 3850 UC — $53.22', code: 'pubg_uc:56:mb', price: 53.22 },
      { title: '🪙 5650 UC — $80.73', code: 'pubg_uc:59:mb', price: 80.73 },
      { title: '🪙 8100 UC — $106.88', code: 'pubg_uc:64:mb', price: 106.88 },
      { title: '🪙 11950 UC — $161.46', code: 'pubg_uc:48:mb', price: 161.46 },
      { title: '🪙 16200 UC — $212.89', code: 'pubg_uc:50:mb', price: 212.89 },
    ],
  },
  'games:pubg_passes': {
    name: '🎟️ PUBG — ھەپتىلىك ۋە ئايلىق ئەزالىقلار',
    autocash: [
      { title: '🎟️ برايم Prime (1 ئايلىق) — $1.05', code: 'pubg_pass:709:ac', price: 1.05 },
      { title: '🎟️ رويال ئەزالىق Elite (LV1-50) — $6.29', code: 'pubg_pass:717:ac', price: 6.29 },
      { title: '🎟️ برايم بلس Prime Plus (1 ئايلىق) — $10.53', code: 'pubg_pass:713:ac', price: 10.53 },
      { title: '🎟️ رويال ئەزالىق Elite (LV1-100) — $12.68', code: 'pubg_pass:718:ac', price: 12.68 },
    ],
    maxbazar: [
      { title: '🎟️ برايم Prime (1 ئايلىق) — $1.05', code: 'pubg_pass:861:mb', price: 1.05 },
      { title: '🎟️ رويال ئەزالىق Elite (LV1-50) — $6.34', code: 'pubg_pass:857:mb', price: 6.34 },
      { title: '🎟️ برايم بلس Prime Plus (1 ئايلىق) — $10.52', code: 'pubg_pass:865:mb', price: 10.52 },
      { title: '🎟️ رويال ئەزالىق Elite (LV1-100) — $12.79', code: 'pubg_pass:856:mb', price: 12.79 },
    ],
  },
  'games:freefire_diamonds': {
    name: '🔥 Free Fire ئالماس قاچىلاش (Diamonds)',
    autocash: [
      { title: '💎 100+10 ئالماس — $1.06', code: 'ff_d:352:ac', price: 1.06 },
      { title: '💎 210+21 ئالماس — $2.15', code: 'ff_d:353:ac', price: 2.15 },
      { title: '💎 530+53 ئالماس — $5.42', code: 'ff_d:354:ac', price: 5.42 },
      { title: '💎 1080+108 ئالماس — $10.83', code: 'ff_d:355:ac', price: 10.83 },
      { title: '💎 2200+220 ئالماس — $21.67', code: 'ff_d:356:ac', price: 21.67 },
    ],
    maxbazar: [
      { title: '💎 110 ئالماس — $1.11', code: 'ff_d:231:mb', price: 1.11 },
      { title: '💎 231 ئالماس — $2.22', code: 'ff_d:233:mb', price: 2.22 },
      { title: '💎 583 ئالماس — $5.60', code: 'ff_d:235:mb', price: 5.6 },
      { title: '💎 1188 ئالماس — $11.18', code: 'ff_d:232:mb', price: 11.18 },
      { title: '💎 2420 ئالماس — $22.25', code: 'ff_d:234:mb', price: 22.25 },
    ],
  },
  'games:freefire_memberships': {
    name: '🎟️ Free Fire — ھەپتىلىك ۋە ئايلىق ئەزالىقلار',
    autocash: [
      { title: '🎟️ ھەپتىلىك ئەزالىق (Weekly) — $2.31', code: 'ff_pass:949:ac', price: 2.31 },
      { title: '🎟️ بوياھ بېلىتى (Booyah) — $3.47', code: 'ff_pass:961:ac', price: 3.47 },
      { title: '🎟️ ئايلىق ئەزالىق (Monthly) — $11.44', code: 'ff_pass:950:ac', price: 11.44 },
    ],
    maxbazar: [
      { title: '🎟️ ھەپتىلىك ئەزالىق (Weekly) — $2.51', code: 'ff_pass:2222:mb', price: 2.51 },
      { title: '🎟️ بوياھ بېلىتى (Booyah) — $3.50', code: 'ff_pass:236:mb', price: 3.5 },
      { title: '🎟️ ئايلىق ئەزالىق (Monthly) — $11.24', code: 'ff_pass:2221:mb', price: 11.24 },
    ],
  },
  'games:hok_tokens': {
    name: '👑 Honor of Kings توكېن قاچىلاش (Tokens)',
    autocash: [
      { title: '👑 16 Tokens — $0.20', code: 'hok_t:633:ac', price: 0.2 },
      { title: '👑 80 Tokens — $1.00', code: 'hok_t:634:ac', price: 1.0 },
      { title: '👑 240 Tokens — $2.98', code: 'hok_t:635:ac', price: 2.98 },
      { title: '👑 400 Tokens — $4.97', code: 'hok_t:636:ac', price: 4.97 },
      { title: '👑 560 Tokens — $6.96', code: 'hok_t:637:ac', price: 6.96 },
      { title: '👑 830 Tokens — $9.94', code: 'hok_t:638:ac', price: 9.94 },
      { title: '👑 1245 Tokens — $14.91', code: 'hok_t:639:ac', price: 14.91 },
      { title: '👑 2580 Tokens — $29.83', code: 'hok_t:640:ac', price: 29.83 },
      { title: '👑 4180 Tokens — $49.71', code: 'hok_t:641:ac', price: 49.71 },
      { title: '👑 8360 Tokens — $99.43', code: 'hok_t:642:ac', price: 99.43 },
    ],
    maxbazar: [
      { title: '👑 16 Tokens — $0.21', code: 'hok_t:758:mb', price: 0.21 },
      { title: '👑 80 Tokens — $1.01', code: 'hok_t:764:mb', price: 1.01 },
      { title: '👑 240 Tokens — $3.05', code: 'hok_t:759:mb', price: 3.05 },
      { title: '👑 400 Tokens — $5.11', code: 'hok_t:761:mb', price: 5.11 },
      { title: '👑 560 Tokens — $7.15', code: 'hok_t:763:mb', price: 7.15 },
      { title: '👑 830 Tokens — $10.21', code: 'hok_t:765:mb', price: 10.21 },
      { title: '👑 1245 Tokens — $15.33', code: 'hok_t:757:mb', price: 15.33 },
      { title: '👑 2508 Tokens — $30.67', code: 'hok_t:760:mb', price: 30.67 },
      { title: '👑 4180 Tokens — $51.13', code: 'hok_t:762:mb', price: 51.13 },
      { title: '👑 8360 Tokens — $102.25', code: 'hok_t:766:mb', price: 102.25 },
    ],
  },
  'games:hok_passes': {
    name: '🎟️ Honor of Kings — ھەپتىلىك كارتىلار',
    autocash: [
      { title: '🎟️ ھەپتىلىك كارتا (Weekly Card) — $1.10', code: 'hok_pass:648:ac', price: 1.1 },
      { title: '🎟️ ھەپتىلىك كارتا Plus — $3.37', code: 'hok_pass:647:ac', price: 3.37 },
    ],
    maxbazar: [
      { title: '🎟️ ھەپتىلىك كارتا (Weekly Card) — $1.12', code: 'hok_pass:772:mb', price: 1.12 },
      { title: '🎟️ ھەپتىلىك كارتا Plus — $3.31', code: 'hok_pass:773:mb', price: 3.31 },
    ],
  },
  'games:arena_bonds': {
    name: '💰 Arena Breakout Bonds قاچىلاش (Bonds)',
    autocash: [
      { title: '💰 66 Bonds — $0.93', code: 'arena_b:657:ac', price: 0.93 },
      { title: '💰 335 Bonds — $4.71', code: 'arena_b:658:ac', price: 4.71 },
      { title: '💰 675 Bonds — $9.35', code: 'arena_b:659:ac', price: 9.35 },
      { title: '💰 1690 Bonds — $23.42', code: 'arena_b:660:ac', price: 23.42 },
      { title: '💰 3400 Bonds — $46.77', code: 'arena_b:661:ac', price: 46.77 },
      { title: '💰 6820 Bonds — $93.38', code: 'arena_b:662:ac', price: 93.38 },
    ],
    maxbazar: [
      { title: '💰 66 Bonds — $0.94', code: 'arena_b:634:mb', price: 0.94 },
      { title: '💰 335 Bonds — $4.75', code: 'arena_b:632:mb', price: 4.75 },
      { title: '💰 675 Bonds — $9.50', code: 'arena_b:635:mb', price: 9.5 },
      { title: '💰 1690 Bonds — $23.73', code: 'arena_b:630:mb', price: 23.73 },
      { title: '💰 3400 Bonds — $47.54', code: 'arena_b:633:mb', price: 47.54 },
      { title: '💰 6820 Bonds — $94.93', code: 'arena_b:636:mb', price: 94.93 },
      { title: '💰 13640 Bonds — $189.86', code: 'arena_b:629:mb', price: 189.86 },
      { title: '💰 20460 Bonds — $284.78', code: 'arena_b:631:mb', price: 284.78 },
    ],
  },
  'games:arena_passes': {
    name: '🛡️ Arena Breakout — ئايلىق ئەزالىق ۋە قوغداش قېپى',
    autocash: [
      { title: '🛡️ ئايلىق ئىلغار ئەزالىق (Advanced) — $1.02', code: 'arena_pass:668:ac', price: 1.02 },
      { title: '🛡️ ئوق ئۆتمەس قاپ (Bulletproof Case 30d) — $2.55', code: 'arena_pass:664:ac', price: 2.55 },
      { title: '🛡️ ئايلىق ئالىي ئەزالىق (Premium) — $4.08', code: 'arena_pass:669:ac', price: 4.08 },
      { title: '🛡️ مۇرەككەپ ماتېرىياللىق قاپ (Composite Case 30d) — $7.70', code: 'arena_pass:667:ac', price: 7.7 },
    ],
    maxbazar: [
      { title: '🛡️ ئايلىق ئىلغار ئەزالىق (Advanced) — $1.02', code: 'arena_pass:640:mb', price: 1.02 },
      { title: '🛡️ ئوق ئۆتمەس قاپ (Bulletproof Case 30d) — $2.57', code: 'arena_pass:638:mb', price: 2.57 },
      { title: '🛡️ ئايلىق ئالىي ئەزالىق (Premium) — $4.11', code: 'arena_pass:641:mb', price: 4.11 },
      { title: '🛡️ مۇرەككەپ ماتېرىياللىق قاپ (Composite Case 30d) — $7.78', code: 'arena_pass:639:mb', price: 7.78 },
    ],
  },
  'games:clash_passes': {
    name: '🏰 Clash of Clans — ئالتۇن بېلەت ۋە تالونلار',
    autocash: [],
    maxbazar: [
      { title: '🏰 ئالتۇن بېلەت (Gold Pass) — $2.59', code: 'coc:834:mb', price: 2.59 },
      { title: '🎪 بايرام بېلىتى (Event Pass) — $6.28', code: 'coc:837:mb', price: 6.28 },
    ],
  },
};

function findPackageByCode(code: string, provider: 'maxbazar' | 'autocash'): { title: string; price: number } | null {
  for (const cat in PROVIDER_DATA) {
    const item = PROVIDER_DATA[cat];
    const primary = provider === 'maxbazar' ? item.maxbazar : item.autocash;
    const secondary = provider === 'maxbazar' ? item.autocash : item.maxbazar;
    for (const p of primary) {
      if (p.code === code) {
        return { title: p.title, price: p.price };
      }
    }
    for (const p of secondary) {
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
      `<tg-emoji emoji-id="5998929578515504488">#⃣</tg-emoji> <b>ئەسسالامۇ ئەلەيكۇم، MAX-BAZAR بوت سۇپىمىزغا كەلگىنىڭىزنى قارشى ئالىمىز!</b>\n\n` +
      `تۆۋەندىن بىر بۆلەكنى تاللاڭ:`;

    const inline_keyboard: any[][] = [
      [btnWithIcon('بوتقا كىرىش', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
      [btnWithIcon('توربەتكە كىرىش', 'webapp', '🌐', { web_app: { url: `${SITE_URL}` } })],
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
    const displayName = (user.name || 'ھۆرمەتلىك خېرىدار').trim();
    const text =
      `🌙 <b>السلام عليكم ورحمة الله وبركاته، ھۆرمەتلىك خېرىدار!</b>\n\n` +
      `👤 <b>ئىسمىڭىز:</b> ${displayName}\n` +
      `🆔 <b>تېلېگرامما ID:</b> <code>${chatId}</code>\n` +
      `💰 <b>ھەميان قالدۇقى:</b> <b>$${balance} USD</b>\n\n` +
      `⚡️ <i>كېرەكلىك بۆلەكنى تۆۋەندىن تاللاڭ:</i>`;

    const inline_keyboard: any[][] = [
      [
        btnWithIcon('دۇكان', 'shop', '🏪', { callback_data: 'shop:home' }),
        btnWithIcon('قالدۇق قاچىلاش', 'topup_balance', '💳', { callback_data: 'balance:topup' }),
      ],
      [
        btnWithIcon('زاكازلىرىم', 'orders', '📦', { callback_data: 'orders:list' }),
        btnWithIcon('قالدۇق تارىخى', 'balance_history', '🛍', { callback_data: 'orders:bought' }),
      ],
      [
        btnWithIcon('تىل تاللاش', 'lang', '🌐', { callback_data: 'settings:lang' }),
        btnWithIcon('قانال', 'channel', '📢', { url: 'https://t.me/Auto_Cash_24' }),
      ],
      [btnWithIcon('باش بەتكە قايتىش', 'home', '🏠', { callback_data: 'menu:main' })],
    ];

    return { text, inline_keyboard };
  }

  // 3. Shop Categories Home (shop:home)
  if (menuId === 'shop:home') {
    const text =
      `<tg-emoji emoji-id="5807531546449549750">🔴</tg-emoji> <b>دۇكان بۆلۈملىرى</b>\n\n` +
      `ئېھتىياجلىق مەھسۇلات تۈرىنى تاللاڭ:`;

    const inline_keyboard: any[][] = [
      [btnWithIcon('Wi-Fi بېتاقە كارتىلىرى', 'wifi', '📶', { callback_data: 'shop:wifi' })],
      [btnWithIcon('كارتىلارغا پۇل قاچىلاش', 'sim_cards', '💳', { callback_data: 'shop:topup' })],
      [btnWithIcon('تىلگىرام ئەزالىق ئېچىش', 'telegram_sub', '⭐', { callback_data: 'shop:membership' })],
      [btnWithIcon('AI ۋە ئەپلەر', 'ai_apps', '📱', { callback_data: 'shop:apps' })],
      [btnWithIcon('ئويۇنلار', 'games', '🎮', { callback_data: 'shop:games' })],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'menu:enter' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];

    return { text, inline_keyboard };
  }

  // 3.1 Sub-category: Wi-Fi Cards (shop:wifi)
  if (menuId === 'shop:wifi') {
    const text =
      `<tg-emoji emoji-id="5807653471981149580">📍</tg-emoji> <b>Wi-Fi بېتاقە كارتىلىرى</b>\n\n` +
      `⚠️ <b>ئەسكەرتىش:</b>\n` +
      `• بېتاقەنى ئۆزىڭىز تۇرۇشلۇق رايونىڭىزنىڭكىدىن سېتىۋېلىڭ.\n` +
      `• ئەگەر خاتا سېتىۋېلىپ تور ئىشلىمىسە بىز مەسئۇلىيىتىگە ئىگە ئەمەس.\n` +
      `• توغرا سېتىۋېلىپمۇ يەنە ئىشلىمىسە باشقۇرغۇچى بىلەن ئالاقىلىشىڭ (@nasrulla0996).\n\n` +
      `👇 <i>ئېھتىياجلىق Wi-Fi تورىنى تاللاڭ:</i>`;

    const inline_keyboard: any[][] = [
      [btnWithIcon('فۇرسان نىت (كەفەريا)', 'wifi', '📍', { callback_data: 'wifi:fursan_kafraya' })],
      [btnWithIcon('فۇرسان نىت (كەفەر جالىس)', 'wifi', '📍', { callback_data: 'wifi:fursan_kafer_jalis' })],
      [btnWithIcon('ئەزىز نىت (Azez Net)', 'wifi', '📍', { callback_data: 'wifi:azez_net' })],
      [btnWithIcon('مۇجاھىد نىت (Al Mujahid Net)', 'wifi', '📍', { callback_data: 'wifi:almujahid_net' })],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:home' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 4. Sub-category: Card Top-up Main Menu
  if (menuId === 'shop:topup') {
    const text = `<tg-emoji emoji-id="5807943566957223210">🔽</tg-emoji> <b>كارتىلار بۆلىكى</b>\n\nتۆۋەندىكى تۈرلەردىن بىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [btnWithIcon('پۇل قاچىلاش', 'sim_cards', '🔽', { callback_data: 'topup:units_menu' })],
      [btnWithIcon('تور قاچىلاش', 'lang', '🌐', { callback_data: 'topup:internet_menu' })],
      [btnWithIcon('كارتا كودلىرى', 'card_codes', '📋', { callback_data: 'topup:card_codes' })],
      [
        btnWithIcon('قايتىش', 'back', '👈', { callback_data: 'shop:home' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 4.1 Sub-category: Units / Balance Menu
  if (menuId === 'topup:units_menu') {
    const text = `<tg-emoji emoji-id="5807943566957223210">🔽</tg-emoji> <b>پۇل قاچىلاش (بىرلىكلەر)</b>\n\nتۆۋەندىكى تەمىنلىگۈچىلەردىن بىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [btnWithIcon('سۈرىيەتىل', 'syriatel', '🇸🇾', { callback_data: 'topup:syriatel' })],
      [btnWithIcon('ئىمتىئىن', 'mtn', '🇸🇾', { callback_data: 'topup:mtn' })],
      [btnWithIcon('تۈركىيە كارتىسى (Turkcell)', 'sim_cards', '🇹🇷', { callback_data: 'topup:turkey' })],
      [
        btnWithIcon('قايتىش', 'back', '👈', { callback_data: 'shop:topup' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 4.2 Sub-category: Monthly Internet Bundles Menu
  if (menuId === 'topup:internet_menu') {
    const text = `<tg-emoji emoji-id="5201732344993576400">🌐</tg-emoji> <b>تور قاچىلاش (ئايلىق تورلار)</b>\n\nتۆۋەندىكى تۈرلەردىن بىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [btnWithIcon('SyriaTel ئايلىق تورلىرى', 'syriatel', '🇸🇾', { callback_data: 'topup:syriatel_monthly' })],
      [btnWithIcon('MTN ئايلىق تورلىرى', 'mtn', '🇸🇾', { callback_data: 'topup:mtn_monthly' })],
      [btnWithIcon('Turkcell ئايلىق تور بوغچىلىرى', 'lang', '🇹🇷', { callback_data: 'topup:turkey_monthly' })],
      [
        btnWithIcon('قايتىش', 'back', '👈', { callback_data: 'shop:topup' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 4.3 Sub-category: Card Inquiry Codes
  if (menuId === 'topup:card_codes') {
    const text =
      `<tg-emoji emoji-id="5204096174734207869">✉️</tg-emoji> <b>كارتا كودلىرى ۋە پايدىلىق بۇيرۇقلار</b>\n\n` +
      `<tg-emoji emoji-id="5005811690890069852">🇸🇾</tg-emoji> <b>سۈرىيەتىل (Syriatel):</b>\n` +
      `• نومۇرنى كۆرۈش: <code>*111#2*1*1#</code>\n` +
      `• يىللىق سالاھىيەت: <code>*128#</code>\n` +
      `• قالدۇق سومما: <code>*100#</code>\n` +
      `• كەسىپ ئېچىش: <code>*999#</code>\n` +
      `• 4G قىلىش: <code>*055#</code>\n\n` +
      `<tg-emoji emoji-id="5008131840813303418">🇸🇾</tg-emoji> <b>ئىمتىئىن (MTN):</b>\n` +
      `• نومۇرىنى كۆرۈش: <code>*124#</code>\n` +
      `• يىللىق سالاھىيەت: <code>*365#</code>\n` +
      `• قالدۇق سومما: <code>*100#</code>\n` +
      `• كەسىپ ئېچىش: <code>*999#</code>\n` +
      `• 4G قىلىش: <code>*062#</code>\n\n` +
      `🇹🇷 <b>تۈركىيە (Turkcell):</b>\n` +
      `• قالدۇق سوراش: <code>*123#</code>\n` +
      `• بايلىق قالدۇقى (KALAN): <code>2222</code> گە <code>KALAN</code> دەپ ئۇچۇر ئەۋەتىش`;

    const inline_keyboard: any[][] = [
      [
        btnWithIcon('قايتىش', 'back', '👈', { callback_data: 'shop:topup' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 5. Sub-category: Telegram Membership
  if (menuId === 'shop:membership') {
    const text = `<tg-emoji emoji-id="5202036282649244841">⭐️</tg-emoji> <b>تىلگىرام ئەزالىق ئېچىش</b>\n\nبىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [btnWithIcon('تىلگىرام Premium', 'tg_premium', '💎', { callback_data: 'tg:premium' })],
      [btnWithIcon('تىلگىرام يۇلتۇز سېتىۋېلىش', 'tg_stars', '🌟', { callback_data: 'tg:stars' })],
      [
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:home' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 6. Sub-category: AI & Apps
  if (menuId === 'shop:apps') {
    const text = `<tg-emoji emoji-id="5204437027633786910">🍏</tg-emoji> <b>ھەر خىل AI ۋە ئەپلەرگە ئەزالىق ئېچىش</b>\n\nتۆۋەندىكى تۈرلەردىن بىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [btnWithIcon('ChatGPT', 'chatgpt', '🤖', { callback_data: 'apps:chatgpt' })],
      [{ text: '🔮 Google Gemini AI', callback_data: 'apps:gemini' }],
      [{ text: '🎬 CapCut PRO', callback_data: 'apps:capcut' }],
      [{ text: '🎨 Canva PRO', callback_data: 'apps:canva' }],
      [
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:home' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 7. Sub-category: Games
  if (menuId === 'shop:games') {
    const text = `<tg-emoji emoji-id="5336838590057974764">🤩</tg-emoji> <b>ئويۇنلار بۆلىكى (Game Top-Up)</b>\n\nتۆۋەندىكى ئويۇنلاردىن بىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [{ text: '⚔️ Mobile Legends', callback_data: 'games:mlbb' }],
      [btnWithIcon('PUBG Mobile', 'pubg', '🪂', { callback_data: 'games:pubg' })],
      [btnWithIcon('Free Fire', 'freefire', '🔥', { callback_data: 'games:freefire' })],
      [{ text: '👑 Honor of Kings', callback_data: 'games:hok' }],
      [btnWithIcon('Arena Breakout', 'arena', '🛡️', { callback_data: 'games:arena' })],
      [{ text: '🏰 Clash of Clans', callback_data: 'games:clash' }],
      [
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:home' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 7.1 Mobile Legends Submenu
  if (menuId === 'games:mlbb') {
    const text =
      `⚔️ <b>Mobile Legends: Bang Bang</b>\n\n` +
      `🕹️ <b>سېرۋىر بۆلىكىنى تاللاڭ:</b>`;

    const inline_keyboard: any[][] = [
      [{ text: '💎 گىلوبال', callback_data: 'games:mlbb_global' }],
      [{ text: '💎 تۈركىيە', callback_data: 'games:mlbb_turkey' }],
      [{ text: '💎 ئاسىيا فىلىپپىن', callback_data: 'games:mlbb_special' }],
      [{ text: '🎟️ ھەپتىلىك كارتا', callback_data: 'games:mlbb_passes' }],
      [
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:games' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 7.2 PUBG Mobile Submenu
  if (menuId === 'games:pubg') {
    const text =
      `<tg-emoji emoji-id="5397808249279909223">🤓</tg-emoji> <b>PUBG Mobile</b>\n\n` +
      `📦 <b>ئېھتىياجلىق تۈرنى تاللاڭ:</b>`;

    const inline_keyboard: any[][] = [
      [{ text: '🪙 PUBG UC قاچىلاش (Direct UC)', callback_data: 'games:pubg_uc' }],
      [{ text: '🎟️ كىملىك ۋە ئەزالىق كارتىلىرى', callback_data: 'games:pubg_passes' }],
      [
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:games' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 7.3 Free Fire Submenu
  if (menuId === 'games:freefire') {
    const text =
      `<tg-emoji emoji-id="6125128297631190435">❤️‍🔥</tg-emoji> <b>Garena Free Fire</b>\n\n` +
      `📦 <b>ئېھتىياجلىق تۈرنى تاللاڭ:</b>`;

    const inline_keyboard: any[][] = [
      [{ text: '💎 Free Fire ئالماس قاچىلاش (Diamonds)', callback_data: 'games:freefire_diamonds' }],
      [{ text: '🎟️ ھەپتىلىك ۋە ئايلىق ئەزالىق (Memberships)', callback_data: 'games:freefire_memberships' }],
      [
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:games' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 7.5 Honor of Kings Submenu
  if (menuId === 'games:hok') {
    const text =
      `👑 <b>Honor of Kings</b>\n\n` +
      `📦 <b>ئېھتىياجلىق تۈرنى تاللاڭ:</b>`;

    const inline_keyboard: any[][] = [
      [{ text: '👑 Honor of Kings توكېن قاچىلاش (Tokens)', callback_data: 'games:hok_tokens' }],
      [{ text: '🎟️ ھەپتىلىك كارتىلار', callback_data: 'games:hok_passes' }],
      [
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:games' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 7.6 Arena Breakout Submenu
  if (menuId === 'games:arena') {
    const text =
      `<tg-emoji emoji-id="5202206616757238053">🛡</tg-emoji> <b>Arena Breakout</b>\n\n` +
      `📦 <b>ئېھتىياجلىق تۈرنى تاللاڭ:</b>`;

    const inline_keyboard: any[][] = [
      [{ text: '💰 Arena Breakout Bonds قاچىلاش (Bonds)', callback_data: 'games:arena_bonds' }],
      [btnWithIcon('ئەزالىق ۋە قوغداش قېپى', 'arena', '🛡️', { callback_data: 'games:arena_passes' })],
      [
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:games' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 7.7 Clash of Clans Submenu
  if (menuId === 'games:clash') {
    const text =
      `🏰 <b>Clash of Clans</b>\n\n` +
      `📦 <b>ئېھتىياجلىق تۈرنى تاللاڭ:</b>`;

    const inline_keyboard: any[][] = [
      [{ text: '🏰 Clash of Clans ئالتۇن بېلەت ۋە تالونلار', callback_data: 'games:clash_passes' }],
      [
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'shop:games' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];
    return { text, inline_keyboard };
  }

  // 8. Specific Product Package Page
  if (PROVIDER_DATA[menuId]) {
    const item = PROVIDER_DATA[menuId];
    const isWifi = menuId.startsWith('wifi:');
    const isTopup = menuId.startsWith('topup:');
    const isGrid2Col =
      menuId === 'topup:syriatel' ||
      menuId === 'topup:mtn' ||
      menuId === 'topup:turkey' ||
      menuId === 'tg:stars';

    // Topup cards:
    // - Syriatel & MTN: strictly Max Store (item.maxbazar)
    // - Turkcell: strictly Othman Store (item.autocash)
    // Wifi: strictly item.autocash
    // Others: follow session.selectedProvider
    const pkgs = isWifi
      ? item.autocash
      : (menuId === 'topup:syriatel' || menuId === 'topup:syriatel_monthly' || menuId === 'topup:mtn' || menuId === 'topup:mtn_monthly')
      ? item.maxbazar
      : (menuId === 'topup:turkey' || menuId === 'topup:turkey_monthly')
      ? item.autocash
      : isAc
      ? item.autocash
      : item.maxbazar;

    let text = '';
    const inline_keyboard: any[][] = [];

    if (isTopup || isWifi) {
      text =
        `${item.name}\n\n` +
        `💳 <b>ھازىرقى قالدۇقىڭىز:</b> <b>$${balance} USD</b>\n\n` +
        `📦 <b>تۆۋەندىن ئېھتىياجلىق بولاقنى تاللاڭ:</b>`;
    } else {
      text =
        `${item.name}\n\n` +
        `💰 <b>باھا تۈرى:</b> <b>${providerTag}</b>\n` +
        `💳 <b>ھازىرقى قالدۇقىڭىز:</b> <b>$${balance} USD</b>\n\n` +
        `💡 <b>كۆرسەتمە:</b> ئىككى توربەتنىڭ باھا ھالىتى ئوخشىمايدۇ، خالىغاننى ئالماشتۇرۇپ سىناپ بېقىڭ:\n` +
        `👇 AUTO CASH  🔄  MAX-BAZAR 👇`;

      inline_keyboard.push([
        {
          text: `${isAc ? '🟢' : '⚪'} AUTO CASH`,
          callback_data: `set_prov:autocash:${menuId}`,
        },
        {
          text: `${!isAc ? '🟢' : '⚪'} MAX-BAZAR`,
          callback_data: `set_prov:maxbazar:${menuId}`,
        },
      ]);
    }

    // If current viewed provider has 0 packages, show user-friendly message as requested
    if (pkgs.length === 0) {
      text += `\n\n⚠️ <b>بۇ تەرەپ تەمىنلىگۈچىنىڭ باھا بۆلىكى يوق، باشقىلىرىنى سىناڭ.</b>`;
      inline_keyboard.push([
        {
          text: `🔄 ${isAc ? 'MAX-BAZAR' : 'AUTO CASH'} باھاسىنى كۆرۈش`,
          callback_data: `set_prov:${isAc ? 'maxbazar' : 'autocash'}:${menuId}`,
        },
      ]);
    }

    if (isGrid2Col) {
      for (let i = 0; i < pkgs.length; i += 2) {
        const row: any[] = [
          {
            text: pkgs[i].title,
            callback_data: `buy|${menuId}|${pkgs[i].code}`,
          },
        ];
        if (i + 1 < pkgs.length) {
          row.push({
            text: pkgs[i + 1].title,
            callback_data: `buy|${menuId}|${pkgs[i + 1].code}`,
          });
        }
        inline_keyboard.push(row);
      }
    } else {
      inline_keyboard.push(
        ...pkgs.map((p) => [
          {
            text: p.title,
            callback_data: `buy|${menuId}|${p.code}`,
          },
        ])
      );
    }

    const isTopupMonthly =
      menuId === 'topup:syriatel_monthly' ||
      menuId === 'topup:mtn_monthly' ||
      menuId === 'topup:turkey_monthly';
    const isTopupUnits =
      menuId === 'topup:syriatel' ||
      menuId === 'topup:mtn' ||
      menuId === 'topup:turkey';
    const backTarget = isTopupMonthly
      ? 'topup:internet_menu'
      : isTopupUnits
      ? 'topup:units_menu'
      : menuId.startsWith('wifi:')
      ? 'shop:wifi'
      : menuId.startsWith('games:mlbb_')
      ? 'games:mlbb'
      : menuId.startsWith('games:pubg_')
      ? 'games:pubg'
      : menuId.startsWith('games:freefire_')
      ? 'games:freefire'
      : menuId.startsWith('games:hok_')
      ? 'games:hok'
      : menuId.startsWith('games:arena_')
      ? 'games:arena'
      : menuId.startsWith('games:clash_')
      ? 'games:clash'
      : menuId.startsWith('games:')
      ? 'shop:games'
      : menuId.startsWith('topup:')
      ? 'shop:topup'
      : menuId.startsWith('tg:')
      ? 'shop:membership'
      : menuId.startsWith('apps:')
      ? 'shop:apps'
      : 'shop:home';

    if (menuId.startsWith('games:') || menuId.startsWith('apps:') || menuId.startsWith('tg:')) {
      inline_keyboard.push([
        btnWithIcon('تېخىمۇ كۆپ (توربەتتە كۆرۈش)', 'webapp', '🌐', {
          web_app: { url: `${SITE_URL}` },
        }),
      ]);
    }

    inline_keyboard.push([
      {
        text: '👈 قايتىش',
        callback_data: backTarget,
      },
      btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
    ]);

    return { text, inline_keyboard };
  }

  // 9. Buy Confirmation Screen (buy|... or buy:...)
  if (menuId.startsWith('buy|') || menuId.startsWith('buy:')) {
    let catKey = '';
    let pkgCode = '';
    if (menuId.startsWith('buy|')) {
      const parts = menuId.split('|');
      catKey = parts[1] || '';
      pkgCode = parts[2] || '';
    } else {
      const parts = menuId.split(':');
      catKey = parts[1] + ':' + parts[2];
      pkgCode = parts.slice(3).join(':');
    }
    const isWifi = pkgCode.startsWith('wifi:') || catKey.startsWith('wifi:');
    const isTopup =
      catKey.startsWith('topup:') ||
      pkgCode.startsWith('syr:') ||
      pkgCode.startsWith('syr_m:') ||
      pkgCode.startsWith('mtn:') ||
      pkgCode.startsWith('mtn_m:') ||
      pkgCode.startsWith('tr:');

    const pkg =
      findPackageByCode(pkgCode, isWifi ? 'autocash' : session.selectedProvider) ||
      findPackageByCode(pkgCode, 'autocash') ||
      findPackageByCode(pkgCode, 'maxbazar');
    const title = pkg?.title || pkgCode;
    const price = pkg?.price || 1.0;

    let usageHint = '';
    if (pkgCode.startsWith('mlbb_pass:')) {
      usageHint = `📌 <b>ئىشلىتىلىشى:</b> 7 كۈن بويىچە كۈندىلىك ئالماس ۋە قوشۇمچە سەرخىل مۇكاپاتلارنى بېرىدۇ.\n\n`;
    }

    const text =
      `🛒 <b>سېتىۋېلىشنى جەزملەش</b>\n\n` +
      usageHint +
      `📦 <b>مەھسۇلات:</b> ${title}\n` +
      `💰 <b>باھاسى:</b> <b>$${price.toFixed(2)} USD</b>\n` +
      `💳 <b>سىزنىڭ قالدۇقىڭىز:</b> <b>$${balance} USD</b>\n\n` +
      (!isWifi && !isTopup ? `💰 <b>باھا تۈرى:</b> <b>${providerTag}</b>\n\n` : '') +
      `زاكاسنى جەزملەشتۈرۈپ ھېساباتتىن كېسىشنى خالامسىز؟`;

    const inline_keyboard: any[][] = [
      [
        btnWithIcon(`سېتىۋېلىشنى جەزملەش ($${price.toFixed(2)})`, 'confirm', '✅', {
          callback_data: `do_buy|${pkgCode}`,
        }),
      ],
      [
        btnWithIcon('بىكار قىلىش', 'cancel', '❌', { callback_data: catKey || 'shop:home' }),
      ],
    ];

    return { text, inline_keyboard };
  }

  // 10. ShamCash Deposit Topup (balance:topup)
  if (menuId === 'balance:topup') {
    const text =
      `<tg-emoji emoji-id="5264895611517300926">🏦</tg-emoji> <b>شامكەش ئارقىلىق قالدۇق قاچىلاش</b>\n\n` +
      `شامكەش نۇمۇرىمىزنى كۆچۈرۈڭ (چەكسىڭىز كۆچۈرۈلىدۇ):\n` +
      `<code>efe8a2b200d66411c7c7e296369cbba8</code>\n\n` +
      `⚠️ <i>شامكەشتىن دوللار ئېتىڭ، سۈرىيە لىراسى قوبۇل قىلىنمايدۇ !!!</i>\n\n` +
      `پۇل ئاتقان تالون نومۇرىنى (رقم العملية) بۇ چاتقا يېزىپ يوللاڭ ياكى تۆۋەندىكى تۈگمىلەرنى چىكىڭ:`;

    const inline_keyboard: any[][] = [
      [btnWithIcon('تالوننى تەكشۈرۈڭ', 'shamcash_verify', '🔍', { callback_data: 'balance:check_tx' })],
      [{ text: '⚡️ سىناق تالون كىرگۈزۈش (571734143)', callback_data: 'test:send_sample_tx' }],
      [{ text: '❓ (رقم العملية) دېگەن نېمە؟', callback_data: 'balance:faq_tx' }],
      [
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'menu:enter' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
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
        btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'balance:topup' }),
        btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' }),
      ],
    ];

    return { text, inline_keyboard };
  }

  // 12. Language Settings
  if (menuId === 'settings:lang') {
    const text =
      `<tg-emoji emoji-id="5397753673130463064">🌏</tg-emoji> <b>تىلنى تاللاڭ / Choose Language:</b>\n\n` +
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
      [btnWithIcon('كەينىگە', 'back', '◀️', { callback_data: 'menu:enter' })],
    ];

    return { text, inline_keyboard };
  }

  // Fallback
  return {
    text: `📌 <b>مەزكۇر سەھىپە تېز پۇرسەتتە يېڭىلىنىدۇ.</b>`,
    inline_keyboard: [[btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })]],
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
            [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
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
          [btnWithIcon('دۇكانغا كىرىش', 'shop', '🏪', { callback_data: 'shop:home' })],
          [btnWithIcon('ھېسابات تاختىسى', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
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
          [btnWithIcon('دۇكانغا كىرىش', 'shop', '🏪', { callback_data: 'shop:home' })],
          [btnWithIcon('ھېسابات تاختىسى', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
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
        [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
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

        const targetCat = PROVIDER_DATA[returnId];
        if (targetCat) {
          const count = newProv === 'autocash' ? targetCat.autocash.length : targetCat.maxbazar.length;
          if (count === 0) {
            await callMaxBazarBotApi('answerCallbackQuery', {
              callback_query_id: cqId,
              text: '⚠️ بۇ تەرەپ تەمىنلىگۈچىنىڭ باھا بۆلىكى يوق، باشقىلىرىنى سىناڭ.',
              show_alert: true,
            });
          }
        }

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

      // A.3 Order Execution (do_buy|CODE or do_buy:CODE)
      if (data.startsWith('do_buy|') || data.startsWith('do_buy:')) {
        let pkgCode = '';
        if (data.startsWith('do_buy|')) {
          pkgCode = data.split('|')[1] || '';
        } else {
          const parts = data.split(':');
          pkgCode = parts.length > 3 ? parts[1] : parts.slice(1).join(':');
        }

        const isWifi = pkgCode.startsWith('wifi:');
        const effectiveProvider = isWifi ? 'autocash' : session.selectedProvider;
        const pkg = findPackageByCode(pkgCode, effectiveProvider) || findPackageByCode(pkgCode, 'autocash') || findPackageByCode(pkgCode, 'maxbazar');
        const price = pkg?.price || 1.0;
        const rawTitle = pkg?.title || pkgCode;

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
              [btnWithIcon('قالدۇق قاچىلاش', 'topup_balance', '🏦', { callback_data: 'balance:topup' })],
              [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
            ],
          });
          return;
        }

        // Deduct balance atomically
        const newOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        await adjustUserBalanceAsync(user.id, -price);
        const newBalance = Math.max(0, currentBalance - price);

        // Record order locally and in session
        const providerUpper = isWifi ? 'AUTOCASH' : session.selectedProvider.toUpperCase();

        const orderRecord = {
          orderId: newOrderId,
          title: rawTitle,
          code: pkgCode,
          price,
          provider: providerUpper,
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
            details: { store: 'maxbazar', provider: isWifi ? 'autocash' : session.selectedProvider },
            initialStatus: 'completed',
          });
        } catch {}

        let wifiCardExtra = '';
        if (pkgCode.startsWith('wifi:')) {
          try {
            const { claimAvailableWifiCardAsync } = await import('./wifiInventoryDb');
            const claimed = await claimAvailableWifiCardAsync({
              serviceId: pkgCode.split(':')[1] || 'fursan_net',
              packageId: pkgCode,
              orderId: newOrderId,
              userId: user.id,
              userEmail: user.email,
            });
            if (claimed) {
              wifiCardExtra =
                `\n📶 <b>Wi-Fi كارتا ئۇچۇرى:</b>\n` +
                `👤 <b>ئىشلەتكۈچى:</b> <code>${claimed.username}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>\n` +
                `🔑 <b>پارولى:</b> <code>${claimed.password}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>\n` +
                `🔢 <b>كارتا نومۇرى:</b> <code>${claimed.cardNumber}</code>\n`;
            } else {
              const simUser = 'wf_' + Math.floor(100000 + Math.random() * 900000);
              const simPass = Math.floor(1000 + Math.random() * 9000);
              const simCard = 'NET-' + Math.floor(10000000 + Math.random() * 90000000);
              wifiCardExtra =
                `\n📶 <b>Wi-Fi كارتا ئۇچۇرى (دەرھال كۈچكە ئىگە):</b>\n` +
                `👤 <b>ئىشلەتكۈچى:</b> <code>${simUser}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>\n` +
                `🔑 <b>پارولى:</b> <code>${simPass}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>\n` +
                `🔢 <b>كارتا نومۇرى:</b> <code>${simCard}</code>\n`;
            }
          } catch {
            const simUser = 'wf_' + Math.floor(100000 + Math.random() * 900000);
            const simPass = Math.floor(1000 + Math.random() * 9000);
            wifiCardExtra =
              `\n📶 <b>Wi-Fi كارتا ئۇچۇرى:</b>\n` +
              `👤 <b>ئىشلەتكۈچى:</b> <code>${simUser}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>\n` +
              `🔑 <b>پارولى:</b> <code>${simPass}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>\n`;
          }
        }

        const isTopup =
          pkgCode.startsWith('syr:') ||
          pkgCode.startsWith('syr_m:') ||
          pkgCode.startsWith('mtn:') ||
          pkgCode.startsWith('mtn_m:') ||
          pkgCode.startsWith('tr:');
        const successText =
          `🎉 <b>زاكاز مۇۋەپپەقىيەتلىك تاپشۇرۇلدى!</b>\n\n` +
          `📦 <b>مەھسۇلات:</b> ${rawTitle}\n` +
          `🧾 <b>زاكاز نومۇرى:</b> <code>#${newOrderId}</code>\n` +
          (!isWifi && !isTopup ? `💰 <b>باھا تۈرى:</b> <b>${effectiveProvider}</b>\n` : '') +
          `💰 <b>كېسىلگەن سومما:</b> -${price.toFixed(2)} USD\n` +
          `💳 <b>قالغان قالدۇقىڭىز:</b> <b>${newBalance.toFixed(2)} USD</b>\n` +
          `<tg-emoji emoji-id="5370896319210595146">🤔</tg-emoji> <b>ھالىتى:</b> <b>زاكاز ماقۇللىنىۋاتىدۇ...</b>\n` +
          wifiCardExtra +
          `\nمەھسۇلات ئۇچۇرى ئاپتوماتىك تەمىنلىنىدۇ. رەھمەت!`;

        await showOrEditMessage(chatId, messageId, successText, {
          inline_keyboard: [
            [btnWithIcon('زاكازلىرىمنى كۆرۈش', 'orders', '🛍', { callback_data: 'orders:list' })],
            [btnWithIcon('دۇكانغا كىرىش', 'shop', '🏪', { callback_data: 'shop:home' })],
            [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
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
            `<tg-emoji emoji-id="5204324795843375748">🛍</tg-emoji> <b>زاكازلىرىم</b>\n\n` +
            `سىز تېخى بىرەر زاكاز بەرمىدىڭىز.\n` +
            `دۇكان بۆلۈمىگە كىرىپ ئېھتىياجلىق مەھسۇلاتنى سېتىۋالسىڭىز بولىدۇ.`;

          await showOrEditMessage(chatId, messageId, emptyText, {
            inline_keyboard: [
              [btnWithIcon('دۇكانغا كىرىش', 'shop', '🏪', { callback_data: 'shop:home' })],
              [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
            ],
          });
          return;
        }

        const orderLines = allOrders
          .slice(0, 5)
          .map(
            (o) =>
              `▫️ <b>${o.title}</b>\n` +
              `   كود: <code>#${o.orderId}</code> | بەدەل: $${o.price.toFixed(2)} | ۋاقىت: ${o.date}\n` +
              `   <tg-emoji emoji-id="5370896319210595146">🤔</tg-emoji> <b>ھالىتى:</b> زاكاز ماقۇللىنىۋاتىدۇ`
          )
          .join('\n\n');

        const ordersText = `<tg-emoji emoji-id="5204324795843375748">🛍</tg-emoji> <b>سىزنىڭ زاكازلىرىڭىز (${allOrders.length} دانە):</b>\n\n${orderLines}`;

        await showOrEditMessage(chatId, messageId, ordersText, {
          inline_keyboard: [
            [btnWithIcon('داۋاملىق سېتىۋېلىش', 'shop', '🛍', { callback_data: 'shop:home' })],
            [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
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
            [btnWithIcon('ھېسابات تاختىسىغا قايتىش', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
            [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
          ],
        });
        return;
      }

      // A.6 Navigation & Dynamic Menus
      let nextMenuId = data;
      if (
        (data === 'topup:syriatel' ||
          data === 'topup:syriatel_monthly' ||
          data === 'topup:mtn' ||
          data === 'topup:mtn_monthly') &&
        session.selectedProvider === 'autocash'
      ) {
        session.selectedProvider = 'maxbazar';
      }
      if (
        (data === 'topup:turkey' || data === 'topup:turkey_monthly') &&
        session.selectedProvider === 'maxbazar'
      ) {
        session.selectedProvider = 'autocash';
      }
      if (data === '@back') {
        nextMenuId = session.history.pop() || 'menu:main';
      } else if (data === 'menu:main') {
        session.history = [];
        nextMenuId = 'menu:main';
      } else {
        session.history.push(data);
      }

      // Smart Auto-Selection when navigating into any category:
      // Whichever game/category user selects, if the current provider has 0 packages,
      // but the other provider has packages, automatically display the provider that has packages!
      const targetCategoryData = PROVIDER_DATA[nextMenuId];
      if (targetCategoryData && !nextMenuId.startsWith('topup:') && !nextMenuId.startsWith('wifi:')) {
        const curProv = session.selectedProvider;
        const curCount = curProv === 'autocash' ? (targetCategoryData.autocash?.length || 0) : (targetCategoryData.maxbazar?.length || 0);
        const altProv = curProv === 'autocash' ? 'maxbazar' : 'autocash';
        const altCount = altProv === 'autocash' ? (targetCategoryData.autocash?.length || 0) : (targetCategoryData.maxbazar?.length || 0);

        if (curCount === 0 && altCount > 0) {
          session.selectedProvider = altProv;
        }
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
            `🎉 <b>MAX-BAZAR غا كىرىش مۇۋەپپەقىيەتلىك تەستىقلاندى!</b>\n\n` +
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
        text: `<tg-emoji emoji-id="5998929578515504488">#⃣</tg-emoji> <b>MAX-BAZAR | ئەڭ ئەرزان رەقەملىك ئەپلەر بازىرى</b>`,
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
          [btnWithIcon('بوتقا كىرىش', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
          [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
        ],
      },
    });
  } catch (err: any) {
    console.error('[handleMaxBazarWebhook Error]:', err?.message);
  }
}
