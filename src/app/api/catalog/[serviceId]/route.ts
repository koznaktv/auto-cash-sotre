import { NextResponse } from 'next/server';
import { getCatalogServices } from '@/lib/catalog/storefront';
import { getProviderSettings } from '@/lib/catalog/store';

export const dynamic = 'force-dynamic';

/** One service with everything checkout needs (fields, quantity rules, unit prices). */
export async function GET(_req: Request, { params }: { params: { serviceId: string } }) {
  try {
    const settings = await getProviderSettings();
    const services = await getCatalogServices({
      source: params.serviceId.startsWith('s4g-') ? 'provider' : settings.catalogSource,
    });
    const service = services.find((s) => s.id === params.serviceId);
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
