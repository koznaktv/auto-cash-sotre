import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getMaxStoreProducts } from '@/lib/providers/maxstoreProvider';

export const dynamic = 'force-dynamic';

// In-memory cache for fast response times
let cachedProducts: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function classifyMaxStoreProduct(p: any): string {
  const cat_name = (p.category_name || p.categoryName || '').toLowerCase();
  const p_name = (p.name || p.product_name || '').toLowerCase();

  // 1. Telegram
  if (
    cat_name.includes('تيليجرام') ||
    cat_name.includes('telegram') ||
    cat_name.includes('نجوم تيليجرام') ||
    cat_name.includes('stars') ||
    p_name.includes('تيليجرام') ||
    p_name.includes('telegram')
  ) {
    if (cat_name.includes('أرقام') || cat_name.includes('ارقام') || cat_name.includes('number')) {
      return 'numbers';
    }
    return 'telegram';
  }

  // 2. Virtual Numbers
  if (
    cat_name.includes('أرقام') ||
    cat_name.includes('ارقام') ||
    cat_name.includes('virtual number') ||
    p_name.includes('أرقام') ||
    p_name.includes('ارقام') ||
    cat_name.includes('تطبيق الارقام')
  ) {
    return 'numbers';
  }

  // 3. Credit (Syriatel, MTN, Turkcell, etc.)
  if (
    cat_name.includes('syriatel') ||
    cat_name.includes('سيرياتيل') ||
    cat_name.includes('mtn') ||
    cat_name.includes('رصيد mtn') ||
    cat_name.includes('ام تي ان') ||
    p_name.includes('syriatel') ||
    p_name.includes('سيرياتيل') ||
    p_name.includes('mtn') ||
    p_name.includes('ليرة') ||
    p_name.includes('syr') ||
    cat_name.includes('turkcell') ||
    cat_name.includes('turk telecom') ||
    cat_name.includes('alfa') ||
    cat_name.includes('validity days')
  ) {
    return 'credit';
  }

  // 4. Games
  const gameKeywords = [
    'pubg',
    'freefire',
    'free fire',
    'roblox',
    'valorant',
    'clash',
    'brawl stars',
    'blood strike',
    'delta force',
    'fc mobile',
    'efootball',
    'mobile legends',
    'legend mobile',
    'genshin',
    'honor of kings',
    'whiteout survival',
    'انتقام السلاطين',
    'revenge of sultans',
    'hay day',
    'minecraft',
    'asphalt',
    'identity v',
    'age of empire',
    'oxide',
    'farlight',
    'arena breakout',
    'last island',
    'growtopia',
    'lords mobile',
    'crossout',
    'wuthering waves',
    'last war',
    'kingshot',
    'aceracer',
    'ace racer',
    'acecraft',
    'eve echoes',
    'destiny',
    'نداء الحرب',
    'jawaker',
    'kamlna',
    'we play',
    'yalla ludo',
    'top war',
    'ball pool',
    'fortnite',
    'call of duty',
    'king of avalon',
    'hicat',
  ];
  if (gameKeywords.some((k) => cat_name.includes(k) || p_name.includes(k))) {
    return 'games';
  }

  // 5. Internet
  const internetKeywords = [
    'فواتير الأنترنت',
    'فواتير الانترنت',
    'سوا نت',
    'زاد نت',
    'لاي نت',
    'فيو نت',
    'تكامل',
    'ناس',
    'امنية',
    'امواج',
    'برو نت',
    'mts الالفية',
    'رن نت',
    'هايبر نت',
    'اينت',
    'اية',
    'ليزر',
    'الجمعية العلمية السورية',
    'ليما',
    'الكم',
    'شركة دنيا',
    'شركة يارا',
    'واي فاي',
    'wifi',
    'راوتر',
    'internet',
  ];
  const hasNetWord = /(?:^|\s)نت(?:\s|$)/.test(cat_name) || /(?:^|\s)net(?:\s|$)/i.test(cat_name);
  if (internetKeywords.some((k) => cat_name.includes(k) || p_name.includes(k)) || hasNetWord) {
    return 'internet';
  }

  // 6. Software
  const softwareKeywords = [
    'سوفتوير',
    'software',
    'tool',
    'schematic',
    'dongle',
    'box',
    'halabtech',
    'chimera',
    'eft pro',
    'borneo',
    'unlocktool',
    'tsm tool',
    'dft pro',
    'pandora',
    'hydra',
    'sigma',
    'z3x',
    'octoplus',
    'frp',
    'auth',
    'cheetah',
    'miracle',
    'samkey',
    'unlock',
  ];
  if (softwareKeywords.some((k) => cat_name.includes(k) || p_name.includes(k))) {
    return 'software';
  }

  // 7. Subscriptions
  const subKeywords = [
    'الإشتراكات والحسابات',
    'chat gpt',
    'chatgpt',
    'canva',
    'capcut',
    'perplexity',
    'elevenlabs',
    'grok',
    'gemini',
    'deepseek',
    'kimi',
    'muse ai',
    'ذكاء اصطناعي',
    'vpn',
    'duolingo',
    'zoom',
    'icloud',
    'بريميوم',
    'اشتراك',
    'netflix',
    'disney',
    'shahd',
    'osn',
    'anghami',
    'iptv',
    'shamna',
    'look 4k',
    'zain tv',
    'watch it',
    'adobe',
    'office',
    'snap chat',
    'design',
  ];
  if (subKeywords.some((k) => cat_name.includes(k) || p_name.includes(k))) {
    return 'subscriptions';
  }

  // 8. Social
  const socialKeywords = [
    'سوشل',
    'انستغرام',
    'instagram',
    'facebook',
    'تواصل اجتماعي',
    'متابعين',
    'لايكات',
    'مشاهدات',
    'تويتر',
    'twitter',
    'tiktok',
    'frames',
    'auto replying',
  ];
  if (
    socialKeywords.some((k) => cat_name.includes(k) || p_name.includes(k)) &&
    !cat_name.includes('pubg')
  ) {
    return 'social';
  }

  // 9. Payments
  if (
    cat_name.includes('مدفوعات') ||
    cat_name.includes('فيزا افتراضية') ||
    cat_name.includes('payment') ||
    p_name.includes('فيزا') ||
    p_name.includes('visa') ||
    cat_name.includes('digital banks')
  ) {
    return 'payments';
  }

  // 10. Cards
  const cardKeywords = [
    'gift',
    'بطاقات',
    'playstation',
    'psn',
    'ps ',
    'xbox',
    'steam',
    'itunes',
    'apple',
    'google play',
    'nintendo',
    'razer gold',
    'noon',
    'netease pay',
    'gamestop',
    'recharge cards',
  ];
  if (cardKeywords.some((k) => cat_name.includes(k) || p_name.includes(k))) {
    return 'cards';
  }

  // 11. Apps
  const appKeywords = [
    'تطبيقات',
    'ميو',
    'miyo',
    'meyo',
    'imo',
    'ايمو',
    'tumile',
    'توميل',
    'yalla',
    'يلا شات',
    'mixu',
    'ميكس',
    'livu',
    'ليف يو',
    'azar',
    'dd live',
    'tvs app',
    'bee live',
    'بي لايف',
    'tin chat',
    'تن شات',
    'star lite',
    'ستار لايت',
    'sugo',
    'سوجو',
    'momo',
    'مومو',
    'chat apps',
    'gomeet',
  ];
  if (appKeywords.some((k) => cat_name.includes(k) || p_name.includes(k))) {
    return 'apps';
  }

  // 12. Hosting
  const hostKeywords = ['إستضافات', 'سيرفرات', 'hosting', 'vps', 'server', 'proxies', 'discord'];
  if (hostKeywords.some((k) => cat_name.includes(k) || p_name.includes(k))) {
    return 'hosting';
  }

  // 13. Accessories
  if (cat_name.includes('اكسسوارات') || p_name.includes('اكسسوارات')) {
    return 'accessories';
  }

  return 'games';
}

function normalizeProducts(rawList: any[]): any[] {
  return rawList.map((p: any) => {
    const catName = p.category_name || p.categoryName || '';
    const name = p.name || p.product_name || '';
    const price = p.price !== undefined ? p.price : (p.costPrice !== undefined ? p.costPrice : 0);
    const slug = p.categorySlug || classifyMaxStoreProduct(p);
    return {
      id: p.id,
      name,
      product_name: name,
      price,
      costPrice: price,
      category_id: p.category_id || p.categoryId || 0,
      category_name: catName,
      categoryName: catName,
      params: Array.isArray(p.params) ? p.params : [],
      params_meta: Array.isArray(p.params_meta) ? p.params_meta : (Array.isArray(p.inputSchema) ? p.inputSchema : []),
      inputSchema: Array.isArray(p.inputSchema) ? p.inputSchema : (Array.isArray(p.params_meta) ? p.params_meta : []),
      available: p.available !== false,
      product_type: p.product_type || p.productType || 'package',
      categorySlug: slug,
    };
  });
}

function loadDiskCache(): any[] | null {
  try {
    const cacheFile = path.join(process.cwd(), 'data', 'maxstore_catalog_cache.json');
    if (fs.existsSync(cacheFile)) {
      const content = fs.readFileSync(cacheFile, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeProducts(parsed);
      }
    }

    const providerFile = path.join(process.cwd(), 'data', 'provider_catalog.json');
    if (fs.existsSync(providerFile)) {
      const content = fs.readFileSync(providerFile, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        return normalizeProducts(parsed.products);
      }
    }
  } catch (err) {
    console.warn('[MaxStore Products API] Failed to load disk cache:', err);
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category'); // e.g. 'games', 'internet', 'apps'
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const now = Date.now();

    // 1. Initial load from memory or disk
    if (!cachedProducts) {
      cachedProducts = loadDiskCache();
      if (cachedProducts) {
        lastCacheTime = now;
      }
    }

    // 2. Check if refresh needed from upstream
    if (!cachedProducts || now - lastCacheTime > CACHE_TTL) {
      try {
        const timeoutPromise = new Promise<{ ok: boolean; products?: any[]; error?: string }>((resolve) => {
          setTimeout(() => resolve({ ok: false, error: 'upstream timeout' }), 3000);
        });
        const upstreamPromise = getMaxStoreProducts();
        const res = await Promise.race([upstreamPromise, timeoutPromise]);

        if (res.ok && Array.isArray(res.products) && res.products.length > 0) {
          cachedProducts = normalizeProducts(res.products);
          lastCacheTime = now;

          // Save fresh products to disk cache asynchronously
          const cacheFile = path.join(process.cwd(), 'data', 'maxstore_catalog_cache.json');
          try {
            fs.writeFileSync(cacheFile, JSON.stringify(cachedProducts, null, 2), 'utf8');
          } catch (e) {
            console.warn('[MaxStore Products API] Failed to write disk cache:', e);
          }
        }
      } catch (err: any) {
        console.warn('[MaxStore Products API] Upstream fetch warning:', err?.message || err);
      }

      // If still empty after upstream attempt, fallback to disk
      if (!cachedProducts || cachedProducts.length === 0) {
        cachedProducts = loadDiskCache();
        if (cachedProducts) {
          lastCacheTime = now;
        }
      }
    }

    if (!cachedProducts || cachedProducts.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'مەھسۇلات ئۇچۇرى تېپىلمىدى' },
        { status: 500 }
      );
    }

    let filtered = cachedProducts;

    // Filter by category slug
    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.categorySlug === category);
    }

    // Filter by search query
    if (query) {
      filtered = filtered.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.product_name && p.product_name.toLowerCase().includes(query)) ||
          (p.category_name && p.category_name.toLowerCase().includes(query))
      );
    }

    // Grouping summary by category
    const categoryCounts: Record<string, number> = {};
    for (const p of cachedProducts) {
      const slug = p.categorySlug;
      categoryCounts[slug] = (categoryCounts[slug] || 0) + 1;
    }

    // Paginate / limit
    const total = filtered.length;
    const paginated = filtered.slice(0, limit);

    return NextResponse.json({
      ok: true,
      total,
      counts: categoryCounts,
      products: paginated,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
