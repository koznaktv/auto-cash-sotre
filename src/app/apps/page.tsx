'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AppsBottomNav from '@/components/apps/AppsBottomNav';
import {
  Zap,
  Sparkles,
  Download,
  Smartphone,
  Send,
  Clock,
  ChevronRight,
  Flame,
  Star,
  Gamepad2,
  CreditCard,
  Bot,
  PhoneCall,
  Share2,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Info,
  ArrowLeftRight,
  Home,
  ClipboardList,
  Wallet,
  User,
  Plus,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Search,
  Hourglass,
  Calendar,
  ChevronLeft
} from 'lucide-react';

interface ActiveApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  rating: number;
  ordersCount: string;
  speed: string;
  badge: string;
  badgeColor: string;
  webUrl: string;
  telegramAppUrl: string;
  priceNote: string;
  features: string[];
}

const ACTIVE_GAMES: ActiveApp[] = [
  {
    id: 'pubg',
    name: 'PUBG Mobile UC بازىرى',
    tagline: 'Midasbuy كودى ۋە رەسمىي Player ID ئارقىلىق 3 سېكۇنتتا يېتىدۇ',
    description: 'PUBG Mobile ئۈچۈن 60 UC دىن 16,200 UC غىچە، Royale Pass ۋە بارلىق ئايلىق كارتىلارنى بىۋاسىتە سەرۋەرگە سېكۇنتتا قاچىلاپ بېرىش ئەپچىسى.',
    icon: '/images/apps/pubg/icon-512.png',
    rating: 4.98,
    ordersCount: '15.8k+ قاچىلانغان',
    speed: '3 سېكۇنت',
    badge: '🔥 ئەڭ ئالقىشلانغان',
    badgeColor: 'from-amber-500 to-yellow-600',
    webUrl: '/apps/pubg',
    telegramAppUrl: 'https://t.me/maxbazar_bot/pubg',
    priceNote: '$1.10 دىن باشلىنىدۇ (60 - 16,200 UC)',
    features: ['رەسمىي سەرۋەرگە بىۋاسىتە كىرىدۇ', 'ئويۇن كىملىكى (UID) تەكشۈرۈش', 'شامكەش شحن فوري']
  },
  {
    id: 'hok',
    name: 'Honor of Kings Token بازىرى',
    tagline: 'HOK Player ID ئارقىلىق بىۋاسىتە سەرۋەرگە توكېن قاچىلاش',
    description: 'پادىشاھلار شان-شەرىپى ئويۇنى ئۈچۈن رەسمىي 16 توكېندىن 8,000 توكېن ۋە ھەپتىلىك، ئايلىق كارتىلارنى سېكۇنتتا قاچىلاپ بېرىش ئەپچىسى.',
    icon: '/images/apps/honor-of-kings/icon-512.png',
    rating: 4.96,
    ordersCount: '9.9k+ قاچىلانغان',
    speed: '5 سېكۇنت',
    badge: '👑 ئالىي دەرىجىلىك',
    badgeColor: 'from-purple-500 to-indigo-600',
    webUrl: '/apps/honor-of-kings',
    telegramAppUrl: 'https://t.me/maxbazar_bot/hok',
    priceNote: '$0.25 دىن باشلىنىدۇ (16 - 8,000 Token)',
    features: ['بىخەتەر ۋە رەسمىي يول', 'ئاپتوماتىك لاقىم (Nickname) دەلىللەش', 'سېكۇنتتا يېتىپ بارىدۇ']
  }
];

type CategoryId = 'games' | 'apps' | 'cards' | 'ai' | 'sms' | 'social';

interface CategoryItem {
  id: CategoryId;
  name: string;
  subtitle: string;
  icon: any;
  isReady: boolean;
  countBadge?: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'games',
    name: 'ئويۇنلار',
    subtitle: 'PUBG ۋە Honor of Kings تەييار',
    icon: Gamepad2,
    isReady: true,
    countBadge: '2 ئويۇن تەييار'
  },
  {
    id: 'apps',
    name: 'ئەپلەر',
    subtitle: 'يېقىندا قوشىمىز',
    icon: Layers,
    isReady: false,
    countBadge: 'يېقىندا'
  },
  {
    id: 'cards',
    name: 'كارتىغا پۇل قاچىلاش مۇلازىمەتلىرى',
    subtitle: 'يېقىندا قوشىمىز',
    icon: CreditCard,
    isReady: false,
    countBadge: 'يېقىندا'
  },
  {
    id: 'ai',
    name: 'سۈنئىي ئەقىل ئەزالىق',
    subtitle: 'يېقىندا قوشىمىز',
    icon: Bot,
    isReady: false,
    countBadge: 'يېقىندا'
  },
  {
    id: 'sms',
    name: 'مەۋھۇم نومۇر',
    subtitle: 'يېقىندا قوشىمىز',
    icon: PhoneCall,
    isReady: false,
    countBadge: 'يېقىندا'
  },
  {
    id: 'social',
    name: 'ئىجتىمائىي تاراتقۇ',
    subtitle: 'يېقىندا قوشىمىز',
    icon: Share2,
    isReady: false,
    countBadge: 'يېقىندا'
  }
];

const UPCOMING_ITEMS: Record<Exclude<CategoryId, 'games'>, Array<{ name: string; tag: string; iconEmoji: string }>> = {
  apps: [
    { name: 'Spotify Premium ئەزالىق', tag: 'ئايلىق / يىللىق پىلان', iconEmoji: '🎵' },
    { name: 'YouTube Premium ئائىلە ۋە شەخسىي', tag: 'ئېلان يوق / Background Play', iconEmoji: '▶️' },
    { name: 'CapCut Pro رەسمىي ھېسابات', tag: 'VIP ئۈنۈملەر ۋە شابلونلار', iconEmoji: '🎬' },
    { name: 'Duolingo Super تىل ئۆگىنىش', tag: 'چەكسىز جان / چەكسىز تەكرار', iconEmoji: '🦉' }
  ],
  cards: [
    { name: 'Shamcash پۇل يۆتكەش مۇلازىمىتى', tag: 'سۈرىيە پۈتۈن رايونلىرىغا', iconEmoji: '💵' },
    { name: 'Apple App Store & iTunes كارتىسى', tag: 'US / TR / Global رايونلار', iconEmoji: '🍎' },
    { name: 'Google Play Gift Card', tag: 'بارلىق ئەپ ۋە ئويۇنلارغا', iconEmoji: '🎮' },
    { name: 'Visa & Mastercard مەۋھۇم كارتا', tag: 'خەلقئارالىق توردا مال سېتىۋېلىش', iconEmoji: '💳' }
  ],
  ai: [
    { name: 'ChatGPT Plus & Team ئەزالىق', tag: 'GPT-4o ۋە ئاۋازلىق كۆرۈنۈش', iconEmoji: '🤖' },
    { name: 'Claude Pro (Anthropic)', tag: 'Claude 3.5 Sonnet چەكسىز پاراڭ', iconEmoji: '🧠' },
    { name: 'Midjourney VIP ئەزالىق', tag: 'رەسىم سىزىش / Fast Hours', iconEmoji: '🎨' },
    { name: 'Cursor AI Pro كود يازغۇچى', tag: 'پۈتۈن كود بازىسىنى بىر تەرەپ قىلىش', iconEmoji: '💻' }
  ],
  sms: [
    { name: 'تېلېگرامما ئۈچۈن مەۋھۇم نومۇر (+1, +44)', tag: 'SMS كودى 1 سېكۇنتتا كېلىدۇ', iconEmoji: '📨' },
    { name: 'WhatsApp مەۋھۇم نومۇر', tag: 'بىخەتەر شەخسىي نومۇر', iconEmoji: '💬' },
    { name: 'Google & Gmail دەلىللەش نومۇرى', tag: 'بىر قېتىملىق ۋە دائىملىق', iconEmoji: '🔑' },
    { name: 'بارلىق تور بېكەتلەر ئۈچۈن SMS كودى', tag: '180 دىن ئارتۇق دۆلەت', iconEmoji: '📱' }
  ],
  social: [
    { name: 'Telegram Premium 3/6/12 ئايلىق', tag: 'سۈرئەت 2 ھەسسە / 4GB ھۆججەت', iconEmoji: '⭐' },
    { name: 'TikTok تەڭگە (Coins) قاچىلاش', tag: 'سوۋغات ئەۋەتىش ۋە Live', iconEmoji: '🪙' },
    { name: 'Instagram ئەگەشكۈچى ۋە ئىنكاس', tag: 'ھەقىقىي ئارىلىشىش', iconEmoji: '📸' },
    { name: 'Twitter / X Blue دەلىللەنگەن بەلگە', tag: 'كۆك تامغا ۋە ئۇزۇن يازما', iconEmoji: '🐦' }
  ]
};

export default function AppsHubPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('games');
  const [showHowToInstallModal, setShowHowToInstallModal] = useState(false);
  const [selectedAppForInstall, setSelectedAppForInstall] = useState<ActiveApp | null>(null);

  // User Session & Balance State (Unified across MAX-BAZAR)
  const [session, setSession] = useState<{ token: string; identity: string; balance: number; photo_url?: string } | null>(null);
  
  // Full-Page View Navigation Tabs: 'home' | 'orders' | 'wallet' | 'account'
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'orders' | 'wallet' | 'account'>('home');

  // 1-Click Telegram Sync State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [syncBotUrl, setSyncBotUrl] = useState<string>('https://t.me/maxbazar_bot');
  const [isSyncWaiting, setIsSyncWaiting] = useState(false);

  // Shamcash Talon State (Wallet Page)
  const [talonCode, setTalonCode] = useState('');
  const [isVerifyingTalon, setIsVerifyingTalon] = useState(false);
  const [talonFeedback, setTalonFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copiedShamAddress, setCopiedShamAddress] = useState(false);

  // Orders Page Filter & Search State
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<'all' | 'completed' | 'processing' | 'refunded'>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Dynamic manifest tag check
  useEffect(() => {
    let link = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = '/manifest-apps.json';
  }, []);

  // Load Session and refresh live unified balance
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem('maxbazar_unified_session') ||
        localStorage.getItem('maxbazar_pubg_session') ||
        localStorage.getItem('maxbazar_hok_session');

      if (saved) {
        const parsed = JSON.parse(saved);
        setSession(parsed);

        // Fetch fresh unified balance
        fetch('/api/apps/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_balance',
            phone_or_username: parsed.identity,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.ok && typeof res.balance === 'number') {
              setSession((prev: any) => ({ ...prev, balance: res.balance }));
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  // Poll 1-Click Telegram Sync session when login modal is open
  useEffect(() => {
    if (!showLoginModal) {
      setSyncToken(null);
      setIsSyncWaiting(false);
      return;
    }

    let active = true;

    fetch('/api/apps/sync-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'maxbazar' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (active && data.ok && data.token) {
          setSyncToken(data.token);
          setSyncBotUrl(data.botUrl || `https://t.me/maxbazar_bot?start=${data.token}`);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      if (!syncToken) return;
      fetch(`/api/apps/sync-session?token=${encodeURIComponent(syncToken)}`)
        .then((r) => r.json())
        .then((data) => {
          if (active && data.ok && data.status === 'verified' && data.session) {
            setSession(data.session);
            try {
              localStorage.setItem('maxbazar_unified_session', JSON.stringify(data.session));
            } catch {}
            setShowLoginModal(false);
            setIsSyncWaiting(false);
          }
        })
        .catch(() => {});
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [showLoginModal, syncToken]);

  // Load orders history
  const fetchOrdersHistory = async () => {
    if (!session?.identity) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/apps/order?identity=${encodeURIComponent(session.identity)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.orders)) {
        setOrdersHistory(data.orders);
        if (typeof data.live_balance === 'number') {
          setSession((prev: any) => ({ ...prev, balance: data.live_balance }));
        }
      }
    } catch {}
    finally {
      setLoadingOrders(false);
    }
  };

  // Switch tab and load data if needed
  const handleNavClick = (tab: 'home' | 'orders' | 'wallet' | 'account') => {
    setActiveNavTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'orders') {
      fetchOrdersHistory();
    }
  };

  const handleVerifyShamcashTalon = async (e: React.FormEvent) => {
    e.preventDefault();
    setTalonFeedback(null);
    if (!talonCode.trim() || talonCode.trim().length < 5) {
      setTalonFeedback({ ok: false, msg: 'شامكەش تالون نومۇرى كەم دېگەندە 5 خانىلىق بولسۇن!' });
      return;
    }
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    setIsVerifyingTalon(true);
    try {
      const res = await fetch('/api/apps/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'shamcash_talon',
          talon: talonCode.trim(),
          phone_or_username: session.identity,
          app_id: 'maxbazar',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTalonFeedback({ ok: true, msg: data.message || '$25.00 قوشۇلدى!' });
        if (typeof data.balance === 'number') {
          setSession((prev: any) => ({ ...prev, balance: data.balance }));
        }
        setTalonCode('');
      } else {
        setTalonFeedback({ ok: false, msg: data.error || 'تالون خاتا ياكى ئىشلىتىلگەن!' });
      }
    } catch {
      setTalonFeedback({ ok: false, msg: 'تور ئۇلىنىشى مەغلۇپ بولدى' });
    } finally {
      setIsVerifyingTalon(false);
    }
  };

  const handleCopyShamcashAddress = () => {
    const shamAddr = '084c7e47a9ef332ca98418c399b6ea7d';
    try {
      navigator.clipboard.writeText(shamAddr);
      setCopiedShamAddress(true);
      setTimeout(() => setCopiedShamAddress(false), 2000);
    } catch {}
  };

  const handleCopyOrderId = (id: string) => {
    try {
      navigator.clipboard.writeText(id);
      setCopiedOrderId(id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    } catch {}
  };

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    return ordersHistory.filter((order) => {
      // 1. Status Filter
      if (ordersStatusFilter === 'completed' && order.status !== 'completed') return false;
      if (ordersStatusFilter === 'refunded' && order.status !== 'refunded') return false;
      if (
        ordersStatusFilter === 'processing' &&
        (order.status === 'completed' || order.status === 'refunded')
      )
        return false;

      // 2. Search Query
      if (ordersSearch.trim()) {
        const q = ordersSearch.toLowerCase().trim();
        const mId = (order.order_id || '').toLowerCase().includes(q);
        const mPkg = (order.package_name || '').toLowerCase().includes(q);
        const mPlayer = (order.player_id || '').toLowerCase().includes(q);
        const mApp = (order.app_id || '').toLowerCase().includes(q);
        if (!mId && !mPkg && !mPlayer && !mApp) return false;
      }
      return true;
    });
  }, [ordersHistory, ordersStatusFilter, ordersSearch]);

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900 flex flex-col font-alkatip selection:bg-amber-500 selection:text-slate-950 pb-32 sm:pb-36" dir="rtl">
      {/* Dynamic Background Soft Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-200/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-emerald-200/20 rounded-full blur-[140px]" />
      </div>

      {/* TOP BRAND HEADER */}
      {/* STICKY TOP APP HEADER BAR - MATCHES AUTO CASH */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-4 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        {/* Subtle glowing hairline top accent */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-emerald-500/40 via-amber-400/60 to-emerald-500/40 pointer-events-none" />

        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          
          {/* 1. Gateway Switcher Button (⇄ AUTO CASH) - Prominent, Clear */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95 bg-emerald-50/90 hover:bg-emerald-100/90 border-emerald-300/80 hover:border-emerald-400 text-emerald-900"
              title="auto-cash.app تور بېكىتىگە كىرىش (سۇپا ئالماشتۇرۇش)"
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-600 group-hover:rotate-180 transition-transform duration-300 shrink-0 stroke-[2.2]" />
              <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden flex-shrink-0 bg-white border border-emerald-400 shadow-xs">
                <Image
                  src="/images/autocash_official_logo.png"
                  alt="AUTO CASH"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[11px] sm:text-xs font-black text-emerald-800 font-mono tracking-tight">
                  AUTO CASH
                </span>
                <span className="text-[8.5px] text-emerald-600/90 font-bold hidden xs:block">
                  ئالماشتۇرۇش ⚡
                </span>
              </div>
            </Link>

            <a
              href="https://t.me/maxbazar_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold transition active:scale-95"
              title="تېلېگرامما بوت"
            >
              <Send className="w-3.5 h-3.5" />
              <span>@maxbazar_bot</span>
            </a>
          </div>

          {/* 2. Center: Luxury Live Balance Pill Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!session) {
                  setShowLoginModal(true);
                } else {
                  handleNavClick('wallet');
                }
              }}
              className="group flex items-center gap-2.5 bg-gradient-to-r from-amber-50 to-orange-50/90 hover:from-amber-100/90 hover:to-orange-100/90 border border-amber-300/90 hover:border-amber-400 px-3.5 sm:px-4 py-1.5 rounded-full shadow-xs transition cursor-pointer active:scale-95 shrink-0"
              title="قالدۇق پۇل كۆرۈش ۋە شامكەش ئارقىلىق قاچىلاش"
            >
              <div className="text-right">
                <span className="block text-[9px] text-amber-700/90 font-bold leading-none mb-0.5">قالدۇق</span>
                <span className="text-xs sm:text-sm font-black text-amber-800 font-mono tracking-tight">
                  ${session ? session.balance.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-400 group-hover:brightness-105 text-slate-950 flex items-center justify-center transition shadow-xs shrink-0">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </button>
          </div>

          {/* 3. Left in RTL: Official MAX-BAZAR 3D Gold Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
            title="MAX-BAZAR باش بېتى"
          >
            <div className="text-right hidden sm:block">
              <span className="font-black text-sm sm:text-base tracking-wider text-slate-900 block leading-tight group-hover:text-amber-600 transition">
                MAX-BAZAR
              </span>
              <span className="text-[9px] text-amber-700 font-bold flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>رەسمىي ئەپ بازىرى</span>
              </span>
            </div>

            {/* Official 3D Gold Round Medallion Logo */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-md group-hover:scale-105 transition-all shrink-0">
              <div className="w-full h-full bg-white rounded-full overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/maxbazar/v3/maxbazar_gold_round.png"
                  alt="MAX-BAZAR"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-full"
                  priority
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs pointer-events-none" />
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 pt-4 pb-32 sm:pb-36 w-full space-y-6 relative z-10 flex-1">
        
        {/* =========================================================================
            TAB 1: باشبەت (HOME - APPS & GAMES CATALOG)
        ========================================================================= */}
        {activeNavTab === 'home' && (
          <div className="space-y-6 animate-fadeIn">
            {/* HERO INTRO CARD */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0F172A] to-[#0A0E1A] border border-amber-500/30 p-5 md:p-6 shadow-2xl text-right">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>MAX-BAZAR مەخسۇس ئەپ چۈشۈرۈش سىستېمىسى</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white">
                  ئۆزىڭىزگە كېرەكلىك ئەپنى تاللاپ، دەرھال تېلېفونىڭىزغا قاچىلاڭ
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                  تۆۋەندىكى تۈرلەردىن ئۆزىڭىزگە لازىملىق ئەپ ياكى ئويۇننى تاللاڭ. «تېلېفونغا قاچىلاش» نى باسىپ ئەپنى تېلېفونىڭىزنىڭ باش ئېكرانىغا چۈشۈرۈۋېلىڭ ياكى تور كۆرگۈچتە بىۋاسىتە ئېچىپ ئىشلىتىڭ.
                </p>
              </div>
            </section>

            {/* 6 CATEGORIES TABS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>مۇلازىمەت ۋە ئەپ كاتېگورىيەلىرى (6 تۈر):</span>
                </h2>
                <span className="text-[11px] text-slate-500">
                  بىرنى تاللاڭ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const IconComp = cat.icon;
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`relative p-3.5 rounded-2xl border transition-all text-right flex flex-col justify-between gap-2 active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-[#0F172A] border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                        }`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        {cat.countBadge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            cat.isReady
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {cat.countBadge}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className={`text-xs font-black truncate ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                          {cat.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {cat.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ACTIVE GAMES LIST */}
            {selectedCategory === 'games' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-amber-400" />
                    <span>ھازىرقى پۈتكەن ئويۇن ئەپلىرى (بىسىپلا تېلېفونغا چۈشۈرۈۋالالايسىز):</span>
                  </h2>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    2 ئويۇن تەييار
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ACTIVE_GAMES.map((game) => (
                    <div
                      key={game.id}
                      className="rounded-3xl bg-gradient-to-b from-slate-900 via-[#0F172A] to-[#0A0E1A] border border-amber-500/40 p-5 shadow-2xl flex flex-col justify-between gap-4 hover:border-amber-400 transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-400/50 p-1 flex-shrink-0 shadow-xl">
                          <Image
                            src={game.icon}
                            alt={game.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover rounded-xl"
                            priority
                          />
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${game.badgeColor} text-slate-950 font-black`}>
                              {game.badge}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold font-mono">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{game.rating}</span>
                            </div>
                          </div>

                          <h3 className="text-base font-black text-white">
                            {game.name}
                          </h3>
                          <p className="text-[11px] text-amber-300 font-medium">
                            {game.tagline}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {game.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">قاچىلىنىش سۈرئىتى:</span>
                          <span className="text-emerald-400 font-black font-mono">⚡ {game.speed}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">باھا دائىرىسى:</span>
                          <span className="text-amber-300 font-black">{game.priceNote}</span>
                        </div>
                      </div>

                      {/* Dual Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedAppForInstall(game);
                            setShowHowToInstallModal(true);
                          }}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 stroke-[3]" />
                          <span>تېلېفونغا چۈشۈرۈش</span>
                        </button>

                        <Link
                          href={game.webUrl}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 border border-slate-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>ئەپنى ئېچىش</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* UPCOMING CATEGORIES PLACEHOLDER */}
            {selectedCategory !== 'games' && (
              <section className="rounded-3xl bg-slate-900/50 border border-slate-800 p-6 md:p-8 space-y-5 text-right">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold mb-1">
                      <Clock className="w-3 h-3" />
                      <span>تەييارلىنىۋاتىدۇ (يېقىندا قوشۇلىدۇ)</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                    </h3>
                  </div>
                  <span className="text-2xl">⏳</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  بۇ مۇلازىمەت ئۈچۈن مەخسۇس ئايرىم سېستىما ۋە قاچىلاش ئەپچىلىرى ئەڭ يۇقىرى سۈرئەت ۋە ئەرزان باھادا تۈزۈلۈۋاتىدۇ. يېقىندا ئېلان قىلىنىدۇ.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {UPCOMING_ITEMS[selectedCategory as Exclude<CategoryId, 'games'>]?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{item.iconEmoji}</span>
                        <div className="text-right">
                          <h4 className="text-xs font-bold text-white">{item.name}</h4>
                          <span className="text-[10px] text-slate-400">{item.tag}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        يېقىندا
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: مېنىڭ تەلەپلىرىم (ORDERS - FULL PAGE VIEW MATCHING SCREENSHOT 2)
        ========================================================================= */}
        {activeNavTab === 'orders' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavClick('home')}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                  title="باشبەتكە قايتىش"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-amber-400" />
                    <span>تەلەپلىرىم</span>
                  </h1>
                  <p className="text-[11px] text-slate-400">
                    بارلىق زاكاز ۋە ئاپتوماتىك قاچىلاش نەتىجىلىرى
                  </p>
                </div>
              </div>

              <button
                onClick={fetchOrdersHistory}
                disabled={loadingOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-amber-400 transition cursor-pointer active:scale-95"
                title="يېڭىلاش"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                <span>يېڭىلاش</span>
              </button>
            </div>

            {/* Filter Card Container */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3.5 shadow-xs">
              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  placeholder="زاكاز نومۇرى ياكى مەھسۇلات نامى بويىچە ئىزدەش..."
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pr-3 pl-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-sans"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setOrdersStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
                    ordersStatusFilter === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ھەممىسى
                </button>
                <button
                  onClick={() => setOrdersStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 ${
                    ordersStatusFilter === 'completed'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تاماملاندى</span>
                </button>
                <button
                  onClick={() => setOrdersStatusFilter('processing')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 ${
                    ordersStatusFilter === 'processing'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Hourglass className="w-3.5 h-3.5" />
                  <span>بىر تەرەپ قىلىنىۋاتىدۇ</span>
                </button>
                <button
                  onClick={() => setOrdersStatusFilter('refunded')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 ${
                    ordersStatusFilter === 'refunded'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>قايتۇرۇلدى</span>
                </button>
              </div>

              {/* Counter Pill */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-400 text-[11px]">زاكاز نەتىجىلىرى سانى:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[11px]">
                  {filteredOrders.length} نەتىجە
                </span>
              </div>
            </div>

            {/* Orders List Container */}
            <div className="space-y-3">
              {!session ? (
                <div className="p-8 rounded-3xl bg-[#0F172A] border border-amber-500/30 text-center space-y-3 shadow-md">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white">ئالدى بىلەن كىرىڭ</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    زاكازلىرىڭىزنى كۆرۈش ئۈچۈن، تېلېگرامما ئارقىلىق بىر كۇنۇپكا بىلەن ھېساباتىڭىزنى ئۇلاڭ.
                  </p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs shadow-md transition active:scale-95 inline-flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>تېلېگراممىدا بىر كۇنۇپكا بىلەن ئۇلاش</span>
                  </button>
                </div>
              ) : loadingOrders ? (
                <div className="p-12 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span>زاكازلار يۈكلىنىۋاتىدۇ...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-slate-400 text-xs space-y-2">
                  <p className="text-sm font-bold text-slate-300">تېخى ھېچقانداق زاكاز چۈشۈرۈلمىگەن</p>
                  <p className="text-[11px] text-slate-500">
                    باشبەتكە چىقىپ خالىغان ئويۇن ياكى ئەپنى تاللاپ دەرھال قاچىلاپ سىناپ بېقىڭ.
                  </p>
                  <button
                    onClick={() => handleNavClick('home')}
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 inline-block"
                  >
                    ئويۇن بازىرىغا بېرىش
                  </button>
                </div>
              ) : (
                filteredOrders.map((order, i) => {
                  const isCompleted = order.status === 'completed';
                  const isRefunded = order.status === 'refunded';
                  const isWait = !isCompleted && !isRefunded;

                  return (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-xs hover:border-amber-400/60 transition"
                    >
                      {/* Top Row: Order ID + Status Badge */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyOrderId(order.order_id || '')}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-[11px] transition active:scale-95"
                            title="زاكاز نومۇرىنى كۆچۈرۈش"
                          >
                            {copiedOrderId === order.order_id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>#{order.order_id}</span>
                          </button>
                        </div>

                        {isCompleted && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تاماملاندى</span>
                          </span>
                        )}
                        {isWait && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Hourglass className="w-3.5 h-3.5 animate-spin" />
                            <span>بىر تەرەپ قىلىنىۋاتىدۇ</span>
                          </span>
                        )}
                        {isRefunded && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <X className="w-3.5 h-3.5" />
                            <span>قايتۇرۇلدى</span>
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Package Name & Price */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-white">
                            {order.package_name || (order.app_id === 'pubg' ? 'PUBG Mobile UC' : 'Honor of Kings Token')}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>ئويۇنچى UID: <strong className="font-mono text-slate-200">{order.player_id}</strong></span>
                            <span>•</span>
                            <span>ئەپ: <strong className="text-amber-400">{order.app_id?.toUpperCase()}</strong></span>
                          </p>
                        </div>
                        <span className="text-base font-black font-mono text-amber-400">
                          ${Number(order.price || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Bottom Note if refunded */}
                      {isRefunded && order.refund_note && (
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                          {order.refund_note}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: مېنىڭ ھەميانىم (WALLET & TOP-UP - FULL PAGE VIEW)
        ========================================================================= */}
        {activeNavTab === 'wallet' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavClick('home')}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                  title="باشبەتكە قايتىش"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-amber-400" />
                    <span>مېنىڭ ھەميانىم</span>
                  </h1>
                  <p className="text-[11px] text-slate-400">
                    شامكەش ئارقىلىق دەل ۋاقتىدا قالدۇق قاچىلاش
                  </p>
                </div>
              </div>
            </div>

            {/* Live Balance Showcase Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0F172A] to-[#0A0E1A] border border-amber-500/40 shadow-xl space-y-3">
              <span className="text-xs text-slate-400 font-bold block">
                مەۋجۇت قالدۇقىڭىز (بارلىق ماكس بازار ئەپ ۋە ئويۇنلىرىدا ئورتاق):
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400 tracking-tight">
                  ${session ? session.balance.toFixed(2) : '0.00'}
                </span>
                <span className="text-xs text-amber-300 font-bold">USD</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>بۇ قالدۇق PUBG، Honor of Kings ۋە باشقا بارلىق ئەپلەردە تەڭ ئىشلىتىلىدۇ.</span>
              </p>
            </div>

            {/* ShamCash Talon Form */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-4 shadow-sm text-right">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>شامكەش ئارقىلىق پۇل قاچىلاش باسقۇچى</span>
                </h3>
                <p className="text-xs text-slate-400">
                  شامكەش ھېسابىمىزغا پۇل ئۇرۇپ، تالون نومۇرىنى كىرگۈزسىڭىزلا قالدۇق دەرھال قوشۇلىدۇ.
                </p>
              </div>

              {/* ShamCash Address Info */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="text-right space-y-0.5">
                  <span className="text-[10px] text-slate-400 block font-bold">رەسمىي شامكەش ئادرېسىمىز:</span>
                  <span className="font-mono text-amber-300 font-bold text-xs select-all">
                    084c7e47a9ef332ca98418c399b6ea7d
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyShamcashAddress}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  {copiedShamAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedShamAddress ? 'كۆچۈرۈلدى' : 'كۆچۈرۈش'}</span>
                </button>
              </div>

              {/* Talon Input Form */}
              <form onSubmit={handleVerifyShamcashTalon} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    شامكەش تالون نومۇرى (Talon Number):
                  </label>
                  <input
                    type="text"
                    value={talonCode}
                    onChange={(e) => setTalonCode(e.target.value)}
                    placeholder="مەسىلەن: 98452174"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono text-center text-sm focus:outline-none focus:border-amber-400 transition"
                  />
                </div>

                {talonFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      talonFeedback.ok
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {talonFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{talonFeedback.msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingTalon}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isVerifyingTalon ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>تەكشۈرۈلۈۋاتىدۇ...</span>
                    </>
                  ) : (
                    <span>تەستىقلاش ۋە قالدۇق قاچىلاش</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: مېنىڭ ھېسابىم (ACCOUNT & PROFILE - FULL PAGE VIEW)
        ========================================================================= */}
        {activeNavTab === 'account' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavClick('home')}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                  title="باشبەتكە قايتىش"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-400" />
                    <span>مېنىڭ ھېسابىم</span>
                  </h1>
                  <p className="text-[11px] text-slate-400">
                    MAX-BAZAR شەخسىي ھېسابات ئۇچۇرلىرى
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Card */}
            {session ? (
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 text-center space-y-4 shadow-xs text-slate-900">
                <div className="w-20 h-20 rounded-full border-2 border-amber-400 mx-auto overflow-hidden bg-slate-800 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                  {session.photo_url ? (
                    <img src={session.photo_url} alt={session.identity} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-2xl">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">{session.identity}</h3>
                  <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تېلېگرامما ئارقىلىق دەلىللەنگەن</span>
                  </p>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between text-right max-w-sm mx-auto">
                  <span className="text-xs text-slate-400">قالدۇقىڭىز:</span>
                  <span className="font-mono font-black text-amber-600 text-xl">${session.balance.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-sm mx-auto pt-2">
                  <button
                    onClick={() => handleNavClick('wallet')}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>قالدۇق قاچىلاش</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('orders')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 border border-slate-700"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>زاكازلىرىمنى كۆرۈش</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 max-w-sm mx-auto">
                  <button
                    onClick={() => {
                      setSession(null);
                      try {
                        localStorage.removeItem('maxbazar_unified_session');
                        localStorage.removeItem('maxbazar_pubg_session');
                        localStorage.removeItem('maxbazar_hok_session');
                      } catch {}
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <User className="w-4 h-4" />
                    <span>ھېساباتتىن چىقىپ كېتىش</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">تېخى ھېساباتقا كىرمىدىڭىز</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    تېلېگراممىدا پەقەت Start نى بىرنىلا بېسىپ، ھېساباتىڭىزنى دەرھال ئۇلاڭ.
                  </p>
                </div>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 hover:from-sky-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 transition active:scale-95 mx-auto"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>تېلېگراممىدا بىر كۇنۇپكا بىلەن ئۇلاش</span>
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* =========================================================================
          AUTHENTIC MOBILE BOTTOM NAVIGATION (Silky-Smooth Floating 3D Jewel Bubble)
      ========================================================================= */}
      <AppsBottomNav
        activeTab={activeNavTab}
        onTabChange={handleNavClick}
        ordersCount={ordersHistory.length}
        userPhoto={session?.photo_url}
      />

      {/* 1-CLICK TELEGRAM SYNC MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-amber-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setIsSyncWaiting(false);
              }}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 left-4"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#0088cc]/15 text-[#0088cc] flex items-center justify-center mx-auto mb-3 border border-[#0088cc]/30 shadow-lg shadow-[#0088cc]/10">
              <Send className="w-7 h-7 translate-x-0.5 -translate-y-0.5" />
            </div>

            <h3 className="text-base font-black text-white">تېلېگرامما ئارقىلىق كىرىش</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5 leading-relaxed max-w-xs mx-auto">
              پارول ياكى كود كىرگۈزۈش ھاجەتسىز. تۆۋەندىكى تۈگمىنى بېسىپ تېلېگراممىدا <strong>«Start (باشلاش)»</strong> نى بىرنىلا باسسىڭىز، بۇ ئەپ ئۆزلۈكىدىن دەرھال كىرىدۇ.
            </p>

            {isSyncWaiting ? (
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs text-center space-y-2 animate-pulse">
                <div className="flex items-center justify-center gap-2 font-bold text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>تېلېگراممىدىن جاۋاب كۈتۈۋاتىدۇ...</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  تېلېگرامما ئېچىلغاندا <strong>«Start (باشلاش)»</strong> نى بېسىپ ئەپكە قايتىپ كېلىڭ، ئەپ دەرھال ئۆزلۈكىدىن كىرىدۇ!
                </p>
              </div>
            ) : (
              <a
                href={syncBotUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsSyncWaiting(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 hover:from-sky-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 transition active:scale-95"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>تېلېگراممىدا بىر كۇنۇپكا بىلەن ئۇلاش</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* HOW TO INSTALL MODAL */}
      {showHowToInstallModal && selectedAppForInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-amber-500/40 p-6 shadow-2xl space-y-4 text-right">
            <button
              onClick={() => setShowHowToInstallModal(false)}
              className="absolute left-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 pt-1">
              <div className="relative w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/50 p-0.5 bg-slate-950">
                <Image
                  src={selectedAppForInstall.icon}
                  alt={selectedAppForInstall.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-[14px]"
                  priority
                />
              </div>

              <div>
                <h3 className="text-base font-black text-white">
                  {selectedAppForInstall.name}
                </h3>
                <p className="text-xs text-amber-400 font-medium mt-0.5">
                  تېلېفون ئېكرانىغا ئەپ قىلىپ چۈشۈرۈش
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>🤖 Android (Chrome) دا قاچىلاش:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  1. تۆۋەندىكى «ئەپنى ئېچىش» كۇنۇپكىسىنى بېسىڭ.<br />
                  2. تور كۆرگۈچنىڭ ئوڭ ئۈستىدىكى ئۈچ چېكىتنى (⋮) بېسىڭ.<br />
                  3. <strong>«Install app (ئەپنى قاچىلاش)»</strong> ياكى <strong>«Add to Home screen»</strong> نى تاللاڭ.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>📱 iPhone (Safari) دە قاچىلاش:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  1. تۆۋەندىكى «ئەپنى ئېچىش» كۇنۇپكىسىنى بېسىڭ.<br />
                  2. Safari نىڭ ئاستىدىكى ھەمبەھىرلەش كۇنۇپكىسىنى (Share) بېسىڭ.<br />
                  3. <strong>«Add to Home Screen (باش ئېكرانغا قوشۇش)»</strong> نى بېسىڭ.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={selectedAppForInstall.webUrl}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>دەرھال ئەپنى ئېچىپ قاچىلاش</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
