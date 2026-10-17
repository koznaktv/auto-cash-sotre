import { NextResponse } from 'next/server';
import { updateUserAsync, updateUserPasswordAsync, verifyPassword } from '@/lib/db';
import { getSessionUser, toSafeUser, unauthorizedResponse } from '@/lib/session';

const MAX_AVATAR_LENGTH = 300_000; // ~220KB image as a data URL

function isAllowedAvatar(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value === '') return true;
  if (value.length > MAX_AVATAR_LENGTH) return false;
  return /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value) || /^https:\/\//i.test(value);
}

export async function POST(req: Request) {
  try {
    // The user is always the session owner; userId/userEmail in the body are ignored
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { name, phone, currentPassword, newPassword, avatarUrl } = body;

    // 1. Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: 'ھازىرقى كونا پارولنى كىرگۈزۈڭ' },
          { status: 400 }
        );
      }

      if (!verifyPassword(String(currentPassword), user.passwordHash, user.salt)) {
        return NextResponse.json(
          { success: false, message: 'ھازىرقى كونا پارول خاتا' },
          { status: 400 }
        );
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'يېڭى پارول كەم دېگەندە 6 ھەرپ بولسۇن' },
          { status: 400 }
        );
      }

      const changed = await updateUserPasswordAsync(user.id, newPassword);
      if (!changed) {
        return NextResponse.json(
          { success: false, message: 'پارول يېڭىلانمىدى' },
          { status: 500 }
        );
      }
    }

    // 2. Profile Info change
    if (avatarUrl !== undefined && !isAllowedAvatar(avatarUrl)) {
      return NextResponse.json(
        { success: false, message: 'رەسىم فورماتى خاتا ياكى بەك چوڭ' },
        { status: 400 }
      );
    }

    const updatePayload: { name?: string; phone?: string; avatarUrl?: string } = {};
    if (typeof name === 'string' && name.trim()) updatePayload.name = name.trim().slice(0, 80);
    if (typeof phone === 'string') updatePayload.phone = phone.trim().slice(0, 32);
    if (avatarUrl !== undefined) updatePayload.avatarUrl = avatarUrl;

    const updatedUser = (await updateUserAsync(user.id, updatePayload)) || user;
    return NextResponse.json({ success: true, user: toSafeUser(updatedUser) });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ئۇچۇرنى يېڭىلاش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
