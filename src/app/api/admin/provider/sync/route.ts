import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getProviderMonitorState, runProviderAutoMonitor } from '@/lib/providerMonitorService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }
    const state = getProviderMonitorState();
    return NextResponse.json({ success: true, state });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Failed to load monitor state' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }
    const result = await runProviderAutoMonitor({ notifyAdmin: true, forceNotify: true });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Sync failed' }, { status: 500 });
  }
}
