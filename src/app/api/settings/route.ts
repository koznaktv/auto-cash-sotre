import { NextResponse } from 'next/server';
import { getSystemSettingsAsync } from '@/lib/db';
import { APP_VERSION_CONFIG } from '@/lib/appVersion';

export async function GET() {
  try {
    const settings = await getSystemSettingsAsync();
    const appVersion = (settings as any).appVersion || APP_VERSION_CONFIG.version;
    return NextResponse.json({
      success: true,
      settings: {
        siteName: settings.siteName || 'AUTO CASH',
        siteLogo: settings.siteLogo || '/logo.png',
        telegramUsername: settings.telegramUsername || 'autocash_UYGHUR',
        whatsappNumber: settings.whatsappNumber || '+963 984 373 459',
        appDownloadUrl: (settings as any).appDownloadUrl || '/download/autocash.apk',
        appVersion,
        appVersionConfig: {
          ...APP_VERSION_CONFIG,
          version: appVersion,
        },
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
        appDownloadUrl: '/download/autocash.apk',
        appVersion: APP_VERSION_CONFIG.version,
        appVersionConfig: APP_VERSION_CONFIG,
      },
    });
  }
}
