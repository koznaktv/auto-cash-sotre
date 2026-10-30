/**
 * TG Market API Client for AUTO CASH
 * Telegram Services, Digital Accounts & Market Products Provider
 *
 * Config:
 * - TGMARKET_API_KEY: sk-c73df9cb5b0e15bf6543f0481566f6de609e0adbc14a2527
 * - TGMARKET_BASE_URL: https://api.tgmarket.io (configurable)
 */

export interface TgmarketConfig {
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
}

export interface TgmarketPingResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface TgmarketBalanceResult {
  success: boolean;
  balance?: number;
  currency?: string;
  error?: string;
}

export class TgmarketProvider {
  private baseUrl: string = (process.env.TGMARKET_BASE_URL || 'https://api.tgmarket.io').replace(/\/+$/, '');
  private apiKey: string = (process.env.TGMARKET_API_KEY || '').trim();

  getConfig(): TgmarketConfig {
    const apiKey = (process.env.TGMARKET_API_KEY || this.apiKey || '').trim();
    const baseUrl = (process.env.TGMARKET_BASE_URL || this.baseUrl || 'https://api.tgmarket.io').replace(/\/+$/, '');
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
    };
  }

  /**
   * Ping / Check connection to TG Market API
   */
  async ping(): Promise<TgmarketPingResult> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'TGMARKET_API_KEY تەڭشەلمىگەن' };
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
        return { success: true, message: 'TG Market API ئۇلاندى', data };
      }

      return {
        success: false,
        message: `TG Market API جاۋاب قايتۇردى (Status ${res.status})`,
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'TG Market API ئۇلىنىش مەغلۇپ بولدى',
      };
    }
  }

  /**
   * Check Account Balance
   */
  async getBalance(): Promise<TgmarketBalanceResult> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'TGMARKET_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${config.baseUrl}/user/balance`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        const bal = data.balance ?? data.funds ?? data.data?.balance ?? 0;
        return {
          success: true,
          balance: Number(bal),
          currency: data.currency || data.data?.currency || 'USD',
        };
      }

      return {
        success: false,
        error: data?.message || `TG Market قالدۇق ئېلىش مەغلۇپ بولدى (${res.status})`,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'TG Market تەلەپ خاتالىقى' };
    }
  }

  /**
   * Fetch Catalog
   */
  async getCatalog(): Promise<{ success: boolean; items?: any[]; error?: string }> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'TGMARKET_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const res = await fetch(`${config.baseUrl}/catalog`, {
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.items || data?.data || data)) {
        return { success: true, items: data.items || data.data || data };
      }
      return { success: false, error: data?.message || 'مۇلازىمەتلەر ئېلىنمىدى' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'تەلەپ خاتالىقى' };
    }
  }

  /**
   * Create an order
   */
  async createOrder(params: { itemId: string | number; count?: number; payload?: any }) {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'TGMARKET_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const res = await fetch(`${config.baseUrl}/orders/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success !== false) {
        return { success: true, data };
      }
      return { success: false, error: data?.message || 'TG Market زاكاز قۇرۇش مەغلۇپ بولدى' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'تەلەپ مەغلۇپ بولدى' };
    }
  }
}

export const tgmarketProvider = new TgmarketProvider();
