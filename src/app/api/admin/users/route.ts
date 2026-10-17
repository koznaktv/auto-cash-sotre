import { NextResponse } from 'next/server';
import {
  getAllUsersAsync,
  updateUserAsync,
  deleteUserAsync,
  adjustUserBalanceAsync,
  getUserByIdAsync,
} from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const allUsers = await getAllUsersAsync();
    const users = allUsers.map(({ passwordHash, salt, ...rest }) => rest);
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

    if (typeof balanceDelta === 'number' && Number.isFinite(balanceDelta) && balanceDelta !== 0) {
      await adjustUserBalanceAsync(userId, Math.round(balanceDelta * 100) / 100);
    }

    if (updates && typeof updates === 'object') {
      // Balance changes go only through balanceDelta (atomic); whitelist the other editable fields
      const safeUpdates: Record<string, unknown> = {};
      if (typeof updates.name === 'string') safeUpdates.name = updates.name.trim().slice(0, 80);
      if (typeof updates.phone === 'string') safeUpdates.phone = updates.phone.trim().slice(0, 32);
      if (typeof updates.isBanned === 'boolean') safeUpdates.isBanned = updates.isBanned;
      if (['user', 'admin'].includes(updates.role)) safeUpdates.role = updates.role;
      if (['vip1', 'vip2', 'vip3', 'vip4', 'vip5'].includes(updates.vipTier)) safeUpdates.vipTier = updates.vipTier;
      await updateUserAsync(userId, safeUpdates);
    }

    const updatedUser = await getUserByIdAsync(userId);
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

    const success = await deleteUserAsync(userId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'ئىشلەتكۈچىنى ئۆچۈرۈش مەغلۇپ بولدى' }, { status: 500 });
  }
}
