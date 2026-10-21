import { NextResponse } from 'next/server';
import { getSystemSettingsAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSystemSettingsAsync();
    const downloadUrl = (settings as any)?.appDownloadUrl?.trim();
    if (downloadUrl && downloadUrl.startsWith('http')) {
      return NextResponse.redirect(downloadUrl, { status: 302 });
    }
  } catch {
    // fallback to local static apk
  }
  return NextResponse.redirect(new URL('/download/autocash.apk', 'https://auto-cash-sotre.vercel.app'), { status: 302 });
}
