/**
 * Comprehensive Multi-Language System for AUTO CASH Telegram Bot
 * Supported languages:
 * 1. ug - Uyghur (ئۇيغۇرچە)
 * 2. ar - Arabic (العربية)
 * 3. tr - Turkish (Türkçe)
 * 4. en - English (English)
 * 5. uz - Uzbek (O'zbekcha)
 * 6. ru - Russian (Русский)
 */

import fs from 'fs';
import path from 'path';

export type BotLanguage = 'ug' | 'ar' | 'tr' | 'en' | 'uz' | 'ru';

export interface LanguageInfo {
  code: BotLanguage;
  label: string;
  flag: string;
  nativeName: string;
}

export const BOT_LANGUAGES: LanguageInfo[] = [
  { code: 'ug', label: '🌙 ئۇيغۇرچە', flag: '🌙', nativeName: 'ئۇيغۇرچە' },
  { code: 'ar', label: '🇸🇾 العربية', flag: '🇸🇾', nativeName: 'العربية' },
  { code: 'tr', label: '🇹🇷 Türkçe', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'en', label: '🇬🇧 English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'uz', label: "🇺🇿 O'zbekcha", flag: '🇺🇿', nativeName: "O'zbekcha" },
  { code: 'ru', label: '🇷🇺 Русский', flag: '🇷🇺', nativeName: 'Русский' },
];

const LANGS_FILE_PATH = path.join(process.cwd(), 'data', 'telegram_user_langs.json');

// In-memory cache for sub-millisecond lookups
const userLanguageCache = new Map<string, BotLanguage>();
let isLoaded = false;

function loadUserLanguages(): void {
  if (isLoaded) return;
  try {
    if (fs.existsSync(LANGS_FILE_PATH)) {
      const raw = fs.readFileSync(LANGS_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          if (['ug', 'ar', 'tr', 'en', 'uz', 'ru'].includes(v as string)) {
            userLanguageCache.set(k, v as BotLanguage);
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load telegram_user_langs.json:', err);
  } finally {
    isLoaded = true;
  }
}

function persistUserLanguages(): void {
  try {
    const obj: Record<string, string> = {};
    userLanguageCache.forEach((v, k) => {
      obj[k] = v;
    });
    const dir = path.dirname(LANGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LANGS_FILE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist telegram_user_langs.json:', err);
  }
}

export function getUserLanguage(userId?: number | string): BotLanguage | null {
  if (!userId) return null;
  loadUserLanguages();
  const found = userLanguageCache.get(String(userId));
  return found || null;
}

export function hasUserChosenLanguage(userId?: number | string): boolean {
  return getUserLanguage(userId) !== null;
}

export function setUserLanguage(userId: number | string, lang: BotLanguage): void {
  loadUserLanguages();
  userLanguageCache.set(String(userId), lang);
  persistUserLanguages();
}

/**
 * Interactive Language Selection Keyboard
 */
export function getLanguageSelectionKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🌙 ئۇيغۇرچە', callback_data: 'bot_set_lang:ug' },
        { text: '🇸🇾 العربية', callback_data: 'bot_set_lang:ar' },
      ],
      [
        { text: '🇹🇷 Türkçe', callback_data: 'bot_set_lang:tr' },
        { text: '🇬🇧 English', callback_data: 'bot_set_lang:en' },
      ],
      [
        { text: "🇺🇿 O'zbekcha", callback_data: 'bot_set_lang:uz' },
        { text: '🇷🇺 Русский', callback_data: 'bot_set_lang:ru' },
      ],
    ],
  };
}

export const LANGUAGE_SELECTION_BANNER = `
🌐 <b>AUTO CASH | SELECT LANGUAGE</b> 🌐
      💎 <i>Please select your preferred language</i> 💎

👋 <b>ئەسسالامۇ ئەلەيكۇم! / Welcome / مرحباً بك</b>
🌐 <b>تۆۋەندىكى كۇنۇپكىلاردىن بىرىنى تاللاپ داۋاملاشتۇرۇڭ:</b>
🌐 <b>الرجاء اختيار لغتكم المفضلة للمتابعة:</b>
🌐 <b>Lütfen devam etmek için tercih ettiğiniz dili seçin:</b>
🌐 <b>Please choose your preferred language to proceed:</b>
🌐 <b>Iltimos, davom etish uchun tilni tanlang:</b>
🌐 <b>Пожалуйста, выберите язык для продолжения:</b>
`.trim();

/**
 * Text strings across all 6 languages
 */
export const BOT_I18N = {
  welcome: {
    ug: (name: string) => `
👋 <b>ئەسسالامۇ ئەلەيكۇم، ${name}!</b>
🌟 <b>AUTO CASH</b> — ئويۇن ۋە رەقەملىك كارتىلارنى تېز قاچىلاش سۇپىسى.
⚡️ 24/7 تولۇق ئاپتوماتىك، سېكۇنتتا يەتكۈزۈلىدۇ.

👇 <b>سېتىۋېلىش ياكى مۇلازىمەت تاللاش ئۈچۈن تۆۋەندىكى كۇنۇپكىنى بېسىڭ:</b>
`.trim(),

    ar: (name: string) => `
👋 <b>أهلاً وسهلاً بك، ${name}!</b>
🌟 <b>AUTO CASH</b> — منصة الشحن الرقمي الفوري للألعاب والبطاقات.
⚡️ تنفيذ تلقائي فوري 24/7 خلال ثوانٍ.

👇 <b>لبدء الشراء أو استعراض الخدمات، اضغط أدناه:</b>
`.trim(),

    tr: (name: string) => `
👋 <b>Hoş geldiniz, ${name}!</b>
🌟 <b>AUTO CASH</b> — Oyun ve dijital pin hızlı yükleme platformu.
⚡️ 7/24 anında otomatik teslimat.

👇 <b>Alışverişe başlamak veya hizmet seçmek için aşağıdaki butona tıklayın:</b>
`.trim(),

    en: (name: string) => `
👋 <b>Welcome, ${name}!</b>
🌟 <b>AUTO CASH</b> — Instant digital gaming & voucher top-up platform.
⚡️ 24/7 automated delivery within seconds.

👇 <b>Tap below to start shopping or view services:</b>
`.trim(),

    uz: (name: string) => `
👋 <b>Assalomu alaykum, ${name}!</b>
🌟 <b>AUTO CASH</b> — Oʻyinlar va raqamli kartalarni tezkor toʻldirish platformasi.
⚡️ 24/7 avtomatik, bir necha soniyada yetkaziladi.

👇 <b>Xarid qilish uchun quyidagi tugmani bosing:</b>
`.trim(),

    ru: (name: string) => `
👋 <b>Здравствуйте, ${name}!</b>
🌟 <b>AUTO CASH</b> — Моментальное пополнение игр и цифровых карт.
⚡️ 24/7 автоматическая доставка за секунды.

👇 <b>Нажмите кнопку ниже, чтобы перейти к покупкам:</b>
`.trim(),
  },

  // Main Store Keyboard labels
  storeButtons: {
    shopCategories: {
      ug: '🎮 بوت ئىچىدە سېتىۋېلىش',
      ar: '🎮 الشراء من داخل البوت',
      tr: '🎮 Bot İçinde Alışveriş',
      en: '🎮 In-Bot Quick Shop',
      uz: '🎮 Bot ichida xarid qilish',
      ru: '🎮 Покупка внутри бота',
    },
    webApp: {
      ug: '🛍️ دۇكاننى ئېچىش (مال سېتىۋېلىش) ➔',
      ar: '🛍️ فتح المتجر (تسوق مباشر) ➔',
      tr: '🛍️ Mağazayı Aç (Hızlı Alışveriş) ➔',
      en: '🛍️ Open Store (Shop Now) ➔',
      uz: '🛍️ Doʻkonni ochish (Xarid) ➔',
      ru: '🛍️ Открыть магазин (Купить) ➔',
    },
    myAccount: {
      ug: '💰 ھېساباتىم & قالدۇق پۇل',
      ar: '💰 حسابي والرصيد',
      tr: '💰 Hesabım & Bakiye',
      en: '💰 My Account & Balance',
      uz: '💰 Hisobim & Balans',
      ru: '💰 Мой аккаунт и баланс',
    },
    deposit: {
      ug: '📥 پۇل كىرگۈزۈش (شامكەش)',
      ar: '📥 شحن الرصيد (شام كاش)',
      tr: '📥 Bakiye Yükle (Sham Cash)',
      en: '📥 Deposit (Sham Cash)',
      uz: '📥 Balans toʻldirish (Sham Cash)',
      ru: '📥 Пополнить баланс (Sham Cash)',
    },
    trackOrders: {
      ug: '📦 زاكاز سۈرۈشتۈرۈش',
      ar: '📦 تتبع الطلبات',
      tr: '📦 Sipariş Takibi',
      en: '📦 Track Orders',
      uz: '📦 Buyurtmani tekshirish',
      ru: '📦 Отслеживание заказов',
    },
    rates: {
      ug: '💱 پۇل پېرېۋوت باھاسى 📊',
      ar: '💱 أسعار الصرف 📊',
      tr: '💱 Döviz Kurları 📊',
      en: '💱 Currency Rates 📊',
      uz: '💱 Valyuta kurslari 📊',
      ru: '💱 Курсы валют 📊',
    },
    faq: {
      ug: '❓ كۆپ سورىلىدىغان سوئاللار 💡',
      ar: '❓ الأسئلة الشائعة 💡',
      tr: '❓ Sıkça Sorulan Sorular 💡',
      en: '❓ FAQ & Help 💡',
      uz: '❓ Koʻp soʻraladigan savollar 💡',
      ru: '❓ Часто задаваемые вопросы 💡',
    },
    vip: {
      ug: '👑 VIP ئەزالىق تۈزۈمى 🌟',
      ar: '👑 نظام عضوية VIP 🌟',
      tr: '👑 VIP Üyelik Sistemi 🌟',
      en: '👑 VIP Membership 🌟',
      uz: '👑 VIP Aʼzolik tizimi 🌟',
      ru: '👑 VIP-система привилегий 🌟',
    },
    guide: {
      ug: '🌟💡 ئىشلىتىش قوللانمىسى 📖',
      ar: '🌟💡 دليل الاستخدام 📖',
      tr: '🌟💡 Kullanım Kılavuzu 📖',
      en: '🌟💡 User Guide 📖',
      uz: '🌟💡 Qoʻllanma 📖',
      ru: '🌟💡 Инструкция 📖',
    },
    download: {
      ug: '📲 ئەپ نۇسخىسى (APK) 📥',
      ar: '📲 تحميل التطبيق (APK) 📥',
      tr: '📲 Uygulamayı İndir (APK) 📥',
      en: '📲 Download APK 📥',
      uz: '📲 Ilovani yuklab olish (APK) 📥',
      ru: '📲 Скачать APK 📥',
    },
    changeLanguage: {
      ug: '🌐 تىل ئالماشتۇرۇش | Language 🔄',
      ar: '🌐 تغيير اللغة | Language 🔄',
      tr: '🌐 Dil Değiştir | Language 🔄',
      en: '🌐 Change Language | تىل 🔄',
      uz: '🌐 Tilni oʻzgartirish | Language 🔄',
      ru: '🌐 Сменить язык | Language 🔄',
    },
    channel: {
      ug: '📢🔥 رەسمىي تېلېگرام قانال 🪐',
      ar: '📢🔥 القناة الرسمية على تليجرام 🪐',
      tr: '📢🔥 Resmi Telegram Kanalı 🪐',
      en: '📢🔥 Official Telegram Channel 🪐',
      uz: '📢🔥 Rasmiy Telegram Kanal 🪐',
      ru: '📢🔥 Официальный Telegram-канал 🪐',
    },
    support: {
      ug: '💬✨ خېرىدارلار مۇلازىمىتى 👨‍💻',
      ar: '💬✨ خدمة العملاء والدعم 👨‍💻',
      tr: '💬✨ Canlı Destek & İletişim 👨‍💻',
      en: '💬✨ Customer Support 👨‍💻',
      uz: '💬✨ Qoʻllab-quvvatlash xizmati 👨‍💻',
      ru: '💬✨ Служба поддержки 👨‍💻',
    },
  },

  // Shop Banner Header
  shopBanner: {
    ug: `
🛍️ <b>مەھسۇلاتلار دۇكىنى</b>

📌 <b>دۇكان — كېرەكلىك بۆلەكنى تاللاڭ:</b>

`.trim(),
    ar: `
🛍️ <b>متجر المنتجات</b>

📌 <b>المتجر — الرجاء اختيار القسم المطلوب:</b>

`.trim(),
    tr: `
🛍️ <b>Ürünler Mağazası</b>

📌 <b>Mağaza — Lütfen istediğiniz kategoriyi seçin:</b>

`.trim(),
    en: `
🛍️ <b>Products Store</b>

📌 <b>Store — Please select a category:</b>

`.trim(),
    uz: `
🛍️ <b>Mahsulotlar Doʻkoni</b>

📌 <b>Doʻkon — Kerakli boʻlimni tanlang:</b>

`.trim(),
    ru: `
🛍️ <b>Каталог товаров</b>

📌 <b>Магазин — Выберите нужную категорию:</b>

`.trim(),
  },

  // Shop Categories Buttons
  categories: {
    visa: {
      ug: '💳 Tremendous Visa خەلقئارالىق ۋىزا كارتىسى 🛍️',
      ar: '💳 بطاقة فيزا ترمدوس العالمية 🛍️',
      tr: '💳 Tremendous Uluslararası Visa Kartı 🛍️',
      en: '💳 Tremendous International Visa Card 🛍️',
      uz: '💳 Tremendous Xalqaro Visa Kartasi 🛍️',
      ru: '💳 Международная карта Tremendous Visa 🛍️',
    },
    numbers: {
      ug: '📱 مەۋھۇم نومۇر ✤•',
      ar: '📱 أرقام وهمية ✤•',
      tr: '📱 Sanal Numara ✤•',
      en: '📱 Virtual Numbers ✤•',
      uz: '📱 Virtual Raqamlar ✤•',
      ru: '📱 Виртуальные номера ✤•',
    },
    apps: {
      ug: '✤• ئەپ دېتاللار •',
      ar: '✤• البرامج والتطبيقات •',
      tr: '✤• Uygulamalar •',
      en: '✤• Apps & Software •',
      uz: '✤• Ilovalar •',
      ru: '✤• Приложения •',
    },
    accounts: {
      ug: '⭐️ ئەزالىق ئېچىش ✤•',
      ar: '⭐️ تفعيل الاشتراكات ✤•',
      tr: '⭐️ Abonelikler ✤•',
      en: '⭐️ Subscriptions ✤•',
      uz: '⭐️ Obunalar ✤•',
      ru: '⭐️ Подписки ✤•',
    },
    games: {
      ug: '• ئويۇنلار 🎮•',
      ar: '• شحن الألعاب 🎮•',
      tr: '• Oyunlar 🎮•',
      en: '• Games Top-up 🎮•',
      uz: '• Oʻyinlar 🎮•',
      ru: '• Игры 🎮•',
    },
    balance: {
      ug: '📡 تور كارتىسى Wi-Fi 🛍️',
      ar: '📡 شبكات الإنترنت Wi-Fi 🛍️',
      tr: '📡 Wi-Fi İnternet Kartları 🛍️',
      en: '📡 Wi-Fi & Internet Cards 🛍️',
      uz: '📡 Wi-Fi Internet Kartalari 🛍️',
      ru: '📡 Интернет Wi-Fi 🛍️',
    },
    cards: {
      ug: '💲 كارتىغا پۇل قاچىلاش 📊•',
      ar: '💲 شحن البطاقات والحسابات 📊•',
      tr: '💲 Kart ve Bakiye Yükleme 📊•',
      en: '💲 Card Top-up 📊•',
      uz: '💲 Kartani toʻldirish 📊•',
      ru: '💲 Пополнение карт и счетов 📊•',
    },
    giftcards: {
      ug: '🎉 ھەدىيە كارتىسى 🎁•',
      ar: '🎉 بطاقات الهدايا 🎁•',
      tr: '🎉 Hediye Kartları 🎁•',
      en: '🎉 Gift Cards 🎁•',
      uz: '🎉 Sovgʻa kartalari 🎁•',
      ru: '🎉 Подарочные карты 🎁•',
    },
    social: {
      ug: '🌐 ئىجتىمائىي تاراتقۇ ✤•',
      ar: '🌐 خدمات التواصل الاجتماعي ✤•',
      tr: '🌐 Sosyal Medya ✤•',
      en: '🌐 Social Media ✤•',
      uz: '🌐 Ijtimoiy tarmoqlar ✤•',
      ru: '🌐 Соцсети ✤•',
    },
    backToMain: {
      ug: '🏠 ئاساسىي بەتكە قايتىش •',
      ar: '🏠 العودة إلى القائمة الرئيسية •',
      tr: '🏠 Ana Menüye Dön •',
      en: '🏠 Back to Main Menu •',
      uz: '🏠 Asosiy sahifaga qaytish •',
      ru: '🏠 Главное меню •',
    },
    backToCategories: {
      ug: '🔙 دۇكان بۆلۈملىرىگە قايتىش ↩️',
      ar: '🔙 العودة إلى أقسام المتجر ↩️',
      tr: '🔙 Mağaza Kategorilerine Dön ↩️',
      en: '🔙 Back to Store Categories ↩️',
      uz: '🔙 Doʻkon boʻlimlariga qaytish ↩️',
      ru: '🔙 Назад в категории магазина ↩️',
    },
    backToCategory: {
      ug: '🔙 تۈرگە قايتىش ↩️',
      ar: '🔙 العودة إلى القسم ↩️',
      tr: '🔙 Kategoriye Dön ↩️',
      en: '🔙 Back to Category ↩️',
      uz: '🔙 Boʻlimga qaytish ↩️',
      ru: '🔙 Назад к разделу ↩️',
    },
    nextPage: {
      ug: 'كېيىنكى ➡️',
      ar: 'التالي ➡️',
      tr: 'İleri ➡️',
      en: 'Next ➡️',
      uz: 'Keyingi ➡️',
      ru: 'Вперед ➡️',
    },
    prevPage: {
      ug: '⬅️ ئالدىنقى',
      ar: '⬅️ السابق',
      tr: '⬅️ Geri',
      en: '⬅️ Prev',
      uz: '⬅️ Oldingi',
      ru: '⬅️ Назад',
    },
  },

  // Actions & Order Prompts
  order: {
    selectPackagePrompt: {
      ug: '📌 <b>سېتىۋالماقچى بولغان بولاقنى تاللاڭ:</b>',
      ar: '📌 <b>الرجاء اختيار الباقة المطلوبة للشراء:</b>',
      tr: '📌 <b>Lütfen satın almak istediğiniz paketi seçin:</b>',
      en: '📌 <b>Please select a package to purchase:</b>',
      uz: '📌 <b>Sotib olmoqchi boʻlgan paketni tanlang:</b>',
      ru: '📌 <b>Пожалуйста, выберите пакет для покупки:</b>',
    },
    productLabel: {
      ug: '🛍️ مەھسۇلات:',
      ar: '🛍️ المنتج:',
      tr: '🛍️ Ürün:',
      en: '🛍️ Product:',
      uz: '🛍️ Mahsulot:',
      ru: '🛍️ Товар:',
    },
    packageLabel: {
      ug: '📦 بولاق:',
      ar: '📦 الباقة:',
      tr: '📦 Paket:',
      en: '📦 Package:',
      uz: '📦 Paket:',
      ru: '📦 Пакет:',
    },
    priceLabel: {
      ug: '💰 باھاسى:',
      ar: '💰 السعر:',
      tr: '💰 Fiyat:',
      en: '💰 Price:',
      uz: '💰 Narxi:',
      ru: '💰 Цена:',
    },
    yourBalanceLabel: {
      ug: '💳 سىزنىڭ قالدۇقىڭىز:',
      ar: '💳 رصيدك الحالي:',
      tr: '💳 Mevcut Bakiyeniz:',
      en: '💳 Your Balance:',
      uz: '💳 Sizning balansingiz:',
      ru: '💳 Ваш баланс:',
    },
    inputPrompt: {
      ug: '✍️ <b>ئويۇنچى ID نومۇرىڭىز ياكى تېلېفون نومۇرىڭىزنى بۇ يەرگە يېزىپ ئەۋەتىڭ:</b>',
      ar: '✍️ <b>أرسل الآن الآيدي (ID) أو رقم الهاتف المطلوب الشحن له:</b>',
      tr: '✍️ <b>Lütfen yükleme yapılacak Oyuncu ID veya Telefon numarasını yazıp gönderin:</b>',
      en: '✍️ <b>Please send your Player ID or Phone Number to top up:</b>',
      uz: '✍️ <b>Iltimos, yuklash uchun Oʻyinchi ID yoki Telefon raqamingizni yuboring:</b>',
      ru: '✍️ <b>Отправьте ваш ID игрока или номер телефона для пополнения:</b>',
    },
    cancelPurchase: {
      ug: '❌ سېتىۋېلىشنى بىكار قىلىش ↩️',
      ar: '❌ إلغاء الشراء ↩️',
      tr: '❌ Satın Almayı İptal Et ↩️',
      en: '❌ Cancel Purchase ↩️',
      uz: '❌ Xaridni bekor qilish ↩️',
      ru: '❌ Отменить покупку ↩️',
    },
    confirmOrderTitle: {
      ug: '⚡️ زاكازنى جەزملەشتۈرۈش',
      ar: '⚡️ تأكيد تفاصيل الطلب',
      tr: '⚡️ Siparişi Onayla',
      en: '⚡️ Confirm Your Order',
      uz: '⚡️ Buyurtmani tasdiqlash',
      ru: '⚡️ Подтверждение заказа',
    },
    targetAccountLabel: {
      ug: '🎯 نىشان ھېسابات (ID / نومۇر):',
      ar: '🎯 الحساب المستهدف (ID / الرقم):',
      tr: '🎯 Hedef Hesap (ID / Numara):',
      en: '🎯 Target Account (ID / Number):',
      uz: '🎯 Qabul qiluvchi hisob (ID / Raqam):',
      ru: '🎯 Целевой аккаунт (ID / Номер):',
    },
    confirmBtn: {
      ug: '✅ جەزملەش ۋە سېتىۋېلىش ⚡️',
      ar: '✅ تأكيد وإتمام الشراء ⚡️',
      tr: '✅ Onayla ve Satın Al ⚡️',
      en: '✅ Confirm & Purchase ⚡️',
      uz: '✅ Tasdiqlash va sotib olish ⚡️',
      ru: '✅ Подтвердить и купить ⚡️',
    },
    topUpBtn: {
      ug: '💎 ھەميانغا پۇل سېلىش (شامكەش) 💳',
      ar: '💎 شحن الرصيد (شام كاش) 💳',
      tr: '💎 Bakiye Yükle (Sham Cash) 💳',
      en: '💎 Deposit Balance (Sham Cash) 💳',
      uz: '💎 Balans toʻldirish (Sham Cash) 💳',
      ru: '💎 Пополнить баланс (Sham Cash) 💳',
    },
    insufficientBalanceAlert: {
      ug: '⚠️ ھەميان قالدۇقىڭىز يېتىشمىدى. پۇل كىرگۈزۈپ قايتا سىناڭ.',
      ar: '⚠️ رصيدك غير كافٍ. يرجى شحن الرصيد والمحاولة مجدداً.',
      tr: '⚠️ Bakiyeniz yetersiz. Lütfen bakiye yükleyip tekrar deneyin.',
      en: '⚠️ Insufficient balance. Please deposit and try again.',
      uz: '⚠️ Balansingiz yetarli emas. Iltimos, hisobni toʻldiring.',
      ru: '⚠️ Недостаточно средств. Пожалуйста, пополните баланс.',
    },
    orderSuccessTitle: {
      ug: '✅ زاكاز مۇۋەپپەقىيەتلىك تاپشۇرۇلدى!',
      ar: '✅ تم استلام طلبك بنجاح!',
      tr: '✅ Siparişiniz başarıyla alındı!',
      en: '✅ Order Submitted Successfully!',
      uz: '✅ Buyurtmangiz muvaffaqiyatli qabul qilindi!',
      ru: '✅ Заказ успешно оформлен!',
    },
    orderIdLabel: {
      ug: '🆔 زاكاز نومۇرى:',
      ar: '🆔 رقم الطلب:',
      tr: '🆔 Sipariş No:',
      en: '🆔 Order ID:',
      uz: '🆔 Buyurtma raqami:',
      ru: '🆔 Номер заказа:',
    },
    orderStatusLabel: {
      ug: '⏳ ھالىتى: تەستىقلىنىۋاتىدۇ (سەل تەخىر قىلىڭ ⚡️)',
      ar: '⏳ الحالة: قيد المعالجة والتنفيذ (يرجى الانتظار قليلاً ⚡️)',
      tr: '⏳ Durum: İşleniyor ve Onaylanıyor (Lütfen bekleyin ⚡️)',
      en: '⏳ Status: Processing & Verifying (Please wait a moment ⚡️)',
      uz: '⏳ Holat: Tasdiqlanmoqda (Iltimos, biroz kuting ⚡️)',
      ru: '⏳ Статус: В обработке и подтверждении (Пожалуйста, подождите ⚡️)',
    },
    orderSuccessTip: {
      ug: '⏳ <b>سەل تەخىر قىلىڭ:</b> سىستېمىمىز زاكاسنى 1-3 مىنۇت ئىچىدە ئاپتوماتىك تەستىقلاپ قاچىلايدۇ.\n🛡️ <b>100% قالدۇق كاپالىتى:</b> ئەگەر زاكاز تەمىنلىگۈچى تەرەپتىن ماقۇللانماي قالسا ياكى خاتا بولسا، كېمەيتىلگەن سومما <b>دەرھال ۋە ئاپتوماتىك ھالدا ھەميان ھېساباتىڭىزغا 100% تولۇق قايتۇرۇلىدۇ</b>. ھېچقانداق زىيان تارتمايسىز!',
      ar: '⏳ <b>يرجى الانتظار قليلاً:</b> سيتم تنفيذ طلبك تلقائياً خلال 1-3 دقائق.\n🛡️ <b>ضمان استرداد الرصيد 100%:</b> إذا لم تتم الموافقة على الطلب لأي سبب، فسيتم <b>إعادة المبلغ كاملاً إلى محفظتك فوراً وتلقائياً</b> بدون أي خصم!',
      tr: '⏳ <b>Lütfen biraz bekleyin:</b> Siparişiniz 1-3 dakika içinde otomatik olarak işlenir.\n🛡️ <b>%100 Bakiye İade Garantisi:</b> Sipariş onaylanmazsa veya başarısız olursa, tutar <b>anında ve otomatik olarak cüzdan bakiyenize iade edilir</b>. Hiçbir kaybınız olmaz!',
      en: '⏳ <b>Please wait a moment:</b> Your order will be automatically verified and delivered within 1-3 minutes.\n🛡️ <b>100% Balance Refund Guarantee:</b> If the order is not approved or fails, your money will be <b>immediately and automatically refunded to your wallet balance</b> with zero loss!',
      uz: '⏳ <b>Iltimos, biroz kuting:</b> Buyurtma 1-3 daqiqa ichida avtomatik yetkaziladi.\n🛡️ <b>100% Qaytarish Kafolati:</b> Agar buyurtma tasdiqlanmasa, mablagʻingiz <b>darhol va avtomatik ravishda hamyon balansingizga toʻliq qaytariladi</b>!',
      ru: '⏳ <b>Пожалуйста, подождите немного:</b> Заказ автоматически обрабатывается в течение 1-3 минут.\n🛡️ <b>100% Гарантия возврата:</b> Если заказ не будет одобрен или возникнет сбой, средства <b>моментально и автоматически вернутся на ваш баланс</b> в полном объеме!',
    },
  },

  // Account Screen
  account: {
    title: {
      ug: '👤 <b>مېنىڭ ھېساباتىم & قالدۇق پۇل</b>',
      ar: '👤 <b>حسابي الشخصي والرصيد</b>',
      tr: '👤 <b>Hesabım ve Bakiye Bilgisi</b>',
      en: '👤 <b>My Account & Balance</b>',
      uz: '👤 <b>Mening hisobim va balans</b>',
      ru: '👤 <b>Мой профиль и баланс</b>',
    },
    userId: {
      ug: '🆔 سۇپا كىملىكى (ID):',
      ar: '🆔 معرف الحساب (ID):',
      tr: '🆔 Hesap ID:',
      en: '🆔 Account ID:',
      uz: '🆔 Hisob ID:',
      ru: '🆔 ID аккаунта:',
    },
    balance: {
      ug: '💰 ھەميان قالدۇقى:',
      ar: '💰 رصيد المحفظة:',
      tr: '💰 Cüzdan Bakiyesi:',
      en: '💰 Wallet Balance:',
      uz: '💰 Hamyon balansi:',
      ru: '💰 Баланс кошелька:',
    },
    ordersCount: {
      ug: '📦 جەمئىي زاكازلار سانى:',
      ar: '📦 إجمالي عدد الطلبات:',
      tr: '📦 Toplam Sipariş Sayısı:',
      en: '📦 Total Orders:',
      uz: '📦 Jami buyurtmalar:',
      ru: '📦 Всего заказов:',
    },
    vipLevel: {
      ug: '👑 VIP ئەزالىق دەرىجىسى:',
      ar: '👑 مستوى VIP:',
      tr: '👑 VIP Seviyesi:',
      en: '👑 VIP Level:',
      uz: '👑 VIP Darajasi:',
      ru: '👑 Уровень VIP:',
    },
  },

  // Language updated confirmation
  langChangedAlert: {
    ug: '✅ تىل ئۇيغۇرچىغا تەڭشەلدى!',
    ar: '✅ تم تغيير اللغة إلى العربية بنجاح!',
    tr: '✅ Dil Türkçe olarak ayarlandı!',
    en: '✅ Language switched to English!',
    uz: "✅ Til O'zbekchaga o'zgartirildi!",
    ru: '✅ Язык успешно изменен на русский!',
  },
};
