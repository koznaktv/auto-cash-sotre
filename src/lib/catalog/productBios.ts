/**
 * Knowledge base for product biographies, descriptions, and operational instructions.
 * Matches provider tools (Chimera, RFT, Pandora, Octoplus), games (PUBG, Free Fire, Roblox),
 * AI tools (ChatGPT, Claude), and communication apps (Telegram, WhatsApp).
 */

import type { ServiceItem, ServicePackage } from '../data';
import type { SupportedLang } from './smartTranslate';

interface BioEntry {
  matcher: RegExp | ((service: ServiceItem, pkg?: ServicePackage | null) => boolean);
  ug: string;
  ar: string;
  en: string;
}

const BIOS_DATABASE: BioEntry[] = [
  // 1. Chimera Tool (Exact match for user's screenshot!)
  {
    matcher: /chimera/i,
    ug: `ChimeraTool قاچىلانغاندىن كېيىن دەرھال ئىشلىتىشكە بولىدىغان ئاددىي ۋە ئەتراپلىق يۇمشاق دېتال قورالىدۇر. بىز قاچىلاش جەريانىنى ئاددىيلاشتۇردۇق، زۆرۈر بولغان قوزغاتقۇچ (driver) ۋە ھۆججەتلەر پەقەت ئېھتىياج چۈشكەندىلا چۈشۈرۈلىدۇ. ChimeraTool نى ئىشلىتىش ئۈچۈن ئالدىن ھېچقانداق ماھارەت ياكى تەلىم-تەربىيە تەلەپ قىلىنمايدۇ.

بۇ ئەتراپلىق قورال بازاردىكى بارلىق يۇمشاق دېتال ۋە ئۈسكۈنە تىپلىرىنى (Samsung, Huawei, Xiaomi, Qualcomm, MTK) تولۇق قوللايدۇ.`,
    ar: `ChimeraTool هو تطبيق شامل وبسيط يمكن استخدامه فور التثبيت بسرعة وسهولة. لقد قمنا بتبسيط عملية التثبيت بحيث يتم تنزيل برامج التشغيل الإضافية وأي ملفات ضرورية فقط عند الحاجة لعملية معينة. لا يتطلب تشغيل ChimeraTool أي مهارات أو تدريب مسبق.

تغطي هذه الأداة الشاملة جميع البرمجيات وموديلات الأجهزة المتوفرة في السوق.`,
    en: `ChimeraTool is a simple and comprehensive application that can be used quickly after installation. We've simplified the installation process, so additional drivers and any necessary files are downloaded only when required for a specific process. Operating ChimeraTool requires no prior skills or training—novices are more than welcome!

The comprehensive tool covers all software and device models on the market.`,
  },

  // 2. RFT OTP / Realme / Oppo / Xiaomi FRP Tools
  {
    matcher: /rft\s*otp|realme\s*auto\s*login|xiaomi\s*frp/i,
    ug: `RFT OTP يانفۇنلارنىڭ ھېساباتىغا ئاپتوماتىك كىرىش، FRP قۇلۇپىنى ئېچىش ۋە سىستېمىلىق دەلىللەش قورالىدۇر. 24 سائەت توردا ئاپتوماتىك ئىشلەيدۇ. زاكاز بەرگەندىن كېيىن ھوقۇق بېرىش دەرھال سىستېمىغا ئۇلىنىپ بىر تەرەپ قىلىنىدۇ. قايتۇرۇۋېلىشقا بولمايدۇ، كىرگۈزگەن ئۇچۇرلارنىڭ توغرىلىقىغا دىققەت قىلىڭ.`,
    ar: `أداة RFT OTP لتسجيل الدخول التلقائي وفك حماية FRP والتوثيق الفوري لأجهزة شاومي وريلمي وأوبو. تعمل الأداة 24/7 أونلاين بشكل آلي فوري. الخدمة غير قابلة للاسترداد بعد المعالجة.`,
    en: `RFT OTP is an automated login, FRP unlock, and server auth tool for Realme, Xiaomi, and Oppo devices. Operates 24/7 online. Non-refundable once processed.`,
  },

  // 3. UnlockTool
  {
    matcher: /unlock\s*tool/i,
    ug: `UnlockTool يانفۇنلارنىڭ سىستېما قۇلۇپى، Mi Account، FRP ۋە شەخسىي قۇلۇپلىرىنى ئېچىشتا كەڭ ئىشلىتىلىدىغان كەسپىي قورالدۇر. ئاكتىپلاش دەرھال ھېساباتىڭىزغا يوللىنىدۇ ياكى ھوقۇق كودى شەكلىدە تاپشۇرۇلىدۇ.`,
    ar: `أداة UnlockTool الاحترافية لفك حماية FRP وتخطي حسابات Mi وApple وكافة أقفال الهواتف الذكية. تفعيل فوري ومباشر على حسابك.`,
    en: `UnlockTool professional service for FRP bypass, Mi account removal, and smartphone service solutions. Instant digital delivery.`,
  },

  // 4. Pandora Tool / Box
  {
    matcher: /pandora/i,
    ug: `Pandora Tool يانفۇن رېمونتچىلىقىدىكى ئىلغار قورال بولۇپ، MTK، SPD ۋە باشقا سىستېمىلاردا ئىشلەيدۇ. قاچىلانغاندىن كېيىن Box سىز رەقەملىك ئىجازەتنامە بىلەن قوزغىتىلىدۇ.`,
    ar: `أداة Pandora Tool المتقدمة لصيانة هواتف أندرويد ودعم معالجات MTK وSPD بدون بوكس عبر الترخيص الرقمي الفوري.`,
    en: `Pandora Tool advanced digital license for smartphone repair and maintenance without box.`,
  },

  // 5. Octoplus / Octopus
  {
    matcher: /octoplus|octopus/i,
    ug: `Octoplus يانفۇن رېمونت قىلىش سۇپىسىنىڭ رەسمىي كىرېدىت ۋە ئىجازەتنامە مۇلازىمىتى. دەرھال ھېساباتىڭىزغا قاچىلىنىدۇ.`,
    ar: `خدمة تفعيل وتعبئة كريديت أداة Octoplus الرسمية لمختلف موديلات الهواتف الذكية.`,
    en: `Official Octoplus credits and digital activations for phone service.`,
  },

  // 6. PUBG Mobile (UC / شدات)
  {
    matcher: /pubg|ببجي/i,
    ug: `PUBG Mobile رەسمىي ئورگان ئوقى (UC) تولۇقلاش مۇلازىمىتى. پەقەت ئويۇنچى كىملىكى (Player ID) كىرگۈزۈلسىلا كۇپايە، مەخپىي نومۇر تەلەپ قىلىنمايدۇ. زاكاز تەستىقلانغاندىن كېيىن 1 مىنۇتتىن 5 مىنۇتقىچە ئويۇن ھېساباتىڭىزغا بىۋاسىتە قاچىلىنىدۇ. 100% بىخەتەر ۋە كاپالەتلىك.`,
    ar: `شحن شدات ببجي موبايل الرسمية الفورية عبر معرف اللاعب (Player ID) فقط بدون كلمة مرور. يصل الشحن إلى حسابك مباشرة في غضون دقائق معدودة بشكل آمن 100%.`,
    en: `Official PUBG Mobile UC top-up via Player ID only. No password required. Instant delivery to your game account within minutes.`,
  },

  // 7. Free Fire (Diamonds / جواهر)
  {
    matcher: /free\s*fire|فري\s*فاير/i,
    ug: `Free Fire ئالماس قاچىلاش مۇلازىمىتى. پەقەت ئويۇنچى Player ID نومۇرىڭىزنى كىرگۈزسىڭىزلا دەرھال ئويۇن ھېساباتىڭىزغا قاچىلىنىدۇ. بىخەتەر ۋە تېز.`,
    ar: `شحن جواهر فري فاير الرسمية برقم الآي دي ID فقط بدون كلمة سر. شحن سريع ومضمون.`,
    en: `Official Free Fire Diamond top-up via Player ID. Fast, secure and instant.`,
  },

  // 8. Telegram Premium
  {
    matcher: /telegram|تليجرام|تليغرام/i,
    ug: `تېلېگرام ئالىي ئەزالىقى (Telegram Premium). ئەزالىققا ئېرىشكەندىن كېيىن تېز سۈرئەتتە ھۆججەت چۈشۈرۈش، 4GB چوڭ ھۆججەت يوللاش، ئاۋازلىق ئۇچۇرلارنى يېزىققا ئايلاندۇرۇش ۋە ئالاھىدە VIP بەلگىسى ئېچىلىدۇ.`,
    ar: `اشتراك تيليجرام بريميوم الرسمي (Telegram Premium) لتفعيل السرعة المضاعفة ورفع ملفات حتى 4GB وتحويل الصوت إلى نص وشارة التميز.`,
    en: `Official Telegram Premium subscription unlocking 4GB file uploads, faster downloads, voice-to-text, and exclusive badge.`,
  },

  // 9. ChatGPT / OpenAI
  {
    matcher: /chatgpt|openai/i,
    ug: `ChatGPT Plus رەسمىي ئەزالىق مۇلازىمىتى. ئەڭ يېڭى GPT-4o ئەقلىي ئىقتىدار مودېلى، تېز سۈرئەتلىك جاۋاب ۋە رەسىم/ھۆججەت تەھلىل قىلىش ئىقتىدارلىرى تولۇق ئېچىلىدۇ.`,
    ar: `اشتراك ChatGPT Plus الرسمي من OpenAI للوصول إلى أحدث نماذج الذكاء الاصطناعي GPT-4o والتحليل المتقدم.`,
    en: `Official ChatGPT Plus subscription providing full access to GPT-4o, advanced analysis, and fastest response times.`,
  },
];

/**
 * Retrieves or intelligently generates a detailed biography / instructions for any service or package.
 */
export function getProductBio(
  service: ServiceItem,
  selectedPkg?: ServicePackage | null,
  lang: SupportedLang = 'ug'
): { title: string; content: string } {
  if (!service) return { title: '', content: '' };
  const pkgTitle = selectedPkg?.title || '';
  const serviceName = service.name || '';
  const fullText = `${serviceName} ${pkgTitle} ${service.description || ''}`;

  // 1. If admin provided a custom description override, use it
  if (service.description && service.description.length > 50 && service.description !== serviceName) {
    return {
      title: pkgTitle || serviceName,
      content: service.description,
    };
  }

  // 2. Match against knowledge base
  for (const entry of BIOS_DATABASE) {
    const isMatch = typeof entry.matcher === 'function'
      ? entry.matcher(service, selectedPkg)
      : entry.matcher.test(fullText);

    if (isMatch) {
      return {
        title: pkgTitle || serviceName,
        content: entry[lang] || entry.ug,
      };
    }
  }

  // 3. Fallback: Generate an informative, clean description based on service category and parameters
  const isGame = service.category === 'games';
  const isApp = service.category === 'apps';
  const isAmount = selectedPkg?.productType === 'amount';

  if (lang === 'ar') {
    return {
      title: pkgTitle || serviceName,
      content: `${serviceName} - خدمة شحن رسمية وسريعة.
• التنفيذ: تسليم فوري ومباشر بعد تأكيد الطلب.
• الأمان: معالجة آمنة ومضمونة 100%.
• يرجى التأكد من كتابة البيانات المطلوبة بشكل صحيح قبل إتمام عملية الدفع.`,
    };
  }

  if (lang === 'en') {
    return {
      title: pkgTitle || serviceName,
      content: `${serviceName} - Official & automated digital service.
• Delivery: Instant and direct processing upon confirmation.
• Security: 100% verified and secure.
• Please verify all input information before completing the payment.`,
    };
  }

  // Uyghur default
  return {
    title: pkgTitle || serviceName,
    content: `${serviceName} - رەسمىي ۋە ئاپتوماتىك مۇلازىمەت.
• يەتكۈزۈش: سېتىۋېلىش تەستىقلانغاندىن كېيىن سىستېما ئارقىلىق دەرھال بىر تەرەپ قىلىنىدۇ.
• بىخەتەرلىك: 100% بىخەتەر، ئورگان تەرەپ كاپالىتىگە ئىگە.
• مەشغۇلات ئەسكەرتىشى: پۇل تۆلەشتىن بۇرۇن كىرگۈزگەن ئۇچۇر ياكى نومۇرلارنىڭ توغرىلىقىنى قايتا بىر قۇر تەكشۈرۈۋېلىڭ.`,
  };
}
