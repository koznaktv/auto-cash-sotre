import { NextResponse } from 'next/server';
import { getSystemSettingsAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  try {
    const settings = await getSystemSettingsAsync();
    const shamcashAddress = (settings.shamcashAddress || process.env.SHAMCASH_ADDRESS || 'efe8a2b200d66411c7c7e296369cbba8').trim();
    const exchangeRate = Number(settings.shamcashExchangeRate || process.env.SHAMCASH_EXCHANGE_RATE || 143);
    const hasTsaKey = Boolean((settings.tsaApiKey || process.env.SHAM_CASH_API_KEY || process.env.TSA_API_KEY || '').trim());
    const autoDepositEnabled = hasTsaKey && (settings.tsaAutoDepositEnabled !== false);

    return NextResponse.json(
      {
        success: true,
        shamcashAddress,
        exchangeRate: exchangeRate > 0 ? exchangeRate : 143,
        autoDepositEnabled,
        hasTsaKey,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        shamcashAddress: 'efe8a2b200d66411c7c7e296369cbba8',
        exchangeRate: 143,
        autoDepositEnabled: false,
      },
      { headers: NO_CACHE_HEADERS }
    );
  }
}
