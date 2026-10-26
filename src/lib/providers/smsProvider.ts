/**
 * Universal SMS / Virtual Number Provider Service for AUTO CASH
 * Supports standard protocols:
 * 1. SMS-Activate protocol (handler_api.php): Used by SMS-Activate, Grizzly SMS, SMS-Man, Vak-SMS, Tiger-SMS, etc.
 * 2. 5sim JSON API (https://5sim.net/v1/)
 * 3. Custom REST JSON API
 */

import { loadStoredProviderConfig } from '../provider/providerConfigStore';

export interface SmsProviderConfig {
  type: 'sms_activate' | '5sim' | 'custom_rest';
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
}

export interface SmsActivationResult {
  success: boolean;
  activationId?: string;
  phone?: string;
  cost?: number;
  currency?: string;
  error?: string;
}

export interface SmsCodeCheckResult {
  success: boolean;
  status: 'WAIT_CODE' | 'RECEIVED' | 'CANCELED' | 'EXPIRED' | 'UNKNOWN';
  code?: string;
  fullSms?: string;
  error?: string;
}

export class SmsProvider {
  /**
   * Resolve current SMS provider configuration from persistent store and environment
   */
  async getConfig(): Promise<SmsProviderConfig> {
    const stored = loadStoredProviderConfig();
    const envUrl = process.env.SMS_API_URL || process.env.SMS_PROVIDER_URL || '';
    const envKey = process.env.SMS_API_KEY || process.env.SMS_PROVIDER_API_KEY || '';
    const envType = (process.env.SMS_PROVIDER_TYPE || 'sms_activate') as any;

    const baseUrl = (stored.smsApiUrl || envUrl || 'https://api.sms-activate.org/stubs/handler_api.php').trim();
    const apiKey = (stored.smsApiKey || envKey || '').trim();
    const type = stored.smsProviderType || envType || 'sms_activate';
    const enabled = stored.smsEnabled !== undefined ? Boolean(stored.smsEnabled) : Boolean(apiKey);

    return { type, baseUrl, apiKey, enabled };
  }

  /**
   * Ping / Check balance & account status from the SMS provider
   */
  async getProfile(): Promise<{
    success: boolean;
    balance: number | null;
    currency: string;
    userName?: string;
    error?: string;
    raw?: any;
  }> {
    const config = await this.getConfig();
    if (!config.enabled) {
      return { success: false, balance: null, currency: 'USD', error: 'مەۋھۇم نومۇر API سى تاقالغان (Disabled)' };
    }
    if (!config.apiKey || config.apiKey.length < 4) {
      return { success: false, balance: null, currency: 'USD', error: 'API Key تېخى كىرگۈزۈلمىگەن' };
    }

    try {
      if (config.type === '5sim') {
        const url = config.baseUrl.replace(/\/+$/, '') + '/user/profile';
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data && (data.balance !== undefined || data.rating !== undefined)) {
          return {
            success: true,
            balance: Number(data.balance || 0),
            currency: 'RUB',
            userName: data.email || '5sim User',
            raw: data,
          };
        }
        return { success: false, balance: null, currency: 'RUB', error: data?.msg || data?.error || '5sim connection failed' };
      }

      if (config.type === 'custom_rest') {
        const url = `${config.baseUrl.replace(/\/+$/, '')}/balance?key=${encodeURIComponent(config.apiKey)}`;
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (res.ok && data) {
          const balance = data.balance ?? data.funds ?? data.credit;
          return {
            success: true,
            balance: Number(balance || 0),
            currency: (data.currency || 'USD').toUpperCase(),
            userName: data.user || 'REST User',
            raw: data,
          };
        }
        return { success: false, balance: null, currency: 'USD', error: data?.message || 'REST API connection failed' };
      }

      // Default: SMS-Activate standard handler protocol (action=getBalance)
      let separator = config.baseUrl.includes('?') ? '&' : '?';
      let url = `${config.baseUrl}${separator}api_key=${encodeURIComponent(config.apiKey)}&action=getBalance`;

      const res = await fetch(url, { cache: 'no-store' });
      const text = (await res.text()).trim();

      // Successful response format: ACCESS_BALANCE:15.50 or {"balance":15.5}
      if (text.startsWith('ACCESS_BALANCE:')) {
        const rawBal = text.replace('ACCESS_BALANCE:', '').trim();
        const balance = parseFloat(rawBal);
        return {
          success: true,
          balance: Number.isFinite(balance) ? balance : 0,
          currency: 'RUB / USD',
          userName: 'SMS-Activate User',
          raw: text,
        };
      }

      if (text.startsWith('{') && text.endsWith('}')) {
        try {
          const json = JSON.parse(text);
          if (json.balance !== undefined) {
            return {
              success: true,
              balance: Number(json.balance),
              currency: json.currency || 'USD',
              userName: json.email || 'SMS User',
              raw: json,
            };
          }
        } catch {}
      }

      const errorMap: Record<string, string> = {
        BAD_KEY: 'API Key خاتا ياكى ئىناۋەتسىز (BAD_KEY)',
        ERROR_SQL: 'تەمىنلىگۈچى ساندانىدا خاتالىق (ERROR_SQL)',
        NO_ACTIVATION: 'ئاكتىپ نومۇر تېپىلمىدى',
        BAD_ACTION: 'API ھەرىكىتى خاتا (BAD_ACTION)',
      };

      return {
        success: false,
        balance: null,
        currency: 'USD',
        error: errorMap[text] || text || 'تەمىنلىگۈچىدىن نامەلۇم جاۋاب كەلدى',
        raw: text,
      };
    } catch (err: any) {
      return { success: false, balance: null, currency: 'USD', error: err?.message || 'تەمىنلىگۈچىگە ئۇلىنالمىدى' };
    }
  }

  /**
   * Request / Buy a new virtual number for a service and country
   */
  async getNumber(params: {
    service: string;   // e.g. 'tg' (Telegram), 'wa' (WhatsApp), 'oi' (OpenAI), 'go' (Google)
    country?: string | number; // e.g. '0' (Russia), '12' (USA), 'uk'
  }): Promise<SmsActivationResult> {
    const config = await this.getConfig();
    if (!config.enabled || !config.apiKey) {
      return { success: false, error: 'مەۋھۇم نومۇر API سى ئاكتىپ ئەمەس ياكى ئاچقۇچ كىرگۈزۈلمىگەن' };
    }

    try {
      if (config.type === '5sim') {
        const country = params.country || 'any';
        const operator = 'any';
        const url = `${config.baseUrl.replace(/\/+$/, '')}/user/buy/activation/${country}/${operator}/${encodeURIComponent(params.service)}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${config.apiKey}`, Accept: 'application/json' },
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.id && data?.phone) {
          return {
            success: true,
            activationId: String(data.id),
            phone: String(data.phone),
            cost: Number(data.price || 0),
          };
        }
        return { success: false, error: data?.msg || data?.error || 'نومۇر ئېلىش مەغلۇپ بولدى' };
      }

      // Default: SMS-Activate standard handler protocol (action=getNumber)
      let separator = config.baseUrl.includes('?') ? '&' : '?';
      let url = `${config.baseUrl}${separator}api_key=${encodeURIComponent(config.apiKey)}&action=getNumber&service=${encodeURIComponent(params.service)}`;
      if (params.country !== undefined) {
        url += `&country=${encodeURIComponent(String(params.country))}`;
      }

      const res = await fetch(url);
      const text = (await res.text()).trim();

      // Success response format: ACCESS_NUMBER:12345678:79991234567
      if (text.startsWith('ACCESS_NUMBER:')) {
        const parts = text.split(':');
        const activationId = parts[1];
        const phone = parts[2];
        return {
          success: true,
          activationId,
          phone,
        };
      }

      const errorMap: Record<string, string> = {
        NO_NUMBERS: 'بۇ دۆلەت ياكى ئەپكە نۆۋەتتە بوش نومۇر قالمىدى (NO_NUMBERS)',
        NO_BALANCE: 'تەمىنلىگۈچى ھېساباتىدا قالدۇق پۇل يېتىشمىدى (NO_BALANCE)',
        BAD_SERVICE: 'بۇنداق ئەپ كودى تېپىلمىدى (BAD_SERVICE)',
        BAD_KEY: 'API Key خاتا',
      };

      return { success: false, error: errorMap[text] || text || 'نومۇر ئېلىش مەغلۇپ بولدى' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'نومۇر ئېلىشتا خاتالىق كۆرۈلدى' };
    }
  }

  /**
   * Check if the SMS verification code has arrived for this activation
   */
  async checkCode(activationId: string): Promise<SmsCodeCheckResult> {
    const config = await this.getConfig();
    if (!config.enabled || !config.apiKey) {
      return { success: false, status: 'UNKNOWN', error: 'API ئاكتىپ ئەمەس' };
    }

    try {
      if (config.type === '5sim') {
        const url = `${config.baseUrl.replace(/\/+$/, '')}/user/check/${encodeURIComponent(activationId)}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${config.apiKey}`, Accept: 'application/json' },
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data) {
          if (data.status === 'RECEIVED' && Array.isArray(data.sms) && data.sms.length > 0) {
            const smsObj = data.sms[data.sms.length - 1];
            return {
              success: true,
              status: 'RECEIVED',
              code: smsObj.code || (smsObj.text?.match(/\b\d{4,8}\b/)?.[0]),
              fullSms: smsObj.text,
            };
          }
          if (data.status === 'CANCELED' || data.status === 'TIMEOUT') {
            return { success: true, status: 'CANCELED' };
          }
          return { success: true, status: 'WAIT_CODE' };
        }
        return { success: false, status: 'UNKNOWN', error: data?.msg || 'كود تەكشۈرۈش مەغلۇپ بولدى' };
      }

      // Default: SMS-Activate standard handler protocol (action=getStatus)
      let separator = config.baseUrl.includes('?') ? '&' : '?';
      let url = `${config.baseUrl}${separator}api_key=${encodeURIComponent(config.apiKey)}&action=getStatus&id=${encodeURIComponent(activationId)}`;

      const res = await fetch(url);
      const text = (await res.text()).trim();

      // STATUS_OK:123456
      if (text.startsWith('STATUS_OK:')) {
        const code = text.replace('STATUS_OK:', '').trim();
        return {
          success: true,
          status: 'RECEIVED',
          code,
        };
      }

      if (text === 'STATUS_WAIT_CODE' || text === 'STATUS_WAIT_RESEND') {
        return { success: true, status: 'WAIT_CODE' };
      }

      if (text === 'STATUS_CANCEL') {
        return { success: true, status: 'CANCELED' };
      }

      return { success: true, status: 'UNKNOWN', error: text };
    } catch (err: any) {
      return { success: false, status: 'UNKNOWN', error: err?.message };
    }
  }

  /**
   * Cancel virtual number activation (e.g. if customer cancelled or timeout)
   */
  async cancelNumber(activationId: string): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfig();
    if (!config.enabled || !config.apiKey) return { success: false, error: 'API ئاكتىپ ئەمەس' };

    try {
      if (config.type === '5sim') {
        const url = `${config.baseUrl.replace(/\/+$/, '')}/user/cancel/${encodeURIComponent(activationId)}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${config.apiKey}`, Accept: 'application/json' },
        });
        return { success: res.ok };
      }

      // Default SMS-Activate: status=8 (cancel)
      let separator = config.baseUrl.includes('?') ? '&' : '?';
      let url = `${config.baseUrl}${separator}api_key=${encodeURIComponent(config.apiKey)}&action=setStatus&status=8&id=${encodeURIComponent(activationId)}`;
      const res = await fetch(url);
      const text = (await res.text()).trim();
      return { success: text === 'ACCESS_CANCEL' || res.ok };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }
}

export const smsProvider = new SmsProvider();
