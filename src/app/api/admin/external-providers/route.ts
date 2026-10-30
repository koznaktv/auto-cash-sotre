import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import {
  getAllConnectedProviders,
  ggsomaProvider,
  tgmarketProvider,
  heroSmsProvider,
  maxstoreProvider,
  checkTsaStatus,
} from '@/lib/providers/registry';

export const dynamic = 'force-dynamic';

/**
 * GET: Lists all connected external APIs and their configuration state
 * ?test=<providerId>: Pings/tests that specific provider's API
 */
export async function GET(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json(
        { success: false, message: 'باشقۇرغۇچى سالاھىيىتى دەلىللەنمىدى (Unauthorized)' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const testTarget = searchParams.get('test');

    if (testTarget) {
      if (testTarget === 'ggsoma') {
        const ping = await ggsomaProvider.ping();
        return NextResponse.json({ provider: 'ggsoma', result: ping });
      }
      if (testTarget === 'tgmarket') {
        const ping = await tgmarketProvider.ping();
        return NextResponse.json({ provider: 'tgmarket', result: ping });
      }
      if (testTarget === 'herosms') {
        const balance = await heroSmsProvider.getBalance();
        return NextResponse.json({ provider: 'herosms', result: balance });
      }
      if (testTarget === 'maxstore') {
        const ping = await maxstoreProvider.ping();
        return NextResponse.json({ provider: 'maxstore', result: ping });
      }
      if (testTarget === 'sham_cash') {
        const key = process.env.SHAM_CASH_API_KEY || process.env.TSA_API_KEY || '';
        const res = await checkTsaStatus(key);
        return NextResponse.json({ provider: 'sham_cash', result: res });
      }
      return NextResponse.json({ success: false, message: 'نامەلۇم تەمىنلىگۈچى' }, { status: 400 });
    }

    const providers = await getAllConnectedProviders();
    return NextResponse.json({
      success: true,
      providers,
      message: 'بارلىق ئايپىئاي ئۇلىنىشلىرى پۈتۈنلەي ئۇلاندى، توربەت ئالدى يۈزىگە چىقىرىلمىدى.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ئىچكى خاتالىق يۈز بەردى' },
      { status: 500 }
    );
  }
}
