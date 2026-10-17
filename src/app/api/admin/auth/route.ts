import { NextResponse } from 'next/server';
import {
  createAdminToken,
  verifyAdminPin,
  verifyAdminToken,
  getClientIp,
  isAdminLoginLocked,
  recordAdminLoginFailure,
  clearAdminLoginFailures,
} from '@/lib/adminAuth';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isAdminLoginLocked(ip)) {
      return NextResponse.json(
        { success: false, message: 'خاتا سىناق بەك كۆپ بولدى. 15 مىنۇتتىن كېيىن قايتا سىناڭ.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { pin } = body;

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json(
        { success: false, message: 'باشقۇرغۇچى شىفىرىنى كىرگۈزۈڭ' },
        { status: 400 }
      );
    }

    const isValid = await verifyAdminPin(pin);
    if (!isValid) {
      recordAdminLoginFailure(ip);
      return NextResponse.json(
        { success: false, message: 'مەخپىي شىفىر خاتا! قايتا كىرگۈزۈڭ.' },
        { status: 401 }
      );
    }

    clearAdminLoginFailures(ip);
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
      sameSite: 'strict',
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

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('autocash_admin_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return response;
}
