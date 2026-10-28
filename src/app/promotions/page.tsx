'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import SideDrawer from '@/components/SideDrawer';
import AuthModal from '@/components/AuthModal';
import CheckoutModal from '@/components/CheckoutModal';
import { useLanguage } from '@/context/LanguageContext';
import { SERVICES_DATA, ServiceItem } from '@/lib/data';
import { ActivePromotion } from '@/lib/promotionsDb';
import { formatSmartPrice } from '@/lib/formatMoney';
import { getCachedBalance, getCachedUser, logout, type ClientUser } from '@/lib/clientAuth';
import {
  Flame,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  RefreshCw,
  Tag,
  ShieldCheck,
  Percent,
} from 'lucide-react';

export default function PromotionsPage() {
  const router = useRouter();
  const { lang, isRTL, t } = useLanguage();

  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>(SERVICES_DATA);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null);

  // Modals & Navigation state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeModalService, setActiveModalService] = useState<ServiceItem | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);

  // Global Grand VIP Countdown Timer state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  // Refresh user balance & profile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserBalance(getCachedBalance());
      setCurrentUser(getCachedUser());
    }
  }, []);

  // Fetch full services catalog to link with promotions
  useEffect(() => {
    fetch(`/api/catalog?_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.services) && data.services.length > 0) {
          setServices(data.services);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch active promotions
  const fetchPromos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/promotions?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.promotions)) {
          setPromotions(data.promotions);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch promotions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let bc: BroadcastChannel | null = null;

    fetchPromos();
    const interval = setInterval(fetchPromos, 15_000);

    try {
      bc = new BroadcastChannel('autocash_promotions_channel');
      bc.onmessage = () => {
        if (mounted) fetchPromos();
      };
    } catch {}

    return () => {
      mounted = false;
      clearInterval(interval);
      try {
        bc?.close();
      } catch {}
    };
  }, [fetchPromos]);

  // Find earliest promotion deadline for Grand VIP Countdown
  const targetEndTimestamp = useMemo(() => {
    if (promotions.length === 0) return 0;
    const timestamps = promotions
      .map((p) => new Date(p.endsAt).getTime())
      .filter((t) => t > Date.now());
    return timestamps.length > 0 ? Math.min(...timestamps) : 0;
  }, [promotions]);

  // Live second-by-second countdown for the Grand VIP clock
  useEffect(() => {
    if (!targetEndTimestamp) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = targetEndTimestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        setPromotions((prev) => prev.filter((p) => new Date(p.endsAt).getTime() > Date.now()));
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [targetEndTimestamp]);

  const pad = (n: number) => String(n).padStart(2, '0');

  // Format per-card remaining time
  const getCardTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Open product checkout modal
  const handleOpenPromoCheckout = (promo: ActivePromotion) => {
    // 1. Check if matched service exists
    let matchedService = services.find((s) => s.id === promo.serviceId);
    if (!matchedService) {
      // Create lightweight synthetic service item so modal works flawlessly
      matchedService = {
        id: promo.serviceId,
        name: promo.serviceName,
        category: promo.category as any,
        icon: 'Sparkles',
        image: promo.serviceImage || '/images/default_app.png',
        description: promo.packageTitle,
        packages: [
          {
            id: promo.packageId,
            title: promo.packageTitle,
            price: promo.promoPrice,
            originalPrice: promo.regularPrice,
            costPrice: promo.costPrice,
            providerProductId: promo.providerProductId,
          },
        ],
      };
    }
    setSelectedPackageId(promo.packageId);
    setActiveModalService(matchedService);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setUserBalance(0);
    setIsDrawerOpen(false);
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#040d1a] via-[#071527] to-[#030914] text-slate-100 font-alkatip pb-28 select-none"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Global Navbar */}
      <Navbar
        balance={userBalance}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        user={currentUser}
      />

      {/* Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={currentUser}
        onOpenAuth={() => {
          setIsDrawerOpen(false);
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          setUserBalance(getCachedBalance());
          setCurrentUser(getCachedUser());
        }}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-5 space-y-4 sm:space-y-6">
        {/* Top Header Bar with Back Button */}
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white hover:border-amber-400 transition-colors shadow-sm active:scale-95"
              title={lang === 'ug' ? 'قايتىش' : 'Back'}
            >
              <BackIcon className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-orange-400">
                  {lang === 'ug' ? 'بۈگۈنكى ئالاھىدە پائالىيەتلەر' : 'Today’s Special Flash Deals'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-red-500/40 animate-pulse">
                  FLASH SALE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'ug'
                  ? 'چەكلىك ۋاقىتلىق ئالاھىدە تەننەرخ باھالار — ۋاقتى ئۆتۈپ كەتمەستە ئۈلگۈرۈپ قېلىڭ!'
                  : 'Limited time wholesale prices — buy before the offer expires!'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchPromos}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lang === 'ug' ? 'يېڭىلاش' : 'Refresh'}</span>
          </button>
        </div>

        {/* 🌟 ULTRA-LUXURIOUS GRAND VIP COUNTDOWN CLOCK 🌟 */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-amber-400/60 bg-gradient-to-b from-[#120c02] via-[#091526] to-[#040c17] p-4 sm:p-7 shadow-[0_15px_60px_rgba(245,158,11,0.25)] backdrop-blur-xl">
          {/* Ambient Laser Neon Glows */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300/80 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-right">
            {/* Left / Title & Flame Avatar */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5">
              <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-pulse">
                <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-white fill-amber-100" />
                <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-red-600 border border-white/50 text-[9px] font-black text-white">
                  VIP
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-start text-center sm:text-right">
                <div className="flex items-center gap-2">
                  <span className="text-amber-200 text-base sm:text-lg font-black tracking-wide">
                    {lang === 'ug' ? 'چەكلىك ۋاقىتلىق ئېتىبار قالدۇقى' : 'Flash Sale Countdown'}
                  </span>
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs animate-spin" style={{ animationDuration: '6s' }}>
                    ⏳
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-300/80 mt-1">
                  {lang === 'ug'
                    ? '⚡️ بۈگۈنكى بارلىق ئېتىبارلار مىنۇت-سېكۇنت سانالماقتا — ۋاقتى توشقاندا ئەسلى باھاسىغا قايتىدۇ!'
                    : '⚡️ Real-time countdown: prices will revert to normal once timer hits zero!'}
                </p>
              </div>
            </div>

            {/* Right / Big 3D Digital Flip Cards */}
            {timeLeft ? (
              <div className="flex items-center gap-2.5 sm:gap-4 bg-gradient-to-b from-black/80 via-zinc-950/90 to-black/80 border border-amber-400/50 rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3.5 shadow-[inset_0_2px_10px_rgba(245,158,11,0.2),0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md" dir="ltr">
                {/* Hours Card */}
                <div className="flex flex-col items-center">
                  <div className="relative min-w-[50px] sm:min-w-[68px] h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-b from-stone-900 via-zinc-950 to-black border-2 border-amber-400/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_8px_20px_rgba(0,0,0,0.9)] flex items-center justify-center px-2">
                    <span className="font-mono text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">
                      {pad(timeLeft.hours)}
                    </span>
                    <div className="absolute top-0 inset-x-0 h-px bg-amber-200/70 rounded-t-xl" />
                    <div className="absolute inset-x-0 top-1/2 h-px bg-black/70 pointer-events-none" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-amber-300/90 font-alkatip mt-1.5">
                    {lang === 'ug' ? 'سائەت' : 'HRS'}
                  </span>
                </div>

                {/* Separator */}
                <span className="text-amber-400 font-mono font-black text-xl sm:text-3xl animate-pulse -mt-4">:</span>

                {/* Minutes Card */}
                <div className="flex flex-col items-center">
                  <div className="relative min-w-[50px] sm:min-w-[68px] h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-b from-stone-900 via-zinc-950 to-black border-2 border-amber-400/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_8px_20px_rgba(0,0,0,0.9)] flex items-center justify-center px-2">
                    <span className="font-mono text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">
                      {pad(timeLeft.minutes)}
                    </span>
                    <div className="absolute top-0 inset-x-0 h-px bg-amber-200/70 rounded-t-xl" />
                    <div className="absolute inset-x-0 top-1/2 h-px bg-black/70 pointer-events-none" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-amber-300/90 font-alkatip mt-1.5">
                    {lang === 'ug' ? 'مىنۇت' : 'MIN'}
                  </span>
                </div>

                {/* Separator */}
                <span className="text-amber-400 font-mono font-black text-xl sm:text-3xl animate-pulse -mt-4">:</span>

                {/* Seconds Card */}
                <div className="flex flex-col items-center">
                  <div className="relative min-w-[50px] sm:min-w-[68px] h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-b from-stone-900 via-zinc-950 to-black border-2 border-amber-400/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_8px_20px_rgba(0,0,0,0.9)] flex items-center justify-center px-2">
                    <span className="font-mono text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-orange-400 to-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">
                      {pad(timeLeft.seconds)}
                    </span>
                    <div className="absolute top-0 inset-x-0 h-px bg-amber-200/70 rounded-t-xl" />
                    <div className="absolute inset-x-0 top-1/2 h-px bg-black/70 pointer-events-none" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-amber-300/90 font-alkatip mt-1.5">
                    {lang === 'ug' ? 'سېكۇنت' : 'SEC'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/30 bg-black/50 px-4 py-2 text-amber-300 font-bold text-sm">
                ⏳ {lang === 'ug' ? 'پائالىيەت ۋاقتى ئەڭ يېڭى ھالەتتە' : 'Promotions updated'}
              </div>
            )}
          </div>
        </section>

        {/* 🛒 ENTICING PROMOTIONAL PRODUCT CARDS (Matching Screenshots Exactly) 🛒 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
              <span>
                {lang === 'ug' ? 'چەكلىك ۋاقىتلىق ئېتىبار تاۋارلىرى' : 'Active Flash Sale Products'}
              </span>
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                {promotions.length}
              </span>
            </h2>
            <span className="text-xs text-slate-400">
              {lang === 'ug' ? '1-چىكىش بىلەن ئاپتوماتىك قاچىلىنىدۇ' : 'Auto instant delivery'}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm text-slate-400">
                {lang === 'ug' ? 'پائالىيەتلەر يۈكلىنىۋاتىدۇ...' : 'Loading flash deals...'}
              </p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-slate-800 bg-slate-900/60 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600" />
              <h3 className="text-base font-bold text-slate-300">
                {lang === 'ug' ? 'ھازىرچە ئاكتىپ پائالىيەت يوق' : 'No active flash deals currently'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {lang === 'ug'
                  ? 'يېڭى ئېتىبار باھالىق پائالىيەتلەر قوشۇلغاندا بۇ يەردە كۆرۈنىدۇ.'
                  : 'New discounted items will automatically appear here once launched.'}
              </p>
              <Link
                href="/"
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                {lang === 'ug' ? 'باشبەتكە قايتىش' : 'Back to Home'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promotions.map((promo) => {
                const matchedService = services.find((s) => s.id === promo.serviceId);
                const iconSrc = promo.serviceImage || matchedService?.image || '/images/default_app.png';
                const cardTime = getCardTimeRemaining(promo.endsAt);
                const isExpired = !cardTime;
                const savings = promo.regularPrice > promo.promoPrice ? promo.regularPrice - promo.promoPrice : 0;

                return (
                  <div
                    key={promo.id}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl ${
                      isExpired
                        ? 'border-slate-800 bg-slate-900/40 opacity-70'
                        : 'border-slate-800/90 hover:border-amber-500/50 bg-gradient-to-b from-[#0c182b] to-[#081220] hover:shadow-[0_12px_35px_rgba(245,158,11,0.18)] hover:-translate-y-0.5'
                    } p-4 sm:p-5 flex flex-col justify-between`}
                  >
                    {/* Top Header: Service Title & Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-700 bg-slate-800 shadow-md">
                          <Image
                            src={iconSrc}
                            alt={promo.serviceName}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-black text-white truncate" title={promo.serviceName}>
                            {promo.serviceName}
                          </h3>
                          <p className="text-xs text-slate-400 truncate mt-0.5" title={promo.packageTitle}>
                            {promo.packageTitle}
                          </p>
                        </div>
                      </div>

                      {/* Status / Discount Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isExpired ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-bold">
                            {lang === 'ug' ? 'ۋاقىتلىق توختىتىلدى' : 'Expired'}
                          </span>
                        ) : (
                          <>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[11px] font-black">
                              {lang === 'ug' ? 'پائالىيەت باھاسى' : 'Deal Price'}
                            </span>
                            {promo.discountPercent > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black shadow-sm" dir="ltr">
                                -%{promo.discountPercent}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pricing Comparison Container: Two Side-by-Side Boxes as in Screenshots */}
                    <div className="grid grid-cols-2 gap-2.5 my-3">
                      {/* Box 1: Original Price */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-center flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {lang === 'ug' ? 'ئەسلى باھاسى:' : 'Original:'}
                        </span>
                        <span className="text-sm sm:text-base text-slate-400 line-through font-mono font-bold mt-0.5" dir="ltr">
                          ${formatSmartPrice(promo.regularPrice)}
                        </span>
                      </div>

                      {/* Box 2: Promo Price (Magnetic Eye-Popping Green/Gold) */}
                      <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 to-slate-900/80 p-2.5 text-center flex flex-col justify-center shadow-[inset_0_1px_3px_rgba(16,185,129,0.2)]">
                        <span className="text-[11px] text-emerald-400 font-bold">
                          {lang === 'ug' ? 'پائالىيەت باھاسى:' : 'Promo Price:'}
                        </span>
                        <span className="text-base sm:text-xl font-black text-emerald-300 font-mono mt-0.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" dir="ltr">
                          ${formatSmartPrice(promo.promoPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Deal Remaining Time & Savings Pill */}
                    <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-800/80 mb-3 font-mono">
                      {savings > 0 && (
                        <span className="text-emerald-400/90 font-bold flex items-center gap-1 font-alkatip">
                          <span>✨</span>
                          <span>{lang === 'ug' ? `تېجەش: $${formatSmartPrice(savings)}` : `Save: $${formatSmartPrice(savings)}`}</span>
                        </span>
                      )}

                      {cardTime && (
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold mr-auto">
                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span className="font-alkatip text-[11px] text-slate-400">
                            {lang === 'ug' ? 'قالغان ۋاقىت:' : 'Time Left:'}
                          </span>
                          <span dir="ltr">{cardTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Big Action Button (Exact replica of user screenshot: [ كىرىپ سېتىۋېلىش ]) */}
                    {isExpired ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-500 font-bold text-xs sm:text-sm cursor-not-allowed"
                      >
                        {lang === 'ug' ? 'ھازىر سېتىۋالغىلى بولمايدۇ' : 'Currently Unavailable'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenPromoCheckout(promo)}
                        className="group/btn relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:from-indigo-500 hover:via-purple-500 hover:to-amber-400 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-indigo-600/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {/* Shimmer light bar across button */}
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 pointer-events-none" />
                        <Zap className="w-4 h-4 text-amber-200 fill-amber-200 group-hover/btn:scale-110 transition-transform" />
                        <span>{lang === 'ug' ? 'كىرىپ سېتىۋېلىش' : 'Buy Now'}</span>
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Security & Reliability Trust Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-200">{lang === 'ug' ? '100% كاپالەتلىك' : '100% Guaranteed'}</h4>
              <p className="text-[10px] text-slate-400">{lang === 'ug' ? 'كود دەرھال ئەۋەتىلىدۇ' : 'Instant auto-delivery'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-200">{lang === 'ug' ? 'ئەڭ ئەرزان تەننەرخ' : 'Wholesale Rates'}</h4>
              <p className="text-[10px] text-slate-400">{lang === 'ug' ? 'چەكلىك مىقداردا' : 'Direct from server'}</p>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
            <Percent className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-200">{lang === 'ug' ? 'ئالاھىدە ئېتىبار' : 'VIP Discount'}</h4>
              <p className="text-[10px] text-slate-400">{lang === 'ug' ? 'تېز سېتىۋېلىڭ' : 'Limited time only'}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Product Checkout Modal */}
      {activeModalService && (
        <CheckoutModal
          service={activeModalService}
          user={currentUser}
          initialPackageId={selectedPackageId}
          onClose={() => {
            setActiveModalService(null);
            setSelectedPackageId(undefined);
          }}
          onSuccess={() => {
            setActiveModalService(null);
            setSelectedPackageId(undefined);
            setUserBalance(getCachedBalance());
          }}
          onOpenAuth={() => {
            setActiveModalService(null);
            setIsAuthOpen(true);
          }}
        />
      )}

      {/* Global Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
