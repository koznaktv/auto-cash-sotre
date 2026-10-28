import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { smsProvider } from '@/lib/providers/smsProvider';
import { loadStoredProviderConfig, saveStoredProviderConfig } from '@/lib/provider/providerConfigStore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sms-provider
 * Returns current SMS provider credentials status and live wholesale balance
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
    const action = searchParams.get('action') || 'status';

    const config = await smsProvider.getConfig();
    const profile = await smsProvider.getProfile();

    const maskedKey = config.apiKey
      ? (config.apiKey.length > 8 ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}` : '••••••••')
      : '';

    return NextResponse.json({
      success: profile.success,
      balance: profile.balance,
      currency: profile.currency,
      userName: profile.userName,
      error: profile.error,
      config: {
        type: config.type,
        baseUrl: config.baseUrl,
        apiKey: maskedKey,
        enabled: config.enabled,
        hasRealKey: Boolean(config.apiKey && config.apiKey.length >= 4),
      },
      raw: profile.raw,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'مەۋھۇم نومۇر API سىنى تەكشۈرۈش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sms-provider
 * Saves new SMS provider credentials persistently and verifies live balance
 */
export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json(
        { success: false, message: 'باشقۇرغۇچى سالاھىيىتى دەلىللەنمىدى (Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await req.json();
    let { smsProviderType, smsApiUrl, smsApiKey, smsEnabled } = body;

    const updates: any = {};
    if (smsApiUrl !== undefined) {
      let cleanUrl = String(smsApiUrl).trim();
      if (cleanUrl.includes('phonecash.sy')) {
        smsProviderType = 'phonecash';
        if (!cleanUrl.endsWith('.php')) {
          cleanUrl = cleanUrl.replace(/\/+$/, '') + '/api.php';
        }
      }
      updates.smsApiUrl = cleanUrl;
    }

    if (smsProviderType !== undefined) updates.smsProviderType = smsProviderType;
    if (smsApiKey !== undefined && String(smsApiKey).trim().length > 0) {
      updates.smsApiKey = String(smsApiKey).trim();
    }
    if (smsEnabled !== undefined) updates.smsEnabled = Boolean(smsEnabled);

    // 1. Save persistently to file & memory
    saveStoredProviderConfig(updates);

    // 2. Test live connection immediately with new settings
    const profile = await smsProvider.getProfile();

    return NextResponse.json({
      success: profile.success,
      message: profile.success
        ? 'مەۋھۇم نومۇر API سى مۇۋەپپەقىيەتلىك ئۇلاندى ھەم قالدۇق پۇل تەكشۈرۈلدى!'
        : `تەڭشەك ساقلاندى، لېكىن تەمىنلىگۈچى قايتۇرغان جاۋاب: ${profile.error || 'ئۇلىنىش مەغلۇپ بولدى'}`,
      balance: profile.balance,
      currency: profile.currency,
      userName: profile.userName,
      error: profile.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تەڭشەكنى ساقلاش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
