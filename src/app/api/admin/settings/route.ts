import { NextResponse } from 'next/server';
import { getSystemSettingsAsync, updateSystemSettingsAsync } from '@/lib/db';
import { verifyAdminToken, PUBLIC_DEFAULT_PIN } from '@/lib/adminAuth';
import { checkTsaStatus, getShamcashBalance } from '@/lib/providers/tsaShamcash';

export async function GET(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const settings = await getSystemSettingsAsync();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'تەڭشەكلەرنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    const {
      adminPin,
      shamcashAddress,
      whatsappNumber,
      telegramUsername,
      siteName,
      providerApiUrl,
      providerApiKey,
      providerApiType,
      providerApiSecret,
      providerEnabled,
      tsaApiKey,
      tsaAutoDepositEnabled,
      shamcashExchangeRate,
    } = body;

    const updates: any = {};
    if (adminPin) {
      const pin = String(adminPin).trim();
      if (pin.length < 8 || pin === PUBLIC_DEFAULT_PIN) {
        return NextResponse.json(
          { success: false, message: 'يېڭى PIN كەم دېگەندە 8 ھەرپ بولۇشى ۋە دەسلەپكى PIN بولماسلىقى كېرەك' },
          { status: 400 }
        );
      }
      updates.adminPin = pin;
    }
    if (shamcashAddress !== undefined) updates.shamcashAddress = String(shamcashAddress).trim();
    if (whatsappNumber !== undefined) updates.whatsappNumber = String(whatsappNumber).trim();
    if (telegramUsername !== undefined) updates.telegramUsername = String(telegramUsername).trim();
    if (siteName !== undefined) updates.siteName = String(siteName).trim();

    if (providerApiUrl !== undefined && String(providerApiUrl).trim() !== '') {
      updates.providerApiUrl = String(providerApiUrl).trim();
    }
    if (providerApiKey !== undefined && String(providerApiKey).trim() !== '') {
      updates.providerApiKey = String(providerApiKey).trim();
    }
    if (providerApiType !== undefined) updates.providerApiType = providerApiType;
    if (providerApiSecret !== undefined) updates.providerApiSecret = String(providerApiSecret).trim();
    if (providerEnabled !== undefined) updates.providerEnabled = Boolean(providerEnabled);

    // TSA API Shamcash settings
    if (tsaApiKey !== undefined) updates.tsaApiKey = String(tsaApiKey).trim();
    if (tsaAutoDepositEnabled !== undefined) updates.tsaAutoDepositEnabled = Boolean(tsaAutoDepositEnabled);
    if (shamcashExchangeRate !== undefined) {
      const rate = Number(shamcashExchangeRate);
      if (Number.isFinite(rate) && rate > 0) {
        updates.shamcashExchangeRate = rate;
      }
    }

    if (updates.providerApiUrl || updates.providerApiKey) {
      const { saveStoredProviderConfig } = await import('@/lib/provider/providerConfigStore');
      saveStoredProviderConfig(updates);
    }

    const updatedSettings = await updateSystemSettingsAsync(updates);
    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'تەڭشەكلەرنى ئۆزگەرتىش مەغلۇپ بولدى' }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings:
 * Action dispatcher for admin settings operations, e.g. testing TSA API connection and fetching wallet balance.
 */
export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action;

    if (action === 'test-tsa') {
      const apiKey = body.apiKey ? String(body.apiKey).trim() : undefined;
      const accountAddress = body.accountAddress ? String(body.accountAddress).trim() : undefined;

      const currentSettings = await getSystemSettingsAsync();
      const testKey = apiKey || currentSettings.tsaApiKey || process.env.TSA_API_KEY || '';
      const testAddress = accountAddress || currentSettings.shamcashAddress || process.env.SHAMCASH_ADDRESS || '';

      if (!testKey) {
        return NextResponse.json(
          { success: false, message: 'TSA API ئاچقۇچى كىرگۈزۈلمىگەن' },
          { status: 400 }
        );
      }

      // Check TSA API status
      const statusRes = await checkTsaStatus(testKey);
      if (!statusRes.ok) {
        return NextResponse.json({
          success: false,
          message: statusRes.message || 'TSA API دەلىللەنمىدى',
        });
      }

      // If address provided, fetch Sham Cash balance
      let balanceData: any = null;
      if (testAddress) {
        const balRes = await getShamcashBalance(testKey, testAddress);
        if (balRes.success) {
          balanceData = balRes.balances;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'TSA API مۇۋەپپەقىيەتلىك ئۇلاندى!',
        balances: balanceData,
        accountAddress: testAddress,
      });
    }

    return NextResponse.json({ success: false, message: 'نامەلۇم مەشغۇلات' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'خاتالىق كۆرۈلدى' }, { status: 500 });
  }
}
