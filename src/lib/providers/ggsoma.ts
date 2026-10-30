/**
 * GGSOMA Reseller API Client for AUTO CASH
 * Digital Subscriptions, AI Tools & Software Accounts Provider
 *
 * Config:
 * - GGSOMA_API_KEY: sk_live_...
 * - GGSOMA_BASE_URL: https://api.ggsoma.com (fallback / configurable)
 */

export interface GgsomaConfig {
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
}

export interface GgsomaPingResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface GgsomaBalanceResult {
  success: boolean;
  balance?: number;
  currency?: string;
  error?: string;
}

export class GgsomaProvider {
  private baseUrl: string = (process.env.GGSOMA_BASE_URL || 'https://api.ggsoma.com').replace(/\/+$/, '');
  private apiKey: string = (process.env.GGSOMA_API_KEY || '').trim();

  getConfig(): GgsomaConfig {
    const apiKey = (process.env.GGSOMA_API_KEY || this.apiKey || '').trim();
    const baseUrl = (process.env.GGSOMA_BASE_URL || this.baseUrl || 'https://api.ggsoma.com').replace(/\/+$/, '');
    return {
      apiKey,
      baseUrl,
      enabled: Boolean(apiKey && apiKey.length > 5),
    };
  }

  private getHeaders(): Record<string, string> {
    const { apiKey } = this.getConfig();
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-API-KEY': apiKey,
      'api-token': apiKey,
    };
  }

  /**
   * Ping / Check connection to GGSOMA API
   */
  async ping(): Promise<GgsomaPingResult> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'GGSOMA_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${config.baseUrl}/ping`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (res.ok) {
        return { success: true, message: 'GGSOMA API ئۇلاندى', data };
      }

      return {
        success: false,
        message: `GGSOMA API جاۋاب قايتۇردى (Status ${res.status})`,
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'GGSOMA API ئۇلىنىش مەغلۇپ بولدى',
      };
    }
  }

  /**
   * Check Account Balance
   */
  async getBalance(): Promise<GgsomaBalanceResult> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'GGSOMA_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${config.baseUrl}/balance`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        const bal = data.balance ?? data.funds ?? data.wallet ?? 0;
        return {
          success: true,
          balance: Number(bal),
          currency: data.currency || 'USD',
        };
      }

      return {
        success: false,
        error: data?.message || `GGSOMA قالدۇق ئېلىش مەغلۇپ بولدى (${res.status})`,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'GGSOMA API تەلەپ خاتالىقى' };
    }
  }

  /**
   * Fetch Catalog / Products
   */
  async getProducts(): Promise<{ success: boolean; products?: any[]; error?: string }> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'GGSOMA_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const res = await fetch(`${config.baseUrl}/products`, {
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.products || data)) {
        return { success: true, products: data.products || data };
      }
      return { success: false, error: data?.message || 'مەھسۇلاتلار تىزىملىكى ئېلىنمىدى' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'تەلەپ خاتالىقى' };
    }
  }

  /**
   * Create an order (Submitting top-up / license purchase)
   */
  async createOrder(params: { productId: string | number; quantity?: number; customFields?: Record<string, any> }) {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'GGSOMA_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const res = await fetch(`${config.baseUrl}/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success !== false) {
        return { success: true, data };
      }
      return { success: false, error: data?.message || 'زاكاز ئەۋەتىش مەغلۇپ بولدى' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'تەلەپ مەغلۇپ بولدى' };
    }
  }
}

export const ggsomaProvider = new GgsomaProvider();
