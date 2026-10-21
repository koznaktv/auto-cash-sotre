import { NextResponse } from 'next/server';
import {
  getAllOrdersAsync,
  getOrdersByUserIdAsync,
  updateOrderStatusAsync,
  deductBalanceAndCreateOrderAtomicAsync,
  transitionOrderAsync,
  randomId,
  OrderRecord,
  ORDER_STATUSES,
} from '@/lib/db';
import { getServicesList } from '@/lib/servicesDb';
import { verifyAdminToken, hasAdminBearer } from '@/lib/adminAuth';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import { validateGameAccount } from '@/lib/validation/gameAccountValidator';
import { isOrderInProgress, toBuyerOrder } from '@/lib/orders';
import { getProviderSettings } from '@/lib/catalog/store';
import { SERVICE_PREFIX } from '@/lib/catalog/storefront';
import { placeProviderOrder } from '@/lib/provider/purchase';
import { pollProviderOrders } from '@/lib/provider/orderPoller';
import { generateUUIDv4, syria4GameProvider } from '@/lib/providers/syria4game';
import { notifyNewOrder } from '@/lib/telegram';

// Provider calls (live price check + newOrder) can take a while
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    if (hasAdminBearer(req)) {
      return NextResponse.json({ success: true, orders: await getAllOrdersAsync() });
    }

    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    let orders = await getOrdersByUserIdAsync(user.id, user.email);

    // Opportunistic status refresh for this buyer's in-flight provider orders (cron may be infrequent)
    if (orders.some((o) => isOrderInProgress(o.status) && o.details?.providerProductId)) {
      const summary = await pollProviderOrders({ deadlineMs: Date.now() + 4000, limit: 5, onlyUserId: user.id }).catch(() => null);
      if (summary && summary.checked > 0) orders = await getOrdersByUserIdAsync(user.id, user.email);
    }

    return NextResponse.json({ success: true, orders: orders.map(toBuyerOrder) });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'زاكازلارنى ئېلىشتا خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // The buyer is the session owner, never the request body
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'سېتىۋېلىش ئۈچۈن ئالدى بىلەن ھېساباتىڭىزغا كىرىشىڭىز كېرەك. (Gmail ئارقىلىق كىرىڭ)',
        },
        { status: 401 }
      );
    }

    const rawIdempotencyKey = req.headers.get('x-idempotency-key') || '';
    const idempotencyKey = /^[A-Za-z0-9_-]{8,100}$/.test(rawIdempotencyKey) ? rawIdempotencyKey : '';
    const body = await req.json();
    const { serviceId, packageId, targetAccount, fields, qty, expectedTotal } = body;

    if (typeof serviceId !== 'string' || typeof packageId !== 'string') {
      return NextResponse.json({ success: false, message: 'مۇلازىمەت تېپىلمىدى' }, { status: 404 });
    }

    // syria4game catalog products
    if (serviceId.startsWith(SERVICE_PREFIX)) {
      const result = await placeProviderOrder(user, {
        serviceId,
        packageId,
        fields: fields && typeof fields === 'object' ? fields : undefined,
        targetAccount: typeof targetAccount === 'string' ? targetAccount : undefined,
        qty,
        expectedTotal,
        idempotencyKey,
      });
      if (result.status === 200 || result.status === 202) {
        const orderData = (result.body as any)?.order;
        if (orderData) {
          notifyNewOrder({
            id: orderData.id || 'ORD',
            serviceName: orderData.serviceName || serviceId,
            packageTitle: orderData.packageTitle || packageId,
            amount: orderData.amount || expectedTotal || 0,
            userName: user.name,
            userEmail: user.email,
            targetAccount: typeof targetAccount === 'string' ? targetAccount : JSON.stringify(fields || {}),
            status: orderData.status || 'processing',
            fields: fields,
          }).catch(() => {});
        }
      }
      return NextResponse.json(result.body, { status: result.status });
    }

    // Storefront catalog service fulfillment
    if (false) {
      return NextResponse.json(
        { success: false, message: 'مەھسۇلات تىزىملىكى يېڭىلاندى، بەتنى يېڭىلاپ قايتا تاللاڭ' },
        { status: 410 }
      );
    }

    const service = getServicesList().find((s) => s.id === serviceId);
    if (!service) {
      return NextResponse.json({ success: false, message: 'مۇلازىمەت تېپىلمىدى' }, { status: 404 });
    }
    const pkg = service.packages.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, message: 'تاللانغان تۈر تېپىلمىدى' }, { status: 404 });
    }
    const price = Number(pkg.price);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ success: false, message: 'مەھسۇلات باھاسى خاتا' }, { status: 400 });
    }

    const rawTarget = typeof targetAccount === 'string' ? targetAccount.trim().slice(0, 200) : '';
    let parsedGameAccount: { userId: string; zoneId?: string } = { userId: rawTarget };
    if (service.category === 'games' || service.inputLabel) {
      const validation = validateGameAccount(service.id, rawTarget);
      if (!validation.isValid) {
        return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
      }
      parsedGameAccount = validation.parsed;
    }

    const atomicRes = await deductBalanceAndCreateOrderAtomicAsync({
      idempotencyKey,
      userId: user.id,
      userEmail: user.email,
      serviceId: service.id,
      serviceName: service.name,
      packageTitle: pkg.title,
      amount: price,
      targetAccount: rawTarget || 'تەلەپ قىلىنمىغان',
      orderId: randomId('ORD'),
      details: {
      gamePlayerId: parsedGameAccount.userId,
      gameZoneId: parsedGameAccount.zoneId,
      providerProductId: pkg.providerProductId,
    },
    });

    if (!atomicRes.success) {
      return NextResponse.json(
        { success: false, message: atomicRes.message || 'زاكاز مەغلۇپ بولدى' },
        { status: 400 }
      );
    }

    const order = atomicRes.order || ({ id: 'pending', amount: price, status: 'processing' } as OrderRecord);

    if (pkg.providerProductId && order?.id) {
      try {
        const providerConfig = await syria4GameProvider.getResolvedConfig();
        if (providerConfig.enabled && providerConfig.apiToken) {
          const providerRes = await syria4GameProvider.createOrder({
            productId: pkg.providerProductId,
            orderUuid: generateUUIDv4(),
            qty: 1,
            params: {
              playerId: parsedGameAccount.userId || rawTarget,
              ...(parsedGameAccount.zoneId ? { zoneId: parsedGameAccount.zoneId } : {}),
            },
            orderId: order.id,
          });
          if (providerRes.outcome === 'accepted' || providerRes.status === 'COMPLETED' || providerRes.status === 'PENDING') {
            await transitionOrderAsync(order.id, ['processing', 'pending'], providerRes.status === 'COMPLETED' ? 'completed' : 'pending_provider', {
              providerOrderId: providerRes.providerOrderId,
              providerOutcome: providerRes.outcome,
            });
            order.status = providerRes.status === 'COMPLETED' ? 'completed' : 'pending_provider';
          }
        }
      } catch (provErr: any) {
        console.warn('Sahl cash fulfillment notice:', provErr?.message);
      }
    }
    notifyNewOrder({
      id: order.id,
      serviceName: order.serviceName,
      packageTitle: order.packageTitle,
      amount: order.amount,
      userName: user.name,
      userEmail: order.userEmail || user.email,
      targetAccount: (order as any).targetAccount || rawTarget,
      status: order.status,
      fields: fields,
    }).catch(() => {});
    return NextResponse.json({ success: true, order: toBuyerOrder(order), newBalance: atomicRes.newBalance });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'زاكاز مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json(
        { success: false, message: 'باشقۇرغۇچى سالاھىيىتى دەلىللەنمىدى (Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, status } = body;

    if (typeof orderId !== 'string' || !ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: 'ھالەت تۈرى خاتا' }, { status: 400 });
    }

    const updated = await updateOrderStatusAsync(orderId, status);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'زاكاز تېپىلمىدى' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ھالەتنى يېڭىلاش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
