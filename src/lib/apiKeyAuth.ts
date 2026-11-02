import { NextResponse } from 'next/server';
import { getUserByApiKeyAsync, UserRecord } from './db';

export interface AuthenticatedApiUser {
  user: UserRecord;
  vipDiscountPercent: number;
}

export const VIP_DISCOUNT_RATES: Record<string, number> = {
  vip1: 0,
  vip2: 1, // 1%
  vip3: 2, // 2%
  vip4: 3, // 3%
  vip5: 5, // 5%
};

export function getVipDiscountPercent(tier: string = 'vip1'): number {
  return VIP_DISCOUNT_RATES[tier] ?? 0;
}

export function applyVipDiscount(basePrice: number, tier: string = 'vip1'): number {
  const discountPercent = getVipDiscountPercent(tier);
  if (discountPercent <= 0) return Math.round(basePrice * 100) / 100;
  const discounted = basePrice * (1 - discountPercent / 100);
  return Math.round(discounted * 100) / 100;
}

export async function authenticateApiKey(
  req: Request
): Promise<{ user: UserRecord | null; vipDiscountPercent: number; errorResponse: NextResponse | null }> {
  let token: string | null = null;

  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. Check api-token or x-api-key headers
  if (!token) {
    token = req.headers.get('api-token') || req.headers.get('x-api-key') || req.headers.get('token');
  }

  // 3. Fallback: URL query parameters (useful for simple GET requests or bots)
  if (!token) {
    try {
      const url = new URL(req.url);
      token = url.searchParams.get('token') || url.searchParams.get('api_key') || url.searchParams.get('apiKey');
    } catch {}
  }

  if (!token || token.trim().length === 0) {
    return {
      user: null,
      vipDiscountPercent: 0,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'MISSING_API_KEY',
          message: 'API Key تەمىنلەنمىدى. Authorization: Bearer <KEY> ياكى api-token تېمىسىنى تەمىنلەڭ.',
        },
        { status: 401 }
      ),
    };
  }

  const user = await getUserByApiKeyAsync(token.trim());
  if (!user) {
    return {
      user: null,
      vipDiscountPercent: 0,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'INVALID_API_KEY',
          message: 'ئىناۋەتسىز API Key ياكى تاقالغان.',
        },
        { status: 401 }
      ),
    };
  }

  if (user.isBanned) {
    return {
      user: null,
      vipDiscountPercent: 0,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'ACCOUNT_BANNED',
          message: 'ھېساباتىڭىز تاقالغان (Banned). ياردەم بىلەن ئالاقىلىشىڭ.',
        },
        { status: 403 }
      ),
    };
  }

  if (user.apiEnabled === false) {
    return {
      user: null,
      vipDiscountPercent: 0,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'API_DISABLED',
          message: 'API ئىشلىتىش ئىمتىيازىڭىز ئېتىلگەن.',
        },
        { status: 403 }
      ),
    };
  }

  const discountRate = getVipDiscountPercent(user.vipTier);
  return { user, vipDiscountPercent: discountRate, errorResponse: null };
}
