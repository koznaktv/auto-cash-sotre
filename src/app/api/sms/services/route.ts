import { NextResponse } from 'next/server';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = parseInt(searchParams.get('countryId') || '', 10);
    const refresh = searchParams.get('refresh') === '1';

    if (isNaN(countryId)) {
      return NextResponse.json(
        { success: false, message: 'دۆلەت كودى (countryId) تەمىنلەنمىدى' },
        { status: 400 }
      );
    }

    const services = await phonecashProvider.getServices(countryId, refresh);
    return NextResponse.json({ success: true, countryId, count: services.length, services });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'مۇلازىمەتلەر تىزىملىكىنى يۈكلەش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
