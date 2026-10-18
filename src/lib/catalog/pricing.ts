// Sell-price rules. Pure: shared by the server (authoritative) and the checkout UI (display only).

export const MAX_MARKUP_PERCENT = 500;

/** Rounds up to the next cent (tolerating float noise such as 1.1 * 100 = 110.00000000000001). */
export function ceilCents(value: number): number {
  return Math.ceil(value * 100 - 1e-7) / 100;
}

export function clampMarkup(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), MAX_MARKUP_PERCENT);
}

/** First defined markup wins: product override, then the nearest category override, then global. */
export function resolveMarkup(candidates: (number | null | undefined)[], globalMarkup: number): number {
  for (const candidate of candidates) {
    if (candidate !== null && candidate !== undefined && Number.isFinite(candidate)) return clampMarkup(candidate);
  }
  return clampMarkup(globalMarkup);
}

/** Unrounded sell price of one unit (shown for per-unit "amount" products). */
export function unitSellPrice(unitCost: number, markupPercent: number, fixedMarkupUsd: number = 0): number {
  const fixed = Math.max(0, Number.isFinite(fixedMarkupUsd) ? fixedMarkupUsd : 0);
  return Math.round((unitCost * (1 + clampMarkup(markupPercent) / 100) + fixed) * 1e10) / 1e10;
}

/**
 * Total the buyer pays: (cost × (1 + markup%)) + fixedMarkupUsd, rounded up to the cent, and never less than
 * cost + minProfit. Throws if the result would not be above cost (we never sell at a loss).
 */
export function computeSellPrice(input: {
  unitCost: number;
  qty: number;
  markupPercent: number;
  fixedMarkupUsd?: number;
  minProfit: number;
}): number {
  const { unitCost, qty } = input;
  if (!Number.isFinite(unitCost) || unitCost < 0 || !Number.isFinite(qty) || qty <= 0) {
    throw new Error('Invalid price input');
  }
  const cost = unitCost * qty;
  const markupPercent = clampMarkup(input.markupPercent);
  const fixedMarkup = Math.max(0, Number.isFinite(input.fixedMarkupUsd) ? (input.fixedMarkupUsd || 0) : 0);

  let sell = cost * (1 + markupPercent / 100) + fixedMarkup;
  sell = ceilCents(sell);

  const minProfit = Math.max(0, input.minProfit || 0);
  if (sell - cost < minProfit) sell = ceilCents(cost + minProfit);
  if (sell <= cost) sell = ceilCents(cost + 0.01);
  return sell;
}

/** What the checkout shows before the server confirms (no min-profit rule: the server may raise it). */
export function estimateTotal(unitPrice: number, qty: number): number {
  return ceilCents(unitPrice * qty);
}
