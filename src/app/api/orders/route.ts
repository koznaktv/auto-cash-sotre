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
import { SERVICE_PREFIX, getCatalogServices } from '@/lib/catalog/storefront';
import { placeProviderOrder } from '@/lib/provider/purchase';
import { pollProviderOrders } from '@/lib/provider/orderPoller';
import { generateUUIDv4, syria4GameProvider, othmanStoreProvider, resolveProviderForProduct } from '@/lib/providers/syria4game';
import { notifyNewOrder, postOrderCompletedToChannel } from '@/lib/telegram';

// Provider calls (live price check + newOrder) can take a while
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

let lastAdminOrdersPollTime = 0;

export async function GET(req: Request) {
  try {
    if (hasAdminBearer(req)) {
      // Opportunistic status refresh throttled to 12s so admin sees live status without triggering rate-limits
      const now = Date.now();
      if (now - lastAdminOrdersPollTime > 12000) {
        lastAdminOrdersPollTime = now;
        try {
          const { getInFlightProviderOrdersAsync } = await import('@/lib/db');
          const inFlightOrders = await getInFlightProviderOrdersAsync(20).catch(() => []);
          if (inFlightOrders.length > 0) {
            await pollProviderOrders({
              deadlineMs: now + 7000,
              limit: 20,
              orderIds: inFlightOrders.map((o) => o.id),
              force: false,
            }).catch(() => null);
          }
        } catch (pollErr: any) {
          console.warn('[Admin Order Poll Notice]:', pollErr?.message);
        }
      }
      return NextResponse.json({ success: true, orders: await getAllOrdersAsync() });
    }

    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    let orders = await getOrdersByUserIdAsync(user.id, user.email);

    // Opportunistic status refresh for this buyer's in-flight provider orders (cron may be infrequent)
    const inFlightOrders = orders.filter((o) => isOrderInProgress(o.status));
    if (inFlightOrders.length > 0) {
      const summary = await pollProviderOrders({
        deadlineMs: Date.now() + 5000,
        limit: 15,
        onlyUserId: user.id,
        orderIds: inFlightOrders.map((o) => o.id),
        force: true,
      }).catch(() => null);
      if (summary && (summary.checked > 0 || summary.completed > 0 || summary.refunded > 0)) {
        orders = await getOrdersByUserIdAsync(user.id, user.email);
      }
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

    const services = await getCatalogServices();
    let service = services.find((s) => s.id === serviceId);
    if (!service && serviceId.startsWith('sahl_')) {
      const sahlKey = serviceId.replace('sahl_', '').toLowerCase().trim();
      service = services.find((s) => (s.name || '').toLowerCase().trim() === sahlKey);
    }
    if (!service) {
      const lowId = serviceId.toLowerCase().trim();
      service = services.find((s) => (s.name || '').toLowerCase().trim() === lowId);
    }
    if (!service) {
      const { getServicesListAsync } = await import('@/lib/servicesDb');
      const customServices = (await getServicesListAsync()) || [];
      service = customServices.find(
        (s) =>
          s.id === serviceId ||
          (s.name || '').toLowerCase().trim() === serviceId.toLowerCase().trim()
      );
    }
    if (!service) {
      return NextResponse.json({ success: false, message: 'مۇلازىمەت تېپىلمىدى' }, { status: 404 });
    }
    const pkg = service.packages.find((p) => p.id === packageId) || service.packages.find((p) => p.title === packageId);
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

    // Pre-flight Live Availability & Wholesale Cost Guard (Othman Store & Syria4game)
    if (pkg.providerProductId) {
      const activeProvider = resolveProviderForProduct(service.id, pkg);
      const provConfig = await activeProvider.getResolvedConfig().catch(() => null);
      if (provConfig && provConfig.enabled && provConfig.apiToken) {
        try {
          const liveCheck = await activeProvider.getProduct(pkg.providerProductId);
          if (liveCheck.success && liveCheck.product) {
            // 1. Availability Guard: Is it temporarily paused / out of stock?
            if (!liveCheck.product.available) {
              return NextResponse.json(
                {
                  success: false,
                  message: 'بۇ مەھسۇلات تەمىنلىگۈچى تەرەپتە ۋاقىتلىق توختىتىلغان (غير متوفر)، ھېساباتىڭىزدىن پۇل تۇتۇلمىدى. تەمىنلىگۈچى قايتا تەمىنلىگەندە سېتىۋېلىڭ.',
                  unavailable: true,
                },
                { status: 409 }
              );
            }

            // 2. Cost Guard: Never sell at a loss!
            const liveCost = liveCheck.product.costPrice;
            const targetQty = (pkg as any).providerQty ?? (pkg as any).qty ?? (qty ? Number(qty) : 1);
            const totalWholesaleCost = liveCost * targetQty;

            if (totalWholesaleCost > price) {
              return NextResponse.json(
                {
                  success: false,
                  message: `تەمىنلىگۈچىنىڭ تەننەرخ باھاسى ئۆزگەردى (تەننەرخ: ${totalWholesaleCost.toFixed(2)}). زىيان تارتماسلىق ئۈچۈن زاكاز پۇلى تۇتۇلمىدى، بەتنى يېڭىلاپ قايتا سېتىۋېلىڭ.`,
                  priceChanged: true,
                  newCost: liveCost,
                },
                { status: 409 }
              );
            }

            // 3. Significant Surge Guard: If cost increased by > 35% compared to recorded cost
            const recordedCost = (pkg as any).costPrice;
            if (recordedCost && liveCost > recordedCost * 1.35) {
              return NextResponse.json(
                {
                  success: false,
                  message: 'بۇ مەھسۇلات باھاسى تەمىنلىگۈچىدە تۇيۇقسىز بەك ئۆرلەپ كەتكەنلىكتىن سىستېما تەرىپىدىن ۋاقىتلىق توختىتىلدى. پۇلىڭىز تۇتۇلمىدى.',
                  priceSurge: true,
                },
                { status: 409 }
              );
            }
          } else if (liveCheck.notFound) {
            return NextResponse.json(
              {
                success: false,
                message: 'بۇ مەھسۇلات تەمىنلىگۈچى سىستېمىسىدا تېپىلمىدى ياكى ئۆچۈرۈلگەن. پۇلىڭىز تۇتۇلمىدى.',
                notFound: true,
              },
              { status: 409 }
            );
          }
        } catch (checkErr: any) {
          console.warn('[Order PreCheck Notice]:', checkErr?.message);
        }
      }
    }

    // Wi-Fi Card Local Stock Check & Pre-Claim
    const isWifiService =
      service.category === 'wifi' ||
      service.id === 'fursan_net' ||
      service.id === 'azez_net' ||
      service.id === 'almujahid_net' ||
      (service.id || '').toLowerCase().includes('wifi') ||
      (service.id || '').toLowerCase().includes('_net') ||
      (service.name || '').toLowerCase().includes('wifi') ||
      (service.name || '').toLowerCase().includes('واي فاي') ||
      (service.name || '').toLowerCase().includes('نت');

    const prospectiveOrderId = randomId('ORD');
    let claimedWifiCard = null;

    if (isWifiService) {
      const { claimAvailableWifiCardAsync } = await import('@/lib/wifiInventoryDb');
      claimedWifiCard = await claimAvailableWifiCardAsync({
        serviceId: service.id,
        packageId: pkg.id,
        userId: user.id,
        userEmail: user.email,
        orderId: prospectiveOrderId,
      });

      if (!claimedWifiCard) {
        return NextResponse.json(
          {
            success: false,
            outOfStock: true,
            message: '⚠️ كارتا تۈگەپ كەتتى، يېقىندا قوشۇلىدۇ',
          },
          { status: 409 }
        );
      }
    }

    const atomicRes = await deductBalanceAndCreateOrderAtomicAsync({
      idempotencyKey,
      userId: user.id,
      userEmail: user.email,
      serviceId: service.id,
      serviceName: service.name,
      packageTitle: pkg.title,
      amount: price,
      targetAccount: rawTarget || (isWifiService ? 'Wi-Fi كارتىسى' : 'تەلەپ قىلىنمىغان'),
      orderId: prospectiveOrderId,
      initialStatus: (isWifiService && claimedWifiCard) ? 'completed' : 'processing',
      details: isWifiService && claimedWifiCard ? {
        wifiCard: {
          network: service.id === 'fursan_net' ? 'fursan' : (service.id === 'azez_net' ? 'azez' : 'mujahid'),
          networkName: service.id === 'fursan_net' ? 'شبكة الفرسان' : (service.id === 'azez_net' ? 'شبكة عزيز نت' : 'شبكة المجاهد نت'),
          networkEn: service.id === 'fursan_net' ? 'FURSAN NET' : (service.id === 'azez_net' ? 'AZEZ . NET' : 'AL MUJAHID NET'),
          username: claimedWifiCard.username,
          password: claimedWifiCard.password,
          cardNumber: claimedWifiCard.cardNumber,
          packageTitle: pkg.title,
          price: price,
          purchaseDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
          validity: pkg.duration || '7 كۈن',
        }
      } : {
        gamePlayerId: parsedGameAccount.userId,
        gameZoneId: parsedGameAccount.zoneId,
        providerProductId: pkg.providerProductId,
      },
    });

    if (!atomicRes.success) {
      if (isWifiService && claimedWifiCard) {
        const { unclaimWifiCardAsync } = await import('@/lib/wifiInventoryDb');
        await unclaimWifiCardAsync(claimedWifiCard.id).catch(() => {});
      }
      return NextResponse.json(
        { success: false, message: atomicRes.message || 'زاكاز مەغلۇپ بولدى' },
        { status: 400 }
      );
    }

    const order = atomicRes.order || ({ id: prospectiveOrderId, amount: price, status: 'processing' } as OrderRecord);

    // Instant Completion for Local Wi-Fi Card Vouchers
    if (isWifiService && claimedWifiCard && order?.id) {
      await updateOrderStatusAsync(order.id, 'completed');
      order.status = 'completed';

      notifyNewOrder({
        id: order.id,
        serviceName: order.serviceName,
        packageTitle: order.packageTitle,
        amount: order.amount,
        userName: user.name,
        userEmail: user.email,
        targetAccount: `Wi-Fi (${claimedWifiCard.username})`,
        status: 'completed',
        fields: {
          'اسم المستخدم': claimedWifiCard.username,
          'كلمة المرور': claimedWifiCard.password,
          'رقم البطاقة': claimedWifiCard.cardNumber,
        },
      }).catch(() => {});

      postOrderCompletedToChannel({
        id: order.id,
        serviceName: order.serviceName,
        packageTitle: order.packageTitle,
        amount: order.amount,
        targetAccount: `Wi-Fi (${claimedWifiCard.username.slice(0, 2)}***)`,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        order: toBuyerOrder(order),
        wifiCard: order.details?.wifiCard,
        message: 'Wi-Fi كارتىڭىز ھېساباتىڭىزغا مۇۋەپپەقىيەتلىك تارقىتىلدى!',
      });
    }

    if (pkg.providerProductId && order?.id) {
      try {
        const isOthman = (pkg as any).providerKey === 'othman' || (service as any).providerKey === 'othman' || (pkg as any).id?.includes('othman_');
        const activeProvider = isOthman ? othmanStoreProvider : syria4GameProvider;
        const providerConfig = await activeProvider.getResolvedConfig();
        if (providerConfig.enabled && providerConfig.apiToken) {
          const targetQty = (pkg as any).providerQty ?? (pkg as any).qty ?? (qty ? Number(qty) : 1);
          const targetParams: Record<string, string> = {
            playerId: parsedGameAccount.userId || rawTarget,
            phone: parsedGameAccount.userId || rawTarget,
            'ادخل رقم الهاتف بدون النداء': parsedGameAccount.userId || rawTarget,
            'الرابط': parsedGameAccount.userId || rawTarget,
            link: parsedGameAccount.userId || rawTarget,
            url: parsedGameAccount.userId || rawTarget,
            ...(parsedGameAccount.zoneId ? { zoneId: parsedGameAccount.zoneId } : {}),
            ...(fields && typeof fields === 'object' ? fields : {}),
          };
          const orderUuid = generateUUIDv4();
          const providerRes = await activeProvider.createOrder({
            productId: pkg.providerProductId,
            orderUuid,
            qty: targetQty,
            params: targetParams,
            orderId: order.id,
          });
          const now = new Date().toISOString();
          if (providerRes.outcome === 'accepted' || providerRes.status === 'COMPLETED' || providerRes.status === 'PENDING') {
            const completed = providerRes.status === 'COMPLETED';
            const deliv = providerRes.delivery;
            const replyMsg = providerRes.message || deliv?.reply || deliv?.text;
            const activationUrl = deliv?.activationUrl || (deliv?.codes?.find((c: string) => /^https?:\/\//i.test(c))) || (replyMsg?.match(/https?:\/\/[^\s"'<>]+/i)?.[0]);

            const updatedOrder = await transitionOrderAsync(order.id, ['processing', 'pending'], completed ? 'completed' : 'pending_provider', {
              providerOrderId: providerRes.providerOrderId,
              providerOrderUuid: orderUuid,
              providerOutcome: providerRes.outcome,
              providerStatus: providerRes.status,
              providerCheckedAt: now,
              ...(deliv ? { delivery: deliv } : {}),
              ...(replyMsg ? { providerReply: replyMsg, reply: replyMsg } : {}),
              ...(activationUrl ? { activationUrl, activationLink: activationUrl } : {}),
            });
            order.status = completed ? 'completed' : 'pending_provider';
            if (completed) {
              postOrderCompletedToChannel({
                id: order.id,
                serviceName: order.serviceName,
                packageTitle: order.packageTitle,
                amount: order.amount,
                targetAccount: (order as any).targetAccount || order.details?.targetAccount || order.details?.playerId || rawTarget,
                userName: user.name,
                userEmail: order.userEmail || user.email,
              }).catch(() => {});
            } else if (order.id) {
              // Rapid non-blocking follow-up check at 6s for quick fulfillment
              setTimeout(async () => {
                try {
                  const { pollProviderOrders } = await import('@/lib/provider/orderPoller');
                  await pollProviderOrders({
                    deadlineMs: Date.now() + 8000,
                    orderIds: [order.id],
                    force: true,
                  });
                } catch {}
              }, 6000);
            }
            if (updatedOrder) {
              order.details = { ...(order.details || {}), ...(updatedOrder.details || {}) };
            } else {
              order.details = {
                ...(order.details || {}),
                providerOrderId: providerRes.providerOrderId,
                providerOrderUuid: orderUuid,
                providerOutcome: providerRes.outcome,
                providerStatus: providerRes.status,
                ...(deliv ? { delivery: deliv } : {}),
                ...(replyMsg ? { providerReply: replyMsg, reply: replyMsg } : {}),
                ...(activationUrl ? { activationUrl, activationLink: activationUrl } : {}),
              };
            }
          } else if (providerRes.outcome === 'rejected' || providerRes.status === 'FAILED') {
            // Immediate Auto-Refund if provider explicitly rejected
            const { refundOrderBalanceAtomicAsync } = await import('@/lib/db');
            await refundOrderBalanceAtomicAsync(
              order.id,
              providerRes.message || 'تەمىنلىگۈچى زاكازنى رەت قىلدى ياكى مەھسۇلات ۋاقىتلىق توختىتىلدى'
            ).catch(() => {});
            order.status = 'refunded';
            order.details = {
              ...(order.details || {}),
              refundReason: providerRes.message || 'تەمىنلىگۈچى زاكازنى رەت قىلدى ياكى مەھسۇلات ۋاقىتلىق توختىتىلدى'
            };
          }
        }
      } catch (provErr: any) {
        console.warn('Provider fulfillment notice:', provErr?.message);
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

    // Automatically broadcast completed order to the official Telegram channel (@autocash_cannel)
    if (order.status === 'completed') {
      postOrderCompletedToChannel({
        id: order.id,
        serviceName: order.serviceName,
        packageTitle: order.packageTitle,
        amount: order.amount,
        targetAccount: (order as any).targetAccount || rawTarget,
        userName: user.name,
        userEmail: order.userEmail || user.email,
      }).catch(() => {});
    }

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

    if (status === 'completed') {
      postOrderCompletedToChannel({
        id: updated.id,
        serviceName: updated.serviceName,
        packageTitle: updated.packageTitle,
        amount: updated.amount,
        targetAccount: (updated as any).targetAccount || updated.details?.targetAccount || updated.details?.playerId,
        userName: (updated as any).userName,
        userEmail: updated.userEmail,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ھالەتنى يېڭىلاش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
