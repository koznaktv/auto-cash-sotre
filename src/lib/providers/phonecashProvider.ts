/**
 * Official PhoneCash SMS Verification Provider Client for AUTO CASH
 * Connects directly to https://app.phonecash.sy/api/api.php
 */

import { getEnrichedCountry, getEnrichedService, CountryMeta } from '../sms/smsMetadata';

export interface PhonecashBuyResult {
  success: boolean;
  activationId?: string;
  phone?: string;
  serviceCode?: string;
  countryId?: number;
  costPrice?: number;
  sellPrice?: number;
  error?: string;
  raw?: any;
}

export interface PhonecashStatusResult {
  success: boolean;
  status: 'WAIT_CODE' | 'RECEIVED' | 'CANCELED' | 'UNKNOWN';
  code?: string;
  statusText?: string;
  rawResponse?: string;
  error?: string;
  raw?: any;
}

class PhonecashProvider {
  private baseUrl: string = process.env.PHONECASH_BASE_URL || 'https://app.phonecash.sy/api/api.php';
  private apiKey: string = (process.env.PHONECASH_API_KEY || 'a4f8c2b1e9d37560').trim();

  // In-memory cache for countries & services to ensure blistering fast UI (<15ms)
  private countriesCache: { data: CountryMeta[]; timestamp: number } | null = null;
  private servicesCache: Map<number, { data: any[]; timestamp: number }> = new Map();

  private getApiKey(): string {
    return (process.env.PHONECASH_API_KEY || this.apiKey || '').trim();
  }

  private getBaseUrl(): string {
    return (process.env.PHONECASH_BASE_URL || this.baseUrl || 'https://app.phonecash.sy/api/api.php').trim();
  }

  /**
   * Fetch all supported countries with flags and dial codes
   */
  async getCountries(forceRefresh = false): Promise<CountryMeta[]> {
    const now = Date.now();
    if (!forceRefresh && this.countriesCache && now - this.countriesCache.timestamp < 10 * 60 * 1000) {
      return this.countriesCache.data;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('PhoneCash API ئاچقۇچى كىرگۈزۈلمىگەن');
    }

    const url = `${this.getBaseUrl()}?action=getCountries&api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json || !json.success || !Array.isArray(json.data)) {
      if (this.countriesCache?.data) return this.countriesCache.data;
      throw new Error(json?.message || 'دۆلەتلەر تىزىملىكىنى ئېلىش مەغلۇپ بولدى');
    }

    const enriched = (json.data as any[])
      .map(getEnrichedCountry)
      .sort((a, b) => {
        // Popular countries first
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return a.name.localeCompare(b.name);
      });

    this.countriesCache = { data: enriched, timestamp: now };
    return enriched;
  }

  /**
   * Fetch all services & live stock for a country with 20% profit margin
   */
  async getServices(countryId: number, forceRefresh = false): Promise<any[]> {
    const now = Date.now();
    const cached = this.servicesCache.get(countryId);
    if (!forceRefresh && cached && now - cached.timestamp < 2 * 60 * 1000) {
      return cached.data;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('PhoneCash API ئاچقۇچى كىرگۈزۈلمىگەن');
    }

    const url = `${this.getBaseUrl()}?action=getServices&country=${encodeURIComponent(countryId)}&api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json || !json.success || !Array.isArray(json.data)) {
      if (cached?.data) return cached.data;
      throw new Error(json?.message || 'مۇلازىمەتلەر تىزىملىكىنى ئېلىش مەغلۇپ بولدى');
    }

    const enriched = (json.data as any[])
      .map(getEnrichedService)
      .sort((a, b) => {
        // Popular first, then by count descending
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return b.count - a.count;
      });

    this.servicesCache.set(countryId, { data: enriched, timestamp: now });
    return enriched;
  }

  /**
   * Purchase / Allocate a new virtual number
   */
  async buyNumber(serviceCode: string, countryId: number): Promise<PhonecashBuyResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'PhoneCash API ئاچقۇچى كىرگۈزۈلمىگەن' };
    }

    try {
      const url = `${this.getBaseUrl()}?action=buyNumber&service=${encodeURIComponent(serviceCode)}&country=${encodeURIComponent(countryId)}&api_key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { method: 'POST', cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json || !json.success) {
        const msg = json?.message || 'نومۇر سېتىۋېلىش مەغلۇپ بولدى (زاپاس نومۇر قالمىغان بولۇشى مۇمكىن)';
        return { success: false, error: msg, raw: json };
      }

      // Handle both array or single object format in data
      let item: any = null;
      if (Array.isArray(json.data) && json.data.length > 0) {
        item = json.data[0];
      } else if (json.data && typeof json.data === 'object' && json.data.id) {
        item = json.data;
      }

      if (!item || !item.id || !item.number) {
        return { success: false, error: 'تەمىنلىگۈچى نومۇر ئۇچۇرىنى قايتۇرمىدى', raw: json };
      }

      return {
        success: true,
        activationId: String(item.id),
        phone: String(item.number),
        serviceCode,
        countryId,
        raw: json,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'تەمىنلىگۈچى مۇلازىمېتىرىغا ئۇلىنىش مەغلۇپ بولدى' };
    }
  }

  /**
   * Check SMS status (status_action: 1=check code, 3=finish/complete, 8=cancel)
   */
  async checkStatus(activationId: string, statusAction: 1 | 3 | 8 = 1): Promise<PhonecashStatusResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, status: 'UNKNOWN', error: 'PhoneCash API ئاچقۇچى كىرگۈزۈلمىگەن' };
    }

    try {
      const url = `${this.getBaseUrl()}?action=checkStatus&id=${encodeURIComponent(activationId)}&status_action=${statusAction}&api_key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json || !json.success) {
        return {
          success: false,
          status: 'UNKNOWN',
          error: json?.message || 'ھالەتنى تەكشۈرۈش مەغلۇپ بولدى',
          raw: json,
        };
      }

      let data = json.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      const statusText = data?.status_text || '';
      const rawResponse = data?.raw_response || '';
      const code = data?.code || '';

      // Determine state
      if (code && String(code).trim().length > 0) {
        return {
          success: true,
          status: 'RECEIVED',
          code: String(code).trim(),
          statusText: 'SMS كودى كەلدى',
          rawResponse,
          raw: json,
        };
      }

      if (rawResponse.includes('STATUS_WAIT_CODE') || rawResponse.includes('ACCESS_READY') || statusText.toLowerCase().includes('waiting')) {
        return {
          success: true,
          status: 'WAIT_CODE',
          statusText: 'SMS كودى كۈتۈلمەكتە...',
          rawResponse,
          raw: json,
        };
      }

      if (rawResponse.includes('STATUS_CANCEL') || statusText.toLowerCase().includes('cancel')) {
        return {
          success: true,
          status: 'CANCELED',
          statusText: 'نومۇر بىكار قىلىندى',
          rawResponse,
          raw: json,
        };
      }

      // Check if code is hidden in raw response (e.g. STATUS_OK:123456)
      if (rawResponse.startsWith('STATUS_OK:')) {
        const extractedCode = rawResponse.replace('STATUS_OK:', '').trim();
        return {
          success: true,
          status: 'RECEIVED',
          code: extractedCode,
          statusText: 'SMS كودى كەلدى',
          rawResponse,
          raw: json,
        };
      }

      return {
        success: true,
        status: 'WAIT_CODE',
        statusText,
        rawResponse,
        raw: json,
      };
    } catch (err: any) {
      return { success: false, status: 'UNKNOWN', error: err?.message || 'تەمىنلىگۈچىگە ئۇلىنالمىدى' };
    }
  }

  /**
   * Cancel activation and refund
   */
  async cancelActivation(activationId: string): Promise<boolean> {
    const res = await this.checkStatus(activationId, 8);
    return res.success;
  }

  /**
   * Confirm code received and finish
   */
  async finishActivation(activationId: string): Promise<boolean> {
    const res = await this.checkStatus(activationId, 3);
    return res.success;
  }
}

export const phonecashProvider = new PhonecashProvider();
