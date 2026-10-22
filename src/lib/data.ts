import type { CheckoutField, QtyRule } from './catalog/types';

export interface ServicePackage {
  id: string;
  title: string;
  /** Sell price; for 'amount' products this is the price of the minimum quantity. */
  price: number;
  originalPrice?: number;
  duration?: string;
  // Present on packages that come from the provider catalog
  providerProductId?: number;
  productType?: 'amount' | 'fixed';
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
  { id: 'games', name: 'ئويۇنلار', icon: 'Gamepad2', count: 'ئويۇنلار', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80' },
  { id: 'apps', name: 'ئەپلەر', icon: 'Smartphone', count: 'ئەپلەر', image: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=150&auto=format&fit=crop&q=80' },
  { id: 'ai', name: 'سۈنئىي ئەقىل', icon: 'Bot', count: 'AI مۇلازىمەت', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150&auto=format&fit=crop&q=80' },
  { id: 'numbers', name: 'مەۋھۇم نومۇر', icon: 'MessageSquareShare', count: 'SMS نومۇرلار', image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=150&auto=format&fit=crop&q=80' },
  { id: 'cards', name: 'كارتىلار ۋە VCC', icon: 'CreditCard', count: 'كارتىلار', image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80' },
  { id: 'accounts', name: 'تەييار ھېساباتلار', icon: 'KeyRound', count: 'ھېساباتلار', image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=150&auto=format&fit=crop&q=80' },
  { id: 'crypto', name: 'شىفىرلىق پۇل (USDT)', icon: 'Coins', count: 'USDT, Crypto', image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=150&auto=format&fit=crop&q=80' },
  { id: 'social', name: 'ئىجتىمائىي تاراتقۇ', icon: 'Share2', count: 'Followers, Likes', image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&auto=format&fit=crop&q=80' },
  { id: 'balance', name: 'يەرلىك ھەميان', icon: 'Wallet', count: 'تولۇقلاش', image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=150&auto=format&fit=crop&q=80' },
] as const;

import preloadedServices from '../../data/autocash_services.json';

export const SERVICES_DATA: ServiceItem[] = (preloadedServices as any) || [];