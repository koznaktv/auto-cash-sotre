/**
 * AUTO CASH - syria4game.com reseller API client
 * Docs: https://syria4game.com/api-docs/
 *
 * - Auth: `api-token` header only (the docs say never to put the token in the URL)
 * - Ping:     GET /client/api/ping
 * - Profile:  GET /client/api/profile
 * - Catalog:  GET /client/api/catalog            (fallback: /products + /categories/all)
 * - Product:  GET /client/api/products?products_id={id}
 * - Order:    GET /client/api/newOrder/{product_id}/params?qty=..&order_uuid=..&<field>=..
 * - Check:    GET /client/api/check?orders=[id1,id2]
 *
 * Response bodies are parsed by ./syria4gameNormalize. Every call is recorded in provider_calls.
 */
import { logProviderCall } from '../provider/callLog';
import type { ProviderProduct } from '../catalog/types';
import {
  setAssetBase,
  normalizeCheckStatus,
  extractDelivery,
  normalizeOrderResponse,
  normalizeProduct,
  parseCatalog,
  parseCheckResponse,
  parseProfile,
  parseProviderError,
  type CheckEntry,
  type OrderResponse,
  type ParsedCatalog,
  type ProviderError,
} from './syria4gameNormalize';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHECK_BATCH_SIZE = 20;

export function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isUuidV4(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

interface RequestResult {
  httpStatus: number; // 0 = no response (network error / timeout)
  data: any;
  text: string;
  durationMs: number;
  networkError?: string;
}

interface RequestOptions {
  endpoint: string;
  query?: Record<string, string | number | undefined>;
  timeoutMs: number;
  retries?: number;
  auth?: boolean;
  orderId?: string;
}

const NOT_CONFIGURED: ProviderError = {
  kind: 'auth',
  message: 'SYRIA4GAME_API_TOKEN مۇھىت ئۆزگەرگۈچىسى تەڭشەلمىگەن',
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { getSystemSettingsAsync } from '../db';

interface ResolvedProviderConfig {
  baseUrl: string;
  apiToken: string;
  apiType: 'syria4game' | 'smm' | 'custom_rest';
  apiSecret?: string;
  enabled: boolean;
}

export class Syria4GameProvider {
  private defaultBaseUrl: string;
  private defaultApiToken: string;

  constructor() {
    const rawUrl = process.env.SYRIA4GAME_BASE_URL || 'https://syria4game.com';
    this.defaultBaseUrl = rawUrl.replace(/\/+$/, '');
    setAssetBase(this.defaultBaseUrl);
    const rawToken = (process.env.SYRIA4GAME_API_TOKEN || process.env.SYRIA4GAME_API_KEY || '').trim();
    this.defaultApiToken = rawToken.replace(/^["']|["']$/g, '').trim();
  }

  public async getResolvedConfig(): Promise<ResolvedProviderConfig> {
    try {
      const settings = await getSystemSettingsAsync();
      const baseUrl = (settings.providerApiUrl || this.defaultBaseUrl || 'https://syria4game.com').replace(/\/+$/, '');
      const apiToken = (settings.providerApiKey !== undefined && settings.providerApiKey !== ''
        ? settings.providerApiKey
        : this.defaultApiToken
      ).trim();
      const apiType = settings.providerApiType || 'syria4game';
      const apiSecret = settings.providerApiSecret || undefined;
      const enabled = settings.providerEnabled !== false;
      return { baseUrl, apiToken, apiType, apiSecret, enabled };
    } catch {
      return {
        baseUrl: this.defaultBaseUrl,
        apiToken: this.defaultApiToken,
        apiType: 'syria4game',
        enabled: true,
      };
    }
  }

  public hasLiveToken(): boolean {
    return this.defaultApiToken.length > 5;
  }

  public async hasLiveConfig(): Promise<boolean> {
    const cfg = await this.getResolvedConfig();
    return Boolean(cfg.enabled && cfg.apiToken && cfg.apiToken.length > 3);
  }

  private buildUrlWithBase(baseUrl: string, path: string, query: Record<string, string | number | undefined> = {}): string {
    const isFullUrl = path.startsWith('http://') || path.startsWith('https://');
    const url = isFullUrl ? new URL(path) : new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private async request(path: string, options: RequestOptions): Promise<RequestResult> {
    const config = await this.getResolvedConfig();
    setAssetBase(config.baseUrl);
    const url = this.buildUrlWithBase(config.baseUrl, path, options.query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'AUTO-CASH/3.0',
    };
    if (options.auth !== false && config.apiToken) {
      headers['api-token'] = config.apiToken;
      // Also provide standard Authorization header for general REST APIs
      if (config.apiType === 'custom_rest') {
        headers['Authorization'] = `Bearer ${config.apiToken}`;
      }
    }

    const attempts = 1 + (options.retries || 0);
    let result: RequestResult = { httpStatus: 0, data: null, text: '', durationMs: 0 };

    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt > 0) await sleep(attempt === 1 ? 500 : 1500);
      const started = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs);
      try {
        const res = await fetch(url, { method: 'GET', headers, signal: controller.signal, cache: 'no-store' });
        const text = await res.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }
        result = { httpStatus: res.status, data, text, durationMs: Date.now() - started };
      } catch (err: any) {
        result = {
          httpStatus: 0,
          data: null,
          text: '',
          durationMs: Date.now() - started,
          networkError: err?.name === 'AbortError' ? `Timeout after ${options.timeoutMs}ms` : err?.message || 'Network error',
        };
      } finally {
        clearTimeout(timer);
      }

      const retryable = result.httpStatus === 0 || result.httpStatus >= 500 || result.httpStatus === 429;
      if (!retryable || attempt === attempts - 1) break;
    }

    const error = result.httpStatus ? parseProviderError(result.data, result.httpStatus) : null;
    await logProviderCall({
      orderId: options.orderId,
      endpoint: options.endpoint,
      urlRedacted: url,
      httpStatus: result.httpStatus,
      durationMs: result.durationMs,
      outcome: result.networkError ? 'network_error' : error ? `error:${error.kind}` : 'ok',
      errorCode: error?.code ?? null,
      responseBody: result.networkError || result.text,
    });
    return result;
  }

  private failure(result: RequestResult): ProviderError {
    if (result.networkError) return { kind: 'unknown', message: result.networkError };
    return (
      parseProviderError(result.data, result.httpStatus) || {
        kind: 'unknown',
        message: result.data ? `HTTP ${result.httpStatus}` : `HTTP ${result.httpStatus}: JSON بولمىغان جاۋاب`,
      }
    );
  }

  private isSuccess(result: RequestResult): boolean {
    return result.httpStatus >= 200 && result.httpStatus < 300 && result.data !== null && !parseProviderError(result.data, result.httpStatus);
  }

  async ping(): Promise<{ success: boolean; error?: ProviderError; raw?: unknown }> {
    const config = await this.getResolvedConfig();
    if (!config.enabled) {
      return { success: false, error: { kind: 'auth', message: 'تەمىنلىگۈچى API تاقالغان (Disabled)' } };
    }
    if (config.apiType === 'smm') {
      const res = await this.request('', {
        endpoint: 'smm_balance',
        query: { key: config.apiToken, action: 'balance' },
        timeoutMs: 10000,
        retries: 1,
        auth: false,
      });
      return this.isSuccess(res)
        ? { success: true, raw: res.data ?? res.text }
        : { success: false, error: this.failure(res) };
    }
    const res = await this.request('/client/api/ping', { endpoint: 'ping', timeoutMs: 10000, retries: 1, auth: false });
    return this.isSuccess(res) || (res.httpStatus >= 200 && res.httpStatus < 300)
      ? { success: true, raw: res.data ?? res.text }
      : { success: false, error: this.failure(res) };
  }

  async getProfile(): Promise<{
    success: boolean;
    balance: number | null;
    currency: string;
    userName?: string;
    error?: ProviderError;
    raw?: unknown;
  }> {
    const config = await this.getResolvedConfig();
    if (!config.enabled) {
      return { success: false, balance: null, currency: 'USD', error: { kind: 'auth', message: 'تەمىنلىگۈچى API تاقالغان (Disabled)' } };
    }
    if (!config.apiToken || config.apiToken.length < 3) {
      return { success: false, balance: null, currency: 'USD', error: NOT_CONFIGURED };
    }

    if (config.apiType === 'smm') {
      // Standard SMM Panel API v2: ?key=KEY&action=balance -> { balance: "12.34", currency: "USD" }
      const res = await this.request('', {
        endpoint: 'smm_balance',
        query: { key: config.apiToken, action: 'balance' },
        timeoutMs: 12000,
        retries: 2,
        auth: false,
      });
      if (!this.isSuccess(res)) return { success: false, balance: null, currency: 'USD', error: this.failure(res) };
      const rawBalance = res.data?.balance ?? res.data?.credit ?? res.data?.funds;
      const balance = rawBalance !== undefined ? parseFloat(String(rawBalance)) : null;
      const currency = (res.data?.currency || 'USD').toUpperCase();
      return {
        success: true,
        balance: Number.isFinite(balance) ? balance : null,
        currency,
        userName: res.data?.user || res.data?.username || 'SMM Provider',
        raw: res.data,
      };
    }

    if (config.apiType === 'custom_rest') {
      // Custom REST endpoint: Try /api/balance or /balance or root
      const res = await this.request('/balance', { endpoint: 'custom_balance', timeoutMs: 10000, retries: 1 });
      if (this.isSuccess(res)) {
        return { success: true, ...parseProfile(res.data), raw: res.data };
      }
      // Fallback try root or /client/api/profile
    }

    // Default: Syria4Game protocol
    const res = await this.request('/client/api/profile', { endpoint: 'profile', timeoutMs: 10000, retries: 2 });
    if (!this.isSuccess(res)) return { success: false, balance: null, currency: 'USD', error: this.failure(res) };
    return { success: true, ...parseProfile(res.data), raw: res.data };
  }

  /** Full catalog in one call; falls back to /products + /categories/all. */
  async getCatalog(): Promise<{ success: boolean; catalog?: ParsedCatalog; source?: string; error?: ProviderError }> {
    if (!this.hasLiveToken()) return { success: false, error: NOT_CONFIGURED };

    const res = await this.request('/client/api/catalog', { endpoint: 'catalog', timeoutMs: 45000, retries: 1 });
    if (this.isSuccess(res)) {
      const catalog = parseCatalog(res.data);
      if (catalog.products.length > 0) return { success: true, catalog, source: 'catalog' };
    }

    const productsRes = await this.request('/client/api/products', { endpoint: 'products', timeoutMs: 45000, retries: 1 });
    if (!this.isSuccess(productsRes)) return { success: false, error: this.failure(productsRes) };
    const catalog = parseCatalog(productsRes.data);

    // Category names/parents: the /content tree (root + one level), else /categories/all
    const treeCategories = await this.getCategoryTree();
    const fromCategories = parseCatalog({ flat_categories: treeCategories, products: [] }).categories;
    const byId = new Map(catalog.categories.map((c) => [c.id, c]));
    for (const category of fromCategories) byId.set(category.id, { ...byId.get(category.id), ...category });
    catalog.categories = Array.from(byId.values());
    return { success: true, catalog, source: 'products' };
  }

  /** Root categories from /content/0 plus their direct children (a handful of calls, in parallel). */
  private async getCategoryTree(): Promise<unknown[]> {
    const rootRes = await this.request('/client/api/content/0', { endpoint: 'content', timeoutMs: 15000, retries: 1 });
    const roots: any[] = this.isSuccess(rootRes) ? rootRes.data?.categories ?? rootRes.data?.data?.categories ?? [] : [];
    if (!Array.isArray(roots) || roots.length === 0) {
      const allRes = await this.request('/client/api/categories/all', { endpoint: 'categories', timeoutMs: 20000, retries: 1 });
      if (!this.isSuccess(allRes)) return [];
      const body = allRes.data;
      return Array.isArray(body) ? body : body?.categories ?? body?.data ?? body?.items ?? [];
    }

    const all: any[] = roots.map((r) => ({ ...r, parent_id: Number(r.parent_id) || null }));
    const rootIds = roots.map((r) => Number(r.id)).filter((id) => Number.isInteger(id) && id > 0).slice(0, 60);
    for (let i = 0; i < rootIds.length; i += 5) {
      const batch = rootIds.slice(i, i + 5);
      const results = await Promise.all(
        batch.map((id) => this.request(`/client/api/content/${id}`, { endpoint: 'content', timeoutMs: 15000, retries: 1 }))
      );
      results.forEach((res, index) => {
        if (!this.isSuccess(res)) return;
        const children = res.data?.categories ?? res.data?.data?.categories ?? [];
        if (Array.isArray(children)) {
          for (const child of children) all.push({ ...child, parent_id: Number(child.parent_id) || batch[index] });
        }
      });
    }
    return all;
  }

  async getProducts(): Promise<{ success: boolean; products: ProviderProduct[]; errorMessage?: string }> {
    const result = await this.getCatalog();
    return result.success
      ? { success: true, products: result.catalog!.products }
      : { success: false, products: [], errorMessage: result.error?.message };
  }

  /** Live data for one product (used to confirm price and availability before charging). */
  async getProduct(
    productId: number
  ): Promise<{ success: boolean; product?: ProviderProduct; notFound?: boolean; error?: ProviderError }> {
    if (!this.hasLiveToken()) return { success: false, error: NOT_CONFIGURED };
    const res = await this.request('/client/api/products', {
      endpoint: 'product',
      query: { products_id: productId },
      timeoutMs: 6000,
      retries: 1,
    });
    if (!this.isSuccess(res)) {
      const error = this.failure(res);
      return { success: false, error, notFound: error.kind === 'not_found' };
    }
    const body = res.data;
    const list: unknown[] = Array.isArray(body) ? body : body?.products ?? (Array.isArray(body?.data) ? body.data : [body?.data ?? body]);
    const product = list.map(normalizeProduct).find((p) => p && p.id === productId) || undefined;
    return product ? { success: true, product } : { success: false, notFound: true };
  }

  /** Places an order. Never retried automatically: a retry could buy the same thing twice. */
  async createOrder(input: {
    productId: number;
    qty: number;
    params: Record<string, string>;
    orderUuid: string;
    orderId: string;
  }): Promise<OrderResponse & { orderUuid: string }> {
    const config = await this.getResolvedConfig();
    if (!config.enabled || !config.apiToken) {
      return { outcome: 'rejected', status: 'FAILED', error: NOT_CONFIGURED, message: NOT_CONFIGURED.message, orderUuid: input.orderUuid };
    }
    if (!isUuidV4(input.orderUuid)) throw new Error('order_uuid must be a UUIDv4');

    if (config.apiType === 'smm') {
      // Standard SMM: action=add&service={serviceId}&link={link}&quantity={qty}
      const targetLink = Object.values(input.params)[0] || '';
      const smmQuery: Record<string, string | number> = {
        key: config.apiToken,
        action: 'add',
        service: input.productId,
        link: targetLink,
        quantity: input.qty,
      };
      const res = await this.request('', {
        endpoint: 'smm_order',
        query: smmQuery,
        timeoutMs: 25000,
        retries: 0,
        orderId: input.orderId,
        auth: false,
      });
      if (this.isSuccess(res) && res.data?.order) {
        return {
          outcome: 'accepted',
          providerOrderId: String(res.data.order),
          status: 'PENDING',
          orderUuid: input.orderUuid,
        };
      }
      return { ...normalizeOrderResponse(res.data, res.httpStatus, res.text), orderUuid: input.orderUuid };
    }

    const query: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(input.params)) {
      if (key !== 'qty' && key !== 'order_uuid') query[key] = value;
    }
    query.qty = input.qty;
    query.order_uuid = input.orderUuid;

    const res = await this.request(`/client/api/newOrder/${encodeURIComponent(String(input.productId))}/params`, {
      endpoint: 'newOrder',
      query,
      timeoutMs: 25000,
      retries: 0,
      orderId: input.orderId,
    });
    return { ...normalizeOrderResponse(res.data, res.httpStatus, res.text), orderUuid: input.orderUuid };
  }

  /**
   * Looks an order up by our order_uuid (docs: `check?orders=[uuid]&uuid=1`). Used for orders whose
   * newOrder response was lost or unclear, so they can be settled without guessing.
   */
  async checkOrderByUuid(
    orderUuid: string
  ): Promise<{
    success: boolean;
    found: boolean;
    /** True only when the provider answered with an empty list: no order exists for this uuid */
    absent?: boolean;
    providerOrderId?: string;
    entry?: CheckEntry;
    error?: ProviderError;
  }> {
    const config = await this.getResolvedConfig();
    if (!config.enabled || !config.apiToken) return { success: false, found: false, error: NOT_CONFIGURED };
    if (!isUuidV4(orderUuid)) return { success: false, found: false };
    const res = await this.request('/client/api/check', {
      endpoint: 'check',
      query: { orders: `[${orderUuid}]`, uuid: 1 },
      timeoutMs: 10000,
      retries: 2,
    });
    if (!this.isSuccess(res)) return { success: false, found: false, error: this.failure(res) };
    const body = res.data?.data ?? res.data;
    const items: any[] = Array.isArray(body) ? body : body && typeof body === 'object' && body.order_id ? [body] : [];
    // One uuid per request, so a single result can only be that order
    if (items.length !== 1) return { success: true, found: false, absent: items.length === 0 };
    const item = items[0];
    return {
      success: true,
      found: true,
      providerOrderId: item.order_id !== undefined ? String(item.order_id) : undefined,
      entry: {
        status: normalizeCheckStatus(item.status),
        message: typeof item.message === 'string' ? item.message : undefined,
        delivery: extractDelivery(item),
      },
    };
  }

  /** Status of several provider orders, matched strictly by provider order id. */
  async checkOrders(ids: string[]): Promise<{ success: boolean; entries: Map<string, CheckEntry>; error?: ProviderError }> {
    const entries = new Map<string, CheckEntry>();
    const config = await this.getResolvedConfig();
    if (!config.enabled || !config.apiToken) return { success: false, entries, error: NOT_CONFIGURED };

    if (config.apiType === 'smm') {
      // SMM Panel status: action=status&orders=id1,id2 or action=status&order=id
      for (const id of ids) {
        const res = await this.request('', {
          endpoint: 'smm_status',
          query: { key: config.apiToken, action: 'status', order: id },
          timeoutMs: 10000,
          retries: 1,
          auth: false,
        });
        if (this.isSuccess(res) && res.data) {
          const rawStatus = (res.data.status || '').toUpperCase();
          let status: any = 'PENDING';
          if (rawStatus === 'COMPLETED' || rawStatus === 'COMPLETE') status = 'COMPLETED';
          else if (rawStatus === 'CANCELED' || rawStatus === 'CANCELLED' || rawStatus === 'REFUNDED') status = 'CANCELED';
          else if (rawStatus === 'IN_PROGRESS' || rawStatus === 'PROCESSING') status = 'PENDING';
          entries.set(id, {
            status,
            message: res.data.remains ? `Remains: ${res.data.remains}` : undefined,
          });
        }
      }
      return { success: entries.size > 0, entries };
    }

    let lastError: ProviderError | undefined;
    for (let i = 0; i < ids.length; i += CHECK_BATCH_SIZE) {
      const batch = ids.slice(i, i + CHECK_BATCH_SIZE);
      const res = await this.request('/client/api/check', {
        endpoint: 'check',
        query: { orders: `[${batch.join(',')}]` },
        timeoutMs: 10000,
        retries: 2,
      });
      if (!this.isSuccess(res)) {
        lastError = this.failure(res);
        continue;
      }
      parseCheckResponse(res.data, batch).forEach((entry, id) => entries.set(id, entry));
    }
    return { success: !lastError || entries.size > 0, entries, error: lastError };
  }
}

export const syria4GameProvider = new Syria4GameProvider();
