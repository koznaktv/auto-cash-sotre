import { NextResponse } from 'next/server';
import { getSystemSettingsAsync } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSystemSettingsAsync();
    return NextResponse.json({
      success: true,
      settings: {
        siteName: settings.siteName || 'AUTO CASH',
        siteLogo: settings.siteLogo || '/logo.png',
        telegramUsername: settings.telegramUsername || 'autocash_UYGHUR',
        whatsappNumber: settings.whatsappNumber || '+963 984 373 459',
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      settings: {
        siteName: 'AUTO CASH',
        siteLogo: '/logo.png',
        telegramUsername: 'autocash_UYGHUR',
        whatsappNumber: '+963 984 373 459',
      },
    });
  }
}
