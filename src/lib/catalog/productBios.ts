/**
 * Knowledge base for product biographies, descriptions, and operational instructions.
 * Matches provider tools (Chimera, RFT, Pandora, Octoplus), games (PUBG, Free Fire, Roblox),
 * AI tools (ChatGPT, Claude), and communication apps (Telegram, WhatsApp).
 */

import type { ServiceItem, ServicePackage } from '../data';
import type { SupportedLang } from './smartTranslate';
import { translateInstruction } from './instructionTranslator';

interface BioEntry {
  matcher: RegExp | ((service: ServiceItem, pkg?: ServicePackage | null) => boolean);
  ug: string;
  ar: string;
  en: string;
  tr?: string;
  uz?: string;
  ru?: string;
  [key: string]: any;
}

const BIOS_DATABASE: BioEntry[] = [
  // 0. Tremendous Visa Cards (Exact match for provider screenshot instructions)
  {
    matcher: (service, pkg) => {
      const s = `${service?.id || ''} ${service?.name || ''} ${pkg?.title || ''}`.toLowerCase();
      return /tremendous|ترمندوس|othman_visa_cards/i.test(s);
    },
    ug: `⚠️ تنبيه / مۇھىم ئەسكەرتىش:
ئەگەر سىز بۇ كارتىنى ئىشلىتىش ئۇسۇلىنى بىلمىسىڭىز، سېتىۋالماسلىقىڭىزنى ئۈمىد قىلىمىز.

⚡ يتم التسليم بشكل تلقائي (يەتكۈزۈش ئاپتوماتىك ۋە دەرھال ئورۇنلىنىدۇ)
• بۇ كارتا Google مۇلازىمەتلىرى، Google Play ۋە ئىچكى ئەزالىقلار ئۈچۈن تولۇق ماس كېلىدۇ (البطاقة تعمل لخدمات جوجل والاشتراكات الداخلية).
• كارتا %100 پۈتۈن، ئىناۋەتلىك ۋە كاپالەتلىك (البطاقة سليمة 100%).
🌟 كارتا نورمال ئىشلىشى ئۈچۈن Google Wallet ھېساباتىڭىزغا مۇشۇ ئۇلانما ئارقىلىق قوشۇشىڭىز كېرەك:
https://wallet.google.com`,
    ar: `تنبيه: اذا كنت لا تعلم طريقة استخدام البطاقة الرجاء عدم شرائها
يتم التسليم بشكل تلقائي ⚡
البطاقة تعمل لخدمات جوجل والاشتراكات الداخلية.....
البطاقة سليمة 100%
يجب اضافة البطاقة هنا لتعمل بشكل سليم ضمن حسابكم 🌟
https://wallet.google.com`,
    en: `Notice: If you do not know how to use this card, please do not purchase it.
Delivery is automatic and instant ⚡
The card works for Google services and in-app subscriptions...
100% valid card guaranteed.
The card must be added here to work properly with your account 🌟
https://wallet.google.com`,
    tr: `Uyarı: Kartın nasıl kullanılacağını bilmiyorsanız lütfen satın almayın.
Teslimat otomatik ve anında yapılır ⚡
Kart, Google hizmetleri ve uygulama içi abonelikler için geçerlidir...
%100 sorunsuz ve geçerli kart garantisi.
Kartın düzgün çalışması için hesabınıza buradan eklenmelidir 🌟
https://wallet.google.com`,
  },

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

  // 10. Mobile Legends: Bang Bang
  {
    matcher: /mobile\s*legend|mlbb|legend\s*mobile|موبايل\s*ليجند/i,
    ug: `Mobile Legends: Bang Bang رەسمىي ئالماس (Diamonds) ۋە ھەپتىلىك ئۆتۈشمە (Weekly Diamond Pass) قاچىلاش مۇلازىمىتى.
• تەلەپ قىلىنىدىغان ئۇچۇر: ئويۇندىكى ئۆزىڭىزنىڭ UID (ئويۇنچى كىملىكى) ۋە يۇمىلاق تىرناق ئىچىدىكى 4 ياكى 5 خانىلىق رايون كودى (Zone ID) نى كىرگۈزۈڭ.
• يەتكۈزۈش: زاكاز تەستىقلانغاندىن كېيىن سېكۇنت ئىچىدە ئاپتوماتىك ئويۇن ھېساباتىڭىزغا قاچىلىنىدۇ. 100% بىخەتەر.`,
    ar: `شحن جواهر موبايل ليجند Mobile Legends الرسمية وبطاقة المرور الأسبوعية فورياً برقم الآي دي ID ورمز المنطقة Zone ID بأمان كامل.`,
    en: `Official Mobile Legends: Bang Bang Diamonds and Weekly Pass top-up via Player ID and Zone ID. Instant and 100% secure.`,
  },

  // 11. Honor of Kings
  {
    matcher: /honor\s*of\s*king|hok|شرف\s*الملوك/i,
    ug: `Honor of Kings رەسمىي ئالماس / قەھرىمان ئوقى قاچىلاش مۇلازىمىتى.
• تەلەپ: ئويۇن ئىچىدىكى Player ID كىرگۈزۈلسە كۇپايە، مەخپىي نومۇر ھاجەتسىز.
• يەتكۈزۈش: سىستېمىمىز ئارقىلىق دەرھال ئويۇن ھېساباتىغا ئاپتوماتىك ئۇلىنىدۇ.`,
    ar: `شحن لعبة شرف الملوك Honor of Kings الرسمي الفوري عبر معرف اللاعب بدون كلمة مرور.`,
    en: `Official Honor of Kings Token top-up via Player ID directly to your account.`,
  },

  // 12. Call of Duty Mobile
  {
    matcher: /call\s*of\s*duty|codm|كول\s*اوف\s*ديوتي/i,
    ug: `Call of Duty: Mobile رەسمىي CP تولۇقلاش مۇلازىمىتى.
• تەلەپ: ئويۇنچى كىملىكى (Player ID / OpenID) كىرگۈزۈلسىلا كۇپايە.
• يەتكۈزۈش: تېز ھەم دەرھال ھېساباتىڭىزغا تولۇقلىنىدۇ.`,
    ar: `شحن نقاط كول أوف ديوتي موبايل CP الرسمية برقم الآي دي المباشر بأمان فوري.`,
    en: `Official Call of Duty: Mobile CP top-up via Player ID directly and securely.`,
  },

  // 13. Supercell (Brawl Stars, Clash of Clans, Clash Royale)
  {
    matcher: /brawl\s*stars|clash\s*of\s*clans|clash\s*royale|supercell|كلاش/i,
    ug: `Supercell ئويۇنلىرى (Brawl Stars, Clash of Clans, Clash Royale) رەسمىي گۆھەر قاچىلاش مۇلازىمىتى.
• تەلەپ: ئويۇندىكى # بىلەن باشلىنىدىغان ئويۇنچى بەلگىسىنى (Player Tag) كىرگۈزۈڭ (مەسىلەن: #P90UY298).
• يەتكۈزۈش: ئورگان كاپالىتى ئاستىدا دەرھال قاچىلىنىدۇ.`,
    ar: `شحن ألعاب سوبر سيل (براول ستارز، كلاش أوف كلانس، كلاش رويال) عبر كود اللاعب Player Tag المسبوق بعلامة # بأمان رسمي.`,
    en: `Official Supercell Games Gem top-up using your Player Tag (#TAG). Instant and official.`,
  },

  // 14. Roblox
  {
    matcher: /roblox|روبلوكس/i,
    ug: `Roblox رەسمىي Robux قاچىلاش مۇلازىمىتى.
• تەلەپ: پەقەت Roblox ئىشلەتكۈچى نامىنى (Username) توغرا يېزىڭ.
• ئەسكەرتىش: مەخپىي نومۇر ياكى باشقا ئۇچۇر تەلەپ قىلىنمايدۇ، 100% بىخەتەر.`,
    ar: `شحن روبلوكس Robux الرسمي والآمن باسم المستخدم Username فقط وبدون كلمة سر.`,
    en: `Official Roblox Robux top-up with Username only. Fast and 100% secure.`,
  },

  // 15. TikTok Services
  {
    matcher: /tiktok|تيك\s*توك/i,
    ug: `TikTok رەسمىي تەڭگە، ئەگەشكۈچى، ياقتۇرۇش ۋە كۆرۈلۈش مۇلازىمىتى.
• تەلەپ: ئارخىپ ياكى سىننىڭ ئورگان ئۇلانمىسىنى ياكى @ئىشلەتكۈچى نامىنى كىرگۈزۈڭ.
• يەتكۈزۈش: زاكاز تەستىقلانغاندىن كېيىن سىستېمىلىق بىر تەرەپ قىلىش باشلىنىدۇ.`,
    ar: `خدمات وعملات تيك توك الرسمية عبر رابط الحساب أو اسم المستخدم @Username بسرعة وجودة عالية.`,
    en: `Official TikTok Coins & Engagement services via Profile Link or @Username.`,
  },

  // 16. Yalla Ludo / Ludo Star
  {
    matcher: /yalla\s*ludo|ludo\s*star|يلا\s*لودو/i,
    ug: `Yalla Ludo ئالماس ۋە تەڭگە تولۇقلاش مۇلازىمىتى.
• تەلەپ: پەقەت ئىشلەتكۈچى كىملىكى (User ID) كىرگۈزۈلسە كۇپايە.
• يەتكۈزۈش: بىر قانچە دەقىقىدە ھېساباتىڭىزغا قاچىلىنىدۇ.`,
    ar: `شحن يلا لودو وماسات لودو ستار الرسمية عبر رقم المعرف User ID فورياً.`,
    en: `Official Yalla Ludo Diamonds & Coins top-up via User ID. Instant delivery.`,
  },

  // 17. Jawaker
  {
    matcher: /jawaker|جواكر/i,
    ug: `Jawaker توكېن تولۇقلاش مۇلازىمىتى. ئويۇنچى Player ID نومۇرىڭىزنى كىرگۈزسىڭىزلا دەرھال ئويۇن ھېساباتىڭىزغا قاچىلىنىدۇ.`,
    ar: `شحن توكنات جواكر الرسمية الفورية بمعرف اللاعب Player ID.`,
    en: `Official Jawaker Tokens top-up via Player ID. Fast and instant.`,
  },

  // 18. Bigo Live / Likee
  {
    matcher: /bigo|likee|بيجو|لايكي/i,
    ug: `Bigo Live / Likee رەسمىي ئالماس تولۇقلاش مۇلازىمىتى. پەقەت Bigo ID كىرگۈزۈلسە كۇپايە، مەخپىي نومۇر كەتمەيدۇ.`,
    ar: `شحن ماسات بيجو لايف ولايكي الفورية عبر المعرف Bigo ID بدون كلمة مرور.`,
    en: `Official Bigo Live / Likee Diamonds top-up using Bigo ID. Instant delivery.`,
  },

  // 19. Steam Wallet
  {
    matcher: /steam|ستيم/i,
    ug: `Steam ھەميان تولۇقلاش ۋە رەقەملىك كارتىلار مۇلازىمىتى. Steam ھېسابات نامىغا بىۋاسىتە قاچىلىنىدۇ ياكى ئاكتىپلاش كودى زاكاز بېتىدە كۆرۈنىدۇ.`,
    ar: `بطاقات وشحن محفظة ستيم Steam الرسمية تسليم فوري للأكواد والبطاقات.`,
    en: `Official Steam Wallet top-up and digital gift card codes delivered instantly.`,
  },
];

export interface DetectedInputConfig {
  inputLabel: string;
  inputPlaceholder: string;
  requiresZoneId: boolean;
  zoneIdLabel: string;
  zoneIdPlaceholder: string;
  helperNote?: string;
  defaultBio: string;
}

/**
 * Intelligently detects whether a service needs UID + Zone ID, Player ID, Server, or Account,
 * and retrieves the appropriate labels and instructions.
 */
export function detectServiceInputs(
  serviceName: string,
  category: string = 'games',
  params?: string[]
): DetectedInputConfig {
  const name = (serviceName || '').trim();
  const cat = (category || '').trim().toLowerCase();
  const nameLower = name.toLowerCase();

  // 1. Mobile Legends or explicitly has Zone ID param
  const hasZoneParam = Array.isArray(params) && params.some((p) => /zone\s*id|zoneid|zone_id/i.test(p));
  const isMlbb = /mobile\s*legend|mlbb|legend\s*mobile|موبايل\s*ليجند/i.test(nameLower);

  if (hasZoneParam || isMlbb) {
    return {
      inputLabel: 'ئويۇنچى كىملىكى (UID / Player ID)',
      inputPlaceholder: 'مەسىلەن: 12345678',
      requiresZoneId: true,
      zoneIdLabel: 'رايون كودى (Zone ID)',
      zoneIdPlaceholder: 'مەسىلەن: 1234',
      helperNote: 'ئويۇندىكى ئۆزىڭىزنىڭ تەگلىك كىملىك نومۇرى (UID) بىلەن يۇمىلاق تىرناق ئىچىدىكى 4 ياكى 5 خانىلىق رايون كودى (Zone ID) نى ئايرىم كىرگۈزۈڭ.',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 2. Genshin Impact / Honkai or server param
  const hasServerParam = Array.isArray(params) && params.some((p) => /server|choose\s*the\s*server/i.test(p));
  const isGenshin = /genshin|honkai/i.test(nameLower);

  if (hasServerParam || isGenshin) {
    return {
      inputLabel: 'ئويۇنچى كىملىكى (UID)',
      inputPlaceholder: 'مەسىلەن: 700123456',
      requiresZoneId: true,
      zoneIdLabel: 'مۇلازىمېتىر / رايون (Server)',
      zoneIdPlaceholder: 'مەسىلەن: Asia, Europe, America',
      helperNote: 'ئويۇن UID ۋە ئۆزىڭىز تەۋە مۇلازىمېتىر رايونىنى تاللاڭ ياكى كىرگۈزۈڭ.',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 3. PUBG Mobile
  if (/pubg|ببجي/i.test(nameLower)) {
    return {
      inputLabel: 'ئويۇنچى كىملىكى UID (Player ID)',
      inputPlaceholder: 'مەسىلەن: 5123456789 (8-12 خانىلىق سان)',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      helperNote: 'پەقەت ئويۇندىكى 8 دىن 12 گىچە رەقەملىك UID كىرگۈزۈلىدۇ. مەخپىي نومۇر تەلەپ قىلىنمايدۇ.',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 4. Free Fire
  if (/free\s*fire|freefire|فري\s*فاير/i.test(nameLower)) {
    return {
      inputLabel: 'ئويۇنچى كىملىكى UID (Player ID)',
      inputPlaceholder: 'مەسىلەن: 1234567890 (8-12 خانىلىق سان)',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      helperNote: 'پەقەت ئويۇندىكى Player ID كىرگۈزۈلسە كۇپايە.',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 5. Supercell (Brawl Stars, Clash of Clans, Clash Royale)
  if (/brawl\s*stars|clash\s*of\s*clans|clash\s*royale|supercell/i.test(nameLower)) {
    return {
      inputLabel: 'ئويۇنچى بەلگىسى (Player Tag)',
      inputPlaceholder: 'مەسىلەن: #P90UY298',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      helperNote: 'ئويۇندىكى تەگلىكتىن # بىلەن باشلىنىدىغان Player Tag بەلگىڭىزنى كىرگۈزۈڭ.',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 6. Honor of Kings
  if (/honor\s*of\s*king|hok/i.test(nameLower)) {
    return {
      inputLabel: 'ئويۇنچى كىملىكى (Player ID / OpenID)',
      inputPlaceholder: 'ئويۇن كىملىكى ياكى OpenID نى كىرگۈزۈڭ',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 7. Call of Duty Mobile
  if (/call\s*of\s*duty|codm/i.test(nameLower)) {
    return {
      inputLabel: 'ئويۇنچى كىملىكى (Player ID / UID)',
      inputPlaceholder: 'مەسىلەن: 674512345678',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 8. Roblox
  if (/roblox/i.test(nameLower)) {
    return {
      inputLabel: 'Roblox ئىشلەتكۈچى نامى (Username)',
      inputPlaceholder: 'مەسىلەن: your_username',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 9. TikTok
  if (/tiktok/i.test(nameLower)) {
    return {
      inputLabel: 'TikTok ئارخىپ ئۇلانمىسى ياكى @ئىشلەتكۈچى نامى',
      inputPlaceholder: 'https://www.tiktok.com/@... ياكى @username',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 10. Telegram
  if (/telegram/i.test(nameLower)) {
    return {
      inputLabel: 'تېلېگرام ئاتى (@username ياكى تېلېفون نومۇرى)',
      inputPlaceholder: 'مەسىلەن: @username ياكى +905...',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 11. Yalla Ludo / Jawaker / Bigo / Steam
  if (/yalla\s*ludo|ludo\s*star/i.test(nameLower)) {
    return {
      inputLabel: 'ئىشلەتكۈچى كىملىكى (User ID)',
      inputPlaceholder: 'مەسىلەن: 12345678',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  if (/jawaker/i.test(nameLower)) {
    return {
      inputLabel: 'Jawaker ئويۇنچى كىملىكى (Player ID)',
      inputPlaceholder: 'مەسىلەن: 12345678',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  if (/bigo|likee/i.test(nameLower)) {
    return {
      inputLabel: 'Bigo ID / Likee ID',
      inputPlaceholder: 'مەسىلەن: 987654321',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  if (/steam/i.test(nameLower)) {
    return {
      inputLabel: 'Steam ھېسابات نامى (Account Name / Steam ID)',
      inputPlaceholder: 'مەسىلەن: steam_account_name',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 12. GSM Tools (Chimera, UnlockTool, Octoplus, Pandora)
  if (/chimera|unlock\s*tool|pandora|octoplus|z3x|eft/i.test(nameLower)) {
    return {
      inputLabel: 'ھېسابات نامى ياكى ئېلخەت (Username / Email)',
      inputPlaceholder: 'پروگراممىدىكى تىزىملاتقان ھېسابات نامى ياكى ئېلخەت',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 13. Digital Cards / Gift Cards / Vouchers
  if (cat === 'cards' || /itunes|apple|google\s*play|playstation|psn|xbox|razer|netflix|spotify/i.test(nameLower)) {
    return {
      inputLabel: 'تاپشۇرۇۋالغۇچى ئېلخەت / تېلېفون (تاللاشچان)',
      inputPlaceholder: 'مەسىلەن: your@email.com (بوش قالدۇرسىڭىزمۇ بولىدۇ)',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      helperNote: 'سېتىۋالغاندىن كېيىن كارت تالونى ۋە ئاكتىپلاش كودى زاكاز بېتىدە دەرھال كۆرۈنىدۇ.',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // 14. Balance / Numbers / Apps
  if (cat === 'balance') {
    return {
      inputLabel: 'تېلېفون نومۇرى',
      inputPlaceholder: 'قالدۇق تولۇقلىنىدىغان نومۇرنى كىرگۈزۈڭ',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  if (cat === 'numbers') {
    return {
      inputLabel: 'دۆلەت ياكى تەلەپلەر',
      inputPlaceholder: 'قايسى دۆلەت نومۇرى كېرەكلىكىنى يېزىڭ',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  if (cat === 'games') {
    return {
      inputLabel: 'ئويۇنچى ID (Player ID)',
      inputPlaceholder: 'ئويۇن كىملىك نومۇرىنى كىرگۈزۈڭ (مەسىلەن: 51234567)',
      requiresZoneId: false,
      zoneIdLabel: '',
      zoneIdPlaceholder: '',
      defaultBio: getServiceDefaultBio(name, cat),
    };
  }

  // Default fallback
  return {
    inputLabel: 'ھېسابات نومۇرى / ئېلخەت / كىملىك',
    inputPlaceholder: 'ئۇچۇرىڭىزنى كىرگۈزۈڭ',
    requiresZoneId: false,
    zoneIdLabel: '',
    zoneIdPlaceholder: '',
    defaultBio: getServiceDefaultBio(name, cat),
  };
}

/**
 * Returns default bio for any service by name and category.
 */
export function getServiceDefaultBio(serviceName: string, category: string = 'games'): string {
  const dummyService: ServiceItem = {
    id: 'temp',
    name: serviceName,
    category: category as any,
    icon: 'Package',
    description: '',
    packages: [],
  };
  return getProductBio(dummyService, null, 'ug').content;
}

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

  // 1. If admin provided a custom bioContent, prioritize it above all else
  if (service.bioContent && service.bioContent.trim().length > 0) {
    return {
      title: `${serviceName} ھەققىدە كۆرسەتمە ۋە تەرجىمىھال`,
      content: service.bioContent.trim(),
    };
  }

  // 2. If admin provided a custom description override, use it
  if (service.description && service.description.length > 50 && service.description !== serviceName) {
    return {
      title: pkgTitle || serviceName,
      content: service.description,
    };
  }

  // 3. Match against knowledge base
  for (const entry of BIOS_DATABASE) {
    const isMatch = typeof entry.matcher === 'function'
      ? entry.matcher(service, selectedPkg)
      : entry.matcher.test(fullText);

    if (isMatch) {
      return {
        title: pkgTitle || serviceName,
        content: entry[lang] || (lang === 'tr' || lang === 'uz' || lang === 'ru' ? (entry.en || entry.ug) : entry.ug),
      };
    }
  }

  // 3.5. Direct Provider Instructions (Othman Store / Syria4Game)
  const providerInstructions = (selectedPkg as any)?.instructions || (service as any)?.instructions;
  if (providerInstructions && typeof providerInstructions === 'string' && providerInstructions.trim().length > 10) {
    const raw = providerInstructions.trim();
    if (lang === 'ar') {
      return {
        title: pkgTitle || serviceName,
        content: raw,
      };
    }
    const localizedContent = translateInstruction(raw, lang);
    return {
      title: pkgTitle || serviceName,
      content: localizedContent,
    };
  }

  // 4. Fallback: Generate an informative, clean description based on service category and parameters
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

  if (lang === 'tr') {
    return {
      title: pkgTitle || serviceName,
      content: `${serviceName} - Resmi ve otomatik dijital yükleme servisi.
• Teslimat: Sipariş onaylandıktan hemen sonra anında teslimat.
• Güvenlik: %100 güvenli ve garantili işlem.
• Lütfen ödemeyi tamamlamadan önce gerekli bilgileri doğru girdiğinizden emin olun.`,
    };
  }

  if (lang === 'uz') {
    return {
      title: pkgTitle || serviceName,
      content: `${serviceName} - Rasmiy va avtomatlashtirilgan raqamli xizmat.
• Yetkazib berish: Buyurtma tasdiqlangach darhol avtomatik bajariladi.
• Xavfsizlik: 100% xavfsiz va kafolatlangan tizim.
• To‘lovni amalga oshirishdan oldin kiritilgan ma’lumotlarni qayta tekshirib oling.`,
    };
  }

  if (lang === 'ru') {
    return {
      title: pkgTitle || serviceName,
      content: `${serviceName} - Официальный и автоматизированный сервис.
• Доставка: Мгновенное выполнение сразу после подтверждения заказа.
• Безопасность: 100% безопасная и защищенная обработка.
• Пожалуйста, внимательно проверьте введенные данные перед совершением оплаты.`,
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
