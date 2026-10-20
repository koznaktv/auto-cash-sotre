import { NextResponse } from 'next/server';
import { getBannersListAsync } from '@/lib/bannersDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const banners = await getBannersListAsync();
    // Return only active/enabled banners for public storefront
    const activeBanners = banners.filter((b) => b.enabled !== false);
    return NextResponse.json(
      { success: true, banners: activeBanners.length > 0 ? activeBanners : banners },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ئېلانلارنى يۈكلەش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
