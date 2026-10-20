'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
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
  LogOut,
  Send,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Camera,
} from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string; id?: string; balance?: number; avatarUrl?: string; vipTier?: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

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
    badgeClass: 'text-slate-300 bg-slate-900/80 border-slate-600/50',
    iconClass: 'text-slate-400',
  },
  vip2: {
    name: {
      ug: 'VIP 2 (كۈمۈش ئەزا)',
      ar: 'VIP 2 (عضو فضي)',
      en: 'VIP 2 (Silver Member)',
    },
    badgeClass: 'text-amber-300 bg-amber-950/70 border-amber-500/40',
    iconClass: 'text-amber-400',
  },
  vip3: {
    name: {
      ug: 'VIP 3 (ئالتۇن ئەزا)',
      ar: 'VIP 3 (عضو ذهبي)',
      en: 'VIP 3 (Gold Member)',
    },
    badgeClass: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/40',
    iconClass: 'text-cyan-400',
  },
  vip4: {
    name: {
      ug: 'VIP 4 (پىلاتىنا ئەزا)',
      ar: 'VIP 4 (عضو بلاتيني)',
      en: 'VIP 4 (Platinum Member)',
    },
    badgeClass: 'text-yellow-300 bg-yellow-950/70 border-yellow-500/40',
    iconClass: 'text-yellow-400',
  },
  vip5: {
    name: {
      ug: 'VIP 5 (ئالماس ئەزا)',
      ar: 'VIP 5 (عضو ماسي)',
      en: 'VIP 5 (Diamond Member)',
    },
    badgeClass: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40',
    iconClass: 'text-emerald-400',
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
  const [avatarSrc, setAvatarSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizedTier = (
    user?.vipTier ||
    (typeof window !== 'undefined' ? localStorage.getItem('autocash_vipTier') : '') ||
    'vip1'
  )
    .toLowerCase()
    .replace(/[\s-_]/g, '');
  const activeTierConfig = VIP_TIER_CONFIG[normalizedTier] || VIP_TIER_CONFIG.vip1;
  const vipTierLabel =
    activeTierConfig.name[lang as 'ug' | 'ar' | 'en'] || activeTierConfig.name.ug;

  useEffect(() => {
    if (!user) {
      setAvatarSrc('');
      return;
    }

    const localAvatar = typeof window !== 'undefined' ? localStorage.getItem('autocash_avatar') : null;
    const userAvatar = user.avatarUrl || (user as any)?.avatar;

    if (userAvatar) {
      setAvatarSrc(userAvatar);
    } else if (localAvatar) {
      setAvatarSrc(localAvatar);
    } else {
      // Check Supabase session for Google profile picture
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
              window.dispatchEvent(new Event('autocash-auth-changed'));
            }
          }).catch(() => {});
        }
      });
    }
  }, [user, isOpen]);

  const isBrowserPoppedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      try {
        window.history.pushState({ autocash_side_drawer: true }, '');
      } catch {}

      const handlePopState = () => {
        isBrowserPoppedRef.current = true;
        onClose();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };

      window.addEventListener('popstate', handlePopState);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('keydown', handleKeyDown);

        if (!isBrowserPoppedRef.current && window.history.state?.autocash_side_drawer) {
          try {
            window.history.back();
          } catch {}
        }
      };
    }
  }, [isOpen, onClose]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setAvatarSrc(resizedDataUrl);
        localStorage.setItem('autocash_avatar', resizedDataUrl);
        window.dispatchEvent(new Event('autocash-auth-changed'));

        if (user?.email) {
          fetch('/api/auth/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: user.email, avatarUrl: resizedDataUrl }),
          }).catch(() => {});
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
              <div className="w-8 h-8 rounded-full border border-amber-400 overflow-hidden bg-[#04101e] flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="AUTO CASH"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-ukij font-bold text-base text-white gold-text-glow">
                {t('menuTitle')}
              </span>
            </div>
            <button
              onClick={onClose}
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
                {lang === 'ug' ? 'ئۇيغۇرچە' : lang === 'ar' ? 'العربية' : 'English'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {/* Uyghur button */}
              <button
                type="button"
                onClick={() => setLang('ug')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  lang === 'ug'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-300/80 scale-[1.02]'
                    : 'bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-amber-400/40 hover:text-white'
                }`}
              >
                <span>🌙</span>
                <span>ئۇيغۇرچە</span>
              </button>

              {/* Arabic button */}
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  lang === 'ar'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-300/80 scale-[1.02]'
                    : 'bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-amber-400/40 hover:text-white'
                }`}
              >
                <span>🇸🇦</span>
                <span>العربية</span>
              </button>

              {/* English button */}
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  lang === 'en'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-300/80 scale-[1.02]'
                    : 'bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-amber-400/40 hover:text-white'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>
          </div>

          {/* User Account / Login Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#081c33] to-[#04101e] border border-amber-500/30 mb-5 shadow-lg shadow-black/40">
            {user ? (
              <div className="space-y-3">
                {/* Top Row: Avatar + Name + ID */}
                <div className="flex items-center gap-3">
                  {/* User Avatar with Glowing Gold Frame */}
                  <div className="relative shrink-0 group/avatar">
                    <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-md shadow-amber-500/30">
                      <img
                        src={avatarSrc || (user as any)?.avatarUrl || (user as any)?.avatar || "/avatar.png"}
                        alt={user.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatar.png';
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-12 h-12 rounded-full object-cover bg-slate-900 border border-slate-950 cursor-pointer hover:opacity-90 transition"
                        title="رەسىم ئالماشتۇرۇش"
                      />
                    </div>
                    <span
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#081c33] rounded-full shadow-sm"
                      title={t('online')}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-amber-400 hover:bg-yellow-300 text-slate-950 flex items-center justify-center shadow-md border border-[#081c33] transition cursor-pointer hover:scale-110 active:scale-95"
                      title="رەسىم ئالماشتۇرۇش"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
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
                  <div className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border font-bold shadow-sm ${activeTierConfig.badgeClass}`}>
                    <Crown className={`w-3.5 h-3.5 ${activeTierConfig.iconClass}`} />
                    <span>{vipTierLabel}</span>
                  </div>
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
                    <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-600 shadow-md shadow-amber-500/30">
                      <img
                        src="/logo.png"
                        alt="AUTO CASH Logo"
                        className="w-12 h-12 rounded-full object-cover bg-[#04101e] border border-slate-950"
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
              href="/deposit"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-soft-float" style={{ animationDelay: '0.3s' }}>
                <CreditCard className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('shamcashDepositDrawer')}</span>
            </Link>

            <Link
              href="/orders"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-soft-float" style={{ animationDelay: '0.6s' }}>
                <Receipt className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('myOrdersDrawer')}</span>
            </Link>

            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-soft-float" style={{ animationDelay: '0.7s' }}>
                <User className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('myAccountDrawer')}</span>
            </Link>

            <Link
              href="/membership"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-crown-wiggle">
                <Crown className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('vipPerksDrawer')}</span>
            </Link>

            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent hover:border-amber-500/20 transition group"
            >
              <span className="animate-soft-float" style={{ animationDelay: '1.2s' }}>
                <LayoutDashboard className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
              </span>
              <span className="font-semibold">{t('adminPanel')}</span>
            </Link>
          </div>

          {/* Support section */}
          <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2 text-xs">
            <span className="text-[10px] text-slate-400 block mb-1">{t('contactSupport')}</span>
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
