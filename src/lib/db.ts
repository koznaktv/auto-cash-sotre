import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isSupabaseConfigured, getSupabase } from './supabase';

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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  details?: {
    smsCode?: string;
    virtualNumber?: string;
    accountCredentials?: string;
    cardDetails?: {
      number: string;
      exp: string;
      cvv: string;
    };
  };
}

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
}

interface DatabaseSchema {
  users: UserRecord[];
  orders: OrderRecord[];
  deposits: DepositRecord[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'autocash_db.json');

// Password hashing utilities
export function hashPassword(password: string, salt?: string): { passwordHash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { passwordHash: hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = hashPassword(password, salt);
  return result.passwordHash === hash;
}

// Initial seed data
const initialDefaultData: DatabaseSchema = {
  settings: {
    adminPin: '9960996',
    shamcashAddress: 'efe8a2b200d66411c7c7e296369cbba8',
    whatsappNumber: '+963 984 373 459',
    telegramUsername: 'autocash_UYGHUR',
    siteName: 'AUTO CASH',
  },
  users: [
    {
      id: 'USR-1170',
      name: 'Killer 0996',
      email: 'dronemax0996@gmail.com',
      phone: '+963 984 373 459',
      ...hashPassword('admin2026'),
      balance: 120.50,
      totalSpent: 45.00,
      vipTier: 'vip2',
      role: 'admin',
      createdAt: '2026-10-01T10:00:00.000Z',
    },
    {
      id: 'USR-1171',
      name: 'خېرىدار',
      email: 'client@autocash.shop',
      phone: '+963 999 123 456',
      ...hashPassword('client123'),
      balance: 25.00,
      totalSpent: 12.50,
      vipTier: 'vip1',
      role: 'user',
      createdAt: '2026-10-02T12:30:00.000Z',
    },
  ],
  orders: [
    {
      id: 'ORD-98421',
      userId: 'USR-1171',
      userEmail: 'client@autocash.shop',
      serviceId: 'chatgpt-plus',
      serviceName: 'ChatGPT Plus / Pro',
      packageTitle: '1 ئايلىق مۇستەقىل ھېسابات (Private)',
      amount: 21.99,
      targetAccount: 'client@autocash.shop',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      details: {
        accountCredentials: 'ھېسابات قوزغىتىلدى: client@autocash.shop (OpenAI Plus ئاكتىپ)',
      },
    },
    {
      id: 'ORD-98422',
      userId: 'USR-1170',
      userEmail: 'dronemax0996@gmail.com',
      serviceId: 'pubg-mobile',
      serviceName: 'PUBG Mobile UC',
      packageTitle: '660 UC (Royale Pass)',
      amount: 9.50,
      targetAccount: '581294819',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'ORD-98423',
      userId: 'USR-1171',
      userEmail: 'client@autocash.shop',
      serviceId: 'telegram-sms',
      serviceName: 'تېلېگرام مەۋھۇم نومۇر',
      packageTitle: 'ئامېرىكا (+1) مەۋھۇم نومۇر',
      amount: 1.20,
      targetAccount: 'United States (+1)',
      status: 'processing',
      createdAt: new Date(Date.now() - 120000).toISOString(),
      details: {
        virtualNumber: '+1 (202) 555-0194',
        smsCode: 'كود كۈتۈلمەكتە...',
      },
    },
  ],
  deposits: [
    {
      id: 'DEP-8841',
      userId: 'USR-1170',
      userName: 'Killer 0996',
      userEmail: 'dronemax0996@gmail.com',
      method: 'شامكەش (Sham Cash)',
      amount: 50.0,
      status: 'completed',
      date: '2026-10-08 18:24',
      txId: 'SC-99238411',
      reviewedAt: '2026-10-08 18:25',
    },
    {
      id: 'DEP-8812',
      userId: 'USR-1171',
      userName: 'خېرىدار',
      userEmail: 'client@autocash.shop',
      method: 'شامكەش (Sham Cash)',
      amount: 25.0,
      status: 'completed',
      date: '2026-10-06 14:10',
      txId: 'SC-77123990',
      reviewedAt: '2026-10-06 14:15',
    },
    {
      id: 'DEP-8790',
      userId: 'USR-1170',
      userName: 'ئىشلەتكۈچى',
      userEmail: 'vip@autocash.shop',
      method: 'شامكەش (Sham Cash)',
      amount: 45.5,
      status: 'completed',
      date: '2026-10-03 21:05',
      txId: 'SC-55192834',
      reviewedAt: '2026-10-03 21:10',
    },
  ],
};

// Memory cache to accelerate reads while syncing with disk
let cachedDb: DatabaseSchema | null = null;

function ensureDbFile(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDefaultData, null, 2), 'utf-8');
      cachedDb = JSON.parse(JSON.stringify(initialDefaultData));
      return cachedDb!;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    
    // Ensure all required fields exist
    if (!parsed.users) parsed.users = initialDefaultData.users;
    if (!parsed.orders) parsed.orders = initialDefaultData.orders;
    if (!parsed.deposits) parsed.deposits = initialDefaultData.deposits;
    if (!parsed.settings) parsed.settings = initialDefaultData.settings;

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

// ================= USER OPERATIONS =================
export function getAllUsers(): UserRecord[] {
  const db = ensureDbFile();
  return db.users;
}

export function getUserById(id: string): UserRecord | null {
  const db = ensureDbFile();
  return db.users.find((u) => u.id === id) || null;
}

export function getUserByEmail(email: string): UserRecord | null {
  const db = ensureDbFile();
  return db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export function createUser(userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
}): UserRecord {
  const db = ensureDbFile();
  const existing = getUserByEmail(userData.email);
  if (existing) {
    throw new Error('بۇ ئېلخەت ئادرېسى ئاللىقاچان تىزىملاتقان');
  }

  const { passwordHash, salt } = hashPassword(userData.password);
  const newUser: UserRecord = {
    id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
    name: userData.name.trim() || userData.email.split('@')[0],
    email: userData.email.trim().toLowerCase(),
    phone: userData.phone?.trim() || '',
    avatarUrl: userData.avatarUrl || undefined,
    passwordHash,
    salt,
    balance: 0.0,
    totalSpent: 0.0,
    vipTier: 'vip1',
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDb(db);
  return newUser;
}

export function updateUser(
  id: string,
  updates: Partial<Omit<UserRecord, 'id' | 'passwordHash' | 'salt'>>
): UserRecord | null {
  const db = ensureDbFile();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  db.users[index] = { ...db.users[index], ...updates };
  saveDb(db);
  return db.users[index];
}

export function deleteUser(id: string): boolean {
  const db = ensureDbFile();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return false;
  db.users.splice(index, 1);
  saveDb(db);
  return true;
}

export function updateUserPassword(id: string, newPassword: string): boolean {
  const db = ensureDbFile();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return false;

  const { passwordHash, salt } = hashPassword(newPassword);
  db.users[index].passwordHash = passwordHash;
  db.users[index].salt = salt;
  saveDb(db);
  return true;
}

export function adjustUserBalance(userId: string, amountDelta: number): UserRecord | null {
  const db = ensureDbFile();
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const user = db.users[index];
  const newBalance = Math.round((user.balance + amountDelta) * 100) / 100;
  if (newBalance < 0) {
    throw new Error('ھەميان قالدۇقى يەتمىدى');
  }

  user.balance = newBalance;
  if (amountDelta < 0) {
    user.totalSpent = Math.round((user.totalSpent + Math.abs(amountDelta)) * 100) / 100;
    // Auto upgrade VIP tier based on total spending
    if (user.totalSpent >= 5000) user.vipTier = 'vip5';
    else if (user.totalSpent >= 2000) user.vipTier = 'vip4';
    else if (user.totalSpent >= 500) user.vipTier = 'vip3';
    else if (user.totalSpent >= 100) user.vipTier = 'vip2';
    else user.vipTier = 'vip1';
  }

  db.users[index] = user;
  saveDb(db);
  return user;
}

// ================= ORDER OPERATIONS =================
export function getAllOrders(): OrderRecord[] {
  const db = ensureDbFile();
  return db.orders;
}

export function getOrderById(id: string): OrderRecord | null {
  const db = ensureDbFile();
  return db.orders.find((o) => o.id === id) || null;
}

export function getOrdersByUserId(userId: string): OrderRecord[] {
  const db = ensureDbFile();
  return db.orders.filter((o) => o.userId === userId);
}

export function createOrder(orderData: any): OrderRecord {
  const db = ensureDbFile();
  const amount = Number(orderData.amount ?? orderData.price ?? 0);
  const packageTitle = orderData.packageTitle || orderData.unitName || 'ئۆلچەملىك';
  const targetAccount = orderData.targetAccount || orderData.accountInput || '';

  const newOrder: OrderRecord = {
    id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
    ...orderData,
    amount,
    packageTitle,
    targetAccount,
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);
  saveDb(db);
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: OrderRecord['status']): OrderRecord | null {
  const db = ensureDbFile();
  const index = db.orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;

  db.orders[index].status = status;
  saveDb(db);
  return db.orders[index];
}

// ================= DEPOSIT OPERATIONS =================
export function getAllDeposits(): DepositRecord[] {
  const db = ensureDbFile();
  return db.deposits;
}

export function getDepositById(id: string): DepositRecord | null {
  const db = ensureDbFile();
  return db.deposits.find((d) => d.id === id) || null;
}

export function createDeposit(depositData: Omit<DepositRecord, 'id' | 'date'>): DepositRecord {
  const db = ensureDbFile();
  const newDeposit: DepositRecord = {
    id: `DEP-${Math.floor(1000 + Math.random() * 9000)}`,
    ...depositData,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  db.deposits.unshift(newDeposit);
  saveDb(db);
  return newDeposit;
}

export function updateDepositStatus(depositId: string, newStatus: 'completed' | 'rejected'): DepositRecord | null {
  const db = ensureDbFile();
  const index = db.deposits.findIndex((d) => d.id === depositId);
  if (index === -1) return null;

  const deposit = db.deposits[index];
  const previousStatus = deposit.status;
  deposit.status = newStatus;
  deposit.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

  // If approved and was previously pending, automatically credit the user's wallet!
  if (newStatus === 'completed' && previousStatus === 'pending') {
    let targetUser: UserRecord | null = null;
    if (deposit.userId) {
      targetUser = db.users.find((u) => u.id === deposit.userId) || null;
    }
    if (!targetUser && deposit.userEmail) {
      targetUser = db.users.find((u) => u.email.toLowerCase() === deposit.userEmail.toLowerCase()) || null;
    }

    if (targetUser) {
      targetUser.balance = Math.round((targetUser.balance + deposit.amount) * 100) / 100;
    }
  }

  db.deposits[index] = deposit;
  saveDb(db);
  return deposit;
}

// ================= SETTINGS OPERATIONS =================
export function getSystemSettings(): SystemSettings {
  const db = ensureDbFile();
  return db.settings;
}

export function updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
  const db = ensureDbFile();
  db.settings = { ...db.settings, ...updates };
  saveDb(db);
  return db.settings;
}

// ================= SUPABASE INTEGRATION & ASYNC OPERATIONS =================

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
    amount: Number(row.amount || 0),
    status: (row.status as any) || 'pending',
    date: row.date,
    txId: row.tx_id || undefined,
    reviewedAt: row.reviewed_at || undefined,
  };
}

function mapSupabaseSettings(row: any): SystemSettings {
  return {
    adminPin: row.admin_pin || '9960996',
    shamcashAddress: row.shamcash_address || 'efe8a2b200d66411c7c7e296369cbba8',
    whatsappNumber: row.whatsapp_number || '+963 984 373 459',
    telegramUsername: row.telegram_username || 'autocash_UYGHUR',
    siteName: row.site_name || 'AUTO CASH',
  };
}

export async function getAllUsersAsync(): Promise<UserRecord[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('users').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(mapSupabaseUser);
      }
    } catch (e) {
      console.error('Supabase getAllUsers error:', e);
    }
  }
  return getAllUsers();
}

export async function getUserByEmailAsync(email: string): Promise<UserRecord | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('users').select('*').ilike('email', email.trim()).maybeSingle();
      if (!error && data) {
        return mapSupabaseUser(data);
      }
    } catch (e) {
      console.error('Supabase getUserByEmail error:', e);
    }
  }
  return getUserByEmail(email);
}

export async function getUserByIdAsync(id: string): Promise<UserRecord | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('users').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return mapSupabaseUser(data);
      }
    } catch (e) {
      console.error('Supabase getUserById error:', e);
    }
  }
  return getUserById(id);
}

export async function createUserAsync(userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
  role?: 'user' | 'admin';
}): Promise<UserRecord> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { passwordHash, salt } = hashPassword(userData.password);
      const id = `USR-${Date.now().toString().slice(-4)}`;
      const now = new Date().toISOString();
      const insertPayload: any = {
        id,
        name: userData.name,
        email: userData.email.toLowerCase(),
        phone: userData.phone || null,
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
      if (!error && data) {
        return mapSupabaseUser(data);
      }
      if (error) {
        console.warn('Supabase insert user error (fallback to local):', error.message);
      }
    } catch (e) {
      console.error('Supabase createUser error:', e);
    }
  }
  return createUser(userData);
}

export async function updateUserAsync(
  id: string,
  updates: Partial<Omit<UserRecord, 'id' | 'passwordHash' | 'salt'>>
): Promise<UserRecord | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
      if (updates.totalSpent !== undefined) dbUpdates.total_spent = updates.totalSpent;
      if (updates.vipTier !== undefined) dbUpdates.vip_tier = updates.vipTier;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;

      const { data, error } = await sb.from('users').update(dbUpdates).eq('id', id).select().maybeSingle();
      if (!error && data) {
        return mapSupabaseUser(data);
      }
    } catch (e) {
      console.error('Supabase updateUser error:', e);
    }
  }
  return updateUser(id, updates);
}

export async function adjustUserBalanceAsync(id: string, deltaAmount: number): Promise<UserRecord | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const user = await getUserByIdAsync(id);
      if (user) {
        const newBalance = Math.max(0, Math.round((user.balance + deltaAmount) * 100) / 100);
        return updateUserAsync(id, { balance: newBalance });
      }
    } catch (e) {
      console.error('Supabase adjustUserBalance error:', e);
    }
  }
  return adjustUserBalance(id, deltaAmount);
}

export async function deleteUserAsync(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('users').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.error('Supabase deleteUser error:', e);
    }
  }
  return deleteUser(id);
}

export async function getAllOrdersAsync(): Promise<OrderRecord[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(mapSupabaseOrder);
      }
    } catch (e) {
      console.error('Supabase getAllOrders error:', e);
    }
  }
  return getAllOrders();
}

export async function createOrderAsync(orderData: Omit<OrderRecord, 'id' | 'createdAt'>): Promise<OrderRecord> {
  const sb = getSupabase();
  if (sb) {
    try {
      const id = `ORD-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();
      const insertPayload = {
        id,
        user_id: orderData.userId || null,
        user_email: orderData.userEmail || null,
        service_id: orderData.serviceId,
        service_name: orderData.serviceName,
        package_title: orderData.packageTitle,
        amount: orderData.amount,
        target_account: orderData.targetAccount,
        status: orderData.status,
        details: orderData.details || {},
        created_at: now,
      };
      const { data, error } = await sb.from('orders').insert(insertPayload).select().single();
      if (!error && data) {
        if (orderData.userId) {
          await adjustUserBalanceAsync(orderData.userId, -orderData.amount);
        }
        return mapSupabaseOrder(data);
      }
    } catch (e) {
      console.error('Supabase createOrder error:', e);
    }
  }
  return createOrder(orderData);
}

export async function updateOrderStatusAsync(
  orderId: string,
  newStatus: OrderRecord['status']
): Promise<OrderRecord | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('orders').update({ status: newStatus }).eq('id', orderId).select().maybeSingle();
      if (!error && data) {
        return mapSupabaseOrder(data);
      }
    } catch (e) {
      console.error('Supabase updateOrderStatus error:', e);
    }
  }
  return updateOrderStatus(orderId, newStatus);
}

export async function getAllDepositsAsync(): Promise<DepositRecord[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('deposits').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(mapSupabaseDeposit);
      }
    } catch (e) {
      console.error('Supabase getAllDeposits error:', e);
    }
  }
  return getAllDeposits();
}

export async function createDepositAsync(
  depositData: Omit<DepositRecord, 'id' | 'date'> & { date?: string; status?: DepositRecord['status'] }
): Promise<DepositRecord> {
  const sb = getSupabase();
  if (sb) {
    try {
      const id = `DEP-${Date.now().toString().slice(-5)}`;
      const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const insertPayload = {
        id,
        user_id: depositData.userId || null,
        user_name: depositData.userName,
        user_email: depositData.userEmail,
        method: depositData.method || 'شامكەش (Sham Cash)',
        amount: depositData.amount,
        status: 'pending',
        date: depositData.date || nowFormatted,
        tx_id: depositData.txId || null,
        created_at: new Date().toISOString(),
      };
      const { data, error } = await sb.from('deposits').insert(insertPayload).select().single();
      if (!error && data) {
        return mapSupabaseDeposit(data);
      }
    } catch (e) {
      console.error('Supabase createDeposit error:', e);
    }
  }
  return createDeposit(depositData);
}

export async function updateDepositStatusAsync(
  depositId: string,
  newStatus: 'completed' | 'rejected'
): Promise<DepositRecord | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const { data: existing } = await sb.from('deposits').select('*').eq('id', depositId).maybeSingle();
      const previousStatus = existing?.status;

      const { data, error } = await sb
        .from('deposits')
        .update({ status: newStatus, reviewed_at: nowFormatted })
        .eq('id', depositId)
        .select()
        .maybeSingle();

      if (!error && data) {
        if (newStatus === 'completed' && previousStatus === 'pending') {
          if (data.user_id) {
            await adjustUserBalanceAsync(data.user_id, Number(data.amount));
          } else if (data.user_email) {
            const user = await getUserByEmailAsync(data.user_email);
            if (user) {
              await adjustUserBalanceAsync(user.id, Number(data.amount));
            }
          }
        }
        return mapSupabaseDeposit(data);
      }
    } catch (e) {
      console.error('Supabase updateDepositStatus error:', e);
    }
  }
  return updateDepositStatus(depositId, newStatus);
}

export async function getSystemSettingsAsync(): Promise<SystemSettings> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('system_settings').select('*').eq('id', 'global').maybeSingle();
      if (!error && data) {
        return mapSupabaseSettings(data);
      }
    } catch (e) {
      console.error('Supabase getSystemSettings error:', e);
    }
  }
  return getSystemSettings();
}

export async function updateSystemSettingsAsync(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const sb = getSupabase();
  if (sb) {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.adminPin) dbUpdates.admin_pin = updates.adminPin;
      if (updates.shamcashAddress) dbUpdates.shamcash_address = updates.shamcashAddress;
      if (updates.whatsappNumber) dbUpdates.whatsapp_number = updates.whatsappNumber;
      if (updates.telegramUsername) dbUpdates.telegram_username = updates.telegramUsername;
      if (updates.siteName) dbUpdates.site_name = updates.siteName;

      const { data, error } = await sb
        .from('system_settings')
        .upsert({ id: 'global', ...dbUpdates })
        .select()
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseSettings(data);
      }
    } catch (e) {
      console.error('Supabase updateSystemSettings error:', e);
    }
  }
  return updateSystemSettings(updates);
}
