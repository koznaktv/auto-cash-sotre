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
    name: 'ئويۇنلار',
    subtitle: 'PUBG ۋە HOK تەييار',
    icon: Gamepad2,
    isReady: true,
    countBadge: '2 ئويۇن تەييار',
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    glowColor: 'rgba(245, 158, 11, 0.35)'
  },
  {
    id: 'apps',
    name: 'ئەپلەر',
    subtitle: 'پات يېقىندا',
    icon: Smartphone,
    isReady: false,
    countBadge: 'يېقىندا',
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    glowColor: 'rgba(56, 189, 248, 0.35)'
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
// ھازىرقى پەقەت تولۇق پۈتكەن 2 ئويۇن
// يېڭى ئەپ پۈتكەندە، ئىشلەتكۈچىنىڭ تەلەپ قىلغان كاتېگورىيەسىگە قوشۇلىدۇ
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
    priceNote: '$1.10 دىن باشلىنىدۇ (60 - 16,200 UC)',
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
    priceNote: '$0.25 دىن باشلىنىدۇ (16 - 8,000 Token)',
    features: ['بىخەتەر ۋە رەسمىي يول', 'ئاپتوماتىك لاقىم (Nickname) دەلىللەش', 'سېكۇنتتا يېتىپ بارىدۇ'],
    isMicroApp: true
  }
];

export const ACTIVE_GAMES = ACTIVE_CATALOG.filter((app) => app.category === 'games');
