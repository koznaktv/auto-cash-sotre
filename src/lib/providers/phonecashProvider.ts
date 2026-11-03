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
  errorCode?: string;
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
   * Fetch current wholesale USD balance
   * Connected to action=getBalance
   */
  async getBalance(): Promise<{ success: boolean; balance: number | null; error?: string; raw?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, balance: null, error: 'PhoneCash API ئاچقۇچى كىرگۈزۈلمىگەن' };
    }

    try {
      const url = `${this.getBaseUrl()}?action=getBalance&api_key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (json && json.success && json.data && json.data.balance !== undefined && json.data.balance !== null) {
        return {
          success: true,
          balance: Number(json.data.balance),
          raw: json,
        };
      }
      return {
        success: false,
        balance: null,
        error: json?.message || 'Invalid action',
        raw: json,
      };
    } catch (err: any) {
      return {
        success: false,
        balance: null,
        error: err?.message || 'تەمىنلىگۈچىگە ئۇلىنالمىدى',
      };
    }
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
        const rawCode = String(json?.message || '').trim();
        let translatedError = 'نومۇر سېتىۋېلىش مەغلۇپ بولدى (زاپاس نومۇر قالمىغان بولۇشى مۇمكىن)';

        if (rawCode.toUpperCase().includes('NO_NUMBERS')) {
          translatedError = 'نۆۋەتتە بۇ دۆلەتتە بۇ ئەپ ئۈچۈن بوش نومۇر قالمىدى (NO_NUMBERS). باشقا بىر دۆلەتنى (مەسىلەن: ۋىيېتنام، ئەنگلىيە، ئامېرىكا ياكى ھىندونېزىيە) تاللاپ كۆرۈڭ.';
        } else if (rawCode.toUpperCase().includes('NO_BALANCE') || rawCode.toUpperCase().includes('NO_MONEY')) {
          translatedError = 'تەمىنلىگۈچى ھېساباتىدا قالدۇق يېتىشمىدى. باشقۇرغۇچىغا ئاپتوماتىك ئۇقتۇرۇلدى.';
        } else if (rawCode.toUpperCase().includes('BAD_ACTION') || rawCode.toUpperCase().includes('BAD_SERVICE')) {
          translatedError = 'بۇ دۆلەتتە مەزكۇر مۇلازىمەت ۋاقىتلىق ئېچىلمىغان، باشقا دۆلەتنى سىناڭ.';
        } else if (rawCode) {
          translatedError = `تەمىنلىگۈچىدىن خاتالىق كەلدى: ${rawCode}`;
        }

        return {
          success: false,
          errorCode: rawCode,
          error: translatedError,
          raw: json,
        };
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

      const costPrice = item.price !== undefined ? Number(item.price) : undefined;

      return {
        success: true,
        activationId: String(item.id),
        phone: String(item.number),
        costPrice,
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
   * Follows official documentation:
   * ?action=checkStatus&id={id}&service={service}&country={country}&api_key={key}
   */
  async checkStatus(
    activationId: string,
    statusAction: 1 | 3 | 8 = 1,
    options?: { service?: string; country?: number | string }
  ): Promise<PhonecashStatusResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, status: 'UNKNOWN', error: 'PhoneCash API ئاچقۇچى كىرگۈزۈلمىگەن' };
    }

    try {
      let url = `${this.getBaseUrl()}?action=checkStatus&id=${encodeURIComponent(activationId)}&api_key=${encodeURIComponent(apiKey)}`;
      if (options?.service) {
        url += `&service=${encodeURIComponent(options.service)}`;
      }
      if (options?.country !== undefined && options?.country !== null && options?.country !== '') {
        url += `&country=${encodeURIComponent(options.country)}`;
      }
      if (statusAction && statusAction !== 1) {
        url += `&status_action=${statusAction}`;
      }

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

      const statusText = String(data?.status_text || '');
      const rawResponse = String(data?.raw_response || '');
      const rawCode = data?.code;

      // 1. Comprehensive code extraction from all possible schema variants
      let finalCode = '';
      if (rawCode && String(rawCode).trim().length > 0) {
        finalCode = String(rawCode).trim();
      }

      // If code was not populated directly, extract from rawResponse (e.g. STATUS_OK:123456 or STATUS_WAIT_RETRY:123456)
      if (!finalCode && rawResponse) {
        const okMatch = rawResponse.match(/(?:STATUS_OK|STATUS_WAIT_RETRY|ACCESS_NUMBER|CODE)[:\s]*([A-Za-z0-9_-]+)/i);
        if (okMatch && okMatch[1]) {
          finalCode = okMatch[1].trim();
        } else if (/^\d{4,8}$/.test(rawResponse.trim())) {
          finalCode = rawResponse.trim();
        }
      }

      // If code is inside statusText
      if (!finalCode && statusText) {
        if (/^\d{4,8}$/.test(statusText.trim())) {
          finalCode = statusText.trim();
        } else {
          const textMatch = statusText.match(/(?:code|رمز|كود|کد)[:\s]*([A-Za-z0-9]+)/i);
          if (textMatch && textMatch[1]) {
            finalCode = textMatch[1].trim();
          }
        }
      }

      // If code is detected, return RECEIVED immediately!
      if (finalCode && finalCode.length > 0) {
        return {
          success: true,
          status: 'RECEIVED',
          code: finalCode,
          statusText: 'SMS كودى كەلدى',
          rawResponse,
          raw: json,
        };
      }

      // 2. Cancellation: ONLY if explicitly cancelled by provider
      if (
        rawResponse.includes('STATUS_CANCEL') ||
        statusText.toLowerCase() === 'canceled' ||
        statusText.toLowerCase() === 'cancelled'
      ) {
        return {
          success: true,
          status: 'CANCELED',
          statusText: 'نومۇر بىكار قىلىندى',
          rawResponse,
          raw: json,
        };
      }

      // 3. Otherwise, the number is still active and waiting for SMS
      // Note: NO_ACTIVATION, ACCESS_READY, STATUS_WAIT_CODE all mean "waiting for incoming SMS"
      return {
        success: true,
        status: 'WAIT_CODE',
        statusText: 'SMS كودى كۈتۈلمەكتە...',
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
  async cancelActivation(
    activationId: string,
    options?: { service?: string; country?: number | string }
  ): Promise<boolean> {
    const res = await this.checkStatus(activationId, 8, options);
    return res.success;
  }

  /**
   * Confirm code received and finish
   */
  async finishActivation(
    activationId: string,
    options?: { service?: string; country?: number | string }
  ): Promise<boolean> {
    const res = await this.checkStatus(activationId, 3, options);
    return res.success;
  }
}

export const phonecashProvider = new PhonecashProvider();
