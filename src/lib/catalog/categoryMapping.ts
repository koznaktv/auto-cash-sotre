import type { StorefrontCategory } from './types';

/**
 * Guesses which of our 9 storefront categories a provider category belongs to from its
 * (mostly Arabic) name. Order matters: the first matching rule wins. Admin overrides always
 * take precedence; categories matching nothing stay hidden until an admin maps them.
 */
const RULES: { category: StorefrontCategory; pattern: RegExp }[] = [
  { category: 'ai', pattern: /ذكاء|اصطناعي|chat\s*gpt|openai|gemini|claude|midjourney|copilot|\bai\b/i },
  { category: 'numbers', pattern: /أرقام|ارقام|رقم|sms|otp|virtual\s*number|numbers?\b/i },
  { category: 'crypto', pattern: /usdt|crypto|بيتكوين|عملات\s*رقمية|binance|trc20|bep20/i },
  { category: 'accounts', pattern: /حسابات|حساب\s*جاهز|netflix|نتفلكس|spotify|سبوتيفاي|shahid|شاهد|youtube\s*premium|disney/i },
  { category: 'social', pattern: /متابع|لايك|مشاهد|تواصل|سوشيال|followers?|likes?|views?|social|tiktok|instagram|facebook|snapchat|telegram\s*(members|stars)/i },
  { category: 'balance', pattern: /رصيد|سيريتل|syriatel|mtn|ام\s*تي\s*ان|وحدات|كاش|cash|محفظ|balance|\bbanks?\b|بنك|transfer|حوالة|حوالات/i },
  { category: 'cards', pattern: /بطاق|كرت|كروت|gift|card|voucher|itunes|google\s*play|playstation|psn|xbox|steam|razer/i },
  { category: 'apps', pattern: /تطبيق|دردشة|برامج|app|bigo|tango|likee|imo|yalla|ludo|chat|software|\btvs?\b/i },
  { category: 'games', pattern: /ألعاب|العاب|لعبة|شحن\s*ألعاب|games?|pubg|ببجي|free\s*fire|فري\s*فاير|mobile\s*legends|clash|fortnite|roblox|genshin|valorant/i },
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
