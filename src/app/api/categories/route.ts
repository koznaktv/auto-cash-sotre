import { NextResponse } from 'next/server';
import { getCategoriesList } from '@/lib/categoriesDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = getCategoriesList();
    return NextResponse.json(
      { success: true, categories },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'سەھىپىلەرنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}
