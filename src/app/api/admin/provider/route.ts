import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { syria4GameProvider, sahlCashProvider, othmanStoreProvider } from '@/lib/providers/syria4game';
import { listProviderCalls } from '@/lib/provider/callLog';
import { getProviderSettings, updateProviderSettings } from '@/lib/catalog/store';
import { getSystemSettingsAsync, updateSystemSettingsAsync } from '@/lib/db';
import { saveStoredProviderConfig } from '@/lib/provider/providerConfigStore';

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
      const ping = await syria4GameProvider.ping();
      return NextResponse.json({ success: ping.success, errorMessage: ping.error?.message, raw: ping.raw });
    }

    if (action === 'products') {
      const providerParam = searchParams.get('provider');
      if (providerParam === 'othman') {
        const productsRes = await othmanStoreProvider.getProducts();
        return NextResponse.json(productsRes);
      }
      if (providerParam === 'all') {
        const [sahlRes, othmanRes] = await Promise.all([
          syria4GameProvider.getProducts(),
          othmanStoreProvider.getProducts(),
        ]);
        const sahlProds = (sahlRes.success && Array.isArray(sahlRes.products))
          ? sahlRes.products.map((p: any) => ({ ...p, providerKey: 'sahl' }))
          : [];
        const othmanProds = (othmanRes.success && Array.isArray(othmanRes.products))
          ? othmanRes.products.map((p: any) => ({ ...p, providerKey: 'othman' }))
          : [];
        return NextResponse.json({
          success: true,
          products: [...sahlProds, ...othmanProds],
          sahlCount: sahlProds.length,
          othmanCount: othmanProds.length,
        });
      }
      const productsRes = await syria4GameProvider.getProducts();
      return NextResponse.json(productsRes);
    }

    if (action === 'calls') {
      const calls = await listProviderCalls({ orderId: searchParams.get('orderId') || undefined, limit: 50 });
      return NextResponse.json({ success: true, calls });
    }

    // Default: wholesale balance & connection status + current provider config
    const [resolvedConfig, profile, othmanConfig, othmanProfile, serverPublicIp, catalogSettings] = await Promise.all([
      syria4GameProvider.getResolvedConfig(),
      syria4GameProvider.getProfile(),
      othmanStoreProvider.getResolvedConfig(),
      othmanStoreProvider.getProfile(),
      fetchServerPublicIp(),
      getProviderSettings().catch(() => null),
    ]);

    if (profile.success && profile.balance !== null) {
      await updateProviderSettings({ lastBalance: profile.balance, lastBalanceAt: new Date().toISOString() }).catch(() => {});
    }

    const isIpBlocked = Boolean(
      profile.error &&
      (profile.error.kind === 'ip' ||
        profile.error.code === 123 ||
        /ip/i.test(profile.error.message || ''))
    );

    let formattedError = profile.error
      ? `${profile.error.code ? `[${profile.error.code}] ` : ''}${profile.error.message}`
      : undefined;

    if (isIpBlocked) {
      formattedError = `[123] IP ئادرېسى چەكلەندى (IP not allowed). سىزنىڭ نۆۋەتتىكى ئاممىۋى IP ئادرېسىڭىز: ${serverPublicIp || 'ئېنىقلانمىدى'}`;
    }

    const effectiveBalance: number | undefined =
      profile.balance !== null && profile.balance !== undefined
        ? profile.balance
        : catalogSettings?.lastBalance !== undefined && catalogSettings.lastBalance !== null
        ? catalogSettings.lastBalance
        : undefined;

    return NextResponse.json({
      success: profile.success,
      isConfigured: await syria4GameProvider.hasLiveConfig(),
      balance: effectiveBalance,
      isLiveBalance: profile.success,
      lastBalanceAt: catalogSettings?.lastBalanceAt,
      currency: profile.currency,
      userName: profile.userName,
      serverPublicIp: serverPublicIp || 'ئېنىقلانمىدى',
      isIpBlocked,
      errorMessage: formattedError,
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
        success: othmanProfile.success,
        balance: othmanProfile.balance,
        currency: othmanProfile.currency,
        userName: othmanProfile.userName,
        errorMessage: othmanProfile.error?.message,
        config: {
          apiUrl: othmanConfig.baseUrl,
          apiKey: othmanConfig.apiToken ? `${othmanConfig.apiToken.slice(0, 4)}...${othmanConfig.apiToken.slice(-4)}` : '',
          enabled: othmanConfig.enabled,
          hasRealKey: Boolean(othmanConfig.apiToken && othmanConfig.apiToken.length > 5),
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
    const { providerApiUrl, providerApiKey, providerApiType, providerApiSecret, providerEnabled, othmanApiUrl, othmanApiKey, othmanApiType, othmanApiSecret, othmanEnabled } = body;

    const updates: any = {};
    if (providerApiUrl !== undefined) updates.providerApiUrl = String(providerApiUrl).trim();
    if (providerApiKey !== undefined) updates.providerApiKey = String(providerApiKey).trim();
    if (providerApiType !== undefined) updates.providerApiType = providerApiType;
    if (providerApiSecret !== undefined) updates.providerApiSecret = String(providerApiSecret).trim();
    if (providerEnabled !== undefined) updates.providerEnabled = Boolean(providerEnabled);

    if (othmanApiUrl !== undefined) updates.othmanApiUrl = String(othmanApiUrl).trim();
    if (othmanApiKey !== undefined) updates.othmanApiKey = String(othmanApiKey).trim();
    if (othmanApiType !== undefined) updates.othmanApiType = othmanApiType;
    if (othmanApiSecret !== undefined) updates.othmanApiSecret = String(othmanApiSecret).trim();
    if (othmanEnabled !== undefined) updates.othmanEnabled = Boolean(othmanEnabled);

    // 1. Save settings to dedicated persistent store (.env.local + data/provider_config.json)
    saveStoredProviderConfig(updates);

    // 2. Also update database settings
    await updateSystemSettingsAsync(updates);

    // 3. Perform live check with the newly saved configuration
    const [profile, serverPublicIp] = await Promise.all([
      syria4GameProvider.getProfile(),
      fetchServerPublicIp(),
    ]);

    if (profile.success && profile.balance !== null) {
      await updateProviderSettings({ lastBalance: profile.balance, lastBalanceAt: new Date().toISOString() }).catch(() => {});
    }

    const isIpBlocked = Boolean(
      profile.error &&
      (profile.error.kind === 'ip' ||
        profile.error.code === 123 ||
        /ip/i.test(profile.error.message || ''))
    );

    let feedbackMsg = profile.success
      ? 'تەمىنلىگۈچى API مۇۋەپپەقىيەتلىك ئۇلاندى ھەم قالدۇق پۇل تەكشۈرۈلدى!'
      : `تەڭشەك ساقلاندى، لېكىن تەمىنلىگۈچى قايتۇرغان جاۋاب: [${profile.error?.code || 'خاتالىق'}] ${profile.error?.message || 'ئۇلىنىش مەغلۇپ بولدى'}`;

    if (isIpBlocked) {
      feedbackMsg = `تەڭشەك ساقلاندى، لېكىن Sahl Cash IP ئادرېسىڭىزنى توسۇۋالدى [123: IP not allowed]. نۆۋەتتىكى مۇلازىمېتىر ئاممىۋى IP ئادرېسىڭىز: ${serverPublicIp || 'ئېنىقلانمىدى'}`;
    }

    return NextResponse.json({
      success: profile.success,
      message: feedbackMsg,
      balance: profile.balance,
      currency: profile.currency,
      userName: profile.userName,
      serverPublicIp: serverPublicIp || 'ئېنىقلانمىدى',
      isIpBlocked,
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
