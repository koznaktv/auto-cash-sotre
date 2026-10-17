import { NextResponse } from 'next/server';
import { getSystemSettingsAsync, updateSystemSettingsAsync } from '@/lib/db';
import { verifyAdminToken, PUBLIC_DEFAULT_PIN } from '@/lib/adminAuth';

export async function GET(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const settings = await getSystemSettingsAsync();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'تەڭشەكلەرنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    const { adminPin, shamcashAddress, whatsappNumber, telegramUsername, siteName } = body;

    const updates: any = {};
    if (adminPin) {
      const pin = String(adminPin).trim();
      if (pin.length < 8 || pin === PUBLIC_DEFAULT_PIN) {
        return NextResponse.json(
          { success: false, message: 'يېڭى PIN كەم دېگەندە 8 ھەرپ بولۇشى ۋە دەسلەپكى PIN بولماسلىقى كېرەك' },
          { status: 400 }
        );
      }
      updates.adminPin = pin;
    }
    if (shamcashAddress) updates.shamcashAddress = String(shamcashAddress).trim();
    if (whatsappNumber) updates.whatsappNumber = String(whatsappNumber).trim();
    if (telegramUsername) updates.telegramUsername = String(telegramUsername).trim();
    if (siteName) updates.siteName = String(siteName).trim();

    const updatedSettings = await updateSystemSettingsAsync(updates);
    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'تەڭشەكلەرنى ئۆزگەرتىش مەغلۇپ بولدى' }, { status: 500 });
  }
}
