/**
 * Follows up provider orders that weren't final when placed (syria4game has no webhooks).
 * Refunds go through refund_order_balance, which refuses completed / already-refunded orders,
 * so two concurrent pollers (or a poller and an admin) can't refund twice.
 */
import crypto from 'crypto';
import {
  getInFlightProviderOrdersAsync,
  getOrderByIdAsync,
  refundOrderBalanceAtomicAsync,
  transitionOrderAsync,
  OrderRecord,
} from '../db';
import { syria4GameProvider } from '../providers/syria4game';
import { acquireLock, getProviderSettings, releaseLock, updateProviderSettings } from '../catalog/store';
import { pruneProviderCalls } from './callLog';

const BACKOFF_MINUTES = [1, 2, 5, 10, 30, 60];
const MAX_UNKNOWN_CHECKS = 5;
const NO_ID_REVIEW_AFTER_MS = 10 * 60 * 1000;
// An order still 'processing' this long after creation lost its provider call (e.g. function timeout)
const STALE_PROCESSING_MS = 3 * 60 * 1000;
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

function isDue(order: OrderRecord, force: boolean): boolean {
  if (force) return true;
  const age = Date.now() - new Date(order.createdAt).getTime();
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

    const withProviderId = orders.filter((o) => o.details?.providerOrderId);
    const withoutProviderId = orders.filter((o) => !o.details?.providerOrderId);

    // Orders the provider never confirmed (ambiguous outcome / interrupted call)
    for (const order of withoutProviderId) {
      if (Date.now() > options.deadlineMs) break;
      summary.checked++;
      const age = Date.now() - new Date(order.createdAt).getTime();
      if (age > NO_ID_REVIEW_AFTER_MS) {
        await transitionOrderAsync(order.id, IN_FLIGHT, 'pending_provider', {
          needsReview: true,
          reviewReason: 'تەمىنلىگۈچى زاكاز نومۇرى قايتۇرمىدى — syria4game دا قولدا تەكشۈرۈڭ',
          providerNextCheckAt: nextCheckAt(BACKOFF_MINUTES.length),
        });
        summary.needsReview++;
      } else {
        await transitionOrderAsync(order.id, IN_FLIGHT, 'pending_provider', { providerNextCheckAt: nextCheckAt(1) });
        summary.pending++;
      }
    }

    if (withProviderId.length && Date.now() < options.deadlineMs) {
      const byProviderId = new Map(withProviderId.map((o) => [String(o.details!.providerOrderId), o]));
      const result = await syria4GameProvider.checkOrders(Array.from(byProviderId.keys()));

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
          continue;
        }

        if (entry?.status === 'FAILED') {
          const refund = await refundOrderBalanceAtomicAsync(order.id, `تەمىنلىگۈچى رەت قىلدى: ${entry.message || 'rejected'}`);
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

    if (options.housekeeping) {
      const profile = await syria4GameProvider.getProfile();
      if (profile.success && profile.balance !== null) {
        await updateProviderSettings({ lastBalance: profile.balance, lastBalanceAt: new Date().toISOString() });
      }
      await pruneProviderCalls(30).catch(() => {});
    }
    return summary;
  } finally {
    await releaseLock('poll-orders', holder).catch(() => {});
  }
}
