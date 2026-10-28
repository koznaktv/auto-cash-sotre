import { NextResponse } from 'next/server';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
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
