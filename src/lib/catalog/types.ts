// Shared types for the syria4game-backed catalog. Safe to import from client components.

export type StorefrontCategory =
  | 'games'
  | 'apps'
  | 'balance'
  | 'social'
  | 'numbers'
  | 'crypto'
  | 'accounts'
  | 'cards'
  | 'ai';

export const STOREFRONT_CATEGORIES: StorefrontCategory[] = [
  'games',
  'apps',
  'balance',
  'social',
  'numbers',
  'crypto',
  'accounts',
  'cards',
  'ai',
];

/** One input the buyer fills in at checkout; `key` is sent to the provider as a query param. */
export interface CheckoutField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'select';
  required: boolean;
  options?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  /** The provider's query param name for this input is unknown: not orderable until an admin defines fields. */
  unconfirmed?: boolean;
}

export type QtyRule =
  | { kind: 'fixed' }
  | { kind: 'list'; values: number[] }
  | { kind: 'range'; min: number; max: number; step: number };

/** Codes / text the provider delivered for an order (gift card PINs, account details...). */
export interface Delivery {
  codes: string[];
  text?: string;
  activationUrl?: string;
  reply?: string;
}

export interface ProviderCategory {
  id: number;
  parentId: number | null;
  name: string;
  image?: string;
}

/** A provider product as stored by the sync (raw schema kept; parsed at read time). */
export interface ProviderProduct {
  id: number;
  name: string;
  costPrice: number;
  currency: string;
  categoryId: number;
  parentId: number | null;
  categoryName: string;
  available: boolean;
  productType: string;
  inputSchema: unknown;
  params: unknown;
  qtyValues: unknown;
  image?: string;
  categoryImage?: string;
}

export interface StoredCategory extends ProviderCategory {
  rootId: number | null;
  depth: number;
  lastSeenRunId?: number | null;
  removedAt?: string | null;
}

export interface StoredProduct extends ProviderProduct {
  prevCostPrice?: number | null;
  priceChangedAt?: string | null;
  lastSeenRunId?: number | null;
  syncedAt: string;
  removedAt?: string | null;
}

export interface CatalogOverride {
  scope: 'category' | 'product';
  targetId: number;
  storefrontCategory?: StorefrontCategory | null;
  hidden?: boolean | null;
  customName?: string | null;
  customDescription?: string | null;
  customImage?: string | null;
  customBadge?: string | null;
  markupPercent?: number | null;
  fixedMarkupUsd?: number | null;
  inputFieldsOverride?: CheckoutField[] | null;
  sortOrder?: number | null;
}

export interface ProviderSettings {
  catalogSource: 'legacy' | 'provider';
  globalMarkupPercent: number;
  fixedMarkupUsd: number;
  minProfitUsd: number;
  minOrderUsd: number;
  priceMaxAgeMinutes: number;
  showUnavailable: boolean;
  lowBalanceThresholdUsd: number;
  maxPendingHours: number;
  ordersPaused: boolean;
  ordersPausedReason?: string | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncStats?: SyncStats | null;
  lastSyncError?: string | null;
  lastBalance?: number | null;
  lastBalanceAt?: string | null;
}

export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  catalogSource: 'legacy',
  globalMarkupPercent: 15,
  fixedMarkupUsd: 0,
  minProfitUsd: 0.01,
  minOrderUsd: 0.1,
  priceMaxAgeMinutes: 30,
  showUnavailable: false,
  lowBalanceThresholdUsd: 20,
  maxPendingHours: 24,
  ordersPaused: false,
};

export interface SyncStats {
  categories: number;
  products: number;
  added: number;
  removed: number;
  priceChanged: number;
  unavailable: number;
  unmappedCategories: number;
  nonUsd: number;
  durationMs: number;
}
