import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserByEmailAsync, createUserAsync, updateUserAsync } from '@/lib/db';
import { getSupabase } from '@/lib/supabase';
import { setSessionCookie, toSafeUser } from '@/lib/session';

/**
 * Exchange a Supabase (Google) access token for an AUTO CASH session.
 * The identity comes only from the verified token, never from the request body.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Google دەلىللەش تالونى كەم' },
        { status: 401 }
      );
    }

    const sb = getSupabase();
    if (!sb) {
      return NextResponse.json(
        { success: false, message: 'Google ئارقىلىق كىرىش سەپلەنمىگەن' },
        { status: 503 }
      );
    }

    const { data: authData, error: authError } = await sb.auth.getUser(accessToken);
    const verifiedUser = authData?.user;
    // Only trust Google identities with a confirmed email: other Supabase sign-up methods
    // (e.g. email/password with confirmation off) would let anyone claim any address
    const providers: string[] = verifiedUser?.app_metadata?.providers || [verifiedUser?.app_metadata?.provider || ''];
    if (authError || !verifiedUser?.email || !verifiedUser.email_confirmed_at || !providers.includes('google')) {
      return NextResponse.json(
        { success: false, message: 'Google دەلىللەش مەغلۇپ بولدى' },
        { status: 401 }
      );
    }

    const cleanEmail = verifiedUser.email.trim().toLowerCase();
    const meta = verifiedUser.user_metadata || {};
    const name: string = meta.full_name || meta.name || cleanEmail.split('@')[0];
    const avatarUrl: string | undefined = meta.avatar_url || meta.picture || undefined;

    let user = await getUserByEmailAsync(cleanEmail);
    let isNew = false;

    if (!user) {
      // Create new user for first-time Google sign in
      user = await createUserAsync({
        name,
        email: cleanEmail,
        password: crypto.randomBytes(24).toString('hex'),
        avatarUrl,
        role: 'user',
      });
      isNew = true;
    } else if (avatarUrl && !user.avatarUrl) {
      user = (await updateUserAsync(user.id, { avatarUrl })) || user;
    }

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, message: 'بۇ ھېسابات توختىتىلغان' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ success: true, user: toSafeUser(user), isNew, provider: 'google' });
    setSessionCookie(response, user.id);
    return response;
  } catch (err: any) {
    console.error('OAuth sync error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Google ئارقىلىق كىرىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
