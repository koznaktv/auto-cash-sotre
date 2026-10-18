/**
 * Persistence for the provider catalog. Same rule as db.ts: when Supabase is configured it is the
 * only store (Vercel's filesystem doesn't persist); otherwise data/provider_catalog.json is used.
 */
import fs from 'fs';
import path from 'path';
import { getSupabase } from '../supabase';
import {
  DEFAULT_PROVIDER_SETTINGS,
  type CatalogOverride,
  type ProviderSettings,
  type StoredCategory,
  type StoredProduct,
  type SyncStats,
} from './types';

const PAGE_SIZE = 1000;
const WRITE_CHUNK = 500;

// ---------------------------------------------------------------- local JSON store

interface LocalCatalog {
  settings: ProviderSettings;
  categories: StoredCategory[];
  products: StoredProduct[];
  overrides: CatalogOverride[];
  runs: { id: number; trigger: string; status: string; stats?: SyncStats | null; error?: string | null; startedAt: string; finishedAt?: string }[];
  locks: Record<string, { lockedUntil: number; holder: string }>;
}

function getCatalogDataPath(): string {
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  ) {
    return path.join('/tmp', 'provider_catalog.json');
  }
  return path.join(process.cwd(), 'data', 'provider_catalog.json');
}

const LOCAL_FILE = getCatalogDataPath();
const BUNDLED_FILE = path.join(process.cwd(), 'data', 'provider_catalog.json');

declare global {
  var __localCatalogCache: LocalCatalog | undefined;
}

function loadLocal(): LocalCatalog {
  if (globalThis.__localCatalogCache) return globalThis.__localCatalogCache;
  try {
    const fileToRead = fs.existsSync(LOCAL_FILE) ? LOCAL_FILE : fs.existsSync(BUNDLED_FILE) ? BUNDLED_FILE : null;
    if (fileToRead) {
      const parsed = JSON.parse(fs.readFileSync(fileToRead, 'utf-8'));
      globalThis.__localCatalogCache = {
        settings: { ...DEFAULT_PROVIDER_SETTINGS, ...(parsed.settings || {}) },
        categories: parsed.categories || [],
        products: parsed.products || [],
        overrides: parsed.overrides || [],
        runs: parsed.runs || [],
        locks: parsed.locks || {},
      };
      return globalThis.__localCatalogCache;
    }
  } catch (err) {
    console.warn('loadLocal error reading catalog file:', err);
  }

  globalThis.__localCatalogCache = {
    settings: { ...DEFAULT_PROVIDER_SETTINGS },
    categories: [],
    products: [],
    overrides: [],
    runs: [],
    locks: {},
  };
  return globalThis.__localCatalogCache;
}

function saveLocal(): void {
  const cache = globalThis.__localCatalogCache;
  if (!cache) return;
  try {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    const temp = `${LOCAL_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(cache), 'utf-8');
    fs.renameSync(temp, LOCAL_FILE);
  } catch (err) {
    console.warn('saveLocal warning (in-memory cache preserved):', err);
  }
}

// ---------------------------------------------------------------- row mappers

function fail(op: string, error: { message?: string }): never {
  console.error(`Catalog store ${op} error:`, error);
  throw new Error(`تىزىملىك ساندىنى مەشغۇلاتى مەغلۇپ بولدى (${op})`);
}

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapSettings(row: any): ProviderSettings {
  const d = DEFAULT_PROVIDER_SETTINGS;
  if (!row) return { ...d };
  return {
    catalogSource: row.catalog_source === 'provider' ? 'provider' : 'legacy',
    globalMarkupPercent: num(row.global_markup_percent, d.globalMarkupPercent),
    fixedMarkupUsd: num(row.fixed_markup_usd, d.fixedMarkupUsd),
    minProfitUsd: num(row.min_profit_usd, d.minProfitUsd),
    minOrderUsd: num(row.min_order_usd, d.minOrderUsd),
    priceMaxAgeMinutes: num(row.price_max_age_minutes, d.priceMaxAgeMinutes),
    showUnavailable: Boolean(row.show_unavailable),
    lowBalanceThresholdUsd: num(row.low_balance_threshold_usd, d.lowBalanceThresholdUsd),
    maxPendingHours: num(row.max_pending_hours, d.maxPendingHours),
    ordersPaused: Boolean(row.orders_paused),
    ordersPausedReason: row.orders_paused_reason ?? null,
    lastSyncAt: row.last_sync_at ?? null,
    lastSyncStatus: row.last_sync_status ?? null,
    lastSyncStats: row.last_sync_stats ?? null,
    lastSyncError: row.last_sync_error ?? null,
    lastBalance: row.last_balance === null || row.last_balance === undefined ? null : Number(row.last_balance),
    lastBalanceAt: row.last_balance_at ?? null,
  };
}

const SETTINGS_COLUMNS: Record<keyof ProviderSettings, string> = {
  catalogSource: 'catalog_source',
  globalMarkupPercent: 'global_markup_percent',
  fixedMarkupUsd: 'fixed_markup_usd',
  minProfitUsd: 'min_profit_usd',
  minOrderUsd: 'min_order_usd',
  priceMaxAgeMinutes: 'price_max_age_minutes',
  showUnavailable: 'show_unavailable',
  lowBalanceThresholdUsd: 'low_balance_threshold_usd',
  maxPendingHours: 'max_pending_hours',
  ordersPaused: 'orders_paused',
  ordersPausedReason: 'orders_paused_reason',
  lastSyncAt: 'last_sync_at',
  lastSyncStatus: 'last_sync_status',
  lastSyncStats: 'last_sync_stats',
  lastSyncError: 'last_sync_error',
  lastBalance: 'last_balance',
  lastBalanceAt: 'last_balance_at',
};

function mapCategory(row: any): StoredCategory {
  return {
    id: Number(row.id),
    parentId: row.parent_id === null || row.parent_id === undefined ? null : Number(row.parent_id),
    name: row.name,
    image: row.image || undefined,
    rootId: row.root_id === null || row.root_id === undefined ? null : Number(row.root_id),
    depth: Number(row.depth || 0),
    lastSeenRunId: row.last_seen_run_id === null ? null : Number(row.last_seen_run_id),
    removedAt: row.removed_at ?? null,
  };
}

function categoryRow(c: StoredCategory) {
  return {
    id: c.id,
    parent_id: c.parentId,
    root_id: c.rootId,
    depth: c.depth,
    name: c.name,
    image: c.image ?? null,
    last_seen_run_id: c.lastSeenRunId ?? null,
    removed_at: c.removedAt ?? null,
    updated_at: new Date().toISOString(),
  };
}

function mapProduct(row: any): StoredProduct {
  return {
    id: Number(row.id),
    name: row.name,
    costPrice: Number(row.cost_price),
    prevCostPrice: row.prev_cost_price === null || row.prev_cost_price === undefined ? null : Number(row.prev_cost_price),
    priceChangedAt: row.price_changed_at ?? null,
    currency: row.currency || 'USD',
    categoryId: Number(row.category_id),
    parentId: row.parent_id === null || row.parent_id === undefined ? null : Number(row.parent_id),
    categoryName: row.category_name || '',
    available: Boolean(row.available),
    productType: row.product_type || 'package',
    inputSchema: row.input_schema ?? [],
    params: row.params ?? [],
    qtyValues: row.qty_values ?? null,
    image: row.image || undefined,
    categoryImage: row.category_image || undefined,
    lastSeenRunId: row.last_seen_run_id === null ? null : Number(row.last_seen_run_id),
    syncedAt: row.synced_at,
    removedAt: row.removed_at ?? null,
  };
}

function productRow(p: StoredProduct) {
  return {
    id: p.id,
    category_id: p.categoryId,
    parent_id: p.parentId,
    category_name: p.categoryName || null,
    name: p.name,
    cost_price: p.costPrice,
    prev_cost_price: p.prevCostPrice ?? null,
    price_changed_at: p.priceChangedAt ?? null,
    currency: p.currency,
    available: p.available,
    product_type: p.productType,
    input_schema: p.inputSchema ?? [],
    params: p.params ?? [],
    qty_values: p.qtyValues ?? null,
    image: p.image ?? null,
    category_image: p.categoryImage ?? null,
    last_seen_run_id: p.lastSeenRunId ?? null,
    synced_at: p.syncedAt,
    removed_at: p.removedAt ?? null,
  };
}

function mapOverride(row: any): CatalogOverride {
  return {
    scope: row.scope,
    targetId: Number(row.target_id),
    storefrontCategory: row.storefront_category ?? null,
    hidden: row.hidden ?? null,
    customName: row.custom_name ?? null,
    customDescription: row.custom_description ?? null,
    customImage: row.custom_image ?? null,
    customBadge: row.custom_badge ?? null,
    markupPercent: row.markup_percent === null || row.markup_percent === undefined ? null : Number(row.markup_percent),
    inputFieldsOverride: row.input_fields_override ?? null,
    sortOrder: row.sort_order ?? null,
  };
}

async function readAllPages(table: string): Promise<any[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const rows: any[] = [];
  try {
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await sb.from(table).select('*').order('id', { ascending: true }).range(from, from + PAGE_SIZE - 1);
      if (error) {
        console.warn(`Supabase read ${table} warning:`, error.message);
        break;
      }
      rows.push(...(data || []));
      if (!data || data.length < PAGE_SIZE) break;
    }
  } catch (err: any) {
    console.warn(`Supabase read ${table} exception:`, err?.message);
  }
  return rows;
}

async function upsertChunks(table: string, rows: any[], onConflict: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    for (let i = 0; i < rows.length; i += WRITE_CHUNK) {
      const { error } = await sb.from(table).upsert(rows.slice(i, i + WRITE_CHUNK), { onConflict });
      if (error) {
        console.warn(`Supabase upsert ${table} warning:`, error.message);
        break;
      }
    }
  } catch (err: any) {
    console.warn(`Supabase upsert ${table} exception:`, err?.message);
  }
}

// ---------------------------------------------------------------- public API

export async function getProviderSettings(): Promise<ProviderSettings> {
  const local = loadLocal();
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('provider_settings').select('*').eq('id', 'global').maybeSingle();
      if (!error && data) return mapSettings(data);
      if (error) console.warn('Supabase provider_settings warning (fallback to local):', error.message);
    } catch (err: any) {
      console.warn('Supabase provider_settings exception:', err?.message);
    }
  }
  return { ...local.settings };
}

export async function updateProviderSettings(patch: Partial<ProviderSettings>): Promise<ProviderSettings> {
  const local = loadLocal();
  local.settings = { ...local.settings, ...patch };
  saveLocal();

  const sb = getSupabase();
  if (sb) {
    try {
      const row: Record<string, unknown> = { id: 'global', updated_at: new Date().toISOString() };
      for (const [key, value] of Object.entries(patch)) {
        const column = SETTINGS_COLUMNS[key as keyof ProviderSettings];
        if (column && value !== undefined) row[column] = value;
      }
      const { data, error } = await sb.from('provider_settings').upsert(row).select().maybeSingle();
      if (!error && data) return mapSettings(data);
      if (error) console.warn('Supabase updateProviderSettings warning:', error.message);
    } catch (err: any) {
      console.warn('Supabase updateProviderSettings exception:', err?.message);
    }
  }
  return { ...local.settings };
}

export async function listStoredCategories(): Promise<StoredCategory[]> {
  const local = loadLocal();
  const sb = getSupabase();
  if (sb) {
    const rows = await readAllPages('provider_categories');
    if (rows && rows.length > 0) return rows.map(mapCategory);
  }
  return local.categories;
}

export async function listStoredProducts(): Promise<StoredProduct[]> {
  const local = loadLocal();
  const sb = getSupabase();
  if (sb) {
    const rows = await readAllPages('provider_products');
    if (rows && rows.length > 0) return rows.map(mapProduct);
  }
  return local.products;
}

export async function getStoredProduct(id: number): Promise<StoredProduct | null> {
  const local = loadLocal();
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('provider_products').select('*').eq('id', id).maybeSingle();
      if (!error && data) return mapProduct(data);
    } catch {}
  }
  return local.products.find((p) => p.id === id) || null;
}

export async function updateStoredProduct(id: number, patch: Partial<StoredProduct>): Promise<void> {
  const local = loadLocal();
  const index = local.products.findIndex((p) => p.id === id);
  if (index !== -1) {
    local.products[index] = { ...local.products[index], ...patch };
    saveLocal();
  }

  const sb = getSupabase();
  if (sb) {
    try {
      const existing = await getStoredProduct(id);
      if (existing) {
        await sb.from('provider_products').update(productRow({ ...existing, ...patch })).eq('id', id);
      }
    } catch {}
  }
}

export async function upsertStoredCategories(rows: StoredCategory[]): Promise<void> {
  const local = loadLocal();
  const byId = new Map(local.categories.map((c) => [c.id, c]));
  for (const row of rows) byId.set(row.id, row);
  local.categories = Array.from(byId.values());
  saveLocal();

  const sb = getSupabase();
  if (sb) {
    try {
      await upsertChunks('provider_categories', rows.map(categoryRow), 'id');
    } catch (e) {
      console.warn('Supabase upsertStoredCategories warning:', e);
    }
  }
}

export async function upsertStoredProducts(rows: StoredProduct[]): Promise<void> {
  const local = loadLocal();
  const byId = new Map(local.products.map((p) => [p.id, p]));
  for (const row of rows) byId.set(row.id, row);
  local.products = Array.from(byId.values());
  saveLocal();

  const sb = getSupabase();
  if (sb) {
    try {
      await upsertChunks('provider_products', rows.map(productRow), 'id');
    } catch (e) {
      console.warn('Supabase upsertStoredProducts warning:', e);
    }
  }
}

/** Marks everything not seen in `runId` as removed (rows are kept: orders and overrides refer to them). */
export async function markUnseenRemoved(runId: number): Promise<{ products: number; categories: number }> {
  const now = new Date().toISOString();
  const sb = getSupabase();
  if (sb) {
    const unseen = `last_seen_run_id.is.null,last_seen_run_id.neq.${Math.trunc(runId)}`;
    const products = await sb
      .from('provider_products')
      .update({ removed_at: now, available: false })
      .is('removed_at', null)
      .or(unseen)
      .select('id');
    if (products.error) fail('markRemoved products', products.error);
    const categories = await sb
      .from('provider_categories')
      .update({ removed_at: now })
      .is('removed_at', null)
      .or(unseen)
      .select('id');
    if (categories.error) fail('markRemoved categories', categories.error);
    return { products: products.data?.length || 0, categories: categories.data?.length || 0 };
  }
  const local = loadLocal();
  let products = 0;
  let categories = 0;
  for (const p of local.products) {
    if (!p.removedAt && p.lastSeenRunId !== runId) {
      p.removedAt = now;
      p.available = false;
      products++;
    }
  }
  for (const c of local.categories) {
    if (!c.removedAt && c.lastSeenRunId !== runId) {
      c.removedAt = now;
      categories++;
    }
  }
  saveLocal();
  return { products, categories };
}

export async function listCatalogOverrides(): Promise<CatalogOverride[]> {
  const local = loadLocal();
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('catalog_overrides').select('*');
      if (!error && data && data.length > 0) return data.map(mapOverride);
    } catch {}
  }
  return local.overrides;
}

export async function upsertCatalogOverride(override: CatalogOverride): Promise<CatalogOverride> {
  const local = loadLocal();
  const index = local.overrides.findIndex((o) => o.scope === override.scope && o.targetId === override.targetId);
  if (index === -1) local.overrides.push(override);
  else local.overrides[index] = override;
  saveLocal();

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('catalog_overrides')
        .upsert(
          {
            scope: override.scope,
            target_id: override.targetId,
            storefront_category: override.storefrontCategory ?? null,
            hidden: override.hidden ?? null,
            custom_name: override.customName ?? null,
            custom_description: override.customDescription ?? null,
            custom_image: override.customImage ?? null,
            custom_badge: override.customBadge ?? null,
            markup_percent: override.markupPercent ?? null,
            input_fields_override: override.inputFieldsOverride ?? null,
            sort_order: override.sortOrder ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'scope,target_id' }
        )
        .select()
        .maybeSingle();
      if (!error && data) return mapOverride(data);
    } catch {}
  }
  return override;
}

export async function startSyncRun(trigger: string): Promise<number> {
  const local = loadLocal();
  const localId = (local.runs[0]?.id || 0) + 1;
  local.runs.unshift({ id: localId, trigger, status: 'running', startedAt: new Date().toISOString() });
  local.runs = local.runs.slice(0, 50);
  saveLocal();

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('provider_sync_runs').insert({ trigger }).select('id').single();
      if (!error && data?.id) return Number(data.id);
    } catch {}
  }
  return localId;
}

export async function finishSyncRun(id: number, status: string, stats: SyncStats | null, error: string | null): Promise<void> {
  const local = loadLocal();
  const finishedAt = new Date().toISOString();
  const run = local.runs.find((r) => r.id === id);
  if (run) Object.assign(run, { status, stats, error, finishedAt });
  saveLocal();

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('provider_sync_runs').update({ status, stats, error, finished_at: finishedAt }).eq('id', id);
    } catch {}
  }
}

/** Cross-instance lock (Supabase) so two cron runs can't sync or refund at the same time. */
export async function acquireLock(name: string, ttlSeconds: number, holder: string): Promise<boolean> {
  const local = loadLocal();
  const existing = local.locks[name];
  if (existing && existing.lockedUntil > Date.now()) return false;
  local.locks[name] = { lockedUntil: Date.now() + ttlSeconds * 1000, holder };
  saveLocal();

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.rpc('acquire_cron_lock', { p_name: name, p_ttl_seconds: ttlSeconds, p_holder: holder });
      if (!error) return data === true;
      console.warn('Supabase acquire_cron_lock notice:', error.message);
    } catch {}
  }
  return true;
}

export async function releaseLock(name: string, holder: string): Promise<void> {
  const local = loadLocal();
  if (local.locks[name]?.holder === holder) delete local.locks[name];
  saveLocal();

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.rpc('release_cron_lock', { p_name: name, p_holder: holder });
    } catch {}
  }
}
