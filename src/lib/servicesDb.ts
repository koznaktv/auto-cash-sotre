import fs from 'fs';
import path from 'path';
import { SERVICES_DATA, ServiceItem } from './data';

const DATA_DIR = path.join(process.cwd(), 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'autocash_services.json');

export function getServicesList(): ServiceItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SERVICES_FILE)) {
      fs.writeFileSync(SERVICES_FILE, JSON.stringify(SERVICES_DATA, null, 2), 'utf-8');
      return [...SERVICES_DATA];
    }
    const content = fs.readFileSync(SERVICES_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [...SERVICES_DATA];
  } catch (err) {
    console.error('Error reading services file:', err);
    return [];
  }
}

export function saveServicesList(services: ServiceItem[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving services file:', err);
  }
}

export function addServiceItem(service: Omit<ServiceItem, 'id'> & { id?: string }): ServiceItem {
  const current = getServicesList();
  const id = service.id || `srv-${Date.now()}`;
  const newItem: ServiceItem = { ...service, id };
  current.unshift(newItem);
  saveServicesList(current);
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
  const current = getServicesList();
  const filtered = current.filter((s) => s.id !== id);
  if (filtered.length === current.length) return false;
  saveServicesList(filtered);
  return true;
}
