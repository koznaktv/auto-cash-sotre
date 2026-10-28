import { NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import { getOrdersByUserIdAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const orders = await getOrdersByUserIdAsync(user.id, user.email);
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
