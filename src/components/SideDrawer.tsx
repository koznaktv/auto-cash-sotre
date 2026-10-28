'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getBrandLogo, BRAND_LOGO_URL } from '@/lib/brand';
import Link from 'next/link';
import LanguageFlag from '@/components/LanguageFlag';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  Store,
  Heart,
  User,
  Crown,
  CreditCard,
  Receipt,
  Bell,
  RefreshCcw,
  Gift,
  Disc3,
  Globe2,
  Moon,
  Sun,
  LogOut,
  Send,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  Flame,
  LayoutDashboard,
  Smartphone,
  Megaphone,
} from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string; id?: string; balance?: number; avatarUrl?: string; vipTier?: string; role?: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

const VIP_TIER_CONFIG: Record<
  string,
  {
    name: Record<string, string>;
    badgeClass: string;
    iconClass: string;
  }
> = {
  vip1: {
    name: {
      ug: 'VIP 1 (ئاددىي ئەزا)',
      en: 'VIP 1 (Standard Member)',
      ar: 'VIP 1 (عضو عادي)',
      tr: 'VIP 1 (Standart Üye)',
      uz: 'VIP 1 (Oddiy a’zo)',
      ru: 'VIP 1 (Стандартный)',
    },
    badgeClass: 'text-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-500/60 shadow-slate-500/20',
    iconClass: 'text-slate-300',
  },
  vip2: {
    name: {
      ug: 'VIP 2 (كۈمۈش ئەزا)',
      en: 'VIP 2 (Silver Member)',
      ar: 'VIP 2 (عضو فضي)',
      tr: 'VIP 2 (Gümüş Üye)',
      uz: 'VIP 2 (Kumush a’zo)',
      ru: 'VIP 2 (Серебряный)',
    },
    badgeClass: 'text-amber-200 bg-gradient-to-r from-amber-950 via-orange-950 to-amber-950 border-amber-500/70 shadow-amber-600/30',
    iconClass: 'text-amber-400',
  },
  vip3: {
    name: {
      ug: 'VIP 3 (ئالتۇن ئەزا)',
      en: 'VIP 3 (Gold Member)',
      ar: 'VIP 3 (عضو ذهبي)',
      tr: 'VIP 3 (Altın Üye)',
      uz: 'VIP 3 (Oltin a’zo)',
      ru: 'VIP 3 (Золотой)',
    },
    badgeClass: 'text-cyan-200 bg-gradient-to-r from-cyan-950 via-sky-950 to-blue-950 border-cyan-400/70 shadow-cyan-400/35',
    iconClass: 'text-cyan-300',
  },
  vip4: {
    name: {
      ug: 'VIP 4 (پىلاتىنا ئەزا)',
      en: 'VIP 4 (Platinum Member)',
      ar: 'VIP 4 (عضو بلاتيني)',
      tr: 'VIP 4 (Platin Üye)',
      uz: 'VIP 4 (Platina a’zo)',
      ru: 'VIP 4 (Платиновый)',
    },
    badgeClass: 'text-yellow-100 bg-gradient-to-r from-yellow-950 via-amber-900 to-yellow-950 border-yellow-400/80 shadow-yellow-400/40',
    iconClass: 'text-yellow-300',
  },
  vip5: {
    name: {
      ug: 'VIP 5 (ئالماس ئەزا)',
      en: 'VIP 5 (Diamond Member)',
      ar: 'VIP 5 (عضو ماسي)',
      tr: 'VIP 5 (Elmas Üye)',
      uz: 'VIP 5 (Olmos a’zo)',
      ru: 'VIP 5 (Бриллиантовый)',
    },
    badgeClass: 'text-emerald-200 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-emerald-400/80 shadow-emerald-400/40',
    iconClass: 'text-emerald-300',
  },
};

export default function SideDrawer({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onLogout,
}: SideDrawerProps) {
  const { lang, setLang, t, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [avatarSrc, setAvatarSrc] = useState<string>('');
  const [siteLogo, setSiteLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('autocash_site_logo');
      return getBrandLogo(cached);
    }
    return BRAND_LOGO_URL;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadLogo = () => {
      const cached = localStorage.getItem('autocash_site_logo');
      const resolved = getBrandLogo(cached);
      setSiteLogo(resolved);
      if (cached !== resolved) {
        localStorage.setItem('autocash_site_logo', resolved);
      }
    };
    loadLogo();
    window.addEventListener('autocash-logo-changed', loadLogo);
    return () => window.removeEventListener('autocash-logo-changed', loadLogo);
  }, []);



  const normalizedTier = (
    user?.vipTier ||
    (typeof window !== 'undefined' ? localStorage.getItem('autocash_vipTier') : '') ||
    'vip1'
  )
    .toLowerCase()
    .replace(/[\s-_]/g, '');
  const activeTierConfig = VIP_TIER_CONFIG[normalizedTier] || VIP_TIER_CONFIG.vip1;
  const vipTierLabel =
    activeTierConfig.name[lang] || activeTierConfig.name.ug;

  useEffect(() => {
    if (!user) {
      setAvatarSrc('');
      return;
    }

    const localAvatar = typeof window !== 'undefined' ? localStorage.getItem('autocash_avatar') : null;
    const userAvatar = user.avatarUrl || (user as any)?.avatar;

    // Discard any legacy base64 data uploads
    if (userAvatar && !userAvatar.startsWith('data:')) {
      setAvatarSrc(userAvatar);
    } else if (localAvatar && !localAvatar.startsWith('data:')) {
      setAvatarSrc(localAvatar);
    }

    // Always fetch and prioritize the authentic Google account profile picture
    import('@/lib/supabaseBrowser').then(({ getBrowserSupabase }) => {
      const sb = getBrowserSupabase();
      if (sb) {
        sb.auth.getSession().then(({ data: { session } }) => {
          const meta = session?.user?.user_metadata;
          const gAvatar =
            meta?.avatar_url ||
            meta?.picture ||
            session?.user?.identities?.[0]?.identity_data?.avatar_url ||
            session?.user?.identities?.[0]?.identity_data?.picture;
          if (gAvatar) {
            setAvatarSrc(gAvatar);
            localStorage.setItem('autocash_avatar', gAvatar);
          }
        }).catch(() => {});
      }
    });
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('autocash_email') || '' : '';
  const savedRole = typeof window !== 'undefined' ? localStorage.getItem('autocash_role') || '' : '';
  const currentEmail = user?.email || savedEmail;
  const currentRole = (user as any)?.role || savedRole;

  const isAdmin = Boolean(
    currentEmail?.trim().toLowerCase() === 'dronemax0996@gmail.com' ||
    currentRole === 'admin'
  );

  const handleNavigate = (href: string) => (e: React.MouseEvent) => {
    onClose();
    window.location.href = href;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[90] flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-300"
      />

      {/* Drawer Body */}
      <aside
        className={`relative z-10 w-full max-w-xs sm:max-w-sm h-full bg-[#051120] ${
          isRTL ? 'border-l' : 'border-r'
        } border-amber-500/30 shadow-2xl flex flex-col justify-between overflow-y-auto px-5 pb-5 pt-[max(env(safe-area-inset-top,0px),20px)] ${
          isRTL ? 'text-right' : 'text-left'
        } font-alkatip`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md shadow-amber-500/30 overflow-hidden bg-[#04101e] flex items-center justify-center shrink-0">
                <img
                  src={getBrandLogo(siteLogo)}
                  alt="AUTO CASH"
                  className="w-full h-full rounded-full object-cover"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              </div>
              <span className="font-ukij font-bold text-base text-white gold-text-glow">
                {t('menuTitle')}
              </span>
            </div>
            <button
              onClick={onClose}
              data-modal-close="true"
              title={t('close')}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Switcher Section in Menu Drawer */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#081f38] to-[#051426] border border-amber-500/30 mb-4 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-amber-400" />
                <span>{t('selectLanguage')}</span>
              </span>
              <span className="text-[10px] text-amber-200/70 font-semibold">
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
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer ${
                    lang === item.code
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-300/80 scale-[1.02]'
                      : 'bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-amber-400/40 hover:text-white'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  <LanguageFlag code={item.code} className="w-4 h-3 rounded-[2px] object-cover shrink-0 shadow-sm" />
                </button>
              ))}
            </div>
          </div>

          {/* User Account / Login Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#081c33] to-[#04101e] border border-amber-500/30 mb-5 shadow-lg shadow-black/40">
            {user ? (
              <div className="space-y-3">
                {/* Top Row: Avatar + Name + ID */}
                <div className="flex items-center gap-3">
                  {/* User Avatar with Glowing Gold Frame */}
                  <div className="relative shrink-0">
                    <div
                      className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-md shadow-amber-500/30 shrink-0"
                      style={{ width: '48px', height: '48px' }}
                    >
                      <img
                        src={avatarSrc || (user as any)?.avatarUrl || (user as any)?.avatar || "/avatar.png"}
                        alt={user.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatar.png';
                        }}
                        className="w-full h-full rounded-full object-cover bg-slate-900 border border-slate-950"
                      />
                    </div>
                    <span
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#081c33] rounded-full shadow-sm"
                      title={t('online')}
                    />
                  </div>

                  {/* User Details */}
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="font-black text-sm text-white truncate gold-text-glow">
                        {user.name}
                      </h4>
                      <div className="px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono font-black text-[11px] tracking-wider shrink-0 shadow-inner">
                        {typeof user.id === 'string' && user.id.startsWith('USR-')
                          ? user.id.replace('USR-', 'ID ')
                          : String(user.id || 'ID')}
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-200/70 font-mono truncate mt-0.5" dir="ltr">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: VIP Badge & Logout Button */}
                <div className="flex items-center justify-between pt-2.5 border-t border-amber-500/20">
                  <Link
                    href="/membership"
                    onClick={onClose}
                    className={`inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full border font-black shadow-md transition-transform hover:scale-105 active:scale-95 animate-vip-float cursor-pointer ${activeTierConfig.badgeClass}`}
                    title={t('vipMembership')}
                  >
                    <span className="animate-vip-crown">
                      <Crown className={`w-3.5 h-3.5 ${activeTierConfig.iconClass} drop-shadow`} />
                    </span>
                    <span className="font-mono tracking-tight">{vipTierLabel}</span>
                    <span className="animate-star-twinkle text-[9px]">✨</span>
                  </Link>
                  <button
                    onClick={onLogout}
                    className="text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    title={t('logout')}
                  >
                    <span>{t('logout')}</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Guest Mode: Logo + Status */}
                <div className="flex items-center gap-3">
                  {/* Site Logo with Amber Glow */}
                  <div className="relative shrink-0">
                    <div
                      className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md shadow-amber-500/35 overflow-hidden shrink-0 flex items-center justify-center bg-[#04101e]"
                      style={{ width: '56px', height: '56px' }}
                    >
                      <img
                        src={getBrandLogo(siteLogo)}
                        alt="AUTO CASH Logo"
                        className="w-full h-full rounded-full object-cover"
                        style={{ imageRendering: '-webkit-optimize-contrast', width: '100%', height: '100%' }}
                      />
                    </div>
                    <span
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-400 border-2 border-[#081c33] rounded-full"
                      title={t('guestUser')}
                    />
                  </div>

                  {/* Guest info */}
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-black text-sm text-amber-300">{t('guestUser')}</h4>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/35 text-amber-400 font-bold text-[10px] shrink-0">
                        {t('guestBadge')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t('guestNotLoggedIn')}
                    </p>
                  </div>
                </div>

                <p className={`text-[11px] text-amber-200/80 ${isRTL ? 'text-right' : 'text-left'} leading-relaxed`}>
                  {t('guestPromo')}
                </p>

                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <User className="w-4 h-4" />
                  <span>{t('loginRegister')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Menu Items */}
          <div className="space-y-1 text-xs">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-soft-float" style={{ animationDelay: '0s' }}>
                <Store className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('allServices')}</span>
            </Link>

            <Link
              href="/numbers"
              onClick={handleNavigate('/numbers')}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent hover:from-cyan-500/25 hover:via-blue-500/20 border border-cyan-500/30 transition group"
            >
              <div className="flex items-center gap-3">
                <span className="animate-soft-float">
                  <Smartphone className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                </span>
                <span className="font-bold text-cyan-200 group-hover:text-cyan-100">مەۋھۇم نومۇر (SMS)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold">
                يېڭى
              </span>
            </Link>

            <Link
              href="/promotions"
              onClick={handleNavigate('/promotions')}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent hover:from-amber-500/25 hover:via-orange-500/20 border border-amber-500/35 transition group"
            >
              <div className="flex items-center gap-3">
                <span className="animate-pulse">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition" />
                </span>
                <span className="font-bold text-amber-200 group-hover:text-amber-100">
                  {lang === 'ug' ? 'بۈگۈنكى پائالىيەتلەر' : 'Flash Sale Deals'}
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] font-black uppercase tracking-wider">
                FLASH
              </span>
            </Link>

            <Link
              href="/deposit"
              onClick={handleNavigate('/deposit')}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-soft-float" style={{ animationDelay: '0.3s' }}>
                <CreditCard className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('shamcashDepositDrawer')}</span>
            </Link>

            <Link
              href="/orders"
              onClick={handleNavigate('/orders')}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-soft-float" style={{ animationDelay: '0.6s' }}>
                <Receipt className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('myOrdersDrawer')}</span>
            </Link>

            <Link
              href="/account"
              onClick={handleNavigate('/account')}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-soft-float" style={{ animationDelay: '0.7s' }}>
                <User className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('myAccountDrawer')}</span>
            </Link>

            <Link
              href="/membership"
              onClick={handleNavigate('/membership')}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-crown-wiggle">
                <Crown className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('vipPerksDrawer')}</span>
            </Link>

            <Link
              href="/download"
              onClick={handleNavigate('/download')}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-cyan-500/10 to-transparent hover:from-amber-500/25 hover:via-cyan-500/20 border border-amber-500/30 transition group"
            >
              <div className="flex items-center gap-3">
                <span className="animate-soft-float">
                  <Smartphone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                </span>
                <span className="font-bold text-amber-200 group-hover:text-amber-100">{t('downloadApp')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-[10px] text-amber-300 font-mono font-bold">
                APK
              </span>
            </Link>

            {isAdmin && (
              <a
                href="/admin"
                onClick={handleNavigate('/admin')}
                className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group cursor-pointer"
              >
                <span className="animate-soft-float" style={{ animationDelay: '1.2s' }}>
                  <LayoutDashboard className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
                </span>
                <span className="font-semibold">{t('adminPanel')}</span>
              </a>
            )}

            {/* Quick Theme Switcher in Drawer */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/35 transition group text-right cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </span>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                    {lang === 'ug' ? 'كۆرۈنمە يۈز ئۇسلۇبى' : 'Display Theme'}
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium">
                    {theme === 'dark'
                      ? (lang === 'ug' ? '🌙 قاراڭغۇ ھالەت (Dark)' : 'Dark Mode')
                      : (lang === 'ug' ? '☀️ نۇرلۇق ئاق ھالەت (Light)' : 'Comfort Light')}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-amber-300 border border-slate-700">
                {lang === 'ug' ? 'ئالماشتۇرۇش' : 'Switch'}
              </span>
            </button>
          </div>

          {/* Support section */}
          <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2 text-xs">
            <span className="text-[10px] text-slate-400 block mb-1">{t('contactSupport')}</span>
            
            {/* Telegram Official Channel */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-600/5 border border-sky-500/25">
              <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                <span className="animate-soft-float">
                  <Megaphone className="w-3.5 h-3.5 text-sky-400" />
                </span>
                <span>{t('telegramChannel')}</span>
              </span>
              <a
                href="https://t.me/autocash_cannel"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 text-[11px] hover:underline font-bold"
              >
                {t('connect')}
              </a>
            </div>

            {/* Telegram Customer Support */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="animate-soft-float">
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                </span>
                <span>{t('telegramSupport')}</span>
              </span>
              <a
                href="https://t.me/autocash_UYGHUR"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 text-[11px] hover:underline font-bold"
              >
                {t('connect')}
              </a>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="animate-soft-float" style={{ animationDelay: '0.5s' }}>
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                <span>WhatsApp: <span dir="ltr" className="font-mono text-emerald-400 text-xs font-semibold">+963 984 373 459</span></span>
              </span>
              <a
                href="https://wa.me/963984373459"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 text-[11px] hover:underline font-bold"
              >
                {t('connect')}
              </a>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="pt-4 border-t border-slate-900 text-center text-[10px] text-slate-500">
          <span>{t('copyright')}</span>
        </div>
      </aside>
    </div>
  );
}
