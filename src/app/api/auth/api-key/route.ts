import { NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/session';
import { generateUserApiKeyAsync, revokeUserApiKeyAsync, getUserByIdAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const freshUser = await getUserByIdAsync(user.id);
    return NextResponse.json({
      success: true,
      apiKey: freshUser?.apiKey || null,
      apiKeyCreatedAt: freshUser?.apiKeyCreatedAt || null,
      apiEnabled: freshUser?.apiEnabled !== false,
      vipTier: freshUser?.vipTier || 'vip1',
      balance: freshUser?.balance || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'API كۇنۇپكىسىنى ئېلىشتا خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const result = await generateUserApiKeyAsync(user.id);
    return NextResponse.json({
      success: true,
      apiKey: result.apiKey,
      message: 'يېڭى API Key مۇۋەپپەقىيەتلىك ھاسىل قىلىندى',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'API Key ھاسىل قىلىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    await revokeUserApiKeyAsync(user.id);
    return NextResponse.json({
      success: true,
      message: 'API Key مۇۋەپپەقىيەتلىك ئەمەلدىن قالدۇرۇلدى',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'API Key ئەمەلدىن قالدۇرۇش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
