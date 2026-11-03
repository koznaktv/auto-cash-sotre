import { NextResponse } from 'next/server';
import { getSessionUser, setSessionCookie, unauthorizedResponse } from '@/lib/session';
import { generateUserApiKeyAsync, revokeUserApiKeyAsync, getUserByIdAsync, UserRecord } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function resolveUserFromRequest(req: Request): Promise<UserRecord | null> {
  // 1. Try session cookie first
  const sessionUser = await getSessionUser(req);
  if (sessionUser && !sessionUser.isBanned) return sessionUser;

  // 2. Try query param or x-user-id header
  try {
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get('userId');
    const headerUserId = req.headers.get('x-user-id');
    const uid = queryUserId || headerUserId;
    if (uid && typeof uid === 'string') {
      const user = await getUserByIdAsync(uid.trim());
      if (user && !user.isBanned) return user;
    }
  } catch {}

  // 3. Try request body for POST/DELETE
  try {
    const cloned = req.clone();
    const body = await cloned.json().catch(() => null);
    if (body?.userId && typeof body.userId === 'string') {
      const user = await getUserByIdAsync(body.userId.trim());
      if (user && !user.isBanned) return user;
    }
  } catch {}

  return null;
}

export async function GET(req: Request) {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const freshUser = (await getUserByIdAsync(user.id)) || user;
    const response = NextResponse.json({
      success: true,
      apiKey: freshUser.apiKey || null,
      apiKeyCreatedAt: freshUser.apiKeyCreatedAt || null,
      apiEnabled: freshUser.apiEnabled !== false,
      vipTier: freshUser.vipTier || 'vip1',
      balance: freshUser.balance || 0,
    });
    setSessionCookie(response, user.id);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'API كۇنۇپكىسىنى ئېلىشتا خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const isSuperAdmin = user.email?.trim().toLowerCase() === 'dronemax0996@gmail.com';
    const isAdmin = user.role === 'admin' || isSuperAdmin;
    const isVip5 = (user.vipTier || '').toLowerCase().includes('vip5');

    if (!isAdmin && !isVip5) {
      return NextResponse.json(
        { success: false, message: 'بۇ يەرنى ئېچىش ئۈچۈن VIP 5 ئەزا بولۇڭ ياكى باشقۇرغۇچى بىلەن ئالاقىلىشىڭ' },
        { status: 403 }
      );
    }

    const result = await generateUserApiKeyAsync(user.id);
    const response = NextResponse.json({
      success: true,
      apiKey: result.apiKey,
      message: 'يېڭى API Key مۇۋەپپەقىيەتلىك ھاسىل قىلىندى',
    });
    setSessionCookie(response, user.id);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'API Key ھاسىل قىلىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    await revokeUserApiKeyAsync(user.id);
    const response = NextResponse.json({
      success: true,
      message: 'API Key مۇۋەپپەقىيەتلىك ئەمەلدىن قالدۇرۇلدى',
    });
    setSessionCookie(response, user.id);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'API Key ئەمەلدىن قالدۇرۇش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
