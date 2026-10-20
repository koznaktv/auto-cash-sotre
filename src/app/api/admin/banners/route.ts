import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import {
  getBannersListAsync,
  saveBannersListAsync,
  DEFAULT_PROMO_SLIDES,
  PromoSlideData,
  invalidateBannersCache,
} from '@/lib/bannersDb';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const banners = await getBannersListAsync();
    return NextResponse.json({ success: true, banners });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ئېلانلارنى يۈكلەش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    const { action = 'save_all', banners, banner, bannerId } = body;

    let currentList = await getBannersListAsync();

    if (action === 'reset') {
      const freshDefaults = JSON.parse(JSON.stringify(DEFAULT_PROMO_SLIDES));
      await saveBannersListAsync(freshDefaults);
      invalidateBannersCache();
      return NextResponse.json({ success: true, banners: freshDefaults });
    }

    if (action === 'save_all' && Array.isArray(banners)) {
      await saveBannersListAsync(banners);
      invalidateBannersCache();
      return NextResponse.json({ success: true, banners });
    }

    if (action === 'add' && banner) {
      const newId = banner.id || `slide-${Date.now()}`;
      const newSlide: PromoSlideData = {
        id: newId,
        category: banner.category || 'games',
        image: banner.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
        title: banner.title || 'يېڭى ئېلان',
        subtitle: banner.subtitle || '',
        badge: banner.badge || '✨ قىزىق تەشۋىقات',
        linkText: banner.linkText || 'كۆرۈش ⚡',
        tag: banner.tag || 'ئالاھىدە',
        targetUrl: banner.targetUrl || '',
        enabled: banner.enabled !== false,
        order: currentList.length + 1,
      };

      const updated = [...currentList, newSlide];
      await saveBannersListAsync(updated);
      invalidateBannersCache();
      return NextResponse.json({ success: true, banners: updated, banner: newSlide });
    }

    if (action === 'update' && banner && banner.id) {
      const updated = currentList.map((item) => {
        if (item.id === banner.id) {
          return {
            ...item,
            ...banner,
          };
        }
        return item;
      });

      await saveBannersListAsync(updated);
      invalidateBannersCache();
      return NextResponse.json({ success: true, banners: updated });
    }

    if (action === 'delete' && bannerId) {
      const updated = currentList.filter((item) => item.id !== bannerId);
      await saveBannersListAsync(updated);
      invalidateBannersCache();
      return NextResponse.json({ success: true, banners: updated });
    }

    return NextResponse.json({ success: false, message: 'نامەلۇم مەشغۇلات' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ساقلاش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
