import { NextResponse } from 'next/server';
import { getCategoriesList } from '@/lib/categoriesDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = getCategoriesList();
    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'سەھىپىلەرنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}
