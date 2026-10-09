'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SideDrawer from '@/components/SideDrawer';
import AuthModal from '@/components/AuthModal';
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
  Globe2
} from 'lucide-react';

interface NavbarProps {
  balance?: number;
  onOpenDrawer?: () => void;
  onOpenAuth?: () => void;
  user?: { name: string; email: string } | null;
}

export default function Navbar({
  balance = 120.5,
  onOpenDrawer,
  onOpenAuth,
  user: externalUser,
}: NavbarProps) {
  const { lang, setLang, t, isRTL } = useLanguage();
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const [internalAuthOpen, setInternalAuthOpen] = useState(false);
  const [internalUser, setInternalUser] = useState<{ name: string; email: string } | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
    const savedName = localStorage.getItem('autocash_username');
    const savedEmail = localStorage.getItem('autocash_email');
    if (isLoggedIn === 'false') {
      setInternalUser(null);
    } else {
      setInternalUser({
        name: savedName || 'Killer 0996',
        email: savedEmail || 'dronemax0996@gmail.com',
      });
    }
  }, []);

  const activeUser = externalUser !== undefined ? externalUser : internalUser;

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
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#051120]/90 border-b border-amber-500/25">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Start Group: Logo -> Menu -> Language Button -> AUTO CASH Name (-> Desktop Nav) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {/* 1. Logo image button */}
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md shadow-amber-500/30 ring-1 ring-amber-400/60 hover:scale-105 transition-transform duration-200 bg-[#04101e] shrink-0 flex items-center justify-center cursor-pointer"
              title={t('menuTitle')}
            >
              <img
                src="/logo.png"
                alt="AUTO CASH Logo"
                className="w-full h-full rounded-full object-cover brightness-110 contrast-105"
              />
            </button>

            {/* 2. Menu button */}
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 border border-amber-500/35 hover:border-amber-400 flex items-center justify-center text-amber-300 hover:text-white transition shadow-sm cursor-pointer active:scale-95 shrink-0"
              title={t('menuTitle')}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* 3. Language Selector Toggle next to Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white transition text-xs font-bold cursor-pointer active:scale-95 shrink-0 shadow-sm"
                title={t('selectLanguage')}
              >
                <Globe2 className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-semibold hidden sm:inline">
                  {lang === 'ug' ? 'ئۇيغۇرچە' : lang === 'ar' ? 'العربية' : 'English'}
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
                    } top-full mt-2 z-50 w-36 bg-[#071628] border border-amber-500/40 rounded-2xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setLang('ug');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isRTL ? 'text-right' : 'text-left'
                      } ${
                        lang === 'ug'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>ئۇيغۇرچە</span>
                      <span className="text-sm">🌙</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLang('ar');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isRTL ? 'text-right' : 'text-left'
                      } ${
                        lang === 'ar'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>العربية</span>
                      <span className="text-sm">🇸🇦</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLang('en');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isRTL ? 'text-right' : 'text-left'
                      } ${
                        lang === 'en'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>English</span>
                      <span className="text-sm">🇬🇧</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 4. Brand Name */}
            <Link
              href="/"
              className="flex items-center gap-1 group cursor-pointer shrink-0"
            >
              <span className="font-ukij font-black text-sm sm:text-base md:text-lg tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent gold-text-glow whitespace-nowrap">
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
              <Link href="/admin" className="flex items-center gap-1.5 text-amber-400/80 hover:text-amber-300 transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>{t('adminPanel')}</span>
              </Link>
            </nav>
          </div>

          {/* End Group: Deposit button -> Wallet -> Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Link
              href="/deposit"
              className="hidden md:inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-black gold-shimmer-btn transition-all font-alkatip shrink-0"
            >
              {t('addFunds')}
            </Link>

            {/* Wallet pill */}
            <Link
              href="/deposit"
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs shadow-inner transition shrink-0"
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
                  <span>{balance.toFixed(2)}</span>
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
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md shadow-amber-500/30 ring-1 ring-amber-400/60 shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <img
                    src="/avatar.png"
                    alt={activeUser.name}
                    className="w-full h-full rounded-full object-cover bg-slate-900 brightness-110 contrast-105"
                  />
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#051120] rounded-full shadow-sm"
                    title={t('online')}
                  />
                </div>
                <div className={`hidden sm:flex flex-col ${isRTL ? 'text-right pr-1' : 'text-left pl-1'} leading-tight`}>
                  <span className="font-extrabold text-white text-xs truncate max-w-[90px] gold-text-glow">
                    {activeUser.name}
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono font-bold" dir="ltr">
                    ID 1170
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
              localStorage.setItem('autocash_is_logged_in', 'false');
              localStorage.removeItem('autocash_username');
              localStorage.removeItem('autocash_email');
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
    </>
  );
}
