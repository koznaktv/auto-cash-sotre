'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Order, DepositRecord } from '@/lib/orders';
import { CATEGORIES_9, ServiceItem } from '@/lib/data';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
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
  ExternalLink,
  Sliders
} from 'lucide-react';

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

interface SystemSettingsState {
  adminPin: string;
  shamcashAddress: string;
  whatsappNumber: string;
  telegramUsername: string;
  siteName: string;
}

interface ProviderStatus {
  success: boolean;
  isConfigured: boolean;
  balance: number;
  currency: string;
  userName?: string;
  errorMessage?: string;
}

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
    'dashboard' | 'orders' | 'services' | 'deposits' | 'users' | 'finance' | 'settings'
  >('dashboard');

  // Main Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [checkingProvider, setCheckingProvider] = useState<boolean>(false);
  const [settings, setSettings] = useState<SystemSettingsState>({
    adminPin: '9960996',
    shamcashAddress: 'efe8a2b200d66411c7c7e296369cbba8',
    whatsappNumber: '+963 984 373 459',
    telegramUsername: 'autocash_UYGHUR',
    siteName: 'AUTO CASH',
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Product/Service Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState<{
    id?: string;
    name: string;
    category: ServiceItem['category'];
    icon: string;
    image: string;
    description: string;
    badge: string;
    inputLabel: string;
    inputPlaceholder: string;
    price: number;
    packageTitle: string;
  }>({
    name: '',
    category: 'games',
    icon: 'Gamepad2',
    image: '',
    description: '',
    badge: '',
    inputLabel: 'ئويۇنچى ID',
    inputPlaceholder: 'ID نومۇرىڭىزنى كىرگۈزۈڭ',
    price: 1.99,
    packageTitle: 'ئاساسىي بولاق',
  });

  // Settings Save Message
  const [settingsSaveMsg, setSettingsSaveMsg] = useState('');

  // User Balance Edit Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [balanceDelta, setBalanceDelta] = useState<number>(0);

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

  // 2. Fetch all admin data
  useEffect(() => {
    if (isAuthenticated) {
      loadAllAdminData();
    }
  }, [isAuthenticated]);

  const loadAllAdminData = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [resOrders, resDeposits, resUsers, resServices, resSettings] = await Promise.all([
        fetch('/api/orders').then((r) => r.json()),
        fetch('/api/deposits').then((r) => r.json()),
        fetch('/api/admin/users', { headers }).then((r) => r.json()),
        fetch('/api/admin/services').then((r) => r.json()),
        fetch('/api/admin/settings', { headers }).then((r) => r.json()),
      ]);

      if (resOrders.success) setOrders(resOrders.orders || []);
      if (resDeposits.success) setDeposits(resDeposits.deposits || []);
      if (resUsers.success) setUsers(resUsers.users || []);
      if (resServices.success) setServices(resServices.services || []);
      if (resSettings.success && resSettings.settings) setSettings(resSettings.settings);

      // Check external gaming provider (syria4game.com) status
      checkProviderLive();
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

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
      }
    } catch (err) {
      console.error('Provider live check failed:', err);
    } finally {
      setCheckingProvider(false);
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
    setIsAuthenticated(false);
    setPinInput('');
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

  // User Balance Adjust
  const handleAdjustBalance = async () => {
    if (!selectedUser || balanceDelta === 0) return;
    setActionLoading(selectedUser.id);
    const token = sessionStorage.getItem('autocash_admin_token');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          balanceDelta: balanceDelta,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? data.user : u))
        );
        setUserModalOpen(false);
        setBalanceDelta(0);
        setSelectedUser(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Service CRUD operations
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      category: 'games',
      icon: 'Gamepad2',
      image: '',
      description: '',
      badge: 'يېڭى',
      inputLabel: 'ئويۇنچى ID (Player ID)',
      inputPlaceholder: 'ئويۇن كىملىك نومۇرىنى كىرگۈزۈڭ',
      price: 1.99,
      packageTitle: 'ئاساسىي بولاق',
    });
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (srv: ServiceItem) => {
    setEditingService(srv);
    setServiceForm({
      id: srv.id,
      name: srv.name,
      category: srv.category,
      icon: srv.icon || 'Package',
      image: srv.image || '',
      description: srv.description || '',
      badge: srv.badge || '',
      inputLabel: srv.inputLabel || '',
      inputPlaceholder: srv.inputPlaceholder || '',
      price: srv.packages[0]?.price || 1.99,
      packageTitle: srv.packages[0]?.title || 'ئاساسىي بولاق',
    });
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = sessionStorage.getItem('autocash_admin_token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const payload: Partial<ServiceItem> = {
      name: serviceForm.name,
      category: serviceForm.category,
      icon: serviceForm.icon,
      image: serviceForm.image || undefined,
      description: serviceForm.description,
      badge: serviceForm.badge || undefined,
      inputLabel: serviceForm.inputLabel || undefined,
      inputPlaceholder: serviceForm.inputPlaceholder || undefined,
      packages: [
        {
          id: `${serviceForm.id || 'p'}-1`,
          title: serviceForm.packageTitle,
          price: Number(serviceForm.price) || 1.0,
          duration: 'دەرھال',
        },
      ],
    };

    try {
      if (editingService) {
        // Edit existing
        const res = await fetch('/api/admin/services', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: editingService.id, ...payload }),
        });
        const data = await res.json();
        if (data.success && data.service) {
          setServices((prev) =>
            prev.map((s) => (s.id === editingService.id ? data.service : s))
          );
          setServiceModalOpen(false);
        }
      } else {
        // Add new
        const res = await fetch('/api/admin/services', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.service) {
          setServices((prev) => [data.service, ...prev]);
          setServiceModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('بۇ مەھسۇلاتنى راستىنلا ئۆچۈرەمسىز؟')) return;
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = sessionStorage.getItem('autocash_admin_token');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSaveMsg('تەڭشەكلەر مۇۋەپپەقىيەتلىك ساقلاندى!');
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
    const processingCount = orders.filter((o) => o.status === 'processing' || o.status === 'pending').length;
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
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

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

          <h2 className="text-xl font-bold text-center text-white font-ukij gold-text-glow mb-2">
            AUTO CASH باشقۇرۇش مەركىزى
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
                ⚡
              </div>
              <div>
                <h1 className="font-ukij font-bold text-sm leading-tight text-white">
                  {settings.siteName || 'AUTO CASH'}
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
              { id: 'services', label: 'مەھسۇلات / مۇلازىمەتلەر', icon: Package, badge: services.length },
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
              {activeTab === 'deposits' && 'ھەميان كىرىملىرى ۋە تالونلار'}
              {activeTab === 'users' && 'ئەزالار ۋە ئىشلەتكۈچىلەر باشقۇرۇش'}
              {activeTab === 'finance' && 'پۇل مۇئامىلە ۋە كىرىم ئانالىزى'}
              {activeTab === 'settings' && 'سىستېما تەڭشەكلىرى'}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Refresh Data button */}
            <button
              onClick={loadAllAdminData}
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
                      <h3 className="text-sm font-bold text-white">تاشقى تەمىنلىگۈچى (syria4game.com) API ئۇلىنىشى</h3>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        providerStatus?.isConfigured
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {providerStatus?.isConfigured ? '● نەق ئۇلاندى (Live Active)' : '○ سىناق ھالىتى (Sandbox Mode)'}
                      </span>
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
                      ${providerStatus?.balance !== undefined ? providerStatus.balance.toFixed(2) : '---'}
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
                            ${order.amount.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                  : order.status === 'processing'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {order.status === 'completed'
                                ? 'تاماملاندى'
                                : order.status === 'processing'
                                ? 'بىر تەرەپ قىلىنىۋاتىدۇ'
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
                              {order.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-rose-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                                >
                                  بىكار قىلىش
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
                  {['all', 'processing', 'completed', 'cancelled'].map((st) => (
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
                        ? `بىر تەرەپ قىلىنىۋاتقان (${orders.filter((o) => o.status === 'processing').length})`
                        : st === 'completed'
                        ? `تاماملاندى (${orders.filter((o) => o.status === 'completed').length})`
                        : `بىكار قىلىندى (${orders.filter((o) => o.status === 'cancelled').length})`}
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
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                              {order.userEmail || 'ئېنىقسىز'}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-amber-400">
                              ${order.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  order.status === 'completed'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : order.status === 'processing'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {order.status === 'completed'
                                  ? 'تاماملاندى'
                                  : order.status === 'processing'
                                  ? 'بىر تەرەپ قىلىنىۋاتىدۇ'
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
                                <button
                                  disabled={actionLoading === order.id}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                  className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-[10px] transition cursor-pointer"
                                >
                                  بىكار
                                </button>
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
              <div className={`p-4 rounded-2xl ${themeClasses.card} flex flex-col sm:flex-row items-center justify-between gap-3`}>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="مەھسۇلات ياكى سەھىپە بويىچە ئىزدەش..."
                    className={`w-full pr-9 pl-3 py-2 rounded-xl text-xs ${themeClasses.input} focus:outline-none focus:border-amber-400 transition`}
                  />
                </div>

                <button
                  onClick={handleOpenAddService}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>يېڭى مەھسۇلات قوشۇش</span>
                </button>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredServices.map((srv) => (
                  <div
                    key={srv.id}
                    className={`p-4 rounded-2xl ${themeClasses.card} flex flex-col justify-between hover:border-amber-400/50 transition group`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
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
                          <div>
                            <h4 className="font-bold text-sm text-white line-clamp-1">{srv.name}</h4>
                            <span className="text-[10px] text-amber-400 block font-mono">
                              {srv.category}
                            </span>
                          </div>
                        </div>

                        {srv.badge && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                            {srv.badge}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs ${themeClasses.subtext} line-clamp-2 mb-3`}>
                        {srv.description || 'تەپسىلات يوق'}
                      </p>

                      <div className="flex items-center justify-between text-xs py-2 border-t border-slate-800/80">
                        <span className={themeClasses.subtext}>باشلىنىش باھاسى:</span>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          ${srv.packages[0]?.price?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => handleOpenEditService(srv)}
                        className="flex-1 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تەھرىرلەش</span>
                      </button>
                      <button
                        onClick={() => handleDeleteService(srv.id)}
                        className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                              +${dep.amount.toFixed(2)}
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
                                    onClick={() => handleUpdateDepositStatus(dep.id, 'completed')}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
                                  >
                                    ✓ تەستىقلاش (پۇل قوشۇش)
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
                            ${user.balance?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">
                            ${user.totalSpent?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="uppercase font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                              {user.vipTier || 'VIP1'}
                            </span>
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
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Balance */}
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBalanceDelta(0);
                                  setUserModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition cursor-pointer"
                              >
                                قالدۇق تەڭشەش
                              </button>

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                  <span className={`text-xs ${themeClasses.subtext} block mb-1`}>جەمئىي كىرگۈزۈلگەن پۇل (Deposits)</span>
                  <div className="text-3xl font-black font-mono text-emerald-400">
                    +${metrics.totalDep.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-alkatip">شامكەش ئارقىلىق دەلىللەنگەن ئومۇمىي سومما</p>
                </div>

                <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                  <span className={`text-xs ${themeClasses.subtext} block mb-1`}>جەمئىي سېتىۋېلىنغان (Sales)</span>
                  <div className="text-3xl font-black font-mono text-cyan-400">
                    ${metrics.totalRev.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-alkatip">بارلىق زاكازلارنىڭ ئومۇمىي باھاسى</p>
                </div>

                <div className={`p-5 rounded-2xl ${themeClasses.card}`}>
                  <span className={`text-xs ${themeClasses.subtext} block mb-1`}>ساپ قالدۇق پەرقى</span>
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
                  <label className="block text-slate-300 font-bold mb-1">سەھىپىسى:</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        category: e.target.value as ServiceItem['category'],
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                  >
                    {CATEGORIES_9.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">بەلگە خېتى (Badge):</label>
                  <input
                    type="text"
                    value={serviceForm.badge}
                    onChange={(e) => setServiceForm({ ...serviceForm, badge: e.target.value })}
                    placeholder="مەسىلەن: ئەڭ قىزىق..."
                    className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رەسىم ئۇلىنىشى (Image URL):</label>
                <input
                  type="url"
                  value={serviceForm.image}
                  onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className={`w-full px-3.5 py-2 rounded-xl font-mono text-[11px] ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">ئاساسىي باھا ($ USD):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={serviceForm.price}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, price: Number(e.target.value) })
                    }
                    className={`w-full px-3.5 py-2 rounded-xl font-mono ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">بولاق نامى:</label>
                  <input
                    type="text"
                    value={serviceForm.packageTitle}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, packageTitle: e.target.value })
                    }
                    placeholder="مەسىلەن: 660 UC..."
                    className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">خېرىداردىن سورايدىغان كىملىك خېتى (ID Label):</label>
                <input
                  type="text"
                  value={serviceForm.inputLabel}
                  onChange={(e) => setServiceForm({ ...serviceForm, inputLabel: e.target.value })}
                  placeholder="مەسىلەن: ئويۇنچى ID (Player ID)..."
                  className={`w-full px-3.5 py-2 rounded-xl ${themeClasses.input} focus:outline-none focus:border-amber-400`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">تۈشەندۈرۈشى:</label>
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

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer"
                >
                  {editingService ? 'ئۆزگەرتىشنى ساقلاش' : 'مەھسۇلاتنى قوشۇش'}
                </button>
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition hover:bg-slate-700 cursor-pointer"
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
                ئىشلەتكۈچى قالدۇقىنى تەڭشەش
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
                  ${selectedUser.balance?.toFixed(2) || '0.00'}
                </span>
              </div>
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
                disabled={actionLoading === selectedUser.id || balanceDelta === 0}
                onClick={handleAdjustBalance}
                className="flex-1 py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer"
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
    </div>
  );
}
