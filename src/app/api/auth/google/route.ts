import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getUserByEmailAsync,
  createUserAsync,
  updateUserAsync,
  updateUserPasswordAsync,
  verifyPassword,
} from '@/lib/db';
import { setSessionCookie, toSafeUser, getSessionUser, unauthorizedResponse } from '@/lib/session';
import { notifyNewUser } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();
    return NextResponse.json({ success: true, user: toSafeUser(user) });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ئىشلەتكۈچى ئۇچۇرىنى ئېلىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, credential, email, password, name } = body;

    // 1. Google Official One-Tap / OAuth Credential (JWT ID Token)
    if (credential || mode === 'google_credential') {
      const idToken = String(credential || '').trim();
      if (!idToken) {
        return NextResponse.json(
          { success: false, message: 'Google تالونى تېپىلمىدى' },
          { status: 400 }
        );
      }

      // Verify token with Google's public tokeninfo endpoint
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (!googleRes.ok) {
        return NextResponse.json(
          { success: false, message: 'Google دەلىللەش تالونى كۈچكە ئىگە ئەمەس ياكى ۋاقتى ئۆتكەن' },
          { status: 401 }
        );
      }

      const payload = await googleRes.json();
      const verifiedEmail = String(payload.email || '').trim().toLowerCase();
      const emailVerified = payload.email_verified === 'true' || payload.email_verified === true;

      if (!verifiedEmail || !emailVerified) {
        return NextResponse.json(
          { success: false, message: 'Google ئېلخەت ئادرېسى دەلىللەنمىگەن' },
          { status: 400 }
        );
      }

      const isSuperAdmin = verifiedEmail === 'dronemax0996@gmail.com';
      const userName = payload.name || payload.given_name || verifiedEmail.split('@')[0];
      const avatarUrl = payload.picture || undefined;

      let user = await getUserByEmailAsync(verifiedEmail);
      let isNew = false;

      if (!user) {
        user = await createUserAsync({
          name: userName,
          email: verifiedEmail,
          password: crypto.randomBytes(20).toString('hex'),
          avatarUrl,
          role: isSuperAdmin ? 'admin' : 'user',
        });
        isNew = true;
        notifyNewUser({ id: user.id, name: user.name, email: user.email }).catch(() => {});
      } else {
        const updates: Record<string, any> = {};
        if (avatarUrl && user.avatarUrl !== avatarUrl) updates.avatarUrl = avatarUrl;
        if (isSuperAdmin && user.role !== 'admin') updates.role = 'admin';
        if (Object.keys(updates).length > 0) {
          user = (await updateUserAsync(user.id, updates)) || user;
        }
      }

      if (user.isBanned) {
        return NextResponse.json(
          { success: false, message: 'بۇ ھېسابات توختىتىلغان' },
          { status: 403 }
        );
      }

      const response = NextResponse.json({
        success: true,
        user: toSafeUser(user),
        isNew,
        provider: 'google',
        message: 'Google ئارقىلىق مۇۋەپپەقىيەتلىك كىردىڭىز',
      });
      setSessionCookie(response, user.id);
      return response;
    }

    // 2. Direct 1-Click Passwordless Gmail Login / Instant Registration Flow
    const rawEmail = String(email || '').trim().toLowerCase();
    const cleanEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@gmail.com`;

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: 'توغرا بولغان Gmail ئادرېسى كىرگۈزۈڭ (مەسىلەن: name@gmail.com)' },
        { status: 400 }
      );
    }

    const isSuperAdmin = cleanEmail === 'dronemax0996@gmail.com';
    let user = await getUserByEmailAsync(cleanEmail);
    let isNew = false;

    if (!user) {
      // Automatic instant passwordless registration for new Gmail user
      const defaultName = String(name || '').trim() || cleanEmail.split('@')[0];
      user = await createUserAsync({
        name: defaultName,
        email: cleanEmail,
        password: crypto.randomBytes(16).toString('hex'),
        role: isSuperAdmin ? 'admin' : 'user',
      });
      isNew = true;
      notifyNewUser({ id: user.id, name: user.name, email: user.email }).catch(() => {});
    } else {
      if (isSuperAdmin && user.role !== 'admin') {
        user = (await updateUserAsync(user.id, { role: 'admin' })) || user;
      }
    }

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, message: 'بۇ ھېسابات توختىتىلغان' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: toSafeUser(user),
      isNew,
      provider: 'gmail',
      message: isNew ? 'Gmail بىلەن يېڭى ھېسابات 1 چېكىپلا ئېچىلدى!' : 'Gmail ئارقىلىق 1 چېكىپلا كىردىڭىز!',
    });
    setSessionCookie(response, user.id);
    return response;
  } catch (err: any) {
    console.error('[Google / Gmail Auth Error]:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Gmail ئارقىلىق كىرىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
