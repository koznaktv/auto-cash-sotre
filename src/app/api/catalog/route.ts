import { NextResponse } from 'next/server';
import { getCatalogServices } from '@/lib/catalog/storefront';
import { getProviderSettings } from '@/lib/catalog/store';
import { hasAdminBearer } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/** Public storefront catalog (slim). Admins may preview the other source with ?source=provider|legacy. */
export async function GET(req: Request) {
  try {
    const requested = new URL(req.url).searchParams.get('source');
    const isAdminPreview = (requested === 'provider' || requested === 'legacy') && hasAdminBearer(req);
    const settings = await getProviderSettings();
    const source = isAdminPreview ? (requested as 'provider' | 'legacy') : settings.catalogSource;

    const services = (await getCatalogServices({ source })).map((service) => ({
      ...service,
      packages: service.packages.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice,
        duration: p.duration,
        productType: p.productType,
        unitPrice: p.unitPrice,
        available: p.available,
      })),
    }));

    const cacheHeader = 'no-store, no-cache, must-revalidate, max-age=0';

    return NextResponse.json(
      { success: true, source, minOrderUsd: settings.minOrderUsd, services },
      {
        headers: {
          'Cache-Control': cacheHeader,
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'تىزىملىكنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}
