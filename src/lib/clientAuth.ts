// Browser-side helpers for the localStorage profile cache that mirrors the server session cookie.

export interface ClientUser {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  balance?: number;
}

export function storeLocalAuth(user: ClientUser): void {
  localStorage.setItem('autocash_is_logged_in', 'true');
  localStorage.setItem('autocash_username', user.name);
  localStorage.setItem('autocash_email', user.email);
  if (user.id) localStorage.setItem('autocash_userId', user.id);
  if (user.avatarUrl) localStorage.setItem('autocash_avatar', user.avatarUrl);
}

export function clearLocalAuth(): void {
  localStorage.setItem('autocash_is_logged_in', 'false');
  localStorage.removeItem('autocash_username');
  localStorage.removeItem('autocash_email');
  localStorage.removeItem('autocash_userId');
  localStorage.removeItem('autocash_avatar');
  localStorage.removeItem('autocash_phone');
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
export function safeRedirectPath(next: string | null, fallback = '/account'): string {
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
