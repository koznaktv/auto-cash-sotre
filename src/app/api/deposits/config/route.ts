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
    const rawAddr = (settings.shamcashAddress || process.env.SHAMCASH_ADDRESS || '').trim();
    const shamcashAddress = (!rawAddr || rawAddr.includes('084c7e47')) ? 'efe8a2b200d66411c7c7e296369cbba8' : rawAddr;
    const baseRate = Number(settings.shamcashBaseRate || 14375);
    const margin = Number(settings.shamcashRateMargin !== undefined ? settings.shamcashRateMargin : 15);
    const exchangeRate = Number(settings.shamcashExchangeRate || (baseRate + margin));
    const hasTsaKey = Boolean((settings.tsaApiKey || process.env.SHAM_CASH_API_KEY || process.env.TSA_API_KEY || '').trim());
    const autoDepositEnabled = hasTsaKey && (settings.tsaAutoDepositEnabled !== false);

    return NextResponse.json(
      {
        success: true,
        shamcashAddress,
        exchangeRate: exchangeRate > 0 ? exchangeRate : 14390,
        baseRate,
        margin,
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
        exchangeRate: 14390,
        baseRate: 14375,
        margin: 15,
        autoDepositEnabled: false,
      },
      { headers: NO_CACHE_HEADERS }
    );
  }
}
