import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { syria4GameProvider } from '@/lib/providers/syria4game';

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

    if (action === 'products') {
      const productsRes = await syria4GameProvider.getProducts();
      return NextResponse.json(productsRes);
    }

    // Default: Check wholesale balance & connection status
    const balanceRes = await syria4GameProvider.checkProfileBalance();
    return NextResponse.json({
      success: balanceRes.success,
      isConfigured: syria4GameProvider.hasLiveToken(),
      balance: balanceRes.balance,
      currency: balanceRes.currency,
      userName: balanceRes.userName,
      errorMessage: balanceRes.errorMessage,
      raw: balanceRes.raw,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تەمىنلىگۈچى ئۇچۇرىنى تەكشۈرۈش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
