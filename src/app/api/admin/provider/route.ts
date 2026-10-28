import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { othmanStoreProvider } from '@/lib/providers/syria4game';
import { listProviderCalls } from '@/lib/provider/callLog';
import { getProviderSettings, updateProviderSettings } from '@/lib/catalog/store';
import { updateSystemSettingsAsync } from '@/lib/db';
import { saveStoredProviderConfig, loadStoredProviderConfig } from '@/lib/provider/providerConfigStore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function fetchServerPublicIp(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json?.ip) return String(json.ip).trim();
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://icanhazip.com', { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (res.ok) {
      const text = await res.text().catch(() => '');
      if (text) return text.trim();
    }
  } catch {}

  return null;
}

/** ?action=balance (default) | ping | products | calls[&orderId=] | ip */
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

    if (action === 'ip') {
      const ip = await fetchServerPublicIp();
      return NextResponse.json({ success: true, ip: ip || 'ئېنىقلانمىدى' });
    }

    if (action === 'ping') {
      const ping = await othmanStoreProvider.ping();
      return NextResponse.json({ success: ping.success, errorMessage: ping.error?.message, raw: ping.raw });
    }

    if (action === 'products') {
      const productsRes = await othmanStoreProvider.getProducts();
      return NextResponse.json(productsRes);
    }

    if (action === 'calls') {
      const calls = await listProviderCalls({ orderId: searchParams.get('orderId') || undefined, limit: 50 });
      return NextResponse.json({ success: true, calls });
    }

    // Default: wholesale balance & connection status for Othman Store
    const force = searchParams.get('force') === '1' || searchParams.get('force') === 'true';
    const [resolvedConfig, profile, serverPublicIp, catalogSettings] = await Promise.all([
      othmanStoreProvider.getResolvedConfig(),
      othmanStoreProvider.getProfile(force),
      fetchServerPublicIp(),
      getProviderSettings().catch(() => null),
    ]);

    if (profile.success && profile.balance !== null) {
      await updateProviderSettings({ lastBalance: profile.balance, lastBalanceAt: new Date().toISOString() }).catch(() => {});
    }

    const effectiveBalance: number | undefined =
      profile.balance !== null && profile.balance !== undefined
        ? profile.balance
        : catalogSettings?.lastBalance !== undefined && catalogSettings.lastBalance !== null
        ? catalogSettings.lastBalance
        : undefined;

    const rawError = profile.error?.message || '';
    let friendlyError = rawError;
    const isRateLimited = /rate\s*limit/i.test(rawError);
    if (isRateLimited) {
      friendlyError = 'تەمىنلىگۈچى API نى زىيارەت قىلىش سۈرئىتى چەكلەندى (Rate Limit). 1 مىنۇتتىن كېيىن ئۆزلۈكىدىن ئەسلىگە كېلىدۇ.';
    } else if (/ip\s*(not\s*allowed|blocked|invalid|address)/i.test(rawError)) {
      friendlyError = `مۇلازىمېتىر IP سى (${serverPublicIp}) تەمىنلىگۈچىدە تېخى ئاق تىزىملىككە كىرگۈزۈلمىگەن`;
    }

    return NextResponse.json({
      activeProvider: 'othman',
      success: profile.success,
      isConfigured: await othmanStoreProvider.hasLiveConfig(),
      balance: effectiveBalance,
      isLiveBalance: profile.success,
      isRateLimited,
      lastBalanceAt: catalogSettings?.lastBalanceAt,
      currency: profile.currency || 'USD',
      userName: profile.userName || 'Othman Store',
      serverPublicIp: serverPublicIp || 'ئېنىقلانمىدى',
      isIpBlocked: Boolean(profile.error?.kind === 'ip'),
      errorMessage: friendlyError,
      lowBalance: Boolean(catalogSettings && effectiveBalance !== undefined && effectiveBalance < catalogSettings.lowBalanceThresholdUsd),
      config: {
        providerApiUrl: resolvedConfig.baseUrl,
        providerApiKey: resolvedConfig.apiToken ? `${resolvedConfig.apiToken.slice(0, 4)}...${resolvedConfig.apiToken.slice(-4)}` : '',
        providerApiType: resolvedConfig.apiType,
        providerApiSecret: resolvedConfig.apiSecret || '',
        providerEnabled: resolvedConfig.enabled,
        hasRealKey: Boolean(resolvedConfig.apiToken && resolvedConfig.apiToken.length > 5),
      },
      othman: {
        success: profile.success,
        balance: effectiveBalance,
        currency: profile.currency || 'USD',
        userName: profile.userName || 'Othman Store',
        errorMessage: friendlyError,
        isRateLimited,
        config: {
          apiUrl: resolvedConfig.baseUrl,
          apiKey: resolvedConfig.apiToken ? `${resolvedConfig.apiToken.slice(0, 4)}...${resolvedConfig.apiToken.slice(-4)}` : '',
          enabled: resolvedConfig.enabled,
          hasRealKey: Boolean(resolvedConfig.apiToken && resolvedConfig.apiToken.length > 5),
        },
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
    const { providerApiUrl, providerApiKey, providerApiType, providerApiSecret, providerEnabled, othmanApiUrl, othmanApiKey } = body;

    const targetUrl = String(othmanApiUrl || providerApiUrl || 'https://api.othman-storee.com').trim();
    const targetKey = String(othmanApiKey || providerApiKey || '').trim();

    const updates: any = {
      activeProvider: 'othman',
      providerApiUrl: targetUrl,
      othmanApiUrl: targetUrl,
      providerApiType: providerApiType || 'syria4game',
      othmanApiType: 'syria4game',
      providerApiSecret: providerApiSecret ? String(providerApiSecret).trim() : '',
      providerEnabled: providerEnabled !== undefined ? Boolean(providerEnabled) : true,
      othmanEnabled: true,
    };

    if (targetKey) {
      updates.providerApiKey = targetKey;
      updates.othmanApiKey = targetKey;
    }

    // 1. Save settings to dedicated persistent store (.env.local + data/provider_config.json)
    saveStoredProviderConfig(updates);

    // 2. Also update database settings
    await updateSystemSettingsAsync(updates);

    // 3. Perform live check with the newly saved configuration
    const [profile, serverPublicIp] = await Promise.all([
      othmanStoreProvider.getProfile(),
      fetchServerPublicIp(),
    ]);

    if (profile.success && profile.balance !== null) {
      await updateProviderSettings({ lastBalance: profile.balance, lastBalanceAt: new Date().toISOString() }).catch(() => {});
    }

    const feedbackMsg = profile.success
      ? 'Othman Store API مۇۋەپپەقىيەتلىك ئۇلاندى ھەم قالدۇق پۇل تەكشۈرۈلدى!'
      : `تەڭشەك ساقلاندى، لېكىن Othman Store قايتۇرغان جاۋاب: [${profile.error?.code || 'خاتالىق'}] ${profile.error?.message || 'ئۇلىنىش مەغلۇپ بولدى'}`;

    return NextResponse.json({
      success: profile.success,
      message: feedbackMsg,
      balance: profile.balance,
      currency: profile.currency,
      userName: profile.userName || 'Othman Store',
      serverPublicIp: serverPublicIp || 'ئېنىقلانمىدى',
      isIpBlocked: false,
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
