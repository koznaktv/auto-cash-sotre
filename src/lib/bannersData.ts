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
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    title: {
      ug: 'PUBG Mobile UC ۋە Royale Pass تولۇقلاش',
      ar: 'شحن شدات ببجي موبايل PUBG UC ورويال باس',
      en: 'PUBG Mobile UC & Royale Pass Instant Top-up',
    },
    subtitle: {
      ug: 'ئويۇنچى ID نومۇرىڭىز بىلەن 10 سېكۇنتتا بىۋاسىتە ھېساباتقا كىرىدۇ',
      ar: 'شحن فوري ومباشر إلى حسابك بالمعرف Player ID خلال ثوانٍ معدودة',
      en: 'Direct delivery to your game account via Player ID in seconds',
    },
    badge: {
      ug: '⚡ ئەڭ قىزىق ئويۇن',
      ar: '⚡ اللعبة الأكثر طلباً',
      en: '⚡ Most Popular Game',
    },
    linkText: {
      ug: 'دەرھال قاچىلاش ⚡',
      ar: 'شحن فوري ⚡',
      en: 'Top-up Now ⚡',
    },
    tag: {
      ug: 'ئويۇن بۆلىكى',
      ar: 'قسم الألعاب',
      en: 'Games Section',
    },
    enabled: true,
    order: 1,
  },
  {
    id: 'slide-2',
    category: 'ai',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop&q=80',
    title: {
      ug: 'ChatGPT Plus & Claude Pro ئايلىق / يىللىق',
      ar: 'اشتراكات ChatGPT Plus و Claude Pro الشهرية والسنوية',
      en: 'ChatGPT Plus & Claude Pro Subscriptions',
    },
    subtitle: {
      ug: 'GPT-4o Canvas، Claude 3.5 Sonnet چەكلىمىسىز يۇقىرى ئىقتىدار',
      ar: 'وصول غير محدود لأحدث نماذج الذكاء الاصطناعي GPT-4o و Claude 3.5',
      en: 'Unlimited access to GPT-4o, Claude 3.5 Sonnet & top AI models',
    },
    badge: {
      ug: '🤖 سۈنئىي ئەقىل',
      ar: '🤖 ذكاء اصطناعي',
      en: '🤖 AI Premium',
    },
    linkText: {
      ug: 'ھېسابات ئېچىش 🤖',
      ar: 'تفعيل الحساب 🤖',
      en: 'Get Account 🤖',
    },
    tag: {
      ug: 'AI ئابۇنىتلىقى',
      ar: 'اشتراكات الذكاء الاصطناعي',
      en: 'AI Subscriptions',
    },
    enabled: true,
    order: 2,
  },
  {
    id: 'slide-3',
    category: 'numbers',
    image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=1200&auto=format&fit=crop&q=80',
    title: {
      ug: 'مەۋھۇم نومۇر (SMS) — Telegram, WhatsApp, TikTok',
      ar: 'أرقام وهمية لتفعيل تيليجرام وواتساب وتيك توك',
      en: 'Virtual Numbers (SMS) for Telegram & WhatsApp',
    },
    subtitle: {
      ug: 'خەلقئارالىق نومۇرلار بىلەن تىزىملىتىش، قىسقا ئۇچۇر كودىنى دەرھال تاپشۇرۇۋېلىش',
      ar: 'أرقام دولية مضمونة لاستقبال كود التحقق OTP بشكل فوري',
      en: 'International numbers for instant OTP verification and registration',
    },
    badge: {
      ug: '📲 مەۋھۇم نومۇر',
      ar: '📲 أرقام وهمية',
      en: '📲 Virtual Numbers',
    },
    linkText: {
      ug: 'نومۇر ئېلىش 📲',
      ar: 'شراء رقم 📲',
      en: 'Get Number 📲',
    },
    tag: {
      ug: 'OTP كاپالىتى',
      ar: 'ضمان التحقق OTP',
      en: 'Guaranteed OTP',
    },
    enabled: true,
    order: 3,
  },
  {
    id: 'slide-4',
    category: 'cards',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    title: {
      ug: 'خەلقئارالىق مەۋھۇم ۋىزا كارتىلار (VCC) & Steam, Apple',
      ar: 'بطاقات دفع إلكتروني فيزا VCC وبطاقات ستيم وآبل',
      en: 'Virtual Visa Cards (VCC) & Steam, Apple Cards',
    },
    subtitle: {
      ug: 'چەتئەل ئەپلىرىگە پۇل تۆلەش، Google Play، PlayStation ۋە Steam كودلىرى',
      ar: 'دفع اشتراكات التطبيقات العالمية، وبطاقات بلايستيشن وجوجل بلاي',
      en: 'Pay for international services, Google Play, PlayStation & Steam',
    },
    badge: {
      ug: '✨ رەقەملىك كارتىلار',
      ar: '✨ بطاقات رقمية',
      en: '✨ Gift Cards & VCC',
    },
    linkText: {
      ug: 'كارتا تاللاش 💳',
      ar: 'اختر البطاقة 💳',
      en: 'Select Card 💳',
    },
    tag: {
      ug: 'كاپالەتلىك كود',
      ar: 'أكواد مضمونة',
      en: 'Verified Codes',
    },
    enabled: true,
    order: 4,
  },
];
