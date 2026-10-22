'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { isOrderInProgress, type Order, type DepositRecord } from '@/lib/orders';
import { CATEGORIES_9, ServiceItem, ServicePackage } from '@/lib/data';
import { CategoryItem } from '@/lib/categoriesDb';
import ProviderCatalogPanel from '@/components/admin/ProviderCatalogPanel';
import { formatSmartPrice } from '@/lib/formatMoney';
import { detectServiceInputs, getServiceDefaultBio } from '@/lib/catalog/productBios';
import DynamicIcon from '@/components/DynamicIcon';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  FolderPlus,
  Percent,
  Users,
  Wallet,
  Settings,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Edit3,
  Trash2,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Lock,
  Unlock,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Zap,
  Sparkles,
  Sliders,
  RotateCcw,
  ExternalLink,
  Upload,
  Copy,
  Globe,
  Gamepad2,
  Smartphone,
  Bot,
  Share2,
  Coins,
  MessageSquareShare,
  Crown,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Save
} from 'lucide-react';
import { PromoSlideData, DEFAULT_PROMO_SLIDES } from '@/lib/bannersData';

interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  totalSpent: number;
  vipTier: string;
  role: string;
  createdAt: string;
  isBanned?: boolean;
}

export interface SahlPackageRow {
  id: number;
  originalName: string;
  title: string;
  costPrice: number;
  sellPrice: number;
  originalPrice: number;
  productType?: 'fixed' | 'amount';
  selected: boolean;
}

interface SahlGroupedService {
  key: string;
  name: string;
  uyghurName: string;
  category: string;
  categoryName: string;
  image: string;
  inputLabel: string;
  inputPlaceholder: string;
  requiresZoneId?: boolean;
  zoneIdLabel?: string;
  zoneIdPlaceholder?: string;
  bioContent?: string;
  minCost: number;
  maxCost: number;
  packages: SahlPackageRow[];
}

const ANIMATED_BADGE_PRESETS = [
  { icon: '⚡', text: 'ئاپتوماتىك', label: '⚡ ئاپتوماتىك' },
  { icon: '🔥', text: 'ئەڭ قىزىق', label: '🔥 ئەڭ قىزىق' },
  { icon: '👑', text: 'VIP مۇلازىمەت', label: '👑 VIP مۇلازىمەت' },
  { icon: '⭐', text: 'تەۋسىيە', label: '⭐ تەۋسىيە' },
  { icon: '💎', text: 'ئالىي دەرىجىلىك', label: '💎 ئالىي دەرىجىلىك' },
  { icon: '🚀', text: 'تېز يەتكۈزۈش', label: '🚀 تېز يەتكۈزۈش' },
  { icon: '🎉', text: 'ئېتىبار باھا', label: '🎉 ئېتىبار باھا' },
  { icon: '✨', text: 'يېڭى چىققان', label: '✨ يېڭى چىققان' },
  { icon: '🔒', text: '100% كاپالەتلىك', label: '🔒 100% كاپالەتلىك' },
  { icon: '🏆', text: 'ئەڭ كۆپ سېتىلغان', label: '🏆 ئەڭ كۆپ سېتىلغان' },
];

const renderMovingBadge = (badge: string) => {
  if (!badge) return null;
  const match = badge.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖)/);
  if (match) {
    const icon = match[0];
    const rest = badge.slice(icon.length).trim();
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 shrink-0 shadow-sm">
        <span className="animate-moving-icon">{icon}</span>
        <span>{rest}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 shrink-0 shadow-sm">
      <span className="animate-moving-icon">⚡</span>
      <span>{badge}</span>
    </span>
  );
};

interface SystemSettingsState {
  adminPin: string;
  shamcashAddress: string;
  whatsappNumber: string;
  telegramUsername: string;
  siteName: string;
  siteLogo?: string;
  appDownloadUrl?: string;
  providerApiUrl?: string;
  providerApiKey?: string;
  providerApiType?: 'syria4game' | 'smm' | 'custom_rest';
  providerApiSecret?: string;
  providerEnabled?: boolean;
  tsaApiKey?: string;
  tsaAutoDepositEnabled?: boolean;
  shamcashExchangeRate?: number;
}

interface ProviderStatus {
  success: boolean;
  isConfigured: boolean;
  balance: number;
  currency: string;
  userName?: string;
  errorMessage?: string;
  serverPublicIp?: string;
  isIpBlocked?: boolean;
  isLiveBalance?: boolean;
  lastBalanceAt?: string;
  config?: {
    providerApiUrl: string;
    providerApiKey: string;
    providerApiType: 'syria4game' | 'smm' | 'custom_rest';
    providerApiSecret?: string;
    providerEnabled: boolean;
    hasRealKey: boolean;
  };
}

// 🎨 Moving/Lively Game & App Icons for Categories ("مىدىرلاپ تۇرىدىغان بەلگىلەر")
const AVAILABLE_ANIMATED_ICONS = [
  // 🎮 مەشھۇر ئويۇن بەلگىلىرى
  { id: 'Gamepad2', label: 'ئويۇنلار', category: 'game' },
  { id: 'Swords', label: 'جەڭ / كلاش', category: 'game' },
  { id: 'Crosshair', label: 'پابجى / نىشان', category: 'game' },
  { id: 'Target', label: 'مەرگەن / ئېتىش', category: 'game' },
  { id: 'Flame', label: 'قىزىق ئويۇنلار', category: 'game' },
  { id: 'Trophy', label: 'لوڭقا / مۇسابىقە', category: 'game' },
  { id: 'Crown', label: 'VIP / شاھ', category: 'game' },
  { id: 'Gem', label: 'ئالماس / ئالتۇن', category: 'game' },
  { id: 'Zap', label: 'چاقماق / فلاش', category: 'game' },
  { id: 'Rocket', label: 'سۈرئەت / دەرىجە', category: 'game' },
  { id: 'Ghost', label: 'روھ / جەڭچى', category: 'game' },
  { id: 'Skull', label: 'خەتەرلىك / سۈرئەت', category: 'game' },
  { id: 'Bomb', label: 'بومبا / مەخسۇس', category: 'game' },

  // 📱 ئەپلەر ۋە ئالاقە
  { id: 'Smartphone', label: 'يانفون ئەپلىرى', category: 'app' },
  { id: 'MessageSquareShare', label: 'تېلېگرام / نومۇر', category: 'app' },
  { id: 'Share2', label: 'ئىجتىمائىي تور', category: 'app' },
  { id: 'Music', label: 'تىك توك / مۇزىكا', category: 'app' },
  { id: 'Video', label: 'يوتۇب / سىن', category: 'app' },
  { id: 'Tv', label: 'IPTV / نېتفلىكىس', category: 'app' },
  { id: 'Headphones', label: 'ئاۋاز / كۇلۇب', category: 'app' },
  { id: 'Bot', label: 'سۈنئىي ئەقىل (AI)', category: 'app' },
  { id: 'Globe', label: 'خەلقئارالىق تور', category: 'app' },

  // 💰 پۇل، ھەميان ۋە كارتىلار
  { id: 'Wallet', label: 'شامكەش / ھەميان', category: 'pay' },
  { id: 'CreditCard', label: 'Google / iTunes', category: 'pay' },
  { id: 'Coins', label: 'USDT / كرىپتو', category: 'pay' },
  { id: 'Gift', label: 'سوۋغات كارتىسى', category: 'pay' },
  { id: 'ShieldCheck', label: 'بىخەتەرلىك', category: 'pay' },
  { id: 'KeyRound', label: 'تەييار ھېسابات', category: 'pay' },
  { id: 'Sparkles', label: 'ئالاھىدە تۈرلەر', category: 'pay' },
  { id: 'Package', label: 'ئومۇمىي بولاق', category: 'pay' },
];

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinSubmitting, setPinSubmitting] = useState<boolean>(false);

  // App Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'orders' | 'provider' | 'services' | 'banners' | 'deposits' | 'users' | 'finance' | 'settings'
  >('dashboard');

  // Main Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [checkingProvider, setCheckingProvider] = useState<boolean>(false);
  const [providerProducts, setProviderProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [settings, setSettings] = useState<SystemSettingsState>({
    adminPin: '9960996',
    shamcashAddress: 'efe8a2b200d66411c7c7e296369cbba8',
    whatsappNumber: '+963 984 373 459',
    telegramUsername: 'autocash_UYGHUR',
    siteName: 'AUTO CASH',
    siteLogo: '/brand_logo.png?v=2.1.0',
    appDownloadUrl: '',
    tsaApiKey: '',
    tsaAutoDepositEnabled: true,
    shamcashExchangeRate: 15000,
  });

  const [tsaTesting, setTsaTesting] = useState<boolean>(false);
  const [tsaTestResult, setTsaTestResult] = useState<{ success: boolean; message: string; balances?: any[] } | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Categories State
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryForm, setCategoryForm] = useState<{ id?: string; name: string; icon: string; count?: string; image?: string }>({
    name: '',
    icon: 'Gamepad2',
    count: 'مەھسۇلاتلار',
    image: '',
  });

  // Banners / Promo Carousel State
  const [banners, setBanners] = useState<PromoSlideData[]>(DEFAULT_PROMO_SLIDES);
  const [bannerModalOpen, setBannerModalOpen] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<PromoSlideData | null>(null);
  const [bannerForm, setBannerForm] = useState<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    tag: string;
    linkText: string;
    category: string;
    image: string;
    targetUrl: string;
    enabled: boolean;
  }>({
    id: '',
    title: '',
    subtitle: '',
    badge: '⚡ ئەڭ قىزىق ئويۇن',
    tag: 'كاپالەتلىك كود',
    linkText: 'دەرھال قاچىلاش ⚡',
    category: 'games',
    image: '',
    targetUrl: '',
    enabled: true,
  });
  const [iconFilterTab, setIconFilterTab] = useState<'all' | 'game' | 'app' | 'pay'>('all');
  const [productSourceFilter, setProductSourceFilter] = useState<'all' | 'published' | 'sahl'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 24;

  const savedServiceIds = useMemo(() => new Set(services.map((cs) => cs.id)), [services]);

  const [hiddenSahlKeys, setHiddenSahlKeys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = localStorage.getItem('autocash_hidden_sahl_keys');
        return val ? JSON.parse(val) : [];
      } catch {}
    }
    return [];
  });

  const handleHideSahlKey = (key: string) => {
    setHiddenSahlKeys((prev) => {
      const next = [...prev, key];
      try {
        localStorage.setItem('autocash_hidden_sahl_keys', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Product/Service Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState<{
    id?: string;
    name: string;
    category: string;
    icon: string;
    image: string;
    description: string;
    badge: string;
    inputLabel: string;
    inputPlaceholder: string;
    requiresZoneId: boolean;
    zoneIdLabel: string;
    zoneIdPlaceholder: string;
    bioContent: string;
    published: boolean;
    packages: Array<{ id: string; title: string; price: number; originalPrice?: number; costPrice?: number; duration?: string }>;
  }>({
    name: '',
    category: 'games',
    icon: 'Gamepad2',
    image: '',
    description: '',
    badge: '',
    inputLabel: 'ئويۇنچى ID',
    inputPlaceholder: 'ID نومۇرىڭىزنى كىرگۈزۈڭ',
    requiresZoneId: false,
    zoneIdLabel: 'رايون كودى (Zone ID)',
    zoneIdPlaceholder: 'مەسىلەن: 1234',
    bioContent: '',
    published: true,
    packages: [{ id: 'p-1', title: 'ئاساسىي بولاق', price: 1.99, costPrice: 1.65, originalPrice: 2.39, duration: 'دەرھال' }],
  });

  const [serviceMarkupPercent, setServiceMarkupPercent] = useState<number>(20);

  // Sahl Cash Importer / Customizer Modal State (Whole-Service & All Packages)
  const [sahlCashModalOpen, setSahlCashModalOpen] = useState(false);
  const [sahlSearch, setSahlSearch] = useState('');
  const [sahlCategoryFilter, setSahlCategoryFilter] = useState('all');
  const [selectedSahlGroup, setSelectedSahlGroup] = useState<SahlGroupedService | null>(null);
  const [sahlBulkMarkup, setSahlBulkMarkup] = useState<number>(15);
  const [savingSahlProduct, setSavingSahlProduct] = useState(false);
  const [sahlForm, setSahlForm] = useState<{
    name: string;
    category: string;
    image: string;
    badge: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    requiresZoneId: boolean;
    zoneIdLabel: string;
    zoneIdPlaceholder: string;
    bioContent: string;
    published: boolean;
    packages: SahlPackageRow[];
  }>({
    name: '',
    category: 'games',
    image: '',
    badge: '⚡ ئاپتوماتىك',
    description: 'ئاپتوماتىك پۇل قاچىلاش مۇلازىمىتى',
    inputLabel: 'ئويۇنچى ID (Player ID)',
    inputPlaceholder: 'ئويۇن كىملىك نومۇرىنى كىرگۈزۈڭ',
    requiresZoneId: false,
    zoneIdLabel: 'رايون كودى (Zone ID)',
    zoneIdPlaceholder: 'مەسىلەن: 1234',
    bioContent: '',
    published: true,
    packages: [],
  });

  // Settings Save Message
  const [settingsSaveMsg, setSettingsSaveMsg] = useState('');

  // Provider Dynamic Setup State
  const [providerForm, setProviderForm] = useState<{
    apiUrl: string;
    apiKey: string;
    apiType: 'syria4game' | 'smm' | 'custom_rest';
    apiSecret: string;
    enabled: boolean;
  }>({
    apiUrl: 'https://api.sahl-cash.com',
    apiKey: '',
    apiType: 'syria4game',
    apiSecret: '',
    enabled: true,
  });
  const [savingProvider, setSavingProvider] = useState<boolean>(false);
  const [providerFeedback, setProviderFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  // User Balance & VIP Edit Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [balanceDelta, setBalanceDelta] = useState<number>(0);
  const [selectedVipTier, setSelectedVipTier] = useState<string>('vip1');
  const [selectedUserRole, setSelectedUserRole] = useState<'user' | 'admin'>('user');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Reset Stats Modal
  const [showResetStatsModal, setShowResetStatsModal] = useState(false);
  const [resetUserBalances, setResetUserBalances] = useState(false);
  const [resettingStats, setResettingStats] = useState(false);

  const handleResetStats = async () => {
    setResettingStats(true);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const res = await fetch('/api/admin/reset-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resetDeposits: true,
          resetOrders: true,
          resetUserBalances,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowResetStatsModal(false);
        setResetUserBalances(false);
        await loadAllAdminData();
      } else {
        alert(data.message || 'خاتالىق كۆرۈلدى');
      }
    } catch (e) {
      console.error(e);
      alert('ئۇلىنىش خاتالىقى كۆرۈلدى');
    } finally {
      setResettingStats(false);
    }
  };

  // 1. Session verification
  useEffect(() => {
    const token = sessionStorage.getItem('autocash_admin_token');
    if (token) {
      fetch('/api/admin/auth', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setIsAuthenticated(true);
          else sessionStorage.removeItem('autocash_admin_token');
        })
        .catch(() => {});
    }
  }, []);

  // Audio alert chime using browser Web Audio API (zero audio file dependencies, instant, crisp)
  const playNotificationSound = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const isRefreshingLiveRef = useRef(false);

  // High-speed silent live polling: fetches orders, deposits, and users without blocking the UI
  const refreshLiveOrdersAndDeposits = async (isManual = false) => {
    if (isRefreshingLiveRef.current) return;
    const token = sessionStorage.getItem('autocash_admin_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    isRefreshingLiveRef.current = true;
    try {
      const [resOrders, resDeposits, resUsers] = await Promise.all([
        fetch('/api/orders', { headers }).then((r) => r.json()).catch(() => null),
        fetch('/api/deposits', { headers }).then((r) => r.json()).catch(() => null),
        fetch('/api/admin/users', { headers }).then((r) => r.json()).catch(() => null),
      ]);

      if (resOrders && resOrders.success && Array.isArray(resOrders.orders)) {
        setOrders((prev) => {
          if (prev.length > 0 && resOrders.orders.length > prev.length) {
            playNotificationSound();
          }
          return resOrders.orders;
        });
      }

      if (resDeposits && resDeposits.success && Array.isArray(resDeposits.deposits)) {
        setDeposits((prev) => {
          const prevPending = prev.filter((d) => d.status === 'pending').length;
          const newPending = resDeposits.deposits.filter((d: any) => d.status === 'pending').length;
          if (prev.length > 0 && newPending > prevPending) {
            playNotificationSound();
          }
          return resDeposits.deposits;
        });
      }

      if (resUsers && resUsers.success && Array.isArray(resUsers.users)) {
        setUsers(resUsers.users);
      }
    } catch (e) {
      console.error('Silent live refresh error:', e);
    } finally {
      isRefreshingLiveRef.current = false;
    }
  };

  // 2. Fetch all admin data & setup high-speed 3s Live Polling + Supabase Realtime
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial comprehensive data load
    loadAllAdminData();

    // High-speed 3-second live poller
    const poller = setInterval(() => {
      refreshLiveOrdersAndDeposits();
    }, 3000);

    // Instant refresh on window focus / tab visibility change
    const onFocus = () => refreshLiveOrdersAndDeposits(true);
    const onVisibility = () => {
      if (!document.hidden) refreshLiveOrdersAndDeposits(true);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    // Supabase Realtime instant WebSocket channel
    let realtimeChannel: any = null;
    import('@/lib/supabaseBrowser')
      .then(({ getBrowserSupabase }) => {
        const sb = getBrowserSupabase();
        if (!sb) return;

        realtimeChannel = sb
          .channel('admin-live-feed')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            refreshLiveOrdersAndDeposits();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
            refreshLiveOrdersAndDeposits();
          })
          .subscribe();
      })
      .catch(() => {});

    return () => {
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      if (realtimeChannel) {
        import('@/lib/supabaseBrowser').then(({ getBrowserSupabase }) => {
          const sb = getBrowserSupabase();
          if (sb && realtimeChannel) sb.removeChannel(realtimeChannel);
        });
      }
    };
  }, [isAuthenticated]);

  const loadAllAdminData = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [resOrders, resDeposits, resUsers, resServices, resCategories, resSettings, resProducts, resBanners] = await Promise.all([
        fetch('/api/orders', { headers }).then((r) => r.json()),
        fetch('/api/deposits', { headers }).then((r) => r.json()),
        fetch('/api/admin/users', { headers }).then((r) => r.json()),
        fetch(`/api/admin/services?t=${Date.now()}`, { headers, cache: 'no-store' }).then((r) => r.json()),
        fetch(`/api/admin/categories?t=${Date.now()}`, { headers, cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/settings', { headers }).then((r) => r.json()),
        fetch('/api/admin/provider?action=products', { headers }).then((r) => r.json()).catch(() => null),
        fetch(`/api/admin/banners?t=${Date.now()}`, { headers, cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ]);

      if (resOrders.success) setOrders(resOrders.orders || []);
      if (resDeposits.success) setDeposits(resDeposits.deposits || []);
      if (resUsers.success) setUsers(resUsers.users || []);
      if (resServices.success) setServices(resServices.services || []);
      if (resCategories.success && Array.isArray(resCategories.categories)) {
        setCategoriesList(resCategories.categories);
      }
      if (resBanners && resBanners.success && Array.isArray(resBanners.banners)) {
        setBanners(resBanners.banners);
      }
      if (resSettings.success && resSettings.settings) setSettings(resSettings.settings);
      if (resProducts && resProducts.success && Array.isArray(resProducts.products)) {
        setProviderProducts(resProducts.products);
      }

      // Check external gaming provider (syria4game.com) status in background
      checkProviderLive();
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'services' && providerProducts.length === 0 && !loadingProducts) {
      fetchProviderProducts(true);
    }
  }, [isAuthenticated, activeTab, providerProducts.length, loadingProducts]);

  const checkProviderLive = async () => {
    setCheckingProvider(true);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const res = await fetch('/api/admin/provider?action=balance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data) {
        setProviderStatus(data);
        if (data.config) {
          setProviderForm((prev) => ({
            ...prev,
            apiUrl: data.config.providerApiUrl || prev.apiUrl,
            apiType: data.config.providerApiType || prev.apiType,
            apiSecret: data.config.providerApiSecret || '',
            enabled: data.config.providerEnabled !== undefined ? data.config.providerEnabled : true,
          }));
        }
      }
    } catch (err) {
      console.error('Provider live check failed:', err);
    } finally {
      setCheckingProvider(false);
    }
  };

  const handleSaveProviderConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProvider(true);
    setProviderFeedback(null);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const payload: any = {
        providerApiUrl: providerForm.apiUrl.trim(),
        providerApiType: providerForm.apiType,
        providerApiSecret: providerForm.apiSecret.trim(),
        providerEnabled: providerForm.enabled,
      };
      if (providerForm.apiKey.trim()) {
        payload.providerApiKey = providerForm.apiKey.trim();
      }
      const res = await fetch('/api/admin/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setProviderFeedback({ success: true, message: data.message || 'API مۇۋەپپەقىيەتلىك ئۇلاندى ھەم قالدۇق پۇل تەكشۈرۈلدى!' });
        // Clear entered secret key from form for safety
        setProviderForm((prev) => ({ ...prev, apiKey: '' }));
      } else {
        setProviderFeedback({ success: false, message: data.message || data.errorMessage || 'ساقلاندى ئەمما ئۇلىنىش مەغلۇپ بولدى' });
      }
      await checkProviderLive();
    } catch (err: any) {
      setProviderFeedback({ success: false, message: err?.message || 'تور ئۇلىنىش خاتالىقى' });
    } finally {
      setSavingProvider(false);
    }
  };

  const fetchProviderProducts = async (silent = false) => {
    setLoadingProducts(true);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const res = await fetch('/api/admin/provider?action=products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.products)) {
        setProviderProducts(data.products);
        if (!silent) {
          alert(`Sahl Cash تىن ${data.products.length} دانە مەھسۇلات ئۇتۇقلۇق يېڭىلاندى!`);
        }
      } else if (!silent) {
        alert(data?.errorMessage || 'مەھسۇلاتلارنى ئېلىش مەغلۇپ بولدى');
      }
    } catch (err: any) {
      if (!silent) alert(err.message || 'تور كاشىلىسى');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setPinSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        sessionStorage.setItem('autocash_admin_token', data.token);
        setIsAuthenticated(true);
        setPinError(false);
      } else {
        setPinError(true);
        setPinInput('');
        setTimeout(() => setPinError(false), 2500);
      }
    } catch {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 2500);
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('autocash_admin_token');
    fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {});
    setIsAuthenticated(false);
    setPinInput('');
  };

  // Refund to the buyer's wallet (replaces plain "cancel", which used to keep the money)
  const handleRefundOrder = async (order: Order) => {
    if (!window.confirm(`${order.id}: $${formatSmartPrice(order.amount)} خېرىدارنىڭ ھەميانىغا قايتۇرۇلسۇنمۇ؟`)) return;
    setActionLoading(order.id);
    const token = sessionStorage.getItem('autocash_admin_token');
    const call = (force: boolean) =>
      fetch('/api/admin/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id, force }),
      }).then((r) => r.json());
    try {
      let data = await call(false);
      if (
        !data.success &&
        data.needsForce &&
        window.confirm('بۇ زاكاز تاماملانغان. مال يەتكۈزۈلمىگەنلىكى جەزم بولسا، پۇلنى يەنىلا قايتۇرامسىز؟')
      ) {
        data = await call(true);
      }
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...(data.order || {}), status: 'refunded' } : o)));
      } else {
        alert(data.message || 'پۇل قايتۇرۇلمىدى');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Ask syria4game for the order's status now
  const handleRecheckOrder = async (order: Order) => {
    setActionLoading(order.id);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const res = await fetch('/api/admin/orders/recheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
      } else if (!data.success) {
        alert(data.message || 'تەكشۈرۈش مەغلۇپ بولدى');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Order Status Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setActionLoading(orderId);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        alert(data.message || 'خاتالىق كۆرۈلدى');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Deposit Status Handler
  const handleUpdateDepositStatus = async (
    depositId: string,
    newStatus: 'completed' | 'rejected'
  ) => {
    setActionLoading(depositId);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const res = await fetch('/api/deposits', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ depositId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDeposits((prev) =>
          prev.map((d) => (d.id === depositId ? { ...d, status: newStatus } : d))
        );
        // Refresh users to show updated balances
        const resUsers = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json());
        if (resUsers.success) setUsers(resUsers.users);
      } else {
        alert(data.message || 'خاتالىق كۆرۈلدى');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // User Ban / Unban Handler
  const handleToggleUserBan = async (user: SafeUser) => {
    setActionLoading(user.id);
    const token = sessionStorage.getItem('autocash_admin_token');
    const newBannedState = !user.isBanned;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          updates: { isBanned: newBannedState },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isBanned: newBannedState } : u))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // User Role (Admin / User) Handler
  const handleToggleUserRole = async (user: SafeUser, explicitRole?: 'admin' | 'user') => {
    if (user.email?.toLowerCase() === 'dronemax0996@gmail.com' && (explicitRole === 'user' || user.role === 'admin')) {
      alert('بۇ ئاساسىي باشقۇرغۇچى (Super Admin) ھېساباتى، بۇنىڭ ھوقۇقىنى تاقاشقا بولمايدۇ!');
      return;
    }

    const newRole = explicitRole || (user.role === 'admin' ? 'user' : 'admin');
    const confirmMsg = newRole === 'admin'
      ? `"${user.name}" (${user.email}) غا باشقۇرغۇچى كىرىش ھوقۇقى بېرەمسىز؟`
      : `"${user.name}" (${user.email}) نىڭ باشقۇرغۇچىلىق ھوقۇقىنى تاقامسىز؟`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(user.id);
    const token = sessionStorage.getItem('autocash_admin_token');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          updates: { role: newRole },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
        alert(newRole === 'admin' ? 'باشقۇرۇش ھوقۇقى ئېچىپ بېرىلدى!' : 'باشقۇرۇش ھوقۇقى تاقالدى!');
      } else {
        alert(data.message || 'مەشغۇلات مەغلۇپ بولدى');
      }
    } catch (e) {
      console.error(e);
      alert('ئۇلىنىش خاتالىقى');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantAdminByEmail = async () => {
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      alert('ئېنىق ئېلخەت ئادرېسى كىرگۈزۈڭ');
      return;
    }
    setAddingAdmin(true);
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newAdminEmail.trim().toLowerCase(),
          role: 'admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'باشقۇرغۇچىلىق ھوقۇقى بېرىلدى!');
        setNewAdminEmail('');
        await loadAllAdminData();
      } else {
        alert(data.message || 'مەشغۇلات مەغلۇپ بولدى');
      }
    } catch (e) {
      console.error(e);
      alert('ئۇلىنىش خاتالىقى');
    } finally {
      setAddingAdmin(false);
    }
  };

  // User Balance & VIP Adjust
  const handleAdjustBalance = async () => {
    if (!selectedUser) return;
    setActionLoading(selectedUser.id);
    const token = sessionStorage.getItem('autocash_admin_token');

    const updates: Record<string, any> = {};
    if (selectedVipTier && selectedVipTier !== selectedUser.vipTier) {
      updates.vipTier = selectedVipTier;
    }
    if (selectedUserRole && selectedUserRole !== selectedUser.role) {
      updates.role = selectedUserRole;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          balanceDelta: balanceDelta !== 0 ? balanceDelta : undefined,
          updates: Object.keys(updates).length > 0 ? updates : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, ...data.user } : u))
        );
        setUserModalOpen(false);
        setBalanceDelta(0);
        setSelectedUser(null);
      } else {
        alert(data.message || 'خاتالىق كۆرۈلدى');
      }
    } catch (e) {
      console.error(e);
      alert('ئۇلىنىش خاتالىقى كۆرۈلدى');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUserVip = async (user: SafeUser, newVipTier: string) => {
    setActionLoading(user.id);
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          updates: { vipTier: newVipTier },
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, vipTier: data.user.vipTier } : u))
        );
      } else {
        alert(data.message || 'VIP دەرىجىسى ئۆزگەرمىدى');
      }
    } catch (e) {
      console.error(e);
      alert('ئۇلىنىش خاتالىقى كۆرۈلدى');
    } finally {
      setActionLoading(null);
    }
  };

  // Category CRUD operations
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      icon: 'Gamepad2',
      count: 'مەھسۇلاتلار',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80',
    });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryForm({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || 'Gamepad2',
      count: cat.count || 'مەھسۇلاتلار',
      image: cat.image || '',
    });
    setCategoryModalOpen(true);
  };

  const clearStorefrontCache = () => {
    try {
      localStorage.removeItem('autocash_cached_catalog');
      localStorage.removeItem('autocash_cached_categories');
      const bc = new BroadcastChannel('autocash_catalog_channel');
      bc.postMessage({ type: 'CATALOG_UPDATED' });
      bc.close();
    } catch {}
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert('سەھىپە نامىنى كىرگۈزۈڭ');
      return;
    }
    const token = sessionStorage.getItem('autocash_admin_token');
    const isEdit = Boolean(editingCategory && editingCategory.id);
    const method = isEdit ? 'PUT' : 'POST';
    const payload = isEdit
      ? { id: editingCategory!.id, ...categoryForm }
      : categoryForm;

    try {
      const res = await fetch('/api/admin/categories', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.category) {
        clearStorefrontCache();
        setCategoriesList((prev) => {
          const idx = prev.findIndex((c) => c.id === data.category.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = data.category;
            return next;
          }
          return [...prev, data.category];
        });

        // Automatically select this category if inside product forms!
        if (sahlCashModalOpen) {
          setSahlForm((prev) => ({ ...prev, category: data.category.id }));
        }
        if (serviceModalOpen) {
          setServiceForm((prev) => ({ ...prev, category: data.category.id }));
        }

        setCategoryModalOpen(false);
        setEditingCategory(null);
        alert(`«${data.category.name}» سەھىپىسى مۇۋەپپەقىيەتلىك ${isEdit ? 'يېڭىلاندى' : 'قوشۇلدى'}!`);
      } else {
        alert(data.message || 'سەھىپە ساقلاش مەغلۇپ بولدى');
      }
    } catch (err) {
      console.error(err);
      alert('ئۇلىنىش خاتالىقى كۆرۈلدى');
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    const catProductsCount = services.filter((s) => s.category === catId).length;
    const msg = catProductsCount > 0
      ? `«${catName}» سەھىپىسىنى ۋە ئۇنىڭ ئىچىدىكى بارلىق (${catProductsCount}) مەھسۇلاتنى راستىنلا ئۆچۈرەمسىز؟`
      : `«${catName}» سەھىپىسىنى راستىنلا ئۆچۈرەمسىز؟`;
    if (!confirm(msg)) return;
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(catId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        clearStorefrontCache();
        setCategoriesList((prev) => prev.filter((c) => c.id !== catId));
        setServices((prev) => prev.filter((s) => s.category !== catId));
        if (categoryFilter === catId) setCategoryFilter('all');
      } else {
        alert(data.message || 'سەھىپىنى ئۆچۈرۈش مەغلۇپ بولدى');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= BANNERS / PROMO CAROUSEL HANDLERS =================
  const getBannerFieldStr = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.ug || val.en || val.ar || Object.values(val)[0] || '';
  };

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      id: `slide-${Date.now()}`,
      title: '',
      subtitle: '',
      badge: '✨ قىزىق تەشۋىقات',
      tag: 'كاپالەتلىك كود',
      linkText: 'دەرھال كۆرۈش ⚡',
      category: 'games',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
      targetUrl: '',
      enabled: true,
    });
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: PromoSlideData) => {
    setEditingBanner(b);
    setBannerForm({
      id: b.id,
      title: getBannerFieldStr(b.title),
      subtitle: getBannerFieldStr(b.subtitle),
      badge: getBannerFieldStr(b.badge) || '✨ قىزىق تەشۋىقات',
      tag: getBannerFieldStr(b.tag) || 'كاپالەتلىك كود',
      linkText: getBannerFieldStr(b.linkText) || 'دەرھال كۆرۈش ⚡',
      category: b.category || 'games',
      image: b.image || '',
      targetUrl: b.targetUrl || '',
      enabled: b.enabled !== false,
    });
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      alert('ئېلان نامىنى (ماۋزۇسىنى) كىرگۈزۈڭ');
      return;
    }
    if (!bannerForm.image.trim()) {
      alert('ئېلان ئارقا كۆرۈنۈش رەسىمىنى كىرگۈزۈڭ ياكى رەسىم تاللاڭ');
      return;
    }

    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const payload = {
      action: editingBanner ? 'update' : 'add',
      banner: {
        id: bannerForm.id || `slide-${Date.now()}`,
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim(),
        badge: bannerForm.badge.trim(),
        tag: bannerForm.tag.trim(),
        linkText: bannerForm.linkText.trim(),
        category: bannerForm.category,
        image: bannerForm.image.trim(),
        targetUrl: bannerForm.targetUrl.trim(),
        enabled: bannerForm.enabled,
      },
    };

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
        setBannerModalOpen(false);
        setEditingBanner(null);
        alert('ئېلان مۇۋەپپەقىيەتلىك ساقلاندى ھەمدە دەرھال باشبەتكە چىقىرىلدى!');
      } else {
        alert(data.message || 'ساقلاش مەغلۇپ بولدى');
      }
    } catch {
      alert('ساقلاشتا خاتالىق يۈز بەردى');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('بۇ ئېلاننى راستتىنلا ئۆچۈرەمسىز؟')) return;
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete', bannerId: id }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
      }
    } catch {}
  };

  const handleToggleBannerEnabled = async (b: PromoSlideData) => {
    const updated = banners.map((item) =>
      item.id === b.id ? { ...item, enabled: !item.enabled } : item
    );
    setBanners(updated);
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    await fetch('/api/admin/banners', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'save_all', banners: updated }),
    });
  };

  const handleMoveBanner = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const reordered = [...banners];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setBanners(reordered);

    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    await fetch('/api/admin/banners', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'save_all', banners: reordered }),
    });
  };

  const handleResetBanners = async () => {
    if (!confirm('بارلىق ئېلانلارنى ئەسلىدىكى كۆڭۈلدىكى تەڭشەككە قايتۇرامسىز؟')) return;
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'reset' }),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.banners)) {
      setBanners(data.banners);
      alert('ئېلانلار ئەسلىدىكى ھالەتكە قايتۇرۇلدى!');
    }
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('پەقەت رەسىم ھۆججىتى (JPG, PNG, WebP) تاللاشقا بولىدۇ');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1280;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setBannerForm((prev) => ({ ...prev, image: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Clear all products
  const handleClearAllServices = async () => {
    if (!confirm('دىققەت! بارلىق سىناق مەھسۇلاتلارنى تولۇق يۇيۇپ نۆللىمەكچىمۇ؟ بۇنىڭدىن كېيىن قايتا چىقىۋالمايدۇ.')) return;
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch('/api/admin/services?all=true', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setServices([]);
        alert('بارلىق مەھسۇلاتلار مۇۋەپپەقىيەتلىك يۇيۇلدى!');
      } else {
        alert(data.message || 'يۇيۇش مەغلۇپ بولدى');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear products in selected category
  const handleClearCategoryServices = async (catId: string, catName: string) => {
    const count = services.filter((s) => s.category === catId).length;
    if (!confirm(`«${catName}» سەھىپىسىدىكى بارلىق ${count} مەھسۇلاتنى يۇيۇۋەتمەكچىمۇ؟`)) return;
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch(`/api/admin/services?category=${encodeURIComponent(catId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setServices((prev) => prev.filter((s) => s.category !== catId));
      } else {
        alert(data.message || 'يۇيۇش مەغلۇپ بولدى');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Restore defaults if needed
  const handleRestoreDefaultServices = async () => {
    if (!confirm('دەسلەپكى ئۈلگە مەھسۇلاتلارنى ئەسلىگە كەلتۈرەمسىز؟')) return;
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch('/api/admin/services?reset=true', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await loadAllAdminData();
        alert('ئۈلگە مەھسۇلاتلار ئەسلىگە كەلتۈرۈلدى!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Service CRUD operations
  const handleOpenAddService = () => {
    setEditingService(null);
    const cat = categoryFilter !== 'all' ? categoryFilter : (categoriesList[0]?.id || 'games');
    const detected = detectServiceInputs('', cat);
    setServiceForm({
      name: '',
      category: cat,
      icon: 'Gamepad2',
      image: '',
      description: '',
      badge: '⚡ ئاپتوماتىك',
      inputLabel: detected.inputLabel,
      inputPlaceholder: detected.inputPlaceholder,
      requiresZoneId: false,
      zoneIdLabel: 'رايون كودى (Zone ID)',
      zoneIdPlaceholder: 'مەسىلەن: 1234',
      bioContent: '',
      published: true,
      packages: [
        { id: `p-${Date.now()}-1`, title: 'ئاساسىي بولاق', price: 1.99, duration: 'دەرھال' }
      ],
    });
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (srv: ServiceItem) => {
    setEditingService(srv);
    let detectedMarkup = 20;

    const existingPkgs = srv.packages && srv.packages.length > 0
      ? srv.packages.map((p, idx) => {
          const sell = Number(p.price) || 1.0;
          const cost = Number((p as any).costPrice) || (p.originalPrice && Number(p.originalPrice) < sell ? Number(p.originalPrice) : Math.round((sell / 1.2) * 100) / 100);
          const orig = p.originalPrice && Number(p.originalPrice) > sell
            ? Number(p.originalPrice)
            : Math.round(sell * 1.2 * 100) / 100;

          if (cost > 0 && sell > cost && idx === 0) {
            detectedMarkup = Math.round(((sell - cost) / cost) * 100);
          }

          return {
            id: p.id || `p-${idx + 1}`,
            title: p.title || `بولاق ${idx + 1}`,
            costPrice: cost,
            price: sell,
            originalPrice: orig,
            duration: p.duration || 'دەرھال',
          };
        })
      : [{ id: `p-${Date.now()}-1`, title: 'ئاساسىي بولاق', costPrice: 1.0, price: 1.20, originalPrice: 1.44, duration: 'دەرھال' }];

    setServiceMarkupPercent(detectedMarkup > 0 ? detectedMarkup : 20);

    const detected = detectServiceInputs(srv.name, srv.category);

    setServiceForm({
      id: srv.id,
      name: srv.name,
      category: srv.category,
      icon: srv.icon || 'Package',
      image: srv.image || '',
      description: srv.description || '',
      badge: srv.badge || '',
      inputLabel: srv.inputLabel || detected.inputLabel,
      inputPlaceholder: srv.inputPlaceholder || detected.inputPlaceholder,
      requiresZoneId: srv.requiresZoneId !== undefined ? srv.requiresZoneId : detected.requiresZoneId,
      zoneIdLabel: srv.zoneIdLabel || detected.zoneIdLabel || 'رايون كودى (Zone ID)',
      zoneIdPlaceholder: srv.zoneIdPlaceholder || detected.zoneIdPlaceholder || 'مەسىلەن: 1234',
      bioContent: srv.bioContent || detected.defaultBio || '',
      published: savedServiceIds.has(srv.id) ? (srv.published !== false) : true,
      packages: existingPkgs,
    });
    setServiceModalOpen(true);
  };

  const handleServiceImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('پەقەت رەسىم ھۆججىتى تاللىيالايسىز');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setServiceForm((prev) => ({ ...prev, image: compressed }));
        } else {
          setServiceForm((prev) => ({ ...prev, image: rawDataUrl }));
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAddPackageRow = () => {
    setServiceForm((prev) => {
      const base = 1.0;
      const sell = Math.round(base * (1 + serviceMarkupPercent / 100) * 100) / 100;
      return {
        ...prev,
        packages: [
          ...prev.packages,
          {
            id: `pkg-${Date.now()}-${prev.packages.length + 1}`,
            title: '',
            costPrice: base,
            price: sell,
            originalPrice: Math.round(sell * 1.2 * 100) / 100,
            duration: 'دەرھال',
          },
        ],
      };
    });
  };

  const handleBasePriceChange = (index: number, newBase: number) => {
    setServiceForm((prev) => {
      const next = [...prev.packages];
      const base = Number(newBase) || 0;
      const sell = Math.round(base * (1 + serviceMarkupPercent / 100) * 100) / 100;
      next[index] = {
        ...next[index],
        costPrice: base,
        price: Math.max(0.01, sell),
        originalPrice: Math.round(sell * 1.2 * 100) / 100,
      };
      return { ...prev, packages: next };
    });
  };

  const handleSellPriceChange = (index: number, newSell: number) => {
    setServiceForm((prev) => {
      const next = [...prev.packages];
      const sell = Number(newSell) || 0;
      next[index] = {
        ...next[index],
        price: sell,
        originalPrice: Math.max(sell, Math.round(sell * 1.2 * 100) / 100),
      };
      return { ...prev, packages: next };
    });
  };

  const handleApplyServiceBulkMarkup = (percent: number) => {
    setServiceMarkupPercent(percent);
    setServiceForm((prev) => {
      const nextPkgs = prev.packages.map((pkg) => {
        const base = Number(pkg.costPrice) || Number(pkg.price) || 1;
        const sell = Math.round(base * (1 + percent / 100) * 100) / 100;
        return {
          ...pkg,
          costPrice: base,
          price: Math.max(0.01, sell),
          originalPrice: Math.round(sell * 1.2 * 100) / 100,
        };
      });
      return { ...prev, packages: nextPkgs };
    });
  };

  const handleUpdatePackageRow = (index: number, field: string, val: any) => {
    setServiceForm((prev) => {
      const next = [...prev.packages];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, packages: next };
    });
  };

  const handleRemovePackageRow = (index: number) => {
    setServiceForm((prev) => {
      if (prev.packages.length <= 1) {
        alert('مەھسۇلاتتا كەم دېگەندە 1 بولاق (باھا) بولۇشى كېرەك!');
        return prev;
      }
      return {
        ...prev,
        packages: prev.packages.filter((_, i) => i !== index),
      };
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.packages || serviceForm.packages.length === 0) {
      alert('كەم دېگەندە بىر بولاق ۋە باھا قوشۇڭ!');
      return;
    }

    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const cleanPackages = serviceForm.packages.map((pkg, idx) => {
      const sellPrice = Number(pkg.price) || Number(pkg.costPrice) || 1.0;
      const baseCost = Number(pkg.costPrice) || (pkg.originalPrice && pkg.originalPrice < sellPrice ? Number(pkg.originalPrice) : sellPrice);
      const origPrice = pkg.originalPrice && pkg.originalPrice > sellPrice
        ? Number(pkg.originalPrice)
        : Math.round(sellPrice * 1.2 * 100) / 100;

      return {
        id: pkg.id || `${serviceForm.id || 'p'}-${idx + 1}`,
        title: pkg.title.trim() || `بولاق ${idx + 1}`,
        price: sellPrice,
        costPrice: baseCost,
        originalPrice: origPrice,
        duration: pkg.duration?.trim() || 'دەرھال',
      };
    });

    const payload: Partial<ServiceItem> = {
      name: serviceForm.name,
      category: serviceForm.category as any,
      icon: serviceForm.icon,
      image: serviceForm.image || undefined,
      description: serviceForm.description,
      badge: serviceForm.badge || undefined,
      inputLabel: serviceForm.inputLabel || undefined,
      inputPlaceholder: serviceForm.inputPlaceholder || undefined,
      requiresZoneId: Boolean(serviceForm.requiresZoneId),
      zoneIdLabel: serviceForm.requiresZoneId ? (serviceForm.zoneIdLabel || 'رايون كودى (Zone ID)') : undefined,
      zoneIdPlaceholder: serviceForm.requiresZoneId ? (serviceForm.zoneIdPlaceholder || 'مەسىلەن: 1234') : undefined,
      bioContent: serviceForm.bioContent?.trim() || undefined,
      published: serviceForm.published !== false,
      source: 'provider',
      packages: cleanPackages,
    };

    try {
      if (editingService && savedServiceIds.has(editingService.id)) {
        // Edit existing
        const res = await fetch('/api/admin/services', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: editingService.id, ...payload }),
        });
        const data = await res.json();
        if (data.success && data.service) {
          clearStorefrontCache();
          setServices((prev) =>
            prev.map((s) => (s.id === editingService.id ? data.service : s))
          );
          setServiceModalOpen(false);
          setEditingService(null);
          alert(`«${data.service.name}» نىڭ رەسىمى، باھالىرى ۋە بارلىق تەڭشەكلىرى مۇۋەپپەقىيەتلىك ساقلاندى ھەمدە باشبەتتە نەق يېڭىلاندى!`);
        } else {
          alert(data.message || 'ساقلاش مەغلۇپ بولدى');
        }
      } else {
        // Add new or save Sahl Cash item to custom services
        const res = await fetch('/api/admin/services', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.service) {
          clearStorefrontCache();
          setServices((prev) => [data.service, ...prev.filter((s) => s.id !== data.service.id)]);
          setServiceModalOpen(false);
          setEditingService(null);
          alert(`«${data.service.name}» مۇۋەپپەقىيەتلىك ساقلاندى ھەمدە دەرھال باشبەتكە چىقىرىلدى!`);
        } else {
          alert(data.message || 'قوشۇش مەغلۇپ بولدى');
        }
      }
    } catch (err) {
      console.error(err);
      alert('ئۇلىنىش خاتالىقى كۆرۈلدى');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!savedServiceIds.has(id)) {
      if (!confirm('بۇ Sahl Cash مەھسۇلاتىنى تىزىملىكتىن يوشۇرۇۋەتمەكچىمۇ؟')) return;
      handleHideSahlKey(id.replace('sahl_', ''));
      return;
    }
    if (!confirm('بۇ مەھسۇلاتنى راستىنلا ئۆچۈرەمسىز؟')) return;
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch(`/api/admin/services?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        clearStorefrontCache();
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickChangeCategory = async (serviceId: string, newCategory: string) => {
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    try {
      if (!savedServiceIds.has(serviceId)) {
        const sahlKey = serviceId.replace('sahl_', '');
        const sahlItem = groupedSahlServices.find((g) => g.key === sahlKey);
        if (sahlItem) {
          const payload = {
            name: sahlItem.uyghurName || sahlItem.name,
            category: newCategory,
            icon: getCategoryIcon(newCategory),
            image: sahlItem.image || '/logo.png',
            description: `${sahlItem.uyghurName || sahlItem.name} ئاپتوماتىك پۇل قاچىلاش مۇلازىمىتى`,
            badge: '⚡ ئاپتوماتىك',
            inputLabel: sahlItem.inputLabel,
            inputPlaceholder: sahlItem.inputPlaceholder,
            requiresZoneId: sahlItem.requiresZoneId,
            zoneIdLabel: sahlItem.zoneIdLabel,
            zoneIdPlaceholder: sahlItem.zoneIdPlaceholder,
            bioContent: sahlItem.bioContent,
            published: true,
            source: 'provider',
            packages: sahlItem.packages.map((p) => ({
              id: `pkg-${sahlItem.key}-${p.id}`,
              title: p.title || p.originalName,
              price: Number(p.sellPrice) || 1,
              originalPrice: Number(p.originalPrice) || Math.round((Number(p.sellPrice) || 1) * 1.2 * 100) / 100,
              duration: 'دەرھال',
              providerProductId: p.id,
              productType: p.productType === 'amount' ? 'amount' : 'fixed',
              available: true,
            })),
          };

          const res = await fetch('/api/admin/services', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.success && data.service) {
            clearStorefrontCache();
            setServices((prev) => [data.service, ...prev.filter((s) => s.id !== data.service.id)]);
            alert(`«${data.service.name}» سەھىپىگە يۆتكەلدى ۋە باشبەتكە مۇۋەپپەقىيەتلىك چىقىرىلدى!`);
          }
          return;
        }
      }

      // Existing service
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: serviceId, category: newCategory, published: true }),
      });
      const data = await res.json();
      if (data.success && data.service) {
        clearStorefrontCache();
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? { ...s, category: newCategory, published: true } : s))
        );
        alert('سەھىپە ئۆزگەرتىشى مۇۋەپپەقىيەتلىك ساقلاندى ۋە باشبەتتە نەق چىقتى!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishServiceToHomepage = async (srv: ServiceItem) => {
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    try {
      if (!savedServiceIds.has(srv.id)) {
        const sahlKey = srv.id.replace('sahl_', '');
        const sahlItem = groupedSahlServices.find((g) => g.key === sahlKey);
        if (sahlItem) {
          const payload = {
            id: srv.id,
            name: srv.name || sahlItem.name,
            category: srv.category || sahlItem.category,
            icon: getCategoryIcon(srv.category || sahlItem.category),
            image: sahlItem.image || srv.image || '/logo.png',
            description: srv.description || `${srv.name || sahlItem.name} ئاپتوماتىك پۇل قاچىلاش مۇلازىمىتى`,
            badge: srv.badge || '⚡ ئاپتوماتىك',
            inputLabel: sahlItem.inputLabel,
            inputPlaceholder: sahlItem.inputPlaceholder,
            requiresZoneId: sahlItem.requiresZoneId,
            zoneIdLabel: sahlItem.zoneIdLabel,
            zoneIdPlaceholder: sahlItem.zoneIdPlaceholder,
            bioContent: sahlItem.bioContent,
            published: true,
            source: 'provider',
            packages: sahlItem.packages.map((p) => ({
              id: `pkg-${sahlItem.key}-${p.id}`,
              title: p.title || p.originalName,
              price: Number(p.sellPrice) || 1,
              originalPrice: Number(p.originalPrice) || Math.round((Number(p.sellPrice) || 1) * 1.2 * 100) / 100,
              duration: 'دەرھال',
              providerProductId: p.id,
              productType: p.productType === 'amount' ? 'amount' : 'fixed',
              available: true,
            })),
          };

          const res = await fetch('/api/admin/services', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.success && data.service) {
            setServices((prev) => {
              const next = [data.service, ...prev.filter((s) => s.id !== data.service.id && s.id !== srv.id)];
              try {
                localStorage.setItem('autocash_cached_catalog', JSON.stringify({
                  services: next.filter((s) => s.published !== false),
                  source: 'legacy',
                }));
                const bc = new BroadcastChannel('autocash_catalog_channel');
                bc.postMessage({ type: 'CATALOG_UPDATED', service: data.service });
                bc.close();
              } catch {}
              return next;
            });
            alert(`«${data.service.name}» مۇۋەپپەقىيەتلىك ساقلاندى ھەمدە دەرھال باشبەتكە چىقىرىلدى!`);
          } else {
            alert(data.message || 'ساقلاش مەغلۇپ بولدى');
          }
          return;
        }
      }

      // Existing service: enforce published: true
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: srv.id, published: true }),
      });
      const data = await res.json();
      if (data.success && data.service) {
        setServices((prev) => {
          const next = prev.map((s) => (s.id === srv.id ? { ...s, published: true } : s));
          try {
            localStorage.setItem('autocash_cached_catalog', JSON.stringify({
              services: next.filter((s) => s.published !== false),
              source: 'legacy',
            }));
            const bc = new BroadcastChannel('autocash_catalog_channel');
            bc.postMessage({ type: 'CATALOG_UPDATED', service: data.service });
            bc.close();
          } catch {}
          return next;
        });
        alert(`«${srv.name}» باشبەتتە نەق چىقىرىلدى!`);
      } else {
        alert(data.message || 'ساقلاش مەغلۇپ بولدى');
      }
    } catch (err: any) {
      console.error(err);
      alert('ئۇلىنىش خاتالىقى كۆرۈلدى');
    }
  };

  const handleTogglePublishService = async (srv: ServiceItem, publish: boolean) => {
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    try {
      if (!savedServiceIds.has(srv.id)) {
        const sahlKey = srv.id.replace('sahl_', '');
        const sahlItem = groupedSahlServices.find((g) => g.key === sahlKey);
        const payload = {
          id: srv.id,
          name: srv.name || sahlItem?.name || 'مەھسۇلات',
          category: srv.category || sahlItem?.category || 'games',
          icon: getCategoryIcon(srv.category || sahlItem?.category || 'games'),
          image: sahlItem?.image || srv.image || '/logo.png',
          description: srv.description || `${srv.name} ئاپتوماتىك پۇل قاچىلاش مۇلازىمىتى`,
          badge: srv.badge || '⚡ ئاپتوماتىك',
          inputLabel: sahlItem?.inputLabel,
          inputPlaceholder: sahlItem?.inputPlaceholder,
          requiresZoneId: sahlItem?.requiresZoneId,
          zoneIdLabel: sahlItem?.zoneIdLabel,
          zoneIdPlaceholder: sahlItem?.zoneIdPlaceholder,
          bioContent: sahlItem?.bioContent,
          published: publish,
          source: 'provider',
          packages: sahlItem?.packages?.map((p) => ({
            id: `pkg-${sahlItem.key}-${p.id}`,
            title: p.title || p.originalName,
            price: Number(p.sellPrice) || 1,
            originalPrice: Number(p.originalPrice) || Math.round((Number(p.sellPrice) || 1) * 1.2 * 100) / 100,
            duration: 'دەرھال',
            providerProductId: p.id,
            productType: p.productType === 'amount' ? 'amount' : 'fixed',
            available: true,
          })) || srv.packages || [],
        };

        const res = await fetch('/api/admin/services', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.service) {
          clearStorefrontCache();
          setServices((prev) => [data.service, ...prev.filter((s) => s.id !== data.service.id && s.id !== srv.id)]);
        }
        return;
      }

      // Existing service
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: srv.id, published: publish }),
      });
      const data = await res.json();
      if (data.success && data.service) {
        clearStorefrontCache();
        setServices((prev) =>
          prev.map((s) => (s.id === srv.id ? { ...s, published: publish } : s))
        );
      }
    } catch (err: any) {
      console.error(err);
      alert('ئۇلىنىش خاتالىقى كۆرۈلدى');
    }
  };

  // Sahl Cash Importer & Customizer Helper Dictionaries & Functions
  const UYGHUR_SERVICE_NAMES: Record<string, string> = {
    'PUBG Mobile': 'پابجى كۆچمە (PUBG Mobile)',
    'PUBGM Lite': 'پابجى لايت (PUBGM Lite)',
    'PUBG New State': 'پابجى يېڭى ھالەت (PUBG New State)',
    'Free Fire': 'فىرى فاير (Free Fire)',
    'Blood strike': 'بىلاد سىترايك (Blood Strike)',
    'Brawl Stars': 'بىراۋل ستارس (Brawl Stars)',
    'Clash of Clans': 'كلاش ئوف كىلانس (Clash of Clans)',
    'Clash Royale': 'كلاش روئال (Clash Royale)',
    'Ball Pool 8': '8 توپ بىليارت (8 Ball Pool)',
    'Farlight 84': 'فارلايت 84 (Farlight 84)',
    'Honor of Kings': 'شەرەپ پادىشاھى (Honor of Kings)',
    'Legend Mobile': 'موبايىل لېجېندىس (Mobile Legends)',
    'Roblox Canada': 'روبلوكس (Roblox)',
    'Roblox': 'روبلوكس (Roblox)',
    'Jawaker': 'جاۋاكەر (Jawaker)',
    'Hay Day': 'ھاي دەي (Hay Day)',
    'YALLA LUDO': 'ياللا لۇدو (Yalla Ludo)',
    'Revenge of Sultans': 'سۇلتانلار ئىنتىقامى (Revenge of Sultans)',
    'Genshin Impact': 'گېنشىن ئىمپېكت (Genshin Impact)',
    'Fortnite': 'فورتنايت (Fortnite)',
    'Call of Duty Mobile': 'كول ئوف دۇتى (Call of Duty)',
    'Top War': 'توپ ۋار (Top War)',
    'Chat GPT': 'ChatGPT سۈنئىي ئەقىل (ChatGPT)',
    'Tiktok services': 'تىك توك مۇلازىمىتى (TikTok)',
    'Recharge Cards SC': 'خەلقئارالىق قاچىلاش كارتىلىرى',
    'Digital Banks': 'رەقەملىك بانكا ۋە كرىپتو (Digital Banks / USDT)',
    'Turkcell': 'تۈرك سېل قاچىلاش (Turkcell)',
    'Turk Telecom': 'تۈرك تېلېكوم قاچىلاش (Turk Telecom)',
    'تطبيق الارقام': 'مەۋھۇم نومۇر مۇلازىمىتى (Virtual Numbers)',
    'يلا شات - Yalla Chat': 'ياللا شات (Yalla Chat)',
    'اهلن شات - Ahlan Chat': 'ئەھلەن شات (Ahlan Chat)',
    'لايكي - Likee': 'لايكى (Likee)',
    'Steam USD': 'سىتىم دوللار كارتىسى (Steam USD)',
    'GOOGLE PLAY TR': 'گۇگۇل پىلەي تۈركىيە (Google Play TR)',
    'iTunes Turkey': 'ئالما تۈركىيە كارتىسى (iTunes TR)',
    'iTunes Dollar': 'ئالما دوللار كارتىسى (iTunes USD)',
    'Netflix Turkey': 'نېتفلىكىس تۈركىيە (Netflix TR)',
    'MTN Blance': 'MTN سۈرىيە قالدۇقى (MTN Balance)',
    'Syriatel Blance': 'سۈرىياتېل قالدۇقى (Syriatel Balance)',
  };

  const guessCategoryFromName = (name: string, rawCat?: string): string => {
    const combined = `${name} ${rawCat || ''}`.toLowerCase();
    if (/pubg|free fire|game|diamond|uc|coin|mobile legends|legend mobile|roblox|steam|valorant|fifa|clash|call of duty|brawl|league|blood strike|ball pool|farlight|honor of kings|genshin|fortnite|top war|jawaker|hay day|yalla ludo|revenge of sultans/i.test(combined)) {
      return 'games';
    }
    if (/chatgpt|openai|claude|gemini|midjourney|ai\b/i.test(combined)) {
      return 'ai';
    }
    if (/card|gift|google play|itunes|apple|razer|playstation|xbox|amazon|psn|vcc|recharge card/i.test(combined)) {
      return 'cards';
    }
    if (/sms|number|virtual|otp|الارقام|تطبيق الارقام/i.test(combined)) {
      return 'numbers';
    }
    if (/tiktok|telegram|whatsapp|instagram|twitter|facebook|snapchat|likee|social|yalla chat|ahlan/i.test(combined)) {
      return 'social';
    }
    if (/usdt|crypto|binance|bitcoin|digital bank|shamcash/i.test(combined)) {
      return 'crypto';
    }
    if (/blance|balance|mtn|syriatel|turkcell|turk telecom/i.test(combined)) {
      return 'balance';
    }
    return 'apps';
  };

  const guessImageFromName = (name: string, originalImage?: string): string => {
    if (originalImage && !originalImage.endsWith('sahl-cash.com/') && originalImage !== 'https://api.sahl-cash.com' && originalImage.startsWith('http')) {
      return originalImage;
    }
    const n = name.toLowerCase();
    if (/pubg/i.test(n)) return '/images/services/pubg_mobile.jpg';
    if (/free fire/i.test(n)) return '/images/services/free_fire.jpg';
    if (/blood strike/i.test(n)) return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80';
    if (/brawl/i.test(n)) return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80';
    if (/clash/i.test(n)) return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80';
    if (/roblox/i.test(n)) return 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80';
    if (/genshin/i.test(n)) return 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=500&auto=format&fit=crop&q=80';
    if (/telegram/i.test(n)) return 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=500&auto=format&fit=crop&q=80';
    if (/tiktok/i.test(n)) return 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=80';
    if (/chatgpt|openai|ai/i.test(n)) return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&auto=format&fit=crop&q=80';
    if (/netflix/i.test(n)) return 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&auto=format&fit=crop&q=80';
    if (/google play/i.test(n)) return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80';
    if (/itunes|apple/i.test(n)) return 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=500&auto=format&fit=crop&q=80';
    if (/steam/i.test(n)) return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80';
    if (/razer/i.test(n)) return 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80';
    if (/number|ارقام/i.test(n)) return 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=500&auto=format&fit=crop&q=80';
    if (/turkcell|turk telecom|syriatel|mtn/i.test(n)) return 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=500&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=500&auto=format&fit=crop&q=80';
  };

  const getCategoryIcon = (catId: string): string => {
    switch (catId) {
      case 'games': return 'Gamepad2';
      case 'apps': return 'Smartphone';
      case 'ai': return 'Bot';
      case 'numbers': return 'MessageSquareShare';
      case 'cards': return 'CreditCard';
      case 'accounts': return 'KeyRound';
      case 'crypto': return 'Coins';
      case 'social': return 'Share2';
      case 'balance': return 'Wallet';
      default: return 'Package';
    }
  };

  const cleanPackageTitle = (pkgName: string, serviceName: string): string => {
    let title = (pkgName || '').trim();
    const escaped = serviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    title = title.replace(new RegExp('^' + escaped + '\\s*[-:]*\\s*', 'i'), '').trim();
    return title || pkgName;
  };

  // Group all Sahl Cash provider products into services with ALL packages
  const groupedSahlServices = useMemo<SahlGroupedService[]>(() => {
    if (!providerProducts || providerProducts.length === 0) return [];

    const map = new Map<string, {
      key: string;
      name: string;
      categoryName: string;
      image: string;
      packages: any[];
    }>();

    for (const prod of providerProducts) {
      const rawCat = (prod.categoryName || 'Other').trim();
      const isChatApp = rawCat.toLowerCase() === 'chat apps';
      const key = isChatApp ? `chat_${prod.name.trim()}` : rawCat;
      const name = isChatApp ? prod.name.trim() : rawCat;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          categoryName: rawCat,
          image: prod.categoryImage || prod.image || '',
          packages: [],
        });
      }

      map.get(key)!.packages.push(prod);
    }

    const list: SahlGroupedService[] = [];

    for (const item of Array.from(map.values())) {
      const cat = guessCategoryFromName(item.name, item.categoryName);
      const img = guessImageFromName(item.name, item.image);
      const uyghur = UYGHUR_SERVICE_NAMES[item.name] || item.name;

      const pkgs: SahlPackageRow[] = item.packages.map((p) => {
        const cost = Number(p.costPrice ?? p.price ?? 0);
        const sell = Math.round(cost * 1.15 * 100) / 100;
        const original = Math.round(sell * 1.2 * 100) / 100;
        return {
          id: p.id,
          originalName: p.name,
          title: cleanPackageTitle(p.name, item.name),
          costPrice: cost,
          sellPrice: Math.max(0.1, sell),
          originalPrice: Math.max(sell, original),
          productType: p.productType === 'amount' ? 'amount' : 'fixed',
          selected: true,
        };
      });

      pkgs.sort((a, b) => a.costPrice - b.costPrice);

      const minCost = pkgs.length > 0 ? pkgs[0].costPrice : 0;
      const maxCost = pkgs.length > 0 ? pkgs[pkgs.length - 1].costPrice : 0;

      // Collect all params across packages
      const allParams: string[] = [];
      for (const p of item.packages) {
        if (Array.isArray(p.params)) {
          for (const param of p.params) {
            if (typeof param === 'string' && !allParams.includes(param)) {
              allParams.push(param);
            }
          }
        }
      }

      const inputCfg = detectServiceInputs(item.name, cat, allParams);

      list.push({
        key: item.key,
        name: item.name,
        uyghurName: uyghur,
        category: cat,
        categoryName: item.categoryName,
        image: img,
        inputLabel: inputCfg.inputLabel,
        inputPlaceholder: inputCfg.inputPlaceholder,
        requiresZoneId: inputCfg.requiresZoneId,
        zoneIdLabel: inputCfg.zoneIdLabel,
        zoneIdPlaceholder: inputCfg.zoneIdPlaceholder,
        bioContent: inputCfg.defaultBio,
        minCost,
        maxCost,
        packages: pkgs,
      });
    }

    // Sort by package count descending & prioritize popular services
    list.sort((a, b) => {
      const isTopA = /pubg|free fire|blood strike|brawl|clash|tiktok|chat gpt|jawaker/i.test(a.name);
      const isTopB = /pubg|free fire|blood strike|brawl|clash|tiktok|chat gpt|jawaker/i.test(b.name);
      if (isTopA && !isTopB) return -1;
      if (!isTopA && isTopB) return 1;
      return b.packages.length - a.packages.length;
    });

    return list;
  }, [providerProducts]);

  // Unified list: Saved custom services + all Sahl Cash grouped services
  const unifiedServicesList = useMemo<ServiceItem[]>(() => {
    const list: ServiceItem[] = [...services];

    for (const sahl of groupedSahlServices) {
      if (hiddenSahlKeys.includes(sahl.key)) continue;

      const uyghurLow = (sahl.uyghurName || '').toLowerCase().trim();
      const origLow = (sahl.name || '').toLowerCase().trim();

      const alreadySaved = services.find((s) => {
        const sName = (s.name || '').toLowerCase().trim();
        return (
          s.id === `sahl_${sahl.key}` ||
          sName === uyghurLow ||
          sName === origLow ||
          (s.packages && s.packages.some((p) => sahl.packages.some((sp) => sp.id === p.providerProductId)))
        );
      });

      if (!alreadySaved) {
        list.push({
          id: `sahl_${sahl.key}`,
          name: sahl.name,
          category: sahl.category,
          icon: getCategoryIcon(sahl.category),
          image: sahl.image || '/logo.png',
          description: `${sahl.name} ئاپتوماتىك پۇل قاچىلاش مۇلازىمىتى`,
          badge: '⚡ Sahl Cash',
          inputLabel: sahl.inputLabel,
          inputPlaceholder: sahl.inputPlaceholder,
          requiresZoneId: sahl.requiresZoneId,
          zoneIdLabel: sahl.zoneIdLabel,
          zoneIdPlaceholder: sahl.zoneIdPlaceholder,
          bioContent: sahl.bioContent,
          published: true,
          source: 'provider',
          packages: sahl.packages.map((p) => ({
            id: `pkg-${sahl.key}-${p.id}`,
            title: p.title || p.originalName,
            price: Number(p.sellPrice) || 1,
            originalPrice: Number(p.originalPrice) || Math.round((Number(p.sellPrice) || 1) * 1.2 * 100) / 100,
            duration: 'دەرھال',
            providerProductId: p.id,
            productType: p.productType === 'amount' ? 'amount' : 'fixed',
            available: true,
          })),
        });
      }
    }

    return list;
  }, [services, groupedSahlServices, hiddenSahlKeys]);

  const handleBatchPublishActiveCategory = async () => {
    const unaddedInCat = filteredServices.filter((s) => !savedServiceIds.has(s.id));
    if (unaddedInCat.length === 0) {
      alert('بۇ سەھىپىدىكى بارلىق مەھسۇلاتلار ئاللىقاچان دۇكانغا قوشۇلغان!');
      return;
    }
    const catName = categoriesList.find((c) => c.id === categoryFilter)?.name || 'بۇ سەھىپە';
    if (!confirm(`«${catName}» سەھىپىسىدىكى ${unaddedInCat.length} دانە مەھسۇلاتنى بىرلا ۋاقىتتا دۇكانغا قوشۇپ باشبەتكە چىقىرامسىز؟`)) return;

    setLoadingProducts(true);
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    let successCount = 0;
    for (const item of unaddedInCat) {
      try {
        const payload = {
          id: item.id,
          name: item.name,
          category: item.category,
          icon: item.icon || getCategoryIcon(item.category),
          image: item.image,
          description: item.description,
          badge: '⚡ ئاپتوماتىك',
          inputLabel: item.inputLabel,
          inputPlaceholder: item.inputPlaceholder,
          published: true,
          source: 'provider',
          packages: item.packages,
        };
        const res = await fetch('/api/admin/services', { method: 'POST', headers, body: JSON.stringify(payload) });
        const d = await res.json();
        if (d.success && d.service) {
          setServices((prev) => [d.service, ...prev.filter((s) => s.id !== d.service.id && s.id !== item.id)]);
          successCount++;
        }
      } catch {}
    }
    setLoadingProducts(false);
    try {
      const bc = new BroadcastChannel('autocash_catalog_channel');
      bc.postMessage({ type: 'CATALOG_UPDATED' });
      bc.close();
    } catch {}
    alert(`${successCount} دانە مەھسۇلات مۇۋەپپەقىيەتلىك دۇكانغا قوشۇلدى ۋە باشبەتكە چىقىرىلدى!`);
  };

  // Filter grouped services by Category Tab & Search query
  const filteredGroupedServices = useMemo(() => {
    return groupedSahlServices.filter((s) => {
      // Category filter
      if (sahlCategoryFilter !== 'all' && s.category !== sahlCategoryFilter) {
        return false;
      }
      // Search query
      if (sahlSearch.trim()) {
        const q = sahlSearch.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q) || s.uyghurName.toLowerCase().includes(q);
        const matchesCat = s.categoryName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
        const matchesPkg = s.packages.some((p) => p.title.toLowerCase().includes(q) || p.originalName.toLowerCase().includes(q) || String(p.id) === q);
        return matchesName || matchesCat || matchesPkg;
      }
      return true;
    });
  }, [groupedSahlServices, sahlCategoryFilter, sahlSearch]);

  const handleOpenSahlCashImporter = async () => {
    setSahlSearch('');
    setSahlCategoryFilter('all');
    setSelectedSahlGroup(null);
    setSahlCashModalOpen(true);
    if (providerProducts.length === 0) {
      await fetchProviderProducts();
    }
  };

  const handleSelectSahlGroup = (group: SahlGroupedService) => {
    setSelectedSahlGroup(group);
    setSahlBulkMarkup(15);
    const initialPackages: SahlPackageRow[] = group.packages.map((p) => {
      const cost = p.costPrice;
      const sell = Math.round(cost * 1.15 * 100) / 100;
      const orig = Math.round(sell * 1.2 * 100) / 100;
      return {
        ...p,
        sellPrice: Math.max(0.1, sell),
        originalPrice: Math.max(sell, orig),
        selected: true,
      };
    });

    setSahlForm({
      name: group.name,
      category: group.category,
      image: group.image,
      badge: '⚡ ئاپتوماتىك',
      description: `${group.name} ئاپتوماتىك پۇل قاچىلاش مۇلازىمىتى`,
      inputLabel: group.inputLabel,
      inputPlaceholder: group.inputPlaceholder,
      requiresZoneId: Boolean(group.requiresZoneId),
      zoneIdLabel: group.zoneIdLabel || 'رايون كودى (Zone ID)',
      zoneIdPlaceholder: group.zoneIdPlaceholder || 'مەسىلەن: 1234',
      bioContent: group.bioContent || '',
      published: true,
      packages: initialPackages,
    });
  };

  const handleApplyBulkMarkup = (markupPercent: number) => {
    setSahlBulkMarkup(markupPercent);
    setSahlForm((prev) => ({
      ...prev,
      packages: prev.packages.map((pkg) => {
        const cost = pkg.costPrice;
        const sell = Math.round(cost * (1 + markupPercent / 100) * 100) / 100;
        const orig = Math.round(sell * 1.2 * 100) / 100;
        return {
          ...pkg,
          sellPrice: Math.max(0.1, sell),
          originalPrice: Math.max(sell, orig),
        };
      }),
    }));
  };

  const handleToggleAllPackages = (selected: boolean) => {
    setSahlForm((prev) => ({
      ...prev,
      packages: prev.packages.map((p) => ({ ...p, selected })),
    }));
  };

  const handleTogglePackage = (pkgId: number) => {
    setSahlForm((prev) => ({
      ...prev,
      packages: prev.packages.map((p) => (p.id === pkgId ? { ...p, selected: !p.selected } : p)),
    }));
  };

  const handlePackagePriceChange = (pkgId: number, newPrice: number) => {
    setSahlForm((prev) => ({
      ...prev,
      packages: prev.packages.map((p) =>
        p.id === pkgId
          ? {
              ...p,
              sellPrice: newPrice,
              originalPrice: Math.max(newPrice, Math.round(newPrice * 1.2 * 100) / 100),
            }
          : p
      ),
    }));
  };

  const handlePackageTitleChange = (pkgId: number, newTitle: string) => {
    setSahlForm((prev) => ({
      ...prev,
      packages: prev.packages.map((p) => (p.id === pkgId ? { ...p, title: newTitle } : p)),
    }));
  };

  const handleImportSpecificProduct = (prod: any) => {
    // Look up existing grouped service
    const matchingGroup = groupedSahlServices.find((g) =>
      g.packages.some((p) => p.id === prod.id) || g.name.toLowerCase() === (prod.categoryName || '').toLowerCase()
    );
    if (matchingGroup) {
      handleSelectSahlGroup(matchingGroup);
    } else {
      // Fallback: create single-service group
      const cost = Number(prod.costPrice ?? prod.price ?? 0);
      const sell = Math.round(cost * 1.15 * 100) / 100;
      const cat = guessCategoryFromName(prod.name);
      const img = guessImageFromName(prod.name, prod.image || prod.categoryImage);
      const uyghur = UYGHUR_SERVICE_NAMES[prod.name] || prod.name;
      const fallbackGroup: SahlGroupedService = {
        key: `single_${prod.id}`,
        name: prod.name,
        uyghurName: uyghur,
        category: cat,
        categoryName: prod.categoryName || '',
        image: img,
        inputLabel: cat === 'games' ? 'ئويۇنچى ID (Player ID)' : 'ھېسابات نومۇرى / ئېلخەت',
        inputPlaceholder: 'ئۇچۇرىڭىزنى كىرگۈزۈڭ',
        minCost: cost,
        maxCost: cost,
        packages: [
          {
            id: prod.id,
            originalName: prod.name,
            title: prod.name,
            costPrice: cost,
            sellPrice: Math.max(0.1, sell),
            originalPrice: Math.max(sell, Math.round(sell * 1.2 * 100) / 100),
            productType: prod.productType === 'amount' ? 'amount' : 'fixed',
            selected: true,
          },
        ],
      };
      handleSelectSahlGroup(fallbackGroup);
    }
    setSahlCashModalOpen(true);
  };

  const handleSaveSahlProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sahlForm.name || !sahlForm.category) {
      alert('مەھسۇلات نامى ۋە سەھىپىسىنى تاللاڭ');
      return;
    }
    const selectedPackages = sahlForm.packages.filter((p) => p.selected);
    if (selectedPackages.length === 0) {
      alert('كەم دېگەندە 1 بولاقنى تاللىشىڭىز كېرەك');
      return;
    }

    setSavingSahlProduct(true);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const payload = {
        id: selectedSahlGroup ? `sahl_${selectedSahlGroup.key}` : undefined,
        name: sahlForm.name.trim(),
        category: sahlForm.category,
        icon: getCategoryIcon(sahlForm.category),
        image: sahlForm.image.trim() || '/images/services/pubg_mobile.jpg',
        description: sahlForm.description.trim() || `${sahlForm.name} ئاپتوماتىك پۇل قاچىلاش مۇلازىمىتى`,
        badge: sahlForm.badge.trim() || '⚡ ئاپتوماتىك',
        inputLabel: sahlForm.inputLabel.trim(),
        inputPlaceholder: sahlForm.inputPlaceholder.trim(),
        requiresZoneId: Boolean(sahlForm.requiresZoneId),
        zoneIdLabel: sahlForm.requiresZoneId ? (sahlForm.zoneIdLabel || 'رايون كودى (Zone ID)') : undefined,
        zoneIdPlaceholder: sahlForm.requiresZoneId ? (sahlForm.zoneIdPlaceholder || 'مەسىلەن: 1234') : undefined,
        bioContent: sahlForm.bioContent?.trim() || undefined,
        published: sahlForm.published,
        source: 'provider',
        packages: selectedPackages.map((p, idx) => ({
          id: `pkg-${Date.now()}-${idx + 1}`,
          title: p.title.trim() || p.originalName,
          price: Number(p.sellPrice) || 1,
          originalPrice: Number(p.originalPrice) || Math.round(Number(p.sellPrice) * 1.2 * 100) / 100,
          duration: 'دەرھال',
          providerProductId: p.id,
          productType: p.productType === 'amount' ? 'amount' : 'fixed',
          available: true,
        })),
      };

      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.service) {
        setServices((prev) => {
          const next = [data.service, ...prev.filter((s) => s.id !== data.service.id)];
          try {
            localStorage.setItem('autocash_cached_catalog', JSON.stringify({
              services: next.filter((s) => s.published !== false),
              source: 'legacy',
            }));
            const bc = new BroadcastChannel('autocash_catalog_channel');
            bc.postMessage({ type: 'CATALOG_UPDATED', service: data.service });
            bc.close();
          } catch {}
          return next;
        });
        setSahlCashModalOpen(false);
        setSelectedSahlGroup(null);
        alert(`«${sahlForm.name}» ناملىق مەھسۇلات ${selectedPackages.length} دانە بولىقى بىلەن مۇۋەپپەقىيەتلىك باشبەتكە چىقىرىلدى!`);
      } else {
        alert(data.message || 'قوشۇش مەغلۇپ بولدى');
      }
    } catch (err: any) {
      alert(err?.message || 'تور خاتالىقى كۆرۈلدى');
    } finally {
      setSavingSahlProduct(false);
    }
  };

  // Save Settings Handler
  const handleTestTsaConnection = async () => {
    setTsaTesting(true);
    setTsaTestResult(null);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'test-tsa',
          apiKey: settings.tsaApiKey,
          accountAddress: settings.shamcashAddress,
        }),
      });
      const data = await res.json();
      setTsaTestResult(data);
      if (data.success && data.accountAddress) {
        setSettings(prev => ({
          ...prev,
          shamcashAddress: prev.shamcashAddress && prev.shamcashAddress !== 'efe8a2b200d66411c7c7e296369cbba8' ? prev.shamcashAddress : data.accountAddress,
        }));
      }
    } catch (err: any) {
      setTsaTestResult({ success: false, message: err?.message || 'سىناق مەغلۇپ بولدى' });
    } finally {
      setTsaTesting(false);
    }
  };

  const handleVerifyWithTsa = async (depositId: string) => {
    setActionLoading(depositId);
    try {
      const token = sessionStorage.getItem('autocash_admin_token');
      const res = await fetch('/api/deposits/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ depositId }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        alert(data.message || 'تالون دەلىللەندى!');
        loadAllAdminData();
      } else {
        alert(data.message || 'شامكەشتىن تېخى تېپىلمىدى.');
      }
    } catch (err: any) {
      alert(err?.message || 'دەلىللەش مەغلۇپ بولدى');
    } finally {
      setActionLoading(null);
    }
  };

  // Logo Upload Handler
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Use PNG for logos to preserve transparent background!
        const resizedDataUrl = canvas.toDataURL('image/png');
        setSettings((prev) => ({ ...prev, siteLogo: resizedDataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminPin: settings.adminPin,
          shamcashAddress: settings.shamcashAddress,
          whatsappNumber: settings.whatsappNumber,
          telegramUsername: settings.telegramUsername,
          siteName: settings.siteName,
          siteLogo: settings.siteLogo,
          appDownloadUrl: settings.appDownloadUrl,
          tsaApiKey: settings.tsaApiKey,
          tsaAutoDepositEnabled: settings.tsaAutoDepositEnabled,
          shamcashExchangeRate: settings.shamcashExchangeRate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (settings.siteLogo) {
          localStorage.setItem('autocash_site_logo', settings.siteLogo);
          window.dispatchEvent(new Event('autocash-logo-changed'));
        }
        setSettingsSaveMsg('تەڭشەكلەر مۇۋەپپەقىيەتلىك ساقلاندى!');
        alert(`تەڭشەكلەر مۇۋەپپەقىيەتلىك ساقلاندى!\nسورىيە پۇلى نىسبىتى: 1 USD = ${(settings.shamcashExchangeRate || 15000).toLocaleString()} SYP`);
        setTimeout(() => setSettingsSaveMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Financial & Metric Calculations
  const metrics = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.amount : 0), 0);
    const totalDep = deposits
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0);
    const totalOrderCount = orders.length;
    const processingCount = orders.filter((o) => isOrderInProgress(o.status)).length;
    const completedCount = orders.filter((o) => o.status === 'completed').length;
    const userCount = users.length;
    const pendingDepCount = deposits.filter((d) => d.status === 'pending').length;

    return {
      totalRev,
      totalDep,
      totalOrderCount,
      processingCount,
      completedCount,
      userCount,
      pendingDepCount,
    };
  }, [orders, deposits, users]);

  // Chart data points simulation based on real revenue
  const chartPoints = useMemo(() => {
    const base = metrics.totalRev || 180;
    return [
      { label: 'دۈشەنبە', val: Math.round(base * 0.12) },
      { label: 'سەيشەنبە', val: Math.round(base * 0.18) },
      { label: 'چارشەنبە', val: Math.round(base * 0.15) },
      { label: 'پەيشەنبە', val: Math.round(base * 0.22) },
      { label: 'جۈمە', val: Math.round(base * 0.31) },
      { label: 'شەنبە', val: Math.round(base * 0.28) },
      { label: 'يەكشەنبە', val: Math.round(base * 0.35) },
    ];
  }, [metrics.totalRev]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.serviceName && o.serviceName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.targetAccount && o.targetAccount.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.userEmail && o.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'processing'
          ? isOrderInProgress(o.status)
          : statusFilter === 'review'
          ? Boolean(o.details?.needsReview)
          : statusFilter === 'cancelled'
          ? o.status === 'cancelled' || o.status === 'refunded'
          : o.status === statusFilter);
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Filtered Services & Pagination (Unified from Sahl Cash & Custom)
  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return unifiedServicesList.filter((s) => {
      const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
      const matchSearch =
        q === '' ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.packages && s.packages.some((p) => (p.title && p.title.toLowerCase().includes(q))));
      const isCustomSaved = savedServiceIds.has(s.id);
      const matchSource =
        productSourceFilter === 'all' ||
        (productSourceFilter === 'published' && s.published !== false) ||
        (productSourceFilter === 'sahl' && (s.source === 'provider' || s.id.startsWith('sahl_') || s.id.startsWith('s4g-')));
      return matchCat && matchSearch && matchSource;
    });
  }, [unifiedServicesList, searchQuery, categoryFilter, productSourceFilter, savedServiceIds]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredServices.slice(start, start + PAGE_SIZE);
  }, [filteredServices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery, productSourceFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery))
    );
  }, [users, searchQuery]);

  // If NOT authenticated, render Secure PIN screen
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-[#030914] flex items-center justify-center p-4 pt-[max(env(safe-area-inset-top,0px),16px)] pb-[max(env(safe-area-inset-bottom,0px),16px)] selection:bg-amber-400 selection:text-slate-950 font-alkatip text-right"
        dir="rtl"
      >
        <div className="w-full max-w-md bg-gradient-to-b from-[#09182d] to-[#040e1d] border border-amber-500/30 rounded-3xl p-7 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-5 shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-center text-white font-ukij mb-2">
            <span className="autocash-shimmer">AUTO CASH</span> باشقۇرۇش مەركىزى
          </h2>
          <p className="text-xs text-center text-slate-400 mb-6 font-alkatip">
            سىستېمىنى باشقۇرۇش ۋە سانلىق مەلۇماتلارنى كۆرۈش ئۈچۈن مەخسۇس شىفىرنى (PIN) كىرگۈزۈڭ.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="باشقۇرغۇچى شىفىرى (PIN)..."
                autoFocus
                className={`w-full bg-[#051120] border ${
                  pinError ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-700/80 focus:border-amber-400'
                } rounded-xl px-4 py-3 text-sm text-center font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none transition`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-bold text-center animate-shake">
                ⚠️ شىفىر خاتا! قايتا كىرگۈزۈڭ.
              </p>
            )}

            <button
              type="submit"
              disabled={pinSubmitting}
              className="w-full py-3 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-lg"
            >
              {pinSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <Unlock className="w-4 h-4 text-slate-950" />
                  <span>كىرىش (قۇلۇپنى ئېچىش)</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition font-alkatip"
              >
                <ChevronRight className="w-4 h-4" />
                <span>باش بەتكە قايتىش</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Color theme styles
  const themeClasses = isDarkMode
    ? {
        bg: 'bg-[#030914] text-slate-100',
        sidebar: 'bg-[#061426] border-slate-800/80',
        card: 'bg-[#07192d] border-slate-800/90 shadow-md',
        cardHeader: 'border-slate-800/80',
        subtext: 'text-slate-400',
        input: 'bg-[#040e1d] border-slate-700/80 text-white placeholder-slate-500',
        tableHead: 'bg-[#051120] text-slate-300 border-slate-800',
        tableRow: 'border-slate-800/70 hover:bg-slate-800/30',
        pillActive: 'bg-amber-400 text-slate-950 font-black',
        pillInactive: 'bg-slate-800/60 text-slate-300 hover:bg-slate-800',
      }
    : {
        bg: 'bg-[#f4f7fb] text-slate-900',
        sidebar: 'bg-white border-slate-200 shadow-lg',
        card: 'bg-white border-slate-200/90 shadow-md',
        cardHeader: 'border-slate-100',
        subtext: 'text-slate-500',
        input: 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400',
        tableHead: 'bg-slate-100 text-slate-700 border-slate-200',
        tableRow: 'border-slate-100 hover:bg-slate-50',
        pillActive: 'bg-amber-500 text-white font-black',
        pillInactive: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      };

  return (
    <div
      className={`min-h-screen ${themeClasses.bg} flex font-alkatip selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200`}
      dir="rtl"
    >
      {/* ================= 1. SIDEBAR (DESKTOP & MOBILE DRAWER) ================= */}
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-64 ${
          themeClasses.sidebar
        } border-l flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo / Brand */}
          <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md shadow-amber-500/20 shrink-0 overflow-hidden bg-[#04101e] flex items-center justify-center">
                <img
                  src={settings.siteLogo || '/brand_logo.png?v=2.1.0'}
                  alt="AUTO CASH"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <h1 className="font-ukij font-bold text-sm leading-tight text-white">
                  <span className="autocash-shimmer">{settings.siteName || 'AUTO CASH'}</span>
                </h1>
                <span className="text-[10px] text-amber-400 font-bold block">
                  باشقۇرۇش مەركىزى (v2.0)
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1 text-xs">
            {[
              { id: 'dashboard', label: 'باش تاختا (Dashboard)', icon: LayoutDashboard },
              { id: 'orders', label: 'زاكازلارنى باشقۇرۇش', icon: ShoppingBag, badge: metrics.processingCount },
              { id: 'provider', label: 'Sahl Cash API', icon: Zap, badgeColor: 'bg-cyan-500 text-slate-950' },
              { id: 'services', label: 'مەھسۇلات / مۇلازىمەتلەر', icon: Package, badge: services.length },
              { id: 'banners', label: 'باشبەت ئېلانلىرى (سلايدېر)', icon: ImageIcon, badge: banners.length, badgeColor: 'bg-amber-400 text-slate-950' },
              { id: 'deposits', label: 'ھەميان كىرىملىرى (شامكەش)', icon: Wallet, badge: metrics.pendingDepCount, badgeColor: 'bg-amber-500 text-slate-950' },
              { id: 'users', label: 'ئىشلەتكۈچىلەر (ئەزالار)', icon: Users, badge: metrics.userCount },
              { id: 'finance', label: 'پۇل مۇئامىلە ۋە كىرىم', icon: TrendingUp },
              { id: 'settings', label: 'سىستېما تەڭشەكلىرى', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer font-bold ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : isDarkMode
                      ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        item.badgeColor || (isActive ? 'bg-slate-950 text-amber-300' : 'bg-cyan-950 border border-cyan-500/40 text-cyan-300')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {/* View Website */}
          <Link
            href="/"
            target="_blank"
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700/80 text-cyan-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-cyan-700 hover:bg-slate-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>تور بېكەتنى كۆرۈش</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>چېكىنىش (قۇلۇپلاش)</span>
          </button>
        </div>
      </aside>

      {/* ================= 2. MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-64">
        {/* Top Header Bar */}
        <header
          className={`sticky top-0 z-30 ${
            themeClasses.sidebar
          } border-b px-4 sm:px-6 pt-[max(env(safe-area-inset-top,0px),10px)] pb-3 flex items-center justify-between backdrop-blur-md`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-800/50 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-ukij font-black text-sm sm:text-base text-white">
              {activeTab === 'dashboard' && 'باش تاختا كۆرسەتكۈچلىرى'}
              {activeTab === 'orders' && 'زاكازلارنى باشقۇرۇش مەركىزى'}
              {activeTab === 'services' && 'مەھسۇلات ۋە مۇلازىمەتلەر تىزىملىكى'}
              {activeTab === 'banners' && 'باشبەت ئېلان تاختىسى ۋە سلايدېر تەڭشىكى'}
              {activeTab === 'deposits' && 'ھەميان كىرىملىرى ۋە تالونلار'}
              {activeTab === 'users' && 'ئەزالار ۋە ئىشلەتكۈچىلەر باشقۇرۇش'}
              {activeTab === 'finance' && 'پۇل مۇئامىلە ۋە كىرىم ئانالىزى'}
              {activeTab === 'settings' && 'سىستېما تەڭشەكلىرى'}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Realtime Live Sync indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>جانلىق ئۇلاندى (Live)</span>
            </div>

            {/* Pending Deposits Counter Badge */}
            {deposits.filter((d) => d.status === 'pending').length > 0 && (
              <button
                onClick={() => setActiveTab('deposits')}
                title="تەكشۈرۈشنى كۈتۈۋاتقان ھەميان كىرىملىرى"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm shadow-amber-500/20 cursor-pointer animate-pulse"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{deposits.filter((d) => d.status === 'pending').length} تالون</span>
              </button>
            )}

            {/* Pending Orders Counter Badge */}
            {orders.filter((o) => o.status === 'processing').length > 0 && (
              <button
                onClick={() => setActiveTab('orders')}
                title="بىر تەرەپ قىلىنىۋاتقان زاكازلار"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition shadow-sm shadow-cyan-500/20 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{orders.filter((o) => o.status === 'processing').length} زاكاز</span>
              </button>
            )}

            {/* Refresh Data button */}
            <button
              onClick={() => {
                refreshLiveOrdersAndDeposits(true);
                loadAllAdminData();
              }}
              title="يېڭىلاش"
              className={`p-2 rounded-xl transition cursor-pointer border ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'يورۇق ھالەتكە ئۆزگەرتىش' : 'قاراڭغۇ ھالەتكە ئۆزگەرتىش'}
              className={`p-2 rounded-xl transition cursor-pointer border ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700/80 text-amber-400 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-100'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Dynamic Tab Content */}
        <main className="p-4 sm:p-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* ================= TAB 1: DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header with refresh and reset buttons */}
              <div className="flex items-center justify-between gap-3 pb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-4 rounded-full bg-amber-400" />
                  <h3 className="font-bold text-sm text-white font-alkatip">ئاساسىي سىتاتىستىكا كۆرسەتكۈچلىرى</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetStatsModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 font-alkatip"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>سىتاتىستىكىلارنى نۆللەش</span>
                  </button>
                  <button
                    type="button"
                    onClick={loadAllAdminData}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 font-alkatip"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                    <span>سىتاتىستىكىلارنى يېڭىلاش</span>
                  </button>
                </div>
              </div>

              {/* 4 Summary Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total Revenue */}
                <div className={`p-4 sm:p-5 rounded-2xl ${themeClasses.card} relative overflow-hidden`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${themeClasses.subtext}`}>ئومۇمىي كىرىم</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white" dir="ltr">
                    <span className="text-amber-400">$</span>
                    {metrics.totalRev.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+18.4% ئۆتكەن ھەپتىدىن</span>
                  </div>
                </div>

                {/* 2. Total Orders */}
                <div className={`p-4 sm:p-5 rounded-2xl ${themeClasses.card} relative overflow-hidden`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${themeClasses.subtext}`}>جەمئىي زاكازلار</span>
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {metrics.totalOrderCount}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{metrics.completedCount} دانە تاماملاندى</span>
                  </div>
                </div>

                {/* 3. Total Users */}
                <div className={`p-4 sm:p-5 rounded-2xl ${themeClasses.card} relative overflow-hidden`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${themeClasses.subtext}`}>ئىشلەتكۈچىلەر سانى</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {metrics.userCount}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-cyan-400 font-bold">
                    <span>ئاكتىپ ئەزالار</span>
                  </div>
                </div>

                {/* 4. Processing Orders */}
                <div className={`p-4 sm:p-5 rounded-2xl ${themeClasses.card} relative overflow-hidden`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${themeClasses.subtext}`}>بىر تەرەپ قىلىنىۋاتقان</span>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                    {metrics.processingCount}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-400 font-bold">
                    <span>{metrics.pendingDepCount} تال كىرىم تەكشۈرۈلمەكتە</span>
                  </div>
                </div>
              </div>

              {/* 5. External Provider (syria4game.com) Live Status & Wholesale Balance */}
              <div className={`p-4 sm:p-5 rounded-2xl ${themeClasses.card} border ${
                providerStatus?.isConfigured ? 'border-cyan-500/40 bg-cyan-950/20' : 'border-amber-500/40 bg-amber-950/20'
              } flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition shadow-lg`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                    providerStatus?.isConfigured ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">Sahl Cash (api.sahl-cash.com) API ئۇلىنىشى</h3>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        providerStatus?.success
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : providerStatus?.errorMessage
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {providerStatus?.success
                          ? '● نەق ئۇلاندى (Live Active)'
                          : providerStatus?.errorMessage
                          ? `✕ ئۇلانمىدى (${providerStatus.errorMessage})`
                          : '○ كۈتۈلمەكتە'}
                      </span>
                      {providerStatus?.serverPublicIp && providerStatus.serverPublicIp !== 'ئېنىقلانمىدى' && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(providerStatus.serverPublicIp!);
                            alert(`نۆۋەتتىكى ئاممىۋى IP كۆچۈرۈلدى: ${providerStatus.serverPublicIp}`);
                          }}
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition flex items-center gap-1 cursor-pointer ${
                            providerStatus?.isIpBlocked
                              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                          }`}
                          title="Sahl Cash تەمىنلىگۈچىگە كىرگۈزىدىغان ئاممىۋى IP نى كۆچۈرۈۋېلىش"
                        >
                          <Globe className="w-3 h-3" />
                          <span>IP: {providerStatus.serverPublicIp}</span>
                          <Copy className="w-2.5 h-2.5 ml-0.5" />
                        </button>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${themeClasses.subtext}`}>
                      {providerStatus?.userName ? `ھېسابات: ${providerStatus.userName} | ` : ''}
                      {providerStatus?.errorMessage ? `ئەسكەرتىش: ${providerStatus.errorMessage}` : 'ئويۇن زاكازلىرى دەقىقىدە تەمىنلىگۈچى ئارقىلىق ئويۇنچى ھېساباتىغا ئاپتوماتىك قاچىلىنىدۇ.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-left" dir="ltr">
                    <span className="text-[11px] text-slate-400 block text-right font-medium">تەمىنلىگۈچى قالدۇق پۇلى:</span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
                      ${providerStatus?.balance !== undefined ? formatSmartPrice(providerStatus.balance) : '---'}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1 font-mono">
                      {providerStatus?.currency || 'USD'}
                    </span>
                  </div>

                  <button
                    onClick={checkProviderLive}
                    disabled={checkingProvider}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition flex items-center gap-2 border border-slate-700/80 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingProvider ? 'animate-spin' : ''}`} />
                    <span>{checkingProvider ? 'تەكشۈرۈۋاتىدۇ...' : 'API نى تەكشۈرۈش'}</span>
                  </button>
                </div>
              </div>

              {/* Chart & Quick Metrics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* SVG Revenue Chart */}
                <div className={`lg:col-span-2 p-5 rounded-2xl ${themeClasses.card}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-sm text-white">ھەپتىلىك كىرىم دىئاگراممىسى</h3>
                      <p className={`text-xs ${themeClasses.subtext}`}>
                        كۈندىلىك پۇل ئۆتكۈزۈش ۋە زاكاز كىرىملىرى
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold font-mono">
                      +24.8% ئۆسۈش
                    </span>
                  </div>

                  {/* Visual SVG Chart */}
                  <div className="h-56 w-full flex items-end gap-2 pt-8 pb-4 px-2 border-b border-slate-800">
                    {chartPoints.map((pt, idx) => {
                      const maxVal = Math.max(...chartPoints.map((p) => p.val), 50);
                      const heightPercent = Math.max(15, Math.round((pt.val / maxVal) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <span className="text-[10px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            ${pt.val}
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[36px] bg-gradient-to-t from-cyan-600 to-amber-400 rounded-t-lg transition-all duration-500 hover:brightness-125 shadow-md shadow-cyan-600/20"
                          />
                          <span className={`text-[10px] ${themeClasses.subtext} font-alkatip`}>
                            {pt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Shortcuts & Status Breakdown */}
                <div className={`p-5 rounded-2xl ${themeClasses.card} flex flex-col justify-between space-y-4`}>
                  <div>
                    <h3 className="font-bold text-sm text-white mb-1">زاكاز ھالەتلىرى خۇلاسىسى</h3>
                    <p className={`text-xs ${themeClasses.subtext} mb-4`}>
                      ھازىرقى زاكازلارنىڭ نىسبىتى
                    </p>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تاماملانغان زاكازلار</span>
                        </span>
                        <span className="font-mono font-bold text-white">{metrics.completedCount}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{
                            width: `${(metrics.completedCount / (metrics.totalOrderCount || 1)) * 100}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>بىر تەرەپ قىلىنىۋاتقان</span>
                        </span>
                        <span className="font-mono font-bold text-white">{metrics.processingCount}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{
                            width: `${(metrics.processingCount / (metrics.totalOrderCount || 1)) * 100}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="flex items-center gap-1.5 text-cyan-400">
                          <Wallet className="w-3.5 h-3.5" />
                          <span>شامكەش كىرىم تالونلىرى</span>
                        </span>
                        <span className="font-mono font-bold text-white">{deposits.length}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>زاكازلارنى تەكشۈرۈش</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Latest 5 Orders Table */}
              <div className={`p-5 rounded-2xl ${themeClasses.card} space-y-3`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">ئەڭ يېڭى زاكازلار (ئاخىرقى 5 زاكاز)</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    ھەممىنى كۆرۈش ({orders.length})
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className={`border-b ${themeClasses.tableHead}`}>
                        <th className="py-2.5 px-3">زاكاز ID</th>
                        <th className="py-2.5 px-3">مۇلازىمەت</th>
                        <th className="py-2.5 px-3">ھېسابات / ID</th>
                        <th className="py-2.5 px-3">باھا</th>
                        <th className="py-2.5 px-3">ھالەت</th>
                        <th className="py-2.5 px-3 text-center">مەھسۇلات تېز مەشغۇلات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className={`border-b ${themeClasses.tableRow}`}>
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">
                            {order.id}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {order.serviceName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">
                            {order.targetAccount}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                            ${formatSmartPrice(order.amount)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                  : isOrderInProgress(order.status)
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {order.status === 'completed'
                                ? 'تاماملاندى'
                                : order.status === 'pending_provider'
                                ? 'تەمىنلىگۈچىدە تەكشۈرۈلۈۋاتىدۇ'
                                : isOrderInProgress(order.status)
                                ? 'بىر تەرەپ قىلىنىۋاتىدۇ'
                                : order.status === 'refunded'
                                ? 'پۇلى قايتۇرۇلدى'
                                : 'بىكار قىلىندى'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {order.status !== 'completed' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                  className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition cursor-pointer"
                                >
                                  تاماملاش
                                </button>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'refunded' && (
                                <button
                                  onClick={() => handleRefundOrder(order)}
                                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-rose-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                                >
                                  پۇل قايتۇرۇش
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ORDERS MANAGEMENT ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Filter and Search Bar */}
              <div className={`p-4 rounded-2xl ${themeClasses.card} flex flex-col sm:flex-row items-center justify-between gap-3`}>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="زاكاز ID، ئىشلەتكۈچى ياكى تۈر بويىچە ئىزدەش..."
                    className={`w-full pr-9 pl-3 py-2 rounded-xl text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400 transition`}
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'processing', 'review', 'completed', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        statusFilter === st ? themeClasses.pillActive : themeClasses.pillInactive
                      }`}
                    >
                      {st === 'all'
                        ? `ھەممىسى (${orders.length})`
                        : st === 'processing'
                        ? `بىر تەرەپ قىلىنىۋاتقان (${orders.filter((o) => isOrderInProgress(o.status)).length})`
                        : st === 'completed'
                        ? `تاماملاندى (${orders.filter((o) => o.status === 'completed').length})`
                        : st === 'review'
                        ? `تەكشۈرۈش كېرەك (${orders.filter((o) => o.details?.needsReview).length})`
                        : `بىكار قىلىندى (${orders.filter((o) => o.status === 'cancelled' || o.status === 'refunded').length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className={`border-b ${themeClasses.tableHead}`}>
                        <th className="py-3 px-3">زاكاز نومۇرى</th>
                        <th className="py-3 px-3">مۇلازىمەت ۋە بولاق</th>
                        <th className="py-3 px-3">نۇسخا / كىملىك (ID)</th>
                        <th className="py-3 px-3">خېرىدار</th>
                        <th className="py-3 px-3">باھا</th>
                        <th className="py-3 px-3">ھالەت</th>
                        <th className="py-3 px-3 text-center">ھالەت ئۆزگەرتىش</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-500">
                            ھېچقانداق زاكاز تېپىلمىدى.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr key={order.id} className={`border-b ${themeClasses.tableRow}`}>
                            <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                              {order.id}
                              <span className="block text-[10px] text-slate-500 font-normal">
                                {order.createdAt?.substring(0, 16).replace('T', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-white block">{order.serviceName}</span>
                              <span className="text-[10px] text-slate-400">{order.packageTitle}</span>
                            </td>
                            <td className="py-3 px-3 font-mono text-amber-300 select-all font-bold">
                              {order.targetAccount}
                              {order.details?.providerOrderId && (
                                <span className="block text-[10px] text-cyan-400 font-normal" dir="ltr">
                                  Sahl Cash #{order.details.providerOrderId}
                                  {order.details.providerStatus ? ` · ${order.details.providerStatus}` : ''}
                                </span>
                              )}
                              {order.details?.delivery?.codes?.length ? (
                                <span className="block text-[10px] text-emerald-400 font-normal" dir="ltr">
                                  {order.details.delivery.codes.join(' | ')}
                                </span>
                              ) : null}
                              {order.details?.needsReview && (
                                <span className="block text-[10px] text-rose-300 font-normal font-alkatip">
                                  ⚠ {order.details.reviewReason || 'تەكشۈرۈش كېرەك'}
                                </span>
                              )}
                              {typeof order.details?.costTotal === 'number' && (
                                <span className="block text-[10px] text-slate-500 font-normal" dir="ltr">
                                  cost ${formatSmartPrice(order.details.costTotal)} · profit ${formatSmartPrice(order.amount - order.details.costTotal)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                              {order.userEmail || 'ئېنىقسىز'}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-amber-400">
                              ${formatSmartPrice(order.amount)}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  order.status === 'completed'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : isOrderInProgress(order.status)
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {order.status === 'completed'
                                  ? 'تاماملاندى'
                                  : order.status === 'pending_provider'
                                  ? 'تەمىنلىگۈچىدە تەكشۈرۈلۈۋاتىدۇ'
                                  : isOrderInProgress(order.status)
                                  ? 'بىر تەرەپ قىلىنىۋاتىدۇ'
                                  : order.status === 'refunded'
                                  ? 'پۇلى قايتۇرۇلدى'
                                  : 'بىكار قىلىندى'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  disabled={actionLoading === order.id}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition cursor-pointer"
                                >
                                  پۈتتى
                                </button>
                                <button
                                  disabled={actionLoading === order.id}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] transition cursor-pointer"
                                >
                                  بىر تەرەپ
                                </button>
                                {(order.details as any)?.providerProductId && isOrderInProgress(order.status) && (
                                  <button
                                    disabled={actionLoading === order.id}
                                    onClick={() => handleRecheckOrder(order)}
                                    className="px-2.5 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-[10px] transition cursor-pointer"
                                  >
                                    قايتا تەكشۈر
                                  </button>
                                )}
                                {order.status !== 'cancelled' && order.status !== 'refunded' && (
                                  <button
                                    disabled={actionLoading === order.id}
                                    onClick={() => handleRefundOrder(order)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-[10px] transition cursor-pointer"
                                  >
                                    پۇل قايتۇر
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: PRODUCTS & SERVICES (CRUD) ================= */}
          {activeTab === 'services' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Category Management Bar */}
              <div className={`p-4 rounded-2xl ${themeClasses.card} space-y-3`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">سەھىپىلەر ۋە مەھسۇلات باشقۇرۇش</h3>
                      <p className={`text-xs ${themeClasses.subtext}`}>
                        سەھىپىلەرنى قوشۇش، ئۆچۈرۈش ياكى مەھسۇلات باھالىرىنى ئەپچىل تەھرىرلەش
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {services.length > 0 && (
                      <button
                        onClick={handleClearAllServices}
                        className="px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        title="بارلىق سىناق مەھسۇلاتلارنى بىرلا قېتىمدا يۇيۇپ نۆللەش"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>بارلىق مەھسۇلاتنى يۇيۇش ({services.length})</span>
                      </button>
                    )}
                    {services.length === 0 && (
                      <button
                        onClick={handleRestoreDefaultServices}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>ئۈلگە مەھسۇلاتلارنى قايتۇرۇش</span>
                      </button>
                    )}
                    <button
                      onClick={handleOpenAddCategory}
                      className="px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>+ يېڭى سەھىپە قوشۇش</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('banners')}
                      className="px-3 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="باشبەتتىكى چوڭ ئېلان تاختىسى ۋە سلايدېرنى تەھرىرلەش"
                    >
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>باشبەت ئېلانلىرى (سلايدېر)</span>
                    </button>
                    <button
                      onClick={handleOpenAddService}
                      className="px-4 py-2 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ قولدا قوشۇش</span>
                    </button>
                    <button
                      onClick={() => fetchProviderProducts(false)}
                      disabled={loadingProducts}
                      className="px-3.5 py-2 rounded-xl bg-cyan-900/70 hover:bg-cyan-800 border border-cyan-500/50 text-cyan-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      title="Sahl Cash تىن ئەڭ يېڭى مەھسۇلات ۋە باھالارنى قايتا يېڭىلاش"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${loadingProducts ? 'animate-spin' : ''}`} />
                      <span>{loadingProducts ? 'يېڭىلىنىۋاتىدۇ...' : '⚡ Sahl Cash يېڭىلاش'}</span>
                    </button>
                    {categoryFilter !== 'all' && (
                      <button
                        onClick={handleBatchPublishActiveCategory}
                        disabled={loadingProducts}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        title="مۇشۇ سەھىپىدىكى بارلىق Sahl Cash مەھسۇلاتلىرىنى بىراقلا دۇكانغا قوشۇپ باشبەتكە چىقىرىش"
                      >
                        <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        <span>🚀 سەھىپىنى دۇكانغا تولۇق قوشۇش</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Categories Filter Pills with Delete Option */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setCategoryFilter('all');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      categoryFilter === 'all' ? themeClasses.pillActive : themeClasses.pillInactive
                    }`}
                  >
                    بارلىق مەھسۇلاتلار ({unifiedServicesList.length})
                  </button>
                  {categoriesList.map((cat) => {
                    const catCount = unifiedServicesList.filter((s) => s.category === cat.id).length;
                    const isActive = categoryFilter === cat.id;
                    return (
                      <div
                        key={cat.id}
                        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                            : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setCategoryFilter(cat.id);
                            setCurrentPage(1);
                          }}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="animate-moving-icon">
                            <DynamicIcon name={cat.icon || 'Package'} className="w-3.5 h-3.5" />
                          </span>
                          <span>{cat.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                            {catCount}
                          </span>
                        </button>
                        {/* Edit category button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditCategory(cat);
                          }}
                          className="p-1 rounded-md hover:bg-black/20 text-slate-400 hover:text-white transition cursor-pointer"
                          title="سەھىپىنى تەھرىرلەش (ئىسمى، رەسىمى ۋە بەلگىسىنى ئۆزگەرتىش)"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {/* Allow deleting category if admin wants */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat.id, cat.name);
                          }}
                          className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="سەھىپىنى ئۆچۈرۈش"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Search & Source Filter Bar */}
              <div className={`p-4 rounded-2xl ${themeClasses.card} flex flex-col md:flex-row items-center justify-between gap-3`}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="مەھسۇلات نامى ياكى تەپسىلاتى بويىچە ئىزدەش..."
                      className={`w-full pr-9 pl-3 py-2 rounded-xl text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400 transition`}
                    />
                  </div>

                  {/* Filter chips: All / Published / Sahl */}
                  <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-bold overflow-x-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setProductSourceFilter('all');
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                        productSourceFilter === 'all'
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ھەممىسى ({unifiedServicesList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProductSourceFilter('published');
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                        productSourceFilter === 'published'
                          ? 'bg-emerald-400 text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ✅ دۇكاندا كۆرۈنىدىغان ({services.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProductSourceFilter('sahl');
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                        productSourceFilter === 'sahl'
                          ? 'bg-cyan-400 text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚡ Sahl Cash تىزىملىكى
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full md:w-auto">
                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                    title="باشبەتكە چىققان مەھسۇلاتلارنى يېڭى بەتتە نەق كۆرۈش"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>باشبەتتە كۆرۈش ↗</span>
                  </a>
                  {categoryFilter !== 'all' && filteredServices.length > 0 && (
                    <button
                      onClick={() => {
                        const activeCat = categoriesList.find((c) => c.id === categoryFilter);
                        handleClearCategoryServices(categoryFilter, activeCat?.name || categoryFilter);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مۇشۇ سەھىپىدىكىلەرنى يۇيۇش</span>
                    </button>
                  )}
                  <div className="text-xs text-slate-400">
                    كۆرسىتىلىۋاتقىنى: <span className="font-mono font-bold text-amber-400">{filteredServices.length}</span> مەھسۇلات
                    {totalPages > 1 && (
                      <span className="font-mono text-slate-500 mr-2">
                        (بەت: {currentPage}/{totalPages})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Services Grid (All products directly from Sahl Cash & Custom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {paginatedServices.map((srv) => {
                  const isSavedCustom = savedServiceIds.has(srv.id);
                  const catObj = categoriesList.find((c) => c.id === srv.category);
                  const minPrice = srv.packages && srv.packages.length > 0 ? srv.packages[0].price : 0;

                  return (
                    <div
                      key={srv.id}
                      className={`p-4 rounded-2xl ${themeClasses.card} flex flex-col justify-between hover:border-amber-400/50 transition group relative ${
                        isSavedCustom ? 'ring-1 ring-emerald-500/20' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-md">
                              {srv.image ? (
                                <img
                                  src={srv.image}
                                  alt={srv.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                                  }}
                                />
                              ) : (
                                <Package className="w-6 h-6 text-cyan-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-white line-clamp-1">{srv.name}</h4>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20">
                                  <DynamicIcon name={catObj?.icon || 'Package'} className="w-3 h-3 text-amber-400" />
                                  <span>{catObj?.name || srv.category}</span>
                                </span>
                                {isSavedCustom ? (
                                  srv.published !== false ? (
                                    <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded-md">
                                      دۇكاندا ئوچۇق
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-amber-300 font-bold bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.2 rounded-md">
                                      ۋاقىتلىق توختىتىلغان
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[9px] text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.2 rounded-md">
                                    Sahl Cash
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {srv.badge && renderMovingBadge(srv.badge)}
                        </div>

                        <p className={`text-xs ${themeClasses.subtext} line-clamp-2 mb-3`}>
                          {srv.description || `${srv.name} ئاپتوماتىك پۇل قاچىلاش مۇلازىمىتى`}
                        </p>

                        <div className="flex items-center justify-between text-xs py-2 border-t border-slate-800/80">
                          <span className={themeClasses.subtext}>
                            بولاق سانى: <strong className="text-white font-mono">{srv.packages?.length || 1}</strong>
                          </span>
                          <div className="text-left font-mono">
                            <span className="text-[10px] text-slate-400 ml-1">باشلىنىش:</span>
                            <span className="font-black text-amber-400 text-sm">
                              ${formatSmartPrice(minPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          {/* Quick Category Move Dropdown */}
                          <div className="flex-1 min-w-0" title="سەھىپىگە يۆتكەش">
                            <select
                              value={srv.category}
                              onChange={(e) => handleQuickChangeCategory(srv.id, e.target.value)}
                              className="w-full py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-bold text-[11px] focus:outline-none focus:border-amber-400 cursor-pointer truncate"
                            >
                              {categoriesList.map((c) => (
                                <option key={c.id} value={c.id} className="bg-slate-950 text-white">
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => handleOpenEditService(srv)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                            title="تەھرىرلەش (باھا، نامى ۋە بولاقلارنى تەڭشەش)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تەھرىرلەش</span>
                          </button>
                          <button
                            onClick={() => handleDeleteService(srv.id)}
                            className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition flex items-center justify-center cursor-pointer shrink-0"
                            title={isSavedCustom ? 'دۇكاندىن ئۆچۈرۈش' : 'تىزىملىكتىن يوشۇرۇش'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Direct 1-Click Visibility Toggle for Storefront */}
                        <div>
                          {srv.published !== false ? (
                            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>باشبەتتە ئوچۇق</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/service/${srv.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-cyan-300 hover:text-cyan-200 underline font-mono flex items-center gap-0.5"
                                  title="دەرھال كۆرۈش"
                                >
                                  <span>كۆرۈش ↗</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublishService(srv, false)}
                                  className="px-2 py-0.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[10px] transition cursor-pointer"
                                  title="باشبەتتىن يوشۇرۇش"
                                >
                                  يوشۇرۇش
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                              <span className="flex items-center gap-1.5">
                                <span>⚠️ باشبەتتە يوشۇرۇنغان</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleTogglePublishService(srv, true)}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-[11px] transition cursor-pointer flex items-center gap-1 shadow-sm"
                                title="بۇ مەھسۇلاتنى دەرھال باشبەتتە ئېچىش"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>باشبەتتە ئېچىش</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 pb-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 font-bold disabled:opacity-30 cursor-pointer hover:bg-slate-800 transition"
                  >
                    ئالدىنقى بەت
                  </button>
                  <div className="flex items-center gap-1 font-mono text-xs px-2">
                    <span className="text-amber-400 font-black">{currentPage}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">{totalPages}</span>
                  </div>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 font-bold disabled:opacity-30 cursor-pointer hover:bg-slate-800 transition"
                  >
                    كېيىنكى بەت
                  </button>
                </div>
              )}

              {filteredServices.length === 0 && (
                <div className={`p-8 sm:p-12 rounded-2xl ${themeClasses.card} text-center space-y-4 border-2 border-dashed border-slate-800`}>
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-md">
                    <Package className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-white">بۇ تۈردە مەھسۇلات تېپىلمىدى</h4>
                    <p className={`text-xs ${themeClasses.subtext} max-w-md mx-auto`}>
                      ئىزدەش شەرتى ياكى سەھىپە تاللىشىنى ئۆزگەرتىپ كۆرۈڭ، ياكى «⚡ Sahl Cash يېڭىلاش» كۇنۇپكىسىنى بېسىپ مەھسۇلاتلارنى قايتا يۈكلەڭ.
                    </p>
                  </div>
                  <button
                    onClick={() => fetchProviderProducts(false)}
                    className="px-4 py-2 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer shadow-md inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Sahl Cash مەھسۇلاتلىرىنى يېڭىلاش</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: DEPOSITS MANAGEMENT ================= */}
          {activeTab === 'deposits' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className={`p-4 rounded-2xl ${themeClasses.card} flex items-center justify-between`}>
                <div>
                  <h3 className="font-bold text-sm text-white">شامكەش (Sham Cash) ھەميان كىرىملىرى</h3>
                  <p className={`text-xs ${themeClasses.subtext}`}>
                    خېرىدارلار ئەۋەتكەن پۇل كىرگۈزۈش تالونلىرىنى تەكشۈرۈش ۋە تەستىقلاش
                  </p>
                </div>
                <div className="font-mono font-bold text-xs text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl">
                  كۈتۈلمەكتە: {metrics.pendingDepCount}
                </div>
              </div>

              {/* TSA API Shamcash Quick Setup Card inside Deposits Tab */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-3.5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                      <span>⚡ شامكەش ئاپتوماتىك پۇل قاچىلاش سىستېمىسى (TSA API)</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        settings.tsaApiKey ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {settings.tsaApiKey ? '● ئاچقۇچ كىرگۈزۈلگەن' : '○ ئاچقۇچ كىرگۈزۈلمىگەن'}
                      </span>
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <a
                      href="https://tsa-api.com/dashboard/link"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>🔗 TSA دە ھېسابات باغلاش (dashboard/link) ↗</span>
                    </a>
                    <a
                      href="https://tsa-api.com/dashboard/api"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline font-mono"
                    >
                      ئاچقۇچ ئېلىش ↗
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                  <div className="lg:col-span-5">
                    <label className="block text-slate-300 text-[11px] font-bold mb-1">
                      TSA API ئاچقۇچى (API Key / Token):
                    </label>
                    <input
                      type="password"
                      placeholder="54qovzfR••••••••spdvP4..."
                      value={settings.tsaApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, tsaApiKey: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl font-mono text-xs text-cyan-300 ${themeClasses.input} focus:outline-none focus:border-cyan-400`}
                      dir="ltr"
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <label className="block text-slate-300 text-[11px] font-bold mb-1">
                      شامكەش ھېسابات نومۇرى / Wallet Key:
                    </label>
                    <input
                      type="text"
                      placeholder="شامكەش ئادرېسىڭىز..."
                      value={settings.shamcashAddress || ''}
                      onChange={(e) => setSettings({ ...settings, shamcashAddress: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl font-mono text-xs text-amber-300 ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                      dir="ltr"
                    />
                  </div>

                  <div className="lg:col-span-3 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={tsaTesting || !settings.tsaApiKey}
                      onClick={handleTestTsaConnection}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {tsaTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>{tsaTesting ? 'تەكشۈرۈۋاتىدۇ...' : '⚡ سىناش & بايقاش'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow cursor-pointer"
                    >
                      ساقلاش
                    </button>
                  </div>
                </div>


                {/* Exchange Rate Setting Controls */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <span>سورىيە پۇلى پېرېۋوت نىسبىتى (1 USD = X SYP):</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-alkatip">
                      خېرىدار شامكەشتە لىرا (SYP) ئاتقاندا، سىستېما مۇشۇ نىسبەت بويىچە ئاپتوماتىك دوللارغا ئايلاندۇرىدۇ.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      {[14000, 14500, 15000, 15500, 16000].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSettings({ ...settings, shamcashExchangeRate: rate })}
                          className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                            (settings.shamcashExchangeRate || 15000) === rate
                              ? 'bg-amber-400 text-slate-950 font-black shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {rate.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <div className="relative w-28">
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        value={settings.shamcashExchangeRate || 15000}
                        onChange={(e) => setSettings({ ...settings, shamcashExchangeRate: Number(e.target.value) })}
                        className={`w-full px-2.5 py-1.5 rounded-lg font-mono font-black text-xs text-amber-300 ${themeClasses.input} focus:outline-none focus:border-amber-400 text-center`}
                        dir="ltr"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveSettings()}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow cursor-pointer"
                    >
                      ✓ نىسبەتنى ساقلاش
                    </button>
                  </div>
                </div>

                {tsaTestResult && (
                  <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                    tsaTestResult.success ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/70 border border-rose-500/50 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {tsaTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{tsaTestResult.message}</span>
                    </div>
                    {tsaTestResult.balances && Array.isArray(tsaTestResult.balances) && (
                      <div className="flex items-center gap-2 font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                        <span>شامكەش قالدۇقى:</span>
                        {tsaTestResult.balances.map((b, i) => (
                          <span key={i} className="text-white font-black">{b.balance} {b.currency}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className={`border-b ${themeClasses.tableHead}`}>
                        <th className="py-3 px-3">تالون نومۇرى</th>
                        <th className="py-3 px-3">ئىسپات نومۇرى (TxID)</th>
                        <th className="py-3 px-3">خېرىدار ئىسمى ۋە ئېلخەت</th>
                        <th className="py-3 px-3">سوممىسى</th>
                        <th className="py-3 px-3">ۋاقتى</th>
                        <th className="py-3 px-3">ھالەت</th>
                        <th className="py-3 px-3 text-center">تەستىقلاش مەشغۇلاتى</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-500">
                            تېخى ھېچقانداق تالون يوق.
                          </td>
                        </tr>
                      ) : (
                        deposits.map((dep) => (
                          <tr key={dep.id} className={`border-b ${themeClasses.tableRow}`}>
                            <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                              {dep.id}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-amber-300 select-all">
                              {dep.txId || 'كەمچىل'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-white block">{dep.userName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{dep.userEmail}</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-black text-emerald-400 text-sm">
                              +${formatSmartPrice(dep.amount)}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-400 text-[10px]">
                              {dep.date}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  dep.status === 'completed'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : dep.status === 'pending'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {dep.status === 'completed'
                                  ? 'تەستىقلاندى'
                                  : dep.status === 'pending'
                                  ? 'تەكشۈرۈلمەكتە'
                                  : 'رەت قىلىندى'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {dep.status === 'pending' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    disabled={actionLoading === dep.id}
                                    onClick={() => handleVerifyWithTsa(dep.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1"
                                    title="TSA API ئارقىلىق شامكەشتىن ئاپتوماتىك تەكشۈرۈپ تەستىقلاش"
                                  >
                                    ⚡ TSA دەلىللەش
                                  </button>
                                  <button
                                    disabled={actionLoading === dep.id}
                                    onClick={() => handleUpdateDepositStatus(dep.id, 'completed')}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
                                  >
                                    ✓ قولدا تەستىقلاش
                                  </button>
                                  <button
                                    disabled={actionLoading === dep.id}
                                    onClick={() => handleUpdateDepositStatus(dep.id, 'rejected')}
                                    className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition cursor-pointer"
                                  >
                                    ✕ رەت قىلىش
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[11px]">مەشغۇلات تامام</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: USERS MANAGEMENT ================= */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className={`p-4 rounded-2xl ${themeClasses.card} flex flex-col sm:flex-row items-center justify-between gap-3`}>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ئىشلەتكۈچى ئىسمى، ئېلخەت ياكى تېلېفون بويىچە..."
                    className={`w-full pr-9 pl-3 py-2 rounded-xl text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400 transition`}
                  />
                </div>

                <div className="text-xs text-slate-400">
                  جەمئىي ئەزالار: <span className="font-mono font-bold text-white">{users.length}</span> نەپەر
                </div>
              </div>

              {/* Admin Delegation Bar */}
              <div className={`p-4 rounded-2xl ${themeClasses.card} border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-amber-300">باشقۇرغۇچى كىرىش ھوقۇقى تەيىنلەش</h4>
                    <p className="text-[11px] text-slate-400">ئۆزىڭىز ئىشەنگەن كىشىلەرگە باشقۇرۇش مەركىزىنى ئېچىپ بېرىڭ ياكى تاقاڭ</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="مەسىلەن: user@gmail.com"
                    className={`px-3 py-1.5 rounded-xl text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400 font-mono w-full sm:w-64`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    disabled={addingAdmin || !newAdminEmail.trim()}
                    onClick={handleGrantAdminByEmail}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {addingAdmin ? 'تەڭشىلىۋاتىدۇ...' : '+ باشقۇرغۇچى قىلىش'}
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className={`border-b ${themeClasses.tableHead}`}>
                        <th className="py-3 px-3">ئىشلەتكۈچى ID</th>
                        <th className="py-3 px-3">ئىسىم / لەقەم</th>
                        <th className="py-3 px-3">ئېلخەت ۋە تېلېفون</th>
                        <th className="py-3 px-3">قالدۇق (Balance)</th>
                        <th className="py-3 px-3">ئىشلەتكەن سومما</th>
                        <th className="py-3 px-3">دەرىجە (VIP)</th>
                        <th className="py-3 px-3">ھالەت (چەك)</th>
                        <th className="py-3 px-3 text-center">مەشغۇلات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className={`border-b ${themeClasses.tableRow}`}>
                          <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                            {user.id}
                          </td>
                          <td className="py-3 px-3 font-bold text-white">
                            {user.name}
                            {user.role === 'admin' && (
                              <span className="mr-1.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
                                باشقۇرغۇچى
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">
                            <div>{user.email}</div>
                            {user.phone && <div className="text-[10px] text-slate-500">{user.phone}</div>}
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-amber-400 text-sm">
                            ${formatSmartPrice(user.balance)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">
                            ${formatSmartPrice(user.totalSpent)}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={(user.vipTier || 'vip1').toLowerCase()}
                              disabled={actionLoading === user.id}
                              onChange={(e) => handleUpdateUserVip(user, e.target.value)}
                              className="font-mono font-bold text-[11px] px-2 py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition cursor-pointer disabled:opacity-50"
                              title="VIP ئەزالىق دەرىجىسىنى كۆتۈرۈش / ئۆزگەرتىش"
                            >
                              <option value="vip1" className="bg-slate-900 text-slate-300">VIP 1 (ئاددىي - 0%)</option>
                              <option value="vip2" className="bg-slate-900 text-amber-400">VIP 2 (كۈمۈش - 2%)</option>
                              <option value="vip3" className="bg-slate-900 text-cyan-400">VIP 3 (ئالتۇن - 5%)</option>
                              <option value="vip4" className="bg-slate-900 text-yellow-400">VIP 4 (پىلاتىنا - 8%)</option>
                              <option value="vip5" className="bg-slate-900 text-emerald-400">VIP 5 (ئالماس - 12%)</option>
                            </select>
                          </td>
                          <td className="py-3 px-3">
                            {user.isBanned ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                                قۇلۇپلانغان (چەكلەنگەن)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                نورمال
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Edit Balance & VIP & Role */}
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBalanceDelta(0);
                                  setSelectedVipTier((user.vipTier || 'vip1').toLowerCase());
                                  setSelectedUserRole(user.role === 'admin' ? 'admin' : 'user');
                                  setUserModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition cursor-pointer"
                              >
                                تەھرىرلەش
                              </button>

                              {/* Quick Toggle Admin Role Button */}
                              {user.email?.toLowerCase() === 'dronemax0996@gmail.com' ? (
                                <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                                  👑 ئاساسىي ئىگە
                                </span>
                              ) : user.role === 'admin' ? (
                                <button
                                  type="button"
                                  disabled={actionLoading === user.id}
                                  onClick={() => handleToggleUserRole(user, 'user')}
                                  className="px-2 py-1 rounded-md bg-amber-950/60 hover:bg-amber-900 text-amber-200 border border-amber-700/50 text-[10px] font-bold transition cursor-pointer"
                                  title="باشقۇرۇش مەركىزىنى تاقاش"
                                >
                                  باشقۇرغۇچىلىقنى تاقاش
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={actionLoading === user.id}
                                  onClick={() => handleToggleUserRole(user, 'admin')}
                                  className="px-2 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/50 text-[10px] font-bold transition cursor-pointer"
                                  title="باشقۇرۇش مەركىزىنى ئېچىپ بېرىش"
                                >
                                  + باشقۇرغۇچى قىلىش
                                </button>
                              )}

                              {/* Ban / Unban */}
                              <button
                                onClick={() => handleToggleUserBan(user)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                  user.isBanned
                                    ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                    : 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50'
                                }`}
                              >
                                {user.isBanned ? 'چەكنى ئېچىش' : 'چەكلەش'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 6: FINANCIAL ANALYTICS ================= */}
          {activeTab === 'finance' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header with refresh button */}
              <div className={`p-4 sm:p-5 rounded-2xl ${themeClasses.card} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white font-alkatip">مالىيە ۋە كىرىم-چىقىم سىتاتىستىكىسى</h3>
                    <p className={`text-xs ${themeClasses.subtext} mt-0.5 font-alkatip`}>
                      شامكەش كىرىملىرى، زاكاز سېتىلىشلىرى ۋە ساپ قالدۇق سىتاتىستىكىسى
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowResetStatsModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm font-alkatip shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>سىتاتىستىكىلارنى نۆلگە قايتۇرۇش</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadAllAdminData}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm font-alkatip shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                    <span>سىتاتىستىكىلارنى يېڭىلاش</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${themeClasses.subtext}`}>جەمئىي كىرگۈزۈلگەن پۇل (Deposits)</span>
                    <button
                      type="button"
                      onClick={loadAllAdminData}
                      disabled={loading}
                      title="سىتاتىستىكىنى يېڭىلاش"
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-400 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                  </div>
                  <div className="text-3xl font-black font-mono text-emerald-400">
                    +${metrics.totalDep.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-alkatip">شامكەش ئارقىلىق دەلىللەنگەن ئومۇمىي سومما</p>
                </div>

                <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${themeClasses.subtext}`}>جەمئىي سېتىۋېلىنغان (Sales)</span>
                    <button
                      type="button"
                      onClick={loadAllAdminData}
                      disabled={loading}
                      title="سىتاتىستىكىنى يېڭىلاش"
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>
                  </div>
                  <div className="text-3xl font-black font-mono text-cyan-400">
                    ${metrics.totalRev.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-alkatip">بارلىق زاكازلارنىڭ ئومۇمىي باھاسى</p>
                </div>

                <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${themeClasses.subtext}`}>ساپ قالدۇق پەرقى</span>
                    <button
                      type="button"
                      onClick={loadAllAdminData}
                      disabled={loading}
                      title="سىتاتىستىكىنى يېڭىلاش"
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-400 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                  </div>
                  <div className="text-3xl font-black font-mono text-amber-400">
                    ${Math.max(0, metrics.totalDep - metrics.totalRev).toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-alkatip">ھەميانلاردا قالغان ئومۇمىي ئاكتىپ قالدۇق</p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className={`p-5 rounded-2xl ${themeClasses.card} space-y-4`}>
                <h3 className="font-bold text-sm text-white">ئايلىق چىقىم ۋە مۇلازىمەت پايدا نىسبىتى</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {CATEGORIES_9.map((cat) => {
                    const countInCat = services.filter((s) => s.category === cat.id).length;
                    return (
                      <div key={cat.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-white block">{cat.name}</span>
                          <span className="text-[10px] text-slate-400">{countInCat} تۈر مۇلازىمەت</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {cat.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: SYSTEM SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300">
              <div className={`p-6 rounded-2xl ${themeClasses.card} space-y-5`}>
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-ukij font-bold text-base text-white">سىستېما ۋە تور بېكەت تەڭشەكلىرى</h3>
                    <p className={`text-xs ${themeClasses.subtext}`}>
                      بېكەت نامى، ئالاقە ۋە شامكەش ھېساباتلىرىنى بۇ يەردىن باشقۇرۇڭ
                    </p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>

                {settingsSaveMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center">
                    ✓ {settingsSaveMsg}
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  {/* Site Logo Section */}
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-star-twinkle" />
                        <h4 className="font-bold text-white text-xs sm:text-sm font-alkatip">
                          تور بېكەت لوگو رەسىمى (Logo)
                        </h4>
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                        باش بەت ۋە تىزىملىكلەردە چىقىدۇ
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Logo Preview */}
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/60 flex items-center justify-center bg-[#04101e] shrink-0 overflow-hidden">
                        <img
                          src={settings.siteLogo || '/logo.png'}
                          alt="Logo Preview"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/logo.png';
                          }}
                        />
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="file"
                            ref={logoFileInputRef}
                            onChange={handleLogoUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                          >
                            <Upload className="w-4 h-4" />
                            <span>تېلېفون ياكى كومپيۇتېردىن رەسىم يۈكلەش</span>
                          </button>

                          {settings.siteLogo && settings.siteLogo !== '/brand_logo.png?v=2.1.0' && settings.siteLogo !== '/logo.png' && (
                            <button
                              type="button"
                              onClick={() => setSettings({ ...settings, siteLogo: '/brand_logo.png?v=2.1.0' })}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>دەسلەپكى لوگوغا قايتۇرۇش</span>
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">ياكى لوگو رەسىم ئۇلانمىسى (URL):</label>
                          <input
                            type="text"
                            value={settings.siteLogo || ''}
                            onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                            placeholder="مەسىلەن: https://... ياكى /logo.png"
                            className={`w-full px-3 py-2 rounded-xl font-mono text-xs text-cyan-300 ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">تور بېكەت نامى:</label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl font-bold ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      شامكەش (Sham Cash) ھېسابات نومۇرى / Wallet Key:
                    </label>
                    <input
                      type="text"
                      value={settings.shamcashAddress}
                      onChange={(e) => setSettings({ ...settings, shamcashAddress: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-cyan-300 ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                      dir="ltr"
                    />
                  </div>

                  {/* TSA API Shamcash Auto-Recharge Block */}
                  <div className="p-4 rounded-2xl bg-cyan-950/25 border border-cyan-500/40 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          شامكەش ئاپتوماتىك پۇل كىرگۈزۈش (TSA API)
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href="https://tsa-api.com/dashboard/link"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-amber-400 hover:underline font-bold"
                        >
                          🔗 TSA دە ھېسابات باغلاش (dashboard/link) ↗
                        </a>
                        <span className="text-slate-600">|</span>
                        <a
                          href="https://tsa-api.com/api/docs"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-cyan-400 hover:underline font-mono"
                          dir="ltr"
                        >
                          API ھۆججىتى ↗
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        TSA API ئاچقۇچى (API Key / Token):
                      </label>
                      <input
                        type="password"
                        placeholder="TSA API ئاچقۇچىڭىزنى چاپلاڭ..."
                        value={settings.tsaApiKey || ''}
                        onChange={(e) => setSettings({ ...settings, tsaApiKey: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-cyan-300 ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                        dir="ltr"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">
                          سورىيە پۇلى پېرېۋوت نىسبىتى (1 USD = X SYP):
                        </label>
                        <input
                          type="number"
                          value={settings.shamcashExchangeRate || 15000}
                          onChange={(e) => setSettings({ ...settings, shamcashExchangeRate: Number(e.target.value) })}
                          className={`w-full px-3.5 py-2 rounded-xl font-mono text-white ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                          dir="ltr"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-3 sm:pt-6">
                        <label className="text-slate-300 font-bold cursor-pointer select-none">
                          ئاپتوماتىك قاچىلاشنى قوزغىتىش:
                        </label>
                        <input
                          type="checkbox"
                          checked={settings.tsaAutoDepositEnabled !== false}
                          onChange={(e) => setSettings({ ...settings, tsaAutoDepositEnabled: e.target.checked })}
                          className="w-5 h-5 accent-amber-400 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        type="button"
                        disabled={tsaTesting}
                        onClick={handleTestTsaConnection}
                        className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md w-full sm:w-auto justify-center active:scale-95"
                      >
                        <span>{tsaTesting ? 'سىناق قىلىنىۋاتىدۇ...' : '⚡ API نى سىناش ۋە شامكەش قالدۇقىنى كۆرۈش'}</span>
                      </button>
                    </div>

                    {tsaTestResult && (
                      <div className={`p-3 rounded-xl text-xs font-bold ${tsaTestResult.success ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'}`}>
                        <p>{tsaTestResult.message}</p>
                        {tsaTestResult.balances && Array.isArray(tsaTestResult.balances) && (
                          <p className="mt-1 font-mono text-white" dir="ltr">
                            شامكەش قالدۇقى: {tsaTestResult.balances.map((b) => `${b.balance} ${b.currency}`).join(' | ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      رەسمىي WhatsApp نومۇرى:
                    </label>
                    <input
                      type="text"
                      value={settings.whatsappNumber}
                      onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl font-mono ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      رەسمىي Telegram ئادرېسى / ئىشلەتكۈچى نامى:
                    </label>
                    <input
                      type="text"
                      value={settings.telegramUsername}
                      onChange={(e) => setSettings({ ...settings, telegramUsername: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl font-mono ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      رەسمىي ئەپ (APK) چۈشۈرۈش ئۇلانمىسى (App Download URL):
                    </label>
                    <input
                      type="text"
                      placeholder="https://t.me/autocash_UYGHUR ياكى Google Drive ئۇلانمىسى..."
                      value={settings.appDownloadUrl || ''}
                      onChange={(e) => setSettings({ ...settings, appDownloadUrl: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl font-mono ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                      dir="ltr"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      ئەگەر بوش قالدۇرۇلسا، ئاپتوماتىك ھالدا رەسمىي Telegram مەركىزىگە ئۇلىنىپ ئەپ تارقىتىلىدۇ.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-amber-300 font-bold mb-1.5">
                      باشقۇرغۇچى مەخپىي شىفىرى (Admin PIN):
                    </label>
                    <input
                      type="password"
                      value={settings.adminPin}
                      onChange={(e) => setSettings({ ...settings, adminPin: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl font-mono tracking-widest text-white ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-98 mt-4"
                  >
                    <span>تەڭشەكلەرنى ساقلاش</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================= TAB 8: PROMO BANNERS ================= */}
          {activeTab === 'banners' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header Card */}
              <div className={`p-5 sm:p-6 rounded-2xl ${themeClasses.card} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-amber-500/30 bg-gradient-to-r from-[#07192d] to-[#04101e]`}>
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-md shadow-amber-500/10">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span>باشبەت ئېلان تاختىسى ۋە سلايدېر تەڭشىكى</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {banners.length} ئېلان
                        </span>
                      </h2>
                      <p className={`text-xs ${themeClasses.subtext}`}>
                        باشبەتتىكى چوڭ تەشۋىقات ئېلانلىرىنىڭ رەسىمى، ماۋزۇسى، ھەرىكەتلىك بەلگىسى (Emoji) ۋە ئۇلانمىلىرىنى بۇ يەردىن خالىغانچە ئۆزگەرتىڭ.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleResetBanners}
                    className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                    title="ئەسلىدىكى كۆڭۈلدىكى ئېلانلارغا قايتۇرۇش"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ئەسلىگە قايتۇرۇش</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddBanner}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>يېڭى ئېلان قوشۇش</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className={`p-4 sm:p-5 rounded-2xl ${themeClasses.card} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">باشبەتتە كۆرۈنۈش ئەندىزىسى (Live Preview):</span>
                  </div>
                  <span className="text-[11px] text-slate-400">ساقلانغان ھامان دۇكان باشبىتىدە دەرھال كۈچكە ئىگە بولىدۇ</span>
                </div>

                {banners.length > 0 && (
                  <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-[#061424] max-h-56 sm:max-h-64 shadow-xl">
                    <img
                      src={banners[0]?.image}
                      alt="Banner Preview"
                      className="w-full h-48 sm:h-56 object-cover filter brightness-90"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-[#040d1a] via-[#040d1a]/80 to-transparent p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="gold-badge text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                          <span className="animate-moving-icon">
                            {getBannerFieldStr(banners[0]?.badge).match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖|📲|💳)/)?.[0] || '✨'}
                          </span>
                          <span>{getBannerFieldStr(banners[0]?.badge).replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖|📲|💳)\s*/, '') || getBannerFieldStr(banners[0]?.badge)}</span>
                        </span>
                        <span className="text-[10px] text-amber-200 font-bold bg-slate-900/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                          {getBannerFieldStr(banners[0]?.tag) || 'ئالاھىدە'}
                        </span>
                      </div>

                      <div className="max-w-md">
                        <h4 className="font-ukij font-bold text-base sm:text-xl text-white gold-text-glow leading-snug line-clamp-1">
                          {getBannerFieldStr(banners[0]?.title)}
                        </h4>
                        <p className="text-xs text-amber-100/80 line-clamp-1 mt-1">
                          {getBannerFieldStr(banners[0]?.subtitle)}
                        </p>
                        <div className="mt-3">
                          <span className="gold-shimmer-btn px-4 py-1.5 rounded-lg text-xs font-black inline-flex items-center gap-1">
                            <span>{getBannerFieldStr(banners[0]?.linkText) || 'سېتىۋېلىش ⚡'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Banners List Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">نۆۋەتتىكى بارلىق سلايدېر ئېلانلىرى ({banners.length} دانە):</h3>
                  <span className="text-xs text-slate-400">تەرتىپىنى يا ئوق كۇنۇپكىلىرى ئارقىلىق ئۆزگەرتەلەيسىز</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((b, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === banners.length - 1;
                    const title = getBannerFieldStr(b.title);
                    const subtitle = getBannerFieldStr(b.subtitle);
                    const badge = getBannerFieldStr(b.badge);
                    const tag = getBannerFieldStr(b.tag);
                    const linkText = getBannerFieldStr(b.linkText);

                    return (
                      <div
                        key={b.id || idx}
                        className={`p-4 rounded-2xl ${themeClasses.card} border ${
                          b.enabled !== false ? 'border-slate-800 hover:border-amber-400/50' : 'border-slate-800/40 opacity-60'
                        } transition flex flex-col justify-between gap-3 shadow-md relative group`}
                      >
                        {/* Top banner controls */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-xs text-slate-300 font-bold">
                              سەھىپە: <strong className="text-amber-400 font-mono">{b.category || 'games'}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Move Up */}
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMoveBanner(idx, 'up')}
                              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              title="ئۈستىگە يۆتكەش"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            {/* Move Down */}
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMoveBanner(idx, 'down')}
                              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              title="ئاستىغا يۆتكەش"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {/* Toggle Active */}
                            <button
                              type="button"
                              onClick={() => handleToggleBannerEnabled(b)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                b.enabled !== false
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {b.enabled !== false ? 'ئوچۇق' : 'يوشۇرۇن'}
                            </button>
                          </div>
                        </div>

                        {/* Banner preview content */}
                        <div className="flex gap-3 items-start">
                          <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 shadow">
                            <img
                              src={b.image}
                              alt={title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/logo.png';
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {badge && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-400/15 border border-amber-400/30 text-amber-300 px-2 py-0.2 rounded-md">
                                  <span className="animate-moving-icon">
                                    {badge.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖|📲|💳)/)?.[0] || '✨'}
                                  </span>
                                  <span>{badge.replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖|📲|💳)\s*/, '') || badge}</span>
                                </span>
                              )}
                              {tag && (
                                <span className="text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded-md border border-slate-700">
                                  {tag}
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 leading-snug">
                              {title}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                            كۇنۇپكا: {linkText}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBanner(b)}
                              className="px-3 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تەھرىرلەش</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBanner(b.id)}
                              className="p-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition cursor-pointer"
                              title="ئۆچۈرۈش"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: SYRIA4GAME EXTERNAL API ================= */}
          {activeTab === 'provider' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header Card */}
              <div className={`p-5 sm:p-6 rounded-2xl ${themeClasses.card} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-cyan-500/30 bg-gradient-to-r from-[#07192d] to-[#04101e]`}>
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        Sahl Cash (api.sahl-cash.com) API مەركىزى
                      </h2>
                      <p className={`text-xs ${themeClasses.subtext}`}>
                        رەسمىي ئويۇن پۇل قاچىلاش API سى، توپ سېتىۋېلىش قالدۇق پۇلى ۋە مەھسۇلات تىزىملىكى
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={checkProviderLive}
                    disabled={checkingProvider}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingProvider ? 'animate-spin' : ''}`} />
                    <span>{checkingProvider ? 'تەكشۈرۈۋاتىدۇ...' : 'API نى قايتا تەكشۈرۈش'}</span>
                  </button>

                  <button
                    onClick={() => fetchProviderProducts(false)}
                    disabled={loadingProducts}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{loadingProducts ? 'يۈكلىنىۋاتىدۇ...' : 'مەھسۇلاتلارنى ئوقۇش'}</span>
                  </button>
                </div>
              </div>

              {/* IP Whitelist Warning Alert */}
              {providerStatus?.isIpBlocked && (
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-200 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 font-bold text-lg shrink-0">
                        ⚠️
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Sahl Cash سىزنىڭ IP ئادرېسىڭىزنى چەكلىدى (IP not allowed - كود 123)</h4>
                        <p className="text-xs text-rose-300/90 font-alkatip">تەمىنلىگۈچى (Sahl Cash) تورىڭىزنىڭ ئاممىۋى IP ئادرېسى ئۆزگىرىپ كەتكەنلىكى ئۈچۈن ئۇلىنىشنى رەت قىلغان.</p>
                      </div>
                    </div>
                    {providerStatus?.serverPublicIp && providerStatus.serverPublicIp !== 'ئېنىقلانمىدى' && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(providerStatus.serverPublicIp!);
                          alert(`نۆۋەتتىكى مۇلازىمېتىر ئاممىۋى IP كۆچۈرۈلدى: ${providerStatus.serverPublicIp}`);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نۆۋەتتىكى IP نى كۆچۈرۈش ({providerStatus.serverPublicIp})</span>
                      </button>
                    )}
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/20 text-xs text-slate-300 space-y-2 font-alkatip">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>قايتا ئۈزۈلمەيدىغان قىلىش ئۇسۇللىرى (مەڭگۈلۈك ھەل قىلىش):</span>
                    </div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-[11px] leading-relaxed">
                      <li>
                        <strong className="text-cyan-300">1-ئۇسۇل (ھازىرلا تۈزىتىش):</strong> sahl-cash.com دىكى شەخسىي بەت → API تەڭشىكىگە كىرىپ، «IP Address» تۈرىنى <span className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded">پۈتۈنلەي بوش (قۇرۇق)</span> قويۇپ ياكى <span className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded">0.0.0.0</span> قىلىپ ساقلاپ سىناڭ.
                      </li>
                      <li>
                        <strong className="text-emerald-300">2-ئۇسۇل (ئەڭ ياخشى، ئۆمۈرلۈك ھەل قىلىش):</strong> Sahl Cash نىڭ WhatsApp/Telegram تېخنىكىلىق خېرىدارلار مۇلازىمىتىگە مۇنداق دەپ خەت يېزىڭ: <span className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded">«أرجو إلغاء قيد الآيبي IP restriction على حساب الـ API»</span> (API ھېساباتىمدىكى IP تەكشۈرۈش چەكلىمىسىنى بىكار قىلىپ بېرىڭلار). ئۇلار چەكلىمىنى ئېلىۋەتسە مەڭگۈ قايتا ئۈزۈلمەيدۇ.
                      </li>
                      <li>
                        <strong className="text-amber-300">3-ئۇسۇل (ۋاقىتلىق):</strong> ئەگەر چەكلىمىنى تېخى ئالمىغان بولسا، يۇقىرىدىكى قىزىل كۇنۇپكىنى بېسىپ نۆۋەتتىكى IP نى كۆچۈرۈۋېلىپ، Sahl Cash نىڭ API تەڭشىكىدىكى «IP Address» تۈرىگە چاپلاپ ساقلاڭ.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Status Overview 4 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Wholesale Balance */}
                <div className={`p-5 rounded-2xl ${themeClasses.card} border border-cyan-500/30`}>
                  <span className={`text-xs ${themeClasses.subtext} block mb-1`}>تەمىنلىگۈچى قالدۇق پۇلى</span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 mt-2" dir="ltr">
                    ${providerStatus?.balance !== undefined && providerStatus?.balance !== null ? formatSmartPrice(providerStatus.balance) : '---'}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                    پۇل بىرلىكى: {providerStatus?.currency || 'USD'}
                  </span>
                </div>

                {/* 2. Connection Status */}
                <div className={`p-5 rounded-2xl ${themeClasses.card} border ${
                  providerStatus?.success ? 'border-emerald-500/40' : 'border-rose-500/40'
                }`}>
                  <span className={`text-xs ${themeClasses.subtext} block mb-1`}>API ئۇلىنىش ھالىتى</span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${providerStatus?.success ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span className="text-base sm:text-lg font-bold text-white">
                      {providerStatus?.success ? 'نەق ئۇلاندى' : 'ئۇلانمىدى'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block truncate" title={providerStatus?.errorMessage}>
                    {providerStatus?.success
                      ? 'ھەقىقىي زاكازلار سۇپىغا ئەۋەتىلىدۇ'
                      : providerStatus?.errorMessage || 'Token ياكى IP نى قايتا تەكشۈرۈڭ'}
                  </span>
                </div>

                {/* 3. Server Outbound Public IP */}
                <div className={`p-5 rounded-2xl ${themeClasses.card} border ${
                  providerStatus?.isIpBlocked ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${themeClasses.subtext} block`}>مۇلازىمېتىر ئاممىۋى IP سى</span>
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-base sm:text-lg font-bold font-mono text-white mt-2 truncate" dir="ltr">
                    {providerStatus?.serverPublicIp || 'ئېنىقلانمىدى'}
                  </div>
                  {providerStatus?.serverPublicIp && providerStatus.serverPublicIp !== 'ئېنىقلانمىدى' ? (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(providerStatus.serverPublicIp!);
                        alert(`IP كۆچۈرۈلدى: ${providerStatus.serverPublicIp}`);
                      }}
                      className="mt-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-alkatip cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>IP نى كۆچۈرۈش</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 mt-1 block">تەكشۈرۈلمەكتە...</span>
                  )}
                </div>

                {/* 4. Account & Protocol Identity */}
                <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                  <span className={`text-xs ${themeClasses.subtext} block mb-1`}>تەمىنلىگۈچى تىپى & ئادرېسى</span>
                  <div className="text-base font-bold text-white mt-2">
                    {providerForm.apiType === 'syria4game'
                      ? 'Sahl Cash API'
                      : providerForm.apiType === 'smm'
                      ? 'Standard SMM Panel v2 API'
                      : 'خاس REST API'}
                  </div>
                  <span className="text-[11px] text-cyan-400 mt-1 block font-mono truncate" dir="ltr">
                    {providerForm.apiUrl || 'https://api.sahl-cash.com'}
                  </span>
                </div>
              </div>

              {/* Dynamic Provider Configuration Form */}
              <div className={`p-5 sm:p-6 rounded-2xl ${themeClasses.card} border border-cyan-500/40 shadow-xl space-y-4`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white font-alkatip">API تەمىنلىگۈچىنى ئالماشتۇرۇش ۋە بىۋاسىتە ئۇلاش</h3>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-mono">
                    Dynamic API Setup
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-alkatip leading-relaxed">
                  بۇ يەردە كود ئۆزگەرتمەي تۇرۇپلا تور بېتىڭىزنىڭ زاكازلىرىنى Sahl Cash (https://api.sahl-cash.com) سۇپىسىغا تولۇق ئۇلىيالايسىز. تۆۋەندىكى تەلەپلەرنى كىرگۈزۈپ «ساقلاش ۋە دەرھال ئۇلىنىشنى سىناش» كۇنۇپكىسىنى باسسىڭىز، سىستېما دەرھال نەق پۇل قالدۇقىنى تەكشۈرۈپ ئاپتوماتىك ئىشقا كىرىشتۈرىدۇ.
                </p>

                {providerFeedback && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      providerFeedback.success
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                    }`}
                  >
                    {providerFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{providerFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProviderConfig} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Provider Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                        API پىروتوكولى (Provider Type):
                      </label>
                      <select
                        value={providerForm.apiType}
                        onChange={(e) => setProviderForm({ ...providerForm, apiType: e.target.value as any })}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold ${themeClasses.input} focus:outline-none focus:border-cyan-400`}
                      >
                        <option value="syria4game" className="bg-slate-900 text-white">Sahl Cash API (https://api.sahl-cash.com)</option>
                        <option value="smm" className="bg-slate-900 text-white">Standard SMM / Top-Up Panel v2 API</option>
                        <option value="custom_rest" className="bg-slate-900 text-white">Custom REST API (خاس ئۇلىنىش)</option>
                      </select>
                    </div>

                    {/* API Enable Toggle */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                        ئاپتوماتىك زاكاز ئەۋەتىش ھالىتى:
                      </label>
                      <button
                        type="button"
                        onClick={() => setProviderForm({ ...providerForm, enabled: !providerForm.enabled })}
                        className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                          providerForm.enabled
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        <span>{providerForm.enabled ? 'ئاپتوماتىك ئۇلىنىش ئوچۇق (Active)' : 'ئۇلىنىش تاقالغان (Disabled)'}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${providerForm.enabled ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      </button>
                    </div>
                  </div>

                  {/* API Base URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                      API ئاساسىي ئادرېسى (Base URL):
                    </label>
                    <input
                      type="text"
                      value={providerForm.apiUrl}
                      onChange={(e) => setProviderForm({ ...providerForm, apiUrl: e.target.value })}
                      placeholder="https://api.sahl-cash.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs ${themeClasses.input} focus:outline-none focus:border-cyan-400`}
                      dir="ltr"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      نۆۋەتتىكى ئادرېس: https://api.sahl-cash.com
                    </span>
                  </div>

                  {/* API Key / Token */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-amber-300 font-alkatip">
                        API ئاچقۇچى (API Token / Key):
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
                      >
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPin ? 'يوشۇرۇش' : 'كۆرسىتىش (ئېنىق كۆرۈش)'}</span>
                      </button>
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={providerForm.apiKey}
                      onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                      placeholder={providerStatus?.config?.hasRealKey ? `ھازىر ئاچقۇچ ساقلانغان (${providerStatus.config.providerApiKey})، ئۆزگەرتمەكچى بولسىڭىز يېڭىسىنى كىرگۈزۈڭ` : 'يېڭى API Token نى بۇ يەرگە چاپلاڭ'}
                      className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs tracking-wider text-white ${themeClasses.input} focus:outline-none focus:border-cyan-400`}
                      dir="ltr"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      باشقىلار سىزگە بەرگەن مەخپىي API Key ياكى Token نى مۇشۇ يەرگە كىرگۈزۈڭ.
                    </span>
                  </div>

                  {/* Optional API Secret / Extra identifier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                      قوشۇمچە مەخپىي پارول ياكى خېرىدار ID (ئەگەر كېرەك بولسا - Optional Secret):
                    </label>
                    <input
                      type="text"
                      value={providerForm.apiSecret}
                      onChange={(e) => setProviderForm({ ...providerForm, apiSecret: e.target.value })}
                      placeholder="ئەگەر تەمىنلىگۈچى تەلەپ قىلسا كىرگۈزۈڭ، بولمىسا بوش قالدۇرۇڭ"
                      className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs ${themeClasses.input} focus:outline-none focus:border-cyan-400`}
                      dir="ltr"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingProvider}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${savingProvider ? 'animate-spin' : ''}`} />
                      <span>{savingProvider ? 'تەڭشەك ساقلىنىۋاتىدۇ ھەم ئۇلىنىش سىنىلىۋاتىدۇ...' : 'ساقلاش ۋە دەرھال ئۇلىنىشنى سىناش (Save & Test Live Connection)'}</span>
                    </button>
                  </div>
                </form>
              </div>

              <ProviderCatalogPanel themeClasses={themeClasses} />

              {/* API Endpoints Status Table */}
              <div className={`p-5 rounded-2xl ${themeClasses.card} space-y-4`}>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>تەمىنلىگۈچى API ئېغىزلىرى سەپلىمىسى</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className={`border-b ${themeClasses.tableHead}`}>
                        <th className="p-3">ئېغىز نامى</th>
                        <th className="p-3">ئادرېس (Endpoint)</th>
                        <th className="p-3">دەلىللەش (Auth)</th>
                        <th className="p-3">مەقسىتى</th>
                        <th className="p-3">ھالىتى</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="p-3 font-bold text-white">Profile & Balance</td>
                        <td className="p-3 font-mono text-cyan-300" dir="ltr">GET /client/api/profile</td>
                        <td className="p-3 font-mono text-slate-400" dir="ltr">api-token</td>
                        <td className="p-3 text-slate-300">قالدۇق پۇل تەكشۈرۈش</td>
                        <td className="p-3 text-emerald-400 font-bold">تەييار (Active)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Products Catalog</td>
                        <td className="p-3 font-mono text-cyan-300" dir="ltr">GET /client/api/products</td>
                        <td className="p-3 font-mono text-slate-400" dir="ltr">api-token</td>
                        <td className="p-3 text-slate-300">مەھسۇلات تىزىملىكى</td>
                        <td className="p-3 text-emerald-400 font-bold">تەييار (Active)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">New Top-up Order</td>
                        <td className="p-3 font-mono text-cyan-300" dir="ltr">GET /client/api/newOrder/{'{id}'}/params?qty=&amp;order_uuid=&amp;…</td>
                        <td className="p-3 font-mono text-slate-400" dir="ltr">order_uuid (v4)</td>
                        <td className="p-3 text-slate-300">ئويۇنچىغا پۇل قاچىلاش</td>
                        <td className="p-3 text-emerald-400 font-bold">تەييار (Active)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Check Order Status</td>
                        <td className="p-3 font-mono text-cyan-300" dir="ltr">GET /client/api/check?orders=[ID]</td>
                        <td className="p-3 font-mono text-slate-400" dir="ltr">api-token</td>
                        <td className="p-3 text-slate-300">زاكاز ھالىتىنى تەكشۈرۈش</td>
                        <td className="p-3 text-emerald-400 font-bold">تەييار (Active)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Syria4game Live Products List (if fetched) */}
              {providerProducts.length > 0 && (
                <div className={`p-5 rounded-2xl ${themeClasses.card} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-cyan-400" />
                      <span>Sahl Cash مەھسۇلات تىزىملىكى ({providerProducts.length} تال)</span>
                    </h3>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-xs text-right">
                      <thead>
                        <tr className={`border-b ${themeClasses.tableHead}`}>
                          <th className="p-3">Product ID</th>
                          <th className="p-3">مەھسۇلات نامى</th>
                          <th className="p-3">باھاسى</th>
                          <th className="p-3">سەھىپە</th>
                          <th className="p-3 text-center">باشبەتكە چىقىرىش</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {providerProducts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-3 font-mono text-amber-400 font-bold" dir="ltr">#{p.id}</td>
                            <td className="p-3 font-bold text-white">{p.name}</td>
                            <td className="p-3 font-mono text-cyan-400" dir="ltr">${Number(p.costPrice ?? p.price ?? 0)}</td>
                            <td className="p-3 text-slate-400">{p.categoryName || p.category || '—'}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleImportSpecificProduct(p)}
                                className="px-3 py-1.5 rounded-xl gold-shimmer-btn text-slate-950 text-xs font-black transition cursor-pointer shadow hover:scale-105 inline-flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>باشبەتكە چىقىرىش</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ================= 3. PRODUCT / SERVICE ADD/EDIT MODAL ================= */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg ${themeClasses.card} rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-alkatip`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-ukij font-bold text-sm text-white">
                {editingService ? 'مەھسۇلاتنى تەھرىرلەش' : 'يېڭى مەھسۇلات قوشۇش'}
              </h3>
              <button
                onClick={() => setServiceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">مەھسۇلات نامى:</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="مەسىلەن: Honor of king ياكى Netflix..."
                  className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-bold">سەھىپىسى:</label>
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ يېڭى سەھىپە</span>
                    </button>
                  </div>
                  <select
                    value={serviceForm.category}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        category: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 font-bold`}
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-bold">بەلگە خېتى (Badge):</label>
                    {serviceForm.badge && (
                      <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1 font-bold">
                        <span className="animate-moving-icon">{serviceForm.badge.match(/^[^\w\s\u0600-\u06FF]/)?.[0] || '⚡'}</span>
                        <span>{serviceForm.badge}</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={serviceForm.badge}
                    onChange={(e) => setServiceForm({ ...serviceForm, badge: e.target.value })}
                    placeholder="مەسىلەن: ⚡ ئاپتوماتىك ياكى 🔥 ئەڭ قىزىق..."
                    className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 font-bold`}
                  />
                </div>
              </div>

              {/* Animated Moving Badges Picker for Service */}
              <div className="p-3 rounded-2xl bg-black/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <span className="animate-moving-icon">✨</span>
                    <span>ھەرىكەتلىك بەلگىلەر (بىر چېكىپلا تاللاش):</span>
                  </span>
                  {serviceForm.badge && (
                    <button
                      type="button"
                      onClick={() => setServiceForm({ ...serviceForm, badge: '' })}
                      className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      بەلگىنى ئۆچۈرۈش
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ANIMATED_BADGE_PRESETS.map((item) => {
                    const isSelected = serviceForm.badge === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, badge: isSelected ? '' : item.label })}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-amber-400/20 scale-105'
                            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <span className="animate-moving-icon">{item.icon}</span>
                        <span>{item.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Image Editor (Preview + File Upload + Popular Presets + URL) */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <span>🖼️ مەھسۇلات رەسىمىنى تەھرىرلەش:</span>
                  </label>
                  {serviceForm.image && (
                    <button
                      type="button"
                      onClick={() => setServiceForm({ ...serviceForm, image: '' })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                    >
                      ✕ رەسىمنى چىقىرىۋېتىش
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  {/* Live Preview Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-amber-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-md relative group">
                    {serviceForm.image ? (
                      <img
                        src={serviceForm.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                    ) : (
                      <Package className="w-8 h-8 text-cyan-400" />
                    )}
                  </div>

                  {/* File Upload Button & URL input */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold text-xs cursor-pointer shadow-sm flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>📁 تېلېفون / كومپيۇتېردىن رەسىم يۈكلەش</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleServiceImageFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">ياكى ئاستىغا تور ئادرېسىنى كىرگۈزۈڭ:</span>
                    </div>

                    <input
                      type="text"
                      value={serviceForm.image}
                      onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })}
                      placeholder="https://... ياكى /images/services/pubg_mobile.jpg"
                      className={`w-full px-3 py-1.5 rounded-xl font-mono text-[11px] ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Popular 1-Click Game & App Image Presets */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>تەييار رەسىملەردىن بىر چېكىپلا تاللاش:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    {[
                      { name: 'PUBG', url: '/images/services/pubg_mobile.jpg' },
                      { name: 'Free Fire', url: '/images/services/free_fire.jpg' },
                      { name: 'Blood Strike', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80' },
                      { name: 'TikTok', url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=80' },
                      { name: 'Telegram', url: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=500&auto=format&fit=crop&q=80' },
                      { name: 'ChatGPT', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&auto=format&fit=crop&q=80' },
                      { name: 'Netflix', url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&auto=format&fit=crop&q=80' },
                      { name: 'Roblox', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80' },
                      { name: 'Brawl Stars', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80' },
                      { name: 'Clash of Clans', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, image: preset.url })}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                          serviceForm.image === preset.url
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-amber-400/40'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Account / UID & Zone ID Settings */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <span>🎮 خېرىداردىن كىملىك سورايدىغان كۆزنەك تەڭشىكى:</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-amber-300 font-bold">
                    <input
                      type="checkbox"
                      checked={serviceForm.requiresZoneId}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          requiresZoneId: e.target.checked,
                          zoneIdLabel: e.target.checked ? (serviceForm.zoneIdLabel || 'رايون كودى (Zone ID)') : serviceForm.zoneIdLabel,
                        })
                      }
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                    <span>رايون كودى (Zone ID) تەلەپ قىلسۇن</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">ئاساسىي كىملىك خېتى (UID Label):</label>
                    <input
                      type="text"
                      value={serviceForm.inputLabel}
                      onChange={(e) => setServiceForm({ ...serviceForm, inputLabel: e.target.value })}
                      placeholder="مەسىلەن: ئويۇنچى ID (Player ID)..."
                      className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">ئەسكەرتىش خېتى (Placeholder):</label>
                    <input
                      type="text"
                      value={serviceForm.inputPlaceholder}
                      onChange={(e) => setServiceForm({ ...serviceForm, inputPlaceholder: e.target.value })}
                      placeholder="مەسىلەن: 51234567"
                      className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs`}
                    />
                  </div>
                </div>

                {serviceForm.requiresZoneId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 animate-in fade-in">
                    <div>
                      <label className="block text-amber-300 text-[11px] mb-1 font-bold">رايون نومۇرى خېتى (Zone ID Label):</label>
                      <input
                        type="text"
                        value={serviceForm.zoneIdLabel}
                        onChange={(e) => setServiceForm({ ...serviceForm, zoneIdLabel: e.target.value })}
                        placeholder="مەسىلەن: رايون كودى (Zone ID)"
                        className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs`}
                      />
                    </div>
                    <div>
                      <label className="block text-amber-300 text-[11px] mb-1 font-bold">رايون كودى كىرگۈزۈش ئەسكەرتىشى:</label>
                      <input
                        type="text"
                        value={serviceForm.zoneIdPlaceholder}
                        onChange={(e) => setServiceForm({ ...serviceForm, zoneIdPlaceholder: e.target.value })}
                        placeholder="مەسىلەن: 1234"
                        className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Package Management Section */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-slate-200 font-bold">بولاقلار ۋە باھالار (Packages & Prices):</label>
                    <span className="text-[10px] text-slate-400">بۇ مەھسۇلاتنىڭ باھالىرى ۋە ئوخشىمىغان بولاقلىرى</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPackageRow}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ يېڭى بولاق قوشۇش</span>
                  </button>
                </div>

                {/* Auto Percentage Markup Toolbar */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-900 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>پىرسەنت بويىچە ئەسلى باھادىن ئاپتوماتىك باھا قوشۇش (% Markup):</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      بىر چېكىپلا بارلىق بولاقلارغا ئاپتوماتىك باھا قوشىدۇ
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[10, 15, 20, 25, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleApplyServiceBulkMarkup(pct)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          serviceMarkupPercent === pct
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                            : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        +{pct}% {pct === 20 ? '(تەۋسىيە)' : ''}
                      </button>
                    ))}

                    <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700">
                      <span className="text-[11px] text-slate-400 font-bold">ئىختىيارى:</span>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={serviceMarkupPercent}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setServiceMarkupPercent(val);
                          handleApplyServiceBulkMarkup(val);
                        }}
                        className="w-12 bg-transparent text-amber-400 font-bold font-mono text-xs focus:outline-none text-center"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-amber-400 font-bold">%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyServiceBulkMarkup(serviceMarkupPercent)}
                      className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
                      title="ھازىرقى پىرسەنتنى بارلىق بولاقلارغا يۈرگۈزۈش"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ھەممىسىگە قوشۇش</span>
                    </button>
                  </div>
                </div>

                {/* Column Headers */}
                <div className="hidden sm:flex items-center gap-2 px-3 text-[10px] font-bold text-slate-400">
                  <div className="flex-1">بولاق نامى (Package Title)</div>
                  <div className="w-24 text-center">ئەسلى باھا $ (Base)</div>
                  <div className="w-24 text-center text-amber-400 font-black">سېتىش باھاسى $ (Sell)</div>
                  <div className="w-14 text-center text-emerald-400">پايدا %</div>
                  <div className="w-7 text-center"></div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {serviceForm.packages.map((pkg, pIdx) => {
                    const baseCost = Number(pkg.costPrice) || Number(pkg.price) || 0;
                    const sellPrice = Number(pkg.price) || 0;
                    const diffPct = baseCost > 0 ? Math.round(((sellPrice - baseCost) / baseCost) * 100) : 0;

                    return (
                      <div
                        key={pkg.id || pIdx}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            required
                            value={pkg.title}
                            onChange={(e) => handleUpdatePackageRow(pIdx, 'title', e.target.value)}
                            placeholder="مەسىلەن: 60 UC ياكى 1 ئايلىق..."
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Base / Cost Price Input */}
                          <div className="relative w-24" title="ئەسلى تەننەرخ ياكى بازا باھا">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pkg.costPrice ?? pkg.price ?? ''}
                              onChange={(e) => handleBasePriceChange(pIdx, Number(e.target.value) || 0)}
                              placeholder="ئەسلى $"
                              className={`w-full px-2 py-1.5 rounded-lg text-xs font-mono text-slate-300 ${themeClasses.input} focus:outline-none focus:border-cyan-400 text-center`}
                            />
                          </div>

                          {/* Final Selling Price Input (Marked up) */}
                          <div className="relative w-24" title="دۇكاندا خېرىدارلار كۆرىدىغان ۋە تۆلەيدىغان ئاخىرقى سېتىلىش باھاسى">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              required
                              value={pkg.price}
                              onChange={(e) => handleSellPriceChange(pIdx, Number(e.target.value) || 0)}
                              placeholder="سېتىش $"
                              className={`w-full px-2 py-1.5 rounded-lg text-xs font-mono font-bold text-amber-400 ${themeClasses.input} focus:outline-none focus:border-amber-400 text-center`}
                            />
                          </div>

                          {/* Markup Indicator Tag */}
                          <div className="w-14 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                                diffPct > 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : diffPct < 0
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePackageRow(pIdx)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition cursor-pointer"
                            title="بۇ بولاقنى ئۆچۈرۈش"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product Bio & Instructions (تەرجىمىھال ۋە كۆرسەتمە) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-amber-300 font-bold text-xs flex items-center gap-1.5">
                      <span>📖 تەرجىمىھال سۆزى ۋە مەشغۇلات كۆرسەتمىسى:</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      خېرىدارلار سېتىۋېلىش كۆزنىكىدە كۆرىدىغان تەپسىلىي بايان ياكى كۆرسەتمە
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const autoBio = getServiceDefaultBio(serviceForm.name, serviceForm.category);
                      setServiceForm((prev) => ({ ...prev, bioContent: autoBio }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                    title="ئويۇن ياكى ئەپكە ئائىت تەييار ئۆلچەملىك كۆرسەتمىنى ئاپتوماتىك كىرگۈزىدۇ"
                  >
                    <span>✨ ئاپتوماتىك تولدۇرۇش</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={serviceForm.bioContent}
                  onChange={(e) => setServiceForm({ ...serviceForm, bioContent: e.target.value })}
                  placeholder="مەسىلەن: ئويۇندىكى تەگلىكتىن UID ۋە Zone ID نى ئايرىم كىرگۈزۈڭ..."
                  className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs leading-relaxed`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">قىسقىچە تۈشەندۈرۈشى:</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, description: e.target.value })
                  }
                  placeholder="بۇ مۇلازىمەت ھەققىدە قىسقىچە..."
                  className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                />
              </div>

              {/* Homepage Visibility Toggle */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs block">باشبەتتە نەق كۆرسىتىش (ئېلان قىلىش):</span>
                  <span className="text-[11px] text-slate-400">بۇ تاللانسا، ساقلاش كۇنۇپكىسىنى باسقان ھامانلا باشبەتتە نەق چىقىدۇ</span>
                </div>
                <input
                  type="checkbox"
                  checked={serviceForm.published !== false}
                  onChange={(e) => setServiceForm({ ...serviceForm, published: e.target.checked })}
                  className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>💾 ساقلاش ۋە دەرھال باشبەتتە كۆرسىتىش</span>
                </button>
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition hover:bg-slate-700 cursor-pointer"
                >
                  بىكار قىلىش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 3.4 SAHL CASH PRODUCT IMPORTER & CUSTOMIZER MODAL ================= */}
      {sahlCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-4xl ${themeClasses.card} rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto font-alkatip border border-cyan-500/40`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                  <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-ukij font-bold text-base text-white">
                    Sahl Cash تىن مەھسۇلات تاللاش ۋە باشبەتكە چىقىرىش
                  </h3>
                  <p className={`text-xs ${themeClasses.subtext}`}>
                    مەھسۇلاتلار بارلىق بولاقلىرى بىلەن تەييارلاندى. سەھىپە بويىچە تاللاپ ياكى ئىزدەپ، بىر چېكىش بىلەنلا باشبەتكە چىقىرىڭ.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSahlCashModalOpen(false);
                  setSelectedSahlGroup(null);
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If NO service is selected yet: Show Categories Filter + Search + Services Grid */}
            {!selectedSahlGroup ? (
              <div className="space-y-4">
                {/* Search Bar & Stats */}
                <div className="p-4 rounded-2xl bg-[#06172a] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Search className="w-4 h-4" />
                      <span>مەھسۇلات ياكى بولاق نامىنى ئىزدەڭ:</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      جەمئىي مۇلازىمەت: {filteredGroupedServices.length} خىل (بولاقلار بىلەن بىرگە)
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={sahlSearch}
                      onChange={(e) => setSahlSearch(e.target.value)}
                      placeholder="مەسىلەن: PUBG, Free Fire, Blood Strike, Brawl Stars, ChatGPT, TikTok, Steam, Google Play..."
                      className={`w-full pr-10 pl-3.5 py-2.5 rounded-xl text-xs font-bold ${themeClasses.input} focus:outline-none focus:border-cyan-400`}
                    />
                    {sahlSearch && (
                      <button
                        type="button"
                        onClick={() => setSahlSearch('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Filter Pills (Dynamically loaded from categoriesList) */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setSahlCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        sahlCategoryFilter === 'all'
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                          : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                      }`}
                    >
                      <span>🌟 بارلىق تۈرلەر</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${sahlCategoryFilter === 'all' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                        {groupedSahlServices.length}
                      </span>
                    </button>
                    {categoriesList.map((cat) => {
                      const isActive = sahlCategoryFilter === cat.id;
                      const count = groupedSahlServices.filter((s) => s.category === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSahlCategoryFilter(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                          }`}
                        >
                          <span className="animate-moving-icon">
                            <DynamicIcon name={cat.icon || 'Package'} className="w-3.5 h-3.5" />
                          </span>
                          <span>{cat.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick popular search chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
                    <span className="text-slate-400 shrink-0">تېز ئىزدەش:</span>
                    {['PUBG Mobile', 'Free Fire', 'Blood strike', 'Brawl Stars', 'Clash of Clans', 'ChatGPT', 'TikTok', 'Steam', 'Google Play', 'تطبيق الارقام'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setSahlSearch(chip)}
                        className="px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 transition cursor-pointer shrink-0"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grouped Services Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                    <span>مۇلازىمەت تۈرلىرى ({filteredGroupedServices.length} تال):</span>
                    <span className="text-slate-400 text-[11px]">بىرنى تاللىسىڭىز پۈتۈن بولاقلىرى بىلەن تەڭشەش بۆلىكى ئېچىلىدۇ</span>
                  </div>

                  {loadingProducts ? (
                    <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                      <span>Sahl Cash تىن مەھسۇلاتلار يۈكلىنىۋاتىدۇ...</span>
                    </div>
                  ) : filteredGroupedServices.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                      مەھسۇلات تېپىلمىدى. يۇقىرىدىن نام ياكى باشقا سەھىپىنى تاللاڭ.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[52vh] overflow-y-auto p-1">
                      {filteredGroupedServices.map((service) => {
                        const isImported = services.some((s) => s.name.toLowerCase().includes(service.name.toLowerCase()) || s.name.toLowerCase().includes(service.uyghurName.toLowerCase()));
                        return (
                          <div
                            key={service.key}
                            onClick={() => handleSelectSahlGroup(service)}
                            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800/60 transition cursor-pointer flex flex-col justify-between gap-3 group relative shadow-md hover:shadow-cyan-500/10"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shrink-0 shadow">
                                <img
                                  src={service.image}
                                  alt={service.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-sm text-white truncate" dir="ltr">
                                    {service.name}
                                  </h4>
                                </div>
                                {service.uyghurName && service.uyghurName !== service.name && (
                                  <span className="text-[11px] text-amber-300 block truncate mt-0.5">
                                    {service.uyghurName}
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold text-[10px]">
                                    📦 {service.packages.length} بولاق
                                  </span>
                                  {isImported && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                      ✓ باشبەتتە بار
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-mono" dir="ltr">
                                ${service.minCost.toFixed(2)} - ${service.maxCost.toFixed(2)}
                              </span>
                              <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-[-2px] transition">
                                <span>تاللاش</span>
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Customization Form with ALL Packages & Bulk Markup */
              <form onSubmit={handleSaveSahlProduct} className="space-y-4 animate-in fade-in duration-200">
                {/* Back button & Selected Service Banner */}
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 shadow">
                      <img
                        src={sahlForm.image}
                        alt="Service"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base" dir="ltr">{selectedSahlGroup.name}</span>
                        {selectedSahlGroup.uyghurName && selectedSahlGroup.uyghurName !== selectedSahlGroup.name && (
                          <span className="text-amber-300 text-xs">({selectedSahlGroup.uyghurName})</span>
                        )}
                      </div>
                      <span className="text-xs text-amber-300 block mt-0.5">
                        جەمئىي {sahlForm.packages.length} بولاق تەييارلاندى · تاللانغىنى: {sahlForm.packages.filter((p) => p.selected).length} بولاق
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSahlGroup(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>← باشقا مەھسۇلاتنى تاللاش</span>
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Custom Uyghur / Store Name */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      باشبەتتىكى مەھسۇلات نامى (ئۆزگەرتىپ ئۇيغۇرچە يازسىڭىز بولىدۇ):
                    </label>
                    <input
                      type="text"
                      required
                      value={sahlForm.name}
                      onChange={(e) => setSahlForm({ ...sahlForm, name: e.target.value })}
                      placeholder="مەسىلەن: پابجى كۆچمە (PUBG Mobile)"
                      className={`w-full px-3.5 py-2.5 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-white font-bold`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Category */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-300 font-bold">سەھىپە تۈرى:</label>
                        <button
                          type="button"
                          onClick={handleOpenAddCategory}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ يېڭى سەھىپە</span>
                        </button>
                      </div>
                      <select
                        value={sahlForm.category}
                        onChange={(e) => setSahlForm({ ...sahlForm, category: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 font-bold`}
                      >
                        {categoriesList.map((c) => (
                          <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                            {c.name} ({c.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Badge */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-300 font-bold">بەلگە (Badge):</label>
                        {sahlForm.badge && (
                          <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1 font-bold">
                            <span className="animate-moving-icon">{sahlForm.badge.match(/^[^\w\s\u0600-\u06FF]/)?.[0] || '⚡'}</span>
                            <span>{sahlForm.badge}</span>
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={sahlForm.badge}
                        onChange={(e) => setSahlForm({ ...sahlForm, badge: e.target.value })}
                        placeholder="مەسىلەن: ⚡ ئاپتوماتىك ياكى ئەڭ ياخشى سېتىلغان"
                        className={`w-full px-3.5 py-2.5 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 font-bold`}
                      />
                    </div>
                  </div>

                  {/* Animated Moving Badges Picker for Sahl Modal */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                        <span className="animate-moving-icon">✨</span>
                        <span>ھەرىكەتلىك بەلگىلەر (بىر چېكىپلا تاللاش):</span>
                      </span>
                      {sahlForm.badge && (
                        <button
                          type="button"
                          onClick={() => setSahlForm({ ...sahlForm, badge: '' })}
                          className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          بەلگىنى ئۆچۈرۈش
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ANIMATED_BADGE_PRESETS.map((item) => {
                        const isSelected = sahlForm.badge === item.label;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setSahlForm({ ...sahlForm, badge: isSelected ? '' : item.label })}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-amber-400/20 scale-105'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600'
                            }`}
                          >
                            <span className="animate-moving-icon">{item.icon}</span>
                            <span>{item.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Image URL & Live Preview */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      مەھسۇلات رەسىم ئۇلانمىسى (Image URL):
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-md">
                        {sahlForm.image ? (
                          <img
                            src={sahlForm.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/logo.png';
                            }}
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={sahlForm.image}
                          onChange={(e) => setSahlForm({ ...sahlForm, image: e.target.value })}
                          placeholder="https://... ياكى /images/services/pubg_mobile.jpg"
                          className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 font-mono text-xs`}
                          dir="ltr"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          <span className="text-slate-400">تەييار رەسىملەر:</span>
                          <button
                            type="button"
                            onClick={() => setSahlForm({ ...sahlForm, image: '/images/services/pubg_mobile.jpg' })}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
                          >
                            PUBG
                          </button>
                          <button
                            type="button"
                            onClick={() => setSahlForm({ ...sahlForm, image: '/images/services/free_fire.jpg' })}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
                          >
                            Free Fire
                          </button>
                          <button
                            type="button"
                            onClick={() => setSahlForm({ ...sahlForm, image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=500&auto=format&fit=crop&q=80' })}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
                          >
                            Telegram
                          </button>
                          <button
                            type="button"
                            onClick={() => setSahlForm({ ...sahlForm, image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=80' })}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
                          >
                            TikTok
                          </button>
                          <button
                            type="button"
                            onClick={() => setSahlForm({ ...sahlForm, image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&auto=format&fit=crop&q=80' })}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
                          >
                            ChatGPT
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">مەھسۇلات چۈشەندۈرۈشى:</label>
                    <textarea
                      rows={2}
                      value={sahlForm.description}
                      onChange={(e) => setSahlForm({ ...sahlForm, description: e.target.value })}
                      placeholder="خېرىدارلار كۆرىدىغان مەھسۇلات تەپسىلاتى..."
                      className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                    />
                  </div>

                  {/* ⚡ Universal Bulk Profit Markup Bar */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span>بارلىق بولاقلارنىڭ پايدا نىسبىتى (% Markup):</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        بۇ نىسبەت تۆۋەندىكى بارلىق {sahlForm.packages.length} بولاقنىڭ سېتىش باھاسىغا بىرلا ۋاقىتتا قوللىنىلىدۇ
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                        <span className="text-slate-400 font-bold text-xs">%</span>
                        <input
                          type="number"
                          step="1"
                          value={sahlBulkMarkup}
                          onChange={(e) => handleApplyBulkMarkup(Number(e.target.value) || 0)}
                          className="w-16 bg-transparent text-amber-400 font-bold font-mono text-sm focus:outline-none"
                          dir="ltr"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[10, 15, 20, 25, 30, 50].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleApplyBulkMarkup(pct)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              sahlBulkMarkup === pct
                                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            +{pct}% {pct === 15 ? '(تەۋسىيە)' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 📦 All Packages Management Table */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white text-xs">
                          بارلىق بولاقلار تىزىملىكى ({sahlForm.packages.filter((p) => p.selected).length} / {sahlForm.packages.length} تاللانغان)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleToggleAllPackages(true)}
                          className="text-cyan-400 hover:underline cursor-pointer"
                        >
                          ھەممىسىنى تاللاش
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAllPackages(false)}
                          className="text-slate-400 hover:underline cursor-pointer"
                        >
                          تاللاشنى بىكار قىلىش
                        </button>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {sahlForm.packages.map((pkg) => {
                        const profit = Math.round((pkg.sellPrice - pkg.costPrice) * 100) / 100;
                        const profitPct = pkg.costPrice > 0 ? Math.round(((pkg.sellPrice - pkg.costPrice) / pkg.costPrice) * 100) : 0;
                        return (
                          <div
                            key={pkg.id}
                            className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap ${
                              pkg.selected
                                ? 'bg-slate-900/90 border-slate-700'
                                : 'bg-slate-950/50 border-slate-850 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                              <input
                                type="checkbox"
                                checked={pkg.selected}
                                onChange={() => handleTogglePackage(pkg.id)}
                                className="w-4 h-4 accent-amber-400 rounded cursor-pointer shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={pkg.title}
                                  onChange={(e) => handlePackageTitleChange(pkg.id, e.target.value)}
                                  className="w-full bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                                  placeholder="بولاق نامى"
                                />
                                <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate" dir="ltr">
                                  #{pkg.id} · {pkg.originalName}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {/* Cost price */}
                              <div className="text-left font-mono" dir="ltr">
                                <span className="text-[10px] text-slate-400 block">تەننەرخ:</span>
                                <span className="text-cyan-400 font-bold text-xs">${pkg.costPrice}</span>
                              </div>

                              {/* Sell price input */}
                              <div className="text-left" dir="ltr">
                                <span className="text-[10px] text-amber-300 font-bold block">سېتىش ($):</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pkg.sellPrice}
                                  onChange={(e) => handlePackagePriceChange(pkg.id, Number(e.target.value) || 0)}
                                  className="w-20 bg-slate-950 px-2 py-1 rounded-lg border border-amber-500/40 text-amber-300 font-bold font-mono text-xs focus:outline-none focus:border-amber-400 text-center"
                                />
                              </div>

                              {/* Net Profit badge */}
                              <div className="text-left font-mono" dir="ltr">
                                <span className="text-[10px] text-emerald-400 block">ساپ پايدا:</span>
                                <span className={`text-[11px] font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  +${profit} ({profitPct}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Account / UID & Zone ID Settings */}
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-200 font-bold text-xs flex items-center gap-1.5">
                        <span>🎮 خېرىداردىن كىملىك سورايدىغان كۆزنەك تەڭشىكى:</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-amber-300 font-bold">
                        <input
                          type="checkbox"
                          checked={sahlForm.requiresZoneId}
                          onChange={(e) =>
                            setSahlForm({
                              ...sahlForm,
                              requiresZoneId: e.target.checked,
                              zoneIdLabel: e.target.checked ? (sahlForm.zoneIdLabel || 'رايون كودى (Zone ID)') : sahlForm.zoneIdLabel,
                            })
                          }
                          className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                        />
                        <span>رايون كودى (Zone ID) تەلەپ قىلسۇن</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">ئاساسىي كىملىك خېتى (UID Label):</label>
                        <input
                          type="text"
                          value={sahlForm.inputLabel}
                          onChange={(e) => setSahlForm({ ...sahlForm, inputLabel: e.target.value })}
                          placeholder="مەسىلەن: ئويۇنچى ID (Player ID)"
                          className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs`}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">ئەسكەرتىش كىرگۈزۈش سۆزى (Placeholder):</label>
                        <input
                          type="text"
                          value={sahlForm.inputPlaceholder}
                          onChange={(e) => setSahlForm({ ...sahlForm, inputPlaceholder: e.target.value })}
                          placeholder="مەسىلەن: 51234567"
                          className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs`}
                        />
                      </div>
                    </div>

                    {sahlForm.requiresZoneId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 animate-in fade-in">
                        <div>
                          <label className="block text-amber-300 text-[11px] mb-1 font-bold">رايون نومۇرى خېتى (Zone ID Label):</label>
                          <input
                            type="text"
                            value={sahlForm.zoneIdLabel}
                            onChange={(e) => setSahlForm({ ...sahlForm, zoneIdLabel: e.target.value })}
                            placeholder="مەسىلەن: رايون كودى (Zone ID)"
                            className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs`}
                          />
                        </div>
                        <div>
                          <label className="block text-amber-300 text-[11px] mb-1 font-bold">رايون كودى كىرگۈزۈش ئەسكەرتىشى:</label>
                          <input
                            type="text"
                            value={sahlForm.zoneIdPlaceholder}
                            onChange={(e) => setSahlForm({ ...sahlForm, zoneIdPlaceholder: e.target.value })}
                            placeholder="مەسىلەن: 1234"
                            className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Bio & Instructions (تەرجىمىھال ۋە كۆرسەتمە) */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-amber-300 font-bold text-xs flex items-center gap-1.5">
                          <span>📖 تەرجىمىھال سۆزى ۋە مەشغۇلات كۆرسەتمىسى:</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          خېرىدارلار سېتىۋېلىش كۆزنىكىدە كۆرىدىغان تەپسىلىي بايان ياكى كۆرسەتمە
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const autoBio = getServiceDefaultBio(sahlForm.name, sahlForm.category);
                          setSahlForm((prev) => ({ ...prev, bioContent: autoBio }));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                        title="ئويۇن ياكى ئەپكە ئائىت تەييار ئۆلچەملىك كۆرسەتمىنى ئاپتوماتىك كىرگۈزىدۇ"
                      >
                        <span>✨ ئاپتوماتىك تولدۇرۇش</span>
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={sahlForm.bioContent}
                      onChange={(e) => setSahlForm({ ...sahlForm, bioContent: e.target.value })}
                      placeholder="مەسىلەن: ئويۇندىكى تەگلىكتىن UID ۋە Zone ID نى كىرگۈزۈڭ..."
                      className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 text-xs leading-relaxed`}
                    />
                  </div>

                  {/* Homepage Publish Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">باشبەتتە نەق كۆرسىتىش (ئېلان قىلىش):</span>
                      <span className="text-[11px] text-slate-400">ساقلىغاندىن كېيىن دەرھال ماگىزىن باشبېتىدە نەق كۆرۈنىدۇ</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={sahlForm.published}
                      onChange={(e) => setSahlForm({ ...sahlForm, published: e.target.checked })}
                      className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={savingSahlProduct || sahlForm.packages.filter((p) => p.selected).length === 0}
                    className="flex-1 py-3 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {savingSahlProduct
                        ? 'ساقلىنىۋاتىدۇ...'
                        : `ساقلاش ۋە دەرھال باشبەتكە چىقىرىش (${sahlForm.packages.filter((p) => p.selected).length} بولاق بىلەن)`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSahlCashModalOpen(false);
                      setSelectedSahlGroup(null);
                    }}
                    className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition hover:bg-slate-700 cursor-pointer"
                  >
                    بىكار قىلىش
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= 3.5 CATEGORY ADD/EDIT MODAL ================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg ${themeClasses.card} rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 font-alkatip border border-amber-500/40 max-h-[92vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-ukij font-bold text-base text-white">
                    {editingCategory ? 'سەھىپىنى تەھرىرلەش' : 'يېڭى سەھىپە قوشۇش'}
                  </h3>
                  <p className={`text-xs ${themeClasses.subtext}`}>
                    سەھىپىنىڭ نامى، رەسىمى ۋە بەلگىسىنى خالىغانچە كىرگۈزۈڭ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              {/* Category Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  سەھىپە نامى (ئۇيغۇرچە):
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="مەسىلەن: مەشھۇر ئويۇنلار، تور كارتىلىرى، VIP مۇلازىمەتلەر..."
                  className={`w-full px-3.5 py-2.5 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400 font-bold text-white text-xs`}
                />
              </div>

              {/* Category Live Image Banner & Image URL */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-bold">
                  سەھىپە تەگلىك رەسىمى (Image URL):
                </label>
                
                {/* Live Preview Banner */}
                <div className="relative w-full h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md">
                  {categoryForm.image ? (
                    <img
                      src={categoryForm.image}
                      alt="Category Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                      رەسىم تاللانمىدى
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end justify-between p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/40">
                        <span className="animate-moving-icon">
                          <DynamicIcon name={categoryForm.icon || 'Gamepad2'} className="w-4.5 h-4.5" />
                        </span>
                      </div>
                      <span className="text-white font-extrabold text-xs drop-shadow">
                        {categoryForm.name || 'سەھىپە نامى'}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-mono bg-slate-950/70 px-2 py-0.5 rounded-full border border-amber-400/30">
                      {categoryForm.count || 'مۇلازىمەتلەر'}
                    </span>
                  </div>
                </div>

                <input
                  type="text"
                  value={categoryForm.image}
                  onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/... ياكى تور رەسىمى"
                  className={`w-full px-3.5 py-2 rounded-xl font-mono text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                  dir="ltr"
                />

                {/* Preset image chips */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="text-slate-400">تەييار رەسىملەر:</span>
                  {[
                    { label: '🎮 ئويۇنلار', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80' },
                    { label: '📱 ئەپلەر', url: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=500&auto=format&fit=crop&q=80' },
                    { label: '👥 ئىجتىمائىي', url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=80' },
                    { label: '💳 كارتىلار', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80' },
                    { label: '🤖 AI', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&auto=format&fit=crop&q=80' },
                    { label: '📩 نومۇرلار', url: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=500&auto=format&fit=crop&q=80' },
                    { label: '💰 كرىپتو', url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500&auto=format&fit=crop&q=80' },
                    { label: '👑 VIP', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&auto=format&fit=crop&q=80' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, image: preset.url })}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-slate-700 transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Animated Icon Picker ("مىدىرلاپ تۇرىدىغان بەلگىلەر") */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold">
                    سەھىپە سىنبەلگىسى (ھەرىكەتلىك / مىدىرلاپ تۇرىدىغان بەلگىلەر):
                  </label>
                  <span className="text-[10px] text-amber-300 font-mono bg-amber-400/15 px-2 py-0.5 rounded-md border border-amber-400/30">
                    ✨ تاللانغان: {categoryForm.icon || 'Gamepad2'}
                  </span>
                </div>

                {/* Filter Tabs for Quick Icon Discovery */}
                <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-bold">
                  {[
                    { id: 'all', label: 'ھەممىسى' },
                    { id: 'game', label: '🎮 ئويۇنلار' },
                    { id: 'app', label: '📱 ئەپلەر' },
                    { id: 'pay', label: '💰 پۇل ۋە كارتىلار' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setIconFilterTab(tab.id as any)}
                      className={`flex-1 py-1 px-1.5 rounded-lg transition cursor-pointer text-center text-[10px] sm:text-[11px] ${
                        iconFilterTab === tab.id
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Animated Icons Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  {AVAILABLE_ANIMATED_ICONS
                    .filter((item) => iconFilterTab === 'all' || item.category === iconFilterTab)
                    .map((item, idx) => {
                      const isSelected = (categoryForm.icon || 'Gamepad2') === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCategoryForm({ ...categoryForm, icon: item.id })}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-400/40 scale-105 ring-2 ring-amber-300'
                              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-amber-400/50'
                          }`}
                        >
                          <span
                            style={{ animationDelay: `${(idx % 6) * 0.22}s` }}
                            className={`animate-moving-icon ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}
                          >
                            <DynamicIcon name={item.id} className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Count / Subtext */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  قىسقىچە بايان ياكى ئىزاھات (Subtext):
                </label>
                <input
                  type="text"
                  value={categoryForm.count}
                  onChange={(e) => setCategoryForm({ ...categoryForm, count: e.target.value })}
                  placeholder="مەسىلەن: قىزىق مۇلازىمەتلەر ياكى تېز يەتكۈزۈش..."
                  className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCategory ? 'ئۆزگەرتىشنى ساقلاش' : 'سەھىپىنى قوشۇش'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition hover:bg-slate-700 cursor-pointer"
                >
                  بىكار قىلىش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 3.6 PROMO BANNER ADD/EDIT MODAL ================= */}
      {bannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-xl ${themeClasses.card} rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 font-alkatip border border-amber-500/40 max-h-[92vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {editingBanner ? 'ئېلاننى تەھرىرلەش' : 'يېڭى باشبەت ئېلانى قوشۇش'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    رەسىم، ماۋزۇ، ھەرىكەتلىك بەلگە (Emoji) ۋە ئۇلانمىلارنى تاللاڭ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBannerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              {/* Image Editor with Device Upload & Presets */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-bold flex items-center justify-between">
                  <span>ئارقا كۆرۈنۈش رەسىمى (Image):</span>
                  <span className="text-amber-400 text-[11px]">يۇقىرى سۈپەتلىك (1200x500 ئەتراپىدا)</span>
                </label>

                {bannerForm.image && (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner group">
                    <img
                      src={bannerForm.image}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setBannerForm((prev) => ({ ...prev, image: '' }))}
                      className="absolute top-2 left-2 p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition shadow cursor-pointer"
                      title="رەسىمنى ئۆچۈرۈش"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/40 text-cyan-300 font-bold transition cursor-pointer text-xs shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>تېلېفون ياكى كومپيۇتېردىن رەسىم تاللاش</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={bannerForm.image}
                    onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                    placeholder="ياكى رەسىم ئادرېسىنى (URL) بۇ يەرگە چاپلاڭ: https://..."
                    className={`w-full px-3.5 py-2 rounded-xl font-mono text-[11px] ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                    dir="ltr"
                  />
                </div>

                {/* Popular Background Presets */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">تەييار كۆركەم رەسىم ئۆرنەكلىرى:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: '🎮 PUBG / Gaming', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80' },
                      { label: '🔥 Free Fire / Action', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80' },
                      { label: '🤖 ChatGPT / AI', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop&q=80' },
                      { label: '📲 مەۋھۇم نومۇر', url: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=1200&auto=format&fit=crop&q=80' },
                      { label: '💳 ۋىزا & كارتىلار', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80' },
                      { label: '🪙 كرىپتو ۋە بانكا', url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1200&auto=format&fit=crop&q=80' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setBannerForm((prev) => ({ ...prev, image: preset.url }))}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400/60 text-slate-300 hover:text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title Input with Quick Suggestions */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  ئېلان ماۋزۇسى (Title):
                </label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="مەسىلەن: PUBG Mobile UC ۋە Royale Pass تولۇقلاش"
                  className={`w-full px-3.5 py-2.5 rounded-xl font-bold ${themeClasses.input} focus:outline-none focus:border-amber-400 text-sm`}
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400">تەييار ماۋزۇ:</span>
                  {[
                    'PUBG Mobile UC ۋە پۇل قاچىلاش',
                    'ChatGPT Plus & Claude Pro ئايلىق / يىللىق',
                    'خەلقئارالىق مەۋھۇم ۋىزا كارتىلار (VCC)',
                    'مەۋھۇم نومۇر (SMS) — Telegram, WhatsApp',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setBannerForm((prev) => ({ ...prev, title: sug }))}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-300 transition cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle / Description */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  ئېلان تۈشەندۈرۈشى (Subtitle):
                </label>
                <textarea
                  rows={2}
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="مەسىلەن: ئويۇنچى ID نومۇرىڭىز بىلەن 10 سېكۇنتتا بىۋاسىتە ھېساباتقا كىرىدۇ"
                  className={`w-full px-3.5 py-2 rounded-xl text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                />
              </div>

              {/* Badge with Animated Emoji Picker */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold flex items-center justify-between">
                  <span>ھەرىكەتلىك بەلگە (Badge with Moving Emoji):</span>
                  <span className="text-amber-400 text-[10px]">باش تەرەپتىكى سېرىق كۇنۇپكىچە</span>
                </label>
                <input
                  type="text"
                  value={bannerForm.badge}
                  onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                  placeholder="مەسىلەن: ⚡ ئەڭ قىزىق ئويۇن"
                  className={`w-full px-3.5 py-2 rounded-xl font-bold ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                />

                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">ھەرىكەتلىك بەلگە ۋە ئىپادىلەرنى تاللاڭ:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { emoji: '⚡', label: '⚡ ئەڭ قىزىق' },
                      { emoji: '✨', label: '✨ ئالاھىدە تاللاش' },
                      { emoji: '🔥', label: '🔥 قىزىق ئېتىبار' },
                      { emoji: '💎', label: '💎 ئالماس & UC' },
                      { emoji: '👑', label: '👑 VIP مۇلازىمەت' },
                      { emoji: '🤖', label: '🤖 سۈنئىي ئەقىل' },
                      { emoji: '📲', label: '📲 مەۋھۇم نومۇر' },
                      { emoji: '💳', label: '💳 ۋىزا كارتىلار' },
                      { emoji: '🎮', label: '🎮 ئويۇن مەركىزى' },
                      { emoji: '🚀', label: '🚀 دەرھال يەتكۈزۈش' },
                      { emoji: '⭐', label: '⭐ كاپالەتلىك' },
                      { emoji: '🎉', label: '🎉 بايراملىق سوۋغات' },
                    ].map((badgeItem) => (
                      <button
                        key={badgeItem.label}
                        type="button"
                        onClick={() => setBannerForm((prev) => ({ ...prev, badge: badgeItem.label }))}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400/60 text-slate-300 hover:text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <span className="animate-moving-icon">{badgeItem.emoji}</span>
                        <span>{badgeItem.label.replace(/^.\s*/, '')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tag and Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">بۇلۇڭ بەلگىسى (Tag):</label>
                  <input
                    type="text"
                    value={bannerForm.tag}
                    onChange={(e) => setBannerForm({ ...bannerForm, tag: e.target.value })}
                    placeholder="مەسىلەن: كاپالەتلىك كود"
                    className={`w-full px-3 py-2 rounded-xl text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">كۇنۇپكا سۆزى (Button Text):</label>
                  <input
                    type="text"
                    value={bannerForm.linkText}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkText: e.target.value })}
                    placeholder="مەسىلەن: دەرھال قاچىلاش ⚡"
                    className={`w-full px-3 py-2 rounded-xl text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                  />
                </div>
              </div>

              {/* Category and Target URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نىشان سەھىپە (Category):</label>
                  <select
                    value={bannerForm.category}
                    onChange={(e) => setBannerForm({ ...bannerForm, category: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400 cursor-pointer`}
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-950 text-white">
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">ئىختىيارىي ئۇلانما (URL, ئېھتىياج بولسا):</label>
                  <input
                    type="text"
                    value={bannerForm.targetUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, targetUrl: e.target.value })}
                    placeholder="بوش قالدۇرسا شۇ سەھىپىنى ئاچىدۇ"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Enabled Switch */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs block">ئېلاننى كۆرسىتىش (Active Status):</span>
                  <span className="text-[11px] text-slate-400">تاقىۋەتسىڭىز دۇكان باشبىتىدە كۆرۈنمەيدۇ</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBannerForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                    bannerForm.enabled
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {bannerForm.enabled ? '✓ دۇكاندا كۆرسىتىلسۇن' : '✕ يوشۇرۇلسۇن'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>ئېلاننى ساقلاش ۋە باشبەتكە چىقىرىش</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition hover:bg-slate-700 cursor-pointer"
                >
                  بىكار قىلىش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 4. USER BALANCE ADJUST MODAL ================= */}
      {userModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className={`w-full max-w-sm ${themeClasses.card} rounded-3xl p-6 shadow-2xl space-y-4 font-alkatip`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">
                ئىشلەتكۈچى قالدۇقى ۋە VIP دەرىجىسىنى تەڭشەش
              </h3>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className={themeClasses.subtext}>ئىشلەتكۈچى:</span>
                <span className="font-bold text-white">{selectedUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={themeClasses.subtext}>ئېلخەت:</span>
                <span className="font-mono text-cyan-300">{selectedUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={themeClasses.subtext}>نۆۋەتتىكى قالدۇقى:</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  ${formatSmartPrice(selectedUser.balance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={themeClasses.subtext}>نۆۋەتتىكى VIP دەرىجىسى:</span>
                <span className="font-mono font-black text-cyan-400 text-xs uppercase">
                  {selectedUser.vipTier || 'VIP1'}
                </span>
              </div>
            </div>

            {/* Admin Role Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300">
                باشقۇرۇش مەركىزى كىرىش ھوقۇقى (Role):
              </label>
              <select
                value={selectedUserRole}
                disabled={selectedUser.email?.toLowerCase() === 'dronemax0996@gmail.com'}
                onChange={(e) => setSelectedUserRole(e.target.value as 'user' | 'admin')}
                className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold ${
                  selectedUserRole === 'admin' ? 'text-amber-300 border-amber-500/50' : 'text-slate-300'
                } ${themeClasses.input} focus:outline-none focus:border-amber-400 cursor-pointer disabled:opacity-50`}
              >
                <option value="user" className="bg-slate-900 text-slate-300">ئادەتتىكى خېرىدار (باشقۇرۇش مەركىزى كۆرۈنمەيدۇ)</option>
                <option value="admin" className="bg-slate-900 text-amber-300">باشقۇرغۇچى (باشقۇرۇش مەركىزى ئېچىپ بېرىلىدۇ)</option>
              </select>
            </div>

            {/* VIP Tier Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300">
                VIP ئەزالىق دەرىجىسىنى تەڭشەش / كۆتۈرۈش:
              </label>
              <select
                value={selectedVipTier}
                onChange={(e) => setSelectedVipTier(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold text-cyan-300 ${themeClasses.input} focus:outline-none focus:border-cyan-400 cursor-pointer`}
              >
                <option value="vip1" className="bg-slate-900 text-slate-300">VIP 1 (ئاددىي ئەزا - 0% ئېتىبار)</option>
                <option value="vip2" className="bg-slate-900 text-amber-400">VIP 2 (كۈمۈش ئەزا - 2% ئېتىبار)</option>
                <option value="vip3" className="bg-slate-900 text-cyan-400">VIP 3 (ئالتۇن ئەزا - 5% ئېتىبار)</option>
                <option value="vip4" className="bg-slate-900 text-yellow-400">VIP 4 (پىلاتىنا ئەزا - 8% ئېتىبار)</option>
                <option value="vip5" className="bg-slate-900 text-emerald-400">VIP 5 (ئالماس ئەزا - 12% ئېتىبار)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300">
                قوشىدىغان ياكى ئالىدىغان سومما (USD):
              </label>
              <input
                type="number"
                step="0.01"
                value={balanceDelta || ''}
                onChange={(e) => setBalanceDelta(Number(e.target.value))}
                placeholder="مەسىلەن: +25 ياكى -10"
                className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-center font-bold text-white ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                dir="ltr"
              />
              <p className="text-[10px] text-slate-500 text-center">
                مۇسبەت سان قوشىدۇ، مەنپىي سان كېمەيتىدۇ.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={
                  actionLoading === selectedUser.id ||
                  (balanceDelta === 0 &&
                    selectedVipTier === (selectedUser.vipTier || 'vip1').toLowerCase() &&
                    selectedUserRole === (selectedUser.role === 'admin' ? 'admin' : 'user'))
                }
                onClick={handleAdjustBalance}
                className="flex-1 py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer disabled:opacity-50"
              >
                جەزملەش
              </button>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition hover:bg-slate-700 cursor-pointer"
              >
                تاقاش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Stats Confirmation Modal */}
      {showResetStatsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-right font-alkatip">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100">سىتاتىستىكىلارنى نۆل ھالىتىگە قايتۇرۇش</h3>
                <p className="text-xs text-rose-400 font-medium">دىققەت: بۇ مەشغۇلات ئەسلىگە كەلمەيدۇ!</p>
              </div>
            </div>

            <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3.5 mb-4 text-xs text-slate-300 leading-relaxed">
              بۇ مەشغۇلات سىستېمىدىكى بارلىق سىناق كىرىم تالونلىرى (Deposits) ۋە زاكاز خاتىرىلىرىنى (Orders) پاكىز تازىلاپ، بارلىق سىتاتىستىكا كۆرسەتكۈچلىرىنى $0.00 ھالىتىگە ئەسلىگە كەلتۈرىدۇ.
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer mb-5 hover:bg-slate-800 transition">
              <input
                type="checkbox"
                checked={resetUserBalances}
                onChange={(e) => setResetUserBalances(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-600"
              />
              <span className="text-xs font-bold text-slate-200">
                ئەزالارنىڭ سىناق قالدۇق پۇلىنىمۇ $0 قىلىش
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={resettingStats}
                onClick={handleResetStats}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-lg shadow-rose-900/40 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {resettingStats ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>نۆللىنىۋاتىدۇ...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>جەزملەش، نۆلگە قايتۇرۇش</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={resettingStats}
                onClick={() => setShowResetStatsModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
              >
                بىكار قىلىش
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
