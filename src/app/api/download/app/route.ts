import { NextResponse } from 'next/server';
import { getSystemSettingsAsync } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSystemSettingsAsync();
    const downloadUrl = (settings as any)?.appDownloadUrl?.trim();
    if (downloadUrl && downloadUrl.startsWith('http')) {
      return NextResponse.redirect(downloadUrl, { status: 302 });
    }
  } catch {
    // fallback
  }

  // Check if local autocash.apk file exists
  try {
    const localApkPath = path.join(process.cwd(), 'public', 'download', 'autocash.apk');
    if (fs.existsSync(localApkPath)) {
      return NextResponse.redirect(new URL('/download/autocash.apk', 'https://auto-cash-sotre.vercel.app'), { status: 302 });
    }
  } catch {}

  // Fallback to official Telegram channel so users NEVER get a 404 error
  return NextResponse.redirect('https://t.me/autocash_UYGHUR', { status: 302 });
}
