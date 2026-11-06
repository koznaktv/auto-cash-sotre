'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  ShieldCheck,
  Download,
  RefreshCw,
  Plus,
  Coins,
  History,
  X,
  ChevronRight,
  Zap,
  Globe,
  Radio,
  Wifi,
  PhoneCall
} from 'lucide-react';

export interface MtnProduct {
  id: number;
  name: string;
  type: 'credit' | 'bundle';
  sypAmount?: number;
  dataSize?: string;
  duration?: string;
  price: number;
  tag?: string;
  isPopular?: boolean;
}

const MTN_CREDIT_PACKAGES: MtnProduct[] = [
  { id: 301, name: '10,000 لىرا قالدۇق', type: 'credit', sypAmount: 10000, price: 0.63 },
  { id: 302, name: '25,000 لىرا قالدۇق', type: 'credit', sypAmount: 25000, price: 1.57, tag: 'POPULAR' },
  { id: 303, name: '50,000 لىرا قالدۇق', type: 'credit', sypAmount: 50000, price: 3.10, isPopular: true },
  { id: 304, name: '100,000 لىرا قالدۇق', type: 'credit', sypAmount: 100000, price: 6.12, tag: 'BEST VALUE' },
  { id: 305, name: '250,000 لىرا قالدۇق', type: 'credit', sypAmount: 250000, price: 15.21 },
  { id: 306, name: '500,000 لىرا قالدۇق', type: 'credit', sypAmount: 500000, price: 30.15, tag: 'VIP' },
];

const MTN_BUNDLE_PACKAGES: MtnProduct[] = [
  { id: 310, name: '1GB كۈنلۈك تېز تور', type: 'bundle', dataSize: '1GB', duration: '1 كۈن', price: 0.40 },
  { id: 311, name: '3GB 10 كۈنلۈك تور', type: 'bundle', dataSize: '3GB', duration: '10 كۈن', price: 1.08 },
  { id: 312, name: '5GB ئايلىق سوپېر تېزلىك', type: 'bundle', dataSize: '5GB', duration: '30 كۈن', price: 1.71, isPopular: true, tag: 'HOT' },
  { id: 313, name: '10GB ئايلىق يۇقىرى سۈرئەت', type: 'bundle', dataSize: '10GB', duration: '30 كۈن', price: 3.24, tag: 'RECOMMENDED' },
  { id: 314, name: '25GB ئايلىق مەخسۇس ئېقىم', type: 'bundle', dataSize: '25GB', duration: '30 كۈن', price: 7.11 },
  { id: 315, name: '50GB ئايلىق چوڭ سىغىم', type: 'bundle', dataSize: '50GB', duration: '30 كۈن', price: 13.05, tag: 'PRO' },
  { id: 316, name: '100GB VIP چەكسىز تور', type: 'bundle', dataSize: '100GB', duration: '30 كۈن', price: 25.11 },
];

export default function MtnSyriaAppPage() {
  // Tab: 'credit' (پۇل قاچىلاش) vs 'bundle' (تور ئېلىش)
  const [activeTab, setActiveTab] = useState<'credit' | 'bundle'>('credit');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<MtnProduct | null>(MTN_CREDIT_PACKAGES[1]);
  const [savedNumbers, setSavedNumbers] = useState<string[]>([]);

  // Auth & Session
  const [session, setSession] = useState<{ token: string; identity: string; balance: number } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Load session & saved phone numbers
  useEffect(() => {
    try {
      const stored = localStorage.getItem('maxbazar_mtn_numbers');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedNumbers(parsed);
        if (parsed.length > 0) setPhoneNumber(parsed[0]);
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
            });
          }
        }
      } catch {}
    };
    checkSession();
  }, []);

  // Update default selected product on tab switch
  const handleTabChange = (tab: 'credit' | 'bundle') => {
    setActiveTab(tab);
    setSelectedProduct(tab === 'credit' ? MTN_CREDIT_PACKAGES[1] : MTN_BUNDLE_PACKAGES[2]);
    setOrderError('');
    setOrderSuccess(null);
  };

  const saveNumberToVault = (num: string) => {
    try {
      const updated = [num, ...savedNumbers.filter((n) => n !== num)].slice(0, 5);
      setSavedNumbers(updated);
      localStorage.setItem('maxbazar_mtn_numbers', JSON.stringify(updated));
    } catch {}
  };

  // Submit MTN Order
  const handlePlaceOrder = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    const cleanNum = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleanNum || !/^09[45]\d{7}$/.test(cleanNum) && !/^09\d{8}$/.test(cleanNum)) {
      setOrderError('MTN تېلېفون نومۇرى خاتا! 09 بىلەن باشلىنىدىغان 10 خانىلىق نومۇر كىرگۈزۈڭ (مەسىلەن: 0941234567)');
      return;
    }

    if (!selectedProduct) {
      setOrderError('مۇلازىمەت بولىقىنى تاللاڭ!');
      return;
    }

    if (session.balance < selectedProduct.price) {
      setOrderError(`قالدۇقىڭىز يەتمىدى! قالدۇق: $${session.balance.toFixed(2)}، باھاسى: $${selectedProduct.price.toFixed(2)}`);
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
          player_id: cleanNum,
          package_id: selectedProduct.id,
          package_name: selectedProduct.name,
          price: selectedProduct.price,
          app_id: 'mtn-syria'
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        saveNumberToVault(cleanNum);
        setOrderSuccess({
          orderId: data.order?.order_id || 'MTN_' + Math.floor(Math.random() * 90000 + 10000),
          packageName: selectedProduct.name,
          targetId: cleanNum,
          price: selectedProduct.price
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

  const displayedPackages = activeTab === 'credit' ? MTN_CREDIT_PACKAGES : MTN_BUNDLE_PACKAGES;

  return (
    <div className="min-h-screen bg-[#070B14] text-white pb-24 font-sans selection:bg-yellow-500 selection:text-black">
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
            <div className="w-8 h-8 rounded-xl overflow-hidden relative border border-yellow-500/40 shadow-sm">
              <Image src="/images/apps/mtn-syria/icon-512.png" alt="MTN Syria" fill className="object-cover" />
            </div>
            <div className="text-right">
              <h1 className="text-xs font-black text-white">MTN Syria</h1>
              <p className="text-[10px] text-yellow-400 font-medium">MAX-BAZAR رەسمىي</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-yellow-500/30 px-2.5 py-1 rounded-xl text-xs">
                <span className="text-yellow-400 font-mono font-bold">${session.balance.toFixed(2)}</span>
                <Link href="/deposit" className="w-5 h-5 rounded-lg bg-yellow-500 text-black flex items-center justify-center font-black text-xs hover:scale-105 transition">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black text-xs transition active:scale-95 shadow-md flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>كىرىش</span>
              </button>
            )}

            <button
              onClick={() => setShowInstallGuide(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-slate-700 transition"
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1a06] via-[#141208] to-[#070b14] border border-yellow-500/30 p-5 shadow-2xl">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1 text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-black">
                <Radio className="w-3 h-3 text-yellow-400 animate-pulse" />
                <span>رەسمىي MTN سۈرىيە تېز تۇرۇبىسى</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white">
                MTN Syria — تېلېفون ۋە تور بازىرى
              </h2>
              <p className="text-xs text-slate-300">
                پۇل قاچىلاش ۋە مەخسۇس تېز سۈرئەتلىك تور بولاقلىرىنى دەرھال سېتىۋېلىش ⚡
              </p>
            </div>
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <Image src="/images/apps/mtn-syria/icon-512.png" alt="MTN" fill className="object-cover rounded-2xl" />
            </div>
          </div>
        </div>

        {/* 2 DISTINCT VIEWS: پۇل قاچىلاش (CREDIT) vs تور ئېلىش (BUNDLE) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 rounded-3xl border border-slate-800">
          <button
            onClick={() => handleTabChange('credit')}
            className={`py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'credit'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>💰 تېلېفونغا پۇل قاچىلاش</span>
          </button>

          <button
            onClick={() => handleTabChange('bundle')}
            className={`py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'bundle'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>🌐 تور بولاقلىرى سېتىۋېلىش</span>
          </button>
        </div>

        {/* PHONE NUMBER INPUT */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-yellow-400 font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              {activeTab === 'credit' ? 'پۇل قاچىلاش نومۇرى' : 'تور قاچىلاش نومۇرى'}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-yellow-400" />
              <span>MTN تېلېفون نومۇرى (Phone Number):</span>
            </h3>
          </div>

          <div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+]/g, ''))}
              placeholder="09XXXXXXXX (مەسىلەن: 0941234567)"
              className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-slate-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white font-mono text-base tracking-wider text-right outline-none"
            />
          </div>

          {savedNumbers.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-500 shrink-0">ساقلانغان نومۇرلار:</span>
              {savedNumbers.map((num, idx) => (
                <button
                  key={idx}
                  onClick={() => setPhoneNumber(num)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition shrink-0 ${
                    phoneNumber === num
                      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PACKAGES SELECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-yellow-400 font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              {activeTab === 'credit' ? 'قالدۇق تاللاڭ' : 'تور بولىقى تاللاڭ'}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-white">
              {activeTab === 'credit' ? 'قاچىلىماقچى بولغان قالدۇق پۇل مىقدارى:' : 'سېتىۋالماقچى بولغان تور بولىقى:'}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayedPackages.map((pkg) => {
              const isSelected = selectedProduct?.id === pkg.id;

              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedProduct(pkg)}
                  className={`relative p-4 rounded-2xl border text-right transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-b from-yellow-950/60 via-slate-900 to-slate-950 border-yellow-400 ring-2 ring-yellow-400/50 shadow-xl shadow-yellow-500/10 scale-[1.02]'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {pkg.tag && (
                    <span className="absolute -top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-[9px] font-black text-slate-950 shadow-sm">
                      {pkg.tag}
                    </span>
                  )}

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">{pkg.name}</h4>
                    {pkg.type === 'bundle' && (
                      <p className="text-[11px] text-yellow-300 font-bold">
                        سىغىمى: {pkg.dataSize} • {pkg.duration}
                      </p>
                    )}
                    {pkg.type === 'credit' && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        {pkg.sypAmount?.toLocaleString()} SYP
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between w-full">
                    <span className="text-[10px] text-slate-400">باھاسى:</span>
                    <span className="text-sm font-black text-yellow-400 font-mono">${pkg.price.toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CHECKOUT ACTION BAR */}
        <div className="rounded-3xl bg-gradient-to-r from-[#171407] via-[#1c190a] to-[#0c0a03] border border-yellow-500/40 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="space-y-0.5 text-right">
              <span className="text-slate-400 text-[11px]">تاللانغان مۇلازىمەت:</span>
              <p className="font-black text-white text-sm">{selectedProduct?.name}</p>
            </div>
            <div className="space-y-0.5 text-left">
              <span className="text-slate-400 text-[11px]">ئومۇمىي چىقىم:</span>
              <p className="font-black text-yellow-400 text-lg font-mono">${selectedProduct?.price.toFixed(2)}</p>
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
                <span>زاكاز مۇۋەپپەقىيەتلىك بېجىرىلدى!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                زاكاز نومۇرى: <strong className="font-mono text-white">{orderSuccess.orderId}</strong>
                <br />
                بىۋاسىتە <strong>{orderSuccess.targetId}</strong> نومۇرىغا سېكۇنتتا يېتىپ بارىدۇ.
              </p>
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={isOrdering}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isOrdering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>زاكاز بېجىرىلىۋاتىدۇ...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{activeTab === 'credit' ? 'دەرھال پۇل قاچىلاش' : 'دەرھال تورنى سېتىۋېلىش'}</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* INSTALL MODAL */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-yellow-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 right-4 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-xl border-2 border-yellow-500/60 relative">
              <Image src="/images/apps/mtn-syria/icon-512.png" alt="MTN" fill className="object-cover" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">MTN سۈرىيە ئەپىنى قاچىلاش</h3>
              <p className="text-xs text-yellow-400 font-medium">MAX-BAZAR رەسمىي تېلېفون-تور ئەپى</p>
            </div>
            <p className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-right leading-relaxed">
              تېلېفونىڭىزدىكى باشقا ئەپلەر بىلەن توقۇنۇشمايدۇ. ئايرىم مەخسۇس MTN تېلېفون ۋە تور بازىرى بولۇپ قاچىلىنىدۇ.
            </p>
            <a
              href="/download/autocash.apk"
              download="MTN-Syria-MAXBAZAR.apk"
              onClick={() => setTimeout(() => setShowInstallGuide(false), 1500)}
              className="block w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
            >
              📥 Android ئەپىنى چۈشۈرۈش
            </a>
          </div>
        </div>
      )}

      {/* 1-CLICK TELEGRAM SYNC MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-yellow-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center space-y-4">
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
              href="https://t.me/maxbazar_bot?start=sync_mtn"
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
