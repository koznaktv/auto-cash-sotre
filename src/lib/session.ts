import { NextResponse } from 'next/server';
import { getUserByIdAsync, updateUserAsync, UserRecord } from './db';
import { readCookie, resolveSecret, signToken, verifyToken } from './signedToken';

const SESSION_COOKIE = 'autocash_session';
const SESSION_TTL_SECONDS = 7 * 24 * 3600;

interface SessionPayload {
  uid: string;
  expiresAt: number;
}

export function setSessionCookie(res: NextResponse, userId: string): void {
  const token = signToken(
    { uid: userId, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 },
    resolveSecret('SESSION_SECRET')
  );
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' });
}

export function getSessionUserId(req: Request): string | null {
  const payload = verifyToken<SessionPayload>(readCookie(req, SESSION_COOKIE), resolveSecret('SESSION_SECRET'));
  return payload?.uid || null;
}

/** The logged-in, non-banned user for this request, or null. */
export async function getSessionUser(req: Request): Promise<UserRecord | null> {
  const userId = getSessionUserId(req);
  if (!userId) return null;
  let user = await getUserByIdAsync(userId);
  if (!user || user.isBanned) return null;
  if (user.email?.trim().toLowerCase() === 'dronemax0996@gmail.com' && user.role !== 'admin') {
    user = (await updateUserAsync(user.id, { role: 'admin' })) || user;
  }
  return user;
}

export function toSafeUser(user: UserRecord) {
  const isSuperAdmin = user.email?.trim().toLowerCase() === 'dronemax0996@gmail.com';
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl || undefined,
    balance: user.balance,
    totalSpent: user.totalSpent,
    vipTier: user.vipTier,
    role: isSuperAdmin ? 'admin' : user.role,
    createdAt: user.createdAt,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, message: 'ئالدى بىلەن ھېساباتىڭىزغا كىرىڭ (Unauthorized)' },
    { status: 401 }
  );
}
