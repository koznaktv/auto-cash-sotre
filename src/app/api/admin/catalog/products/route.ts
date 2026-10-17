import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { listCatalogOverrides, listStoredProducts, getProviderSettings } from '@/lib/catalog/store';
import { getProviderCatalog } from '@/lib/catalog/storefront';
import { saveOverride } from '@/lib/catalog/overrides';
import { computeSellPrice } from '@/lib/catalog/pricing';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
}

/** Provider products with cost and sell price. ?q=&categoryId=&status=unavailable|removed|priceChanged&page= */
export async function GET(req: Request) {
  if (!verifyAdminToken(req)) return unauthorized();
  try {
    const params = new URL(req.url).searchParams;
    const q = (params.get('q') || '').trim().toLowerCase();
    const categoryId = Number(params.get('categoryId')) || null;
    const status = params.get('status');
    const page = Math.max(1, Number(params.get('page')) || 1);
    const pageSize = 50;

    const [products, overrides, settings, catalog] = await Promise.all([
      listStoredProducts(),
      listCatalogOverrides(),
      getProviderSettings(),
      getProviderCatalog(),
    ]);
    const productOverrides = new Map(overrides.filter((o) => o.scope === 'product').map((o) => [o.targetId, o]));

    let rows = products;
    if (categoryId) rows = rows.filter((p) => p.categoryId === categoryId);
    if (status === 'unavailable') rows = rows.filter((p) => !p.available && !p.removedAt);
    else if (status === 'removed') rows = rows.filter((p) => p.removedAt);
    else if (status === 'priceChanged') rows = rows.filter((p) => p.priceChangedAt && !p.removedAt);
    else rows = rows.filter((p) => !p.removedAt);
    if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q) || String(p.id) === q || p.categoryName.toLowerCase().includes(q));
    rows = [...rows].sort((a, b) => a.categoryId - b.categoryId || a.costPrice - b.costPrice);

    return NextResponse.json({
      success: true,
      total: rows.length,
      page,
      pageSize,
      products: rows.slice((page - 1) * pageSize, page * pageSize).map((p) => {
        const orderable = catalog.orderable.get(p.id);
        let sellPrice: number | null = null;
        try {
          sellPrice = computeSellPrice({
            unitCost: p.costPrice,
            qty: 1,
            markupPercent: orderable?.markupPercent ?? settings.globalMarkupPercent,
            minProfit: settings.minProfitUsd,
          });
        } catch {
          sellPrice = null;
        }
        return {
          id: p.id,
          name: p.name,
          categoryId: p.categoryId,
          categoryName: p.categoryName,
          costPrice: p.costPrice,
          prevCostPrice: p.prevCostPrice,
          priceChangedAt: p.priceChangedAt,
          currency: p.currency,
          available: p.available,
          removedAt: p.removedAt,
          productType: p.productType,
          sellPrice,
          onStorefront: Boolean(orderable),
          serviceId: orderable?.serviceId,
          fields: orderable?.fields,
          override: productOverrides.get(p.id) || null,
        };
      }),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!verifyAdminToken(req)) return unauthorized();
  try {
    const { id, ...patch } = await req.json();
    const override = await saveOverride('product', id, patch);
    return NextResponse.json({ success: true, override });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'ساقلانمىدى' }, { status: 400 });
  }
}
