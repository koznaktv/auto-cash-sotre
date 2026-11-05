'use client';

export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

/**
 * Robust extractor for Telegram WebApp user data from:
 * 1. window.Telegram.WebApp.initDataUnsafe.user
 * 2. window.Telegram.WebApp.initData URLSearchParams
 * 3. window.location.hash (#tgWebAppData=...)
 * 4. window.location.search (?tgWebAppData=...)
 */
export function getTelegramWebAppUser(): TelegramWebAppUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready?.();
        tg.expand?.();
        if (tg.setHeaderColor) tg.setHeaderColor('#070b14');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#070b14');
      } catch {}

      if (tg.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user;
      }

      if (tg.initData) {
        try {
          const params = new URLSearchParams(tg.initData);
          const userStr = params.get('user');
          if (userStr) {
            const parsed = JSON.parse(userStr);
            if (parsed?.id) return parsed;
          }
        } catch {}
      }
    }

    // URL Hash fallback
    if (window.location.hash) {
      const hashStr = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hashStr);
      const raw = hashParams.get('tgWebAppData');
      if (raw) {
        const dataParams = new URLSearchParams(raw);
        const userStr = dataParams.get('user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          if (parsed?.id) return parsed;
        }
      }
    }

    // URL Search query fallback
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const raw = searchParams.get('tgWebAppData');
      if (raw) {
        const dataParams = new URLSearchParams(raw);
        const userStr = dataParams.get('user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          if (parsed?.id) return parsed;
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Format telegram user into standard clean identity
 */
export function formatTelegramIdentity(user: TelegramWebAppUser): string {
  if (user.username) {
    return user.username.startsWith('@') ? user.username : `@${user.username}`;
  }
  if (user.first_name) {
    const clean = user.first_name.trim().replace(/\s+/g, '_');
    return clean || `tg_${user.id}`;
  }
  return `tg_${user.id}`;
}

/**
 * Automatically authenticates the Telegram Mini App user into MAX-BAZAR / micro-apps.
 * Returns true if auto-login was initiated or already matches.
 */
export async function autoLoginTelegramMiniApp(
  appId: string = 'maxbazar',
  onSuccess?: (session: any) => void
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const tgUser = getTelegramWebAppUser();
  if (!tgUser || !tgUser.id) return false;

  const autoIdentity = formatTelegramIdentity(tgUser);

  // Check existing session
  try {
    const saved =
      localStorage.getItem('maxbazar_unified_session') ||
      localStorage.getItem('maxbazar_pubg_session') ||
      localStorage.getItem('maxbazar_hok_session');

    if (saved) {
      const parsed = JSON.parse(saved);
      // If already logged in as this exact telegram user, refresh and succeed
      const cleanIdent = (parsed.identity || '').replace(/^@/, '').toLowerCase();
      const tgIdent = autoIdentity.replace(/^@/, '').toLowerCase();

      if (cleanIdent === tgIdent || parsed.telegram_id === tgUser.id) {
        if (onSuccess) onSuccess(parsed);
        return true;
      }
    }
  } catch {}

  // Perform instant direct login with zero OTP friction
  try {
    const res = await fetch('/api/apps/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'direct_login',
        phone_or_username: autoIdentity,
        telegram_id: tgUser.id,
        photo_url: tgUser.photo_url || null,
        app_id: appId,
      }),
    });

    const data = await res.json();
    if (data?.ok && data?.session) {
      const session = {
        ...data.session,
        telegram_id: tgUser.id,
        photo_url: tgUser.photo_url || data.session.photo_url || `/api/apps/avatar?user=${encodeURIComponent(autoIdentity)}`,
      };

      try {
        localStorage.setItem('maxbazar_unified_session', JSON.stringify(session));
        localStorage.setItem('maxbazar_pubg_session', JSON.stringify(session));
        localStorage.setItem('maxbazar_hok_session', JSON.stringify(session));
        window.dispatchEvent(new CustomEvent('maxbazar-auth-changed', { detail: session }));
      } catch {}

      if (onSuccess) onSuccess(session);
      return true;
    }
  } catch {}

  return false;
}
