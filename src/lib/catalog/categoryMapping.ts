import type { StorefrontCategory } from './types';

/**
 * Guesses which of our 9 storefront categories a provider category belongs to from its
 * (mostly Arabic) name. Order matters: the first matching rule wins. Admin overrides always
 * take precedence; categories matching nothing stay hidden until an admin maps them.
 */
const RULES: { category: StorefrontCategory; pattern: RegExp }[] = [
  { category: 'ai', pattern: /ذكاء|اصطناعي|chat\s*gpt|openai|gemini|claude|midjourney|copilot|\bai\b|canva/i },
  { category: 'numbers', pattern: /أرقام|ارقام|رقم|sms|otp|virtual\s*number|numbers?\b/i },
  { category: 'crypto', pattern: /usdt|crypto|بيتكوين|عملات\s*رقمية|binance|trc20|bep20/i },
  { category: 'accounts', pattern: /حسابات|حساب\s*جاهز|netflix|نتفلكس|spotify|سبوتيفاي|shahid|شاهد|youtube\s*premium|disney|vpn|proton|nord|express/i },
  { category: 'social', pattern: /متابع|لايك|مشاهد|تواصل|سوشيال|followers?|likes?|views?|social|tiktok|instagram|facebook|snapchat|telegram\s*(members|stars|premium)?/i },
  { category: 'balance', pattern: /رصيد|سيريتل|syriatel|mtn|ام\s*تي\s*ان|وحدات|كاش|cash|محفظ|balance|blance|\bbanks?\b|بنك|transfer|حوالة|حوالات|turkcell|telecom|turk|alfa/i },
  { category: 'cards', pattern: /بطاق|كرت|كروت|gift|card|voucher|itunes|google\s*play|playstation|psn|xbox|steam|razer|\bps\b/i },
  { category: 'games', pattern: /ألعاب|العاب|لعبة|شحن\s*ألعاب|games?|pubg|ببجي|free\s*fire|فري\s*فاير|mobile\s*legends|clash|fortnite|roblox|genshin|valorant|call\s*of\s*duty|cod|strike|hay\s*day|jawaker|kamlna|war|pool|sultan|brawl|fifa|pes|efootball|play|fc\s*mobile|farlight|honor|survival|avalon/i },
  { category: 'apps', pattern: /تطبيق|دردشة|برامج|apps?|bigo|tango|likee|imo|yalla|ludo|chat|software|\btvs?\b|live|party|voice|stream|video|miyo|ميو|tumile|livu|chamet|yoho|mixu|poppo|iptv|shahd|osn|capcut|tool|activation|license|credit|server|repair|unlock|schematic|dongle|box|firmware|auth|flash|frp|package|section|validity/i },
];

export function guessStorefrontCategory(names: string[]): StorefrontCategory | null {
  for (const name of names) {
    if (!name) continue;
    for (const rule of RULES) {
      if (rule.pattern.test(name)) return rule.category;
    }
  }
  return null;
}

export const STOREFRONT_ICONS: Record<StorefrontCategory, string> = {
  games: 'Gamepad2',
  apps: 'Smartphone',
  ai: 'Bot',
  numbers: 'MessageSquareShare',
  cards: 'CreditCard',
  accounts: 'KeyRound',
  crypto: 'Coins',
  social: 'Share2',
  balance: 'Wallet',
};

export const CATEGORY_FALLBACK_IMAGES: Record<StorefrontCategory, string> = {
  games: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
  apps: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80',
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
  numbers: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&auto=format&fit=crop&q=80',
  cards: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
  accounts: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80',
  crypto: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600&auto=format&fit=crop&q=80',
  social: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80',
  balance: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=80',
};

const SERVICE_ARTWORK_PATTERNS: { pattern: RegExp; image: string }[] = [
  // Free Fire
  {
    pattern: /free\s*fire|فري\s*فاير/i,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
  },
  // PUBG Mobile & related
  {
    pattern: /pubg|ببجي/i,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
  },
  // Clash of Clans / Clash Royale
  {
    pattern: /clash|كلاش/i,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
  },
  // Brawl Stars
  {
    pattern: /brawl|براول/i,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  },
  // 8 Ball Pool
  {
    pattern: /ball\s*pool|بليارد|pool\s*8/i,
    image: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=600&auto=format&fit=crop&q=80',
  },
  // Blood Strike
  {
    pattern: /blood\s*strike|بلود\s*سترايك/i,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
  },
  // Call of Duty Mobile
  {
    pattern: /call\s*of\s*duty|cod|كول\s*اوف/i,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
  },
  // FC Mobile / FIFA
  {
    pattern: /fc\s*mobile|fifa|football|كرة\s*القدم/i,
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&auto=format&fit=crop&q=80',
  },
  // Farlight 84
  {
    pattern: /farlight|فارلايت/i,
    image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop&q=80',
  },
  // Genshin Impact
  {
    pattern: /genshin|جينشين/i,
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
  },
  // Honor of Kings
  {
    pattern: /honor\s*of\s*kings|اونور/i,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  },
  // Hay Day
  {
    pattern: /hay\s*day|هاي\s*داي/i,
    image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&auto=format&fit=crop&q=80',
  },
  // Mobile Legends
  {
    pattern: /legend\s*mobile|mobile\s*legends|موبايل\s*ليجند/i,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
  },
  // Roblox
  {
    pattern: /roblox|روبلوكس/i,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  },
  // Fortnite
  {
    pattern: /fortnite|فورتنايت/i,
    image: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=600&auto=format&fit=crop&q=80',
  },
  // Strategy games: Revenge of Sultans, King of Avalon, Top War, Whiteout Survival
  {
    pattern: /revenge|sultan|انتقام\s*السلاطين|avalon|top\s*war|survival/i,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  },
  // Board & Card games: Jawaker, Kamlna
  {
    pattern: /jawaker|جواكر|kamlna|كملنا/i,
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=600&auto=format&fit=crop&q=80',
  },
  // Casual Games: Yalla Ludo, We Play
  {
    pattern: /yalla\s*ludo|ludo|we\s*play|لودو/i,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  },
  // TikTok
  {
    pattern: /tiktok|تيك\s*توك/i,
    image: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&auto=format&fit=crop&q=80',
  },
  // Telegram
  {
    pattern: /telegram|تليجرام|تلغرام/i,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  },
  // Snapchat
  {
    pattern: /snap\s*chat|سناب/i,
    image: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=600&auto=format&fit=crop&q=80',
  },
  // Music: Anghami, Spotify
  {
    pattern: /anghami|spotify|ساوند/i,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  },
  // Chat & Social Apps
  {
    pattern: /imo|miyo|tumile|livu|mixu|likee|chat|شات|دردشة|azar|live|hicat|مومو|سوجو|غوميت|بارتي|star\s*lite/i,
    image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=600&auto=format&fit=crop&q=80',
  },
  // ChatGPT & OpenAI
  {
    pattern: /chat\s*gpt|openai/i,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
  },
  // Gemini AI
  {
    pattern: /gemini/i,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  },
  // Canva & Design
  {
    pattern: /canva|design|تصميم/i,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
  },
  // CapCut
  {
    pattern: /capcut/i,
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
  },
  // Adobe
  {
    pattern: /adobe|ادوبي/i,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
  },
  // Office & Windows
  {
    pattern: /office|windows|اوفيس|ويندوز/i,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
  },
  // Netflix
  {
    pattern: /netflix|نتفلكس/i,
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80',
  },
  // Streaming & IPTV
  {
    pattern: /iptv|disney|osn|shahid|شاهد|look\s*4k|\btvs?\b|تلفزيون|watch/i,
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&auto=format&fit=crop&q=80',
  },
  // VPN
  {
    pattern: /vpn|express|nord|proton/i,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
  },
  // PlayStation / PSN
  {
    pattern: /play\s*station|psn|\bps\b|بلايستيشن/i,
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
  },
  // Steam
  {
    pattern: /steam|ستيم/i,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
  },
  // Google Play
  {
    pattern: /google\s*play|جوجل\s*بلاي/i,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
  },
  // iTunes / Apple
  {
    pattern: /itunes|apple|ابل|ايتونز/i,
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80',
  },
  // Razer Gold
  {
    pattern: /razer|رايزر/i,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
  },
  // General Cards
  {
    pattern: /recharge\s*cards|cards?|بطاق|كروت/i,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
  },
  // Telecom (Syriatel, MTN, Turkcell, etc.)
  {
    pattern: /syriatel|mtn|turkcell|telecom|alfa|سيريتل|ام\s*تي\s*ان/i,
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=80',
  },
  // Banks & Cash
  {
    pattern: /bank|كاش|cash|sham|balance|رصيد/i,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
  },
  // Numbers & SMS
  {
    pattern: /أرقام|ارقام|رقم|sms|otp|number/i,
    image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&auto=format&fit=crop&q=80',
  },
  // Crypto / USDT
  {
    pattern: /usdt|crypto|بيتكوين/i,
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600&auto=format&fit=crop&q=80',
  },
  // GSM Tools & Schematics
  {
    pattern: /tool|dongle|box|schematics|activation|unlock|frp|flash|chimera|miracle|octoplus|xiaomi|samkey|dft|hydra|z3x|amt|emg|repair|credits?|token|server|infinity|cert|huawei/i,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
  },
];

export function resolveServiceArtwork(name: string, storefrontCategory?: StorefrontCategory | null): string {
  if (name) {
    for (const rule of SERVICE_ARTWORK_PATTERNS) {
      if (rule.pattern.test(name)) return rule.image;
    }
  }
  if (storefrontCategory && CATEGORY_FALLBACK_IMAGES[storefrontCategory]) {
    return CATEGORY_FALLBACK_IMAGES[storefrontCategory];
  }
  return CATEGORY_FALLBACK_IMAGES.apps;
}
