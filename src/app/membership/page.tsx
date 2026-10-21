'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
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
    <div
      className={`min-h-screen bg-[#040e1d] text-slate-100 flex flex-col pb-24 md:pb-8 selection:bg-cyan-500 selection:text-white font-alkatip ${
        isRTL ? 'text-right' : 'text-left'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Navbar balance={balance} user={currentUser} />

      <main className="max-w-3xl mx-auto px-4 py-5 w-full flex-1 space-y-5">
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
              {t('membershipTitle')}
            </h1>
          </div>
        </div>

        {/* Big VIP Card */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-b from-[#092244] via-[#06182f] to-[#041021] border border-amber-500/40 shadow-2xl space-y-5 relative overflow-hidden animate-vip-card-glow">
          {/* Ambient Corner Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Card Top Row */}
          <div className="flex items-center justify-between relative z-10">
            <span className="font-mono text-xs sm:text-sm font-extrabold text-amber-300/90 tracking-widest uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-star-twinkle" />
              <span className="autocash-shimmer">AUTO CASH</span>
              <span className="text-white">CLUB</span>
            </span>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-md shadow-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('currentLevel')}</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-1 relative z-10">
            <div className={`space-y-1.5 ${isRTL ? 'text-right' : 'text-left'} flex-1`}>
              <span className="text-xs text-slate-400 block font-medium">
                {t('currentLevel')}:
              </span>
              <h2 className="text-3xl sm:text-5xl font-black font-mono tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-md gold-text-glow">
                  {currentTier.name}
                </span>
                <span className="animate-vip-crown text-amber-300 text-xl sm:text-2xl">👑</span>
              </h2>
              <p className="text-xs text-slate-300/90 leading-relaxed pt-1 max-w-md">
                {t('autoTierUpgradeDesc')}
              </p>
            </div>

            <div className="flex justify-center sm:justify-start">
              {renderBadge(currentTier.colorScheme, currentTier.name, 'lg')}
            </div>
          </div>

          {/* 3 Metric Cards inside the Big Card */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-3 relative z-10">
            <div className={`p-3.5 sm:p-4 rounded-2xl bg-[#06172a]/95 border border-slate-700/80 hover:border-cyan-500/40 transition shadow-lg ${isRTL ? 'text-right' : 'text-left'} relative overflow-hidden group`}>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <span className="text-[10px] sm:text-xs text-slate-400 block mb-1 font-alkatip">
                {t('currentDiscount')}
              </span>
              <span className="text-lg sm:text-2xl font-black text-cyan-400 font-mono tracking-tight">
                {currentTier.discount}%
              </span>
            </div>

            <div className={`p-3.5 sm:p-4 rounded-2xl bg-[#06172a]/95 border border-slate-700/80 hover:border-amber-500/40 transition shadow-lg ${isRTL ? 'text-right' : 'text-left'} relative overflow-hidden group`}>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <span className="text-[10px] sm:text-xs text-slate-400 block mb-1 font-alkatip">
                {t('totalSpent')}
              </span>
              <span className="text-lg sm:text-2xl font-black text-white font-mono flex items-center gap-0.5 tracking-tight" dir="ltr">
                <span className="animate-dollar-float text-amber-400">$</span>
                <span>{userSpent.toFixed(2)}</span>
              </span>
            </div>

            <div className={`p-3.5 sm:p-4 rounded-2xl bg-[#06172a]/95 border border-slate-700/80 hover:border-yellow-500/40 transition shadow-lg ${isRTL ? 'text-right' : 'text-left'} relative overflow-hidden group`}>
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
              <span className="text-[10px] sm:text-xs text-slate-400 block mb-1 font-alkatip">
                {t('levelRank')}
              </span>
              <span className="text-lg sm:text-2xl font-black text-amber-300 font-mono tracking-tight flex items-center gap-1">
                <span>{safeTierIndex + 1}</span>
                <span className="text-slate-500 text-sm font-normal">/ 5</span>
              </span>
            </div>
          </div>

          {/* Progress to Next Level Section */}
          <div className="p-4 rounded-2xl bg-[#041324]/90 border border-slate-700/70 space-y-2.5 relative z-10 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold font-alkatip">
                {t('nextTierProgress')}
              </span>
              <span className="text-amber-300 font-alkatip text-[11px] font-bold">
                {nextTier
                  ? `${t('towardTier')} ${nextTier.name}`
                  : t('topLevelReached')}
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-yellow-300 shadow-md shadow-amber-400/30 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-alkatip text-slate-400">
              <span className="flex items-center gap-1">
                <span>{t('spentLabel')}</span>
                <span className="font-mono font-bold text-white flex items-center gap-0.5" dir="ltr">
                  <span className="animate-dollar-float text-amber-400">$</span>
                  <span>{userSpent.toFixed(2)}</span>
                </span>
              </span>
              {nextTier ? (
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <span>{`${nextTier.name} ${t('remainingForTier')}`}</span>
                  <span className="font-mono font-extrabold text-amber-400 flex items-center gap-0.5" dir="ltr">
                    <span className="animate-dollar-float text-amber-400">$</span>
                    <span>{remainingForNext.toFixed(2)}</span>
                  </span>
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <span>👑</span>
                  <span>{t('topVipMember')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3 Advantage Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-4 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-amber-500/40 transition ${isRTL ? 'text-right' : 'text-left'} space-y-2 shadow-sm group hover:scale-[1.02] duration-200`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-110 transition">
                <TrendingUp className="w-5 h-5 animate-normal-icon" />
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white font-alkatip">
              {t('autoTierUpgradeTitle')}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('autoTierUpgradeDesc')}
            </p>
          </div>

          <div className={`p-4 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-emerald-500/40 transition ${isRTL ? 'text-right' : 'text-left'} space-y-2 shadow-sm group hover:scale-[1.02] duration-200`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition">
                <Percent className="w-5 h-5 animate-floating-icon" />
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white font-alkatip">
              {t('instantDiscountTitle')}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('instantDiscountDesc')}
            </p>
          </div>

          <div className={`p-4 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-yellow-500/40 transition ${isRTL ? 'text-right' : 'text-left'} space-y-2 shadow-sm group hover:scale-[1.02] duration-200`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition">
                <Sparkles className="w-5 h-5 animate-star-twinkle" />
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white font-alkatip">
              {t('growingPrivilegesTitle')}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('growingPrivilegesDesc')}
            </p>
          </div>
        </div>

        {/* Section Header: Membership Tiers */}
        <div className="pt-2 flex items-center justify-between pb-1">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="font-ukij text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400 animate-vip-crown" />
              <span>{t('membershipTiersTitle')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
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
                    ? 'border-amber-400/80 bg-gradient-to-r from-[#0b2545] via-[#081e38] to-[#051528] shadow-2xl shadow-amber-500/20 ring-1 ring-amber-400/40 relative overflow-hidden'
                    : 'bg-[#07192d] border-slate-800/90 hover:border-slate-700 hover:bg-[#071d33]'
                }`}
              >
                <div>
                  {isActive ? (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-400/30 transition transform hover:scale-105">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-500 flex items-center justify-center font-bold">
                      <span>—</span>
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-3 sm:gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-[10px] text-amber-300 font-bold font-alkatip flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>{t('currentLevel')}</span>
                        </span>
                      )}
                      <h4 className="font-bold text-sm sm:text-base text-white font-mono flex items-center gap-1.5">
                        <span className={isActive ? 'text-amber-300 font-black' : ''}>{tier.name}</span>
                        {isActive && <span className="animate-star-twinkle text-xs">✨</span>}
                      </h4>
                    </div>

                    <span className="text-[11px] text-slate-300 block font-alkatip">
                      {formatRequirement(tier.minSpend)}
                    </span>

                    <span className="text-xs font-bold text-amber-400 font-alkatip block mt-1" dir="ltr">
                      {tier.discount}% {t('tierDiscount')}
                    </span>
                  </div>

                  {renderBadge(tier.colorScheme, tier.name, 'md', delayClass)}

                  <span className="font-mono text-xs font-bold text-slate-500 hidden sm:inline-block pl-2">
                    {tier.num}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
