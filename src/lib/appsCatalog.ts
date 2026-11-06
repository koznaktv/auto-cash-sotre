import {
  Gamepad2,
  Smartphone,
  Bot,
  CreditCard,
  PhoneCall,
  Share2,
  LucideIcon
} from 'lucide-react';

export type CategoryId = 'games' | 'apps' | 'cards' | 'ai' | 'sms' | 'social';

export interface ActiveApp {
  id: string;
  name: string;
  category: CategoryId;
  tagline: string;
  description: string;
  icon: string;
  rating: number;
  ordersCount: string;
  speed: string;
  badge: string;
  badgeColor: string;
  webUrl: string;
  telegramAppUrl: string;
  priceNote: string;
  features: string[];
  isMicroApp?: boolean;
  isPaused?: boolean;
  pausedMessage?: string;
}

export interface CategoryItem {
  id: CategoryId;
  name: string;
  subtitle: string;
  icon: LucideIcon;
  isReady: boolean;
  countBadge: string;
  gradient: string;
  glowColor: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'games',
    name: 'ئويۇنلار بۆلۈمى',
    subtitle: 'PUBG, HOK ۋە MLBB تەييار',
    icon: Gamepad2,
    isReady: true,
    countBadge: '3 ئويۇن تەييار',
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    glowColor: 'rgba(245, 158, 11, 0.35)'
  },
  {
    id: 'apps',
    name: 'تېلېفون ۋە تور بۆلۈمى',
    subtitle: 'ۋاقتىنچە توختىتىلدى',
    icon: Smartphone,
    isReady: false,
    countBadge: 'ۋاقتىنچە توختىتىلدى',
    gradient: 'from-slate-600 via-zinc-600 to-gray-700',
    glowColor: 'rgba(100, 116, 139, 0.35)'
  },
  {
    id: 'cards',
    name: 'كارتىلار',
    subtitle: 'پات يېقىندا',
    icon: CreditCard,
    isReady: false,
    countBadge: 'يېقىندا',
    gradient: 'from-emerald-500 via-teal-500 to-green-600',
    glowColor: 'rgba(16, 185, 129, 0.35)'
  },
  {
    id: 'ai',
    name: 'سۈنئىي ئەقىل',
    subtitle: 'پات يېقىندا',
    icon: Bot,
    isReady: false,
    countBadge: 'يېقىندا',
    gradient: 'from-purple-500 via-violet-500 to-indigo-600',
    glowColor: 'rgba(168, 85, 247, 0.35)'
  },
  {
    id: 'sms',
    name: 'مەۋھۇم نومۇر',
    subtitle: 'پات يېقىندا',
    icon: PhoneCall,
    isReady: false,
    countBadge: 'يېقىندا',
    gradient: 'from-cyan-500 via-teal-500 to-emerald-600',
    glowColor: 'rgba(6, 182, 212, 0.35)'
  },
  {
    id: 'social',
    name: 'ئىجتىمائىي تاراتقۇ',
    subtitle: 'پات يېقىندا',
    icon: Share2,
    isReady: false,
    countBadge: 'يېقىندا',
    gradient: 'from-rose-500 via-pink-500 to-orange-500',
    glowColor: 'rgba(244, 63, 94, 0.35)'
  }
];

// =========================================================================
// MAX-BAZAR رەسمىي ئەپلەر كاتالوگى
// 1. PUBG Mobile UC
// 2. Honor of Kings Token
// 3. Mobile Legends: Bang Bang (ئالماس، ھەپتىلىك كارتىلار، سوۋغاتلار)
// 4. MTN سۈرىيە (پۇل قاچىلاش ۋە مەخسۇس تور)
// 5. Syriatel سۈرىيەتەل (ياشباك، قالدۇق پۇل ۋە سوپېر تور)
// =========================================================================
export const ACTIVE_CATALOG: ActiveApp[] = [
  {
    id: 'pubg',
    name: 'PUBG Mobile UC بازىرى',
    category: 'games',
    tagline: 'Player ID ئارقىلىق 3 سېكۇنتتا يېتىدۇ',
    description: '',
    icon: '/images/apps/pubg/icon-512.png',
    rating: 4.98,
    ordersCount: '15.8k+ قاچىلانغان',
    speed: '3 سېكۇنت',
    badge: '🔥 ئەڭ ئالقىشلانغان',
    badgeColor: 'from-amber-500 to-yellow-600',
    webUrl: '/apps/pubg',
    telegramAppUrl: 'https://t.me/maxbazar_bot/pubg',
    priceNote: '$0.99 دىن باشلىنىدۇ (60 - 16,200 UC)',
    features: ['رەسمىي سەرۋەرگە بىۋاسىتە كىرىدۇ', 'ئويۇن كىملىكى (UID) تەكشۈرۈش', 'شامكەش شحن فوري'],
    isMicroApp: true
  },
  {
    id: 'hok',
    name: 'Honor of Kings Token بازىرى',
    category: 'games',
    tagline: 'Player ID ئارقىلىق بىۋاسىتە توكېن قاچىلاش',
    description: '',
    icon: '/images/apps/honor-of-kings/icon-512.png',
    rating: 4.96,
    ordersCount: '9.9k+ قاچىلانغان',
    speed: '5 سېكۇنت',
    badge: '👑 ئالىي دەرىجىلىك',
    badgeColor: 'from-purple-500 to-indigo-600',
    webUrl: '/apps/honor-of-kings',
    telegramAppUrl: 'https://t.me/maxbazar_bot/hok',
    priceNote: '$0.20 دىن باشلىنىدۇ (16 - 8,000 Token)',
    features: ['بىخەتەر ۋە رەسمىي يول', 'ئاپتوماتىك لاقىم (Nickname) دەلىللەش', 'سېكۇنتتا يېتىپ بارىدۇ'],
    isMicroApp: true
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends: Bang Bang بازىرى',
    category: 'games',
    tagline: 'User ID + Zone ID ئارقىلىق 3 سېكۇنتتا يېتىدۇ',
    description: '',
    icon: '/images/apps/mobile-legends/icon-512.png',
    rating: 4.97,
    ordersCount: '12.4k+ قاچىلانغان',
    speed: '3 سېكۇنت',
    badge: '⚔️ ئالماس ۋە كارتىلار',
    badgeColor: 'from-blue-500 to-indigo-600',
    webUrl: '/apps/mobile-legends',
    telegramAppUrl: 'https://t.me/maxbazar_bot/mlbb',
    priceNote: '$0.27 دىن باشلىنىدۇ (10 - 6,000 ئالماس)',
    features: ['رەسمىي سەرۋەرگە بىۋاسىتە ئالماس', 'ھەپتىلىك ئالماس كارتىسى (Pass)', 'شامكەش شحن فوري'],
    isMicroApp: true
  },
  {
    id: 'mtn',
    name: 'MTN سۈرىيە — تېلېفون ۋە تور بازىرى',
    category: 'apps',
    tagline: 'يانفونغا پۇل قاچىلاش ۋە مەخسۇس تور بولاقلىرى',
    description: '',
    icon: '/images/apps/mtn-syria/icon-512.png',
    rating: 4.95,
    ordersCount: '28.1k+ قاچىلانغان',
    speed: 'ۋاقتىنچە توختىتىلدى',
    badge: '⏸️ ۋاقتىنچە توختىتىلدى',
    badgeColor: 'from-rose-500 to-amber-600',
    webUrl: '/apps/mtn-syria',
    telegramAppUrl: 'https://t.me/maxbazar_bot/mtn',
    priceNote: 'مۇلازىمەت ۋاقتىنچە توختىتىلدى',
    features: ['بىۋاسىتە تېلېفونغا قالدۇق قاچىلاش', 'سۈرئەتلىك تور بولاقلىرى (1GB - 100GB)', 'سېكۇنتتا يېتىپ بېرىش'],
    isMicroApp: true,
    isPaused: true,
    pausedMessage: 'بۇ مۇلازىمەت ھازىرچە ۋاقتىنچە توختىتىلدى (تېخنىكىلىق رېمونت قىلىنىۋاتىدۇ).'
  },
  {
    id: 'syriatel',
    name: 'Syriatel — تېلېفون ۋە تور بازىرى',
    category: 'apps',
    tagline: 'ياشباك، قالدۇق پۇل ۋە سوپېر تور بولاقلىرى',
    description: '',
    icon: '/images/apps/syriatel/icon-512.png',
    rating: 4.98,
    ordersCount: '34.6k+ قاچىلانغان',
    speed: 'ۋاقتىنچە توختىتىلدى',
    badge: '⏸️ ۋاقتىنچە توختىتىلدى',
    badgeColor: 'from-rose-500 to-amber-600',
    webUrl: '/apps/syriatel',
    telegramAppUrl: 'https://t.me/maxbazar_bot/syriatel',
    priceNote: 'مۇلازىمەت ۋاقتىنچە توختىتىلدى',
    features: ['سۈرىيەتەل ياشباك ۋە كاش', 'سوپېر تور بولاقلىرى (1.5GB - 70GB)', 'ئاپتوماتىك دەلىللەش'],
    isMicroApp: true,
    isPaused: true,
    pausedMessage: 'بۇ مۇلازىمەت ھازىرچە ۋاقتىنچە توختىتىلدى (تېخنىكىلىق رېمونت قىلىنىۋاتىدۇ).'
  }
];

export const ACTIVE_GAMES = ACTIVE_CATALOG.filter((app) => app.category === 'games');
