import { NextResponse } from 'next/server';
import { getPromotionsListAsync } from '@/lib/promotionsDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const promotions = await getPromotionsListAsync();
    return NextResponse.json(
      {
        success: true,
        promotions,
        serverTime: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { success: false, promotions: [], error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
