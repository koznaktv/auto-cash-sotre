import { NextResponse } from 'next/server';
import { runScheduledRateCheck, getExchangeRateConfig } from '@/lib/exchangeRateService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true' || searchParams.get('force') === '1';

    const result = await runScheduledRateCheck(force);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[Cron exchange-rate Error]:', err?.message);
    const current = await getExchangeRateConfig().catch(() => null);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Exchange rate check failed',
        current,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
