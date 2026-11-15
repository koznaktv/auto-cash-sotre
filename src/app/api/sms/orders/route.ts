import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getOrdersByUserIdAsync } from '@/lib/db';
import { findOrCreateDbUserForIdentity } from '@/lib/appWallets';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    let user: any = null;
    try {
      user = await getSessionUser(req);
    } catch {}

    const { searchParams } = new URL(req.url);
    const identity = (searchParams.get('identity') || searchParams.get('userId') || '').trim().replace(/^@/, '');

    let targetUserId = user?.id;
    let targetUserEmail = user?.email;

    if (!targetUserId && identity) {
      const dbUser = await findOrCreateDbUserForIdentity(identity);
      if (dbUser) {
        targetUserId = dbUser.id;
        targetUserEmail = dbUser.email;
      } else {
        targetUserEmail = identity;
      }
    }

    if (!targetUserId && !targetUserEmail) {
      return NextResponse.json({ success: true, count: 0, orders: [] });
    }

    const orders = await getOrdersByUserIdAsync(targetUserId || '', targetUserEmail || '');
    const smsOrders = orders
      .filter((o) => o.details?.isSmsActivation || o.serviceId.startsWith('sms_'))
      .map((o) => ({
        id: o.id,
        phone: o.details?.phone || o.targetAccount,
        activationId: o.details?.activationId,
        serviceName: o.details?.serviceName || o.serviceName,
        serviceCode: o.details?.serviceCode,
        countryName: o.details?.countryName,
        countryId: o.details?.countryId,
        price: o.amount,
        status: o.status,
        code: o.details?.code || null,
        createdAt: o.createdAt,
        expiresAt: o.details?.expiresAt,
      }));

    return NextResponse.json({ success: true, count: smsOrders.length, orders: smsOrders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'تارىخنى يۈكلەش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
