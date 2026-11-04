import { NextResponse } from 'next/server';
import {
  isMaxStoreConfigured,
  getMaxStoreProfile,
  getMaxStoreBalance,
  getMaxStoreProducts,
  getMaxStoreCategories,
} from '@/lib/providers/maxstoreProvider';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'status';

  if (!isMaxStoreConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: 'MAXSTORE_API_TOKEN مۇھىت ئۆزگەرگۈچىسى .env.local ھۆججىتىگە كىرگۈزۈلمىگەن',
    });
  }

  if (action === 'products') {
    const productsRes = await getMaxStoreProducts();
    return NextResponse.json(productsRes);
  }

  if (action === 'categories') {
    const categoriesRes = await getMaxStoreCategories();
    return NextResponse.json(categoriesRes);
  }

  // Default: profile & balance check
  const [profileRes, balanceRes] = await Promise.all([
    getMaxStoreProfile(),
    getMaxStoreBalance(),
  ]);

  return NextResponse.json({
    ok: profileRes.ok || balanceRes.ok,
    configured: true,
    profile: profileRes.profile,
    balance: balanceRes.balance,
    error: profileRes.error || balanceRes.error,
  });
}
