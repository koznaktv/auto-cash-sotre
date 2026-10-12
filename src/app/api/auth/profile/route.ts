import { NextResponse } from 'next/server';
import {
  getUserByEmailAsync,
  getUserByIdAsync,
  updateUserAsync,
  updateUserPassword,
  verifyPassword,
} from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userEmail, name, phone, currentPassword, newPassword } = body;

    const user = userId ? await getUserByIdAsync(userId) : userEmail ? await getUserByEmailAsync(userEmail) : null;
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ئىشلەتكۈچى تېپىلمىدى' },
        { status: 404 }
      );
    }

    // 1. Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: 'ھازىرقى كونا پارولنى كىرگۈزۈڭ' },
          { status: 400 }
        );
      }

      const isCurrentValid = verifyPassword(currentPassword, user.passwordHash, user.salt);
      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, message: 'ھازىرقى كونا پارول خاتا' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'يېڭى پارول كەم دېگەندە 6 ھەرپ بولسۇن' },
          { status: 400 }
        );
      }

      updateUserPassword(user.id, newPassword);
    }

    // 2. Profile Info change
    const { avatarUrl } = body;
    const updatePayload: { name?: string; phone?: string; avatarUrl?: string } = {};
    if (name && name.trim()) updatePayload.name = name.trim();
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (avatarUrl !== undefined) updatePayload.avatarUrl = avatarUrl;

    const updatedUser = (await updateUserAsync(user.id, updatePayload)) || user;

    const safeUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl || undefined,
      balance: updatedUser.balance,
      totalSpent: updatedUser.totalSpent,
      vipTier: updatedUser.vipTier,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ئۇچۇرنى يېڭىلاش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
