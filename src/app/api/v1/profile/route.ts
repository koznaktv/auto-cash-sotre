import { NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/apiKeyAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { user, vipDiscountPercent, errorResponse } = await authenticateApiKey(req);
  if (errorResponse) return errorResponse;
  if (!user) {
    return NextResponse.json({ success: false, message: 'ئىناۋەتسىز API كۇنۇپكىسى' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      balance: user.balance,
      currency: 'USD',
      vipTier: user.vipTier,
      vipDiscountPercent: vipDiscountPercent,
      totalSpent: user.totalSpent,
      createdAt: user.createdAt,
    },
  });
}
