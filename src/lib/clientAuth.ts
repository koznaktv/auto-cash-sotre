// Browser-side helpers for the localStorage profile cache that mirrors the server session cookie.

export interface ClientUser {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  balance?: number;
  maxstoreBalance?: number;
  vipTier?: string;
  totalSpent?: number;
  role?: string;
  apiKey?: string;
  apiKeyCreatedAt?: string;
  apiEnabled?: boolean;
}

export function notifyAuthChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('autocash-auth-changed'));
    window.dispatchEvent(new Event('autocash_auth_changed'));
  }
}

export function storeLocalAuth(user: ClientUser, options?: { skipNotify?: boolean }): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('autocash_is_logged_in', 'true');
  try { localStorage.setItem('autocash_user', JSON.stringify(user)); } catch {}
  localStorage.setItem('autocash_username', user.name);
  localStorage.setItem('autocash_email', user.email);
  if (user.id) localStorage.setItem('autocash_userId', user.id);
  if (user.avatarUrl && !user.avatarUrl.startsWith('data:')) {
    localStorage.setItem('autocash_avatar', user.avatarUrl);
  } else {
    localStorage.removeItem('autocash_avatar');
  }
  if (typeof user.balance === 'number') {
    localStorage.setItem('autocash_balance', String(user.balance));
    localStorage.setItem('maxstore_balance', String(user.balance)); // Keep 100% unified in sync
  }
  if (user.vipTier) localStorage.setItem('autocash_vipTier', user.vipTier);
  if (typeof user.totalSpent === 'number') localStorage.setItem('autocash_totalSpent', String(user.totalSpent));
  if (user.role) localStorage.setItem('autocash_role', user.role);
  if (user.apiKey) {
    localStorage.setItem('autocash_apiKey', user.apiKey);
  } else if (user.apiKey === '') {
    localStorage.removeItem('autocash_apiKey');
  }
  if (user.apiKeyCreatedAt) {
    localStorage.setItem('autocash_apiKeyCreatedAt', user.apiKeyCreatedAt);
  }
  if (user.apiEnabled !== undefined) {
    localStorage.setItem('autocash_apiEnabled', String(user.apiEnabled));
  }

  // Seamlessly sync with MAX-BAZAR unified session
  try {
    const maxbazarSession = {
      token: 'token_' + (user.id || Date.now()),
      identity: user.email || user.name || '',
      balance: Number(user.balance) || 0,
      photo_url: user.avatarUrl || '',
      user: user,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem('maxbazar_unified_session', JSON.stringify(maxbazarSession));
    localStorage.setItem('maxbazar_pubg_session', JSON.stringify(maxbazarSession));
    localStorage.setItem('maxbazar_hok_session', JSON.stringify(maxbazarSession));
    window.dispatchEvent(new CustomEvent('maxbazar-auth-changed', { detail: maxbazarSession }));
  } catch {}

  if (!options?.skipNotify) {
    notifyAuthChanged();
  }
}

export function clearLocalAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('autocash_is_logged_in', 'false');
  localStorage.removeItem('autocash_username');
  localStorage.removeItem('autocash_email');
  localStorage.removeItem('autocash_userId');
  localStorage.removeItem('autocash_avatar');
  localStorage.removeItem('autocash_phone');
  localStorage.removeItem('autocash_balance');
  localStorage.removeItem('maxstore_balance');
  localStorage.removeItem('autocash_vipTier');
  localStorage.removeItem('autocash_totalSpent');
  localStorage.removeItem('autocash_role');
  localStorage.removeItem('autocash_apiKey');
  localStorage.removeItem('autocash_apiKeyCreatedAt');
  localStorage.removeItem('autocash_apiEnabled');
  localStorage.removeItem('autocash_user');

  // Clear MAX-BAZAR sessions
  try {
    localStorage.removeItem('maxbazar_unified_session');
    localStorage.removeItem('maxbazar_pubg_session');
    localStorage.removeItem('maxbazar_hok_session');
    window.dispatchEvent(new CustomEvent('maxbazar-auth-changed', { detail: null }));
  } catch {}

  notifyAuthChanged();
}

export function getCachedBalance(store: 'autocash' | 'maxstore' = 'autocash'): number {
  if (typeof window === 'undefined') return 0.0;
  const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
  if (isLoggedIn !== 'true') return 0.0;
  // 100% UNIFIED BALANCE: AUTO CASH and MAX-BAZAR share the exact same wallet balance!
  const val = localStorage.getItem('autocash_balance') ?? localStorage.getItem('maxstore_balance');
  if (val !== null && !isNaN(Number(val))) return Number(val);
  return 0.0;
}

export function getCachedMaxstoreBalance(): number {
  // Always return the unified single balance
  return getCachedBalance('autocash');
}

export function getCachedUser(): ClientUser | null {
  if (typeof window === 'undefined') return null;
  const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
  const email = localStorage.getItem('autocash_email');
  if (isLoggedIn !== 'true' || !email) return null;
  const name = localStorage.getItem('autocash_username') || email.split('@')[0];
  const id = localStorage.getItem('autocash_userId') || undefined;
  const rawAvatar = localStorage.getItem('autocash_avatar');
  if (rawAvatar && rawAvatar.startsWith('data:')) {
    localStorage.removeItem('autocash_avatar');
  }
  const avatarUrl = (rawAvatar && !rawAvatar.startsWith('data:')) ? rawAvatar : undefined;
  const balanceVal = localStorage.getItem('autocash_balance') ?? localStorage.getItem('maxstore_balance');
  const balance = balanceVal !== null && !isNaN(Number(balanceVal)) ? Number(balanceVal) : 0.0;
  const maxstoreBalance = balance; // 100% Unified
  const vipTier = localStorage.getItem('autocash_vipTier') || 'vip1';
  const totalSpentVal = localStorage.getItem('autocash_totalSpent');
  const totalSpent = totalSpentVal !== null && !isNaN(Number(totalSpentVal)) ? Number(totalSpentVal) : 0.0;
  const lowerEmail = email.toLowerCase().trim();
  const role = localStorage.getItem('autocash_role') || (lowerEmail === 'dronemax0996@gmail.com' || lowerEmail === 'dronemax520@gmail.com' ? 'admin' : undefined);
  const apiKey = localStorage.getItem('autocash_apiKey') || undefined;
  const apiKeyCreatedAt = localStorage.getItem('autocash_apiKeyCreatedAt') || undefined;
  const apiEnabledVal = localStorage.getItem('autocash_apiEnabled');
  const apiEnabled = apiEnabledVal !== null ? apiEnabledVal === 'true' : true;
  return { id, name, email, avatarUrl, balance, maxstoreBalance, vipTier, totalSpent, role, apiKey, apiKeyCreatedAt, apiEnabled };
}

import { formatSmartPrice } from './formatMoney';

export { formatSmartPrice };

export function formatCurrencyAmount(val: number | string | null | undefined): string {
  return formatSmartPrice(val);
}

/** Ends the server session, the local cache and any Supabase (Google) session. */
export async function logout(): Promise<void> {
  // 1. Immediately wipe local auth state and notify listeners synchronously
  clearLocalAuth();
  notifyAuthChanged();

  // 2. Clear backend session cookie
  const logoutPromise = fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

  // 3. Drop Supabase session so it cannot re-sync in background
  try {
    const { getBrowserSupabase } = await import('./supabaseBrowser');
    const sb = getBrowserSupabase();
    if (sb) {
      await sb.auth.signOut({ scope: 'local' }).catch(() => {});
      await sb.auth.signOut().catch(() => {});
    }
  } catch {}

  await logoutPromise;
  notifyAuthChanged();
}

/** Exchanges a Supabase access token for an AUTO CASH session cookie. */
export async function syncSupabaseSession(accessToken: string): Promise<ClientUser> {
  const res = await fetch('/api/auth/oauth-sync', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!data.success || !data.user) {
    throw new Error(data.message || 'ئىشلەتكۈچى ئۇچۇرىنى تىزىملاش مەغلۇپ بولدى');
  }
  storeLocalAuth(data.user);
  return data.user;
}

/** Only same-site relative paths are allowed as post-login redirects. */
export function safeRedirectPath(next: string | null, fallback = '/'): string {
  // Reject control characters and backslashes: the URL parser strips tabs/newlines,
  // so '/\t/evil.com' would otherwise resolve to '//evil.com'
  if (!next || !next.startsWith('/') || /[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
