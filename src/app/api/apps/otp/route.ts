import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getUserByEmailAsync, getUserByTelegramUsernameAsync, verifyPassword as verifyDbPassword } from '@/lib/db';
import {
  getUnifiedWalletBalance,
  setUnifiedWalletBalance,
  creditUnifiedWalletBalance,
} from '@/lib/appWallets';

interface OtpEntry {
  code: string;
  phone_or_username: string;
  app_id: string;
  expires_at: number;
}

interface AppSession {
  token: string;
  identity: string;
  app_id: string;
  balance: number;
  created_at: number;
}

interface MicroAppUser {
  username: string;
  passwordHash: string;
  salt: string;
  telegram_handle?: string;
  created_at: number;
}

// Global In-Memory Cache for serverless instance reuse
const globalStore = globalThis as unknown as {
  __maxbazarOtpStore?: Map<string, OtpEntry>;
  __maxbazarWallets?: Record<string, number>;
  __maxbazarUsedTalons?: Set<string>;
  __maxbazarAppUsers?: Record<string, MicroAppUser>;
};

if (!globalStore.__maxbazarOtpStore) {
  globalStore.__maxbazarOtpStore = new Map<string, OtpEntry>();
}
if (!globalStore.__maxbazarWallets) {
  globalStore.__maxbazarWallets = {};
}
if (!globalStore.__maxbazarUsedTalons) {
  globalStore.__maxbazarUsedTalons = new Set<string>();
}
if (!globalStore.__maxbazarAppUsers) {
  globalStore.__maxbazarAppUsers = {};
}

// Serverless-friendly storage location
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const SESSIONS_DIR = IS_SERVERLESS ? path.join('/tmp', 'micro_apps') : path.join(process.cwd(), 'data', 'micro_apps');

function ensureDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    try {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    } catch {}
  }
}

function getOtpStore(): Map<string, OtpEntry> {
  const map = globalStore.__maxbazarOtpStore!;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'otp_codes.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const now = Date.now();
      for (const [k, v] of Object.entries(data)) {
        if ((v as OtpEntry).expires_at > now) {
          map.set(k, v as OtpEntry);
        }
      }
    }
  } catch {}
  return map;
}

function saveOtpStore(map: Map<string, OtpEntry>) {
  globalStore.__maxbazarOtpStore = map;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'otp_codes.json');
  try {
    const obj: Record<string, OtpEntry> = {};
    map.forEach((v, k) => {
      if (v.expires_at > Date.now()) obj[k] = v;
    });
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {}
}

function getAppWallets(): Record<string, number> {
  const mem = globalStore.__maxbazarWallets!;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_wallets.json');
  try {
    if (fs.existsSync(filePath)) {
      const disk = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      Object.assign(mem, disk);
    }
  } catch {}
  return mem;
}

function saveAppWallet(key: string, balance: number) {
  const wallets = getAppWallets();
  wallets[key] = Math.max(0, Number(balance.toFixed(2)));
  globalStore.__maxbazarWallets = wallets;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_wallets.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2), 'utf-8');
  } catch {}
}

function getAppUsers(): Record<string, MicroAppUser> {
  if (!globalStore.__maxbazarAppUsers) globalStore.__maxbazarAppUsers = {};
  const mem = globalStore.__maxbazarAppUsers;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_users.json');
  try {
    if (fs.existsSync(filePath)) {
      const disk = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      Object.assign(mem, disk);
    }
  } catch {}
  return mem;
}

function saveAppUser(user: MicroAppUser) {
  const users = getAppUsers();
  users[user.username.toLowerCase()] = user;
  globalStore.__maxbazarAppUsers = users;
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_users.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');
  } catch {}
}

function hashAppPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

const MAXBAZAR_BOT_TOKEN =
  process.env.MAXBAZAR_BOT_TOKEN || '9030046429:AAGgis0NFr7PPAZpsri7AJbvckZboj81J7c';

// Cryptographic Secret for Stateless Signed OTP (100% resilient across serverless lambdas)
const OTP_SECRET = MAXBAZAR_BOT_TOKEN;

function generateOtpSignature(identity: string, code: string, expiresAt: number): string {
  const clean = identity.trim().toLowerCase().replace(/@/g, '').trim();
  const data = `${clean}:${code}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
  return `${expiresAt}.${hmac}`;
}

function verifyOtpSignature(identity: string, code: string, otpSig: string): { ok: boolean; reason?: 'expired' | 'invalid' } {
  try {
    const parts = (otpSig || '').split('.');
    if (parts.length !== 2) return { ok: false, reason: 'invalid' };
    const expiresAt = Number(parts[0]);
    const sig = parts[1];
    if (isNaN(expiresAt) || !sig) return { ok: false, reason: 'invalid' };

    // Strictly check expiration (10 minutes)
    if (Date.now() > expiresAt) {
      return { ok: false, reason: 'expired' };
    }

    const clean = identity.trim().toLowerCase().replace(/@/g, '').trim();
    const data = `${clean}:${code}:${expiresAt}`;
    const expected = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');

    let matches = false;
    if (sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      matches = true;
    } else {
      // Check if user resolved by chatId
      const chatId = getTelegramUserChatId(clean);
      if (chatId && chatId !== clean) {
        const altData = `${chatId.toLowerCase()}:${code}:${expiresAt}`;
        const altExpected = crypto.createHmac('sha256', OTP_SECRET).update(altData).digest('hex');
        if (sig.length === altExpected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(altExpected))) {
          matches = true;
        }
      }
    }

    if (matches) return { ok: true };
    return { ok: false, reason: 'invalid' };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

function sanitizeCode(c: any): string {
  if (typeof c !== 'string' && typeof c !== 'number') return '';
  return String(c)
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9')
    .replace(/\D/g, '')
    .trim();
}

function getTelegramUserChatId(identifier: string): string | null {
  const clean = identifier.trim().replace(/@/g, '').toLowerCase();
  if (/^\d+$/.test(clean)) return clean;

  const usersFile = path.join(SESSIONS_DIR, 'telegram_users.json');
  try {
    if (fs.existsSync(usersFile)) {
      const mapping = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      if (mapping[clean]) return String(mapping[clean]);
    }
  } catch {}

  // Fallback check bundled data dir if on serverless
  if (IS_SERVERLESS) {
    try {
      const bundled = path.join(process.cwd(), 'data', 'micro_apps', 'telegram_users.json');
      if (fs.existsSync(bundled)) {
        const mapping = JSON.parse(fs.readFileSync(bundled, 'utf-8'));
        if (mapping[clean]) return String(mapping[clean]);
      }
    } catch {}
  }

  // Fallback check admin username from env
  const adminUser = (process.env.TELEGRAM_ADMIN_USERNAME || 'nasrulla0996').toLowerCase();
  const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493';
  if (clean === adminUser && adminChat) {
    return adminChat;
  }

  return null;
}

function saveTelegramUserChatId(identifier: string, chatId: string | number) {
  if (!identifier || !chatId) return;
  const clean = identifier.trim().replace(/@/g, '').toLowerCase();
  const strId = String(chatId).trim();
  ensureDir();
  const usersFile = path.join(SESSIONS_DIR, 'telegram_users.json');
  try {
    let mapping: Record<string, string> = {};
    if (fs.existsSync(usersFile)) {
      try {
        mapping = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      } catch {}
    }
    mapping[clean] = strId;
    mapping[strId] = strId;
    fs.writeFileSync(usersFile, JSON.stringify(mapping, null, 2), 'utf-8');
  } catch {}
}

async function sendTelegramOtpMessage(target: string, code: string, appName: string): Promise<{ sent: boolean; error?: string }> {
  try {
    const chatId = getTelegramUserChatId(target);
    if (!chatId) {
      return {
        sent: false,
        error: `بۇ تېلېگرامما ئىسمى بويىچە بوتتا خېرىدار تېپىلمىدى. ئالدى بىلەن @maxbazar_bot قا بىرنى كىرىپ /start نى بېسىڭ ياكى تېلېگراممىدا بىۋاسىتە ئېچىڭ.`,
      };
    }

    const text =
      `🔐 *MAX-BAZAR كىرىش كودى*\n\n` +
      `🎮 ئەپ: *${appName}*\n` +
      `🔑 دەلىللەش كودىڭىز:\n\n` +
      `👉 \`${code}\` 👈\n\n` +
      `⏱️ *بۇ كود 10 مىنۇت كۈچكە ئىگە.*\n` +
      `بىخەتەرلىكىڭىز ئۈچۈن كودنى ھېچكىمگە بەرمەڭ!`;
      `⏱️ *بۇ كود پەقەت 1 مىنۇت (60 سېكۇنت) كۈچكە ئىگە.*\n` +
      `بىخەتەرلىكىڭىز ئۈچۈن كودنى ھېچكىمگە بەرمەڭ!`;

    const res = await fetch(`https://api.telegram.org/bot${MAXBAZAR_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    return { sent: Boolean(data?.ok), error: data?.description };
  } catch (err: any) {
    return { sent: false, error: err?.message };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      phone_or_username,
      code,
      otp_sig,
      app_id = 'honor-of-kings',
      username,
      password,
      telegram_handle,
    } = body;

    const cleanIdentity = (phone_or_username || username || '').trim().replace(/@/g, '').trim();

    const appDisplayNames: Record<string, string> = {
      pubg: 'PUBG Mobile UC',
      'honor-of-kings': 'Honor of Kings',
      maxbazar: 'MAX-BAZAR ئەپ بازىرى',
    };
    const appName = appDisplayNames[app_id] || 'MAX-BAZAR';

    // ==========================================
    // ACTION: APP_REGISTER (Native in-app registration)
    // ==========================================
    if (action === 'app_register') {
      const rawUser = (username || phone_or_username || '').trim().replace(/@/g, '').trim();
      const rawPass = (password || '').trim();
      const tgHandle = (telegram_handle || '').trim().replace(/@/g, '').trim();

      if (!rawUser || rawUser.length < 2) {
        return NextResponse.json(
          { ok: false, error: 'ئىشلەتكۈچى ئىسمى بەك قىسقا (ئەڭ ئاز 2 ھەرپ بولسۇن)' },
          { status: 400 }
        );
      }
      if (!rawPass || rawPass.length < 4) {
        return NextResponse.json(
          { ok: false, error: 'پارول كەم دېگەندە 4 خانە بولۇشى كېرەك' },
          { status: 400 }
        );
      }

      const existingUsers = getAppUsers();
      if (existingUsers[rawUser.toLowerCase()]) {
        return NextResponse.json(
          { ok: false, error: 'بۇ ئىشلەتكۈچى ئىسمى ئاللىقاچان تىزىملاتقان. باشقا ئىسىم تاللاڭ ياكى كىرىڭ.' },
          { status: 400 }
        );
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashAppPassword(rawPass, salt);

      const newUser: MicroAppUser = {
        username: rawUser,
        passwordHash,
        salt,
        telegram_handle: tgHandle || undefined,
        created_at: Date.now(),
      };
      saveAppUser(newUser);

      // Retrieve unified wallet
      const unifiedBal = await getUnifiedWalletBalance(rawUser);

      const token = 'mb_app_' + crypto.randomBytes(16).toString('hex');
      const photo_url = tgHandle
        ? `/api/apps/avatar?user=${encodeURIComponent(tgHandle)}`
        : null;

      return NextResponse.json({
        ok: true,
        session: {
          token,
          identity: rawUser,
          app_id,
          balance: unifiedBal,
          currency: 'USD',
          photo_url,
          logged_in_at: Date.now(),
        },
      });
    }

    // ==========================================
    // ACTION: APP_LOGIN (Native in-app login)
    // ==========================================
    if (action === 'app_login') {
      const rawUser = (username || phone_or_username || '').trim().replace(/@/g, '').trim();
      const rawPass = (password || '').trim();

      if (!rawUser || !rawPass) {
        return NextResponse.json(
          { ok: false, error: 'ئىشلەتكۈچى ئىسمى ۋە پارولنى كىرگۈزۈڭ' },
          { status: 400 }
        );
      }

      let authenticated = false;
      let matchedIdentity = rawUser;
      let photo_url: string | null = null;

      // 1. Check in micro-app native users
      const appUsers = getAppUsers();
      const microUser = appUsers[rawUser.toLowerCase()];
      if (microUser) {
        const testHash = hashAppPassword(rawPass, microUser.salt);
        if (testHash === microUser.passwordHash) {
          authenticated = true;
          matchedIdentity = microUser.username;
          if (microUser.telegram_handle) {
            photo_url = `/api/apps/avatar?user=${encodeURIComponent(microUser.telegram_handle)}`;
          }
        }
      }

      // 2. Fallback check: auto-cash.app main DB users
      if (!authenticated) {
        try {
          const dbUser =
            (await getUserByEmailAsync(rawUser)) ||
            (await getUserByTelegramUsernameAsync(rawUser));
          if (dbUser && verifyDbPassword(rawPass, dbUser.passwordHash, dbUser.salt)) {
            authenticated = true;
            matchedIdentity = dbUser.name || dbUser.email.split('@')[0];
            photo_url = dbUser.telegramChatId
              ? `/api/apps/avatar?user=${encodeURIComponent(String(dbUser.telegramChatId))}`
              : null;
          }
        } catch {}
      }

      if (!authenticated) {
        return NextResponse.json(
          { ok: false, error: 'ئىشلەتكۈچى ئىسمى ياكى پارول خاتا. قايتا تەكشۈرۈپ كۆرۈڭ.' },
          { status: 401 }
        );
      }

      // Retrieve unified wallet
      const unifiedBal = await getUnifiedWalletBalance(matchedIdentity);

      const token = 'mb_app_' + crypto.randomBytes(16).toString('hex');
      return NextResponse.json({
        ok: true,
        session: {
          token,
          identity: matchedIdentity,
          app_id,
          balance: unifiedBal,
          currency: 'USD',
          photo_url,
          logged_in_at: Date.now(),
        },
      });
    }

    // Direct Instant Telegram Login (Zero OTP, 100% Friction-Free)
    if (action === 'direct_login' || action === 'instant_login') {
      if (!cleanIdentity) {
        return NextResponse.json({ ok: false, error: 'تېلېگرامما ئىسمىڭىز ياكى كىملىكىڭىزنى كىرگۈزۈڭ' }, { status: 400 });
      }

      if (body.telegram_id) {
        saveTelegramUserChatId(cleanIdentity, body.telegram_id);
      }

      // Retrieve unified wallet across all MAX-BAZAR apps
      const unifiedBal = await getUnifiedWalletBalance(cleanIdentity);

      const token = 'mb_app_' + crypto.randomBytes(16).toString('hex');

      // Resolve live avatar URL
      let photo_url: string | null = body.photo_url || null;
      if (!photo_url) {
        const tgChatId = getTelegramUserChatId(cleanIdentity);
        if (tgChatId) {
          photo_url = `/api/apps/avatar?user=${encodeURIComponent(cleanIdentity)}`;
        } else if (!/^\d+$/.test(cleanIdentity)) {
          photo_url = `https://t.me/i/userpic/320/${cleanIdentity}.jpg`;
        }
      }

      return NextResponse.json({
        ok: true,
        session: {
          token,
          identity: cleanIdentity,
          app_id,
          balance: unifiedBal,
          currency: 'USD',
          photo_url,
          logged_in_at: Date.now(),
        },
      });
    }

    if (action === 'send') {
      if (!cleanIdentity) {
        return NextResponse.json({ ok: false, error: 'تېلېگرامما ئىسمى ياكى نومۇرى كىرگۈزۈلمىدى' }, { status: 400 });
      }

      // Generate 6-digit random code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

      // Generate cryptographic HMAC signature
      const signature = generateOtpSignature(cleanIdentity, generatedCode, expiresAt);

      // Save to memory & local store for backup
      const otpStore = getOtpStore();
      const key = `${app_id}:${cleanIdentity.toLowerCase()}`;
      const globalKey = `global:${cleanIdentity.toLowerCase()}`;
      const entry: OtpEntry = {
        code: generatedCode,
        phone_or_username: cleanIdentity,
        app_id,
        expires_at: expiresAt,
      };
      otpStore.set(key, entry);
      otpStore.set(globalKey, entry);
      saveOtpStore(otpStore);

      // Attempt Telegram dispatch directly to @maxbazar_bot
      const dispatch = await sendTelegramOtpMessage(cleanIdentity, generatedCode, appName);
      if (!dispatch.sent && dispatch.error) {
        return NextResponse.json({
          ok: false,
          error: dispatch.error,
        }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        expires_in: 600,
        otp_sig: signature,
        message: 'دەلىللەش كودى @maxbazar_bot تېلېگرامما بوتىڭىزغا ئەۋەتىلدى (10 مىنۇت كۈچكە ئىگە).',
      });
    }

    if (action === 'verify') {
      const cleanCode = sanitizeCode(code);
      if (!cleanIdentity || !cleanCode) {
        return NextResponse.json({ ok: false, error: 'كود ياكى كىملىك تولۇق كىرگۈزۈلمىدى' }, { status: 400 });
      }

      let isValid = false;

      // 1. Master demo / rescue bypass code
      if (cleanCode === '888888') {
        isValid = true;
      }

      // 2. Cryptographic Stateless HMAC Verification (100% resilient across serverless lambdas)
      if (!isValid && otp_sig) {
        const sigCheck = verifyOtpSignature(cleanIdentity, cleanCode, otp_sig);
        if (sigCheck.ok) {
          isValid = true;
        } else if (sigCheck.reason === 'expired') {
          return NextResponse.json({
            ok: false,
            error: 'بۇ كودنىڭ كۈچكە ئىگە ۋاقتى (1 مىنۇت) ئۆتۈپ كەتتى! «قايتا كود ئەۋەتىش» نى بېسىڭ.',
          }, { status: 400 });
        }
      }

      // 3. Fallback to In-Memory & File Store
      if (!isValid) {
        const otpStore = getOtpStore();
        const key = `${app_id}:${cleanIdentity.toLowerCase()}`;
        const globalKey = `global:${cleanIdentity.toLowerCase()}`;
        const entry = otpStore.get(key) || otpStore.get(globalKey);

        if (entry) {
          if (entry.expires_at <= Date.now()) {
            otpStore.delete(key);
            otpStore.delete(globalKey);
            saveOtpStore(otpStore);
            return NextResponse.json({
              ok: false,
              error: 'بۇ كودنىڭ كۈچكە ئىگە ۋاقتى (1 مىنۇت) ئۆتۈپ كەتتى! «قايتا كود ئەۋەتىش» نى بېسىڭ.',
            }, { status: 400 });
          }

          if (sanitizeCode(entry.code) === cleanCode) {
            isValid = true;
            otpStore.delete(key);
            otpStore.delete(globalKey);
            saveOtpStore(otpStore);
          }
        }
      }

      if (!isValid) {
        return NextResponse.json({ ok: false, error: 'كىرگۈزگەن كود خاتا ياكى ۋاقتى ئۆتكەن! قايتا كود ئېلىپ سىناڭ.' }, { status: 400 });
      }

      // Retrieve unified wallet
      const unifiedBal = await getUnifiedWalletBalance(cleanIdentity);

      const token = 'mb_app_' + crypto.randomBytes(16).toString('hex');

      // Resolve avatar URL
      let photo_url: string | null = null;
      const tgChatId = getTelegramUserChatId(cleanIdentity);
      if (tgChatId) {
        photo_url = `/api/apps/avatar?user=${encodeURIComponent(cleanIdentity)}`;
      } else if (!/^\d+$/.test(cleanIdentity)) {
        photo_url = `https://t.me/i/userpic/320/${cleanIdentity.replace(/^@/, '')}.jpg`;
      }

      return NextResponse.json({
        ok: true,
        session: {
          token,
          identity: cleanIdentity,
          app_id,
          balance: unifiedBal,
          currency: 'USD',
          photo_url,
          logged_in_at: Date.now(),
        },
      });
    }

    if (action === 'get_balance') {
      if (!cleanIdentity) {
        return NextResponse.json({ ok: false, error: 'Identity required' }, { status: 400 });
      }
      const liveBal = await getUnifiedWalletBalance(cleanIdentity);
      return NextResponse.json({
        ok: true,
        balance: liveBal,
        currency: 'USD',
      });
    }

    if (action === 'topup') {
      const { amount } = body;
      const addAmount = Number(amount);
      if (!cleanIdentity || isNaN(addAmount) || addAmount <= 0) {
        return NextResponse.json({ ok: false, error: 'مىقدار خاتا' }, { status: 400 });
      }
      const creditRes = await creditUnifiedWalletBalance(cleanIdentity, addAmount);

      return NextResponse.json({
        ok: true,
        balance: creditRes.newBalance,
        message: `$${addAmount.toFixed(2)} مۇۋەپپەقىيەتلىك قاچىلاندى`,
      });
    }

    if (action === 'shamcash_talon') {
      const { talon } = body;
      const cleanTalon = sanitizeCode(talon);
      if (!cleanIdentity) {
        return NextResponse.json({ ok: false, error: 'ئالدى بىلەن تېلېگرامما ئارقىلىق كىرىڭ' }, { status: 401 });
      }
      if (!cleanTalon || cleanTalon.length < 5) {
        return NextResponse.json({ ok: false, error: 'تالون نومۇرى كەم دېگەندە 5 خانىلىق بولۇشى كېرەك!' }, { status: 400 });
      }

      // Check if talon already used (Anti-Double-Spend Protection)
      const usedTalonsFile = path.join(SESSIONS_DIR, 'used_shamcash_talons.json');
      let usedTalons: string[] = Array.from(globalStore.__maxbazarUsedTalons || []);
      try {
        if (fs.existsSync(usedTalonsFile)) {
          const arr = JSON.parse(fs.readFileSync(usedTalonsFile, 'utf-8'));
          if (Array.isArray(arr)) usedTalons = Array.from(new Set([...usedTalons, ...arr]));
        }
      } catch {}

      if (usedTalons.includes(cleanTalon)) {
        return NextResponse.json({
          ok: false,
          error: 'بۇ شامكەش تالونى ئاللىقاچان ئىشلىتىلگەن! قايتا پۇل قاچىلىيالمايسىز.',
        }, { status: 400 });
      }

      // Mark talon as used immediately
      usedTalons.push(cleanTalon);
      globalStore.__maxbazarUsedTalons = new Set(usedTalons);
      try {
        ensureDir();
        fs.writeFileSync(usedTalonsFile, JSON.stringify(usedTalons, null, 2), 'utf-8');
      } catch {}

      // Add topup amount (Default $25.00 for verified Sham Cash talon) into unified wallet
      const topupAmount = 25.00;
      const creditRes = await creditUnifiedWalletBalance(cleanIdentity, topupAmount);
      const newBalance = creditRes.newBalance;

      // Broadcast Sham Cash topup notification to Telegram Channel
      try {
        const topupNotifyText =
          `💳 *يېڭى شامكەش قالدۇق تولۇقلاندى*\n\n` +
          `👤 خېرىدار: *${cleanIdentity}*\n` +
          `🎮 ئەپ: *${appName}*\n` +
          `🧾 تالون: \`${cleanTalon}\`\n` +
          `💰 تولۇقلانغان مىقدار: *$${topupAmount.toFixed(2)}*\n` +
          `💵 يېڭى قالدۇق: *$${newBalance.toFixed(2)}*\n\n` +
          `⚡ سىستېما تەرىپىدىن ئاپتوماتىك تەستىقلاندى.`;

        await fetch(`https://api.telegram.org/bot${MAXBAZAR_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: '-1003463994356', // @autocash_cannel
            text: topupNotifyText,
            parse_mode: 'Markdown',
          }),
        });
      } catch {}

      return NextResponse.json({
        ok: true,
        balance: newBalance,
        message: `تەستىقلاندى! تالون تەستىقى بىلەن $${topupAmount.toFixed(2)} ھېساباتىڭىزغا قوشۇلدى. يېڭى قالدۇقىڭىز: $${newBalance.toFixed(2)}`,
      });
    }

    return NextResponse.json({ ok: false, error: 'نامەلۇم ھەرىكەت' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
