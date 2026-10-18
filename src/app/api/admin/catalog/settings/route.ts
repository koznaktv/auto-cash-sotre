import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getProviderSettings, updateProviderSettings } from '@/lib/catalog/store';
import { getProviderCatalog, invalidateCatalogCache } from '@/lib/catalog/storefront';
import type { ProviderSettings } from '@/lib/catalog/types';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
}

export async function GET(req: Request) {
  if (!verifyAdminToken(req)) return unauthorized();
  try {
    const [settings, catalog] = await Promise.all([getProviderSettings(), getProviderCatalog({ fresh: true })]);
    return NextResponse.json({ success: true, settings, catalogStats: catalog.stats });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

const NUMERIC_LIMITS: Partial<Record<keyof ProviderSettings, [number, number]>> = {
  globalMarkupPercent: [0, 500],
  fixedMarkupUsd: [0, 1000],
  minProfitUsd: [0, 1000],
  minOrderUsd: [0, 1000],
  priceMaxAgeMinutes: [1, 1440],
  lowBalanceThresholdUsd: [0, 1_000_000],
  maxPendingHours: [1, 720],
};

export async function PATCH(req: Request) {
  if (!verifyAdminToken(req)) return unauthorized();
  try {
    const body = await req.json();
    const patch: Partial<ProviderSettings> = {};

    if (body.catalogSource !== undefined) {
      if (body.catalogSource !== 'legacy' && body.catalogSource !== 'provider') throw new Error('catalogSource خاتا');
      patch.catalogSource = body.catalogSource;
    }
    for (const [key, [min, max]] of Object.entries(NUMERIC_LIMITS) as [keyof ProviderSettings, [number, number]][]) {
      if (body[key] === undefined) continue;
      const value = Number(body[key]);
      if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${key}: ${min}–${max} ئارىلىقىدا بولۇشى كېرەك`);
      (patch as any)[key] = value;
    }
    if (body.showUnavailable !== undefined) patch.showUnavailable = Boolean(body.showUnavailable);
    if (body.ordersPaused !== undefined) {
      patch.ordersPaused = Boolean(body.ordersPaused);
      patch.ordersPausedReason = patch.ordersPaused ? 'باشقۇرغۇچى توختاتتى' : null;
    }

    const settings = await updateProviderSettings(patch);
    invalidateCatalogCache();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'تەڭشەك ساقلانمىدى' }, { status: 400 });
  }
}
