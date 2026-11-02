import { NextResponse } from 'next/server';
import { authenticateApiKey, applyVipDiscount } from '@/lib/apiKeyAuth';
import {
  getUserByIdAsync,
  getOrdersByUserIdAsync,
  getOrderByIdAsync,
  deductBalanceAndCreateOrderAtomicAsync,
  updateOrderStatusAsync,
  transitionOrderAsync,
  refundOrderBalanceAtomicAsync,
  randomId,
  OrderRecord,
} from '@/lib/db';
import { getCatalogServices, SERVICE_PREFIX } from '@/lib/catalog/storefront';
import { placeProviderOrder } from '@/lib/provider/purchase';
import { toBuyerOrder } from '@/lib/orders';
import { generateUUIDv4, syria4GameProvider, othmanStoreProvider, resolveProviderForProduct } from '@/lib/providers/syria4game';
import { notifyNewOrder, postOrderCompletedToChannel } from '@/lib/telegram';
import { validateGameAccount } from '@/lib/validation/gameAccountValidator';

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
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);
    const statusFilter = url.searchParams.get('status')?.toLowerCase().trim();

    const allOrders = await getOrdersByUserIdAsync(user.id, user.email);
    let filtered = allOrders;
    if (statusFilter) {
      filtered = filtered.filter((o) => o.status?.toLowerCase() === statusFilter);
    }
    const sliced = filtered.slice(0, limit);

    return NextResponse.json({
      success: true,
      count: sliced.length,
      orders: sliced.map(toBuyerOrder),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'زاكازلارنى ئېلىشتا خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { user, vipDiscountPercent, errorResponse } = await authenticateApiKey(req);
  if (errorResponse) return errorResponse;
  if (!user) {
    return NextResponse.json({ success: false, message: 'ئىناۋەتسىز API كۇنۇپكىسى' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { serviceId, packageId, targetAccount, fields, qty, idempotencyKey: rawIdemp } = body;

    if (!serviceId || typeof serviceId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'INVALID_SERVICE_ID', message: 'مۇلازىمەت ID سى (serviceId) تەلەپ قىلىنىدۇ' },
        { status: 400 }
      );
    }

    if (!packageId || typeof packageId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'INVALID_PACKAGE_ID', message: 'تۈر ID سى (packageId) تەلەپ قىلىنىدۇ' },
        { status: 400 }
      );
    }

    const idempotencyKey = typeof rawIdemp === 'string' && /^[A-Za-z0-9_-]{8,100}$/.test(rawIdemp)
      ? rawIdemp
      : '';

    // Handle provider-synced prefix (s4g-c...)
    if (serviceId.startsWith(SERVICE_PREFIX)) {
      const result = await placeProviderOrder(user, {
        serviceId,
        packageId,
        fields: fields && typeof fields === 'object' ? fields : undefined,
        targetAccount: typeof targetAccount === 'string' ? targetAccount : undefined,
        qty,
        idempotencyKey,
      });

      const updatedUser = await getUserByIdAsync(user.id);
      return NextResponse.json(
        {
          ...result.body,
          remainingBalance: updatedUser?.balance ?? user.balance,
          vipTier: user.vipTier,
        },
        { status: result.status }
      );
    }

    // Storefront catalog services
    const services = await getCatalogServices();
    let service = services.find((s) => s.id === serviceId);
    if (!service) {
      service = services.find((s) => (s.name || '').toLowerCase().trim() === serviceId.toLowerCase().trim());
    }
    if (!service) {
      const { getServicesListAsync } = await import('@/lib/servicesDb');
      const customServices = (await getServicesListAsync()) || [];
      service = customServices.find(
        (s) => s.id === serviceId || (s.name || '').toLowerCase().trim() === serviceId.toLowerCase().trim()
      );
    }

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'SERVICE_NOT_FOUND', message: `مۇلازىمەت تېپىلمىدى: ${serviceId}` },
        { status: 404 }
      );
    }

    const pkg =
      service.packages.find((p) => p.id === packageId) ||
      service.packages.find((p) => p.title === packageId);

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: 'PACKAGE_NOT_FOUND', message: `تاللانغان تۈر تېپىلمىدى: ${packageId}` },
        { status: 404 }
      );
    }

    const retailPrice = Number(pkg.price);
    if (!Number.isFinite(retailPrice) || retailPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PRICE', message: 'مەھسۇلات باھاسى ئىناۋەتسىز' },
        { status: 400 }
      );
    }

    // Apply Reseller VIP Discount!
    const effectivePrice = applyVipDiscount(retailPrice, user.vipTier);

    // Balance pre-check
    const freshUser = await getUserByIdAsync(user.id);
    const currentBalance = freshUser?.balance ?? user.balance;
    if (currentBalance < effectivePrice) {
      return NextResponse.json(
        {
          success: false,
          error: 'INSUFFICIENT_BALANCE',
          message: `ھېسابات قالدۇقى يېتىشمىدى. كېرەكلىك سومما: $${effectivePrice.toFixed(2)}, ھازىرقى قالدۇق: $${currentBalance.toFixed(2)}`,
          requiredAmount: effectivePrice,
          currentBalance,
        },
        { status: 402 }
      );
    }

    const rawTarget = typeof targetAccount === 'string' ? targetAccount.trim().slice(0, 200) : '';
    let parsedGameAccount: { userId: string; zoneId?: string } = { userId: rawTarget };
    if (service.category === 'games' || service.inputLabel) {
      const validation = validateGameAccount(service.id, rawTarget);
      if (!validation.isValid) {
        return NextResponse.json(
          { success: false, error: 'INVALID_TARGET_ACCOUNT', message: validation.message },
          { status: 400 }
        );
      }
      parsedGameAccount = validation.parsed;
    }

    // Wi-Fi Card Local Stock Check & Pre-Claim
    const isWifiService =
      service.category === 'wifi' ||
      service.id === 'fursan_net' ||
      service.id === 'azez_net' ||
      service.id === 'almujahid_net' ||
      (service.id || '').toLowerCase().includes('wifi') ||
      (service.id || '').toLowerCase().includes('_net') ||
      (service.name || '').toLowerCase().includes('wifi');

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
            error: 'OUT_OF_STOCK',
            message: 'كارتىنىڭ پاي قالدۇقى قالمىدى (Out of Stock)',
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
      amount: effectivePrice,
      targetAccount: rawTarget || (isWifiService ? 'Wi-Fi كارتىسى' : 'تەلەپ قىلىنمىغان'),
      orderId: prospectiveOrderId,
      initialStatus: isWifiService && claimedWifiCard ? 'completed' : 'processing',
      details:
        isWifiService && claimedWifiCard
          ? {
              wifiCard: {
                network: service.id === 'fursan_net' ? 'fursan' : service.id === 'azez_net' ? 'azez' : 'mujahid',
                networkName:
                  service.id === 'fursan_net'
                    ? 'شبكة الفرسان'
                    : service.id === 'azez_net'
                    ? 'شبكة عزيز نت'
                    : 'شبكة المجاهد نت',
                networkEn:
                  service.id === 'fursan_net' ? 'FURSAN NET' : service.id === 'azez_net' ? 'AZEZ . NET' : 'AL MUJAHID NET',
                username: claimedWifiCard.username,
                password: claimedWifiCard.password,
                cardNumber: claimedWifiCard.cardNumber,
                packageTitle: pkg.title,
                price: effectivePrice,
                purchaseDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
                validity: pkg.duration || '7 كۈن',
              },
            }
          : {
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
        { success: false, error: 'TRANSACTION_FAILED', message: atomicRes.message || 'زاكاز پۇلىنى تۇتۇش مەغلۇپ بولدى' },
        { status: 400 }
      );
    }

    const order = atomicRes.order || ({ id: prospectiveOrderId, amount: effectivePrice, status: 'processing' } as OrderRecord);

    // Wi-Fi Instant Fulfillment
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
          'ئىشلەتكۈچى': claimedWifiCard.username,
          'پارول': claimedWifiCard.password,
          'كارتا نومۇرى': claimedWifiCard.cardNumber,
        },
      }).catch(() => {});

      const updatedUser = await getUserByIdAsync(user.id);
      return NextResponse.json({
        success: true,
        order: toBuyerOrder(order),
        wifiCard: order.details?.wifiCard,
        remainingBalance: updatedUser?.balance ?? (currentBalance - effectivePrice),
        message: 'Wi-Fi كارتىسى مۇۋەپپەقىيەتلىك تارقىتىلدى',
      });
    }

    // Third-party Provider Forwarding (Othman Store & Syria4game)
    if (pkg.providerProductId && order?.id) {
      try {
        const isOthman = (pkg as any).providerKey === 'othman' || (service as any).providerKey === 'othman' || (pkg as any).id?.includes('othman_');
        const activeProvider = isOthman ? othmanStoreProvider : syria4GameProvider;
        const providerConfig = await activeProvider.getResolvedConfig();

        if (providerConfig.enabled && providerConfig.apiToken) {
          const targetQty = (pkg as any).providerQty ?? (pkg as any).qty ?? (qty ? Number(qty) : 1);
          const targetParams: Record<string, string> = {};

          if (fields && typeof fields === 'object') {
            for (const [k, v] of Object.entries(fields)) {
              if (v && typeof v === 'string' && v.trim()) {
                targetParams[k] = v.trim();
              }
            }
          }

          const effectiveTarget = (parsedGameAccount.userId || rawTarget || '').trim();
          if (effectiveTarget) {
            targetParams.playerId = effectiveTarget;
            targetParams.phone = effectiveTarget;
            targetParams['ادخل رقم الهاتف بدون النداء'] = effectiveTarget;
            targetParams['الرابط'] = effectiveTarget;
            targetParams.link = effectiveTarget;
            targetParams.url = effectiveTarget;
          }
          if (parsedGameAccount.zoneId) {
            targetParams.zoneId = parsedGameAccount.zoneId;
          }

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
            const redCode = deliv?.codes?.find((c: string) => !/^https?:\/\//i.test(c)) || (deliv as any)?.code || (deliv as any)?.pin || (deliv as any)?.card_code;
            const accountCredentials = (deliv as any)?.accountCredentials || (deliv as any)?.account_credentials || (deliv as any)?.credentials || (deliv as any)?.account;

            await transitionOrderAsync(order.id, ['processing', 'pending'], completed ? 'completed' : 'pending_provider', {
              providerOrderId: providerRes.providerOrderId,
              providerOrderUuid: orderUuid,
              providerOutcome: providerRes.outcome,
              providerStatus: providerRes.status,
              providerCheckedAt: now,
              ...(deliv ? { delivery: deliv } : {}),
              ...(redCode ? { redemptionCode: redCode, cardCode: redCode } : {}),
              ...(accountCredentials ? { accountCredentials } : {}),
              ...(replyMsg ? { providerReply: replyMsg, reply: replyMsg } : {}),
              ...(activationUrl ? { activationUrl, activationLink: activationUrl } : {}),
            });
            order.status = completed ? 'completed' : 'pending_provider';

            notifyNewOrder({
              id: order.id,
              serviceName: order.serviceName,
              packageTitle: order.packageTitle,
              amount: order.amount,
              userName: user.name,
              userEmail: user.email,
              targetAccount: rawTarget || 'ئاپتوماتىك',
              status: order.status,
              fields: fields,
            }).catch(() => {});

            const updatedUser = await getUserByIdAsync(user.id);
            return NextResponse.json({
              success: true,
              order: toBuyerOrder(order),
              remainingBalance: updatedUser?.balance ?? (currentBalance - effectivePrice),
              message: completed ? 'زاكاز مۇۋەپپەقىيەتلىك بېجىرىلدى' : 'زاكاز تەمىنلىگۈچىگە يەتكۈزۈلدى، بېجىرىلىۋاتىدۇ',
            });
          } else if (providerRes.outcome === 'rejected') {
            // Provider rejected order — refund balance atomically
            await refundOrderBalanceAtomicAsync(order.id, providerRes.message || 'تەمىنلىگۈچى تەرەپ رەت قىلدى');
            return NextResponse.json(
              {
                success: false,
                error: 'PROVIDER_REJECTED',
                message: `تەمىنلىگۈچى زاكازنى رەت قىلدى: ${providerRes.message || 'نامەلۇم سەۋەب'}. پۇلىڭىز ھېساباتىڭىزغا قايتۇرۇلدى.`,
                refunded: true,
              },
              { status: 422 }
            );
          }
        }
      } catch (provErr: any) {
        console.error('[API v1 Provider Error]:', provErr);
      }
    }

    // Default response for non-provider or manual service orders
    notifyNewOrder({
      id: order.id,
      serviceName: order.serviceName,
      packageTitle: order.packageTitle,
      amount: order.amount,
      userName: user.name,
      userEmail: user.email,
      targetAccount: rawTarget || 'ئاپتوماتىك',
      status: order.status,
      fields: fields,
    }).catch(() => {});

    const updatedUser = await getUserByIdAsync(user.id);
    return NextResponse.json({
      success: true,
      order: toBuyerOrder(order),
      remainingBalance: updatedUser?.balance ?? (currentBalance - effectivePrice),
      message: 'زاكاز قوبۇل قىلىندى، بېجىرىلىۋاتىدۇ',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: err?.message || 'زاكاز يوللاشتا سىستېما خاتالىقى كۆرۈلدى' },
      { status: 500 }
    );
  }
}
