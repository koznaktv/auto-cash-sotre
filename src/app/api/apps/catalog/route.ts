import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CatalogProduct {
  id: number;
  name: string;
  amount: number | string;
  bonus?: number | string;
  price: number;
  cost: number;
  available: boolean;
  popular?: boolean;
  category: string;
  type?: 'diamonds' | 'pass';
  days?: number;
}

// In-memory cache for MaxStore products
let cachedProducts: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Dynamic Profit Margin Calculator
 * Guarantees that selling price is ALWAYS above wholesale cost with guaranteed profit.
 */
function calculateDynamicSellingPrice(cost: number): number {
  if (cost <= 0) return 0;
  let margin = 0;
  if (cost < 0.35) {
    margin = Math.max(0.045, cost * 0.18);
  } else if (cost < 1.00) {
    margin = Math.max(0.08, cost * 0.14);
  } else if (cost < 2.50) {
    margin = Math.max(0.12, cost * 0.09);
  } else if (cost < 6.00) {
    margin = Math.max(0.30, cost * 0.08);
  } else if (cost < 15.00) {
    margin = Math.max(0.60, cost * 0.065);
  } else {
    margin = Math.max(1.00, cost * 0.055);
  }
  const sellPrice = cost + margin;
  return Number(sellPrice.toFixed(2));
}

async function fetchMaxStoreProducts(): Promise<any[]> {
  const now = Date.now();
  if (cachedProducts && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedProducts;
  }

  const token = process.env.MAXSTORE_API_TOKEN || 'msk_6HAfwl0cSpjPJ0jeB25V52gC5ETq3seC29C1qlgpdvI';
  try {
    const res = await fetch('https://maxstore1.com/api/v2/products', {
      headers: {
        'api-token': token,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      if (list.length > 0) {
        cachedProducts = list;
        lastCacheTime = now;
        return list;
      }
    }
  } catch (err: any) {
    console.warn('[MaxStore Products Fetch Error]:', err?.message);
  }

  return cachedProducts || [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const app = (searchParams.get('app') || 'mobile-legends').toLowerCase().trim();

    const allProducts = await fetchMaxStoreProducts();

    if (app === 'mobile-legends' || app === 'mlbb') {
      const mlbbProds = allProducts.filter((p) => {
        const cat = (p.category_name || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('mobile legends') || name.includes('mobile legends') || name.includes('mlbb');
      });

      const globalList: CatalogProduct[] = [];
      const turkeyList: CatalogProduct[] = [];
      const specialList: CatalogProduct[] = [];
      const passesList: CatalogProduct[] = [];

      for (const p of mlbbProds) {
        const catName = p.category_name || '';
        const prodName = p.name || '';
        const cost = Number(p.price || 0);
        const sellPrice = calculateDynamicSellingPrice(cost);
        const isAvailable = p.available !== false;

        const isPass =
          prodName.toLowerCase().includes('weekly') ||
          prodName.toLowerCase().includes('monthly') ||
          prodName.toLowerCase().includes('twilight');

        // Extract diamond count (e.g. "14 - Mobile Legends Special" -> 14)
        const numMatch = prodName.match(/^(\d+)/);
        const amount = numMatch ? parseInt(numMatch[1], 10) : prodName.replace(/ - .*/, '');

        if (isPass) {
          let displayName = prodName.replace(/ - .*/, '').trim();
          let days = 7;
          if (displayName.toLowerCase().includes('monthly')) days = 30;
          if (displayName.toLowerCase().includes('twilight')) days = 30;

          if (displayName.toLowerCase() === 'weekly') displayName = 'Weekly Diamond Pass';
          if (displayName.toLowerCase().includes('weekly elite')) displayName = 'Weekly Elite Pack';

          const passItem: CatalogProduct = {
            id: p.id,
            name: displayName === 'Weekly Diamond Pass' ? 'ھەپتىلىك كارتا' : displayName,
            amount: displayName,
            price: sellPrice,
            cost,
            available: isAvailable,
            popular: true,
            category: catName,
            type: 'pass',
            days,
          };
          passesList.push(passItem);

          if (catName.includes('Turkey')) {
            turkeyList.push({
              ...passItem,
              name: 'ھەپتىلىك كارتا (تۈركىيە)',
            });
          } else if (catName.includes('Special')) {
            specialList.push({
              ...passItem,
              name: 'ھەپتىلىك كارتا (ئالاھىدە)',
            });
          } else {
            // Global
            globalList.push({
              ...passItem,
              name: 'ھەپتىلىك كارتا',
            });
          }
        } else if (catName.includes('Turkey')) {
          turkeyList.push({
            id: p.id,
            name: `${amount} ئالماس (تۈركىيە)`,
            amount,
            price: sellPrice,
            cost,
            available: isAvailable,
            popular: amount === 88 || amount === 221,
            category: catName,
            type: 'diamonds',
          });
        } else if (catName.includes('Special')) {
          specialList.push({
            id: p.id,
            name: `${amount} ئالماس (ئالاھىدە)`,
            amount,
            price: sellPrice,
            cost,
            available: isAvailable,
            popular: amount === 55 || amount === 275,
            category: catName,
            type: 'diamonds',
          });
        } else {
          // Global
          globalList.push({
            id: p.id,
            name: `${amount} ئالماس (دۇنيا)`,
            amount,
            price: sellPrice,
            cost,
            available: isAvailable,
            popular: amount === 55 || amount === 275 || amount === 706,
            category: catName,
            type: 'diamonds',
          });
        }
      }

      // Sort lists: keep Passes at the very top (index 0), then sort diamonds by price ascending
      const sortListWithPassFirst = (list: CatalogProduct[]) => {
        const passes = list.filter((p) => p.type === 'pass').sort((a, b) => a.price - b.price);
        const diamonds = list.filter((p) => p.type !== 'pass').sort((a, b) => a.price - b.price);
        return [...passes, ...diamonds];
      };

      const finalGlobal = sortListWithPassFirst(globalList);
      const finalTurkey = sortListWithPassFirst(turkeyList);
      const finalSpecial = sortListWithPassFirst(specialList);
      passesList.sort((a, b) => a.price - b.price);

      return NextResponse.json({
        ok: true,
        app: 'mobile-legends',
        updated_at: new Date().toISOString(),
        catalogs: {
          global: finalGlobal,
          turkey: finalTurkey,
          special: finalSpecial,
          passes: passesList,
        },
      });
    }

    return NextResponse.json({ ok: false, error: 'نامەلۇم ئەپ كىملىكى' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server Error' }, { status: 500 });
  }
}
