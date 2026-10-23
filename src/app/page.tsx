'use client';

import { clearLocalAuth, logout, syncSupabaseSession, getCachedBalance, getCachedUser, storeLocalAuth, ClientUser, formatSmartPrice } from '@/lib/clientAuth';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
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
  ChevronRight,
  Smartphone,
  Download,
} from 'lucide-react';

// In-memory module flag: resets only on full browser reload (F5 / new session), preserved during client-side navigation
let hasShownSplashInCurrentSession = false;

export default function HomePage() {
  const router = useRouter();
  const {
    lang,
    t,
    isRTL,
    getCategoryName,
    getCategoryCount,
    translateBadge,
    translatePackageTitle,
  } = useLanguage();

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [transitioningCatId, setTransitioningCatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalService, setActiveModalService] = useState<ServiceItem | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userBalance, setUserBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return getCachedBalance();
    }
    return 0.0;
  });

  // Show splash ONLY ONCE per browser tab session via sessionStorage
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(() => {
    if (typeof window !== 'undefined') {
      return getCachedUser();
    }
    return null;
  });

  // Home page root anchor & smart modal/product back navigation
  const selectedCatRef = useRef(selectedCat);
  const activeModalServiceRef = useRef(activeModalService);
  const isAuthOpenRef = useRef(isAuthOpen);
  const isDrawerOpenRef = useRef(isDrawerOpen);

  useEffect(() => {
    selectedCatRef.current = selectedCat;
  }, [selectedCat]);

  useEffect(() => {
    activeModalServiceRef.current = activeModalService;
  }, [activeModalService]);

  useEffect(() => {
    isAuthOpenRef.current = isAuthOpen;
  }, [isAuthOpen]);

  useEffect(() => {
    isDrawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  const handleOpenProduct = (service: ServiceItem) => {
    try {
      window.history.pushState({ modal: 'checkout', serviceId: service.id }, '', window.location.pathname);
    } catch {}
    setActiveModalService(service);
  };

  const handleCloseProduct = () => {
    setActiveModalService(null);
  };

  const handleOpenAuth = () => {
    try {
      window.history.pushState({ modal: 'auth' }, '', window.location.pathname);
    } catch {}
    setIsAuthOpen(true);
  };

  const handleOpenDrawer = () => {
    try {
      window.history.pushState({ modal: 'drawer' }, '', window.location.pathname);
    } catch {}
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    try {
      window.history.replaceState({ rootPage: 'home' }, '', '/');
    } catch {}

    // Expose global bridge function for Android Native gesture & back button
    (window as any).handleAutoCashBack = () => {
      // 1. If product checkout modal is open, CLOSE IT and return true!
      if (activeModalServiceRef.current) {
        setActiveModalService(null);
        return true;
      }
      // 2. If Auth modal is open, CLOSE IT and return true!
      if (isAuthOpenRef.current) {
        setIsAuthOpen(false);
        return true;
      }
      // 3. If Drawer is open, CLOSE IT and return true!
      if (isDrawerOpenRef.current) {
        setIsDrawerOpen(false);
        return true;
      }
      // 4. If a Category is selected, return to all categories
      if (selectedCatRef.current !== null) {
        setSelectedCat(null);
        setSearchQuery('');
        return true;
      }
      return false;
    };

    const handlePopState = () => {
      // 1. If product modal is open, closing it satisfies the back gesture!
      if (activeModalServiceRef.current) {
        setActiveModalService(null);
        return;
      }
      // 2. If auth modal is open, close it!
      if (isAuthOpenRef.current) {
        setIsAuthOpen(false);
        return;
      }
      // 3. If drawer is open, close it!
      if (isDrawerOpenRef.current) {
        setIsDrawerOpen(false);
        return;
      }
      // 4. If viewing inside a category, step back to all categories
      if (selectedCatRef.current !== null) {
        setSelectedCat(null);
        setSearchQuery('');
        return;
      }
      // 5. On the home page with no modal open, keep home page anchored as base
      try {
        window.history.pushState({ rootPage: 'home' }, '', '/');
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      delete (window as any).handleAutoCashBack;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    // Check if splash should be shown:
    // Only for brand-new visitors entering the website for the very first time.
    // Never show on page reloads, tab navigation, or subsequent visits.
    try {
      // In native Android app, skip web welcome splash entirely (Native Android splash handles launch)
      const isNativeApp = typeof navigator !== 'undefined' && /AutoCashApp/i.test(navigator.userAgent || '');
      if (isNativeApp) {
        setShowSplash(false);
        try {
          sessionStorage.setItem('autocash_welcome_shown', 'true');
          localStorage.setItem('autocash_welcome_shown', 'true');
        } catch {}
        fetchOrders();
        return;
      }

      const alreadySeen =
        typeof window !== 'undefined' &&
        (localStorage.getItem('autocash_welcome_shown') === 'true' ||
          sessionStorage.getItem('autocash_welcome_shown') === 'true');

      if (!alreadySeen && !hasShownSplashInCurrentSession) {
        setShowSplash(true);
        hasShownSplashInCurrentSession = true;
        try {
          sessionStorage.setItem('autocash_welcome_shown', 'true');
          localStorage.setItem('autocash_welcome_shown', 'true');
        } catch {}
      }
    } catch {
      // Fallback
    }

    fetchOrders();

    const refreshUser = () => {
      const cached = getCachedUser();
      if (cached) {
        setCurrentUser(cached);
        setUserBalance(cached.balance ?? 0.0);
      }

      const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
      const savedEmail = localStorage.getItem('autocash_email');

      if (isLoggedIn === 'true' && savedEmail) {
        fetch('/api/auth/me')
          .then(async (r) => {
            if (r.status === 401) {
              // Server session expired or missing: drop the stale local profile
              clearLocalAuth();
              setCurrentUser(null);
              setUserBalance(0.0);
              return;
            }
            const data = await r.json();
            if (data.success && data.user) {
              setCurrentUser(data.user);
              setUserBalance(data.user.balance ?? 0.0);
              storeLocalAuth(data.user);
            }
          })
          .catch((e) => console.error(e));
      } else {
        // Check if Supabase browser session is active
        import('@/lib/supabaseBrowser').then(({ getBrowserSupabase }) => {
          const sb = getBrowserSupabase();
          if (sb) {
            sb.auth.getSession().then(async ({ data: { session } }) => {
              if (session?.access_token) {
                const syncedUser = await syncSupabaseSession(session.access_token);
                setCurrentUser(syncedUser);
                setUserBalance(syncedUser.balance ?? 0.0);
              } else {
                setCurrentUser(null);
                setUserBalance(0.0);
              }
            }).catch(() => {
              setCurrentUser(null);
              setUserBalance(0.0);
            });
          } else {
            setCurrentUser(null);
            setUserBalance(0.0);
          }
        });
      }
    };

    refreshUser();
    window.addEventListener('autocash-auth-changed', refreshUser);
    window.addEventListener('autocash-app-resumed', refreshUser);
    return () => {
      window.removeEventListener('autocash-auth-changed', refreshUser);
      window.removeEventListener('autocash-app-resumed', refreshUser);
    };
  }, []);

  const handleDismissSplash = () => {
    try {
      localStorage.setItem('autocash_welcome_shown', 'true');
      sessionStorage.setItem('autocash_welcome_shown', 'true');
      window.dispatchEvent(new CustomEvent('autocash-welcome-dismissed'));
    } catch {}
    hasShownSplashInCurrentSession = true;
    setShowSplash(false);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setUserBalance(0.0);
  };

  const handleAuthSuccess = (usr: { id?: string; name: string; email: string; balance?: number; avatarUrl?: string }) => {
    localStorage.setItem('autocash_is_logged_in', 'true');
    localStorage.setItem('autocash_username', usr.name);
    localStorage.setItem('autocash_email', usr.email);
    if (usr.id) localStorage.setItem('autocash_userId', usr.id);
    if (usr.avatarUrl) localStorage.setItem('autocash_avatar', usr.avatarUrl);
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
    router.push('/orders');
  };

  const handleSelectCategory = (catId: string) => {
    if (transitioningCatId) return;
    setTransitioningCatId(catId);
    setTimeout(() => {
      setSelectedCat(catId);
      setTransitioningCatId(null);
      setTimeout(() => {
        const catSection = document.getElementById('category-products-view');
        if (catSection) {
          catSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }
      }, 50);
    }, 450);
  };

  // Storefront catalog: Sahl Cash synced provider catalog (with instant 0ms preloaded fallback)
  const isNotTelecom = (s: ServiceItem) => s.id !== 'srv-1792696947336';

  const normalizeServiceItem = (s: ServiceItem): ServiceItem => {
    let item = s;
    if (item.name && item.name.toLowerCase().includes('canva') && item.category !== 'apps') {
      item = { ...item, category: 'apps' };
    }
    if (item.name && item.name.toLowerCase().includes('turkcell')) {
      const match = SERVICES_DATA.find((b) => b.id === item.id || b.name === item.name);
      if (match && Array.isArray(match.packages)) {
        item = { ...item, packages: match.packages };
      }
    }
    return item;
  };

  const [services, setServices] = useState<ServiceItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('autocash_cached_catalog'); // Clean old legacy cache
        localStorage.removeItem('autocash_cached_catalog_v2'); // Clean v2 cache
        localStorage.removeItem('autocash_cached_catalog_v3'); // Clean v3 cache
        const cachedCat = localStorage.getItem('autocash_cached_catalog_v4');
        if (cachedCat) {
          const parsed = JSON.parse(cachedCat);
          if (Array.isArray(parsed?.services) && parsed.services.length > 0) {
            return parsed.services.filter(isNotTelecom).map(normalizeServiceItem);
          }
        }
      } catch {}
    }
    return SERVICES_DATA.filter(isNotTelecom).map(normalizeServiceItem);
  });

  const [categories, setCategories] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedCats = localStorage.getItem('autocash_cached_categories');
        if (cachedCats) {
          const parsedCats = JSON.parse(cachedCats);
          if (Array.isArray(parsedCats) && parsedCats.length > 0) {
            return parsedCats.map((c: any) => {
              if (c.id === 'numbers' && (c.name === 'مەۋھۇم نومۇر' || !c.name.includes('ئەزالىق'))) {
                return { ...c, name: 'تېلېگرام ئەزالىق', count: 'Telegram Premium', image: '/images/services/telegram.jpg' };
              }
              if (c.id === 'cards' && (c.name === 'كارتىلار ۋە VCC' || c.name === 'كارتىلار' || !c.name.includes('تىلفۇن'))) {
                return { ...c, name: 'تىلفۇن كارتىلىرىغا پۇل قاچىلاش', count: 'Turkcell', image: '/images/services/turkcell.jpg' };
              }
              return c;
            });
          }
        }
      } catch {}
    }
    return [...CATEGORIES_9];
  });

  const [catalogSource, setCatalogSource] = useState<'legacy' | 'provider'>('legacy');
  const [catalogLoading, setCatalogLoading] = useState(false);

  const fetchFreshCatalog = useCallback(() => {
    Promise.all([
      fetch(`/api/catalog?_t=${Date.now()}`, { cache: 'no-store' })
        .then((r) => r.json())
        .catch(() => null),
      fetch(`/api/categories?_t=${Date.now()}`, { cache: 'no-store' })
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([dCat, dCats]) => {
        if (dCat && dCat.success && Array.isArray(dCat.services) && dCat.services.length > 0) {
          const normServices = dCat.services.filter(isNotTelecom).map(normalizeServiceItem);
          setServices(normServices);
          setCatalogSource(dCat.source === 'legacy' ? 'legacy' : 'provider');
          try {
            localStorage.setItem('autocash_cached_catalog_v4', JSON.stringify({ services: normServices, source: dCat.source }));
            localStorage.removeItem('autocash_cached_catalog');
            localStorage.removeItem('autocash_cached_catalog_v2');
            localStorage.removeItem('autocash_cached_catalog_v3');
          } catch {}
        } else if (dCat && Array.isArray(dCat.services) && dCat.services.length > 0) {
          setServices(dCat.services.filter(isNotTelecom).map(normalizeServiceItem));
        }

        if (dCats && dCats.success && Array.isArray(dCats.categories) && dCats.categories.length > 0) {
          const mappedCats = dCats.categories.map((c: any) => {
            if (c.id === 'numbers' && (c.name === 'مەۋھۇم نومۇر' || !c.name.includes('ئەزالىق'))) {
              return { ...c, name: 'تېلېگرام ئەزالىق', count: 'Telegram Premium', image: '/images/services/telegram.jpg' };
            }
            if (c.id === 'cards' && (c.name === 'كارتىلار ۋە VCC' || c.name === 'كارتىلار' || !c.name.includes('تىلفۇن'))) {
              return { ...c, name: 'تىلفۇن كارتىلىرىغا پۇل قاچىلاش', count: 'Turkcell', image: '/images/services/turkcell.jpg' };
            }
            return c;
          });
          setCategories(mappedCats);
          try {
            localStorage.setItem('autocash_cached_categories', JSON.stringify(mappedCats));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // 1. Initial fresh background fetch without stale cache
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    Promise.all([
      fetch(`/api/catalog?_t=${Date.now()}`, { signal: controller.signal, cache: 'no-store' })
        .then((r) => r.json())
        .catch(() => null),
      fetch(`/api/categories?_t=${Date.now()}`, { signal: controller.signal, cache: 'no-store' })
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([dCat, dCats]) => {
        clearTimeout(timeoutId);
        if (dCat && dCat.success && Array.isArray(dCat.services) && dCat.services.length > 0) {
          const normServices = dCat.services.filter(isNotTelecom).map(normalizeServiceItem);
          setServices(normServices);
          setCatalogSource(dCat.source === 'legacy' ? 'legacy' : 'provider');
          try {
            localStorage.setItem('autocash_cached_catalog_v4', JSON.stringify({ services: normServices, source: dCat.source }));
            localStorage.removeItem('autocash_cached_catalog');
            localStorage.removeItem('autocash_cached_catalog_v2');
            localStorage.removeItem('autocash_cached_catalog_v3');
          } catch {}
        } else if (dCat && Array.isArray(dCat.services) && dCat.services.length > 0) {
          setServices(dCat.services.filter(isNotTelecom).map(normalizeServiceItem));
        }

        if (dCats && dCats.success && Array.isArray(dCats.categories) && dCats.categories.length > 0) {
          const mappedCats = dCats.categories.map((c: any) => {
            if (c.id === 'numbers' && (c.name === 'مەۋھۇم نومۇر' || !c.name.includes('ئەزالىق'))) {
              return { ...c, name: 'تېلېگرام ئەزالىق', count: 'Telegram Premium', image: '/images/services/telegram.jpg' };
            }
            if (c.id === 'cards' && (c.name === 'كارتىلار ۋە VCC' || c.name === 'كارتىلار' || !c.name.includes('تىلفۇن'))) {
              return { ...c, name: 'تىلفۇن كارتىلىرىغا پۇل قاچىلاش', count: 'Turkcell', image: '/images/services/turkcell.jpg' };
            }
            return c;
          });
          setCategories(mappedCats);
          try {
            localStorage.setItem('autocash_cached_categories', JSON.stringify(mappedCats));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeoutId);
        setCatalogLoading(false);
      });

    // 2. Real-time sync listener across tabs (when admin publishes from Sahl Cash)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('autocash_catalog_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'CATALOG_UPDATED') {
          fetchFreshCatalog();
        }
      };
    } catch {}

    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'autocash_cached_catalog_v4' || e.key === 'autocash_cached_catalog_v3') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed?.services) && parsed.services.length > 0) {
            setServices(parsed.services);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
      try {
        bc?.close();
      } catch {}
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchFreshCatalog]);

  // Combine official categories with any categories present in loaded services
  const effectiveCategories = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    for (const s of services) {
      if (s.category && !map.has(s.category)) {
        map.set(s.category, {
          id: s.category,
          name: s.category,
          icon: 'Package',
          count: 'مەھسۇلاتلار',
          image: '/brand_logo.png?v=2.1.0',
        });
      }
    }
    return Array.from(map.values());
  }, [categories, services]);

  const serviceCountByCategory = useMemo(() => {
    return services.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {});
  }, [services]);

  // Only show categories that have at least one active published product
  // In RTL, items render right-to-left. Putting 'games' at the end places it on the far-left!
  const visibleCategories = useMemo(() => {
    const list = effectiveCategories.filter((c) => (serviceCountByCategory[c.id] || 0) > 0);
    const gamesItem = list.find((c) => c.id === 'games');
    if (gamesItem) {
      return [...list.filter((c) => c.id !== 'games'), gamesItem];
    }
    return list;
  }, [effectiveCategories, serviceCountByCategory]);

  // Only open products when a category is explicitly clicked, or searching
  const isProductsOpen = selectedCat !== null || searchQuery.trim() !== '';

  const filteredServices = services.filter((service) => {
    const matchCat = selectedCat === null || service.category === selectedCat;
    const matchSearch =
      searchQuery.trim() === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCategoryObj = categories.find((c) => c.id === selectedCat);

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
      <div className="max-w-7xl mx-3.5 sm:mx-auto my-2.5 rounded-2xl bg-[#051322] border border-amber-500/25 py-2 px-3 sm:px-4 text-xs sm:text-sm overflow-hidden select-none shadow-md">
        <div className="flex items-center gap-3 w-full">
          {/* Fixed Badge */}
          <div className="flex items-center gap-1.5 text-amber-300 font-bold shrink-0 gold-badge px-3 py-1 rounded-full font-alkatip text-xs sm:text-sm z-10 shadow-md">
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-400 animate-zap-wiggle" />
            <span>
              <span className="autocash-shimmer font-bold mr-1">AUTO CASH</span>{' '}
              {lang === 'ug'
                ? 'نەق مەيدان:'
                : lang === 'ar'
                ? 'مباشر:'
                : 'Live:'}
            </span>
          </div>

          {/* Continuous Marquee */}
          <div className="overflow-hidden whitespace-nowrap flex-1 relative">
            <div className="animate-marquee-uyghur flex items-center gap-12 font-alkatip text-xs sm:text-sm text-amber-100 font-medium tracking-normal">
              {lang === 'ug' ? (
                <>
                  <div className="flex items-center gap-8 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">🌟</span>
                      <span><span className="autocash-shimmer font-bold">AUTO CASH</span> پىلاتفورمىسىغا كەلگەنلىكىڭىزنى قىزغىن قارشى ئالىمىز!</span>
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
                      <span><span className="autocash-shimmer font-bold">AUTO CASH</span> پىلاتفورمىسىغا كەلگەنلىكىڭىزنى قىزغىن قارشى ئالىمىز!</span>
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
                      <span>أهلاً بكم في منصة <span className="autocash-shimmer font-bold">AUTO CASH</span> لشحن الألعاب والتطبيقات!</span>
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
                      <span>أهلاً بكم في منصة <span className="autocash-shimmer font-bold">AUTO CASH</span> لشحن الألعاب والتطبيقات!</span>
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
                      <span>Welcome to <span className="autocash-shimmer font-bold">AUTO CASH</span> Digital Hub!</span>
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
                      <span>Welcome to <span className="autocash-shimmer font-bold">AUTO CASH</span> Digital Hub!</span>
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
                  <span className="autocash-shimmer font-bold mr-1">AUTO CASH</span>{' '}
                  {lang === 'ug'
                    ? 'ئاپتۇماتىك پۇل قاچىلاش سېستىمىسى'
                    : lang === 'ar'
                    ? 'للشحن التلقائي السريع'
                    : 'Automated Instant Top-up'}
                </span>
              </div>
              <h1 className="font-ukij text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                <span className="autocash-shimmer">
                  AUTO CASH
                </span>{' '}
                —{' '}
                {lang === 'ug'
                  ? 'ئەپ، ئويۇن ۋە كارتىلار مەركىزى'
                  : lang === 'ar'
                  ? 'مركز شحن الألعاب والتطبيقات والبطاقات'
                  : 'Games, Apps & Gift Cards Hub'}
              </h1>
              <p className="font-alkatip text-sm sm:text-base text-slate-200/90 mt-2.5 max-w-2xl leading-relaxed font-normal">
                {t('welcomeSubtitle')}
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              <Link
                href="/deposit"
                className="relative overflow-hidden flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-105 animate-normal-float text-xs sm:text-sm font-bold text-slate-950 transition-all font-alkatip text-center shadow-md hover:scale-105 active:scale-95 cursor-pointer leading-none"
              >
                {/* 360-degree rotating gold border beam */}
                <div className="border-beam-pill" />
                <span className="relative z-10 animate-normal-icon shrink-0">
                  <Wallet className="w-4 h-4 text-slate-950 flex-shrink-0" />
                </span>
                <span className="relative z-10 leading-none">{t('addFunds')}</span>
              </Link>
              <Link
                href="/membership"
                className="relative overflow-hidden flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-full bg-[#061527] hover:bg-[#091f3a] border border-amber-400/40 hover:border-amber-300 text-amber-300 font-bold text-xs sm:text-sm transition-all font-alkatip text-center shadow-md hover:scale-105 active:scale-95 animate-normal-float cursor-pointer leading-none"
                style={{ animationDelay: '0.2s' }}
              >
                {/* 360-degree rotating gold border beam */}
                <div className="border-beam-pill" />
                <span className="relative z-10 animate-normal-icon shrink-0">
                  <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                </span>
                <span className="relative z-10 leading-none">{t('vipMembership')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Rotational Promo Banner */}
        <section>
          <PromoCarousel onSelectCategory={handleSelectCategory} />
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
                  {t('categoriesTitle')} ({visibleCategories.length})
                </span>
              </h2>
            </div>

            {catalogLoading && services.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-28 sm:h-32 rounded-2xl bg-[#061527] border border-amber-500/20 animate-pulse" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="py-14 px-6 rounded-3xl bg-gradient-to-b from-[#061527] to-[#040d1a] border border-amber-500/25 text-center space-y-4 max-w-lg mx-auto shadow-2xl animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-ukij font-bold text-base sm:text-lg text-white">
                    {lang === 'ug'
                      ? 'نۆۋەتتە باشبەتكە ھېچقانداق مەھسۇلات چىقىرىلمىدى'
                      : lang === 'ar'
                      ? 'لا توجد منتجات منشورة حالياً'
                      : 'No products published yet'}
                  </h3>
                  <p className="font-alkatip text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                    {lang === 'ug'
                      ? 'باشقۇرغۇچى باشقۇرۇش مەركىزىدىن مەھسۇلات ۋە سەھىپىلەرنى تەڭشەپ ئېلان قىلغاندىن كېيىن، ئاپتوماتىك بۇ يەردە كۆرۈنىدۇ.'
                      : lang === 'ar'
                      ? 'ستظهر المنتجات هنا فور قيام المدير بنشرها من لوحة التحكم.'
                      : 'Products will appear here once published from the admin panel.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5">
                {visibleCategories.map((cat, idx) => {
                  const isTransitioning = transitioningCatId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`relative overflow-hidden p-3 rounded-2xl ${
                        isRTL ? 'text-right' : 'text-left'
                      } transition-all duration-200 flex flex-col justify-between cursor-pointer group h-28 sm:h-32 gold-card-normal ${
                        isTransitioning
                          ? 'card-selecting-glow'
                          : 'hover:scale-[1.03]'
                      }`}
                    >
                    {/* Rotating Glowing Border Beam on Selection */}
                    {isTransitioning && <div className="border-beam-tracer" />}

                    {/* Category Background Image */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={cat.image}
                        alt={getCategoryName(cat.id, cat.name)}
                        className={`w-full h-full object-cover transition-all duration-300 brightness-95 contrast-105 ${
                          isTransitioning ? 'opacity-100 scale-105' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'
                        }`}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/brand_logo.png?v=2.1.0';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030a14]/90 via-[#030a14]/40 to-transparent" />
                    </div>

                    <div className="relative z-10 flex items-center justify-between w-full">
                      {/* Icon with staggered lightweight float animation + moving lively badge */}
                      <div
                        style={{ animationDelay: `${(idx % 4) * 0.35}s` }}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all border shadow-md animate-cat-icon ${
                          isTransitioning
                            ? 'bg-amber-400 text-slate-950 border-amber-300 scale-110 shadow-amber-400/50'
                            : 'bg-slate-950/85 border-amber-400/50 text-amber-300 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-slate-950'
                        }`}
                      >
                        <span
                          style={{ animationDelay: `${(idx % 6) * 0.25}s` }}
                          className="animate-moving-icon drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                        >
                          <DynamicIcon name={cat.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                      </div>

                      {/* Pill button with subtle lightweight nudge animation */}
                      <span
                        style={{ animationDelay: `${(idx % 4) * 0.35 + 0.18}s` }}
                        className={`text-[9px] sm:text-[10px] border font-bold px-2 py-0.5 rounded-full shadow font-alkatip transition animate-arrow-pill ${
                          isTransitioning
                            ? 'bg-amber-400 text-slate-950 border-amber-300 scale-105'
                            : 'bg-slate-950/85 border-amber-400/50 text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 group-hover:translate-x-[-2px]'
                        }`}
                      >
                        {isRTL ? 'ئېچىش ←' : 'Open →'}
                      </span>
                    </div>

                    <div className="relative z-10 mt-1.5">
                      <h3 className={`font-alkatip font-extrabold text-xs sm:text-sm transition drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                        isTransitioning ? 'text-amber-300' : 'text-white group-hover:text-amber-300'
                      }`}>
                        {getCategoryName(cat.id, cat.name)}
                      </h3>
                      <span className="font-alkatip text-[9px] sm:text-[10px] text-amber-200 font-semibold block mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        {serviceCountByCategory[cat.id] || 0} {isRTL ? 'مۇلازىمەت' : 'services'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        ) : (
          /* View 2: Inside Category Products */
          <section className="pt-2 animate-in fade-in duration-300 space-y-4" id="category-products-view">
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

            {/* Product Cards Grid: 3 per row as requested */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className={`gold-card-normal rounded-2xl p-2 sm:p-3 flex flex-col justify-between transition-all duration-200 group relative overflow-hidden ${
                    isRTL ? 'text-right' : 'text-left'
                  }`}
                >
                  <div>
                    {/* Enlarged Image thumbnail */}
                    <div className="w-full h-20 sm:h-28 rounded-xl overflow-hidden bg-slate-900 relative mb-2 border border-slate-800">
                      <img
                        src={
                          service.image && !service.image.endsWith('sahl-cash.com/') && service.image !== 'https://api.sahl-cash.com'
                            ? service.image
                            : '/images/services/pubg_mobile.jpg'
                        }
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/brand_logo.png?v=2.1.0';
                        }}
                      />
                      {service.badge && (
                        <span className={`absolute top-1.5 ${isRTL ? 'right-1.5' : 'left-1.5'} text-[8px] sm:text-[9px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md shadow-lg font-alkatip flex items-center gap-1 z-10 border border-amber-300/60`}>
                          <span className="animate-moving-icon">
                            {service.badge.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖)/)?.[0] || '⚡'}
                          </span>
                          <span>{translateBadge(service.badge.replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖)\s*/, ''))}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-alkatip text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-1 mb-1.5 leading-snug">
                      {translatePackageTitle(service.name)}
                    </h4>

                    {/* Starting price */}
                    <div className="flex items-center justify-between text-[9px] sm:text-xs bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800/60 mb-2 font-alkatip">
                      <span className="text-slate-400 hidden sm:inline">
                        {isRTL ? 'باھاسى:' : 'From:'}
                      </span>
                      <span className="font-extrabold text-amber-400 font-mono flex items-center gap-0.5" dir="ltr">
                        <span className="text-amber-300">$</span>
                        <span>{formatSmartPrice(service.packages[0]?.price)}</span>
                      </span>
                      <span className="text-slate-400 text-[9px]">
                        {isRTL ? 'دىن' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!currentUser || !currentUser.email) {
                        handleOpenAuth();
                      } else {
                        handleOpenProduct(service);
                      }
                    }}
                    className="w-full py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:opacity-95 text-slate-950 font-black text-[10px] sm:text-xs transition cursor-pointer font-alkatip active:scale-95 flex items-center justify-center gap-1 shadow-sm hover:shadow-amber-500/20"
                  >
                    <span>{isRTL ? 'سېتىۋېلىش' : 'Buy Now'}</span>
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-950 fill-slate-950 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>

            {catalogLoading && filteredServices.length === 0 && (
              <div className="text-center py-16 font-alkatip text-slate-400 text-sm">يۈكلىنىۋاتىدۇ...</div>
            )}

            {!catalogLoading && filteredServices.length === 0 && (
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

      {/* Checkout Modal */}
      {activeModalService && (
        <CheckoutModal
          service={activeModalService}
          user={currentUser}
          onClose={handleCloseProduct}
          onSuccess={handleOrderSuccess}
          onOpenAuth={handleOpenAuth}
        />
      )}
    </div>
  );
}
