import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { resetAdminStatsAsync } from '@/lib/db';

export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { resetDeposits = true, resetOrders = true, resetUserBalances = false } = body;

    const result = await resetAdminStatsAsync({
      resetDeposits,
      resetOrders,
      resetUserBalances,
    });

    return NextResponse.json({
      success: true,
      message: 'بارلىق سىتاتىستىكا ۋە خاتىرىلەر مۇۋەپپەقىيەتلىك نۆلگە قايتۇرۇلدى',
      result,
    });
  } catch (err: any) {
    console.error('Error resetting admin stats:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'سىتاتىستىكىنى نۆللەش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
