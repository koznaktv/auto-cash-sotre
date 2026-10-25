/**
 * Follows up provider orders that weren't final when placed.
 * Supports both Othman Store and Sahl Cash / Syria4game with lightning-fast progressive polling.
 */
import crypto from 'crypto';
import {
  getInFlightProviderOrdersAsync,
  getOrderByIdAsync,
  refundOrderBalanceAtomicAsync,
  transitionOrderAsync,
  OrderRecord,
} from '../db';
import {
  syria4GameProvider,
  othmanStoreProvider,
  sahlCashProvider,
  Syria4GameProvider,
} from '../providers/syria4game';
import { acquireLock, getProviderSettings, releaseLock, updateProviderSettings } from '../catalog/store';
import { pruneProviderCalls } from './callLog';
import { postOrderCompletedToChannel, sendOrderDelayNoticeToCustomer } from '../telegram';

// Ultra-fast progressive polling intervals for instant delivery verification:
// Attempts 0: 5s, 1: 10s, 2: 20s, 3: 40s, 4: 1m, 5: 2m, 6: 5m, 7: 15m
const BACKOFF_MINUTES = [0.08, 0.16, 0.33, 0.66, 1, 2, 5, 15];
const MAX_UNKNOWN_CHECKS = 8;
const NO_ID_REVIEW_AFTER_MS = 10 * 60 * 1000;
// An order still 'processing' this long after creation lost its provider call
const STALE_PROCESSING_MS = 15 * 1000;
const IN_FLIGHT: OrderRecord['status'][] = ['pending_provider', 'processing'];

export interface PollSummary {
  skipped?: boolean;
  checked: number;
  completed: number;
  refunded: number;
  pending: number;
  needsReview: number;
}

function nextCheckAt(attempts: number): string {
  const minutes = BACKOFF_MINUTES[Math.min(attempts, BACKOFF_MINUTES.length - 1)];
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function getProviderForOrder(order: OrderRecord): Syria4GameProvider {
  const isOthman =
    order.serviceId?.includes('othman_') ||
    order.serviceId === 'othman_visa_cards' ||
    order.serviceId === 'othman_chat_apps' ||
    order.details?.providerKey === 'othman' ||
    (order.details?.providerProductId && String(order.details.providerProductId).length < 6);
  return isOthman ? othmanStoreProvider : syria4GameProvider;
}

function isDue(order: OrderRecord, force: boolean): boolean {
  if (force) return true;
  const age = Date.now() - new Date(order.createdAt).getTime();
  // Fresh orders under 3 minutes are ALWAYS due for lightning checking!
  if (age < 3 * 60 * 1000) return true;
  if (order.status === 'processing' && age < STALE_PROCESSING_MS) return false;
  const next = order.details?.providerNextCheckAt;
  return !next || new Date(next).getTime() <= Date.now();
}

export async function pollProviderOrders(options: {
  deadlineMs: number;
  limit?: number;
  onlyUserId?: string;
  orderIds?: string[];
  force?: boolean;
  housekeeping?: boolean;
}): Promise<PollSummary> {
  const summary: PollSummary = { checked: 0, completed: 0, refunded: 0, pending: 0, needsReview: 0 };
  const holder = crypto.randomUUID();
  if (!(await acquireLock('poll-orders', 120, holder))) return { ...summary, skipped: true };

  try {
    const settings = await getProviderSettings();
    const maxPendingMs = settings.maxPendingHours * 3600 * 1000;

    let orders: OrderRecord[];
    if (options.orderIds?.length) {
      orders = (await Promise.all(options.orderIds.map((id) => getOrderByIdAsync(id)))).filter(
        (o): o is OrderRecord => Boolean(o && IN_FLIGHT.includes(o.status) && o.details?.providerProductId)
      );
    } else {
      orders = await getInFlightProviderOrdersAsync(options.limit || 100);
    }
    if (options.onlyUserId) orders = orders.filter((o) => o.userId === options.onlyUserId);
    orders = orders.filter((o) => isDue(o, Boolean(options.force)));

    // 1-hour delay check: notify customers of upstream provider queue delays with 100% refund guarantee
    const ONE_HOUR_MS = 60 * 60 * 1000;
    for (const order of orders) {
      const ageMs = Date.now() - new Date(order.createdAt).getTime();
      if (ageMs >= ONE_HOUR_MS && !order.details?.delayNoticeSentAt) {
        const tgChatId =
          order.details?.telegramChatId ||
          (order.userId?.startsWith('tg_') ? order.userId.replace('tg_', '') : null);

        if (tgChatId) {
          sendOrderDelayNoticeToCustomer({
            orderId: order.id,
            telegramChatId: tgChatId,
            serviceName: order.serviceName,
            packageTitle: order.packageTitle,
            amount: Number(order.amount || 0),
          }).catch((err: any) => console.warn('[Poller Delay Notice Error]:', err?.message));
        }

        order.details = {
          ...(order.details || {}),
          delayNoticeSentAt: new Date().toISOString(),
        };

        transitionOrderAsync(order.id, IN_FLIGHT, null, {
          delayNoticeSentAt: new Date().toISOString(),
        }).catch(() => {});
      }
    }

    const withProviderId = orders.filter((o) => o.details?.providerOrderId);
    const withoutProviderId = orders.filter((o) => !o.details?.providerOrderId);

    // 1. Orders without provider ID: check by uuid using the correct provider
    for (const order of withoutProviderId) {
      if (Date.now() > options.deadlineMs) break;
      summary.checked++;
      const age = Date.now() - new Date(order.createdAt).getTime();
      const uuid = order.details?.providerOrderUuid;
      if (uuid) {
        const activeProv = getProviderForOrder(order);
        const lookup: any = await activeProv.checkOrderByUuid(String(uuid)).catch(() => ({ found: false, success: false }));
        if (lookup && lookup.found && lookup.providerOrderId) {
          const status = (lookup as any).entry?.status;
          if (status === 'COMPLETED') {
            await transitionOrderAsync(order.id, IN_FLIGHT, 'completed', {
              providerOrderId: lookup.providerOrderId,
              providerStatus: 'COMPLETED',
              providerCheckedAt: new Date().toISOString(),
              needsReview: false,
              ...((lookup as any).entry?.delivery ? { delivery: (lookup as any).entry.delivery } : {}),
            });
            summary.completed++;
            postOrderCompletedToChannel({
              id: order.id,
              serviceName: order.serviceName,
              packageTitle: order.packageTitle,
              amount: order.amount,
              targetAccount: (order as any).targetAccount || order.details?.targetAccount || order.details?.playerId,
              userName: (order as any).userName,
              userEmail: order.userEmail,
            }).catch(() => {});
            continue;
          }
          if (status === 'FAILED') {
            const refund = await refundOrderBalanceAtomicAsync(
              order.id,
              `تەمىنلىگۈچى رەت قىلدى: ${(lookup as any).entry?.message || 'rejected'}`
            );
            if (refund.success) summary.refunded++;
            else {
              await transitionOrderAsync(order.id, IN_FLIGHT, null, {
                providerOrderId: lookup.providerOrderId,
                needsReview: true,
                refundError: refund.message,
              });
              summary.needsReview++;
            }
            continue;
          }
          await transitionOrderAsync(order.id, IN_FLIGHT, 'pending_provider', {
            providerOrderId: lookup.providerOrderId,
            providerStatus: status || 'UNKNOWN',
            providerNextCheckAt: nextCheckAt(1),
          });
          summary.pending++;
          continue;
        }
        if (lookup && lookup.success && (lookup as any).absent && age > NO_ID_REVIEW_AFTER_MS) {
          const refund = await refundOrderBalanceAtomicAsync(order.id, 'تەمىنلىگۈچىدە زاكاز قۇرۇلمىغان');
          if (refund.success) {
            summary.refunded++;
            continue;
          }
        }
      }
      if (age > NO_ID_REVIEW_AFTER_MS) {
        await transitionOrderAsync(order.id, IN_FLIGHT, 'pending_provider', {
          needsReview: true,
          reviewReason: 'تەمىنلىگۈچى زاكاز نومۇرى قايتۇرمىدى — قولدا تەكشۈرۈڭ',
          providerNextCheckAt: nextCheckAt(BACKOFF_MINUTES.length),
        });
        summary.needsReview++;
      } else {
        await transitionOrderAsync(order.id, IN_FLIGHT, 'pending_provider', { providerNextCheckAt: nextCheckAt(1) });
        summary.pending++;
      }
    }

    // 2. Orders with provider ID: query the provider directly
    if (withProviderId.length && Date.now() < options.deadlineMs) {
      const othmanList = withProviderId.filter((o) => getProviderForOrder(o) === othmanStoreProvider);
      const sahlList = withProviderId.filter((o) => getProviderForOrder(o) !== othmanStoreProvider);

      const checkGroups = [
        { prov: othmanStoreProvider, orders: othmanList },
        { prov: syria4GameProvider, orders: sahlList },
      ];

      for (const group of checkGroups) {
        if (!group.orders.length || Date.now() >= options.deadlineMs) continue;
        const byProviderId = new Map(group.orders.map((o) => [String(o.details!.providerOrderId), o]));
        let result: any = null;
        try {
          result = await group.prov.checkOrders(Array.from(byProviderId.keys()));
        } catch (err: any) {
          console.warn('[Poller Check Error]:', err?.message);
          continue;
        }

        if (!result || !result.entries) continue;

        for (const [providerId, order] of Array.from(byProviderId.entries())) {
          if (Date.now() > options.deadlineMs) break;
          summary.checked++;
          const entry = result.entries.get(providerId);
          const attempts = Number(order.details?.providerCheckAttempts || 0) + 1;
          const now = new Date().toISOString();
          const tooOld = Date.now() - new Date(order.createdAt).getTime() > maxPendingMs;

          if (entry?.status === 'COMPLETED') {
            await transitionOrderAsync(order.id, IN_FLIGHT, 'completed', {
              providerStatus: 'COMPLETED',
              providerCheckedAt: now,
              providerCheckAttempts: attempts,
              needsReview: false,
              ...(entry.delivery ? { delivery: entry.delivery } : {}),
            });
            summary.completed++;
            postOrderCompletedToChannel({
              id: order.id,
              serviceName: order.serviceName,
              packageTitle: order.packageTitle,
              amount: order.amount,
              targetAccount: (order as any).targetAccount || order.details?.targetAccount || order.details?.playerId,
              userName: (order as any).userName,
              userEmail: order.userEmail,
            }).catch(() => {});
            continue;
          }

          if (entry?.status === 'FAILED') {
            const refund = await refundOrderBalanceAtomicAsync(
              order.id,
              `تەمىنلىگۈچى رەت قىلدى: ${entry.message || 'rejected'}`
            );
            if (refund.success) {
              summary.refunded++;
            } else {
              await transitionOrderAsync(order.id, IN_FLIGHT, null, {
                providerStatus: 'FAILED',
                needsReview: true,
                refundError: refund.message,
                reviewReason: 'تەمىنلىگۈچى رەت قىلدى، ئەمما پۇل ئاپتوماتىك قايتۇرۇلمىدى',
              });
              summary.needsReview++;
            }
            continue;
          }

          const unknownCount = Number(order.details?.providerUnknownCount || 0) + (entry?.status === 'PENDING' ? 0 : 1);
          const review = tooOld || unknownCount >= MAX_UNKNOWN_CHECKS;
          await transitionOrderAsync(order.id, IN_FLIGHT, 'pending_provider', {
            providerStatus: entry?.status || 'UNKNOWN',
            providerCheckedAt: now,
            providerCheckAttempts: attempts,
            providerUnknownCount: unknownCount,
            providerNextCheckAt: nextCheckAt(attempts),
            ...(review
              ? { needsReview: true, reviewReason: tooOld ? `${settings.maxPendingHours} سائەتتىن ئاشتى` : 'ھالىتى ئېنىق ئەمەس' }
              : {}),
          });
          if (review) summary.needsReview++;
          else summary.pending++;
        }
      }
    }

    if (options.housekeeping) {
      const profile = await syria4GameProvider.getProfile().catch(() => null);
      if (profile && profile.success && profile.balance !== null) {
        await updateProviderSettings({ lastBalance: profile.balance, lastBalanceAt: new Date().toISOString() }).catch(() => {});
      }
      await pruneProviderCalls(30).catch(() => {});
    }
    return summary;
  } finally {
    await releaseLock('poll-orders', holder).catch(() => {});
  }
}
