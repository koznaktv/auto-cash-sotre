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

      if (!res.ok && !json) {
        return {
          success: false,
          status: 'UNKNOWN',
          error: 'ھالەتنى تەكشۈرۈش مەغلۇپ بولدى (تور خاتالىقى)',
          raw: json,
        };
      }

      // Check if message or data is a waiting indicator even if success: false
      const rawMsg = String(json?.message || json?.error || '').trim();
      const rawData = json?.data;
      const combinedText = `${rawMsg} ${typeof rawData === 'string' ? rawData : ''} ${JSON.stringify(rawData || {})}`;

      // 1. Comprehensive code extraction from ALL possible locations
      let finalCode = '';

      // Direct properties
      const directCandidates = [
        json?.code,
        json?.smsCode,
        json?.sms_code,
        json?.sms,
        rawData?.code,
        rawData?.smsCode,
        rawData?.sms_code,
        rawData?.sms,
        Array.isArray(rawData) && rawData[0]?.code,
        Array.isArray(rawData) && rawData[0]?.smsCode,
        Array.isArray(rawData) && rawData[0]?.sms,
      ];

      for (const val of directCandidates) {
        if (val !== undefined && val !== null && String(val).trim().length > 0 && String(val).trim() !== 'null' && String(val).trim() !== 'undefined') {
          finalCode = String(val).trim();
          break;
        }
      }

      // If not yet found, search text patterns in status_text, raw_response, message, and combined text
      if (!finalCode) {
        const textSources = [
          rawData?.raw_response,
          rawData?.status_text,
          rawData?.text,
          rawData?.full_sms,
          rawData?.message,
          typeof rawData === 'string' ? rawData : null,
          Array.isArray(rawData) && rawData[0]?.raw_response,
          Array.isArray(rawData) && rawData[0]?.status_text,
          rawMsg,
        ];

        for (const src of textSources) {
          if (!src) continue;
          const s = String(src).trim();
          if (!s) continue;

          // Pattern: STATUS_OK:123456 or STATUS_WAIT_RETRY:123456
          const okMatch = s.match(/(?:STATUS_OK|STATUS_WAIT_RETRY|ACCESS_NUMBER|CODE)[:\s]*([A-Za-z0-9_-]+)/i);
          if (okMatch && okMatch[1] && okMatch[1].trim().length >= 3) {
            finalCode = okMatch[1].trim();
            break;
          }

          // Pattern: Pure 4-8 digit number
          if (/^\d{4,8}$/.test(s)) {
            finalCode = s;
            break;
          }

          // Pattern: code/رمز/كود/pin followed by digits
          const keywordMatch = s.match(/(?:code|رمز|كود|کد|pin|otp|passcode|is|:)\s*[:=-]?\s*([0-9]{4,8})/i);
          if (keywordMatch && keywordMatch[1]) {
            finalCode = keywordMatch[1].trim();
            break;
          }
        }
      }

      // Fallback: If any 4-8 digit number exists in raw text and is not a status code or year
      if (!finalCode && combinedText) {
        const numMatch = combinedText.match(/(?:STATUS_OK:?\s*)(\d{4,8})/i) || combinedText.match(/\b\d{4,8}\b/);
        if (numMatch && numMatch[1]) {
          finalCode = numMatch[1].trim();
        }
      }

      // If code was found anywhere -> RECEIVED!
      if (finalCode && finalCode.length > 0) {
        return {
          success: true,
          status: 'RECEIVED',
          code: finalCode,
          statusText: 'SMS كودى كەلدى',
          rawResponse: String(rawData?.raw_response || rawMsg),
          raw: json,
        };
      }

      // 2. Cancellation: ONLY if explicitly cancelled by provider
      if (
        combinedText.toUpperCase().includes('STATUS_CANCEL') ||
        combinedText.toLowerCase().includes('canceled') ||
        combinedText.toLowerCase().includes('cancelled')
      ) {
        return {
          success: true,
          status: 'CANCELED',
          statusText: 'نومۇر بىكار قىلىندى',
          rawResponse: String(rawData?.raw_response || rawMsg),
          raw: json,
        };
      }

      // 3. Waiting for incoming SMS
      // (STATUS_WAIT_CODE, ACCESS_READY, NO_ACTIVATION, or any waiting message)
      return {
        success: true,
        status: 'WAIT_CODE',
        statusText: 'SMS كودى كۈتۈلمەكتە...',
        rawResponse: String(rawData?.raw_response || rawMsg),
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
