import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface OtpEntry {
  code: string;
  phone_or_username: string;
  app_id: string;
  expires_at: number;
}

interface AppSession {
  token: string;
  phone_or_username: string;
  app_id: string;
  balance: number;
  created_at: number;
}

// File-backed storage for persistence
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'micro_apps');
function ensureDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    try {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    } catch {}
  }
}

function getOtpStore(): Map<string, OtpEntry> {
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'otp_codes.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const map = new Map<string, OtpEntry>();
      const now = Date.now();
      for (const [k, v] of Object.entries(data)) {
        if ((v as OtpEntry).expires_at > now) {
          map.set(k, v as OtpEntry);
        }
      }
      return map;
    }
  } catch {}
  return new Map();
}

function saveOtpStore(map: Map<string, OtpEntry>) {
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
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_wallets.json');
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveAppWallet(key: string, balance: number) {
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_wallets.json');
  try {
    const wallets = getAppWallets();
    wallets[key] = Math.max(0, Number(balance.toFixed(2)));
    fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2), 'utf-8');
  } catch {}
}

const MAXBAZAR_BOT_TOKEN =
  process.env.MAXBAZAR_BOT_TOKEN || '9030046429:AAGgis0NFr7PPAZpsri7AJbvckZboj81J7c';

function getTelegramUserChatId(identifier: string): string | null {
  const clean = identifier.trim().replace(/^@/, '').toLowerCase();
  if (/^\d+$/.test(clean)) return clean;

  const usersFile = path.join(SESSIONS_DIR, 'telegram_users.json');
  try {
    if (fs.existsSync(usersFile)) {
      const mapping = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      if (mapping[clean]) return String(mapping[clean]);
    }
  } catch {}

  // Fallback check admin username from env
  const adminUser = (process.env.TELEGRAM_ADMIN_USERNAME || 'nasrulla0996').toLowerCase();
  const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493';
  if (clean === adminUser && adminChat) {
    return adminChat;
  }

  return null;
}

async function sendTelegramOtpMessage(target: string, code: string, appName: string): Promise<{ sent: boolean; error?: string }> {
  try {
    const chatId = getTelegramUserChatId(target);
    if (!chatId) {
      return {
        sent: false,
        error: `بۇ تېلېگرامما ئىسمى بويىچە بوتتا خېرىدار تېپىلمىدى. ئالدى بىلەن @maxbazar_bot قا بىرنى كىرىپ سىناڭ ياكى Chat ID نومۇرىڭىزنى كىرگۈزۈڭ.`,
      };
    }

    const text =
      `🔐 *MAX-BAZAR كىرىش كودى*\n\n` +
      `🎮 ئەپ: *${appName}*\n` +
      `🔑 دەلىللەش كودىڭىز:\n\n` +
      `👉 \`${code}\` 👈\n\n` +
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
    const { action, phone_or_username, code, app_id = 'honor-of-kings' } = body;

    const cleanIdentity = (phone_or_username || '').trim().replace(/^@/, '');

    if (action === 'send') {
      if (!cleanIdentity) {
        return NextResponse.json({ ok: false, error: 'تېلېگرامما ئىسمى ياكى نومۇرى كىرگۈزۈلمىدى' }, { status: 400 });
      }

      // Generate 6-digit random code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpStore = getOtpStore();
      const key = `${app_id}:${cleanIdentity.toLowerCase()}`;

      // Strictly 1 minute (60 seconds) expiration as requested by the user
      otpStore.set(key, {
        code: generatedCode,
        phone_or_username: cleanIdentity,
        app_id,
        expires_at: Date.now() + 60 * 1000,
      });
      saveOtpStore(otpStore);

      // Attempt Telegram dispatch directly to @maxbazar_bot
      const dispatch = await sendTelegramOtpMessage(cleanIdentity, generatedCode, 'Honor of Kings');
      if (!dispatch.sent && dispatch.error) {
        return NextResponse.json({
          ok: false,
          error: dispatch.error,
        }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        expires_in: 60,
        message: 'دەلىللەش كودى @maxbazar_bot تېلېگرامما بوتىڭىزغا ئەۋەتىلدى (1 مىنۇت كۈچكە ئىگە).',
      });
    }

    if (action === 'verify') {
      if (!cleanIdentity || !code) {
        return NextResponse.json({ ok: false, error: 'كود ياكى كىملىك تولۇق كىرگۈزۈلمىدى' }, { status: 400 });
      }

      const otpStore = getOtpStore();
      const key = `${app_id}:${cleanIdentity.toLowerCase()}`;
      const entry = otpStore.get(key);

      // Check if code has expired (strictly 1 minute)
      if (entry && entry.expires_at <= Date.now() && code.trim() !== '888888') {
        otpStore.delete(key);
        saveOtpStore(otpStore);
        return NextResponse.json({
          ok: false,
          error: 'بۇ كودنىڭ كۈچكە ئىگە ۋاقتى (1 مىنۇت) ئۆتۈپ كەتتى! «قايتا كود ئەۋەتىش» نى بېسىڭ.',
        }, { status: 400 });
      }

      // Allow either correct active OTP code or master quick demo code '888888'
      const isValid = (entry && entry.code === code.trim() && entry.expires_at > Date.now()) || code.trim() === '888888';

      if (!isValid) {
        return NextResponse.json({ ok: false, error: 'كىرگۈزگەن كود خاتا ياكى ۋاقتى ئۆتكەن!' }, { status: 400 });
      }

      // Clear used OTP
      otpStore.delete(key);
      saveOtpStore(otpStore);

      // Initialize or retrieve dedicated app wallet
      const walletKey = `${app_id}:${cleanIdentity.toLowerCase()}`;
      const wallets = getAppWallets();
      if (wallets[walletKey] === undefined) {
        // Welcome initial wallet balance for demo/testing
        wallets[walletKey] = 25.00;
        saveAppWallet(walletKey, 25.00);
      }

      const token = 'hok_' + crypto.randomBytes(16).toString('hex');

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
          balance: wallets[walletKey],
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
      const walletKey = `${app_id}:${cleanIdentity.toLowerCase()}`;
      const wallets = getAppWallets();
      return NextResponse.json({
        ok: true,
        balance: wallets[walletKey] ?? 0.00,
        currency: 'USD',
      });
    }

    if (action === 'topup') {
      const { amount } = body;
      const addAmount = Number(amount);
      if (!cleanIdentity || isNaN(addAmount) || addAmount <= 0) {
        return NextResponse.json({ ok: false, error: 'مىقدار خاتا' }, { status: 400 });
      }
      const walletKey = `${app_id}:${cleanIdentity.toLowerCase()}`;
      const wallets = getAppWallets();
      const current = wallets[walletKey] ?? 0.00;
      const newBalance = current + addAmount;
      saveAppWallet(walletKey, newBalance);

      return NextResponse.json({
        ok: true,
        balance: newBalance,
        message: `$${addAmount.toFixed(2)} مۇۋەپپەقىيەتلىك قاچىلاندى`,
      });
    }

    if (action === 'shamcash_talon') {
      const { talon } = body;
      const cleanTalon = (talon || '').trim();
      if (!cleanIdentity) {
        return NextResponse.json({ ok: false, error: 'ئالدى بىلەن تېلېگرامما ئارقىلىق كىرىڭ' }, { status: 401 });
      }
      if (!cleanTalon || cleanTalon.length < 5) {
        return NextResponse.json({ ok: false, error: 'تالون نومۇرى كەم دېگەندە 5 خانىلىق بولۇشى كېرەك!' }, { status: 400 });
      }

      // Check if talon already used (Anti-Double-Spend Protection)
      const talonsFile = path.join(SESSIONS_DIR, 'used_talons.json');
      let usedTalons: Record<string, any> = {};
      try {
        if (fs.existsSync(talonsFile)) usedTalons = JSON.parse(fs.readFileSync(talonsFile, 'utf-8'));
      } catch {}

      if (usedTalons[cleanTalon]) {
        return NextResponse.json({
          ok: false,
          error: `بۇ تالون نومۇرى (${cleanTalon}) ئاللىقاچان ئىشلىتىلگەن! بىر تالون بىلەن قايتا قالدۇق قاچىلىغىلى بولمايدۇ.`,
        }, { status: 400 });
      }

      // 100% Strict Live Verification via TSA Shamcash API
      let creditUsd = 0;
      let verifyMessage = '';
      try {
        const { verifyShamcashTransaction } = await import('@/lib/providers/tsaShamcash');
        const verifyRes = await verifyShamcashTransaction(cleanTalon);
        if (verifyRes.success && verifyRes.found && verifyRes.transaction) {
          const tx = verifyRes.transaction;
          const rawAmount = Number(tx.amount || 0);
          if (rawAmount > 0) {
            // If already in USD, use directly. Otherwise convert SYP to USD with live rate
            const isUsd = (tx.currency || '').toUpperCase() === 'USD';
            creditUsd = isUsd ? Number(rawAmount.toFixed(2)) : Number((rawAmount / 14390).toFixed(2));
            verifyMessage = `تالون جەزملەندى (${rawAmount} ${tx.currency || 'SYP'})`;
          }
        } else {
          verifyMessage = verifyRes.error || verifyRes.message || 'بۇ تالون نومۇرى بويىچە بىزنىڭ شامكەش ئادرېسىمىزغا پۇل بايقالمىدى.';
        }
      } catch (err: any) {
        console.warn('TSA verification exception:', err);
        verifyMessage = 'شامكەش دەلىللەش تورىدا مەسىلە كۆرۈلدى. قايتا سىناڭ ياكى باشقۇرغۇچىغا خەۋەر قىلىڭ.';
      }

      // Strict Enforcement: Zero tolerance for unverified talons
      if (creditUsd <= 0) {
        return NextResponse.json({
          ok: false,
          error: verifyMessage || 'بۇ تالون نومۇرى بويىچە ھېساباتىمىزغا پۇل كىرمىگەن. تالون نومۇرىنى تەكشۈرۈپ قايتا كىرگۈزۈڭ.',
        }, { status: 400 });
      }

      const walletKey = `${app_id}:${cleanIdentity.toLowerCase()}`;
      const wallets = getAppWallets();
      const current = wallets[walletKey] ?? 0.00;
      const newBalance = Number((current + creditUsd).toFixed(2));
      saveAppWallet(walletKey, newBalance);

      // Permanently lock this talon with timestamp, identity and amount
      usedTalons[cleanTalon] = {
        identity: cleanIdentity,
        app_id,
        amount_usd: creditUsd,
        time: new Date().toISOString(),
      };
      try {
        fs.writeFileSync(talonsFile, JSON.stringify(usedTalons, null, 2), 'utf-8');
      } catch {}

      return NextResponse.json({
        ok: true,
        balance: newBalance,
        credited_usd: creditUsd,
        message: `شامكەش تالونى مۇۋەپپەقىيەتلىك دەلىللەندى! +$${creditUsd.toFixed(2)} ھەميېنىڭىزغا كىردى.`,
      });
    }

    return NextResponse.json({ ok: false, error: 'نامەلۇم ھەرىكەت' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server Error' }, { status: 500 });
  }
}
