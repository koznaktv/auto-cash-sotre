import fs from 'fs';
import path from 'path';
import { CATEGORIES_9 } from './data';
import { getSupabase } from './supabase';

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  count?: string;
  image?: string;
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');
const CATEGORIES_FILE = path.join(DATA_DIR, 'autocash_categories.json');
const BUNDLED_CATEGORIES_FILE = path.join(BUNDLED_DATA_DIR, 'autocash_categories.json');
const DELETED_CATEGORIES_FILE = path.join(DATA_DIR, 'deleted_categories.json');
const BUNDLED_DELETED_FILE = path.join(BUNDLED_DATA_DIR, 'deleted_categories.json');

let cachedCategories: CategoryItem[] | null = null;
let cachedDeletedCatIds: Set<string> | null = null;
let lastCategoriesFetch = 0;
const CATEGORIES_CACHE_TTL = 30_000; // 30 seconds

export function invalidateCategoriesCache(): void {
  lastCategoriesFetch = 0;
}

function getDeletedCategoryIds(): Set<string> {
  if (cachedDeletedCatIds) return cachedDeletedCatIds;
  try {
    const fileToRead = fs.existsSync(DELETED_CATEGORIES_FILE)
      ? DELETED_CATEGORIES_FILE
      : fs.existsSync(BUNDLED_DELETED_FILE)
      ? BUNDLED_DELETED_FILE
      : null;
    if (fileToRead) {
      const content = fs.readFileSync(fileToRead, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        cachedDeletedCatIds = new Set(data.map(String));
        return cachedDeletedCatIds;
      }
    }
  } catch (err) {
    console.error('Error reading deleted_categories.json:', err);
  }
  cachedDeletedCatIds = new Set();
  return cachedDeletedCatIds;
}

function saveDeletedCategoryIds(set: Set<string>): void {
  cachedDeletedCatIds = set;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${DELETED_CATEGORIES_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(Array.from(set), null, 2), 'utf-8');
    fs.renameSync(temp, DELETED_CATEGORIES_FILE);
  } catch (err) {
    console.error('Error saving deleted_categories.json:', err);
  }
}

export function getCategoriesList(): CategoryItem[] {
  const deleted = getDeletedCategoryIds();

  if (cachedCategories) {
    return cachedCategories.filter((c) => !deleted.has(c.id));
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CATEGORIES_FILE)) {
      const initial = CATEGORIES_9.filter((c) => !deleted.has(c.id));
      const temp = `${CATEGORIES_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(initial, null, 2), 'utf-8');
      fs.renameSync(temp, CATEGORIES_FILE);
      cachedCategories = initial;
      return [...initial];
    }
    const content = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter((c) => !deleted.has(c.id));
      cachedCategories = filtered;
      return [...filtered];
    }
    const fallback = CATEGORIES_9.filter((c) => !deleted.has(c.id));
    cachedCategories = fallback;
    return [...fallback];
  } catch (err) {
    console.error('Error reading categories file:', err);
    if (cachedCategories) {
      return cachedCategories.filter((c) => !deleted.has(c.id));
    }
    return CATEGORIES_9.filter((c) => !deleted.has(c.id));
  }
}

export async function getCategoriesListAsync(): Promise<CategoryItem[]> {
  const deleted = getDeletedCategoryIds();

  // Instant in-memory cache return (<0.1ms) if cached recently
  if (cachedCategories && Date.now() - lastCategoriesFetch < CATEGORIES_CACHE_TTL) {
    return cachedCategories.filter((c) => !deleted.has(c.id));
  }

  // Try Supabase first if available
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('system_settings').select('site_name').eq('id', 'custom_categories').maybeSingle();
      if (!error && data?.site_name) {
        const parsed = JSON.parse(data.site_name);
        if (Array.isArray(parsed)) {
          let updated = false;
          const clean = parsed
            .filter((c: CategoryItem) => !deleted.has(c.id))
            .map((c: CategoryItem) => {
              if (c.id === 'numbers' && (c.name === 'مەۋھۇم نومۇر' || !c.name.includes('ئەزالىق'))) {
                updated = true;
                return {
                  ...c,
                  name: 'تېلېگرام ئەزالىق',
                  count: 'Telegram Premium',
                  image: '/images/services/telegram.jpg',
                };
              }
              if (c.id === 'cards' && (c.name === 'كارتىلار ۋە VCC' || c.name === 'كارتىلار' || !c.name.includes('تىلفۇن') || c.count?.includes('Telecom'))) {
                updated = true;
                return {
                  ...c,
                  name: 'تىلفۇن كارتىلىرىغا پۇل قاچىلاش',
                  count: 'Turkcell',
                  image: '/images/services/turkcell.jpg',
                };
              }
              return c;
            });
          const gamesItem = clean.find((c) => c.id === 'games');
          const cleanSorted = gamesItem
            ? [...clean.filter((c) => c.id !== 'games'), gamesItem]
            : clean;

          if (updated || (clean.length > 0 && clean[0]?.id === 'games')) {
            saveCategoriesList(cleanSorted);
          }
          cachedCategories = cleanSorted;
          lastCategoriesFetch = Date.now();
          return [...cleanSorted];
        }
      }
    } catch (e: any) {
      console.warn('Supabase getCategoriesListAsync notice:', e?.message);
    }
  }

  const list = getCategoriesList();
  lastCategoriesFetch = Date.now();
  return list;
}

export function saveCategoriesList(categories: CategoryItem[]) {
  const deleted = getDeletedCategoryIds();
  const cleanList = categories.filter((c) => !deleted.has(c.id));
  cachedCategories = cleanList;
  lastCategoriesFetch = Date.now();

  try {
    const { invalidateCatalogCache } = require('./catalog/storefront');
    invalidateCatalogCache();
  } catch {}

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${CATEGORIES_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(cleanList, null, 2), 'utf-8');
    fs.renameSync(temp, CATEGORIES_FILE);
  } catch (err) {
    console.error('Error saving categories file:', err);
  }

  // Backup to Supabase for 100% serverless persistence
  try {
    const sb = getSupabase();
    if (sb) {
      Promise.resolve(
        sb.from('system_settings').upsert({
          id: 'custom_categories',
          site_name: JSON.stringify(cleanList),
          admin_pin: 'CATEGORIES_BACKUP',
          shamcash_address: 'META',
          whatsapp_number: 'META',
          telegram_username: 'META',
        })
      )
        .then((res: any) => {
          if (res?.error) console.warn('Supabase saveCategoriesList notice:', res.error.message);
        })
        .catch(() => {});
    }
  } catch {}
}

export function addCategoryItem(category: { id?: string; name: string; icon?: string; count?: string; image?: string }): CategoryItem {
  const id = (category.id || `cat-${Date.now()}`).toLowerCase().trim().replace(/\s+/g, '-');
  
  // Untombstone if it was previously deleted
  const deleted = getDeletedCategoryIds();
  if (deleted.has(id)) {
    deleted.delete(id);
    saveDeletedCategoryIds(deleted);
  }

  const current = getCategoriesList();
  const existingIndex = current.findIndex((c) => c.id === id);
  const newItem: CategoryItem = {
    id,
    name: category.name.trim(),
    icon: category.icon || 'Package',
    count: category.count || 'مەھسۇلاتلار',
    image: category.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
  };

  if (existingIndex !== -1) {
    current[existingIndex] = { ...current[existingIndex], ...newItem };
  } else {
    current.push(newItem);
  }

  saveCategoriesList(current);
  return newItem;
}

export function updateCategoryItem(id: string, updates: Partial<CategoryItem>): CategoryItem | null {
  const current = getCategoriesList();
  const index = current.findIndex((c) => c.id === id);
  if (index === -1) return null;
  current[index] = { ...current[index], ...updates };
  saveCategoriesList(current);
  return current[index];
}

export function deleteCategoryItem(id: string): boolean {
  // 1. Permanently record in deleted tombstones
  const deleted = getDeletedCategoryIds();
  deleted.add(id);
  saveDeletedCategoryIds(deleted);

  // 2. Remove from active list
  const current = getCategoriesList();
  const filtered = current.filter((c) => c.id !== id);
  saveCategoriesList(filtered);
  return true;
}
