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
import AutoCashLogo from '@/components/AutoCashLogo';
import CyberHero3D from '@/components/CyberHero3D';
import CyberFeatures from '@/components/CyberFeatures';
import SGCHomeLayout from '@/components/SGCHomeLayout';
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
  const [initialPromoPkgId, setInitialPromoPkgId] = useState<string | undefined>(undefined);
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
      const hash = selectedCatRef.current ? `#cat=${selectedCatRef.current}&product=${service.id}` : `#product=${service.id}`;
      window.history.pushState({ view: 'product', catId: selectedCatRef.current, serviceId: service.id }, '', hash);
    } catch {}
    setInitialPromoPkgId(undefined);
    setActiveModalService(service);
  };

  const handleSelectPromoPackage = (service: ServiceItem, packageId: string) => {
    try {
      const hash = `#product=${service.id}&pkg=${packageId}`;
      window.history.pushState({ view: 'product', serviceId: service.id, pkgId: packageId }, '', hash);
    } catch {}
    setInitialPromoPkgId(packageId);
    setActiveModalService(service);
  };

  const handleCloseProduct = () => {
    setActiveModalService(null);
    setInitialPromoPkgId(undefined);
    try {
      if (typeof window !== 'undefined' && window.history.state?.view === 'product') {
        window.history.back();
      }
    } catch {}
  };

  const handleBackToCategories = () => {
    setSelectedCat(null);
    setSearchQuery('');
    try {
      if (typeof window !== 'undefined') {
        if (window.history.state?.view === 'category' || window.location.hash.includes('cat=')) {
          window.history.replaceState({ rootPage: 'home' }, '', window.location.pathname);
        }
      }
    } catch {}

    requestAnimationFrame(() => {
      const categoriesSection = document.getElementById('categories-container');
      if (categoriesSection) {
        categoriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 320, behavior: 'smooth' });
      }
    });
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
      if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.history.replaceState({ rootPage: 'home' }, '', '/');
    } catch {}

    // Expose global bridge function for Android Native gesture & back button
    (window as any).handleAutoCashBack = () => {
      // 1. If product checkout modal is open, CLOSE IT ONLY and stay in category view!
      if (activeModalServiceRef.current) {
        setActiveModalService(null);
        try {
          if (window.history.state?.view === 'product') {
            window.history.back();
          }
        } catch {}
        return true;
      }
      // 2. If Auth modal is open, close it!
      if (isAuthOpenRef.current) {
        setIsAuthOpen(false);
        try {
          if (window.history.state?.modal === 'auth') {
            window.history.back();
          }
        } catch {}
        return true;
      }
      // 3. If Drawer is open, close it!
      if (isDrawerOpenRef.current) {
        setIsDrawerOpen(false);
        try {
          if (window.history.state?.modal === 'drawer') {
            window.history.back();
          }
        } catch {}
        return true;
      }
      // 4. If viewing inside a category, step back to all categories (home)
      if (selectedCatRef.current !== null) {
        handleBackToCategories();
        return true;
      }
      return false;
    };

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;

      // 1. If popped back to category state, close product modal but KEEP category active!
      if (state?.view === 'category' || (state?.catId && !state?.serviceId)) {
        setActiveModalService(null);
        setIsAuthOpen(false);
        setIsDrawerOpen(false);
        if (state.catId) {
          setSelectedCat(state.catId);
        }
        return;
      }

      // 2. If popped to root/home page:
      if (!state || state.rootPage === 'home' || (!state.view && !state.catId)) {
        if (activeModalServiceRef.current) {
          setActiveModalService(null);
          return;
        }
        if (isAuthOpenRef.current) {
          setIsAuthOpen(false);
          return;
        }
        if (isDrawerOpenRef.current) {
          setIsDrawerOpen(false);
          return;
        }
        // Return to all categories (home)
        setSelectedCat(null);
        setSearchQuery('');
        return;
      }

      // 3. Modal close fallback
      if (activeModalServiceRef.current) {
        setActiveModalService(null);
        return;
      }
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
    if (usr.avatarUrl && !usr.avatarUrl.startsWith('data:')) {
      localStorage.setItem('autocash_avatar', usr.avatarUrl);
    } else {
      localStorage.removeItem('autocash_avatar');
    }
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
    if (catId === 'numbers') {
      window.location.href = '/numbers';
      return;
    }
    setSelectedCat(catId);
    setSearchQuery('');
    try {
      window.history.pushState({ view: 'category', catId }, '', '#cat=' + catId);
    } catch {}
    requestAnimationFrame(() => {
      const catSection = document.getElementById('category-products-view');
      if (catSection) {
        catSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    });
  };

  // Storefront catalog: Provider synced catalog (with instant 0ms preloaded fallback)
  const isNotTelecom = (s: ServiceItem) => s.id !== 'srv-1792696947336';

  const normalizeServiceItem = (s: ServiceItem): ServiceItem => {
    let item = s;
    if (item.id === 'fursan_net') {
      item = { ...item, image: 'https://i.ibb.co/f3X6BjQ/photo-2026-10-26-07-50-55.jpg' };
    } else if (item.id === 'azez_net') {
      item = { ...item, image: 'https://i.ibb.co/cSFZhGLB/photo-2026-10-26-07-50-39.jpg' };
    } else if (item.id === 'almujahid_net') {
      item = { ...item, image: 'https://i.ibb.co/9HqpZdVg/photo-2026-10-26-08-32-29.jpg' };
    }
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
        localStorage.removeItem('autocash_cached_catalog');
        localStorage.removeItem('autocash_cached_catalog_v2');
        localStorage.removeItem('autocash_cached_catalog_v3');
        localStorage.removeItem('autocash_cached_catalog_v19');
        localStorage.removeItem('autocash_cached_catalog_v21');
        localStorage.removeItem('autocash_cached_catalog_v20');
        const cachedCat = localStorage.getItem('autocash_cached_catalog_v22');
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
        localStorage.removeItem('autocash_cached_categories_v3');
        localStorage.removeItem('autocash_cached_categories_v2');
        const cachedCats = localStorage.getItem('autocash_cached_categories_v4');
        if (cachedCats) {
          const parsedCats = JSON.parse(cachedCats);
          if (Array.isArray(parsedCats) && parsedCats.length > 0) {
            return parsedCats.map((c: any) => {
              if (c.id === 'numbers') {
                return { ...c, name: 'مەۋھۇم نومۇر (SMS)', count: 'Telegram, WhatsApp, etc.', image: '/images/services/whatsapp.jpg' };
              }
              if (c.id === 'cards' && (c.name === 'كارتىلار ۋە VCC' || c.name === 'كارتىلار' || !c.name.includes('تىلفۇن'))) {
                return { ...c, name: 'تىلفۇن كارتىلىرىغا پۇل قاچىلاش', count: 'Turkcell', image: '/images/services/turkcell.jpg' };
              }
              if (c.id === 'wifi') {
                return {
                  ...c,
                  name: 'Wi-Fi تور كارتىلىرى',
                  icon: 'Wifi',
                  count: 'شبكات واي فاي',
                  image: 'https://i.ibb.co/zVPh1p5s/photo-2026-10-26-07-05-36.jpg',
                };
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
  const [wifiStockMap, setWifiStockMap] = useState<Record<string, number>>({});

  const fetchWifiStock = useCallback(() => {
    fetch(`/api/catalog/wifi-stock?_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.stock) {
          const map: Record<string, number> = {};
          for (const [key, val] of Object.entries<any>(d.stock)) {
            const [servId] = key.split(':');
            if (servId) {
              map[servId] = (map[servId] || 0) + Number(val?.available || 0);
            }
          }
          setWifiStockMap(map);
        }
      })
      .catch(() => {});
  }, []);

  const fetchFreshCatalog = useCallback(() => {
    fetchWifiStock();
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
            localStorage.setItem('autocash_cached_catalog_v22', JSON.stringify({ services: normServices, source: dCat.source }));
            localStorage.removeItem('autocash_cached_catalog_v21');
        localStorage.removeItem('autocash_cached_catalog_v20');
            localStorage.removeItem('autocash_cached_catalog_v19');
          } catch {}
        } else if (dCat && Array.isArray(dCat.services) && dCat.services.length > 0) {
          setServices(dCat.services.filter(isNotTelecom).map(normalizeServiceItem));
        }

        if (dCats && dCats.success && Array.isArray(dCats.categories) && dCats.categories.length > 0) {
          const mappedCats = dCats.categories.map((c: any) => {
            if (c.id === 'numbers') {
              return { ...c, name: 'مەۋھۇم نومۇر (SMS)', count: 'Telegram, WhatsApp, etc.', image: '/images/services/whatsapp.jpg' };
            }
            if (c.id === 'cards' && (c.name === 'كارتىلار ۋە VCC' || c.name === 'كارتىلار' || !c.name.includes('تىلفۇن'))) {
              return { ...c, name: 'تىلفۇن كارتىلىرىغا پۇل قاچىلاش', count: 'Turkcell', image: '/images/services/turkcell.jpg' };
            }
            if (c.id === 'wifi') {
              return {
                ...c,
                name: 'Wi-Fi تور كارتىلىرى',
                icon: 'Wifi',
                count: 'شبكات واي فاي',
                image: 'https://i.ibb.co/zVPh1p5s/photo-2026-10-26-07-05-36.jpg',
              };
            }
            return c;
          });
          setCategories(mappedCats);
          try {
            localStorage.setItem('autocash_cached_categories_v4', JSON.stringify(mappedCats));
            localStorage.removeItem('autocash_cached_categories_v3');
            localStorage.removeItem('autocash_cached_categories_v2');
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // 1. Initial fresh background fetch without stale cache
    fetchWifiStock();
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
            localStorage.setItem('autocash_cached_catalog_v22', JSON.stringify({ services: normServices, source: dCat.source }));
            localStorage.removeItem('autocash_cached_catalog_v21');
        localStorage.removeItem('autocash_cached_catalog_v20');
            localStorage.removeItem('autocash_cached_catalog_v19');
          } catch {}
        } else if (dCat && Array.isArray(dCat.services) && dCat.services.length > 0) {
          setServices(dCat.services.filter(isNotTelecom).map(normalizeServiceItem));
        }

        if (dCats && dCats.success && Array.isArray(dCats.categories) && dCats.categories.length > 0) {
          const mappedCats = dCats.categories.map((c: any) => {
            if (c.id === 'numbers') {
              return { ...c, name: 'مەۋھۇم نومۇر (SMS)', count: 'Telegram, WhatsApp, etc.', image: '/images/services/whatsapp.jpg' };
            }
            if (c.id === 'cards' && (c.name === 'كارتىلار ۋە VCC' || c.name === 'كارتىلار' || !c.name.includes('تىلفۇن'))) {
              return { ...c, name: 'تىلفۇن كارتىلىرىغا پۇل قاچىلاش', count: 'Turkcell', image: '/images/services/turkcell.jpg' };
            }
            if (c.id === 'wifi') {
              return {
                ...c,
                name: 'Wi-Fi تور كارتىلىرى',
                icon: 'Wifi',
                count: 'شبكات واي فاي',
                image: 'https://i.ibb.co/zVPh1p5s/photo-2026-10-26-07-05-36.jpg',
              };
            }
            return c;
          });
          setCategories(mappedCats);
          try {
            localStorage.setItem('autocash_cached_categories_v4', JSON.stringify(mappedCats));
            localStorage.removeItem('autocash_cached_categories_v3');
            localStorage.removeItem('autocash_cached_categories_v2');
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeoutId);
        setCatalogLoading(false);
      });

    // 2. Real-time sync listener across tabs (when admin publishes from provider)
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
      if ((e.key === 'autocash_cached_catalog_v22' || e.key === 'autocash_cached_catalog_v20') && e.newValue) {
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
      if (c.id === 'wifi') {
        map.set(c.id, {
          ...c,
          name: c.name && c.name !== 'wifi' ? c.name : 'Wi-Fi تور كارتىلىرى',
          icon: 'Wifi',
          count: 'شبكات واي فاي',
          image: 'https://i.ibb.co/zVPh1p5s/photo-2026-10-26-07-05-36.jpg',
        });
      } else {
        map.set(c.id, c);
      }
    }
    for (const s of services) {
      if (s.category && !map.has(s.category)) {
        if (s.category === 'wifi') {
          map.set(s.category, {
            id: 'wifi',
            name: 'Wi-Fi تور كارتىلىرى',
            icon: 'Wifi',
            count: 'شبكات واي فاي',
            image: 'https://i.ibb.co/zVPh1p5s/photo-2026-10-26-07-05-36.jpg',
          });
        } else {
          map.set(s.category, {
            id: s.category,
            name: s.category,
            icon: 'Package',
            count: 'مەھسۇلاتلار',
            image: '/brand_logo.png?v=2.1.0',
          });
        }
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

  // Pre-selected hot services for the featured grid (matching user's mockup)
  const hotServices = useMemo(() => {
    if (!services || services.length === 0) return [];
    const keywords = [
      { key: 'capcut', tag: 'ئەپ', defaultTitle: 'CapCut Pro ئەزالىق', defaultSub: 'تولۇق كۈتۈپخانا ئېچىش', icon: 'CP', iconBg: '#000', iconColor: '#fff' },
      { key: 'apple', tag: 'كارتا', defaultTitle: 'Apple Store كارتىسى', defaultSub: 'ئامېرىكا / كود چىقىرىش', icon: '🍎', iconBg: '#000', iconColor: '#fff' },
      { key: 'chatgpt', tag: 'ئەزالىق', defaultTitle: 'ChatGPT Plus ئەزالىق', defaultSub: 'تېز قاچىلاش / ھېسابات', icon: 'AI', iconBg: '#10a37f', iconColor: '#fff' },
      { key: 'telegram', tag: 'نومۇر', defaultTitle: 'Telegram قوزغىتىش', defaultSub: 'مەۋھۇم نومۇر / تەستىق كود', icon: '✈️', iconBg: '#2563eb', iconColor: '#fff' },
      { key: 'pubg', tag: 'ئويۇن', defaultTitle: 'PUBG Mobile UC', defaultSub: 'Player ID بىۋاسىتە قاچىلاش', icon: 'PUBG', iconBg: '#f97316', iconColor: '#fff' },
      { key: 'honor', tag: 'ئويۇن', defaultTitle: 'Honor of Kings پۇلى', defaultSub: 'تېز ئاپتوماتىك كىرىش', icon: 'HOK', iconBg: '#d97706', iconColor: '#fff' },
      { key: 'free fire', tag: 'ئويۇن', defaultTitle: 'Free Fire ئالماس', defaultSub: 'Player ID بىلەن دەرھال', icon: 'FF', iconBg: '#dc2626', iconColor: '#fff' },
      { key: 'brawl', tag: 'ئويۇن', defaultTitle: 'Brawl Stars گۆھەر', defaultSub: 'ئاپتوماتىك قاچىلاش', icon: 'BS', iconBg: '#7c3aed', iconColor: '#fff' },
    ];

    const results: { service: ServiceItem; meta: typeof keywords[0] }[] = [];
    const usedIds = new Set<string>();

    for (const kw of keywords) {
      const match = services.find((s) => !usedIds.has(s.id) && s.name.toLowerCase().includes(kw.key));
      if (match) {
        usedIds.add(match.id);
        results.push({ service: match, meta: kw });
      }
    }

    // If some keywords didn't match, pick top services as fallback
    if (results.length < 6) {
      for (const s of services) {
        if (!usedIds.has(s.id)) {
          usedIds.add(s.id);
          results.push({
            service: s,
            meta: {
              key: s.id,
              tag: s.category === 'games' ? 'ئويۇن' : s.category === 'cards' ? 'كارتا' : s.category === 'numbers' ? 'نومۇر' : 'ئەپ',
              defaultTitle: s.name,
              defaultSub: s.description || 'تېز يەتكۈزۈش',
              icon: '⚡',
              iconBg: '#4f46e5',
              iconColor: '#fff',
            },
          });
        }
        if (results.length >= 8) break;
      }
    }

    return results;
  }, [services]);

  // Top Popular Games for the dedicated Games Section (SGC Style: الألعاب الأكثر مبيعاً)
  const popularGames = useMemo(() => {
    if (!services || services.length === 0) return [];
    return services.filter((s) => s.category === 'games').slice(0, 6);
  }, [services]);

  // 5 Signature Categories matching user mockup
  const MAIN_5_CATEGORIES = [
    { id: 'apps', name: 'ئەپلەر', icon: '📱', color: '#6366f1' },
    { id: 'cards', name: 'كارتىلار', icon: '💳', color: '#0284c7' },
    { id: 'accounts', name: 'ئەزالىقلار', icon: '👑', color: '#e11d48' },
    { id: 'numbers', name: 'مەۋھۇم نومۇر', icon: '💬', color: '#059669' },
    { id: 'games', name: 'ئويۇنلار', icon: '🎮', color: '#ea580c' },
  ];

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
      className={`min-h-screen font-alkatip ${
        isRTL ? 'text-right' : 'text-left'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* 2. Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* 3. Product Checkout Modal */}
      {activeModalService && (
        <CheckoutModal
          service={activeModalService}
          user={currentUser}
          initialPackageId={initialPromoPkgId}
          onClose={handleCloseProduct}
          onSuccess={handleOrderSuccess}
          onOpenAuth={handleOpenAuth}
        />
      )}

      {/* 4. SGC GAME 1:1 Auto Cash Layout */}
      <SGCHomeLayout
        onSelectService={(service) => handleOpenProduct(service)}
        onOpenAuth={handleOpenAuth}
      />
    </div>
  );
}
