import { NextResponse } from 'next/server';
import { getServicesListAsync } from '@/lib/servicesDb';
import { getProviderSettings } from '@/lib/catalog/store';
import { hasAdminBearer } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Public storefront catalog (slim). Admins may preview the other source with ?source=provider|legacy. */
export async function GET(req: Request) {
  try {
    const requested = new URL(req.url).searchParams.get('source');
    const isAdminPreview = requested === 'provider' && hasAdminBearer(req);
    const settings = await getProviderSettings();

    if (isAdminPreview) {
      const { getProviderCatalog } = await import('@/lib/catalog/storefront');
      const providerCatalog = await getProviderCatalog();
      return NextResponse.json({
        success: true,
        source: 'provider',
        services: providerCatalog?.services || [],
      });
    }

    // Storefront: ONLY products chosen, edited, and published by the admin
    const allServices = await getServicesListAsync();
    const services = (allServices || [])
      .filter((service) => service.published !== false)
      .map((service) => ({
        ...service,
        published: true,
        packages: (service.packages || []).map((p) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          originalPrice: p.originalPrice,
          duration: p.duration,
          productType: p.productType,
          unitPrice: p.unitPrice,
          available: p.available,
          subCategoryId: (p as any).subCategoryId,
          providerProductId: (p as any).providerProductId,
          providerQty: (p as any).providerQty,
          badge: (p as any).badge,
          instructions: (p as any).instructions,
        })),
      }));

    // High-performance Edge CDN caching: cache for 60s, serve stale while revalidating for 10 min
    const cacheHeader = 'public, s-maxage=60, stale-while-revalidate=600';

    return NextResponse.json(
      { success: true, source: 'legacy', minOrderUsd: settings?.minOrderUsd ?? 0.1, services },
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
