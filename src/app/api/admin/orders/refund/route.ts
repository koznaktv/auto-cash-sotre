import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getOrderByIdAsync, refundOrderBalanceAtomicAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Refunds an order to the buyer's wallet. Completed orders need `force: true` (the admin
 * confirmed the goods weren't delivered); refunded/cancelled orders can't be refunded again.
 */
export async function POST(req: Request) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
  }
  try {
    const { orderId, reason, force } = await req.json();
    if (typeof orderId !== 'string') {
      return NextResponse.json({ success: false, message: 'زاكاز نومۇرى كەم' }, { status: 400 });
    }
    const result = await refundOrderBalanceAtomicAsync(
      orderId,
      typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 200) : 'باشقۇرغۇچى پۇل قايتۇردى',
      force === true
    );
    if (!result.success) {
      const message =
        result.message === 'ORDER_NOT_REFUNDABLE'
          ? 'تاماملانغان زاكاز: پۇل قايتۇرۇش ئۈچۈن جەزملەشتۈرۈڭ (force)'
          : result.message || 'پۇل قايتۇرۇلمىدى';
      return NextResponse.json({ success: false, message, needsForce: result.message === 'ORDER_NOT_REFUNDABLE' }, { status: 409 });
    }
    return NextResponse.json({ success: true, newBalance: result.newBalance, order: await getOrderByIdAsync(orderId) });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'پۇل قايتۇرۇلمىدى' }, { status: 500 });
  }
}
