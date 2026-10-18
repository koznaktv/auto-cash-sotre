import { NextResponse } from 'next/server';
import { getCategoriesList, addCategoryItem, updateCategoryItem, deleteCategoryItem } from '@/lib/categoriesDb';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET() {
  try {
    const categories = getCategoriesList();
    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'سەھىپىلەرنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, message: 'سەھىپە نامى چوقۇم كىرگۈزۈلۈشى كېرەك' }, { status: 400 });
    }

    const newCategory = addCategoryItem(body);
    return NextResponse.json({ success: true, category: newCategory });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'سەھىپە قوشۇش مەغلۇپ بولدى' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'سەھىپە ID كەمچىل' }, { status: 400 });
    }

    const updated = updateCategoryItem(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'سەھىپە تېپىلمىدى' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'سەھىپىنى ئۆزگەرتىش مەغلۇپ بولدى' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'سەھىپە ID كەمچىل' }, { status: 400 });
    }

    const success = deleteCategoryItem(id);
    if (success) {
      // Also delete all services assigned to this category
      const { deleteServicesByCategory } = await import('@/lib/servicesDb');
      deleteServicesByCategory(id);
    }
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'سەھىپىنى ئۆچۈرۈش مەغلۇپ بولدى' }, { status: 500 });
  }
}
