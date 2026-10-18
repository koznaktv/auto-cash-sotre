import fs from 'fs';
import path from 'path';
import { CATEGORIES_9 } from './data';

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  count?: string;
  image?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CATEGORIES_FILE = path.join(DATA_DIR, 'autocash_categories.json');

export function getCategoriesList(): CategoryItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CATEGORIES_FILE)) {
      const initial = [...CATEGORIES_9];
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [...CATEGORIES_9];
  } catch (err) {
    console.error('Error reading categories file:', err);
    return [];
  }
}

export function saveCategoriesList(categories: CategoryItem[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving categories file:', err);
  }
}

export function addCategoryItem(category: { id?: string; name: string; icon?: string; count?: string; image?: string }): CategoryItem {
  const current = getCategoriesList();
  const id = (category.id || `cat-${Date.now()}`).toLowerCase().trim().replace(/\s+/g, '-');
  
  // If id already exists, update it or suffix
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
  const current = getCategoriesList();
  const filtered = current.filter((c) => c.id !== id);
  if (filtered.length === current.length) return false;
  saveCategoriesList(filtered);
  return true;
}
