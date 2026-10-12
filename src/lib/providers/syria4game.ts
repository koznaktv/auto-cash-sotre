/**
 * AUTO CASH - syria4game.com Integration Provider
 * Secure wholesale game top-up API client with auto-refund, timeout safeguards,
 * and sandbox mode.
 */

export interface PlayerInquiryResult {
  success: boolean;
  playerName?: string;
  errorMessage?: string;
}

export interface ProviderOrderResult {
  success: boolean;
  providerOrderId?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  rawResponse?: any;
}

export interface ProviderBalanceResult {
  success: boolean;
  balance?: number;
  currency?: string;
  errorMessage?: string;
}

export class Syria4GameProvider {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private isConfigured: boolean;

  constructor() {
    this.baseUrl = process.env.SYRIA4GAME_BASE_URL || 'https://syria4game.com/api/v1';
    this.apiKey = process.env.SYRIA4GAME_API_KEY || '';
    this.apiSecret = process.env.SYRIA4GAME_API_SECRET || '';
    this.isConfigured = Boolean(this.apiKey && this.apiKey.length > 5);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }
    if (this.apiSecret) {
      headers['X-API-SECRET'] = this.apiSecret;
    }

    return headers;
  }

  /**
   * Check wholesale account balance on syria4game.com
   */
  async checkProviderBalance(): Promise<ProviderBalanceResult> {
    if (!this.isConfigured) {
      return {
        success: true,
        balance: 9999.0,
        currency: 'USD (Sandbox)',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${this.baseUrl}/balance`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          errorMessage: data.message || 'تەمىنلىگۈچى قالدۇق پۇلىنى ئوقۇش مەغلۇپ بولدى',
        };
      }

      return {
        success: true,
        balance: Number(data.balance || 0),
        currency: data.currency || 'USD',
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.name === 'AbortError' ? 'تەمىنلىگۈچى ئىنكاس قايتۇرمىدى (Timeout)' : err.message,
      };
    }
  }

  /**
   * Verify game player nickname before submitting real money order
   */
  async checkPlayerNickname(
    gameCode: string,
    playerId: string,
    zoneId?: string
  ): Promise<PlayerInquiryResult> {
    if (!this.isConfigured) {
      // Sandbox simulated player lookup
      return {
        success: true,
        playerName: `Player_${playerId.slice(-4)}`,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${this.baseUrl}/player/inquiry`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          game: gameCode,
          player_id: playerId,
          zone_id: zoneId || null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          errorMessage: data.message || 'ئويۇنچى كىملىكى تېپىلمىدى ياكى خاتا كىرگۈزۈلدى!',
        };
      }

      return {
        success: true,
        playerName: data.player_name || data.nickname || 'Verified Player',
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.name === 'AbortError' ? 'تاشقى تەمىنلىگۈچى ۋاقىت چېكىدىن ئېشىپ كەتتى' : err.message,
      };
    }
  }

  /**
   * Submit top-up order to syria4game.com with strict timeout safeguards
   */
  async submitTopupOrder(params: {
    clientOrderId: string;
    gameCode: string;
    packageCode: string;
    playerId: string;
    zoneId?: string;
  }): Promise<ProviderOrderResult> {
    if (!this.isConfigured) {
      // Sandbox automatic fulfillment
      return {
        success: true,
        providerOrderId: `S4G-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'COMPLETED',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds max timeout

      const res = await fetch(`${this.baseUrl}/order/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          reference_id: params.clientOrderId,
          game: params.gameCode,
          package: params.packageCode,
          player_id: params.playerId,
          zone_id: params.zoneId || null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          status: 'FAILED',
          errorMessage: data.message || 'تاشقى سۇپا زاكازنى بىر تەرەپ قىلالمىدى',
          rawResponse: data,
        };
      }

      return {
        success: true,
        providerOrderId: data.order_id || data.provider_id,
        status: data.status || 'COMPLETED',
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        errorMessage: err.name === 'AbortError' ? 'تاشقى تەمىنلىگۈچى تورى ئۈزۈلۈپ قالدى (Timeout)' : err.message,
      };
    }
  }

  /**
   * Query order status on syria4game.com
   */
  async checkOrderStatus(providerOrderId: string, clientOrderId?: string): Promise<ProviderOrderResult> {
    if (!this.isConfigured) {
      return {
        success: true,
        providerOrderId,
        status: 'COMPLETED',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `${this.baseUrl}/order/status?order_id=${encodeURIComponent(providerOrderId)}${
        clientOrderId ? `&reference_id=${encodeURIComponent(clientOrderId)}` : ''
      }`;

      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          status: 'FAILED',
          errorMessage: data.message || 'زاكاز ھالىتىنى تەكشۈرۈش مەغلۇپ بولدى',
        };
      }

      return {
        success: true,
        providerOrderId: data.order_id || providerOrderId,
        status: data.status || 'COMPLETED',
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        errorMessage: err.name === 'AbortError' ? 'ئۇلىنىش ۋاقىت چېكىدىن ئاشتى' : err.message,
      };
    }
  }
}

export const syria4GameProvider = new Syria4GameProvider();
