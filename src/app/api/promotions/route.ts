import { NextResponse } from 'next/server';
import { getPromotionsListAsync } from '@/lib/promotionsDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const promotions = await getPromotionsListAsync();
    return NextResponse.json({
      success: true,
      promotions,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { success: false, promotions: [], error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
