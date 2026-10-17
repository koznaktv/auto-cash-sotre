/**
 * Buying a syria4game product: validate → live price check → atomic charge → provider order →
 * settle (completed / pending_provider / refund). The provider order_uuid is generated and saved
 * with the order before the provider is called, so an interrupted call can still be traced.
 */
import {
  deductBalanceAndCreateOrderAtomicAsync,
  randomId,
  refundOrderBalanceAtomicAsync,
  transitionOrderAsync,
  UserRecord,
  OrderRecord,
} from '../db';
import { toBuyerOrder } from '../orders';
import { generateUUIDv4, syria4GameProvider } from '../providers/syria4game';
import { shouldPauseOrders } from '../providers/syria4gameNormalize';
import { validateGameAccount } from '../validation/gameAccountValidator';
import { validateOrderFields, validateQty } from '../catalog/fieldValidation';
import { computeSellPrice } from '../catalog/pricing';
import { invalidateCatalogCache, resolveOrderableProduct } from '../catalog/storefront';
import { getProviderSettings, updateProviderSettings, updateStoredProduct } from '../catalog/store';

export interface PurchaseInput {
  serviceId: string;
  packageId: string;
  fields?: Record<string, unknown>;
  targetAccount?: string;
  qty?: unknown;
  expectedTotal?: unknown;
  idempotencyKey: string;
}

export interface PurchaseResult {
  status: number;
  body: Record<string, unknown>;
}

const BALANCE_FRESH_MS = 10 * 60 * 1000;

function fail(status: number, message: string, extra: Record<string, unknown> = {}): PurchaseResult {
  return { status, body: { success: false, message, ...extra } };
}

async function markUnavailable(productId: number): Promise<void> {
  await updateStoredProduct(productId, { available: false }).catch(() => {});
  invalidateCatalogCache();
}

export async function placeProviderOrder(user: UserRecord, input: PurchaseInput): Promise<PurchaseResult> {
  const settings = await getProviderSettings();
  if (settings.ordersPaused) {
    return fail(503, 'سېتىۋېلىش ۋاقتىنچە توختىتىلدى، سەل تۇرۇپ قايتا سىناڭ');
  }

  const resolved = await resolveOrderableProduct(input.serviceId, input.packageId);
  if (!resolved.ok) return fail(resolved.status, resolved.message);
  const item = resolved.item;

  // 1. Checkout fields (legacy clients send a single targetAccount)
  let fieldInput = input.fields;
  if (!fieldInput && typeof input.targetAccount === 'string' && item.fields.length === 1) {
    fieldInput = { [item.fields[0].key]: input.targetAccount };
  }
  const fields = validateOrderFields(fieldInput, item.fields);
  if (!fields.ok) return fail(400, fields.message || 'ئۇچۇر خاتا');

  // Extra UID format rules where they are reliable (numeric-only game ids)
  if (item.fields.length === 1 && item.storefrontCategory === 'games') {
    const name = `${item.category.name} ${item.serviceName}`.toLowerCase();
    const rule = /pubg|ببجي/.test(name) ? 'pubg' : /free\s*fire|فري\s*فاير/.test(name) ? 'free-fire' : null;
    const value = Object.values(fields.params)[0] || '';
    if (rule) {
      const check = validateGameAccount(rule, value);
      if (!check.isValid) return fail(400, check.message || 'ئويۇنچى ID خاتا');
    }
  }

  const qtyCheck = validateQty(input.qty ?? undefined, item.qty);
  if (!qtyCheck.ok) return fail(400, qtyCheck.message || 'سانى خاتا');
  const qty = qtyCheck.qty;

  // 2. Live price & availability (never sell below the provider's current cost)
  let unitCost = item.product.costPrice;
  const live = await syria4GameProvider.getProduct(item.product.id);
  if (live.success && live.product) {
    if (!live.product.available) {
      await markUnavailable(item.product.id);
      return fail(409, 'بۇ مەھسۇلات ھازىر تەمىنلىگۈچىدە يوق');
    }
    unitCost = live.product.costPrice;
    if (Math.abs(unitCost - item.product.costPrice) > 1e-10) {
      await updateStoredProduct(item.product.id, {
        costPrice: unitCost,
        prevCostPrice: item.product.costPrice,
        priceChangedAt: new Date().toISOString(),
      }).catch(() => {});
      invalidateCatalogCache();
    }
  } else if (live.notFound) {
    await markUnavailable(item.product.id);
    return fail(409, 'بۇ مەھسۇلات ھازىر سېتىلمايدۇ');
  } else {
    if (live.error && shouldPauseOrders(live.error)) {
      await updateProviderSettings({ ordersPaused: true, ordersPausedReason: live.error.message }).catch(() => {});
      return fail(503, 'سېتىۋېلىش ۋاقتىنچە توختىتىلدى، سەل تۇرۇپ قايتا سىناڭ');
    }
    const ageMs = Date.now() - new Date(item.product.syncedAt).getTime();
    if (!(ageMs <= settings.priceMaxAgeMinutes * 60_000)) {
      return fail(503, 'تەمىنلىگۈچى ۋاقتىنچە جاۋاب بەرمىدى، سەل تۇرۇپ قايتا سىناڭ');
    }
  }

  // 3. Price
  const costTotal = Math.round(unitCost * qty * 1e8) / 1e8;
  let total: number;
  try {
    total = computeSellPrice({ unitCost, qty, markupPercent: item.markupPercent, minProfit: settings.minProfitUsd });
  } catch {
    return fail(400, 'باھا ھېسابلاش مەغلۇپ بولدى');
  }
  if (total < settings.minOrderUsd) {
    return fail(400, `ئەڭ ئاز زاكاز سوممىسى $${settings.minOrderUsd.toFixed(2)}`);
  }
  const expected = Number(input.expectedTotal);
  if (input.expectedTotal !== undefined && Number.isFinite(expected) && total > expected + 0.001) {
    return fail(409, `باھا ئۆزگەردى: يېڭى باھا $${total.toFixed(2)}`, { priceChanged: true, newTotal: total });
  }

  // Avoid charging and then refunding when we already know the provider wallet can't cover it
  const balanceFresh = settings.lastBalanceAt && Date.now() - new Date(settings.lastBalanceAt).getTime() < BALANCE_FRESH_MS;
  if (balanceFresh && settings.lastBalance !== null && settings.lastBalance !== undefined && settings.lastBalance < costTotal) {
    return fail(503, 'بۇ مەھسۇلات ۋاقتىنچە سېتىلمايدۇ، سەل تۇرۇپ قايتا سىناڭ');
  }

  // 4. Atomic charge + order row (uuid saved before the provider call)
  const orderId = randomId('ORD');
  const providerOrderUuid = generateUUIDv4();
  const packageTitle = qty > 1 ? `${item.packageTitle} ×${qty}` : item.packageTitle;
  const charge = await deductBalanceAndCreateOrderAtomicAsync({
    idempotencyKey: input.idempotencyKey,
    userId: user.id,
    userEmail: user.email,
    serviceId: item.serviceId,
    serviceName: item.serviceName,
    packageTitle,
    amount: total,
    targetAccount: fields.summary || 'تەلەپ قىلىنمىغان',
    orderId,
    details: {
      providerProductId: item.product.id,
      providerOrderUuid,
      qty,
      fields: fields.params,
      unitCost,
      costTotal,
      markupPercent: item.markupPercent,
      sellPrice: total,
    },
  });
  if (!charge.success) return fail(400, charge.message || 'زاكاز مەغلۇپ بولدى');
  if (charge.isCached) {
    return { status: 200, body: { success: true, order: charge.order, newBalance: charge.newBalance, isCached: true } };
  }
  const baseOrder = charge.order || ({ id: orderId, amount: total, status: 'processing' } as OrderRecord);

  // 5. Provider order (never retried automatically)
  const response = await syria4GameProvider.createOrder({
    productId: item.product.id,
    qty,
    params: fields.params,
    orderUuid: providerOrderUuid,
    orderId,
  });
  const now = new Date().toISOString();

  if (response.outcome === 'accepted') {
    const completed = response.status === 'COMPLETED';
    const settled = await transitionOrderAsync(orderId, ['processing'], completed ? 'completed' : 'pending_provider', {
      providerOrderId: response.providerOrderId,
      providerStatus: response.status,
      providerCheckedAt: now,
      providerCheckAttempts: 0,
      providerNextCheckAt: completed ? null : new Date(Date.now() + 60_000).toISOString(),
      ...(response.delivery ? { delivery: response.delivery } : {}),
    }).catch((e) => {
      // Money taken and the provider accepted: a failed status write must not report "order failed"
      console.error(`Order ${orderId} accepted by provider but status update failed:`, e);
      return null;
    });
    return {
      status: 200,
      body: {
        success: true,
        order: toBuyerOrder(settled || { ...baseOrder, status: completed ? 'completed' : 'pending_provider' }),
        newBalance: charge.newBalance,
      },
    };
  }

  if (response.outcome === 'ambiguous') {
    // The provider may have processed it: keep the money, the poller / an admin will settle it
    await transitionOrderAsync(orderId, ['processing'], 'pending_provider', {
      providerAmbiguous: true,
      providerError: response.message,
      providerNextCheckAt: new Date(Date.now() + 60_000).toISOString(),
    }).catch((e) => console.error(`Order ${orderId} status update failed:`, e));
    return {
      status: 202,
      body: {
        success: true,
        order: toBuyerOrder({ ...baseOrder, status: 'pending_provider' }),
        newBalance: charge.newBalance,
        message: 'زاكازىڭىز تەكشۈرۈلۈۋاتىدۇ. ئەمەلگە ئاشمىسا پۇلىڭىز قايتۇرۇلىدۇ.',
      },
    };
  }

  // Definite rejection → refund
  if (response.error?.kind === 'not_found') await markUnavailable(item.product.id);
  if (response.error && shouldPauseOrders(response.error)) {
    await updateProviderSettings({ ordersPaused: true, ordersPausedReason: response.error.message }).catch(() => {});
  }
  const reason = response.message || 'تاشقى تەمىنلىگۈچى رەت قىلدى';
  const refund = await refundOrderBalanceAtomicAsync(orderId, reason);
  if (!refund.success) {
    console.error(`Refund failed for order ${orderId}:`, refund.message);
    await transitionOrderAsync(orderId, ['processing'], 'failed', {
      providerError: reason,
      refundError: refund.message,
      needsReview: true,
      reviewReason: 'تەمىنلىگۈچى رەت قىلدى، پۇل ئاپتوماتىك قايتۇرۇلمىدى',
    }).catch(() => null);
    return fail(502, `زاكاز ئەمەلگە ئاشمىدى: ${reason}. پۇل قايتۇرۇش ئاپتوماتىك ئەمەلگە ئاشمىدى، زاكاز نومۇرى ${orderId} بىلەن مۇلازىمەتكە ئالاقىلىشىڭ.`, {
      refunded: false,
    });
  }
  return fail(502, `زاكاز ئەمەلگە ئاشمىدى: ${reason}. پۇلىڭىز ھېساباتىڭىزغا قايتۇرۇلدى!`, {
    refunded: true,
    newBalance: refund.newBalance,
  });
}
