import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';

export const dynamic = 'force-dynamic';

let cachedServiceCountries: Record<string, any[]> | null = null;

function loadServiceCountries() {
  if (cachedServiceCountries) return cachedServiceCountries;
  try {
    const filePath = path.join(process.cwd(), 'data', 'sms_service_countries.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      cachedServiceCountries = JSON.parse(content);
      return cachedServiceCountries;
    }
  } catch (err) {
    console.error('Failed to load sms_service_countries.json', err);
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get('service')?.toLowerCase().trim();

    if (service) {
      const map = loadServiceCountries();
      if (map && map[service]) {
        return NextResponse.json({
          success: true,
          service,
          count: map[service].length,
          countries: map[service]
        });
      }

      return NextResponse.json({
        success: true,
        service,
        count: 0,
        countries: []
      });
    }

    // Default: return all 206 countries
    const refresh = searchParams.get('refresh') === '1';
    const countries = await phonecashProvider.getCountries(refresh);
    return NextResponse.json({ success: true, count: countries.length, countries });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'دۆلەتلەر تىزىملىكىنى يۈكلەش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
