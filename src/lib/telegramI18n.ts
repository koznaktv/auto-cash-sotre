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
import { getSupabase } from './supabase';

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

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');
const LANGS_FILE = path.join(DATA_DIR, 'telegram_user_langs.json');
const BUNDLED_LANGS_FILE = path.join(BUNDLED_DATA_DIR, 'telegram_user_langs.json');

// In-memory cache for sub-millisecond lookups
const userLanguageCache = new Map<string, BotLanguage>();
let isLoaded = false;
let lastSupabaseFetch = 0;

function loadUserLanguagesSync(): void {
  if (isLoaded) return;
  try {
    const fileToRead = fs.existsSync(LANGS_FILE)
      ? LANGS_FILE
      : fs.existsSync(BUNDLED_LANGS_FILE)
      ? BUNDLED_LANGS_FILE
      : null;

    if (fileToRead) {
      const raw = fs.readFileSync(fileToRead, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          if (['ug', 'ar', 'tr', 'en', 'uz', 'ru'].includes(v as string)) {
            userLanguageCache.set(String(k), v as BotLanguage);
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

function persistUserLanguagesLocal(): void {
  try {
    const obj: Record<string, string> = {};
    userLanguageCache.forEach((v, k) => {
      obj[k] = v;
    });

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${LANGS_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(obj, null, 2), 'utf-8');
    fs.renameSync(temp, LANGS_FILE);

    if (BUNDLED_LANGS_FILE !== LANGS_FILE && fs.existsSync(BUNDLED_DATA_DIR)) {
      try {
        fs.writeFileSync(BUNDLED_LANGS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
      } catch {}
    }
  } catch (err) {
    console.error('Failed to persist telegram_user_langs.json locally:', err);
  }
}

export async function getUserLanguageAsync(userId?: number | string): Promise<BotLanguage | null> {
  if (!userId) return null;
  const key = String(userId);

  loadUserLanguagesSync();
  const cached = userLanguageCache.get(key);
  if (cached) return cached;

  // If not in local cache, query Supabase cloud storage (never lost across Vercel deployments)
  const sb = getSupabase();
  if (sb && Date.now() - lastSupabaseFetch > 10_000) {
    try {
      lastSupabaseFetch = Date.now();
      const { data, error } = await sb
        .from('system_settings')
        .select('site_name')
        .eq('id', 'telegram_user_langs')
        .single();

      if (!error && data?.site_name) {
        const parsed = JSON.parse(data.site_name);
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            if (['ug', 'ar', 'tr', 'en', 'uz', 'ru'].includes(v as string)) {
              userLanguageCache.set(String(k), v as BotLanguage);
            }
          }
          persistUserLanguagesLocal();
          return userLanguageCache.get(key) || null;
        }
      }
    } catch (e: any) {
      console.warn('Supabase getUserLanguageAsync notice:', e?.message);
    }
  }

  return userLanguageCache.get(key) || null;
}

export function getUserLanguage(userId?: number | string): BotLanguage | null {
  if (!userId) return null;
  loadUserLanguagesSync();
  return userLanguageCache.get(String(userId)) || null;
}

export function hasUserChosenLanguage(userId?: number | string): boolean {
  return getUserLanguage(userId) !== null;
}

export async function setUserLanguageAsync(userId: number | string, lang: BotLanguage): Promise<void> {
  const key = String(userId);
  loadUserLanguagesSync();
  userLanguageCache.set(key, lang);
  persistUserLanguagesLocal();

  const sb = getSupabase();
  if (sb) {
    try {
      const obj: Record<string, string> = {};
      userLanguageCache.forEach((v, k) => {
        obj[k] = v;
      });
      await sb.from('system_settings').upsert({
        id: 'telegram_user_langs',
        site_name: JSON.stringify(obj),
        admin_pin: 'LANGS_BACKUP',
        shamcash_address: 'META',
        whatsapp_number: 'META',
        telegram_username: 'META',
      });
    } catch (err: any) {
      console.warn('Supabase setUserLanguageAsync catch:', err?.message);
    }
  }
}

export function setUserLanguage(userId: number | string, lang: BotLanguage): void {
  setUserLanguageAsync(userId, lang).catch(() => {});
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
 * Telegram Premium Animated Custom Emoji Map
 * When an ID is set, outputs <tg-emoji emoji-id="...">char</tg-emoji>.
 * When no ID or empty, gracefully falls back to the native Unicode emoji.
 */
export const ANIMATED_EMOJI_IDS: Record<string, string> = {
  wave: '', // waving hand 👋
  sparkles: '', // sparkles ✨
  diamond: '', // diamond 💎
  fire: '', // fire 🔥
  zap: '', // lightning ⚡
  cart: '', // cart 🛒
  crown: '', // crown 👑
  check: '', // checkmark ✅
};

export function tgEmoji(name: string, fallbackChar: string): string {
  const id = ANIMATED_EMOJI_IDS[name];
  if (id && id.trim()) {
    return `<tg-emoji emoji-id="${id.trim()}">${fallbackChar}</tg-emoji>`;
  }
  return fallbackChar;
}

/**
 * Text strings across all 6 languages
 */
export const BOT_I18N = {
  welcome: {
    ug: (_name: string) => `
${tgEmoji('wave', '👋')} <b>ئەسسالامۇ ئەلەيكۇم AUTO CASH بوت سۇپىمىزغا كەلگىنىڭىزنى قىزغىن قارشى ئالىمىز !!!</b>

${tgEmoji('sparkles', '✨')} سېتىۋېلىش ئۈچۈن تۆۋەندىكى تاللاشتىن بىرىنى كۆرۈڭ:
`.trim(),

    ar: (_name: string) => `
${tgEmoji('wave', '👋')} <b>أهلاً وسهلاً بك في منصة بوت AUTO CASH !!!</b>

${tgEmoji('sparkles', '✨')} يرجى اختيار وسيلة التسوق المفضلة لديك أدناه:
`.trim(),

    tr: (_name: string) => `
${tgEmoji('wave', '👋')} <b>AUTO CASH Bot Platformuna Hoş Geldiniz !!!</b>

${tgEmoji('sparkles', '✨')} Lütfen aşağıdaki seçeneklerden size uygun olanı seçin:
`.trim(),

    en: (_name: string) => `
${tgEmoji('wave', '👋')} <b>Welcome to AUTO CASH Official Bot Platform !!!</b>

${tgEmoji('sparkles', '✨')} Please choose your preferred shopping method below:
`.trim(),

    uz: (_name: string) => `
${tgEmoji('wave', '👋')} <b>AUTO CASH bot platformasiga xush kelibsiz !!!</b>

${tgEmoji('sparkles', '✨')} Quyidagi variantlardan oʻzingizga qulayini tanlang:
`.trim(),

    ru: (_name: string) => `
${tgEmoji('wave', '👋')} <b>Добро пожаловать на платформу бота AUTO CASH !!!</b>

${tgEmoji('sparkles', '✨')} Пожалуйста, выберите подходящий вариант покупки ниже:
`.trim(),
  },

  // Main Store Keyboard labels matching user design template
  storeButtons: {
    webApp: {
      ug: '🌐 1- توربەتكە كىرىش',
      ar: '🌐 1- الدخول إلى الموقع',
      tr: '🌐 1- Web Sitesine Giriş',
      en: '🌐 1- Open Web Store',
      uz: '🌐 1- Saytga kirish',
      ru: '🌐 1- Войти на сайт',
    },
    botDashboard: {
      ug: '🛒 2- بوتتا سېتىۋېلىش',
      ar: '🛒 2- الشراء عبر البوت',
      tr: '🛒 2- Bot ile Satın Al',
      en: '🛒 2- Shop via Bot',
      uz: '🛒 2- Bot orqali sotib olish',
      ru: '🛒 2- Покупка через бота',
    },
    shopCategories: {
      ug: '🛒 مەھسۇلاتلار دۇكىنى',
      ar: '🛒 متجر المنتجات',
      tr: '🛒 Ürünler Mağazası',
      en: '🛒 Products Store',
      uz: '🛒 Mahsulotlar doʻkoni',
      ru: '🛒 Каталог товаров',
    },
    myAccount: {
      ug: '👤 شەخسىي ھېساباتىم',
      ar: '👤 حسابي الشخصي',
      tr: '👤 Hesabım',
      en: '👤 My Account',
      uz: '👤 Shaxsiy hisobim',
      ru: '👤 Мой профиль',
    },
    deposit: {
      ug: '💳 پۇل قاچىلاش',
      ar: '💳 شحن الرصيد',
      tr: '💳 Bakiye Yükle',
      en: '💳 Deposit Funds',
      uz: '💳 Balans toʻldirish',
      ru: '💳 Пополнить баланс',
    },
    services: {
      ug: '👨‍💻 مۇلازىمەت سەھىپىسى',
      ar: '👨‍💻 قسم الخدمات',
      tr: '👨‍💻 Hizmetler Bölümü',
      en: '👨‍💻 Services & Rates',
      uz: '👨‍💻 Xizmatlar boʻlimi',
      ru: '👨‍💻 Раздел услуг',
    },
    trackOrders: {
      ug: '📬 زاكازلىرىم',
      ar: '📬 طلباتي',
      tr: '📬 Siparişlerim',
      en: '📬 My Orders',
      uz: '📬 Buyurtmalarim',
      ru: '📬 Мои заказы',
    },
    feedback: {
      ug: '✍️ پىكىر-تەكلىپ',
      ar: '✍️ الاقتراحات والملاحظات',
      tr: '✍️ Görüş & Öneri',
      en: '✍️ Feedback & Suggestions',
      uz: '✍️ Fikr va takliflar',
      ru: '✍️ Отзывы и предложения',
    },
    contactAdmin: {
      ug: '📞 باشقۇرغۇچى بىلەن ئالاقە',
      ar: '📞 تواصل مع الإدارة',
      tr: '📞 Yönetici ile İletişim',
      en: '📞 Contact Support',
      uz: '📞 Administrator bilan aloqa',
      ru: '📞 Связь с администратором',
    },
    guide: {
      ug: '📖 ئىشلىتىش قوللانمىسى',
      ar: '📖 دليل الاستخدام',
      tr: '📖 Kullanım Kılavuzu',
      en: '📖 User Guide',
      uz: '📖 Qoʻllanma',
      ru: '📖 Инструкция',
    },
    changeLanguage: {
      ug: '🌐 تىل تاللاش / Language',
      ar: '🌐 اختيار اللغة / Language',
      tr: '🌐 Dil Seçimi / Language',
      en: '🌐 Language / تىل تاللاش',
      uz: '🌐 Tilni tanlash / Language',
      ru: '🌐 Выбор языка / Language',
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
    download: {
      ug: '📲 ئەپ نۇسخىسى (APK) 📥',
      ar: '📲 تحميل التطبيق (APK) 📥',
      tr: '📲 Uygulamayı İndir (APK) 📥',
      en: '📲 Download APK 📥',
      uz: '📲 Ilovani yuklab olish (APK) 📥',
      ru: '📲 Скачать APK 📥',
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
      en: '💬✨ Customer Support 24/7 👨‍💻',
      uz: '💬✨ Mijozlarni qoʻllab-quvvatlash 👨‍💻',
      ru: '💬✨ Служба поддержки 24/7 👨‍💻',
    },
  },

  // 8-Button In-Bot Shopping Dashboard
  botDashboard: {
    deposit: {
      ug: '💳 1- پۇل قاچىلاش',
      ar: '💳 1- شحن الرصيد',
      tr: '💳 1- Bakiye Yükle',
      en: '💳 1- Deposit Funds',
      uz: '💳 1- Balans toʻldirish',
      ru: '💳 1- Пополнить баланс',
    },
    balance: {
      ug: '💰 2- قالدۇقۇم',
      ar: '💰 2- رصيدي',
      tr: '💰 2- Bakiyem',
      en: '💰 2- My Balance',
      uz: '💰 2- Mening balansim',
      ru: '💰 2- Мой баланс',
    },
    shop: {
      ug: '🛒 3- دۇكان',
      ar: '🛒 3- المتجر',
      tr: '🛒 3- Mağaza',
      en: '🛒 3- Shop',
      uz: '🛒 3- Doʻkon',
      ru: '🛒 3- Каталог',
    },
    orders: {
      ug: '📬 4- زاكازلىرىم',
      ar: '📬 4- طلباتي',
      tr: '📬 4- Siparişlerim',
      en: '📬 4- My Orders',
      uz: '📬 4- Buyurtmalarim',
      ru: '📬 4- Моي заказы',
    },
    purchases: {
      ug: '📦 5- سېتىۋالغانلىرىم',
      ar: '📦 5- مشترياتي',
      tr: '📦 5- Satın Aldıklarım',
      en: '📦 5- My Purchases',
      uz: '📦 5- Xaridlarim',
      ru: '📦 5- Мои покупки',
    },
    language: {
      ug: '🌐 6- تىل تاللاش',
      ar: '🌐 6- تغيير اللغة',
      tr: '🌐 6- Dil Seçimi',
      en: '🌐 6- Language',
      uz: '🌐 6- Tilni tanlash',
      ru: '🌐 6- Выбор языка',
    },
    support: {
      ug: '📞 7- ئالاقىلىشىش',
      ar: '📞 7- الدعم والتواصل',
      tr: '📞 7- İletişim & Destek',
      en: '📞 7- Contact Support',
      uz: '📞 7- Aloqa va yordam',
      ru: '📞 7- Поддержка',
    },
    channel: {
      ug: '📢 8- قانالغا كىرىش',
      ar: '📢 8- القناة الرسمية',
      tr: '📢 8- Resmi Kanal',
      en: '📢 8- Official Channel',
      uz: '📢 8- Rasmiy kanal',
      ru: '📢 8- Наш канал',
    },
    backToMain: {
      ug: '🔙 باش بەتكە قايتىش',
      ar: '🔙 العودة للرئيسية',
      tr: '🔙 Ana Menüye Dön',
      en: '🔙 Back to Home',
      uz: '🔙 Bosh sahifaga qaytish',
      ru: '🔙 Главное меню',
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
    wifi: {
      ug: '📶 1- Wi-Fi كارتىلار',
      ar: '📶 1- بطاقات واي فاي',
      tr: '📶 1- Wi-Fi Kartları',
      en: '📶 1- Wi-Fi Cards',
      uz: '📶 1- Wi-Fi kartalar',
      ru: '📶 1- Карты Wi-Fi',
    },
    cards: {
      ug: '💳 2- كارتىلارغا پۇل قاچىلاش',
      ar: '💳 2- شحن بطاقات الهاتف',
      tr: '💳 2- Hat Yükleme',
      en: '💳 2- Mobile Top-up',
      uz: '💳 2- Karta toʻldirish',
      ru: '💳 2- Пополнение связи',
    },
    vip_subs: {
      ug: '⭐️ 3- ئەزالىق ئېچىش',
      ar: '⭐️ 3- تفعيل الاشتراكات VIP',
      tr: '⭐️ 3- VIP Abonelikler',
      en: '⭐️ 3- VIP Subscriptions',
      uz: '⭐️ 3- VIP obunalar',
      ru: '⭐️ 3- VIP подписки',
    },
    apps: {
      ug: '💻 4- ئەزالىق ئېلىش (ئەپلەر)',
      ar: '💻 4- اشتراكات التطبيقات',
      tr: '💻 4- Uygulama Abonelikleri',
      en: '💻 4- App Subscriptions',
      uz: '💻 4- Ilova obunalari',
      ru: '💻 4- Подписки на приложения',
    },
    games: {
      ug: '🎮 5- ئويۇنلار',
      ar: '🎮 5- الألعاب والشحن الفوري',
      tr: '🎮 5- Oyunlar & Pin',
      en: '🎮 5- Games Top-up',
      uz: '🎮 5- Oʻyinlar',
      ru: '🎮 5- Игры и донат',
    },
    numbers: {
      ug: '📱 6- مەۋھۇم نومۇر',
      ar: '📱 6- أرقام وهمية',
      tr: '📱 6- Sanal Numaralar',
      en: '📱 6- Virtual Numbers',
      uz: '📱 6- Virtual raqamlar',
      ru: '📱 6- Виртуальные номера',
    },
    backToDashboard: {
      ug: '🔙 تىزىملىككە قايتىش',
      ar: '🔙 العودة للقائمة',
      tr: '🔙 Menüye Dön',
      en: '🔙 Back to Menu',
      uz: '🔙 Menyuga qaytish',
      ru: '🔙 Назад в меню',
    },
    backToMain: {
      ug: '🔙 باش بەتكە قايتىش',
      ar: '🔙 العودة للرئيسية',
      tr: '🔙 Ana Menüye Dön',
      en: '🔙 Back to Home',
      uz: '🔙 Bosh sahifaga qaytish',
      ru: '🔙 Главное меню',
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
