'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SGCSubpageLayout from '@/components/SGCSubpageLayout';
import AuthModal from '@/components/AuthModal';
import CheckoutModal from '@/components/CheckoutModal';
import { useLanguage } from '@/context/LanguageContext';
import { SERVICES_DATA, ServiceItem } from '@/lib/data';
import { ActivePromotion } from '@/lib/promotionsDb';
import { formatSmartPrice, extractCleanPackageQuantity } from '@/lib/formatMoney';
import { getCachedBalance, getCachedUser, logout, type ClientUser } from '@/lib/clientAuth';
import FlipCountdownClock from '@/components/FlipCountdownClock';
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
    <SGCSubpageLayout
      title={lang === 'ug' ? 'بۈگۈنكى ئالاھىدە پائالىيەتلەر' : 'Today’s Special Flash Deals'}
      subtitle={lang === 'ug' ? 'چەكلىك ۋاقىتلىق ئالاھىدە تەننەرخ باھالار — ۋاقتى ئۆتۈپ كەتمەستە ئۈلگۈرۈپ قېلىڭ!' : 'Limited time wholesale prices — buy before the offer expires!'}
      headerActions={
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-red-500/30 animate-pulse">
            FLASH SALE
          </span>
          <button
            type="button"
            onClick={fetchPromos}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition cursor-pointer"
            title="يېڭىلاش"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lang === 'ug' ? 'يېڭىلاش' : 'Refresh'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 🌟 ULTRA-LUXURIOUS GRAND VIP COUNTDOWN CLOCK 🌟 */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-amber-400/60 dark:border-amber-400/40 bg-white dark:bg-[#101726] p-4 sm:p-6 shadow-sm">
          {/* Ambient Laser Neon Glows */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600/10 dark:bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-right">
            {/* Left / Title & Flame Avatar */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5">
              <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 shadow-md shadow-amber-500/30 animate-nav-pill-glow">
                <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-white fill-amber-100 animate-icon-sparkle drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-red-600 border border-white/50 text-[9px] font-black text-white animate-pulse">
                  VIP
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-start text-center sm:text-right">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 dark:text-amber-200 text-base sm:text-lg font-black tracking-wide">
                    {lang === 'ug' ? 'چەكلىك ۋاقىتلىق ئېتىبار قالدۇقى' : 'Flash Sale Countdown'}
                  </span>
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-300 text-xs animate-spin" style={{ animationDuration: '6s' }}>
                    ⏳
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-amber-300/80 mt-1 font-alkatip">
                  {lang === 'ug'
                    ? '⚡️ بۈگۈنكى بارلىق ئېتىبارلار مىنۇت-سېكۇنت سانالماقتا — ۋاقتى توشقاندا ئەسلى باھاسىغا قايتىدۇ!'
                    : '⚡️ Real-time countdown: prices will revert to normal once timer hits zero!'}
                </p>
              </div>
            </div>

            {/* Right / Luxury 3D Mechanical Split-Flap Countdown Clock */}
            {timeLeft ? (
              <div className="relative p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-100/90 dark:bg-black/90 border-2 border-amber-500/70 dark:border-amber-400/60 shadow-[0_12px_36px_rgba(245,158,11,0.25)] animate-flame-glow-box">
                <FlipCountdownClock
                  hours={timeLeft.hours}
                  minutes={timeLeft.minutes}
                  seconds={timeLeft.seconds}
                  lang={lang}
                  size="lg"
                  showLabels={true}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-600 dark:text-amber-300 font-bold text-sm">
                ⏳ {lang === 'ug' ? 'پائالىيەت ۋاقتى ئەڭ يېڭى ھالەتتە' : 'Promotions updated'}
              </div>
            )}
          </div>
        </section>

        {/* 🛒 ENTICING PROMOTIONAL PRODUCT CARDS 🛒 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-5 rounded-full bg-amber-500 shadow-md shadow-amber-500/30" />
              <span>
                {lang === 'ug' ? 'چەكلىك ۋاقىتلىق ئېتىبار تاۋارلىرى' : 'Active Flash Sale Products'}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                {promotions.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ug' ? '1-چىكىش بىلەن ئاپتوماتىك قاچىلىنىدۇ' : 'Auto instant delivery'}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {lang === 'ug' ? 'پائالىيەتلەر يۈكلىنىۋاتىدۇ...' : 'Loading flash deals...'}
              </p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-[#101726] text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-400 dark:text-slate-600" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ug' ? 'ھازىرچە ئاكتىپ پائالىيەت يوق' : 'No active flash deals currently'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {lang === 'ug'
                  ? 'يېڭى ئېتىبار باھالىق پائالىيەتلەر قوشۇلغاندا بۇ يەردە كۆرۈنىدۇ.'
                  : 'New discounted items will automatically appear here once launched.'}
              </p>
              <Link
                href="/"
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                {lang === 'ug' ? 'باشبەتكە قايتىش' : 'Back to Home'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promotions.map((promo) => {
                const matchedService = services.find((s) => s.id === promo.serviceId);
                const iconSrc = promo.serviceImage || matchedService?.image || '/brand_logo.png';
                const cardTime = getCardTimeRemaining(promo.endsAt);
                const isExpired = !cardTime;
                const savings = promo.regularPrice > promo.promoPrice ? promo.regularPrice - promo.promoPrice : 0;

                return (
                  <div
                    key={promo.id}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                      isExpired
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 opacity-70'
                        : 'border-slate-200/90 dark:border-white/10 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 bg-white dark:bg-[#101726] hover:shadow-lg hover:-translate-y-0.5'
                    } p-4 sm:p-5 flex flex-col justify-between shadow-xs`}
                  >
                    {/* Top Header: Service Title & Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 shadow-sm">
                          <Image
                            src={iconSrc}
                            alt={promo.serviceName}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate" title={promo.serviceName}>
                            {promo.serviceName}
                          </h3>
                          <div className="mt-1 flex items-center">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-black text-xs sm:text-sm tracking-wide shadow-xs"
                              dir="ltr"
                              title={promo.packageTitle}
                            >
                              ⚡ {extractCleanPackageQuantity(promo.packageTitle)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status / Discount Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isExpired ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 text-[11px] font-bold">
                            {lang === 'ug' ? 'ۋاقىتلىق توختىتىلدى' : 'Expired'}
                          </span>
                        ) : (
                          <>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-700 dark:text-amber-300 text-[11px] font-black">
                              {lang === 'ug' ? 'پائالىيەت باھاسى' : 'Deal Price'}
                            </span>
                            {promo.discountPercent > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black shadow-xs" dir="ltr">
                                -%{promo.discountPercent}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pricing Comparison Container: Two Side-by-Side Boxes */}
                    <div className="grid grid-cols-2 gap-2.5 my-3">
                      {/* Box 1: Original Price */}
                      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-2.5 text-center flex flex-col justify-center">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {lang === 'ug' ? 'ئەسلى باھاسى:' : 'Original:'}
                        </span>
                        <span className="text-sm sm:text-base text-slate-400 line-through font-mono font-bold mt-0.5" dir="ltr">
                          ${formatSmartPrice(promo.regularPrice)}
                        </span>
                      </div>

                      {/* Box 2: Promo Price (Emerald Green) */}
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 text-center flex flex-col justify-center shadow-xs">
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                          {lang === 'ug' ? 'پائالىيەت باھاسى:' : 'Promo Price:'}
                        </span>
                        <span className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-300 font-mono mt-0.5" dir="ltr">
                          ${formatSmartPrice(promo.promoPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Deal Remaining Time & Savings Pill */}
                    <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-100 dark:border-white/10 mb-3 font-mono">
                      {savings > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 font-alkatip">
                          <span>✨</span>
                          <span>{lang === 'ug' ? `تېجەش: $${formatSmartPrice(savings)}` : `Save: $${formatSmartPrice(savings)}`}</span>
                        </span>
                      )}

                      {cardTime && (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300 font-bold mr-auto">
                          <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span className="font-alkatip text-[11px] text-slate-500 dark:text-slate-400">
                            {lang === 'ug' ? 'قالغان ۋاقىت:' : 'Time Left:'}
                          </span>
                          <span dir="ltr">{cardTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Big Action Button */}
                    {isExpired ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed"
                      >
                        {lang === 'ug' ? 'ھازىر سېتىۋالغىلى بولمايدۇ' : 'Currently Unavailable'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenPromoCheckout(promo)}
                        className="group/btn relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#059669] via-[#10b981] to-[#047857] hover:brightness-105 py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-emerald-600/25 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#101726] p-3 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{lang === 'ug' ? '100% كاپالەتلىك' : '100% Guaranteed'}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{lang === 'ug' ? 'كود دەرھال ئەۋەتىلىدۇ' : 'Instant auto-delivery'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#101726] p-3 shadow-xs">
            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{lang === 'ug' ? 'ئەڭ ئەرزان تەننەرخ' : 'Wholesale Rates'}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{lang === 'ug' ? 'چەكلىك مىقداردا' : 'Direct from server'}</p>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center gap-2 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#101726] p-3 shadow-xs">
            <Percent className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{lang === 'ug' ? 'ئالاھىدە ئېتىبار' : 'VIP Discount'}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{lang === 'ug' ? 'تېز سېتىۋېلىڭ' : 'Limited time only'}</p>
            </div>
          </div>
        </div>
      </div>

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

      {/* Auth Modal for Unauthenticated Users */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          setUserBalance(getCachedBalance());
          setCurrentUser(getCachedUser());
        }}
      />
    </SGCSubpageLayout>
  );
}
