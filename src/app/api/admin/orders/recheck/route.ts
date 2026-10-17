import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getOrderByIdAsync } from '@/lib/db';
import { pollProviderOrders } from '@/lib/provider/orderPoller';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Asks the provider for one order's status now, ignoring the polling backoff. */
export async function POST(req: Request) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
  }
  try {
    const { orderId } = await req.json();
    if (typeof orderId !== 'string') {
      return NextResponse.json({ success: false, message: 'زاكاز نومۇرى كەم' }, { status: 400 });
    }
    const summary = await pollProviderOrders({ deadlineMs: Date.now() + 30_000, orderIds: [orderId], force: true });
    if (summary.skipped) {
      return NextResponse.json({ success: false, message: 'تەكشۈرۈش ئاللىقاچان ئىجرا بولۇۋاتىدۇ، سەل تۇرۇپ قايتا سىناڭ' }, { status: 409 });
    }
    return NextResponse.json({ success: true, summary, order: await getOrderByIdAsync(orderId) });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'تەكشۈرۈش مەغلۇپ بولدى' }, { status: 500 });
  }
}
