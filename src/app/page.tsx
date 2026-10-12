'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import PromoCarousel from '@/components/PromoCarousel';
import DynamicIcon from '@/components/DynamicIcon';
import CheckoutModal from '@/components/CheckoutModal';
import OrdersList from '@/components/OrdersList';
import WelcomeSplash from '@/components/WelcomeSplash';
import AuthModal from '@/components/AuthModal';
import SideDrawer from '@/components/SideDrawer';
import { useLanguage } from '@/context/LanguageContext';
import { CATEGORIES_9, SERVICES_DATA, ServiceItem } from '@/lib/data';
import type { Order } from '@/lib/orders';
import {
  Search,
  Zap,
  Wallet,
  Crown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// In-memory module flag: resets only on full browser reload (F5 / new session), preserved during client-side navigation
let hasShownSplashInCurrentSession = false;

export default function HomePage() {
  const {
    lang,
    t,
    isRTL,
    getCategoryName,
    getCategoryCount,
    translateBadge,
  } = useLanguage();

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalService, setActiveModalService] = useState<ServiceItem | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0.0);

  // Show splash ONLY on full page reload / initial load, NOT on client-side router navigation
  const [showSplash, setShowSplash] = useState(!hasShownSplashInCurrentSession);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string; balance?: number } | null>(null);

  useEffect(() => {
    hasShownSplashInCurrentSession = true;
    fetchOrders();

    const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
    const savedEmail = localStorage.getItem('autocash_email');
    if (isLoggedIn === 'true' && savedEmail) {
      fetch(`/api/auth/me?email=${encodeURIComponent(savedEmail)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            setUserBalance(data.user.balance || 0.0);
          }
        })
        .catch((e) => console.error(e));
    } else {
      setCurrentUser(null);
      setUserBalance(0.0);
    }
  }, []);

  const handleDismissSplash = () => {
    hasShownSplashInCurrentSession = true;
    setShowSplash(false);
  };

  const handleLogout = () => {
    localStorage.setItem('autocash_is_logged_in', 'false');
    localStorage.removeItem('autocash_username');
    localStorage.removeItem('autocash_email');
    localStorage.removeItem('autocash_userId');
    setCurrentUser(null);
    setUserBalance(0.0);
  };

  const handleAuthSuccess = (usr: { id?: string; name: string; email: string; balance?: number }) => {
    localStorage.setItem('autocash_is_logged_in', 'true');
    localStorage.setItem('autocash_username', usr.name);
    localStorage.setItem('autocash_email', usr.email);
    if (usr.id) localStorage.setItem('autocash_userId', usr.id);
    setCurrentUser(usr);
    setUserBalance(usr.balance ?? 0.0);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrderSuccess = (newOrder: Order, newBalance?: number) => {
    setOrders((prev) => [newOrder, ...prev]);
    if (newBalance !== undefined) {
      setUserBalance(newBalance);
    } else {
      const orderAmount = Number(newOrder.amount ?? (newOrder as any).price ?? 0);
      setUserBalance((prev) => Math.max(0, Math.round((prev - orderAmount) * 100) / 100));
    }
  };

  // Only open products when a category is explicitly clicked, or searching
  const isProductsOpen = selectedCat !== null || searchQuery.trim() !== '';

  const filteredServices = SERVICES_DATA.filter((service) => {
    const matchCat = selectedCat === null || service.category === selectedCat;
    const matchSearch =
      searchQuery.trim() === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCategoryObj = CATEGORIES_9.find((c) => c.id === selectedCat);

  return (
    <div
      className={`min-h-screen bg-[#040d1a] text-slate-100 flex flex-col pb-20 md:pb-8 selection:bg-amber-400 selection:text-slate-950 font-alkatip ${
        isRTL ? 'text-right' : 'text-left'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. Welcome Splash Screen */}
      {showSplash && <WelcomeSplash onEnter={handleDismissSplash} />}

      {/* 2. Side Drawer (Triggered by Menu button or AUTO CASH Logo) */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* 3. Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* 4. Navbar with Menu, Logo & Drawer Hook (Safe area at top) */}
      <Navbar
        balance={userBalance}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        user={currentUser}
      />

      {/* 5. Live Golden Ticker - Refined Rounded Card */}
      <div className="max-w-7xl mx-3.5 sm:mx-auto my-2.5 rounded-2xl bg-[#051322]/90 border border-amber-500/25 py-2 px-3 sm:px-4 text-[11px] sm:text-xs overflow-hidden select-none shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3 w-full">
          {/* Fixed Badge */}
          <div className="flex items-center gap-1.5 text-amber-300 font-black shrink-0 gold-badge px-3 py-1 rounded-full font-alkatip text-[10px] sm:text-xs z-10 shadow-md">
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-400 animate-zap-wiggle" />
            <span>
              {lang === 'ug'
                ? 'AUTO CASH نەق مەيدان:'
                : lang === 'ar'
                ? 'AUTO CASH مباشر:'
                : 'AUTO CASH Live:'}
            </span>
          </div>

          {/* Continuous Marquee */}
          <div className="overflow-hidden whitespace-nowrap flex-1 relative">
            <div className="animate-marquee-uyghur flex items-center gap-12 font-alkatip text-[11px] sm:text-xs text-amber-100/90 tracking-wide">
              {lang === 'ug' ? (
                <>
                  <div className="flex items-center gap-8 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">🌟</span>
                      <span>AUTO CASH پىلاتفورمىسىغا كەلگەنلىكىڭىزنى قىزغىن قارشى ئالىمىز!</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-cyan-400">⚡</span>
                      <span>بارلىق ئويۇن، ئەپ، سۈنئىي ئەقىل ۋە مەۋھۇم نومۇرلارغا دەرھال پۇل قاچىلاش مۇلازىمىتى ئاكتىپ.</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-400">💎</span>
                      <span>شامكەش (Sham Cash) ۋە USDT ئارقىلىق تېز ئاپتوماتىك دەلىللەش كاپالىتى.</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-8 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">🌟</span>
                      <span>AUTO CASH پىلاتفورمىسىغا كەلگەنلىكىڭىزنى قىزغىن قارشى ئالىمىز!</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-cyan-400">⚡</span>
                      <span>بارلىق ئويۇن، ئەپ، سۈنئىي ئەقىل ۋە مەۋھۇم نومۇرلارغا دەرھال پۇل قاچىلاش مۇلازىمىتى ئاكتىپ.</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-400">💎</span>
                      <span>شامكەش (Sham Cash) ۋە USDT ئارقىلىق تېز ئاپتوماتىك دەلىللەش كاپالىتى.</span>
                    </span>
                  </div>
                </>
              ) : lang === 'ar' ? (
                <>
                  <div className="flex items-center gap-8 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">🌟</span>
                      <span>أهلاً بكم في منصة AUTO CASH لشحن الألعاب والتطبيقات!</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-cyan-400">⚡</span>
                      <span>شحن فوري ومباشر لجميع الألعاب والاشتراكات والأرقام الوهمية.</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-400">💎</span>
                      <span>دفع آمن وسريع عبر شام كاش (Sham Cash) و USDT.</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-8 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">🌟</span>
                      <span>أهلاً بكم في منصة AUTO CASH لشحن الألعاب والتطبيقات!</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-cyan-400">⚡</span>
                      <span>شحن فوري ومباشر لجميع الألعاب والاشتراكات والأرقام الوهمية.</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-400">💎</span>
                      <span>دفع آمن وسريع عبر شام كاش (Sham Cash) و USDT.</span>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-8 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">🌟</span>
                      <span>Welcome to AUTO CASH Digital Hub!</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-cyan-400">⚡</span>
                      <span>Instant top-up for games, apps, AI subscriptions, and virtual numbers.</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-400">💎</span>
                      <span>Fast & secure payment via Sham Cash and USDT.</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-8 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">🌟</span>
                      <span>Welcome to AUTO CASH Digital Hub!</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-cyan-400">⚡</span>
                      <span>Instant top-up for games, apps, AI subscriptions, and virtual numbers.</span>
                    </span>
                    <span className="text-amber-500/50">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-400">💎</span>
                      <span>Fast & secure payment via Sham Cash and USDT.</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 w-full flex-1 space-y-6 sm:space-y-7">
        {/* Golden Shimmer Hero Card */}
        <div className="rounded-3xl p-4 sm:p-7 bg-gradient-to-tr from-[#061424] via-[#0b1f38] to-[#0d2745] border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full gold-badge text-[11px] sm:text-xs font-semibold font-alkatip">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>
                  {lang === 'ug'
                    ? 'AUTO CASH ئاپتۇماتىك پۇل قاچىلاش سېستىمىسى'
                    : lang === 'ar'
                    ? 'نظام AUTO CASH للشحن التلقائي السريع'
                    : 'AUTO CASH Automated Instant Top-up'}
                </span>
              </div>
              <h1 className="font-ukij text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent gold-text-glow">
                  AUTO CASH
                </span>{' '}
                —{' '}
                {lang === 'ug'
                  ? 'ئەپ، ئويۇن ۋە كارتىلار مەركىزى'
                  : lang === 'ar'
                  ? 'مركز شحن الألعاب والتطبيقات والبطاقات'
                  : 'Games, Apps & Gift Cards Hub'}
              </h1>
              <p className="font-alkatip text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
                {t('welcomeSubtitle')}
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
              <Link
                href="/deposit"
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full gold-shimmer-btn animate-deposit-btn text-xs sm:text-sm font-black transition-all font-alkatip text-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="animate-wallet-wiggle shrink-0">
                  <Wallet className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-950 flex-shrink-0" />
                </span>
                <span>{t('addFunds')}</span>
              </Link>
              <Link
                href="/membership"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 text-amber-200 font-bold text-xs sm:text-sm transition-all font-alkatip text-center hover:scale-105 active:scale-95"
              >
                <Crown className="w-4 h-4 text-amber-400 flex-shrink-0 animate-crown-wiggle" />
                <span>{t('vipMembership')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Rotational Promo Banner */}
        <section>
          <PromoCarousel onSelectCategory={(catId) => setSelectedCat(catId)} />
        </section>

        {/* Global Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={`w-full bg-[#08182b] border border-amber-500/35 rounded-2xl ${
              isRTL ? 'pl-11 pr-4 text-right' : 'pr-11 pl-4 text-left'
            } py-3 text-xs sm:text-sm text-white placeholder-amber-200/40 shadow-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition font-alkatip`}
          />
          <Search className={`w-5 h-5 text-amber-400 absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5`} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-3.5 text-slate-400 hover:text-white`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories vs Products View */}
        {!isProductsOpen ? (
          /* View 1: Categories Grid */
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="font-ukij text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
                <span>
                  {t('categoriesTitle')} ({CATEGORIES_9.length})
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5">
              {CATEGORIES_9.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`relative overflow-hidden p-3 rounded-2xl ${
                    isRTL ? 'text-right' : 'text-left'
                  } transition-all flex flex-col justify-between cursor-pointer group h-28 sm:h-32 gold-card-normal hover:scale-[1.03]`}
                >
                  {/* Category Background Image */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={cat.image}
                      alt={getCategoryName(cat.id, cat.name)}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 brightness-95 contrast-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030a14]/90 via-[#030a14]/40 to-transparent" />
                  </div>

                  <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all bg-slate-950/85 backdrop-blur-md border border-amber-400/50 text-amber-300 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-slate-950 shadow-md animate-cat-icon">
                      <DynamicIcon name={cat.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] bg-slate-950/85 backdrop-blur-md border border-amber-400/50 text-amber-300 font-bold px-2 py-0.5 rounded-full shadow font-alkatip group-hover:bg-amber-400 group-hover:text-slate-950 transition animate-arrow-pill">
                      {isRTL ? 'ئېچىش ←' : 'Open →'}
                    </span>
                  </div>

                  <div className="relative z-10 mt-1.5">
                    <h3 className="font-alkatip font-extrabold text-xs sm:text-sm text-white group-hover:text-amber-300 transition drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {getCategoryName(cat.id, cat.name)}
                    </h3>
                    <span className="font-alkatip text-[9px] sm:text-[10px] text-amber-200 font-semibold block mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      {getCategoryCount(cat.id, cat.count)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* View 2: Inside Category Products */
          <section className="pt-2 animate-in fade-in duration-300 space-y-4">
            {/* Header with Back to Categories Button */}
            <div className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#07192d] to-slate-900 border border-amber-500/40 shadow-xl">
              {/* Back to Categories Button (On Right in RTL) */}
              <button
                onClick={() => {
                  setSelectedCat(null);
                  setSearchQuery('');
                }}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-950 font-black gold-shimmer-btn px-3 sm:px-4 py-2 rounded-xl transition font-alkatip cursor-pointer shadow-lg hover:scale-105 active:scale-95 flex-shrink-0 whitespace-nowrap"
              >
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{t('backToCategories')}</span>
              </button>

              {/* Category Name & Count */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-alkatip text-xs sm:text-sm font-semibold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    ({filteredServices.length})
                  </span>
                  <h3 className="font-ukij text-sm sm:text-lg font-bold text-white whitespace-nowrap">
                    {activeCategoryObj ? getCategoryName(activeCategoryObj.id, activeCategoryObj.name) : t('searchPlaceholder')}
                  </h3>
                </div>
                <div className="w-2.5 h-6 rounded-full bg-amber-400 shadow-md shadow-amber-400/60 flex-shrink-0" />
              </div>
            </div>

            {/* Compact Product Cards Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-1.5 sm:gap-2.5">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className={`gold-card-normal rounded-xl p-1.5 sm:p-2.5 flex flex-col justify-between transition-all duration-200 group relative overflow-hidden ${
                    isRTL ? 'text-right' : 'text-left'
                  }`}
                >
                  <div>
                    {/* Compact Image thumbnail */}
                    <div className="w-full h-14 sm:h-20 rounded-lg overflow-hidden bg-slate-900 relative mb-1.5 border border-slate-800">
                      <img
                        src={
                          service.image ||
                          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                      {service.badge && (
                        <span className={`absolute top-1 ${isRTL ? 'right-1' : 'left-1'} text-[7px] sm:text-[8px] font-black bg-amber-500 text-slate-950 px-1 py-0.2 rounded shadow font-alkatip`}>
                          {translateBadge(service.badge)}
                        </span>
                      )}
                    </div>

                    <h4 className="font-alkatip text-[10px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition line-clamp-1 mb-1 leading-tight">
                      {service.name}
                    </h4>

                    {/* Compact starting price */}
                    <div className="flex items-center justify-between text-[8px] sm:text-[10px] bg-slate-950/70 px-1.5 py-0.5 rounded-md border border-slate-800/60 mb-1.5 font-alkatip">
                      <span className="text-slate-400 hidden sm:inline">
                        {isRTL ? 'باھاسى:' : 'From:'}
                      </span>
                      <span className="font-extrabold text-amber-400 font-mono flex items-center gap-0.5" dir="ltr">
                        <span className="text-amber-300">$</span>
                        <span>{service.packages[0]?.price.toFixed(2)}</span>
                      </span>
                      <span className="text-slate-400 text-[8px]">
                        {isRTL ? 'دىن' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Compact Buy Button with Glow & Wiggle Animation */}
                  <button
                    onClick={() => setActiveModalService(service)}
                    className="w-full py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:opacity-95 text-slate-950 font-black text-[9px] sm:text-[11px] transition cursor-pointer font-alkatip active:scale-95 animate-buy-btn-glow flex items-center justify-center gap-1"
                  >
                    <span>{isRTL ? 'سېتىۋېلىش' : 'Buy Now'}</span>
                    <span className="animate-zap-wiggle">
                      <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-950 fill-slate-950 stroke-[2.5]" />
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <p className="font-alkatip text-slate-400 text-sm mb-3">
                  {t('noServicesFound')}
                </p>
                <button
                  onClick={() => {
                    setSelectedCat(null);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl gold-shimmer-btn text-xs font-black font-alkatip cursor-pointer"
                >
                  {t('backToCategories')}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Live Orders Section */}
        <section id="orders" className="pt-6 border-t border-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-ukij text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-5 rounded-full bg-emerald-400" />
                <span>{t('ordersTitle')}</span>
              </h3>
              <p className="font-alkatip text-xs text-slate-400">
                {t('ordersSubtitle')}
              </p>
            </div>
            <button
              onClick={fetchOrders}
              className="font-alkatip text-xs text-amber-400 hover:underline cursor-pointer"
            >
              {isRTL ? 'يېڭىلاش' : 'Refresh'}
            </button>
          </div>

          <OrdersList orders={orders} />
        </section>
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav />

      {/* Checkout Modal */}
      {activeModalService && (
        <CheckoutModal
          service={activeModalService}
          user={currentUser}
          onClose={() => setActiveModalService(null)}
          onSuccess={handleOrderSuccess}
        />
      )}
    </div>
  );
}
