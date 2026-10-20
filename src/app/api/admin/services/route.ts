import { NextResponse } from 'next/server';
import {
  getServicesList,
  getServicesListAsync,
  addServiceItem,
  updateServiceItem,
  deleteServiceItem,
  deleteServicesByCategory,
  clearAllServices,
  restoreDefaultServices,
} from '@/lib/servicesDb';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET() {
  try {
    const services = await getServicesListAsync();
    return NextResponse.json({ success: true, services });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'مەھسۇلاتلارنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || !body.category) {
      return NextResponse.json({ success: false, message: 'نامى ۋە سەھىپىسى چوقۇم بولۇشى كېرەك' }, { status: 400 });
    }

    const newService = addServiceItem(body);
    return NextResponse.json({ success: true, service: newService });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'مەھسۇلات قوشۇش مەغلۇپ بولدى' }, { status: 500 });
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
      return NextResponse.json({ success: false, message: 'مەھسۇلات ID كەمچىل' }, { status: 400 });
    }

    const updated = updateServiceItem(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'مەھسۇلات تېپىلمىدى' }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'مەھسۇلاتنى ئۆزگەرتىش مەغلۇپ بولدى' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const all = searchParams.get('all');
    const reset = searchParams.get('reset');

    if (reset === 'true') {
      const restoredCount = restoreDefaultServices();
      return NextResponse.json({ success: true, count: restoredCount });
    }

    if (all === 'true') {
      const deletedCount = clearAllServices();
      return NextResponse.json({ success: true, count: deletedCount });
    }

    if (category) {
      const deletedCount = deleteServicesByCategory(category);
      return NextResponse.json({ success: true, count: deletedCount });
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'مەھسۇلات ID كەمچىل' }, { status: 400 });
    }

    const success = deleteServiceItem(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'مەھسۇلاتنى ئۆچۈرۈش مەغلۇپ بولدى' }, { status: 500 });
  }
}
