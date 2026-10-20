import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabase } from './supabase';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  passwordHash: string;
  salt: string;
  balance: number;
  totalSpent: number;
  vipTier: 'vip1' | 'vip2' | 'vip3' | 'vip4' | 'vip5';
  role: 'user' | 'admin';
  createdAt: string;
  isBanned?: boolean;
}

export interface OrderRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  serviceId: string;
  serviceName: string;
  packageTitle: string;
  amount: number;
  targetAccount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'pending_provider';
  createdAt: string;
  details?: {
    smsCode?: string;
    virtualNumber?: string;
    accountCredentials?: string;
    refundReason?: string;
    providerOrderId?: string;
    cardDetails?: {
      number: string;
      exp: string;
      cvv: string;
    };
    [key: string]: any;
  };
}

export const ORDER_STATUSES: OrderRecord['status'][] = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
  'pending_provider',
];

export interface DepositRecord {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  method: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  date: string;
  txId?: string;
  reviewedAt?: string;
}

export interface SystemSettings {
  adminPin: string;
  shamcashAddress: string;
  whatsappNumber: string;
  telegramUsername: string;
  siteName: string;
  siteLogo?: string;
  providerApiUrl?: string;
  providerApiKey?: string;
  providerApiType?: 'syria4game' | 'smm' | 'custom_rest';
  providerApiSecret?: string;
  providerEnabled?: boolean;
  tsaApiKey?: string;
  tsaAutoDepositEnabled?: boolean;
  shamcashExchangeRate?: number;
}

interface DatabaseSchema {
  users: UserRecord[];
  orders: OrderRecord[];
  deposits: DepositRecord[];
  settings: SystemSettings;
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'autocash_db.json');
const DB_FILE = path.join(DATA_DIR, 'autocash_db.json');

export function randomId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function nowFormatted(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

// Password hashing utilities
export function hashPassword(password: string, salt?: string): { passwordHash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { passwordHash: hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!hash || !salt) return false;
  const result = Buffer.from(hashPassword(password, salt).passwordHash, 'hex');
  const expected = Buffer.from(hash, 'hex');
  return result.length === expected.length && crypto.timingSafeEqual(result, expected);
}

// Initial seed data (no pre-built accounts: they would ship with publicly known passwords)
const initialDefaultData: DatabaseSchema = {
  settings: {
    adminPin: '9960996',
    shamcashAddress: 'efe8a2b200d66411c7c7e296369cbba8',
    whatsappNumber: '+963 984 373 459',
    telegramUsername: 'autocash_UYGHUR',
    siteName: 'AUTO CASH',
    siteLogo: '/logo.png',
    providerApiUrl: process.env.SAHL_CASH_BASE_URL || process.env.SYRIA4GAME_BASE_URL || 'https://api.sahl-cash.com',
    providerApiKey: process.env.SAHL_CASH_API_TOKEN || process.env.SAHL_CASH_API_KEY || process.env.SYRIA4GAME_API_TOKEN || process.env.SYRIA4GAME_API_KEY || '',
    providerApiType: 'syria4game',
    providerApiSecret: '',
    providerEnabled: true,
    tsaApiKey: process.env.TSA_API_KEY || '',
    tsaAutoDepositEnabled: true,
    shamcashExchangeRate: Number(process.env.SHAMCASH_EXCHANGE_RATE || 15000),
  },
  users: [],
  orders: [],
  deposits: [],
};

// Memory cache to accelerate reads while syncing with disk
let cachedDb: DatabaseSchema | null = null;

function ensureDbFile(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  try {
    const fileToRead = fs.existsSync(DB_FILE) ? DB_FILE : fs.existsSync(BUNDLED_DB_FILE) ? BUNDLED_DB_FILE : null;

    if (!fileToRead) {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(initialDefaultData, null, 2), 'utf-8');
      } catch {}
      cachedDb = JSON.parse(JSON.stringify(initialDefaultData));
      return cachedDb!;
    }

    const raw = fs.readFileSync(fileToRead, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;

    // Ensure all required fields exist
    if (!parsed.users) parsed.users = [];
    if (!parsed.orders) parsed.orders = [];
    if (!parsed.deposits) parsed.deposits = [];
    if (!parsed.settings) parsed.settings = { ...initialDefaultData.settings };
    if (!parsed.settings.providerApiUrl || parsed.settings.providerApiUrl.includes('syria4game')) {
      parsed.settings.providerApiUrl = 'https://api.sahl-cash.com';
    }
    const envProvToken = process.env.SAHL_CASH_API_TOKEN || process.env.SYRIA4GAME_API_TOKEN;
    if (!parsed.settings.providerApiKey && envProvToken) {
      parsed.settings.providerApiKey = envProvToken;
    }

    cachedDb = parsed;
    return cachedDb;
  } catch (err) {
    console.error('Error reading database file, using fallback cache:', err);
    if (!cachedDb) {
      cachedDb = JSON.parse(JSON.stringify(initialDefaultData));
    }
    return cachedDb!;
  }
}

function saveDb(data: DatabaseSchema): void {
  cachedDb = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Atomic write via temp file
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

function supabaseFailure(op: string, error: { message?: string } | null | undefined): never {
  console.error(`Supabase ${op} error:`, error);
  const detail = error?.message ? `: ${error.message}` : '';
  throw new Error(`ساندان مەشغۇلاتى مەغلۇپ بولدى (${op})${detail}`);
}

// ================= LOCAL (JSON FILE) OPERATIONS =================
// Used only when Supabase is not configured.

function findLocalUserByEmail(db: DatabaseSchema, email: string): UserRecord | null {
  const normalized = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

const VIP_TIER_RANKS: Record<string, number> = {
  vip1: 1,
  vip2: 2,
  vip3: 3,
  vip4: 4,
  vip5: 5,
};

function updateVipTier(user: UserRecord): void {
  let earnedTier: 'vip1' | 'vip2' | 'vip3' | 'vip4' | 'vip5' = 'vip1';
  if (user.totalSpent >= 5000) earnedTier = 'vip5';
  else if (user.totalSpent >= 2000) earnedTier = 'vip4';
  else if (user.totalSpent >= 500) earnedTier = 'vip3';
  else if (user.totalSpent >= 100) earnedTier = 'vip2';

  const currentRank = VIP_TIER_RANKS[user.vipTier] || 1;
  const earnedRank = VIP_TIER_RANKS[earnedTier] || 1;
  if (earnedRank > currentRank) {
    user.vipTier = earnedTier;
  }
}

// ================= SUPABASE ROW MAPPERS =================

function mapSupabaseUser(row: any): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || undefined,
    avatarUrl: row.avatar_url || row.avatar || undefined,
    passwordHash: row.password_hash,
    salt: row.salt,
    balance: Number(row.balance || 0),
    totalSpent: Number(row.total_spent || 0),
    vipTier: (row.vip_tier as any) || 'vip1',
    role: (row.role as any) || 'user',
    isBanned: Boolean(row.is_banned),
    createdAt: row.created_at,
  };
}

function mapSupabaseOrder(row: any): OrderRecord {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    userEmail: row.user_email || undefined,
    serviceId: row.service_id,
    serviceName: row.service_name,
    packageTitle: row.package_title,
    amount: Number(row.amount || 0),
    targetAccount: row.target_account,
    status: (row.status as any) || 'processing',
    createdAt: row.created_at,
    details: row.details || undefined,
  };
}

function mapSupabaseDeposit(row: any): DepositRecord {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    userName: row.user_name,
    userEmail: row.user_email,
    method: row.method,
    amount: Number(row.amount ?? row.amount_usd ?? 0),
    status: (row.status as any) || 'pending',
    date: row.date,
    txId: row.tx_id || undefined,
    reviewedAt: row.reviewed_at || undefined,
  };
}

function mapSupabaseSettings(row: any): SystemSettings {
  return {
    adminPin: row.admin_pin || '',
    shamcashAddress: row.shamcash_address || 'efe8a2b200d66411c7c7e296369cbba8',
    whatsappNumber: row.whatsapp_number || '+963 984 373 459',
    telegramUsername: row.telegram_username || 'autocash_UYGHUR',
    siteName: row.site_name || 'AUTO CASH',
    siteLogo: row.site_logo || undefined,
    providerApiUrl: row.provider_api_url ?? row.provider_url ?? undefined,
    providerApiKey: row.provider_api_key ?? row.provider_token ?? undefined,
    providerApiType: row.provider_api_type ?? undefined,
    providerApiSecret: row.provider_api_secret ?? undefined,
    providerEnabled: row.provider_enabled !== undefined ? Boolean(row.provider_enabled) : undefined,
    tsaApiKey: row.tsa_api_key ?? process.env.TSA_API_KEY ?? undefined,
    tsaAutoDepositEnabled: row.tsa_auto_deposit !== undefined ? Boolean(row.tsa_auto_deposit) : undefined,
    shamcashExchangeRate: row.shamcash_exchange_rate ? Number(row.shamcash_exchange_rate) : undefined,
  };
}

// ================= USER OPERATIONS =================

export async function getAllUsersAsync(): Promise<UserRecord[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('users').select('*').order('created_at', { ascending: false });
    if (error) supabaseFailure('getAllUsers', error);
    return (data || []).map(mapSupabaseUser);
  }
  return ensureDbFile().users;
}

export async function getUserByEmailAsync(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const sb = getSupabase();
  if (sb) {
    // Exact match: emails are stored lowercased; ilike would treat '_' and '%' as wildcards
    const { data, error } = await sb.from('users').select('*').eq('email', normalized).maybeSingle();
    if (error) supabaseFailure('getUserByEmail', error);
    return data ? mapSupabaseUser(data) : null;
  }
  return findLocalUserByEmail(ensureDbFile(), normalized);
}

export async function getUserByIdAsync(id: string): Promise<UserRecord | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('users').select('*').eq('id', id).maybeSingle();
    if (error) supabaseFailure('getUserById', error);
    return data ? mapSupabaseUser(data) : null;
  }
  return ensureDbFile().users.find((u) => u.id === id) || null;
}

export async function createUserAsync(userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
  role?: 'user' | 'admin';
}): Promise<UserRecord> {
  const { passwordHash, salt } = hashPassword(userData.password);
  const id = randomId('USR');
  const email = userData.email.trim().toLowerCase();
  const name = userData.name.trim() || email.split('@')[0];
  const now = new Date().toISOString();

  const sb = getSupabase();
  if (sb) {
    const insertPayload: any = {
      id,
      name,
      email,
      phone: userData.phone?.trim() || null,
      password_hash: passwordHash,
      salt,
      balance: 0,
      total_spent: 0,
      vip_tier: 'vip1',
      role: userData.role || 'user',
      is_banned: false,
      created_at: now,
    };
    if (userData.avatarUrl) {
      insertPayload.avatar_url = userData.avatarUrl;
    }
    const { data, error } = await sb.from('users').insert(insertPayload).select().single();
    if (error) {
      if (error.code === '23505') throw new Error('بۇ ئېلخەت ئادرېسى ئاللىقاچان تىزىملاتقان');
      supabaseFailure('createUser', error);
    }
    return mapSupabaseUser(data);
  }

  const db = ensureDbFile();
  if (findLocalUserByEmail(db, email)) {
    throw new Error('بۇ ئېلخەت ئادرېسى ئاللىقاچان تىزىملاتقان');
  }
  const newUser: UserRecord = {
    id,
    name,
    email,
    phone: userData.phone?.trim() || '',
    avatarUrl: userData.avatarUrl || undefined,
    passwordHash,
    salt,
    balance: 0.0,
    totalSpent: 0.0,
    vipTier: 'vip1',
    role: userData.role || 'user',
    createdAt: now,
  };
  db.users.push(newUser);
  saveDb(db);
  return newUser;
}

export async function updateUserAsync(
  id: string,
  updates: Partial<Omit<UserRecord, 'id' | 'passwordHash' | 'salt'>>
): Promise<UserRecord | null> {
  const sb = getSupabase();
  if (sb) {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.vipTier !== undefined) dbUpdates.vip_tier = updates.vipTier;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;
    if (Object.keys(dbUpdates).length === 0) return getUserByIdAsync(id);

    const { data, error } = await sb.from('users').update(dbUpdates).eq('id', id).select().maybeSingle();
    if (error) supabaseFailure('updateUser', error);
    return data ? mapSupabaseUser(data) : null;
  }

  const db = ensureDbFile();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  const { balance, totalSpent, ...safeUpdates } = updates;
  db.users[index] = { ...db.users[index], ...safeUpdates };
  saveDb(db);
  return db.users[index];
}

export async function updateUserPasswordAsync(id: string, newPassword: string): Promise<boolean> {
  const { passwordHash, salt } = hashPassword(newPassword);
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('users')
      .update({ password_hash: passwordHash, salt })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) supabaseFailure('updateUserPassword', error);
    return Boolean(data);
  }

  const db = ensureDbFile();
  const user = db.users.find((u) => u.id === id);
  if (!user) return false;
  user.passwordHash = passwordHash;
  user.salt = salt;
  saveDb(db);
  return true;
}

/** Atomically add (or subtract) an amount from a user's balance; rejects if it would go negative. */
export async function adjustUserBalanceAsync(id: string, deltaAmount: number): Promise<UserRecord | null> {
  if (!Number.isFinite(deltaAmount)) throw new Error('سومما خاتا');
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('adjust_user_balance', { p_user_id: id, p_delta: deltaAmount });
    if (error) {
      if (error.message?.includes('check_balance_non_negative')) throw new Error('ھەميان قالدۇقى يەتمىدى');
      if (error.message?.includes('USER_NOT_FOUND')) return null;
      supabaseFailure('adjust_user_balance (supabase_schema.sql نى قايتا ئىجرا قىلىڭ)', error);
    }
    if (!data?.success) return null;
    return getUserByIdAsync(id);
  }

  const db = ensureDbFile();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;

  const newBalance = Math.round((user.balance + deltaAmount) * 100) / 100;
  if (newBalance < 0) {
    throw new Error('ھەميان قالدۇقى يەتمىدى');
  }
  user.balance = newBalance;
  saveDb(db);
  return user;
}

export async function deleteUserAsync(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('users').delete().eq('id', id);
    if (error) supabaseFailure('deleteUser', error);
    return true;
  }

  const db = ensureDbFile();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return false;
  db.users.splice(index, 1);
  saveDb(db);
  return true;
}

// ================= ORDER OPERATIONS =================

export async function getAllOrdersAsync(): Promise<OrderRecord[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
    if (error) supabaseFailure('getAllOrders', error);
    return (data || []).map(mapSupabaseOrder);
  }
  return ensureDbFile().orders;
}

/**
 * Rows owned by a user: matched by user_id, plus legacy rows that were stored without a
 * user_id but with the user's email. Two queries instead of a PostgREST `or()` filter string,
 * which would need the email escaped.
 */
async function selectOwnedRows(table: 'orders' | 'deposits', userId: string, userEmail: string): Promise<any[]> {
  const sb = getSupabase()!;
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const map = new Map<string, any>();

  if (userId) {
    const { data } = await sb.from(table).select('*').eq('user_id', userId);
    if (data) {
      for (const row of data) {
        map.set(row.id, row);
      }
    }
  }
  if (cleanEmail) {
    const { data } = await sb.from(table).select('*').ilike('user_email', cleanEmail);
    if (data) {
      for (const row of data) {
        map.set(row.id, row);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    String(b.created_at || b.date || '').localeCompare(String(a.created_at || a.date || ''))
  );
}

function isOwnedLocally(record: { userId?: string; userEmail?: string }, userId: string, userEmail: string): boolean {
  if (userId && record.userId && record.userId === userId) return true;
  if (userEmail && record.userEmail && record.userEmail.toLowerCase() === userEmail.trim().toLowerCase()) return true;
  return false;
}

export async function getOrdersByUserIdAsync(userId: string, userEmail: string): Promise<OrderRecord[]> {
  if (getSupabase()) {
    return (await selectOwnedRows('orders', userId, userEmail)).map(mapSupabaseOrder);
  }
  return ensureDbFile().orders.filter((o) => isOwnedLocally(o, userId, userEmail));
}

/** Update an order's status and/or merge extra fields into its details. */
export async function updateOrderAsync(
  orderId: string,
  changes: { status?: OrderRecord['status']; detailsPatch?: Record<string, any> }
): Promise<OrderRecord | null> {
  const sb = getSupabase();
  if (sb) {
    const dbUpdates: any = {};
    if (changes.status) dbUpdates.status = changes.status;
    if (changes.detailsPatch) {
      const { data: existing, error: readErr } = await sb.from('orders').select('details').eq('id', orderId).maybeSingle();
      if (readErr) supabaseFailure('readOrderDetails', readErr);
      if (!existing) return null;
      dbUpdates.details = { ...(existing.details || {}), ...changes.detailsPatch };
    }
    const { data, error } = await sb.from('orders').update(dbUpdates).eq('id', orderId).select().maybeSingle();
    if (error) supabaseFailure('updateOrder', error);
    return data ? mapSupabaseOrder(data) : null;
  }

  const db = ensureDbFile();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return null;
  if (changes.status) order.status = changes.status;
  if (changes.detailsPatch) order.details = { ...(order.details || {}), ...changes.detailsPatch };
  saveDb(db);
  return order;
}

/**
 * Compare-and-set: moves the order to `to` (or keeps its status when null) and merges `patch`
 * into its details, but only while its status is one of `from`. Returns null when it wasn't.
 */
export async function transitionOrderAsync(
  orderId: string,
  from: OrderRecord['status'][],
  to: OrderRecord['status'] | null,
  patch: Record<string, any> = {}
): Promise<OrderRecord | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('transition_order', {
      p_order_id: orderId,
      p_from: from,
      p_to: to,
      p_patch: patch,
    });
    if (error) supabaseFailure('transition_order (supabase_schema.sql نى قايتا ئىجرا قىلىڭ)', error);
    return data?.success && data.order ? mapSupabaseOrder(data.order) : null;
  }

  const db = ensureDbFile();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order || !from.includes(order.status)) return null;
  if (to) order.status = to;
  order.details = { ...(order.details || {}), ...patch };
  saveDb(db);
  return order;
}

/** Orders that may still be waiting on the provider (oldest first). */
export async function getInFlightProviderOrdersAsync(limit = 100): Promise<OrderRecord[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .in('status', ['pending_provider', 'processing'])
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) supabaseFailure('getInFlightProviderOrders', error);
    return (data || []).map(mapSupabaseOrder).filter((o) => o.details?.providerProductId);
  }
  return ensureDbFile()
    .orders.filter((o) => (o.status === 'pending_provider' || o.status === 'processing') && o.details?.providerProductId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

export async function getOrderByIdAsync(orderId: string): Promise<OrderRecord | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (error) supabaseFailure('getOrderById', error);
    return data ? mapSupabaseOrder(data) : null;
  }
  return ensureDbFile().orders.find((o) => o.id === orderId) || null;
}

export async function updateOrderStatusAsync(
  orderId: string,
  newStatus: OrderRecord['status']
): Promise<OrderRecord | null> {
  return updateOrderAsync(orderId, { status: newStatus });
}

export interface AtomicOrderResult {
  success: boolean;
  order?: OrderRecord;
  newBalance?: number;
  message?: string;
  isCached?: boolean;
}

export async function deductBalanceAndCreateOrderAtomicAsync(params: {
  idempotencyKey?: string;
  userId: string;
  userEmail?: string;
  serviceId: string;
  serviceName: string;
  packageTitle: string;
  amount: number;
  targetAccount: string;
  orderId: string;
  details?: any;
}): Promise<AtomicOrderResult> {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return { success: false, message: 'سومما خاتا' };
  }

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.rpc('deduct_balance_and_create_order', {
        p_idempotency_key: params.idempotencyKey || null,
        p_user_id: params.userId,
        p_user_email: params.userEmail || null,
        p_service_id: params.serviceId,
        p_service_name: params.serviceName,
        p_package_title: params.packageTitle,
        p_amount: params.amount,
        p_target_account: params.targetAccount,
        p_order_id: params.orderId,
        p_details: params.details || {},
      });

      if (error) {
        console.error('Supabase RPC deduct_balance_and_create_order error:', error);
        return { success: false, message: error.message };
      }
      if (!data?.success) {
        return { success: false, message: data?.message || 'ترانزاكسىيە رەت قىلىندى' };
      }
      if (data.is_cached) {
        const cachedOrderId = data.orderId || data.data?.orderId;
        return {
          success: true,
          isCached: true,
          order: cachedOrderId ? ({ id: cachedOrderId } as OrderRecord) : undefined,
          newBalance: Number(data.data?.newBalance ?? 0),
        };
      }
      return {
        success: true,
        order: data.order ? mapSupabaseOrder(data.order) : undefined,
        newBalance: Number(data.newBalance ?? 0),
      };
    } catch (e: any) {
      console.error('Supabase RPC execution exception:', e);
      return { success: false, message: e?.message || 'ساندان ترانزاكسىيە كاشىلىسى' };
    }
  }

  // Local DB (single process): check and deduct synchronously
  const db = ensureDbFile();
  const user = db.users.find((u) => u.id === params.userId);
  if (!user) {
    return { success: false, message: 'ئابونت تېپىلمىدى' };
  }
  if (user.balance < params.amount) {
    return {
      success: false,
      message: `قالدۇق پۇل يەتمىدى! مەۋجۇت قالدۇق: $${user.balance.toFixed(2)}، تەلەپ: $${params.amount.toFixed(2)}`,
    };
  }

  user.balance = Math.round((user.balance - params.amount) * 100) / 100;
  user.totalSpent = Math.round(((user.totalSpent || 0) + params.amount) * 100) / 100;
  updateVipTier(user);

  const newOrder: OrderRecord = {
    id: params.orderId,
    userId: user.id,
    userEmail: user.email,
    serviceId: params.serviceId,
    serviceName: params.serviceName,
    packageTitle: params.packageTitle,
    amount: params.amount,
    targetAccount: params.targetAccount,
    status: 'processing',
    details: params.details || {},
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);
  saveDb(db);

  return {
    success: true,
    order: newOrder,
    newBalance: user.balance,
  };
}

const REFUNDABLE_STATUSES: OrderRecord['status'][] = ['processing', 'pending', 'pending_provider', 'failed'];

/**
 * Refunds an order to the buyer's wallet. Completed orders are only refundable with `force`
 * (an explicit admin decision), so a late provider "failed" can never refund delivered goods.
 */
export async function refundOrderBalanceAtomicAsync(
  orderId: string,
  reason: string = 'Provider Error',
  force = false
): Promise<{ success: boolean; newBalance?: number; message?: string }> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.rpc('refund_order_balance', {
        p_order_id: orderId,
        p_reason: reason,
        p_force: force,
      });
      if (error) {
        console.error('Supabase refund_order_balance RPC error:', error);
        return { success: false, message: error.message };
      }
      if (!data?.success) {
        return { success: false, message: data?.message || 'پۇل قايتۇرۇش رەت قىلىندى' };
      }
      return { success: true, newBalance: Number(data.newBalance ?? 0) };
    } catch (e: any) {
      console.error('Supabase refund RPC exception:', e);
      return { success: false, message: e?.message || 'پۇل قايتۇرۇش مەغلۇپ بولدى' };
    }
  }

  const db = ensureDbFile();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return { success: false, message: 'زاكاز تېپىلمىدى' };
  if (order.status === 'refunded' || order.status === 'cancelled') {
    return { success: false, message: 'زاكاز ئاللىقاچان پۇلى قايتۇرۇلغان' };
  }
  if (!REFUNDABLE_STATUSES.includes(order.status) && !force) {
    return { success: false, message: 'ORDER_NOT_REFUNDABLE' };
  }

  const user = db.users.find((u) => u.id === order.userId);
  let newBalance = 0;
  if (user) {
    user.balance = Math.round((user.balance + order.amount) * 100) / 100;
    user.totalSpent = Math.max(0, Math.round(((user.totalSpent || 0) - order.amount) * 100) / 100);
    updateVipTier(user);
    newBalance = user.balance;
  }

  order.status = 'refunded';
  order.details = { ...(order.details || {}), refundReason: reason };
  saveDb(db);

  return { success: true, newBalance };
}

// ================= DEPOSIT OPERATIONS =================

export async function getAllDepositsAsync(): Promise<DepositRecord[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('deposits').select('*').order('created_at', { ascending: false });
    if (error) supabaseFailure('getAllDeposits', error);
    return (data || []).map(mapSupabaseDeposit);
  }
  return ensureDbFile().deposits;
}

export async function getDepositsByUserIdAsync(userId: string, userEmail: string): Promise<DepositRecord[]> {
  if (getSupabase()) {
    return (await selectOwnedRows('deposits', userId, userEmail)).map(mapSupabaseDeposit);
  }
  return ensureDbFile().deposits.filter((d) => isOwnedLocally(d, userId, userEmail));
}

export async function createDepositAsync(
  depositData: Omit<DepositRecord, 'id' | 'date' | 'status'>
): Promise<DepositRecord> {
  const id = randomId('DEP');
  const date = nowFormatted();
  const method = depositData.method || 'شامكەش (Sham Cash)';

  const sb = getSupabase();
  if (sb) {
    const insertPayload = {
      id,
      user_id: depositData.userId || null,
      user_name: depositData.userName,
      user_email: depositData.userEmail,
      method,
      amount: depositData.amount,
      status: 'pending',
      date,
      tx_id: depositData.txId || null,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await sb.from('deposits').insert(insertPayload).select().single();
    if (error) supabaseFailure('createDeposit', error);
    return mapSupabaseDeposit(data);
  }

  const db = ensureDbFile();
  const newDeposit: DepositRecord = { id, ...depositData, method, status: 'pending', date };
  db.deposits.unshift(newDeposit);
  saveDb(db);
  return newDeposit;
}

export async function getDepositByIdAsync(depositId: string): Promise<DepositRecord | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('deposits').select('*').eq('id', depositId).maybeSingle();
    if (error) {
      console.warn('getDepositByIdAsync warning:', error.message);
      return null;
    }
    return data ? mapSupabaseDeposit(data) : null;
  }
  const db = ensureDbFile();
  return db.deposits.find((d) => d.id === depositId) || null;
}

export async function getDepositByTxIdAsync(txId: string): Promise<DepositRecord | null> {
  const normalized = (txId || '').trim();
  if (!normalized) return null;
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('deposits').select('*').eq('tx_id', normalized).maybeSingle();
    if (error) {
      console.warn('getDepositByTxIdAsync warning:', error.message);
      return null;
    }
    return data ? mapSupabaseDeposit(data) : null;
  }
  const db = ensureDbFile();
  return db.deposits.find((d) => d.txId === normalized) || null;
}

export async function isTxIdAlreadyCompletedAsync(txId: string): Promise<boolean> {
  const normalized = (txId || '').trim();
  if (!normalized) return false;
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('deposits')
      .select('id')
      .eq('tx_id', normalized)
      .eq('status', 'completed')
      .limit(1);
    if (error) {
      console.warn('isTxIdAlreadyCompletedAsync warning:', error.message);
      return false;
    }
    return Boolean(data && data.length > 0);
  }
  const db = ensureDbFile();
  return db.deposits.some((d) => d.txId === normalized && d.status === 'completed');
}

export class DepositReviewError extends Error {}

/**
 * Approve or reject a pending deposit. Approving credits the user's wallet in the
 * same transaction; a deposit that is no longer pending can't be reviewed again.
 */
export async function updateDepositStatusAsync(
  depositId: string,
  newStatus: 'completed' | 'rejected'
): Promise<DepositRecord | null> {
  const reviewedAt = nowFormatted();
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('review_deposit', {
      p_deposit_id: depositId,
      p_status: newStatus,
      p_reviewed_at: reviewedAt,
    });
    if (error) {
      if (error.message?.includes('DEPOSIT_NOT_FOUND')) return null;
      if (error.message?.includes('DEPOSIT_ALREADY_REVIEWED')) {
        throw new DepositReviewError('بۇ پۇل كىرگۈزۈش ئاللىقاچان تەكشۈرۈلگەن');
      }
      if (error.message?.includes('USER_NOT_FOUND')) {
        throw new DepositReviewError('پۇل كىرگۈزگەن ئىشلەتكۈچى تېپىلمىدى');
      }
      supabaseFailure('review_deposit (supabase_schema.sql نى قايتا ئىجرا قىلىڭ)', error);
    }
    return data?.deposit ? mapSupabaseDeposit(data.deposit) : null;
  }

  const db = ensureDbFile();
  const deposit = db.deposits.find((d) => d.id === depositId);
  if (!deposit) return null;
  if (deposit.status !== 'pending') {
    throw new DepositReviewError('بۇ پۇل كىرگۈزۈش ئاللىقاچان تەكشۈرۈلگەن');
  }

  if (newStatus === 'completed') {
    const targetUser =
      (deposit.userId && db.users.find((u) => u.id === deposit.userId)) ||
      (deposit.userEmail && findLocalUserByEmail(db, deposit.userEmail)) ||
      null;
    if (!targetUser) {
      throw new DepositReviewError('پۇل كىرگۈزگەن ئىشلەتكۈچى تېپىلمىدى');
    }
    targetUser.balance = Math.round((targetUser.balance + deposit.amount) * 100) / 100;
  }

  deposit.status = newStatus;
  deposit.reviewedAt = reviewedAt;
  saveDb(db);
  return deposit;
}

// ================= SETTINGS OPERATIONS =================

export async function getSystemSettingsAsync(): Promise<SystemSettings> {
  const localSettings = ensureDbFile().settings;
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('system_settings').select('*').eq('id', 'global').maybeSingle();
      let metaData: any = null;
      try {
        const metaRes = await sb.from('system_settings').select('site_name').eq('id', 'system_meta').maybeSingle();
        metaData = metaRes?.data;
      } catch {}

      let parsedMeta: any = {};
      if (metaData && metaData.site_name) {
        try {
          parsedMeta = JSON.parse(metaData.site_name);
        } catch {}
      }

      if (!error && data) {
        const sbSettings = mapSupabaseSettings(data);
        const effectiveExchangeRate =
          sbSettings.shamcashExchangeRate ||
          (parsedMeta.shamcashExchangeRate ? Number(parsedMeta.shamcashExchangeRate) : undefined) ||
          localSettings.shamcashExchangeRate ||
          15000;

        const effectiveTsaKey =
          sbSettings.tsaApiKey ||
          parsedMeta.tsaApiKey ||
          localSettings.tsaApiKey;

        const effectiveAutoDeposit =
          sbSettings.tsaAutoDepositEnabled !== undefined
            ? sbSettings.tsaAutoDepositEnabled
            : parsedMeta.tsaAutoDepositEnabled !== undefined
            ? Boolean(parsedMeta.tsaAutoDepositEnabled)
            : localSettings.tsaAutoDepositEnabled;

        return {
          ...localSettings,
          ...sbSettings,
          shamcashExchangeRate: effectiveExchangeRate,
          tsaApiKey: effectiveTsaKey,
          tsaAutoDepositEnabled: effectiveAutoDeposit,
          siteLogo: sbSettings.siteLogo || parsedMeta.siteLogo || localSettings.siteLogo || '/logo.png',
          shamcashAddress: sbSettings.shamcashAddress || parsedMeta.shamcashAddress || localSettings.shamcashAddress,
          // Preserve local provider config if Supabase doesn't have these columns
          providerApiUrl: sbSettings.providerApiUrl || localSettings.providerApiUrl,
          providerApiKey: sbSettings.providerApiKey || localSettings.providerApiKey,
          providerApiType: sbSettings.providerApiType || localSettings.providerApiType,
          providerApiSecret: sbSettings.providerApiSecret || localSettings.providerApiSecret,
          providerEnabled: sbSettings.providerEnabled !== undefined ? sbSettings.providerEnabled : localSettings.providerEnabled,
        };
      }
      if (error) {
        console.warn('Supabase getSystemSettings warning:', error.message);
      }
    } catch (e) {
      console.warn('Supabase getSystemSettings exception:', e);
    }
  }
  return localSettings;
}

export async function updateSystemSettingsAsync(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  // Always update local persistent JSON DB
  const db = ensureDbFile();
  db.settings = { ...db.settings, ...updates };
  saveDb(db);

  const sb = getSupabase();
  if (sb) {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.adminPin) dbUpdates.admin_pin = updates.adminPin;
    if (updates.shamcashAddress) dbUpdates.shamcash_address = updates.shamcashAddress;
    if (updates.whatsappNumber) dbUpdates.whatsapp_number = updates.whatsappNumber;
    if (updates.telegramUsername) dbUpdates.telegram_username = updates.telegramUsername;
    if (updates.siteName) dbUpdates.site_name = updates.siteName;
    if (updates.siteLogo !== undefined) dbUpdates.site_logo = updates.siteLogo;

    // Optional provider columns (may not yet be added in Supabase schema)
    if (updates.providerApiUrl !== undefined) dbUpdates.provider_api_url = updates.providerApiUrl;
    if (updates.providerApiKey !== undefined) dbUpdates.provider_api_key = updates.providerApiKey;
    if (updates.providerApiType !== undefined) dbUpdates.provider_api_type = updates.providerApiType;
    if (updates.providerApiSecret !== undefined) dbUpdates.provider_api_secret = updates.providerApiSecret;
    if (updates.providerEnabled !== undefined) dbUpdates.provider_enabled = updates.providerEnabled;
    if (updates.tsaApiKey !== undefined) dbUpdates.tsa_api_key = updates.tsaApiKey;
    if (updates.tsaAutoDepositEnabled !== undefined) dbUpdates.tsa_auto_deposit = updates.tsaAutoDepositEnabled;
    if (updates.shamcashExchangeRate !== undefined) dbUpdates.shamcash_exchange_rate = updates.shamcashExchangeRate;

    try {
      const { data, error } = await sb
        .from('system_settings')
        .upsert({ id: 'global', ...dbUpdates })
        .select()
        .maybeSingle();

      if (error) {
        // If columns don't exist in Supabase yet, retry with only basic settings
        console.warn('Supabase updateSystemSettings full upsert warning, retrying basic:', error.message);
        const basicUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.adminPin) basicUpdates.admin_pin = updates.adminPin;
        if (updates.shamcashAddress) basicUpdates.shamcash_address = updates.shamcashAddress;
        if (updates.whatsappNumber) basicUpdates.whatsapp_number = updates.whatsappNumber;
        if (updates.telegramUsername) basicUpdates.telegram_username = updates.telegramUsername;
        if (updates.siteName) basicUpdates.site_name = updates.siteName;

        await sb
          .from('system_settings')
          .upsert({ id: 'global', ...basicUpdates })
          .select()
          .maybeSingle();
      }

      // Universal meta backup in site_name of system_meta row (guaranteed to succeed on all Supabase schemas)
      const metaPayload = {
        shamcashExchangeRate: updates.shamcashExchangeRate ?? db.settings.shamcashExchangeRate,
        tsaApiKey: updates.tsaApiKey ?? db.settings.tsaApiKey,
        tsaAutoDepositEnabled: updates.tsaAutoDepositEnabled ?? db.settings.tsaAutoDepositEnabled,
        shamcashAddress: updates.shamcashAddress ?? db.settings.shamcashAddress,
        siteLogo: updates.siteLogo ?? db.settings.siteLogo,
        updatedAt: new Date().toISOString(),
      };

      await sb.from('system_settings').upsert({
        id: 'system_meta',
        site_name: JSON.stringify(metaPayload),
        admin_pin: 'META_BACKUP',
        shamcash_address: 'META',
        whatsapp_number: 'META',
        telegram_username: 'META',
      });
    } catch (e: any) {
      console.warn('Supabase updateSystemSettings exception (saved locally):', e?.message);
    }
  }

  return db.settings;
}

export interface ResetStatsOptions {
  resetDeposits?: boolean;
  resetOrders?: boolean;
  resetUserBalances?: boolean;
}

export async function resetAdminStatsAsync(
  options: ResetStatsOptions = {}
): Promise<{ deletedDeposits: number; deletedOrders: number }> {
  const sb = getSupabase();
  let deletedDeposits = 0;
  let deletedOrders = 0;

  if (sb) {
    if (options.resetDeposits !== false) {
      const { data } = await sb.from('deposits').delete().neq('id', '___NEVER___').select('id');
      deletedDeposits = data?.length || 0;
    }
    if (options.resetOrders !== false) {
      const { data } = await sb.from('orders').delete().neq('id', '___NEVER___').select('id');
      deletedOrders = data?.length || 0;
    }
    if (options.resetUserBalances) {
      await sb.from('users').update({ balance: 0, total_spent: 0 }).neq('id', '___NEVER___');
    }
  }

  const db = ensureDbFile();
  if (options.resetDeposits !== false) {
    deletedDeposits = Math.max(deletedDeposits, db.deposits.length);
    db.deposits = [];
  }
  if (options.resetOrders !== false) {
    deletedOrders = Math.max(deletedOrders, db.orders.length);
    db.orders = [];
  }
  if (options.resetUserBalances) {
    db.users.forEach((u) => {
      u.balance = 0;
      u.totalSpent = 0;
    });
  }
  saveDb(db);

  return { deletedDeposits, deletedOrders };
}
