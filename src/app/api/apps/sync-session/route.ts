import { NextRequest, NextResponse } from 'next/server';
import { createSyncSession, getSyncSession } from '@/lib/syncSessions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const appId = body.app_id || 'pubg';
    const result = await createSyncSession(appId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'خاتالىق كۆرۈلدى' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Token كىرگۈزۈلمىدى' }, { status: 400 });
    }

    const session = await getSyncSession(token);
    if (!session) {
      return NextResponse.json({ ok: false, status: 'expired' });
    }

    if (session.status === 'verified' && session.verifiedUser) {
      return NextResponse.json({
        ok: true,
        status: 'verified',
        session: session.verifiedUser,
      });
    }

    return NextResponse.json({
      ok: true,
      status: 'pending',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
