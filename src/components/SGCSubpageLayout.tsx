'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  User,
  Wallet,
  Plus,
  Sun,
  Moon,
  Home,
  ClipboardList,
  Crown,
  Send,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Flame,
  Globe2,
  Code2,
  MessageSquareQuote,
  MessageSquareCode,
  Headphones,
  Smartphone,
  KeyRound,
  FileText,
} from 'lucide-react';
import { getCachedBalance, getCachedUser, clearLocalAuth, logout, ClientUser } from '@/lib/clientAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import StoreSwitcherButton from '@/components/StoreSwitcherButton';
import LanguageFlag from '@/components/LanguageFlag';

interface SGCSubpageLayoutProps {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export default function SGCSubpageLayout({
  title,
  subtitle,
  headerActions,
  children,
}: SGCSubpageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, setLang, t, isRTL, openLanguageModal } = useLanguage();
  const { activeStore, isMaxStore, currentStoreBalance, storeMeta, openGateway } = useStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showVipLockedModal, setShowVipLockedModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [balance, setBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') return getCachedBalance();
    return 0.0;
  });
  const [user, setUser] = useState<ClientUser | null>(() => {
    if (typeof window !== 'undefined') return getCachedUser();
    return null;
  });
  const isVip5 = Boolean(
    user && (
      (user.vipTier || '').toLowerCase().includes('vip5') ||
      user.role === 'admin' ||
      (user.email || '').toLowerCase() === 'dronemax0996@gmail.com'
    )
  );

  // Sync theme
  useEffect(() => {
    const saved = localStorage.getItem('autocash_theme') as 'light' | 'dark' | null;
    const currentTheme = saved || 'light';
    setTheme(currentTheme);
    document.body.classList.toggle('light-theme', currentTheme === 'light');
    document.body.classList.toggle('dark-theme', currentTheme === 'dark');
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }, []);

  // Sync user and balance
  useEffect(() => {
    const refreshData = () => {
      setBalance(getCachedBalance());
      setUser(getCachedUser());
    };
    refreshData();
    window.addEventListener('autocash-auth-changed', refreshData);
    window.addEventListener('storage', refreshData);

    const savedEmail = localStorage.getItem('autocash_email');
    if (savedEmail) {
      fetch('/api/auth/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data?.user) {
            setUser(data.user);
            if (typeof data.user.balance === 'number') setBalance(data.user.balance);
          }
        })
        .catch(() => null);
    }

    return () => {
      window.removeEventListener('autocash-auth-changed', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('autocash_theme', nextTheme);
    document.body.classList.toggle('light-theme', nextTheme === 'light');
    document.body.classList.toggle('dark-theme', nextTheme === 'dark');
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const handleLogout = async () => {
    clearLocalAuth();
    setUser(null);
    setBalance(0.0);
    setMobileMenuOpen(false);
    await logout();
    router.push('/');
  };

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-[#0b0f19] text-white' : 'bg-[#f4f7f5] text-slate-900'
      } font-alkatip selection:bg-emerald-500 selection:text-white pb-24 md:pb-12`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* =========================================================================
          TOP SGC NAVIGATION BAR (Matches باشبەت)
      ========================================================================= */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md transition-colors ${
          theme === 'dark'
            ? 'bg-[#0b0f19]/95 border-b border-white/10'
            : 'bg-white/98 border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
        } pt-[env(safe-area-inset-top,0px)]`}
      >
        <div className="max-w-[1200px] mx-auto px-2 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Controls on Left: Menu, Language Button, Store Switcher, Profile, Balance Pill, Theme */}
          <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-1 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${
                theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
              }`}
              aria-label="قوشۇمچە تىزىملىك"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] animate-icon-gleam" />
            </button>

            {/* Language Selection Window Button */}
            <button
              type="button"
              onClick={openLanguageModal}
              className={`h-8 sm:h-9 px-1.5 sm:px-2.5 rounded-xl flex items-center gap-1 sm:gap-1.5 border transition active:scale-95 cursor-pointer shadow-xs shrink-0 ${
                theme === 'dark'
                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400'
                  : 'border-emerald-500/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
              title={t('selectLanguage') || 'تىل تاللاش كۆزنىكى'}
            >
              <LanguageFlag code={lang} className="w-3.5 h-2.5 sm:w-4 sm:h-3 rounded-[2px] object-cover shrink-0 shadow-xs" />
              <Globe2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="text-[11px] font-bold hidden md:inline">
                {lang === 'ug'
                  ? 'ئۇيغۇرچە'
                  : lang === 'en'
                  ? 'EN'
                  : lang === 'ar'
                  ? 'العربية'
                  : lang === 'tr'
                  ? 'TR'
                  : lang === 'uz'
                  ? 'UZ'
                  : 'RU'}
              </span>
            </button>

            {/* Store Switcher Pill */}
            <StoreSwitcherButton variant="compact" />

            {/* Profile Avatar */}
            <Link
              href="/account"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#059669] text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-[0_2px_8px_rgba(5,150,105,0.35)] hover:scale-105 active:scale-95 transition shrink-0 animate-icon-sparkle anim-delay-1"
              title={user ? user.name || user.email : 'ھېساباتىم'}
            >
              {user ? (user.name ? user.name.charAt(0).toUpperCase() : 'ھ') : 'ھ'}
            </Link>

            {/* Quick Balance Pill Button */}
            <Link
              href="/deposit"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs font-mono transition active:scale-95 border ${
                isMaxStore
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/25'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
              }`}
              title={isMaxStore ? 'MAX-BAZAR غا پۇل كىرگۈزۈش' : 'پۇل كىرگۈزۈش'}
            >
              <Plus className={`w-3.5 h-3.5 stroke-[3] ${isMaxStore ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>${(typeof currentStoreBalance === 'number' ? currentStoreBalance : 0).toFixed(2)}</span>
              <Wallet className={`w-3.5 h-3.5 ${isMaxStore ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition active:scale-95 cursor-pointer shrink-0 ${
                theme === 'dark'
                  ? 'border-white/15 bg-white/5 text-amber-300 hover:bg-white/10'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
              title={theme === 'dark' ? 'كۈندۈز ھالىتىگە ئۆزگەرتىش' : 'كېچە ھالىتىگە ئۆزگەرتىش'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-icon-sparkle text-amber-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-icon-gleam text-slate-700" />
              )}
            </button>
          </div>

          {/* Brand Logo & Title on Right (Animated Shimmer) */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-3 shrink-0 order-1 sm:order-2 group select-none min-w-0">
            <div className="flex flex-col text-right justify-center overflow-visible py-0.5">
              <span className={`font-black text-xs sm:text-lg tracking-wide whitespace-nowrap ${isMaxStore ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-orange-400 to-amber-300' : 'animated-brand-title'}`}>
                {storeMeta.name}
              </span>
              <span className="hidden sm:inline text-[10px] sm:text-[12px] font-bold tracking-normal text-slate-400 dark:text-slate-300">
                {isMaxStore ? 'يېڭى تەمىنلىگۈچى بازىرى' : (t('brandSubtitle') || 'ئاپتوماتىك پۇل قاچىلاش')}
              </span>
            </div>
            <div className={`relative shrink-0 p-0.5 rounded-full border ${isMaxStore ? 'border-orange-500/50 shadow-lg shadow-orange-500/20' : 'border-emerald-500/40 animate-logo-aura'}`}>
              <img
                src={isMaxStore ? '/images/maxbazar_hd_logo.png' : '/logo.png'}
                alt={storeMeta.name}
                className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm"
                onError={(e) => {
                  (e.target as any).src = '/logo.png';
                }}
              />
            </div>
          </Link>
        </div>
      </header>

      {/* =========================================================================
          SGC GAME STYLE FULL-HEIGHT OFF-CANVAS SIDE DRAWER
      ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content Panel (RTL - slides from right) */}
          <div
            className={`relative z-50 w-[310px] sm:w-[340px] max-w-[85vw] h-full flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 ${
              theme === 'dark' ? 'bg-[#101726] text-white' : 'bg-white text-slate-800'
            }`}
          >
            {/* Header of Drawer */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Auto Cash"
                  className="w-8 h-8 rounded-full object-cover shadow-sm"
                />
                <span className="font-black text-sm tracking-wide animated-brand-title">
                  AUTO CASH
                </span>
                <span className="text-slate-300 dark:text-white/20">|</span>
                <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                  ئاساسىي تىزىملىك
                </span>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95 cursor-pointer"
                title="تاقاش"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Middle Content */}
            <div className="flex-1 overflow-y-auto py-3.5 space-y-4 scrollbar-none">
              {/* User Profile Card */}
              <div
                className={`p-3.5 rounded-3xl border transition-all ${
                  theme === 'dark'
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : 'border-emerald-500/30 bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-slate-800 dark:text-white block truncate max-w-[130px]">
                        {user?.name || 'مېھمان خېرىدار'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[130px]">
                        {user?.email || 'خۇش كەپسىز'}
                      </span>
                    </div>
                  </div>

                  {/* Balance Pill Button */}
                  <Link
                    href="/deposit"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-xs font-mono transition active:scale-95 shadow-sm border ${
                      isMaxStore
                        ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                        : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-700'
                    }`}
                    title={isMaxStore ? 'MAX-BAZAR غا پۇل كىرگۈزۈش' : 'پۇل كىرگۈزۈش'}
                  >
                    <Plus className={`w-3 h-3 stroke-[3] ${isMaxStore ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span>${(typeof currentStoreBalance === 'number' ? currentStoreBalance : 0).toFixed(2)}</span>
                    <Wallet className={`w-3.5 h-3.5 ${isMaxStore ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  </Link>
                </div>
              </div>

              {/* Store Switcher for Drawer */}
              <StoreSwitcherButton variant="drawer" />

              {/* 3. Section Divider: مۇلازىمەت ۋە دۇكان */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                  مۇلازىمەت ۋە دۇكان
                </span>
                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
              </div>

              {/* 1. تىل تاللاش 6 خىل ئەسلى توربەتتەك */}
              <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-[#0c1626] border border-slate-200/80 dark:border-emerald-500/20 shadow-sm">
                <div
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openLanguageModal();
                  }}
                  className="flex items-center justify-between mb-2 cursor-pointer group"
                  title="تىل تاللاش كۆزنىكىنى ئېچىش"
                >
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 group-hover:text-emerald-500 transition">
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>{t('selectLanguage') || 'تىل تاللاش (Language)'}</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1 group-hover:bg-emerald-500/20 transition">
                    <span>
                      {lang === 'ug'
                        ? 'ئۇيغۇرچە'
                        : lang === 'en'
                        ? 'English'
                        : lang === 'ar'
                        ? 'العربية'
                        : lang === 'tr'
                        ? 'Türkçe'
                        : lang === 'uz'
                        ? "O'zbekcha"
                        : 'Русский'}
                    </span>
                    <span className="text-[9px]">➔ كۆزنەك</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { code: 'ug', label: 'ئۇيغۇرچە' },
                    { code: 'en', label: 'English' },
                    { code: 'ar', label: 'العربية' },
                    { code: 'tr', label: 'Türkçe' },
                    { code: 'uz', label: "O'zbekcha" },
                    { code: 'ru', label: 'Русский' },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setLang(item.code as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer ${
                        lang === item.code
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-sm ring-1 ring-emerald-400/50 scale-[1.02]'
                          : 'bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40 hover:text-emerald-600'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <LanguageFlag code={item.code} className="w-4 h-3 rounded-[2px] object-cover shrink-0 shadow-sm" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Menu Items Ordered Exactly as Requested */}
              <nav className="space-y-1 font-bold text-xs sm:text-sm">
                
                {/* 2. باشبەت */}
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    pathname === '/' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4 animate-icon-gleam anim-delay-1" />
                  </div>
                  <span className="flex-1 text-right">{t('home') || 'باشبەت'}</span>
                </Link>

                {/* 3. تەلەپلىرىم */}
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    pathname.startsWith('/orders') ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 animate-icon-gleam anim-delay-2" />
                  </div>
                  <span className="flex-1 text-right">{t('orders') || t('myOrders') || 'تەلەپلىرىم'}</span>
                </Link>

                {/* 4. ھەميانىم */}
                <Link
                  href="/deposit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    pathname.startsWith('/deposit') ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 animate-icon-gleam anim-delay-3" />
                  </div>
                  <span className="flex-1 text-right">{t('deposit') || 'ھەميانىم'}</span>
                </Link>

                {/* 5. ئەزالىق */}
                <Link
                  href="/membership"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    pathname.startsWith('/membership') ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right">{t('membership') || 'ئەزالىق'}</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                    VIP
                  </span>
                </Link>

                {/* 6. پالىيەتلەر */}
                <Link
                  href="/promotions"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    pathname.startsWith('/promotions') ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 fill-current animate-pulse text-amber-500" />
                  </div>
                  <span className="flex-1 text-right">{t('promotions') || 'پالىيەتلەر'}</span>
                  <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                    FLASH
                  </span>
                </Link>

                {/* توربەت ئەپىنى چۈشۈرۈڭ */}
                <Link
                  href="/download"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    pathname.startsWith('/download') ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 animate-icon-gleam" />
                  </div>
                  <span className="flex-1 text-right">{t('downloadApp') || 'توربەت ئەپىنى چۈشۈرۈڭ'}</span>
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                    APK
                  </span>
                </Link>

                {/* مەۋھۇم نومۇر (SMS) */}
                <Link
                  href="/numbers"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    pathname.startsWith('/numbers') ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-teal-100/70 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <MessageSquareCode className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right">{t('virtualNumbers') || 'مەۋھۇم نومۇر (SMS)'}</span>
                  <span className="text-[10px] bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-mono font-bold">
                    SMS
                  </span>
                </Link>

                {/* 7. تەمىنلىگۈچى API (پەقەت VIP 5 كە ئېچىلىدۇ) */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (isVip5) {
                      setShowApiModal(true);
                    } else {
                      setShowVipLockedModal(true);
                    }
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl transition text-right hover:bg-slate-50 dark:hover:bg-white/5 active:scale-98 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right font-medium">{t('providerApi') || 'تەمىنلىگۈچى API (Docs)'}</span>
                  {isVip5 ? (
                    <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Online • VIP 5</span>
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 font-mono">
                      <span>🔒 VIP 5</span>
                    </span>
                  )}
                </button>

                {/* 8. ئالاقىلىشىش */}
                <a
                  href="https://t.me/autocash_UYGHUR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="w-9 h-9 rounded-2xl bg-sky-100/70 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4 animate-icon-gleam" />
                  </div>
                  <span className="flex-1 text-right">{t('support') || 'ئالاقىلىشىش'}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    24/7
                  </span>
                </a>

                {/* 9. ئىنكاس (ئىنكاس سەھپىسى قۇرۇپ خىرىدار يازغان ھەر قانداق سۈز بىۋاستە تىلگىرام ئارقىلىق ماڭا كىلىدىغان قىلىمىز) */}
                <Link
                  href="/feedback"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 text-emerald-600 dark:text-emerald-400 ${
                    pathname.startsWith('/feedback') ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquareQuote className="w-4 h-4 animate-icon-sparkle" />
                  </div>
                  <span className="flex-1 text-right">{t('feedback') || 'ئىنكاس'}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    {t('directTelegram') || 'بىۋاسىتە تېلېگرامما'}
                  </span>
                </Link>

              </nav>
            </div>

            {/* Footer of Drawer */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold transition active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  <span>{theme === 'dark' ? (t('lightMode') || 'كۈندۈز ھالىتى') : (t('darkMode') || 'كېچە ھالىتى')}</span>
                </div>
                <span className="text-[10px] text-slate-400">{theme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition active:scale-98 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout') || 'ھېساباتتىن چېكىنىش'}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-98 shadow-sm"
                >
                  <User className="w-4 h-4" />
                  <span>{t('loginRegister') || 'ھېساباتقا كىرىش'}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provider API Official Live Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f172a] border border-amber-500/40 p-5 sm:p-6 shadow-2xl text-right font-alkatip space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>رەسمىي ئېچىۋېتىلدى (v1.0 Online)</span>
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-ukij">
                  تەمىنلىگۈچى API سۇپىسى
                </h3>
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              AUTO CASH نىڭ ئوچۇق REST API سۇپىسى رەسمىي ئىشقا كىرىشتۈرۈلدى! سىز ئەمدى ئۆزىڭىزنىڭ شەخسىي توربېتى،
              تېلېگرامما بوتىڭىز ياكى ئەپلىرىڭىزنى AUTO CASH سىستېمىسىغا بىۋاسىتە ئۇلاپ، بارلىق ئويۇن ۋە تور كارتىلىرىنى
              ئاپتوماتىك سېتىش ۋە زاكازلارنى دەل ۋاقتىدا بېجىرىشنى ئەمەلگە ئاشۇرالايسىز.
            </p>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 leading-normal">
              💡 <strong>ئەۋزەللىك:</strong> بارلىق API زاكازلىرىغا سىزنىڭ شەخسىي VIP ئەزالىق دەرىجىڭىز بويىچە ئەڭ تۆۋەن توپ باھا (VIP ئېتىبارى) ئاپتوماتىك ھېسابلىنىدۇ.
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/api-docs"
                onClick={() => setShowApiModal(false)}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:brightness-105 text-slate-950 text-xs font-black text-center shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>API قوللانمىسى (Docs)</span>
              </Link>

              <Link
                href="/account"
                onClick={() => setShowApiModal(false)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>API Key ئېلىش</span>
              </Link>
            </div>

            {/* Bottom Contact & Dismiss */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/10 text-xs">
              <a
                href="https://t.me/autocash_UYGHUR"
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition flex items-center gap-1.5 font-medium"
              >
                <Send className="w-3.5 h-3.5 text-cyan-500" />
                <span>باشقۇرغۇچى بىلەن ئالاقىلىشىش</span>
              </a>

              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-bold transition active:scale-95 cursor-pointer"
              >
                تاقاش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP 5 Exclusive Required Modal */}
      {showVipLockedModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0f172a] via-[#0b1222] to-[#080d1a] border border-amber-500/40 p-6 shadow-2xl text-right font-alkatip space-y-4 relative overflow-hidden">
            {/* Ambient Background Halo */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 relative z-10">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-black flex items-center gap-1.5">
                <span>👑 VIP 5 مەخسۇس سۇپا</span>
              </span>
              <button
                type="button"
                onClick={() => setShowVipLockedModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="تاقاش"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Central Warning Message (User Requested Text) */}
            <div className="text-center py-2 relative z-10 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/30 font-bold animate-pulse">
                🔒
              </div>
              
              <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                {t('vip5UpgradePrompt') || 'بۇ يەرنى ئېچىش ئۈچۈن VIP 5 ئەزا بولۇڭ ياكى باشقۇرغۇچى بىلەن ئالاقىلىشىڭ'}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed px-1">
                {t('vip5LockedDesc') || 'تەمىنلىگۈچى API (Docs) سۇپىسى پەقەت ئەڭ چوڭ ئەزالىققا كۆتۈرۈلگەن (VIP 5) ئەزالار ۋە رەسمىي ھەمكارلاشقۇچىلار ئۈچۈن ئېچىۋېتىلگەن.'}
              </p>
            </div>

            {/* User Current Tier Status */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t('currentTierLabel') || 'ھازىرقى ئەزالىق دەرىجىڭىز:'}</span>
                <span className="font-bold text-amber-400">
                  {user ? (user.vipTier ? user.vipTier.toUpperCase() : 'VIP 1') : (t('guestUser') || 'مېھمان (كىرمىگەن)')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t('requirementLabel') || 'سۇپىنى ئېچىش تەلىپى:'}</span>
                <span className="font-black text-emerald-400">{t('vip5TierMax') || '👑 VIP 5 (ئەڭ چوڭ ئەزالىق)'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 relative z-10">
              <Link
                href="/membership"
                onClick={() => setShowVipLockedModal(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition cursor-pointer"
              >
                <span>{t('vip5GuideBtn') || '👑 VIP 5 ئەزالىققا ئۆرلەش تەپسىلاتى'}</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <a
                href="https://t.me/autocash_UYGHUR"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('contactSupport') || 'باشقۇرغۇچى بىلەن ئالاقىلىشىڭ'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN SGC CONTAINER (Responsive Max-W 1200, matching باشبەت)
      ========================================================================= */}
      <main className="max-w-[1200px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
        {/* Page Top Title Card */}
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95 cursor-pointer shrink-0"
              title="باشبەتكە قايتىش"
            >
              {isRTL ? <ChevronRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <ChevronLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {headerActions && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {headerActions}
            </div>
          )}
        </div>

        {/* Content Body */}
        {children}
      </main>
    </div>
  );
}
