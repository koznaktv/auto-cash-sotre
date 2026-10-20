/**
 * Smart automatic translation dictionary for provider products, packages, and input fields.
 * Handles English and Arabic technical/gaming/telecom terms and translates them into
 * natural Uyghur, Arabic, and English.
 */

export type SupportedLang = 'ug' | 'ar' | 'en';

interface TranslationRule {
  regex: RegExp;
  ug: string | ((match: string, ...groups: string[]) => string);
  ar: string | ((match: string, ...groups: string[]) => string);
  en?: string | ((match: string, ...groups: string[]) => string);
}

const RULES: TranslationRule[] = [
  // 1. Refund & policies
  {
    regex: /[-–—]?\s*\bno\s+refunds?\b/gi,
    ug: ' (قايتۇرۇلمايدۇ)',
    ar: ' (غير قابل للاسترداد)',
    en: ' (No Refund)',
  },
  {
    regex: /\bnon[-–\s]refundable\b/gi,
    ug: ' (قايتۇرۇلمايدۇ)',
    ar: ' (غير قابل للاسترداد)',
    en: ' (Non-refundable)',
  },
  {
    regex: /[-–—]?\s*(?:بدون\s+استرجاع|لا\s+يسترد|غير\s+قابل\s+للاسترداد)/gi,
    ug: ' (قايتۇرۇلمايدۇ)',
    ar: ' (غير قابل للاسترداد)',
    en: ' (No Refund)',
  },
  {
    regex: /\bno\s+ban\b|\bsafe\b/gi,
    ug: 'بىخەتەر',
    ar: 'آمن بدون حظر',
    en: 'Safe / No Ban',
  },

  // 2. Working hours & connectivity
  {
    regex: /\b24[x/×]7\s+online\b/gi,
    ug: '24 سائەت توردا',
    ar: 'متاح 24/7 أونلاين',
    en: '24/7 Online',
  },
  {
    regex: /\b24[x/×]7\b/gi,
    ug: '24 سائەت',
    ar: '24/7',
    en: '24/7',
  },
  {
    regex: /\binstant\s+delivery\b/gi,
    ug: 'دەرھال يەتكۈزۈش',
    ar: 'تسليم فوري',
    en: 'Instant Delivery',
  },
  {
    regex: /\bfast\s+delivery\b/gi,
    ug: 'تېز يەتكۈزۈش',
    ar: 'تسليم سريع',
    en: 'Fast Delivery',
  },
  {
    regex: /\binstant\b/gi,
    ug: 'دەرھال',
    ar: 'فوري',
    en: 'Instant',
  },

  // 3. Login & Automation actions (Matches user's exact screenshot!)
  {
    regex: /\bsupport\s+auto\s+login\b/gi,
    ug: 'ئاپتوماتىك كىرىشنى قوللايدۇ',
    ar: 'يدعم تسجيل الدخول التلقائي',
    en: 'Supports Auto Login',
  },
  {
    regex: /\bauto\s+login\s+tool\b/gi,
    ug: 'ئاپتوماتىك كىرىش قورالى',
    ar: 'أداة تسجيل دخول تلقائي',
    en: 'Auto Login Tool',
  },
  {
    regex: /\bauto\s+login\b/gi,
    ug: 'ئاپتوماتىك كىرىش',
    ar: 'تسجيل دخول تلقائي',
    en: 'Auto Login',
  },
  {
    regex: /\bqc\s+auth\b/gi,
    ug: 'Qc دەلىللەش',
    ar: 'توثيق Qc',
    en: 'Qc Auth',
  },
  {
    regex: /\bauth\b|\bauthentication\b/gi,
    ug: 'دەلىللەش',
    ar: 'توثيق',
    en: 'Auth',
  },

  // 4. Durations & periods
  {
    regex: /\b1\s*(?:year|yr)\b/gi,
    ug: '1 يىللىق',
    ar: 'سنة واحدة',
    en: '1 Year',
  },
  {
    regex: /(\d+)\s*(?:years|yrs)\b/gi,
    ug: (_m, d) => `${d} يىللىق`,
    ar: (_m, d) => `${d} سنوات`,
    en: (_m, d) => `${d} Years`,
  },
  {
    regex: /\b1\s*(?:month|mo)\b/gi,
    ug: '1 ئايلىق',
    ar: 'شهر واحد',
    en: '1 Month',
  },
  {
    regex: /(\d+)\s*(?:months|mo)\b/gi,
    ug: (_m, d) => `${d} ئايلىق`,
    ar: (_m, d) => `${d} أشهر`,
    en: (_m, d) => `${d} Months`,
  },
  {
    regex: /\b1\s*week\b/gi,
    ug: '1 ھەپتىلىك',
    ar: 'أسبوع واحد',
    en: '1 Week',
  },
  {
    regex: /(\d+)\s*weeks\b/gi,
    ug: (_m, d) => `${d} ھەپتىلىك`,
    ar: (_m, d) => `${d} أسابيع`,
    en: (_m, d) => `${d} Weeks`,
  },
  {
    regex: /\b1\s*day\b/gi,
    ug: '1 كۈنلۈك',
    ar: 'يوم واحد',
    en: '1 Day',
  },
  {
    regex: /(\d+)\s*days\b/gi,
    ug: (_m, d) => `${d} كۈنلۈك`,
    ar: (_m, d) => `${d} أيام`,
    en: (_m, d) => `${d} Days`,
  },
  {
    regex: /\blifetime\b/gi,
    ug: 'مەڭگۈلۈك',
    ar: 'مدى الحياة',
    en: 'Lifetime',
  },
  {
    regex: /لمدة\s*سنة/gi,
    ug: '1 يىللىق',
    ar: 'لمدة سنة',
    en: 'For 1 Year',
  },
  {
    regex: /لمدة\s*شهر/gi,
    ug: '1 ئايلىق',
    ar: 'لمدة شهر',
    en: 'For 1 Month',
  },
  {
    regex: /لمدة\s*(\d+)\s*أشهر/gi,
    ug: (_m, d) => `${d} ئايلىق`,
    ar: (_m, d) => `لمدة ${d} أشهر`,
    en: (_m, d) => `For ${d} Months`,
  },
  {
    regex: /لمدة\s*(\d+)\s*يوم/gi,
    ug: (_m, d) => `${d} كۈنلۈك`,
    ar: (_m, d) => `لمدة ${d} أيام`,
    en: (_m, d) => `For ${d} Days`,
  },

  // 5. Licenses, Tools & Hardware
  {
    regex: /without\s+box\s*-\s*بدون\s+بوكس|without\s+box|بدون\s+بوكس/gi,
    ug: 'Box سىز',
    ar: 'بدون بوكس',
    en: 'Without Box',
  },
  {
    regex: /\bdigital\s+licens[e]?\b/gi,
    ug: 'رەقەملىك ئىجازەتنامە',
    ar: 'ترخيص رقمي',
    en: 'Digital License',
  },
  {
    regex: /\bonline\s+account\s+activation\b/gi,
    ug: 'توردىكى ھېسابات ئاكتىپلاش',
    ar: 'تفعيل حساب أونلاين',
    en: 'Online Account Activation',
  },
  {
    regex: /\bactivation\s+renew(?:al)?\b/gi,
    ug: 'ئاكتىپلاش ۋە ئۇزارتىش',
    ar: 'تفعيل وتجديد',
    en: 'Activation Renewal',
  },
  {
    regex: /\bactivation\b/gi,
    ug: 'ئاكتىپلاش',
    ar: 'تفعيل',
    en: 'Activation',
  },
  {
    regex: /\brenewal\b|\brenew\b/gi,
    ug: 'ۋاقتىنى ئۇزارتىش',
    ar: 'تجديد',
    en: 'Renewal',
  },
  {
    regex: /\bonline\s+tool\b/gi,
    ug: 'تور قورالى',
    ar: 'أداة أونلاين',
    en: 'Online Tool',
  },
  {
    regex: /\bonline\b/gi,
    ug: 'توردا',
    ar: 'أونلاين',
    en: 'Online',
  },
  {
    regex: /(?<![-a-zA-Z0-9])tools?\b/gi,
    ug: 'قورالى',
    ar: 'أداة',
    en: 'Tool',
  },
  {
    regex: /\blicense\b|\blicens\b/gi,
    ug: 'ئىجازەتنامە',
    ar: 'ترخيص',
    en: 'License',
  },
  {
    regex: /\bschematics?\b/gi,
    ug: 'سىزما',
    ar: 'مخططات',
    en: 'Schematics',
  },
  {
    regex: /\bexisting\s+user\b/gi,
    ug: 'كونا ئابۇنىت',
    ar: 'مستخدم حالي',
    en: 'Existing User',
  },
  {
    regex: /\bnew\s+user\b/gi,
    ug: 'يېڭى ئابۇنىت',
    ar: 'مستخدم جديد',
    en: 'New User',
  },

  // 6. Charging, Currencies, Packages
  {
    regex: /\bdirect\s+(?:topup|recharge)\b/gi,
    ug: 'بىۋاسىتە قاچىلاش',
    ar: 'شحن مباشر',
    en: 'Direct Top-up',
  },
  {
    regex: /\btopup\b|\brecharge\b/gi,
    ug: 'قاچىلاش',
    ar: 'شحن',
    en: 'Top-up',
  },
  {
    regex: /\bcredits?\b/gi,
    ug: 'كىرېدىت',
    ar: 'كريديت',
    en: 'Credits',
  },
  {
    regex: /\bdiamonds?\b/gi,
    ug: 'ئالماس',
    ar: 'ألماس',
    en: 'Diamonds',
  },
  {
    regex: /\bgems?\b/gi,
    ug: 'ياقۇت',
    ar: 'جواهر',
    en: 'Gems',
  },
  {
    regex: /\bcoins?\b|\bgold\b/gi,
    ug: 'تەڭگە',
    ar: 'عملات',
    en: 'Coins',
  },
  {
    regex: /\bgift\s+cards?\b/gi,
    ug: 'سوۋغات كارتىسى',
    ar: 'بطاقة هدايا',
    en: 'Gift Card',
  },
  {
    regex: /\bvouchers?\b/gi,
    ug: 'تالون',
    ar: 'قسيمة',
    en: 'Voucher',
  },
  {
    regex: /\bpackages?\b|\bpacks?\b/gi,
    ug: 'بولاق',
    ar: 'باقة',
    en: 'Pack',
  },
  {
    regex: /\bunlimited\b/gi,
    ug: 'چەكسىز',
    ar: 'غير محدود',
    en: 'Unlimited',
  },
  {
    regex: /\bserver\b/gi,
    ug: 'مۇلازىمېتىر',
    ar: 'سيرفر',
    en: 'Server',
  },
  {
    regex: /\bglobal\b/gi,
    ug: 'دۇنياۋى',
    ar: 'عالمي',
    en: 'Global',
  },

  // 7. Arabic phrases
  {
    regex: /شحن\s+فوري/gi,
    ug: 'دەرھال قاچىلاش',
    ar: 'شحن فوري',
    en: 'Instant Topup',
  },
  {
    regex: /شحن\s+مباشر/gi,
    ug: 'بىۋاسىتە قاچىلاش',
    ar: 'شحن مباشر',
    en: 'Direct Topup',
  },
  {
    regex: /حساب\s+جاهز/gi,
    ug: 'تەييار ھېسابات',
    ar: 'حساب جاهز',
    en: 'Ready Account',
  },
  {
    regex: /حساب\s+شخصي/gi,
    ug: 'شەخسىي ھېسابات',
    ar: 'حساب شخصي',
    en: 'Personal Account',
  },
  {
    regex: /اشتراك|أشتراك/gi,
    ug: 'ئەزالىق',
    ar: 'اشتراك',
    en: 'Subscription',
  },
  {
    regex: /تفعيل/gi,
    ug: 'ئاكتىپلاش',
    ar: 'تفعيل',
    en: 'Activation',
  },
  {
    regex: /تجديد/gi,
    ug: 'ئۇزارتىش',
    ar: 'تجديد',
    en: 'Renewal',
  },
  {
    regex: /سيرفر/gi,
    ug: 'مۇلازىمېتىر',
    ar: 'سيرفر',
    en: 'Server',
  },
  {
    regex: /باقة/gi,
    ug: 'بولاق',
    ar: 'باقة',
    en: 'Package',
  },
  {
    regex: /شدات|شدة/gi,
    ug: 'UC (ئوق)',
    ar: 'شدات',
    en: 'UC',
  },
  {
    regex: /جواهر/gi,
    ug: 'ياقۇت',
    ar: 'جواهر',
    en: 'Gems',
  },
  {
    regex: /عملات|نقاط/gi,
    ug: 'ئۇپا / تەڭگە',
    ar: 'نقاط',
    en: 'Points / Coins',
  },
  {
    regex: /رسالة/gi,
    ug: 'ئۇچۇر',
    ar: 'رسالة',
    en: 'SMS / Message',
  },
  {
    regex: /دقيقة/gi,
    ug: 'مىنۇت',
    ar: 'دقيقة',
    en: 'Minutes',
  },
];

/**
 * Smartly translates any product, service, or package title into the requested target language.
 */
export function smartTranslateTitle(title: string | null | undefined, lang: SupportedLang = 'ug'): string {
  if (!title) return '';
  let text = String(title).trim();

  // If already pure Uyghur and target is Uyghur, return directly
  const hasLatin = /[a-zA-Z]/.test(text);
  const hasArabic = /[\u0600-\u06FF]/.test(text);

  // If text is Uyghur and user wants Arabic or English:
  if (lang === 'ar' || lang === 'en') {
    if (text.includes('ئاساسىي')) text = text.replace(/ئاساسىي\s*بولاق/g, lang === 'ar' ? 'الباقة الأساسية' : 'Basic Pack');
    if (text.includes('ئوتتۇرا')) text = text.replace(/ئوتتۇرا\s*بولاق/g, lang === 'ar' ? 'الباقة المتوسطة' : 'Medium Pack');
    if (text.includes('VIP')) text = text.replace(/VIP\s*بولاق/g, lang === 'ar' ? 'باقة VIP' : 'VIP Pack');
    if (text.includes('Ultra')) text = text.replace(/Ultra\s*بولاق/g, lang === 'ar' ? 'باقة ألترا' : 'Ultra Pack');
    if (text.includes('بولاق')) text = text.replace(/بولاق/g, lang === 'ar' ? 'باقة' : 'Pack');
    if (text.includes('ئايلىق')) text = text.replace(/ئايلىق/g, lang === 'ar' ? 'شهري' : 'Monthly');
    if (text.includes('يىللىق')) text = text.replace(/يىللىق/g, lang === 'ar' ? 'سنوي' : 'Yearly');
  }

  // Apply dictionary rules
  for (const rule of RULES) {
    if (!rule.regex.test(text)) continue;
    rule.regex.lastIndex = 0; // reset state for global regex
    const replacement = rule[lang] || rule.ug;
    if (typeof replacement === 'function') {
      text = text.replace(rule.regex, replacement as any);
    } else {
      text = text.replace(rule.regex, replacement);
    }
  }

  // Clean up duplicated parentheses and extra spaces:
  // e.g. "((قايتۇرۇلمايدۇ))" -> "(قايتۇرۇلمايدۇ)"
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

  if (lower === 'user id' || lower === 'player id' || lower === 'player_id' || lower === 'userid') {
    if (lang === 'ug') return 'ئويۇنچى كىملىكى (Player ID)';
    if (lang === 'ar') return 'معرف اللاعب (Player ID)';
    return 'Player ID';
  }

  if (lower === 'user name' || lower === 'username' || lower === 'اسم المستخدم') {
    if (lang === 'ug') return 'ئىشلەتكۈچى نامى (Username)';
    if (lang === 'ar') return 'اسم المستخدم';
    return 'Username';
  }

  if (lower === 'password' || lower === 'pass' || lower === 'كلمة سر' || lower === 'كلمة السر') {
    if (lang === 'ug') return 'مەخپىي نومۇر (Password)';
    if (lang === 'ar') return 'كلمة السر';
    return 'Password';
  }

  if (lower === 'imei' || lower === 'imei number') {
    if (lang === 'ug') return 'IMEI نومۇرى';
    if (lang === 'ar') return 'رقم IMEI';
    return 'IMEI Number';
  }

  if (lower === 'email' || lower === 'account email') {
    if (lang === 'ug') return 'ئېلخەت ئادرېسى';
    if (lang === 'ar') return 'البريد الإلكتروني';
    return 'Email Address';
  }

  if (lower === 'phone' || lower === 'phone number' || lower === 'mobile') {
    if (lang === 'ug') return 'تېلېفون نومۇرى';
    if (lang === 'ar') return 'رقم الهاتف';
    return 'Phone Number';
  }

  if (lower === 'link' || lower === 'url' || lower === 'profile link') {
    if (lang === 'ug') return 'ئۇلىنىش (Link / URL)';
    if (lang === 'ar') return 'الرابط (Link)';
    return 'Profile / Account Link';
  }

  if (lower === 'note' || lower === 'notes') {
    if (lang === 'ug') return 'ئەسكەرتىش (ئىختىيارىي)';
    if (lang === 'ar') return 'ملاحظات (اختياري)';
    return 'Notes (Optional)';
  }

  return smartTranslateTitle(label, lang);
}
