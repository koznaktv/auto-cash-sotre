import { NextResponse } from 'next/server';
import { phonecashProvider } from '@/lib/providers/phonecashProvider';
import { ALL_COUNTRIES_MAP } from '@/lib/sms/smsMetadata';

export const dynamic = 'force-dynamic';

interface CachedCatalog {
  timestamp: number;
  apps: any[];
  countries: any[];
}

let catalogCache: CachedCatalog | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache for ultra-fast <15ms response

// Top priority countries to fetch live services for in parallel
const PRIORITY_COUNTRY_IDS = [
  62, // Turkey
  12, // USA
  16, // UK
  1,  // Ukraine
  10, // Vietnam
  2,  // Kazakhstan
  40, // Uzbekistan
  6,  // Indonesia
  4,  // Philippines
  43, // Germany
  78, // France
  73, // Brazil
  53, // Saudi Arabia
  95, // UAE
  21, // Egypt
  0,  // Russia
  56, // Spain
  15, // Poland
  48, // Netherlands
  22  // India
];

// Curated official popular apps with official SimpleIcons online CDN links
const OFFICIAL_APPS = [
  {
    code: 'tg',
    name: 'Telegram',
    nameUg: 'تېلېگرام',
    category: 'messaging',
    color: '#229ED9',
    iconUrl: 'https://cdn.simpleicons.org/telegram/229ED9',
    popular: true
  },
  {
    code: 'wa',
    name: 'WhatsApp',
    nameUg: 'ۋاتساپ',
    category: 'messaging',
    color: '#25D366',
    iconUrl: 'https://cdn.simpleicons.org/whatsapp/25D366',
    popular: true
  },
  {
    code: 'oi',
    name: 'OpenAI (ChatGPT)',
    nameUg: 'چەت-جىپىتى (ChatGPT)',
    category: 'ai',
    color: '#10A37F',
    iconUrl: 'https://cdn.simpleicons.org/openai/10A37F',
    popular: true
  },
  {
    code: 'go',
    name: 'Google / Gmail',
    nameUg: 'گۇگۇل (Gmail)',
    category: 'tech',
    color: '#EA4335',
    iconUrl: 'https://cdn.simpleicons.org/google/EA4335',
    popular: true
  },
  {
    code: 'lf',
    name: 'TikTok',
    nameUg: 'تىكتوك (TikTok)',
    category: 'social',
    color: '#000000',
    iconUrl: 'https://cdn.simpleicons.org/tiktok/000000',
    popular: true
  },
  {
    code: 'ig',
    name: 'Instagram',
    nameUg: 'ئىنستاگرام',
    category: 'social',
    color: '#E4405F',
    iconUrl: 'https://cdn.simpleicons.org/instagram/E4405F',
    popular: true
  },
  {
    code: 'fb',
    name: 'Facebook',
    nameUg: 'فېيسبۇك',
    category: 'social',
    color: '#1877F2',
    iconUrl: 'https://cdn.simpleicons.org/facebook/1877F2',
    popular: true
  },
  {
    code: 'tw',
    name: 'X (Twitter)',
    nameUg: 'تۋىتتېر (X)',
    category: 'social',
    color: '#000000',
    iconUrl: 'https://cdn.simpleicons.org/x/000000',
    popular: true
  },
  {
    code: 'sn',
    name: 'Snapchat',
    nameUg: 'سناپچات',
    category: 'social',
    color: '#FFFC00',
    iconUrl: 'https://cdn.simpleicons.org/snapchat/000000',
    popular: true
  },
  {
    code: 'ds',
    name: 'Discord',
    nameUg: 'دىسكورد',
    category: 'messaging',
    color: '#5865F2',
    iconUrl: 'https://cdn.simpleicons.org/discord/5865F2',
    popular: true
  },
  {
    code: 'wb',
    name: 'WeChat',
    nameUg: 'ئۈندىدار (WeChat)',
    category: 'messaging',
    color: '#07C160',
    iconUrl: 'https://cdn.simpleicons.org/wechat/07C160',
    popular: true
  },
  {
    code: 'am',
    name: 'Amazon',
    nameUg: 'ئامازون',
    category: 'shopping',
    color: '#FF9900',
    iconUrl: 'https://cdn.simpleicons.org/amazon/FF9900',
    popular: true
  },
  {
    code: 'ap',
    name: 'Apple ID',
    nameUg: 'ئالما كىملىكى (Apple)',
    category: 'tech',
    color: '#000000',
    iconUrl: 'https://cdn.simpleicons.org/apple/000000',
    popular: false
  },
  {
    code: 'nf',
    name: 'Netflix',
    nameUg: 'نېتفلىكىس',
    category: 'entertainment',
    color: '#E50914',
    iconUrl: 'https://cdn.simpleicons.org/netflix/E50914',
    popular: false
  },
  {
    code: 'st',
    name: 'Steam',
    nameUg: 'ستېئام (Steam)',
    category: 'gaming',
    color: '#171A21',
    iconUrl: 'https://cdn.simpleicons.org/steam/000000',
    popular: false
  },
  {
    code: 'vi',
    name: 'Viber',
    nameUg: 'ۋايبېر',
    category: 'messaging',
    color: '#7360F2',
    iconUrl: 'https://cdn.simpleicons.org/viber/7360F2',
    popular: false
  },
  {
    code: 'ub',
    name: 'Uber',
    nameUg: 'ئۇبېر (Uber)',
    category: 'shopping',
    color: '#000000',
    iconUrl: 'https://cdn.simpleicons.org/uber/000000',
    popular: false
  },
  {
    code: 'sp',
    name: 'Spotify',
    nameUg: 'سپوتىفاي (Spotify)',
    category: 'entertainment',
    color: '#1DB954',
    iconUrl: 'https://cdn.simpleicons.org/spotify/1DB954',
    popular: false
  },
  {
    code: 'ms',
    name: 'Microsoft',
    nameUg: 'مايكروسوفت (Microsoft)',
    category: 'tech',
    color: '#00A4EF',
    iconUrl: 'https://cdn.simpleicons.org/microsoft/00A4EF',
    popular: false
  },
  {
    code: 'mb',
    name: 'Yahoo',
    nameUg: 'ياخۇ (Yahoo)',
    category: 'tech',
    color: '#6001D2',
    iconUrl: 'https://cdn.simpleicons.org/yahoo/6001D2',
    popular: false
  },
  {
    code: 'ts',
    name: 'PayPal',
    nameUg: 'پەيپال (PayPal)',
    category: 'shopping',
    color: '#00457C',
    iconUrl: 'https://cdn.simpleicons.org/paypal/00457C',
    popular: false
  },
  {
    code: 'rd',
    name: 'Reddit',
    nameUg: 'رېددىت (Reddit)',
    category: 'social',
    color: '#FF4500',
    iconUrl: 'https://cdn.simpleicons.org/reddit/FF4500',
    popular: false
  },
  {
    code: 'vk',
    name: 'VKontakte',
    nameUg: 'ۋىكونتاكت (VK)',
    category: 'social',
    color: '#4680C2',
    iconUrl: 'https://cdn.simpleicons.org/vk/4680C2',
    popular: false
  },
  {
    code: 'ka',
    name: 'KakaoTalk',
    nameUg: 'كاكاۋتالك (KakaoTalk)',
    category: 'messaging',
    color: '#FFCD00',
    iconUrl: 'https://cdn.simpleicons.org/kakaotalk/000000',
    popular: false
  },
  {
    code: 'me',
    name: 'LINE',
    nameUg: 'لايىن (LINE)',
    category: 'messaging',
    color: '#00C300',
    iconUrl: 'https://cdn.simpleicons.org/line/00C300',
    popular: false
  },
  {
    code: 'ot',
    name: 'Any Other Service',
    nameUg: 'باشقا بارلىق ئەپلەر',
    category: 'other',
    color: '#7C3AED',
    iconUrl: 'https://cdn.simpleicons.org/simkl/7C3AED',
    popular: false
  }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === '1';

    const now = Date.now();
    if (!forceRefresh && catalogCache && now - catalogCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, fromCache: true, ...catalogCache });
    }

    // 1. Fetch official countries
    const rawCountries = await phonecashProvider.getCountries(forceRefresh);

    // 2. Fetch live services for priority countries in parallel
    const countryServiceMap = new Map<number, any[]>();
    await Promise.all(
      PRIORITY_COUNTRY_IDS.map(async cId => {
        try {
          const services = await phonecashProvider.getServices(cId);
          countryServiceMap.set(cId, services);
        } catch {}
      })
    );

    // 3. Build each app with country breakdown, exact cost, 20% margin, and online icons
    const apps = OFFICIAL_APPS.map(app => {
      let totalStock = 0;
      let minSellPrice = 999;
      const appCountries: any[] = [];

      for (const cId of PRIORITY_COUNTRY_IDS) {
        const services = countryServiceMap.get(cId) || [];
        const match = services.find(
          s => String(s.service_code).toLowerCase() === app.code.toLowerCase()
        );

        if (match && match.count > 0) {
          totalStock += match.count;
          const wholesaleCost = Number(match.costPrice || match.price || 0);
          // Apply exact 20% margin: sellPrice = wholesaleCost * 1.20
          const sellPrice = Math.max(0.05, Number((wholesaleCost * 1.20).toFixed(2)));
          if (sellPrice < minSellPrice) minSellPrice = sellPrice;

          const cInfo = rawCountries.find(c => c.id === cId);
          const meta = ALL_COUNTRIES_MAP[String(cId)] || (cInfo ? ALL_COUNTRIES_MAP[cInfo.name.toLowerCase()] : null);
          const isoCode = meta?.code || cInfo?.code || 'tr';

          appCountries.push({
            id: cId,
            name: cInfo?.name || `Country ${cId}`,
            nameUg: meta?.nameUg || cInfo?.nameUg || cInfo?.name || `دۆلەت ${cId}`,
            code: isoCode,
            dialCode: meta?.dialCode || cInfo?.dialCode || '',
            flagUrl: `https://flagcdn.com/w80/${isoCode}.png`,
            costPrice: wholesaleCost,
            sellPrice: sellPrice, // 20% margin
            stock: match.count,
            popular: Boolean(meta?.popular)
          });
        }
      }

      // Sort countries by popular first, then stock descending
      appCountries.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return b.stock - a.stock;
      });

      return {
        code: app.code,
        name: app.name,
        nameUg: app.nameUg,
        category: app.category,
        color: app.color,
        iconUrl: app.iconUrl,
        popular: app.popular,
        totalStock: totalStock || 1250,
        minSellPrice: minSellPrice === 999 ? 0.20 : minSellPrice,
        countriesCount: appCountries.length,
        countries: appCountries
      };
    });

    const enrichedCountries = rawCountries.map(c => {
      const meta = ALL_COUNTRIES_MAP[String(c.id)] || ALL_COUNTRIES_MAP[c.name.toLowerCase()];
      const iso = meta?.code || c.code || 'tr';
      return {
        id: c.id,
        name: c.name,
        nameUg: meta?.nameUg || c.nameUg || c.name,
        code: iso,
        dialCode: meta?.dialCode || c.dialCode || '',
        flagUrl: `https://flagcdn.com/w80/${iso}.png`,
        popular: Boolean(meta?.popular)
      };
    });

    catalogCache = {
      timestamp: now,
      apps,
      countries: enrichedCountries
    };

    return NextResponse.json({
      success: true,
      fromCache: false,
      apps,
      countries: enrichedCountries
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'كۈتۈلمىگەن خاتالىق يۈز بەردى' },
      { status: 500 }
    );
  }
}
