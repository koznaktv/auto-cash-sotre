// Browser-side helpers for the localStorage profile cache that mirrors the server session cookie.

export interface ClientUser {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  balance?: number;
  vipTier?: string;
  totalSpent?: number;
  role?: string;
}

export function storeLocalAuth(user: ClientUser): void {
  localStorage.setItem('autocash_is_logged_in', 'true');
  localStorage.setItem('autocash_username', user.name);
  localStorage.setItem('autocash_email', user.email);
  if (user.id) localStorage.setItem('autocash_userId', user.id);
  if (user.avatarUrl && !user.avatarUrl.startsWith('data:')) {
    localStorage.setItem('autocash_avatar', user.avatarUrl);
  } else {
    localStorage.removeItem('autocash_avatar');
  }
  if (typeof user.balance === 'number') localStorage.setItem('autocash_balance', String(user.balance));
  if (user.vipTier) localStorage.setItem('autocash_vipTier', user.vipTier);
  if (typeof user.totalSpent === 'number') localStorage.setItem('autocash_totalSpent', String(user.totalSpent));
  if (user.role) localStorage.setItem('autocash_role', user.role);
}

export function clearLocalAuth(): void {
  localStorage.setItem('autocash_is_logged_in', 'false');
  localStorage.removeItem('autocash_username');
  localStorage.removeItem('autocash_email');
  localStorage.removeItem('autocash_userId');
  localStorage.removeItem('autocash_avatar');
  localStorage.removeItem('autocash_phone');
  localStorage.removeItem('autocash_balance');
  localStorage.removeItem('autocash_vipTier');
  localStorage.removeItem('autocash_totalSpent');
  localStorage.removeItem('autocash_role');
}

export function getCachedBalance(): number {
  if (typeof window === 'undefined') return 0.0;
  const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
  if (isLoggedIn !== 'true') return 0.0;
  const val = localStorage.getItem('autocash_balance');
  if (val !== null && !isNaN(Number(val))) return Number(val);
  return 0.0;
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
  const balanceVal = localStorage.getItem('autocash_balance');
  const balance = balanceVal !== null && !isNaN(Number(balanceVal)) ? Number(balanceVal) : 0.0;
  const vipTier = localStorage.getItem('autocash_vipTier') || 'vip1';
  const totalSpentVal = localStorage.getItem('autocash_totalSpent');
  const totalSpent = totalSpentVal !== null && !isNaN(Number(totalSpentVal)) ? Number(totalSpentVal) : 0.0;
  const role = localStorage.getItem('autocash_role') || (email.toLowerCase() === 'dronemax0996@gmail.com' ? 'admin' : undefined);
  return { id, name, email, avatarUrl, balance, vipTier, totalSpent, role };
}

import { formatSmartPrice } from './formatMoney';

export { formatSmartPrice };

export function formatCurrencyAmount(val: number | string | null | undefined): string {
  return formatSmartPrice(val);
}

/** Ends the server session, the local cache and any Supabase (Google) session. */
export async function logout(): Promise<void> {
  // Supabase first: while its session exists, the home page would sync it straight back in
  const { getBrowserSupabase } = await import('./supabaseBrowser');
  const sb = getBrowserSupabase();
  if (sb) {
    const { error } = await sb.auth.signOut().catch((e) => ({ error: e }));
    // Offline / server error: still drop the local Supabase session
    if (error) await sb.auth.signOut({ scope: 'local' }).catch(() => {});
  }
  clearLocalAuth();
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
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
