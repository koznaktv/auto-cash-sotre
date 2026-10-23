import fs from 'fs';
import path from 'path';
import { SERVICES_DATA, ServiceItem } from './data';
import { getSupabase } from './supabase';

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'autocash_services.json');
const BUNDLED_SERVICES_FILE = path.join(BUNDLED_DATA_DIR, 'autocash_services.json');
const DELETED_SERVICES_FILE = path.join(DATA_DIR, 'deleted_services.json');
const BUNDLED_DELETED_FILE = path.join(BUNDLED_DATA_DIR, 'deleted_services.json');

// In-memory cache for ultra-fast, consistent reads
let cachedServices: ServiceItem[] | null = null;
let cachedDeletedIds: Set<string> | null = null;
let lastServicesFetch = 0;
const SERVICES_CACHE_TTL = 30_000; // 30 seconds

export function invalidateServicesCache(): void {
  lastServicesFetch = 0;
}

function getDeletedServiceIds(): Set<string> {
  if (cachedDeletedIds) return cachedDeletedIds;
  try {
    const fileToRead = fs.existsSync(DELETED_SERVICES_FILE)
      ? DELETED_SERVICES_FILE
      : fs.existsSync(BUNDLED_DELETED_FILE)
      ? BUNDLED_DELETED_FILE
      : null;
    if (fileToRead) {
      const content = fs.readFileSync(fileToRead, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        cachedDeletedIds = new Set(data.map(String));
        return cachedDeletedIds;
      }
    }
  } catch (err) {
    console.error('Error reading deleted_services.json:', err);
  }
  cachedDeletedIds = new Set();
  return cachedDeletedIds;
}

function saveDeletedServiceIds(set: Set<string>): void {
  cachedDeletedIds = set;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${DELETED_SERVICES_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(Array.from(set), null, 2), 'utf-8');
    fs.renameSync(temp, DELETED_SERVICES_FILE);
  } catch (err) {
    console.error('Error saving deleted_services.json:', err);
  }
}

export function getServicesList(): ServiceItem[] {
  const deleted = getDeletedServiceIds();

  if (cachedServices && cachedServices.length > 0) {
    return cachedServices.filter((s) => !deleted.has(s.id));
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 1. Prioritize BUNDLED_SERVICES_FILE (committed in data/autocash_services.json)
    if (fs.existsSync(BUNDLED_SERVICES_FILE)) {
      try {
        const content = fs.readFileSync(BUNDLED_SERVICES_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((s) => !deleted.has(s.id));
          cachedServices = filtered;
          try {
            if (SERVICES_FILE !== BUNDLED_SERVICES_FILE) {
              fs.writeFileSync(SERVICES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
            }
          } catch {}
          return [...filtered];
        }
      } catch (e) {
        console.warn('Error reading BUNDLED_SERVICES_FILE:', e);
      }
    }

    // 2. Try reading the active services file (/tmp on serverless or data/ locally)
    if (fs.existsSync(SERVICES_FILE)) {
      try {
        const content = fs.readFileSync(SERVICES_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s) => !deleted.has(s.id));
          cachedServices = filtered;
          return [...filtered];
        }
      } catch (e) {
        console.warn('Error reading SERVICES_FILE:', e);
      }
    }

    // 3. Fallback to hardcoded SERVICES_DATA
    const fallback = SERVICES_DATA.filter((s) => !deleted.has(s.id));
    cachedServices = fallback;
    return [...fallback];
  } catch (err) {
    console.error('Error reading services file:', err);
    if (cachedServices) {
      return cachedServices.filter((s) => !deleted.has(s.id));
    }
    return SERVICES_DATA.filter((s) => !deleted.has(s.id));
  }
}

export async function getServicesListAsync(): Promise<ServiceItem[]> {
  const deleted = getDeletedServiceIds();

  // Instant in-memory cache return (<0.1ms) if cached recently
  if (cachedServices && cachedServices.length > 0 && Date.now() - lastServicesFetch < SERVICES_CACHE_TTL) {
    return cachedServices.filter((s) => !deleted.has(s.id));
  }

  // 1. Read bundled catalog from data/autocash_services.json (Git source of truth)
  const bundledList = getServicesList();

  // 2. Check Supabase
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('system_settings').select('site_name').eq('id', 'custom_services').maybeSingle();
      if (!error && data?.site_name) {
        const parsed = JSON.parse(data.site_name);
        const isUpToDate = Array.isArray(parsed) && parsed.length >= bundledList.length && parsed.some((s: ServiceItem) => s.id?.startsWith('othman_'));
        if (isUpToDate) {
          const clean = parsed.filter((s: ServiceItem) => !deleted.has(s.id));
          cachedServices = clean;
          lastServicesFetch = Date.now();
          return [...clean];
        } else {
          // Supabase has outdated old catalog (e.g. old 21 services) -> overwrite Supabase with bundledList!
          await sb.from('system_settings').upsert({
            id: 'custom_services',
            site_name: JSON.stringify(bundledList),
            admin_pin: 'SERVICES_BACKUP',
            shamcash_address: 'META',
            whatsapp_number: 'META',
            telegram_username: 'META',
          });
        }
      } else if (!error) {
        await sb.from('system_settings').upsert({
          id: 'custom_services',
          site_name: JSON.stringify(bundledList),
          admin_pin: 'SERVICES_BACKUP',
          shamcash_address: 'META',
          whatsapp_number: 'META',
          telegram_username: 'META',
        });
      }
    } catch (e: any) {
      console.warn('Supabase getServicesListAsync notice:', e?.message);
    }
  }

  cachedServices = bundledList;
  lastServicesFetch = Date.now();
  return bundledList;
}

export async function saveServicesListAsync(services: ServiceItem[]): Promise<void> {
  const deleted = getDeletedServiceIds();
  const cleanList = services.filter((s) => !deleted.has(s.id));
  cachedServices = cleanList;
  lastServicesFetch = Date.now();

  try {
    const { invalidateCatalogCache } = require('./catalog/storefront');
    invalidateCatalogCache();
  } catch {}

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temp = `${SERVICES_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(cleanList, null, 2), 'utf-8');
    fs.renameSync(temp, SERVICES_FILE);
  } catch (err) {
    console.error('Error saving services file:', err);
  }

  // Also write to bundled file if directory exists and is writable
  try {
    if (BUNDLED_SERVICES_FILE !== SERVICES_FILE && fs.existsSync(BUNDLED_DATA_DIR)) {
      fs.writeFileSync(BUNDLED_SERVICES_FILE, JSON.stringify(cleanList, null, 2), 'utf-8');
    }
  } catch (err) {
    // Non-fatal on read-only serverless filesystems
  }

  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('system_settings').upsert({
        id: 'custom_services',
        site_name: JSON.stringify(cleanList),
        admin_pin: 'SERVICES_BACKUP',
        shamcash_address: 'META',
        whatsapp_number: 'META',
        telegram_username: 'META',
      });
      if (error) console.warn('Supabase saveServicesListAsync error:', error.message);
    } catch (err: any) {
      console.warn('Supabase saveServicesListAsync catch:', err?.message);
    }
  }
}

export function saveServicesList(services: ServiceItem[]) {
  saveServicesListAsync(services).catch(() => {});
}

export async function addServiceItemAsync(service: Omit<ServiceItem, 'id'> & { id?: string }): Promise<ServiceItem> {
  const id = service.id || `srv-${Date.now()}`;
  const deleted = getDeletedServiceIds();
  if (deleted.has(id)) {
    deleted.delete(id);
    saveDeletedServiceIds(deleted);
  }

  const current = await getServicesListAsync();
  const newItem: ServiceItem = {
    ...service,
    id,
    published: service.published !== false,
  };
  const updated = [newItem, ...current.filter((s) => s.id !== id)];
  await saveServicesListAsync(updated);
  return newItem;
}

export function addServiceItem(service: Omit<ServiceItem, 'id'> & { id?: string }): ServiceItem {
  const id = service.id || `srv-${Date.now()}`;
  const deleted = getDeletedServiceIds();
  if (deleted.has(id)) {
    deleted.delete(id);
    saveDeletedServiceIds(deleted);
  }
  const current = getServicesList();
  const newItem: ServiceItem = {
    ...service,
    id,
    published: service.published !== false,
  };
  const updated = [newItem, ...current.filter((s) => s.id !== id)];
  saveServicesList(updated);
  return newItem;
}

export async function updateServiceItemAsync(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem | null> {
  const current = await getServicesListAsync();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const updatedItem: ServiceItem = { ...current[index], ...updates, id };
  current[index] = updatedItem;
  await saveServicesListAsync(current);
  return updatedItem;
}

export function updateServiceItem(id: string, updates: Partial<ServiceItem>): ServiceItem | null {
  const current = getServicesList();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const updatedItem: ServiceItem = { ...current[index], ...updates, id };
  current[index] = updatedItem;
  saveServicesList(current);
  return updatedItem;
}

export async function deleteServiceItemAsync(id: string): Promise<boolean> {
  const deleted = getDeletedServiceIds();
  deleted.add(id);
  saveDeletedServiceIds(deleted);

  const current = await getServicesListAsync();
  const filtered = current.filter((s) => s.id !== id);
  await saveServicesListAsync(filtered);
  return true;
}

export function deleteServiceItem(id: string): boolean {
  // 1. Permanently record in deleted tombstones
  const deleted = getDeletedServiceIds();
  deleted.add(id);
  saveDeletedServiceIds(deleted);

  // 2. Remove from active list
  const current = getServicesList();
  const filtered = current.filter((s) => s.id !== id);
  saveServicesList(filtered);
  return true;
}

export function deleteServicesByCategory(category: string): number {
  const current = getServicesList();
  const matching = current.filter((s) => s.category === category);
  if (matching.length === 0) return 0;

  const deleted = getDeletedServiceIds();
  for (const s of matching) {
    deleted.add(s.id);
  }
  saveDeletedServiceIds(deleted);

  const remaining = current.filter((s) => s.category !== category);
  saveServicesList(remaining);
  return matching.length;
}

export function clearAllServices(): number {
  const current = getServicesList();
  const deleted = getDeletedServiceIds();
  for (const s of current) {
    deleted.add(s.id);
  }
  for (const s of SERVICES_DATA) {
    deleted.add(s.id);
  }
  saveDeletedServiceIds(deleted);
  saveServicesList([]);
  return current.length;
}

export function restoreDefaultServices(): number {
  const deleted = getDeletedServiceIds();
  for (const s of SERVICES_DATA) {
    deleted.delete(s.id);
  }
  saveDeletedServiceIds(deleted);
  saveServicesList([...SERVICES_DATA]);
  return SERVICES_DATA.length;
}
