import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminBearer } from '@/lib/adminAuth';
import {
  getAllWifiCardsAsync,
  getWifiStockSummaryAsync,
  bulkAddWifiCardsAsync,
  deleteWifiCardAsync,
  bulkDeleteWifiCardsAsync,
  clearAvailableWifiCardsByPackageAsync,
  invalidateWifiCardsCache,
} from '@/lib/wifiInventoryDb';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!verifyAdminToken(req) && !hasAdminBearer(req)) {
    return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
  }

  try {
    const cards = await getAllWifiCardsAsync();
    const stockSummary = await getWifiStockSummaryAsync();
    return NextResponse.json(
      {
        success: true,
        cards,
        stockSummary,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!verifyAdminToken(req) && !hasAdminBearer(req)) {
    return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { serviceId, serviceName, packageId, packageTitle, rawText } = body;

    if (!serviceId || !packageId || !rawText) {
      return NextResponse.json(
        { success: false, message: 'تولۇق ئۇچۇر كىرگۈزۈلمىدى (serviceId, packageId, rawText تەلەپ قىلىنىدۇ)' },
        { status: 400 }
      );
    }

    const result = await bulkAddWifiCardsAsync({
      serviceId,
      serviceName: serviceName || (serviceId === 'fursan_net' ? 'شبكة الفرسان' : 'شبكة عزيز نت'),
      packageId,
      packageTitle: packageTitle || packageId,
      rawText,
    });
    invalidateWifiCardsCache();

    return NextResponse.json({
      success: true,
      addedCount: result.addedCount,
      errors: result.errors,
      message: `مۇۋەپپەقىيەتلىك ھالدا ${result.addedCount} تال كارتا ئامبارغا قوشۇلدى!`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!verifyAdminToken(req) && !hasAdminBearer(req)) {
    return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const cardId = url.searchParams.get('id');
    const idsParam = url.searchParams.get('ids');
    const clearPackage = url.searchParams.get('clearPackage');

    // 1. Clear package available stock
    if (clearPackage === '1') {
      const serviceId = url.searchParams.get('serviceId');
      const packageId = url.searchParams.get('packageId');
      if (!serviceId || !packageId) {
        return NextResponse.json({ success: false, message: 'serviceId ۋە packageId كىرگۈزۈلمىدى' }, { status: 400 });
      }
      const count = await clearAvailableWifiCardsByPackageAsync({ serviceId, packageId });
      invalidateWifiCardsCache();
      return NextResponse.json({ success: true, count, message: `مۇۋەپپەقىيەتلىك ھالدا بۇ بولاقتىكى ${count} تال سېتىلمىغان كارتا ئۆچۈرۈلدى` });
    }

    // 2. Batch delete via query or JSON body
    let targetIds: string[] = [];
    if (idsParam) {
      targetIds = idsParam.split(',').filter(Boolean);
    } else {
      try {
        const body = await req.json().catch(() => null);
        if (body && Array.isArray(body.ids)) {
          targetIds = body.ids;
        }
      } catch {}
    }

    if (targetIds.length > 0) {
      const count = await bulkDeleteWifiCardsAsync(targetIds);
      invalidateWifiCardsCache();
      return NextResponse.json({ success: true, count, message: `مۇۋەپپەقىيەتلىك ھالدا ${count} تال كارتا ئامباردىن تولۇق ئۆچۈرۈلدى` });
    }

    // 3. Single delete
    if (!cardId) {
      return NextResponse.json({ success: false, message: 'كارتا ID نومۇرى كىرگۈزۈلمىدى' }, { status: 400 });
    }

    await deleteWifiCardAsync(cardId);
    invalidateWifiCardsCache();
    return NextResponse.json({ success: true, message: 'كارتا ئامباردىن دەرھال ئۆچۈرۈلدى' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
