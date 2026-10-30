/**
 * Max Store API Client for AUTO CASH
 * Syrian Digital Games & Cards Wholesale Reseller Provider (maxstore1.com)
 *
 * Config:
 * - MAXSTORE_API_TOKEN: msk_ZW7NXBgE4dPx1ZfE_rBIp6nxcQ8Z-3rb7DOS7IcRzag
 * - MAXSTORE_BASE_URL: https://api.maxstore1.com (configurable)
 */

export interface MaxstoreConfig {
  apiToken: string;
  baseUrl: string;
  enabled: boolean;
}

export interface MaxstoreProfileResult {
  success: boolean;
  balance: number | null;
  currency: string;
  username?: string;
  error?: string;
  raw?: any;
}

export interface MaxstorePingResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export class MaxstoreProvider {
  private baseUrl: string = (process.env.MAXSTORE_BASE_URL || 'https://api.maxstore1.com').replace(/\/+$/, '');
  private apiToken: string = (process.env.MAXSTORE_API_TOKEN || '').trim();

  getConfig(): MaxstoreConfig {
    const apiToken = (process.env.MAXSTORE_API_TOKEN || this.apiToken || '').trim();
    const baseUrl = (process.env.MAXSTORE_BASE_URL || this.baseUrl || 'https://api.maxstore1.com').replace(/\/+$/, '');
    return {
      apiToken,
      baseUrl,
      enabled: Boolean(apiToken && apiToken.length > 5),
    };
  }

  private getHeaders(): Record<string, string> {
    const { apiToken } = this.getConfig();
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-token': apiToken,
      Authorization: `Bearer ${apiToken}`,
      'X-API-KEY': apiToken,
    };
  }

  /**
   * Ping / Check connection to Max Store API
   */
  async ping(): Promise<MaxstorePingResult> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'MAXSTORE_API_TOKEN تەڭشەلمىگەن' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      // Support both /client/api/ping and /api/ping
      const pingUrl = `${config.baseUrl}/client/api/ping`;
      const res = await fetch(pingUrl, {
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
        return { success: true, message: 'Max Store API ئۇلاندى', data };
      }

      return {
        success: false,
        message: `Max Store API جاۋاب قايتۇردى (Status ${res.status})`,
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Max Store API غا ئۇلىنىش مەغلۇپ بولدى',
      };
    }
  }

  /**
   * Fetch wholesale balance and account profile
   */
  async getProfile(): Promise<MaxstoreProfileResult> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, balance: null, currency: 'USD', error: 'MAXSTORE_API_TOKEN تەڭشەلمىگەن' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const profileUrl = `${config.baseUrl}/client/api/profile`;
      const res = await fetch(profileUrl, {
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

      if (res.ok && data) {
        const bal = data.balance ?? data.wallet ?? data.user?.balance ?? 0;
        return {
          success: true,
          balance: Number(bal),
          currency: data.currency || 'USD',
          username: data.username || data.name || 'Max Store User',
          raw: data,
        };
      }

      return {
        success: false,
        balance: null,
        currency: 'USD',
        error: data?.message || `Max Store قالدۇق ئېلىش مەغلۇپ بولدى (${res.status})`,
        raw: data,
      };
    } catch (err: any) {
      return { success: false, balance: null, currency: 'USD', error: err?.message || 'تەلەپ مەغلۇپ بولدى' };
    }
  }

  /**
   * Fetch product catalog from Max Store
   */
  async getCatalog(): Promise<{ success: boolean; products?: any[]; error?: string }> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'MAXSTORE_API_TOKEN تەڭشەلمىگەن' };
    }

    try {
      const res = await fetch(`${config.baseUrl}/client/api/catalog`, {
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        const list = Array.isArray(data) ? data : data.products || data.items || [];
        return { success: true, products: list };
      }
      return { success: false, error: data?.message || 'كۈتۈلمىگەن خاتالىق يۈز بەردى' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'كۈتۈلمىگەن خاتالىق' };
    }
  }

  /**
   * Create an order via Max Store
   */
  async newOrder(productId: string | number, params: Record<string, any>) {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'MAXSTORE_API_TOKEN تەڭشەلمىگەن' };
    }

    try {
      const res = await fetch(`${config.baseUrl}/client/api/newOrder/${encodeURIComponent(productId)}/params`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success !== false) {
        return { success: true, data };
      }
      return { success: false, error: data?.message || 'Max Store زاكاز ئەۋەتىش مەغلۇپ بولدى' };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }
}

export const maxstoreProvider = new MaxstoreProvider();
