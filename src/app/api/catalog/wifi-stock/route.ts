import { NextResponse } from 'next/server';
import { getWifiStockSummaryAsync } from '@/lib/wifiInventoryDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const summary = await getWifiStockSummaryAsync();
    return NextResponse.json(
      { success: true, stock: summary },
      { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
