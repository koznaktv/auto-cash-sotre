import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

let cachedCatalog: any = null;

function loadFullCatalog() {
  if (cachedCatalog) return cachedCatalog;
  try {
    const filePath = path.join(process.cwd(), 'data', 'sms_full_catalog.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      cachedCatalog = JSON.parse(content);
      return cachedCatalog;
    }
  } catch (err) {
    console.error('Failed to load sms_full_catalog.json', err);
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === '1';
    if (forceRefresh) cachedCatalog = null;

    const catalog = loadFullCatalog();
    if (catalog) {
      return NextResponse.json({
        success: true,
        totalCountries: catalog.totalCountries || catalog.countries?.length || 206,
        totalServices: catalog.totalServices || catalog.apps?.length || 2374,
        countries: catalog.countries,
        apps: catalog.apps
      });
    }

    return NextResponse.json(
      { success: false, message: 'مەۋھۇم نومۇر كاتالوگى تېپىلمىدى' },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'كۈتۈلمىگەن خاتالىق يۈز بەردى' },
      { status: 500 }
    );
  }
}
