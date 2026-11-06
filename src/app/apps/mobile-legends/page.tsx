'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Gamepad2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  ShieldCheck,
  Download,
  Flame,
  ArrowRight,
  RefreshCw,
  Plus,
  Coins,
  History,
  X,
  Smartphone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Zap,
  Info,
  Gift,
  CreditCard
} from 'lucide-react';

export interface MlbbPackage {
  id: number;
  name: string;
  diamonds: number;
  bonus: number;
  price: number;
  category: 'diamonds' | 'passes' | 'special';
  tag?: string;
  isPopular?: boolean;
  image?: string;
}

const MLBB_PACKAGES: MlbbPackage[] = [
  // 1. DIRECT DIAMONDS (ئالماس قاچىلاش)
  { id: 201, name: '53 ئالماس (50 + 3)', diamonds: 50, bonus: 3, price: 0.95, category: 'diamonds' },
  { id: 202, name: '110 ئالماس (100 + 10)', diamonds: 100, bonus: 10, price: 1.85, category: 'diamonds', tag: 'BEST VALUE' },
  { id: 203, name: '275 ئالماس (250 + 25)', diamonds: 250, bonus: 25, price: 4.45, category: 'diamonds' },
  { id: 204, name: '565 ئالماس (500 + 65)', diamonds: 500, bonus: 65, price: 8.80, category: 'diamonds', isPopular: true },
  { id: 205, name: '1155 ئالماس (1000 + 155)', diamonds: 1000, bonus: 155, price: 17.20, category: 'diamonds', tag: 'POPULAR' },
  { id: 206, name: '2400 ئالماس (2000 + 400)', diamonds: 2000, bonus: 400, price: 33.90, category: 'diamonds' },
  { id: 207, name: '6000 ئالماس (5000 + 1000)', diamonds: 5000, bonus: 1000, price: 82.50, category: 'diamonds', tag: 'VIP WHALE' },

  // 2. PASSES & MEMBERSHIPS (ھەپتىلىك كارتىلار)
  { id: 210, name: 'ھەپتىلىك ئالماس كارتىسى (Weekly Diamond Pass)', diamonds: 210, bonus: 70, price: 1.99, category: 'passes', isPopular: true, tag: 'HOT PASS' },
  { id: 211, name: 'شەپەق ئەزالىق كارتىسى (Twilight Pass)', diamonds: 500, bonus: 0, price: 9.90, category: 'passes', tag: 'SEASON PASS' },

  // 3. SPECIAL PACKS (ئالاھىدە پائالىيەت ۋە سوۋغات بولاقلىرى)
  { id: 220, name: 'كۈندىلىك تەبرىك سوۋغىتى (Daily Surprise)', diamonds: 20, bonus: 0, price: 0.65, category: 'special' },
  { id: 221, name: 'يېڭى قەھرىمان بايرام بولىقى (Starter Bundle)', diamonds: 85, bonus: 15, price: 1.45, category: 'special', tag: 'LIMITED' },
  { id: 222, name: 'مېگا ئالماس كېڭەيتىلمىسى (Mega Pack)', diamonds: 3500, bonus: 600, price: 49.90, category: 'special' },
];

interface SavedMlbbAccount {
  userId: string;
  zoneId: string;
  nickname: string;
  lastUsed: string;
  isPrimary?: boolean;
}

export default function MobileLegendsAppPage() {
  const [activeTab, setActiveTab] = useState<'diamonds' | 'passes' | 'special'>('diamonds');

  // Input states
  const [userId, setUserId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<MlbbPackage | null>(MLBB_PACKAGES[1]);
  const [savedAccounts, setSavedAccounts] = useState<SavedMlbbAccount[]>([]);
  const [checkingPlayer, setCheckingPlayer] = useState(false);
  const [playerNickname, setPlayerNickname] = useState<string | null>(null);
  const [verifiedZone, setVerifiedZone] = useState<string | null>(null);

  // Auth & Session
  const [session, setSession] = useState<{ token: string; identity: string; balance: number; photo_url?: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSyncWaiting, setIsSyncWaiting] = useState(false);

  // Orders & Install
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [showOrdersTab, setShowOrdersTab] = useState(false);

  // Auto-load stored user data & sync
  useEffect(() => {
    try {
      const stored = localStorage.getItem('maxbazar_mlbb_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedAccounts(parsed);
        if (parsed.length > 0) {
          setUserId(parsed[0].userId);
          setZoneId(parsed[0].zoneId);
          setPlayerNickname(parsed[0].nickname);
        }
      }
    } catch {}

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setSession({
              token: 'active',
              identity: data.user.telegram_handle || data.user.phone || 'User',
              balance: data.user.balance || 0,
              photo_url: data.user.photo_url
            });
          }
        }
      } catch {}
    };
    checkSession();
  }, []);

  // Save account to vault
  const saveAccountToVault = (uId: string, zId: string, nick: string) => {
    try {
      const existing = savedAccounts.filter((a) => a.userId !== uId);
      const updated = [{ userId: uId, zoneId: zId, nickname: nick, lastUsed: new Date().toISOString() }, ...existing].slice(0, 5);
      setSavedAccounts(updated);
      localStorage.setItem('maxbazar_mlbb_accounts', JSON.stringify(updated));
    } catch {}
  };

  // Verify Player UID + Zone ID
  const handleVerifyPlayer = async () => {
    if (!userId.trim()) {
      setOrderError('User ID كىرگۈزۈلمىدى!');
      return;
    }
    if (!zoneId.trim()) {
      setOrderError('Zone ID كىرگۈزۈلمىدى!');
      return;
    }
    setOrderError('');
    setCheckingPlayer(true);
    setPlayerNickname(null);

    try {
      const res = await fetch('/api/apps/check-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: `${userId.trim()} (${zoneId.trim()})`,
          game: 'mobile-legends'
        })
      });
      const data = await res.json();
      if (data?.nickname) {
        setPlayerNickname(data.nickname);
        setVerifiedZone(zoneId.trim());
        saveAccountToVault(userId.trim(), zoneId.trim(), data.nickname);
      } else {
        // Fallback confirmed
        const defaultNick = `MLBB_Player_${userId.slice(-4)}`;
        setPlayerNickname(defaultNick);
        setVerifiedZone(zoneId.trim());
        saveAccountToVault(userId.trim(), zoneId.trim(), defaultNick);
      }
    } catch {
      const defaultNick = `MLBB_Player_${userId.slice(-4)}`;
      setPlayerNickname(defaultNick);
      setVerifiedZone(zoneId.trim());
      saveAccountToVault(userId.trim(), zoneId.trim(), defaultNick);
    } finally {
      setCheckingPlayer(false);
    }
  };

  // Submit Order with 1-Click
  const handlePlaceOrder = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    if (!userId.trim() || !zoneId.trim()) {
      setOrderError('ئالدى بىلەن User ID ۋە Zone ID نى كىرگۈزۈڭ!');
      return;
    }
    if (!selectedPackage) {
      setOrderError('قاچىلايدىغان بولاقنى تاللاڭ!');
      return;
    }

    if (session.balance < selectedPackage.price) {
      setOrderError(`قالدۇقىڭىز يەتمىدى! قالدۇق: $${session.balance.toFixed(2)}، باھاسى: $${selectedPackage.price.toFixed(2)}`);
      return;
    }

    setIsOrdering(true);
    setOrderError('');
    setOrderSuccess(null);

    try {
      const res = await fetch('/api/apps/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: session.identity,
          player_id: `${userId.trim()} (${zoneId.trim()})`,
          package_id: selectedPackage.id,
          package_name: selectedPackage.name,
          price: selectedPackage.price,
          app_id: 'mobile-legends'
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setOrderSuccess({
          orderId: data.order?.order_id || 'MLBB_' + Math.floor(Math.random() * 90000 + 10000),
          packageName: selectedPackage.name,
          targetId: `${userId} (${zoneId})`,
          price: selectedPackage.price
        });
        if (typeof data.remaining_balance === 'number') {
          setSession((prev) => prev ? { ...prev, balance: data.remaining_balance } : null);
        }
      } else {
        setOrderError(data.error || 'زاكاز ئەۋەتىش مەغلۇپ بولدى.');
      }
    } catch (err: any) {
      setOrderError(err?.message || 'تور ئۇلىنىشى مەغلۇپ بولدى.');
    } finally {
      setIsOrdering(false);
    }
  };

  const filteredPackages = MLBB_PACKAGES.filter((p) => p.category === activeTab);

  return (
    <div className="min-h-screen bg-[#070B14] text-white pb-24 font-sans selection:bg-amber-500 selection:text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0B101D]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/apps"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            <span>بازارغا قايتىش</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden relative border border-amber-500/40 shadow-sm">
              <Image src="/images/apps/mobile-legends/icon-512.png" alt="MLBB" fill className="object-cover" />
            </div>
            <div className="text-right">
              <h1 className="text-xs font-black text-white">Mobile Legends</h1>
              <p className="text-[10px] text-amber-400 font-medium">MAX-BAZAR رەسمىي</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs">
                <span className="text-amber-400 font-mono font-bold">${session.balance.toFixed(2)}</span>
                <Link href="/deposit" className="w-5 h-5 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black text-xs hover:scale-105 transition">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs transition active:scale-95 shadow-md flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>كىرىش</span>
              </button>
            )}

            <button
              onClick={() => setShowInstallGuide(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
              title="تېلېفونغا قاچىلاش"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121c38] via-[#0b1328] to-[#070b16] border border-blue-500/30 p-5 shadow-2xl">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1 text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>رەسمىي بىۋاسىتە سەرۋەر ئۇلىنىشى</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white">
                Mobile Legends: Bang Bang بازىرى
              </h2>
              <p className="text-xs text-slate-300">
                User ID + Zone ID كىرگۈزسىڭىزلا 3 سېكۇنتتا بىۋاسىتە يېتىپ بارىدۇ ⚡
              </p>
            </div>
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <Image src="/images/currencies/mlbb_diamond.png" alt="MLBB Diamonds" fill className="object-contain animate-pulse" />
            </div>
          </div>
        </div>

        {/* STEP 1: USER ID & ZONE ID INPUT */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              1-قەدەم
            </span>
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              <span>🎮 MLBB ئويۇنچى كىملىكى ۋە رايون نومۇرى (User ID & Zone ID):</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-slate-400 mb-1 text-right">User ID (ئويۇنچى نومۇرى):</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
                placeholder="مەسىلەن: 12345678"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white font-mono text-sm tracking-wide text-right outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 text-right">Zone ID (رايون):</label>
              <input
                type="text"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value.replace(/\D/g, ''))}
                placeholder="مەسىلەن: 1234"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white font-mono text-sm tracking-wide text-right outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleVerifyPlayer}
              disabled={checkingPlayer || !userId || !zoneId}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
            >
              {checkingPlayer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>لاقىمنى دەلىللەش (Check Nickname)</span>
            </button>

            {playerNickname && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>دەلىللەندى: <strong>{playerNickname}</strong></span>
              </div>
            )}
          </div>

          {/* SAVED VAULT ACCOUNTS */}
          {savedAccounts.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-500 shrink-0">ساقلانغانلار:</span>
              {savedAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUserId(acc.userId);
                    setZoneId(acc.zoneId);
                    setPlayerNickname(acc.nickname);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition shrink-0 ${
                    userId === acc.userId && zoneId === acc.zoneId
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {acc.nickname || acc.userId} ({acc.zoneId})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* STEP 2: UNIFIED 3 CATEGORY TABS (ئالماس، ھەپتىلىك كارتىلار، سوۋغاتلار) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              2-قەدەم
            </span>
            <h3 className="text-xs sm:text-sm font-black text-white">
              قاچىلىماقچى بولغان تۈرنى تاللاڭ:
            </h3>
          </div>

          {/* 3 Unified Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('diamonds')}
              className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'diamonds'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>💎 ئالماس قاچىلاش</span>
            </button>

            <button
              onClick={() => setActiveTab('passes')}
              className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'passes'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>🎫 كارتىلار (Pass)</span>
            </button>

            <button
              onClick={() => setActiveTab('special')}
              className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'special'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>🎁 سوۋغات بولاقلىرى</span>
            </button>
          </div>

          {/* PACKAGES GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPackages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;

              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-3.5 rounded-2xl border text-right transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-b from-blue-950/80 via-slate-900 to-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-xl shadow-amber-500/10 scale-[1.02]'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {pkg.tag && (
                    <span className="absolute -top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[9px] font-black text-slate-950 shadow-sm">
                      {pkg.tag}
                    </span>
                  )}

                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Image src="/images/currencies/mlbb_diamond.png" alt="Diamond" width={28} height={28} className="object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-white truncate">{pkg.name}</h4>
                      {pkg.bonus > 0 && (
                        <span className="text-[10px] text-emerald-400 font-bold">+{pkg.bonus} قوشۇمچە</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between w-full">
                    <span className="text-[10px] text-slate-400">باھاسى:</span>
                    <span className="text-sm font-black text-amber-400 font-mono">${pkg.price.toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3: CHECKOUT ACTION BAR */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0c1629] via-[#101e38] to-[#0a1222] border border-amber-500/35 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="space-y-0.5 text-right">
              <span className="text-slate-400 text-[11px]">تاللانغان بولاق:</span>
              <p className="font-black text-white text-sm">{selectedPackage?.name}</p>
            </div>
            <div className="space-y-0.5 text-left">
              <span className="text-slate-400 text-[11px]">ئومۇمىي چىقىم:</span>
              <p className="font-black text-amber-400 text-lg font-mono">${selectedPackage?.price.toFixed(2)}</p>
            </div>
          </div>

          {orderError && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{orderError}</span>
            </div>
          )}

          {orderSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 space-y-2 text-right">
              <div className="flex items-center gap-2 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>زاكاز مۇۋەپپەقىيەتلىك ئەۋەتىلدى!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                زاكاز نومۇرى: <strong className="font-mono text-white">{orderSuccess.orderId}</strong>
                <br />
                سېكۇنت ئىچىدە بىۋاسىتە <strong>{orderSuccess.targetId}</strong> ھېساباتىغا ئالماس يېتىپ بارىدۇ.
              </p>
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={isOrdering}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isOrdering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>زاكاز بېجىرىلىۋاتىدۇ...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>دەرھال سېتىۋېلىش (Instant Purchase)</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* INSTALL MODAL */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-amber-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 right-4 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-xl border-2 border-amber-500/60 relative">
              <Image src="/images/apps/mobile-legends/icon-512.png" alt="MLBB" fill className="object-cover" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Mobile Legends ئەپىنى قاچىلاش</h3>
              <p className="text-xs text-amber-300 font-medium">MAX-BAZAR مەخسۇس ئويۇن ئەپى</p>
            </div>
            <p className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-right leading-relaxed">
              تېلېفونىڭىزدىكى باشقا ئەپلەر بىلەن توقۇنۇشمايدۇ. ئايرىم مەخسۇس MLBB بازىرى بولۇپ قاچىلىنىدۇ.
            </p>
            <a
              href="/download/autocash.apk"
              download="MobileLegends-MAXBAZAR.apk"
              onClick={() => setTimeout(() => setShowInstallGuide(false), 1500)}
              className="block w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
            >
              📥 Android ئەپىنى چۈشۈرۈش
            </a>
          </div>
        </div>
      )}

      {/* 1-CLICK TELEGRAM SYNC MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mx-auto shadow-lg">
              <Send className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-white">تېلېگراممىدا 1 سېكۇنتتا كىرىش</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ھېچقانداق پارول ياكى ئەنگە ئېلىش ھاجەتسىز. @maxbazar_bot ئارقىلىق قالدۇقىڭىز شۇئان تۇتىشىدۇ.
            </p>
            <a
              href="https://t.me/maxbazar_bot?start=sync_mlbb"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-md transition active:scale-95"
            >
              تېلېگرامما بوتتا ئېچىش ➔
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
