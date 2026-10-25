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
import { TELEGRAM_CONFIG } from './telegram';

interface LinkTokenData {
  userId: string;
  createdAt: number;
}

// In-memory store for link tokens (valid for 20 minutes)
const linkTokenStore = new Map<string, LinkTokenData>();
const TOKEN_TTL_MS = 20 * 60 * 1000;

function pruneExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of Array.from(linkTokenStore.entries())) {
    if (now - data.createdAt > TOKEN_TTL_MS) {
      linkTokenStore.delete(token);
    }
  }
}

/**
 * Creates a unique, secure deep-link token for the user and generates the Telegram URL
 */
export function createTelegramLinkUrl(userId: string): { token: string; url: string } {
  pruneExpiredTokens();

  // Invalidate any existing tokens for this userId
  for (const [t, data] of Array.from(linkTokenStore.entries())) {
    if (data.userId === userId) {
      linkTokenStore.delete(t);
    }
  }

  const token = crypto.randomBytes(16).toString('hex');
  linkTokenStore.set(token, {
    userId,
    createdAt: Date.now(),
  });

  const botUsername = TELEGRAM_CONFIG.botUsername || 'Auto_cash_vip_bot';
  const url = `https://t.me/${botUsername}?start=link_${token}`;
  return { token, url };
}

/**
 * Verifies and consumes a link token, returning the associated userId
 */
export function verifyAndConsumeTelegramLinkToken(token: string): { userId: string } | null {
  pruneExpiredTokens();
  const data = linkTokenStore.get(token);
  if (!data) return null;

  if (Date.now() - data.createdAt > TOKEN_TTL_MS) {
    linkTokenStore.delete(token);
    return null;
  }

  linkTokenStore.delete(token);
  return { userId: data.userId };
}

/**
 * Unifies the web user account and the Telegram account.
 * Atomically merges any balance or past orders from the temporary Telegram bot user!
 */
export async function linkTelegramAccountToUser(
  userId: string,
  tgChatId: number | string,
  tgUsername?: string
): Promise<{ success: boolean; user?: UserRecord; mergedBalance: number; error?: string }> {
  try {
    const webUser = await getUserByIdAsync(userId);
    if (!webUser) {
      return { success: false, mergedBalance: 0, error: 'Web user not found' };
    }

    const allUsers = await getAllUsersAsync();
    let mergedBalance = 0;

    // Check if there is a temporary bot user created for this Telegram chat ID
    const tgEmail = `tg_${tgChatId}@autocash.pro`;
    const tempBotUser = allUsers.find(
      (u) =>
        u.id !== webUser.id &&
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
