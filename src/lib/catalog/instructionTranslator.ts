/**
 * Universal Intelligent Translator for Provider Notices & Instructions.
 * Converts raw Arabic instructions from suppliers (Othman Store, Syriatel, MTN,
 * PUBG, Free Fire, Google, etc.) into the active UI language.
 */

interface InstructionRule {
  pattern: RegExp;
  ug: string | ((match: RegExpMatchArray, text: string) => string);
  en: string | ((match: RegExpMatchArray, text: string) => string);
  tr?: string | ((match: RegExpMatchArray, text: string) => string);
  ru?: string | ((match: RegExpMatchArray, text: string) => string);
  uz?: string | ((match: RegExpMatchArray, text: string) => string);
}

const INSTRUCTION_RULES: InstructionRule[] = [
  // 1. Syriatel Cash Phone Numbers (Universal match for Syriatel)
  {
    pattern: /ارقام\s*السيرياتيل|سيرياتيل\s*كاش|سيرياتيل|syriatel/i,
    ug: `سۈرىيەتېل (Syriatel) نومۇرلىرى 093 / 098 / 099 بىلەن باشلىنىدۇ.
• تېلېفون نومۇرىنى دۆلەت كودى قوشماي بىۋاسىتە كىرگۈزۈڭ، مەسىلەن: 09xxxxxxxx
• ئاندىن زاكاز تەلىپىڭىزگە ماس كېلىدىغان بولاقنى تاللاڭ.`,
    en: `Syriatel numbers start with 093 / 098 / 099.
• Please enter the phone number without country code, e.g.: 09xxxxxxxx
• Then select the package that fits your order.`
  },

  // 2. MTN Syria Phone Numbers (Universal match for MTN)
  {
    pattern: /ارقام\s*(ام\s*تي\s*ان|mtn)|ام\s*تي\s*ان|mtn\s*syria/i,
    ug: `ئىمتىئېن (MTN) نومۇرلىرى 094 / 095 بىلەن باشلىنىدۇ.
• تېلېفون نومۇرىنى دۆلەت كودى قوشماي بىۋاسىتە كىرگۈزۈڭ، مەسىلەن: 09xxxxxxxx
• ئاندىن كېرەكلىك بولاقنى تاللاڭ.`,
    en: `MTN numbers start with 094 / 095.
• Please enter the phone number without country code, e.g.: 09xxxxxxxx
• Then select the suitable package.`
  },

  // 3. Egypt Wallets (Vodafone, Etisalat, Orange Cash)
  {
    pattern: /ارقام\s*فودافون\s*كاش\s*تبداء\s*بـ\s*010/i,
    ug: `فودافون كاش نومۇرلىرى 010، اتصالات كاش 011 (%0.5 ئۈستەم ھەق)، ئورانج كاش 012 بىلەن باشلىنىدۇ.
• تېلېفون نومۇرىڭىزنى تولۇق كىرگۈزۈپ، كېرەكلىك نەق پۇل مىقدارىنى تاللاڭ.`,
    en: `Vodafone Cash starts with 010, Etisalat Cash with 011 (0.5% fee), Orange Cash with 012.
• Enter your wallet number without country code and choose the amount.`
  },

  // 4. 24/7 Automated execution (Mobile Legends server bracket warning)
  {
    pattern: /الخدمة\s*تعمل\s*بشكل\s*تلقائي\s*على\s*مدار\s*24\s*ساعة.*?(عدم\s*اضافة|ارسل\s*الرقم)/i,
    ug: `بۇ مۇلازىمەت 24 سائەت بويىچە ئاپتوماتىك ۋە شۇئان ئىشلەيدۇ.
⚠️ مۇھىم ئەسكەرتىش: رايون (Server ID) خانىسىگە قوش تىرناق () ياكى ھەرپ قوشماي، پەقەت رەقەمنىلا كىرگۈزۈڭ.`,
    en: `This service operates 24/7 fully automatically.
⚠️ Note: Please do not add brackets () in the Server ID field; send numbers only.`
  },

  // 5. General 24/7 Automated execution
  {
    pattern: /الخدمة\s*تعمل\s*بشكل\s*تلقائي\s*على\s*مدار\s*24\s*ساعة/i,
    ug: `بۇ مۇلازىمەت 24 سائەت بويىچە پۈتۈنلەي ئاپتوماتىك ئىشلەيدۇ. سېتىۋالغاندىن كېيىن شۇئان ھېساباتىڭىزغا كىرىدۇ.`,
    en: `This service operates 24/7 fully automatically. Instant execution after purchase.`
  },

  // 6. Manual Execution with time windows (e.g. 10 AM to 12 PM, 5 to 30 mins)
  {
    pattern: /هذا\s*المنتج\s*يعمل\s*بشكل\s*يدوي\s*من\s*الساعة.*?يتم\s*تنفيذ\s*الطلب\s*خلال\s*(\d+)\s*(دقيقة|ساعة|ساعات)/i,
    ug: (match) => {
      const num = match[1] || '30';
      const unit = match[2]?.includes('ساع') ? 'سائەت' : 'مىنۇت';
      return `بۇ مەھسۇلات ئەتىگەن 10:00 دىن كېچە 12:00 گىچە مەخسۇس ئىنژېنېرلار تەرىپىدىن بىر تەرەپ قىلىنىدۇ ✔️
زاكاز تاپشۇرۇلغاندىن كېيىن تەخمىنەن ${num} ${unit} ئىچىدە تاماملىنىدۇ ✅`;
    },
    en: (match) => {
      const num = match[1] || '30';
      const unit = match[2]?.includes('ساع') ? 'hours' : 'minutes';
      return `This product is processed manually from 10:00 AM to 12:00 AM ✔️
Order is fulfilled within ${num} ${unit} ✅`;
    }
  },

  // 7. General Manual Execution (الخدمة تعمل بشكل يدوي)
  {
    pattern: /الخدمة\s*تعمل\s*بشكل\s*يدوي\s*من\s*الساعة/i,
    ug: `بۇ مۇلازىمەت ئىش ۋاقتىدا قولدا بىر تەرەپ قىلىنىدۇ. زاكاز تەخمىنەن 5 مىنۇتتىن 30 مىنۇتقىچە ئورۇنلىنىدۇ.`,
    en: `This service is processed manually during working hours. Fulfillments take 5 to 30 minutes.`
  },

  // 8. Ready Accounts with support code request (حسابات جاهزة بعد الشراء)
  {
    pattern: /حسابات\s*جاهزة\s*بعد\s*الشراء.*?اطلب\s*كود/i,
    ug: `تەييار ھېسابات: سېتىۋالغاندىن كېيىن ئاپتوماتىك تاپشۇرۇلىدۇ ياكى خېرىدارلار مۇلازىمىتى بۆلۈمىدىن قوزغىتىش كودىنى ئېلىڭ ✅`,
    en: `Ready account: Delivered instantly or contact customer support for the activation code ✅`
  },

  // 9. Account Policy (حساب نظامي / لا يمكن الغاء الطلب)
  {
    pattern: /حساب\s*نظامي.*?حساب\s*خاص\s*بكم|لايوجد\s*مشتركين/i,
    ug: `✅ %100 رەسمىي، مەخسۇس ئۆزىڭىزگە تەۋە شەخسىي ھېسابات (ھەمبەھىرلەنمەيدۇ). پۇل تۆلەش مەسىلىسى كۆرۈلمەيدۇ، تولۇق كاپالەتلىك.`,
    en: `✅ 100% official private account exclusively for you (not shared). Guaranteed stability.`
  },

  // 10. Instant Delivery with single button (خدمة تلقائية ⚡كبسة زر)
  {
    pattern: /خدمة\s*تلقائية\s*⚡\s*كبسة\s*زر/i,
    ug: `چاقماق تېزلىكىدىكى ئاپتوماتىك قاچىلاش ⚡ كۇنۇپكىنى باسسىڭىزلا سېكۇنت ئىچىدە بىۋاسىتە ھېساباتىڭىزغا كىرىدۇ.`,
    en: `Automated instant delivery ⚡ Fast top-up delivered to your account within seconds.`
  },

  // 11. Google Gift Card notice (كفالة بطاقة غوغل)
  {
    pattern: /كفالة\s*بطاقة\s*غوغل/i,
    ug: `⚠️ Google كارتىسى ئەسكەرتىشى:
بارلىق سوۋغات كارتىلىرى رەسمىي، ئىناۋەتلىك ۋە تەستىقلانغان سىستېمىدىن تەمىنلىنىدۇ. توغرا رايون ۋە ۋالېت ھېساباتى بىلەن تولۇقلاڭ.`,
    en: `⚠️ Google Gift Card Notice:
All gift cards are 100% official and valid. Please redeem with matching regional wallet settings.`
  },

  // 12. In-Game purchase link requirement (يُرجى وضع رابط الشراء)
  {
    pattern: /يُرجى\s*وضع\s*رابط\s*الشراء|طريقة\s*جلب\s*رابط\s*الشراء/i,
    ug: `ئويۇن ئىچى ئېتىبارىنى قاچىلاش ئۈچۈن، ئويۇن ئىچىدىن ئېلىنغان مال سېتىۋېلىش ئۇلانمىسى (Link) ۋە ئېلخەت ئادرېسىنى كىرگۈزۈڭ. زاكاز 1 دىن 60 مىنۇتقىچە ئورۇنلىنىدۇ.`,
    en: `Please provide the in-game offer purchase link and email address. Top-up completed within 1 to 60 minutes.`
  },

  // 13. Microsoft Office lifetime activation
  {
    pattern: /microsoft\s*office.*?احصل\s*على\s*رمز\s*تفعيل/i,
    ug: `Microsoft Office ئەسلى كودى: كومپيۇتېرىڭىزدا رەسمىي ۋە ئۆمۈرلۈك قوزغىتىش ئاچقۇچىغا ئېرىشىسىز. سېتىۋالغاندىن كېيىن شۇئان تەستىقلىنىدۇ.`,
    en: `Microsoft Office official lifetime activation key. Delivered immediately after purchase.`
  },

  // 14. Social media boosting notice (لا يوجد كفالة على الرشق)
  {
    pattern: /رشق|لا\s*يوجد\s*كفالة\s*على\s*الرشق/i,
    ug: `ئىجتىمائىي تاراتقۇ مەستانە (Followers) ۋە كۆرۈلۈش سانىنى ئاشۇرۇش زاكازى. زاكاز بەرگەندىن كېيىن سىستېما شۇئان تىزىملىككە كىرگۈزىدۇ.`,
    en: `Social media promotion service. Processing starts automatically upon submitting.`
  },

  // 15. General Automatic
  {
    pattern: /المنتج\s*يعمل\s*بشكل\s*تلقائي|شحن\s*فوري/i,
    ug: `بۇ مۇلازىمەت ئاپتوماتىك ۋە شۇئان ئىشلەيدۇ. زاكاز بەرگەن ھامان تېز سۈرئەتتە ھېساباتىڭىزغا كىرىدۇ.`,
    en: `This service works automatically. Top-up will be processed and delivered instantly.`
  }
];

/**
 * Fallback Phrase Replacer for novel or mixed Arabic instructions.
 */
function translateArabicPhrasesToUyghur(text: string): string {
  let res = text;

  // Replacements
  const dict: [RegExp, string][] = [
    [/الخدمة\s*تعمل\s*بشكل\s*تلقائي/g, 'بۇ مۇلازىمەت ئاپتوماتىك ئىشلەيدۇ'],
    [/على\s*مدار\s*24\s*ساعة/g, '24 سائەت بويىچە'],
    [/يرجى\s*إدخال|يرجى\s*ادخال/g, 'كىرگۈزۈڭ:'],
    [/رقم\s*الهاتف/g, 'تېلېفون نومۇرى'],
    [/بدون\s*نداء|بدون\s*كود\s*الدولة/g, 'دۆلەت كودى قوشماي'],
    [/مثال:/g, 'مەسىلەن:'],
    [/ومن\s*ثم\s*إختيار\s*الباقة\s*التي\s*تناسب\s*طلبك/g, 'ئاندىن ئۆزىڭىزگە ماس كېلىدىغان بولاقنى تاللاڭ.'],
    [/هذا\s*المنتج\s*يعمل\s*بشكل\s*يدوي/g, 'بۇ مەھسۇلات قولدا بىر تەرەپ قىلىنىدۇ'],
    [/من\s*الساعة/g, 'سائەت'],
    [/صباحاً/g, 'ئەتىگەن'],
    [/مساءً/g, 'كەچ'],
    [/يتم\s*تنفيذ\s*الطلب\s*خلال/g, 'زاكازنىڭ ئورۇنلىنىش ۋاقتى:'],
    [/دقيقة/g, 'مىنۇت'],
    [/ساعات|ساعة/g, 'سائەت'],
    [/حسابات\s*جاهزة/g, 'تەييار ھېسابات'],
    [/يرجى\s*عدم\s*تغيير\s*معلومات\s*الحساب/g, 'ھېسابات ئۇچۇرلىرىنى ئۆزگەرتمەڭ'],
    [/لايمكن\s*الغاء\s*الطلب\s*بعد\s*الشراء/g, 'سېتىۋالغاندىن كېيىن زاكازنى بىكار قىلىشقا بولمايدۇ'],
    [/الخدمة\s*للهاتف\s*فقط/g, 'بۇ مۇلازىمەت پەقەت يانفون ئۈچۈن'],
    [/ارقام\s*السيرياتيل/g, 'سۈرىيەتېل نومۇرلىرى'],
    [/ارقام\s*ام\s*تي\s*ان/g, 'ئىمتىئېن نومۇرلىرى'],
    [/تبدأ\s*بـ|تبدأ\s*ب/g, 'باشلىنىدۇ:'],
    [/حساب\s*مكفول/g, 'كاپالەتلىك ھېسابات'],
    [/تنبيه:/g, 'ئەسكەرتىش:'],
    [/ملاحظة:/g, 'ئىزاھات:'],
    [/يرجى\s*التأكد\s*من\s*كتابة\s*الرقم\s*بشكل\s*صحيح/g, 'نومۇرنى دەلىللەپ توغرا كىرگۈزۈڭ.'],
    [/يرجى\s*ادخال\s*الآي\s*دي\s*بشكل\s*صحيح\s*فقط/g, 'ئويۇن كىملىكى (ID) نى پەقەت رەقەم ھالىتىدە توغرا كىرگۈزۈڭ.']
  ];

  for (const [pattern, rep] of dict) {
    res = res.replace(pattern, rep);
  }

  return res;
}

/**
 * Fallback Phrase Replacer for novel Arabic instructions into English.
 */
function translateArabicPhrasesToEnglish(text: string): string {
  let res = text;

  const dict: [RegExp, string][] = [
    [/الخدمة\s*تعمل\s*بشكل\s*تلقائي/g, 'This service runs automatically'],
    [/على\s*مدار\s*24\s*ساعة/g, '24/7'],
    [/يرجى\s*إدخال|يرجى\s*ادخال/g, 'Please enter:'],
    [/رقم\s*الهاتف/g, 'Phone Number'],
    [/بدون\s*نداء/g, 'without country code'],
    [/مثال:/g, 'e.g.:'],
    [/ومن\s*ثم\s*إختيار\s*الباقة\s*التي\s*تناسب\s*طلبك/g, 'Then select the package you need.'],
    [/هذا\s*المنتج\s*يعمل\s*بشكل\s*يدوي/g, 'This product is processed manually'],
    [/من\s*الساعة/g, 'from'],
    [/صباحاً/g, 'AM'],
    [/مساءً/g, 'PM'],
    [/يتم\s*تنفيذ\s*الطلب\s*خلال/g, 'Order fulfilled within:'],
    [/دقيقة/g, 'minutes'],
    [/ساعات|ساعة/g, 'hours'],
    [/حسابات\s*جاهزة/g, 'Ready accounts'],
    [/يرجى\s*عدم\s*تغيير\s*معلومات\s*الحساب/g, 'Do not change account details'],
    [/لايمكن\s*الغاء\s*الطلب\s*بعد\s*الشراء/g, 'Orders cannot be cancelled after purchase'],
    [/الخدمة\s*للهاتف\s*فقط/g, 'Mobile service only'],
    [/ارقام\s*السيرياتيل/g, 'Syriatel numbers'],
    [/تبدأ\s*بـ|تبدأ\s*ب/g, 'start with:'],
    [/تنبيه:/g, 'Notice:'],
    [/ملاحظة:/g, 'Note:']
  ];

  for (const [pattern, rep] of dict) {
    res = res.replace(pattern, rep);
  }

  return res;
}

/**
 * Main translation function for provider instructions.
 * If website is in Arabic, returns the original Arabic.
 * If website is in Uyghur, returns natural localized Uyghur.
 * If website is in English, returns English.
 */
export function translateInstruction(
  rawText: string | null | undefined,
  lang: string = 'ug'
): string {
  if (!rawText) return '';
  const text = String(rawText).trim();
  if (!text) return '';

  // If language is Arabic, preserve authentic Arabic
  if (lang === 'ar') {
    return text;
  }

  // Check matching rules
  for (const rule of INSTRUCTION_RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      if (lang === 'en') {
        return typeof rule.en === 'function' ? rule.en(match, text) : rule.en;
      }
      // Default to Uyghur
      return typeof rule.ug === 'function' ? rule.ug(match, text) : rule.ug;
    }
  }

  // Fallback phrase translation
  if (lang === 'en') {
    return translateArabicPhrasesToEnglish(text);
  }

  return translateArabicPhrasesToUyghur(text);
}
