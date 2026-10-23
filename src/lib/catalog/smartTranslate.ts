/**
 * Smart automatic translation dictionary for provider products, packages, and input fields.
 * Handles English and Arabic technical/gaming/telecom terms and translates them into
 * natural Uyghur, English, Arabic, Turkish, Uzbek, and Russian.
 */

export type SupportedLang = 'ug' | 'en' | 'ar' | 'tr' | 'uz' | 'ru';

interface TranslationRule {
  regex: RegExp;
  ug: string | ((match: string, ...groups: string[]) => string);
  en?: string | ((match: string, ...groups: string[]) => string);
  ar?: string | ((match: string, ...groups: string[]) => string);
  tr?: string | ((match: string, ...groups: string[]) => string);
  uz?: string | ((match: string, ...groups: string[]) => string);
  ru?: string | ((match: string, ...groups: string[]) => string);
}

const RULES: TranslationRule[] = [
  // 0. Arabic Game & Subscriptions Terms
  {
    regex: /(\d+)\s*(?:شدة|شدات)/gi,
    ug: (_m, d) => `${d} UC (شەدەن)`,
    en: (_m, d) => `${d} UC`,
    ar: (_m, d) => `${d} شدة`,
    tr: (_m, d) => `${d} UC`,
    uz: (_m, d) => `${d} UC`,
    ru: (_m, d) => `${d} UC`,
  },
  {
    regex: /(\d+)\s*(?:جوهرة|جواهر)/gi,
    ug: (_m, d) => `${d} ئالماس (Diamonds)`,
    en: (_m, d) => `${d} Diamonds`,
    ar: (_m, d) => `${d} جوهرة`,
    tr: (_m, d) => `${d} Elmas`,
    uz: (_m, d) => `${d} Olmos`,
    ru: (_m, d) => `${d} Алмазов`,
  },
  {
    regex: /(\d+)\s*كرستال/gi,
    ug: (_m, d) => `${d} خرۇستال (Crystals)`,
    en: (_m, d) => `${d} Crystals`,
    ar: (_m, d) => `${d} كريستال`,
    tr: (_m, d) => `${d} Kristal`,
    uz: (_m, d) => `${d} Kristal`,
    ru: (_m, d) => `${d} Кристаллов`,
  },
  {
    regex: /عضوية\s*اسبوعية/gi,
    ug: 'ھەپتىلىك ئەزالىق (Weekly)',
    en: 'Weekly Membership',
    ar: 'عضوية أسبوعية',
    tr: 'Haftalık Üyelik',
    uz: 'Haftalik a‘zolik',
    ru: 'Еженедельная подписка',
  },
  {
    regex: /عضوية\s*شهرية/gi,
    ug: 'ئايلىق ئەزالىق (Monthly)',
    en: 'Monthly Membership',
    ar: 'عضوية شهرية',
    tr: 'Aylık Üyelik',
    uz: 'Oylik a‘zolik',
    ru: 'Ежемесячная подписка',
  },
  {
    regex: /حساب\s*جاهز/gi,
    ug: 'تەييار ھېسابات',
    en: 'Ready Account',
    ar: 'حساب جاهز',
    tr: 'Hazır Hesap',
    uz: 'Tayyor hisob',
    ru: 'Готовый аккаунт',
  },
  {
    regex: /حساب\s*شخصي|حساب\s*خاص/gi,
    ug: 'خاس ھېسابات',
    en: 'Private Account',
    ar: 'حساب شخصي',
    tr: 'Özel Hesap',
    uz: 'Shaxsiy hisob',
    ru: 'Личный аккаунт',
  },
  {
    regex: /حساب\s*مشترك/gi,
    ug: 'ئورتاق ھېسابات',
    en: 'Shared Account',
    ar: 'حساب مشترك',
    tr: 'Ortak Hesap',
    uz: 'Umumiy hisob',
    ru: 'Общий аккаунт',
  },
  {
    regex: /ضمان\s*كامل/gi,
    ug: 'تولۇق كاپالەتلىك',
    en: 'Full Warranty',
    ar: 'ضمان كامل',
    tr: 'Tam Garanti',
    uz: 'To‘liq kafolat',
    ru: 'Полная гарантия',
  },
  {
    regex: /(\d+)\s*(?:اشهر|أشهر|شهر)/gi,
    ug: (_m, d) => `${d} ئايلىق`,
    en: (_m, d) => `${d} Months`,
    ar: (_m, d) => `${d} أشهر`,
    tr: (_m, d) => `${d} Aylık`,
    uz: (_m, d) => `${d} Oylik`,
    ru: (_m, d) => `${d} Мес.`,
  },
  {
    regex: /(\d+)\s*(?:سنة|سنوات)/gi,
    ug: (_m, d) => `${d} يىللىق`,
    en: (_m, d) => `${d} Years`,
    ar: (_m, d) => `${d} سنوات`,
    tr: (_m, d) => `${d} Yıllık`,
    uz: (_m, d) => `${d} Yillik`,
    ru: (_m, d) => `${d} Лет`,
  },
  {
    regex: /روبوت/gi,
    ug: 'ئاپتوماتىك',
    en: 'Auto Bot',
    ar: 'تلقائي',
    tr: 'Otomatik',
    uz: 'Avtomatik',
    ru: 'Автобот',
  },
  // 1. Refund & policies
  {
    regex: /[-–—]?\s*\bno\s+refunds?\b/gi,
    ug: ' (قايتۇرۇلمايدۇ)',
    en: ' (No Refund)',
    ar: ' (غير قابل للاسترداد)',
    tr: ' (İade Edilmez)',
    uz: ' (Qaytarilmaydi)',
    ru: ' (Без возврата)',
  },
  {
    regex: /\bnon[-–\s]refundable\b/gi,
    ug: ' (قايتۇرۇلمايدۇ)',
    en: ' (Non-refundable)',
    ar: ' (غير قابل للاسترداد)',
    tr: ' (İade Edilemez)',
    uz: ' (Qaytarilmaydi)',
    ru: ' (Невозвратный)',
  },
  {
    regex: /[-–—]?\s*(?:بدون\s+استرجاع|لا\s+يسترد|غير\s+قابل\s+للاسترداد)/gi,
    ug: ' (قايتۇرۇلمايدۇ)',
    en: ' (No Refund)',
    ar: ' (غير قابل للاسترداد)',
    tr: ' (İade Edilmez)',
    uz: ' (Qaytarilmaydi)',
    ru: ' (Без возврата)',
  },
  {
    regex: /\bno\s+ban\b|\bsafe\b/gi,
    ug: 'بىخەتەر',
    en: 'Safe / No Ban',
    ar: 'آمن بدون حظر',
    tr: 'Güvenli / Bansız',
    uz: 'Xavfsiz / Bansiz',
    ru: 'Безопасно / Без бана',
  },

  // 2. Working hours & connectivity
  {
    regex: /\b24[x/×]7\s+online\b/gi,
    ug: '24 سائەت توردا',
    en: '24/7 Online',
    ar: 'متاح 24/7 أونلاين',
    tr: '7/24 Çevrim içi',
    uz: '24/7 Onlayn',
    ru: '24/7 Онлайн',
  },
  {
    regex: /\b24[x/×]7\b/gi,
    ug: '24 سائەت',
    en: '24/7',
    ar: '24/7',
    tr: '7/24',
    uz: '24/7',
    ru: '24/7',
  },
  {
    regex: /\binstant\s+delivery\b/gi,
    ug: 'دەرھال يەتكۈزۈش',
    en: 'Instant Delivery',
    ar: 'تسليم فوري',
    tr: 'Anında Teslimat',
    uz: 'Tezkor yetkazib berish',
    ru: 'Мгновенная доставка',
  },
  {
    regex: /\bfast\s+delivery\b/gi,
    ug: 'تېز يەتكۈزۈش',
    en: 'Fast Delivery',
    ar: 'تسليم سريع',
    tr: 'Hızlı Teslimat',
    uz: 'Tez yetkazib berish',
    ru: 'Быстрая доставка',
  },
  {
    regex: /\binstant\b/gi,
    ug: 'دەرھال',
    en: 'Instant',
    ar: 'فوري',
    tr: 'Anında',
    uz: 'Tezkor',
    ru: 'Мгновенно',
  },

  // 3. Login & Automation actions
  {
    regex: /\bsupport\s+auto\s+login\b/gi,
    ug: 'ئاپتوماتىك كىرىشنى قوللايدۇ',
    en: 'Supports Auto Login',
    ar: 'يدعم تسجيل الدخول التلقائي',
    tr: 'Otomatik Girişi Destekler',
    uz: 'Avtomatik kirishni qo‘llab-quvvatlaydi',
    ru: 'Поддерживает авто-вход',
  },
  {
    regex: /\bauto\s+login\s+tool\b/gi,
    ug: 'ئاپتوماتىك كىرىش قورالى',
    en: 'Auto Login Tool',
    ar: 'أداة تسجيل دخول تلقائي',
    tr: 'Otomatik Giriş Aracı',
    uz: 'Avtomatik kirish vositasi',
    ru: 'Инструмент авто-входа',
  },
  {
    regex: /\bauto\s+login\b/gi,
    ug: 'ئاپتوماتىك كىرىش',
    en: 'Auto Login',
    ar: 'تسجيل دخول تلقائي',
    tr: 'Otomatik Giriş',
    uz: 'Avtomatik kirish',
    ru: 'Авто-вход',
  },
  {
    regex: /\bqc\s+auth\b/gi,
    ug: 'Qc دەلىللەش',
    en: 'Qc Auth',
    ar: 'توثيق Qc',
    tr: 'Qc Doğrulama',
    uz: 'Qc Tasdiqlash',
    ru: 'Аутентификация Qc',
  },
  {
    regex: /\bauth\b|\bauthentication\b/gi,
    ug: 'دەلىللەش',
    en: 'Auth',
    ar: 'توثيق',
    tr: 'Doğrulama',
    uz: 'Tasdiqlash',
    ru: 'Аутентификация',
  },

  // 4. Durations & periods
  {
    regex: /\b1\s*(?:year|yr)\b/gi,
    ug: '1 يىللىق',
    en: '1 Year',
    ar: 'سنة واحدة',
    tr: '1 Yıllık',
    uz: '1 Yillik',
    ru: '1 Год',
  },
  {
    regex: /(\d+)\s*(?:years|yrs)\b/gi,
    ug: (_m, d) => `${d} يىللىق`,
    en: (_m, d) => `${d} Years`,
    ar: (_m, d) => `${d} سنوات`,
    tr: (_m, d) => `${d} Yıllık`,
    uz: (_m, d) => `${d} Yillik`,
    ru: (_m, d) => `${d} Лет`,
  },
  {
    regex: /\b1\s*(?:month|mo)\b/gi,
    ug: '1 ئايلىق',
    en: '1 Month',
    ar: 'شهر واحد',
    tr: '1 Aylık',
    uz: '1 Oylik',
    ru: '1 Месяц',
  },
  {
    regex: /(\d+)\s*(?:months|mo)\b/gi,
    ug: (_m, d) => `${d} ئايلىق`,
    en: (_m, d) => `${d} Months`,
    ar: (_m, d) => `${d} أشهر`,
    tr: (_m, d) => `${d} Aylık`,
    uz: (_m, d) => `${d} Oylik`,
    ru: (_m, d) => `${d} Мес.`,
  },
  {
    regex: /\b1\s*week\b/gi,
    ug: '1 ھەپتىلىك',
    en: '1 Week',
    ar: 'أسبوع واحد',
    tr: '1 Haftalık',
    uz: '1 Haftalik',
    ru: '1 Неделя',
  },
  {
    regex: /(\d+)\s*weeks\b/gi,
    ug: (_m, d) => `${d} ھەپتىلىك`,
    en: (_m, d) => `${d} Weeks`,
    ar: (_m, d) => `${d} أسابيع`,
    tr: (_m, d) => `${d} Haftalık`,
    uz: (_m, d) => `${d} Haftalik`,
    ru: (_m, d) => `${d} Нед.`,
  },
  {
    regex: /\b1\s*day\b/gi,
    ug: '1 كۈنلۈك',
    en: '1 Day',
    ar: 'يوم واحد',
    tr: '1 Günlük',
    uz: '1 Kunlik',
    ru: '1 День',
  },
  {
    regex: /(\d+)\s*days\b/gi,
    ug: (_m, d) => `${d} كۈنلۈك`,
    en: (_m, d) => `${d} Days`,
    ar: (_m, d) => `${d} أيام`,
    tr: (_m, d) => `${d} Günlük`,
    uz: (_m, d) => `${d} Kunlik`,
    ru: (_m, d) => `${d} Дней`,
  },
  {
    regex: /\blifetime\b/gi,
    ug: 'مەڭگۈلۈك',
    en: 'Lifetime',
    ar: 'مدى الحياة',
    tr: 'Ömür Boyu',
    uz: 'Umrbod',
    ru: 'Бессрочно',
  },
  {
    regex: /لمدة\s*سنة/gi,
    ug: '1 يىللىق',
    en: 'For 1 Year',
    ar: 'لمدة سنة',
    tr: '1 Yıllık',
    uz: '1 Yillik',
    ru: 'На 1 Год',
  },
  {
    regex: /لمدة\s*شهر/gi,
    ug: '1 ئايلىق',
    en: 'For 1 Month',
    ar: 'لمدة شهر',
    tr: '1 Aylık',
    uz: '1 Oylik',
    ru: 'На 1 Месяц',
  },
  {
    regex: /لمدة\s*(\d+)\s*أشهر/gi,
    ug: (_m, d) => `${d} ئايلىق`,
    en: (_m, d) => `For ${d} Months`,
    ar: (_m, d) => `لمدة ${d} أشهر`,
    tr: (_m, d) => `${d} Aylık`,
    uz: (_m, d) => `${d} Oylik`,
    ru: (_m, d) => `На ${d} Мес.`,
  },
  {
    regex: /لمدة\s*(\d+)\s*يوم/gi,
    ug: (_m, d) => `${d} كۈنلۈك`,
    en: (_m, d) => `For ${d} Days`,
    ar: (_m, d) => `لمدة ${d} أيام`,
    tr: (_m, d) => `${d} Günlük`,
    uz: (_m, d) => `${d} Kunlik`,
    ru: (_m, d) => `На ${d} Дней`,
  },

  // 5. Licenses, Tools & Hardware
  {
    regex: /without\s+box\s*-\s*بدون\s+بوكس|without\s+box|بدون\s+بوكس/gi,
    ug: 'Box سىز',
    en: 'Without Box',
    ar: 'بدون بوكس',
    tr: 'Kutusuz',
    uz: 'Qutisiz',
    ru: 'Без бокса',
  },
  {
    regex: /\bdigital\s+licens[e]?\b/gi,
    ug: 'رەقەملىك ئىجازەتنامە',
    en: 'Digital License',
    ar: 'ترخيص رقمي',
    tr: 'Dijital Lisans',
    uz: 'Raqamli litsenziya',
    ru: 'Цифровая лицензия',
  },
  {
    regex: /\bonline\s+account\s+activation\b/gi,
    ug: 'توردىكى ھېسابات ئاكتىپلاش',
    en: 'Online Account Activation',
    ar: 'تفعيل حساب أونلاين',
    tr: 'Çevrim içi Hesap Aktivasyonu',
    uz: 'Onlayn hisob faollashtirish',
    ru: 'Онлайн активация аккаунта',
  },
  {
    regex: /\bactivation\s+renew(?:al)?\b/gi,
    ug: 'ئاكتىپلاش ۋە ئۇزارتىش',
    en: 'Activation Renewal',
    ar: 'تفعيل وتجديد',
    tr: 'Aktivasyon Yenileme',
    uz: 'Faollashtirish va yangilash',
    ru: 'Продление активации',
  },
  {
    regex: /\bactivation\b/gi,
    ug: 'ئاكتىپلاش',
    en: 'Activation',
    ar: 'تفعيل',
    tr: 'Aktivasyon',
    uz: 'Faollashtirish',
    ru: 'Активация',
  },
  {
    regex: /\brenewal\b|\brenew\b/gi,
    ug: 'ۋاقتىنى ئۇزارتىش',
    en: 'Renewal',
    ar: 'تجديد',
    tr: 'Yenileme',
    uz: 'Muddatini uzaytirish',
    ru: 'Продление',
  },
  {
    regex: /\bonline\s+tool\b/gi,
    ug: 'تور قورالى',
    en: 'Online Tool',
    ar: 'أداة أونلاين',
    tr: 'Çevrim içi Araç',
    uz: 'Onlayn vosita',
    ru: 'Онлайн инструмент',
  },
  {
    regex: /\bonline\b/gi,
    ug: 'توردا',
    en: 'Online',
    ar: 'أونلاين',
    tr: 'Çevrim içi',
    uz: 'Onlayn',
    ru: 'Онлайн',
  },
  {
    regex: /(?<![-a-zA-Z0-9])tools?\b/gi,
    ug: 'قورالى',
    en: 'Tool',
    ar: 'أداة',
    tr: 'Aracı',
    uz: 'Vositasi',
    ru: 'Инструмент',
  },
  {
    regex: /\blicense\b|\blicens\b/gi,
    ug: 'ئىجازەتنامە',
    en: 'License',
    ar: 'ترخيص',
    tr: 'Lisans',
    uz: 'Litsenziya',
    ru: 'Лицензия',
  },
  {
    regex: /\bschematics?\b/gi,
    ug: 'سىزما',
    en: 'Schematics',
    ar: 'مخططات',
    tr: 'Şemalar',
    uz: 'Sxemalar',
    ru: 'Схемы',
  },
  {
    regex: /\bexisting\s+user\b/gi,
    ug: 'كونا ئابۇنىت',
    en: 'Existing User',
    ar: 'مستخدم حالي',
    tr: 'Mevcut Kullanıcı',
    uz: 'Mavjud foydalanuvchi',
    ru: 'Действующий пользователь',
  },
  {
    regex: /\bnew\s+user\b/gi,
    ug: 'يېڭى ئابۇنىت',
    en: 'New User',
    ar: 'مستخدم جديد',
    tr: 'Yeni Kullanıcı',
    uz: 'Yangi foydalanuvchi',
    ru: 'Новый пользователь',
  },

  // 6. Charging, Currencies, Packages
  {
    regex: /\bdirect\s+(?:topup|recharge)\b/gi,
    ug: 'بىۋاسىتە قاچىلاش',
    en: 'Direct Top-up',
    ar: 'شحن مباشر',
    tr: 'Doğrudan Yükleme',
    uz: 'To‘g‘ridan-to‘g‘ri to‘ldirish',
    ru: 'Прямое пополнение',
  },
  {
    regex: /\btopup\b|\brecharge\b/gi,
    ug: 'قاچىلاش',
    en: 'Top-up',
    ar: 'شحن',
    tr: 'Yükleme',
    uz: 'To‘ldirish',
    ru: 'Пополнение',
  },
  {
    regex: /\bcredits?\b/gi,
    ug: 'كىرېدىت',
    en: 'Credits',
    ar: 'كريديت',
    tr: 'Kredi',
    uz: 'Kredit',
    ru: 'Кредиты',
  },
  {
    regex: /\bdiamonds?\b/gi,
    ug: 'ئالماس',
    en: 'Diamonds',
    ar: 'ألماس',
    tr: 'Elmas',
    uz: 'Olmos',
    ru: 'Алмазы',
  },
  {
    regex: /\bgems?\b/gi,
    ug: 'ياقۇت',
    en: 'Gems',
    ar: 'جواهر',
    tr: 'Mücevher',
    uz: 'Yoqut',
    ru: 'Кристаллы',
  },
  {
    regex: /\bcoins?\b|\bgold\b/gi,
    ug: 'تەڭگە',
    en: 'Coins',
    ar: 'عملات',
    tr: 'Jeton',
    uz: 'Tanga',
    ru: 'Монеты',
  },
  {
    regex: /\bgift\s+cards?\b/gi,
    ug: 'سوۋغات كارتىسى',
    en: 'Gift Card',
    ar: 'بطاقة هدايا',
    tr: 'Hediye Kartı',
    uz: 'Sovg‘a kartasi',
    ru: 'Подарочная карта',
  },
  {
    regex: /\bvouchers?\b/gi,
    ug: 'تالون',
    en: 'Voucher',
    ar: 'قسيمة',
    tr: 'Kupon',
    uz: 'Voucher',
    ru: 'Ваучер',
  },
  {
    regex: /\bpackages?\b|\bpacks?\b/gi,
    ug: 'بولاق',
    en: 'Pack',
    ar: 'باقة',
    tr: 'Paket',
    uz: 'Paket',
    ru: 'Пакет',
  },
  {
    regex: /\bunlimited\b/gi,
    ug: 'چەكسىز',
    en: 'Unlimited',
    ar: 'غير محدود',
    tr: 'Sınırsız',
    uz: 'Cheksiz',
    ru: 'Безлимитный',
  },
  {
    regex: /\bserver\b/gi,
    ug: 'مۇلازىمېتىر',
    en: 'Server',
    ar: 'سيرفر',
    tr: 'Sunucu',
    uz: 'Server',
    ru: 'Сервер',
  },
  {
    regex: /\bglobal\b/gi,
    ug: 'دۇنياۋى',
    en: 'Global',
    ar: 'عالمي',
    tr: 'Global',
    uz: 'Global',
    ru: 'Глобальный',
  },

  // 7. Arabic phrases
  {
    regex: /شحن\s+فوري/gi,
    ug: 'دەرھال قاچىلاش',
    en: 'Instant Top-up',
    ar: 'شحن فوري',
    tr: 'Anında Yükleme',
    uz: 'Tezkor to‘ldirish',
    ru: 'Мгновенное пополнение',
  },
  {
    regex: /شحن\s+مباشر/gi,
    ug: 'بىۋاسىتە قاچىلاش',
    en: 'Direct Top-up',
    ar: 'شحن مباشر',
    tr: 'Doğrudan Yükleme',
    uz: 'To‘g‘ridan-to‘g‘ri to‘ldirish',
    ru: 'Прямое пополнение',
  },
  {
    regex: /حساب\s+جاهز/gi,
    ug: 'تەييار ھېسابات',
    en: 'Ready Account',
    ar: 'حساب جاهز',
    tr: 'Hazır Hesap',
    uz: 'Tayyor hisob',
    ru: 'Готовый аккаунт',
  },
  {
    regex: /حساب\s+شخصي/gi,
    ug: 'شەخسىي ھېسابات',
    en: 'Personal Account',
    ar: 'حساب شخصي',
    tr: 'Kişisel Hesap',
    uz: 'Shaxsiy hisob',
    ru: 'Личный аккаунт',
  },
  {
    regex: /اشتراك|أشتراك/gi,
    ug: 'ئەزالىق',
    en: 'Subscription',
    ar: 'اشتراك',
    tr: 'Abonelik',
    uz: 'Obuna',
    ru: 'Подписка',
  },
  {
    regex: /تفعيل/gi,
    ug: 'ئاكتىپلاش',
    en: 'Activation',
    ar: 'تفعيل',
    tr: 'Aktivasyon',
    uz: 'Faollashtirish',
    ru: 'Активация',
  },
  {
    regex: /تجديد/gi,
    ug: 'ئۇزارتىش',
    en: 'Renewal',
    ar: 'تجديد',
    tr: 'Yenileme',
    uz: 'Yangilash',
    ru: 'Продление',
  },
  {
    regex: /سيرفر/gi,
    ug: 'مۇلازىمېتىر',
    en: 'Server',
    ar: 'سيرفر',
    tr: 'Sunucu',
    uz: 'Server',
    ru: 'Сервер',
  },
  {
    regex: /باقة/gi,
    ug: 'بولاق',
    en: 'Package',
    ar: 'باقة',
    tr: 'Paket',
    uz: 'Paket',
    ru: 'Пакет',
  },
  {
    regex: /شدات|شدة/gi,
    ug: 'UC (ئوق)',
    en: 'UC',
    ar: 'شدات',
    tr: 'UC',
    uz: 'UC',
    ru: 'UC',
  },
  {
    regex: /جواهر/gi,
    ug: 'ياقۇت',
    en: 'Gems',
    ar: 'جواهر',
    tr: 'Mücevher',
    uz: 'Yoqut',
    ru: 'Кристаллы',
  },
  {
    regex: /عملات|نقاط/gi,
    ug: 'ئۇپا / تەڭگە',
    en: 'Points / Coins',
    ar: 'نقاط',
    tr: 'Puan / Jeton',
    uz: 'Ochko / Tanga',
    ru: 'Очки / Монеты',
  },
  {
    regex: /رسالة/gi,
    ug: 'ئۇچۇر',
    en: 'SMS / Message',
    ar: 'رسالة',
    tr: 'SMS / Mesaj',
    uz: 'SMS / Xabar',
    ru: 'СМС / Сообщение',
  },
  {
    regex: /دقيقة/gi,
    ug: 'مىنۇت',
    en: 'Minutes',
    ar: 'دقيقة',
    tr: 'Dakika',
    uz: 'Daqiqa',
    ru: 'Минут',
  },
];

/**
 * Smartly translates any product, service, or package title into the requested target language.
 */
export function smartTranslateTitle(title: string | null | undefined, lang: SupportedLang = 'ug'): string {
  if (!title) return '';
  let text = String(title).trim();

  // If text is pure Uyghur and user wants another language:
  if (lang !== 'ug') {
    if (text.includes('ئاساسىي')) {
      const rep = lang === 'ar' ? 'الباقة الأساسية' : lang === 'tr' ? 'Temel Paket' : lang === 'uz' ? 'Asosiy Paket' : lang === 'ru' ? 'Базовый пакет' : 'Basic Pack';
      text = text.replace(/ئاساسىي\s*بولاق/g, rep);
    }
    if (text.includes('ئوتتۇرا')) {
      const rep = lang === 'ar' ? 'الباقة المتوسطة' : lang === 'tr' ? 'Orta Paket' : lang === 'uz' ? 'O‘rta Paket' : lang === 'ru' ? 'Средний пакет' : 'Medium Pack';
      text = text.replace(/ئوتتۇرا\s*بولاق/g, rep);
    }
    if (text.includes('VIP')) {
      const rep = lang === 'ar' ? 'باقة VIP' : lang === 'tr' ? 'VIP Paket' : lang === 'uz' ? 'VIP Paket' : lang === 'ru' ? 'VIP Пакет' : 'VIP Pack';
      text = text.replace(/VIP\s*بولاق/g, rep);
    }
    if (text.includes('Ultra')) {
      const rep = lang === 'ar' ? 'باقة ألترا' : lang === 'tr' ? 'Ultra Paket' : lang === 'uz' ? 'Ultra Paket' : lang === 'ru' ? 'Ультра Пакет' : 'Ultra Pack';
      text = text.replace(/Ultra\s*بولاق/g, rep);
    }
    if (text.includes('بولاق')) {
      const rep = lang === 'ar' ? 'باقة' : lang === 'tr' ? 'Paket' : lang === 'uz' ? 'Paket' : lang === 'ru' ? 'Пакет' : 'Pack';
      text = text.replace(/بولاق/g, rep);
    }
    if (text.includes('ئايلىق')) {
      const rep = lang === 'ar' ? 'شهري' : lang === 'tr' ? 'Aylık' : lang === 'uz' ? 'Oylik' : lang === 'ru' ? 'Ежемесячно' : 'Monthly';
      text = text.replace(/ئايلىق/g, rep);
    }
    if (text.includes('يىللىق')) {
      const rep = lang === 'ar' ? 'سنوي' : lang === 'tr' ? 'Yıllık' : lang === 'uz' ? 'Yillik' : lang === 'ru' ? 'Годовой' : 'Yearly';
      text = text.replace(/يىللىق/g, rep);
    }
    if (text.includes('ھەپتىلىك')) {
      const rep = lang === 'ar' ? 'أسبوعي' : lang === 'tr' ? 'Haftalık' : lang === 'uz' ? 'Haftalik' : lang === 'ru' ? 'Еженедельно' : 'Weekly';
      text = text.replace(/ھەپتىلىك/g, rep);
    }
    if (text.includes('ئەزالىق')) {
      const rep = lang === 'ar' ? 'عضوية' : lang === 'tr' ? 'Üyelik' : lang === 'uz' ? 'A‘zolik' : lang === 'ru' ? 'Подписка' : 'Membership';
      text = text.replace(/ئەزالىق/g, rep);
    }
    if (text.includes('ئالماس')) {
      const rep = lang === 'ar' ? 'جوهرة' : lang === 'tr' ? 'Elmas' : lang === 'uz' ? 'Olmos' : lang === 'ru' ? 'Алмазов' : 'Diamonds';
      text = text.replace(/ئالماس/g, rep);
    }
    if (text.includes('شەدەن')) {
      const rep = lang === 'ar' ? 'شدة' : 'UC';
      text = text.replace(/شەدەن/g, rep);
    }
    if (text.includes('بىرلىك')) {
      const rep = lang === 'ar' ? 'وحدة' : lang === 'tr' ? 'Birim' : lang === 'uz' ? 'Birlik' : lang === 'ru' ? 'Единиц' : 'Units';
      text = text.replace(/بىرلىك/g, rep);
    }
    if (text.includes('تەييار ھېسابات')) {
      const rep = lang === 'ar' ? 'حساب جاهز' : lang === 'tr' ? 'Hazır Hesap' : lang === 'uz' ? 'Tayyor hisob' : lang === 'ru' ? 'Готовый аккаунт' : 'Ready Account';
      text = text.replace(/تەييار\s*ھېسابات/g, rep);
    }
    if (text.includes('خاس ھېسابات')) {
      const rep = lang === 'ar' ? 'حساب شخصي' : lang === 'tr' ? 'Özel Hesap' : lang === 'uz' ? 'Shaxsiy hisob' : lang === 'ru' ? 'Личный аккауنت' : 'Private Account';
      text = text.replace(/خاس\s*ھېسابات/g, rep);
    }
    if (text.includes('ئورتاق ھېسابات')) {
      const rep = lang === 'ar' ? 'حساب مشترك' : lang === 'tr' ? 'Ortak Hesap' : lang === 'uz' ? 'Umumiy hisob' : lang === 'ru' ? 'Общий аккаунт' : 'Shared Account';
      text = text.replace(/ئورتاق\s*ھېسابات/g, rep);
    }
    if (text.includes('سوۋغات كارتىسى')) {
      const rep = lang === 'ar' ? 'بطاقة هدية' : lang === 'tr' ? 'Hediye Kartı' : lang === 'uz' ? 'Sovg‘a kartasi' : lang === 'ru' ? 'Подарочная карта' : 'Gift Card';
      text = text.replace(/سوۋغات\s*كارتىسى/g, rep);
    }
    if (text.includes('ئالتۇن')) {
      const rep = lang === 'ar' ? 'ذهب' : lang === 'tr' ? 'Altın' : lang === 'uz' ? 'Oltin' : lang === 'ru' ? 'Золото' : 'Gold';
      text = text.replace(/ئالتۇن/g, rep);
    }
    if (text.includes('تەڭگە')) {
      const rep = lang === 'ar' ? 'عملة' : lang === 'tr' ? 'Jeton' : lang === 'uz' ? 'Tanga' : lang === 'ru' ? 'Монеты' : 'Coins';
      text = text.replace(/تەڭگە/g, rep);
    }
  }

  // Apply dictionary rules
  for (const rule of RULES) {
    if (!rule.regex.test(text)) continue;
    rule.regex.lastIndex = 0; // reset state for global regex
    const replacement = rule[lang] || rule.en || rule.ug;
    if (typeof replacement === 'function') {
      text = text.replace(rule.regex, replacement as any);
    } else if (replacement) {
      text = text.replace(rule.regex, replacement);
    }
  }

  // Clean up duplicated parentheses and extra spaces:
  text = text
    .replace(/\)\s*\(/g, ') (')
    .replace(/\(\s*\(/g, '(')
    .replace(/\)\s*\)/g, ')')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return text;
}

/**
 * Translates checkout input field labels from provider keys like "USER ID", "IMEI", "Link", etc.
 */
export function smartTranslateFieldLabel(label: string | null | undefined, lang: SupportedLang = 'ug'): string {
  if (!label) return '';
  const trimmed = label.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'user id' || lower === 'player id' || lower === 'player_id' || lower === 'userid' || lower.includes('ئويۇنچى كىملىكى')) {
    if (lang === 'ug') return 'ئويۇنچى كىملىكى (Player ID)';
    if (lang === 'ar') return 'معرف اللاعب (Player ID)';
    if (lang === 'tr') return 'Oyuncu ID (Player ID)';
    if (lang === 'uz') return 'O‘yinchi ID (Player ID)';
    if (lang === 'ru') return 'ID игрока (Player ID)';
    return 'Player ID';
  }

  if (lower === 'user name' || lower === 'username' || lower === 'اسم المستخدم' || lower.includes('ئىشلەتكۈچى نامى')) {
    if (lang === 'ug') return 'ئىشلەتكۈچى نامى (Username)';
    if (lang === 'ar') return 'اسم المستخدم';
    if (lang === 'tr') return 'Kullanıcı Adı';
    if (lang === 'uz') return 'Foydalanuvchi nomi';
    if (lang === 'ru') return 'Имя пользователя';
    return 'Username';
  }

  if (lower === 'password' || lower === 'pass' || lower === 'كلمة سر' || lower === 'كلمة السر' || lower.includes('مەخپىي نومۇر')) {
    if (lang === 'ug') return 'مەخپىي نومۇر (Password)';
    if (lang === 'ar') return 'كلمة السر';
    if (lang === 'tr') return 'Şifre';
    if (lang === 'uz') return 'Parol';
    if (lang === 'ru') return 'Пароль';
    return 'Password';
  }

  if (lower === 'imei' || lower === 'imei number') {
    if (lang === 'ug') return 'IMEI نومۇرى';
    if (lang === 'ar') return 'رقم IMEI';
    if (lang === 'tr') return 'IMEI Numarası';
    if (lang === 'uz') return 'IMEI raqami';
    if (lang === 'ru') return 'Номер IMEI';
    return 'IMEI Number';
  }

  if (lower === 'email' || lower === 'account email' || lower.includes('ئېلخەت')) {
    if (lang === 'ug') return 'ئېلخەت ئادرېسى';
    if (lang === 'ar') return 'البريد الإلكتروني';
    if (lang === 'tr') return 'E-posta Adresi';
    if (lang === 'uz') return 'Elektron pochta';
    if (lang === 'ru') return 'Электронная почта';
    return 'Email Address';
  }

  if (lower === 'phone' || lower === 'phone number' || lower === 'mobile' || lower.includes('تېلېفون')) {
    if (lang === 'ug') return 'تېلېفون نومۇرى';
    if (lang === 'ar') return 'رقم الهاتف';
    if (lang === 'tr') return 'Telefon Numarası';
    if (lang === 'uz') return 'Telefon raqami';
    if (lang === 'ru') return 'Номер телефона';
    return 'Phone Number';
  }

  if (lower === 'link' || lower === 'url' || lower === 'profile link' || lower.includes('ئۇلىنىش')) {
    if (lang === 'ug') return 'ئۇلىنىش (Link / URL)';
    if (lang === 'ar') return 'الرابط (Link)';
    if (lang === 'tr') return 'Profil / Hesap Bağlantısı';
    if (lang === 'uz') return 'Profil / Hisob havolasi';
    if (lang === 'ru') return 'Ссылка на профиль';
    return 'Profile / Account Link';
  }

  if (lower === 'note' || lower === 'notes' || lower.includes('ئەسكەرتىش')) {
    if (lang === 'ug') return 'ئەسكەرتىش (ئىختىيارىي)';
    if (lang === 'ar') return 'ملاحظات (اختياري)';
    if (lang === 'tr') return 'Notlar (İsteğe bağlı)';
    if (lang === 'uz') return 'Izoh (ixtiyoriy)';
    if (lang === 'ru') return 'Примечание (необязательно)';
    return 'Notes (Optional)';
  }

  return smartTranslateTitle(label, lang);
}
