import { NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/apiKeyAuth';
import { getOrderByIdAsync, getOrdersByUserIdAsync } from '@/lib/db';
import { pollProviderOrders } from '@/lib/provider/orderPoller';
import { toBuyerOrder } from '@/lib/orders';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { user, errorResponse } = await authenticateApiKey(req);
  if (errorResponse) return errorResponse;
  if (!user) {
    return NextResponse.json({ success: false, message: 'ئىناۋەتسىز API كۇنۇپكىسى' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId') || url.searchParams.get('id');
    const ordersParam = url.searchParams.get('orders');

    const requestedIds: string[] = [];
    if (orderId) requestedIds.push(orderId.trim());
    if (ordersParam) {
      ordersParam.split(',').forEach((id) => {
        const clean = id.trim();
        if (clean && !requestedIds.includes(clean)) requestedIds.push(clean);
      });
    }

    if (requestedIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_ORDER_ID',
          message: 'زاكاز نومۇرى تەمىنلەنمىدى. ?orderId=ORD-xxx ياكى ?orders=ORD-1,ORD-2 پارامېتىرىنى تەمىنلەڭ.',
        },
        { status: 400 }
      );
    }

    // Limit check to 25 orders at a time
    const limitedIds = requestedIds.slice(0, 25);

    // Opportunistically poll provider for orders that are still in progress
    await pollProviderOrders({
      deadlineMs: Date.now() + 4000,
      limit: limitedIds.length,
      orderIds: limitedIds,
      force: true,
    }).catch(() => null);

    const results = await Promise.all(
      limitedIds.map(async (id) => {
        const order = await getOrderByIdAsync(id);
        if (!order) return { id, found: false, error: 'NOT_FOUND' };
        // Ensure this user owns the order
        if (order.userId !== user.id && order.userEmail?.toLowerCase() !== user.email.toLowerCase()) {
          return { id, found: false, error: 'ACCESS_DENIED' };
        }
        return {
          found: true,
          ...toBuyerOrder(order),
        };
      })
    );

    if (requestedIds.length === 1) {
      const single = results[0];
      if (!single.found) {
        return NextResponse.json(
          { success: false, error: single.error, message: 'زاكاز تېپىلمىدى ياكى ئىجازىتىڭىز يوق' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, order: single });
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      orders: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'زاكاز ئەھۋالىنى تەكشۈرۈشتە خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { user, errorResponse } = await authenticateApiKey(req);
  if (errorResponse) return errorResponse;
  if (!user) {
    return NextResponse.json({ success: false, message: 'ئىناۋەتسىز API كۇنۇپكىسى' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    let requestedIds: string[] = [];

    if (typeof body.orderId === 'string') requestedIds.push(body.orderId.trim());
    if (typeof body.id === 'string') requestedIds.push(body.id.trim());
    if (Array.isArray(body.orders)) {
      body.orders.forEach((id: any) => {
        if (typeof id === 'string' && id.trim()) requestedIds.push(id.trim());
      });
    }

    if (requestedIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_ORDER_ID',
          message: 'زاكاز نومۇرى تەمىنلەنمىدى. JSON گە { "orderId": "ORD-xxx" } ياكى { "orders": ["ORD-1"] } كىرگۈزۈڭ.',
        },
        { status: 400 }
      );
    }

    const limitedIds = requestedIds.slice(0, 25);

    await pollProviderOrders({
      deadlineMs: Date.now() + 4000,
      limit: limitedIds.length,
      orderIds: limitedIds,
      force: true,
    }).catch(() => null);

    const results = await Promise.all(
      limitedIds.map(async (id) => {
        const order = await getOrderByIdAsync(id);
        if (!order) return { id, found: false, error: 'NOT_FOUND' };
        if (order.userId !== user.id && order.userEmail?.toLowerCase() !== user.email.toLowerCase()) {
          return { id, found: false, error: 'ACCESS_DENIED' };
        }
        return {
          found: true,
          ...toBuyerOrder(order),
        };
      })
    );

    if (requestedIds.length === 1) {
      const single = results[0];
      if (!single.found) {
        return NextResponse.json(
          { success: false, error: single.error, message: 'زاكاز تېپىلمىدى ياكى ئىجازىتىڭىز يوق' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, order: single });
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      orders: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'زاكاز ئەھۋالىنى تەكشۈرۈشتە خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}
