/**
 * AUTO CASH - syria4game.com External API Integration Client
 * Role: Senior Financial Systems & Gaming API Integration
 * Target Provider: https://syria4game.com
 *
 * Specifications:
 * - Base URL: https://syria4game.com
 * - Auth Header: api-token: process.env.SYRIA4GAME_API_TOKEN
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
    this.apiToken = (process.env.SYRIA4GAME_API_TOKEN || process.env.SYRIA4GAME_API_KEY || '').trim();
    this.isConfigured = Boolean(this.apiToken && this.apiToken.length > 5);
  }

  /**
   * Check if live production token is configured
   */
  public hasLiveToken(): boolean {
    return this.isConfigured;
  }

  /**
   * Standard headers required by syria4game.com API
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'AUTO-CASH-Financial-Core/2.0',
    };

    if (this.apiToken) {
      headers['api-token'] = this.apiToken;
    }

    return headers;
  }

  /**
   * 1. GET /client/api/profile
   * Check provider wholesale balance before processing user orders
   */
  async checkProfileBalance(): Promise<Syria4GameProfile> {
    if (!this.isConfigured) {
      // Sandbox fallback mode when token is not yet set in .env.local
      return {
        success: true,
        balance: 9999.0,
        currency: 'USD (Sandbox Test Mode)',
        userName: 'Sandbox Tester',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const res = await fetch(`${this.baseUrl}/client/api/profile`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          success: false,
          balance: 0,
          currency: 'USD',
          errorMessage: `HTTP ${res.status}: تەمىنلىگۈچى پروفىل ئۇچۇرىنى تەكشۈرەلمىدى`,
        };
      }

      const data = await res.json();
      
      // syria4game profile balance structure can be:
      // data.balance, data.data.balance, data.credit, data.wallet, etc.
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
      const userName = data.name || data.username || data.data?.name || data.data?.username;

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
        errorMessage: err.name === 'AbortError' ? 'تاشقى تەمىنلىگۈچى ئىنكاس قايتۇرمىدى (Timeout)' : err.message,
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
        success: true,
        products: [],
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${this.baseUrl}/client/api/products`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          success: false,
          products: [],
          errorMessage: `HTTP ${res.status}: مەھسۇلات تىزىملىكىنى ئېلىش مەغلۇپ بولدى`,
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
      // Sandbox automatic simulation mode for testing
      return {
        success: true,
        orderId: `S4G-SIM-${Math.floor(100000 + Math.random() * 900000)}`,
        orderUuid,
        status: 'COMPLETED',
        message: 'Sandbox: زاكاز تاشقى سۇپىغا سىناق تەرىقىسىدە مۇۋەپپەقىيەتلىك بېرىلدى',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      // Format parameters:
      // Endpoint format: GET /client/api/newOrder/{product_id}/{params}
      // If zoneId exists (e.g. MLBB): playerId/zoneId
      // Query string attaches order_uuid for anti-double-submission
      const cleanPlayerId = encodeURIComponent((params.playerId || '').trim());
      const cleanZoneId = params.zoneId ? encodeURIComponent(params.zoneId.trim()) : null;

      let paramPath = cleanPlayerId;
      if (cleanZoneId) {
        paramPath = `${cleanPlayerId}/${cleanZoneId}`;
      }

      const queryParams = new URLSearchParams({
        order_uuid: orderUuid,
        client_ref: params.clientOrderId,
        player_id: params.playerId,
      });

      if (params.zoneId) {
        queryParams.set('zone_id', params.zoneId);
      }
      if (params.server) {
        queryParams.set('server', params.server);
      }

      const targetUrl = `${this.baseUrl}/client/api/newOrder/${params.productId}/${paramPath}?${queryParams.toString()}`;

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

      // Check syria4game response indicators:
      // Usually { status: "success" | 1 | "done", order_id: 12345, ... }
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
        success: true,
        orderId,
        status: 'COMPLETED',
        message: 'Sandbox completed status',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Support formatted orders parameter: e.g. orders=[12345] or orders=12345
      const cleanId = String(orderId).trim();
      const formattedParam = cleanId.startsWith('[') ? cleanId : `[${cleanId}]`;
      const url = `${this.baseUrl}/client/api/check?orders=${encodeURIComponent(formattedParam)}`;

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
      
      // syria4game returns object or array of orders:
      // { "12345": { "status": "completed" } } or [{ "id": 12345, "status": "completed" }]
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
