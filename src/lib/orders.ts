export interface Order {
  id: string;
  userId?: string;
  userEmail?: string;
  serviceId: string;
  serviceName: string;
  packageTitle: string;
  amount: number;
  targetAccount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'pending_provider';
  createdAt: string;
  details?: {
    // Provider fulfilment
    fields?: Record<string, string>;
    qty?: number;
    delivery?: { codes: string[]; text?: string; activationUrl?: string; reply?: string };
    activationUrl?: string;
    activationLink?: string;
    inviteUrl?: string;
    providerReply?: string;
    reply?: string;
    message?: string;
    refundReason?: string;
    // Admin-only (stripped from buyer responses by toBuyerOrder)
    providerOrderId?: string;
    providerOrderUuid?: string;
    providerStatus?: string;
    providerError?: string;
    needsReview?: boolean;
    reviewReason?: string;
    costTotal?: number;
    sellPrice?: number;
    // Wi-Fi cards
    wifiCard?: {
      network: 'fursan' | 'azez' | string;
      networkName: string;
      networkEn: string;
      username: string;
      password: string;
      cardNumber: string;
      packageTitle: string;
      price: number;
      purchaseDate: string;
      validity: string;
    };
    // Legacy orders
    smsCode?: string;
    virtualNumber?: string;
    accountCredentials?: string;
    cardDetails?: {
      number: string;
      exp: string;
      cvv: string;
    };
  };
}

/** Orders that still need fulfilment or verification (incl. ambiguous provider outcomes). */
export function isOrderInProgress(status: string): boolean {
  return status === 'processing' || status === 'pending' || status === 'pending_provider';
}

const BUYER_DETAIL_KEYS = [
  'wifiCard',
  'fields',
  'qty',
  'delivery',
  'refundReason',
  'smsCode',
  'virtualNumber',
  'accountCredentials',
  'cardDetails',
  'activationUrl',
  'activationLink',
  'inviteUrl',
  'providerReply',
  'reply',
  'message',
] as const;

/** What a buyer may see of their order: no cost, provider ids, raw errors or review notes. */
export function toBuyerOrder<T extends { details?: Record<string, any> }>(order: T): T {
  const details: Record<string, any> = {};
  for (const key of BUYER_DETAIL_KEYS) {
    if (order.details?.[key] !== undefined) details[key] = order.details[key];
  }
  const { userId, userEmail, ...rest } = order as any;
  return { ...rest, details } as T;
}

export interface DepositRecord {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  method: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  date: string;
  txId?: string;
  reviewedAt?: string;
}
