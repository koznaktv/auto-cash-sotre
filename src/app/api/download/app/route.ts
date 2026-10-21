import { NextResponse } from 'next/server';
import { getSystemSettingsAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const settings = await getSystemSettingsAsync();
    const customDownloadUrl = (settings as any)?.appDownloadUrl?.trim();
    if (customDownloadUrl && customDownloadUrl.startsWith('http')) {
      return NextResponse.redirect(customDownloadUrl, { status: 302 });
    }
  } catch {}

  const host = request.headers.get('host') || 'auto-cash-sotre.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return NextResponse.redirect(`${protocol}://${host}/download/autocash.apk`, { status: 302 });
}
