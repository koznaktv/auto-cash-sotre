import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDynamicSellingPrice,
  getMaxStoreCatalogCached,
  saveMaxStoreCatalogCache,
} from '@/lib/providers/maxstoreProvider';

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
        saveMaxStoreCatalogCache(list);
        return list;
      }
    }
  } catch (err: any) {
    console.warn('[MaxStore Products Fetch Error]:', err?.message);
  }

  const fallbackDisk = getMaxStoreCatalogCached();
  if (fallbackDisk && fallbackDisk.length > 0) {
    cachedProducts = fallbackDisk;
    return fallbackDisk;
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

    if (app === 'pubg' || app === 'pubg-mobile') {
      const pubgProds = allProducts.filter((p) => {
        const cat = (p.category_name || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return (
          (cat.includes('pubg') || name.includes('pubg')) &&
          !cat.includes('new state') &&
          !name.includes('new state')
        );
      });

      const ucList: CatalogProduct[] = [];
      const passesList: CatalogProduct[] = [];
      const vouchersList: CatalogProduct[] = [];

      for (const p of pubgProds) {
        if (p.available === false) continue;
        const catName = p.category_name || '';
        const prodName = p.name || '';
        const cost = Number(p.price || 0);
        const sellPrice = calculateDynamicSellingPrice(cost);
        const lowerName = prodName.toLowerCase();
        const lowerCat = catName.toLowerCase();

        // 1. Digital Vouchers (Pin Codes)
        if (lowerCat.includes('voucher') || lowerName.includes('voucher')) {
          const numMatch = prodName.match(/^(\d+)/);
          const amount = numMatch ? parseInt(numMatch[1], 10) : 60;
          vouchersList.push({
            id: p.id,
            name: `${amount} UC كود (PIN)`,
            subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر',
            amount,
            price: sellPrice,
            cost,
            available: true,
            category: catName,
            type: 'diamonds',
          });
          continue;
        }

        // 2. Subscriptions & Passes (Royale Pass, Prime, etc.)
        if (
          lowerCat.includes('حزم') ||
          lowerName.includes('elite pass') ||
          lowerName.includes('برايم') ||
          lowerName.includes('prime')
        ) {
          let passTitle = prodName;
          let passSubtext = 'Royale Pass & تەمىنات';
          let priority = 99;

          if (lowerName.includes('elite pass lv1-50') || lowerName.includes('lv1-50')) {
            passTitle = 'Royale Pass Elite (LV 1-50)';
            passSubtext = 'رەسمىي RP پاس كارتىسى';
            priority = 1;
          } else if (lowerName.includes('elite pass lv1-100') || lowerName.includes('lv1-100')) {
            passTitle = 'Royale Pass Elite Plus (LV 1-100)';
            passSubtext = 'تولۇق RP پاس + قوشۇمچە تەمىنات';
            priority = 2;
          } else if (lowerName.includes('برايم بلس') || lowerName.includes('prime plus')) {
            passTitle = 'Prime Plus ئايلىق كارتىسى';
            passSubtext = 'كۈندىلىك UC + نۇرغۇن ئېتىبارلار';
            priority = 3;
          } else if (lowerName.includes('برايم') || lowerName.includes('prime')) {
            passTitle = 'Prime ئەزالىق كارتىسى';
            passSubtext = 'ئەرزان باھالىق كۈندىلىك تەڭگە';
            priority = 4;
          }

          passesList.push({
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
          });
          continue;
        }

        // 3. Direct UC Top-up (PUBG Mobile عالمي)
        if (lowerName.includes('wow coins') || lowerName.includes('(تخفيض)')) {
          continue;
        }

        const numMatch = prodName.match(/^(\d+)/);
        const amount = numMatch ? parseInt(numMatch[1], 10) : 60;

        ucList.push({
          id: p.id,
          name: `${amount} PUBG UC`,
          subtext: amount === 660 ? '🔥 Royale Pass ئېچىشقا ماس' : 'بىۋاسىتە كىملىككە (UID)',
          amount,
          price: sellPrice,
          cost,
          available: true,
          popular: amount === 60 || amount === 325 || amount === 660 || amount === 1800,
          category: catName,
          type: 'diamonds',
        });
      }

      // Sort UC by amount ascending
      ucList.sort((a, b) => Number(a.amount) - Number(b.amount));
      // Sort Passes by priority
      passesList.sort((a, b) => (a.priority || 99) - (b.priority || 99));
      // Sort vouchers by amount ascending
      vouchersList.sort((a, b) => Number(a.amount) - Number(b.amount));

      // Reliable fallbacks if provider API is temporarily unreachable or empty
      if (ucList.length === 0) {
        ucList.push(
          { id: 60, name: '60 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 60, price: 1.15, cost: 0.94, available: true, popular: true, category: 'PUBG Mobile عالمي', type: 'diamonds' },
          { id: 54, name: '325 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 325, price: 5.25, cost: 4.68, available: true, popular: true, category: 'PUBG Mobile عالمي', type: 'diamonds' },
          { id: 62, name: '660 PUBG UC', subtext: '🔥 Royale Pass ئېچىشقا ماس', amount: 660, price: 10.35, cost: 9.36, available: true, popular: true, category: 'PUBG Mobile عالمي', type: 'diamonds' },
          { id: 55, name: '1800 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 1800, price: 25.50, cost: 23.40, available: true, popular: true, category: 'PUBG Mobile عالمي', type: 'diamonds' },
          { id: 56, name: '3850 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 3850, price: 50.80, cost: 46.80, available: true, popular: false, category: 'PUBG Mobile عالمي', type: 'diamonds' },
          { id: 57, name: '8100 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 8100, price: 99.90, cost: 93.60, available: true, popular: false, category: 'PUBG Mobile عالمي', type: 'diamonds' },
          { id: 59, name: '16200 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 16200, price: 198.00, cost: 187.20, available: true, popular: false, category: 'PUBG Mobile عالمي', type: 'diamonds' }
        );
      }
      if (passesList.length === 0) {
        passesList.push(
          { id: 343, name: 'Royale Pass Elite (LV 1-50)', subtext: 'رەسمىي RP پاس كارتىسى', amount: 'Royale Pass Elite', price: 10.35, cost: 9.40, available: true, popular: true, category: 'PUBG Mobile', type: 'pass', priority: 1 },
          { id: 344, name: 'Royale Pass Elite Plus (LV 1-100)', subtext: 'تولۇق RP پاس + قوشۇمچە تەمىنات', amount: 'Royale Pass Elite Plus', price: 25.50, cost: 23.50, available: true, popular: false, category: 'PUBG Mobile', type: 'pass', priority: 2 },
          { id: 341, name: 'Prime Plus ئايلىق كارتىسى', subtext: 'كۈندىلىك UC + نۇرغۇن ئېتىبارلار', amount: 'Prime Plus', price: 9.80, cost: 8.90, available: true, popular: false, category: 'PUBG Mobile', type: 'pass', priority: 3 },
          { id: 340, name: 'Prime ئەزالىق كارتىسى', subtext: 'ئەرزان باھالىق كۈندىلىك تەڭگە', amount: 'Prime', price: 1.25, cost: 0.99, available: true, popular: false, category: 'PUBG Mobile', type: 'pass', priority: 4 }
        );
      }
      if (vouchersList.length === 0) {
        vouchersList.push(
          { id: 444, name: '60 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', amount: 60, price: 1.15, cost: 0.93, available: true, popular: false, category: 'PUBG MOBILE UC Vouchers', type: 'diamonds' },
          { id: 445, name: '660 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', amount: 660, price: 10.30, cost: 9.26, available: true, popular: true, category: 'PUBG MOBILE UC Vouchers', type: 'diamonds' },
          { id: 446, name: '1800 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', amount: 1800, price: 25.30, cost: 23.20, available: true, popular: false, category: 'PUBG MOBILE UC Vouchers', type: 'diamonds' }
        );
      }

      return NextResponse.json({
        ok: true,
        app: 'pubg-mobile',
        updated_at: new Date().toISOString(),
        catalogs: {
          uc: ucList,
          passes: passesList,
          vouchers: vouchersList,
        },
      });
    }

    if (app === 'honor-of-kings' || app === 'hok') {
      const hokProds = allProducts.filter((p) => {
        const cat = (p.category_name || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('honor of kings') || name.includes('honor of kings') || name.includes('hok');
      });

      const tokensList: CatalogProduct[] = [];
      const bundlesList: CatalogProduct[] = [];

      for (const p of hokProds) {
        if (p.available === false) continue;
        const catName = p.category_name || '';
        const prodName = p.name || '';
        const cost = Number(p.price || 0);
        const sellPrice = calculateDynamicSellingPrice(cost);
        const lowerName = prodName.toLowerCase();

        const isBundle =
          lowerName.includes('weekly') ||
          lowerName.includes('bag') ||
          lowerName.includes('pack') ||
          lowerName.includes('zilong') ||
          lowerName.includes('rebate') ||
          lowerName.includes('card');

        if (isBundle) {
          let title = prodName.replace(/ - .*/, '').trim();
          let sub = 'رەسمىي ئالاھىدە تەمىنات';
          if (lowerName.includes('weekly card plus')) {
            title = 'Weekly Card Plus (ھەپتىلىك پىلۇس)';
            sub = '280 توكېن + ئالىي تەمىنات';
          } else if (lowerName.includes('weekly card')) {
            title = 'Weekly Card (ھەپتىلىك كارتىسى)';
            sub = '100 توكېن + كۈندىلىك مۇكاپات';
          } else if (lowerName.includes('lucky bag')) {
            title = 'Double Token Lucky Bag';
            sub = 'قوش ھەسسە تەلىي بوغچىسى (60+20)';
          } else if (lowerName.includes('premium purchase rebate')) {
            title = 'Premium Purchase Rebate Pack';
            sub = 'ئالىي قايتۇرما بوغچىسى';
          } else if (lowerName.includes('standard purchase rebate')) {
            title = 'Standard Purchase Rebate Pack';
            sub = 'ئۆلچەملىك قايتۇرما بوغچىسى';
          } else if (lowerName.includes('honor point')) {
            title = 'Honor Point Value Pack';
            sub = 'شان-شەرەپ نومۇرى قىممەت بوغچىسى';
          } else if (lowerName.includes('zilong')) {
            title = 'Infernal Shadow Zilong Pack';
            sub = 'زىلوڭ تېرىسى بوغچىسى';
          }

          bundlesList.push({
            id: p.id,
            name: title,
            subtext: sub,
            amount: title,
            price: sellPrice,
            cost,
            available: true,
            popular: lowerName.includes('weekly'),
            category: catName,
            type: 'pass',
          });
          continue;
        }

        const numMatch = prodName.match(/^(\d+)/);
        const amount = numMatch ? parseInt(numMatch[1], 10) : 80;

        tokensList.push({
          id: p.id,
          name: `${amount} Tokens`,
          subtext: 'بىۋاسىتە كىملىككە (UID)',
          amount,
          price: sellPrice,
          cost,
          available: true,
          popular: amount === 80 || amount === 240 || amount === 830,
          category: catName,
          type: 'diamonds',
        });
      }

      tokensList.sort((a, b) => Number(a.amount) - Number(b.amount));

      if (tokensList.length === 0) {
        tokensList.push(
          { id: 758, name: '16 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 16, price: 0.25, cost: 0.18, available: true, category: 'Honor of Kings', type: 'diamonds' },
          { id: 764, name: '80 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 80, price: 1.05, cost: 0.88, available: true, popular: true, category: 'Honor of Kings', type: 'diamonds' },
          { id: 759, name: '240 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 240, price: 2.95, cost: 2.66, available: true, popular: true, category: 'Honor of Kings', type: 'diamonds' },
          { id: 761, name: '400 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 400, price: 4.85, cost: 4.44, available: true, category: 'Honor of Kings', type: 'diamonds' },
          { id: 763, name: '560 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 560, price: 6.75, cost: 6.21, available: true, category: 'Honor of Kings', type: 'diamonds' },
          { id: 765, name: '830 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 830, price: 9.65, cost: 8.88, available: true, popular: true, category: 'Honor of Kings', type: 'diamonds' },
          { id: 757, name: '1245 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 1245, price: 14.35, cost: 13.32, available: true, category: 'Honor of Kings', type: 'diamonds' },
          { id: 760, name: '2508 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 2508, price: 28.50, cost: 26.66, available: true, category: 'Honor of Kings', type: 'diamonds' },
          { id: 762, name: '4180 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 4180, price: 47.50, cost: 44.45, available: true, category: 'Honor of Kings', type: 'diamonds' },
          { id: 766, name: '8360 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', amount: 8360, price: 94.90, cost: 88.91, available: true, category: 'Honor of Kings', type: 'diamonds' }
        );
      }
      if (bundlesList.length === 0) {
        bundlesList.push(
          { id: 772, name: 'Weekly Card (ھەپتىلىك كارتىسى)', subtext: '100 توكېن + كۈندىلىك مۇكاپات', amount: 'Weekly Card', price: 1.15, cost: 0.98, available: true, popular: true, category: 'Honor of Kings', type: 'pass' },
          { id: 773, name: 'Weekly Card Plus (ھەپتىلىك پىلۇس)', subtext: '280 توكېن + ئالىي تەمىنات', amount: 'Weekly Card Plus', price: 3.15, cost: 2.80, available: true, category: 'Honor of Kings', type: 'pass' },
          { id: 770, name: 'Premium Purchase Rebate Pack', subtext: 'ئالىي قايتۇرما بوغچىسى', amount: 'Premium Rebate', price: 1.25, cost: 1.10, available: true, category: 'Honor of Kings', type: 'pass' },
          { id: 767, name: 'Double Token Lucky Bag', subtext: 'قوش ھەسسە تەلىي بوغچىسى (60+20)', amount: 'Lucky Bag', price: 0.35, cost: 0.28, available: true, category: 'Honor of Kings', type: 'pass' },
          { id: 768, name: 'Honor Point Value Pack', subtext: 'شان-شەرەپ نومۇرى قىممەت بوغچىسى', amount: 'Honor Point', price: 0.35, cost: 0.28, available: true, category: 'Honor of Kings', type: 'pass' },
          { id: 771, name: 'Standard Purchase Rebate Pack', subtext: 'ئۆلچەملىك قايتۇرما بوغچىسى', amount: 'Standard Rebate', price: 0.35, cost: 0.28, available: true, category: 'Honor of Kings', type: 'pass' }
        );
      }

      return NextResponse.json({
        ok: true,
        app: 'honor-of-kings',
        updated_at: new Date().toISOString(),
        catalogs: {
          tokens: tokensList,
          bundles: bundlesList,
        },
      });
    }

    return NextResponse.json({ ok: false, error: 'نامەلۇم ئەپ كىملىكى' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server Error' }, { status: 500 });
  }
}
