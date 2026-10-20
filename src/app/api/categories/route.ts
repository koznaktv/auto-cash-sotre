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
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'سەھىپىلەرنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}
