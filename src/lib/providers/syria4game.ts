/**
 * AUTO CASH - syria4game.com External API Integration Client
 * Role: Senior Financial Systems & Gaming API Integration
 * Target Provider: https://syria4game.com
 *
 * Specifications:
 * - Base URL: https://syria4game.com
 * - Auth: api-token (supports Header & Query param for multi-framework compatibility)
 * - Profile/Balance: GET /client/api/profile
 * - Products Catalog: GET /client/api/products
 * - Create Order: GET /client/api/newOrder/{product_id}/{params}?order_uuid={UUIDv4}
 * - Check Status: GET /client/api/check?orders=[ORDER_ID]
 * - Idempotency Safeguard: Unique order_uuid (UUIDv4) per order
 */

export interface Syria4GameProfile {
  success: boolean;
  balance: number;
  currency: string;
  userName?: string;
  email?: string;
  raw?: any;
  errorMessage?: string;
}

export interface Syria4GameProduct {
  id: string | number;
  name: string;
  price?: number;
  category?: string;
  available?: boolean;
  paramsRequired?: string[];
  raw?: any;
}

export interface Syria4GameOrderResult {
  success: boolean;
  orderId?: string | number;
  orderUuid: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  message?: string;
  errorMessage?: string;
  raw?: any;
}

export interface Syria4GameStatusResult {
  success: boolean;
  orderId: string | number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'UNKNOWN';
  message?: string;
  raw?: any;
  errorMessage?: string;
}

function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class Syria4GameProvider {
  private baseUrl: string;
  private apiToken: string;
  private isConfigured: boolean;

  constructor() {
    const rawUrl = process.env.SYRIA4GAME_BASE_URL || 'https://syria4game.com';
    this.baseUrl = rawUrl.replace(/\/+$/, '');
    // Clean token: strip surrounding whitespace, quotes, or trailing slashes
    const rawToken = (process.env.SYRIA4GAME_API_TOKEN || process.env.SYRIA4GAME_API_KEY || '').trim();
    this.apiToken = rawToken.replace(/^["']|["']$/g, '').trim();
    this.isConfigured = Boolean(this.apiToken && this.apiToken.length > 5);
  }

  /**
   * Check if live production token is configured
   */
  public hasLiveToken(): boolean {
    return this.isConfigured;
  }

  /**
   * Build headers with multiple standard variants to prevent Nginx/Cloudflare header stripping
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'AUTO-CASH-Financial-Core/2.0',
    };

    if (this.apiToken) {
      headers['api-token'] = this.apiToken;
      headers['api_token'] = this.apiToken;
      headers['Api-Token'] = this.apiToken;
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    return headers;
  }

  /**
   * Build target URL supporting both path and query parameters
   */
  private buildUrl(path: string, queryParams: Record<string, string | number | undefined> = {}): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`);

    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    });

    // Provide query token as fallback in case web server strips custom headers
    if (this.apiToken) {
      url.searchParams.set('api-token', this.apiToken);
      url.searchParams.set('api_token', this.apiToken);
    }

    return url.toString();
  }

  /**
   * 1. GET /client/api/profile
   * Check provider wholesale balance before processing user orders
   */
  async checkProfileBalance(): Promise<Syria4GameProfile> {
    if (!this.isConfigured) {
      return {
        success: false,
        balance: 0,
        currency: 'USD',
        errorMessage: 'SYRIA4GAME_API_TOKEN مۇھىت ئۆزگەرگۈچىسى تەڭشەلمىگەن',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const targetUrl = this.buildUrl('/client/api/profile');
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errDetail = '';
        try {
          const errData = await res.json();
          errDetail = errData?.message || errData?.error || JSON.stringify(errData);
        } catch {
          errDetail = await res.text().catch(() => '');
        }

        return {
          success: false,
          balance: 0,
          currency: 'USD',
          errorMessage: `HTTP ${res.status}${errDetail ? `: ${errDetail}` : ''}`,
          raw: { status: res.status, detail: errDetail },
        };
      }

      const data = await res.json();
      
      const parsedBalance =
        typeof data.balance === 'number'
          ? data.balance
          : typeof data.data?.balance === 'number'
          ? data.data.balance
          : typeof data.credit === 'number'
          ? data.credit
          : typeof data.data?.credit === 'number'
          ? data.data.credit
          : parseFloat(data.balance || data.data?.balance || data.credit || '0') || 0;

      const currency = data.currency || data.data?.currency || 'USD';
      const userName = data.name || data.username || data.data?.name || data.data?.username || data.user?.name || data.user?.username;

      return {
        success: true,
        balance: parsedBalance,
        currency,
        userName,
        raw: data,
      };
    } catch (err: any) {
      return {
        success: false,
        balance: 0,
        currency: 'USD',
        errorMessage: err.name === 'AbortError' ? 'تەمىنلىگۈچى ئىنكاس قايتۇرمىدى (Timeout)' : err.message,
      };
    }
  }

  /**
   * 2. GET /client/api/products
   * Fetch live product catalog from syria4game
   */
  async getProducts(): Promise<{ success: boolean; products: Syria4GameProduct[]; errorMessage?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        products: [],
        errorMessage: 'SYRIA4GAME_API_TOKEN مۇھىت ئۆزگەرگۈچىسى تەڭشەلمىگەن',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const targetUrl = this.buildUrl('/client/api/products');
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errDetail = '';
        try {
          const errData = await res.json();
          errDetail = errData?.message || errData?.error || JSON.stringify(errData);
        } catch {
          errDetail = await res.text().catch(() => '');
        }

        return {
          success: false,
          products: [],
          errorMessage: `HTTP ${res.status}${errDetail ? `: ${errDetail}` : ''}`,
        };
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.products || data.data || [];

      const products: Syria4GameProduct[] = list.map((item: any) => ({
        id: item.id || item.product_id,
        name: item.name || item.title || '',
        price: parseFloat(item.price || item.cost || '0') || 0,
        category: item.category || item.group || '',
        available: item.status !== 0 && item.available !== false,
        raw: item,
      }));

      return {
        success: true,
        products,
      };
    } catch (err: any) {
      return {
        success: false,
        products: [],
        errorMessage: err.name === 'AbortError' ? 'مەھسۇلات ئۇچۇرى ئېلىش ۋاقىت چېكىدىن ئاشتى' : err.message,
      };
    }
  }

  /**
   * 3. GET /client/api/newOrder/{product_id}/params
   * Execute real game top-up order with strict idempotency (order_uuid)
   */
  async submitTopupOrder(params: {
    clientOrderId: string;
    productId: string | number;
    playerId: string;
    zoneId?: string;
    server?: string;
    customUuid?: string;
  }): Promise<Syria4GameOrderResult> {
    const orderUuid = params.customUuid || generateUUIDv4();

    if (!this.isConfigured) {
      return {
        success: false,
        orderUuid,
        status: 'FAILED',
        errorMessage: 'SYRIA4GAME_API_TOKEN مۇھىت ئۆزگەرگۈچىسى تەڭشەلمىگەن',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const cleanPlayerId = encodeURIComponent((params.playerId || '').trim());
      const cleanZoneId = params.zoneId ? encodeURIComponent(params.zoneId.trim()) : null;

      let paramPath = cleanPlayerId;
      if (cleanZoneId) {
        paramPath = `${cleanPlayerId}/${cleanZoneId}`;
      }

      const queryParams: Record<string, string | number | undefined> = {
        order_uuid: orderUuid,
        client_ref: params.clientOrderId,
        player_id: params.playerId,
      };

      if (params.zoneId) queryParams['zone_id'] = params.zoneId;
      if (params.server) queryParams['server'] = params.server;

      const targetUrl = this.buildUrl(`/client/api/newOrder/${params.productId}/${paramPath}`, queryParams);

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        const errorText = data?.message || data?.error || `HTTP ${res.status}: تاشقى سۇپىدىن خاتالىق قايتتى`;
        return {
          success: false,
          orderUuid,
          status: 'FAILED',
          errorMessage: errorText,
          raw: data,
        };
      }

      const isSuccess =
        data.status === 'success' ||
        data.status === 1 ||
        data.status === 'done' ||
        data.success === true ||
        Boolean(data.order_id || data.id);

      if (!isSuccess) {
        return {
          success: false,
          orderUuid,
          status: 'FAILED',
          errorMessage: data.message || data.error || 'تاشقى تەمىنلىگۈچى زاكازنى رەت قىلدى',
          raw: data,
        };
      }

      const providerOrderId = data.order_id || data.id || data.data?.order_id || data.data?.id;

      let normalizedStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' = 'COMPLETED';
      if (typeof data.status === 'string') {
        const st = data.status.toLowerCase();
        if (st === 'pending' || st === 'wait') normalizedStatus = 'PENDING';
        else if (st === 'processing') normalizedStatus = 'PROCESSING';
        else if (st === 'failed' || st === 'error') normalizedStatus = 'FAILED';
      }

      return {
        success: true,
        orderId: providerOrderId,
        orderUuid,
        status: normalizedStatus,
        message: data.message || 'زاكاز تەمىنلىگۈچىگە مۇۋەپپەقىيەتلىك ئەۋەتىلدى',
        raw: data,
      };
    } catch (err: any) {
      return {
        success: false,
        orderUuid,
        status: 'FAILED',
        errorMessage:
          err.name === 'AbortError'
            ? 'تاشقى تەمىنلىگۈچى مۇلازىمېتىرى ۋاقىت چېكىدىن ئېشىپ كەتتى (15s Timeout)'
            : err.message || 'تور كاشىلىسى تۈپەيلى تاشقى سۇپىغا ئۇلانمىدى',
      };
    }
  }

  /**
   * 4. GET /client/api/check?orders=[ORDER_ID]
   * Check order status from syria4game.com
   */
  async checkOrderStatus(orderId: string | number): Promise<Syria4GameStatusResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        orderId,
        status: 'UNKNOWN',
        errorMessage: 'SYRIA4GAME_API_TOKEN تەڭشەلمىگەن',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const cleanId = String(orderId).trim();
      const formattedParam = cleanId.startsWith('[') ? cleanId : `[${cleanId}]`;

      const url = this.buildUrl('/client/api/check', { orders: formattedParam });

      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          success: false,
          orderId,
          status: 'UNKNOWN',
          errorMessage: `HTTP ${res.status}: ھالەتنى تەكشۈرۈش مەغلۇپ بولدى`,
        };
      }

      const data = await res.json();
      
      let orderData: any = null;
      if (Array.isArray(data)) {
        orderData = data.find((o: any) => String(o.id || o.order_id) === cleanId) || data[0];
      } else if (data && typeof data === 'object') {
        orderData = data[cleanId] || data.data?.[cleanId] || data;
      }

      const rawStatus = (orderData?.status || orderData?.state || data?.status || '').toString().toLowerCase();

      let status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'UNKNOWN' = 'UNKNOWN';
      if (rawStatus.includes('complete') || rawStatus === 'done' || rawStatus === 'success' || rawStatus === '1') {
        status = 'COMPLETED';
      } else if (rawStatus.includes('process') || rawStatus === 'working') {
        status = 'PROCESSING';
      } else if (rawStatus.includes('pend') || rawStatus === 'wait') {
        status = 'PENDING';
      } else if (rawStatus.includes('fail') || rawStatus.includes('error') || rawStatus === 'rejected') {
        status = 'FAILED';
      } else if (rawStatus.includes('cancel')) {
        status = 'CANCELED';
      }

      return {
        success: true,
        orderId,
        status,
        message: orderData?.message || data?.message,
        raw: data,
      };
    } catch (err: any) {
      return {
        success: false,
        orderId,
        status: 'UNKNOWN',
        errorMessage: err.name === 'AbortError' ? 'ھالەت تەكشۈرۈش ۋاقىت چېكىدىن ئېشىپ كەتتى' : err.message,
      };
    }
  }
}

export const syria4GameProvider = new Syria4GameProvider();
