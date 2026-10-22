import { NextResponse } from 'next/server';
import { getCatalogServices, getProviderCatalog } from '@/lib/catalog/storefront';
import { getProviderSettings } from '@/lib/catalog/store';

export const dynamic = 'force-dynamic';

/** One service with everything checkout needs (fields, quantity rules, unit prices). */
export async function GET(_req: Request, { params }: { params: { serviceId: string } }) {
  try {
    const rawId = decodeURIComponent(params.serviceId || '').trim();
    const settings = await getProviderSettings();
    const services = await getCatalogServices();

    // 1. Exact ID match
    let service = services.find((s) => s.id === rawId);

    // 2. If rawId is 'sahl_{name}' or starts with 'sahl_'
    if (!service && rawId.startsWith('sahl_')) {
      const sahlKey = rawId.replace('sahl_', '').toLowerCase().trim();
      service = services.find((s) => (s.name || '').toLowerCase().trim() === sahlKey);
    }

    // 3. If rawId is 's4g-c{id}'
    if (!service && rawId.startsWith('s4g-')) {
      try {
        const providerCat = await getProviderCatalog();
        const pService = providerCat?.services?.find((s) => s.id === rawId);
        if (pService) {
          // Check if custom service has the same name
          const customMatch = services.find(
            (s) => (s.name || '').toLowerCase().trim() === (pService.name || '').toLowerCase().trim()
          );
          service = customMatch || pService;
        }
      } catch (err) {
        console.warn('Error fetching provider catalog in serviceId route:', err);
      }
    }

    // 4. Fallback: match by name
    if (!service) {
      const lowId = rawId.toLowerCase().trim();
      service = services.find((s) => (s.name || '').toLowerCase().trim() === lowId);
    }

    // 5. Fallback: check customServices directly from database
    if (!service) {
      const { getServicesListAsync } = await import('@/lib/servicesDb');
      const customServices = (await getServicesListAsync()) || [];
      service = customServices.find(
        (s) =>
          s.id === rawId ||
          (s.name || '').toLowerCase().trim() === rawId.toLowerCase().trim() ||
          (rawId.startsWith('sahl_') && (s.name || '').toLowerCase().trim() === rawId.replace('sahl_', '').toLowerCase().trim())
      );
    }

    if (!service) {
      return NextResponse.json({ success: false, message: 'مۇلازىمەت تېپىلمىدى' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, service, minOrderUsd: settings.minOrderUsd },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'خاتالىق كۆرۈلدى' }, { status: 500 });
  }
}
