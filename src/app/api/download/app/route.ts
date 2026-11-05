import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appParam = (searchParams.get('app') || 'autocash').toLowerCase();

    let targetFile = 'autocash.apk';

    if (appParam.includes('pubg')) {
      targetFile = 'pubg-maxbazar.apk';
    } else if (appParam.includes('hok') || appParam.includes('kings')) {
      targetFile = 'hok-maxbazar.apk';
    }

    const redirectUrl = new URL(`/download/${targetFile}`, request.url);
    return NextResponse.redirect(redirectUrl, {
      status: 307,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Error in download redirect route:', err);
    return NextResponse.redirect(new URL('/download/autocash.apk', request.url), { status: 307 });
  }
}
