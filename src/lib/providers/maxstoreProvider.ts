/**
 * MAXSTORE1 Wholesale Provider Client
 * Documentation: https://maxstore1.com/api-docs
 * 
 * Headers: api-token: YOUR_API_TOKEN
 * Base URL: https://maxstore1.com
 */

export interface MaxStoreProfile {
  balance: string;
  user_id: number;
  username: string;
}

export interface MaxStoreProduct {
  id: number;
  name: string;
  price: number;
  params?: string[];
  category_id?: number;
  available: boolean;
  qty_values?: { min: number; max: number };
  product_type?: string;
}

export interface MaxStoreCategory {
  id: number;
  name: string;
  icon?: string;
  count?: number;
}

export interface MaxStoreOrderParams {
  product_id: number;
  qty: number;
  order_uuid: string;
  params?: Record<string, any>;
}

export interface MaxStoreOrderResult {
  status: 'OK' | 'ERROR';
  data?: {
    order_id: string;
    status: 'accept' | 'wait' | 'reject';
    price: number;
    data?: Record<string, any>;
    delivery?: string[];
  };
  error?: string;
  detail?: {
    code: number;
    message: string;
  };
}

export interface MaxStoreCheckResult {
  status: string;
  data: Array<{
    order_id: string;
    quantity: number;
    data: Record<string, any>;
    created_at: string;
    product_name: string;
    price: string | number;
    status: 'accept' | 'wait' | 'reject';
    delivery?: string[];
  }>;
}

function getBaseUrl(): string {
  return process.env.MAXSTORE_BASE_URL || 'https://maxstore1.com';
}

function getApiToken(): string {
  return process.env.MAXSTORE_API_TOKEN || '';
}

export function isMaxStoreConfigured(): boolean {
  return Boolean(getApiToken().trim());
}

async function maxStoreRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  const token = getApiToken();
  if (!token) {
    return { ok: false, error: 'MAXSTORE_API_TOKEN تەڭشەلمىگەن', status: 401 };
  }

  const url = `${getBaseUrl()}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'api-token': token,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    if (!res.ok) {
      const errMsg = json?.detail?.message || json?.message || `HTTP ${res.status}: ${text.slice(0, 100)}`;
      return { ok: false, error: errMsg, data: json, status: res.status };
    }

    return { ok: true, data: json, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'تور ئۇلىنىش خاتالىقى', status: 0 };
  }
}

/**
 * 1. Profile & Balance
 * GET /api/v2/profile
 */
export async function getMaxStoreProfile(): Promise<{ ok: boolean; profile?: MaxStoreProfile; error?: string }> {
  const res = await maxStoreRequest<MaxStoreProfile>('/api/v2/profile');
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, profile: res.data };
}

/**
 * 2. Get Balance
 * GET /api/v2/balance
 */
export async function getMaxStoreBalance(): Promise<{ ok: boolean; balance?: number; error?: string }> {
  const res = await maxStoreRequest<any>('/api/v2/balance');
  if (!res.ok) return { ok: false, error: res.error };
  const rawBalance = res.data?.balance ?? res.data;
  const num = typeof rawBalance === 'number' ? rawBalance : parseFloat(String(rawBalance || '0'));
  return { ok: true, balance: isNaN(num) ? 0 : num };
}

/**
 * 3. Get All Products
 * GET /api/v2/products
 */
export async function getMaxStoreProducts(category_id?: number): Promise<{ ok: boolean; products?: MaxStoreProduct[]; error?: string }> {
  const endpoint = category_id !== undefined ? `/api/v2/content/${category_id}` : '/api/v2/products';
  const res = await maxStoreRequest<MaxStoreProduct[]>(endpoint);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, products: Array.isArray(res.data) ? res.data : [] };
}

/**
 * 4. Get Categories
 * GET /api/v2/content/0
 */
export async function getMaxStoreCategories(): Promise<{ ok: boolean; categories?: any[]; error?: string }> {
  const res = await maxStoreRequest<any[]>('/api/v2/content/0');
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, categories: Array.isArray(res.data) ? res.data : [] };
}

/**
 * 5. Create Order
 * POST /api/v2/order
 */
export async function createMaxStoreOrder(params: MaxStoreOrderParams): Promise<MaxStoreOrderResult> {
  const res = await maxStoreRequest<any>('/api/v2/order', {
    method: 'POST',
    body: JSON.stringify({
      product_id: params.product_id,
      qty: params.qty || 1,
      order_uuid: params.order_uuid,
      params: params.params || {},
    }),
  });

  if (!res.ok) {
    return {
      status: 'ERROR',
      error: res.error,
      detail: res.data?.detail,
    };
  }

  return res.data as MaxStoreOrderResult;
}

/**
 * 6. Check Orders
 * GET /api/v2/check?orders=uuid1,uuid2
 */
export async function checkMaxStoreOrders(orderUuids: string[]): Promise<{ ok: boolean; data?: MaxStoreCheckResult['data']; error?: string }> {
  if (orderUuids.length === 0) return { ok: true, data: [] };
  const param = encodeURIComponent(orderUuids.join(','));
  const res = await maxStoreRequest<MaxStoreCheckResult>(`/api/v2/check?orders=${param}`);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: res.data?.data || [] };
}
