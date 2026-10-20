import { NextResponse } from 'next/server';
import { getSystemSettingsAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSystemSettingsAsync();
    const shamcashAddress = (settings.shamcashAddress || process.env.SHAMCASH_ADDRESS || 'efe8a2b200d66411c7c7e296369cbba8').trim();
    const exchangeRate = Number(settings.shamcashExchangeRate || process.env.SHAMCASH_EXCHANGE_RATE || 15000);
    const hasTsaKey = Boolean((settings.tsaApiKey || process.env.TSA_API_KEY || '').trim());
    const autoDepositEnabled = hasTsaKey && (settings.tsaAutoDepositEnabled !== false);

    return NextResponse.json({
      success: true,
      shamcashAddress,
      exchangeRate: exchangeRate > 0 ? exchangeRate : 15000,
      autoDepositEnabled,
      hasTsaKey,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      shamcashAddress: 'efe8a2b200d66411c7c7e296369cbba8',
      exchangeRate: 15000,
      autoDepositEnabled: false,
    });
  }
}
