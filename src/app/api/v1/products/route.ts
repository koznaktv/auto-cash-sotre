import { NextResponse } from 'next/server';
import { authenticateApiKey, applyVipDiscount } from '@/lib/apiKeyAuth';
import { getCatalogServices } from '@/lib/catalog/storefront';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { user, vipDiscountPercent, errorResponse } = await authenticateApiKey(req);
  if (errorResponse) return errorResponse;
  if (!user) {
    return NextResponse.json({ success: false, message: 'ئىناۋەتسىز API كۇنۇپكىسى' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const categoryFilter = url.searchParams.get('category')?.toLowerCase().trim();
    const queryFilter = url.searchParams.get('q')?.toLowerCase().trim();

    const services = await getCatalogServices();

    const filtered = services.filter((s) => {
      if (s.published === false) return false;
      if (categoryFilter && s.category?.toLowerCase() !== categoryFilter) return false;
      if (queryFilter) {
        const matchName = s.name.toLowerCase().includes(queryFilter);
        const matchDesc = (s.description || '').toLowerCase().includes(queryFilter);
        const matchPkg = s.packages.some((p) => p.title.toLowerCase().includes(queryFilter));
        if (!matchName && !matchDesc && !matchPkg) return false;
      }
      return true;
    });

    const products = filtered.map((s) => ({
      serviceId: s.id,
      name: s.name,
      category: s.category,
      inputLabel: s.inputLabel || (s.category === 'games' ? 'ئويۇنچى ID (Player ID)' : 'ھېسابات نومۇرى'),
      inputPlaceholder: s.inputPlaceholder || '',
      requiresInput: Boolean(s.inputLabel || s.category === 'games'),
      packages: s.packages.map((p) => {
        const retailPrice = Number(p.price);
        const resellerPrice = applyVipDiscount(retailPrice, user.vipTier);
        return {
          packageId: p.id,
          title: p.title,
          retailPrice,
          price: resellerPrice,
          currency: 'USD',
          vipDiscountPercent,
        };
      }),
    }));

    return NextResponse.json({
      success: true,
      vipTier: user.vipTier,
      vipDiscountPercent,
      count: products.length,
      products,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'مەھسۇلاتلارنى ئېلىشتا خاتالىق كۆرۈلدى' },
      { status: 500 }
    );
  }
}
