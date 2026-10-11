import { NextResponse } from 'next/server';
import { getAllUsers, updateUser, deleteUser, adjustUserBalance } from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const users = getAllUsers().map(({ passwordHash, salt, ...rest }) => rest);
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'ئىشلەتكۈچىلەرنى ئېلىش مەغلۇپ بولدى' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, updates, balanceDelta } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'ئىشلەتكۈچى ID كەمچىل' }, { status: 400 });
    }

    if (typeof balanceDelta === 'number' && balanceDelta !== 0) {
      adjustUserBalance(userId, balanceDelta);
    }

    if (updates && typeof updates === 'object') {
      updateUser(userId, updates);
    }

    const updatedUser = getAllUsers().find((u) => u.id === userId);
    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'ئىشلەتكۈچى تېپىلمىدى' }, { status: 404 });
    }

    const { passwordHash, salt, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'ئىشلەتكۈچىنى ئۆزگەرتىش مەغلۇپ بولدى' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'ئىشلەتكۈچى ID كەمچىل' }, { status: 400 });
    }

    const success = deleteUser(userId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'ئىشلەتكۈچىنى ئۆچۈرۈش مەغلۇپ بولدى' }, { status: 500 });
  }
}
