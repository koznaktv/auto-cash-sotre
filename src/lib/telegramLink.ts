import crypto from 'crypto';
import {
  getUserByIdAsync,
  getAllUsersAsync,
  updateUserAsync,
  adjustUserBalanceAsync,
  getAllOrdersAsync,
  transitionOrderAsync,
  UserRecord,
} from './db';
import { TELEGRAM_CONFIG, getBotToken } from './telegram';

function getLinkSecret(): string {
  return process.env.SESSION_SECRET || getBotToken() || 'autocash_secure_telegram_link_key_2026';
}

/**
 * Creates a stateless, tamper-proof signed link token (fits Telegram's 64-char limit)
 * Format: <compactUserId>_<base36Timestamp>_<16hexHmac>
 */
export function createTelegramLinkUrl(userId: string): { token: string; url: string } {
  const secret = getLinkSecret();
  const ts = Math.floor(Date.now() / 1000).toString(36);
  // compact userId: strip hyphens if UUID or USR-
  const compactId = userId.replace(/-/g, '');
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(`${compactId}:${ts}`)
    .digest('hex')
    .slice(0, 16);

  const token = `${compactId}_${ts}_${hmac}`;
  const botUsername = TELEGRAM_CONFIG.botUsername || 'Autocash_24_bot';
  const url = `https://t.me/${botUsername}?start=link_${token}`;

  return { token, url };
}

/**
 * Verifies a link token statelessly across any serverless container/instance.
 * Returns the resolved userId or null if invalid/expired (valid for 2 hours).
 */
export async function verifyTelegramLinkTokenAsync(token: string): Promise<{ userId: string } | null> {
  try {
    const parts = token.split('_');
    if (parts.length !== 3) return null;

    const [compactId, ts, sig] = parts;
    const secret = getLinkSecret();
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(`${compactId}:${ts}`)
      .digest('hex')
      .slice(0, 16);

    // Constant-time comparison to prevent timing attacks
    if (sig.length !== expectedHmac.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedHmac))) {
      return null;
    }

    const createdSec = parseInt(ts, 36);
    const nowSec = Math.floor(Date.now() / 1000);
    // Valid for 2 hours (7200 seconds)
    if (isNaN(createdSec) || nowSec - createdSec > 7200 || createdSec > nowSec + 300) {
      return null;
    }

    // Resolve user by exact ID or compact ID (matching with or without hyphens)
    const directUser = await getUserByIdAsync(compactId);
    if (directUser) return { userId: directUser.id };

    const allUsers = await getAllUsersAsync();
    const matched = allUsers.find(
      (u) => u.id === compactId || u.id.replace(/-/g, '').toLowerCase() === compactId.toLowerCase()
    );

    if (matched) return { userId: matched.id };

    // If UUID was stripped of hyphens, reconstruct standard 8-4-4-4-12 UUID
    if (compactId.length === 32) {
      const reconstructed = [
        compactId.slice(0, 8),
        compactId.slice(8, 12),
        compactId.slice(12, 16),
        compactId.slice(16, 20),
        compactId.slice(20),
      ].join('-');
      const uuidUser = await getUserByIdAsync(reconstructed);
      if (uuidUser) return { userId: uuidUser.id };
    }

    return null;
  } catch (err) {
    console.error('[verifyTelegramLinkToken] Error:', err);
    return null;
  }
}

/**
 * Backward compatibility alias
 */
export function verifyAndConsumeTelegramLinkToken(token: string): { userId: string } | null {
  const parts = token.split('_');
  if (parts.length !== 3) return null;
  const [compactId, ts, sig] = parts;
  const secret = getLinkSecret();
  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(`${compactId}:${ts}`)
    .digest('hex')
    .slice(0, 16);
  if (sig.length !== expectedHmac.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedHmac))) {
    return null;
  }
  const createdSec = parseInt(ts, 36);
  const nowSec = Math.floor(Date.now() / 1000);
  if (isNaN(createdSec) || nowSec - createdSec > 7200 || createdSec > nowSec + 300) {
    return null;
  }
  return { userId: compactId };
}

/**
 * Unifies the web user account and the Telegram account.
 * Atomically merges any balance or past orders from the temporary Telegram bot user!
 */
export async function linkTelegramAccountToUser(
  userId: string,
  tgChatId: number | string,
  tgUsername?: string
): Promise<{ success: boolean; user?: UserRecord; mergedBalance: number; alreadyLinked?: boolean; error?: string }> {
  try {
    let webUser = await getUserByIdAsync(userId);
    if (!webUser) {
      const allUsers = await getAllUsersAsync();
      webUser = allUsers.find(
        (u) => u.id === userId || u.id.replace(/-/g, '').toLowerCase() === userId.replace(/-/g, '').toLowerCase()
      ) || null;
    }

    if (!webUser) {
      return { success: false, mergedBalance: 0, error: 'Web user not found' };
    }

    // Check if web user is ALREADY linked to this exact Telegram Chat ID
    if (webUser.telegramChatId && String(webUser.telegramChatId) === String(tgChatId)) {
      return {
        success: true,
        user: webUser,
        mergedBalance: 0,
        alreadyLinked: true,
      };
    }

    const allUsers = await getAllUsersAsync();
    let mergedBalance = 0;

    // Check if there is a temporary bot user created for this Telegram chat ID
    const tgEmail = `tg_${tgChatId}@autocash.pro`;
    const tempBotUser = allUsers.find(
      (u) =>
        u.id !== webUser!.id &&
        (u.email === tgEmail || (u.telegramChatId && String(u.telegramChatId) === String(tgChatId)))
    );

    if (tempBotUser) {
      const tempBalance = Number(tempBotUser.balance || 0);
      if (tempBalance > 0) {
        // Deduct from temp user and credit to web user
        await adjustUserBalanceAsync(tempBotUser.id, -tempBalance);
        await adjustUserBalanceAsync(webUser.id, tempBalance);
        mergedBalance = tempBalance;
        webUser.balance = Number(webUser.balance || 0) + tempBalance;
      }

      // Reassign all orders from tempBotUser to webUser
      try {
        const allOrders = await getAllOrdersAsync();
        const userOrders = allOrders.filter(
          (o) => o.userId === tempBotUser.id || o.userEmail === tempBotUser.email
        );
        for (const ord of userOrders) {
          await transitionOrderAsync(ord.id, [ord.status], null, {
            originalUserId: tempBotUser.id,
            reassignedToUserId: webUser.id,
          });
        }
      } catch (ordErr) {
        console.warn('[Link Account] Order reassignment warning:', ordErr);
      }

      // Mark the temporary user as merged
      await updateUserAsync(tempBotUser.id, {
        name: `${tempBotUser.name} (Merged into ${webUser.email})`,
        telegramChatId: undefined,
        telegramUsername: undefined,
      } as any);
    }

    // Link webUser to Telegram
    const updatedUser = await updateUserAsync(webUser.id, {
      telegramChatId: tgChatId,
      telegramUsername: tgUsername || webUser.telegramUsername,
    } as any);

    return {
      success: true,
      user: updatedUser || webUser,
      mergedBalance,
    };
  } catch (err: any) {
    console.error('[Link Account] Error:', err);
    return { success: false, mergedBalance: 0, error: err?.message || 'Link failed' };
  }
}

/**
 * Unlinks Telegram account from web user
 */
export async function unlinkTelegramAccount(userId: string): Promise<boolean> {
  try {
    const updated = await updateUserAsync(userId, {
      telegramChatId: undefined,
      telegramUsername: undefined,
    } as any);
    return Boolean(updated);
  } catch (err) {
    console.error('[Unlink Account] Error:', err);
    return false;
  }
}
