'use client';

import { clearLocalAuth, logout, getCachedBalance, getCachedUser, storeLocalAuth, formatCurrencyAmount } from '@/lib/clientAuth';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SGCSubpageLayout from '@/components/SGCSubpageLayout';
import AuthModal from '@/components/AuthModal';
import TelegramLinkCard from '@/components/TelegramLinkCard';
import { useLanguage } from '@/context/LanguageContext';
import {
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowUpDown,
  ShoppingCart,
  FileText,
  User,
  ShieldCheck,
  Check,
  Save,
  KeyRound,
  LogOut,
  Crown,
  Send,
  Link2,
  ExternalLink,
  Unlink,
  CheckCircle2,
  Code2,
  Terminal,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const VIP_TIER_CONFIG: Record<
  string,
  {
    name: { ug: string; ar: string; en: string };
    badgeClass: string;
    iconClass: string;
  }
> = {
  vip1: {
    name: {
      ug: 'VIP 1 (ئاددىي ئەزا)',
      ar: 'VIP 1 (عضو عادي)',
      en: 'VIP 1 (Standard Member)',
    },
    badgeClass: 'text-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-500/60 shadow-slate-500/20',
    iconClass: 'text-slate-300',
  },
  vip2: {
    name: {
      ug: 'VIP 2 (كۈمۈش ئەزا)',
      ar: 'VIP 2 (عضو فضي)',
      en: 'VIP 2 (Silver Member)',
    },
    badgeClass: 'text-amber-200 bg-gradient-to-r from-amber-950 via-orange-950 to-amber-950 border-amber-500/70 shadow-amber-600/30',
    iconClass: 'text-amber-400',
  },
  vip3: {
    name: {
      ug: 'VIP 3 (ئالتۇن ئەزا)',
      ar: 'VIP 3 (عضو ذهبي)',
      en: 'VIP 3 (Gold Member)',
    },
    badgeClass: 'text-cyan-200 bg-gradient-to-r from-cyan-950 via-sky-950 to-blue-950 border-cyan-400/70 shadow-cyan-400/35',
    iconClass: 'text-cyan-300',
  },
  vip4: {
    name: {
      ug: 'VIP 4 (پىلاتىنا ئەزا)',
      ar: 'VIP 4 (عضو بلاتيني)',
      en: 'VIP 4 (Platinum Member)',
    },
    badgeClass: 'text-yellow-100 bg-gradient-to-r from-yellow-950 via-amber-900 to-yellow-950 border-yellow-400/80 shadow-yellow-400/40',
    iconClass: 'text-yellow-300',
  },
  vip5: {
    name: {
      ug: 'VIP 5 (ئالماس ئەزا)',
      ar: 'VIP 5 (عضو ماسي)',
      en: 'VIP 5 (Diamond Member)',
    },
    badgeClass: 'text-emerald-200 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-emerald-400/80 shadow-emerald-400/40',
    iconClass: 'text-emerald-300',
  },
};

export default function AccountPage() {
  const router = useRouter();
  const { lang, t, isRTL } = useLanguage();
  const [balance, setBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return getCachedBalance();
    }
    return 0.0;
  });
  const [totalDeposited, setTotalDeposited] = useState<number>(0.0);
  const [totalPurchases, setTotalPurchases] = useState<number>(0.00);
  const [totalOrders, setTotalOrders] = useState<number>(0);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [vipTier, setVipTier] = useState<string>('VIP 1');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  const [telegramLink, setTelegramLink] = useState<{
    isLinked: boolean;
    telegramChatId?: string | number | null;
    telegramUsername?: string | null;
    linkUrl?: string;
  } | null>(null);
  const [loadingTgLink, setLoadingTgLink] = useState<boolean>(false);
  const [tgUnlinkSuccess, setTgUnlinkSuccess] = useState<boolean>(false);

  // Developer & Reseller API Key State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyCreatedAt, setApiKeyCreatedAt] = useState<string | null>(null);
  const [apiEnabled, setApiEnabled] = useState<boolean>(true);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copiedApiKey, setCopiedApiKey] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [loadingApiKey, setLoadingApiKey] = useState<boolean>(false);
  const [apiKeyActionMsg, setApiKeyActionMsg] = useState<string>('');

  const fetchTelegramLink = async (targetUserId?: string) => {
    try {
      const uid = targetUserId || userId || (typeof window !== 'undefined' ? localStorage.getItem('autocash_userId') || '' : '');
      const url = uid ? `/api/auth/telegram-link?userId=${encodeURIComponent(uid)}` : '/api/auth/telegram-link';
      const res = await fetch(url, {
        headers: uid ? { 'x-user-id': uid } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTelegramLink({
            isLinked: !!data.isLinked,
            telegramChatId: data.telegramChatId,
            telegramUsername: data.telegramUsername,
            linkUrl: data.linkUrl,
          });
        }
      }
    } catch (e) {
      console.error('Failed to load telegram link info:', e);
    }
  };

  const handleStartLink = async () => {
    setLoadingTgLink(true);
    try {
      const uid = userId || (typeof window !== 'undefined' ? localStorage.getItem('autocash_userId') || '' : '');
      const res = await fetch('/api/auth/telegram-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      });
      const data = await res.json();
      if (data.success && data.linkUrl) {
        setTelegramLink((prev) => ({
          isLinked: false,
          linkUrl: data.linkUrl,
        }));
        window.open(data.linkUrl, '_blank');
      } else if (telegramLink?.linkUrl) {
        window.open(telegramLink.linkUrl, '_blank');
      } else {
        window.open('https://t.me/Autocash_24_bot', '_blank');
      }
    } catch (e) {
      if (telegramLink?.linkUrl) {
        window.open(telegramLink.linkUrl, '_blank');
      } else {
        window.open('https://t.me/Autocash_24_bot', '_blank');
      }
    } finally {
      setLoadingTgLink(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    const confirmMsg =
      lang === 'ug'
        ? 'راستلا تېلېگرامما ھېساباتىنى توربەتتىن ئۈزمەكچىمۇ؟'
        : lang === 'ar'
        ? 'هل أنت متأكد من رغبتك في إلغاء ربط حساب تلغرام؟'
        : 'Are you sure you want to unlink your Telegram account?';
    if (!window.confirm(confirmMsg)) return;

    setLoadingTgLink(true);
    try {
      const res = await fetch('/api/auth/telegram-link', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTelegramLink({
          isLinked: false,
          linkUrl: data.linkUrl,
        });
        setTgUnlinkSuccess(true);
        setTimeout(() => setTgUnlinkSuccess(false), 3500);
      }
    } catch (e) {
      console.error('Failed to unlink telegram:', e);
    } finally {
      setLoadingTgLink(false);
    }
  };

  const fetchApiKey = async (uidOverride?: string) => {
    try {
      const uid = uidOverride || userId || (typeof window !== 'undefined' ? localStorage.getItem('autocash_userId') || '' : '');
      const url = uid ? `/api/auth/api-key?userId=${encodeURIComponent(uid)}` : '/api/auth/api-key';
      const res = await fetch(url, {
        headers: uid ? { 'x-user-id': uid } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setApiKey(data.apiKey || null);
          setApiKeyCreatedAt(data.apiKeyCreatedAt || null);
          setApiEnabled(data.apiEnabled !== false);
        }
      }
    } catch (e) {
      console.error('Failed to load api key:', e);
    }
  };

  const handleGenerateApiKey = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (apiKey) {
      const confirmText =
        lang === 'ug'
          ? 'يېڭى API Key ھاسىل قىلسىڭىز، كونا كۇنۇپكا دەرھال ئىناۋەتسىز بولىدۇ ۋە سىرتقى توربەت، بوتلىرىڭىز توختاپ قېلىشى مۇمكىن. داۋاملاشتۇرامسىز؟'
          : 'Regenerating will invalidate your current API Key immediately. Continue?';
      if (!window.confirm(confirmText)) return;
    }
    setLoadingApiKey(true);
    setApiKeyActionMsg('');
    try {
      const uid = userId || (typeof window !== 'undefined' ? localStorage.getItem('autocash_userId') || '' : '');
      const url = uid ? `/api/auth/api-key?userId=${encodeURIComponent(uid)}` : '/api/auth/api-key';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(uid ? { 'x-user-id': uid } : {}),
        },
        body: JSON.stringify({ userId: uid }),
      });
      const data = await res.json();
      if (data.success && data.apiKey) {
        setApiKey(data.apiKey);
        setApiKeyCreatedAt(new Date().toISOString());
        setApiEnabled(true);
        setShowApiKey(true);
        setApiKeyActionMsg(lang === 'ug' ? 'يېڭى API Key ھاسىل قىلىندى!' : 'New API Key generated!');
        setTimeout(() => setApiKeyActionMsg(''), 4000);
      } else {
        alert(data.message || 'خاتالىق كۆرۈلدى');
      }
    } catch (e: any) {
      alert(e.message || 'خاتالىق كۆرۈلدى');
    } finally {
      setLoadingApiKey(false);
    }
  };

  const handleRevokeApiKey = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const confirmText =
      lang === 'ug'
        ? 'راستلا API Key نى ئەمەلدىن قالدۇرامسىز؟ بارلىق سىرتقى توربەت ۋە بوت ئۇلىنىشلىرى دەرھال توختايدۇ.'
        : 'Are you sure you want to revoke your API Key? All external connections will stop immediately.';
    if (!window.confirm(confirmText)) return;

    setLoadingApiKey(true);
    try {
      const uid = userId || (typeof window !== 'undefined' ? localStorage.getItem('autocash_userId') || '' : '');
      const url = uid ? `/api/auth/api-key?userId=${encodeURIComponent(uid)}` : '/api/auth/api-key';
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(uid ? { 'x-user-id': uid } : {}),
        },
        body: JSON.stringify({ userId: uid }),
      });
      const data = await res.json();
      if (data.success) {
        setApiKey(null);
        setApiKeyCreatedAt(null);
        setApiEnabled(false);
        setShowApiKey(false);
        setApiKeyActionMsg(lang === 'ug' ? 'API Key ئەمەلدىن قالدۇرۇلدى.' : 'API Key revoked.');
        setTimeout(() => setApiKeyActionMsg(''), 4000);
      }
    } catch (e: any) {
      alert(e.message || 'خاتالىق كۆرۈلدى');
    } finally {
      setLoadingApiKey(false);
    }
  };

  const handleCopyApiKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2500);
  };

  const handleCopyCurl = () => {
    const token = apiKey || 'YOUR_API_KEY';
    const curlCode = `curl -X GET "https://autocash.pro/api/v1/profile" \\\n  -H "Authorization: Bearer ${token}"`;
    navigator.clipboard.writeText(curlCode);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  };

  const normalizedTier = (vipTier || 'vip1').toLowerCase().replace(/[\s-_]/g, '');
  const activeTierConfig = VIP_TIER_CONFIG[normalizedTier] || VIP_TIER_CONFIG.vip1;
  const vipTierLabel =
    activeTierConfig.name[lang as 'ug' | 'ar' | 'en'] || activeTierConfig.name.ug;

  useEffect(() => {
    loadUserData();
    window.addEventListener('autocash-auth-changed', loadUserData);
    return () => window.removeEventListener('autocash-auth-changed', loadUserData);
  }, []);

  const loadUserData = async () => {
    const cached = getCachedUser();
    if (cached) {
      setIsLoggedIn(true);
      if (cached.name) setName(cached.name);
      if (cached.email) setEmail(cached.email);
      if (cached.id) setUserId(cached.id);
      // Only use non-data URL avatar (real Google photo)
      if (cached.avatarUrl && !cached.avatarUrl.startsWith('data:')) {
        setAvatarUrl(cached.avatarUrl);
      }
      if (typeof cached.balance === 'number') setBalance(cached.balance);
      if (cached.vipTier) setVipTier(cached.vipTier.toUpperCase());
    }

    const loggedInVal = localStorage.getItem('autocash_is_logged_in');
    const savedEmail = localStorage.getItem('autocash_email');

    if (loggedInVal === 'true' && savedEmail) {
      try {
        const res = await fetch('/api/auth/me');
        if (res.status === 401) {
          clearLocalAuth();
          setIsLoggedIn(false);
          setBalance(0.0);
          return;
        }
        const data = await res.json();
        if (data.success && data.user) {
          const u = data.user;
          setName(u.name);
          setEmail(u.email);
          setPhone(u.phone || '');
          setUserId(u.id);
          if (u.avatarUrl && !u.avatarUrl.startsWith('data:')) {
            setAvatarUrl(u.avatarUrl);
          }
          const rawBal = typeof u.balance === 'number' ? u.balance : parseFloat(u.balance || '0') || 0.0;
          setBalance(rawBal);
          setTotalDeposited(rawBal + (u.totalSpent || 0));
          setTotalPurchases(u.totalSpent || 0);
          setVipTier(u.vipTier ? u.vipTier.toUpperCase() : 'VIP 1');
          storeLocalAuth(u);
          if (u.apiKey) setApiKey(u.apiKey);
          if (u.apiKeyCreatedAt) setApiKeyCreatedAt(u.apiKeyCreatedAt);
          if (u.apiEnabled !== undefined) setApiEnabled(u.apiEnabled);
          fetchTelegramLink(u.id);
          fetchApiKey(u.id);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setIsLoggedIn(false);
      setBalance(0.0);
      setTotalDeposited(0.0);
      setTotalPurchases(0.0);
      setAvatarUrl('');
      setTelegramLink(null);
      setApiKey(null);
      setApiKeyCreatedAt(null);
    }

    // Only fetch Google account photo when user is actually logged in
    if (loggedInVal === 'true') {
      try {
        const { getBrowserSupabase } = await import('@/lib/supabaseBrowser');
        const sb = getBrowserSupabase();
        if (sb) {
          const { data: { session } } = await sb.auth.getSession();
          const meta = session?.user?.user_metadata;
          const gAvatar =
            meta?.avatar_url ||
            meta?.picture ||
            session?.user?.identities?.[0]?.identity_data?.avatar_url ||
            session?.user?.identities?.[0]?.identity_data?.picture;
          if (gAvatar && gAvatar !== avatarUrl) {
            setAvatarUrl(gAvatar);
            localStorage.setItem('autocash_avatar', gAvatar);
          }
        }
      } catch {}
    }

    fetchOrdersCount();
  };

  const fetchOrdersCount = async () => {
    try {
      const savedEmail = localStorage.getItem('autocash_email');
      const url = savedEmail ? `/api/orders?userEmail=${encodeURIComponent(savedEmail)}` : '/api/orders';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.orders) {
          setTotalOrders(data.orders.length);
          const totalSpent = data.orders
            .filter((o: any) => o.status === 'completed')
            .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
          setTotalPurchases(totalSpent);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail: email,
          name,
          phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('autocash_username', name);
        localStorage.setItem('autocash_email', email);
        if (phone) localStorage.setItem('autocash_phone', phone);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword || !newPassword) return;

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail: email,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setPasswordSuccess(false), 2500);
      } else {
        setPasswordError(data.message || 'پارول يېڭىلانمىدى');
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'خاتالىق كۆرۈلدى');
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setName('');
    setEmail('');
    setUserId('');
    setPhone('');
    setAvatarUrl('');
    setBalance(0.0);
    setTotalPurchases(0.0);
    setTotalOrders(0);
    setTelegramLink(null);
    clearLocalAuth();
    await logout();
  };

  const handleAuthSuccess = (usr: any) => {
    storeLocalAuth(usr);
    setName(usr.name);
    setEmail(usr.email);
    setUserId(usr.id || '');
    if (usr.avatarUrl) {
      setAvatarUrl(usr.avatarUrl);
    }
    setBalance(usr.balance || 0.0);
    setIsLoggedIn(true);
    setIsAuthOpen(false);
    fetchOrdersCount();
    if (usr.id) fetchTelegramLink(usr.id);
  };

  return (
    <SGCSubpageLayout
      title={lang === 'ug' ? 'ھېسابىم' : t('accountTitle')}
      subtitle={lang === 'ug' ? 'پروفىل، بىخەتەرلىك ۋە ئاپتوماتىك قاچىلاش تەڭشەكلىرى' : 'الملف الشخصي وإعدادات الحساب'}
      headerActions={
        isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'ug' ? 'چېكىنىش' : 'خروج'}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <User className="w-3.5 h-3.5" />
            <span>{lang === 'ug' ? 'كىرىش' : 'دخول'}</span>
          </button>
        )
      }
    >
      <div className="space-y-4">
        {/* User ID & Profile Banner */}
        {isLoggedIn ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden space-y-4 border border-emerald-500/30">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-amber-300 via-white to-emerald-300 shadow-lg shadow-emerald-950/40">
                    <img
                      src={avatarUrl || "/avatar.png"}
                      alt={name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatar.png';
                      }}
                      className="w-full h-full rounded-full object-cover bg-slate-900 border border-emerald-900"
                    />
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-400 border-2 border-emerald-950 rounded-full shadow-sm"
                    title={t('online')}
                  />
                </div>

                <div className={`${isRTL ? 'text-right' : 'text-left'} flex-1 min-w-0`}>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-base sm:text-lg text-white truncate">
                      {name}
                    </h2>
                    <Link
                      href="/membership"
                      className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full border font-black shrink-0 shadow-md transition-transform hover:scale-105 active:scale-95 animate-vip-float cursor-pointer ${activeTierConfig.badgeClass}`}
                      title={t('vipMembership')}
                    >
                      <span className="animate-vip-crown">
                        <Crown className={`w-3 h-3 ${activeTierConfig.iconClass} drop-shadow`} />
                      </span>
                      <span className="font-mono tracking-tight">{vipTierLabel}</span>
                      <span className="animate-star-twinkle text-[9px]">✨</span>
                    </Link>
                  </div>
                  <p className="text-[11px] sm:text-xs text-emerald-100 font-mono mt-0.5 truncate" dir="ltr">
                    {email}
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/20">
                <div className="flex flex-col items-start sm:items-end">
                  <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-black/25 border border-white/20 text-white font-black text-sm sm:text-base tracking-wider shadow-inner flex items-center gap-2">
                    <span className="text-[10px] text-emerald-200 font-alkatip font-bold">ID:</span>
                    <span className="font-mono">{userId}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  title={t('logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-emerald-100">
              <span><span className="font-black mr-1 text-white">AUTO CASH</span> #1001-2026</span>
              <span className="text-emerald-300 font-bold flex items-center gap-1 self-end sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Account</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden space-y-4 border border-emerald-500/30">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-tr from-amber-300 via-white to-amber-400 shadow-lg shadow-emerald-950/30 overflow-hidden">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="w-full h-full rounded-full object-cover bg-[#04101e]"
                    />
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-400 border-2 border-emerald-950 rounded-full"
                    title={t('guestUser')}
                  />
                </div>

                <div className={`${isRTL ? 'text-right' : 'text-left'} flex-1 min-w-0`}>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-sm sm:text-base text-white">
                      {t('guestUser')}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-white/20 border border-white/30 text-white font-bold text-[10px] shrink-0">
                      {t('guestNotLoggedIn')}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100 mt-1 leading-relaxed">
                    {t('guestPromo')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-105 text-slate-950 text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 shrink-0"
              >
                <User className="w-4 h-4" />
                <span>{t('loginRegister')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Telegram Integration Card (Exact Layout Matching Reference) */}
        {isLoggedIn && (
          <div className="w-full">
            <TelegramLinkCard
              userId={userId}
              isLoggedIn={isLoggedIn}
              onStatusChange={(linked) => {
                setTelegramLink((prev) => (prev ? { ...prev, isLinked: linked } : { isLinked: linked }));
              }}
            />
          </div>
        )}

        {/* 2x2 Grid of 4 Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition flex flex-col justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-2.5`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs animate-nav-pill-glow">
                <Wallet className="w-5 h-5 animate-icon-sparkle anim-delay-1" />
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-bold">{t('availableBalanceLabel')}</span>
              <div
                className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-center gap-1 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">$</span>
                <span>{formatCurrencyAmount(balance)}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition flex flex-col justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-2.5`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs animate-nav-pill-glow">
                <ArrowUpDown className="w-5 h-5 animate-icon-sparkle anim-delay-2" />
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-bold">
                {t('totalDepositedAmount')}
              </span>
              <div
                className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-center gap-1 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">$</span>
                <span>{formatCurrencyAmount(totalDeposited)}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition flex flex-col justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-2.5`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs animate-nav-pill-glow">
                <ShoppingCart className="w-5 h-5 animate-icon-sparkle anim-delay-3" />
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-bold">{t('totalPurchases')}</span>
              <div
                className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-center gap-1 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">$</span>
                <span>{formatCurrencyAmount(totalPurchases)}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition flex flex-col justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-2.5`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs animate-nav-pill-glow">
                <FileText className="w-5 h-5 animate-icon-sparkle anim-delay-4" />
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-bold">{t('totalOrdersCount')}</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {totalOrders}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-white/10 pb-3">
            <h2 className="font-ukij text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('profileInfo')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-alkatip">
              {t('accountSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSaveInfo} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('usernameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#0c1322] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-medium ${
                  isRTL ? 'text-right' : 'text-left'
                } focus:outline-none transition`}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('emailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#0c1322] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-mono ${
                  isRTL ? 'text-right' : 'text-left'
                } focus:outline-none transition`}
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('phoneLabel')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#0c1322] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-mono ${
                  isRTL ? 'text-right' : 'text-left'
                } focus:outline-none transition`}
                placeholder="+963 984 373 459"
                dir="ltr"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <Check className="w-4 h-4" />
                  <span>{t('saveChanges')} ✓</span>
                </div>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{t('saveChanges')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password Section */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-white/10 pb-3">
            <h2 className="font-ukij text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('securitySettings')}
            </h2>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t('currentPasswordLabel')}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#0c1322] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white ${
                    isRTL ? 'text-right' : 'text-left'
                  } focus:outline-none transition`}
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t('newPasswordLabel')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#0c1322] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white ${
                    isRTL ? 'text-right' : 'text-left'
                  } focus:outline-none transition`}
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-bold">
                {passwordError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              {passwordSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <Check className="w-4 h-4" />
                  <span>{t('updatePassword')} ✓</span>
                </div>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t('updatePassword')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Developer & Reseller API Section */}
        {isLoggedIn && (
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0c1424] via-[#0f1b2d] to-[#121c2e] border border-amber-500/30 shadow-lg shadow-black/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-ukij text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>تەتقىق قىلغۇچى ۋە API ئۇلاش</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      v1.0
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-alkatip mt-0.5">
                    ئۆزىڭىزنىڭ توربىتى ياكى بوتىڭىزنى ئۇلاپ زاكازلارنى ئاپتوماتىك بېجىرىڭ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/api-docs"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>API قوللانمىسى</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-alkatip">
              بۇ API كۇنۇپكىسى ئارقىلىق سىرتقى توربېتىڭىز، Telegram بوتىڭىز ياكى ئەپلىرىڭىز AUTO CASH سىستېمىسى بىلەن بىۋاسىتە ئۇلىنىپ،
              قالدۇق تەكشۈرۈش، مەھسۇلات تىزىملىكى ئېلىش ۋە ئاپتوماتىك زاكاز يوللاشنى ئەمەلگە ئاشۇرالايدۇ. زاكاز باھالىرىغا سىزنىڭ <strong className="text-amber-400 font-mono">{vipTierLabel}</strong> ئېتىبارىڭىز ئاپتوماتىك قوللىنىلىدۇ.
            </p>

            {/* API Key Box */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>شەخسىي API كۇنۇپكىڭىز (API Secret Key)</span>
                </span>
                {apiKeyCreatedAt && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ھاسىللانغان: {apiKeyCreatedAt.slice(0, 10)}
                  </span>
                )}
              </div>

              {apiKey ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      readOnly
                      value={apiKey}
                      className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-amber-300 font-mono tracking-wider focus:outline-none select-all"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                      title={showApiKey ? 'يوشۇرۇش' : 'كۆرسىتىش'}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyApiKey}
                      className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer active:scale-95"
                    >
                      {copiedApiKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedApiKey ? 'كۆچۈرۈلدى!' : 'كۆچۈرۈش'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={loadingApiKey}
                        onClick={(e) => handleGenerateApiKey(e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingApiKey ? 'animate-spin' : ''}`} />
                        <span>قايتا ھاسىل قىلىش</span>
                      </button>

                      <button
                        type="button"
                        disabled={loadingApiKey}
                        onClick={(e) => handleRevokeApiKey(e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ئەمەلدىن قالدۇرۇش</span>
                      </button>
                    </div>

                    {apiKeyActionMsg && (
                      <span className="text-xs text-emerald-400 font-bold animate-pulse">
                        {apiKeyActionMsg}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <p className="text-xs text-slate-400">
                    سىز تېخى API كۇنۇپكىسى ھاسىل قىلمىدىڭىز. سىرتقى توربېتىڭىزگە ئۇلاش ئۈچۈن بىر چېكىش ئارقىلىق دەرھال قوزغىتىڭ.
                  </p>
                  <button
                    type="button"
                    disabled={loadingApiKey}
                    onClick={(e) => handleGenerateApiKey(e)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 text-xs sm:text-sm font-black transition shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{loadingApiKey ? 'ھاسىل قىلىنىۋاتىدۇ...' : 'API Key ھاسىل قىلىش'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Start cURL snippet */}
            <div className="bg-black/60 border border-white/10 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono flex items-center gap-1 text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تېز سىناش (Quick cURL Test):</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'كۆچۈرۈلدى!' : 'كۆچۈرۈش'}</span>
                </button>
              </div>
              <pre
                className="text-[11px] font-mono text-emerald-300/90 bg-black/40 p-2.5 rounded-lg overflow-x-auto select-all"
                dir="ltr"
              >
{`curl -X GET "https://autocash.pro/api/v1/profile" \\
  -H "Authorization: Bearer ${apiKey ? (showApiKey ? apiKey : apiKey.slice(0, 12) + '••••••••') : 'YOUR_API_KEY'}"`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Global Auth Modal for instant 1-Click Login / Register directly on Account Page */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </SGCSubpageLayout>
  );
}
