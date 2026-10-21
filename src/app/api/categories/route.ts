import { NextResponse } from 'next/server';
import { getCategoriesListAsync } from '@/lib/categoriesDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getCategoriesListAsync();
    return NextResponse.json(
      { success: true, categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'سەھىپىلەرنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}
