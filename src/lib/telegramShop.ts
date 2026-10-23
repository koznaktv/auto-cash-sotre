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

export interface BotOrderSession {
  step: 'awaiting_target_account' | 'awaiting_zone_id' | 'ready_to_confirm';
  serviceId: string;
  serviceName: string;
  pkgId: string;
  pkgTitle: string;
  price: number;
  providerProductId?: number;
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
» » ༒•|——( مەھسۇلاتلار دۇكىنى )——|•༒ « «

📌 <b>دۇكان — كېرەكلىك بۆلەكنى تاللاڭ:</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

export function getShopCategoriesKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '💳 Tremendous Visa خەلقئارالىق ۋىزا كارتىسى 🛍️', callback_data: 'tgserv:othman_visa_cards' },
      ],
      [
        { text: '📱 مەۋھۇم نومۇر ✤•', callback_data: 'tgcat:numbers' },
        { text: '✤• ئەپ دېتاللار •', callback_data: 'tgcat:apps' },
      ],
      [
        { text: '⭐️ ئەزالىق ئېچىش ✤•', callback_data: 'tgcat:accounts' },
        { text: '• ئويۇنلار 🎮•', callback_data: 'tgcat:games' },
      ],
      [
        { text: '📡 تور كارتىسى Wi-Fi 🛍️', callback_data: 'tgcat:balance' },
        { text: '💲 كارتىغا پۇل قاچىلاش 📊•', callback_data: 'tgcat:cards' },
      ],
      [
        { text: '🎉 ھەدىيە كارتىسى 🎁•', callback_data: 'tgcat:giftcards' },
        { text: '🌐 ئىجتىمائىي تاراتقۇ ✤•', callback_data: 'tgcat:social' },
      ],
      [
        { text: '🏠 ئاساسىي بەتكە قايتىش •', callback_data: 'back_to_main' },
      ],
    ],
  };
}

export function getCategoryDisplayTitle(catKey: string): string {
  switch (catKey) {
    case 'crypto':
    case 'visa':
      return '💳 Tremendous Visa خەلقئارالىق ۋىزا كارتىسى';
    case 'numbers':
      return '📱 مەۋھۇم نومۇر ✤•';
    case 'apps':
      return '✤• ئەپ دېتاللار •';
    case 'accounts':
      return '⭐️ ئەزالىق ئېچىش ✤•';
    case 'games':
      return '• ئويۇنلار 🎮•';
    case 'balance':
      return '📡 تور كارتىسى Wi-Fi 🛍️';
    case 'cards':
      return '💲 كارتىغا پۇل قاچىلاش 📊•';
    case 'giftcards':
      return '🎉 ھەدىيە كارتىسى 🎁•';
    case 'social':
      return '🌐 ئىجتىمائىي تاراتقۇ ✤•';
    default:
      return 'مەھسۇلاتلار دۇكىنى';
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
    return all.filter(
      (s) =>
        s.category === 'balance' ||
        s.id.includes('syriatel') ||
        s.id.includes('mtn') ||
        s.id.includes('vodafone') ||
        s.id.includes('turk_telekom')
    );
  }
  return all.filter((s) => s.category === catKey);
}

export function getCategoryProductsKeyboard(catKey: string, page = 0) {
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
    row.push({
      text: `${icon1} ${item1.name.slice(0, 18)}`,
      callback_data: `tgserv:${item1.id}`,
    });
    if (i + 1 < slice.length) {
      const item2 = slice[i + 1];
      const icon2 = item2.badge ? item2.badge.split(' ')[0] : '⚡';
      row.push({
        text: `${icon2} ${item2.name.slice(0, 18)}`,
        callback_data: `tgserv:${item2.id}`,
      });
    }
    inline_keyboard.push(row);
  }

  if (totalPages > 1) {
    const navRow: any[] = [];
    if (currentPage > 0) {
      navRow.push({
        text: '⬅️ ئالدىنقى',
        callback_data: `tgcat:${catKey}:${currentPage - 1}`,
      });
    }
    navRow.push({
      text: `📄 ${currentPage + 1}/${totalPages}`,
      callback_data: `tgcat:${catKey}:${currentPage}`,
    });
    if (currentPage < totalPages - 1) {
      navRow.push({
        text: 'كېيىنكى ➡️',
        callback_data: `tgcat:${catKey}:${currentPage + 1}`,
      });
    }
    inline_keyboard.push(navRow);
  }

  inline_keyboard.push([
    { text: '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️', callback_data: 'tg_shop_categories' },
  ]);

  return { inline_keyboard };
}

export function getServicePackagesKeyboard(service: ServiceItem, activeSubCatId?: string) {
  const inline_keyboard: any[][] = [];

  if (service.subCategories && service.subCategories.length > 1) {
    const subRows: any[] = [];
    const effectiveSub = activeSubCatId || service.subCategories[0].id;
    for (const sc of service.subCategories) {
      const isSelected = sc.id === effectiveSub;
      subRows.push({
        text: `${isSelected ? '🔘 ' : '⚪ '}${sc.label}`,
        callback_data: `tgserv:${service.id}:${sc.id}`,
      });
    }
    for (let r = 0; r < subRows.length; r += 2) {
      inline_keyboard.push(subRows.slice(r, r + 2));
    }
  }

  const effectiveSubId = activeSubCatId || service.subCategories?.[0]?.id;
  const packages = service.packages.filter((p) => {
    if (service.subCategories && service.subCategories.length > 1 && effectiveSubId) {
      return p.subCategoryId === effectiveSubId;
    }
    return true;
  });

  for (const pkg of packages.slice(0, 16)) {
    inline_keyboard.push([
      {
        text: `📦 ${pkg.title} — $${Number(pkg.price).toFixed(2)} USD`,
        callback_data: `tgpkg:${service.id}:${pkg.id}`,
      },
    ]);
  }

  const backTarget = service.id === 'othman_visa_cards' ? 'tg_shop_categories' : `tgcat:${service.category || 'games'}`;
  const backText = service.id === 'othman_visa_cards' ? '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️' : '🔙 تۈرگە قايتىش ↩️';

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
  // 1. Categories Menu
  if (data === 'tg_shop_categories' || data === 'quick_catalog') {
    await answerCallbackQuery(cqId);
    await showOrEditMessage(chatId, messageId, SHOP_CATEGORIES_BANNER, getShopCategoriesKeyboard());
    return true;
  }

  // 2. Category Products View
  if (data.startsWith('tgcat:')) {
    await answerCallbackQuery(cqId);
    const parts = data.split(':');
    const catKey = parts[1];
    const page = parts[2] ? parseInt(parts[2], 10) || 0 : 0;
    const catTitle = getCategoryDisplayTitle(catKey);
    const services = getServicesForCategory(catKey);

    const catText = `
» » ༒•|——( ${catTitle} )——|•༒ « «

📌 <b>كېرەكلىك مەھسۇلاتنى تاللاڭ:</b>
<i>(جەمئىي: ${services.length} تال مۇلازىمەت بار)</i>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
    await showOrEditMessage(chatId, messageId, catText, getCategoryProductsKeyboard(catKey, page));
    return true;
  }

  // 3. Service View & Subcategories / Packages
  if (data.startsWith('tgserv:')) {
    await answerCallbackQuery(cqId);
    const parts = data.split(':');
    const serviceId = parts[1];
    const subCatId = parts[2] || undefined;
    const service = getServicesList().find((s) => s.id === serviceId);
    if (!service) {
      await answerCallbackQuery(cqId, '❌ مەھسۇلات تېپىلمىدى', true);
      return true;
    }

    const hasSubs = service.subCategories && service.subCategories.length > 1;
    const activeSub = hasSubs
      ? service.subCategories?.find((sc) => sc.id === subCatId) || service.subCategories?.[0]
      : null;
    const effectiveSubTitle = activeSub ? ` - ${activeSub.label}` : '';

    const servText = `
» » ༒•|——( ${service.name}${effectiveSubTitle} )——|•༒ « «

📌 <b>سېتىۋالماقچى بولغان بولاقنى تاللاڭ:</b>
${service.description ? `<i>${service.description}</i>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
    await showOrEditMessage(chatId, messageId, servText, getServicePackagesKeyboard(service, subCatId));
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
      await answerCallbackQuery(cqId, '❌ تۈر تېپىلمىدى', true);
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
      requiresZoneId: requiresZone,
      timestamp: Date.now(),
    });
    if (chatId) botOrderSessions.set(chatId, botOrderSessions.get(fromId)!);

    const promptText = `
» » ༒•|——( زاكاز ئۇچۇرى كىرگۈزۈش )——|•༒ « «

🛍️ <b>مەھسۇلات:</b> ${service.name}
📦 <b>بولاق:</b> <b>${pkg.title}</b>
💰 <b>باھاسى:</b> <b>$${Number(pkg.price).toFixed(2)} USD</b>
💳 <b>سىزنىڭ قالدۇقىڭىز:</b> <b>$${Number(user.balance || 0).toFixed(2)} USD</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ <b>${service.inputLabel || 'ئويۇنچى ID نومۇرىڭىز ياكى تېلېفون نومۇرىڭىزنى بۇ يەرگە يېزىپ ئەۋەتىڭ:'}</b>
${service.inputPlaceholder ? `<i>(مەسىلەن: ${service.inputPlaceholder})</i>` : ''}
`.trim();

    await showOrEditMessage(chatId, messageId, promptText, {
      inline_keyboard: [
        [{ text: '❌ سېتىۋېلىشنى بىكار قىلىش ↩️', callback_data: `tgserv:${service.id}` }],
      ],
    });
    return true;
  }

  // 5. Confirm Buy Execution
  if (data === 'tg_confirm_buy') {
    const session = botOrderSessions.get(fromId) || (chatId ? botOrderSessions.get(chatId) : null);
    if (!session) {
      await answerCallbackQuery(cqId, '⚠️ زاكاز ۋاقتى ئۆتۈپ كەتتى، قايتا تاللاڭ.', true);
      return true;
    }
    await answerCallbackQuery(cqId, '⏳ زاكاز سىستېمىغا بېرىلىۋاتىدۇ...');

    const user = await getOrCreateTelegramUser(fromId, fromUser, cq.from?.first_name);
    const balance = Number(user.balance || 0);

    if (balance < session.price) {
      const insufficientText = `
⚠️ <b>كەچۈرۈڭ، ھەميان قالدۇقىڭىز يەتمىدى!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 <b>زاكاز باھاسى:</b> $${session.price.toFixed(2)} USD
💳 <b>مەۋجۇت قالدۇقىڭىز:</b> $${balance.toFixed(2)} USD
⚠️ <b>كەم قالغىنى:</b> $${(session.price - balance).toFixed(2)} USD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
شامكەش (Sham Cash) ئارقىلىق ئاپتوماتىك پۇل كىرگۈزۈپ، شۇئان قايتا سېتىۋالسىڭىز بولىدۇ:
`.trim();
      await showOrEditMessage(chatId, messageId, insufficientText, {
        inline_keyboard: [
          [{ text: '💎💳 شامكەشتىن پۇل سېلىش ⚡️', callback_data: 'quick_deposit' }],
          [{ text: '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️', callback_data: 'tg_shop_categories' }],
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
      targetAccount: targetAccFull || 'تەلەپ قىلىنمىغان',
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
      await showOrEditMessage(chatId, messageId, `❌ زاكاز مەغلۇپ بولدى: ${atomicRes.message}`, {
        inline_keyboard: [[{ text: '🔙 دۇكانغا قايتىش', callback_data: 'tg_shop_categories' }]],
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
          const providerRes = await activeProvider.createOrder({
            productId: session.providerProductId,
            orderUuid: generateUUIDv4(),
            qty: 1,
            params: {
              playerId: session.targetAccount || '',
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

    const successReceipt = `
🎉 <b>تەبرىكلەيمىز! سېتىۋېلىش مۇۋەپپەقىيەتلىك تاماملاندى!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧾 <b>زاكاز نومۇرى:</b> <code>${order.id}</code>
🛍️ <b>مەھسۇلات:</b> ${session.serviceName}
📦 <b>بولاق:</b> ${session.pkgTitle}
🎯 <b>قاچىلانغان ھېسابات:</b> <code>${targetAccFull}</code>
💰 <b>تۆلەنگەن سومما:</b> <b>$${session.price.toFixed(2)} USD</b>
💳 <b>يېڭى قالدۇقىڭىز:</b> <b>$${Number(atomicRes.newBalance ?? 0).toFixed(2)} USD</b>
⚡️ <b>ھالىتى:</b> <b>${order.status === 'completed' ? '✅ پۈتتى (Completed)' : '🚀 يوللاندى / بىر تەرەپ قىلىنماقتا'}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ <i>ھېساباتىڭىزغا تېز سۈرئەتتە قاچىلىنىدۇ. زاكاز نومۇرى ئارقىلىق ئەھۋالىنى تەكشۈرەلەيسىز.</i>
`.trim();

    await showOrEditMessage(chatId, messageId, successReceipt, {
      inline_keyboard: [
        [{ text: '🔍 زاكاز ھالىتىنى تەكشۈرۈش 📦', callback_data: `recheck_ord:${order.id}` }],
        [{ text: '🛍️ يەنە مال سېتىۋېلىش ➔', callback_data: 'tg_shop_categories' }],
        [{ text: '🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
      ],
    });
    return true;
  }

  // 6. Cancel Order Session
  if (data === 'tg_cancel_order') {
    botOrderSessions.delete(fromId);
    if (chatId) botOrderSessions.delete(chatId);
    await answerCallbackQuery(cqId, 'سېتىۋېلىش بىكار قىلىندى');
    await showOrEditMessage(chatId, messageId, SHOP_CATEGORIES_BANNER, getShopCategoriesKeyboard());
    return true;
  }

  // 7. User Account & Balance View
  if (data === 'tg_my_account') {
    await answerCallbackQuery(cqId);
    const user = await getOrCreateTelegramUser(fromId, fromUser, cq.from?.first_name);
    const balance = Number(user.balance || 0);

    const accText = `
» » ༒•|——( ھېساباتىم & ھەميان )——|•༒ « «

👤 <b>ئىسمىڭىز:</b> ${user.name}
🆔 <b>تېلېگرام ID:</b> <code>${fromId}</code>
💰 <b>ھەميان قالدۇقىڭىز:</b> <b>$${balance.toFixed(2)} USD</b>
👑 <b>ئەزالىق دەرىجىسى:</b> <b>${(user.vipTier || 'VIP1').toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡️ <i>سىز شامكەش ئارقىلىق ھەميانغا پۇل كىرگۈزۈپ، توربەتكە كىرمەيمۇ بارلىق ئويۇن ۋە ئەپلەرگە بىۋاسىتە مال سېتىۋالالايسىز!</i>
`.trim();

    await showOrEditMessage(chatId, messageId, accText, {
      inline_keyboard: [
        [{ text: '🛍️ مەھسۇلاتلار بۆلىكىگە كىرىش ➔', callback_data: 'tg_shop_categories' }],
        [{ text: '💎💳 شامكەشتىن پۇل سېلىش ⚡️', callback_data: 'quick_deposit' }],
        [{ text: '🔍 مېنىڭ زاكازلىرىم 📦', callback_data: 'quick_track' }],
        [{ text: '🔙🏠 ئاساسىي باش بەتكە قايتىش ↩️', callback_data: 'back_to_main' }],
      ],
    });
    return true;
  }

  return false;
}

export async function handleShopTextMessage(
  msg: any,
  chatId: number | string,
  text: string,
  from: any,
  sendTelegramMessage: (chatId: any, text: string, options?: any) => Promise<any>
): Promise<boolean> {
  const activeSession = botOrderSessions.get(chatId) || (from?.id ? botOrderSessions.get(from.id) : null);
  if (activeSession && !text.startsWith('/')) {
    if (activeSession.step === 'awaiting_target_account') {
      activeSession.targetAccount = text;
      if (activeSession.requiresZoneId) {
        activeSession.step = 'awaiting_zone_id';
        const zonePrompt = `
» » ༒•|——( رايون نومۇرى Zone ID )——|•༒ « «

🎯 <b>كىرگۈزگەن ID:</b> <code>${activeSession.targetAccount}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ <b>ئەمدى ئويۇندىكى رايون نومۇرىڭىزنى (Zone ID) كىرگۈزۈپ ئەۋەتىڭ:</b>
<i>(مەسىلەن: 1234 ياكى 2001)</i>
`.trim();
        await sendTelegramMessage(chatId, zonePrompt, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ بىكار قىلىش', callback_data: 'tg_cancel_order' }]],
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

    const confirmCard = `
» » ༒•|——( زاكازنى جەزملەشتۈرۈش )——|•༒ « «

🛍️ <b>مەھسۇلات:</b> ${activeSession.serviceName}
📦 <b>بولاق:</b> ${activeSession.pkgTitle}
💰 <b>تۆلەيدىغان باھا:</b> <b>$${activeSession.price.toFixed(2)} USD</b>
🎯 <b>قاچىلىنىدىغان ھېسابات:</b> <code>${activeSession.targetAccount}${activeSession.zoneId ? ` (${activeSession.zoneId})` : ''}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 <b>سىزنىڭ ھەميان قالدۇقىڭىز:</b> <b>$${balance.toFixed(2)} USD</b>
💵 <b>${isEnough ? `كېمەيتىلگەندىن كېيىن قالىدىغىنى: $${remaining.toFixed(2)} USD` : `⚠️ قالدۇق يەتمەيدۇ! كەم قالغىنى: $${(activeSession.price - balance).toFixed(2)} USD`}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${isEnough ? '⚡️ سېتىۋېلىشنى جەزملەشتۈرەمسىز؟' : '💡 سېتىۋېلىش ئۈچۈن شامكەش ياكى USDT ئارقىلىق پۇل قاچىلاڭ.'}
`.trim();

    await sendTelegramMessage(chatId, confirmCard, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: isEnough
          ? [
              [{ text: '⚡️ جەزملەشتۈرۈپ سېتىۋېلىش 🛍️', callback_data: 'tg_confirm_buy' }],
              [{ text: '❌ بىكار قىلىش ↩️', callback_data: 'tg_cancel_order' }],
            ]
          : [
              [{ text: '💎💳 شامكەشتىن پۇل سېلىش ⚡️', callback_data: 'quick_deposit' }],
              [{ text: '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️', callback_data: 'tg_shop_categories' }],
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
    await sendTelegramMessage(chatId, SHOP_CATEGORIES_BANNER, {
      parse_mode: 'HTML',
      reply_markup: getShopCategoriesKeyboard(),
    });
    return true;
  }

  if (text.startsWith('/balance') || text.startsWith('/account') || text.startsWith('/wallet')) {
    const user = await getOrCreateTelegramUser(from?.id || chatId, from?.username, from?.first_name);
    const balance = Number(user.balance || 0);
    const balText = `
» » ༒•|——( ھېساباتىم & ھەميان )——|•༒ « «

👤 <b>ئىسمىڭىز:</b> ${user.name}
🆔 <b>تېلېگرام ID:</b> <code>${from?.id || chatId}</code>
💰 <b>ھەميان قالدۇقىڭىز:</b> <b>$${balance.toFixed(2)} USD</b>
👑 <b>ئەزالىق دەرىجىسى:</b> <b>${(user.vipTier || 'VIP1').toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡️ <i>شامكەش ئارقىلىق پۇل سېلىپ، بوتتىن بىۋاسىتە مال سېتىۋالالايسىز!</i>
`.trim();
    await sendTelegramMessage(chatId, balText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ مەھسۇلاتلار بۆلىكىگە كىرىش ➔', callback_data: 'tg_shop_categories' }],
          [{ text: '💎💳 شامكەشتىن پۇل سېلىش ⚡️', callback_data: 'quick_deposit' }],
        ],
      },
    });
    return true;
  }

  return false;
}
