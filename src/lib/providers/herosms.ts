/**
 * HeroSMS API Client for AUTO CASH
 * Virtual Phone Numbers & SMS Verification Provider (hero-sms.com)
 *
 * Config:
 * - HEROSMS_API_KEY: bbA8dd76cdbf2c68193950cA1cdd7439
 * - HEROSMS_BASE_URL: https://hero-sms.com or https://partners-api.hero-sms.com
 */

export interface HeroSmsConfig {
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
}

export interface HeroSmsBalanceResult {
  success: boolean;
  balance?: number;
  currency?: string;
  error?: string;
  raw?: any;
}

export interface HeroSmsNumberResult {
  success: boolean;
  activationId?: string;
  phone?: string;
  error?: string;
}

export interface HeroSmsStatusResult {
  success: boolean;
  status: 'WAIT_CODE' | 'RECEIVED' | 'CANCELED' | 'EXPIRED' | 'UNKNOWN';
  code?: string;
  fullSms?: string;
  error?: string;
}

export class HeroSmsProvider {
  private baseUrl: string = (process.env.HEROSMS_BASE_URL || 'https://hero-sms.com/stubs/handler_api.php').trim();
  private apiKey: string = (process.env.HEROSMS_API_KEY || '').trim();

  getConfig(): HeroSmsConfig {
    const apiKey = (process.env.HEROSMS_API_KEY || this.apiKey || '').trim();
    const baseUrl = (process.env.HEROSMS_BASE_URL || this.baseUrl || 'https://hero-sms.com/stubs/handler_api.php').trim();
    return {
      apiKey,
      baseUrl,
      enabled: Boolean(apiKey && apiKey.length > 5),
    };
  }

  private getHeaders(): Record<string, string> {
    const { apiKey } = this.getConfig();
    return {
      Accept: 'application/json, text/plain, */*',
      apikey: apiKey,
      'X-Api-Key': apiKey,
    };
  }

  /**
   * Ping & Check Balance on HeroSMS
   */
  async getBalance(): Promise<HeroSmsBalanceResult> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'HEROSMS_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const sep = config.baseUrl.includes('?') ? '&' : '?';
      const url = `${config.baseUrl}${sep}action=getBalance&api_key=${encodeURIComponent(config.apiKey)}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      const text = (await res.text()).trim();

      // Handle standard protocol responses like ACCESS_BALANCE:10.50
      if (text.startsWith('ACCESS_BALANCE:')) {
        const bal = parseFloat(text.replace('ACCESS_BALANCE:', '').trim());
        return {
          success: true,
          balance: Number.isFinite(bal) ? bal : 0,
          currency: 'RUB / USD',
          raw: text,
        };
      }

      // Handle JSON response
      try {
        const json = JSON.parse(text);
        if (json.balance !== undefined || json.status === 'success') {
          return {
            success: true,
            balance: Number(json.balance || 0),
            currency: json.currency || 'USD',
            raw: json,
          };
        }
      } catch {}

      if (text === 'BAD_KEY') {
        return { success: false, error: 'HeroSMS API ئاچقۇچى خاتا (BAD_KEY)', raw: text };
      }

      return {
        success: res.ok,
        balance: res.ok ? 0 : undefined,
        raw: text,
        error: res.ok ? undefined : `HeroSMS API جاۋابى: ${text}`,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'HeroSMS API غا ئۇلىنىش مەغلۇپ بولدى' };
    }
  }

  /**
   * Order a virtual number for SMS reception
   */
  async requestNumber(serviceCode: string, countryId: number = 0): Promise<HeroSmsNumberResult> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, error: 'HEROSMS_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const sep = config.baseUrl.includes('?') ? '&' : '?';
      const url = `${config.baseUrl}${sep}action=getNumber&service=${encodeURIComponent(serviceCode)}&country=${encodeURIComponent(countryId)}&api_key=${encodeURIComponent(config.apiKey)}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      const text = (await res.text()).trim();

      // Standard response: ACCESS_NUMBER:12345678:79991234567
      if (text.startsWith('ACCESS_NUMBER:')) {
        const parts = text.split(':');
        return {
          success: true,
          activationId: parts[1],
          phone: parts[2] ? `+${parts[2].replace(/^\+/, '')}` : undefined,
        };
      }

      if (text === 'NO_NUMBERS') {
        return { success: false, error: 'بۇ مۇلازىمەت ئۈچۈن ھازىر بوش نومۇر يوق' };
      }
      if (text === 'NO_BALANCE') {
        return { success: false, error: 'HeroSMS ھېسابات قالدۇقى يېتەرلىك ئەمەس' };
      }

      return { success: false, error: `نومۇر ئېلىش مەغلۇپ بولدى: ${text}` };
    } catch (err: any) {
      return { success: false, error: err?.message || 'HeroSMS تەلەپ خاتالىقى' };
    }
  }

  /**
   * Check verification code status
   */
  async checkCode(activationId: string): Promise<HeroSmsStatusResult> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, status: 'UNKNOWN', error: 'HEROSMS_API_KEY تەڭشەلمىگەن' };
    }

    try {
      const sep = config.baseUrl.includes('?') ? '&' : '?';
      const url = `${config.baseUrl}${sep}action=getStatus&id=${encodeURIComponent(activationId)}&api_key=${encodeURIComponent(config.apiKey)}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      const text = (await res.text()).trim();

      if (text.startsWith('STATUS_OK:')) {
        const code = text.replace('STATUS_OK:', '').trim();
        return { success: true, status: 'RECEIVED', code };
      }
      if (text === 'STATUS_WAIT_CODE') {
        return { success: true, status: 'WAIT_CODE' };
      }
      if (text === 'STATUS_CANCEL') {
        return { success: true, status: 'CANCELED' };
      }

      return { success: false, status: 'UNKNOWN', error: `نومۇر ھالىتى: ${text}` };
    } catch (err: any) {
      return { success: false, status: 'UNKNOWN', error: err?.message };
    }
  }

  /**
   * Cancel activation & refund
   */
  async cancelActivation(activationId: string): Promise<boolean> {
    const config = this.getConfig();
    if (!config.enabled) return false;

    try {
      const sep = config.baseUrl.includes('?') ? '&' : '?';
      const url = `${config.baseUrl}${sep}action=setStatus&status=8&id=${encodeURIComponent(activationId)}&api_key=${encodeURIComponent(config.apiKey)}`;
      const res = await fetch(url, { method: 'GET', headers: this.getHeaders(), cache: 'no-store' });
      const text = (await res.text()).trim();
      return text.includes('ACCESS_CANCEL') || text.includes('SUCCESS');
    } catch {
      return false;
    }
  }
}

export const heroSmsProvider = new HeroSmsProvider();
