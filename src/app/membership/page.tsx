'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SGCSubpageLayout from '@/components/SGCSubpageLayout';
import { useLanguage } from '@/context/LanguageContext';
import { getCachedBalance, getCachedUser, storeLocalAuth, ClientUser } from '@/lib/clientAuth';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  Sparkles,
  Check,
  Crown
} from 'lucide-react';

interface VipTier {
  id: string;
  num: string;
  name: string;
  minSpend: number;
  discount: number;
  isCurrent?: boolean;
  colorScheme: 'silver' | 'bronze' | 'steel' | 'gold' | 'deluxeGold';
}

export default function MembershipVipPage() {
  const { lang, t, isRTL } = useLanguage();
  const [balance, setBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return getCachedBalance();
    }
    return 0.0;
  });
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(() => {
    if (typeof window !== 'undefined') {
      return getCachedUser();
    }
    return null;
  });

  useEffect(() => {
    const cached = getCachedUser();
    if (cached) {
      setCurrentUser(cached);
      setBalance(cached.balance ?? 0.0);
    }

    // Refresh live profile data from session
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          setCurrentUser(d.user);
          setBalance(d.user.balance ?? 0.0);
          storeLocalAuth(d.user);
        }
      })
      .catch(() => {});
  }, []);

  const currentVipKey = (currentUser?.vipTier || 'vip1').toLowerCase();
  const userSpent = Number(currentUser?.totalSpent || 0.0);

  const vipTiers: VipTier[] = [
    {
      id: 'vip1',
      num: '01',
      name: 'VIP 1',
      minSpend: 0,
      discount: 0,
      isCurrent: currentVipKey === 'vip1',
      colorScheme: 'silver',
    },
    {
      id: 'vip2',
      num: '02',
      name: 'VIP 2',
      minSpend: 100,
      discount: 2,
      isCurrent: currentVipKey === 'vip2',
      colorScheme: 'bronze',
    },
    {
      id: 'vip3',
      num: '03',
      name: 'VIP 3',
      minSpend: 500,
      discount: 5,
      isCurrent: currentVipKey === 'vip3',
      colorScheme: 'steel',
    },
    {
      id: 'vip4',
      num: '04',
      name: 'VIP 4',
      minSpend: 2000,
      discount: 8,
      isCurrent: currentVipKey === 'vip4',
      colorScheme: 'gold',
    },
    {
      id: 'vip5',
      num: '05',
      name: 'VIP 5',
      minSpend: 5000,
      discount: 12,
      isCurrent: currentVipKey === 'vip5',
      colorScheme: 'deluxeGold',
    },
  ];

  const currentTierIndex = vipTiers.findIndex((t) => t.id === currentVipKey);
  const safeTierIndex = currentTierIndex >= 0 ? currentTierIndex : 0;
  const currentTier = vipTiers[safeTierIndex];
  const nextTier = safeTierIndex < vipTiers.length - 1 ? vipTiers[safeTierIndex + 1] : null;

  const progressPercent = nextTier
    ? Math.min(100, Math.max(0, (userSpent / nextTier.minSpend) * 100))
    : 100;
  const remainingForNext = nextTier ? Math.max(0, nextTier.minSpend - userSpent) : 0;

  const renderBadge = (
    colorScheme: VipTier['colorScheme'],
    tierName: string,
    size: 'lg' | 'md' = 'md',
    delayClass: string = ''
  ) => {
    const isLg = size === 'lg';
    const dim = isLg ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-14 h-14 sm:w-16 sm:h-16';

    let gradientClass = 'from-slate-100 via-slate-300 to-slate-400';
    let ringColor = 'border-slate-200/90';
    let glowShadow = 'shadow-slate-300/40';
    let haloBg = 'bg-slate-300/20';
    let crownColor = 'text-slate-200';
    let textGradient = 'bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent';
    let centerBg = 'from-slate-800 to-slate-950';

    if (colorScheme === 'bronze') {
      gradientClass = 'from-amber-400 via-orange-500 to-amber-700';
      ringColor = 'border-amber-500/90';
      glowShadow = 'shadow-orange-500/40';
      haloBg = 'bg-orange-500/25';
      crownColor = 'text-amber-300';
      textGradient = 'bg-gradient-to-b from-white via-amber-200 to-orange-400 bg-clip-text text-transparent';
      centerBg = 'from-amber-950 to-slate-950';
    } else if (colorScheme === 'steel') {
      gradientClass = 'from-cyan-200 via-sky-400 to-blue-600';
      ringColor = 'border-cyan-300';
      glowShadow = 'shadow-cyan-400/50';
      haloBg = 'bg-cyan-400/30';
      crownColor = 'text-cyan-300';
      textGradient = 'bg-gradient-to-b from-white via-cyan-100 to-sky-300 bg-clip-text text-transparent';
      centerBg = 'from-cyan-950 to-slate-950';
    } else if (colorScheme === 'gold') {
      gradientClass = 'from-yellow-200 via-amber-400 to-yellow-600';
      ringColor = 'border-yellow-300';
      glowShadow = 'shadow-yellow-400/60';
      haloBg = 'bg-amber-400/35';
      crownColor = 'text-yellow-300';
      textGradient = 'bg-gradient-to-b from-white via-yellow-200 to-amber-400 bg-clip-text text-transparent';
      centerBg = 'from-amber-950 to-slate-950';
    } else if (colorScheme === 'deluxeGold') {
      gradientClass = 'from-yellow-100 via-amber-300 to-rose-400';
      ringColor = 'border-amber-300';
      glowShadow = 'shadow-amber-400/70';
      haloBg = 'bg-gradient-to-tr from-amber-500/40 via-yellow-400/30 to-purple-500/25';
      crownColor = 'text-yellow-200';
      textGradient = 'bg-gradient-to-b from-white via-amber-100 to-yellow-300 bg-clip-text text-transparent';
      centerBg = 'from-amber-900 to-slate-950';
    }

    return (
      <div className={`relative ${dim} shrink-0 animate-vip-float ${delayClass} select-none`}>
        {/* Soft breathing halo aura behind badge */}
        <div className={`absolute -inset-2 rounded-full ${haloBg} blur-md animate-vip-aura pointer-events-none`} />

        {/* Outer metallic ring */}
        <div
          className={`relative w-full h-full rounded-full p-1 bg-gradient-to-tr ${gradientClass} ${glowShadow} shadow-2xl flex items-center justify-center border-2 ${ringColor} transition-transform hover:scale-105 duration-300`}
        >
          {/* Inner crystal disc */}
          <div
            className={`w-full h-full rounded-full bg-gradient-to-b ${centerBg} flex flex-col items-center justify-center relative overflow-hidden border border-white/25 p-1 text-center shadow-inner`}
          >
            {/* Ambient luxury light sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />

            {/* Regal Crown swaying gracefully */}
            <span className="animate-vip-crown drop-shadow-[0_2px_8px_rgba(250,204,21,0.5)]">
              <Crown className={`${isLg ? 'w-7 h-7 sm:w-9 sm:h-9' : 'w-4 h-4 sm:w-5 sm:h-5'} ${crownColor}`} />
            </span>

            {/* Metallic Tier Title */}
            <span
              className={`font-black ${
                isLg ? 'text-xs sm:text-sm tracking-wider' : 'text-[10px] tracking-wide'
              } ${textGradient} -mt-0.5 font-mono relative z-10 font-bold drop-shadow`}
            >
              {tierName}
            </span>
          </div>
        </div>

        {/* Twinkling star particle for large VIP badge */}
        {isLg && (
          <span className="absolute -top-1 -right-1 text-yellow-300 animate-star-twinkle text-sm pointer-events-none drop-shadow">
            ✨
          </span>
        )}
      </div>
    );
  };

  const formatRequirement = (minSpend: number) => {
    if (lang === 'ug') {
      return <>ئومۇمىي سېتىۋېلىش <span className="font-mono text-slate-300 font-bold">${minSpend.toFixed(2)}</span> غا يەتكەندە ئېچىلىدۇ</>;
    }
    if (lang === 'ar') {
      return <>يفتح عند بلوغ المشتريات <span className="font-mono text-slate-300 font-bold">${minSpend.toFixed(2)}</span></>;
    }
    if (lang === 'tr') {
      return <>Toplam harcama <span className="font-mono text-slate-300 font-bold">${minSpend.toFixed(2)}</span> olunca açılır</>;
    }
    if (lang === 'uz') {
      return <>Jami xarid <span className="font-mono text-slate-300 font-bold">${minSpend.toFixed(2)}</span> ga yetganda ochiladi</>;
    }
    if (lang === 'ru') {
      return <>Открывается при сумме покупок <span className="font-mono text-slate-300 font-bold">${minSpend.toFixed(2)}</span></>;
    }
    return <>Unlocks at <span className="font-mono text-slate-300 font-bold">${minSpend.toFixed(2)}</span> total spend</>;
  };

  return (
    <SGCSubpageLayout
      title={lang === 'ug' ? 'ئەزالىق ۋە ئىمتىياز' : t('membershipTitle')}
      subtitle={
        lang === 'ug'
          ? 'AUTO CASH VIP كۇلۇبى — ئالاھىدە ئېتىبار ۋە ئېشىپ بارىدىغان كاشباك'
          : t('membershipTiersSubtitle')
      }
      headerActions={
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition cursor-pointer"
        >
          {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{t('store')}</span>
        </Link>
      }
    >
      <div className="space-y-5">
        {/* Big VIP Card - SGC Luxury Emerald & Gold */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden space-y-5 border border-emerald-500/30">
          {/* Ambient Corner Glows */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top Row */}
          <div className="flex items-center justify-between relative z-10">
            <span className="font-mono text-xs sm:text-sm font-extrabold text-amber-300 tracking-widest uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-star-glint" />
              <span className="animated-brand-title">AUTO CASH</span>
              <span className="text-emerald-200 font-bold">CLUB</span>
            </span>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 border border-white/20 text-emerald-200 text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('currentLevel')}</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-1 relative z-10">
            <div className={`space-y-1.5 ${isRTL ? 'text-right' : 'text-left'} flex-1`}>
              <span className="text-xs text-emerald-200 block font-bold font-alkatip">
                {t('currentLevel')}:
              </span>
              <h2 className="text-3xl sm:text-5xl font-black font-mono tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-md">
                  {currentTier.name}
                </span>
                <span className="animate-icon-sparkle text-amber-300 text-xl sm:text-2xl">👑</span>
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed pt-1 max-w-md font-alkatip">
                {t('autoTierUpgradeDesc')}
              </p>
            </div>

            <div className="flex justify-center sm:justify-start">
              {renderBadge(currentTier.colorScheme, currentTier.name, 'lg')}
            </div>
          </div>

          {/* 3 Metric Cards inside the Big Card */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-3 relative z-10">
            <div className={`p-3.5 sm:p-4 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 shadow-sm ${isRTL ? 'text-right' : 'text-left'} relative overflow-hidden group`}>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <span className="text-[10px] sm:text-xs text-emerald-200 block mb-1 font-alkatip font-bold">
                {t('currentDiscount')}
              </span>
              <span className="text-lg sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
                {currentTier.discount}%
              </span>
            </div>

            <div className={`p-3.5 sm:p-4 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 shadow-sm ${isRTL ? 'text-right' : 'text-left'} relative overflow-hidden group`}>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <span className="text-[10px] sm:text-xs text-emerald-200 block mb-1 font-alkatip font-bold">
                {t('totalSpent')}
              </span>
              <span className="text-lg sm:text-2xl font-black text-white font-mono flex items-center gap-0.5 tracking-tight" dir="ltr">
                <span className="text-amber-300 font-bold">$</span>
                <span>{userSpent.toFixed(2)}</span>
              </span>
            </div>

            <div className={`p-3.5 sm:p-4 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 shadow-sm ${isRTL ? 'text-right' : 'text-left'} relative overflow-hidden group`}>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
              <span className="text-[10px] sm:text-xs text-emerald-200 block mb-1 font-alkatip font-bold">
                {t('levelRank')}
              </span>
              <span className="text-lg sm:text-2xl font-black text-amber-300 font-mono tracking-tight flex items-center gap-1">
                <span>{safeTierIndex + 1}</span>
                <span className="text-emerald-200/60 text-sm font-normal">/ 5</span>
              </span>
            </div>
          </div>

          {/* Progress to Next Level Section */}
          <div className="p-4 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 space-y-2.5 relative z-10 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-100 font-bold font-alkatip">
                {t('nextTierProgress')}
              </span>
              <span className="text-amber-300 font-alkatip text-[11px] font-bold">
                {nextTier
                  ? `${t('towardTier')} ${nextTier.name}`
                  : t('topLevelReached')}
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-black/30 border border-white/10 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400 shadow-md shadow-amber-400/40 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-alkatip text-emerald-200">
              <span className="flex items-center gap-1">
                <span>{t('spentLabel')}</span>
                <span className="font-mono font-bold text-white flex items-center gap-0.5" dir="ltr">
                  <span className="text-amber-300 font-bold">$</span>
                  <span>{userSpent.toFixed(2)}</span>
                </span>
              </span>
              {nextTier ? (
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <span>{`${nextTier.name} ${t('remainingForTier')}`}</span>
                  <span className="font-mono font-extrabold text-white flex items-center gap-0.5" dir="ltr">
                    <span className="text-amber-300 font-bold">$</span>
                    <span>{remainingForNext.toFixed(2)}</span>
                  </span>
                </span>
              ) : (
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <span>👑</span>
                  <span>{t('topVipMember')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3 Advantage Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-4 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-600 transition ${isRTL ? 'text-right' : 'text-left'} space-y-2 shadow-xs group hover:scale-[1.02] duration-200`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs animate-nav-pill-glow group-hover:scale-110 transition">
                <TrendingUp className="w-5 h-5 animate-icon-sparkle anim-delay-1" />
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-alkatip">
              {t('autoTierUpgradeTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-alkatip">
              {t('autoTierUpgradeDesc')}
            </p>
          </div>

          <div className={`p-4 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-600 transition ${isRTL ? 'text-right' : 'text-left'} space-y-2 shadow-xs group hover:scale-[1.02] duration-200`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs animate-nav-pill-glow group-hover:scale-110 transition">
                <Percent className="w-5 h-5 animate-icon-sparkle anim-delay-2" />
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-alkatip">
              {t('instantDiscountTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-alkatip">
              {t('instantDiscountDesc')}
            </p>
          </div>

          <div className={`p-4 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-600 transition ${isRTL ? 'text-right' : 'text-left'} space-y-2 shadow-xs group hover:scale-[1.02] duration-200`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs animate-nav-pill-glow group-hover:scale-110 transition">
                <Sparkles className="w-5 h-5 animate-icon-sparkle anim-delay-3" />
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-alkatip">
              {t('growingPrivilegesTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-alkatip">
              {t('growingPrivilegesDesc')}
            </p>
          </div>
        </div>

        {/* Section Header: Membership Tiers */}
        <div className="pt-2 flex items-center justify-between pb-1">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-alkatip">
              <Crown className="w-5 h-5 text-amber-500 animate-icon-gleam" />
              <span>{t('membershipTiersTitle')}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-alkatip">
              {t('membershipTiersSubtitle')}
            </p>
          </div>
        </div>

        {/* 5 Membership Tier Rows */}
        <div className="space-y-3">
          {vipTiers.map((tier, index) => {
            const isActive = tier.isCurrent;
            const delayClass = `vip-delay-${(index % 5) + 1}`;

            return (
              <div
                key={tier.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                  isActive
                    ? 'border-2 border-emerald-500 bg-emerald-50/90 dark:bg-[#0c1f1c] shadow-lg shadow-emerald-900/10 ring-1 ring-emerald-500/30 relative overflow-hidden'
                    : 'bg-white dark:bg-[#101726] border-slate-200/90 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-xs'
                }`}
              >
                <div>
                  {isActive ? (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 text-white font-black flex items-center justify-center shadow-lg shadow-emerald-500/30 transition transform hover:scale-105 animate-nav-pill-glow">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 flex items-center justify-center font-bold">
                      <span>—</span>
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-3 sm:gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-[10px] text-emerald-800 dark:text-emerald-200 font-bold font-alkatip flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{t('currentLevel')}</span>
                        </span>
                      )}
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                        <span className={isActive ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>{tier.name}</span>
                        {isActive && <span className="animate-star-glint text-xs text-amber-400">✨</span>}
                      </h4>
                    </div>

                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-alkatip">
                      {formatRequirement(tier.minSpend)}
                    </span>

                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-alkatip block mt-1" dir="ltr">
                      {tier.discount}% {t('tierDiscount')}
                    </span>
                  </div>

                  {renderBadge(tier.colorScheme, tier.name, 'md', delayClass)}

                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 hidden sm:inline-block pl-2">
                    {tier.num}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SGCSubpageLayout>
  );
}
