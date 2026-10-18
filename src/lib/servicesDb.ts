import fs from 'fs';
import path from 'path';
import { SERVICES_DATA, ServiceItem } from './data';

const DATA_DIR = path.join(process.cwd(), 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'autocash_services.json');
const DELETED_SERVICES_FILE = path.join(DATA_DIR, 'deleted_services.json');

// In-memory cache for ultra-fast, consistent reads
let cachedServices: ServiceItem[] | null = null;
let cachedDeletedIds: Set<string> | null = null;

function getDeletedServiceIds(): Set<string> {
  if (cachedDeletedIds) return cachedDeletedIds;
  try {
    if (fs.existsSync(DELETED_SERVICES_FILE)) {
      const content = fs.readFileSync(DELETED_SERVICES_FILE, 'utf-8');
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

  if (cachedServices) {
    return cachedServices.filter((s) => !deleted.has(s.id));
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(SERVICES_FILE)) {
      const initial = SERVICES_DATA.filter((s) => !deleted.has(s.id));
      const temp = `${SERVICES_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(initial, null, 2), 'utf-8');
      fs.renameSync(temp, SERVICES_FILE);
      cachedServices = initial;
      return [...initial];
    }

    const content = fs.readFileSync(SERVICES_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter((s) => !deleted.has(s.id));
      cachedServices = filtered;
      return [...filtered];
    }

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

export function saveServicesList(services: ServiceItem[]) {
  const deleted = getDeletedServiceIds();
  const cleanList = services.filter((s) => !deleted.has(s.id));
  cachedServices = cleanList;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Atomic write to prevent half-read race conditions
    const temp = `${SERVICES_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(cleanList, null, 2), 'utf-8');
    fs.renameSync(temp, SERVICES_FILE);
  } catch (err) {
    console.error('Error saving services file:', err);
  }
}

export function addServiceItem(service: Omit<ServiceItem, 'id'> & { id?: string }): ServiceItem {
  const id = service.id || `srv-${Date.now()}`;
  
  // Untombstone if it was previously deleted
  const deleted = getDeletedServiceIds();
  if (deleted.has(id)) {
    deleted.delete(id);
    saveDeletedServiceIds(deleted);
  }

  const current = getServicesList();
  const newItem: ServiceItem = { ...service, id };
  const updated = [newItem, ...current.filter((s) => s.id !== id)];
  saveServicesList(updated);
  return newItem;
}

export function updateServiceItem(id: string, updates: Partial<ServiceItem>): ServiceItem | null {
  const current = getServicesList();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) return null;
  current[index] = { ...current[index], ...updates };
  saveServicesList(current);
  return current[index];
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
