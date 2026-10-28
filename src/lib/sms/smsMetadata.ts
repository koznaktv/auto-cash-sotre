/**
 * Rich metadata for SMS Verification (PhoneCash / GrizzlySMS)
 * - Country mappings with Emoji flags, ISO codes, international dialing codes, and Uyghur names
 * - Service / App mappings with brand colors, full names (Uyghur + English), and icons
 */

export interface CountryMeta {
  id: number;
  name: string;
  nameUg: string;
  code: string; // ISO-2 alpha
  flag: string; // Emoji flag
  dialCode: string; // e.g. '+90'
  popular?: boolean;
}

export interface ServiceMeta {
  code: string;
  name: string;
  nameUg: string;
  category: 'social' | 'messaging' | 'ai' | 'entertainment' | 'gaming' | 'shopping' | 'tech' | 'other';
  color: string;
  iconUrl?: string;
  popular?: boolean;
}

// 1. Comprehensive Country Mapping
export const COUNTRY_META_MAP: Record<string, { code: string; flag: string; dialCode: string; nameUg: string }> = {
  // Turkey
  '62': { code: 'tr', flag: '🇹🇷', dialCode: '+90', nameUg: 'تۈركىيە' },
  'turkey': { code: 'tr', flag: '🇹🇷', dialCode: '+90', nameUg: 'تۈركىيە' },
  // USA
  '12': { code: 'us', flag: '🇺🇸', dialCode: '+1', nameUg: 'ئامېرىكا' },
  'usa': { code: 'us', flag: '🇺🇸', dialCode: '+1', nameUg: 'ئامېرىكا' },
  'usa (2)': { code: 'us', flag: '🇺🇸', dialCode: '+1', nameUg: 'ئامېرىكا' },
  // United Kingdom
  '16': { code: 'gb', flag: '🇬🇧', dialCode: '+44', nameUg: 'ئەنگلىيە' },
  'united kingdom': { code: 'gb', flag: '🇬🇧', dialCode: '+44', nameUg: 'ئەنگلىيە' },
  // Germany
  '43': { code: 'de', flag: '🇩🇪', dialCode: '+49', nameUg: 'گېرمانىيە' },
  'germany': { code: 'de', flag: '🇩🇪', dialCode: '+49', nameUg: 'گېرمانىيە' },
  // Russia
  '0': { code: 'ru', flag: '🇷🇺', dialCode: '+7', nameUg: 'روسىيە' },
  'russia': { code: 'ru', flag: '🇷🇺', dialCode: '+7', nameUg: 'روسىيە' },
  // Ukraine
  '1': { code: 'ua', flag: '🇺🇦', dialCode: '+380', nameUg: 'ئۇكرائىنا' },
  'ukraine': { code: 'ua', flag: '🇺🇦', dialCode: '+380', nameUg: 'ئۇكرائىنا' },
  // Kazakhstan
  '2': { code: 'kz', flag: '🇰🇿', dialCode: '+7', nameUg: 'قازاقىستان' },
  'kazakhstan': { code: 'kz', flag: '🇰🇿', dialCode: '+7', nameUg: 'قازاقىستان' },
  // Uzbekistan
  '40': { code: 'uz', flag: '🇺🇿', dialCode: '+998', nameUg: 'ئۆزبېكىستان' },
  'uzbekistan': { code: 'uz', flag: '🇺🇿', dialCode: '+998', nameUg: 'ئۆزبېكىستان' },
  // Kyrgyzstan
  '11': { code: 'kg', flag: '🇰🇬', dialCode: '+996', nameUg: 'قىرغىزىستان' },
  'kyrgyzstan': { code: 'kg', flag: '🇰🇬', dialCode: '+996', nameUg: 'قىرغىزىستان' },
  // Azerbaijan
  '35': { code: 'az', flag: '🇦🇿', dialCode: '+994', nameUg: 'ئەزەربەيجان' },
  'azerbaijan': { code: 'az', flag: '🇦🇿', dialCode: '+994', nameUg: 'ئەزەربەيجان' },
  // Saudi Arabia
  '53': { code: 'sa', flag: '🇸🇦', dialCode: '+966', nameUg: 'سەئۇدى ئەرەبىستان' },
  'saudi arabia': { code: 'sa', flag: '🇸🇦', dialCode: '+966', nameUg: 'سەئۇدى ئەرەبىستان' },
  // UAE
  '95': { code: 'ae', flag: '🇦🇪', dialCode: '+971', nameUg: 'ئەرەب بىرلەشمە خەلىپىلىكى' },
  'united arab emirates': { code: 'ae', flag: '🇦🇪', dialCode: '+971', nameUg: 'ئەرەب بىرلەشمە خەلىپىلىكى' },
  // Egypt
  '21': { code: 'eg', flag: '🇪🇬', dialCode: '+20', nameUg: 'مىسىر' },
  'egypt': { code: 'eg', flag: '🇪🇬', dialCode: '+20', nameUg: 'مىسىر' },
  // Syria
  '110': { code: 'sy', flag: '🇸🇾', dialCode: '+963', nameUg: 'سۇرىيە' },
  'syria': { code: 'sy', flag: '🇸🇾', dialCode: '+963', nameUg: 'سۇرىيە' },
  // Iraq
  '47': { code: 'iq', flag: '🇮🇶', dialCode: '+964', nameUg: 'ئىراق' },
  'iraq': { code: 'iq', flag: '🇮🇶', dialCode: '+964', nameUg: 'ئىراق' },
  // Jordan
  '116': { code: 'jo', flag: '🇯🇴', dialCode: '+962', nameUg: 'ئىئوردانىيە' },
  'jordan': { code: 'jo', flag: '🇯🇴', dialCode: '+962', nameUg: 'ئىئوردانىيە' },
  // Kuwait
  '100': { code: 'kw', flag: '🇰🇼', dialCode: '+965', nameUg: 'كۇۋەيت' },
  'kuwait': { code: 'kw', flag: '🇰🇼', dialCode: '+965', nameUg: 'كۇۋەيت' },
  // Qatar
  '111': { code: 'qa', flag: '🇶🇦', dialCode: '+974', nameUg: 'قاتار' },
  'qatar': { code: 'qa', flag: '🇶🇦', dialCode: '+974', nameUg: 'قاتار' },
  // France
  '78': { code: 'fr', flag: '🇫🇷', dialCode: '+33', nameUg: 'فىرانسىيە' },
  'france': { code: 'fr', flag: '🇫🇷', dialCode: '+33', nameUg: 'فىرانسىيە' },
  // Netherlands
  '48': { code: 'nl', flag: '🇳🇱', dialCode: '+31', nameUg: 'گوللاندىيە' },
  'netherlands': { code: 'nl', flag: '🇳🇱', dialCode: '+31', nameUg: 'گوللاندىيە' },
  // Canada
  '36': { code: 'ca', flag: '🇨🇦', dialCode: '+1', nameUg: 'كانادا' },
  'canada': { code: 'ca', flag: '🇨🇦', dialCode: '+1', nameUg: 'كانادا' },
  // Poland
  '15': { code: 'pl', flag: '🇵🇱', dialCode: '+48', nameUg: 'پولشا' },
  'poland': { code: 'pl', flag: '🇵🇱', dialCode: '+48', nameUg: 'پولشا' },
  // Sweden
  '46': { code: 'se', flag: '🇸🇪', dialCode: '+46', nameUg: 'شىۋېتسىيە' },
  'sweden': { code: 'se', flag: '🇸🇪', dialCode: '+46', nameUg: 'شىۋېتسىيە' },
  // Spain
  '56': { code: 'es', flag: '🇪🇸', dialCode: '+34', nameUg: 'ئىسپانىيە' },
  'spain': { code: 'es', flag: '🇪🇸', dialCode: '+34', nameUg: 'ئىسپانىيە' },
  // Italy
  '86': { code: 'it', flag: '🇮🇹', dialCode: '+39', nameUg: 'ئىتالىيە' },
  'italy': { code: 'it', flag: '🇮🇹', dialCode: '+39', nameUg: 'ئىتالىيە' },
  // Indonesia
  '6': { code: 'id', flag: '🇮🇩', dialCode: '+62', nameUg: 'ھىندونېزىيە' },
  'indonesia': { code: 'id', flag: '🇮🇩', dialCode: '+62', nameUg: 'ھىندونېزىيە' },
  // Malaysia
  '7': { code: 'my', flag: '🇲🇾', dialCode: '+60', nameUg: 'مالايشىيا' },
  'malaysia': { code: 'my', flag: '🇲🇾', dialCode: '+60', nameUg: 'مالايشىيا' },
  // Vietnam
  '10': { code: 'vn', flag: '🇻🇳', dialCode: '+84', nameUg: 'ۋىيېتنام' },
  'vietnam': { code: 'vn', flag: '🇻🇳', dialCode: '+84', nameUg: 'ۋىيېتنام' },
  // Philippines
  '4': { code: 'ph', flag: '🇵🇭', dialCode: '+63', nameUg: 'فىلىپپىن' },
  'philippines': { code: 'ph', flag: '🇵🇭', dialCode: '+63', nameUg: 'فىلىپپىن' },
  // Brazil
  '73': { code: 'br', flag: '🇧🇷', dialCode: '+55', nameUg: 'بىرازىلىيە' },
  'brazil': { code: 'br', flag: '🇧🇷', dialCode: '+55', nameUg: 'بىرازىلىيە' },
  // India
  '22': { code: 'in', flag: '🇮🇳', dialCode: '+91', nameUg: 'ھىندىستان' },
  'india': { code: 'in', flag: '🇮🇳', dialCode: '+91', nameUg: 'ھىندىستان' },
  // China / Hong Kong
  '3': { code: 'cn', flag: '🇨🇳', dialCode: '+86', nameUg: 'جۇڭگو' },
  'china': { code: 'cn', flag: '🇨🇳', dialCode: '+86', nameUg: 'جۇڭگو' },
  '14': { code: 'hk', flag: '🇭🇰', dialCode: '+852', nameUg: 'شياڭگاڭ' },
  'hong kong': { code: 'hk', flag: '🇭🇰', dialCode: '+852', nameUg: 'شياڭگاڭ' },
};

// 2. Comprehensive Service/App Metadata
export const SERVICE_META_MAP: Record<string, ServiceMeta> = {
  tg: {
    code: 'tg',
    name: 'Telegram',
    nameUg: 'تېلېگرام',
    category: 'messaging',
    color: '#229ED9',
    iconUrl: 'https://cdn.simpleicons.org/telegram/229ED9',
    popular: true,
  },
  wa: {
    code: 'wa',
    name: 'WhatsApp',
    nameUg: 'ۋاتساپ',
    category: 'messaging',
    color: '#25D366',
    iconUrl: 'https://cdn.simpleicons.org/whatsapp/25D366',
    popular: true,
  },
  go: {
    code: 'go',
    name: 'Google / Gmail / YouTube',
    nameUg: 'گۇگۇل / جىمېيل',
    category: 'tech',
    color: '#EA4335',
    iconUrl: 'https://cdn.simpleicons.org/google/EA4335',
    popular: true,
  },
  oi: {
    code: 'oi',
    name: 'OpenAI / ChatGPT',
    nameUg: 'ChatGPT / سۈنئىي ئەقىل',
    category: 'ai',
    color: '#10A37F',
    iconUrl: 'https://cdn.simpleicons.org/openai/10A37F',
    popular: true,
  },
  ig: {
    code: 'ig',
    name: 'Instagram',
    nameUg: 'ئىنستاگرام',
    category: 'social',
    color: '#E4405F',
    iconUrl: 'https://cdn.simpleicons.org/instagram/E4405F',
    popular: true,
  },
  fb: {
    code: 'fb',
    name: 'Facebook',
    nameUg: 'فەيسىبۇك',
    category: 'social',
    color: '#1877F2',
    iconUrl: 'https://cdn.simpleicons.org/facebook/1877F2',
    popular: true,
  },
  tt: {
    code: 'tt',
    name: 'TikTok',
    nameUg: 'تىكتوك',
    category: 'social',
    color: '#FE2C55',
    iconUrl: 'https://cdn.simpleicons.org/tiktok/FE2C55',
    popular: true,
  },
  tw: {
    code: 'tw',
    name: 'X (Twitter)',
    nameUg: 'X (تۋىتتېر)',
    category: 'social',
    color: '#1DA1F2',
    iconUrl: 'https://cdn.simpleicons.org/x/FFFFFF',
    popular: true,
  },
  ds: {
    code: 'ds',
    name: 'Discord',
    nameUg: 'دىسكورد',
    category: 'messaging',
    color: '#5865F2',
    iconUrl: 'https://cdn.simpleicons.org/discord/5865F2',
    popular: true,
  },
  sn: {
    code: 'sn',
    name: 'Snapchat',
    nameUg: 'سناپچات',
    category: 'social',
    color: '#FFFC00',
    iconUrl: 'https://cdn.simpleicons.org/snapchat/FFFC00',
    popular: true,
  },
  vi: {
    code: 'vi',
    name: 'Viber',
    nameUg: 'ۋايبېر',
    category: 'messaging',
    color: '#7360F2',
    iconUrl: 'https://cdn.simpleicons.org/viber/7360F2',
    popular: false,
  },
  wb: {
    code: 'wb',
    name: 'WeChat (ۋېيشىن)',
    nameUg: 'ئۈندىدار (ۋېيشىن)',
    category: 'messaging',
    color: '#07C160',
    iconUrl: 'https://cdn.simpleicons.org/wechat/07C160',
    popular: true,
  },
  nf: {
    code: 'nf',
    name: 'Netflix',
    nameUg: 'نېتفلىكىس',
    category: 'entertainment',
    color: '#E50914',
    iconUrl: 'https://cdn.simpleicons.org/netflix/E50914',
    popular: false,
  },
  sp: {
    code: 'sp',
    name: 'Spotify',
    nameUg: 'سپوتىفاي',
    category: 'entertainment',
    color: '#1ED760',
    iconUrl: 'https://cdn.simpleicons.org/spotify/1ED760',
    popular: false,
  },
  st: {
    code: 'st',
    name: 'Steam',
    nameUg: 'ستېئام',
    category: 'gaming',
    color: '#66C0F4',
    iconUrl: 'https://cdn.simpleicons.org/steam/66C0F4',
    popular: false,
  },
  mb: {
    code: 'mb',
    name: 'Microsoft / Outlook',
    nameUg: 'مايكروسوفت',
    category: 'tech',
    color: '#00A4EF',
    iconUrl: 'https://cdn.simpleicons.org/microsoft/00A4EF',
    popular: false,
  },
  am: {
    code: 'am',
    name: 'Amazon',
    nameUg: 'ئامازون',
    category: 'shopping',
    color: '#FF9900',
    iconUrl: 'https://cdn.simpleicons.org/amazon/FF9900',
    popular: false,
  },
  ap: {
    code: 'ap',
    name: 'Apple ID',
    nameUg: 'ئالما (Apple ID)',
    category: 'tech',
    color: '#A2AAAD',
    iconUrl: 'https://cdn.simpleicons.org/apple/A2AAAD',
    popular: false,
  },
  ub: {
    code: 'ub',
    name: 'Uber',
    nameUg: 'ئۇبېر',
    category: 'tech',
    color: '#000000',
    iconUrl: 'https://cdn.simpleicons.org/uber/FFFFFF',
    popular: false,
  },
  ka: {
    code: 'ka',
    name: 'KakaoTalk',
    nameUg: 'كاكاۋتوك',
    category: 'messaging',
    color: '#FEE500',
    iconUrl: 'https://cdn.simpleicons.org/kakaotalk/FEE500',
    popular: false,
  },
  li: {
    code: 'li',
    name: 'LinkedIn',
    nameUg: 'لىنكىدىن',
    category: 'social',
    color: '#0A66C2',
    iconUrl: 'https://cdn.simpleicons.org/linkedin/0A66C2',
    popular: false,
  },
  yl: {
    code: 'yl',
    name: 'Yandex',
    nameUg: 'ياندېكىس',
    category: 'tech',
    color: '#FC3F1D',
    iconUrl: 'https://cdn.simpleicons.org/yandex/FC3F1D',
    popular: false,
  },
  ot: {
    code: 'ot',
    name: 'Any Other Service',
    nameUg: 'باشقا بارلىق ئەپلەر',
    category: 'other',
    color: '#F59E0B',
    iconUrl: '',
    popular: true,
  },
};

/**
 * Returns enriched country information
 */
export function getEnrichedCountry(rawCountry: { id: number | string; name: string; code?: any; flag?: string }): CountryMeta {
  const idStr = String(rawCountry.id);
  const nameLower = (rawCountry.name || '').toLowerCase().trim();
  const meta = COUNTRY_META_MAP[idStr] || COUNTRY_META_MAP[nameLower];

  const code = meta?.code || (typeof rawCountry.code === 'string' && rawCountry.code.length === 2 ? rawCountry.code.toLowerCase() : 'globe');
  const flag = meta?.flag || rawCountry.flag || '🌐';
  const dialCode = meta?.dialCode || '';
  const nameUg = meta?.nameUg || rawCountry.name;

  return {
    id: Number(rawCountry.id),
    name: rawCountry.name,
    nameUg,
    code,
    flag,
    dialCode,
    popular: ['62', '12', '16', '43', '0', '1', '2', '40', '53', '95', '110', '47', '21', '6'].includes(idStr),
  };
}

/**
 * Returns enriched service/app information with calculated 20% profit margin
 */
export function getEnrichedService(rawService: { service_code: string; name: string; price: number; count: number }): {
  service_code: string;
  name: string;
  nameUg: string;
  costPrice: number;
  sellPrice: number;
  count: number;
  category: string;
  color: string;
  iconUrl?: string;
  popular: boolean;
} {
  const code = (rawService.service_code || '').toLowerCase().trim();
  const meta = SERVICE_META_MAP[code];

  const wholesaleCost = Number(rawService.price || 0);
  // Apply exactly 20% profit margin as requested by user, round to 2 decimals, minimum $0.05
  const sellPrice = Math.max(0.05, Number((wholesaleCost * 1.20).toFixed(2)));

  return {
    service_code: rawService.service_code,
    name: meta?.name || rawService.name || code.toUpperCase(),
    nameUg: meta?.nameUg || meta?.name || rawService.name || code.toUpperCase(),
    costPrice: wholesaleCost,
    sellPrice,
    count: Number(rawService.count || 0),
    category: meta?.category || 'other',
    color: meta?.color || '#38BDF8',
    iconUrl: meta?.iconUrl,
    popular: Boolean(meta?.popular),
  };
}
