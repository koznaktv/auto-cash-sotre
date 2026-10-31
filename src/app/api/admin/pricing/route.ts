import { NextResponse } from 'next/server';
import { getServicesListAsync, saveServicesListAsync, invalidateServicesCache } from '@/lib/servicesDb';
import { verifyAdminToken } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const services = await getServicesListAsync();
    const rows: any[] = [];

    for (const s of services) {
      for (const p of s.packages || []) {
        const price = Number(p.price || 0);
        let costPrice = p.costPrice !== undefined && p.costPrice !== null ? Number(p.costPrice) : undefined;
        if (!costPrice || !Number.isFinite(costPrice)) {
          costPrice = Number((price / 1.15).toFixed(3));
        }
        const profit = Number((price - costPrice).toFixed(3));
        const marginPercent = costPrice > 0 ? Math.round((profit / costPrice) * 100) : 0;

        rows.push({
          serviceId: s.id,
          serviceName: s.name,
          category: s.category || 'other',
          icon: s.icon,
          image: s.image,
          packageId: p.id,
          title: p.title || (p as any).name || 'بىرلىك',
          costPrice,
          price,
          profit,
          marginPercent,
          originalPrice: p.originalPrice || price,
          available: p.available !== false,
        });
      }
    }

    return NextResponse.json({ success: true, count: rows.length, items: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Failed to load pricing table' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    const updates: Array<{ serviceId: string; packageId: string; price: number; costPrice?: number }> = 
      Array.isArray(body.items) ? body.items : (body.serviceId && body.packageId) ? [body] : [];

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'ئۆزگەرتىش ئۇچۇرى كەمچىل' }, { status: 400 });
    }

    const services = await getServicesListAsync();
    let updatedCount = 0;

    for (const up of updates) {
      const srv = services.find((s) => s.id === up.serviceId);
      if (!srv || !srv.packages) continue;

      const pkg = srv.packages.find((p) => p.id === up.packageId);
      if (!pkg) continue;

      if (Number.isFinite(up.price) && up.price >= 0) {
        pkg.price = Number(up.price);
        pkg.originalPrice = Number((up.price * 1.15).toFixed(2));
      }

      if (up.costPrice !== undefined && Number.isFinite(up.costPrice) && up.costPrice >= 0) {
        pkg.costPrice = Number(up.costPrice);
      }

      updatedCount++;
    }

    if (updatedCount > 0) {
      await saveServicesListAsync(services);
      invalidateServicesCache();
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'باھا ساقلاش مەغلۇپ بولدى' }, { status: 500 });
  }
}
