import {
  getAllUsersAsync,
  getUserByEmailAsync,
  createUserAsync,
  updateUserAsync,
  deductBalanceAndCreateOrderAtomicAsync,
  transitionOrderAsync,
  randomId,
  UserRecord,
} from './db';
import { getServicesList } from './servicesDb';
import { syria4GameProvider, othmanStoreProvider, generateUUIDv4 } from './providers/syria4game';
import { notifyNewOrder, TELEGRAM_CONFIG } from './telegram';
import type { ServiceItem, ServicePackage } from './data';
import {
  BotLanguage,
  getUserLanguage,
  setUserLanguage,
  BOT_I18N,
  getLanguageSelectionKeyboard,
  LANGUAGE_SELECTION_BANNER,
} from './telegramI18n';
import { smartTranslateTitle } from './catalog/smartTranslate';

export interface BotOrderSession {
  step: 'awaiting_target_account' | 'awaiting_zone_id' | 'ready_to_confirm';
  serviceId: string;
  serviceName: string;
  pkgId: string;
  pkgTitle: string;
  price: number;
  providerProductId?: number;
  providerQty?: number;
  requiresZoneId?: boolean;
  targetAccount?: string;
  zoneId?: string;
  timestamp: number;
}

export const botOrderSessions = new Map<string | number, BotOrderSession>();

export async function getOrCreateTelegramUser(
  fromId: number | string,
  fromUsername?: string,
  firstName?: string
): Promise<UserRecord> {
  const allUsers = await getAllUsersAsync();

  // 1. Check if an account is linked by telegramChatId
  const linkedByChatId = allUsers.find(
    (u) => u.telegramChatId && String(u.telegramChatId) === String(fromId)
  );
  if (linkedByChatId) {
    if (fromUsername && linkedByChatId.telegramUsername !== fromUsername) {
      updateUserAsync(linkedByChatId.id, { telegramUsername: fromUsername } as any).catch(() => {});
    }
    return linkedByChatId;
  }

  // 2. Check if an account is linked by telegramUsername
  if (fromUsername) {
    const linkedByUsername = allUsers.find(
      (u) =>
        u.telegramUsername &&
        u.telegramUsername.toLowerCase().replace('@', '') === fromUsername.toLowerCase().replace('@', '')
    );
    if (linkedByUsername) {
      await updateUserAsync(linkedByUsername.id, {
        telegramChatId: fromId,
        telegramUsername: fromUsername,
      } as any);
      return linkedByUsername;
    }
  }

  // 3. Check default telegram email
  const tgEmail = `tg_${fromId}@autocash.pro`;
  const existing = await getUserByEmailAsync(tgEmail);
  if (existing) {
    return existing;
  }

  const newUser = await createUserAsync({
    name: firstName || fromUsername || `TG_${fromId}`,
    email: tgEmail,
    password: `tg_pass_${fromId}_${Date.now()}`,
    role: 'user',
  });
  await updateUserAsync(newUser.id, {
    telegramChatId: fromId,
    telegramUsername: fromUsername || undefined,
  } as any);
  return newUser;
}

export const SHOP_CATEGORIES_BANNER = `
╭━━━ 🛍️ <b>مەھسۇلاتلار دۇكىنى</b> ━━━╮

📌 <b>دۇكان — كېرەكلىك بۆلەكنى تاللاڭ:</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

export function getShopCategoriesKeyboard(lang: BotLanguage = 'ug') {
  const c = BOT_I18N.categories;
  return {
    inline_keyboard: [
      [
        { text: c.visa[lang] || c.visa.ug, callback_data: 'tgserv:othman_visa_cards' },
      ],
      [
        { text: c.numbers[lang] || c.numbers.ug, callback_data: 'tgcat:numbers' },
        { text: c.apps[lang] || c.apps.ug, callback_data: 'tgcat:apps' },
      ],
      [
        { text: c.accounts[lang] || c.accounts.ug, callback_data: 'tgcat:accounts' },
        { text: c.games[lang] || c.games.ug, callback_data: 'tgcat:games' },
      ],
      [
        { text: c.balance[lang] || c.balance.ug, callback_data: 'tgcat:balance' },
        { text: c.cards[lang] || c.cards.ug, callback_data: 'tgcat:cards' },
      ],
      [
        { text: c.giftcards[lang] || c.giftcards.ug, callback_data: 'tgcat:giftcards' },
        { text: c.social[lang] || c.social.ug, callback_data: 'tgcat:social' },
      ],
      [
        { text: c.backToMain[lang] || c.backToMain.ug, callback_data: 'back_to_main' },
      ],
    ],
  };
}

export function getCategoryDisplayTitle(catKey: string, lang: BotLanguage = 'ug'): string {
  const c = BOT_I18N.categories;
  switch (catKey) {
    case 'crypto':
    case 'visa':
      return c.visa[lang] || c.visa.ug;
    case 'numbers':
      return c.numbers[lang] || c.numbers.ug;
    case 'apps':
      return c.apps[lang] || c.apps.ug;
    case 'accounts':
      return c.accounts[lang] || c.accounts.ug;
    case 'games':
      return c.games[lang] || c.games.ug;
    case 'balance':
      return c.balance[lang] || c.balance.ug;
    case 'cards':
      return c.cards[lang] || c.cards.ug;
    case 'giftcards':
      return c.giftcards[lang] || c.giftcards.ug;
    case 'social':
      return c.social[lang] || c.social.ug;
    default:
      return BOT_I18N.storeButtons.shopCategories[lang] || 'مەھسۇلاتلار دۇكىنى';
  }
}

export const TOP_GAME_ORDER = [
  'othman_mobile_legends',
  'othman_pubg',
  'pubg_mobile',
  'othman_free_fire',
  'free_fire',
  'othman_honor_of_kings',
  'othman_arena_breakout',
  'othman_delta_force',
  'othman_blood_strike',
  'othman_call_of_duty',
  'othman_genshin_impact',
  'othman_whiteout_survival',
  'othman_efootball',
  'othman_ball_pool_8',
  'othman_yalla_ludo',
  'othman_jawaker',
  'othman_roblox',
];

export function getServicesForCategory(catKey: string): ServiceItem[] {
  const all = getServicesList().filter((s) => s.published !== false);
  if (catKey === 'giftcards') {
    return all.filter(
      (s) =>
        s.id.includes('roblox') ||
        s.id.includes('google_play') ||
        s.id.includes('apple') ||
        s.id.includes('steam') ||
        s.id.includes('netflix') ||
        s.id.includes('shahid') ||
        s.name.toLowerCase().includes('card') ||
        s.name.toLowerCase().includes('كارت')
    );
  }
  if (catKey === 'crypto' || catKey === 'visa') {
    return all.filter(
      (s) =>
        s.id === 'othman_visa_cards' ||
        s.id.includes('visa') ||
        s.category === 'crypto' ||
        s.name.toLowerCase().includes('visa') ||
        s.name.toLowerCase().includes('usdt') ||
        s.name.toLowerCase().includes('crypto')
    );
  }
  if (catKey === 'accounts') {
    return all.filter((s) => s.category === 'accounts' || s.category === 'ai');
  }
  if (catKey === 'balance' || catKey === 'wifi') {
    return all.filter(
      (s) =>
        s.category === 'wifi' ||
        s.category === 'balance' ||
        s.id === 'fursan_net' ||
        s.id === 'azez_net' ||
        s.id === 'almujahid_net'
    );
  }
  if (catKey === 'cards') {
    return all.filter(
      (s) =>
        s.category === 'cards' ||
        s.id.includes('syriatel') ||
        s.id.includes('mtn') ||
        s.id.includes('vodafone') ||
        s.id.includes('turk_telekom') ||
        s.id.includes('turkcell')
    );
  }
  if (catKey === 'games') {
    const games = all.filter((s) => s.category === 'games');
    return games.sort((a, b) => {
      const idxA = TOP_GAME_ORDER.findIndex((id) => a.id === id || a.id.includes(id));
      const idxB = TOP_GAME_ORDER.findIndex((id) => b.id === id || b.id.includes(id));
      const rankA = idxA === -1 ? 999 : idxA;
      const rankB = idxB === -1 ? 999 : idxB;
      return rankA - rankB;
    });
  }
  return all.filter((s) => s.category === catKey);
}

export function formatCleanGameTitle(serviceId: string, rawName: string): string {
  const id = (serviceId || '').toLowerCase();
  const name = (rawName || '').toLowerCase();

  if (id.includes('mobile_legends') || name.includes('mobile legends')) {
    return '💎 ✤ Mobile Legends •';
  }
  if (id.includes('pubg') || name.includes('pubg')) {
    return '🌕 ✤ PUBG Mobile •';
  }
  if (id.includes('free_fire') || id.includes('freefire') || name.includes('free fire')) {
    return '💎 ✤ Free Fire •';
  }
  if (id.includes('call_of_duty') || id.includes('cod') || name.includes('call of duty')) {
    return '✤ Call of Duty 🔫•';
  }
  if (id.includes('honor_of_kings') || id.includes('hok') || name.includes('honor of kings')) {
    return '✤ Honor of Kings 💠•';
  }
  if (id.includes('blood_strike') || name.includes('blood strike')) {
    return '🌕 ✤ Blood Strike •';
  }
  if (id.includes('arena_breakout') || name.includes('arena breakout')) {
    return '✤ Arena Breakout 🗃•';
  }
  if (id.includes('delta_force') || name.includes('delta force')) {
    return '🎯 ✤ Delta Force •';
  }
  if (id.includes('genshin') || name.includes('genshin')) {
    return '✨ ✤ Genshin Impact •';
  }
  if (id.includes('whiteout') || name.includes('whiteout')) {
    return '❄️ ✤ Whiteout Survival •';
  }
  if (id.includes('efootball') || name.includes('efootball')) {
    return '⚽ ✤ eFootball •';
  }
  if (id.includes('ball_pool') || name.includes('8 ball pool')) {
    return '🎱 ✤ 8 Ball Pool •';
  }
  if (id.includes('yalla_ludo') || name.includes('yalla ludo')) {
    return '🎲 ✤ Yalla Ludo •';
  }
  if (id.includes('jawaker') || name.includes('jawaker')) {
    return '🃏 ✤ Jawaker •';
  }
  if (id.includes('clash_of_clans') || name.includes('clash of clans')) {
    return '⚔️ ✤ Clash of Clans •';
  }
  if (id.includes('brawl_stars') || name.includes('brawl stars')) {
    return '⭐ ✤ Brawl Stars •';
  }
  if (id.includes('roblox') || name.includes('roblox')) {
    return '🟥 ✤ Roblox •';
  }

  const clean = rawName
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/شحن فوري ومباشر|شحن فوري|عن طريق الايدي|برقم الايدي|\(شەن\)|\(شەدەن\)/gi, '')
    .trim();
  return `🎮 ✤ ${clean || rawName} •`;
}

export function formatCleanGameBaseName(serviceId: string, rawName: string): string {
  const id = (serviceId || '').toLowerCase();
  const name = (rawName || '').toLowerCase();
  if (id.includes('mobile_legends') || name.includes('mobile legends')) return 'Mobile Legends';
  if (id.includes('pubg') || name.includes('pubg')) return 'PUBG Mobile';
  if (id.includes('free_fire') || name.includes('free fire')) return 'Free Fire';
  if (id.includes('call_of_duty') || name.includes('call of duty')) return 'Call of Duty';
  if (id.includes('honor_of_kings') || name.includes('honor of kings')) return 'Honor of Kings';
  if (id.includes('blood_strike') || name.includes('blood strike')) return 'Blood Strike';
  if (id.includes('arena_breakout') || name.includes('arena breakout')) return 'Arena Breakout';
  if (id.includes('delta_force') || name.includes('delta force')) return 'Delta Force';
  if (id.includes('genshin') || name.includes('genshin')) return 'Genshin Impact';
  if (id.includes('whiteout') || name.includes('whiteout')) return 'Whiteout Survival';
  if (id.includes('efootball') || name.includes('efootball')) return 'eFootball';
  if (id.includes('ball_pool') || name.includes('8 ball pool')) return '8 Ball Pool';
  return rawName.split('(')[0].trim() || rawName;
}

export function cleanPackageLabel(rawTitle: string, serviceId = '', serviceName = ''): string {
  let title = (rawTitle || '')
    .replace(/\(شەن\)/g, '')
    .replace(/\(شەدەن\)/g, '')
    .trim();

  // Strip bonus/parentheses details if it just repeats numbers or says bonus
  title = title.replace(/\s*\(\s*\d+\s*\+\s*\d+\s*(?:Bonus|بونۇس|مكافأة)?\s*\)/gi, '');

  // Clean boilerplate
  const noisePhrases = [
    /شحن فوري ومباشر/gi,
    /شحن مباشر وفوري/gi,
    /شحن فوري/gi,
    /شحن مباشر/gi,
    /عن طريق الايدي/gi,
    /عبر الايدي/gi,
    /برقم الايدي/gi,
    /بالايدي/gi,
    /حساب رسمي/gi,
    /تسليم فوري/gi,
    /كود رقمي/gi,
    /بدون كود/gi,
    /ضمان كامل/gi,
    /لا يوجد استرجاع/gi,
    /No Refund/gi,
    /Instant/gi,
    /Direct Top-up/gi,
    /تېز قاچىلاش/gi,
    /نەق قاچىلاش/gi,
  ];
  for (const regex of noisePhrases) {
    title = title.replace(regex, ' ');
  }

  // Clean game names
  const strippedNames = [
    /Mobile Legends:?\s*Bang Bang/gi,
    /Mobile Legends/gi,
    /PUBG Mobile/gi,
    /Free Fire/gi,
    /Call of Duty:?\s*Mobile/gi,
    /Honor of Kings/gi,
    /Blood Strike/gi,
    /Arena Breakout/gi,
  ];
  for (const sn of strippedNames) {
    title = title.replace(sn, ' ');
  }

  const isMLBB = serviceId.includes('mobile_legends') || serviceName.toLowerCase().includes('mobile legends');
  const isPUBG = serviceId.includes('pubg') || serviceName.toLowerCase().includes('pubg');
  const isFF = serviceId.includes('free_fire') || serviceName.toLowerCase().includes('free fire');
  const isCOD = serviceId.includes('call_of_duty') || serviceName.toLowerCase().includes('call of duty');
  const isHOK = serviceId.includes('honor_of_kings') || serviceName.toLowerCase().includes('honor of kings');

  // Clean passes & memberships cleanly
  if (/Weekly.*Pass|ھەپتىلىك.*(?:كارت|پاس)/i.test(title)) {
    title = title.includes('TR') || title.includes('تۈركىيە') ? '🛍 Weekly Pass (TR)' : '🛍 Weekly Pass';
  } else if (/Weekly.*(?:Elite|ئېلىت)/i.test(title)) {
    title = title.includes('TR') || title.includes('تۈركىيە') ? '🛍 Weekly Elite (TR)' : '🛍 Weekly Elite Pack';
  } else if (/Monthly.*(?:Elite|ئايلىق\s*ئېلىت)/i.test(title)) {
    title = title.includes('TR') || title.includes('تۈركىيە') ? '🛍 Monthly Elite (TR)' : '🛍 Monthly Elite Pack';
  } else if (/Twilight\s*Pass|تۋايلايت/i.test(title)) {
    title = title.includes('TR') || title.includes('تۈركىيە') ? '🛍 Twilight Pass (TR)' : '🛍 Twilight Pass';
  } else if (/Booyah\s*Pass|بۇياھ/i.test(title)) {
    title = '🛍 Booyah Pass';
  } else if (/Weekly\s*Deal|ئالاھىدە\s*تەمىنات/i.test(title)) {
    title = '🛍 Weekly Deals';
  } else if (/Legendary\s*Emblem|نىشان\s*بەلگىسى/i.test(title)) {
    title = '🛍 Legendary Emblem';
  } else if (/Weekly\s*Membership/i.test(title)) {
    title = '🛍 Weekly Membership';
  } else if (/Monthly\s*Membership/i.test(title)) {
    title = '🛍 Monthly Membership';
  } else if (/Limited-?Time|ۋاقىتلىق\s*ئالاھىدە/i.test(title)) {
    title = '🛍 Special Value Pack';
  } else if (/First\s*Purchase|تۇنجى.*سېتىۋېلىش/i.test(title)) {
    title = '🛍 First Purchase Pack';
  } else if (/Prime.*1\s*Month|Prime.*ئايلىق/i.test(title)) {
    title = '🛍 Prime (1 Month)';
  } else if (/Royale\s*Pass\s*Plus|رويال\s*باس\s*بلس/i.test(title)) {
    title = '🛍 Royale Pass Plus';
  } else if (/Royale\s*Pass|رويال\s*باس/i.test(title)) {
    title = '🛍 Royale Pass';
  } else if (/Battle\s*Pass|باتل\s*باس/i.test(title)) {
    title = '🛍 Battle Pass';
  } else {
    // Normal numeric / diamond packages
    const isTR = /TR|تۈركىيە/i.test(title);
    title = title.replace(/(?:TR|تۈركىيە)/gi, '').trim();

    const numMatch = title.match(/\b\d+(?:\s*\+\s*\d+)?\b/);
    if ((isMLBB || isFF) && numMatch) {
      title = `💎 ${numMatch[0]}`;
    } else if (isPUBG && numMatch) {
      title = `${numMatch[0]} UC`;
    } else if (isCOD && numMatch) {
      title = `${numMatch[0]} CP`;
    } else if (isHOK && numMatch) {
      title = `💠 ${numMatch[0]}`;
    } else {
      title = title.replace(/(?:ئالماس|جوهرة|جوهره|ماس|ماسة|ماسات|الماسة|diamonds?)/gi, '💎');
      title = title.replace(/(?:💎\s*)+/g, '💎');
      title = title.replace(/(?:شدة|شدات|شدة\s*uc|uc)/gi, 'UC');
      title = title.replace(/(?:كوينز|كوين|coins?)/gi, '🪙');
      title = title.replace(/(?:قسيمة|قسائم|coupons?)/gi, '🎟️');
      title = title.replace(/(?:ليرة\s*تركي|ليرة\s*تورك|ليرة\s*سورية|ليرة)/gi, 'TL');
      title = title.replace(/\(\s*\)/g, '').replace(/[()[\]{}«»]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }

    if (isTR) {
      title = `${title} (TR)`;
    }
  }

  // Remove leading/trailing punctuation
  title = title.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();
  return title || rawTitle;
}

export function getCategoryProductsKeyboard(catKey: string, page = 0, lang: BotLanguage = 'ug') {
  const services = getServicesForCategory(catKey);
  const isGames = catKey === 'games';
  const pageSize = isGames ? 8 : 10;
  const totalPages = Math.ceil(services.length / pageSize) || 1;
  const currentPage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = services.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const inline_keyboard: any[][] = [];

  if (isGames) {
    // 1 button per line for game products
    for (const item of slice) {
      const btnTitle = formatCleanGameTitle(item.id, item.name);
      inline_keyboard.push([
        {
          text: btnTitle,
          callback_data: `tgserv:${item.id}`,
        },
      ]);
    }
  } else {
    // 2 buttons per line for other categories
    for (let i = 0; i < slice.length; i += 2) {
      const row: any[] = [];
      const item1 = slice[i];
      const icon1 = item1.badge ? item1.badge.split(' ')[0] : '⚡';
      const rawName1 = item1.name;
      const translatedName1 = lang === 'ug' ? rawName1 : smartTranslateTitle(rawName1, lang as any);
      const shortName1 = translatedName1.length > 20 ? `${translatedName1.slice(0, 19)}…` : translatedName1;

      row.push({
        text: `${icon1} ${shortName1}`,
        callback_data: `tgserv:${item1.id}`,
      });
      if (i + 1 < slice.length) {
        const item2 = slice[i + 1];
        const icon2 = item2.badge ? item2.badge.split(' ')[0] : '⚡';
        const rawName2 = item2.name;
        const translatedName2 = lang === 'ug' ? rawName2 : smartTranslateTitle(rawName2, lang as any);
        const shortName2 = translatedName2.length > 20 ? `${translatedName2.slice(0, 19)}…` : translatedName2;

        row.push({
          text: `${icon2} ${shortName2}`,
          callback_data: `tgserv:${item2.id}`,
        });
      }
      inline_keyboard.push(row);
    }
  }

  if (totalPages > 1) {
    const navRow: any[] = [];
    if (currentPage > 0) {
      navRow.push({
        text: BOT_I18N.categories.prevPage[lang] || '⬅️ ئالدىنقى',
        callback_data: `tgcat:${catKey}:${currentPage - 1}`,
      });
    }
    navRow.push({
      text: `📄 ${currentPage + 1}/${totalPages}`,
      callback_data: `tgcat:${catKey}:${currentPage}`,
    });
    if (currentPage < totalPages - 1) {
      navRow.push({
        text: BOT_I18N.categories.nextPage[lang] || 'كېيىنكى ➡️',
        callback_data: `tgcat:${catKey}:${currentPage + 1}`,
      });
    }
    inline_keyboard.push(navRow);
  }

  inline_keyboard.push([
    {
      text: '👈 قايتىش',
      callback_data: 'tg_shop_categories',
    },
  ]);

  return { inline_keyboard };
}

export function getServicePackagesKeyboard(
  service: ServiceItem,
  activeSubCatId?: string,
  page = 0,
  lang: BotLanguage = 'ug'
) {
  const inline_keyboard: any[][] = [];

  if (service.subCategories && service.subCategories.length > 1) {
    const subRows: any[] = [];
    const effectiveSub = activeSubCatId || service.subCategories[0].id;
    for (const sc of service.subCategories) {
      const isSelected = sc.id === effectiveSub;
      const subLabel = lang === 'ug' ? sc.label : smartTranslateTitle(sc.label, lang as any);
      subRows.push({
        text: `${isSelected ? '🔘 ' : '⚪ '}${subLabel}`,
        callback_data: `tgserv:${service.id}:${sc.id}:0`,
      });
    }
    for (const btn of subRows) {
      inline_keyboard.push([btn]);
    }
  }

  const effectiveSubId = activeSubCatId || service.subCategories?.[0]?.id;
  const packages = service.packages.filter((p) => {
    if (service.subCategories && service.subCategories.length > 1 && effectiveSubId) {
      return p.subCategoryId === effectiveSubId;
    }
    return true;
  });

  const pageSize = 16;
  const totalPages = Math.ceil(packages.length / pageSize) || 1;
  const currentPage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = packages.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const rowPairs: any[][] = [];
  let currentRow: any[] = [];

  for (const pkg of slice) {
    const cleanLabel = cleanPackageLabel(pkg.title || '', service.id, service.name);
    const priceStr = Number(pkg.price).toFixed(2);
    const btnText = `${cleanLabel} — ${priceStr}$`;
    const btn = {
      text: btnText,
      callback_data: `tgpkg:${service.id}:${pkg.id}`,
    };

    // If text is long (> 22 chars), give it its own full row
    if (btnText.length > 22) {
      if (currentRow.length > 0) {
        rowPairs.push(currentRow);
        currentRow = [];
      }
      rowPairs.push([btn]);
    } else {
      currentRow.push(btn);
      if (currentRow.length === 2) {
        rowPairs.push(currentRow);
        currentRow = [];
      }
    }
  }
  if (currentRow.length > 0) {
    rowPairs.push(currentRow);
  }

  for (const r of rowPairs) {
    inline_keyboard.push(r);
  }

  if (totalPages > 1) {
    const navRow: any[] = [];
    const subParam = effectiveSubId || 'all';
    if (currentPage > 0) {
      navRow.push({
        text: BOT_I18N.categories.prevPage[lang] || '⬅️ ئالدىنقى',
        callback_data: `tgserv:${service.id}:${subParam}:${currentPage - 1}`,
      });
    }
    navRow.push({
      text: `📄 ${currentPage + 1}/${totalPages}`,
      callback_data: `tgserv:${service.id}:${subParam}:${currentPage}`,
    });
    if (currentPage < totalPages - 1) {
      navRow.push({
        text: BOT_I18N.categories.nextPage[lang] || 'كېيىنكى ➡️',
        callback_data: `tgserv:${service.id}:${subParam}:${currentPage + 1}`,
      });
    }
    inline_keyboard.push(navRow);
  }

  const backTarget = service.id === 'othman_visa_cards' ? 'tg_shop_categories' : `tgcat:${service.category || 'games'}`;
  inline_keyboard.push([
    { text: '👈 قايتىش', callback_data: backTarget },
  ]);

  return { inline_keyboard };
}

export async function handleShopCallbackQuery(
  cq: any,
  chatId: number | string | undefined,
  messageId: number | undefined,
  cqId: string,
  fromId: number,
  fromUser: string,
  data: string,
  showOrEditMessage: (chatId: any, messageId: any, text: string, replyMarkup?: any) => Promise<any>,
  answerCallbackQuery: (callbackQueryId: string, text?: string, showAlert?: boolean) => Promise<any>
): Promise<boolean> {
  const lang: BotLanguage = getUserLanguage(fromId) || 'ug';

  // 1. Categories Menu
  if (data === 'tg_shop_categories' || data === 'quick_catalog') {
    await answerCallbackQuery(cqId);
    const banner = BOT_I18N.shopBanner[lang] || BOT_I18N.shopBanner.ug;
    await showOrEditMessage(chatId, messageId, banner, getShopCategoriesKeyboard(lang));
    return true;
  }

  // 2. Category Products View
  if (data.startsWith('tgcat:')) {
    await answerCallbackQuery(cqId);
    const parts = data.split(':');
    const catKey = parts[1];
    const page = parts[2] ? parseInt(parts[2], 10) || 0 : 0;
    const catTitle = getCategoryDisplayTitle(catKey, lang);
    const services = getServicesForCategory(catKey);

    const choosePrompt =
      lang === 'ar' ? 'الرجاء اختيار المنتج المطلوب:' :
      lang === 'tr' ? 'Lütfen istediğiniz ürünü seçin:' :
      lang === 'en' ? 'Please select a product:' :
      lang === 'uz' ? 'Kerakli mahsulotni tanlang:' :
      lang === 'ru' ? 'Выберите нужный товар:' :
      'كېرەكلىك مەھسۇلاتنى تاللاڭ:';

    const countPrompt =
      lang === 'ar' ? `(إجمالي المنتجات: ${services.length})` :
      lang === 'tr' ? `(Toplam: ${services.length} hizmet)` :
      lang === 'en' ? `(Total: ${services.length} services)` :
      lang === 'uz' ? `(Jami: ${services.length} ta xizmat)` :
      lang === 'ru' ? `(Всего: ${services.length} услуг)` :
      `(جەمئىي: ${services.length} تال مۇلازىمەت بار)`;

    const isEmpty = services.length === 0;
    const emptyNotice =
      lang === 'ar' ? '💡 هذا القسم فارغ حالياً، سيتم إضافة باقات شبكات الإنترنت قريباً...' :
      lang === 'tr' ? '💡 Bu kategori şu anda boş, yakında yeni Wi-Fi ürünleri eklenecektir...' :
      lang === 'en' ? '💡 This section is currently empty, new Wi-Fi packages will be added soon...' :
      lang === 'uz' ? '💡 Bu boʻlim hozircha boʻsh, yaqinda yangi Wi-Fi xizmatlari qoʻshiladi...' :
      lang === 'ru' ? '💡 Этот раздел пока пуст, скоро будут добавлены услуги Wi-Fi...' :
      '💡 بۇ بۆلۈم ھازىرچە بوش، پات يېقىندا يېڭى Wi-Fi تور كارتىلىرى قوشۇلىدۇ...';

    let catText = '';
    if (catKey === 'games' && (lang === 'ug' || !lang)) {
      catText = [
        '» » ༒•|-- ( <b>ئويۇن مەھسۇلاتلىرى</b> ) --|•༒ « «',
        '',
        '📌 <b>سېتىۋالماقچى بولغان ئويۇننى تاللاڭ:</b>',
        '___________________',
      ].join('\n');
    } else {
      catText = `
╭━━━ 🌟 <b>${catTitle}</b> ━━━╮

${isEmpty ? emptyNotice : `📌 <b>${choosePrompt}</b>\n<i>${countPrompt}</i>`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
    }
    await showOrEditMessage(chatId, messageId, catText, getCategoryProductsKeyboard(catKey, page, lang));
    return true;
  }

  // 3. Service View & Subcategories / Packages
  if (data.startsWith('tgserv:')) {
    await answerCallbackQuery(cqId);
    const parts = data.split(':');
    const serviceId = parts[1];
    let subCatId = parts[2] || undefined;
    if (subCatId === 'all') subCatId = undefined;
    const page = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
    const service = getServicesList().find((s) => s.id === serviceId);
    if (!service) {
      const notFoundAlert = lang === 'ar' ? '❌ المنتج غير موجود' :
                            lang === 'tr' ? '❌ Ürün bulunamadı' :
                            lang === 'en' ? '❌ Product not found' :
                            lang === 'uz' ? '❌ Mahsulot topilmadi' :
                            lang === 'ru' ? '❌ Товар не найден' :
                            '❌ مەھسۇلات تېپىلمىدى';
      await answerCallbackQuery(cqId, notFoundAlert, true);
      return true;
    }

    const user = await getOrCreateTelegramUser(fromId, fromUser, cq.from?.first_name);
    const balanceStr = Number(user.balance || 0).toFixed(2);

    const hasSubs = service.subCategories && service.subCategories.length > 1;
    const activeSub = hasSubs
      ? service.subCategories?.find((sc) => sc.id === subCatId) || service.subCategories?.[0]
      : null;
    const subLabel = activeSub ? (lang === 'ug' ? activeSub.label : smartTranslateTitle(activeSub.label, lang as any)) : '';
    const effectiveSubTitle = subLabel ? ` - ${subLabel}` : '';
    const serviceName = lang === 'ug' ? service.name : smartTranslateTitle(service.name, lang as any);

    const isGame = service.category === 'games' || service.id.includes('othman_');
    const cleanGameName = formatCleanGameBaseName(service.id, service.name);
    const currencyWord = service.id.includes('pubg') ? 'UC' : service.id.includes('call_of_duty') ? 'CP' : '💎';

    const selectPrompt = BOT_I18N.order.selectPackagePrompt[lang] || BOT_I18N.order.selectPackagePrompt.ug;

    let servText = '';
    if (isGame && (lang === 'ug' || !lang)) {
      servText = [
        `🎮 <b>${cleanGameName} — قاچىلاش 💎 ${currencyWord}</b>`,
        subLabel ? `📁 <i>${subLabel}</i>` : '',
        `💳 <b>قالدۇقىڭىز:</b> $${balanceStr}`,
        '',
        `⚠️ <i>سېرۋېر (Zone) ياكى رايوننى خاتا كىرگۈزسىڭىز، مەھسۇلات ھېساباتىڭىزغا بارماسلىقى مۇمكىن ۋە بۇ خىل خاتالىقتا پۇل قايتۇرۇلمايدۇ. زاكاس بېرىشتىن بۇرۇن ئويۇنچى نامىنى جەزملەڭ.</i>`,
        '',
        `📌 <b>پاكېت تاللاڭ:</b>`,
      ].filter(Boolean).join('\n');
    } else {
      servText = `
╭━━━ 💎 <b>${serviceName}${effectiveSubTitle}</b> ━━━╮
💳 <b>${BOT_I18N.account.balance[lang] || 'قالدۇقىڭىز'}:</b> $${balanceStr}

${selectPrompt}
${service.description ? `<i>${service.description}</i>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
    }

    await showOrEditMessage(chatId, messageId, servText, getServicePackagesKeyboard(service, subCatId, page, lang));
    return true;
  }

  // 4. Package Selected -> Prompt for Account / Player ID
  if (data.startsWith('tgpkg:')) {
    await answerCallbackQuery(cqId);
    const parts = data.split(':');
    const serviceId = parts[1];
    const pkgId = parts[2];
    const service = getServicesList().find((s) => s.id === serviceId);
    const pkg = service?.packages.find((p) => p.id === pkgId);
    if (!service || !pkg) {
      await answerCallbackQuery(cqId, '❌ Package not found', true);
      return true;
    }

    const user = await getOrCreateTelegramUser(fromId, fromUser, cq.from?.first_name);
    const requiresZone = Boolean(
      service.requiresZoneId ||
        service.subCategories?.find((sc) => sc.id === pkg.subCategoryId)?.requiresZoneId ||
        pkg.fields?.some((f) => f.key?.toLowerCase().includes('zone'))
    );

    const cleanPkgTitle = cleanPackageLabel(pkg.title || '', service.id, service.name);
    const sName = formatCleanGameBaseName(service.id, service.name);
    const pTitle = cleanPkgTitle;

    const isWifi =
      service.category === 'wifi' ||
      service.id === 'fursan_net' ||
      service.id === 'azez_net' ||
      service.id === 'almujahid_net' ||
      (service.name || '').toLowerCase().includes('wifi') ||
      (service.name || '').toLowerCase().includes('واي فاي');

    if (isWifi) {
      botOrderSessions.set(fromId, {
        step: 'ready_to_confirm',
        serviceId: service.id,
        serviceName: service.name,
        pkgId: pkg.id,
        pkgTitle: cleanPkgTitle,
        price: Number(pkg.price),
        targetAccount: 'Wi-Fi كارتىسى',
        requiresZoneId: false,
        timestamp: Date.now(),
      });
      if (chatId) botOrderSessions.set(chatId, botOrderSessions.get(fromId)!);

      const confirmPrompt = `
╭━━━ ⚡️ <b>Wi-Fi كارتىسىنى سېتىۋېلىش</b> ━━━╮

📶 <b>تور نامى:</b> ${sName}
📦 <b>كارتىنىڭ بولىقى:</b> <b>${pTitle}</b>
💰 <b>كارتىنىڭ باھاسى:</b> <b>$${Number(pkg.price).toFixed(2)} USD</b>
💳 <b>قالدۇقىڭىز:</b> <b>$${Number(user.balance || 0).toFixed(2)} USD</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 <b>ئەسكەرتىش:</b> «سېتىۋېلىش» نى باسسىڭىز، مەركىزى ئامباردىن بىر كارتا تۇتۇلۇپ، 👤 اسم المستخدم (Username) ۋە 🔑 كلمة المرور (Password) دەرھال چىقىپ بېرىدۇ.
`.trim();

      await showOrEditMessage(chatId, messageId, confirmPrompt, {
        inline_keyboard: [
          [{ text: '✅ كارتىنى سېتىۋېلىش ⚡️', callback_data: 'tg_confirm_buy' }],
          [{ text: '❌ بىكار قىلىش ↩️', callback_data: `tgserv:${service.id}` }],
        ],
      });
      return true;
    }

    botOrderSessions.set(fromId, {
      step: 'awaiting_target_account',
      serviceId: service.id,
      serviceName: service.name,
      pkgId: pkg.id,
      pkgTitle: cleanPkgTitle,
      price: Number(pkg.price),
      providerProductId: pkg.providerProductId,
      providerQty: (pkg as any).providerQty,
      requiresZoneId: requiresZone,
      timestamp: Date.now(),
    });
    if (chatId) botOrderSessions.set(chatId, botOrderSessions.get(fromId)!);

    const header = lang === 'ar' ? 'إدخال بيانات الطلب' :
                   lang === 'tr' ? 'Sipariş Bilgilerini Girin' :
                   lang === 'en' ? 'Enter Order Details' :
                   lang === 'uz' ? 'Buyurtma maʼlumotlarini kiriting' :
                   lang === 'ru' ? 'Ввод данных заказа' :
                   'زاكاز ئۇچۇرى كىرگۈزۈش';

    const inputMsg = BOT_I18N.order.inputPrompt[lang] || BOT_I18N.order.inputPrompt.ug;

    const promptText = `
╭━━━ ✍️ <b>${header}</b> ━━━╮

${BOT_I18N.order.productLabel[lang] || '🛍️ مەھسۇلات:'} ${sName}
${BOT_I18N.order.packageLabel[lang] || '📦 بولاق:'} <b>${pTitle}</b>
${BOT_I18N.order.priceLabel[lang] || '💰 باھاسى:'} <b>$${Number(pkg.price).toFixed(2)} USD</b>
${BOT_I18N.order.yourBalanceLabel[lang] || '💳 قالدۇقىڭىز:'} <b>$${Number(user.balance || 0).toFixed(2)} USD</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${inputMsg}
${service.inputPlaceholder ? `<i>(${service.inputPlaceholder})</i>` : ''}
`.trim();

    await showOrEditMessage(chatId, messageId, promptText, {
      inline_keyboard: [
        [{ text: BOT_I18N.order.cancelPurchase[lang] || '❌ بىكار قىلىش ↩️', callback_data: `tgserv:${service.id}` }],
      ],
    });
    return true;
  }

  // 5. Confirm Buy Execution
  if (data === 'tg_confirm_buy') {
    const session = botOrderSessions.get(fromId) || (chatId ? botOrderSessions.get(chatId) : null);
    if (!session) {
      const expiredAlert = lang === 'ar' ? '⚠️ انتهت صلاحية الجلسة، الرجاء الاختيار مجدداً.' :
                           lang === 'tr' ? '⚠️ Oturum süresi doldu, lütfen tekrar seçin.' :
                           lang === 'en' ? '⚠️ Session expired, please try again.' :
                           lang === 'uz' ? '⚠️ Sessiya muddati tugadi, qaytadan tanlang.' :
                           lang === 'ru' ? '⚠️ Время сессии истекло, выберите заново.' :
                           '⚠️ زاكاز ۋاقتى ئۆتۈپ كەتتى، قايتا تاللاڭ.';
      await answerCallbackQuery(cqId, expiredAlert, true);
      return true;
    }
    await answerCallbackQuery(cqId, '⏳ Processing order...');

    const user = await getOrCreateTelegramUser(fromId, fromUser, cq.from?.first_name);
    const balance = Number(user.balance || 0);

    if (balance < session.price) {
      const insufficientHeader = lang === 'ar' ? '⚠️ رصيدك الحالي غير كافٍ!' :
                                 lang === 'tr' ? '⚠️ Bakiyeniz Yetersiz!' :
                                 lang === 'en' ? '⚠️ Insufficient Balance!' :
                                 lang === 'uz' ? '⚠️ Balansingiz yetarli emas!' :
                                 lang === 'ru' ? '⚠️ Недостаточно средств на балансе!' :
                                 '⚠️ كەچۈرۈڭ، ھەميان قالدۇقىڭىز يەتمىدى!';

      const orderPriceLabel = BOT_I18N.order.priceLabel[lang] || '💰 زاكاز باھاسى:';
      const balanceLabel = BOT_I18N.order.yourBalanceLabel[lang] || '💳 مەۋجۇت قالدۇقىڭىز:';
      const missingText = lang === 'ar' ? '⚠️ المبلغ المتبقي:' :
                          lang === 'tr' ? '⚠️ Eksik Tutar:' :
                          lang === 'en' ? '⚠️ Required Amount:' :
                          lang === 'uz' ? '⚠️ Yetishmayotgan summa:' :
                          lang === 'ru' ? '⚠️ Не хватает:' :
                          '⚠️ كەم قالغىنى:';

      const insufficientText = `
<b>${insufficientHeader}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderPriceLabel} $${session.price.toFixed(2)} USD
${balanceLabel} $${balance.toFixed(2)} USD
${missingText} $${(session.price - balance).toFixed(2)} USD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${BOT_I18N.order.insufficientBalanceAlert[lang]}
`.trim();
      await showOrEditMessage(chatId, messageId, insufficientText, {
        inline_keyboard: [
          [{ text: BOT_I18N.storeButtons.deposit[lang] || '💎💳 شامكەشتىن پۇل سېلىش ⚡️', callback_data: 'quick_deposit' }],
          [{ text: BOT_I18N.categories.backToCategories[lang] || '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️', callback_data: 'tg_shop_categories' }],
        ],
      });
      return true;
    }

    const orderId = randomId('ORD');
    const targetAccFull = `${session.targetAccount || ''}${session.zoneId ? ` (Zone: ${session.zoneId})` : ''}`.trim();

    // Wi-Fi Local Stock Check & Pre-Claim for Telegram
    const isWifiService =
      session.serviceId === 'fursan_net' ||
      session.serviceId === 'azez_net' ||
      session.serviceId === 'almujahid_net' ||
      (session.serviceName || '').toLowerCase().includes('wifi') ||
      (session.serviceName || '').toLowerCase().includes('واي فاي');

    let claimedWifiCard: any = null;
    if (isWifiService) {
      const { claimAvailableWifiCardAsync } = await import('./wifiInventoryDb');
      claimedWifiCard = await claimAvailableWifiCardAsync({
        serviceId: session.serviceId,
        packageId: session.pkgId,
        userId: user.id,
        userEmail: user.email,
        orderId,
      });

      if (!claimedWifiCard) {
        await showOrEditMessage(
          chatId,
          messageId,
          `⚠️ <b>كەچۈرۈڭ، بۇ Wi-Fi كارتىسىدىن ئامباردا قالمىدى (تۈگەپ كەتتى).</b>\n\nھېساباتىڭىزدىن پۇل تۇتۇلمىدى. باشقۇرغۇچى توربەتتىن يېڭى كارتا كىرگۈزگەندە دەرھال سېتىۋالالايسىز.`,
          {
            inline_keyboard: [[{ text: '🔙 دۇكانغا قايتىش ↩️', callback_data: 'tg_shop_categories' }]],
          }
        );
        return true;
      }
    }

    // Pre-flight Live Availability & Wholesale Cost Guard (Telegram Shop)
    if (session.providerProductId) {
      const isOthman = session.serviceId.includes('othman_') || String(session.providerProductId).length < 6;
      const activeProvider = isOthman ? othmanStoreProvider : syria4GameProvider;
      const providerConfig = await activeProvider.getResolvedConfig().catch(() => null);
      if (providerConfig && providerConfig.enabled && providerConfig.apiToken) {
        try {
          const liveCheck = await activeProvider.getProduct(session.providerProductId);
          if (liveCheck.success && liveCheck.product) {
            if (!liveCheck.product.available) {
              await showOrEditMessage(
                chatId,
                messageId,
                `⚠️ <b>بۇ مەھسۇلات تەمىنلىگۈچى تەرەپتە ۋاقىتلىق توختىتىلغان (غير متوفر)</b>\n\nھېساباتىڭىزدىن پۇل تۇتۇلمىدى. تەمىنلىگۈچى قايتا تولۇقلىغاندا سېتىۋالسىڭىز بولىدۇ.`,
                {
                  inline_keyboard: [[{ text: '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️', callback_data: 'tg_shop_categories' }]],
                }
              );
              return true;
            }

            const targetQty = session.providerQty ?? 1;
            const totalCost = liveCheck.product.costPrice * targetQty;
            if (totalCost > session.price) {
              await showOrEditMessage(
                chatId,
                messageId,
                `⚠️ <b>تەمىنلىگۈچىنىڭ تەننەرخ باھاسى ئۆزگەردى</b>\n\nھېساباتىڭىزدىن ھېچقانداق پۇل تۇتۇلمىدى. يېڭى باھا بويىچە دۇكاندىن قايتا زاكاز بېرىڭ.`,
                {
                  inline_keyboard: [[{ text: '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️', callback_data: 'tg_shop_categories' }]],
                }
              );
              return true;
            }
          }
        } catch (e: any) {
          console.warn('[Telegram PreCheck Notice]:', e?.message);
        }
      }
    }

    const atomicRes = await deductBalanceAndCreateOrderAtomicAsync({
      idempotencyKey: `TG-${Date.now()}-${fromId}`,
      userId: user.id,
      userEmail: user.email,
      serviceId: session.serviceId,
      serviceName: session.serviceName,
      packageTitle: session.pkgTitle,
      amount: session.price,
      targetAccount: isWifiService ? 'Wi-Fi كارتىسى' : (targetAccFull || 'Not provided'),
      orderId,
      details: isWifiService && claimedWifiCard ? {
        fromTelegram: true,
        telegramChatId: fromId,
        telegramUsername: fromUser,
        wifiCard: {
          network: session.serviceId === 'fursan_net' ? 'fursan' : (session.serviceId === 'azez_net' ? 'azez' : 'mujahid'),
          networkName: session.serviceId === 'fursan_net' ? 'شبكة الفرسان' : (session.serviceId === 'azez_net' ? 'شبكة عزيز نت' : 'شبكة المجاهد نت'),
          networkEn: session.serviceId === 'fursan_net' ? 'FURSAN NET' : (session.serviceId === 'azez_net' ? 'AZEZ . NET' : 'AL MUJAHID NET'),
          username: claimedWifiCard.username,
          password: claimedWifiCard.password,
          cardNumber: claimedWifiCard.cardNumber,
          packageTitle: session.pkgTitle,
          price: session.price,
          purchaseDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
          validity: '7 كۈن',
        }
      } : {
        fromTelegram: true,
        telegramChatId: fromId,
        telegramUsername: fromUser,
        gamePlayerId: session.targetAccount,
        gameZoneId: session.zoneId,
        providerProductId: session.providerProductId,
      },
    });

    if (!atomicRes.success) {
      if (isWifiService && claimedWifiCard) {
        // Unclaim card if balance deduction failed
        try {
          const { unclaimWifiCardAsync } = await import('./wifiInventoryDb');
          await unclaimWifiCardAsync(claimedWifiCard.id);
        } catch {}
      }
      await showOrEditMessage(chatId, messageId, `❌ Order failed: ${atomicRes.message}`, {
        inline_keyboard: [[{ text: BOT_I18N.categories.backToCategories[lang] || '🔙 Back', callback_data: 'tg_shop_categories' }]],
      });
      return true;
    }

    const order = atomicRes.order || ({ id: orderId, amount: session.price, status: isWifiService ? 'completed' : 'processing' } as any);

    if (isWifiService && claimedWifiCard) {
      await transitionOrderAsync(order.id, ['processing', 'pending'], 'completed', {
        adminNotes: `Wi-Fi Card Fulfilled via Telegram: ${claimedWifiCard.cardNumber}`,
      }).catch(() => {});
      order.status = 'completed';
    }

    if (session.providerProductId && order?.id) {
      try {
        const isOthman = session.serviceId.includes('othman_') || String(session.providerProductId).length < 6;
        const activeProvider = isOthman ? othmanStoreProvider : syria4GameProvider;
        const providerConfig = await activeProvider.getResolvedConfig();
        if (providerConfig.enabled && providerConfig.apiToken) {
          const targetQty = session.providerQty ?? 1;
          const providerRes = await activeProvider.createOrder({
            productId: session.providerProductId,
            orderUuid: generateUUIDv4(),
            qty: targetQty,
            params: {
              playerId: session.targetAccount || '',
              phone: session.targetAccount || '',
              'ادخل رقم الهاتف بدون النداء': session.targetAccount || '',
              'الرابط': session.targetAccount || '',
              link: session.targetAccount || '',
              url: session.targetAccount || '',
              ...(session.zoneId ? { zoneId: session.zoneId } : {}),
            },
            orderId: order.id,
          });
          if (
            providerRes.outcome === 'accepted' ||
            providerRes.status === 'COMPLETED' ||
            providerRes.status === 'PENDING'
          ) {
            await transitionOrderAsync(
              order.id,
              ['processing', 'pending'],
              providerRes.status === 'COMPLETED' ? 'completed' : 'pending_provider',
              {
                providerOrderId: providerRes.providerOrderId,
                providerOutcome: providerRes.outcome,
              }
            );
            order.status = providerRes.status === 'COMPLETED' ? 'completed' : 'pending_provider';
          } else if (providerRes.outcome === 'rejected' || providerRes.status === 'FAILED') {
            const { refundOrderBalanceAtomicAsync } = await import('./db');
            await refundOrderBalanceAtomicAsync(
              order.id,
              providerRes.message || 'تەمىنلىگۈچى مەھسۇلاتنى توختاتتى ياكى زاكاز رەت قىلىندى'
            ).catch(() => {});
            order.status = 'refunded';
            await showOrEditMessage(
              chatId,
              messageId,
              `⚠️ <b>تەمىنلىگۈچىدە مەھسۇلات توختىتىلغانلىقى سەۋەبلىك زاكاز رەت قىلىندى</b>\n\n✅ <b>${session.price.toFixed(2)} USD</b> سومما دەرھال ھېساباتىڭىزغا تولۇق قايتۇرۇلدى!`,
              {
                inline_keyboard: [[{ text: '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️', callback_data: 'tg_shop_categories' }]],
              }
            );
            return true;
          }
        }
      } catch (provErr: any) {
        console.warn('[Telegram Purchase] Provider notice:', provErr?.message);
      }
    }

    notifyNewOrder({
      id: order.id,
      serviceName: session.serviceName,
      packageTitle: session.pkgTitle,
      amount: session.price,
      userName: user.name,
      userEmail: user.email,
      targetAccount: targetAccFull,
      status: order.status || 'processing',
    }).catch(() => {});

    botOrderSessions.delete(fromId);
    if (chatId) botOrderSessions.delete(chatId);

    const succTitle = BOT_I18N.order.orderSuccessTitle[lang];
    const orderIdTxt = BOT_I18N.order.orderIdLabel[lang];
    const statusTxt = BOT_I18N.order.orderStatusLabel[lang];
    const tipTxt = BOT_I18N.order.orderSuccessTip[lang];

    const sName = (lang === 'ug' ? session.serviceName : smartTranslateTitle(session.serviceName, lang as any))
      .replace(/پابجى شەن ۋە ئەزالىق/g, 'پابجى قاچىلاش ۋە ئەزالىق')
      .replace(/⚡ نەق شەن & ئەزالىق/g, '⚡ تېز قاچىلاش & ئەزالىق');
    const pTitle = (lang === 'ug' ? session.pkgTitle : smartTranslateTitle(session.pkgTitle, lang as any))
      .replace(/\(شەن\)/g, '')
      .replace(/\(شەدەن\)/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (isWifiService && claimedWifiCard) {
      const netName =
        session.serviceId === 'fursan_net'
          ? 'شبكة الفرسان (Fursan Net)'
          : session.serviceId === 'azez_net'
          ? 'شبكة عزيز نت (Azez Net)'
          : 'شبكة المجاهد نت (Al Mujahid Net)';

      const wifiSuccessReceipt = `
╭━━━ 🎉 <b>كارتىڭىز تەييار بولدى!</b> ━━━╮

📶 <b>تور نامى:</b> ${netName}
📦 <b>كارتىنىڭ بولىقى:</b> <b>${pTitle}</b>
💰 <b>كارتىنىڭ باھاسى:</b> <b>$${session.price.toFixed(2)} USD</b>
💳 <b>يېڭى قالدۇقىڭىز:</b> <b>$${Number(atomicRes.newBalance ?? 0).toFixed(2)} USD</b>
🔢 <b>كارتا نومۇرى:</b> <code>${claimedWifiCard.cardNumber}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>اسم المستخدم (Username):</b>
<code>${claimedWifiCard.username}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>

🔑 <b>كلمة المرور (Password):</b>
<code>${claimedWifiCard.password}</code> <i>(نۇسخىلاش ئۈچۈن بىر چېكىڭ 👆)</i>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>مۇددىتى:</b> 7 كۈن
💡 <i>بۇ كارتىنىڭ نومۇرى پەقەت سىزگىلا بېرىلدى ۋە ھېساباتىڭىزدا مەڭگۈلۈك ساقلىنىدۇ.</i>
`.trim();

      await showOrEditMessage(chatId, messageId, wifiSuccessReceipt, {
        inline_keyboard: [
          [{ text: BOT_I18N.storeButtons.shopCategories[lang] || '🛍️ يەنە مال سېتىۋېلىش ➔', callback_data: 'tg_shop_categories' }],
          [{ text: BOT_I18N.categories.backToMain[lang] || '🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
        ],
      });
      return true;
    }

    const successReceipt = `
${succTitle}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderIdTxt} <code>${order.id}</code>
${BOT_I18N.order.productLabel[lang]} ${sName}
${BOT_I18N.order.packageLabel[lang]} ${pTitle}
${BOT_I18N.order.targetAccountLabel[lang]} <code>${targetAccFull}</code>
${BOT_I18N.order.priceLabel[lang]} <b>$${session.price.toFixed(2)} USD</b>
${BOT_I18N.order.yourBalanceLabel[lang]} <b>$${Number(atomicRes.newBalance ?? 0).toFixed(2)} USD</b>
${statusTxt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ <i>${tipTxt}</i>
`.trim();

    await showOrEditMessage(chatId, messageId, successReceipt, {
      inline_keyboard: [
        [{ text: BOT_I18N.storeButtons.trackOrders[lang] || '🔍 زاكاز ھالىتىنى تەكشۈرۈش 📦', callback_data: `recheck_ord:${order.id}` }],
        [{ text: BOT_I18N.storeButtons.shopCategories[lang] || '🛍️ يەنە مال سېتىۋېلىش ➔', callback_data: 'tg_shop_categories' }],
        [{ text: BOT_I18N.categories.backToMain[lang] || '🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
      ],
    });
    return true;
  }

  // 6. Cancel Order Session
  if (data === 'tg_cancel_order') {
    botOrderSessions.delete(fromId);
    if (chatId) botOrderSessions.delete(chatId);
    await answerCallbackQuery(cqId, 'Cancelled');
    const banner = BOT_I18N.shopBanner[lang] || BOT_I18N.shopBanner.ug;
    await showOrEditMessage(chatId, messageId, banner, getShopCategoriesKeyboard(lang));
    return true;
  }

  // 7. User Account & Balance View
  if (data === 'tg_my_account') {
    await answerCallbackQuery(cqId);
    const user = await getOrCreateTelegramUser(fromId, fromUser, cq.from?.first_name);
    const balance = Number(user.balance || 0);

    const a = BOT_I18N.account;
    const accText = `
${a.title[lang] || a.title.ug}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Name:</b> ${user.name}
${a.userId[lang] || a.userId.ug} <code>${fromId}</code>
${a.balance[lang] || a.balance.ug} <b>$${balance.toFixed(2)} USD</b>
${a.vipLevel[lang] || a.vipLevel.ug} <b>${(user.vipTier || 'VIP1').toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

    await showOrEditMessage(chatId, messageId, accText, {
      inline_keyboard: [
        [{ text: BOT_I18N.storeButtons.shopCategories[lang] || '🛍️ مەھسۇلاتلار بۆلىكىگە كىرىش ➔', callback_data: 'tg_shop_categories' }],
        [{ text: BOT_I18N.storeButtons.deposit[lang] || '💎💳 شامكەشتىن پۇل سېلىش ⚡️', callback_data: 'quick_deposit' }],
        [{ text: BOT_I18N.storeButtons.changeLanguage[lang] || '🌐 تىل ئالماشتۇرۇش | Language 🔄', callback_data: 'bot_lang_menu' }],
        [{ text: BOT_I18N.categories.backToMain[lang] || '🏠 ئاساسىي بەتكە قايتىش •', callback_data: 'back_to_main' }],
      ],
    });
    return true;
  }

  return false;
}

export async function handleShopTextMessage(
  msg: any,
  chatId: number | string | undefined,
  text: string,
  from: any,
  sendTelegramMessage: (chatId: any, text: string, extra?: any) => Promise<any>
): Promise<boolean> {
  const activeSession =
    (from?.id && botOrderSessions.get(from.id)) ||
    (chatId && botOrderSessions.get(chatId));

  const lang: BotLanguage = getUserLanguage(from?.id || chatId) || 'ug';

  if (activeSession && activeSession.step !== 'ready_to_confirm') {
    if (activeSession.step === 'awaiting_target_account') {
      activeSession.targetAccount = text;

      if (activeSession.requiresZoneId && !activeSession.zoneId) {
        activeSession.step = 'awaiting_zone_id';
        const zonePrompt = `
🎯 <b>سېرۋېر رايون كودى (Server / Zone ID):</b>
ئويۇن ياكى ئەپنىڭ رايون نومۇرىنى كىرگۈزۈڭ:
<i>(مەسىلەن: 1234 ياكى 2001)</i>
`.trim();
        await sendTelegramMessage(chatId, zonePrompt, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: BOT_I18N.order.cancelPurchase[lang] || '❌ بىكار قىلىش', callback_data: 'tg_cancel_order' }]],
          },
        });
        return true;
      }
    } else if (activeSession.step === 'awaiting_zone_id') {
      activeSession.zoneId = text;
    }

    activeSession.step = 'ready_to_confirm';
    const user = await getOrCreateTelegramUser(from?.id || chatId, from?.username, from?.first_name);
    const balance = Number(user.balance || 0);
    const remaining = balance - activeSession.price;
    const isEnough = balance >= activeSession.price;

    const isGame = activeSession.serviceId.includes('othman_') || activeSession.serviceId.includes('pubg') || activeSession.serviceId.includes('free_fire');
    const sName = isGame
      ? formatCleanGameBaseName(activeSession.serviceId, activeSession.serviceName)
      : (lang === 'ug' ? activeSession.serviceName : smartTranslateTitle(activeSession.serviceName, lang as any))
          .replace(/پابجى شەن ۋە ئەزالىق/g, 'پابجى قاچىلاش ۋە ئەزالىق')
          .replace(/⚡ نەق شەن & ئەزالىق/g, '⚡ تېز قاچىلاش & ئەزالىق');
    const pTitle = activeSession.pkgTitle;

    const titleCard = BOT_I18N.order.confirmOrderTitle[lang] || '⚡️ زاكازنى جەزملەشتۈرۈش';
    const targetFull = `${activeSession.targetAccount}${activeSession.zoneId ? ` (${activeSession.zoneId})` : ''}`;

    const remainingText = isEnough
      ? (lang === 'ar' ? `المتبقي بعد الشراء: $${remaining.toFixed(2)} USD` :
         lang === 'tr' ? `Kalan Bakiye: $${remaining.toFixed(2)} USD` :
         lang === 'en' ? `Remaining Balance: $${remaining.toFixed(2)} USD` :
         lang === 'uz' ? `Qoladigan balans: $${remaining.toFixed(2)} USD` :
         lang === 'ru' ? `Остаток после покупки: $${remaining.toFixed(2)} USD` :
         `كېمەيتىلگەندىن كېيىن قالىدىغىنى: $${remaining.toFixed(2)} USD`)
      : (lang === 'ar' ? `⚠️ الرصيد غير كافٍ! ينقصك: $${(activeSession.price - balance).toFixed(2)} USD` :
         lang === 'tr' ? `⚠️ Bakiye yetersiz! Eksik: $${(activeSession.price - balance).toFixed(2)} USD` :
         lang === 'en' ? `⚠️ Insufficient balance! Needed: $${(activeSession.price - balance).toFixed(2)} USD` :
         lang === 'uz' ? `⚠️ Balans yetarli emas! Yetishmayapti: $${(activeSession.price - balance).toFixed(2)} USD` :
         lang === 'ru' ? `⚠️ Не хватает средств! Нужно еще: $${(activeSession.price - balance).toFixed(2)} USD` :
         `⚠️ قالدۇق يەتمەيدۇ! كەم قالغىنى: $${(activeSession.price - balance).toFixed(2)} USD`);

    const confirmCard = `
╭━━━ ⚡️ <b>${titleCard}</b> ━━━╮

${BOT_I18N.order.productLabel[lang]} ${sName}
${BOT_I18N.order.packageLabel[lang]} ${pTitle}
${BOT_I18N.order.priceLabel[lang]} <b>$${activeSession.price.toFixed(2)} USD</b>
${BOT_I18N.order.targetAccountLabel[lang]} <code>${targetFull}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${BOT_I18N.order.yourBalanceLabel[lang]} <b>$${balance.toFixed(2)} USD</b>
💵 <b>${remainingText}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

    await sendTelegramMessage(chatId, confirmCard, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: isEnough
          ? [
              [{ text: BOT_I18N.order.confirmBtn[lang] || '⚡️ جەزملەشتۈرۈپ سېتىۋېلىش 🛍️', callback_data: 'tg_confirm_buy' }],
              [{ text: BOT_I18N.order.cancelPurchase[lang] || '❌ بىكار قىلىش ↩️', callback_data: 'tg_cancel_order' }],
            ]
          : [
              [{ text: BOT_I18N.order.topUpBtn[lang] || '💎💳 شامكەشتىن پۇل سېلىش ⚡️', callback_data: 'quick_deposit' }],
              [{ text: BOT_I18N.categories.backToCategories[lang] || '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️', callback_data: 'tg_shop_categories' }],
            ],
      },
    });
    return true;
  }

  // Shortcut Commands
  if (
    text.startsWith('/shop') ||
    text.startsWith('/dukan') ||
    text.startsWith('/store') ||
    text.startsWith('/catalog')
  ) {
    const banner = BOT_I18N.shopBanner[lang] || BOT_I18N.shopBanner.ug;
    await sendTelegramMessage(chatId, banner, {
      parse_mode: 'HTML',
      reply_markup: getShopCategoriesKeyboard(lang),
    });
    return true;
  }

  if (text.startsWith('/balance') || text.startsWith('/account') || text.startsWith('/wallet')) {
    const user = await getOrCreateTelegramUser(from?.id || chatId, from?.username, from?.first_name);
    const balance = Number(user.balance || 0);
    const a = BOT_I18N.account;
    const balText = `
${a.title[lang] || a.title.ug}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Name:</b> ${user.name}
${a.userId[lang] || a.userId.ug} <code>${from?.id || chatId}</code>
${a.balance[lang] || a.balance.ug} <b>$${balance.toFixed(2)} USD</b>
${a.vipLevel[lang] || a.vipLevel.ug} <b>${(user.vipTier || 'VIP1').toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
    await sendTelegramMessage(chatId, balText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: BOT_I18N.storeButtons.shopCategories[lang] || '🛍️ مەھسۇلاتلار بۆلىكىگە كىرىش ➔', callback_data: 'tg_shop_categories' }],
          [{ text: BOT_I18N.storeButtons.deposit[lang] || '💎💳 شامكەشتىن پۇل سېلىش ⚡️', callback_data: 'quick_deposit' }],
        ],
      },
    });
    return true;
  }

  return false;
}
