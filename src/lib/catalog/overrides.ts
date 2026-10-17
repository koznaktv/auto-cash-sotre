import { listCatalogOverrides, upsertCatalogOverride } from './store';
import { invalidateCatalogCache } from './storefront';
import { STOREFRONT_CATEGORIES, type CatalogOverride, type CheckoutField, type StorefrontCategory } from './types';

const FIELD_KEY = /^[A-Za-z0-9_.\-[\]]{1,64}$/;
const FIELD_TYPES: CheckoutField['type'][] = ['text', 'number', 'email', 'tel', 'select'];

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error('Invalid text value');
  return value.trim().slice(0, max) || null;
}

function parseFields(value: unknown): CheckoutField[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value) || value.length > 10) throw new Error('inputFieldsOverride must be an array (max 10)');
  return value.map((raw: any) => {
    if (!raw || typeof raw.key !== 'string' || !FIELD_KEY.test(raw.key) || ['qty', 'order_uuid'].includes(raw.key)) {
      throw new Error(`Invalid field key: ${raw?.key}`);
    }
    const type = FIELD_TYPES.includes(raw.type) ? raw.type : 'text';
    return {
      key: raw.key,
      label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim().slice(0, 80) : raw.key,
      type,
      required: raw.required !== false,
      ...(type === 'select' && Array.isArray(raw.options)
        ? { options: raw.options.filter((o: unknown) => typeof o === 'string').slice(0, 200) }
        : {}),
      ...(typeof raw.pattern === 'string' && raw.pattern ? { pattern: raw.pattern.slice(0, 200) } : {}),
      ...(typeof raw.placeholder === 'string' && raw.placeholder ? { placeholder: raw.placeholder.slice(0, 80) } : {}),
    };
  });
}

/** Validates an admin override patch and merges it into the existing override (partial updates keep other fields). */
export async function saveOverride(scope: 'category' | 'product', targetId: unknown, patch: Record<string, unknown>): Promise<CatalogOverride> {
  const id = Number(targetId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid target id');

  const existing = (await listCatalogOverrides()).find((o) => o.scope === scope && o.targetId === id);
  const next: CatalogOverride = { ...(existing || {}), scope, targetId: id };

  if (patch.storefrontCategory !== undefined) {
    if (patch.storefrontCategory !== null && !STOREFRONT_CATEGORIES.includes(patch.storefrontCategory as StorefrontCategory)) {
      throw new Error('Invalid storefront category');
    }
    next.storefrontCategory = (patch.storefrontCategory as StorefrontCategory) || null;
  }
  if (patch.hidden !== undefined) {
    if (patch.hidden !== null && typeof patch.hidden !== 'boolean') throw new Error('hidden must be a boolean');
    next.hidden = patch.hidden as boolean | null;
  }
  if (patch.markupPercent !== undefined) {
    if (patch.markupPercent === null || patch.markupPercent === '') next.markupPercent = null;
    else {
      const markup = Number(patch.markupPercent);
      if (!Number.isFinite(markup) || markup < 0 || markup > 500) throw new Error('markupPercent must be 0–500');
      next.markupPercent = markup;
    }
  }
  if (patch.sortOrder !== undefined) {
    next.sortOrder = patch.sortOrder === null || patch.sortOrder === '' ? null : Math.trunc(Number(patch.sortOrder)) || 0;
  }

  const name = optionalText(patch.customName, 120);
  if (name !== undefined) next.customName = name;
  const description = optionalText(patch.customDescription, 300);
  if (description !== undefined) next.customDescription = description;
  const badge = optionalText(patch.customBadge, 30);
  if (badge !== undefined) next.customBadge = badge;
  const image = optionalText(patch.customImage, 500);
  if (image !== undefined) {
    if (image && !/^https:\/\//i.test(image)) throw new Error('customImage must be an https URL');
    next.customImage = image;
  }
  const fields = parseFields(patch.inputFieldsOverride);
  if (fields !== undefined) next.inputFieldsOverride = fields;

  const saved = await upsertCatalogOverride(next);
  invalidateCatalogCache();
  return saved;
}
