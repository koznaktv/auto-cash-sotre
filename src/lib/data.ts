import type { CheckoutField, QtyRule } from './catalog/types';

export interface ServiceSubCategory {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
  requiresZoneId?: boolean;
  zoneIdLabel?: string;
  zoneIdPlaceholder?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
}

export interface ServicePackage {
  id: string;
  title: string;
  /** Sell price; for 'amount' products this is the price of the minimum quantity. */
  price: number;
  originalPrice?: number;
  duration?: string;
  subCategoryId?: string;
  // Present on packages that come from the provider catalog
  providerProductId?: number;
  productType?: 'amount' | 'fixed' | 'package';
  /** Sell price per unit for 'amount' products. */
  unitPrice?: number;
  qty?: QtyRule;
  fields?: CheckoutField[];
  available?: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'games' | 'apps' | 'balance' | 'social' | 'numbers' | 'crypto' | 'accounts' | 'cards' | 'ai' | (string & {});
  icon: string;
  image?: string;
  description: string;
  badge?: string;
  subCategories?: ServiceSubCategory[];
  packages: ServicePackage[];
  inputPlaceholder?: string;
  inputLabel?: string;
  requiresZoneId?: boolean;
  zoneIdLabel?: string;
  zoneIdPlaceholder?: string;
  bioContent?: string;
  source?: 'legacy' | 'provider';
  published?: boolean;
}

export const CATEGORIES_9 = [
  { id: 'apps', name: 'ئەپلەر', icon: 'Smartphone', count: 'ئەپلەر', image: '/images/services/picsart.jpg' },
  { id: 'ai', name: 'سۈنئىي ئەقىل', icon: 'Bot', count: 'AI مۇلازىمەت', image: '/images/services/google_gemini.jpg' },
  { id: 'numbers', name: 'تېلېگرام ئەزالىق', icon: 'MessageSquareShare', count: 'Telegram Premium', image: '/images/services/telegram.jpg' },
  { id: 'cards', name: 'تىلفۇن كارتىلىرىغا پۇل قاچىلاش', icon: 'CreditCard', count: 'Turkcell', image: '/images/services/turkcell.jpg' },
  { id: 'games', name: 'ئويۇنلار تۈرى ', icon: 'Gamepad2', count: 'تىلىفۇن ئۇيۇنلىرى', image: '/images/services/pubg_mobile.jpg' },
  { id: 'accounts', name: 'تەييار ھېساباتلار', icon: 'KeyRound', count: 'ھېساباتلار', image: '/images/services/cursor_pro.jpg' },
  { id: 'crypto', name: 'شىفىرلىق پۇل (USDT)', icon: 'Coins', count: 'USDT, Crypto', image: '/images/services/visa_card.jpg' },
  { id: 'social', name: 'ئىجتىمائىي تاراتقۇ', icon: 'Share2', count: 'Followers, Likes', image: '/images/services/instagram.jpg' },
  { id: 'balance', name: 'يەرلىك ھەميان', icon: 'Wallet', count: 'تولۇقلاش', image: '/images/services/vodafone_cash.jpg' },
] as const;

import preloadedServices from '../../data/autocash_services.json';

export const SERVICES_DATA: ServiceItem[] = (preloadedServices as any) || [];
