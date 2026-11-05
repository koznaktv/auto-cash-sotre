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
  ChevronLeft,
  Crown,
  Activity,
  LogOut,
  HelpCircle,
  ArrowUpRight
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
    subtitle: 'PUBG ۋە HOK تەييار',
    icon: Gamepad2,
    isReady: true,
    countBadge: '2 ئويۇن تەييار'
  },
  {
    id: 'apps',
    name: 'ئەپلەر',
    subtitle: 'Spotify & YouTube',
    icon: Layers,
    isReady: false,
    countBadge: 'يېقىندا'
  },
  {
    id: 'cards',
    name: 'كارتىلار',
    subtitle: 'Apple & Play & Visa',
    icon: CreditCard,
    isReady: false,
    countBadge: 'يېقىندا'
  },
  {
    id: 'ai',
    name: 'سۈنئىي ئەقىل',
    subtitle: 'ChatGPT & Claude Pro',
    icon: Bot,
    isReady: false,
    countBadge: 'يېقىندا'
  },
  {
    id: 'sms',
    name: 'مەۋھۇم نومۇر',
    subtitle: 'Telegram & WhatsApp',
    icon: PhoneCall,
    isReady: false,
    countBadge: 'يېقىندا'
  },
  {
    id: 'social',
    name: 'ئىجتىمائىي تاراتقۇ',
    subtitle: 'Telegram Stars & TikTok',
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
            token: parsed.token || '',
            identity: parsed.identity || ''
          })
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.success && typeof data.balance === 'number') {
              const updated = { ...parsed, balance: data.balance };
              setSession(updated);
              localStorage.setItem('maxbazar_unified_session', JSON.stringify(updated));
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  // Fetch Orders History when navigating to orders tab
  const fetchOrdersHistory = () => {
    if (!session?.token && !session?.identity) return;
    setLoadingOrders(true);
    fetch('/api/apps/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'history',
        token: session.token || '',
        phone_or_username: session.identity || ''
      })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.orders)) {
          setOrdersHistory(data.orders);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoadingOrders(false);
      });
  };

  useEffect(() => {
    if (activeNavTab === 'orders') {
      fetchOrdersHistory();
    }
  }, [activeNavTab, session]);

  // Handle Copy Shamcash Address
  const handleCopyShamcashAddress = () => {
    navigator.clipboard.writeText('084c7e47a9ef332ca98418c399b6ea7d');
    setCopiedShamAddress(true);
    setTimeout(() => setCopiedShamAddress(false), 2000);
  };

  // Handle Verify ShamCash Talon
  const handleVerifyShamcashTalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!talonCode.trim()) return;
    setIsVerifyingTalon(true);
    setTalonFeedback(null);

    try {
      const res = await fetch('/api/deposit/verify-talon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          talon: talonCode.trim(),
          source: 'maxbazar_wallet',
          userToken: session?.token,
          identity: session?.identity
        })
      });
      const data = await res.json();
      if (data?.success) {
        setTalonFeedback({
          ok: true,
          msg: `✅ تالون تەستىقلاندى! $${Number(data.amount || 0).toFixed(2)} قالدۇقىڭىزغا دەرھال قوشۇلدى.`
        });
        setTalonCode('');
        if (session && typeof data.newBalance === 'number') {
          const updated = { ...session, balance: data.newBalance };
          setSession(updated);
          localStorage.setItem('maxbazar_unified_session', JSON.stringify(updated));
        }
      } else {
        setTalonFeedback({
          ok: false,
          msg: data?.error || 'تالون تەكشۈرۈش مەغلۇپ بولدى، نومۇرنى توغرا كىرگۈزۈڭ ياكى سەل تەخىر قىلىڭ.'
        });
      }
    } catch {
      setTalonFeedback({
        ok: false,
        msg: 'تور ئۇلىنىشىدا كاشىلا كۆرۈلدى. سەل تەخىر قىلىپ قايتا سىناڭ.'
      });
    } finally {
      setIsVerifyingTalon(false);
    }
  };

  // Start 1-Click Telegram Sync Login
  const startTelegramSync = async () => {
    setIsSyncWaiting(true);
    try {
      const r = await fetch('/api/apps/telegram-sync?action=create');
      const d = await r.json();
      if (d?.sync_token) {
        setSyncToken(d.sync_token);
        const botUrl = `https://t.me/maxbazar_bot?start=sync_${d.sync_token}`;
        setSyncBotUrl(botUrl);

        // Open Telegram Bot
        if (typeof window !== 'undefined') {
          window.open(botUrl, '_blank');
        }

        // Poll for sync completion
        const startT = Date.now();
        const pollTimer = setInterval(async () => {
          if (Date.now() - startT > 120000) {
            clearInterval(pollTimer);
            setIsSyncWaiting(false);
            return;
          }
          try {
            const pollRes = await fetch(`/api/apps/telegram-sync?action=poll&sync_token=${d.sync_token}`);
            const pollData = await pollRes.json();
            if (pollData?.authenticated && pollData.session) {
              clearInterval(pollTimer);
              setIsSyncWaiting(false);
              setShowLoginModal(false);
              setSession(pollData.session);
              localStorage.setItem('maxbazar_unified_session', JSON.stringify(pollData.session));
            }
          } catch {}
        }, 2000);
      }
    } catch {
      setIsSyncWaiting(false);
    }
  };

  const handleNavClick = (tab: 'home' | 'orders' | 'wallet' | 'account') => {
    setActiveNavTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('maxbazar_unified_session');
    localStorage.removeItem('maxbazar_pubg_session');
    localStorage.removeItem('maxbazar_hok_session');
    setActiveNavTab('home');
  };

  // Open Install Modal for an app
  const handleOpenInstallModal = (app?: ActiveApp) => {
    setSelectedAppForInstall(app || ACTIVE_GAMES[0]);
    setShowHowToInstallModal(true);
  };

  // Filter Orders
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
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-alkatip selection:bg-amber-500 selection:text-slate-950 pb-32 sm:pb-36" dir="rtl">
      
      {/* Modern App Store Space Glow Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-emerald-600/10 rounded-full blur-[140px]" />
      </div>

      {/* =========================================================================
          STICKY TOP APP STORE HEADER BAR
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#080d1a]/95 backdrop-blur-xl border-b border-amber-500/20 px-3 sm:px-4 py-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        {/* Subtle glowing hairline top accent */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-emerald-500/30 via-amber-400/50 to-emerald-500/30 pointer-events-none" />

        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          
          {/* 1. Gateway Switcher Button (⇄ AUTO CASH) - Prominent, High-Tech Pill */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border text-xs font-bold transition-all shadow-md shrink-0 active:scale-95 bg-gradient-to-r from-[#031c14]/95 via-[#06291e]/95 to-[#041a12]/95 border-emerald-500/50 hover:border-emerald-400 text-slate-100 hover:text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              title="auto-cash.app تور بېكىتىگە كىرىش (سۇپا ئالماشتۇرۇش)"
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-300 shrink-0 stroke-[2.2]" />
              <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden flex-shrink-0 bg-slate-950 border border-emerald-400/60 shadow-xs">
                <Image
                  src="/images/autocash_official_logo.png"
                  alt="AUTO CASH"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[11px] sm:text-xs font-black text-emerald-300 font-mono tracking-tight group-hover:text-emerald-200 transition-colors">
                  AUTO CASH
                </span>
                <span className="text-[8.5px] text-emerald-400/80 font-bold hidden xs:block">
                  ئالماشتۇرۇش ⚡
                </span>
              </div>
            </Link>

            <a
              href="https://t.me/maxbazar_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold transition active:scale-95"
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
              className="group flex items-center gap-2.5 bg-gradient-to-b from-[#141F38] via-[#0E172B] to-[#0A1020] hover:from-[#182647] hover:to-[#0F1932] border border-amber-400/50 hover:border-amber-300 px-3.5 sm:px-4 py-1.5 rounded-full shadow-[0_4px_16px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_22px_rgba(245,158,11,0.35)] transition cursor-pointer active:scale-95 shrink-0"
              title="قالدۇق پۇل كۆرۈش ۋە شامكەش ئارقىلىق قاچىلاش"
            >
              <div className="text-right">
                <span className="block text-[9px] text-amber-200/90 font-bold leading-none mb-0.5">قالدۇق</span>
                <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tracking-tight group-hover:text-amber-200 transition-colors">
                  ${session ? session.balance.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 group-hover:brightness-110 text-slate-950 flex items-center justify-center transition shadow-md shrink-0">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </button>
          </div>

          {/* 3. Left in RTL: Official MAX-BAZAR 3D Gold Round Medallion Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
            title="MAX-BAZAR باش بېتى"
          >
            <div className="text-right hidden sm:block">
              <span className="font-black text-sm sm:text-base tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent block leading-tight group-hover:brightness-110 transition">
                MAX-BAZAR
              </span>
              <span className="text-[9px] text-amber-300/80 font-bold flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>رەسمىي ئەپ بازىرى</span>
              </span>
            </div>

            {/* Official 3D Gold Round Medallion Logo */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-[0_0_15px_rgba(251,191,36,0.45)] group-hover:shadow-[0_0_20px_rgba(251,191,36,0.7)] group-hover:scale-105 transition-all shrink-0">
              <div className="w-full h-full bg-[#070B14] rounded-full overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/maxbazar/v3/maxbazar_gold_round.png"
                  alt="MAX-BAZAR"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-full"
                  priority
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B101D] shadow-xs pointer-events-none" />
            </div>
          </div>

        </div>
      </header>

      {/* =========================================================================
          MAIN CONTENT CONTAINER
      ========================================================================= */}
      <main className="max-w-5xl mx-auto px-4 pt-4 pb-32 sm:pb-36 w-full space-y-6 relative z-10 flex-1">
        
        {/* =========================================================================
            TAB 1: باشبەت (HOME - MODERN APP STORE CATALOG)
        ========================================================================= */}
        {activeNavTab === 'home' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* HERO SPOTLIGHT BANNER CARD */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e172a] via-[#091122] to-[#050914] border border-amber-500/30 p-5 md:p-7 shadow-2xl text-right group">
              {/* Top ambient gold shimmer beam */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>MAX-BAZAR رەسمىي ئەپ بازىرى</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                  ئۆزىڭىزگە كېرەكلىك ئەپنى تاللاپ، <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">دەرھال تېلېفونىڭىزغا قاچىلاڭ</span>
                </h1>
                
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  تۆۋەندىكى تۈرلەردىن ئۆزىڭىزگە لازىملىق ئەپ ياكى ئويۇننى تاللاڭ. «تېلېفونغا قاچىلاش» نى باسىپ ئەپنى تېلېفونىڭىزنىڭ باش ئېكرانىغا چۈشۈرۈۋېلىڭ ياكى تور كۆرگۈچتە بىۋاسىتە ئېچىپ، قالدۇق پۇل ئارقىلىق 3 سېكۇنتتا يەتكۈزۈۋېلىڭ!
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    onClick={() => handleOpenInstallModal()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>تېلېفونغا ئەپ قىلىپ چۈشۈرۈش قوللانمىسى</span>
                  </button>

                  <a
                    href="https://t.me/maxbazar_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    <span>تېلېگرامما بوتتا ئېچىش</span>
                  </a>
                </div>
              </div>
            </section>

            {/* 6 MODERN CATEGORY SQUIRCLE CARDS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>مۇلازىمەت ۋە ئەپ بۆلۈملىرى (6 تۈر):</span>
                </h2>
                <span className="text-[11px] text-slate-400">
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
                      className={`relative p-3.5 rounded-2xl border transition-all text-right flex flex-col justify-between gap-2.5 active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/20 via-[#0F172A] to-[#0A1020] border-amber-400/80 shadow-lg shadow-amber-500/15 ring-1 ring-amber-400/40'
                          : 'bg-[#0c1424]/90 hover:bg-[#101b30] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                          isSelected ? 'bg-amber-400 text-slate-950 font-black shadow-md' : 'bg-slate-800 text-slate-300'
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

            {/* ACTIVE APPS & GAMES (APPLE APP STORE / TAPTAP STYLE) */}
            {selectedCategory === 'games' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-amber-400" />
                    <span>ھازىرقى تەييار ئەپ ۋە ئويۇنلار:</span>
                  </h2>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>2 ئويۇن تەييار</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ACTIVE_GAMES.map((game) => (
                    <div
                      key={game.id}
                      className="rounded-3xl bg-gradient-to-b from-[#0f182c]/95 via-[#0b1222]/95 to-[#070c18]/95 border border-slate-800/90 hover:border-amber-400/50 p-5 shadow-2xl flex flex-col justify-between gap-4 transition-all duration-300 group"
                    >
                      <div className="flex items-start gap-3.5 sm:gap-4">
                        {/* Modern Squircle App Icon with Glowing Ring */}
                        <div className="relative w-20 h-20 rounded-[22px] overflow-hidden bg-slate-950 border-2 border-amber-400/40 p-1 flex-shrink-0 shadow-xl group-hover:scale-105 group-hover:border-amber-400 transition-all">
                          <Image
                            src={game.icon}
                            alt={game.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover rounded-[18px]"
                            priority
                          />
                        </div>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${game.badgeColor} text-slate-950 font-black shrink-0`}>
                              {game.badge}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold font-mono">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{game.rating}</span>
                              <span className="text-slate-500 text-[9px]">({game.ordersCount})</span>
                            </div>
                          </div>

                          <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors truncate">
                            {game.name}
                          </h3>
                          <p className="text-[11px] text-amber-300/90 font-medium truncate">
                            {game.tagline}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {game.description}
                          </p>
                        </div>
                      </div>

                      {/* Specs Badge Box */}
                      <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">قاچىلىنىش سۈرئىتى:</span>
                          <span className="text-emerald-400 font-black font-mono">⚡ {game.speed} دە يېتىدۇ</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">باھا دائىرىسى:</span>
                          <span className="text-amber-300 font-black font-mono">{game.priceNote}</span>
                        </div>
                      </div>

                      {/* Features Check List */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-300">
                        {game.features.map((feat, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 flex items-center gap-1 text-slate-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>

                      {/* Action Pill Buttons (Download & Open) */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleOpenInstallModal(game)}
                          className="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                          <span>تېلېفونغا قاچىلاش</span>
                        </button>

                        <Link
                          href={game.webUrl}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-95"
                        >
                          <span>ئېچىش ۋە سېتىۋېلىش</span>
                          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* UPCOMING CATEGORY CATALOG PREVIEWS */}
            {selectedCategory !== 'games' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>يېقىندا قوشۇلىدىغان مەھسۇلاتلار:</span>
                  </h2>
                  <span className="text-xs text-amber-400 font-bold bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    تەييارلىنىۋاتىدۇ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {UPCOMING_ITEMS[selectedCategory]?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-gradient-to-b from-[#0e1628]/90 to-[#090f1d]/90 border border-slate-800/90 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                          {item.iconEmoji}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-white">{item.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.tag}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
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
            TAB 2: مېنىڭ تەلەپلىرىم (ORDERS - FULL PAGE VIEW MATCHING SCREENSHOT 4)
        ========================================================================= */}
        {activeNavTab === 'orders' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Header Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1424] border border-slate-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavClick('home')}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="باشبەتكە قايتىش"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 transition cursor-pointer active:scale-95"
                title="يېڭىلاش"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                <span>يېڭىلاش</span>
              </button>
            </div>

            {/* Filter Card Container */}
            <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-3.5 shadow-md">
              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  placeholder="زاكاز نومۇرى ياكى مەھسۇلات نامى بويىچە ئىزدەش..."
                  className="w-full bg-[#080d18] border border-slate-700/80 rounded-xl pr-3 pl-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-sans"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setOrdersStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 cursor-pointer ${
                    ordersStatusFilter === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ھەممىسى
                </button>
                <button
                  onClick={() => setOrdersStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 cursor-pointer ${
                    ordersStatusFilter === 'completed'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تاماملاندى</span>
                </button>
                <button
                  onClick={() => setOrdersStatusFilter('processing')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 cursor-pointer ${
                    ordersStatusFilter === 'processing'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Hourglass className="w-3.5 h-3.5" />
                  <span>بىر تەرەپ قىلىنىۋاتىدۇ</span>
                </button>
                <button
                  onClick={() => setOrdersStatusFilter('refunded')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 cursor-pointer ${
                    ordersStatusFilter === 'refunded'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>قايتۇرۇلدى</span>
                </button>
              </div>

              {/* Counter Pill */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 text-[11px]">زاكاز نەتىجىلىرى سانى:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[11px]">
                  {filteredOrders.length} نەتىجە
                </span>
              </div>
            </div>

            {/* Orders List Container */}
            <div className="space-y-3">
              {!session ? (
                <div className="p-8 rounded-3xl bg-[#0c1424] border border-amber-500/30 text-center space-y-3 shadow-md">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white">ئالدى بىلەن كىرىڭ</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    زاكازلىرىڭىزنى كۆرۈش ئۈچۈن، تېلېگرامما ئارقىلىق بىر كۇنۇپكا بىلەن ھېساباتىڭىزنى ئۇلاڭ.
                  </p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs shadow-md transition active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>تېلېگراممىدا بىر كۇنۇپكا بىلەن ئۇلاش</span>
                  </button>
                </div>
              ) : loadingOrders ? (
                <div className="p-12 rounded-2xl bg-[#0c1424] border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span>زاكازلار يۈكلىنىۋاتىدۇ...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0c1424] border border-slate-800 text-center text-slate-400 text-xs space-y-2">
                  <p className="text-sm font-bold text-slate-300">تېخى ھېچقانداق زاكاز چۈشۈرۈلمىگەن</p>
                  <p className="text-[11px] text-slate-500">
                    باشبەتكە چىقىپ خالىغان ئويۇن ياكى ئەپنى تاللاپ دەرھال قاچىلاپ سىناپ بېقىڭ.
                  </p>
                  <button
                    onClick={() => handleNavClick('home')}
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 inline-block cursor-pointer"
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
                      key={order.order_id || i}
                      className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800/90 space-y-3 shadow-md hover:border-slate-700 transition"
                    >
                      {/* Top Row: Order ID + Status Badge */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (order.order_id) {
                                navigator.clipboard.writeText(order.order_id);
                                setCopiedOrderId(order.order_id);
                                setTimeout(() => setCopiedOrderId(null), 2000);
                              }
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-[11px] transition active:scale-95 cursor-pointer"
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
                            {order.package_name || 'MAX-BAZAR مەھسۇلاتى'}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>ئويۇنچى UID: <strong className="font-mono text-slate-200">{order.player_id}</strong></span>
                            {order.created_at && (
                              <>
                                <span>•</span>
                                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                              </>
                            )}
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
            TAB 3: مېنىڭ ھەميانىم (WALLET & SHAM CASH TOP-UP - FINTECH VIP DIGITAL CARD)
        ========================================================================= */}
        {activeNavTab === 'wallet' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1424] border border-slate-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavClick('home')}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="باشبەتكە قايتىش"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-amber-400" />
                    <span>مېنىڭ ھەميانىم</span>
                  </h1>
                  <p className="text-[11px] text-slate-400">
                    شامكەش ئارقىلىق دەل ۋاقتىدا قالدۇق قاچىلاش ۋە باشقۇرۇش
                  </p>
                </div>
              </div>
            </div>

            {/* FUTURISTIC VIP FINTECH DIGITAL CARD */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#16233d] via-[#0d1627] to-[#080d19] border border-amber-400/40 shadow-2xl space-y-5 text-white">
              {/* Top ambient holographic gleam */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 -left-12 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Card Top Row: Logo + Chip + Contactless Symbol */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md flex items-center justify-center">
                    <Image
                      src="/images/maxbazar/v3/maxbazar_gold_round.png"
                      alt="MAX-BAZAR"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-widest text-white block leading-none">
                      MAX-BAZAR
                    </span>
                    <span className="text-[9px] font-bold text-amber-300 font-mono">
                      DIGITAL VIP WALLET
                    </span>
                  </div>
                </div>

                {/* EMV Chip & Contactless Waves */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-5 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-200/80 shadow-xs flex items-center justify-center">
                    <div className="w-full h-[1px] bg-amber-700/60" />
                  </div>
                  <span className="text-slate-400 text-xs font-mono tracking-tight font-black">
                    ))))
                  </span>
                </div>
              </div>

              {/* Card Balance Display */}
              <div className="space-y-1 relative z-10 pt-1">
                <span className="text-[11px] text-amber-300/80 font-bold block">
                  مەۋجۇت ھەميان قالدۇقى:
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-tight text-shadow-sm">
                    ${session ? session.balance.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-xs text-amber-400 font-black font-mono">USD</span>
                </div>
              </div>

              {/* Card Bottom Row: User Identity & Common Balance Tag */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">ھېسابات كىملىكى:</span>
                  <span className="font-mono font-bold text-slate-200 text-xs">
                    {session?.identity || 'تېخى ئۇلانمىغان'}
                  </span>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ئورتاق بىردەك قالدۇق</span>
                </div>
              </div>
            </div>

            {/* SHAMCASH TOP-UP SECTION */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0c1424] border border-slate-800 space-y-4 shadow-md text-right">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>شامكەش ئارقىلىق قالدۇق قاچىلاش باسقۇچى</span>
                </h3>
                <p className="text-xs text-slate-400">
                  شامكەش ئادرېسىمىزغا پۇل ئەۋەتىپ، تالون نومۇرىنى بۇ يەرگە كىرگۈزسىڭىزلا سىستېما سېكۇنت ئىچىدە قالدۇق قوشۇپ بېرىدۇ.
                </p>
              </div>

              {/* ShamCash Address Info */}
              <div className="p-3.5 rounded-2xl bg-[#080d18] border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="text-right space-y-0.5">
                  <span className="text-[10px] text-slate-400 block font-bold">رەسمىي شامكەش ئادرېسىمىز:</span>
                  <span className="font-mono text-amber-300 font-bold text-xs select-all">
                    084c7e47a9ef332ca98418c399b6ea7d
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyShamcashAddress}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl bg-[#080d18] border border-slate-700 text-white placeholder-slate-500 font-mono text-center text-sm focus:outline-none focus:border-amber-400 transition"
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
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isVerifyingTalon ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>تەكشۈرۈلۈۋاتىدۇ...</span>
                    </>
                  ) : (
                    <span>تەستىقلاش ۋە دەرھال قالدۇق قاچىلاش</span>
                  )}
                </button>
              </form>

              {/* WhatsApp Quick Assistance */}
              <div className="pt-2">
                <a
                  href="https://wa.me/905526666014?text=MAX-BAZAR%20شامكەش%20قاچىلاش%20ياردەم"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <span>WhatsApp ئارقىلىق تېز قاچىلاش ياردىمى سوراش</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: مېنىڭ ھېسابىم (ACCOUNT & PROFILE - FULL PAGE VIEW)
        ========================================================================= */}
        {activeNavTab === 'account' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Header Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1424] border border-slate-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavClick('home')}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="باشبەتكە قايتىش"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-400" />
                    <span>مېنىڭ ھېسابىم</span>
                  </h1>
                  <p className="text-[11px] text-slate-400">
                    تېلېگرامما ئارقىلىق ئۇلانغان شەخسىي ھېسابات ئۇچۇرلىرى
                  </p>
                </div>
              </div>
            </div>

            {!session ? (
              <div className="p-8 rounded-3xl bg-[#0c1424] border border-amber-500/30 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-400/50 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">تېخى كىرمىدىڭىز</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    زاكاز خاتىرىسى، ئورتاق قالدۇق ۋە ساقلانغان ھېساباتلارنى باشقۇرۇش ئۈچۈن دەرھال كىرىڭ.
                  </p>
                </div>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 text-white font-black text-xs shadow-lg transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>تېلېگراممىدا بىر كۇنۇپكا بىلەن كىرىش</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User Card */}
                <div className="p-6 rounded-3xl bg-[#0c1424] border border-amber-500/30 text-center relative shadow-xl overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                  {/* Profile Avatar */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400 mx-auto mb-3 shadow-[0_0_25px_rgba(251,191,36,0.4)] relative bg-[#1E293B] flex items-center justify-center">
                    {session.photo_url ? (
                      <img
                        src={session.photo_url}
                        alt={session.identity}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-10 h-10 text-amber-400" />
                    )}
                  </div>

                  <h3 className="text-base font-black text-white">
                    {session.identity}
                  </h3>

                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>MAX-BAZAR VIP ئەزا</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      <span>ئۇلانغان</span>
                    </span>
                  </div>

                  {/* Quick Balance Chip */}
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-[#080d18] border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                    <span>قالدۇقىڭىز:</span>
                    <span className="text-sm text-amber-400 font-black">${session.balance.toFixed(2)}</span>
                  </div>
                </div>

                {/* iOS App Store Style Grouped Actions */}
                <div className="rounded-3xl bg-[#0c1424] border border-slate-800 overflow-hidden divide-y divide-slate-800/80 shadow-md text-right">
                  {/* Action 1: Orders */}
                  <button
                    onClick={() => handleNavClick('orders')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">مېنىڭ تەلەپلىرىم (زاكازلار)</span>
                        <span className="text-[10px] text-slate-400">سېتىۋالغان ۋە قاچىلانغان زاكازلارنى كۆرۈش</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Action 2: Wallet */}
                  <button
                    onClick={() => handleNavClick('wallet')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">ھەميان ۋە قالدۇق قاچىلاش</span>
                        <span className="text-[10px] text-slate-400">شامكەش ئارقىلىق دەرھال پۇل سېلىش</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Action 3: Switch to AUTO CASH */}
                  <Link
                    href="/"
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <ArrowLeftRight className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">AUTO CASH ئاساسىي دۇكىنىغا كىرىش</span>
                        <span className="text-[10px] text-slate-400">تور كارتىلىرى، مەۋھۇم نومۇر ۋە سۈنئىي ئەقىل مەركىزى</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </Link>

                  {/* Action 4: Telegram Bot */}
                  <a
                    href="https://t.me/maxbazar_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
                        <Send className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">تېلېگرامما بوتىمىز (@maxbazar_bot)</span>
                        <span className="text-[10px] text-slate-400">24/7 ئاپتوماتىك قاچىلاش ۋە ئۇقتۇرۇشلار</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </a>

                  {/* Action 5: PWA Install */}
                  <button
                    onClick={() => handleOpenInstallModal()}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">تېلېفونغا ئەپ قىلىپ قاچىلاش (PWA)</span>
                        <span className="text-[10px] text-slate-400">ئېكرانغا بەلگە قويۇۋېلىش قوللانمىسى</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Action 6: Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full p-4 flex items-center justify-between hover:bg-rose-500/10 text-rose-400 transition cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-rose-400 block">ھېساباتتىن چىقىش</span>
                        <span className="text-[10px] text-rose-400/70">ئۈسكۈنىدىن ئۇچۇرنى بىخەتەر ئۆچۈرۈش</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* =========================================================================
          AUTHENTIC BOTTOM NAVIGATION (Floating 3D Jewel Bubble - Dark Mode)
      ========================================================================= */}
      <AppsBottomNav
        activeTab={activeNavTab}
        onTabChange={handleNavClick}
        ordersCount={ordersHistory.length}
        userPhoto={session?.photo_url}
        theme="dark"
        backgroundColor="#070b14"
      />

      {/* =========================================================================
          PWA INSTALL GUIDE MODAL
      ========================================================================= */}
      {showHowToInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-[#0f172a] via-[#091122] to-[#050914] border border-amber-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-right space-y-4">
            <button
              onClick={() => setShowHowToInstallModal(false)}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 left-4 cursor-pointer transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
                <Download className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white">
                تېلېفونغا ئەپ قىلىپ چۈشۈرۈش
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                بۇ ئەپنى ئايرىم چۈشۈرمەيلا بىۋاسىتە تېلېفونىڭىزنىڭ باش ئېكرانىغا قاچىلاپ، ھەقىقىي يەرلىك ئەپتەك سېكۇنتتا ئىشلىتەلەيسىز!
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-200 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="font-black text-amber-300 block">📱 Android (Chrome تور كۆرگۈچ):</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  1. ئوڭ تەرەپ ئۈستىدىكى ئۈچ چېكىتنى <strong>(⋮)</strong> بېسىڭ.<br />
                  2. <strong>«Install app»</strong> ياكى <strong>«Add to Home screen»</strong> (باش ئېكرانغا قوشۇش) نى تاللاڭ.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="font-black text-sky-300 block">🍏 iPhone / iPad (Safari):</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  1. ئاستىدىكى ھەمبەھىرلەش كۇنۇپكىسىنى <strong>(Share / كۋادرات ۋە ئوق)</strong> بېسىڭ.<br />
                  2. تىزىملىكتىن <strong>«Add to Home Screen»</strong> (باش ئېكرانغا قوشۇش) نى بېسىڭ.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHowToInstallModal(false)}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              چۈشەندىم، رەھمەت!
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          1-CLICK TELEGRAM SYNC MODAL
      ========================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-[#0f172a] via-[#091122] to-[#050914] border border-amber-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setIsSyncWaiting(false);
              }}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 left-4 cursor-pointer transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mx-auto shadow-lg">
              <Send className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                تېلېگراممىدا 1 سېكۇنتتا كىرىش
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                ھېچقانداق پارول ياكى ئەنگە ئېلىش ھاجەتسىز. كۇنۇپكىنى بېسىپ @maxbazar_bot نى بىر قېتىم قوزغاتسىڭىز، قالدۇقىڭىز ۋە زاكازلىرىڭىز شۇئان تەڭ قەدەملىشىدۇ.
              </p>
            </div>

            {isSyncWaiting ? (
              <div className="p-4 rounded-2xl bg-slate-900 border border-sky-500/40 space-y-3">
                <div className="flex items-center justify-center gap-2 text-sky-300 font-bold text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>تېلېگرامما جاۋابى كۈتۈلۈۋاتىدۇ...</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  بوتتا <strong>/start</strong> نى باسقان ھامان بۇ بەت ئۆزلۈكىدىن ئېچىلىدۇ.
                </p>
                <a
                  href={syncBotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-md transition active:scale-95"
                >
                  تېلېگراممىنى قايتا ئېچىش ➔
                </a>
              </div>
            ) : (
              <button
                onClick={startTelegramSync}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-black text-sm shadow-lg shadow-sky-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>تېلېگرامما ئارقىلىق دەرھال ئۇلاش</span>
              </button>
            )}

            <p className="text-[10px] text-slate-500">
              * بۇ بىخەتەر ۋە رەسمىي تېلېگرامما دەلىللەش سىستېمىسى.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
