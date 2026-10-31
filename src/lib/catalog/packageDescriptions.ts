/**
 * Comprehensive Knowledge Base for Package Benefits & Use Case Descriptions.
 * Automatically explains what each package contains, what it is used for,
 * and how the user benefits from purchasing it.
 *
 * Supports Uyghur (ug), Arabic (ar), and English (en).
 */

import type { ServiceItem, ServicePackage } from '../data';

interface PackageDetailRule {
  match: (title: string, sId: string, pId: string) => boolean;
  ug: string;
  ar: string;
  en: string;
}

const PACKAGE_RULES: PackageDetailRule[] = [
  // --- MOBILE LEGENDS ---
  {
    match: (t) => /weekly\s*diamond\s*pass|ھەپتىلىك\s*ئالماس\s*پاس/i.test(t),
    ug: '7 كۈن بويىچە جەمئىي 210 ئالماس (شۇئان 80 + كۈندە 20 دىن)، كۈندىلىك تەمىنات، چولپان نومۇرى ۋە تەجرىبە كاشباك ئېلىش كارتىسى.',
    ar: 'بطاقة ماس أسبوعية: إجمالي 210 ماسة خلال 7 أيام مع مكافآت يومية ونقاط ستارلايت.',
    en: 'Weekly Diamond Pass: Total of 210 Diamonds over 7 days + daily perks and Starlight EXP.'
  },
  {
    match: (t) => /weekly\s*elite\s*bundle|ھەپتىلىك\s*ئېلىت\s*بولاق/i.test(t),
    ug: 'ھەپتىلىك 55 ئالماس، ئەتىۋارلىق كىرىستال ساندۇقى ۋە سېھىرلىك چاقپەلەك بېلىتى ئېلىش، تېز دەرىجە ئاشۇرۇش بولىقى.',
    ar: 'حزمة النخبة الأسبوعية: 55 ماسة + صندوق بلورات الحظ وتذاكر السحب.',
    en: 'Weekly Elite Bundle: 55 Diamonds + Crystal of Aurora box and Magic Wheel tickets.'
  },
  {
    match: (t) => /monthly\s*elite\s*bundle|ئايلىق\s*ئېلىت\s*بولاق/i.test(t),
    ug: 'ئايلىق 260 ئالماس، قەھرىمان تېرىسى (Skin) ئېتىبار كۇپونى ۋە كىرىستال جۇلالىرى ئېلىش ئالاھىدە ئېتىبار بولىقى.',
    ar: 'حزمة النخبة الشهرية: 260 ماسة + قسائم خصم سكنات وبلورات أورورا شهرياً.',
    en: 'Monthly Elite Bundle: 260 Diamonds + skin discount coupons and Aurora crystals.'
  },
  {
    match: (t) => /twilight\s*pass|تۋايلايت|تۇۋايلايت/i.test(t),
    ug: '1-100 دەرىجىگىچە مەخسۇس تۇۋايلايت تېرىسى (Skin)، تۇۋايلايت ساندۇقى، كىيىم بېلەتلىرى ۋە دەرىجە مۇكاپاتى ئېلىش كارتىسى.',
    ar: 'بطاقة توايلايت: سكن حصري حتى المستوى 100 + صناديق توايلايت وتذاكر خاصة.',
    en: 'Twilight Pass: Exclusive permanent hero skin + Twilight chests and tier rewards up to lvl 100.'
  },
  {
    match: (t) => /starlight\s*plus|ستاركارت\s*پىلاس/i.test(t),
    ug: 'ستاركارتتىن باشقا دەرھال +29 دەرىجە، ئايلىق مەخسۇس تېرە، ئالاھىدە رامكا ۋە كۆپلىگەن ئېتىبار كارتىسى.',
    ar: 'ستارلايت بلس: فتح مباشر لـ 29 مستوى + سكن الحصري وإطار مميز للشهر.',
    en: 'Starlight Member Plus: Instant +29 levels + exclusive monthly skin and frame.'
  },
  {
    match: (t) => /starlight|ستاركارت/i.test(t),
    ug: 'مەزكۇر ئاينىڭ مەخسۇس ستاركارت تېرىسى (Skin)، ئالاھىدە ئارقا كۆرۈنۈش، پىروپىل بەلگىسى ۋە ئايلىق ئەۋزەللىك كارتىسى.',
    ar: 'عضوية ستارلايت: سكن الشهر الحصري + تأثيرات دخول وخبرة إضافية.',
    en: 'Starlight Member: Monthly exclusive hero skin + battle privileges and extra rewards.'
  },
  {
    match: (t) => /limited-time|ۋاقىتلىق\s*ئالاھىدە/i.test(t),
    ug: 'چەكلىك ۋاقىتلىق دەرىجىدىن تاشقىرى ئېتىبار بولىقى: شۇئان ئالماس، ئەتىۋارلىق كىرىستال ۋە كىيىم ساندۇقى ئېلىشقا ئىشلىتىلىدۇ.',
    ar: 'حزمة القيمة لفترة محدودة: ماس فوري + بلورات وصناديق حظ بسعر مخفض.',
    en: 'Limited-Time Value Pack: Instant diamonds + aurora crystals and lucky chests.'
  },

  // --- FREE FIRE ---
  {
    match: (t, sId) => /weekly\s*membership|ھەپتىلىك\s*ئەزالىق/i.test(t) || (/free_fire|ff/i.test(sId) && /weekly|ھەپتىلىك/i.test(t)),
    ug: '7 كۈندە جەمئىي 450 ئالماس قىممىتى (كۈندە 50 دىن)، VIP بەلگە ۋە ئېتىبار دۇكىنىدىن پايدىلىنىش كارتىسى.',
    ar: 'عضوية أسبوعية: 450 ماسة إجمالية (50 يومياً) + شارة VIP ومميزات حصرية.',
    en: 'Weekly Membership: 450 Diamonds total (50/day) + VIP badge and discount privileges.'
  },
  {
    match: (t, sId) => /monthly\s*membership|ئايلىق\s*ئەزالىق/i.test(t) || (/free_fire|ff/i.test(sId) && /monthly|ئايلىق/i.test(t)),
    ug: '30 كۈندە جەمئىي 2600 ئالماس قىممىتى (كۈندە 70 دىن)، مەخسۇس ئالتۇن ساندۇق، 5 كۈنلۈك تولۇقلاش كارتىسى.',
    ar: 'عضوية شهرية: 2600 ماسة إجمالية (70 يومياً) + صناديق أسلحة وميزات ذهبية.',
    en: 'Monthly Membership: 2600 Diamonds value (70/day) + gold gun crates and VIP perks.'
  },
  {
    match: (t) => /level\s*up\s*pass|دەرىجە\s*پاس/i.test(t),
    ug: 'ئويۇن دەرىجىڭىز ئۆسكەندە جەمئىي 802 ئالماس ئېلىش: ئەڭ ئەرزان توپ باھادا ئالماس سېتىۋېلىش بولىقى.',
    ar: 'بطاقة ترقية المستوى: إجمالي 802 ماسة تفتح مع زيادة مستوى حسابك بأرخص سعر.',
    en: 'Level Up Pass: Total 802 Diamonds unlocked as your account level increases.'
  },
  {
    match: (t) => /booyah\s*pass|بۇيا\s*پاس/i.test(t),
    ug: 'مەزكۇر پەسىللىك مەخسۇس كىيىم-كېچەك، قورال تېرىلىرى (Gun Skin) ۋە نۇرغۇن سوۋغات ئېچىش كارتىسى.',
    ar: 'بوياه باس: فتح سكنات أسلحة وملابس موسمية حصرية ومكافآت متعددة.',
    en: 'Booyah Pass: Unlocks exclusive seasonal bundle outfits, gun skins, and reward crates.'
  },
  {
    match: (t) => /airdrop|ھاۋا\s*تاشلاش/i.test(t),
    ug: 'ئالاھىدە ھاۋا تاشلاش ئېتىبارى: شۇئان 300 ئالماس ۋە قورال ساندۇقى ئەرزان باھادا ھېساباتقا كىرىدۇ.',
    ar: 'إسقاط جوي خاص: 300 ماسة وصناديق أسلحة فورية بسعر رمزي خاص.',
    en: 'Special Airdrop: Instant 300 Diamonds + weapon loot crates delivered directly.'
  },

  // --- PUBG MOBILE ---
  {
    match: (t) => /royale\s*pass|elite\s*pass|rp\b|ئېلىت\s*پاس/i.test(t),
    ug: 'مەزكۇر پەسىللىك 100 دەرىجىلىك RP كارتىسى: ئەپسانىۋى كىيىم، قورال ۋە ئايروپىلان تېرىسى ئېلىشقا ئىشلىتىلىدۇ.',
    ar: 'رويال باس RP: فتح 100 مستوى من الملابس الأسطورية وسكنات الأسلحة والطيارات.',
    en: 'Royale Pass: Unlocks 100 levels of exclusive seasonal mythic outfits, gun skins, and planes.'
  },
  {
    match: (t) => /prime\s*plus|پىرايم\s*پىلاس/i.test(t),
    ug: 'ئايلىق 900 UC قىممىتى: 300 UC شۇئان قايتۇرۇش، كۈندە 10 UC + كلاسسىك ساندۇق بېلىتى ئېلىش.',
    ar: 'برايم بلس: استرداد 300 شدة فوراً + 10 شدات يومياً وقسائم صناديق كلاسيكية.',
    en: 'Prime Plus: 300 UC instant + 10 UC daily + classic and premium crate coupons (900 UC value).'
  },
  {
    match: (t) => /prime\b|پىرايم/i.test(t),
    ug: 'ئايلىق پىرايم ئەزالىق: كۈندىلىك UC ئېلىش ۋە BP دۇكىنىدىن مەڭگۈلۈك كىيىم سېتىۋېلىش ئەۋزەللىكى.',
    ar: 'برايم شهري: شدات يومية وميزة شراء عناصر دائمة من متجر BP.',
    en: 'Prime: Daily UC rewards and exclusive ability to buy permanent items with BP.'
  },

  // --- CLASH OF CLANS & SUPERCELL ---
  {
    match: (t) => /gold\s*pass|ئالتۇن\s*پاس/i.test(t),
    ug: 'قۇرۇلۇش ۋە تەتقىقاتنى %20 تېزلىتىش، 1 ئالتۇن بىلەن ئەسكەر بېرىش ۋە پەسىللىك قەھرىمان تېرىسى ئېلىش كارتىسى.',
    ar: 'جولد باس: تسريع البناء والأبحاث 20% + تبرع بجوهرة واحدة وسكن بطل شهري.',
    en: 'Gold Pass: 20% builder/research boost + 1-gem donations and exclusive monthly Hero skin.'
  },
  {
    match: (t) => /brawl\s*pass/i.test(t),
    ug: 'پەسىللىك يېڭى قەھرىمان (Brawler)، مەخسۇس تېرە، پىن بەلگىلەر ۋە چەكسىز ساندۇقلارنى ئېچىش كارتىسى.',
    ar: 'براول باس: بطل جديد حصري + سكنات مميزة وصناديق وجواهر إضافية.',
    en: 'Brawl Pass: Unlocks the new seasonal chromatic brawler, exclusive skins, pins, and boxes.'
  },

  // --- TELEGRAM ---
  {
    match: (t, sId) => /stars|يۇلتۇز/i.test(t) || /telegram_stars/i.test(sId),
    ug: 'تېلېگرام بوت، سۈنئىي ئەقىل بۆلەكلىرى، مەۋھۇم مەھسۇلات ۋە رەقەملىك بايلىقلارنى سېتىۋېلىش ئۈچۈن رەسمىي Stars يۇلتۇز پۇلى.',
    ar: 'نجوم تيليجرام: العملة الرسمية لشراء الخدمات الرقمية وتفعيل بوتات الذكاء الاصطناعي.',
    en: 'Telegram Stars: Official currency to purchase digital goods, bots, and AI gifts in Telegram.'
  },
  {
    match: (t, sId) => /premium|پىرىمىيۇم|پرېمىيۇم/i.test(t) || /telegram/i.test(sId),
    ug: '4GB ھۆججەت يوللاش، ئەڭ يۇقىرى چۈشۈرۈش تېزلىكى، ئاۋازنى تېكىستكە ئايلاندۇرۇش ۋە ئارقا كۆرۈنۈش تەڭشەش كارتىسى.',
    ar: 'اشتراك تيليجرام بريميوم: رفع ملفات حتى 4 جيجا وسرعة تحميل مضاعفة وتحويل الصوت لنص.',
    en: 'Telegram Premium: 4GB file uploads, ultra-fast downloads, voice-to-text, and exclusive badge.'
  },

  // --- AI (CHATGPT / CLAUDE / MIDJOURNEY / CURSOR) ---
  {
    match: (t, sId) => /chatgpt\s*plus|gpt-4|openai/i.test(t) || /chatgpt/i.test(sId),
    ug: 'GPT-4o ۋە ئەڭ يېڭى o1 ئەقىل مودېللىرىنى ئەڭ يۇقىرى تېزلىكتە چەكلىمىسىز ئىشلىتىش، سۈرەت سىزىش ۋە سانلىق مەلۇمات تەھلىل قىلىش.',
    ar: 'شات جي بي تي بلس: استخدام غير محدود لنماذج GPT-4o و o1 مع توليد الصور والتحليل المتقدم.',
    en: 'ChatGPT Plus: Unlimited access to GPT-4o and o1 reasoning models + DALL-E image generation.'
  },
  {
    match: (t, sId) => /cursor\s*pro/i.test(t) || /cursor/i.test(sId),
    ug: 'كود يېزىش سۈنئىي ئەقىل ياردەمچىسى (Claude 3.5 Sonnet / GPT-4o) بىلەن چەكلىمىسىز ئەقىللىق پروگرامما تۈزۈش ئەزالىقى.',
    ar: 'كورسر برو: استخدام غير محدود للذكاء الاصطناعي لكتابة وتصحيح الأكواد البرمجية بسرعة فائقة.',
    en: 'Cursor Pro: Unlimited AI coding assistance powered by Claude 3.5 Sonnet and GPT-4o.'
  },

  // --- VPNS (PUREVPN, SHIELD, NORD) ---
  {
    match: (t, sId) => /vpn|تور\s*تېزلەتكۈچ/i.test(t) || /vpn/i.test(sId),
    ug: 'چەكلىمىسىز يۇقىرى سۈرئەتلىك مەخپىيەتلىك، دۇنيانىڭ 80+ دۆلىتىگە تېز ئۇلىنىش ۋە تور ئەپلىرىنى توسالغۇسىز ئېچىش كارتىسى.',
    ar: 'اشتراك VPN: تصفح فائق السرعة مشفر مع الوصول لأكثر من 80 دولة وفك حجب المواقع والتطبيقات.',
    en: 'VPN Subscription: High-speed encrypted browsing, access to 80+ countries, and bypass geo-blocks.'
  },

  // --- WI-FI CARDS (AZIZ NET, FURSAN, MUJAHID) ---
  {
    match: (t, sId) => /wifi|تور\s*كارتىسى|عزيز\s*نت|الفرسان|المجاهد/i.test(t) || /wifi/i.test(sId),
    ug: 'يۇقىرى سۈرئەتلىك چەكلىمىسىز تور پىلانى: كود كىرگۈزۈش بىلەنلا دەرھال ئىنتېرنېتكە ئۇلىنىش ۋە سۈرئەت چەكلىمىسىز پايدىلىنىش.',
    ar: 'بطاقة واي فاي: رصيد إنترنت عالي السرعة غير محدود يمنحك اتصالاً فورياً عبر كود البطاقة.',
    en: 'Wi-Fi Internet Card: High-speed unlimited internet voucher code for instant connection.'
  },

  // --- MOBILE RECHARGE & TELECOM (SYRIATEL, MTN, TURKCELL) ---
  {
    match: (t, sId) => /syriatel|سۈرىيەتېل|mtn|ئىمتىئېن|turkcell/i.test(t) || /cards|balance/i.test(sId),
    ug: 'تېلېفون ھېساباتىغا نەق پۇل كىرگۈزۈش: مىنۇت، SMS ياكى ئىنتېرنېت كارتىسى سېتىۋېلىشقا ئاپتوماتىك قاچىلىنىدۇ.',
    ar: 'شحن رصيد الجوال: شحن فوري للرصيد الهاتفي لاستخدامه في المكالمات وباقات الإنترنت.',
    en: 'Mobile Top-Up: Instant credit added to your phone balance for calls and internet packages.'
  },

  // --- GIFT CARDS (PLAYSTATION, STEAM, APPLE, GOOGLE PLAY, RAZER) ---
  {
    match: (t, sId) => /steam|playstation|itunes|google\s*play|razer/i.test(t) || /accounts|crypto/i.test(sId),
    ug: 'رەسمىي دۇكاندا پۇل قىلىپ ئىشلىتىلىدۇ: ئويۇن، قوشۇمچە يۈرۈشلۈك ۋە ئەپلەرنى دۇكاندىن بىۋاسىتە سېتىۋېلىش قالدۇق كارتىسى.',
    ar: 'بطاقة هدايا المتجر: رصيد رقمي رسمي يُشحن في حسابك لشراء الألعاب والتطبيقات المدفوعة.',
    en: 'Store Gift Card: Official digital wallet code to buy games, apps, and DLC directly.'
  }
];

/**
 * Returns a detailed, user-friendly benefit description for any service package.
 */
export function getPackageBenefit(
  pkg: ServicePackage,
  service?: ServiceItem | null,
  lang: string = 'ug'
): string {
  const title = (pkg.title || '').trim();
  const serviceId = (service?.id || '').toLowerCase();
  const pkgId = (pkg.id || '').toLowerCase();

  // 1. Check bespoke rule database
  for (const rule of PACKAGE_RULES) {
    if (rule.match(title, serviceId, pkgId)) {
      if (lang === 'ar') return rule.ar;
      if (lang === 'en') return rule.en;
      return rule.ug;
    }
  }

  // 2. Intelligent Auto-Inference by keywords & product types
  const lower = title.toLowerCase();

  // Numeric Diamond / UC / Coin extraction
  const numMatch = title.match(/(\d[\d,]*)\s*(ئالماس|جوهرة|diamond|diamonds|uc|cp|coin|coins|gem|gems|robux|تەڭگە|ياقۇت)/i);
  if (numMatch) {
    const qty = numMatch[1];
    const unit = numMatch[2];
    if (lang === 'ar') {
      return `شحن ${qty} ${unit} مباشرة لحسابك، يُستخدم لشراء السكنات والعناصر داخل اللعبة.`;
    }
    if (lang === 'en') {
      return `Direct delivery of ${qty} ${unit} to your game account to purchase skins and in-game items.`;
    }
    return `بىۋاسىتە ${qty} ${unit} ئويۇن ھېساباتىغا ئاپتوماتىك كىرىدۇ، تېرە، كىيىم ۋە قورال سېتىۋېلىشقا ئىشلىتىلىدۇ.`;
  }

  if (/pass|پاس/i.test(lower)) {
    if (lang === 'ar') return 'بطاقة تصريح موسمي: تفتح مستويات وسكنات وجوائز حصرية مع التقدم في اللعبة.';
    if (lang === 'en') return 'Season Pass: Unlocks exclusive outfits, skins, and tier progression rewards.';
    return 'پەسىللىك ئۆتۈشمە پاس كارتىسى: دەرىجە ئاشقاندا مەخسۇس تېرە، قورال ۋە ئالماس ئېلىشقا ئىشلىتىلىدۇ.';
  }

  if (/bundle|pack|بولاق/i.test(lower)) {
    if (lang === 'ar') return 'حزمة قيمة مخفضة: تحتوي على مكافآت فورية وعناصر حصرية لتسريع مستواك.';
    if (lang === 'en') return 'Special Value Bundle: Includes instant rewards and bonus crates to boost progression.';
    return 'ئېتىبارلىق قاچىلاش بولىقى: قوشۇمچە تەمىنات، ساندۇق ۋە تېز دەرىجە ئاشۇرۇشقا ئىشلىتىلىدۇ.';
  }

  if (/month|ئايلىق|شهري/i.test(lower)) {
    if (lang === 'ar') return 'اشتراك شهري كامل: يمنحك 30 يوماً من الميزات والخدمات غير المحدودة.';
    if (lang === 'en') return 'Full 1-Month Subscription: Enjoy 30 days of continuous premium perks and features.';
    return '30 كۈنلۈك تولۇق ئايلىق ئەزالىق: چەكلىمىسىز يۇقىرى سۈرئەت ۋە ئالاھىدە ئەۋزەللىككە ئىگە.';
  }

  if (/week|ھەپتىلىك|أسبوعي/i.test(lower)) {
    if (lang === 'ar') return 'اشتراك أسبوعي: يمنحك 7 أيام من الخدمات والمكافآت اليومية بسعر مناسب.';
    if (lang === 'en') return '7-Day Weekly Pass: Gives 7 days of daily benefits and active membership.';
    return '7 كۈنلۈك ھەپتىلىك كارتىسى: كۈندىلىك تەمىنات ۋە ئاكتىپ ئەۋزەللىككە ئىگە بولۇش كارتىسى.';
  }

  if (/year|يىللىق|سنوي/i.test(lower)) {
    if (lang === 'ar') return 'اشتراك سنوي شامل: 365 يوماً من الخدمة بأعلى نسبة توفير وميزات غير محدودة.';
    if (lang === 'en') return 'Annual 1-Year Pass: 365 days of full service with the highest savings.';
    return '1 يىللىق چەكلىمىسىز ئەزالىق: ئەڭ چوڭ ئېتىبار باھادا 365 كۈنلۈك تولۇق ئىشلىتىش كارتىسى.';
  }

  // Default fallback
  if (lang === 'ar') return 'خدمة معتمدة فورية تُسلّم تلقائياً لحسابك بأعلى معايير الأمان والسرعة.';
  if (lang === 'en') return 'Instant automated delivery to your account with 100% guarantee and speed.';
  return 'ئاپتوماتىك ۋە شۇئان ھېساباتقا كىرىدۇ، %100 ئىشەنچلىك ھەم تېز سۈرئەتتە يەتكۈزۈلىدۇ.';
}
