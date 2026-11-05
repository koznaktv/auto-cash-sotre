'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  ArrowLeftRight
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

  // Dynamic manifest tag check: point to manifest-apps.json
  useEffect(() => {
    let link = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = '/manifest-apps.json';
  }, []);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 pb-20" dir="rtl">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      {/* TOP BRAND HEADER */}
      <header className="sticky top-0 z-40 bg-[#0B101D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[2px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#070B14] rounded-[14px] flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="MAX-BAZAR"
                  width={32}
                  height={32}
                  className="object-contain"
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                  }}
                />
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  MAX-BAZAR
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  ئەپ چۈشۈرۈش بازىسى
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                رەسمىي ئەپ ۋە ئويۇنلارنى تاللاپ چۈشۈرۈش مەركىزى
              </p>
            </div>
          </div>

          {/* Quick External Links: Main Website & Telegram Bot */}
          <div className="flex items-center gap-2">
            <a
              href="https://t.me/maxbazar_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold transition active:scale-95"
              title="تېلېگرامما بوت"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">@maxbazar_bot</span>
            </a>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition active:scale-95 shadow-sm"
              title="auto-cash.app تور بېكىتىگە كىرىش"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
              <div className="relative w-4 h-4 rounded-md overflow-hidden flex-shrink-0 bg-slate-900">
                <Image
                  src="/images/autocash_official_logo.png"
                  alt="AUTO CASH"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-mono">AUTO CASH</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 pt-5 pb-12 w-full space-y-6 relative z-10 flex-1">
        
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
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>مۇلازىمەت ۋە ئەپ كاتېگورىيەلىرى (6 تۈر):</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              بىرنى تاللاڭ
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/15'
                      : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {cat.countBadge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          cat.isReady
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {cat.countBadge}
                      </span>
                    )}
                  </div>

                  <div>
                    <span
                      className={`block text-xs font-black leading-tight ${
                        isActive ? 'text-amber-300' : 'text-slate-200'
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {cat.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* CATEGORY 1: ACTIVE GAMES (PUBG MOBILE & HONOR OF KINGS) */}
        {selectedCategory === 'games' && (
          <section className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">
                  ھازىر بار بولغان رەسمىي ئويۇن ئەپلىرى (2 تال):
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">
                ✓ 100% تەييار • تېلېفونغا قاچىلىغىلى بولىدۇ
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACTIVE_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="group relative rounded-3xl bg-gradient-to-b from-[#0F172A] via-[#0C1222] to-[#070B14] border border-slate-800 hover:border-amber-500/50 p-5 transition duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-amber-500/10"
                >
                  <div>
                    {/* Top Row: Icon + Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-xl border-2 border-amber-400/50 bg-slate-950 p-0.5">
                        <Image
                          src={game.icon}
                          alt={game.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover rounded-[14px]"
                          priority
                        />
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r ${game.badgeColor} text-white shadow-sm`}>
                          {game.badge}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                          {game.priceNote}
                        </span>
                      </div>
                    </div>

                    {/* App Title & Details */}
                    <div className="space-y-1 text-right">
                      <h3 className="font-black text-lg text-white group-hover:text-amber-400 transition">
                        {game.name}
                      </h3>
                      <p className="text-xs text-amber-400 font-medium">
                        {game.tagline}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {game.description}
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="grid grid-cols-1 gap-1.5 pt-3 mt-3 border-t border-slate-800/80">
                      {game.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 pt-3 text-[11px] text-slate-400 border-t border-slate-800/60 mt-3">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{game.rating}</span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <span>{game.ordersCount}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>{game.speed} يېتىدۇ</span>
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Primary Button: Open and Install on Phone */}
                      <Link
                        href={game.webUrl}
                        className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95"
                      >
                        <Smartphone className="w-4 h-4 stroke-[2.5]" />
                        <span>📱 ئەپنى ئېچىش</span>
                      </Link>

                      {/* Install Guide Button */}
                      <button
                        onClick={() => {
                          setSelectedAppForInstall(game);
                          setShowHowToInstallModal(true);
                        }}
                        className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-xs transition active:scale-95"
                      >
                        <Download className="w-4 h-4 text-amber-400" />
                        <span>قاچىلاش قوللانمىسى</span>
                      </button>
                    </div>

                    {/* Secondary Telegram Mini App button */}
                    <a
                      href={game.telegramAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold transition active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>تېلېگراممىدا مىنى ئەپ (Mini App) قىلىپ ئېچىش</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* OTHER 5 CATEGORIES (COMING SOON) */}
        {selectedCategory !== 'games' && (
          <section className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-black text-white">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.name} - پات يېقىندا قوشۇلىدۇ!
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                بۇ بۆلەكتىكى ئەپ ۋە مۇلازىمەتلەر ئىنچىكە تەييارلىنىۋاتىدۇ. تەييار بولۇشى بىلەن بىر كۇنۇپكا بىلەن تېلېفونىڭىزغا قاچىلاپ سېكۇنتتا ئىشلىتەلەيسىز.
              </p>
            </div>

            {/* List of planned services in this category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {UPCOMING_ITEMS[selectedCategory as Exclude<CategoryId, 'games'>]?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-between gap-3 text-right"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{item.iconEmoji}</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.tag}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold whitespace-nowrap">
                    يېقىندا قوشىمىز
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setSelectedCategory('games')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition active:scale-95"
              >
                <span>🎮 تەييار ئويۇنلارنى كۆرۈش (PUBG & HOK)</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </section>
        )}

        {/* BOTTOM HELPFUL GUIDE CARD */}
        <section className="rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#121B33] to-[#0F172A] border border-slate-800 p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-right">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>MAX-BAZAR ئەپ بازىرى كاپالىتى</span>
            </div>
            <p className="text-xs text-slate-300">
              بارلىق ئەپلەر تېلېفوننىڭ ئېكرانىغا بىۋاسىتە چۈشىدۇ ۋە ئۆزىگە مەخسۇس ئايكون رەسىمى بىلەن ساقلىنىدۇ.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://t.me/maxbazar_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>@maxbazar_bot نى قوزغىتىش</span>
            </a>
          </div>
        </section>
      </main>

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
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>🤖 Android (Chrome) دا قاچىلاش:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  1. تۆۋەندىكى «ئەپنى ئېچىش» كۇنۇپكىسىنى بېسىڭ.<br />
                  2. تور كۆرگۈچنىڭ ئوڭ ئۈستىدىكى ئۈچ چېكىتنى (⋮) بېسىڭ.<br />
                  3. <strong>«Install app (ئەپنى قاچىلاش)»</strong> ياكى <strong>«Add to Home screen»</strong> نى تاللاڭ.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
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
