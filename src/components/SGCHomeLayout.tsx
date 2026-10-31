'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import LanguageFlag from '@/components/LanguageFlag';
import { SERVICES_DATA, ServiceItem } from '@/lib/data';
import { getCachedUser, ClientUser } from '@/lib/clientAuth';
import TodayPromotionsBanner from '@/components/TodayPromotionsBanner';
import { useFlashCountdown } from '@/lib/useFlashCountdown';
import {
  Banknote,
  Coins,
  Landmark,
  Search,
  Gamepad2,
  Gift,
  Flame,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Globe,
  Globe2,
  Code2,
  MessageSquareQuote,
  MessageSquareCode,
  PhoneCall,
  ShieldCheck,
  Zap,
  Headphones,
  Wallet,
  Menu,
  X,
  CreditCard,
  User,
  Sparkles,
  Smartphone,
  Bot,
  Tag,
  Radio,
  Bell,
  Sun,
  Moon,
  Wifi,
  Share2,
  ClipboardList,
  Crown,
  Home,
  LogOut,
  LogIn,
  Plus
} from 'lucide-react';

/* =========================================================================
   PURE HELPER: GET CATEGORY NAME
========================================================================= */
function getCategoryName(cat?: string): string {
  if (!cat) return 'AUTO CASH';
  const c = cat.toLowerCase();
  if (c === 'apps' || c.includes('app') || c.includes('تطبيق') || c.includes('ئەپ')) return 'ئەپلەر';
  if (c === 'ai' || c.includes('ai') || c.includes('ذكاء') || c.includes('سۈنئىي')) return 'سۈنئىي ئەقىل';
  if (c === 'numbers' || c.includes('number') || c.includes('رقم') || c.includes('نومۇر')) return 'مەۋھۇم نومۇر';
  if (c === 'wifi' || c.includes('wifi') || c.includes('واي') || c.includes('تور')) return 'Wi-Fi كارتىلىرى';
  if (c === 'cards' || c.includes('card') || c.includes('بطاق') || c.includes('سيريتل') || c.includes('syriatel') || c.includes('كارت')) return 'كارتىغا پۇل قاچىلاش';
  if (c === 'games' || c.includes('game') || c.includes('لعب') || c.includes('ئويۇن')) return 'ئويۇنلار';
  if (c === 'social' || c.includes('social') || c.includes('تواصل') || c.includes('ئىجتىمائىي')) return 'ئىجتىمائىي تاراتقۇ';
  if (c === 'crypto' || c.includes('crypto')) return 'كۆچمە پۇل';
  if (c === 'accounts' || c.includes('account')) return 'ھېساباتلار';
  if (c === 'balance' || c.includes('balance') || c.includes('كاش')) return 'ھەميان كاش';
  return 'AUTO CASH';
}

/* =========================================================================
   ISOLATED COUNTDOWN BUTTON: Re-renders ONLY this 80px button every second,
   ZERO re-renders to the rest of SGCHomeLayout (100% 60FPS Lag-Free)
========================================================================= */
const ActionCountdownButton = React.memo(function ActionCountdownButton({ theme }: { theme: 'light' | 'dark' }) {
  const { timeLeft } = useFlashCountdown();

  return (
    <Link
      href="/promotions"
      className={`flex items-center justify-between gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl border transition-all active:scale-95 relative overflow-hidden group shadow-xs ${
        theme === 'dark'
          ? 'bg-[#18233a] border-amber-500/40 hover:border-amber-400 text-slate-200 hover:text-white'
          : 'bg-gradient-to-r from-amber-50/90 to-orange-50/90 border-amber-300 hover:border-amber-400 text-slate-800 hover:text-amber-700'
      }`}
      title="بۈگۈنكى پائالىيەتلەر ۋە ئالاھىدە ئېتىبارلار"
    >
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0 fill-current animate-icon-sparkle drop-shadow-[0_0_8px_rgba(249,115,22,0.85)] group-hover:scale-110 transition-transform" />
        <span className="text-[10.5px] sm:text-xs font-black truncate">بۈگۈنكى پائالىيەتلەر</span>
      </div>
      {timeLeft && (
        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-300 font-mono text-[9px] sm:text-[10.5px] font-black border border-amber-500/30 shrink-0" dir="ltr">
          {timeLeft.hours}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      )}
    </Link>
  );
});

/* =========================================================================
   MEMOIZED PRODUCT CARD: 60FPS Hardware Accelerated (No backdrop-blur lags)
========================================================================= */
interface ProductCardProps {
  service: ServiceItem;
  isCarousel?: boolean;
  theme: 'light' | 'dark';
  onSelect: (service: ServiceItem) => void;
  onNavigateNumbers: () => void;
  movedRef?: React.MutableRefObject<boolean>;
}

const ProductCard = React.memo(function ProductCard({
  service,
  isCarousel = true,
  theme,
  onSelect,
  onNavigateNumbers,
  movedRef,
}: ProductCardProps) {
  const handleClick = () => {
    if (movedRef?.current) return;
    if (service.category === 'numbers' || /virtual|sms|نومۇر|دەلىللەش/i.test(service.id + (service.name || '') + ((service as any).title || ''))) {
      onNavigateNumbers();
      return;
    }
    onSelect(service);
  };

  return (
    <div
      onClick={handleClick}
      className={`group ${
        isCarousel
          ? 'flex-none w-[148px] sm:w-[178px] md:w-[200px] shrink-0'
          : 'w-full'
      } rounded-3xl border overflow-hidden cursor-pointer transition-all duration-200 active:scale-95 flex flex-col ${
        theme === 'dark'
          ? 'bg-[#131b2e] border-white/10 hover:border-emerald-400 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
          : 'bg-white border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-emerald-300'
      }`}
    >
      {/* 1. TOP ARTWORK */}
      <div className="relative aspect-square w-full bg-gradient-to-br from-[#d1fae5] via-[#a7f3d0] to-[#6ee7b7] p-2.5 flex items-center justify-center overflow-hidden">
        
        {/* Pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#059669_1.2px,transparent_1.2px)] [background-size:12px_12px]" />

        {/* Top-Left: Brand Lockup */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-white/95 dark:bg-slate-950/90 px-1.5 py-0.5 rounded-full border border-white/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] inline-block shrink-0" />
          <span className="text-[7.5px] sm:text-[8px] font-black tracking-tight text-slate-800 dark:text-white">
            AUTO CASH
          </span>
        </div>

        {/* Top-Right: SGC-style Dual Badges */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
          <div className="bg-[#ef4444] text-white text-[7px] sm:text-[7.5px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
            <Flame className="w-2 h-2 fill-current" />
            <span>ئەڭ كۆپ ئېلىنغىنى</span>
          </div>
          <div className="bg-[#059669] text-white text-[7px] sm:text-[7.5px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
            <Zap className="w-2 h-2 text-amber-300 fill-current" />
            <span>دەرھال</span>
          </div>
        </div>

        {/* Diagonal Swoosh Graphics */}
        <div className="absolute -bottom-2 -left-2 z-0 pointer-events-none">
          <svg width="55" height="55" viewBox="0 0 60 60" fill="none">
            <path d="M-5 50L30 15C34 11 40 11 44 15C48 19 48 25 44 29L10 63H-5V50Z" fill="#059669" opacity="0.9" />
            <path d="M-10 65L20 35C24 31 30 31 34 35C38 39 38 45 34 49L5 78H-10V65Z" fill="#111827" opacity="0.95" />
          </svg>
        </div>

        {/* CENTER WRAPPING LOGO FRAME & PRODUCT PICTURE */}
        <div className="relative z-10 w-[64%] h-[64%] flex items-center justify-center">
          <div className="absolute -inset-2.5 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" fill="none">
              <path
                d="M32 9H70C81 9 91 19 91 30V68"
                stroke="#059669"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M68 91H30C19 91 9 81 9 70V32"
                stroke="#111827"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-[2.5px] sm:border-[3px] border-white/95 bg-slate-900 group-hover:scale-105 transition-transform duration-300">
            <img
              src={service.image || '/brand_logo.png'}
              alt={service.name || 'Service'}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as any).src = '/brand_logo.png'; }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Category Name Badge */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 max-w-[70%] text-center pointer-events-none">
          <div className="px-2 py-0.5 rounded-full bg-white/95 dark:bg-[#0c1424]/95 border border-emerald-500/40 shadow-xs flex items-center justify-center">
            <span className="text-[8px] sm:text-[9.5px] font-black gold-title-shine truncate max-w-full font-alkatip">
              {getCategoryName(service.category)}
            </span>
          </div>
        </div>

      </div>

      {/* 2. BOTTOM CARD BODY */}
      <div className="p-2 sm:p-2.5 text-right flex flex-col justify-between flex-1">
        <h3 className="font-extrabold text-xs sm:text-sm gold-title-shine transition">
          {service.name}
        </h3>
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
            <Globe className="w-3 h-3 text-slate-400 shrink-0" />
            <span>دۇنياۋى</span>
          </span>
          <span className="text-[#059669] font-black font-mono">
            {service.packages && service.packages.length > 0 && typeof service.packages[0].price === 'number' && service.packages[0].price > 0
              ? `$${service.packages[0].price.toFixed(2)}`
              : 'ئاپتوماتىك'}
          </span>
        </div>
      </div>
    </div>
  );
});

/* =========================================================================
   MEMOIZED PRODUCT ROW CAROUSEL: Zero re-renders during mouse or touch swipes
========================================================================= */
interface ProductRowCarouselProps {
  items: ServiceItem[];
  theme: 'light' | 'dark';
  onSelect: (service: ServiceItem) => void;
  onNavigateNumbers: () => void;
}

const ProductRowCarousel = React.memo(function ProductRowCarousel({
  items,
  theme,
  onSelect,
  onNavigateNumbers,
}: ProductRowCarouselProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const movedRef = React.useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rowRef.current) return;
    isDraggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = rowRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !rowRef.current) return;
    const dx = e.pageX - startXRef.current;
    if (Math.abs(dx) > 6) {
      movedRef.current = true;
    }
    rowRef.current.scrollLeft = scrollLeftRef.current - dx;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      movedRef.current = false;
    }, 70);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const el = rowRef.current;
    const amount = 300;
    const prev = el.scrollLeft;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(() => {
      if (el && el.scrollLeft === prev) {
        el.scrollBy({ left: direction === 'left' ? amount : -amount, behavior: 'smooth' });
      }
    }, 50);
  };

  const visibleItems = React.useMemo(() => items.slice(0, 16), [items]);

  return (
    <div className="relative group/carousel">
      {/* Floating Left Button */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute left-1 sm:-left-3.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-[#0c1424]/95 border border-slate-200 dark:border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.22)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.7)] flex items-center justify-center text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 hover:scale-110 active:scale-90 transition-all cursor-pointer opacity-95 sm:opacity-0 sm:group-hover/carousel:opacity-100"
        title="سولغا يۆتكەش"
        aria-label="سولغا سىيرىش"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
      </button>

      {/* Floating Right Button */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-1 sm:-right-3.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-[#0c1424]/95 border border-slate-200 dark:border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.22)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.7)] flex items-center justify-center text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 hover:scale-110 active:scale-90 transition-all cursor-pointer opacity-95 sm:opacity-0 sm:group-hover/carousel:opacity-100"
        title="ئوڭغا يۆتكەش"
        aria-label="ئوڭغا سىيرىش"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
      </button>

      {/* Horizontal Swipeable Track */}
      <div
        ref={rowRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex gap-2.5 sm:gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none select-none overscroll-x-contain -mx-3.5 px-3.5 sm:mx-0 sm:px-0 cursor-grab active:cursor-grabbing"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
        }}
      >
        {visibleItems.map((item) => (
          <ProductCard
            key={item.id}
            service={item}
            isCarousel={true}
            theme={theme}
            onSelect={onSelect}
            onNavigateNumbers={onNavigateNumbers}
            movedRef={movedRef}
          />
        ))}
      </div>
    </div>
  );
});

interface SGCHomeLayoutProps {
  onSelectService: (service: ServiceItem) => void;
  onOpenAuth: () => void;
}

export default function SGCHomeLayout({ onSelectService, onOpenAuth }: SGCHomeLayoutProps) {
  const router = useRouter();
  const { lang, setLang, t, isRTL } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  // Live Server Catalog State
  const [serverServices, setServerServices] = useState<ServiceItem[]>(SERVICES_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // Touch Swipe State for Mobile Banner (High-Performance Ref Based - ZERO Re-renders during swipe)
  const touchStartXRef = React.useRef<number | null>(null);
  const touchEndXRef = React.useRef<number | null>(null);

  // Sync auth and theme
  useEffect(() => {
    setUser(getCachedUser());
    const saved = localStorage.getItem('autocash_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.body.classList.toggle('light-theme', saved === 'light');
      document.body.classList.toggle('dark-theme', saved === 'dark');
    } else {
      setTheme('light');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, []);

  // Fetch Real Server Services from Database / API smoothly without UI flash
  useEffect(() => {
    let isMounted = true;
    async function fetchServerCatalog() {
      try {
        const catalogRes = await fetch('/api/catalog').then(r => r.json()).catch(() => null);
        if (isMounted && catalogRes?.services && Array.isArray(catalogRes.services) && catalogRes.services.length > 0) {
          const normalized: ServiceItem[] = catalogRes.services.map((s: any) => ({
            ...s,
            title: s.title || s.name || s.id,
            name: s.name || s.title || s.id,
            image: s.image || '/brand_logo.png',
            category: s.category || 'other',
            packages: s.packages || [],
          }));
          setServerServices((prev) => {
            if (prev && prev.length === normalized.length && prev[0]?.id === normalized[0]?.id) {
              return prev;
            }
            return normalized;
          });
        }
      } catch (err) {
        // Fallback remains active
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchServerCatalog();
    return () => { isMounted = false; };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('autocash_theme', nextTheme);
    document.body.classList.toggle('light-theme', nextTheme === 'light');
    document.body.classList.toggle('dark-theme', nextTheme === 'dark');
  };

  // Promo Carousel Slides (100% Uyghur & Animated Visuals as Requested)
  const promoSlides = [
    {
      id: 'telegram',
      type: 'telegram',
      badge: '★ ئالتۇن يۇلتۇز',
      tag: 'Telegram Stars',
      title: 'تېلېگرام پرېمىيۇم ۋە Stars',
      sub: 'Telegram Stars يۇلتۇزلىرى ۋە پرېمىيۇمنى دەرھال ئېلىڭ',
      desc: 'سۈنئىي ئەقىل، ئويۇن ۋە سۇپىلار ئۈچۈن رەسمىي Telegram يۇلتۇزلىرىنى سېكۇنتتا رەسمىي قاچىلاڭ',
      action: 'دەرھال ئېلىش',
      targetCategory: 'social'
    },
    {
      id: 'wifi',
      type: 'wifi',
      badge: '📶 تېز سۈرئەتلىك تور',
      tag: 'Wi-Fi كارتىلىرى',
      title: 'Wi-Fi تور كارتىلىرى',
      sub: 'عزيز نت، الفرسان ۋە المجاهد تور كارتىلىرى شۇئان كېلىدۇ',
      desc: 'يۇقىرى سۈرئەتلىك كابېل ۋە سىمسىز تور ئۈچۈن چەكلىمىسىز باغلانما كارتىلىرىنى دەرھال سېتىۋېلىڭ',
      action: 'تور كارتىسى ئېلىش',
      targetCategory: 'wifi'
    },
    {
      id: 'cards',
      type: 'cards',
      badge: '⚡ كارتىغا نەق پۇل',
      tag: 'سۈرىيەتېل & MTN',
      title: 'كارتىغا پۇل قاچىلاش',
      sub: 'سۈرىيەتېل كاش ۋە ئىمتىئېن كارتىلىرىغا سېكۇنتتا نەق پۇل قاچىلاڭ',
      desc: 'Syriatel Cash، MTN كارتىلىرى ئەڭ ئەرزان باھادا بىۋاسىتە ۋە ئاپتوماتىك قاچىلىنىدۇ',
      action: 'كارتىغا پۇل قاچىلاش',
      targetCategory: 'cards'
    },
    {
      id: 'atm',
      type: 'atm',
      badge: '🏦 ئاپتوماتىك كاش',
      tag: 'ھەميان تولۇقلاش',
      title: 'ھەميان قالدۇقىنى تولۇقلاش',
      sub: 'ئاپتوماتىك كاش بانكا ئارقىلىق سېكۇنتتا نەق پۇل كىرگۈزۈش',
      desc: 'شام كاش، USDT ۋە بارلىق يەرلىك بانكىلار بىلەن ھەميان قالدۇقىنى 24 سائەت شۇئان كۆپەيتىڭ',
      action: 'ھەمياننى تولۇقلاش',
      targetRoute: '/deposit'
    },
    {
      id: 'numbers',
      type: 'numbers',
      badge: '🌐 دۇنيا مەۋھۇم نومۇرلىرى',
      tag: 'مەۋھۇم نومۇر & تېز SMS',
      title: 'دۇنيا مەۋھۇم نومۇرلىرى',
      sub: '150+ دۆلەتتىن نەق مەيدان SMS كود تاپشۇرۇۋېلىش',
      desc: 'WhatsApp، Telegram، TikTok ۋە ھەممە ئەپلەرگە مەۋھۇم نومۇرلارنى سېكۇنتتا دەلىللەش كودى بىلەن ئېلىڭ',
      action: 'نومۇر ئېلىش',
      targetRoute: '/numbers'
    }
  ];

  // Auto-play promo slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [promoSlides.length]);

  // Touch Swipe Handlers for Mobile Phones (ZERO Re-renders while swiping)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    if (distance > 45) {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    } else if (distance < -45) {
      setCurrentSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Category Carousel Horizontal Scroll & Drag Controls (High-performance 60FPS Ref-based Drag)
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const isCategoryDraggingRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const dragScrollLeftRef = React.useRef(0);
  const hasMovedRef = React.useRef(false);

  const handleCategoryMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return;
    isCategoryDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartXRef.current = e.pageX;
    dragScrollLeftRef.current = categoryScrollRef.current.scrollLeft;
  };

  const handleCategoryMouseMove = (e: React.MouseEvent) => {
    if (!isCategoryDraggingRef.current || !categoryScrollRef.current) return;
    const dx = e.pageX - dragStartXRef.current;
    if (Math.abs(dx) > 5) {
      hasMovedRef.current = true;
    }
    categoryScrollRef.current.scrollLeft = dragScrollLeftRef.current - dx;
  };

  const handleCategoryMouseUp = () => {
    isCategoryDraggingRef.current = false;
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 60);
  };

  const scrollCategoryStrip = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const el = categoryScrollRef.current;
    const amount = 240;
    const prev = el.scrollLeft;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(() => {
      if (el && el.scrollLeft === prev) {
        el.scrollBy({ left: direction === 'left' ? amount : -amount, behavior: 'smooth' });
      }
    }, 50);
  };

  // 7 Categories:
  // 1. ئەپلەر (apps)
  // 2. سۈنئىي ئەقىل (ai)
  // 3. مەۋھۇم نومۇر (numbers)
  // 4. Wi-Fi تور كارتىلىرى (wifi)
  // 5. كارتىغا پۇل قاچىلاش (cards)
  // 6. ئىجتىمائىي تاراتقۇ (social)
  // 7. ئويۇنلار (games)
  const { appsList, aiList, numbersList, wifiList, cardsList, socialList, gamesList } = useMemo(() => {
    const isGame = (s: ServiceItem) =>
      s.category === 'games' ||
      /pubg|fire|ludo|pool|clash|brawl|legends|duty|roblox|strike|fortnite|rivals|genshin|entropy|survival|kings|shot|war|hay|empires|sus|stumble/i.test(s.id);

    const isWifi = (s: ServiceItem) =>
      s.category === 'wifi' || /wifi|عزيز نت|الفرسان|المجاهد/i.test(s.id + (s.name || ''));

    const isAi = (s: ServiceItem) =>
      (s.category === 'ai' || /gpt|gemini|kimi|kling|heygen|invideo|cursor|super_grok/i.test(s.id)) && !isGame(s);

    const isSocial = (s: ServiceItem) =>
      (s.category === 'social' || /instagram|youtube|facebook|snapchat|social/i.test(s.id)) && !isGame(s);

    const isNumber = (s: ServiceItem) =>
      (s.category === 'numbers' || /virtual|sms|نومۇر|دەلىللەش|تەستىق/i.test(s.id + (s.name || ''))) &&
      !isGame(s) && !isWifi(s);

    const isCard = (s: ServiceItem) =>
      (s.category === 'cards' || /card|steam|itunes|play|visa|razer|turk|syria|mtn|phone/i.test(s.id)) &&
      !isGame(s) && !isWifi(s) && !isAi(s) && !isSocial(s) && !isNumber(s);

    const isApp = (s: ServiceItem) =>
      !isGame(s) && !isWifi(s) && !isAi(s) && !isSocial(s) && !isCard(s) && !isNumber(s);

    return {
      appsList: serverServices.filter(isApp),
      aiList: serverServices.filter(isAi),
      numbersList: serverServices.filter(isNumber),
      wifiList: serverServices.filter(isWifi),
      cardsList: serverServices.filter(isCard),
      socialList: serverServices.filter(isSocial),
      gamesList: serverServices.filter(isGame)
    };
  }, [serverServices]);

  // Handle Category Switching
  const handleCategorySelect = (catKey: string) => {
    if (activeCategory === catKey) {
      setActiveCategory('all');
    } else {
      setActiveCategory(catKey);
      setTimeout(() => {
        const el = document.getElementById('category-filter-header') || document.getElementById('search-input');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  // Filtered view when a specific category is active, or searching
  const filteredActiveList = useMemo(() => {
    let list: ServiceItem[] = [];
    if (activeCategory === 'apps') list = appsList;
    else if (activeCategory === 'ai') list = aiList;
    else if (activeCategory === 'numbers') list = numbersList;
    else if (activeCategory === 'wifi') list = wifiList;
    else if (activeCategory === 'cards') list = cardsList;
    else if (activeCategory === 'social') list = socialList;
    else if (activeCategory === 'games') list = gamesList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const pool = activeCategory === 'all' ? serverServices : list;
      return pool.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeCategory, appsList, aiList, wifiList, cardsList, socialList, gamesList, searchQuery, serverServices]);

  const handleBannerAction = (slide: typeof promoSlides[0] & { targetId?: string }) => {
    if (slide.targetRoute) {
      router.push(slide.targetRoute);
      return;
    }
    if (slide.targetCategory) {
      handleCategorySelect(slide.targetCategory);
      setTimeout(() => {
        const el = document.getElementById(`${slide.targetCategory}-section`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }
    if (slide.targetId) {
      const target = serverServices.find(s => s.id === slide.targetId);
      if (target) {
        onSelectService(target);
        return;
      }
    }
    onOpenAuth();
  };

  // Subcomponents memoized externally for 60FPS zero-lag rendering

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-[#0b0f19] text-white' : 'bg-[#f4f7f5] text-slate-900'
      } font-alkatip select-none pb-24 md:pb-12`}
      dir="rtl"
    >
      
      {/* =========================================================================
          1. TOP NAVIGATION BAR (100% Pure Uyghur)
      ========================================================================= */}
      <header className={`sticky top-0 z-40 backdrop-blur-md transition-colors ${
        theme === 'dark' ? 'bg-[#0b0f19]/95 border-b border-white/10' : 'bg-white/98 border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
      } pt-[env(safe-area-inset-top,0px)]`}>
        <div className="max-w-[1200px] mx-auto px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3">
          
          {/* Action Icons on the Left (Hamburger, Avatar, Notification, Search) */}
          <div className="flex items-center gap-2 sm:gap-2.5 order-2 sm:order-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 ${
                theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
              }`}
              aria-label="قوشۇمچە تىزىملىك"
            >
              <Menu className="w-5 h-5 stroke-[2.2] animate-icon-gleam" />
            </button>

            <Link
              href={user ? "/account" : "/login"}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#059669] text-white flex items-center justify-center font-black text-sm shadow-[0_2px_8px_rgba(5,150,105,0.35)] hover:scale-105 active:scale-95 transition animate-icon-sparkle anim-delay-1"
              title={user ? (user.name || 'ھېساباتىم') : "ھېساباتقا كىرىش"}
            >
              {user ? (user.name ? user.name.charAt(0).toUpperCase() : 'ھ') : 'ھ'}
            </Link>

            <button
              onClick={() => router.push('/orders')}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center relative border transition active:scale-95 ${
                theme === 'dark'
                  ? 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
              title="ئۇقتۇرۇشلار"
            >
              <Bell className="w-4 h-4 text-rose-500 animate-icon-gleam anim-delay-2" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('search-input');
                el?.focus();
              }}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition active:scale-95 ${
                theme === 'dark'
                  ? 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
              title="ئىزدەش"
            >
              <Search className="w-4 h-4 stroke-[2.2] animate-icon-gleam anim-delay-3" />
            </button>
          </div>

          {/* Brand Logo & Title on the Right (Animated Shimmer) */}
          <Link href="/" className="flex items-center gap-3 shrink-0 order-1 sm:order-2 group select-none">
            <div className="flex flex-col text-right justify-center overflow-visible py-0.5">
              <span className="font-black text-base sm:text-lg tracking-wide animated-brand-title">
                AUTO CASH
              </span>
              <span className="text-[11px] sm:text-[12px] font-bold tracking-normal animated-brand-sub">
                ئاپتوماتىك پۇل قاچىلاش
              </span>
            </div>
            <div className="relative shrink-0 p-0.5 rounded-full border border-emerald-500/40 animate-logo-aura">
              <img
                src="/logo.png"
                alt="Auto Cash"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm"
              />
            </div>
          </Link>
        </div>

      </header>


      {/* =========================================================================
          SGC GAME STYLE FULL-HEIGHT OFF-CANVAS SIDE DRAWER
          يان تىزىملىك (القائمة الرئيسية)
      ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content Panel (RTL - slides from right) */}
          <div
            className={`relative z-50 w-[310px] sm:w-[340px] max-w-[85vw] h-full flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 ${
              theme === 'dark' ? 'bg-[#101726] text-white' : 'bg-white text-slate-800'
            }`}
          >
            {/* 1. Header of Drawer */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
              {/* Brand and Title on Right (Animated Shimmer) */}
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <img
                    src="/logo.png"
                    alt="Auto Cash"
                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                  />
                </div>
                <span className="font-black text-sm tracking-wide animated-brand-title">
                  AUTO CASH
                </span>
                <span className="text-slate-300 dark:text-white/20">|</span>
                <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                  ئاساسىي تىزىملىك
                </span>
              </div>

              {/* Close Button on Left */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95 cursor-pointer"
                title="تاقاش"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Middle Content */}
            <div className="flex-1 overflow-y-auto py-3.5 space-y-4 scrollbar-none">
              
              {/* 2. User Profile Card */}
              <div
                className={`p-3.5 rounded-3xl border transition-all ${
                  theme === 'dark'
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : 'border-emerald-500/30 bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-slate-800 dark:text-white block truncate max-w-[130px]">
                        {user?.name || 'مېھمان خېرىدار'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {user?.email || 'خۇش كەپسىز'}
                      </span>
                    </div>
                  </div>

                  {/* Balance Pill Button */}
                  <Link
                    href="/deposit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700 font-bold text-xs font-mono transition active:scale-95 shadow-sm"
                    title="پۇل قاچىلاش"
                  >
                    <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                    <span>${typeof user?.balance === 'number' ? user.balance.toFixed(2) : '0.00'}</span>
                    <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </Link>
                </div>
              </div>

              {/* 3. Section Divider: مۇلازىمەت ۋە دۇكان */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                  مۇلازىمەت ۋە دۇكان
                </span>
                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
              </div>

              {/* 1. تىل تاللاش 6 خىل ئەسلى توربەتتەك */}
              <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-[#0c1626] border border-slate-200/80 dark:border-emerald-500/20 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>تىل تاللاش (Language)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
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

                <div className="grid grid-cols-2 gap-1.5">
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
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer ${
                        lang === item.code
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-sm ring-1 ring-emerald-400/50 scale-[1.02]'
                          : 'bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40 hover:text-emerald-600'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <LanguageFlag code={item.code} className="w-4 h-3 rounded-[2px] object-cover shrink-0 shadow-sm" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Menu Items Ordered Exactly as Requested */}
              <nav className="space-y-1 font-bold text-xs sm:text-sm">
                
                {/* 2. باشبەت */}
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right">باشبەت</span>
                </Link>

                {/* 3. تەلەپلىرىم */}
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right">تەلەپلىرىم</span>
                </Link>

                {/* 4. ھەميانىم */}
                <Link
                  href="/deposit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right">ھەميانىم</span>
                </Link>

                {/* 5. ئەزالىق */}
                <Link
                  href="/membership"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right">ئەزالىق</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                    VIP
                  </span>
                </Link>

                {/* 6. پالىيەتلەر */}
                <Link
                  href="/promotions"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 fill-current animate-pulse text-amber-500" />
                  </div>
                  <span className="flex-1 text-right">پالىيەتلەر</span>
                  <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                    FLASH
                  </span>
                </Link>

                {/* توربەت ئەپىنى چۈشۈرۈڭ */}
                <Link
                  href="/download"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 animate-icon-gleam" />
                  </div>
                  <span className="flex-1 text-right">توربەت ئەپىنى چۈشۈرۈڭ</span>
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                    APK
                  </span>
                </Link>

                {/* مەۋھۇم نومۇر (SMS) */}
                <Link
                  href="/numbers"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-teal-100/70 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <MessageSquareCode className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right">مەۋھۇم نومۇر (SMS)</span>
                  <span className="text-[10px] bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-mono font-bold">
                    SMS
                  </span>
                </Link>

                {/* 7. تەمىنلىگۈچى API (بۇنى يېقىندا قوشىمىز دەپ چىقىرىپ قويۇش) */}
                <button
                  type="button"
                  onClick={() => setShowApiModal(true)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition text-right active:scale-98 cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-cyan-100/70 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right">تەمىنلىگۈچى API</span>
                  <span className="text-[10px] bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                    يېقىندا قوشۇلىدۇ
                  </span>
                </button>

                {/* 8. ئالاقىلىشىش */}
                <a
                  href="https://t.me/autocash_UYGHUR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 text-sky-600 dark:text-sky-400 ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-sky-100/70 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4 animate-icon-gleam" />
                  </div>
                  <span className="flex-1 text-right">ئالاقىلىشىش</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    24/7
                  </span>
                </a>

                {/* 9. ئىنكاس (ئىنكاس سەھپىسى قۇرۇپ خىرىدار يازغان ھەر قانداق سۈز بىۋاستە تىلگىرام ئارقىلىق ماڭا كىلىدىغان قىلىمىز) */}
                <Link
                  href="/feedback"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition active:scale-98 text-emerald-600 dark:text-emerald-400 ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquareQuote className="w-4 h-4 animate-icon-sparkle" />
                  </div>
                  <span className="flex-1 text-right">ئىنكاس</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    بىۋاسىتە تېلېگرامما
                  </span>
                </Link>

              </nav>
            </div>

            {/* 5. Fixed Bottom Footer of Drawer */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
              
              {/* Login / Logout Button */}
              {user ? (
                <button
                  onClick={() => {
                    localStorage.removeItem('autocash_is_logged_in');
                    localStorage.removeItem('autocash_username');
                    localStorage.removeItem('autocash_email');
                    window.location.reload();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>چېكىنىش</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>كىرىش / تىزىملىتىش</span>
                </button>
              )}

              {/* Theme Switch Button */}
              <button
                onClick={toggleTheme}
                className="w-16 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 flex flex-col items-center justify-center text-amber-600 dark:text-amber-400 transition active:scale-95 cursor-pointer"
                title="تېما ئالماشتۇرۇش"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-0.5">
                  تېما
                </span>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* Provider API Coming Soon Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0f172a] border border-cyan-500/40 p-5 shadow-2xl text-right font-alkatip space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-[10px] font-bold">
                يېقىندا قوشۇلىدۇ
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">تەمىنلىگۈچى API</h3>
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              تور بېكەت، سىستېما ۋە تېلېگرامما قاچىلاش بوتلىرىنى AUTO CASH ئاپتوماتىك قاچىلاش سىستېمىسى بىلەن بىر گەۋدىلەشتۈرۈش API مۇلازىمىتى پات يېقىندا ئىشقا كىرىشتۈرۈلىدۇ!
            </p>
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300">
              💡 ئالدىن API ھەمكارلىق كېلىشىمى تۈزمەكچى بولسىڭىز، مەسئۇل باشقۇرغۇچى بىلەن بىۋاسىتە ئالاقىلىشىڭ.
            </div>
            <div className="pt-1 flex items-center gap-2">
              <a
                href="https://t.me/autocash_UYGHUR"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold text-center shadow-md active:scale-95 transition"
              >
                باشقۇرغۇچى بىلەن ئالاقىلىشىش
              </a>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                چۈشەندىم
              </button>
            </div>
          </div>
        </div>
      )}


      {/* =========================================================================
          QUICK DASHBOARD ACTION BAR (ئېلان رەسىمىنىڭ ئۈستىدىكى ئەپچىل قولايلىق رايون)
          1. قالدۇق سومما سانى (بېسىپ پۇل قاچىلاش)
          2. تەلەپلىرىم كۇنۇپكىسى
          3. بۈگۈنكى پائالىيەتلەر كۇنۇپكىسى
          4. ئەزالىق كۇنۇپكىسى
      ========================================================================= */}
      <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4 mt-2.5 sm:mt-3">
        <div className={`p-2 sm:p-2.5 rounded-2xl border transition-all ${
          theme === 'dark'
            ? 'bg-[#131b2e]/95 border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
            : 'bg-white border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
        }`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            
            {/* 1. قالدۇق سومما سانى ۋە شۇنى بېسىپ پۇل قاچىلاش */}
            <Link
              href="/deposit"
              className={`group flex items-center justify-between gap-3 px-3 py-1.5 sm:py-2 rounded-xl transition-all active:scale-[0.98] ${
                theme === 'dark'
                  ? 'bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400/60'
                  : 'bg-emerald-50/80 border border-emerald-200 hover:border-emerald-300'
              }`}
              title="قالدۇق سوممىڭىزنى كۆرۈش ۋە پۇل قاچىلاش ئۈچۈن بېسىڭ"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform animate-nav-pill-glow">
                  <Wallet className="w-4 h-4 animate-icon-sparkle anim-delay-1" />
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-none">
                    قالدۇق سومما
                  </span>
                  <span className="block text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono leading-tight mt-0.5">
                    ${typeof user?.balance === 'number' ? user.balance.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] sm:text-xs font-black px-2.5 py-1 sm:py-1.5 rounded-lg shadow-sm transition group-hover:scale-105">
                <span className="animate-star-glint text-amber-300">✦</span>
                <span>+ پۇل قاچىلاش</span>
              </div>
            </Link>

            {/* 2, 3, 4: تەلەپلىرىم، بۈگۈنكى پائالىيەتلەر، ئەزالىق كۇنۇپكىلىرى */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              
              {/* 2. تەلەپلىرىم */}
              <Link
                href="/orders"
                className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl border transition-all active:scale-95 group ${
                  theme === 'dark'
                    ? 'bg-[#18233a] border-white/10 hover:border-blue-400/50 text-slate-200 hover:text-white'
                    : 'bg-slate-50/80 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600'
                }`}
                title="تەلەپلىرىمنى كۆرۈش"
              >
                <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0 animate-icon-gleam anim-delay-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] sm:text-xs font-bold truncate">تەلەپلىرىم</span>
              </Link>

              {/* 3. بۈگۈنكى پائالىيەتلەر (Image 4: Isolated 60FPS Live Countdown Button) */}
              <ActionCountdownButton theme={theme} />

              {/* 4. ئەزالىق */}
              <Link
                href="/membership"
                className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl border transition-all active:scale-95 group ${
                  theme === 'dark'
                    ? 'bg-[#18233a] border-white/10 hover:border-yellow-400/50 text-slate-200 hover:text-white'
                    : 'bg-slate-50/80 border-slate-200 hover:border-yellow-300 text-slate-700 hover:text-yellow-600'
                }`}
                title="ئەزالىق دەرىجىسى ۋە كارتىلىرى"
              >
                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0 fill-current animate-icon-gleam anim-delay-4 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] group-hover:scale-110 transition-transform" />
                <span className="text-[11px] sm:text-xs font-bold truncate">ئەزالىق</span>
              </Link>

            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          2. HERO PROMO BANNER CAROUSEL (Full-Bleed Luxury AutoCash Artwork)
      ========================================================================= */}
      <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4 mt-3 sm:mt-4">
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] border border-emerald-500/30 dark:border-white/10 bg-[#040e1b] aspect-[16/9] sm:aspect-[16/6.6] min-h-[195px] sm:min-h-[260px] max-h-[380px] touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Full-bleed Luxury AUTO CASH Background Image */}
          <img
            src="/images/autocash_hero_banner_rtl.jpg"
            alt="AUTO CASH Official Promotion"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-[1.01] transition-transform duration-700 ease-out"
          />

          {/* High-contrast Cinematic Vignette Overlays for Maximum Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-l from-[#030914]/90 via-[#030914]/55 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030914]/80 via-transparent to-[#030914]/30 pointer-events-none" />

          {/* =========================================================================
              ANIMATED LUXURY GIFT BOX, BURSTING GOLD PARTICLES & NEON ENERGY ARCS
          ========================================================================= */}
          <div className="absolute inset-y-0 left-0 w-[48%] sm:w-[38%] pointer-events-none overflow-hidden z-[5]" dir="ltr">
            {/* Radiant Volumetric Light Beam bursting from inside open gift chest */}
            <div className="absolute left-[8%] sm:left-[12%] top-[25%] sm:top-[22%] w-36 h-36 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-amber-400/30 via-yellow-300/20 to-transparent blur-2xl animate-gift-ray pointer-events-none" />
            <div className="absolute left-[14%] sm:left-[18%] top-[30%] sm:top-[28%] w-20 h-20 sm:w-32 sm:h-32 bg-amber-300/25 blur-xl animate-pulse pointer-events-none" />

            {/* Cyan Neon Energy Ring Pulse */}
            <div className="absolute left-[2%] sm:left-[6%] top-[18%] sm:top-[15%] w-44 h-44 sm:w-64 sm:h-64 rounded-full border border-cyan-400/25 shadow-[0_0_25px_rgba(6,182,212,0.35)] animate-gift-neon pointer-events-none" />
            <div className="absolute left-[-5%] sm:left-[0%] bottom-[5%] sm:bottom-[8%] w-32 h-16 sm:w-48 sm:h-24 rounded-full bg-cyan-500/15 blur-xl animate-pulse pointer-events-none" />

            {/* Golden Ribbon Bow Twinkle / Glint */}
            <div className="absolute left-[17%] sm:left-[21%] top-[20%] sm:top-[17%] z-10 flex items-center justify-center pointer-events-none">
              <span className="text-amber-200 text-xs sm:text-base font-black drop-shadow-[0_0_8px_#fde68a] animate-bow-glint">
                ✦
              </span>
            </div>
            <div className="absolute left-[13%] sm:left-[16%] top-[24%] sm:top-[21%] z-10 flex items-center justify-center pointer-events-none">
              <span className="text-amber-300 text-[10px] sm:text-xs font-black drop-shadow-[0_0_6px_#fbbf24] animate-bow-glint" style={{ animationDelay: '1.2s' }}>
                ★
              </span>
            </div>

            {/* Rising Burst of Golden Sparks / Embers Layer 1 */}
            <div className="absolute left-[16%] sm:left-[20%] top-[34%] sm:top-[30%] animate-gift-sparkle-1 pointer-events-none">
              <span className="text-amber-300 text-[9px] sm:text-xs font-black drop-shadow-[0_0_6px_#fbbf24]">✦</span>
            </div>
            <div className="absolute left-[22%] sm:left-[27%] top-[38%] sm:top-[34%] animate-gift-sparkle-1 pointer-events-none" style={{ animationDelay: '0.4s' }}>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-100 shadow-[0_0_8px_#fde047]" />
            </div>
            <div className="absolute left-[26%] sm:left-[32%] top-[28%] sm:top-[24%] animate-gift-sparkle-1 pointer-events-none" style={{ animationDelay: '0.9s' }}>
              <span className="text-yellow-200 text-[8px] sm:text-[10px] drop-shadow-[0_0_5px_#fef08a]">✨</span>
            </div>

            {/* Rising Burst of Golden Sparks / Embers Layer 2 */}
            <div className="absolute left-[12%] sm:left-[15%] top-[32%] sm:top-[28%] animate-gift-sparkle-2 pointer-events-none">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-200 shadow-[0_0_6px_#fde68a]" />
            </div>
            <div className="absolute left-[19%] sm:left-[24%] top-[26%] sm:top-[22%] animate-gift-sparkle-2 pointer-events-none" style={{ animationDelay: '1.1s' }}>
              <span className="text-amber-400 text-[10px] sm:text-sm font-black drop-shadow-[0_0_7px_#f59e0b]">✦</span>
            </div>
            <div className="absolute left-[15%] sm:left-[18%] top-[40%] sm:top-[36%] animate-gift-sparkle-2 pointer-events-none" style={{ animationDelay: '0.6s' }}>
              <span className="text-yellow-300 text-[7px] sm:text-[9px] drop-shadow-[0_0_5px_#facc15]">★</span>
            </div>

            {/* Rising Burst of Golden Sparks / Embers Layer 3 */}
            <div className="absolute left-[24%] sm:left-[29%] top-[30%] sm:top-[26%] animate-gift-sparkle-3 pointer-events-none">
              <span className="text-amber-300 text-[9px] sm:text-xs font-black drop-shadow-[0_0_6px_#fbbf24]">✦</span>
            </div>
            <div className="absolute left-[17%] sm:left-[22%] top-[44%] sm:top-[40%] animate-gift-sparkle-3 pointer-events-none" style={{ animationDelay: '0.8s' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde047]" />
            </div>
            <div className="absolute left-[28%] sm:left-[35%] top-[36%] sm:top-[32%] animate-gift-sparkle-3 pointer-events-none" style={{ animationDelay: '1.5s' }}>
              <span className="text-yellow-100 text-[8px] sm:text-[10px] drop-shadow-[0_0_5px_#ffffff]">✨</span>
            </div>

            {/* Animated Floating Gold Coin Reflection at Bottom */}
            <div className="absolute left-[7%] sm:left-[9%] bottom-[8%] sm:bottom-[10%] animate-gift-coin pointer-events-none">
              <div className="relative flex items-center justify-center">
                <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-full border border-amber-400/40 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse" />
                <span className="absolute -top-1 -right-1 text-amber-300 text-[9px] sm:text-xs font-black animate-star-glint drop-shadow">
                  ✦
                </span>
              </div>
            </div>
          </div>

          {/* Top-Right Badge (Dynamic per Promo Slide) */}
          <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20 bg-slate-950/85 backdrop-blur-md text-amber-300 border border-amber-400/30 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1.5 shadow-lg">
            <Flame className="w-3 h-3 text-amber-400 fill-current" />
            <span>{promoSlides[currentSlide].badge || 'ئالاھىدە ئېتىبارلار'}</span>
          </div>

          {/* Top-Left Banner Logo */}
          <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-20 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
            <Zap className="w-3 h-3 text-emerald-400 fill-current" />
            <span className="font-black text-[11px] text-white tracking-wider">AUTO CASH</span>
          </div>

          {/* Interactive Slide Graphic & Content */}
          <div className="relative w-full h-full flex items-center justify-between px-4 sm:px-10 overflow-hidden z-10">
            <div className="relative w-full h-full flex items-center justify-between">
              
              {/* Text Info on Right Side */}
              <div className="relative z-10 max-w-[60%] sm:max-w-md text-right text-white pr-1 sm:pr-4">
                <span className="inline-block bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[9.5px] sm:text-xs font-black px-2.5 py-0.5 rounded-md mb-1.5 shadow-md">
                  {promoSlides[currentSlide].tag}
                </span>
                <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                  {promoSlides[currentSlide].title}
                </h2>
                <p className="text-[11px] sm:text-sm font-extrabold text-emerald-300 mt-1 line-clamp-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {promoSlides[currentSlide].sub}
                </p>
                <p className="hidden sm:block text-[11px] sm:text-xs text-slate-200/95 mt-1 line-clamp-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                  {promoSlides[currentSlide].desc}
                </p>
                <button
                  onClick={() => handleBannerAction(promoSlides[currentSlide])}
                  className="mt-2.5 sm:mt-3.5 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-[10.5px] sm:text-xs font-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{promoSlides[currentSlide].action}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dynamic Interactive 3D Visual Graphic Matching User Request */}
              <div className="relative flex-1 h-full flex items-center justify-center pl-1 sm:pl-6">
                
                {/* 1. تېلېگرام پرېمىيۇم ۋە جۇلالىنىپ تۇرغان يۇلتۇزلار (Telegram Premium & Glowing Stars) */}
                {promoSlides[currentSlide].type === 'telegram' && (
                  <div className="relative w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center">
                    {/* Glowing outer ambient halo */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-500/30 via-amber-400/35 to-sky-400/20 blur-2xl pointer-events-none animate-pulse" />

                    {/* Central 3D Telegram Orb */}
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 p-1 shadow-[0_12px_40px_rgba(14,165,233,0.6),0_0_25px_rgba(245,158,11,0.35)] border-2 border-white/70 flex items-center justify-center">
                      <div className="relative w-full h-full rounded-2xl bg-sky-500/85 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                        <img
                          src="/images/services/telegram.webp"
                          alt="Telegram"
                          className="w-13 h-13 sm:w-18 sm:h-18 object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
                          onError={(e) => { (e.target as any).src = '/images/services/telegram.jpg'; }}
                        />
                      </div>
                      {/* VIP Crown */}
                      <div className="absolute -top-3 -right-2 bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 p-1 sm:p-1.5 rounded-full shadow-lg border border-white animate-bounce">
                        <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-slate-950" />
                      </div>
                    </div>

                    {/* Floating & Glowing Stars (تىلگىرام يۇلتۇزلىرى جۇلالىنىپ تۇرىدۇ) */}
                    {/* Star 1 - Top Left Large Golden Glowing Star Badge */}
                    <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 flex items-center gap-1 bg-slate-950/90 border border-amber-400 rounded-full px-2 py-0.5 shadow-[0_0_16px_rgba(251,191,36,0.7)] animate-star-sparkle">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 animate-spin [animation-duration:9s]" />
                      <span className="text-[9px] sm:text-[11px] font-black text-amber-300">Stars</span>
                    </div>

                    {/* Star 2 - Bottom Right Radiant Golden Star */}
                    <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-4 p-2 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 shadow-[0_8px_25px_rgba(245,158,11,0.7)] border-2 border-white/80 animate-star-sparkle [animation-delay:0.4s]">
                      <Star className="w-4 h-4 sm:w-6 sm:h-6 text-slate-950 fill-slate-950" />
                    </div>

                    {/* Star 3 - Bottom Left Sparkling Cluster */}
                    <div className="absolute bottom-1 -left-3 sm:bottom-2 sm:-left-5 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/90 border border-amber-300/80 shadow-md animate-pulse">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                    </div>

                    {/* Star 4 - Top Right Tiny Twinkle */}
                    <div className="absolute top-1.5 right-1 animate-ping [animation-duration:2.8s]">
                      <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                    </div>
                  </div>
                )}

                {/* 2. Wi-Fi ۋە تور كارتىلىرى - سىملىرى ئۇلانغان كۆرۈنۈش (Wi-Fi Cables & Waves) */}
                {promoSlides[currentSlide].type === 'wifi' && (
                  <div className="relative w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center">
                    {/* Concentric expanding Wi-Fi radar wave rings */}
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping [animation-duration:3.2s] pointer-events-none" />
                    <div className="absolute -inset-4 rounded-full border border-teal-400/25 animate-pulse pointer-events-none" />
                    <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-emerald-600/25 via-teal-500/25 to-sky-500/20 blur-xl pointer-events-none" />

                    {/* Connected Fiber Optic Cables (SVG Animated Glowing Network Cables) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200" fill="none">
                      <path d="M 180 35 Q 140 100 100 100" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 4" className="animate-cable-pulse" opacity="0.9" />
                      <path d="M 20 165 Q 60 100 100 100" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="6 4" className="animate-cable-pulse" opacity="0.9" />
                      <path d="M 175 165 Q 130 135 100 100" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 3" opacity="0.7" />
                    </svg>

                    {/* Central 5G Wi-Fi Router Hub */}
                    <div className="relative z-10 w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-700 via-teal-800 to-slate-900 border-2 border-emerald-400/80 shadow-[0_12px_40px_rgba(16,185,129,0.55)] flex flex-col items-center justify-center p-2 text-white">
                      <div className="relative flex items-center justify-center mb-1">
                        <Wifi className="w-8 h-8 sm:w-11 sm:h-11 text-emerald-400 animate-pulse" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping" />
                      </div>
                      <span className="text-[8px] sm:text-[10px] font-black tracking-widest text-emerald-300 font-mono">5G SPEED</span>
                      <span className="text-[7.5px] sm:text-[9px] font-bold text-slate-300">ئۇلانغان تور</span>
                    </div>

                    {/* Floating Connected Card 1 - Aziz Net (عزيز نت) */}
                    <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 z-20 flex items-center gap-1.5 bg-slate-950/95 border border-emerald-400/80 rounded-xl px-2 py-1 shadow-lg animate-bounce [animation-duration:3s]">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md overflow-hidden bg-emerald-600 flex items-center justify-center">
                        <img src="/images/services/azez_net.jpg" alt="Aziz Net" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                      </div>
                      <span className="text-[8.5px] sm:text-[10px] font-bold text-white">عزيز نت</span>
                    </div>

                    {/* Floating Connected Card 2 - Al-Fursan (الفرسان) */}
                    <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-4 z-20 flex items-center gap-1 bg-slate-950/95 border border-teal-400/80 rounded-xl px-2 py-0.5 shadow-lg">
                      <Radio className="w-3 h-3 text-teal-400" />
                      <span className="text-[8.5px] sm:text-[9.5px] font-bold text-teal-200">الفرسان</span>
                    </div>

                    {/* Floating Connected Card 3 - Mujahid (المجاهد) */}
                    <div className="absolute -top-1 -right-2 sm:-top-2 sm:-right-4 z-20 flex items-center gap-1 bg-slate-950/95 border border-sky-400/80 rounded-xl px-2 py-0.5 shadow-lg">
                      <span className="text-[8.5px] sm:text-[9.5px] font-bold text-sky-300">المجاهد</span>
                    </div>
                  </div>
                )}

                {/* 3. سۈرىيەتېل ۋە ئىمتىئېن كارتىلىرى سەكرەپ تۇرىدۇ (Syriatel & MTN Floating Cards) */}
                {promoSlides[currentSlide].type === 'cards' && (
                  <div className="relative w-36 h-32 sm:w-52 sm:h-48 flex items-center justify-center">
                    {/* Glowing Aura */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600/30 via-amber-400/25 to-yellow-500/30 blur-2xl pointer-events-none" />

                    {/* Card 1: Syriatel Cash (سۈرىيەتېل كاش) - Floating and Bouncing */}
                    <div className="absolute -top-1 -left-2 sm:-top-2 sm:-left-3 z-10 w-24 sm:w-34 aspect-[1.58/1] rounded-2xl bg-gradient-to-tr from-rose-700 via-red-600 to-red-900 p-2 sm:p-2.5 shadow-[0_12px_32px_rgba(225,29,72,0.6)] border-2 border-amber-400/80 animate-syriatel-bounce text-white flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] sm:text-[10px] font-black tracking-wider text-amber-200">Syriatel Cash</span>
                        {/* EMV Gold Chip */}
                        <div className="w-4 h-3 sm:w-5 sm:h-3.5 rounded-sm bg-gradient-to-tr from-amber-300 to-yellow-200 border border-amber-600 shadow-xs" />
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[7.5px] sm:text-[9px] font-bold text-white/95">سۈرىيەتېل</span>
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-white/70 bg-white">
                          <img src="/images/services/syriatel_v2.webp" alt="Syriatel" className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = '/images/services/syriatel.jpg'; }} />
                        </div>
                      </div>
                    </div>

                    {/* Card 2: MTN Cash (ئىمتىئېن كاش) - Floating and Bouncing with Offset */}
                    <div className="absolute -bottom-1 -right-2 sm:-bottom-2 sm:-right-3 z-20 w-24 sm:w-34 aspect-[1.58/1] rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-600 p-2 sm:p-2.5 shadow-[0_12px_32px_rgba(245,158,11,0.65)] border-2 border-white/90 animate-mtn-bounce text-slate-950 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] sm:text-[10px] font-black tracking-wider text-slate-950">MTN Cash</span>
                        {/* EMV Black Chip */}
                        <div className="w-4 h-3 sm:w-5 sm:h-3.5 rounded-sm bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700 shadow-xs" />
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[7.5px] sm:text-[9px] font-black text-slate-900">ئىمتىئېن</span>
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-slate-900 bg-white">
                          <img src="/images/services/mtn_v2.webp" alt="MTN" className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = '/images/services/mtn.jpg'; }} />
                        </div>
                      </div>
                    </div>

                    {/* Floating Energy Zap Bolt in between */}
                    <div className="relative z-30 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-950 border-2 border-amber-400 shadow-[0_0_18px_#f59e0b] flex items-center justify-center animate-pulse">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                    </div>
                  </div>
                )}

                {/* 4. پۇل ئېلىش بانكىسىدىن پۇل چىقىپ تۇرغان كۆرۈنۈش (ATM Cash Dispenser Bank) */}
                {promoSlides[currentSlide].type === 'atm' && (
                  <div className="relative w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center">
                    {/* Vault Glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/30 via-teal-400/25 to-amber-400/25 blur-2xl pointer-events-none animate-pulse" />

                    {/* Futuristic 3D ATM Terminal */}
                    <div className="relative z-10 w-22 h-26 sm:w-30 sm:h-38 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-emerald-400/80 shadow-[0_16px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.45)] flex flex-col items-center justify-between p-2 sm:p-2.5 overflow-hidden">
                      {/* Top Status Header */}
                      <div className="w-full flex items-center justify-between pb-1 border-b border-white/10">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-ping" />
                          <span className="text-[7.5px] sm:text-[9px] font-black text-emerald-400 tracking-wider font-mono">AUTO CASH</span>
                        </div>
                        <Landmark className="w-3 h-3 text-amber-400" />
                      </div>

                      {/* ATM Digital Display Screen */}
                      <div className="w-full py-1 sm:py-1.5 px-2 rounded-lg bg-emerald-950/85 border border-emerald-500/40 text-center shadow-inner">
                        <span className="text-[7px] sm:text-[8px] text-emerald-300/80 block leading-none">ھەميانغا نەق پۇل</span>
                        <span className="text-[10px] sm:text-xs font-black text-emerald-300 font-mono tracking-wider animate-pulse">+ $ CASH</span>
                      </div>

                      {/* Cash Slot with Flying Banknotes Emerging (پۇل چىقىپ تۇرغان) */}
                      <div className="relative w-full pt-1">
                        {/* Glowing Green Slot */}
                        <div className="w-full h-1.5 rounded-full bg-slate-950 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />

                        {/* Emerging Banknote Animation */}
                        <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-money-dispense">
                          {/* Front Banknote */}
                          <div className="w-14 sm:w-20 h-6 sm:h-8 rounded-md bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 border border-amber-300 shadow-[0_6px_18px_rgba(0,0,0,0.7)] flex items-center justify-between px-1.5 text-white">
                            <span className="text-[7px] sm:text-[9px] font-black font-mono text-amber-200">100 $</span>
                            <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
                            <span className="text-[7px] sm:text-[9px] font-black font-mono text-amber-200">$</span>
                          </div>
                          {/* Second Banknote behind */}
                          <div className="w-12 sm:w-16 h-4 sm:h-6 -mt-3.5 rounded-md bg-emerald-700 border border-emerald-300/60 opacity-80 rotate-[6deg]" />
                        </div>
                      </div>
                    </div>

                    {/* Floating Gold Coin Badge */}
                    <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 z-20 flex items-center gap-1 bg-slate-950/90 border border-amber-400 rounded-full px-2 py-0.5 shadow-lg animate-pulse">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[8.5px] sm:text-[10px] font-black text-amber-300">24/7 كاش</span>
                    </div>

                    {/* Floating Fast Deposit Badge */}
                    <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 z-20 bg-emerald-500 text-slate-950 font-black text-[8px] sm:text-[9.5px] px-2 py-0.5 rounded-full shadow-lg border border-white">
                      شۇئان قاچىلاش
                    </div>
                  </div>
                )}

                {/* 5. دۇنيا مەۋھۇم نومۇرلىرى ۋە ھەرىكەتلىك كەلگەن كود (Global Virtual Numbers & Animated Incoming OTP Code) */}
                {promoSlides[currentSlide].type === 'numbers' && (
                  <div className="relative w-36 h-32 sm:w-56 sm:h-52 flex items-center justify-center">
                    {/* Glowing World Network Aura */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/35 via-teal-400/25 to-emerald-400/30 blur-2xl pointer-events-none animate-pulse" />

                    {/* Rotating Globe Wireframe in Background */}
                    <div className="absolute w-28 h-28 sm:w-40 sm:h-40 rounded-full border border-cyan-400/30 border-dashed animate-globe-slow pointer-events-none flex items-center justify-center">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-teal-400/20" />
                    </div>

                    {/* Floating Orbiting Country Flags around the Globe */}
                    {/* Flag 1: 🇺🇸 USA (+1) */}
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 z-20 flex items-center gap-1 bg-slate-950/95 border border-cyan-400/70 rounded-xl px-2 py-0.5 shadow-lg animate-flag-float-1">
                      <span className="text-xs">🇺🇸</span>
                      <span className="text-[8px] sm:text-[9.5px] font-black text-cyan-300 font-mono">+1 USA</span>
                    </div>

                    {/* Flag 2: 🇬🇧 UK (+44) */}
                    <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-3 z-20 flex items-center gap-1 bg-slate-950/95 border border-teal-400/70 rounded-xl px-2 py-0.5 shadow-lg animate-flag-float-2">
                      <span className="text-xs">🇬🇧</span>
                      <span className="text-[8px] sm:text-[9.5px] font-black text-teal-300 font-mono">+44 UK</span>
                    </div>

                    {/* Flag 3: 🇹🇷 Turkey (+90) */}
                    <div className="absolute -bottom-1 -left-2 sm:-bottom-2 sm:-left-3 z-20 flex items-center gap-1 bg-slate-950/95 border border-rose-500/70 rounded-xl px-2 py-0.5 shadow-lg animate-flag-float-1">
                      <span className="text-xs">🇹🇷</span>
                      <span className="text-[8px] sm:text-[9.5px] font-black text-rose-300 font-mono">+90 TR</span>
                    </div>

                    {/* Flag 4: 🇸🇾 Syria (+963) */}
                    <div className="absolute -bottom-1 -right-2 sm:-bottom-2 sm:-right-3 z-20 flex items-center gap-1 bg-slate-950/95 border border-emerald-400/70 rounded-xl px-2 py-0.5 shadow-lg animate-flag-float-2">
                      <span className="text-xs">🇸🇾</span>
                      <span className="text-[8px] sm:text-[9.5px] font-black text-emerald-300 font-mono">+963 SY</span>
                    </div>

                    {/* Central 3D Glassmorphism SMS Notification Card with Animated Incoming OTP Code */}
                    <div className="relative z-10 w-28 sm:w-42 rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-[#051124] border-2 border-cyan-400/80 shadow-[0_16px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(6,182,212,0.45)] p-2 sm:p-2.5 animate-otp-card flex flex-col gap-1.5">
                      
                      {/* Top SMS Header with live glowing icon */}
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping" />
                          <span className="text-[7.5px] sm:text-[9px] font-black text-cyan-300 font-alkatip">نەق مەيدان كود</span>
                        </div>
                        <span className="text-[7px] sm:text-[8px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                          ⚡️ 0.8s
                        </span>
                      </div>

                      {/* Virtual Phone Number Pill */}
                      <div className="w-full py-0.5 px-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-[7.5px] sm:text-[8.5px] text-slate-300 font-mono" dir="ltr">+1 (347) 819-•••</span>
                        <Smartphone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                      </div>

                      {/* Animated Incoming OTP Code Box (ھەرىكەتلىك كەلگەن كود نۇمۇرى) */}
                      <div className="w-full py-1 sm:py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-cyan-950/90 border border-emerald-400/80 shadow-[inset_0_0_12px_rgba(16,185,129,0.3)] text-center">
                        <span className="text-[6.5px] sm:text-[7.5px] text-emerald-300/90 font-bold block leading-none font-alkatip">
                          كەلگەن دەلىللەش كودى:
                        </span>
                        <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-0.5">
                          <span className="font-mono font-black text-amber-400 text-xs sm:text-base tracking-widest animate-code-digit drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                            849 - 201
                          </span>
                          <span className="w-0.5 h-3 sm:h-4 bg-emerald-400 animate-pulse" />
                        </div>
                      </div>

                      {/* Bottom Quick Status Pill */}
                      <div className="flex items-center justify-between pt-0.5 text-[6.5px] sm:text-[7.5px]">
                        <span className="text-slate-400">150+ دۆلەت</span>
                        <span className="text-emerald-400 font-bold">✓ دەلىللەندى</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {promoSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === idx
                    ? 'w-6 h-1.5 bg-white shadow-md'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          2.5 TODAY'S PROMOTIONS BANNER (3D Mechanical Split-Flap Flip Clock - Image 3)
      ========================================================================= */}
      <TodayPromotionsBanner />

      {/* =========================================================================
          3. CATEGORY SWITCHER (Horizontal Smooth Scrollable & Draggable Strip)
          1. ئەپلەر (apps)
          2. سۈنئىي ئەقىل (ai)
          3. مەۋھۇم نومۇر (numbers)
          4. Wi-Fi تور كارتىلىرى (wifi)
          5. كارتىغا پۇل قاچىلاش (cards)
          6. ئىجتىمائىي تاراتقۇ (social)
          7. ئويۇنلار (games)
      ========================================================================= */}
      <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4 mt-3 sm:mt-4">
        <div className="relative flex items-center gap-1.5 sm:gap-2">
          
          {/* Scroll Right Arrow Button (in RTL: scroll towards first items / right) */}
          <button
            type="button"
            onClick={() => scrollCategoryStrip('right')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131b2e] shadow-xs flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition active:scale-90 shrink-0 cursor-pointer z-10"
            title="ئوڭغا يۆتكەش"
            aria-label="ئوڭغا سىيرىش"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Draggable & Scrollable Horizontal Track */}
          <div
            ref={categoryScrollRef}
            onMouseDown={handleCategoryMouseDown}
            onMouseMove={handleCategoryMouseMove}
            onMouseUp={handleCategoryMouseUp}
            onMouseLeave={handleCategoryMouseUp}
            className="flex-1 flex gap-2 sm:gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none select-none overscroll-x-contain cursor-grab active:cursor-grabbing"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x'
            }}
          >
            {/* 1. ئەپلەر */}
            <button
              type="button"
              onClick={() => { if (!hasMovedRef.current) handleCategorySelect('apps'); }}
              className={`shrink-0 min-w-[96px] sm:min-w-[110px] md:min-w-[120px] flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all active:scale-95 group cursor-pointer ${
                activeCategory === 'apps'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400 animate-nav-pill-glow'
                  : theme === 'dark'
                  ? 'bg-[#131b2e] border-white/10 text-white hover:border-emerald-400/50'
                  : 'bg-white border-slate-200/90 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-emerald-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${
                activeCategory === 'apps' ? 'bg-white/20 text-white shadow-inner' : 'bg-emerald-100/80 text-emerald-600'
              }`}>
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-sparkle anim-delay-1" />
              </div>
              <span className={`font-bold text-[10.5px] sm:text-xs leading-tight ${activeCategory === 'apps' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                ئەپلەر
              </span>
              <span className={`text-[9px] leading-none ${activeCategory === 'apps' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                ({appsList.length}) تۈر
              </span>
            </button>

            {/* 2. سۈنئىي ئەقىل */}
            <button
              type="button"
              onClick={() => { if (!hasMovedRef.current) handleCategorySelect('ai'); }}
              className={`shrink-0 min-w-[96px] sm:min-w-[110px] md:min-w-[120px] flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all active:scale-95 group cursor-pointer ${
                activeCategory === 'ai'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400 animate-nav-pill-glow'
                  : theme === 'dark'
                  ? 'bg-[#131b2e] border-white/10 text-white hover:border-purple-400/50'
                  : 'bg-white border-slate-200/90 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-purple-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${
                activeCategory === 'ai' ? 'bg-white/20 text-white shadow-inner' : 'bg-purple-100/80 text-purple-600'
              }`}>
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-sparkle anim-delay-2" />
              </div>
              <span className={`font-bold text-[10.5px] sm:text-xs leading-tight ${activeCategory === 'ai' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                سۈنئىي ئەقىل
              </span>
              <span className={`text-[9px] leading-none ${activeCategory === 'ai' ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
                ({aiList.length}) تۈر
              </span>
            </button>

            {/* 3. مەۋھۇم نومۇر (SMS) */}
            <button
              type="button"
              onClick={() => { if (!hasMovedRef.current) handleCategorySelect('numbers'); }}
              className={`shrink-0 min-w-[96px] sm:min-w-[110px] md:min-w-[120px] flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all active:scale-95 group cursor-pointer ${
                activeCategory === 'numbers'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-400 animate-nav-pill-glow'
                  : theme === 'dark'
                  ? 'bg-[#131b2e] border-white/10 text-white hover:border-teal-400/50'
                  : 'bg-white border-slate-200/90 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-teal-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${
                activeCategory === 'numbers' ? 'bg-white/20 text-white shadow-inner' : 'bg-teal-100/80 text-teal-600'
              }`}>
                <MessageSquareCode className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-sparkle anim-delay-3" />
              </div>
              <span className={`font-bold text-[10.5px] sm:text-xs leading-tight ${activeCategory === 'numbers' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                مەۋھۇم نومۇر
              </span>
              <span className={`text-[9px] leading-none ${activeCategory === 'numbers' ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
                ({numbersList.length}) تۈر
              </span>
            </button>

            {/* 4. Wi-Fi تور كارتىلىرى */}
            <button
              type="button"
              onClick={() => { if (!hasMovedRef.current) handleCategorySelect('wifi'); }}
              className={`shrink-0 min-w-[96px] sm:min-w-[110px] md:min-w-[120px] flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all active:scale-95 group cursor-pointer ${
                activeCategory === 'wifi'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-400 animate-nav-pill-glow'
                  : theme === 'dark'
                  ? 'bg-[#131b2e] border-white/10 text-white hover:border-sky-400/50'
                  : 'bg-white border-slate-200/90 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-sky-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${
                activeCategory === 'wifi' ? 'bg-white/20 text-white shadow-inner' : 'bg-sky-100/80 text-sky-600'
              }`}>
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-sparkle anim-delay-4" />
              </div>
              <span className={`font-bold text-[10.5px] sm:text-xs leading-tight ${activeCategory === 'wifi' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                Wi-Fi تور كارتىلىرى
              </span>
              <span className={`text-[9px] leading-none ${activeCategory === 'wifi' ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'}`}>
                ({wifiList.length}) تۈر
              </span>
            </button>

            {/* 5. كارتىغا پۇل قاچىلاش */}
            <button
              type="button"
              onClick={() => { if (!hasMovedRef.current) handleCategorySelect('cards'); }}
              className={`shrink-0 min-w-[96px] sm:min-w-[110px] md:min-w-[120px] flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all active:scale-95 group cursor-pointer ${
                activeCategory === 'cards'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400 animate-nav-pill-glow'
                  : theme === 'dark'
                  ? 'bg-[#131b2e] border-white/10 text-white hover:border-blue-400/50'
                  : 'bg-white border-slate-200/90 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-blue-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${
                activeCategory === 'cards' ? 'bg-white/20 text-white shadow-inner' : 'bg-blue-100/80 text-blue-600'
              }`}>
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-sparkle anim-delay-5" />
              </div>
              <span className={`font-bold text-[10.5px] sm:text-xs leading-tight ${activeCategory === 'cards' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                كارتىغا پۇل قاچىلاش
              </span>
              <span className={`text-[9px] leading-none ${activeCategory === 'cards' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                ({cardsList.length}) تۈر
              </span>
            </button>

            {/* 6. ئىجتىمائىي تاراتقۇ */}
            <button
              type="button"
              onClick={() => { if (!hasMovedRef.current) handleCategorySelect('social'); }}
              className={`shrink-0 min-w-[96px] sm:min-w-[110px] md:min-w-[120px] flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all active:scale-95 group cursor-pointer ${
                activeCategory === 'social'
                  ? 'bg-pink-600 text-white border-pink-600 shadow-md ring-2 ring-pink-400 animate-nav-pill-glow'
                  : theme === 'dark'
                  ? 'bg-[#131b2e] border-white/10 text-white hover:border-pink-400/50'
                  : 'bg-white border-slate-200/90 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-pink-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${
                activeCategory === 'social' ? 'bg-white/20 text-white shadow-inner' : 'bg-pink-100/80 text-pink-600'
              }`}>
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-sparkle anim-delay-6" />
              </div>
              <span className={`font-bold text-[10.5px] sm:text-xs leading-tight ${activeCategory === 'social' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                ئىجتىمائىي تاراتقۇ
              </span>
              <span className={`text-[9px] leading-none ${activeCategory === 'social' ? 'text-pink-100' : 'text-slate-500 dark:text-slate-400'}`}>
                ({socialList.length}) تۈر
              </span>
            </button>

            {/* 7. ئويۇنلار */}
            <button
              type="button"
              onClick={() => { if (!hasMovedRef.current) handleCategorySelect('games'); }}
              className={`shrink-0 min-w-[96px] sm:min-w-[110px] md:min-w-[120px] flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all active:scale-95 group cursor-pointer ${
                activeCategory === 'games'
                  ? 'bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-400 animate-nav-pill-glow'
                  : theme === 'dark'
                  ? 'bg-[#131b2e] border-white/10 text-white hover:border-red-400/50'
                  : 'bg-white border-slate-200/90 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-red-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${
                activeCategory === 'games' ? 'bg-white/20 text-white shadow-inner' : 'bg-red-100/80 text-red-600'
              }`}>
                <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 fill-current animate-icon-sparkle anim-delay-7" />
              </div>
              <span className={`font-bold text-[10.5px] sm:text-xs leading-tight ${activeCategory === 'games' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                ئويۇنلار
              </span>
              <span className={`text-[9px] leading-none ${activeCategory === 'games' ? 'text-red-100' : 'text-slate-500 dark:text-slate-400'}`}>
                ({gamesList.length}) تۈر
              </span>
            </button>

          </div>

          {/* Scroll Left Arrow Button (in RTL: scroll towards later items / left) */}
          <button
            type="button"
            onClick={() => scrollCategoryStrip('left')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131b2e] shadow-xs flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition active:scale-90 shrink-0 cursor-pointer z-10"
            title="سولغا يۆتكەش"
            aria-label="سولغا سىيرىش"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

        </div>
      </section>


      {/* Search Bar */}
      <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4 mt-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ئويۇن، مەۋھۇم نومۇر، سۈنئىي ئەقىل، تور كارتىسى ياكى ئەپلەرنى ئىزدەش..."
            className={`w-full pr-9 pl-8 py-2 text-xs rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              theme === 'dark'
                ? 'bg-[#131b2e] border-white/15 text-white placeholder-slate-400'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </section>


      {/* =========================================================================
          IF A CATEGORY IS ACTIVE (OR SEARCHING):
      ========================================================================= */}
      {activeCategory !== 'all' || searchQuery.trim() !== '' ? (
        <section id="category-filter-header" className="max-w-[1200px] mx-auto px-3.5 sm:px-4 mt-5 sm:mt-7 mb-8 scroll-mt-4">
          
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 shadow-sm mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                {activeCategory === 'apps' && <Smartphone className="w-5 h-5" />}
                {activeCategory === 'ai' && <Bot className="w-5 h-5" />}
                {activeCategory === 'numbers' && <MessageSquareCode className="w-5 h-5" />}
                {activeCategory === 'wifi' && <Wifi className="w-5 h-5" />}
                {activeCategory === 'cards' && <CreditCard className="w-5 h-5" />}
                {activeCategory === 'social' && <Share2 className="w-5 h-5" />}
                {activeCategory === 'games' && <Gamepad2 className="w-5 h-5" />}
                {activeCategory === 'all' && <Search className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {searchQuery.trim() ? `ئىزدەش نەتىجىسى: «${searchQuery}»` :
                   activeCategory === 'apps' ? '📱 ئەپلەر' :
                   activeCategory === 'ai' ? '🤖 سۈنئىي ئەقىل' :
                   activeCategory === 'numbers' ? '💬 مەۋھۇم نومۇر (SMS)' :
                   activeCategory === 'wifi' ? '📶 Wi-Fi تور كارتىلىرى' :
                   activeCategory === 'cards' ? '💳 كارتىغا پۇل قاچىلاش' :
                   activeCategory === 'social' ? '🌐 ئىجتىمائىي تاراتقۇ' :
                   '🎮 ئويۇنلار'}
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  مەزكۇر كاتېگورىيە ئىچىدە جەمئىي {filteredActiveList.length} مەھسۇلات بار
                </span>
              </div>
            </div>

            <button
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition flex items-center gap-1"
            >
              <span>ھەممىسىنى كۆرۈش</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Direct Live SMS Activate Banner when in numbers category */}
          {activeCategory === 'numbers' && (
            <Link
              href="/numbers"
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/5 border border-teal-500/30 hover:border-teal-500/60 shadow-xs transition group cursor-pointer mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <Sparkles className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>نەق مەيدان كود تاپشۇرۇۋېلىش بازىرى (SMS Activate)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold">180+ دۇنيا ئەپلىرى</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    دۇنيا دۆلەتلىرىنىڭ يانفون نومۇرىنى تاللاپ سېتىۋېلىش ۋە دەلىللەش كودىنى شۇئان ئېلىش كۆزنىكىگە كىرىڭ
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-[-4px] transition-transform shrink-0">
                <span>سەھىپىگە كىرىش</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </Link>
          )}

          {filteredActiveList.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-white/10">
              <p className="text-sm font-bold text-slate-500">مەھسۇلات تېپىلمىدى.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
              {filteredActiveList.map((service) => (
                <ProductCard
                  key={service.id}
                  service={service}
                  isCarousel={false}
                  theme={theme}
                  onSelect={onSelectService}
                  onNavigateNumbers={() => router.push('/numbers')}
                />
              ))}
            </div>
          )}
        </section>
      ) : (

        /* =========================================================================
            IF IN ALL MODE:
            Order of sections strictly matches user's request:
            1. ئەپلەر
            2. سۈنئىي ئەقىل
            3. Wi-Fi تور كارتىلىرى
            4. كارتىغا پۇل قاچىلاش
            5. ئىجتىمائىي تاراتقۇ
            6. ئويۇنلار (ئەڭ ئاستىدا)
        ========================================================================= */
        <div className="space-y-6 sm:space-y-8 mt-5 sm:mt-7">

          {/* 1. ئەپلەر */}
          <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4" id="apps-section">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <h2 className="text-sm sm:text-base md:text-lg font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="text-emerald-600">📱</span>
                <span>ئەپلەر</span>
                <span className="text-xs font-normal text-slate-400">({appsList.length} مەھسۇلات)</span>
              </h2>
              <button
                type="button"
                onClick={() => handleCategorySelect('apps')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30 text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-90 transition-all z-10"
              >
                <span>ھەممە ئەپلەر</span>
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              </button>
            </div>

            <ProductRowCarousel items={appsList} theme={theme} onSelect={onSelectService} onNavigateNumbers={() => router.push('/numbers')} />
          </section>


          {/* 2. سۈنئىي ئەقىل */}
          <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4" id="ai-section">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <h2 className="text-sm sm:text-base md:text-lg font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="text-purple-600">🤖</span>
                <span>سۈنئىي ئەقىل</span>
                <span className="text-xs font-normal text-slate-400">({aiList.length} مەھسۇلات)</span>
              </h2>
              <button
                type="button"
                onClick={() => handleCategorySelect('ai')}
                className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-300/60 dark:border-purple-500/30 text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-90 transition-all z-10"
              >
                <span>ھەممە AI لار</span>
                <ArrowLeft className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 stroke-[2.5]" />
              </button>
            </div>

            <ProductRowCarousel items={aiList} theme={theme} onSelect={onSelectService} onNavigateNumbers={() => router.push('/numbers')} />
          </section>


          {/* 3. مەۋھۇم نومۇر (SMS) */}
          <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4" id="numbers-section">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <h2 className="text-sm sm:text-base md:text-lg font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="text-teal-600">💬</span>
                <span>مەۋھۇم نومۇر (SMS)</span>
                <span className="text-xs font-normal text-slate-400">({numbersList.length} مەھسۇلات)</span>
              </h2>
              <Link
                href="/numbers"
                className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-300/60 dark:border-teal-500/30 text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-90 transition-all z-10"
              >
                <span>بارلىق نەق مەيدان نومۇرلار</span>
                <ArrowLeft className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 stroke-[2.5]" />
              </Link>
            </div>

            <ProductRowCarousel items={numbersList} theme={theme} onSelect={onSelectService} onNavigateNumbers={() => router.push('/numbers')} />
          </section>


          {/* 4. Wi-Fi تور كارتىلىرى */}
          <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4" id="wifi-section">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <h2 className="text-sm sm:text-base md:text-lg font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="text-sky-600">📶</span>
                <span>Wi-Fi تور كارتىلىرى</span>
                <span className="text-xs font-normal text-slate-400">({wifiList.length} مەھسۇلات)</span>
              </h2>
              <button
                type="button"
                onClick={() => handleCategorySelect('wifi')}
                className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-300/60 dark:border-sky-500/30 text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-90 transition-all z-10"
              >
                <span>ھەممە Wi-Fi لار</span>
                <ArrowLeft className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 stroke-[2.5]" />
              </button>
            </div>

            <ProductRowCarousel items={wifiList} theme={theme} onSelect={onSelectService} onNavigateNumbers={() => router.push('/numbers')} />
          </section>


          {/* 5. كارتىغا پۇل قاچىلاش */}
          <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4" id="cards-section">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <h2 className="text-sm sm:text-base md:text-lg font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="text-blue-600">💳</span>
                <span>كارتىغا پۇل قاچىلاش</span>
                <span className="text-xs font-normal text-slate-400">({cardsList.length} مەھسۇلات)</span>
              </h2>
              <button
                type="button"
                onClick={() => handleCategorySelect('cards')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-300/60 dark:border-blue-500/30 text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-90 transition-all z-10"
              >
                <span>ھەممە كارتىلار</span>
                <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
              </button>
            </div>

            <ProductRowCarousel items={cardsList} theme={theme} onSelect={onSelectService} onNavigateNumbers={() => router.push('/numbers')} />
          </section>


          {/* 6. ئىجتىمائىي تاراتقۇ */}
          <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4" id="social-section">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <h2 className="text-sm sm:text-base md:text-lg font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="text-pink-600">🌐</span>
                <span>ئىجتىمائىي تاراتقۇ</span>
                <span className="text-xs font-normal text-slate-400">({socialList.length} مەھسۇلات)</span>
              </h2>
              <button
                type="button"
                onClick={() => handleCategorySelect('social')}
                className="px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300 border border-pink-300/60 dark:border-pink-500/30 text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-90 transition-all z-10"
              >
                <span>ھەممە تاراتقۇلار</span>
                <ArrowLeft className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 stroke-[2.5]" />
              </button>
            </div>

            <ProductRowCarousel items={socialList} theme={theme} onSelect={onSelectService} onNavigateNumbers={() => router.push('/numbers')} />
          </section>


          {/* 7. ئويۇنلار (ئەڭ ئاستى بۆلەككە ئورۇنلاشتۇرۇلدى) */}
          <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4" id="games-section">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <h2 className="text-sm sm:text-base md:text-lg font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="text-amber-500">★</span>
                <span>ئويۇنلار</span>
                <span className="text-xs font-normal text-slate-400">({gamesList.length} مەھسۇلات)</span>
              </h2>
              <button
                type="button"
                onClick={() => handleCategorySelect('games')}
                className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30 text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-90 transition-all z-10"
              >
                <span>ھەممە ئويۇنلار</span>
                <ArrowLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
              </button>
            </div>

            <ProductRowCarousel items={gamesList} theme={theme} onSelect={onSelectService} onNavigateNumbers={() => router.push('/numbers')} />
          </section>

        </div>
      )}


      {/* =========================================================================
          8. FOOTER: TRUST BADGES & PAYMENT METHODS (100% Uyghur)
      ========================================================================= */}
      <footer className={`border-t transition-colors mt-10 ${
        theme === 'dark' ? 'bg-[#080c14] border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      } py-8 px-4`}>
        <div className="max-w-[1200px] mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-xs text-slate-900 dark:text-white">ئاپتوماتىك ۋە تېز يەتكۈزۈش</h4>
                <p className="text-[11px] text-slate-500">پۇل تۆلەپ بولغان ھامان سېكۇنتتا يەتكۈزۈلىدۇ.</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-xs text-slate-900 dark:text-white">100% بىخەتەر ۋە رەسمىي</h4>
                <p className="text-[11px] text-slate-500">رەسمىي ۋاكالەتلىك كود ۋە كاپالەتلىك قاچىلاش.</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-xs text-slate-900 dark:text-white">24/7 ئۈزلۈكسىز خېرىدار ياردىمى</h4>
                <p className="text-[11px] text-slate-500">تېلېگرامما ئارقىلىق 24 سائەت كۈتۈۋالىمىز.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">قوللايدىغان چىقىمدانلار:</span>
              
              {/* ShamCash - Available & Active */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 font-black text-xs shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span>ShamCash (شام كاش)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500 text-white font-bold font-alkatip">ئاكتىپ</span>
              </div>

              {/* USDT (TRC20) - Coming Soon */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold text-xs">
                <span>USDT (TRC20)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-alkatip font-bold flex items-center gap-1">
                  <span>يېقىندا قوشۇلىدۇ</span>
                </span>
              </div>

              {/* Syriatel & MTN - Coming Soon */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold text-xs">
                <span>Syriatel ۋە MTN</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-alkatip font-bold flex items-center gap-1">
                  <span>يېقىندا قوشۇلىدۇ</span>
                </span>
              </div>
            </div>

            <div className="text-center sm:text-left text-xs text-slate-400 font-mono" dir="ltr">
              © 2026 AUTO CASH (auto-cash.app) • بارلىق ھوقۇق قوغدىلىدۇ
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
