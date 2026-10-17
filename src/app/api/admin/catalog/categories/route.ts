import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getProviderCatalog } from '@/lib/catalog/storefront';
import { saveOverride } from '@/lib/catalog/overrides';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
}

/** Provider categories with their effective storefront mapping. ?filter=unmapped|mapped|hidden&q=&page= */
export async function GET(req: Request) {
  if (!verifyAdminToken(req)) return unauthorized();
  try {
    const params = new URL(req.url).searchParams;
    const q = (params.get('q') || '').trim().toLowerCase();
    const filter = params.get('filter') || 'all';
    const page = Math.max(1, Number(params.get('page')) || 1);
    const pageSize = 50;

    const catalog = await getProviderCatalog({ fresh: true });
    let rows = catalog.categoryInfo.filter((c) => !c.category.removedAt && c.productCount > 0);
    if (filter === 'unmapped') rows = rows.filter((c) => !c.storefrontCategory);
    if (filter === 'mapped') rows = rows.filter((c) => c.storefrontCategory);
    if (filter === 'hidden') rows = rows.filter((c) => c.hidden);
    if (q) rows = rows.filter((c) => c.category.name.toLowerCase().includes(q) || String(c.category.id) === q);
    rows.sort((a, b) => b.productCount - a.productCount);

    return NextResponse.json({
      success: true,
      total: rows.length,
      page,
      pageSize,
      categories: rows.slice((page - 1) * pageSize, page * pageSize).map((c) => ({
        id: c.category.id,
        name: c.category.name,
        parentId: c.category.parentId,
        image: c.category.image,
        storefrontCategory: c.storefrontCategory,
        mappedBy: c.mappedBy,
        hidden: c.hidden,
        productCount: c.productCount,
        visibleProductCount: c.visibleProductCount,
        override: c.override || null,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!verifyAdminToken(req)) return unauthorized();
  try {
    const { id, ...patch } = await req.json();
    const override = await saveOverride('category', id, patch);
    return NextResponse.json({ success: true, override });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'ساقلانمىدى' }, { status: 400 });
  }
}
