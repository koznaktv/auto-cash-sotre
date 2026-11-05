import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appParam = (searchParams.get('app') || 'autocash').toLowerCase();

    let apkFilename = 'autocash.apk';
    let downloadFilename = 'MAX-BAZAR.apk';

    if (appParam.includes('pubg')) {
      apkFilename = 'pubg-maxbazar.apk';
      downloadFilename = 'PUBG-MAXBAZAR.apk';
    } else if (appParam.includes('hok') || appParam.includes('kings')) {
      apkFilename = 'hok-maxbazar.apk';
      downloadFilename = 'HOK-MAXBAZAR.apk';
    }

    const apkPath = path.join(process.cwd(), 'public', 'download', apkFilename);
    const fallbackPath = path.join(process.cwd(), 'public', 'download', 'autocash.apk');

    const finalPath = fs.existsSync(apkPath) ? apkPath : fallbackPath;

    if (fs.existsSync(finalPath)) {
      const fileBuffer = fs.readFileSync(finalPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': `attachment; filename="${downloadFilename}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
  } catch (err) {
    console.error('Error in download route:', err);
  }

  return NextResponse.redirect('/download/autocash.apk', { status: 302 });
}
