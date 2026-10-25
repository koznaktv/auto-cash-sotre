/**
 * Pure parsing of syria4game API responses (no network, no I/O).
 *
 * Only part of the API is documented (https://syria4game.com/api-docs/): product items are, but the
 * newOrder / check / profile / error bodies are not. Every parser therefore accepts several plausible
 * shapes and, when in doubt, returns a conservative result (PENDING / UNKNOWN / ambiguous) so that
 * money is never refunded or an order marked delivered on a guess.
 */
import type {
  CheckoutField,
  Delivery,
  ProviderCategory,
  ProviderProduct,
  QtyRule,
} from '../catalog/types';

// ---------------------------------------------------------------- helpers

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

let assetBase = '';

/** Base URL for relative image paths in provider responses (set by the API client). */
export function setAssetBase(base: string): void {
  assetBase = base.replace(/\/+$/, '');
}

/** Image URL, or undefined for empty values and bare hosts like "https://api.example.com/". */
function imageUrl(value: unknown): string | undefined {
  let text = toText(value);
  if (!text) return undefined;
  if (!/^https?:\/\//i.test(text)) {
    if (!assetBase || !/^\/?[\w\-./]+\.(webp|png|jpe?g|gif|svg)$/i.test(text)) return undefined;
    text = `${assetBase}/${text.replace(/^\/+/, '')}`;
  }
  try {
    const parsed = new URL(text);
    if (parsed.pathname.length <= 1 || parsed.pathname === '/') return undefined;
    if (
      parsed.hostname.includes('sahl-cash.com') &&
      !parsed.pathname.includes('/upload') &&
      !parsed.pathname.includes('/image') &&
      !/\.(png|jpe?g|webp|svg|gif)$/i.test(parsed.pathname)
    ) {
      return undefined;
    }
    return text;
  } catch {
    return undefined;
  }
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The payload inside a `{status:"OK", data: {...}}` envelope, or the body itself. */
function unwrap(data: any): any {
  if (isObject(data) && (isObject(data.data) || Array.isArray(data.data))) return data.data;
  return data;
}

function envelopeStatus(data: any): string {
  return isObject(data) ? toText(data.status).toLowerCase() : '';
}

// ---------------------------------------------------------------- errors

export type ProviderErrorKind =
  | 'auth'
  | 'not_allowed'
  | 'ip'
  | 'maintenance'
  | 'not_found'
  | 'insufficient_balance'
  | 'validation'
  | 'unknown';

export interface ProviderError {
  kind: ProviderErrorKind;
  code?: number;
  message: string;
}

// Codes from the provider docs. 114 / 500 ("unknown error") are left out on purpose: they don't
// prove the order wasn't created, so they stay ambiguous (kept for review, not auto-refunded).
const CODE_KINDS: Record<number, ProviderErrorKind> = {
  120: 'auth', // Api Token is required
  121: 'auth', // Token error
  122: 'not_allowed', // Not allowed to use API
  123: 'ip', // IP not allowed
  130: 'maintenance', // Site under maintenance
  100: 'insufficient_balance', // Insufficient balance (our provider wallet)
  105: 'validation', // Quantity not available
  106: 'validation', // Quantity not allowed
  107: 'validation', // Player ID blocked
  108: 'not_allowed', // 2FA required
  109: 'not_found', // Product deleted or not found
  110: 'not_found', // Product not available now
  111: 'validation', // Try again after 1 minute
  112: 'validation', // Quantity is too small
  113: 'validation', // Quantity is too large
};

/** Errors that mean the provider refused the request before doing anything. */
export function isDefiniteRejection(error: ProviderError): boolean {
  return error.kind !== 'unknown';
}

/** Error kinds that should pause all ordering until an admin looks at the provider account. */
export function shouldPauseOrders(error: ProviderError): boolean {
  return error.kind === 'auth' || error.kind === 'ip' || error.kind === 'maintenance' || error.kind === 'not_allowed';
}

function findErrorCode(data: any): number | null {
  if (!isObject(data)) return null;
  const candidates = [
    data.error?.code,
    data.code,
    data.error_code,
    data.errorCode,
    typeof data.error === 'number' || typeof data.error === 'string' ? data.error : undefined,
    data.data?.code,
  ];
  for (const c of candidates) {
    const n = toNumber(c);
    if (n !== null && n >= 100 && n < 1000) return n;
  }
  const leading = toText(data.message || data.error?.message).match(/^(\d{3})\b/);
  return leading ? Number(leading[1]) : null;
}

function findErrorMessage(data: any): string {
  if (!isObject(data)) return toText(data);
  return (
    toText(data.error?.message) ||
    toText(typeof data.error === 'string' ? data.error : '') ||
    toText(data.message) ||
    toText(data.msg) ||
    toText(data.data?.message)
  );
}

/**
 * Returns the error a response represents, or null when it isn't one.
 * `httpStatus` 0 means the body came from a failed request with no response.
 */
export function parseProviderError(data: unknown, httpStatus: number): ProviderError | null {
  const status = envelopeStatus(data);
  const hasErrorEnvelope =
    status === 'error' || status === 'fail' || status === 'failed' || (isObject(data) && data.success === false);
  const hasErrorField =
    isObject(data) && data.error !== undefined && data.error !== null && data.error !== false && data.error !== '' && data.error !== 0;
  const isHttpError = httpStatus >= 400;

  if (!hasErrorEnvelope && !hasErrorField && !isHttpError) return null;

  const code = findErrorCode(data);
  const message = findErrorMessage(data) || (httpStatus ? `HTTP ${httpStatus}` : 'Provider error');

  if (code !== null && CODE_KINDS[code]) return { kind: CODE_KINDS[code], code, message };
  if (code === 123 || /ip\s*(not\s*allowed|address|blocked|invalid|error)/i.test(message)) {
    return { kind: 'ip', code: code ?? 123, message: message || 'IP not allowed' };
  }
  // "Unknown error" codes: the order may or may not exist, so never treat them as a refusal
  if (code === 114 || code === 500) return { kind: 'unknown', code, message };
  if (/balance|رصيد|insufficient/i.test(message)) return { kind: 'insufficient_balance', code: code ?? undefined, message };
  if (httpStatus >= 500) return { kind: 'unknown', code: code ?? undefined, message };
  if (isHttpError || hasErrorEnvelope || hasErrorField) {
    // A structured refusal (4xx or an explicit error envelope) is a definite "no"
    return { kind: isObject(data) ? 'validation' : 'unknown', code: code ?? undefined, message };
  }
  return { kind: 'unknown', code: code ?? undefined, message };
}

// ---------------------------------------------------------------- catalog

export function normalizeCategory(raw: any, parentOverride?: number | null): ProviderCategory | null {
  if (!isObject(raw)) return null;
  const id = toNumber(raw.id ?? raw.category_id);
  if (id === null) return null;
  const parent = parentOverride !== undefined ? parentOverride : toNumber(raw.parent_id ?? raw.parentId);
  return {
    id,
    parentId: parent && parent !== id ? parent : null,
    name: toText(raw.name ?? raw.title ?? raw.category_name) || `#${id}`,
    image: imageUrl(raw.image ?? raw.img ?? raw.category_img),
  };
}

/** Flattens a nested category tree (children / subcategories / categories) into a list. */
export function flattenCategories(input: unknown, parentId: number | null = null, out: ProviderCategory[] = []): ProviderCategory[] {
  if (!Array.isArray(input)) return out;
  for (const raw of input) {
    const explicitParent = isObject(raw) ? toNumber(raw.parent_id ?? raw.parentId) : null;
    const category = normalizeCategory(raw, explicitParent ?? parentId);
    if (!category) continue;
    out.push(category);
    const children = raw.children ?? raw.subcategories ?? raw.sub_categories ?? raw.categories;
    if (Array.isArray(children)) flattenCategories(children, category.id, out);
  }
  return out;
}

export function normalizeProduct(raw: any): ProviderProduct | null {
  if (!isObject(raw)) return null;
  const id = toNumber(raw.id ?? raw.product_id);
  const price = toNumber(raw.price ?? raw.cost);
  if (id === null || price === null || price < 0) return null;
  const categoryId = toNumber(raw.category_id ?? raw.parent_id) ?? 0;
  return {
    id,
    name: toText(raw.name ?? raw.title) || `#${id}`,
    costPrice: price,
    currency: (toText(raw.currency) || 'USD').toUpperCase(),
    categoryId,
    parentId: toNumber(raw.parent_id),
    categoryName: toText(raw.category_name),
    available:
      raw.available !== false &&
      raw.available !== 0 &&
      raw.available !== '0' &&
      raw.status !== 0 &&
      raw.status !== false &&
      raw.status !== '0' &&
      raw.is_available !== false &&
      raw.is_available !== 0 &&
      raw.is_available !== '0' &&
      !String(raw.status || '').toLowerCase().includes('غير متوفر') &&
      !String(raw.available || '').toLowerCase().includes('غير متوفر') &&
      !String(raw.availability || '').toLowerCase().includes('غير متوفر') &&
      !String(raw.name || '').toLowerCase().includes('غير متوفر') &&
      !String(raw.title || '').toLowerCase().includes('غير متوفر') &&
      !String(raw.status || '').toLowerCase().includes('unavailable') &&
      !String(raw.status || '').toLowerCase().includes('paused'),
    productType: toText(raw.product_type) || 'package',
    inputSchema: raw.input_schema ?? [],
    params: raw.params ?? [],
    qtyValues: raw.qty_values ?? null,
    image: imageUrl(raw.image),
    categoryImage: imageUrl(raw.category_img),
  };
}

export interface ParsedCatalog {
  categories: ProviderCategory[];
  products: ProviderProduct[];
}

/** Parses `/client/api/catalog`, `/products`, or `/products-wrapped` bodies. */
export function parseCatalog(data: unknown): ParsedCatalog {
  const body: any = data;
  let rawProducts: unknown[] = [];
  if (Array.isArray(body)) {
    rawProducts = body;
  } else if (body && typeof body === 'object') {
    if (Array.isArray(body.products)) {
      rawProducts = body.products;
    } else if (Array.isArray(body.data?.products)) {
      rawProducts = body.data.products;
    } else if (Array.isArray(body.items)) {
      rawProducts = body.items;
    } else if (Array.isArray(body.data)) {
      rawProducts = body.data;
    } else {
      const vals = Object.values(body);
      if (
        vals.length > 0 &&
        typeof vals[0] === 'object' &&
        vals[0] !== null &&
        ('id' in (vals[0] as any) || 'price' in (vals[0] as any) || 'name' in (vals[0] as any))
      ) {
        rawProducts = vals;
      }
    }
  }

  const products: ProviderProduct[] = [];
  for (const raw of rawProducts) {
    const product = normalizeProduct(raw);
    if (product) products.push(product);
  }

  let categories: ProviderCategory[] = [];
  const flat = body?.flat_categories ?? body?.data?.flat_categories;
  if (Array.isArray(flat)) {
    categories = flat.map((c: any) => normalizeCategory(c)).filter((c: ProviderCategory | null): c is ProviderCategory => c !== null);
  } else {
    categories = flattenCategories(body?.categories ?? body?.data?.categories ?? body?.tree);
  }

  // Make sure every product's category exists, even when the body had no category list
  const known = new Set(categories.map((c) => c.id));
  for (const p of products) {
    if (p.categoryId && !known.has(p.categoryId)) {
      categories.push({
        id: p.categoryId,
        parentId: null,
        name: p.categoryName || `#${p.categoryId}`,
        image: p.categoryImage,
      });
      known.add(p.categoryId);
    }
  }

  return { categories, products };
}

// ---------------------------------------------------------------- checkout fields

const RESERVED_KEYS = new Set(['qty', 'order_uuid', 'api-token', 'api_token']);
const SAFE_KEY = /^[A-Za-z0-9_.\-[\]]{1,64}$/;

const KNOWN_LABELS: Record<string, string> = {
  playerid: 'ئويۇنچى ID (Player ID)',
  player_id: 'ئويۇنچى ID (Player ID)',
  userid: 'ئويۇنچى ID (User ID)',
  user_id: 'ئويۇنچى ID (User ID)',
  uid: 'UID',
  zoneid: 'رايون ID (Zone ID)',
  zone_id: 'رايون ID (Zone ID)',
  zone: 'رايون (Zone)',
  server: 'مۇلازىمېتىر (Server)',
  serverid: 'مۇلازىمېتىر ID (Server ID)',
  email: 'ئېلخەت ئادرېسى',
  phone: 'تېلېفون نومۇرى',
  mobile: 'تېلېفون نومۇرى',
  number: 'نومۇر',
  username: 'ئىشلەتكۈچى نامى (Username)',
  'user name': 'ئىشلەتكۈچى نامى (Username)',
  'اسم المستخدم': 'ئىشلەتكۈچى نامى (Username)',
  password: 'مەخپىي نومۇر (Password)',
  pass: 'مەخپىي نومۇر (Password)',
  'كلمة سر': 'مەخپىي نومۇر (Password)',
  'كلمة السر': 'مەخپىي نومۇر (Password)',
  imei: 'IMEI نومۇرى',
  link: 'ئۇلىنىش (Link)',
  url: 'ئۇلىنىش (URL)',
};

function fieldType(rawType: string, key: string): CheckoutField['type'] {
  const t = rawType.toLowerCase();
  if (t === 'select' || t === 'dropdown' || t === 'list') return 'select';
  if (t === 'email' || key.toLowerCase().includes('email')) return 'email';
  if (t === 'tel' || t === 'phone' || /phone|mobile/i.test(key)) return 'tel';
  if (t === 'number' || t === 'integer' || t === 'numeric') return 'number';
  return 'text';
}

function fieldFromRaw(raw: unknown, keyHint?: string): CheckoutField | null {
  let key = '';
  let label = '';
  let type = '';
  let required = true;
  let options: string[] | undefined;
  let pattern: string | undefined;
  let minLength: number | undefined;
  let maxLength: number | undefined;
  let placeholder: string | undefined;

  if (typeof raw === 'string') {
    key = keyHint || raw.trim();
  } else if (isObject(raw)) {
    key = toText(raw.name ?? raw.key ?? raw.field ?? raw.param) || keyHint || '';
    label = toText(raw.label ?? raw.title ?? raw.display_name);
    type = toText(raw.type);
    if (raw.required === false || raw.required === 0 || raw.optional === true) required = false;
    const rawOptions = raw.options ?? raw.values ?? raw.choices;
    if (Array.isArray(rawOptions)) {
      options = rawOptions
        .map((o: any) => (isObject(o) ? toText(o.value ?? o.name ?? o.label) : toText(o)))
        .filter(Boolean)
        .slice(0, 200);
    }
    pattern = toText(raw.pattern ?? raw.regex) || undefined;
    minLength = toNumber(raw.min_length ?? raw.minLength ?? raw.min) ?? undefined;
    maxLength = toNumber(raw.max_length ?? raw.maxLength ?? raw.max) ?? undefined;
    placeholder = toText(raw.placeholder ?? raw.hint) || undefined;
  } else {
    return null;
  }

  if (!SAFE_KEY.test(key) || RESERVED_KEYS.has(key.toLowerCase())) return null;

  const resolvedType = options && options.length ? 'select' : fieldType(type, key);
  return {
    key,
    label: label || KNOWN_LABELS[key.toLowerCase()] || key,
    type: resolvedType,
    required,
    ...(options && options.length ? { options } : {}),
    ...(pattern ? { pattern } : {}),
    ...(minLength !== undefined && minLength > 0 ? { minLength } : {}),
    ...(maxLength !== undefined && maxLength > 0 ? { maxLength } : {}),
    ...(placeholder ? { placeholder } : {}),
  };
}

// Query keys this API family is known to accept (the docs' example order uses `playerId`)
const KNOWN_PARAM_KEYS = ['playerId', 'zoneId', 'server', 'serverId'];
// Longer "params" entries are notes to the buyer (e.g. "this order is processed manually"), not inputs
const MAX_LABEL_LENGTH = 40;

/**
 * Plain string params are display labels ("User ID", "Account link", "Email", "Password").
 * Per the provider docs the first input is sent as `playerId` and any further inputs as extra
 * key=value pairs ("anyKey=anyVal"), so later labels get a readable ASCII key (or `paramN`).
 */
function fieldsFromLabels(labels: string[]): CheckoutField[] {
  const out: CheckoutField[] = [];
  const used = new Set<string>();
  const inputs = labels.map((l) => l.trim()).filter((l) => l && l.length <= MAX_LABEL_LENGTH);
  inputs.forEach((label, index) => {
    const knownKey = KNOWN_PARAM_KEYS.find((k) => k.toLowerCase() === label.toLowerCase());
    let key = knownKey || (index === 0 ? 'playerId' : '');
    if (!key) {
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
      key = slug && !RESERVED_KEYS.has(slug) && slug !== 'playerid' ? slug : `param${index + 1}`;
    }
    if (used.has(key)) key = `param${index + 1}`;
    used.add(key);
    out.push({
      key,
      label: KNOWN_LABELS[label.toLowerCase()] || label,
      type: fieldType('', label),
      required: true,
    });
  });
  return out;
}

function fieldsFrom(source: unknown): CheckoutField[] {
  const out: CheckoutField[] = [];
  if (Array.isArray(source)) {
    if (source.length && source.every((raw) => typeof raw === 'string')) return fieldsFromLabels(source as string[]);
    for (const raw of source) {
      const field = fieldFromRaw(raw);
      if (field) out.push(field);
    }
  } else if (isObject(source)) {
    for (const [key, raw] of Object.entries(source)) {
      const field = fieldFromRaw(isObject(raw) || typeof raw === 'string' ? raw : {}, key);
      if (field) out.push(field);
    }
  }
  return out;
}

/** Merges `input_schema` and `params` (by key, input_schema wins) into checkout fields. */
export function normalizeFields(inputSchema: unknown, params: unknown): CheckoutField[] {
  const merged = new Map<string, CheckoutField>();
  for (const field of fieldsFrom(params)) merged.set(field.key, field);
  for (const field of fieldsFrom(inputSchema)) merged.set(field.key, { ...merged.get(field.key), ...field });
  return Array.from(merged.values()).slice(0, 10);
}

/**
 * Quantity rules. "amount" products are priced per unit with a min/max; "specificPackage" products
 * are priced per unit but only sold in the listed quantities (which may be decimals, e.g. 23.07).
 */
export function normalizeQtyRule(qtyValues: unknown, productType: string): QtyRule {
  const type = productType.toLowerCase();
  if (type !== 'amount' && type !== 'specificpackage') return { kind: 'fixed' };

  if (Array.isArray(qtyValues)) {
    const values = qtyValues
      .map((v) => toNumber(isObject(v) ? v.value ?? v.qty : v))
      .filter((v): v is number => v !== null && v > 0);
    if (values.length) return { kind: 'list', values: Array.from(new Set(values)).sort((a, b) => a - b) };
  }
  if (type === 'specificpackage') return { kind: 'fixed' };
  if (isObject(qtyValues)) {
    const min = toNumber(qtyValues.min ?? qtyValues.from);
    const max = toNumber(qtyValues.max ?? qtyValues.to);
    const step = toNumber(qtyValues.step) ?? 1;
    if (min !== null && max !== null && min > 0 && max >= min) {
      return { kind: 'range', min: Math.ceil(min), max: Math.floor(max), step: Math.max(1, Math.floor(step)) };
    }
  }
  if (typeof qtyValues === 'string') {
    const range = qtyValues.match(/^\s*(\d+)\s*[-:]\s*(\d+)\s*$/);
    if (range && Number(range[2]) >= Number(range[1]) && Number(range[1]) > 0) {
      return { kind: 'range', min: Number(range[1]), max: Number(range[2]), step: 1 };
    }
    const list = qtyValues.split(/[,\s]+/).map(Number).filter((n) => Number.isInteger(n) && n > 0);
    if (list.length) return { kind: 'list', values: Array.from(new Set(list)).sort((a, b) => a - b) };
  }
  return { kind: 'range', min: 1, max: 1_000_000, step: 1 };
}

// ---------------------------------------------------------------- delivery

const DELIVERY_KEYS = [
  'replay_api',
  'replay',
  'reply_api',
  'reply',
  'response',
  'link',
  'url',
  'activation_link',
  'activation_url',
  'activationUrl',
  'invite_link',
  'invite_url',
  'inviteUrl',
  'codes',
  'code',
  'pin',
  'pins',
  'serial',
  'voucher',
  'card',
  'cards',
  'content',
  'delivery',
  'note',
  'comment',
  'message',
  'msg',
  'result',
  'account_credentials',
  'credentials',
  'account',
];

function isHttpUrl(str: string): boolean {
  return /^https?:\/\/[^\s"'<>]+/i.test(str.trim());
}

function collectStrings(value: unknown, out: string[], depth = 0): void {
  if (depth > 3 || out.length >= 50) return;
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    if (text && text.length <= 500) out.push(text);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out, depth + 1);
  } else if (isObject(value)) {
    const preferred = value.code ?? value.pin ?? value.serial ?? value.value ?? value.content;
    if (preferred !== undefined) collectStrings(preferred, out, depth + 1);
    else for (const item of Object.values(value)) collectStrings(item, out, depth + 1);
  }
}

/** Codes / text the provider delivered for an order, if the body contains any. */
export function extractDelivery(obj: unknown): Delivery | undefined {
  if (!isObject(obj)) return undefined;
  const isOrder = obj.order_id !== undefined || obj.orderId !== undefined;
  const sources = [obj, !isOrder && isObject(obj.data) ? obj.data : null].filter(Boolean) as Record<string, any>[];
  const codes: string[] = [];
  let foundUrl: string | undefined;
  let replyText: string | undefined;

  for (const source of sources) {
    for (const key of DELIVERY_KEYS) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
        const val = source[key];
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (isHttpUrl(trimmed) && !foundUrl) {
            foundUrl = trimmed;
          }
          if (['reply', 'reply_api', 'replay', 'replay_api', 'response', 'note', 'message', 'msg'].includes(key) && !replyText) {
            replyText = trimmed;
          }
        }
        collectStrings(val, codes);
      }
    }
    if (Array.isArray(source.items)) collectStrings(source.items, codes);
  }

  const unique = Array.from(new Set(codes)).slice(0, 50);

  if (!foundUrl) {
    const urlFromCodes = unique.find(isHttpUrl);
    if (urlFromCodes) foundUrl = urlFromCodes;
  }

  if (unique.length || foundUrl || replyText) {
    return {
      codes: unique,
      activationUrl: foundUrl,
      reply: replyText,
      text: replyText || (unique.length === 1 ? unique[0] : undefined),
    };
  }

  return undefined;
}

// ---------------------------------------------------------------- order status

export type ProviderOrderStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'UNKNOWN';

export function normalizeCheckStatus(raw: unknown): ProviderOrderStatus {
  const s = toText(raw).toLowerCase();
  if (!s) return 'UNKNOWN';
  if (/^(accept(ed)?|complete(d)?|done|success(ful)?|delivered|finished|1)$/.test(s)) return 'COMPLETED';
  if (/^(reject(ed)?|fail(ed)?|cancel(l)?ed|cancel|refund(ed)?|error|declined|-1)$/.test(s)) return 'FAILED';
  if (/^(wait(ing)?|pend(ing)?|process(ing)?|in_progress|queued|new|0)$/.test(s)) return 'PENDING';
  return 'UNKNOWN';
}

export interface OrderResponse {
  outcome: 'accepted' | 'rejected' | 'ambiguous';
  providerOrderId?: string;
  status: ProviderOrderStatus;
  delivery?: Delivery;
  message?: string;
  error?: ProviderError;
}

function findOrderId(body: any): string | undefined {
  if (!isObject(body)) return undefined;
  const id = toText(body.order_id ?? body.orderId ?? body.id ?? body.data?.order_id ?? body.data?.id);
  return id || undefined;
}

/** Interprets a newOrder response. `httpStatus` 0 = no response at all (network error / timeout). */
export function normalizeOrderResponse(data: unknown, httpStatus: number, bodyText = ''): OrderResponse {
  if (httpStatus === 0) {
    return { outcome: 'ambiguous', status: 'UNKNOWN', message: 'No response from provider' };
  }

  const error = parseProviderError(data, httpStatus);
  if (error) {
    if (isDefiniteRejection(error)) return { outcome: 'rejected', status: 'FAILED', error, message: error.message };
    return { outcome: 'ambiguous', status: 'UNKNOWN', error, message: error.message };
  }

  if (!isObject(data)) {
    // 2xx with an HTML / empty / non-JSON body: we can't tell what happened
    return { outcome: 'ambiguous', status: 'UNKNOWN', message: bodyText.slice(0, 200) || 'Unreadable provider response' };
  }

  const body = unwrap(data);
  const providerOrderId = findOrderId(body) || findOrderId(data);
  const orderStatusRaw =
    (isObject(body) && body !== data ? body.status ?? body.state : undefined) ??
    (['ok', 'success'].includes(envelopeStatus(data)) ? undefined : data.status ?? data.state);
  const status = normalizeCheckStatus(orderStatusRaw);
  const message = toText(isObject(body) ? body.message : '') || toText(data.message) || undefined;

  if (status === 'FAILED') {
    return { outcome: 'rejected', status: 'FAILED', providerOrderId, message };
  }
  if (!providerOrderId) {
    // Looks like success but we have nothing to track it by
    return { outcome: 'ambiguous', status: 'UNKNOWN', message };
  }
  return {
    outcome: 'accepted',
    providerOrderId,
    // Anything not explicitly completed is treated as pending and polled
    status: status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
    delivery: extractDelivery(body) || extractDelivery(data),
    message,
  };
}

export interface CheckEntry {
  status: ProviderOrderStatus;
  message?: string;
  delivery?: Delivery;
}

/** Parses a `/client/api/check` body, matching entries strictly by order id. */
export function parseCheckResponse(data: unknown, ids: string[]): Map<string, CheckEntry> {
  const wanted = new Set(ids.map(String));
  const result = new Map<string, CheckEntry>();
  const body = unwrap(data);

  const record = (id: string, item: any) => {
    if (!wanted.has(id) || !isObject(item)) return;
    const delivery = extractDelivery(item);
    const rawMsg = toText(item.message ?? item.reason ?? item.note ?? item.reply ?? item.response) || undefined;
    const urlMatch = rawMsg?.match(/https?:\/\/[^\s"'<>]+/i);
    const urlInMsg = urlMatch ? urlMatch[0] : undefined;
    if (urlInMsg && delivery && !delivery.activationUrl) {
      delivery.activationUrl = urlInMsg;
    }
    result.set(id, {
      status: normalizeCheckStatus(item.status ?? item.state ?? item.order_status),
      message: rawMsg,
      delivery: delivery || (urlInMsg ? { codes: [urlInMsg], activationUrl: urlInMsg, reply: rawMsg } : undefined),
    });
  };

  if (Array.isArray(body)) {
    for (const item of body) {
      if (isObject(item)) record(toText(item.order_id ?? item.orderId ?? item.id), item);
    }
  } else if (isObject(body)) {
    const ownId = toText(body.order_id ?? body.orderId ?? body.id);
    if (ownId) {
      record(ownId, body);
    } else {
      for (const [key, item] of Object.entries(body)) record(key, item);
    }
  }
  return result;
}

// ---------------------------------------------------------------- profile

export function parseProfile(data: unknown): { balance: number | null; currency: string; userName?: string } {
  const body: any = unwrap(data);
  const balance =
    toNumber(body?.balance) ?? toNumber(body?.credit) ?? toNumber((data as any)?.balance) ?? toNumber((data as any)?.credit);
  return {
    balance,
    currency: (toText(body?.currency ?? (data as any)?.currency) || 'USD').toUpperCase(),
    userName: toText(body?.name ?? body?.username ?? body?.user?.name) || undefined,
  };
}
