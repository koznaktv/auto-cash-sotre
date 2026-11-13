import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CatalogProduct {
  id: number;
  name: string;
  subtext?: string;
  amount: number | string;
  bonus?: number | string;
  price: number;
  cost: number;
  available: boolean;
  popular?: boolean;
  category: string;
  type?: 'diamonds' | 'pass';
  days?: number;
  priority?: number;
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
        // Exclude products that are not available at wholesale provider
        if (p.available === false) continue;

        const catName = p.category_name || '';
        const prodName = p.name || '';
        const cost = Number(p.price || 0);
        const sellPrice = calculateDynamicSellingPrice(cost);
        const lowerName = prodName.toLowerCase();

        // 1. Weekly Diamond Pass (The authentic 210 Diamond Weekly Card)
        const isWeeklyDiamondPass =
          lowerName.startsWith('weekly -') ||
          lowerName === 'weekly' ||
          lowerName.includes('weekly diamond');
        // 2. Weekly Elite Pack (Emblem / magic dust chest pack)
        const isWeeklyElite = lowerName.includes('weekly elite');
        // 3. Monthly Elite Pack (30-day resources)
        const isMonthlyElite = lowerName.includes('monthly elite');
        // 4. Twilight Pass (Skin & Pass)
        const isTwilight = lowerName.includes('twilight');

        const isPass = isWeeklyDiamondPass || isWeeklyElite || isMonthlyElite || isTwilight;

        // Extract diamond count (e.g. "14 - Mobile Legends Special" -> 14)
        const numMatch = prodName.match(/^(\d+)/);
        const amount = numMatch ? parseInt(numMatch[1], 10) : prodName.replace(/ - .*/, '');

        if (isPass) {
          let passTitle = '';
          let passSubtext = '';
          let priority = 99;

          if (isWeeklyDiamondPass) {
            passTitle = 'ھەپتىلىك ئالماس كارتىسى';
            passSubtext = 'Weekly Diamond Pass (210💎)';
            priority = 1; // TOP PRIORITY: INDEX 0
          } else if (isWeeklyElite) {
            passTitle = 'ھەپتىلىك ئېلىت بوغچىسى';
            passSubtext = 'Weekly Elite Pack';
            priority = 2;
          } else if (isMonthlyElite) {
            passTitle = 'ئايلىق ئېلىت بوغچىسى';
            passSubtext = 'Monthly Elite Pack (30 كۈن)';
            priority = 3;
          } else if (isTwilight) {
            passTitle = 'Twilight Pass ئالىي كارتىسى';
            passSubtext = 'Twilight Pass • مەخسۇس Skin';
            priority = 4;
          }

          const basePassItem: CatalogProduct = {
            id: p.id,
            name: passTitle,
            subtext: passSubtext,
            amount: passTitle,
            price: sellPrice,
            cost,
            available: true,
            popular: priority === 1,
            category: catName,
            type: 'pass',
            priority,
            days: isMonthlyElite || isTwilight ? 30 : 7,
          };

          passesList.push(basePassItem);

          if (catName.includes('Turkey')) {
            turkeyList.push({
              ...basePassItem,
              name: `${passTitle} (تۈركىيە)`,
            });
          } else if (catName.includes('Special')) {
            specialList.push({
              ...basePassItem,
              name: `${passTitle} (ئالاھىدە)`,
            });
          } else {
            // Global
            globalList.push({
              ...basePassItem,
              name: passTitle,
            });
          }
        } else if (catName.includes('Turkey')) {
          turkeyList.push({
            id: p.id,
            name: `${amount} ئالماس (تۈركىيە)`,
            subtext: 'رەسمىي قاچىلاش',
            amount,
            price: sellPrice,
            cost,
            available: true,
            popular: amount === 88 || amount === 221,
            category: catName,
            type: 'diamonds',
            priority: 100,
          });
        } else if (catName.includes('Special')) {
          specialList.push({
            id: p.id,
            name: `${amount} ئالماس (ئالاھىدە)`,
            subtext: 'رەسمىي قاچىلاش',
            amount,
            price: sellPrice,
            cost,
            available: true,
            popular: amount === 55 || amount === 275,
            category: catName,
            type: 'diamonds',
            priority: 100,
          });
        } else {
          // Global
          globalList.push({
            id: p.id,
            name: `${amount} ئالماس (گىلوبال)`,
            subtext: 'رەسمىي قاچىلاش',
            amount,
            price: sellPrice,
            cost,
            available: true,
            popular: amount === 55 || amount === 275 || amount === 706,
            category: catName,
            type: 'diamonds',
            priority: 100,
          });
        }
      }

      // Sort lists: keep Passes at the very top sorted by priority (Weekly Diamond Pass #1), then sort diamonds by price ascending
      const sortListWithPassFirst = (list: CatalogProduct[]) => {
        const passes = list
          .filter((p) => p.type === 'pass')
          .sort((a, b) => (a.priority || 99) - (b.priority || 99));
        const diamonds = list
          .filter((p) => p.type !== 'pass')
          .sort((a, b) => a.price - b.price);
        return [...passes, ...diamonds];
      };

      const finalGlobal = sortListWithPassFirst(globalList);
      const finalTurkey = sortListWithPassFirst(turkeyList);
      const finalSpecial = sortListWithPassFirst(specialList);
      passesList.sort((a, b) => (a.priority || 99) - (b.priority || 99));

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
