'use client';

import { clearLocalAuth, logout, getCachedBalance, getCachedUser, storeLocalAuth, formatCurrencyAmount } from '@/lib/clientAuth';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
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
          fetchTelegramLink(u.id);
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
    }

    // Always fetch authentic Google account photo directly from Google OAuth session
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
        if (gAvatar) {
          setAvatarUrl(gAvatar);
          localStorage.setItem('autocash_avatar', gAvatar);
          window.dispatchEvent(new Event('autocash-auth-changed'));
        }
      }
    } catch {}

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

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setAvatarUrl('');
    setBalance(0.0);
    setTotalPurchases(0.0);
    setTotalOrders(0);
    setTelegramLink(null);
  };

  const handleAuthSuccess = (usr: any) => {
    localStorage.setItem('autocash_is_logged_in', 'true');
    localStorage.setItem('autocash_username', usr.name);
    localStorage.setItem('autocash_email', usr.email);
    if (usr.id) localStorage.setItem('autocash_userId', usr.id);
    if (usr.avatarUrl) {
      localStorage.setItem('autocash_avatar', usr.avatarUrl);
      setAvatarUrl(usr.avatarUrl);
    }
    setName(usr.name);
    setEmail(usr.email);
    setUserId(usr.id);
    setBalance(usr.balance || 0.0);
    setIsLoggedIn(true);
    fetchOrdersCount();
    router.replace('/');
  };

  return (
    <div
      className={`min-h-screen bg-[#040e1d] text-slate-100 flex flex-col pb-24 md:pb-8 selection:bg-cyan-500 selection:text-white font-alkatip ${
        isRTL ? 'text-right' : 'text-left'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Navbar balance={balance} user={isLoggedIn ? { id: userId, name, email, avatarUrl, balance } : null} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <main className="max-w-2xl mx-auto px-4 py-5 w-full flex-1 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-bold transition shadow cursor-pointer font-alkatip"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{t('store')}</span>
          </Link>

          <div className={isRTL ? 'text-left' : 'text-right'}>
            <h1 className="font-ukij text-2xl sm:text-3xl font-black text-white gold-text-glow leading-snug">
              {t('accountTitle')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {t('accountSubtitle')}
            </p>
          </div>
        </div>

        {/* User ID & Profile Banner */}
        {isLoggedIn ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#06182c] to-[#04101e] border border-cyan-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 via-amber-300 to-cyan-500 shadow-lg shadow-cyan-500/25">
                    <img
                      src={avatarUrl || "/avatar.png"}
                      alt={name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatar.png';
                      }}
                      className="w-full h-full rounded-full object-cover bg-slate-900 border border-slate-950"
                    />
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-[#06182c] rounded-full shadow-sm"
                    title={t('online')}
                  />
                </div>

                <div className={`${isRTL ? 'text-right' : 'text-left'} flex-1 min-w-0`}>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-sm sm:text-base text-white truncate">
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
                  <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 truncate" dir="ltr">
                    {email}
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <div className="flex flex-col items-start sm:items-end">
                  <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#0c2847] border border-cyan-500/50 text-cyan-300 font-black text-sm sm:text-base tracking-wider shadow-inner flex items-center gap-2">
                    <span className="text-[10px] text-cyan-400/80 font-alkatip">ID:</span>
                    <span className="font-mono">{userId}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  title={t('logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-cyan-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
              <span><span className="autocash-shimmer font-bold mr-1">AUTO CASH</span> #1001-2026</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 self-end sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Account</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#081a2e] to-[#040e1d] border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-lg shadow-amber-500/25 overflow-hidden">
                    <img
                      src="/brand_logo.png?v=2.1.0"
                      alt="Logo"
                      className="w-full h-full rounded-full object-cover bg-[#04101e]"
                      style={{ imageRendering: '-webkit-optimize-contrast' }}
                    />
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-400 border-2 border-[#081a2e] rounded-full"
                    title={t('guestUser')}
                  />
                </div>

                <div className={`${isRTL ? 'text-right' : 'text-left'} flex-1 min-w-0`}>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-sm sm:text-base text-amber-300">
                      {t('guestUser')}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/35 text-amber-400 font-bold text-[10px] shrink-0">
                      {t('guestNotLoggedIn')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {t('guestPromo')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
              >
                <User className="w-4 h-4" />
                <span>{t('loginRegister')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Telegram Integration Card (1-Click Deep Link Unification) */}
        {isLoggedIn && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0b2447] via-[#091b35] to-[#051124] border border-cyan-400/40 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 shrink-0">
                  <Send className="w-6 h-6 transform -translate-y-0.5 translate-x-0.5" />
                </div>

                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-1.5">
                      <span>{lang === 'ug' ? 'تېلېگرامما بوت بىلەن بىر گەۋدە' : lang === 'ar' ? 'ربط الحساب ببوت تلغرام' : 'Telegram Bot Unification'}</span>
                      <span className="text-cyan-400">⚡️</span>
                    </h3>
                    {telegramLink?.isLinked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{lang === 'ug' ? 'تۇتاشتۇرۇلدى' : lang === 'ar' ? 'متصل' : 'Connected'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold animate-pulse">
                        <span>{lang === 'ug' ? '1 چېكىش بىلەن' : lang === 'ar' ? 'بنقرة واحدة' : '1-Click Link'}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {telegramLink?.isLinked ? (
                      lang === 'ug' ? (
                        <>
                          تېلېگرامما ھېساباتىڭىز ({telegramLink.telegramUsername ? `@${telegramLink.telegramUsername}` : `ID: ${telegramLink.telegramChatId}`}) مۇۋەپپەقىيەتلىك باغلاندى. قالدۇق پۇل ۋە زاكاسلار ئىككى تەرەپتە بىر گەۋدە يۈرۈشىدۇ!
                        </>
                      ) : lang === 'ar' ? (
                        <>
                          حسابك في تلغرام ({telegramLink.telegramUsername ? `@${telegramLink.telegramUsername}` : `ID: ${telegramLink.telegramChatId}`}) متصل بنجاح. الرصيد والطلبات متزامنة بالكامل!
                        </>
                      ) : (
                        <>
                          Your Telegram account ({telegramLink.telegramUsername ? `@${telegramLink.telegramUsername}` : `ID: ${telegramLink.telegramChatId}`}) is linked. Balance and orders sync seamlessly!
                        </>
                      )
                    ) : (
                      lang === 'ug' ? (
                        'توربەتتىكى قالدۇق پۇلىڭىز بىلەن بوتنى تۇتاشتۇرۇڭ. قايسى تەرەپتە پۇل سالسىڭىز ئىككى تەرەپتە تەڭ چىقىدۇ.'
                      ) : lang === 'ar' ? (
                        'اربط حسابك ببوت تلغرام لتتمتع برصيد مشترك متزامن فوري بين الموقع والبوت.'
                      ) : (
                        'Link your store account with the Telegram bot for a real-time shared live balance.'
                      )
                    )}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center gap-2 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/60">
                {telegramLink?.isLinked ? (
                  <>
                    <a
                      href="https://t.me/Autocash_24_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/45 border border-cyan-400/50 text-cyan-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <span>{lang === 'ug' ? 'بوتنى ئېچىش' : lang === 'ar' ? 'فتح البوت' : 'Open Bot'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      disabled={loadingTgLink}
                      onClick={handleUnlinkTelegram}
                      className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title={lang === 'ug' ? 'تېلېگراممىنى ئۈزۈش' : lang === 'ar' ? 'إلغاء الربط' : 'Unlink'}
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>{lang === 'ug' ? 'ئۈزۈش' : lang === 'ar' ? 'فصل' : 'Unlink'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={loadingTgLink}
                    onClick={handleStartLink}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loadingTgLink ? (lang === 'ug' ? 'ئېچىلىۋاتىدۇ...' : 'جاري الفتح...') : (lang === 'ug' ? '1 چېكىپ بوتقا باغلاش' : lang === 'ar' ? 'ربط الحساب بالبوت فوراً' : '1-Click Link Telegram')}</span>
                  </button>
                )}
              </div>
            </div>

            {tgUnlinkSuccess && (
              <div className="mt-3 p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{lang === 'ug' ? 'تېلېگرامما ھېساباتى مۇۋەپپەقىيەتلىك ئۈزۈلدى.' : lang === 'ar' ? 'تم إلغاء الربط بنجاح.' : 'Telegram unlinked successfully.'}</span>
              </div>
            )}
          </div>
        )}

        {/* 2x2 Grid of 4 Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className={`p-4 sm:p-5 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-cyan-500/40 transition shadow-md flex flex-col justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-3`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/40">
                <Wallet className="w-5 h-5 animate-floating-icon" style={{ animationDelay: '0s' }} />
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">{t('availableBalanceLabel')}</span>
              <div
                className={`text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-center gap-1.5 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="animate-dollar-float text-cyan-400">$</span>
                <span>{formatCurrencyAmount(balance)}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-cyan-500/40 transition shadow-md flex flex-col justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-3`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/40">
                <ArrowUpDown className="w-5 h-5 animate-floating-icon" style={{ animationDelay: '0.7s' }} />
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">
                {t('totalDepositedAmount')}
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-center gap-1.5 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="animate-dollar-float text-cyan-400">$</span>
                <span>{formatCurrencyAmount(totalDeposited)}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-cyan-500/40 transition shadow-md flex flex-col justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-3`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/40">
                <ShoppingCart className="w-5 h-5 animate-floating-icon" style={{ animationDelay: '1.4s' }} />
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">{t('totalPurchases')}</span>
              <div
                className={`text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-center gap-1.5 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="animate-dollar-float text-cyan-400">$</span>
                <span>{formatCurrencyAmount(totalPurchases)}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-cyan-500/40 transition shadow-md flex flex-col justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-3`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/40">
                <FileText className="w-5 h-5 animate-floating-icon" style={{ animationDelay: '2.1s' }} />
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">{t('totalOrdersCount')}</span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {totalOrders}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#07192d] border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-ukij text-lg sm:text-xl font-bold text-white">
              {t('profileInfo')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('accountSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {t('usernameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-[#051120] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium ${
                  isRTL ? 'text-right' : 'text-left'
                } focus:outline-none transition`}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {t('emailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-[#051120] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono ${
                  isRTL ? 'text-right' : 'text-left'
                } focus:outline-none transition`}
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {t('phoneLabel')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full bg-[#051120] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono ${
                  isRTL ? 'text-right' : 'text-left'
                } focus:outline-none transition`}
                placeholder="+963 984 373 459"
                dir="ltr"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <Check className="w-4 h-4" />
                  <span>{t('saveChanges')} ✓</span>
                </div>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0099e6] text-white text-xs font-black transition shadow-lg shadow-cyan-600/30 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{t('saveChanges')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password Section */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#07192d] border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-ukij text-lg sm:text-xl font-bold text-white">
              {t('securitySettings')}
            </h2>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  {t('currentPasswordLabel')}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full bg-[#051120] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white ${
                    isRTL ? 'text-right' : 'text-left'
                  } focus:outline-none transition`}
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  {t('newPasswordLabel')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full bg-[#051120] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white ${
                    isRTL ? 'text-right' : 'text-left'
                  } focus:outline-none transition`}
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
                {passwordError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              {passwordSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <Check className="w-4 h-4" />
                  <span>{t('updatePassword')} ✓</span>
                </div>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t('updatePassword')}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
