'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import AuthModal from '@/components/AuthModal';
import { useLanguage } from '@/context/LanguageContext';
import { getCachedUser, clearLocalAuth, formatCurrencyAmount } from '@/lib/clientAuth';
import { CountryMeta } from '@/lib/sms/smsMetadata';
import {
  Phone,
  Globe,
  Search,
  Copy,
  Check,
  Clock,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  History,
  Smartphone,
  Zap,
  ArrowRight,
  ArrowLeft,
  Wallet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ServiceItem {
  service_code: string;
  name: string;
  nameUg: string;
  costPrice: number;
  sellPrice: number;
  count: number;
  category: string;
  color: string;
  iconUrl?: string;
  popular: boolean;
}

interface ActiveSession {
  orderId: string;
  activationId: string;
  phone: string;
  serviceCode: string;
  serviceName: string;
  countryName: string;
  sellPrice: number;
  expiresAt: number;
  code?: string;
  status: 'waiting' | 'received' | 'canceled';
}

export default function NumbersPage() {
  const { lang, t, isRTL } = useLanguage();

  // User state
  const [user, setUser] = useState<{ id?: string; name: string; email: string; balance?: number } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Data state
  const [countries, setCountries] = useState<CountryMeta[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryMeta | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [buying, setBuying] = useState(false);

  // Filters
  const [countrySearch, setCountrySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'messaging' | 'social' | 'ai' | 'other'>('all');

  // Active session & polling
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // History tab
  const [viewTab, setViewTab] = useState<'buy' | 'history'>('buy');
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch current user
  useEffect(() => {
    const cached = getCachedUser();
    if (cached) setUser(cached);

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) setUser(d.user);
      })
      .catch(() => null);
  }, []);

  // Fetch countries on load
  useEffect(() => {
    setLoadingCountries(true);
    fetch('/api/sms/countries')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.countries)) {
          setCountries(d.countries);
          // Default select Turkey or first popular country
          const def = d.countries.find((c: CountryMeta) => String(c.id) === '62') || d.countries[0];
          if (def) setSelectedCountry(def);
        }
      })
      .catch(() => null)
      .finally(() => setLoadingCountries(false));
  }, []);

  // Fetch services when selectedCountry changes
  useEffect(() => {
    if (!selectedCountry) return;
    setLoadingServices(true);
    setActionError(null);

    fetch(`/api/sms/services?countryId=${selectedCountry.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.services)) {
          setServices(d.services);
        } else {
          setServices([]);
        }
      })
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, [selectedCountry]);

  // Load history when tab changes
  useEffect(() => {
    if (viewTab === 'history') {
      setLoadingHistory(true);
      fetch('/api/sms/orders')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.orders)) {
            setHistoryOrders(d.orders);
          }
        })
        .catch(() => null)
        .finally(() => setLoadingHistory(false));
    }
  }, [viewTab]);

  // Countdown timer for active session
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'waiting') return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  // Status Poller for active session (checked strictly every 5 seconds)
  const [isCheckingNow, setIsCheckingNow] = useState(false);
  const [lastCheckedText, setLastCheckedText] = useState('ھازىرلا');

  const checkCodeStatus = async () => {
    if (!activeSession || activeSession.status !== 'waiting') return;
    setIsCheckingNow(true);
    try {
      const res = await fetch(
        `/api/sms/check?orderId=${activeSession.orderId}&activationId=${activeSession.activationId}`
      );
      const data = await res.json();

      setLastCheckedText('ھازىرلا');

      if (data.success && data.status === 'RECEIVED' && data.code) {
        setActiveSession((prev) => (prev ? { ...prev, code: data.code, status: 'received' } : null));

        // Refresh user balance & notify
        fetch('/api/auth/me')
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.user) setUser(d.user);
          })
          .catch(() => null);
      }
    } catch (err) {
      console.warn('[SMS Poll Warning]:', err);
    } finally {
      setIsCheckingNow(false);
    }
  };

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'waiting') return;

    // Run immediately
    checkCodeStatus();

    // Poll strictly every 5 seconds
    const interval = setInterval(() => {
      checkCodeStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Filter countries
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const q = countrySearch.toLowerCase().trim();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameUg.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [countries, countrySearch]);

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        !serviceSearch.trim() ||
        s.name.toLowerCase().includes(serviceSearch.toLowerCase().trim()) ||
        s.nameUg.toLowerCase().includes(serviceSearch.toLowerCase().trim()) ||
        s.service_code.toLowerCase().includes(serviceSearch.toLowerCase().trim());

      const matchCategory =
        activeCategoryTab === 'all' || s.category === activeCategoryTab;

      return matchSearch && matchCategory;
    });
  }, [services, serviceSearch, activeCategoryTab]);

  // Buy Number Handler
  const handleBuyNumber = async (service: ServiceItem) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!selectedCountry) return;

    if ((user.balance || 0) < service.sellPrice) {
      setActionError(`ھېساباتىڭىزدا قالدۇق پۇل يېتىشمىدى. پۇل قاچىلاپ قايتا سىناڭ.`);
      return;
    }

    setBuying(true);
    setActionError(null);

    try {
      const res = await fetch('/api/sms/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceCode: service.service_code,
          countryId: selectedCountry.id,
          serviceName: service.name,
          countryName: selectedCountry.nameUg || selectedCountry.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.message || 'نومۇر ئېلىش مەغلۇپ بولدى');
        return;
      }

      // Successful purchase! Start active session
      setActiveSession({
        orderId: data.orderId,
        activationId: data.activationId,
        phone: data.phone,
        serviceCode: service.service_code,
        serviceName: service.name,
        countryName: selectedCountry.nameUg,
        sellPrice: data.sellPrice,
        expiresAt: data.expiresAt || Date.now() + 15 * 60 * 1000,
        status: 'waiting',
      });

      // Update user balance locally
      setUser((prev) => (prev ? { ...prev, balance: (prev.balance || 0) - data.sellPrice } : null));
    } catch (err: any) {
      setActionError(err?.message || 'تور ئۇلىنىشىدا خاتالىق كۆرۈلدى');
    } finally {
      setBuying(false);
    }
  };

  // Cancel Handler
  const handleCancelSession = async () => {
    if (!activeSession || canceling) return;
    if (activeSession.status === 'received') {
      setActiveSession(null);
      return;
    }

    if (!confirm('نومۇرنى بىكار قىلىپ، پۇلىڭىزنى ھېساباتىڭىزغا قايتۇرامسىز؟')) {
      return;
    }

    setCanceling(true);
    setActionError(null);

    try {
      const res = await fetch('/api/sms/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeSession.orderId,
          activationId: activeSession.activationId,
          reason: 'خېرىدار كود كۈتمەي بىكار قىلدى',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.newBalance !== undefined && user) {
          setUser({ ...user, balance: data.newBalance });
        }
        setActiveSession(null);
      } else {
        setActionError(data.message || 'بىكار قىلىش مەغلۇپ بولدى');
      }
    } catch (err: any) {
      setActionError(err?.message || 'بىكار قىلىش مەغلۇپ بولدى');
    } finally {
      setCanceling(false);
    }
  };

  // Copy helper
  const copyText = (text: string, type: 'phone' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#051120] text-slate-100 font-alkatip flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Navbar user={user} balance={user?.balance || 0} />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-28">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#081f38] via-[#051426] to-[#040e1a] border border-amber-500/30 p-5 sm:p-7 shadow-2xl mb-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold mb-3 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>24/7 سېكۇنتلۇق تېزلىك • پۈتۈن دۇنيا دۆلەتلىرى</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white gold-text-glow flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Smartphone className="w-6 h-6 sm:w-7 h-7" />
                </span>
                <span>مەۋھۇم نومۇر (SMS تەستىق كودى)</span>
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/70 mt-2 max-w-xl leading-relaxed">
                تېلېگرام، ۋاتساپ، ChatGPT، گۇگۇل، تىكتوك ۋە 100+ دۇنيا ئەپلىرىگە دۆلەت مەۋھۇم نومۇرى ئېلىپ، تەستىق كودىنى نەق مەيداندا قوبۇل قىلىڭ. كود كەلمىسە پۇلىڭىز دەرھال قايتۇرۇلىدۇ!
              </p>
            </div>

            {/* User Wallet Badge & Navigation Pill */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="px-4 py-2.5 rounded-2xl bg-[#091e36]/90 border border-amber-500/40 flex items-center gap-3 shadow-lg">
                <Wallet className="w-5 h-5 text-amber-400" />
                <div className="text-right">
                  <div className="text-[10px] text-amber-200/60 font-semibold">ھەميان قالدۇقى</div>
                  <div className="text-sm font-black text-amber-300 font-mono">
                    {user ? `$${(user.balance || 0).toFixed(2)}` : '$0.00'}
                  </div>
                </div>
              </div>

              {/* View Switcher: Buy / History */}
              <div className="flex rounded-2xl bg-slate-900/90 border border-slate-700/60 p-1">
                <button
                  onClick={() => setViewTab('buy')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewTab === 'buy'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>نومۇر ئېلىش</span>
                </button>
                <button
                  onClick={() => setViewTab('history')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewTab === 'history'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>تارىخ</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Error Notice if any */}
        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="p-1 hover:bg-rose-900/50 rounded-lg text-rose-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* -------------------- TAB 1: ACTIVE LIVE ACTIVATION CARD -------------------- */}
        {activeSession && (
          <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b2749] via-[#071d36] to-[#051527] border-2 border-cyan-400/60 p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-lg">
                  <Phone className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs text-cyan-300/80 font-bold">
                    {activeSession.countryName} • {activeSession.serviceName}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {activeSession.status === 'received'
                      ? '🎉 تەستىق كودى قوبۇل قىلىندى!'
                      : '📲 مەۋھۇم نومۇر تەييارلاندى'}
                  </h3>
                </div>
              </div>

              {/* Countdown or Status Indicator */}
              {activeSession.status === 'waiting' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 shadow-inner">
                  <Clock className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="text-xs font-semibold">قالغان ۋاقىت:</span>
                  <span className="font-mono font-black text-sm tracking-wider text-white">
                    {formatTimer(timeLeft)}
                  </span>
                </div>
              )}
            </div>

            {/* Virtual Number Box */}
            <div className="my-6 p-5 sm:p-6 rounded-2xl bg-[#040e1a]/90 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="text-center md:text-right">
                <span className="text-xs text-amber-300/80 font-semibold block mb-1">
                  تېلېفون ياكى ئەپكە كىرگۈزىدىغان نومۇر:
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-white text-glow" dir="ltr">
                  {activeSession.phone}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyText(activeSession.phone, 'phone')}
                  className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-lg ${
                    copiedPhone
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black hover:scale-105 active:scale-95'
                  }`}
                >
                  {copiedPhone ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPhone ? 'نومۇر كۆچۈرۈلدى!' : 'نومۇرنى كۆچۈرۈش'}</span>
                </button>
              </div>
            </div>

            {/* SMS Code Box (When code arrives) */}
            {activeSession.status === 'received' && activeSession.code ? (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#062c20] to-emerald-950/90 border-2 border-emerald-400 text-center shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-in zoom-in-95 duration-300">
                <div className="text-xs sm:text-sm text-emerald-200 font-bold mb-2 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>تەستىق كودى قوبۇل قىلىندى (SMS Verification Code):</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-[0.25em] text-white my-3 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" dir="ltr">
                  {activeSession.code}
                </div>
                <button
                  onClick={() => copyText(activeSession.code!, 'code')}
                  className={`mt-3 px-8 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 mx-auto transition cursor-pointer shadow-xl ${
                    copiedCode
                      ? 'bg-emerald-400 text-slate-950 scale-105'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 shadow-amber-500/30 hover:scale-105'
                  }`}
                >
                  {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copiedCode ? 'كود كۆچۈرۈۋېلىندى!' : 'كودنى دەرھال كۆچۈرۈش'}</span>
                </button>
              </div>
            ) : (
              /* Waiting Radar Animation */
              <div className="p-6 rounded-2xl bg-[#04101e]/60 border border-cyan-500/20 text-center">
                <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping" />
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                    <RefreshCw className={`w-5 h-5 text-cyan-400 ${isCheckingNow ? 'animate-spin' : ''}`} />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>تەمىنلىگۈچىدىن ھەر 5 سېكۇنتتا كود قوغلاپ تەكشۈرۈلمەكتە</span>
                </div>

                <h4 className="text-base font-bold text-white mb-1">
                  SMS كودى كۈتۈلمەكتە...
                </h4>
                <p className="text-xs text-cyan-200/70 max-w-md mx-auto leading-relaxed mb-4">
                  نومۇرنى ئەپكە كىرگۈزۈپ «كود ئەۋەتىش» نى بېسىڭ. SMS كەلگەن دەقىقىدە بەتتە ئاپتوماتىك پەيدا بولىدۇ.
                </p>

                <button
                  type="button"
                  onClick={checkCodeStatus}
                  disabled={isCheckingNow}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/90 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition shadow-md cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isCheckingNow ? 'animate-spin' : ''}`} />
                  <span>{isCheckingNow ? 'تەكشۈرۈلىۋاتىدۇ...' : 'ھازىرلا تەكشۈرۈش'}</span>
                </button>
              </div>
            )}

            {/* Bottom Actions: Cancel & Refund */}
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-cyan-500/20">
              <span className="text-[11px] text-slate-400">
                زاكاز كودى: <span className="font-mono text-cyan-300">{activeSession.orderId}</span>
              </span>

              {activeSession.status === 'waiting' && (
                <button
                  onClick={handleCancelSession}
                  disabled={canceling}
                  className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-950/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>{canceling ? 'بىكار قىلىنىۋاتىدۇ...' : 'بىكار قىلىش ۋە پۇلنى قايتۇرۇش'}</span>
                </button>
              )}

              {activeSession.status === 'received' && (
                <button
                  onClick={() => setActiveSession(null)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition cursor-pointer"
                >
                  تاماملاش
                </button>
              )}
            </div>
          </div>
        )}

        {/* -------------------- TAB 2: BUY FLOW -------------------- */}
        {viewTab === 'buy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT / TOP COLUMN: Country Picker (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-3xl bg-[#08182b]/95 border border-amber-500/25 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>1. دۆلەتنى تاللاڭ</span>
                  </h2>
                  <span className="text-[11px] text-amber-300/70 font-mono">
                    {filteredCountries.length} دۆلەت
                  </span>
                </div>

                {/* Search Country */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="دۆلەت ئىزدەش (مەسىلەن: تۈركىيە، ئامېرىكا...)"
                    className={`w-full bg-[#051120] border border-amber-500/30 rounded-2xl ${
                      isRTL ? 'pl-9 pr-3 text-right' : 'pr-9 pl-3 text-left'
                    } py-2 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:border-amber-400 font-alkatip`}
                  />
                  <Search className={`w-4 h-4 text-amber-400/60 absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5`} />
                </div>

                {/* Countries List */}
                <div className="max-h-[460px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {loadingCountries ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                      <span>دۆلەتلەر يۈكلىنىۋاتىدۇ...</span>
                    </div>
                  ) : filteredCountries.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">دۆلەت تېپىلمىدى</div>
                  ) : (
                    filteredCountries.map((c) => {
                      const isSelected = selectedCountry?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCountry(c)}
                          className={`w-full p-2.5 rounded-2xl flex items-center justify-between transition cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-transparent border border-amber-400/80 text-white font-black shadow-md'
                              : 'bg-[#051222]/60 hover:bg-[#07192f] border border-transparent hover:border-amber-500/20 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl shrink-0" role="img" aria-label={c.name}>
                              {c.flag}
                            </span>
                            <div className="text-right">
                              <span className="font-bold text-white block">{c.nameUg || c.name}</span>
                              <span className="text-[10px] text-amber-200/50 block font-sans">{c.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {c.dialCode && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-[10px] text-cyan-300 font-mono" dir="ltr">
                                {c.dialCode}
                              </span>
                            )}
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Service / App Picker (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="rounded-3xl bg-[#08182b]/95 border border-amber-500/25 p-5 sm:p-6 shadow-xl">
                {/* Header with Selected Country Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-amber-500/20">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <span>2. مۇلازىمەت / ئەپنى تاللاڭ</span>
                    </h2>
                    <p className="text-xs text-amber-200/60 mt-0.5">
                      تاللانغان دۆلەت:{' '}
                      <span className="text-white font-bold inline-flex items-center gap-1">
                        <span>{selectedCountry?.flag}</span>
                        <span>{selectedCountry?.nameUg || selectedCountry?.name}</span>
                        <span className="font-mono text-cyan-300" dir="ltr">{selectedCountry?.dialCode}</span>
                      </span>
                    </p>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'ھەممىسى' },
                      { id: 'messaging', label: 'ئالاقە' },
                      { id: 'social', label: 'تاراتقۇ' },
                      { id: 'ai', label: 'AI' },
                      { id: 'other', label: 'باشقىلار' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveCategoryTab(tab.id as any)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                          activeCategoryTab === tab.id
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Search Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="مۇلازىمەت ئىزدەش (مەسىلەن: Telegram, WhatsApp, ChatGPT, Google...)"
                    className={`w-full bg-[#051120] border border-amber-500/30 rounded-2xl ${
                      isRTL ? 'pl-9 pr-3 text-right' : 'pr-9 pl-3 text-left'
                    } py-2.5 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:border-amber-400 font-alkatip`}
                  />
                  <Search className={`w-4 h-4 text-amber-400/60 absolute ${isRTL ? 'left-3' : 'right-3'} top-3`} />
                </div>

                {/* Services Grid */}
                {loadingServices ? (
                  <div className="py-20 text-center text-xs text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                    <span>مۇلازىمەت باھالىرى تەكشۈرۈلىۋاتىدۇ...</span>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400">
                    بۇ دۆلەتتە مۇلازىمەت تېپىلمىدى ياكى نۆۋەتتە نومۇر قالمىدى.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredServices.map((service) => {
                      return (
                        <div
                          key={service.service_code}
                          className="relative p-3.5 rounded-2xl bg-gradient-to-b from-[#06182c] to-[#040e1b] border border-amber-500/20 hover:border-amber-400/60 transition-all duration-200 flex items-center justify-between gap-3 group hover:shadow-lg hover:shadow-black/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* App Icon */}
                            <div
                              className="w-11 h-11 rounded-2xl p-2 shrink-0 flex items-center justify-center border shadow-md"
                              style={{
                                backgroundColor: `${service.color}15`,
                                borderColor: `${service.color}40`,
                              }}
                            >
                              {service.iconUrl ? (
                                <img
                                  src={service.iconUrl}
                                  alt={service.name}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Smartphone className="w-5 h-5" style={{ color: service.color }} />
                              )}
                            </div>

                            {/* App Details */}
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-white truncate group-hover:text-amber-300 transition">
                                {service.nameUg || service.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-amber-200/50 font-sans truncate">
                                  {service.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono">
                                  {service.count.toLocaleString()} دانە
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Price & Buy Button */}
                          <div className="flex flex-col items-end shrink-0 gap-1.5">
                            <div className="text-right">
                              <span className="text-base font-black text-amber-300 font-mono">
                                ${service.sellPrice.toFixed(2)}
                              </span>
                            </div>

                            <button
                              onClick={() => handleBuyNumber(service)}
                              disabled={buying || service.count <= 0}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black transition cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              نومۇر ئېلىش
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 3: USER HISTORY -------------------- */}
        {viewTab === 'history' && (
          <div className="rounded-3xl bg-[#08182b]/95 border border-amber-500/25 p-6 shadow-xl">
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>مېنىڭ مەۋھۇم نومۇر زاكازلىرىم</span>
            </h2>

            {loadingHistory ? (
              <div className="py-20 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                <span>تارىخ تەكشۈرۈلىۋاتىدۇ...</span>
              </div>
            ) : historyOrders.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                سىزدە تېخى مەۋھۇم نومۇر ئېلىش تارىخى يوق.
              </div>
            ) : (
              <div className="space-y-3">
                {historyOrders.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#051120] border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {item.serviceName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            item.status === 'completed'
                              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                              : item.status === 'refunded' || item.status === 'cancelled'
                              ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                              : 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
                          }`}
                        >
                          {item.status === 'completed'
                            ? 'پۈتتى'
                            : item.status === 'refunded'
                            ? 'پۇل قايتۇرۇلدى'
                            : 'كۈتۈلمەكتە'}
                        </span>
                      </div>
                      <div className="text-xs text-cyan-300 font-mono mt-1" dir="ltr">
                        {item.phone}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.code ? (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 flex items-center gap-2">
                          <span className="text-xs text-emerald-200">SMS كودى:</span>
                          <span className="font-mono font-black text-sm text-white tracking-widest" dir="ltr">
                            {item.code}
                          </span>
                          <button
                            onClick={() => copyText(item.code, 'code')}
                            className="p-1 text-emerald-300 hover:text-white transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">كود قوبۇل قىلىنمىغان</span>
                      )}

                      <span className="font-mono text-sm font-bold text-amber-300">
                        ${Number(item.price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Auth Modal if guest clicks buy */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetch('/api/auth/me')
              .then((r) => r.json())
              .then((d) => {
                if (d.success && d.user) setUser(d.user);
              })
              .catch(() => null);
          }}
        />
      )}
    </div>
  );
}
