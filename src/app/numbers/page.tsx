'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import AuthModal from '@/components/AuthModal';
import { useLanguage } from '@/context/LanguageContext';
import { getCachedUser, clearLocalAuth, formatCurrencyAmount } from '@/lib/clientAuth';
import { CountryMeta, FEATURED_APPS, ServiceMeta } from '@/lib/sms/smsMetadata';
import WavingFlag from '@/components/sms/WavingFlag';
import AppIcon from '@/components/sms/AppIcon';
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
  const router = useRouter();
  const { lang, t, isRTL } = useLanguage();

  // Synchronous lock against double clicks and fast repeated taps
  const isBuyingRef = useRef(false);
  // Ref for smooth scrolling directly to the purchase hero section
  const purchaseHeroRef = useRef<HTMLDivElement>(null);

  // User state
  const [user, setUser] = useState<{ id?: string; name: string; email: string; balance?: number } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Data state
  const [countries, setCountries] = useState<CountryMeta[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryMeta | null>(null);

  // Smooth scroll handler when a country is picked
  const handleSelectCountry = (country: CountryMeta) => {
    setSelectedCountry(country);
    setTimeout(() => {
      purchaseHeroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [buying, setBuying] = useState(false);

  // App-First Flow State
  const [selectedApp, setSelectedApp] = useState<ServiceMeta | null>(null);
  const [appSearch, setAppSearch] = useState('');
  const [appCategoryTab, setAppCategoryTab] = useState<'all' | 'messaging' | 'social' | 'ai' | 'entertainment' | 'other'>('all');

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

  // Filter countries with multi-attribute search (Uyghur, English, Dial code, ISO)
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const q = countrySearch.toLowerCase().trim().replace(/^\+/, '');
    return countries.filter((c) => {
      const cleanDial = c.dialCode.replace(/^\+/, '');
      return (
        c.name.toLowerCase().includes(q) ||
        c.nameUg.toLowerCase().includes(q) ||
        cleanDial.includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    });
  }, [countries, countrySearch]);

  // Combine FEATURED_APPS with any unique services from the provider
  const allAvailableApps = useMemo(() => {
    const map = new Map<string, ServiceMeta>();
    FEATURED_APPS.forEach((app) => map.set(app.code.toLowerCase(), app));

    services.forEach((s) => {
      const code = s.service_code.toLowerCase();
      if (!map.has(code)) {
        map.set(code, {
          code: s.service_code,
          name: s.name,
          nameUg: s.nameUg || s.name,
          category: (s.category as any) || 'other',
          color: s.color || '#3b82f6',
          popular: false,
        });
      }
    });

    return Array.from(map.values());
  }, [services]);

  // Filter apps
  const filteredApps = useMemo(() => {
    return allAvailableApps.filter((app) => {
      const q = appSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        (app.nameUg && app.nameUg.toLowerCase().includes(q)) ||
        app.code.toLowerCase().includes(q);

      const matchCategory =
        appCategoryTab === 'all' ||
        (appCategoryTab === 'entertainment' ? ['entertainment', 'gaming'].includes(app.category) : app.category === appCategoryTab);

      return matchSearch && matchCategory;
    });
  }, [allAvailableApps, appSearch, appCategoryTab]);

  // Current active service item (price + stock) for selectedApp in selectedCountry
  const currentService = useMemo(() => {
    if (!selectedApp || services.length === 0) return null;
    const appCode = selectedApp.code.toLowerCase().trim();
    return (
      services.find((s) => s.service_code.toLowerCase().trim() === appCode) ||
      (appCode === 'lf' ? services.find((s) => s.service_code.toLowerCase().trim() === 'tt') : null) ||
      (appCode === 'tt' ? services.find((s) => s.service_code.toLowerCase().trim() === 'lf') : null) ||
      (appCode === 'ctkt' ? services.find((s) => s.service_code.toLowerCase().trim() === 'lf') : null) ||
      services.find((s) => s.name.toLowerCase().includes(selectedApp.name.toLowerCase())) ||
      null
    );
  }, [selectedApp, services]);

  // Capped display for buttery-smooth mobile scrolling
  const [displayLimit, setDisplayLimit] = useState(40);

  // Reset display limit when country or search changes
  useEffect(() => {
    setDisplayLimit(40);
  }, [selectedCountry, serviceSearch, activeCategoryTab]);

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = serviceSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.nameUg.toLowerCase().includes(q) ||
        s.service_code.toLowerCase().includes(q);

      const matchCategory =
        activeCategoryTab === 'all' || s.category === activeCategoryTab;

      return matchSearch && matchCategory;
    });
  }, [services, serviceSearch, activeCategoryTab]);

  // Sliced services for lightweight DOM performance
  const visibleServices = useMemo(() => {
    if (serviceSearch.trim()) return filteredServices;
    return filteredServices.slice(0, displayLimit);
  }, [filteredServices, serviceSearch, displayLimit]);

  // Buy Number Handler with Anti-Double-Click Lock & Instant Jump to /orders
  const handleBuyNumber = async (service: ServiceItem) => {
    // Instant synchronous check to block double-taps
    if (isBuyingRef.current || buying) {
      console.warn('Purchase already in flight, ignoring repeated tap.');
      return;
    }

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!selectedCountry) return;

    if ((user.balance || 0) < service.sellPrice) {
      setActionError(`ھېساباتىڭىزدا قالدۇق پۇل يېتىشمىدى. پۇل قاچىلاپ قايتا سىناڭ.`);
      return;
    }

    // Lock immediately
    isBuyingRef.current = true;
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
        isBuyingRef.current = false;
        setBuying(false);
        return;
      }

      // Successful purchase! Update user balance locally
      setUser((prev) => (prev ? { ...prev, balance: (prev.balance || 0) - data.sellPrice } : null));

      // As requested by user: "باسقان ھامانلا مىنىڭ تەلەپلىرىم بىتىگە سەكرەيدىغان قىلىڭ"
      // Jump immediately to /orders (مېنىڭ تەلەپلىرىم)
      router.push('/orders');
    } catch (err: any) {
      setActionError(err?.message || 'تور ئۇلىنىشىدا خاتالىق كۆرۈلدى');
      isBuyingRef.current = false;
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

        {/* -------------------- TAB 2: BUY FLOW (APP-FIRST EXPERIENCE) -------------------- */}
        {viewTab === 'buy' && (
          <>
            {/* STEP 1: CHOOSE APP FIRST (App Catalog) */}
            {!selectedApp ? (
              <div className="rounded-3xl bg-[#08182b]/95 border border-amber-500/25 p-5 sm:p-7 shadow-2xl">
                {/* App Catalog Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-amber-500/20">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>1-قەدەم: ئەپنى تاللاڭ</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white gold-text-glow flex items-center gap-2">
                      <span>قايسى ئەپكە نومۇر ئالماقچى؟</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-amber-200/60 mt-1">
                      ئەڭ كۆپ ئىشلىتىلىدىغان داڭلىق ئەپلەردىن بىرىنى تاللاڭ، ئاندىن خالىغان دۆلەت تەۋەلىكىدىكى مەۋھۇم نومۇرنى سېتىۋېلىڭ.
                    </p>
                  </div>

                  {/* App Category Tabs */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'ھەممىسى' },
                      { id: 'messaging', label: 'ئالاقە' },
                      { id: 'social', label: 'تاراتقۇ' },
                      { id: 'ai', label: 'AI سۈنئىي ئەقىل' },
                      { id: 'entertainment', label: 'كۆڭۈل ئېچىش' },
                      { id: 'other', label: 'باشقىلار' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAppCategoryTab(tab.id as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          appCategoryTab === tab.id
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/30'
                            : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instant App Search Bar */}
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder="ئەپ ئىزدەش (مەسىلەن: Telegram, WhatsApp, ChatGPT, TikTok, Google, Instagram...)"
                    className={`w-full bg-[#051120] border border-amber-500/30 focus:border-amber-400 rounded-2xl ${
                      isRTL ? 'pl-10 pr-4 text-right' : 'pr-10 pl-4 text-left'
                    } py-3 text-sm text-white placeholder-amber-200/40 focus:outline-none font-alkatip shadow-inner`}
                  />
                  <Search className={`w-5 h-5 text-amber-400/70 absolute ${isRTL ? 'left-3.5' : 'right-3.5'} top-3.5`} />
                  {appSearch && (
                    <button
                      type="button"
                      onClick={() => setAppSearch('')}
                      className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 p-1 text-slate-400 hover:text-white cursor-pointer`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Apps Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredApps.map((app) => (
                    <button
                      key={app.code}
                      type="button"
                      onClick={() => {
                        setSelectedApp(app);
                        setTimeout(() => {
                          purchaseHeroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className="group relative p-4 rounded-2xl bg-gradient-to-b from-[#071b30] via-[#051426] to-[#040e1b] border border-amber-500/20 hover:border-amber-400/80 transition-all duration-200 hover:scale-[1.02] active:scale-95 text-right flex flex-col justify-between shadow-lg hover:shadow-amber-500/10 cursor-pointer overflow-hidden min-h-[145px]"
                    >
                      {/* Subtle brand glow on hover */}
                      <div
                        className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
                        style={{ backgroundColor: app.color }}
                      />

                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          className="w-12 h-12 rounded-2xl p-2 shrink-0 flex items-center justify-center border shadow-md transition-transform group-hover:scale-110"
                          style={{
                            backgroundColor: `${app.color}18`,
                            borderColor: `${app.color}45`,
                          }}
                        >
                          <AppIcon code={app.code} name={app.name} color={app.color} size={28} />
                        </div>

                        {app.popular && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black">
                            ئالقىشلىق
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-amber-300 transition truncate">
                          {app.nameUg || app.name}
                        </h3>
                        <span className="text-xs text-amber-200/50 block font-sans truncate mt-0.5">
                          {app.name}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400/80 group-hover:text-amber-300 font-semibold">
                        <span>دۆلەت تاللاش</span>
                        <ArrowLeft className={`w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 ${!isRTL ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* STEP 2: COUNTRY & PURCHASE FOR SELECTED APP */
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Top Navigation & Selected App Banner */}
                <div className="rounded-3xl bg-gradient-to-r from-[#0a233f] via-[#07192f] to-[#040e1b] border-2 border-amber-500/40 p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Back button to app catalog */}
                    <button
                      type="button"
                      onClick={() => setSelectedApp(null)}
                      className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/50 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                    >
                      <ArrowRight className={`w-4 h-4 text-amber-400 ${!isRTL ? 'rotate-180' : ''}`} />
                      <span>باشقا ئەپ تاللاش</span>
                    </button>

                    {/* Selected App Badge */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl p-2 shrink-0 flex items-center justify-center border shadow-lg"
                        style={{
                          backgroundColor: `${selectedApp.color}25`,
                          borderColor: `${selectedApp.color}60`,
                        }}
                      >
                        <AppIcon code={selectedApp.code} name={selectedApp.name} color={selectedApp.color} size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-amber-300/80 font-bold">تاللانغان ئەپ:</span>
                          <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono">
                            {selectedApp.code.toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-white">
                          {selectedApp.nameUg} ({selectedApp.name})
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Indicator Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>2-قەدەم: دۆلەت ۋە نومۇر سېتىۋېلىش</span>
                  </div>
                </div>

                {/* Active Country Purchase Hero Card */}
                <div
                  ref={purchaseHeroRef}
                  id="purchase-hero-card"
                  className="rounded-3xl bg-gradient-to-br from-[#081f38] via-[#061628] to-[#040e1b] border-2 border-cyan-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Country Flag & Dial Info */}
                    <div className="md:col-span-5 flex items-center gap-4">
                      <WavingFlag
                        code={selectedCountry?.code || 'tr'}
                        name={selectedCountry?.name || ''}
                        size="lg"
                        animated={true}
                        className="shadow-2xl"
                      />
                      <div>
                        <div className="text-xs text-amber-300/80 font-bold flex items-center gap-1.5 mb-1">
                          <span>تاللانغان دۆلەت:</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px]" dir="ltr">
                            {selectedCountry?.dialCode}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          {selectedCountry?.nameUg || selectedCountry?.name}
                        </h3>
                        <span className="text-xs text-amber-200/50 block font-sans">
                          {selectedCountry?.name} ({selectedCountry?.code.toUpperCase()})
                        </span>
                      </div>
                    </div>

                    {/* Live Stock & Price for this app */}
                    <div className="md:col-span-3 text-center md:text-right border-y md:border-y-0 md:border-x border-amber-500/20 py-4 md:py-0 md:px-6">
                      <div className="text-xs text-slate-300 font-semibold mb-1">سېتىلىش باھاسى:</div>
                      {loadingServices ? (
                        <div className="flex items-center gap-2 justify-center md:justify-start text-xs text-amber-300">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>باھا تەكشۈرۈلىۋاتىدۇ...</span>
                        </div>
                      ) : currentService ? (
                        <>
                          <div className="text-3xl font-black text-amber-300 font-mono gold-text-glow">
                            ${currentService.sellPrice.toFixed(2)}
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono">
                            <span>زاپاستا:</span>
                            <span className="font-bold">{currentService.count.toLocaleString()} دانە</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-rose-300 bg-rose-950/60 p-2 rounded-xl border border-rose-500/30">
                          بۇ دۆلەتتە نۆۋەتتە زاپاس يوق
                        </div>
                      )}
                    </div>

                    {/* 1-Click Buy Button */}
                    <div className="md:col-span-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => currentService && handleBuyNumber(currentService)}
                        disabled={buying || isBuyingRef.current || loadingServices || !currentService || currentService.count <= 0}
                        className={`w-full py-4 px-6 rounded-2xl font-black text-base transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl cursor-pointer ${
                          !currentService || currentService.count <= 0 || loadingServices || buying
                            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed pointer-events-none'
                            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/30 hover:scale-[1.02] active:scale-95'
                        }`}
                      >
                        {buying ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>نومۇر ئېلىنىۋاتىدۇ...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 fill-current" />
                            <span>
                              {currentService
                                ? `${selectedApp.nameUg} نومۇرى سېتىۋېلىش ($${currentService.sellPrice.toFixed(2)})`
                                : 'نۆۋەتتە نومۇر يوق'}
                            </span>
                          </>
                        )}
                      </button>
                      <span className="text-[11px] text-center text-amber-200/60">
                        🛡️ كود كەلمىسە پۇلىڭىز ھېساباتىڭىزغا دەل ۋاقتىدا قايتۇرۇلىدۇ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Popular Countries Quick Switcher */}
                <div className="rounded-3xl bg-[#08182b]/95 border border-amber-500/25 p-5 sm:p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-500/15">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white">ئەڭ كۆپ ئىشلىتىلىدىغان دۆلەتلەر (1 چەكمە بىلەن تاللاش)</h3>
                    </div>
                    <span className="text-[11px] text-amber-300/70">دۆلەتنى ئالماشتۇرۇش</span>
                  </div>

                  {/* Country Chips Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {[
                      { id: 62, code: 'tr', name: 'تۈركىيە', dial: '+90' },
                      { id: 12, code: 'us', name: 'ئامېرىكا', dial: '+1' },
                      { id: 53, code: 'sa', name: 'سەئۇدى', dial: '+966' },
                      { id: 95, code: 'ae', name: 'ئەرەب بىرلەشمە', dial: '+971' },
                      { id: 21, code: 'eg', name: 'مىسىر', dial: '+20' },
                      { id: 110, code: 'sy', name: 'سۇرىيە', dial: '+963' },
                      { id: 47, code: 'iq', name: 'ئىراق', dial: '+964' },
                      { id: 43, code: 'de', name: 'گېرمانىيە', dial: '+49' },
                      { id: 16, code: 'gb', name: 'ئەنگلىيە', dial: '+44' },
                      { id: 0, code: 'ru', name: 'روسىيە', dial: '+7' },
                      { id: 2, code: 'kz', name: 'قازاقىستان', dial: '+7' },
                      { id: 40, code: 'uz', name: 'ئۆزبېكىستان', dial: '+998' },
                    ].map((pop) => {
                      const isSelected = selectedCountry?.code === pop.code || selectedCountry?.id === pop.id;
                      return (
                        <button
                          key={pop.code}
                          type="button"
                          onClick={() => {
                            const found = countries.find(
                              (c) => c.code === pop.code || String(c.id) === String(pop.id)
                            );
                            if (found) handleSelectCountry(found);
                          }}
                          className={`p-2.5 rounded-2xl flex items-center justify-between gap-2 transition-all cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 scale-105'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <WavingFlag code={pop.code} name={pop.name} size="sm" animated={isSelected} />
                            <span className="truncate">{pop.name}</span>
                          </div>
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-900 font-bold' : 'text-cyan-300'}`} dir="ltr">
                            {pop.dial}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Full 206 Countries Drawer */}
                  <div className="mt-5 pt-4 border-t border-amber-500/15">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-amber-200/80 font-bold">پۈتۈن دۇنيا دۆلەتلىرىدىن ئىزدەش (206 دۆلەت):</span>
                      <span className="text-[11px] text-cyan-300 font-mono">{filteredCountries.length} دۆلەت</span>
                    </div>
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="باشقا دۆلەت ئىزدەش (مەسىلەن: فرانسىيە، ياپونىيە، كانادا، +33...)"
                        className={`w-full bg-[#051120] border border-amber-500/30 rounded-2xl ${
                          isRTL ? 'pl-9 pr-3 text-right' : 'pr-9 pl-3 text-left'
                        } py-2 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:border-amber-400 font-alkatip`}
                      />
                      <Search className={`w-4 h-4 text-amber-400/60 absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5`} />
                    </div>

                    <div className="max-h-[260px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pr-1 custom-scrollbar">
                      {filteredCountries.slice(0, 80).map((c) => {
                        const isSelected = selectedCountry?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCountry(c)}
                            className={`p-2 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/25 border border-amber-400 text-white font-bold'
                                : 'bg-[#051222]/60 hover:bg-[#07192f] border border-transparent hover:border-amber-500/20 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <WavingFlag code={c.code} name={c.name} size="sm" animated={isSelected} />
                              <span className="truncate">{c.nameUg || c.name}</span>
                            </div>
                            <span className="text-[10px] text-cyan-300 font-mono shrink-0" dir="ltr">
                              {c.dialCode}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
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
