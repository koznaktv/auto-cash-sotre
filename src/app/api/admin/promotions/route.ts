import { NextRequest, NextResponse } from 'next/server';
import {
  getPromotionsListAsync,
  createOrUpdatePromotion,
  removePromotion,
} from '@/lib/promotionsDb';
import { getServicesListAsync } from '@/lib/servicesDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [promotions, services] = await Promise.all([
      getPromotionsListAsync(),
      getServicesListAsync(),
    ]);

    // Build package options with wholesale cost for admin selector
    const servicePackages: Array<{
      serviceId: string;
      serviceName: string;
      category: string;
      serviceImage?: string;
      packages: Array<{
        id: string;
        title: string;
        price: number;
        costPrice: number;
        originalPrice?: number;
        providerProductId?: number;
      }>;
    }> = services.map((s) => ({
      serviceId: s.id,
      serviceName: s.name,
      category: s.category,
      serviceImage: s.image,
      packages: (s.packages || []).map((p) => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        costPrice: Number((p as any).costPrice || (p.price * 0.85).toFixed(2)),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        providerProductId: p.providerProductId,
      })),
    }));

    return NextResponse.json({
      success: true,
      promotions,
      servicePackages,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, packageId, promoPrice, endsAt, startsAt, broadcastToChannel } = body;

    if (!serviceId || !packageId || promoPrice === undefined || !endsAt) {
      return NextResponse.json(
        { success: false, error: 'مۇلازىمەت، بولاق، باھا ۋە ئاخىرلىشىش ۋاقتى چوقۇم تەمىنلىنىشى كېرەك' },
        { status: 400 }
      );
    }

    const result = await createOrUpdatePromotion({
      serviceId,
      packageId,
      promoPrice: Number(promoPrice),
      endsAt,
      startsAt,
      broadcastToChannel: Boolean(broadcastToChannel),
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const updatedList = await getPromotionsListAsync();
    return NextResponse.json({
      success: true,
      promotion: result.promotion,
      promotions: updatedList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const promoId = searchParams.get('id');

    if (!promoId) {
      return NextResponse.json(
        { success: false, error: 'پائالىيەت ID سى كەمچىل' },
        { status: 400 }
      );
    }

    const result = await removePromotion(promoId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const updatedList = await getPromotionsListAsync();
    return NextResponse.json({
      success: true,
      promotions: updatedList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
