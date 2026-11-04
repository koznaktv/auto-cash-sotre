import { NextResponse } from 'next/server';
import { createMaxStoreOrder, checkMaxStoreOrders } from '@/lib/providers/maxstoreProvider';

export const dynamic = 'force-dynamic';

function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, qty = 1, params = {} } = body;

    if (!product_id) {
      return NextResponse.json(
        { ok: false, error: 'product_id كىرگۈزۈلمىدى (Product ID is required)' },
        { status: 400 }
      );
    }

    const order_uuid = body.order_uuid || generateUUIDv4();

    const orderRes = await createMaxStoreOrder({
      product_id: Number(product_id),
      qty: Number(qty) || 1,
      order_uuid,
      params,
    });

    if (orderRes.status === 'ERROR' || !orderRes.data) {
      return NextResponse.json({
        ok: false,
        error: orderRes.error || orderRes.detail?.message || 'زاكاز ئەۋەتىش مەغلۇپ بولدى',
        detail: orderRes.detail,
      });
    }

    const orderData = orderRes.data;
    const providerStatus = (orderData?.status || '').toLowerCase();
    if (['completed', 'success', 'done', 'delivered'].includes(providerStatus)) {
      try {
        const { postOrderCompletedToChannel } = await import('@/lib/telegram');
        const targetAcc = params?.player_id || params?.phone || params?.account || params?.id || Object.values(params)[0] || '';
        postOrderCompletedToChannel({
          id: order_uuid || String(orderData?.order_id),
          serviceName: body.product_name || 'MaxStore مەھسۇلاتى',
          packageTitle: body.package_name || (body.product_id ? `Product #${body.product_id}` : ''),
          amount: body.price || orderData?.price || 0,
          targetAccount: String(targetAcc),
          userName: body.user_name || body.identity || 'MaxStore خېرىدارى',
          details: {
            store: 'MaxStore',
            provider: 'maxstore',
            product_id,
            qty,
            ...orderData,
          },
        }).catch(() => null);
      } catch (e: any) {
        console.warn('[MaxStore broadcast error]:', e?.message);
      }
    }

    return NextResponse.json({
      ok: true,
      data: orderRes.data,
      order_uuid,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderUuids = (searchParams.get('orders') || '').split(',').filter(Boolean);

    if (orderUuids.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const res = await checkMaxStoreOrders(orderUuids);

    if (res.ok && Array.isArray(res.data)) {
      try {
        const { postOrderCompletedToChannel } = await import('@/lib/telegram');
        for (const rawItem of res.data) {
          const item = rawItem as any;
          const itemStatus = (item.status || '').toLowerCase();
          if (['completed', 'success', 'done', 'delivered', 'accept'].includes(itemStatus)) {
            const targetAcc = item.data?.player_id || item.data?.phone || item.data?.account || item.params?.player_id || '';
            postOrderCompletedToChannel({
              id: item.order_uuid || String(item.order_id),
              serviceName: item.product_name || 'MaxStore مەھسۇلاتى',
              packageTitle: `Order #${item.order_id}`,
              amount: item.price || 0,
              targetAccount: String(targetAcc),
              userName: 'MaxStore خېرىدارى',
              details: {
                store: 'MaxStore',
                provider: 'maxstore',
                ...item,
              },
            }).catch(() => null);
          }
        }
      } catch (e: any) {}
    }

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
