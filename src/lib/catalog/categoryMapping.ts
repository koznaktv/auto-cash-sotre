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
  games: '/images/services/pubg_mobile.jpg',
  apps: '/images/services/tiktok.jpg',
  ai: '/images/services/chatgpt.jpg',
  numbers: '/images/services/telegram.jpg',
  cards: '/images/services/google_play.jpg',
  accounts: '/images/services/netflix.jpg',
  crypto: '/images/services/crypto_usdt.jpg',
  social: '/images/services/snapchat.jpg',
  balance: '/shamcash.png',
};

const SERVICE_ARTWORK_PATTERNS: { pattern: RegExp; image: string }[] = [
  // Free Fire
  {
    pattern: /free\s*fire|فري\s*فاير/i,
    image: '/images/services/free_fire.jpg',
  },
  // PUBG Mobile, PUBG Lite, PUBG New State
  {
    pattern: /new\s*state/i,
    image: '/images/services/pubg_new_state.jpg',
  },
  {
    pattern: /pubg|ببجي/i,
    image: '/images/services/pubg_mobile.jpg',
  },
  // Clash of Clans
  {
    pattern: /clash\s*of\s*clans|كلاش\s*اوف|كلاش\s*رويال\s*clans/i,
    image: '/images/services/clash_of_clans.jpg',
  },
  // Clash Royale
  {
    pattern: /clash\s*royale|رويال/i,
    image: '/images/services/clash_royale.jpg',
  },
  // General Clash fallback
  {
    pattern: /clash|كلاش/i,
    image: '/images/services/clash_of_clans.jpg',
  },
  // Brawl Stars
  {
    pattern: /brawl|براول/i,
    image: '/images/services/brawl_stars.jpg',
  },
  // 8 Ball Pool
  {
    pattern: /ball\s*pool|بليارد|pool\s*8/i,
    image: '/images/services/ball_pool_8.jpg',
  },
  // Blood Strike
  {
    pattern: /blood\s*strike|بلود\s*سترايك/i,
    image: '/images/services/blood_strike.jpg',
  },
  // Borneo Schematics
  {
    pattern: /borneo|بورنيو/i,
    image: '/images/services/borneo_schematics.jpg',
  },
  // Decoders Tools & GSM Tools
  {
    pattern: /decoder|decoders/i,
    image: '/images/services/decoders_tools.jpg',
  },
  // Call of Duty Mobile
  {
    pattern: /call\s*of\s*duty|\bcod\b|كول\s*اوف/i,
    image: '/images/services/call_of_duty.jpg',
  },
  // FC Mobile / FIFA
  {
    pattern: /fc\s*mobile|fifa|football|كرة\s*القدم/i,
    image: '/images/services/fc_mobile.jpg',
  },
  // Farlight 84
  {
    pattern: /farlight|فارلايت/i,
    image: '/images/services/farlight_84.jpg',
  },
  // Genshin Impact
  {
    pattern: /genshin|جينشين/i,
    image: '/images/services/genshin_impact.jpg',
  },
  // Honor of Kings
  {
    pattern: /honor\s*of\s*kings|اونور/i,
    image: '/images/services/honor_of_kings.jpg',
  },
  // Hay Day
  {
    pattern: /hay\s*day|هاي\s*داي/i,
    image: '/images/services/hay_day.jpg',
  },
  // Mobile Legends
  {
    pattern: /legend\s*mobile|mobile\s*legends|موبايل\s*ليجند/i,
    image: '/images/services/mobile_legends.jpg',
  },
  // Roblox
  {
    pattern: /roblox|روبلوكس/i,
    image: '/images/services/roblox.jpg',
  },
  // Fortnite
  {
    pattern: /fortnite|فورتنايت/i,
    image: '/images/services/fortnite.jpg',
  },
  // Strategy games: Revenge of Sultans, King of Avalon, Top War
  {
    pattern: /revenge|sultan|انتقام\s*السلاطين/i,
    image: '/images/services/revenge_of_sultans.jpg',
  },
  {
    pattern: /avalon/i,
    image: '/images/services/king_of_avalon.jpg',
  },
  {
    pattern: /top\s*war/i,
    image: '/images/services/top_war.jpg',
  },
  // Board & Card games: Jawaker, Kamlna
  {
    pattern: /jawaker|جواكر/i,
    image: '/images/services/jawaker.jpg',
  },
  {
    pattern: /kamlna|كملنا/i,
    image: '/images/services/kamlna.jpg',
  },
  // Casual Games: Yalla Ludo, We Play
  {
    pattern: /yalla\s*ludo|لودو/i,
    image: '/images/services/yalla_ludo.jpg',
  },
  {
    pattern: /we\s*play/i,
    image: '/images/services/weplay.jpg',
  },
  // TikTok
  {
    pattern: /tiktok|تيك\s*توك/i,
    image: '/images/services/tiktok.jpg',
  },
  // Telegram
  {
    pattern: /telegram|تليجرام|تلغرام/i,
    image: '/images/services/telegram.jpg',
  },
  // Snapchat
  {
    pattern: /snap\s*chat|سناب/i,
    image: '/images/services/snapchat.jpg',
  },
  // Music: Anghami, Spotify
  {
    pattern: /anghami|انغامي/i,
    image: '/images/services/anghami.jpg',
  },
  {
    pattern: /spotify|ساوند/i,
    image: '/images/services/spotify.jpg',
  },
  // Chat & Social Apps
  {
    pattern: /imo|ايمو/i,
    image: '/images/services/imo.jpg',
  },
  {
    pattern: /azar|ازار/i,
    image: '/images/services/azar.jpg',
  },
  {
    pattern: /livu|ليف\s*يو/i,
    image: '/images/services/livu.jpg',
  },
  {
    pattern: /tumile|توميل/i,
    image: '/images/services/tumile.jpg',
  },
  {
    pattern: /mixu|ميكس/i,
    image: '/images/services/mixu.jpg',
  },
  {
    pattern: /miyo|ميو/i,
    image: '/images/services/miyo.jpg',
  },
  {
    pattern: /hicat|هاي\s*كات/i,
    image: '/images/services/hicat.jpg',
  },
  {
    pattern: /likee|لايكي/i,
    image: '/images/services/likee.jpg',
  },
  // ChatGPT & OpenAI
  {
    pattern: /chat\s*gpt|chatgpt|openai|\bai\b|سۈنئىي\s*ئەقىل|ذكاء/i,
    image: '/images/services/chatgpt.jpg',
  },
  // Chat & Social Apps
  {
    pattern: /\bchat\b|شات|دردشة|live|مومو|سوجو|غوميت|بارتي|star\s*lite/i,
    image: '/images/services/yalla_ludo.jpg',
  },
  // Canva & Design
  {
    pattern: /canva|design|تصميم/i,
    image: '/images/services/canva.jpg',
  },
  // CapCut
  {
    pattern: /capcut|كاب\s*كات/i,
    image: '/images/services/capcut.jpg',
  },
  // Netflix
  {
    pattern: /netflix|نتفلكس/i,
    image: '/images/services/netflix.jpg',
  },
  // Streaming & IPTV
  {
    pattern: /shahid|شاهد/i,
    image: '/images/services/shahid.jpg',
  },
  {
    pattern: /iptv|disney|osn|look\s*4k|\btvs?\b|تلفزيون|watch/i,
    image: '/images/services/netflix.jpg',
  },
  // PlayStation / PSN
  {
    pattern: /play\s*station|psn|\bps\b|بلايستيشن/i,
    image: '/images/services/playstation.jpg',
  },
  // Steam
  {
    pattern: /steam|ستيم/i,
    image: '/images/services/steam.jpg',
  },
  // Google Play
  {
    pattern: /google\s*play|جوجل\s*بلاي/i,
    image: '/images/services/google_play.jpg',
  },
  // iTunes / Apple
  {
    pattern: /itunes|apple|ابل|ايتونز/i,
    image: '/images/services/apple_itunes.jpg',
  },
  // Razer Gold
  {
    pattern: /razer|رايزر/i,
    image: '/images/services/razer_gold.jpg',
  },
  // Borneo Schematics
  {
    pattern: /borneo|بورنيو/i,
    image: '/images/services/borneo_schematics.jpg',
  },
  // Decoders Tools & GSM Tools
  {
    pattern: /decoder|decoders/i,
    image: '/images/services/decoders_tools.jpg',
  },
  {
    pattern: /tool|dongle|box|schematics|activation|unlock|frp|flash|chimera|miracle|octoplus|xiaomi|samkey|dft|hydra|z3x|amt|emg|repair|credits?|token|server|infinity|cert|huawei/i,
    image: '/images/services/decoders_tools.jpg',
  },
  // General Cards
  {
    pattern: /recharge\s*cards|cards?|بطاق|كروت/i,
    image: '/images/services/google_play.jpg',
  },
  // Telecom (Syriatel, MTN, Turkcell, Turk Telekom)
  {
    pattern: /syriatel|سيريتل/i,
    image: '/images/services/syriatel.jpg',
  },
  {
    pattern: /mtn|ام\s*تي\s*ان/i,
    image: '/images/services/mtn.jpg',
  },
  {
    pattern: /turkcell|تركسل/i,
    image: '/images/services/turkcell.jpg',
  },
  {
    pattern: /telecom|ترك\s*تليكوم|turk\s*telekom/i,
    image: '/images/services/turk_telekom.jpg',
  },
  // Banks & Cash (Sham Cash)
  {
    pattern: /sham|شام/i,
    image: '/shamcash.png',
  },
  {
    pattern: /bank|كاش|cash|balance|رصيد/i,
    image: '/shamcash.png',
  },
  // Numbers & SMS
  {
    pattern: /أرقام|ارقام|رقم|sms|otp|number/i,
    image: '/images/services/telegram.jpg',
  },
  // Crypto / USDT
  {
    pattern: /usdt|crypto|بيتكوين/i,
    image: '/images/services/crypto_usdt.jpg',
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
