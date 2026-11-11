import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { verifySyncSession } from './syncSessions';
import { createAdminToken } from './adminAuth';
import { getOrCreateTelegramUser } from './telegramShop';
import {
  adjustUserBalanceAsync,
  getOrdersByUserIdAsync,
  deductBalanceAndCreateOrderAtomicAsync,
  isTxIdAlreadyCompletedAsync,
  createDepositAsync,
  updateDepositStatusAsync,
  getDepositByIdAsync,
} from './db';
import { verifyShamcashTransaction, normalizeTxId, getTsaConfig } from './providers/tsaShamcash';

/**
 * AUTO CASH & MAX-BAZAR Interactive Telegram Shopping Engine
 * Powers @Autocash_24_bot and @maxbazar_bot
 */

export interface BotConfig {
  token: string;
  username: string;
  brand: string;
  isPublic?: boolean;
}

export const DEFAULT_AUTOCASH_BOT_CONFIG: BotConfig = {
  token: (process.env.TELEGRAM_BOT_TOKEN || '8886426395:AAHTtOA5ilIoNUfmcfVf44mCK6gJo7gjhd0').trim(),
  username: 'Autocash_24_bot',
  brand: 'AUTO CASH',
  isPublic: true,
};

export const DEFAULT_MAXBAZAR_BOT_CONFIG: BotConfig = {
  token: (process.env.MAXBAZAR_BOT_TOKEN || '9030046429:AAFNApZlCn8JoafL1B1P6A81aOgqk_srlC0').trim(),
  username: 'maxbazar_bot',
  brand: 'MAX-BAZAR',
  isPublic: true,
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.auto-cash.app';

export const MAXBAZAR_PERSISTENT_KEYBOARD = {
  keyboard: [[{ text: 'باشلاش', icon_custom_emoji_id: '5807943566957223210' }]],
  resize_keyboard: true,
  is_persistent: true,
};
export const STORE_PERSISTENT_KEYBOARD = MAXBAZAR_PERSISTENT_KEYBOARD;

// ==========================================
// CUSTOM PREMIUM ANIMATED EMOJIS REGISTRY
// ==========================================
export const CUSTOM_ICONS: Record<string, string> = {
  webapp: '5204382305455467942', // 🌍 توربەتكە كىرىش / تېخىمۇ كۆپ (Animated Spinning Globe)
  enter_bot: '5998929578515504488', // 🔑 بوتقا كىرىش (Logo Custom Emoji)
  admin: '5998929578515504488', // 👑 باشقۇرغۇچى مەركىزى (Logo)
  shop: '5807531546449549750', // 🔴 دۇكان (Animated Red Icon)
  topup_balance: '5204470768896864316', // 💳 قالدۇق قاچىلاش (3D Animated Card, ownner_by_TgEmodziBot)
  orders: '5204021180310252946', // ✔️ زاكازلىرىم (Animated 3D Check)
  balance_history: '5816480536012527182', // 🚨 قالدۇق تارىخى (Animated Beacon)
  lang: '5201732344993576400', // 🌐 تىل تاللاش (3D Animated Globe, ownner_by_TgEmodziBot)
  channel: '6127360976250474761', // 📢 قانال (Animated 3D Megaphone)
  home: '5416041192905265756', // 🏠 باش بەت (Animated 3D Home)
  back: '5807540866528581427', // ⬅️ كەينىگە (Animated Back arrow)
  sim_cards: '5204470768896864316', // 💳 كارتىلارغا پۇل قاچىلاش (Animated 3D Card)
  wifi: '5201735372945520721', // 🛜 Wi-Fi بېتاقە كارتىلىرى (Animated 3D Wi-Fi)
  telegram_sub: '5350501108659790021', // ⭐️ تىلگىرام ئەزالىق ئېچىش (Animated Glowing Star)
  ai_apps: '5204437027633786910', // 🍏 AI ۋە ئەپلەر (Animated Apple/Apps)
  games: '5201939362417243050', // 🎮 ئويۇنلار (Animated 3D Game Controller)
  clash: '5393123492226933240', // 🏰 Clash of Clans (Barbarian Custom Emoji)
  arena: '6138450886751424946', // 🌟 Arena Breakout (Custom Emoji)
  syriatel: '5005811690890069852', // 🇸🇾 سۈرىيەتىل (Free Syria Flag animated video sticker)
  mtn: '5008461419423729981', // 🇸🇾 ئىمتىئىن (Free Syria Flag animated video sticker)
  turkey: '5204470768896864316', // 💳 تۈركىيە كارتىسى (Animated 3D Card)
  tg_premium: '5350501108659790021', // ⭐️ تىلگىرام Premium (Animated Glowing Star)
  tg_stars: '6136464120779638846', // ⭐ تىلگىرام يۇلتۇز سېتىۋېلىش (Animated Stars)
  chatgpt: '5204437027633786910', // 🍏 ChatGPT (Animated App)
  pubg: '6167965794635353576', // 🌟 PUBG Mobile (Custom Emoji)
  freefire: '5807428574608627564', // 🔥 Free Fire (Animated Neon Fire)
  mlbb: '6167873461428423592', // 🌟 Mobile Legends: Bang Bang (Custom Emoji)
  hok: '6300958645207175466', // 🌟 Honor of Kings (Custom Emoji)
  card_codes: '5204096174734207869', // ✉️ كارتا كودلىرى (Animated Envelope/SMS)
  shamcash_verify: '5807943566957223210', // 🔽 شامكەش تالون
  confirm: '5317020017521359483', // ✔️ جەزملەش (Animated Green Check)
  cancel: '5316999925664347033', // ❌ بىكار قىلىش (Animated Red Cross)
  money: '5348576314771144671', // 💵 پۇل / باھا (Animated Dollar)
  order_processing: '5370896319210595146', // 🤔 زاكاز ماقۇللىنىۋاتىدۇ (Animated Thinking/Processing Emoji)
  profile_user: '5201906965478930360', // 👑 ئىشلەتكۈچى / ئىسمىڭىز (3D Animated Crown, ownner_by_TgEmodziBot)
  wallet_balance: '5204179389725568654', // 💸 ھەميان قالدۇقى (3D Animated Cash, ownner_by_TgEmodziBot)
  lightning: '5201945242227472933', // ⚡️ كېرەكلىك بۆلەكنى تاللاڭ (3D Animated Lightning, ownner_by_TgEmodziBot)
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
export interface PendingOrderState {
  catKey: string;
  pkgCode: string;
  title: string;
  price: number;
  provider: 'maxbazar' | 'autocash';
  maxstoreProductId?: number;
  kind: 'wifi' | 'mlbb' | 'pubg' | 'ff' | 'hok' | 'arena' | 'coc' | 'syriatel' | 'mtn' | 'turkcell' | 'telegram' | 'app_account';
  step: 'awaiting_target' | 'awaiting_zone' | 'ready_to_confirm';
  targetAccount?: string;
  zoneId?: string;
  timestamp: number;
}

interface MaxBazarSession {
  selectedProvider: 'maxbazar' | 'autocash';
  history: string[];
  lang: string;
  pendingOrder?: PendingOrderState | null;
  localOrders: Array<{
    orderId: string;
    title: string;
    code: string;
    price: number;
    provider: string;
    date: string;
    targetAccount?: string;
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

export const MAXSTORE_PRODUCT_MAP: Record<string, number> = {
  // Syriatel Units
  'syr:1_92:mb': 1,
  'syr:100_96:mb': 2,
  'syr:105_77:mb': 3,
  'syr:1057_69:mb': 4,
  'syr:115_38:mb': 5,
  'syr:130_77:mb': 6,
  'syr:144_23:mb': 7,
  'syr:160_58:mb': 8,
  'syr:163_46:mb': 9,
  'syr:173_08:mb': 10,
  'syr:183_65:mb': 11,
  'syr:192_31:mb': 12,
  'syr:2_88:mb': 13,
  'syr:20_19:mb': 14,
  'syr:211_54:mb': 15,
  'syr:23_08:mb': 16,
  'syr:24_04:mb': 17,
  'syr:240_38:mb': 18,
  'syr:2403_85:mb': 19,
  'syr:288_46:mb': 20,
  'syr:3_85:mb': 21,
  'syr:30_76:mb': 22,
  'syr:317_31:mb': 23,
  'syr:370_19:mb': 24,
  'syr:4_81:mb': 25,
  'syr:40_38:mb': 26,
  'syr:432_69:mb': 27,
  'syr:45_19:mb': 28,
  'syr:480_77:mb': 29,
  'syr:5_77:mb': 30,
  'syr:52_88:mb': 31,
  'syr:62_50:mb': 32,
  'syr:68_27:mb': 33,
  'syr:72_12:mb': 34,
  'syr:77_88:mb': 35,
  'syr:81_73:mb': 36,
  'syr:86_54:mb': 37,
  'syr:9_62:mb': 38,
  'syr:951_92:mb': 39,
  'syr:96_15:mb': 40,

  // Syriatel Monthly Bundles
  'syr_m:6gb:mb': 2300,
  'syr_m:10gb:mb': 2301,
  'syr_m:20gb:mb': 2303,
  'syr_m:35gb:mb': 2304,
  'syr_m:75gb:mb': 2305,

  // MTN Units
  'mtn:10:mb': 204,
  'mtn:100:mb': 205,
  'mtn:1000:mb': 206,
  'mtn:12:mb': 207,
  'mtn:15:mb': 208,
  'mtn:1500:mb': 209,
  'mtn:170:mb': 210,
  'mtn:20:mb': 211,
  'mtn:200:mb': 212,
  'mtn:2000:mb': 213,
  'mtn:25:mb': 214,
  'mtn:2500:mb': 215,
  'mtn:280:mb': 216,
  'mtn:30:mb': 217,
  'mtn:3000:mb': 218,
  'mtn:35:mb': 219,
  'mtn:360:mb': 220,
  'mtn:40:mb': 221,
  'mtn:400:mb': 222,
  'mtn:50:mb': 223,
  'mtn:500:mb': 224,
  'mtn:5000:mb': 225,
  'mtn:60:mb': 226,
  'mtn:600:mb': 227,
  'mtn:70:mb': 228,
  'mtn:750:mb': 229,
  'mtn:85:mb': 230,

  // MTN Monthly Bundles
  'mtn_m:6gb:mb': 2260,
  'mtn_m:10gb:mb': 2257,
  'mtn_m:15gb:mb': 2258,
  'mtn_m:25gb:mb': 2259,

  // Honor of Kings (Tokens & Passes)
  'hok_t:633:ac': 758,
  'hok_t:634:ac': 764,
  'hok_t:635:ac': 759,
  'hok_t:636:ac': 761,
  'hok_t:637:ac': 763,
  'hok_t:638:ac': 765,
  'hok_t:639:ac': 757,
  'hok_t:640:ac': 760,
  'hok_t:641:ac': 762,
  'hok_t:642:ac': 766,
  'hok_t:758:mb': 758,
  'hok_t:764:mb': 764,
  'hok_t:759:mb': 759,
  'hok_t:761:mb': 761,
  'hok_t:763:mb': 763,
  'hok_t:765:mb': 765,
  'hok_t:757:mb': 757,
  'hok_t:760:mb': 760,
  'hok_t:762:mb': 762,
  'hok_t:766:mb': 766,
  'hok_pass:648:ac': 772,
  'hok_pass:647:ac': 773,
  'hok_pass:772:mb': 772,
  'hok_pass:773:mb': 773,

  // PUBG Mobile UC & Passes
  'pubg_uc:346:ac': 60,
  'pubg_uc:347:ac': 54,
  'pubg_uc:348:ac': 62,
  'pubg_uc:349:ac': 51,
  'pubg_uc:350:ac': 56,
  'pubg_uc:351:ac': 64,
  'pubg_uc:60:mb': 60,
  'pubg_uc:54:mb': 54,
  'pubg_uc:62:mb': 62,
  'pubg_uc:51:mb': 51,
  'pubg_uc:56:mb': 56,
  'pubg_uc:64:mb': 64,
  'pubg_pass:709:ac': 861,
  'pubg_pass:717:ac': 857,
  'pubg_pass:713:ac': 865,
  'pubg_pass:718:ac': 856,
  'pubg_pass:861:mb': 861,
  'pubg_pass:857:mb': 857,
  'pubg_pass:865:mb': 865,
  'pubg_pass:856:mb': 856,

  // Free Fire Diamonds & Passes
  'ff_d:352:ac': 231,
  'ff_d:353:ac': 233,
  'ff_d:354:ac': 235,
  'ff_d:355:ac': 232,
  'ff_d:356:ac': 234,
  'ff_d:231:mb': 231,
  'ff_d:233:mb': 233,
  'ff_d:235:mb': 235,
  'ff_d:232:mb': 232,
  'ff_d:234:mb': 234,
  'ff_pass:949:ac': 2222,
  'ff_pass:961:ac': 236,
  'ff_pass:950:ac': 2221,
  'ff_pass:2222:mb': 2222,
  'ff_pass:236:mb': 236,
  'ff_pass:2221:mb': 2221,

  // Arena Breakout Bonds & Passes
  'arena_b:657:ac': 634,
  'arena_b:658:ac': 632,
  'arena_b:659:ac': 635,
  'arena_b:660:ac': 630,
  'arena_b:661:ac': 633,
  'arena_b:662:ac': 636,
  'arena_b:634:mb': 634,
  'arena_b:632:mb': 632,
  'arena_b:635:mb': 635,
  'arena_b:630:mb': 630,
  'arena_b:633:mb': 633,
  'arena_b:636:mb': 636,
  'arena_b:629:mb': 629,
  'arena_b:631:mb': 631,
  'arena_pass:668:ac': 640,
  'arena_pass:664:ac': 638,
  'arena_pass:669:ac': 641,
  'arena_pass:667:ac': 639,
  'arena_pass:640:mb': 640,
  'arena_pass:638:mb': 638,
  'arena_pass:641:mb': 641,
  'arena_pass:639:mb': 639,

  // Mobile Legends (MLBB)
  'mlbb_g:415:ac': 1891,
  'mlbb_g:416:ac': 1883,
  'mlbb_g:417:ac': 1886,
  'mlbb_g:418:ac': 1892,
  'mlbb_g:419:ac': 1885,
  'mlbb_g:420:ac': 1887,
  'mlbb_g:421:ac': 1889,
  'mlbb_g:422:ac': 1889,
  'mlbb_g:1891:mb': 1891,
  'mlbb_g:1893:mb': 1893,
  'mlbb_g:1883:mb': 1883,
  'mlbb_g:1886:mb': 1886,
  'mlbb_g:1890:mb': 1890,
  'mlbb_g:1892:mb': 1892,
  'mlbb_g:1880:mb': 1880,
  'mlbb_g:1881:mb': 1881,
  'mlbb_g:1882:mb': 1882,
  'mlbb_g:1884:mb': 1884,
  'mlbb_g:1885:mb': 1885,
  'mlbb_g:1887:mb': 1887,
  'mlbb_g:1888:mb': 1888,
  'mlbb_g:1889:mb': 1889,
  'mlbb_tr:428:ac': 964,
  'mlbb_tr:429:ac': 957,
  'mlbb_tr:430:ac': 959,
  'mlbb_tr:431:ac': 962,
  'mlbb_tr:432:ac': 956,
  'mlbb_tr:433:ac': 960,
  'mlbb_tr:958:mb': 958,
  'mlbb_tr:961:mb': 961,
  'mlbb_tr:964:mb': 964,
  'mlbb_tr:957:mb': 957,
  'mlbb_tr:959:mb': 959,
  'mlbb_tr:962:mb': 962,
  'mlbb_tr:956:mb': 956,
  'mlbb_tr:960:mb': 960,
  'mlbb_tr:963:mb': 963,
  'mlbb_pass:425:ac': 1896,
  'mlbb_pass:438:ac': 967,
  'mlbb_pass:1896:mb': 1896,
  'mlbb_pass:967:mb': 967,

  // Telegram Stars & Premium
  'tg:3m:ac': 897,
  'tg:6m:ac': 898,
  'tg:12m:ac': 896,
  'tg:3m:mb': 897,
  'tg:6m:mb': 898,
  'tg:12m:mb': 896,
  'stars:50:ac': 891,
  'stars:75:ac': 894,
  'stars:100:ac': 883,
  'stars:150:ac': 885,
  'stars:250:ac': 889,
  'stars:350:ac': 890,
  'stars:500:ac': 892,
  'stars:750:ac': 895,
  'stars:1000:ac': 887,
  'stars:1500:ac': 882,
  'stars:2500:ac': 888,
  'stars:5000:ac': 893,
  'stars:50:mb': 891,
  'stars:75:mb': 894,
  'stars:100:mb': 883,
  'stars:150:mb': 885,
  'stars:250:mb': 889,
  'stars:350:mb': 890,
  'stars:500:mb': 892,
  'stars:750:mb': 895,
  'stars:1000:mb': 887,
  'stars:1500:mb': 882,
  'stars:2500:mb': 888,
  'stars:5000:mb': 893,

  // Clash of Clans
  'coc:834:mb': 834,
  'coc:837:mb': 837,
};

export const OTHMAN_STORE_PRODUCT_MAP: Record<string, number> = {
  // Canva Pro
  'canva:1y:ac': 579,
  'canva:2y:ac': 580,
  'canva:3y:ac': 581,
  'canva:4y:ac': 582,

  // ChatGPT
  'gpt:go_1m:ac': 1099,
  'gpt:plus_1m:ac': 1100,

  // Google Gemini AI
  'gemini:1m:ac': 1101,
  'gemini:3m:ac': 1102,
  'gemini:6m:ac': 1103,

  // Capcut Pro
  'capcut:1m_p:ac': 583,

  // Telegram Premium
  'tg:3m:ac': 563,
  'tg:6m:ac': 564,
  'tg:12m:ac': 565,

  // Turkcell
  'tr:50tl:ac': 746,
  'tr:150tl:ac': 747,
  'tr:1000dk_2gb:ac': 737,
  'tr:1000dk_4gb:ac': 738,
  'tr:1000dk_8gb:ac': 739,
  'tr:1000dk_12gb:ac': 740,
  'tr:1000dk_20gb:ac': 743,
  'tr:1000dk_34gb:ac': 744,
  'tr:1000dk_50gb:ac': 745,
};

export function normalizeTargetAccount(target: string, kind: string): string {
  const trimmed = (target || '').trim();
  if (kind === 'syriatel' || kind === 'mtn' || kind === 'turkcell') {
    let digits = trimmed.replace(/\D/g, '');
    if (kind === 'syriatel' || kind === 'mtn') {
      if (digits.startsWith('00963')) digits = '0' + digits.slice(5);
      else if (digits.startsWith('963')) digits = '0' + digits.slice(3);
      else if (!digits.startsWith('0') && digits.length === 9) digits = '0' + digits;
    } else if (kind === 'turkcell') {
      if (digits.startsWith('0090')) digits = '0' + digits.slice(4);
      else if (digits.startsWith('90')) digits = '0' + digits.slice(2);
      else if (!digits.startsWith('0') && digits.length === 10) digits = '0' + digits;
    }
    return digits || trimmed;
  }
  return trimmed;
}

export interface ProductRequirement {
  requiresInput: boolean;
  kind: 'wifi' | 'mlbb' | 'pubg' | 'ff' | 'hok' | 'arena' | 'coc' | 'syriatel' | 'mtn' | 'turkcell' | 'telegram' | 'app_account';
  appName: string;
  fieldLabel: string;
  example: string;
  placeholder: string;
  requiresZoneId: boolean;
  maxstoreProductId?: number;
  othmanStoreProductId?: number;
}

export function getProductRequirement(pkgCode: string, catKey: string = ''): ProductRequirement {
  const code = (pkgCode || '').toLowerCase();
  const cat = (catKey || '').toLowerCase();

  // Extract Othman Store product ID (for AUTO CASH / :ac)
  let othmanStoreProductId: number | undefined = OTHMAN_STORE_PRODUCT_MAP[pkgCode];
  if (!othmanStoreProductId) {
    const acNum = pkgCode.match(/:(\d+):ac$/);
    if (acNum) {
      othmanStoreProductId = Number(acNum[1]);
    }
  }

  // Extract MaxStore product ID (for MAX-BAZAR / :mb)
  let maxstoreProductId: number | undefined = MAXSTORE_PRODUCT_MAP[pkgCode];
  if (!maxstoreProductId) {
    const numMatch = pkgCode.match(/:(\d+):(mb|ac)$/);
    if (numMatch) {
      maxstoreProductId = Number(numMatch[1]);
    }
  }

  // Fallback: Check if equivalent :mb code is registered
  if (!maxstoreProductId && pkgCode.endsWith(':ac')) {
    const mbEquivalent = pkgCode.replace(/:ac$/, ':mb');
    if (MAXSTORE_PRODUCT_MAP[mbEquivalent]) {
      maxstoreProductId = MAXSTORE_PRODUCT_MAP[mbEquivalent];
    }
  }

  // 1. Wi-Fi cards -> No user input needed (instant code delivery)
  if (code.startsWith('wifi:') || cat.startsWith('wifi:')) {
    return {
      requiresInput: false,
      kind: 'wifi',
      appName: 'Wi-Fi كارتىسى',
      fieldLabel: 'Wi-Fi كارتىسى',
      example: '',
      placeholder: '',
      requiresZoneId: false,
    };
  }

  // 2. Mobile Legends (MLBB) -> Requires Player ID & Zone ID
  if (code.startsWith('mlbb_') || cat.includes('mlbb')) {
    return {
      requiresInput: true,
      kind: 'mlbb',
      appName: 'Mobile Legends: Bang Bang',
      fieldLabel: 'ئويۇنچى كىملىكى (UID) ۋە رايون نومۇرى (Zone ID)',
      example: '123456789 (2045) ياكى 123456789',
      placeholder: 'مەسىلەن: 123456789 (2045)',
      requiresZoneId: true,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 3. PUBG Mobile -> Requires Player ID (UID)
  if (code.startsWith('pubg_') || cat.includes('pubg')) {
    return {
      requiresInput: true,
      kind: 'pubg',
      appName: 'PUBG Mobile',
      fieldLabel: 'پابجى ئويۇنچى كىملىكى (Player ID / UID)',
      example: '5123456789 (ئويۇندىكى 9-10 خانىلىق سان)',
      placeholder: '5123456789',
      requiresZoneId: false,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 4. Honor of Kings -> Requires Player ID (UID)
  if (code.startsWith('hok_') || cat.includes('hok')) {
    return {
      requiresInput: true,
      kind: 'hok',
      appName: 'Honor of Kings',
      fieldLabel: 'ئويۇنچى كىملىكى (Player ID / UID)',
      example: '123456789012 (HOK ئارخىپىڭىزدىكى كىملىك)',
      placeholder: '123456789012',
      requiresZoneId: false,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 5. Arena Breakout -> Requires Player ID (UID)
  if (code.startsWith('arena_') || cat.includes('arena')) {
    return {
      requiresInput: true,
      kind: 'arena',
      appName: 'Arena Breakout',
      fieldLabel: 'ئويۇنچى كىملىكى (Player ID / UID)',
      example: '1002345678',
      placeholder: '1002345678',
      requiresZoneId: false,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 6. Free Fire -> Requires Player ID (UID)
  if (code.startsWith('ff_') || cat.includes('freefire')) {
    return {
      requiresInput: true,
      kind: 'ff',
      appName: 'Free Fire',
      fieldLabel: 'فىفا ئويۇنچى كىملىكى (Player ID / UID)',
      example: '123456789',
      placeholder: '123456789',
      requiresZoneId: false,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 7. Clash of Clans / Clash Royale -> Requires Supercell Email
  if (code.startsWith('coc:') || cat.includes('clash')) {
    return {
      requiresInput: true,
      kind: 'coc',
      appName: 'Clash of Clans',
      fieldLabel: 'Supercell ID ئېلخەت ئادرېسى (Email)',
      example: 'user@gmail.com',
      placeholder: 'user@gmail.com',
      requiresZoneId: false,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 8. Syriatel -> Requires Phone Number
  if (code.startsWith('syr:') || code.startsWith('syr_m:') || cat.includes('syriatel')) {
    return {
      requiresInput: true,
      kind: 'syriatel',
      appName: 'سۈرىيەتەل (Syriatel)',
      fieldLabel: 'سۈرىيەتەل تېلېفون نومۇرى',
      example: '0933123456 ياكى 933123456',
      placeholder: '09xxxxxxxx',
      requiresZoneId: false,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 9. MTN Syria -> Requires Phone Number
  if (code.startsWith('mtn:') || code.startsWith('mtn_m:') || cat.includes('mtn')) {
    return {
      requiresInput: true,
      kind: 'mtn',
      appName: 'MTN سۈرىيە',
      fieldLabel: 'MTN تېلېفون نومۇرى',
      example: '0944123456 ياكى 944123456',
      placeholder: '09xxxxxxxx',
      requiresZoneId: false,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 10. Turkcell -> Requires Turkey Phone Number
  if (code.startsWith('tr:') || cat.includes('turkey')) {
    return {
      requiresInput: true,
      kind: 'turkcell',
      appName: 'Turkcell تۈركىيە',
      fieldLabel: 'تۈركىيە تېلېفون نومۇرى',
      example: '05551234567',
      placeholder: '05xxxxxxxxx',
      requiresZoneId: false,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 11. Telegram Premium & Stars -> Requires Telegram username or phone
  if (code.startsWith('tg:') || code.startsWith('stars:') || cat.startsWith('tg:')) {
    return {
      requiresInput: true,
      kind: 'telegram',
      appName: 'Telegram',
      fieldLabel: 'تىلگىرام نامىڭىز (@username) ياكى نومۇرىڭىز',
      example: '@nasrulla0996',
      placeholder: '@username',
      requiresZoneId: false,
      maxstoreProductId,
      othmanStoreProductId,
    };
  }

  // 12. AI Apps & Other (ChatGPT, Gemini, Canva, CapCut) -> Requires Account / Email
  return {
    requiresInput: true,
    kind: 'app_account',
    appName: 'ئەپ ۋە مۇلازىمەت ھېساباتى',
    fieldLabel: 'ھېسابات ئېلخەت ئادرېسى ياكى نامى',
    example: 'user@gmail.com',
    placeholder: 'user@gmail.com',
    requiresZoneId: false,
    maxstoreProductId,
    othmanStoreProductId,
  };
}



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
    name: '<tg-emoji emoji-id="5008461419423729981">🇸🇾</tg-emoji> ئىمتىئىن (MTN سۈرىيە لىراسى)',
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
    name: '<tg-emoji emoji-id="5204470768896864316">🇹🇷</tg-emoji> تۈركىيە كارتىسى (Turkcell لىرا قاچىلاش)',
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
    name: '<tg-emoji emoji-id="5204470768896864316">🇹🇷</tg-emoji> Turkcell ئايلىق تور بوغچىلىرى (تور + سۆزلىشىش)',
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
    name: '<tg-emoji emoji-id="6167965794635353576">🌟</tg-emoji> PUBG Mobile UC قاچىلاش (Direct UC)',
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
    name: '<tg-emoji emoji-id="6300958645207175466">🌟</tg-emoji> Honor of Kings توكېن قاچىلاش (Tokens)',
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
    name: '<tg-emoji emoji-id="6138450886751424946">🌟</tg-emoji> Arena Breakout Bonds قاچىلاش (Bonds)',
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
    name: '<tg-emoji emoji-id="5393123492226933240">🏰</tg-emoji> Clash of Clans — ئالتۇن بېلەت ۋە تالونلار',
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
export async function callBotApi(method: string, payload: any, tokenOverride?: string) {
  const token = (tokenOverride || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_AUTOCASH_BOT_CONFIG.token || '').trim();
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    console.error(`[Bot API Error] ${method}:`, err?.message);
    return { ok: false, error: err?.message };
  }
}

export const callMaxBazarBotApi = (method: string, payload: any) =>
  callBotApi(method, payload, DEFAULT_MAXBAZAR_BOT_CONFIG.token);

async function showOrEditMessage(
  chatId: number | string,
  messageId: number | undefined,
  text: string,
  replyMarkup?: any,
  token?: string
) {
  if (messageId) {
    try {
      const editRes = await callBotApi(
        'editMessageText',
        {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
          disable_web_page_preview: true,
        },
        token
      );
      if (editRes && editRes.ok) return editRes;
    } catch {}
  }
  return await callBotApi(
    'sendMessage',
    {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
      disable_web_page_preview: true,
    },
    token
  );
}

// ==========================================
// 4. MENU RENDERER
// ==========================================
function getMenuContent(
  menuId: string,
  user: any,
  session: MaxBazarSession,
  chatId: number | string,
  isAdmin: boolean,
  config?: BotConfig
): { text: string; inline_keyboard: any[][] } {
  const brand = config?.brand || 'AUTO CASH';
  const isAc = session.selectedProvider === 'autocash';
  const providerTag = isAc ? 'AUTO CASH' : 'MAX-BAZAR';
  const balance = Number(user.balance || 0).toFixed(2);

  // 1. Main Welcome Screen (menu:main)
  if (menuId === 'menu:main') {
    const text =
      `<tg-emoji emoji-id="5998929578515504488">#⃣</tg-emoji> <b>ئەسسالامۇ ئەلەيكۇم، ${brand} بوت سۇپىمىزغا كەلگىنىڭىزنى قارشى ئالىمىز!</b>\n\n` +
      `تۆۋەندىن بىر بۆلەكنى تاللاڭ:`;

    const inline_keyboard: any[][] = [
      [btnWithIcon('بوتقا كىرىش', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
      [btnWithIcon('توربەتكە كىرىش', 'webapp', '🌐', { web_app: { url: `${SITE_URL}` } })],
    ];

    if (isAdmin) {
      const adminToken = createAdminToken();
      inline_keyboard.push([
        btnWithIcon(`باشقۇرغۇچى مەركىزى (${brand})`, 'admin', '👑', {
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
      `<tg-emoji emoji-id="5201906965478930360">👤</tg-emoji> <b>ئىسمىڭىز:</b> ${displayName}\n` +
      `🆔 <b>تېلېگرامما ID:</b> <code>${chatId}</code>\n` +
      `<tg-emoji emoji-id="5204179389725568654">💰</tg-emoji> <b>ھەميان قالدۇقى:</b> <b>$${balance} USD</b>\n\n` +
      `<tg-emoji emoji-id="5201945242227472933">⚡️</tg-emoji> <i>كېرەكلىك بۆلەكنى تۆۋەندىن تاللاڭ:</i>`;

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
        btnWithIcon('قانال', 'channel', '📢', { url: 'https://t.me/autocash_cannel' }),
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
      `<tg-emoji emoji-id="5201735372945520721">🛜</tg-emoji> <b>Wi-Fi بېتاقە كارتىلىرى</b>\n\n` +
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
    const text = `<tg-emoji emoji-id="5204470768896864316">💳</tg-emoji> <b>كارتىلار بۆلىكى</b>\n\nتۆۋەندىكى تۈرلەردىن بىرىنى تاللاڭ:`;
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
      [btnWithIcon('تۈركىيە كارتىسى (Turkcell)', 'turkey', '🇹🇷', { callback_data: 'topup:turkey' })],
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
      [btnWithIcon('Turkcell ئايلىق تور بوغچىلىرى', 'turkey', '🇹🇷', { callback_data: 'topup:turkey_monthly' })],
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
      `<tg-emoji emoji-id="5008461419423729981">🇸🇾</tg-emoji> <b>ئىمتىئىن (MTN):</b>\n` +
      `• نومۇرىنى كۆرۈش: <code>*124#</code>\n` +
      `• يىللىق سالاھىيەت: <code>*365#</code>\n` +
      `• قالدۇق سومما: <code>*100#</code>\n` +
      `• كەسىپ ئېچىش: <code>*999#</code>\n` +
      `• 4G قىلىش: <code>*062#</code>\n\n` +
      `<tg-emoji emoji-id="5204470768896864316">🇹🇷</tg-emoji> <b>تۈركىيە (Turkcell):</b>\n` +
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
    const text = `<tg-emoji emoji-id="5350501108659790021">⭐️</tg-emoji> <b>تىلگىرام ئەزالىق ئېچىش</b>\n\nبىرىنى تاللاڭ:`;
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
    const text = `<tg-emoji emoji-id="5201939362417243050">🎮</tg-emoji> <b>ئويۇنلار بۆلىكى (Game Top-Up)</b>\n\nتۆۋەندىكى ئويۇنلاردىن بىرىنى تاللاڭ:`;
    const inline_keyboard: any[][] = [
      [btnWithIcon('Mobile Legends', 'mlbb', '⚔️', { callback_data: 'games:mlbb' })],
      [btnWithIcon('PUBG Mobile', 'pubg', '🪂', { callback_data: 'games:pubg' })],
      [btnWithIcon('Free Fire', 'freefire', '🔥', { callback_data: 'games:freefire' })],
      [btnWithIcon('Honor of Kings', 'hok', '👑', { callback_data: 'games:hok' })],
      [btnWithIcon('Arena Breakout', 'arena', '🛡️', { callback_data: 'games:arena' })],
      [btnWithIcon('Clash of Clans', 'clash', '🏰', { callback_data: 'games:clash' })],
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
      `<tg-emoji emoji-id="6167873461428423592">🌟</tg-emoji> <b>Mobile Legends: Bang Bang</b>\n\n` +
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
      `<tg-emoji emoji-id="6167965794635353576">🌟</tg-emoji> <b>PUBG Mobile</b>\n\n` +
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
      `<tg-emoji emoji-id="5807428574608627564">🔥</tg-emoji> <b>Garena Free Fire</b>\n\n` +
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
      `<tg-emoji emoji-id="6300958645207175466">🌟</tg-emoji> <b>Honor of Kings</b>\n\n` +
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
      `<tg-emoji emoji-id="6138450886751424946">🌟</tg-emoji> <b>Arena Breakout</b>\n\n` +
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
      `<tg-emoji emoji-id="5393123492226933240">🏰</tg-emoji> <b>Clash of Clans</b>\n\n` +
      `📦 <b>ئېھتىياجلىق تۈرنى تاللاڭ:</b>`;

    const inline_keyboard: any[][] = [
      [btnWithIcon('Clash of Clans ئالتۇن بېلەت ۋە تالونلار', 'clash', '🏰', { callback_data: 'games:clash_passes' })],
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

    const reqInfo = getProductRequirement(pkgCode, catKey);

    // Check if this pending order already has customer's target account
    const activePending = session.pendingOrder;
    const hasTargetAccount =
      activePending &&
      activePending.pkgCode === pkgCode &&
      Boolean(activePending.targetAccount) &&
      (!reqInfo.requiresZoneId || Boolean(activePending.zoneId));

    // A. If this product requires input AND customer has not entered target account yet: Show Input Prompt!
    if (reqInfo.requiresInput && !hasTargetAccount) {
      session.pendingOrder = {
        catKey,
        pkgCode,
        title,
        price,
        provider: isWifi ? 'autocash' : session.selectedProvider,
        maxstoreProductId: reqInfo.maxstoreProductId,
        kind: reqInfo.kind,
        step: 'awaiting_target',
        targetAccount: '',
        zoneId: '',
        timestamp: Date.now(),
      };

      let inputPromptExtra = '';
      if (reqInfo.kind === 'mlbb') {
        inputPromptExtra =
          `💡 <b>ئەسكەرتىش:</b> كىملىك ۋە رايون كودىنى بىرگە ئەۋەتسىڭىزمۇ بولىدۇ.\n` +
          `مەسىلەن: <code>123456789 (2045)</code> ياكى <code>123456789 2045</code>\n\n`;
      } else if (reqInfo.kind === 'pubg') {
        inputPromptExtra =
          `💡 <b>ئەسكەرتىش:</b> پەقەت پابجى نۇمۇرلۇق كىملىكىڭىزنى (UID) ئەۋەتىڭ.\n` +
          `مەسىلەن: <code>5123456789</code>\n\n`;
      } else if (reqInfo.kind === 'hok') {
        inputPromptExtra =
          `💡 <b>ئەسكەرتىش:</b> HOK ئارخىپىڭىزدىكى كىملىك نومۇرىنى (UID) ئەۋەتىڭ.\n` +
          `مەسىلەن: <code>123456789012</code>\n\n`;
      } else if (reqInfo.kind === 'arena') {
        inputPromptExtra =
          `💡 <b>ئەسكەرتىش:</b> Arena Breakout ئويۇنچى كىملىكىڭىزنى ئەۋەتىڭ.\n` +
          `مەسىلەن: <code>1002345678</code>\n\n`;
      } else if (reqInfo.kind === 'coc') {
        inputPromptExtra =
          `💡 <b>ئەسكەرتىش:</b> Supercell ID غا باغلانغان رەسمىي ئېلخەت ئادرېسىڭىزنى يېزىپ ئەۋەتىڭ.\n` +
          `مەسىلەن: <code>user@gmail.com</code>\n\n`;
      } else if (reqInfo.kind === 'syriatel' || reqInfo.kind === 'mtn') {
        inputPromptExtra =
          `💡 <b>ئەسكەرتىش:</b> 10 خانىلىق تېلېفون نومۇرىڭىزنى يېزىپ ئەۋەتىڭ.\n` +
          `مەسىلەن: <code>0933123456</code>\n\n`;
      }

      const promptText =
        `<tg-emoji emoji-id="5807531546449549750">✍️</tg-emoji> <b>زاكاز ئۇچۇرىنى كىرگۈزۈڭ</b>\n\n` +
        `📦 <b>مەھسۇلات:</b> <b>${title}</b>\n` +
        `💰 <b>باھاسى:</b> <b>$${price.toFixed(2)} USD</b>\n` +
        `💳 <b>قالدۇقىڭىز:</b> <b>$${balance} USD</b>\n\n` +
        inputPromptExtra +
        `🎯 <b>تەلەپ قىلىنىدىغان ئۇچۇر:</b> <b>${reqInfo.fieldLabel}</b>\n\n` +
        `<i>👇 تۆۋەندىكى تېكىست كىرگۈزۈش قۇتىسىغا يېزىپ بۇ چاتقا ئەۋەتىڭ:</i>`;

      const inputKb: any[][] = [];
      if (reqInfo.kind === 'telegram') {
        inputKb.push([
          btnWithIcon('👤 ئۆزۈمنىڭ ھېساباتىغا ئېچىش', 'profile_user', '👤', {
            callback_data: `tg_self|${pkgCode}`,
          }),
        ]);
      }
      inputKb.push([
        btnWithIcon('بىكار قىلىش', 'cancel', '❌', { callback_data: catKey || 'shop:home' }),
      ]);

      return { text: promptText, inline_keyboard: inputKb };
    }

    // B. Target Account is ready (or Wi-Fi product) -> Show Final Confirmation Screen
    const targetAccountDisplay =
      reqInfo.kind === 'wifi'
        ? 'Wi-Fi كارتىسى (ئامباردىن دەرھال چىقىپ بېرىدۇ)'
        : `${activePending?.targetAccount || ''}${activePending?.zoneId ? ` (رايون: ${activePending.zoneId})` : ''}`;

    let usageHint = '';
    if (pkgCode.startsWith('mlbb_pass:')) {
      usageHint = `📌 <b>ئىشلىتىلىشى:</b> 7 كۈن بويىچە كۈندىلىك ئالماس ۋە قوشۇمچە سەرخىل مۇكاپاتلارنى بېرىدۇ.\n\n`;
    }

    const text =
      `🛒 <b>سېتىۋېلىشنى جەزملەشتۈرۈش</b>\n\n` +
      usageHint +
      `📦 <b>مەھسۇلات:</b> <b>${title}</b>\n` +
      `💰 <b>باھاسى:</b> <b>$${price.toFixed(2)} USD</b>\n` +
      `💳 <b>سىزنىڭ قالدۇقىڭىز:</b> <b>$${balance} USD</b>\n` +
      `🎯 <b>نىشان كىملىك / نومۇر:</b> <code>${targetAccountDisplay}</code>\n\n` +
      (!isWifi && !isTopup ? `💰 <b>باھا تۈرى:</b> <b>${providerTag}</b>\n\n` : '') +
      `زاكاسنى جەزملەشتۈرۈپ ھېساباتتىن كېسىشنى خالامسىز؟`;

    const inline_keyboard: any[][] = [
      [
        btnWithIcon(`سېتىۋېلىشنى جەزملەش ($${price.toFixed(2)})`, 'confirm', '✅', {
          callback_data: `do_buy|${pkgCode}`,
        }),
      ],
    ];

    if (reqInfo.requiresInput) {
      inline_keyboard.push([
        btnWithIcon('كىملىكنى ئۆزگەرتىش', 'edit', '✏️', {
          callback_data: `reinput|${catKey}|${pkgCode}`,
        }),
      ]);
    }

    inline_keyboard.push([
      btnWithIcon('بىكار قىلىش', 'cancel', '❌', { callback_data: catKey || 'shop:home' }),
    ]);

    return { text, inline_keyboard };
  }

  // 10. ShamCash Deposit Topup (balance:topup)
  if (menuId === 'balance:topup') {
    const text =
      `<tg-emoji emoji-id="5204470768896864316">🏦</tg-emoji> <b>شامكەش ئارقىلىق قالدۇق قاچىلاش</b>\n\n` +
      `شامكەش نۇمۇرىمىزنى كۆچۈرۈڭ (چەكسىڭىز كۆچۈرۈلىدۇ):\n` +
      `<code>efe8a2b200d66411c7c7e296369cbba8</code>\n\n` +
      `⚠️ <i>شامكەشتىن دوللار ئېتىڭ، سۈرىيە لىراسى قوبۇل قىلىنمايدۇ !!!</i>\n\n` +
      `پۇل ئاتقان تالون نومۇرىنى (رقم العملية) بۇ چاتقا يېزىپ يوللاڭ ياكى تۆۋەندىكى تۈگمىلەرنى چىكىڭ:`;

    const inline_keyboard: any[][] = [
      [btnWithIcon('تالوننى تەكشۈرۈش', 'shamcash_verify', '🔍', { callback_data: 'balance:check_tx' })],
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
      `3️⃣ سىستېما نومۇرنى دەلىللەپ، قالدۇقىڭىزنى ھېساباتىڭىزغا قوشۇپ بېرىدۇ.`;

    const inline_keyboard: any[][] = [
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
      `<tg-emoji emoji-id="5201732344993576400">🌏</tg-emoji> <b>تىلنى تاللاڭ / Choose Language:</b>\n\n` +
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
// 5. SHAMCASH VERIFICATION ENGINE (PRODUCTION)
// ==========================================
async function handleShamCashTxVerify(
  chatId: number | string,
  txId: string,
  user: any,
  config: BotConfig
) {
  const cleanTxId = normalizeTxId(txId);
  const ADMIN_CHAT_ID = String(process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493').trim();

  if (!cleanTxId || cleanTxId.length < 5) {
    await callBotApi(
      'sendMessage',
      {
        chat_id: chatId,
        text:
          `⚠️ <b>ئىناۋەتسىز تالون نومۇرى!</b>\n\n` +
          `شامكەش تالون نومۇرى ئادەتتە ئەڭ ئاز دېگەندە 5 رەقەمدىن تەشكىل تاپىدۇ (مەسىلەن: <code>571734143</code>).\n` +
          `قايتا تەكشۈرۈپ كىرگۈزۈڭ.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 قايتا كىرگۈزۈش', callback_data: 'balance:topup' }],
            [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
          ],
        },
      },
      config.token
    );
    return;
  }

  // 1. Anti-Double-Spend Check in DB
  const alreadyUsed = await isTxIdAlreadyCompletedAsync(cleanTxId);
  if (alreadyUsed) {
    await callBotApi(
      'sendMessage',
      {
        chat_id: chatId,
        text:
          `⚠️ <b>بۇ تالون نومۇرى ئاللىقاچان ئىشلىتىلگەن!</b>\n\n` +
          `نومۇر: <code>${cleanTxId}</code>\n` +
          `سەۋەبى: تالون بىرلا قېتىم قوبۇل قىلىنىدۇ. يېڭى پۇل ئاتقان نومۇرنى كىرگۈزۈڭ.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 قايتا تەكشۈرۈش', callback_data: 'balance:topup' }],
            [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
          ],
        },
      },
      config.token
    );
    return;
  }

  // 2. Real TSA API Automated Verification
  const tsaConfig = await getTsaConfig();
  if (tsaConfig.autoDepositEnabled && tsaConfig.apiKey && tsaConfig.shamcashAddress) {
    try {
      const verifyRes = await verifyShamcashTransaction(cleanTxId, {
        apiKey: tsaConfig.apiKey,
        accountAddress: tsaConfig.shamcashAddress,
        exchangeRate: tsaConfig.exchangeRate,
        maxAgeMinutes: tsaConfig.maxAgeMinutes,
      });

      if (verifyRes.expired) {
        await callBotApi(
          'sendMessage',
          {
            chat_id: chatId,
            text:
              `⚠️ <b>بۇ تالوننىڭ مۇددىتى ئۆتۈپ كەتكەن (كونا تالون)!</b>\n\n` +
              `نومۇر: <code>${cleanTxId}</code>\n` +
              `پەقەت يېقىنقى 45 مىنۇت ئىچىدىكى يېڭى تالونلارلا قوبۇل قىلىنىدۇ.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 قايتا تەكشۈرۈش', callback_data: 'balance:topup' }],
                [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
              ],
            },
          },
          config.token
        );
        return;
      }

      if (verifyRes.success && verifyRes.found && verifyRes.transaction) {
        const tx = verifyRes.transaction;
        const creditedAmount =
          tx.usdAmount > 0
            ? tx.usdAmount
            : Math.round((tx.amount / (tsaConfig.exchangeRate || 14390)) * 100) / 100;

        if (creditedAmount > 0) {
          const deposit = await createDepositAsync({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            method: 'شامكەش (Sham Cash - Auto Verified)',
            amount: creditedAmount,
            txId: tx.tranId || cleanTxId,
          });
          await updateDepositStatusAsync(deposit.id, 'completed');

          const updatedBalance = Number(user.balance || 0) + creditedAmount;
          await callBotApi(
            'sendMessage',
            {
              chat_id: chatId,
              text:
                `🎉 <b>تالون دەلىللەندى! قالدۇق مۇۋەپپەقىيەتلىك قوشۇلدى</b>\n\n` +
                `🧾 <b>تالون نومۇرى:</b> <code>${cleanTxId}</code>\n` +
                `💵 <b>قوشۇلغان سومما:</b> <b>+$${creditedAmount.toFixed(2)} USD</b>\n` +
                `<tg-emoji emoji-id="5204179389725568654">💰</tg-emoji> <b>يېڭى قالدۇقىڭىز:</b> <b>$${updatedBalance.toFixed(2)} USD</b>\n\n` +
                `ھازىر دۇكان بۆلۈمىگە كىرىپ خالىغان مەھسۇلاتنى سېتىۋالالايسىز:`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [btnWithIcon('دۇكانغا كىرىش', 'shop', '🏪', { callback_data: 'shop:home' })],
                  [btnWithIcon('ھېسابات تاختىسى', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
                ],
              },
            },
            config.token
          );
          return;
        }
      }
    } catch (tsaErr: any) {
      console.warn('[ShamCash TSA auto-verify warning]:', tsaErr?.message);
    }
  }

  // 3. Fallback: Save pending deposit record & send 1-tap admin approval notification
  const pendingDeposit = await createDepositAsync({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    method: 'شامكەش (Sham Cash)',
    amount: 0,
    txId: cleanTxId,
  });

  // Reply to customer: Pending verification notice
  await callBotApi(
    'sendMessage',
    {
      chat_id: chatId,
      text:
        `⏳ <b>تالون تاپشۇرۇلدى! تەكشۈرۈلمەكتە...</b>\n\n` +
        `🧾 <b>تالون نومۇرى:</b> <code>${cleanTxId}</code>\n` +
        `👤 <b>ئىشلەتكۈچى:</b> ${user.name}\n\n` +
        `💡 <i>ئەسكەرتىش: شامكەش تورىدا بىر ئاز كېچىكىش بولۇشى مۇمكىن. تالون دەلىللىنىشى بىلەن تەڭ مەبلەغ ئاپتوماتىك ھېساباتىڭىزغا كىرىدۇ ھەم سىزگە مۇشۇ چاتتا ئۇقتۇرۇش كېلىدۇ.</i>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [btnWithIcon('ھېسابات تاختىسى', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
          [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
        ],
      },
    },
    config.token
  );

  // Send 1-tap approval card to Admin
  const adminAlertText =
    `💸💳 <b>يېڭى شامكەش تالونى تاپشۇرۇلدى!</b>\n\n` +
    `🧾 <b>تالون (TxID):</b> <code>${cleanTxId}</code>\n` +
    `👤 <b>خېرىدار:</b> ${user.name} (ID: <code>${chatId}</code>)\n` +
    `⏳ <b>ھالىتى:</b> تەكشۈرۈلمەكتە (Pending)\n` +
    `🤖 <b>بوت:</b> @${config.username}\n\n` +
    `👇 <b>تۆۋەندىكى تۈگمىلەردىن سوممىنى 1لا چېكىپ تەستىقلاڭ ياكى رەت قىلىڭ:</b>`;

  const adminButtons = [
    [
      { text: '✅ $5 تەستىقلاش', callback_data: `dep_approve:${pendingDeposit.id}:5:${chatId}` },
      { text: '✅ $10 تەستىقلاش', callback_data: `dep_approve:${pendingDeposit.id}:10:${chatId}` },
    ],
    [
      { text: '✅ $20 تەستىقلاش', callback_data: `dep_approve:${pendingDeposit.id}:20:${chatId}` },
      { text: '✅ $25 تەستىقلاش', callback_data: `dep_approve:${pendingDeposit.id}:25:${chatId}` },
    ],
    [
      { text: '✅ $50 تەستىقلاش', callback_data: `dep_approve:${pendingDeposit.id}:50:${chatId}` },
      { text: '✅ $100 تەستىقلاش', callback_data: `dep_approve:${pendingDeposit.id}:100:${chatId}` },
    ],
    [
      { text: '✅ ئەسلىدىكىدەك تەستىقلاش', callback_data: `dep_approve:${pendingDeposit.id}` },
      { text: '❌ رەت قىلىش', callback_data: `dep_reject:${pendingDeposit.id}:${chatId}` },
    ],
    [{ text: '🖥️ باشقۇرۇش مەركىزى', url: `${SITE_URL}/admin` }],
  ];

  await callBotApi(
    'sendMessage',
    {
      chat_id: ADMIN_CHAT_ID,
      text: adminAlertText,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: adminButtons },
    },
    config.token
  );
}

// ==========================================
// 5.5 WATCH & BROADCAST PROVIDER ORDERS (Othman Store & MaxStore)
// ==========================================
export async function watchAndBroadcastMaxStoreOrder(params: {
  orderId: string;
  providerOrderId: string;
  chatId: number | string;
  title: string;
  targetAccount: string;
  price: number;
  userName?: string;
  userEmail?: string;
  token: string;
  provider?: 'othman' | 'maxstore';
}) {
  const {
    orderId,
    providerOrderId,
    chatId,
    title,
    targetAccount,
    price,
    userName,
    userEmail,
    token,
    provider = 'maxstore',
  } = params;

  // Poll intervals in ms: 3s, 5s, 8s, 12s, 15s, 20s, 25s, 30s, 40s, 60s
  const intervals = [3000, 5000, 8000, 12000, 15000, 20000, 25000, 30000, 40000, 60000];
  const maxstoreToken = (process.env.MAXSTORE_API_TOKEN || 'msk_6HAfwl0cSpjPJ0jeB25V52gC5ETq3seC29C1qlgpdvI').trim();
  const othmanToken = (
    process.env.OTHMAN_STORE_API_TOKEN ||
    process.env.SYRIA4GAME_API_TOKEN ||
    '-OrFU2hk5qtDMWfei8SpSmYWhtgD1O5Na57FKQH9G0Q8EAv2a2OS12Vqag5Q5AKN'
  ).trim();

  for (let i = 0; i < intervals.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervals[i]));

    try {
      let item: any = null;
      if (provider === 'othman') {
        const oRes = await fetch(
          `https://api.othman-storee.com/client/api/check?orders=[${encodeURIComponent(providerOrderId)}]`,
          {
            headers: {
              'api-token': othmanToken,
              Accept: 'application/json',
            },
          }
        );
        const oData = await oRes.json();
        if (oData.status === 'OK' && Array.isArray(oData.data) && oData.data.length > 0) {
          item = oData.data[0];
        }
      } else {
        const msRes = await fetch(
          `https://maxstore1.com/api/v2/check?orders=${encodeURIComponent(providerOrderId)}`,
          {
            headers: {
              'api-token': maxstoreToken,
              Accept: 'application/json',
            },
          }
        );
        const msData = await msRes.json();
        if (msData.status === 'OK' && Array.isArray(msData.data) && msData.data.length > 0) {
          item = msData.data[0];
        }
      }

      if (!item) {
        continue;
      }
      const pStatus = (item.status || '').toLowerCase().trim();

      const isCompleted =
        ['completed', 'success', 'done', 'delivered', 'ok', 'accept', '1', '3', 'تم', 'مكتمل', 'مكتملة', 'تم الشحن', 'مشحون', 'تم التنفيذ', 'تم التسليم', 'تم الطلب', 'منجز'].includes(pStatus) ||
        pStatus.includes('مكتمل') ||
        pStatus.includes('تم الشحن') ||
        pStatus.includes('مشحون') ||
        pStatus.includes('تم التنفيذ') ||
        pStatus.includes('منجز');

      const isFailed =
        ['canceled', 'cancelled', 'rejected', 'reject', 'refunded', 'failed', 'error', '-1', '4', '5', '6', 'ملغي', 'مرفوض', 'فشل', 'خطأ'].includes(pStatus) ||
        pStatus.includes('ملغي') ||
        pStatus.includes('مرفوض') ||
        pStatus.includes('فشل');

      if (isCompleted) {
        const now = new Date().toISOString();
        try {
          const { updateOrderAsync } = await import('@/lib/db');
          await updateOrderAsync(orderId, {
            status: 'completed',
            detailsPatch: {
              providerStatus: 'COMPLETED',
              providerCheckedAt: now,
              completedAt: now,
              needsReview: false,
            },
          });
        } catch {}

        try {
          const { updateMicroAppOrderSync } = await import('@/lib/appWallets');
          updateMicroAppOrderSync(orderId, 'completed', now);
        } catch {}

        // Broadcast to channel immediately
        try {
          const { postOrderCompletedToChannel } = await import('./telegram');
          await postOrderCompletedToChannel({
            id: orderId,
            serviceName: title,
            packageTitle: title,
            amount: price,
            targetAccount,
            userName,
            userEmail,
            details: {
              store: provider === 'othman' ? 'autocash' : 'maxbazar',
              provider: provider === 'othman' ? 'othman' : 'maxstore',
              providerOrderId,
              playerName: item?.player_name || item?.playerName || item?.name,
            },
            force: true,
          });
        } catch {}

        // Send DM notification to customer
        try {
          await callBotApi(
            'sendMessage',
            {
              chat_id: chatId,
              text:
                `🎉 <b>زاكازىڭىز تولۇق قاچىلاندى!</b>\n\n` +
                `📦 <b>مەھسۇلات:</b> ${title}\n` +
                `🧾 <b>زاكاز نومۇرى:</b> <code>#${orderId}</code>\n` +
                `🔢 <b>تەمىنلىگۈچى نومۇرى:</b> <code>#${providerOrderId}</code>\n` +
                `🎯 <b>نىشان:</b> <code>${targetAccount}</code>\n\n` +
                `✅ <b>ھالىتى:</b> تەمىنلىگۈچى تەرەپتىن قاچىلاش مۇۋەپپەقىيەتلىك تاماملىنىپ، قانالغا يوللاندى! رەھمەت!`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🛍 زاكازلىرىمنى كۆرۈش', callback_data: 'orders:list' }],
                  [{ text: '🏪 دۇكانغا كىرىش', callback_data: 'shop:home' }],
                ],
              },
            },
            token
          );
        } catch {}

        return; // Completed!
      }

      if (isFailed) {
        const now = new Date().toISOString();
        try {
          const { refundOrderBalanceAtomicAsync } = await import('@/lib/db');
          await refundOrderBalanceAtomicAsync(orderId, `تەمىنلىگۈچى MaxStore رەت قىلدى: ${pStatus}`);
        } catch {}

        try {
          const { updateMicroAppOrderSync } = await import('@/lib/appWallets');
          updateMicroAppOrderSync(orderId, 'refunded', now);
        } catch {}

        // Notify Admin immediately about the failed/rejected order
        try {
          const { notifyOrderError } = await import('./telegram');
          notifyOrderError({
            orderId,
            serviceName: title,
            amount: price,
            targetAccount,
            userName: userName || userEmail || String(chatId),
            userEmail,
            provider: provider === 'othman' ? 'Othman Store' : 'MaxStore',
            errorMessage: `تەمىنلىگۈچى زاكازنى رەت قىلدى (${pStatus})`,
            isRefunded: true,
          }).catch(() => {});
        } catch {}

        try {
          await callBotApi(
            'sendMessage',
            {
              chat_id: chatId,
              text:
                `❌ <b>زاكازىڭىز قاچىلانمىدى!</b>\n\n` +
                `📦 <b>مەھسۇلات:</b> ${title}\n` +
                `🧾 <b>زاكاز نومۇرى:</b> <code>#${orderId}</code>\n` +
                `💰 <b>تۆلەنگەن سومما:</b> $${price.toFixed(2)} USD\n\n` +
                `💡 <i>تەمىنلىگۈچى تەرەپ زاكازنى رەت قىلغانلىقى ئۈچۈن، پۇلىڭىز ھېساباتىڭىزغا 100% قايتۇرۇلدى! كىملىك ياكى نومۇرىڭىزنى تەكشۈرۈپ قايتا سىناڭ.</i>`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🏦 قالدۇق تەكشۈرۈش', callback_data: 'balance:topup' }],
                  [{ text: '🏪 قايتا سېتىۋېلىش', callback_data: 'shop:home' }],
                ],
              },
            },
            token
          );
        } catch {}

        return; // Refunded!
      }
    } catch (pollErr: any) {
      console.warn('[watchAndBroadcastMaxStoreOrder] error:', pollErr?.message);
    }
  }
}

// ==========================================
// 6. MAIN WEBHOOK HANDLER (UNIFIED)
// ==========================================
export async function handleStoreBotWebhook(update: any, configOverride?: Partial<BotConfig>) {
  try {
    if (!update) return;

    const config: BotConfig = {
      ...DEFAULT_AUTOCASH_BOT_CONFIG,
      ...configOverride,
    };

    const api = (method: string, payload: any) => callBotApi(method, payload, config.token);
    const showMessage = (cId: number | string, mId: number | undefined, t: string, rm?: any) =>
      showOrEditMessage(cId, mId, t, rm, config.token);

    const ADMIN_CHAT_ID = String(process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493').trim();
    const ADMIN_USERNAME = (process.env.TELEGRAM_ADMIN_USERNAME || 'nasrulla0996')
      .toLowerCase()
      .replace(/^@/, '')
      .trim();

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

      await api('answerCallbackQuery', { callback_query_id: cqId });

      const user = await getOrCreateTelegramUser(chatId, username, firstName);
      const session = getSession(chatId);
      const isAdmin = String(chatId) === ADMIN_CHAT_ID || (Boolean(username) && username === ADMIN_USERNAME);

      // A.0 Deposit Approval from Admin
      if (data.startsWith('dep_approve:')) {
        if (!isAdmin) {
          await api('answerCallbackQuery', {
            callback_query_id: cqId,
            text: '⚠️ كەچۈرۈڭ، بۇ مەشغۇلاتنى پەقەت مەسئۇل باشقۇرغۇچىلا قىلالايدۇ!',
            show_alert: true,
          });
          return;
        }

        const parts = data.split(':');
        const depositId = parts[1];
        const customAmount = parts[2] ? parseFloat(parts[2]) : undefined;
        const customerChatId = parts[3] || undefined;

        const deposit = await getDepositByIdAsync(depositId);
        if (!deposit) {
          await api('answerCallbackQuery', {
            callback_query_id: cqId,
            text: '❌ بۇ تالون خاتىرىسى تېپىلمىدى',
            show_alert: true,
          });
          return;
        }

        if (deposit.status !== 'pending') {
          await api('answerCallbackQuery', {
            callback_query_id: cqId,
            text: `⚠️ بۇ تالون ئاللىقاچان بىر تەرەپ قىلىنغان (${deposit.status})`,
            show_alert: true,
          });
          return;
        }

        if (customAmount && customAmount > 0) {
          deposit.amount = customAmount;
        }

        const updated = await updateDepositStatusAsync(depositId, 'completed');
        const finalAmount = Number(deposit.amount || customAmount || 0);

        await api('answerCallbackQuery', {
          callback_query_id: cqId,
          text: `✅ $${finalAmount.toFixed(2)} خېرىدار ھەميانىغا كىرگۈزۈلدى!`,
          show_alert: false,
        });

        const adminDoneText =
          `✅ <b>پۇل كىرگۈزۈش تەستىقلاندى! (COMPLETED)</b>\n\n` +
          `💰 <b>سوممىسى:</b> <b>$${finalAmount.toFixed(2)} USD</b>\n` +
          `🧾 <b>تالون (TxID):</b> <code>${deposit.txId || '—'}</code>\n` +
          `👤 <b>خېرىدار:</b> ${deposit.userName || 'خېرىدار'}\n` +
          `👑 <b>تەستىقلىغۇچى:</b> @${username || 'Admin'}\n` +
          `⏰ <b>ۋاقتى:</b> ${new Date().toLocaleTimeString('ug', { hour: '2-digit', minute: '2-digit' })}`;

        await showMessage(chatId, messageId, adminDoneText, {
          inline_keyboard: [[{ text: '🖥️ باشقۇرۇش مەركىزى', url: `${SITE_URL}/admin` }]],
        });

        const targetChatId =
          customerChatId ||
          (deposit.userEmail && deposit.userEmail.includes('@telegram')
            ? deposit.userEmail.replace('@telegram.org', '')
            : null) ||
          deposit.userId;

        if (targetChatId) {
          try {
            const targetUser = await getOrCreateTelegramUser(targetChatId);
            const newBal = Number(targetUser.balance || 0);
            await api('sendMessage', {
              chat_id: targetChatId,
              text:
                `🎉 <b>پۇل كىرگۈزۈش تەستىقلاندى! قالدۇق مۇۋەپپەقىيەتلىك كىرگۈزۈلدى</b>\n\n` +
                `🧾 <b>تالون نومۇرى:</b> <code>${deposit.txId || '—'}</code>\n` +
                `💵 <b>قوشۇلغان سومما:</b> <b>+$${finalAmount.toFixed(2)} USD</b>\n` +
                `<tg-emoji emoji-id="5204179389725568654">💰</tg-emoji> <b>ھازىرقى قالدۇقىڭىز:</b> <b>$${newBal.toFixed(2)} USD</b>\n\n` +
                `دۇكاندىن خالىغان مەھسۇلاتنى سېتىۋالسىڭىز بولىدۇ:`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [btnWithIcon('دۇكانغا كىرىش', 'shop', '🏪', { callback_data: 'shop:home' })],
                  [btnWithIcon('ھېسابات تاختىسى', 'enter_bot', '🔑', { callback_data: 'menu:enter' })],
                ],
              },
            });
          } catch (e: any) {
            console.warn('[Customer celebrate send error]:', e?.message);
          }
        }
        return;
      }

      // A.0.1 Deposit Rejection from Admin
      if (data.startsWith('dep_reject:')) {
        if (!isAdmin) {
          await api('answerCallbackQuery', {
            callback_query_id: cqId,
            text: '⚠️ كەچۈرۈڭ، بۇ مەشغۇلاتنى پەقەت باشقۇرغۇچىلا قىلالايدۇ!',
            show_alert: true,
          });
          return;
        }

        const parts = data.split(':');
        const depositId = parts[1];
        const customerChatId = parts[2];

        await updateDepositStatusAsync(depositId, 'rejected').catch(() => null);
        await api('answerCallbackQuery', {
          callback_query_id: cqId,
          text: '❌ تالون رەت قىلىندى',
        });

        await showMessage(
          chatId,
          messageId,
          `❌ <b>تالون رەت قىلىندى (REJECTED)</b>\n\nتالون ID: <code>${depositId}</code>`,
          {
            inline_keyboard: [[{ text: '🖥️ باشقۇرۇش مەركىزى', url: `${SITE_URL}/admin` }]],
          }
        );

        if (customerChatId) {
          await api('sendMessage', {
            chat_id: customerChatId,
            text:
              `❌ <b>كەچۈرۈڭ، تاپشۇرغان تالونىڭىز تەستىقلانمىدى.</b>\n\n` +
              `سەۋەبى: تالون مەبلىغى ھېساباتقا چۈشمىگەن ياكى خاتا نومۇر كىرگۈزۈلگەن.\n` +
              `سۈرۈشتۈرۈش ئۈچۈن باشقۇرغۇچى بىلەن ئالاقىلىشىڭ: @${ADMIN_USERNAME}`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 قايتا كىرگۈزۈش', callback_data: 'balance:topup' }],
                [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
              ],
            },
          });
        }
        return;
      }

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
            await api('answerCallbackQuery', {
              callback_query_id: cqId,
              text: '⚠️ بۇ تەرەپ تەمىنلىگۈچىنىڭ باھا بۆلىكى يوق، باشقىلىرىنى سىناڭ.',
              show_alert: true,
            });
          }
        }

        const menu = getMenuContent(returnId, user, session, chatId, isAdmin, config);
        await showMessage(chatId, messageId, menu.text, { inline_keyboard: menu.inline_keyboard });
        return;
      }

      // A.2 Re-input Target Account
      if (data.startsWith('reinput|')) {
        const parts = data.split('|');
        const catKey = parts[1] || '';
        const pkgCode = parts[2] || '';
        if (session.pendingOrder) {
          session.pendingOrder.targetAccount = '';
          session.pendingOrder.zoneId = '';
          session.pendingOrder.step = 'awaiting_target';
        }
        const menu = getMenuContent(`buy|${catKey}|${pkgCode}`, user, session, chatId, isAdmin, config);
        await showMessage(chatId, messageId, menu.text, { inline_keyboard: menu.inline_keyboard });
        return;
      }

      // A.2.1 Telegram Self Target
      if (data.startsWith('tg_self|')) {
        const pkgCode = data.split('|')[1] || '';
        if (session.pendingOrder) {
          session.pendingOrder.targetAccount = username ? `@${username}` : String(chatId);
          session.pendingOrder.step = 'ready_to_confirm';
          const menu = getMenuContent(`buy|${session.pendingOrder.catKey}|${pkgCode}`, user, session, chatId, isAdmin, config);
          await showMessage(chatId, messageId, menu.text, { inline_keyboard: menu.inline_keyboard });
        }
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
        const pkg =
          findPackageByCode(pkgCode, effectiveProvider) ||
          findPackageByCode(pkgCode, 'autocash') ||
          findPackageByCode(pkgCode, 'maxbazar');
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

          await showMessage(chatId, messageId, failText, {
            inline_keyboard: [
              [btnWithIcon('قالدۇق قاچىلاش', 'topup_balance', '🏦', { callback_data: 'balance:topup' })],
              [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
            ],
          });
          return;
        }

        const reqInfo = getProductRequirement(pkgCode, session.pendingOrder?.catKey || '');
        const rawTargetAcc = (session.pendingOrder?.targetAccount || '').trim();
        const targetAcc = normalizeTargetAccount(rawTargetAcc, reqInfo.kind);
        const zoneId = (session.pendingOrder?.zoneId || '').trim();

        // If product requires user input, ensure targetAccount is present
        if (reqInfo.requiresInput && (!targetAcc || (reqInfo.requiresZoneId && !zoneId))) {
          const menu = getMenuContent(`buy|${session.pendingOrder?.catKey || 'shop:home'}|${pkgCode}`, user, session, chatId, isAdmin, config);
          await showMessage(chatId, messageId, menu.text, { inline_keyboard: menu.inline_keyboard });
          return;
        }

        // Wi-Fi cards inventory pre-check: strictly require valid card in stock
        let wifiCardExtra = '';
        let claimedWifiCard: any = null;
        if (isWifi) {
          try {
            const { claimAvailableWifiCardAsync } = await import('./wifiInventoryDb');
            claimedWifiCard = await claimAvailableWifiCardAsync({
              serviceId: pkgCode.split(':')[1] || 'fursan_net',
              packageId: pkgCode,
              orderId: 'ORD-' + Date.now().toString(36).toUpperCase(),
              userId: user.id,
              userEmail: user.email,
            });
          } catch {}

          if (!claimedWifiCard) {
            const outOfStockText =
              `⚠️ <b>كەچۈرۈڭ، بۇ Wi-Fi كارتا نۆۋەتتە تۈگىدى!</b>\n\n` +
              `نۆۋەتتە مەزكۇر تۈردىكى كارتىنىڭ ئامبىرى قۇرۇق بولغانلىقى ئۈچۈن زاكاز قوبۇل قىلىنمىدى.\n` +
              `ھېسابات قالدۇقىڭىزدىن ھېچقانداق پۇل كېسىلمىدى! ئامبار تولۇقلانغاندا سېتىۋالالايسىز.`;

            await showMessage(chatId, messageId, outOfStockText, {
              inline_keyboard: [
                [btnWithIcon('باشقا كارتىلارنى كۆرۈش', 'wifi', '📶', { callback_data: 'shop:wifi' })],
                [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
              ],
            });
            return;
          }

          wifiCardExtra =
            `\n📶 <b>Wi-Fi كارتا ئۇچۇرى:</b>\n` +
            `👤 <b>ئىشلەتكۈچى:</b> <code>${claimedWifiCard.username}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>\n` +
            `🔑 <b>پارولى:</b> <code>${claimedWifiCard.password}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>\n` +
            `🔢 <b>كارتا نومۇرى:</b> <code>${claimedWifiCard.cardNumber}</code>\n`;
        }

        // DISPATCH TO DESIGNATED WHOLESALE PROVIDER:
        // - 'autocash' (:ac) -> Othman Store (https://api.othman-storee.com)
        // - 'maxbazar' (:mb) -> MaxStore (https://maxstore1.com)
        let providerOrderId: string | null = null;
        let providerStatus = 'completed';
        let providerError: string | null = null;

        const isOthman = pkgCode.endsWith(':ac') || (effectiveProvider === 'autocash' && !pkgCode.endsWith(':mb'));
        const chosenWholesaleProvider: 'othman' | 'maxstore' = isOthman ? 'othman' : 'maxstore';

        const othmanProductId =
          reqInfo.othmanStoreProductId ||
          (pkgCode.match(/:(\d+):ac$/) ? Number(pkgCode.match(/:(\d+):ac$/)![1]) : undefined);
        const maxstoreProductId =
          reqInfo.maxstoreProductId ||
          (pkgCode.match(/:(\d+):mb$/) ? Number(pkgCode.match(/:(\d+):mb$/)![1]) : undefined);

        const targetProductId = chosenWholesaleProvider === 'othman' ? othmanProductId : maxstoreProductId;

        if (!isWifi && !targetProductId) {
          const failMsg =
            `⚠️ <b>كەچۈرۈڭ، مەزكۇر مەھسۇلاتنىڭ تەمىنلىگۈچى لىنىيىسى نۆۋەتتە يېڭىلىنىۋاتىدۇ!</b>\n\n` +
            `زاكاز قوبۇل قىلىنمىدى ۋە ھېسابات قالدۇقىڭىزدىن ھېچقانداق پۇل كېسىلمىدى.\n` +
            `سۈرۈشتۈرۈش ئۈچۈن باشقۇرغۇچى بىلەن ئالاقىلىشىڭ: @${ADMIN_USERNAME}`;

          await showMessage(chatId, messageId, failMsg, {
            inline_keyboard: [
              [btnWithIcon('باشقا مەھسۇلاتلار', 'shop', '🛍️', { callback_data: 'shop:home' })],
              [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
            ],
          });
          return;
        }

        const orderUuid = crypto.randomUUID();

        // 1. DISPATCH TO OTHMAN STORE (AUTO CASH / :ac)
        if (!isWifi && chosenWholesaleProvider === 'othman' && targetProductId) {
          const othmanToken = (
            process.env.OTHMAN_STORE_API_TOKEN ||
            process.env.SYRIA4GAME_API_TOKEN ||
            '-OrFU2hk5qtDMWfei8SpSmYWhtgD1O5Na57FKQH9G0Q8EAv2a2OS12Vqag5Q5AKN'
          ).trim();

          try {
            const query = new URLSearchParams({
              qty: '1',
              order_uuid: orderUuid,
              'الايدي': targetAcc,
              'ادخل رقم الهاتف بدون النداء': targetAcc,
              'رقم المشترك': targetAcc,
              'رقم الهاتف': targetAcc,
              playerId: targetAcc,
              player_id: targetAcc,
              phone: targetAcc,
              link: targetAcc,
              url: targetAcc,
              'الرابط': targetAcc,
              email: targetAcc,
            });
            if (zoneId) {
              query.set('رقم السيرفر', zoneId);
              query.set('zoneId', zoneId);
              query.set('server_id', zoneId);
            }

            const othmanUrl = `https://api.othman-storee.com/client/api/newOrder/${encodeURIComponent(String(targetProductId))}/params?${query.toString()}`;
            const oRes = await fetch(othmanUrl, {
              method: 'GET',
              headers: {
                'api-token': othmanToken,
                Accept: 'application/json',
              },
            });
            const oData = await oRes.json();
            if (oData.status === 'OK' && (oData.data?.order_id || oData.order_id)) {
              providerOrderId = String(oData.data?.order_id || oData.order_id);
              providerStatus = oData.data?.status || 'in_progress';
            } else {
              providerError = oData.message || oData.detail?.message || oData.error || 'تەمىنلىگۈچى (Othman Store) زاكازنى رەت قىلدى';
            }
          } catch (e: any) {
            providerError = 'تەمىنلىگۈچى (Othman Store) بىلەن ئۇلىنىش ئۈزۈلدى';
          }
        }

        // 2. DISPATCH TO MAXSTORE (MAX-BAZAR / :mb)
        else if (!isWifi && chosenWholesaleProvider === 'maxstore' && targetProductId) {
          const maxstoreToken = (
            process.env.MAXSTORE_API_TOKEN || 'msk_6HAfwl0cSpjPJ0jeB25V52gC5ETq3seC29C1qlgpdvI'
          ).trim();

          try {
            const orderParams: Record<string, any> = {
              player_id: targetAcc,
              Player_ID: targetAcc,
              ID: targetAcc,
              phone: targetAcc,
              Phone_Number: targetAcc,
              'ايدي اللاعب': targetAcc,
              'رقم المشترك': targetAcc,
              'ادخل رقم الهاتف بدون النداء': targetAcc,
              'رقم الهاتف': targetAcc,
              Email: targetAcc,
              email: targetAcc,
            };
            if (zoneId) {
              orderParams.server_id = zoneId;
              orderParams['رقم السيرفر'] = zoneId;
              orderParams.zoneId = zoneId;
            }

            const msRes = await fetch('https://maxstore1.com/api/v2/order', {
              method: 'POST',
              headers: {
                'api-token': maxstoreToken,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                product_id: targetProductId,
                order_uuid: orderUuid,
                qty: 1,
                params: orderParams,
              }),
            });
            const msData = await msRes.json();
            if (msData.status === 'OK' && msData.data?.order_id) {
              providerOrderId = String(msData.data.order_id);
              providerStatus = msData.data.status || 'in_progress';
            } else {
              const detailMsg =
                msData.detail?.message ||
                (typeof msData.detail === 'string' ? msData.detail : null) ||
                (Array.isArray(msData.detail) ? msData.detail[0]?.msg : null) ||
                msData.error ||
                'تەمىنلىگۈچى (MaxStore) زاكازنى رەت قىلدى';
              providerError = detailMsg;
            }
          } catch (e: any) {
            providerError = 'تەمىنلىگۈچى (MaxStore) بىلەن ئۇلىنىش ئۈزۈلدى';
          }
        }

        // IF PROVIDER REJECTED, PROTECT CUSTOMER FUNDS 100%!
        if (providerError) {
          // Immediately alert Admin via Telegram about the error
          try {
            const { notifyOrderError } = await import('./telegram');
            notifyOrderError({
              serviceName: rawTitle,
              amount: price,
              targetAccount: targetAcc || String(chatId),
              userName: user.name || user.email || String(chatId),
              userEmail: user.email,
              provider: chosenWholesaleProvider === 'othman' ? 'Othman Store' : 'MaxStore',
              errorMessage: providerError,
              isRefunded: false,
            }).catch(() => {});
          } catch {}

          const failMsg =
            `❌ <b>تەمىنلىگۈچى زاكازنى قوبۇل قىلمىدى!</b>\n\n` +
            `⚠️ <b>سەۋەبى:</b> ${providerError}\n\n` +
            `💡 <i>كىرگۈزگەن كىملىك ياكى نومۇرىڭىزنى تەكشۈرۈپ قايتا سىناڭ. ھېسابات قالدۇقىڭىزدىن ھېچقانداق پۇل كېسىلمىدى!</i>`;

          await showMessage(chatId, messageId, failMsg, {
            inline_keyboard: [
              [btnWithIcon('قايتا كىرگۈزۈش', 'edit', '✏️', {
                callback_data: `reinput|${session.pendingOrder?.catKey || 'shop:home'}|${pkgCode}`,
              })],
              [btnWithIcon('باش بەت', 'home', '🏠', { callback_data: 'menu:main' })],
            ],
          });
          return;
        }

        // Deduct balance atomically
        const newOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        await adjustUserBalanceAsync(user.id, -price);
        const newBalance = Math.max(0, currentBalance - price);

        const targetAccountFull = isWifi
          ? 'Wi-Fi كارتىسى'
          : `${targetAcc}${zoneId ? ` (Zone: ${zoneId})` : ''}`.trim() || String(chatId);

        // Record order locally and in session
        const providerUpper = isWifi ? 'AUTOCASH' : session.selectedProvider.toUpperCase();

        const orderRecord = {
          orderId: newOrderId,
          title: rawTitle,
          code: pkgCode,
          price,
          provider: providerUpper,
          date: new Date().toLocaleTimeString('ug', { hour: '2-digit', minute: '2-digit' }),
          targetAccount: targetAccountFull,
        };
        session.localOrders.unshift(orderRecord);

        const isCompletedNow = isWifi || providerStatus === 'completed' || providerStatus === 'accept';

        // Also create atomic order record in database
        try {
          await deductBalanceAndCreateOrderAtomicAsync({
            userId: user.id,
            userEmail: user.email,
            serviceId: `${config.username}_${pkgCode}`,
            serviceName: rawTitle,
            packageTitle: rawTitle,
            amount: price,
            targetAccount: targetAccountFull,
            orderId: newOrderId,
            details: {
              store: isWifi ? config.brand : (chosenWholesaleProvider === 'othman' ? 'AUTO CASH' : 'MAX-BAZAR'),
              provider: isWifi ? 'autocash' : chosenWholesaleProvider,
              providerKey: isWifi ? 'autocash' : chosenWholesaleProvider,
              providerOrderId: providerOrderId || undefined,
              targetAccount: targetAcc,
              zoneId: zoneId || undefined,
              providerProductId: targetProductId,
              maxstoreProductId: chosenWholesaleProvider === 'maxstore' ? targetProductId : undefined,
              othmanProductId: chosenWholesaleProvider === 'othman' ? targetProductId : undefined,
              ...(claimedWifiCard ? { wifiCard: claimedWifiCard } : {}),
            },
            initialStatus: isCompletedNow ? 'completed' : 'processing',
          });
        } catch {}

        // Notify Admin immediately about the new order
        try {
          const { notifyNewOrder } = await import('./telegram');
          notifyNewOrder({
            id: newOrderId,
            serviceName: rawTitle,
            packageTitle: rawTitle,
            amount: price,
            targetAccount: targetAccountFull,
            userName: user.name || user.email || String(chatId),
            userEmail: user.email,
            status: isCompletedNow ? 'مۇۋەپپەقىيەتلىك پۈتتى' : 'تەمىنلىگۈچىگە يوللاندى، قاچىلىنىۋاتىدۇ',
            fields: {
              'سۇپا': isWifi ? '📡 Wi-Fi ئامبىرى' : (chosenWholesaleProvider === 'othman' ? '⚡️ AUTO CASH (Othman)' : '🟢 MAX-BAZAR (MaxStore)'),
              'تەمىنلىگۈچى نومۇرى': providerOrderId || '—',
              'خېرىدار ID': String(chatId),
            },
          }).catch(() => {});
        } catch {}

        const isTopup =
          pkgCode.startsWith('syr:') ||
          pkgCode.startsWith('syr_m:') ||
          pkgCode.startsWith('mtn:') ||
          pkgCode.startsWith('mtn_m:') ||
          pkgCode.startsWith('tr:');

        const statusDisplay = isCompletedNow
          ? `✅ <b>ھالىتى:</b> <b>زاكاز تولۇق قاچىلاندى!</b>`
          : `<tg-emoji emoji-id="5370896319210595146">🤔</tg-emoji> <b>ھالىتى:</b> <b>زاكاز قوبۇل قىلىندى، قاچىلىنىۋاتىدۇ... ⚡</b>`;

        const successText =
          `🎉 <b>زاكاز مۇۋەپپەقىيەتلىك تاپشۇرۇلدى!</b>\n\n` +
          `📦 <b>مەھسۇلات:</b> ${rawTitle}\n` +
          `🧾 <b>زاكاز نومۇرى:</b> <code>#${newOrderId}</code>\n` +
          (providerOrderId ? `🔢 <b>تەمىنلىگۈچى نومۇرى:</b> <code>#${providerOrderId}</code>\n` : '') +
          (!isWifi ? `🎯 <b>نىشان كىملىك:</b> <code>${targetAccountFull}</code>\n` : '') +
          (!isWifi && !isTopup ? `💰 <b>باھا تۈرى:</b> <b>${effectiveProvider}</b>\n` : '') +
          `💰 <b>كېسىلگەن سومما:</b> -$${price.toFixed(2)} USD\n` +
          `💳 <b>قالغان قالدۇقىڭىز:</b> <b>${newBalance.toFixed(2)} USD</b>\n` +
          statusDisplay + '\n' +
          wifiCardExtra +
          `\nمەھسۇلات ئاپتوماتىك قاچىلىنىدۇ. رەھمەت!`;

        // Clear active pending order
        session.pendingOrder = null;

        // If completed immediately (e.g. Wi-Fi card or instant provider completion), broadcast now!
        if (isCompletedNow) {
          try {
            const { postOrderCompletedToChannel } = await import('./telegram');
            postOrderCompletedToChannel({
              id: newOrderId,
              serviceName: rawTitle,
              packageTitle: rawTitle,
              amount: price,
              targetAccount: targetAccountFull,
              userName: user.name || user.email || String(chatId),
              details: {
                store: isWifi ? config.brand : (chosenWholesaleProvider === 'othman' ? 'AUTO CASH' : 'MAX-BAZAR'),
                provider: isWifi ? 'autocash' : chosenWholesaleProvider,
                providerOrderId,
                ...(claimedWifiCard ? { wifiCard: claimedWifiCard } : {}),
              },
              force: true,
            }).catch(() => null);
          } catch {}
        } else if (providerOrderId) {
          // If pending provider completion, watch and broadcast the exact instant it finishes!
          watchAndBroadcastMaxStoreOrder({
            orderId: newOrderId,
            providerOrderId,
            chatId,
            title: rawTitle,
            targetAccount: targetAccountFull,
            price,
            userName: user.name || user.email || String(chatId),
            userEmail: user.email,
            token: config.token,
            provider: chosenWholesaleProvider,
          }).catch((err) => console.error('[watchAndBroadcastMaxStoreOrder] failed:', err));
        }

        await showMessage(chatId, messageId, successText, {
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
                provider: config.brand,
                date: new Date(o.createdAt || Date.now()).toLocaleTimeString('ug', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              });
            }
          });
        }

        if (allOrders.length === 0) {
          const emptyText =
            `<tg-emoji emoji-id="5204021180310252946">✔️</tg-emoji> <b>زاكازلىرىم</b>\n\n` +
            `سىز تېخى بىرەر زاكاز بەرمىدىڭىز.\n` +
            `دۇكان بۆلۈمىگە كىرىپ ئېھتىياجلىق مەھسۇلاتنى سېتىۋالسىڭىز بولىدۇ.`;

          await showMessage(chatId, messageId, emptyText, {
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

        const ordersText = `<tg-emoji emoji-id="5204021180310252946">✔️</tg-emoji> <b>سىزنىڭ زاكازلىرىڭىز (${allOrders.length} دانە):</b>\n\n${orderLines}`;

        await showMessage(chatId, messageId, ordersText, {
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
        await showMessage(chatId, messageId, confirmText, {
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

      const targetCategoryData = PROVIDER_DATA[nextMenuId];
      if (targetCategoryData && !nextMenuId.startsWith('topup:') && !nextMenuId.startsWith('wifi:')) {
        const curProv = session.selectedProvider;
        const curCount =
          curProv === 'autocash'
            ? targetCategoryData.autocash?.length || 0
            : targetCategoryData.maxbazar?.length || 0;
        const altProv = curProv === 'autocash' ? 'maxbazar' : 'autocash';
        const altCount =
          altProv === 'autocash'
            ? targetCategoryData.autocash?.length || 0
            : targetCategoryData.maxbazar?.length || 0;

        if (curCount === 0 && altCount > 0) {
          session.selectedProvider = altProv;
        }
      }

      const menu = getMenuContent(nextMenuId, user, session, chatId, isAdmin, config);
      await showMessage(chatId, messageId, menu.text, { inline_keyboard: menu.inline_keyboard });
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
      const SESSIONS_DIR = IS_SERVERLESS
        ? path.join('/tmp', 'micro_apps')
        : path.join(process.cwd(), 'data', 'micro_apps');
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
    const authMatch =
      text.match(/^\/start\s+(?:auth_|login_)?([a-fA-F0-9_]{12,64})/i) ||
      text.match(/^\/start\s+auth_([a-zA-Z0-9_]+)/i);
    if (authMatch) {
      const authToken = authMatch[1];
      try {
        const { approveTelegramLoginSessionAsync } = await import('./telegramAuthSessions');
        await approveTelegramLoginSessionAsync(authToken, user.id);

        const returnUrl = `${SITE_URL}/apps`;
        await api('sendMessage', {
          chat_id: chatId,
          text:
            `🎉 <b>${config.brand} غا كىرىش مۇۋەپپەقىيەتلىك تەستىقلاندى!</b>\n\n` +
            `<tg-emoji emoji-id="5201906965478930360">👤</tg-emoji> ھېساباتىڭىز: <b>${user.name}</b>\n` +
            `<tg-emoji emoji-id="5204179389725568654">💰</tg-emoji> ئورتاق قالدۇقىڭىز: <b>$${Number(
              user.balance || 0
            ).toFixed(2)} USD</b>\n\n` +
            `⚡️ ھازىر توربەت ياكى ئەپكە قايتسىڭىز، ھېساباتىڭىز ئۆزلۈكىدىن كىرىپ تەييار بولدى!`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: `🛍️ ${config.brand} نى ئېچىش`, web_app: { url: returnUrl } }]],
          },
        });
      } catch (err: any) {
        console.error('[Store Bot Auth Error]:', err?.message);
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

        await api('sendMessage', {
          chat_id: chatId,
          text:
            `🎉 <b>ھېساباتىڭىز تېلېفوندىكى ئەپكە دەرھال ئۇلاندى!</b>\n\n` +
            `🎮 ئەپ: <b>${appName}</b>\n` +
            `<tg-emoji emoji-id="5201906965478930360">👤</tg-emoji> كىملىكىڭىز: <b>${verified.identity}</b>\n` +
            `<tg-emoji emoji-id="5204179389725568654">💰</tg-emoji> قالدۇقىڭىز: <b>$${verified.balance.toFixed(
              2
            )} USD</b>\n\n` +
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
        await api('sendMessage', {
          chat_id: chatId,
          text: '⚠️ <b>كەچۈرۈڭ، بۇ مەشغۇلات پەقەت ئاساسىي دۇكان باشقۇرغۇچىسىغىلا مەخسۇس ئېچىۋېتىلگەن.</b>',
          parse_mode: 'HTML',
        });
        return;
      }

      const adminToken = createAdminToken();
      const adminUrl = `${SITE_URL}/admin?tab=maxbazar&token=${adminToken}`;

      await api('sendMessage', {
        chat_id: chatId,
        text:
          `👑 <b>ھۆرمەتلىك دۇكان باشقۇرغۇچىسى @${ADMIN_USERNAME}!</b>\n\n` +
          `📱 <b>${config.brand} باشقۇرغۇچى مەركىزى</b>\n\n` +
          `• بارلىق ئەپلەرنىڭ (PUBG, HOK, MLBB, MTN, Syriatel) زاكازلىرىنى بىۋاسىتە باشقۇرۇش\n` +
          `• تەمىنلىگۈچى ھالىتىنى تەكشۈرۈش ۋە زاكازلارنى تاماملاش\n` +
          `• تېلېگرامما قانىلىغا «📢 قانالغا» كۇنۇپكىسى بىلەن 1لا بېسىپ تالون چىقىرىش\n\n` +
          `تۆۋەندىكى كۇنۇپكىنى بېسىپ دەرھال باشقۇرۇش كۆزنىكىگە كىرىڭ:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `📱 👑 ${config.brand} باش تاختىسىغا كىرىش`,
                web_app: { url: adminUrl },
              },
            ],
            [
              {
                text: '🌐 تور كۆرگۈچتە ئېچىش',
                url: adminUrl,
              },
            ],
          ],
        },
      });
      return;
    }

    // B.4.1 Cancel Pending Order
    if (
      session.pendingOrder &&
      (text === '/cancel' ||
        text === 'بىكار قىلىش' ||
        text === '❌ بىكار قىلىش' ||
        text.toLowerCase() === 'cancel')
    ) {
      session.pendingOrder = null;
      const menu = getMenuContent('menu:main', user, session, chatId, isAdmin, config);
      await api('sendMessage', {
        chat_id: chatId,
        text: '❌ <b>زاكاز كىرگۈزۈش بىكار قىلىندى.</b>\n\nكېرەكلىك بۆلەكنى تاللاڭ:',
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: menu.inline_keyboard },
      });
      return;
    }

    // B.4.2 Handle Active Order Input (Player ID / Phone Number / Email / Zone ID)
    if (
      session.pendingOrder &&
      (session.pendingOrder.step === 'awaiting_target' || session.pendingOrder.step === 'awaiting_zone') &&
      !text.startsWith('/') &&
      text !== 'باش بەت' &&
      text !== 'باشلاش' &&
      text !== '🚀 باشلاش' &&
      text !== 'باشلاش 🚀'
    ) {
      const pending = session.pendingOrder;
      const cleanInput = text.trim();

      if (pending.step === 'awaiting_target') {
        if (pending.kind === 'mlbb') {
          // Check if user provided both UID and Zone ID in one string, e.g. "12345678 (2045)" or "12345678 2045"
          const mlbbMatch = cleanInput.match(/^(\d{5,12})\s*[\(\[\{]?\s*(\d{3,6})\s*[\)\]\}]?$/);
          if (mlbbMatch) {
            pending.targetAccount = mlbbMatch[1];
            pending.zoneId = mlbbMatch[2];
            pending.step = 'ready_to_confirm';
          } else {
            pending.targetAccount = cleanInput.replace(/[\(\)\[\]]/g, '').trim();
            pending.step = 'awaiting_zone';
            await api('sendMessage', {
              chat_id: chatId,
              text:
                `⚔️ <b>Mobile Legends رايون نومۇرى (Zone ID / Server ID)</b>\n\n` +
                `ئويۇنچى كىملىكىڭىز: <code>${pending.targetAccount}</code>\n\n` +
                `🎯 <b>ئەمدى ئويۇندىكى رايون نومۇرىڭىزنى (Zone ID) كىرگۈزۈڭ:</b>\n` +
                `<i>💡 مەسىلەن: <code>2045</code> (ئويۇندىكى قاۋاق ئىچىدىكى 4-5 خانىلىق رايون كودى)</i>`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [btnWithIcon('بىكار قىلىش', 'cancel', '❌', { callback_data: pending.catKey || 'shop:home' })],
                ],
              },
            });
            return;
          }
        } else {
          pending.targetAccount = cleanInput;
          pending.step = 'ready_to_confirm';
        }
      } else if (pending.step === 'awaiting_zone') {
        pending.zoneId = cleanInput.replace(/[\(\)\[\]\{\}]/g, '').trim();
        pending.step = 'ready_to_confirm';
      }

      // Show final confirmation menu
      const menu = getMenuContent(`buy|${pending.catKey}|${pending.pkgCode}`, user, session, chatId, isAdmin, config);
      await api('sendMessage', {
        chat_id: chatId,
        text: menu.text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: menu.inline_keyboard },
      });
      return;
    }

    // B.5 ShamCash Transaction Verification (Customer sends transaction ID or receipt text)
    const normalizedInputTx = normalizeTxId(text);
    if (
      /^\d{5,25}$/.test(normalizedInputTx) ||
      (text.length >= 5 && text.length <= 32 && /^[a-zA-Z0-9_-]{5,32}$/.test(text) && !text.startsWith('/'))
    ) {
      await handleShamCashTxVerify(chatId, text, user, config);
      return;
    }

    // B.6 Command /start or 'باشلاش' or 'باش بەت'
    if (
      text.startsWith('/start') ||
      text === 'باشلاش' ||
      text === 'باشلاش 🚀' ||
      text === '🚀 باشلاش' ||
      text === 'باش بەت' ||
      text.toLowerCase() === 'start'
    ) {
      session.history = [];
      const menu = getMenuContent('menu:main', user, session, chatId, isAdmin, config);

      // Step 1: Send persistent bottom keyboard
      await api('sendMessage', {
        chat_id: chatId,
        text: `<tg-emoji emoji-id="5998929578515504488">#⃣</tg-emoji> <b>${config.brand} | ئەڭ ئەرزان رەقەملىك ئەپلەر ۋە ئويۇن بازىرى</b>`,
        parse_mode: 'HTML',
        reply_markup: STORE_PERSISTENT_KEYBOARD,
      });

      // Step 2: Send main menu with inline buttons
      await api('sendMessage', {
        chat_id: chatId,
        text: menu.text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: menu.inline_keyboard },
      });
      return;
    }

    // B.7 Any other message: Show quick guide
    await api('sendMessage', {
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
    console.error('[handleStoreBotWebhook Error]:', err?.message);
  }
}

export const handleMaxBazarWebhook = (update: any) =>
  handleStoreBotWebhook(update, DEFAULT_MAXBAZAR_BOT_CONFIG);
