import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
