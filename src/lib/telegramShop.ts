import {
  getAllUsersAsync,
  getUserByEmailAsync,
  createUserAsync,
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
  const tgEmail = `tg_${fromId}@autocash.pro`;
  const existing = await getUserByEmailAsync(tgEmail);
  if (existing) {
    return existing;
  }
  const allUsers = await getAllUsersAsync();
  const linked = allUsers.find(
    (u) =>
      u.email === tgEmail ||
      (fromUsername && (u as any).telegramUsername?.toLowerCase() === fromUsername.toLowerCase())
  );
  if (linked) return linked;

  const newUser = await createUserAsync({
    name: firstName || fromUsername || `TG_${fromId}`,
    email: tgEmail,
    password: `tg_pass_${fromId}_${Date.now()}`,
    role: 'user',
  });
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
  if (catKey === 'balance') {
    // Wi-Fi category left empty for upcoming additions
    return all.filter((s) => s.category === 'balance');
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
  return all.filter((s) => s.category === catKey);
}

export function getCategoryProductsKeyboard(catKey: string, page = 0, lang: BotLanguage = 'ug') {
  const services = getServicesForCategory(catKey);
  const pageSize = 8;
  const totalPages = Math.ceil(services.length / pageSize) || 1;
  const currentPage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = services.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const inline_keyboard: any[][] = [];

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
      text: BOT_I18N.categories.backToCategories[lang] || '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️',
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

  const pageSize = 10;
  const totalPages = Math.ceil(packages.length / pageSize) || 1;
  const currentPage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = packages.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  for (const pkg of slice) {
    const rawTitle = pkg.title;
    const translatedTitle = lang === 'ug' ? rawTitle : smartTranslateTitle(rawTitle, lang as any);
    inline_keyboard.push([
      {
        text: `📦 ${translatedTitle} — ${Number(pkg.price).toFixed(2)} USD`,
        callback_data: `tgpkg:${service.id}:${pkg.id}`,
      },
    ]);
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
  const backText = service.id === 'othman_visa_cards'
    ? (BOT_I18N.categories.backToCategories[lang] || BOT_I18N.categories.backToCategories.ug)
    : (BOT_I18N.categories.backToCategory[lang] || BOT_I18N.categories.backToCategory.ug);

  inline_keyboard.push([
    { text: backText, callback_data: backTarget },
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

    const catText = `
╭━━━ 🌟 <b>${catTitle}</b> ━━━╮

${isEmpty ? emptyNotice : `📌 <b>${choosePrompt}</b>\n<i>${countPrompt}</i>`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
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

    const hasSubs = service.subCategories && service.subCategories.length > 1;
    const activeSub = hasSubs
      ? service.subCategories?.find((sc) => sc.id === subCatId) || service.subCategories?.[0]
      : null;
    const subLabel = activeSub ? (lang === 'ug' ? activeSub.label : smartTranslateTitle(activeSub.label, lang as any)) : '';
    const effectiveSubTitle = subLabel ? ` - ${subLabel}` : '';
    const serviceName = lang === 'ug' ? service.name : smartTranslateTitle(service.name, lang as any);

    const selectPrompt = BOT_I18N.order.selectPackagePrompt[lang] || BOT_I18N.order.selectPackagePrompt.ug;

    const servText = `
╭━━━ 💎 <b>${serviceName}${effectiveSubTitle}</b> ━━━╮

${selectPrompt}
${service.description ? `<i>${service.description}</i>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
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

    botOrderSessions.set(fromId, {
      step: 'awaiting_target_account',
      serviceId: service.id,
      serviceName: service.name,
      pkgId: pkg.id,
      pkgTitle: pkg.title,
      price: Number(pkg.price),
      providerProductId: pkg.providerProductId,
      providerQty: (pkg as any).providerQty,
      requiresZoneId: requiresZone,
      timestamp: Date.now(),
    });
    if (chatId) botOrderSessions.set(chatId, botOrderSessions.get(fromId)!);

    const sName = lang === 'ug' ? service.name : smartTranslateTitle(service.name, lang as any);
    const pTitle = lang === 'ug' ? pkg.title : smartTranslateTitle(pkg.title, lang as any);

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

    const atomicRes = await deductBalanceAndCreateOrderAtomicAsync({
      idempotencyKey: `TG-${Date.now()}-${fromId}`,
      userId: user.id,
      userEmail: user.email,
      serviceId: session.serviceId,
      serviceName: session.serviceName,
      packageTitle: session.pkgTitle,
      amount: session.price,
      targetAccount: targetAccFull || 'Not provided',
      orderId,
      details: {
        fromTelegram: true,
        telegramChatId: fromId,
        telegramUsername: fromUser,
        gamePlayerId: session.targetAccount,
        gameZoneId: session.zoneId,
        providerProductId: session.providerProductId,
      },
    });

    if (!atomicRes.success) {
      await showOrEditMessage(chatId, messageId, `❌ Order failed: ${atomicRes.message}`, {
        inline_keyboard: [[{ text: BOT_I18N.categories.backToCategories[lang] || '🔙 Back', callback_data: 'tg_shop_categories' }]],
      });
      return true;
    }

    const order = atomicRes.order || ({ id: orderId, amount: session.price, status: 'processing' } as any);

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

    const sName = lang === 'ug' ? session.serviceName : smartTranslateTitle(session.serviceName, lang as any);
    const pTitle = lang === 'ug' ? session.pkgTitle : smartTranslateTitle(session.pkgTitle, lang as any);

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

    const sName = lang === 'ug' ? activeSession.serviceName : smartTranslateTitle(activeSession.serviceName, lang as any);
    const pTitle = lang === 'ug' ? activeSession.pkgTitle : smartTranslateTitle(activeSession.pkgTitle, lang as any);

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
