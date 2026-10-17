import { NextResponse } from 'next/server';
import { getSessionUser, toSafeUser, unauthorizedResponse } from '@/lib/session';

// Returns the logged-in user from the session cookie (query parameters are ignored).
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
