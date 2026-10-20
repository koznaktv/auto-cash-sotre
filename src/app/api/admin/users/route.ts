import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getAllUsersAsync,
  updateUserAsync,
  deleteUserAsync,
  adjustUserBalanceAsync,
  getUserByIdAsync,
  getUserByEmailAsync,
  createUserAsync,
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
      if (['user', 'admin'].includes(updates.role)) {
        // Protect super admin
        const targetUser = await getUserByIdAsync(userId);
        if (targetUser?.email?.trim().toLowerCase() === 'dronemax0996@gmail.com' && updates.role === 'user') {
          safeUpdates.role = 'admin';
        } else {
          safeUpdates.role = updates.role;
        }
      }
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


export async function POST(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ success: false, message: 'رۇخسەت يوق (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    const { email, role = 'admin' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'ئېلخەت ئادرېسى كەمچىل' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await getUserByEmailAsync(cleanEmail);

    if (user) {
      const isOwner = cleanEmail === 'dronemax0996@gmail.com';
      const finalRole = isOwner ? 'admin' : (role === 'admin' ? 'admin' : 'user');
      await updateUserAsync(user.id, { role: finalRole });
      const updated = await getUserByIdAsync(user.id);
      const { passwordHash, salt, ...safeUser } = updated!;
      return NextResponse.json({
        success: true,
        user: safeUser,
        message: finalRole === 'admin' ? `«${user.name}» گە باشقۇرغۇچى كىرىش ھوقۇقى بېرىلدى!` : `«${user.name}» نىڭ باشقۇرغۇچىلىق ھوقۇقى تاقالدى!`,
      });
    } else {
      // Pre-create user with admin role so when they log in they have admin
      const newUser = await createUserAsync({
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        password: crypto.randomBytes(24).toString('hex'),
        role: 'admin',
      });
      const { passwordHash, salt, ...safeUser } = newUser;
      return NextResponse.json({
        success: true,
        user: safeUser,
        message: `يېڭى باشقۇرغۇچى قوشۇلدى (${cleanEmail})`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'مەشغۇلات مەغلۇپ بولدى' }, { status: 500 });
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
