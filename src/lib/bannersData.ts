export interface PromoSlideData {
  id: string;
  category: string;
  image: string;
  title: Record<string, string> | string;
  subtitle: Record<string, string> | string;
  badge: Record<string, string> | string;
  linkText: Record<string, string> | string;
  tag: Record<string, string> | string;
  targetUrl?: string;
  enabled?: boolean;
  order?: number;
}

export const DEFAULT_PROMO_SLIDES: PromoSlideData[] = [
  {
    id: 'slide-1',
    category: 'games',
    image: '/images/services/pubg_uc_robot.webp',
    title: {
      ug: 'PUBG Mobile UC ۋە Royale Pass تولۇقلاش',
      en: 'PUBG Mobile UC & Royale Pass Instant Top-up',
      ar: 'شحن شدات ببجي موبايل PUBG UC ورويال باس',
      tr: 'PUBG Mobile UC ve Royale Pass Anında Yükleme',
      uz: 'PUBG Mobile UC va Royale Pass tezkor to‘ldirish',
      ru: 'Мгновенное пополнение PUBG Mobile UC и Royale Pass',
    },
    subtitle: {
      ug: 'ئويۇنچى ID نومۇرىڭىز بىلەن 10 سېكۇنتتا بىۋاسىتە ھېساباتقا كىرىدۇ',
      en: 'Direct delivery to your game account via Player ID in seconds',
      ar: 'شحن فوري ومباشر إلى حسابك بالمعرف Player ID خلال ثوانٍ معدودة',
      tr: 'Oyuncu ID numaranız ile saniyeler içinde doğrudan hesabınıza teslimat',
      uz: 'O‘yinchi ID raqami orqali bir necha soniyada to‘g‘ridan-to‘g‘ri hisobga tushadi',
      ru: 'Прямое зачисление на игровой аккаунт по Player ID за считанные секунды',
    },
    badge: {
      ug: '⚡ ئەڭ قىزىق ئويۇن',
      en: '⚡ Most Popular Game',
      ar: '⚡ اللعبة الأكثر طلباً',
      tr: '⚡ En Popüler Oyun',
      uz: '⚡ Eng ommabop o‘yin',
      ru: '⚡ Топовая игра',
    },
    linkText: {
      ug: 'دەرھال قاچىلاش ⚡',
      en: 'Top-up Now ⚡',
      ar: 'شحن فوري ⚡',
      tr: 'Hemen Yükle ⚡',
      uz: 'Hozir to‘ldirish ⚡',
      ru: 'Пополнить сейчас ⚡',
    },
    tag: {
      ug: 'ئويۇن بۆلىكى',
      en: 'Games Section',
      ar: 'قسم الألعاب',
      tr: 'Oyun Bölümü',
      uz: 'O‘yinlar bo‘limi',
      ru: 'Раздел игр',
    },
    enabled: true,
    order: 1,
  },
  {
    id: 'slide-2',
    category: 'ai',
    image: '/images/services/chatgpt.webp',
    title: {
      ug: 'ChatGPT Plus & Claude Pro ئايلىق / يىللىق',
      en: 'ChatGPT Plus & Claude Pro Subscriptions',
      ar: 'اشتراكات ChatGPT Plus و Claude Pro الشهرية والسنوية',
      tr: 'ChatGPT Plus ve Claude Pro Abonelikleri',
      uz: 'ChatGPT Plus va Claude Pro obunalari',
      ru: 'Подписки ChatGPT Plus и Claude Pro',
    },
    subtitle: {
      ug: 'GPT-4o Canvas، Claude 3.5 Sonnet چەكلىمىسىز يۇقىرى ئىقتىدار',
      en: 'Unlimited access to GPT-4o, Claude 3.5 Sonnet & top AI models',
      ar: 'وصول غير محدود لأحدث نماذج الذكاء الاصطناعي GPT-4o و Claude 3.5',
      tr: 'GPT-4o, Claude 3.5 Sonnet ve en iyi yapay zeka modellerine sınırsız erişim',
      uz: 'GPT-4o, Claude 3.5 Sonnet va ilg‘or AI modellariga cheksiz kirish',
      ru: 'Безлимитный доступ к GPT-4o, Claude 3.5 Sonnet и лучшим нейросетям',
    },
    badge: {
      ug: '🤖 سۈنئىي ئەقىل',
      en: '🤖 AI Premium',
      ar: '🤖 ذكاء اصطناعي',
      tr: '🤖 Yapay Zeka',
      uz: '🤖 Sun’iy intellekt',
      ru: '🤖 ИИ Премиум',
    },
    linkText: {
      ug: 'ھېسابات ئېچىش 🤖',
      en: 'Get Account 🤖',
      ar: 'تفعيل الحساب 🤖',
      tr: 'Hesap Al 🤖',
      uz: 'Hisob olish 🤖',
      ru: 'Получить аккаунт 🤖',
    },
    tag: {
      ug: 'AI ئابۇنىتلىقى',
      en: 'AI Subscriptions',
      ar: 'اشتراكات الذكاء الاصطناعي',
      tr: 'AI Abonelikleri',
      uz: 'AI obunalari',
      ru: 'Подписки на ИИ',
    },
    enabled: true,
    order: 2,
  },
  {
    id: 'slide-3',
    category: 'numbers',
    image: '/images/services/telegram.webp',
    title: {
      ug: 'مەۋھۇم نومۇر (SMS) — Telegram, WhatsApp, TikTok',
      en: 'Virtual Numbers (SMS) for Telegram & WhatsApp',
      ar: 'أرقام وهمية لتفعيل تيليجرام وواتساب وتيك توك',
      tr: 'Telegram ve WhatsApp için Sanal Numaralar (SMS)',
      uz: 'Telegram va WhatsApp uchun virtual raqamlar (SMS)',
      ru: 'Виртуальные номера (СМС) для Telegram и WhatsApp',
    },
    subtitle: {
      ug: 'خەلقئارالىق نومۇرلار بىلەن تىزىملىتىش، قىسقا ئۇچۇر كودىنى دەرھال تاپشۇرۇۋېلىش',
      en: 'International numbers for instant OTP verification and registration',
      ar: 'أرقام دولية مضمونة لاستقبال كود التحقق OTP بشكل فوري',
      tr: 'Anında OTP onay kodu ve kayıt için uluslararası numaralar',
      uz: 'Tezkor OTP tasdiqlash kodi va ro‘yxatdan o‘tish uchun xalqaro raqamlar',
      ru: 'Международные номера для мгновенного получения СМС с кодом подтверждения',
    },
    badge: {
      ug: '📲 مەۋھۇم نومۇر',
      en: '📲 Virtual Numbers',
      ar: '📲 أرقام وهمية',
      tr: '📲 Sanal Numara',
      uz: '📲 Virtual raqam',
      ru: '📲 Виртуальные номера',
    },
    linkText: {
      ug: 'نومۇر ئېلىش 📲',
      en: 'Get Number 📲',
      ar: 'شراء رقم 📲',
      tr: 'Numara Al 📲',
      uz: 'Raqam olish 📲',
      ru: 'Купить номер 📲',
    },
    tag: {
      ug: 'OTP كاپالىتى',
      en: 'Guaranteed OTP',
      ar: 'ضمان التحقق OTP',
      tr: 'Garantili OTP',
      uz: 'Kafolatlangan OTP',
      ru: 'Гарантия OTP',
    },
    enabled: true,
    order: 3,
  },
  {
    id: 'slide-4',
    category: 'cards',
    image: '/images/services/visa_card.webp',
    title: {
      ug: 'خەلقئارالىق مەۋھۇم ۋىزا كارتىلار (VCC) & Steam, Apple',
      en: 'Virtual Visa Cards (VCC) & Steam, Apple Cards',
      ar: 'بطاقات دفع إلكتروني فيزا VCC وبطاقات ستيم وآبل',
      tr: 'Sanal Visa Kartları (VCC) ve Steam, Apple Kartları',
      uz: 'Virtual Visa kartalari (VCC) hamda Steam, Apple kartalari',
      ru: 'Виртуальные карты Visa (VCC), карты Steam и Apple',
    },
    subtitle: {
      ug: 'چەتئەل ئەپلىرىگە پۇل تۆلەش، Google Play، PlayStation ۋە Steam كودلىرى',
      en: 'Pay for international services, Google Play, PlayStation & Steam',
      ar: 'دفع اشتراكات التطبيقات العالمية، وبطاقات بلايستيشن وجوجل بلاي',
      tr: 'Yurt dışı abonelik ödemeleri, Google Play, PlayStation ve Steam kodları',
      uz: 'Xorijiy ilovalarga to‘lov, Google Play, PlayStation va Steam kodlari',
      ru: 'Оплата зарубежных сервисов, коды пополнения Google Play, PlayStation и Steam',
    },
    badge: {
      ug: '✨ رەقەملىك كارتىلار',
      en: '✨ Gift Cards & VCC',
      ar: '✨ بطاقات رقمية',
      tr: '✨ Hediye Kartları ve VCC',
      uz: '✨ Sovg‘a kartalari va VCC',
      ru: '✨ Цифровые карты и VCC',
    },
    linkText: {
      ug: 'كارتا تاللاش 💳',
      en: 'Select Card 💳',
      ar: 'اختر البطاقة 💳',
      tr: 'Kart Seç 💳',
      uz: 'Karta tanlash 💳',
      ru: 'Выбрать карту 💳',
    },
    tag: {
      ug: 'كاپالەتلىك كود',
      en: 'Verified Codes',
      ar: 'أكواد مضمونة',
      tr: 'Garantili Kodlar',
      uz: 'Kafolatlangan kodlar',
      ru: 'Проверенные коды',
    },
    enabled: true,
    order: 4,
  },
];
