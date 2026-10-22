import { NextResponse } from 'next/server';
import { getSystemSettingsAsync } from '@/lib/db';
import { APP_VERSION_CONFIG } from '@/lib/appVersion';
import { recordSiteVisit } from '@/lib/telegram';

export async function GET() {
  try {
    recordSiteVisit();
    const settings = await getSystemSettingsAsync();
    const appVersion = (settings as any).appVersion || APP_VERSION_CONFIG.version;
    const minRequiredVersion = (settings as any).minRequiredVersion || APP_VERSION_CONFIG.minRequiredVersion;
    const forceUpdate = (settings as any).forceUpdate !== undefined ? Boolean((settings as any).forceUpdate) : APP_VERSION_CONFIG.forceUpdate;
    return NextResponse.json({
      success: true,
      settings: {
        siteName: settings.siteName || 'AUTO CASH',
        siteLogo: (settings.siteLogo && settings.siteLogo !== '/logo.png') ? settings.siteLogo : '/brand_logo.png?v=2.1.0',
        telegramUsername: settings.telegramUsername || 'autocash_UYGHUR',
        whatsappNumber: settings.whatsappNumber || '+963 984 373 459',
        appDownloadUrl: (settings as any).appDownloadUrl || '/download/autocash.apk',
        appVersion,
        minRequiredVersion,
        forceUpdate,
        appVersionConfig: {
          ...APP_VERSION_CONFIG,
          version: appVersion,
          minRequiredVersion,
          forceUpdate,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      settings: {
        siteName: 'AUTO CASH',
        siteLogo: '/brand_logo.png?v=2.1.0',
        telegramUsername: 'autocash_UYGHUR',
        whatsappNumber: '+963 984 373 459',
        appDownloadUrl: '/download/autocash.apk',
        appVersion: APP_VERSION_CONFIG.version,
        appVersionConfig: APP_VERSION_CONFIG,
      },
    });
  }
}
