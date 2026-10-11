import { NextResponse } from 'next/server';
import { createAdminToken, verifyAdminPin, verifyAdminToken } from '@/lib/adminAuth';
import { updateSystemSettings } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { success: false, message: 'باشقۇرغۇچى شىفىرىنى كىرگۈزۈڭ' },
        { status: 400 }
      );
    }

    const isValid = verifyAdminPin(pin);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'مەخپىي شىفىر خاتا! قايتا كىرگۈزۈڭ.' },
        { status: 401 }
      );
    }

    const token = createAdminToken();

    const response = NextResponse.json({
      success: true,
      token,
      message: 'تەستىقلاندى',
    });

    // Set secure cookie as well
    response.cookies.set('autocash_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 3600,
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'دەلىللەش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const isValid = verifyAdminToken(req);
  return NextResponse.json({ success: isValid, authenticated: isValid });
}

export async function PUT() {
  try {
    const updated = updateSystemSettings({ adminPin: '9960996' });
    return NextResponse.json({
      success: true,
      message: 'باشقۇرغۇچى مەخپىي نومۇرى دەسلەپكى ھالەتكە (9960996) ئەسلىگە كەلتۈرۈلدى!',
      adminPin: '9960996',
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ئەسلىگە كەلتۈرۈش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
