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
    size: 'lg' | 'md' = 'md'
  ) => {
    const isLg = size === 'lg';
    const dim = isLg ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-14 h-14';

    let gradientClass = 'from-slate-200 via-slate-400 to-slate-300';
    let ringColor = 'border-slate-300/80';
    let glowShadow = 'shadow-slate-400/30';
    let centerBg = 'from-slate-800 to-slate-950';

    if (colorScheme === 'bronze') {
      gradientClass = 'from-amber-600 via-amber-800 to-amber-700';
      ringColor = 'border-amber-600/80';
      glowShadow = 'shadow-amber-700/30';
      centerBg = 'from-amber-950 to-slate-950';
    } else if (colorScheme === 'steel') {
      gradientClass = 'from-cyan-300 via-blue-500 to-cyan-400';
      ringColor = 'border-cyan-400/80';
      glowShadow = 'shadow-cyan-500/40';
      centerBg = 'from-cyan-950 to-slate-950';
    } else if (colorScheme === 'gold') {
      gradientClass = 'from-amber-200 via-yellow-400 to-amber-500';
      ringColor = 'border-amber-400';
      glowShadow = 'shadow-amber-400/50';
      centerBg = 'from-amber-950 to-slate-950';
    } else if (colorScheme === 'deluxeGold') {
      gradientClass = 'from-yellow-100 via-amber-300 to-yellow-500';
      ringColor = 'border-yellow-300';
      glowShadow = 'shadow-yellow-400/60';
      centerBg = 'from-amber-900 to-slate-950';
    }

    return (
      <div
        className={`relative ${dim} rounded-full p-1 bg-gradient-to-tr ${gradientClass} ${glowShadow} shadow-2xl flex items-center justify-center shrink-0 border-2 ${ringColor} transition-transform hover:scale-105 duration-300`}
      >
        <div
          className={`w-full h-full rounded-full bg-gradient-to-b ${centerBg} flex flex-col items-center justify-center relative overflow-hidden border border-white/20 p-1 text-center`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
          <Crown className={`${isLg ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-4 h-4'} text-amber-300 drop-shadow`} />
          <span
            className={`font-black ${
              isLg ? 'text-xs sm:text-sm' : 'text-[9px]'
            } bg-gradient-to-b from-white to-cyan-300 bg-clip-text text-transparent -mt-0.5 font-mono relative z-10`}
          >
            {tierName}
          </span>
        </div>
      </div>
    );
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
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#071d36] via-[#05172b] to-[#041122] border border-cyan-500/35 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Top Row */}
          <div className="flex items-center justify-between relative z-10">
            <span className="font-mono text-xs sm:text-sm font-extrabold text-cyan-400/90 tracking-widest uppercase">
              <span className="autocash-shimmer">AUTO CASH</span> CLUB
            </span>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{t('currentLevel')}</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-1 relative z-10">
            <div className={`space-y-1 ${isRTL ? 'text-right' : 'text-left'} flex-1`}>
              <span className="text-xs text-slate-400 block font-medium">
                {t('currentLevel')}:
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight flex items-center gap-2">
                <span>{currentTier.name}</span>
              </h2>
              <p className="text-xs text-slate-300/90 leading-relaxed pt-1">
                {lang === 'ug'
                  ? 'ئومۇمىي سېتىۋېلىش سوممىڭىزغا ئاساسەن ئاپتوماتىك دەرىجە ئۆرلەيدۇ، كېرەكلىك دەرىجىگە يەتكەندە ئېتىبار بىۋاسىتە ئىناۋەتكە ئېلىنىدۇ.'
                  : lang === 'ar'
                  ? 'ترقية المستوى تتم تلقائياً بناءً على إجمالي المشتريات، وتطبق الخصومات فوراً على كل طلب.'
                  : 'Your level upgrades automatically based on total spending, unlocking instant discounts.'}
              </p>
            </div>

            <div className="flex justify-center sm:justify-start">
              {renderBadge(currentTier.colorScheme, currentTier.name, 'lg')}
            </div>
          </div>

          {/* 3 Metric Cards inside the Big Card */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-3 relative z-10">
            <div className={`p-3 sm:p-3.5 rounded-2xl bg-[#06172a]/90 border border-slate-800 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-[10px] sm:text-xs text-slate-400 block mb-1 font-alkatip">
                {lang === 'ug' ? 'ھازىرقى ئېتىبارىڭىز' : lang === 'ar' ? 'خصمك الحالي' : 'Current Discount'}
              </span>
              <span className="text-base sm:text-xl font-black text-cyan-400 font-mono">
                {currentTier.discount}%
              </span>
            </div>

            <div className={`p-3 sm:p-3.5 rounded-2xl bg-[#06172a]/90 border border-slate-800 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-[10px] sm:text-xs text-slate-400 block mb-1 font-alkatip">
                {lang === 'ug' ? 'ئومۇمىي سېتىۋېلىشىڭىز' : lang === 'ar' ? 'إجمالي المشتريات' : 'Total Spent'}
              </span>
              <span className="text-base sm:text-xl font-black text-white font-mono flex items-center gap-1" dir="ltr">
                <span className="animate-dollar-float text-cyan-400">$</span>
                <span>{userSpent.toFixed(2)}</span>
              </span>
            </div>

            <div className={`p-3 sm:p-3.5 rounded-2xl bg-[#06172a]/90 border border-slate-800 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-[10px] sm:text-xs text-slate-400 block mb-1 font-alkatip">
                {lang === 'ug' ? 'دەرىجە تەرتىپى' : lang === 'ar' ? 'المستوى' : 'Level Rank'}
              </span>
              <span className="text-base sm:text-xl font-black text-white font-mono">
                {safeTierIndex + 1} / 5
              </span>
            </div>
          </div>

          {/* Progress to Next Level Section */}
          <div className="p-4 rounded-2xl bg-[#041324]/80 border border-slate-800/90 space-y-2.5 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold font-alkatip">
                {lang === 'ug' ? 'كېيىنكى دەرىجىگە ئىلگىرىلەش' : lang === 'ar' ? 'التقدم نحو المستوى التالي' : 'Next Tier Progress'}
              </span>
              <span className="text-cyan-400 font-alkatip text-[11px] font-bold">
                {nextTier
                  ? (lang === 'ug' ? `${nextTier.name} گە قاراپ` : lang === 'ar' ? `نحو ${nextTier.name}` : `Toward ${nextTier.name}`)
                  : (lang === 'ug' ? 'ئەڭ يۇقىرى دەرىجە' : lang === 'ar' ? 'أعلى مستوى' : 'Top Level Reached')}
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 shadow-sm transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-alkatip text-slate-400">
              <span className="flex items-center gap-1">
                <span>{lang === 'ug' ? 'خەجلىگىنىڭىز:' : lang === 'ar' ? 'المبلغ المنفق:' : 'Spent:'}</span>
                <span className="font-mono font-bold text-cyan-400 flex items-center gap-0.5" dir="ltr">
                  <span className="animate-dollar-float text-cyan-400">$</span>
                  <span>{userSpent.toFixed(2)}</span>
                </span>
              </span>
              {nextTier ? (
                <span className="text-cyan-300 font-bold flex items-center gap-1">
                  <span>{lang === 'ug' ? `${nextTier.name} گە ئۆرلەشكە يەنە` : lang === 'ar' ? `المتبقي لترقية ${nextTier.name}:` : `Remaining for ${nextTier.name}:`}</span>
                  <span className="font-mono font-extrabold text-cyan-400 flex items-center gap-0.5" dir="ltr">
                    <span className="animate-dollar-float text-cyan-400">$</span>
                    <span>{remainingForNext.toFixed(2)}</span>
                  </span>
                </span>
              ) : (
                <span className="text-amber-400 font-bold">
                  {lang === 'ug' ? '★ سىز ئەڭ يۇقىرى VIP ئەزا!' : '★ Top VIP Member!'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3 Advantage Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-4 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-cyan-500/30 transition ${isRTL ? 'text-right' : 'text-left'} space-y-2`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">
              {lang === 'ug' ? 'ئاپتوماتىك دەرىجە ئۆرلەش' : lang === 'ar' ? 'ترقية تلقائية' : 'Auto Tier Upgrade'}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'ug'
                ? 'قولدا تەلەپ قىلىش ھاجەتسىز: سېتىۋېلىش سوممىڭىزغا ئاساسەن دەرىجە ئۆسىدۇ.'
                : lang === 'ar'
                ? 'تتم الترقية تلقائياً فور وصولك للحد المطلوب من المشتريات.'
                : 'No manual request needed: level updates automatically based on spending.'}
            </p>
          </div>

          <div className={`p-4 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-cyan-500/30 transition ${isRTL ? 'text-right' : 'text-left'} space-y-2`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">
              {lang === 'ug' ? 'بىۋاسىتە نەق ئېتىبار' : lang === 'ar' ? 'خصم فوري مباشر' : 'Instant Direct Discounts'}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'ug'
                ? 'ئەزالىق ئېتىبارىڭىز سېتىۋېلىشتا دەرھال ئاپتوماتىك كېمەيتىپ ھېسابلىنىدۇ.'
                : lang === 'ar'
                ? 'يتم تطبيق الخصم فوراً وبشكل تلقائي عند إتمام أي طلب.'
                : 'Your membership discount is deducted automatically during checkout.'}
            </p>
          </div>

          <div className={`p-4 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-cyan-500/30 transition ${isRTL ? 'text-right' : 'text-left'} space-y-2`}>
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">
              {lang === 'ug' ? 'ئۈزلۈكسىز ئاشىدىغان ئىمتىياز' : lang === 'ar' ? 'مزايا متزايدة' : 'Growing Privileges'}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'ug'
                ? 'ھەر بىر يۇقىرى دەرىجە دۇكان ئىچىدە تېخىمۇ كۆپ قىممەت ۋە پەۋقۇلئاددە باھا ئېلىپ كېلىدۇ.'
                : lang === 'ar'
                ? 'كل مستوى أعلى يمنحك مزايا وأسعاراً استثنائية في المتجر.'
                : 'Every higher tier brings bigger value and exclusive member pricing.'}
            </p>
          </div>
        </div>

        {/* Section Header: Membership Tiers */}
        <div className="pt-2 flex items-center justify-between pb-1">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="font-ukij text-lg sm:text-xl font-bold text-white">
              {lang === 'ug' ? 'ئەزالىق دەرىجىلىرى' : lang === 'ar' ? 'مستويات العضوية' : 'Membership Tiers'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'ug'
                ? 'ئومۇمىي سېتىۋېلىش سوممىڭىزغا ئاساسەن ئېچىلغان دەرىجىلەر'
                : lang === 'ar'
                ? 'المستويات المتاحة حسب إجمالي مبالغ المشتريات'
                : 'Available tiers unlocked based on total spend'}
            </p>
          </div>
        </div>

        {/* 5 Membership Tier Rows */}
        <div className="space-y-3">
          {vipTiers.map((tier) => {
            const isActive = tier.isCurrent;

            return (
              <div
                key={tier.id}
                className={`p-4 sm:p-5 rounded-2xl bg-[#07192d] border transition-all flex items-center justify-between ${
                  isActive
                    ? 'border-cyan-500/60 shadow-xl shadow-cyan-950/40 relative'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div>
                  {isActive ? (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 transition">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-600 flex items-center justify-center font-bold">
                      <span>—</span>
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-3 sm:gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold font-alkatip">
                          {t('currentLevel')}
                        </span>
                      )}
                      <h4 className="font-bold text-sm sm:text-base text-white font-mono">
                        {tier.name}
                      </h4>
                    </div>

                    <span className="text-[11px] text-slate-400 block font-alkatip">
                      {lang === 'ug' ? (
                        <>ئومۇمىي سېتىۋېلىش <span className="font-mono text-slate-300 font-bold">${tier.minSpend.toFixed(2)}</span> غا يەتكەندە ئېچىلىدۇ</>
                      ) : lang === 'ar' ? (
                        <>يفتح عند بلوغ المشتريات <span className="font-mono text-slate-300 font-bold">${tier.minSpend.toFixed(2)}</span></>
                      ) : (
                        <>Unlocks at <span className="font-mono text-slate-300 font-bold">${tier.minSpend.toFixed(2)}</span> total spend</>
                      )}
                    </span>

                    <span className="text-xs font-bold text-cyan-400 font-alkatip block mt-1" dir="ltr">
                      {tier.discount}% {lang === 'ug' ? 'ئېتىبار' : lang === 'ar' ? 'خصم' : 'Discount'}
                    </span>
                  </div>

                  {renderBadge(tier.colorScheme, tier.name, 'md')}

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
