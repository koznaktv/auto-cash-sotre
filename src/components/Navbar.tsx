'use client';

import { clearLocalAuth, logout, getCachedBalance, getCachedUser, storeLocalAuth, formatCurrencyAmount } from '@/lib/clientAuth';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SideDrawer from '@/components/SideDrawer';
import AuthModal from '@/components/AuthModal';
import AppDownloadModal from '@/components/AppDownloadModal';
import LanguageFlag from '@/components/LanguageFlag';
import { useLanguage } from '@/context/LanguageContext';
import {
  Zap,
  Wallet,
  LayoutDashboard,
  Crown,
  CreditCard,
  Sparkles,
  Menu,
  User,
  Globe2,
  Smartphone,
} from 'lucide-react';

interface NavbarProps {
  balance?: number;
  onOpenDrawer?: () => void;
  onOpenAuth?: () => void;
  user?: { name: string; email: string; id?: string; balance?: number; avatarUrl?: string } | null;
}

export default function Navbar({
  balance = 0.0,
  onOpenDrawer,
  onOpenAuth,
  user: externalUser,
}: NavbarProps) {
  const { lang, setLang, t, isRTL } = useLanguage();
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const [internalAuthOpen, setInternalAuthOpen] = useState(false);
  const [internalUser, setInternalUser] = useState<{ name: string; email: string; id?: string; balance?: number; avatarUrl?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      return getCachedUser();
    }
    return null;
  });
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('autocash_site_logo') || '/logo.png';
    }
    return '/logo.png';
  });

  useEffect(() => {
    const refreshUser = () => {
      const cached = getCachedUser();
      if (cached) {
        setInternalUser((prev) => prev || cached);
      }

      const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
      const savedEmail = localStorage.getItem('autocash_email');

      if (isLoggedIn === 'true' && savedEmail) {
        fetch('/api/auth/me')
          .then(async (r) => {
            if (r.status === 401) {
              clearLocalAuth();
              setInternalUser(null);
              return;
            }
            const data = await r.json();
            if (data.success && data.user) {
              setInternalUser(data.user);
              storeLocalAuth(data.user);
            }
          })
          .catch(() => {});
      } else {
        setInternalUser(null);
      }
    };

    refreshUser();
    window.addEventListener('autocash-auth-changed', refreshUser);
    window.addEventListener('autocash-app-resumed', refreshUser);
    return () => {
      window.removeEventListener('autocash-auth-changed', refreshUser);
      window.removeEventListener('autocash-app-resumed', refreshUser);
    };
  }, []);

  useEffect(() => {
    const loadLogo = () => {
      const cached = localStorage.getItem('autocash_site_logo');
      if (cached) setSiteLogo(cached);
    };
    loadLogo();
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings?.siteLogo) {
          setSiteLogo(d.settings.siteLogo);
          localStorage.setItem('autocash_site_logo', d.settings.siteLogo);
        }
      })
      .catch(() => {});

    window.addEventListener('autocash-logo-changed', loadLogo);
    return () => window.removeEventListener('autocash-logo-changed', loadLogo);
  }, []);

  const activeUser = externalUser !== undefined ? externalUser : internalUser;
  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('autocash_email') || '' : '';
  const savedRole = typeof window !== 'undefined' ? localStorage.getItem('autocash_role') || '' : '';
  const currentEmail = activeUser?.email || savedEmail;
  const currentRole = (activeUser as any)?.role || savedRole;

  const isAdmin = Boolean(
    currentEmail?.trim().toLowerCase() === 'dronemax0996@gmail.com' ||
    currentRole === 'admin'
  );


  const effectiveBalance = (() => {
    if (typeof activeUser?.balance === 'number' && activeUser.balance > 0) {
      return activeUser.balance;
    }
    if (typeof balance === 'number' && balance > 0) {
      return balance;
    }
    const cached = getCachedBalance();
    if (cached > 0) return cached;
    if (typeof activeUser?.balance === 'number') return activeUser.balance;
    return balance || 0;
  })();

  const handleOpenDrawer = () => {
    if (onOpenDrawer) {
      onOpenDrawer();
    } else {
      setInternalDrawerOpen(true);
    }
  };

  const handleOpenAuth = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setInternalAuthOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#040d1a] border-b border-amber-500/25 shadow-lg shadow-black/30 pt-[max(env(safe-area-inset-top,0px),10px)] sm:pt-0 transition-all w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[58px] sm:h-16 py-1.5 sm:py-0 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Start Group: Logo -> Menu -> Language Button -> AUTO CASH Name (-> Desktop Nav) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* 1. Logo image button */}
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md shadow-amber-500/30 ring-1 ring-amber-400/60 hover:scale-105 transition-transform duration-200 bg-[#04101e] shrink-0 flex items-center justify-center cursor-pointer"
              title={t('menuTitle')}
            >
              <img
                src={siteLogo || '/logo.png'}
                alt="AUTO CASH Logo"
                className="w-full h-full rounded-full object-cover brightness-110 contrast-105"
              />
            </button>

            {/* 2. Menu button */}
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 border border-amber-500/35 hover:border-amber-400 flex items-center justify-center text-amber-300 hover:text-white transition shadow-sm cursor-pointer active:scale-95 shrink-0"
              title={t('menuTitle')}
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 3. Language Selector Toggle next to Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-xl bg-slate-900/90 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white transition text-xs font-bold cursor-pointer active:scale-95 shrink-0 shadow-sm"
                title={t('selectLanguage')}
              >
                <LanguageFlag code={lang} className="w-4 h-2.5 rounded-[2px] object-cover shrink-0 shadow-sm" />
                <span className="text-[11px] font-semibold hidden sm:inline">
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
              </button>

              {langMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <div
                    className={`absolute ${
                      isRTL ? 'right-0' : 'left-0'
                    } top-full mt-2 z-50 w-48 bg-[#071628] border border-amber-500/40 rounded-2xl shadow-2xl p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95`}
                  >
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
                        onClick={() => {
                          setLang(item.code as any);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                          isRTL ? 'text-right' : 'text-left'
                        } ${
                          lang === item.code
                            ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <LanguageFlag code={item.code} className="w-5 h-3.5 rounded-[2px] object-cover shrink-0 shadow-sm" />
                          <span>{item.label}</span>
                        </span>
                        {lang === item.code && <span className="text-amber-400 text-xs font-black">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 4. Brand Name - Displayed on md+ screens so logos have generous room on mobile */}
            <Link
              href="/"
              className="hidden md:flex items-center gap-1 group cursor-pointer shrink-0"
            >
              <span className="font-ukij font-black text-sm sm:text-base md:text-lg tracking-wider autocash-shimmer whitespace-nowrap">
                AUTO CASH
              </span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 animate-star-twinkle shrink-0" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-4 text-sm font-medium text-slate-300 font-alkatip mx-2">
              <Link href="/" className="hover:text-amber-400 transition-colors">
                {t('home')}
              </Link>
              <Link href="/deposit" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>{t('deposit')}</span>
              </Link>
              <Link href="/membership" className="hover:text-amber-400 transition-colors flex items-center gap-1 text-amber-300">
                <Crown className="w-4 h-4 text-amber-400 animate-crown-wiggle" />
                <span>{t('vipMembership')}</span>
              </Link>
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-1.5 text-amber-400/80 hover:text-amber-300 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('adminPanel')}</span>
                </Link>
              )}
            </nav>
          </div>

          {/* End Group: Deposit button -> Admin -> Wallet -> Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link
              href="/deposit"
              className="hidden md:inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold gold-shimmer-btn animate-normal-float transition-all font-alkatip shrink-0 hover:scale-105 active:scale-95"
            >
              <span className="animate-normal-icon shrink-0">
                <Wallet className="w-3.5 h-3.5 text-slate-950" />
              </span>
              <span>{t('addFunds')}</span>
            </Link>

            {/* Mobile Admin Direct Button (visible only when isAdmin is true) */}
            {isAdmin && (
              <a
                href="/admin"
                className="xl:hidden inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold font-alkatip transition active:scale-95 shrink-0 shadow-sm"
                title={t('adminPanel')}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold hidden sm:inline">{t('admin')}</span>
              </a>
            )}

            {/* Wallet pill */}
            <Link
              href="/deposit"
              className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs shadow-inner transition shrink-0"
              title={t('balance')}
            >
              <span className="animate-floating-icon shrink-0">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              </span>
              <div className={`${isRTL ? 'text-right' : 'text-left'} leading-none`}>
                <span className="text-[8px] text-slate-400 hidden sm:block font-alkatip">
                  {t('balance')}
                </span>
                <span className="font-extrabold text-amber-300 font-mono text-[11px] sm:text-xs flex items-center gap-0.5" dir="ltr">
                  <span className="animate-dollar-float text-amber-300">$</span>
                  <span>{formatCurrencyAmount(effectiveBalance)}</span>
                </span>
              </div>
            </Link>

            {/* Avatar button */}
            {activeUser ? (
              <button
                type="button"
                onClick={handleOpenDrawer}
                className="flex items-center gap-2 p-0.5 sm:px-2 sm:py-1 rounded-full sm:rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-bold font-alkatip hover:bg-amber-900/50 transition cursor-pointer shadow-md shadow-amber-500/20 group shrink-0"
                title={t('myAccountDrawer')}
              >
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md shadow-amber-500/30 ring-1 ring-amber-400/60 shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={(activeUser as any)?.avatarUrl || (activeUser as any)?.avatar || "/avatar.png"}
                    alt={activeUser.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/avatar.png';
                    }}
                    className="w-full h-full rounded-full object-cover bg-slate-900 brightness-110 contrast-105"
                  />
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-[#051120] rounded-full shadow-sm"
                    title={t('online')}
                  />
                </div>
                <div className={`hidden sm:flex flex-col ${isRTL ? 'text-right pr-1' : 'text-left pl-1'} leading-tight`}>
                  <span className="font-extrabold text-white text-xs truncate max-w-[90px] gold-text-glow">
                    {activeUser.name}
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono font-bold" dir="ltr">
                    {typeof (activeUser as any)?.id === 'string' && (activeUser as any).id.startsWith('USR-')
                      ? (activeUser as any).id.replace('USR-', 'ID ')
                      : String((activeUser as any)?.id || 'ID')}
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenAuth}
                className="flex items-center gap-2 p-0.5 sm:px-2.5 sm:py-1 rounded-full sm:rounded-2xl bg-slate-900 border border-amber-500/35 hover:border-amber-400 text-amber-300 text-xs font-bold font-alkatip transition cursor-pointer shadow-md group shrink-0"
                title={t('loginRegister')}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-600 shadow-md shadow-amber-500/30 ring-1 ring-amber-400/50 shrink-0 group-hover:scale-105 transition-transform">
                  <img
                    src="/logo.png"
                    alt="Guest Logo"
                    className="w-full h-full rounded-full object-cover bg-[#04101e] brightness-110"
                  />
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Automatically render SideDrawer and AuthModal for pages where parent doesn't handle them */}
      {!onOpenDrawer && (
        <>
          <SideDrawer
            isOpen={internalDrawerOpen}
            onClose={() => setInternalDrawerOpen(false)}
            user={activeUser}
            onOpenAuth={() => setInternalAuthOpen(true)}
            onLogout={() => {
              logout();
              setInternalUser(null);
            }}
          />
          <AuthModal
            isOpen={internalAuthOpen}
            onClose={() => setInternalAuthOpen(false)}
            onSuccess={(usr) => {
              localStorage.setItem('autocash_is_logged_in', 'true');
              localStorage.setItem('autocash_username', usr.name);
              localStorage.setItem('autocash_email', usr.email);
              setInternalUser(usr);
            }}
          />
        </>
      )}

      {/* Standalone App Download Modal */}
      <AppDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />
    </>
  );
}
