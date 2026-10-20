import fs from 'fs';
import path from 'path';
import { getSupabase } from './supabase';
import { PromoSlideData, DEFAULT_PROMO_SLIDES } from './bannersData';

export type { PromoSlideData };
export { DEFAULT_PROMO_SLIDES };

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');
const BANNERS_FILE = path.join(DATA_DIR, 'autocash_banners.json');
const BUNDLED_BANNERS_FILE = path.join(BUNDLED_DATA_DIR, 'autocash_banners.json');

let cachedBanners: PromoSlideData[] | null = null;
let lastBannersFetch = 0;
const BANNERS_CACHE_TTL = 30_000;

export function invalidateBannersCache(): void {
  lastBannersFetch = 0;
  cachedBanners = null;
}

export function getBannersList(): PromoSlideData[] {
  if (cachedBanners && Date.now() - lastBannersFetch < BANNERS_CACHE_TTL) {
    return cachedBanners;
  }

  try {
    const fileToRead = fs.existsSync(BANNERS_FILE)
      ? BANNERS_FILE
      : fs.existsSync(BUNDLED_BANNERS_FILE)
      ? BUNDLED_BANNERS_FILE
      : null;

    if (fileToRead) {
      const content = fs.readFileSync(fileToRead, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedBanners = parsed;
        lastBannersFetch = Date.now();
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading banners file:', err);
  }

  cachedBanners = DEFAULT_PROMO_SLIDES;
  lastBannersFetch = Date.now();
  return DEFAULT_PROMO_SLIDES;
}

export async function getBannersListAsync(): Promise<PromoSlideData[]> {
  if (cachedBanners && Date.now() - lastBannersFetch < BANNERS_CACHE_TTL) {
    return cachedBanners;
  }

  try {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from('system_settings')
        .select('site_name')
        .eq('id', 'custom_banners')
        .maybeSingle();

      if (!error && data?.site_name) {
        try {
          const parsed = JSON.parse(data.site_name);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedBanners = parsed;
            lastBannersFetch = Date.now();
            return parsed;
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Supabase getBannersListAsync fallback to local file:', err);
  }

  return getBannersList();
}

export function saveBannersList(banners: PromoSlideData[]): void {
  cachedBanners = banners;
  lastBannersFetch = Date.now();

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${BANNERS_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(banners, null, 2), 'utf-8');
    fs.renameSync(temp, BANNERS_FILE);
  } catch (err) {
    console.error('Error saving banners file locally:', err);
  }

  try {
    const sb = getSupabase();
    if (sb) {
      Promise.resolve(
        sb.from('system_settings').upsert({
          id: 'custom_banners',
          site_name: JSON.stringify(banners),
          admin_pin: 'BANNERS_BACKUP',
          shamcash_address: 'META',
          whatsapp_number: 'META',
          telegram_username: 'META',
        })
      ).catch(() => {});
    }
  } catch {}
}

export async function saveBannersListAsync(banners: PromoSlideData[]): Promise<boolean> {
  cachedBanners = banners;
  lastBannersFetch = Date.now();

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${BANNERS_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(banners, null, 2), 'utf-8');
    fs.renameSync(temp, BANNERS_FILE);
  } catch (err) {
    console.error('Error saving banners file locally:', err);
  }

  try {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from('system_settings').upsert({
        id: 'custom_banners',
        site_name: JSON.stringify(banners),
        admin_pin: 'BANNERS_BACKUP',
        shamcash_address: 'META',
        whatsapp_number: 'META',
        telegram_username: 'META',
      });
      if (error) {
        console.warn('Supabase saveBannersListAsync error:', error.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('Error in saveBannersListAsync:', err);
    return false;
  }
}
