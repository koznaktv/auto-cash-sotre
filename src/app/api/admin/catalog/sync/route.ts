import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { runCatalogSync } from '@/lib/catalog/sync';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
  }
  const result = await runCatalogSync({ trigger: 'admin' });
  return NextResponse.json(
    { success: result.ok, ...result, message: result.error },
    { status: result.ok ? 200 : result.skipped ? 409 : 502 }
  );
}
