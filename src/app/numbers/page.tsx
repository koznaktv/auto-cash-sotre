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
  country?: CountryMeta | null;
  service?: ServiceItem | null;
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
      } else if (data.status === 'CANCELED' || data.refunded) {
        // Auto cancellation detected from provider
        setActionError(data.message || 'تەمىنلىگۈچى تەرەپتىن كود كەلمىدى، نومۇر بىكار قىلىنىپ پۇلىڭىز ھېساباتىڭىزغا دەل ۋاقتىدا قايتۇرۇلدى!');
        if (data.newBalance !== undefined) {
          setUser((prev) => (prev ? { ...prev, balance: data.newBalance } : null));
        }
        setActiveSession(null);
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

      // Successful purchase! Activate the exact PhoneCash order dashboard
      setActiveSession({
        orderId: data.orderId,
        activationId: data.activationId,
        phone: data.phone,
        serviceCode: service.service_code,
        serviceName: service.name,
        countryName: selectedCountry.nameUg || selectedCountry.name,
        sellPrice: data.sellPrice,
        expiresAt: data.expiresAt || Date.now() + 15 * 60 * 1000,
        status: 'waiting',
        country: selectedCountry,
        service: service,
      });

      // Update user balance locally
      setUser((prev) => (prev ? { ...prev, balance: (prev.balance || 0) - data.sellPrice } : null));

      // Scroll smoothly up to the active dashboard
      window.scrollTo({ top: 80, behavior: 'smooth' });
    } catch (err: any) {
      setActionError(err?.message || 'تور ئۇلىنىشىدا خاتالىق كۆرۈلدى');
    } finally {
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

        {/* -------------------- TAB 1: ACTIVE LIVE ACTIVATION SCREEN (PhoneCash Official Replica) -------------------- */}
        {activeSession && (
          <div className="max-w-2xl mx-auto space-y-4 mb-10 animate-in fade-in zoom-in-95 duration-300">
            {/* 1. Top Notice Banner: بانتظار رمز التحقق، لم يتم الخصم بعد */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/90 via-[#0a233f] to-sky-950/90 border border-sky-400/50 text-sky-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-6 h-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-sky-100 truncate">
                    بانتظار رمز التحقق، لم يتم الخصم بعد
                  </div>
                  <div className="text-[11px] text-sky-200/70 mt-0.5 truncate">
                    تەستىق كودى كۈتۈلمەكتە، كود كەلمىگۈچە پۇل كېسىلمەيدۇ (كەلمىسە تولۇق ھەميانغا قايتىدۇ)
                  </div>
                </div>
              </div>
              {activeSession.status === 'waiting' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-900/80 border border-sky-400/40 text-sky-300 font-mono font-bold text-xs shrink-0" dir="ltr">
                  <Clock className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              )}
            </div>

            {/* 2. Main Purchased Number Card: الرقم الذي تم شراؤه */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#081f38] via-[#06182c] to-[#040e1b] border-2 border-cyan-400/60 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>الرقم الذي تم شراؤه (سېتىۋېلىنغان نومۇر)</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Phone className="w-4 h-4 animate-bounce" />
                </div>
              </div>

              {/* Large Centered Phone Number */}
              <div className="text-center py-2">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-widest text-white text-glow select-all" dir="ltr">
                  {activeSession.phone}
                </div>
                <span className="text-[11px] text-cyan-300/70 mt-1 block">
                  نومۇرنى ئەپكە كىرگۈزۈپ «كود ئەۋەتىش» نى بېسىڭ
                </span>
              </div>

              {/* Order Stats Grid: Order ID | الحالة | سعر بيع */}
              <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-[#030b15]/90 border border-cyan-500/25 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Order ID / زاكاز</span>
                  <span className="font-mono text-cyan-300 font-bold text-xs truncate block" dir="ltr">
                    {activeSession.orderId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">الحالة / ھالىتى</span>
                  <span className={`font-bold text-xs block ${
                    activeSession.status === 'received' ? 'text-emerald-400 font-black' : 'text-amber-400 animate-pulse'
                  }`}>
                    {activeSession.status === 'received' ? 'RECEIVED' : 'WAITING'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">سعر بيع / باھاسى</span>
                  <span className="font-mono text-amber-300 font-bold text-xs block" dir="ltr">
                    ${activeSession.sellPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Two Action Buttons: [نسخ الرقم] & [إلغاء الرقم] */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => copyText(activeSession.phone, 'phone')}
                  className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xl active:scale-95 ${
                    copiedPhone
                      ? 'bg-emerald-500 text-slate-950 scale-102'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-cyan-500/30'
                  }`}
                >
                  {copiedPhone ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPhone ? 'نومۇر كۆچۈرۈلدى!' : 'نسخ الرقم (نومۇر كۆچۈرۈش)'}</span>
                </button>

                {activeSession.status === 'waiting' && (
                  <button
                    type="button"
                    onClick={handleCancelSession}
                    disabled={canceling}
                    className="py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer border-2 border-rose-500/60 hover:bg-rose-950/60 text-rose-300 active:scale-95 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>{canceling ? 'بىكار قىلىنىۋاتىدۇ...' : 'إلغاء الرقم (بىكار قىلىش)'}</span>
                  </button>
                )}

                {activeSession.status === 'received' && (
                  <button
                    type="button"
                    onClick={() => setActiveSession(null)}
                    className="py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 active:scale-95"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>تاماملاش</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. Selected Country Card: الدولة */}
            <div className="p-4 rounded-2xl bg-[#081a2e]/90 border border-amber-500/25 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <WavingFlag
                  code={activeSession.country?.code || selectedCountry?.code || 'ca'}
                  name={activeSession.country?.name || activeSession.countryName}
                  size="md"
                  animated={true}
                />
                <div>
                  <span className="text-[10px] text-amber-200/60 font-semibold block">الدولة (دۆلەت)</span>
                  <h4 className="font-bold text-white text-sm">
                    {activeSession.country?.name || activeSession.countryName}
                  </h4>
                  <span className="text-[11px] text-cyan-300 font-mono" dir="ltr">
                    {activeSession.country?.name.toLowerCase()} • {activeSession.country?.dialCode || ''}
                  </span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </div>

            {/* 4. Selected Service Card: الخدمة */}
            <div className="p-4 rounded-2xl bg-[#081a2e]/90 border border-amber-500/25 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl p-1 shrink-0 flex items-center justify-center border shadow-md"
                  style={{
                    backgroundColor: `${activeSession.service?.color || '#3b82f6'}20`,
                    borderColor: `${activeSession.service?.color || '#3b82f6'}50`,
                  }}
                >
                  <AppIcon
                    code={activeSession.serviceCode}
                    name={activeSession.serviceName}
                    color={activeSession.service?.color || '#3b82f6'}
                    size={24}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-amber-200/60 font-semibold block">الخدمة (مۇلازىمەت / ئەپ)</span>
                  <h4 className="font-bold text-white text-sm">
                    {activeSession.service?.nameUg || activeSession.serviceName}
                  </h4>
                  <span className="text-[11px] text-amber-300/80 font-mono" dir="ltr">
                    ${activeSession.sellPrice.toFixed(2)} • {activeSession.service?.count ? `${activeSession.service.count.toLocaleString()} متاح` : 'متاح'}
                  </span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </div>

            {/* 5. Status Summary Grid: الحالة */}
            <div className="p-4 rounded-2xl bg-[#081a2e]/90 border border-amber-500/20 shadow-lg space-y-3">
              <span className="text-xs text-amber-300/80 font-bold block">الحالة (ئومۇمىي ئەھۋالى)</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#051120] border border-slate-800">
                  <span className="text-xs font-bold text-white block truncate">
                    {activeSession.country?.name || activeSession.countryName}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">الدولة</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#051120] border border-slate-800">
                  <span className="text-xs font-bold text-white block">Any</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Operator</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#051120] border border-slate-800">
                  <span className="text-xs font-bold text-cyan-300 font-mono block">185</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">الخدمات</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <AppIcon code={activeSession.serviceCode} name={activeSession.serviceName} size={18} />
                  <span className="text-xs text-slate-200 font-bold">{activeSession.serviceName}</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300" dir="ltr">
                  سعر بيع: ${activeSession.sellPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 6. Bottom Verification Code Box: جارٍ انتظار رمز SMS... */}
            {activeSession.status === 'received' && activeSession.code ? (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-[#062c20] to-emerald-950/90 border-2 border-emerald-400 text-center shadow-[0_0_40px_rgba(16,185,129,0.3)] space-y-2 animate-in zoom-in-95 duration-300">
                <div className="text-xs sm:text-sm text-emerald-200 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>رمز التحقق / تەستىق كودى قوبۇل قىلىندى (SMS Verification Code):</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-[0.25em] text-white my-3 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" dir="ltr">
                  {activeSession.code}
                </div>
                <button
                  type="button"
                  onClick={() => copyText(activeSession.code!, 'code')}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-sm flex items-center justify-center gap-2 mx-auto transition cursor-pointer shadow-xl active:scale-95"
                >
                  {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copiedCode ? 'كود كۆچۈرۈۋېلىندى!' : 'كودنى دەرھال كۆچۈرۈش'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#081a2e]/90 border border-cyan-500/30 flex items-center justify-between gap-3 text-cyan-300 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm block text-white truncate">جارٍ انتظار رمز SMS...</span>
                      <span className="text-[11px] text-cyan-200/70 block truncate">ھەر 5 سېكۇنتتا بىر تەمىنلىگۈچىدىن ئاپتوماتىك تەكشۈرۈلىۋاتىدۇ</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={checkCodeStatus}
                    disabled={isCheckingNow}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {isCheckingNow ? 'تەكشۈرۈلىۋاتىدۇ...' : 'ھازىرلا تەكشۈرۈش'}
                  </button>
                </div>

                {/* Direct Cancel & Instant Refund Button right where user is watching */}
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right shadow-sm">
                  <div className="text-xs text-rose-200/90 leading-relaxed">
                    <span className="font-bold text-rose-300 block">💡 كود كەلمىدىمۇ؟</span>
                    <span>ئەگەر كود كەلمىسە نومۇرنى بىكار قىلسىڭىز، پۇلىڭىز ھەميانغا دەرھال تولۇق قايتىدۇ.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelSession}
                    disabled={canceling}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-950 transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{canceling ? 'بىكار قىلىنىۋاتىدۇ...' : 'نومۇرنى بىكار قىلىش (پۇلنى قايتۇرۇش)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Return / Buy another number */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="text-xs text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-4 cursor-pointer"
              >
                ← باشقا ئەپكە يەنە مەۋھۇم نومۇر ئېلىش
              </button>
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
