import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { syria4GameProvider } from '@/lib/providers/syria4game';
import { listProviderCalls } from '@/lib/provider/callLog';
import { getProviderSettings, updateProviderSettings } from '@/lib/catalog/store';
import { getSystemSettingsAsync, updateSystemSettingsAsync } from '@/lib/db';
import { saveStoredProviderConfig } from '@/lib/provider/providerConfigStore';

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

    // Default: wholesale balance & connection status + current provider config
    const resolvedConfig = await syria4GameProvider.getResolvedConfig();
    const profile = await syria4GameProvider.getProfile();
    if (profile.success && profile.balance !== null) {
      await updateProviderSettings({ lastBalance: profile.balance, lastBalanceAt: new Date().toISOString() }).catch(() => {});
    }
    const catalogSettings = await getProviderSettings().catch(() => null);

    return NextResponse.json({
      success: profile.success,
      isConfigured: await syria4GameProvider.hasLiveConfig(),
      balance: profile.balance ?? undefined,
      currency: profile.currency,
      userName: profile.userName,
      errorMessage: profile.error ? `${profile.error.code ? `[${profile.error.code}] ` : ''}${profile.error.message}` : undefined,
      lowBalance: Boolean(catalogSettings && profile.balance !== null && profile.balance < catalogSettings.lowBalanceThresholdUsd),
      config: {
        providerApiUrl: resolvedConfig.baseUrl,
        providerApiKey: resolvedConfig.apiToken ? `${resolvedConfig.apiToken.slice(0, 4)}...${resolvedConfig.apiToken.slice(-4)}` : '',
        providerApiType: resolvedConfig.apiType,
        providerApiSecret: resolvedConfig.apiSecret || '',
        providerEnabled: resolvedConfig.enabled,
        hasRealKey: Boolean(resolvedConfig.apiToken && resolvedConfig.apiToken.length > 5),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تەمىنلىگۈچى ئۇچۇرىنى تەكشۈرۈش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}

/** POST /api/admin/provider - Save new provider credentials and test connection immediately */
export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json(
        { success: false, message: 'باشقۇرغۇچى سالاھىيىتى دەلىللەنمىدى (Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { providerApiUrl, providerApiKey, providerApiType, providerApiSecret, providerEnabled } = body;

    const updates: any = {};
    if (providerApiUrl !== undefined) updates.providerApiUrl = String(providerApiUrl).trim();
    if (providerApiKey !== undefined) updates.providerApiKey = String(providerApiKey).trim();
    if (providerApiType !== undefined) updates.providerApiType = providerApiType;
    if (providerApiSecret !== undefined) updates.providerApiSecret = String(providerApiSecret).trim();
    if (providerEnabled !== undefined) updates.providerEnabled = Boolean(providerEnabled);

    // 1. Save settings to dedicated persistent store (.env.local + data/provider_config.json)
    saveStoredProviderConfig(updates);

    // 2. Also update database settings
    await updateSystemSettingsAsync(updates);

    // 2. Perform live check with the newly saved configuration
    const profile = await syria4GameProvider.getProfile();
    if (profile.success && profile.balance !== null) {
      await updateProviderSettings({ lastBalance: profile.balance, lastBalanceAt: new Date().toISOString() }).catch(() => {});
    }

    return NextResponse.json({
      success: profile.success,
      message: profile.success
        ? 'تەمىنلىگۈچى API مۇۋەپپەقىيەتلىك ئۇلاندى ھەم قالدۇق پۇل تەكشۈرۈلدى!'
        : `تەڭشەك ساقلاندى، لېكىن تەمىنلىگۈچى قايتۇرغان جاۋاب: [${profile.error?.code || 'خاتالىق'}] ${profile.error?.message || 'ئۇلىنىش مەغلۇپ بولدى'}`,
      balance: profile.balance,
      currency: profile.currency,
      userName: profile.userName,
      errorMessage: profile.error?.message,
      errorCode: profile.error?.code,
      raw: profile.raw,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تەڭشەكنى ساقلاش ياكى سىناش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
