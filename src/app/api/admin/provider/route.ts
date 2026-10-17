import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { syria4GameProvider } from '@/lib/providers/syria4game';
import { listProviderCalls } from '@/lib/provider/callLog';
import { getProviderSettings, updateProviderSettings } from '@/lib/catalog/store';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** ?action=balance (default) | ping | products | calls[&orderId=] */
export async function GET(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json(
        { success: false, message: 'باشقۇرغۇچى سالاھىيىتى دەلىللەنمىدى (Unauthorized)' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'balance';

    if (action === 'ping') {
      const ping = await syria4GameProvider.ping();
      return NextResponse.json({ success: ping.success, errorMessage: ping.error?.message, raw: ping.raw });
    }

    if (action === 'products') {
      const productsRes = await syria4GameProvider.getProducts();
      return NextResponse.json(productsRes);
    }

    if (action === 'calls') {
      const calls = await listProviderCalls({ orderId: searchParams.get('orderId') || undefined, limit: 50 });
      return NextResponse.json({ success: true, calls });
    }

    // Default: wholesale balance & connection status
    const profile = await syria4GameProvider.getProfile();
    if (profile.success && profile.balance !== null) {
      await updateProviderSettings({ lastBalance: profile.balance, lastBalanceAt: new Date().toISOString() }).catch(() => {});
    }
    const settings = await getProviderSettings().catch(() => null);
    return NextResponse.json({
      success: profile.success,
      isConfigured: syria4GameProvider.hasLiveToken(),
      balance: profile.balance ?? undefined,
      currency: profile.currency,
      userName: profile.userName,
      errorMessage: profile.error ? `${profile.error.code ? `[${profile.error.code}] ` : ''}${profile.error.message}` : undefined,
      lowBalance: Boolean(settings && profile.balance !== null && profile.balance < settings.lowBalanceThresholdUsd),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تەمىنلىگۈچى ئۇچۇرىنى تەكشۈرۈش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
