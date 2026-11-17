'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  Wallet,
  Coins,
  Users,
  ShoppingBag,
  Truck,
  Scale,
  Globe,
  Smartphone,
  Send,
  Settings,
  RefreshCw,
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  FileText,
} from 'lucide-react';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegramUsername: string;
  telegramChatId: string | number;
  platform: 'AUTO_CASH' | 'MAX_BAZAR';
  platformLabel: string;
  registeredAt: string;
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  ordersCount: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
}

interface OrderItem {
  id: string;
  platform: 'AUTO_CASH' | 'MAX_BAZAR';
  brandName: string;
  customer: string;
  productName: string;
  customerPaid: number;
  supplierCost: number;
  profit: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  targetAccount?: string;
}

interface ShamcashTx {
  id: string;
  txId: string;
  platform: 'AUTO_CASH' | 'MAX_BAZAR';
  customer: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'rejected';
  date: string;
  type: string;
}

export function CentralCommerceManager() {
  const [activeSubTab, setActiveSubTab] = useState<
    | 'overview'
    | 'daily_report'
    | 'weekly_report'
    | 'shamcash'
    | 'customer_balances'
    | 'customer_directory'
    | 'orders_manager'
    | 'supplier_expenses'
    | 'profit_loss'
    | 'autocash_site'
    | 'maxbazar_site'
    | 'telegram_settings'
    | 'system_settings'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [customerPlatformFilter, setCustomerPlatformFilter] = useState<'ALL' | 'AUTO_CASH' | 'MAX_BAZAR'>('ALL');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  const [orderPlatformFilter, setOrderPlatformFilter] = useState<'ALL' | 'AUTO_CASH' | 'MAX_BAZAR'>('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'completed' | 'processing' | 'pending' | 'refunded'>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Dispatch Action Feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Fetch Central Data
  const loadCentralData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('autocash_admin_token') || '9960996';
      const res = await fetch('/api/admin/central-commerce', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'سانلىق مەلۇماتنى ئوقۇش مەغلۇپ بولدى');
      }
    } catch (e: any) {
      setError(e?.message || 'ئۇلىنىش خاتالىقى');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCentralData();
  }, []);

  // Send PDF to Telegram Channel (@autocashkirim)
  const triggerTelegramPdf = async (period: 'daily' | 'weekly') => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const token = sessionStorage.getItem('autocash_admin_token') || '9960996';
      const res = await fetch(`/api/cron/financial-report?period=${period}&force_send=true`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const msg = period === 'weekly'
          ? '🎉 ھەپتىلىك PDF دوكلاتى @autocashkirim قانىلىغا مۇۋەپپەقىيەتلىك چىقىرىلدى!'
          : '🎉 كۈندىلىك PDF دوكلاتى @autocashkirim قانىلىغا مۇۋەپپەقىيەتلىك چىقىرىلدى!';
        setActionFeedback(msg);
        loadCentralData();
      } else {
        setActionFeedback(`❌ ئەۋەتىش مەغلۇپ بولدى: ${json.error || (json.errors && json.errors[0]) || 'نامەلۇم خاتالىق'}`);
      }
    } catch (e: any) {
      setActionFeedback(`❌ خاتالىق: ${e?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (!data?.customers) return [];
    return data.customers.filter((c: CustomerItem) => {
      if (customerPlatformFilter !== 'ALL' && c.platform !== customerPlatformFilter) return false;
      if (!customerSearchQuery.trim()) return true;
      const q = customerSearchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.telegramUsername && c.telegramUsername.toLowerCase().includes(q)) ||
        String(c.telegramChatId).includes(q)
      );
    });
  }, [data?.customers, customerPlatformFilter, customerSearchQuery]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    return data.orders.filter((o: OrderItem) => {
      if (orderPlatformFilter !== 'ALL' && o.platform !== orderPlatformFilter) return false;
      if (orderStatusFilter !== 'ALL') {
        if (orderStatusFilter === 'processing') {
          if (!['processing', 'in_progress', 'pending_provider', 'wait'].includes(o.status)) return false;
        } else if (o.status !== orderStatusFilter) {
          return false;
        }
      }
      if (!orderSearchQuery.trim()) return true;
      const q = orderSearchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        (o.targetAccount && o.targetAccount.toLowerCase().includes(q))
      );
    });
  }, [data?.orders, orderPlatformFilter, orderStatusFilter, orderSearchQuery]);

  const navTabs = [
    { id: 'overview', label: '1. ئومۇمىي ئەھۋال', icon: LayoutDashboard },
    { id: 'daily_report', label: '2. كۈندىلىك كىرىم دوكلاتى', icon: Calendar },
    { id: 'weekly_report', label: '3. ھەپتىلىك كىرىم دوكلاتى', icon: TrendingUp },
    { id: 'shamcash', label: '4. شامكەش باشقۇرۇش', icon: Wallet },
    { id: 'customer_balances', label: '5. خېرىدارلار قالدۇق پۇلى', icon: Coins },
    { id: 'customer_directory', label: '6. خېرىدارلار تىزىملىكى', icon: Users, badge: data?.customers?.length },
    { id: 'orders_manager', label: '7. زاكازلارنى باشقۇرۇش', icon: ShoppingBag, badge: data?.orders?.length },
    { id: 'supplier_expenses', label: '8. تەمىنلىگۈچىلەر چىقىمى', icon: Truck },
    { id: 'profit_loss', label: '9. پايدا ۋە زىيان ھېساباتى', icon: Scale },
    { id: 'autocash_site', label: '10. Auto Cash توربېكىتى', icon: Globe },
    { id: 'maxbazar_site', label: '11. Max BAZAR توربېكىتى', icon: Smartphone },
    { id: 'telegram_settings', label: '12. Telegram تەڭشەكلىرى', icon: Send },
    { id: 'system_settings', label: '13. سىستېما تەڭشەكلىرى', icon: Settings },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300" dir="rtl">
      {/* Top Main Banner & Header */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-white font-alkatip tracking-wide">
                  AUTO CASH ۋە MAX BAZAR مەركىزى سودا ۋە مالىيە باشقۇرۇش سىستېمىسى
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black">
                  ھەقىقىي مالىيە تۇتاشتۇرۇلدى ✅
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-alkatip">
                ھەقىقىي شامكەش كىرىمى، تەمىنلىگۈچى تەننەرخى ۋە ئاخىرقى ساپ پايدىنى 100% توغرا نازارەت قىلىش سۇپىسى
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => triggerTelegramPdf('daily')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-xs transition shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>كۈندىلىك PDF ئەۋەتىش (12:00)</span>
            </button>

            <button
              onClick={loadCentralData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>يېڭىلاش</span>
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-bold border animate-in fade-in duration-200 ${
            actionFeedback.startsWith('🎉')
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            {actionFeedback}
          </div>
        )}
      </div>

      {/* 13-SECTION NAVIGATION BAR */}
      <div className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-md overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: ئومۇمىي ئەھۋال (OVERVIEW) */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* 7 Core KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Today Inflow */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>بۈگۈنكى ھەقىقىي كىرىم (شامكەش)</span>
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Wallet className="w-4 h-4" /></span>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  ${(data?.overview?.todayInflow || 0).toFixed(2)}
                </span>
                <p className="text-[11px] text-blue-400 mt-1">دەلىللەنگەن نەق پۇل كىرىمى</p>
              </div>
            </div>

            {/* 2. Today Orders Spending */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>خېرىدار زاكازغا خەجلىگەن پۇل</span>
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><ShoppingBag className="w-4 h-4" /></span>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  ${(data?.overview?.todayTurnover || 0).toFixed(2)}
                </span>
                <p className="text-[11px] text-purple-400 mt-1">{data?.overview?.totalCompletedOrdersToday || 0} دانە زاكاز تاماملاندى</p>
              </div>
            </div>

            {/* 3. Today Supplier Cost */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>تەمىنلىگۈچى تەننەرخى (Wholesale)</span>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><Truck className="w-4 h-4" /></span>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  ${(data?.overview?.todaySupplierCost || 0).toFixed(2)}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Othman Store & MaxStore</p>
              </div>
            </div>

            {/* 4. TRUE NET PROFIT */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/50 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span>ئاخىرقى ساپ پايدا (Net Profit)</span>
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><Scale className="w-4 h-4" /></span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  +${(data?.overview?.todayNetProfit || 0).toFixed(2)}
                </span>
                <p className="text-[11px] text-emerald-300/80 mt-1 font-alkatip">
                  كىرىم − تەمىنلىگۈچى چىقىمى = ساپ كىرىم
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Overview Row: Platform Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Auto Cash Today */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="font-black text-sm text-white">AUTO CASH توربېكىتى (بۈگۈن)</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                  auto-cash.app
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-slate-800/50">
                  <span className="text-[11px] text-slate-400 block">پۈتكەن زاكاز</span>
                  <span className="text-base font-black text-white font-mono">{data?.overview?.autoCash?.completedCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/50">
                  <span className="text-[11px] text-slate-400 block">ئايلانما سومما</span>
                  <span className="text-base font-black text-white font-mono">${(data?.overview?.autoCash?.turnover || 0).toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[11px] text-emerald-400 block font-bold">ساپ پايدا</span>
                  <span className="text-base font-black text-emerald-400 font-mono">+${(data?.overview?.autoCash?.netProfit || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Max BAZAR Today */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="font-black text-sm text-white">MAX BAZAR بازىرى (بۈگۈن)</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-bold">
                  /apps (Micro-Apps)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-slate-800/50">
                  <span className="text-[11px] text-slate-400 block">پۈتكەن زاكاز</span>
                  <span className="text-base font-black text-white font-mono">{data?.overview?.maxBazar?.completedCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/50">
                  <span className="text-[11px] text-slate-400 block">ئايلانما سومما</span>
                  <span className="text-base font-black text-white font-mono">${(data?.overview?.maxBazar?.turnover || 0).toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[11px] text-amber-400 block font-bold">ساپ پايدا</span>
                  <span className="text-base font-black text-amber-400 font-mono">+${(data?.overview?.maxBazar?.netProfit || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Liability Notice */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed font-alkatip">
              <strong className="text-amber-300 font-bold block mb-0.5">مالىيە نازارەت پىرىنسىپى:</strong>
              خېرىدارلارنىڭ ھەميانىدا تۇرغان ئومۇمىي قالدۇق پۇلى: <strong className="text-white font-mono">${(data?.overview?.totalCustomerBalances || 0).toFixed(2)} USD</strong>. 
              بۇ پۇل خېرىدارلارنىڭ سالغان ئەمما تېخى زاكازغا خەجلىمىگەن پۇلى بولۇپ، سۇپىنىڭ قەرز مەجبۇرىيىتى ھېسابلىنىدۇ، ھەرگىز پايدا دەپ ھېسابلانمايدۇ.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: كۈندىلىك كىرىم دوكلاتى (DAILY INCOME REPORT) */}
      {activeSubTab === 'daily_report' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-white font-alkatip">كۈندىلىك كىرىم-چىقىم ۋە ساپ پايدا تەپسىلاتى</h2>
              <p className="text-xs text-slate-400 mt-0.5">چېسلا: {data?.daily?.dateRangeStr} (تۈركىيە ۋاقتى UTC+3)</p>
            </div>
            <a
              href="/api/cron/financial-report?period=daily&download=true"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>PDF چۈشۈرۈش</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inflow breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400">بىرىنچى & ئىككىنچى: شامكەشكە كىرگەن دەلىللەنگەن نەق پۇل</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">دەلىللەنگەن ئومۇمىي پۇل (Completed):</span>
                  <span className="text-white font-mono font-bold">${(data?.daily?.autoCash?.inflow?.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">دەلىللەنگەن تالون سانى:</span>
                  <span className="text-white font-mono font-bold">{data?.daily?.autoCash?.inflow?.completedCount || 0} قېتىم</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">تېخى دەلىللەنمىگەن تالون سوممىسى:</span>
                  <span className="text-amber-400 font-mono font-bold">${(data?.shamcash?.pendingInflowTotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">رەت قىلىنغان / ئىناۋەتسىز تالون:</span>
                  <span className="text-rose-400 font-mono font-bold">${(data?.shamcash?.rejectedInflowTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Orders & Wholesale Cost Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-purple-400">ئۈچىنچى & تۆتىنچى: زاكاز خىراجىتى ۋە تەمىنلىگۈچى تەننەرخى</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Auto Cash زاكازلىرى:</span>
                  <span className="text-white font-mono font-bold">${(data?.daily?.autoCash?.orders?.completedAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Max BAZAR زاكازلىرى:</span>
                  <span className="text-white font-mono font-bold">${(data?.daily?.maxBazar?.orders?.completedAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Othman Store تەننەرخى:</span>
                  <span className="text-amber-400 font-mono font-bold">${(data?.daily?.autoCash?.supplier?.totalCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">MaxStore Wholesale تەننەرخى:</span>
                  <span className="text-amber-400 font-mono font-bold">${(data?.daily?.maxBazar?.supplier?.totalCost || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Net Profit Formula Display */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/40">
            <h3 className="text-xs font-black text-emerald-400 mb-2 font-alkatip">ئالتىنچى: ئاخىرقى ھەقىقىي ساپ پايدا ھېساباتى</h3>
            <div className="text-xs text-slate-300 font-mono space-y-1">
              <p>خېرىدار تۆلىگەن پۇل: ${(data?.daily?.autoCash?.orders?.completedAmount + data?.daily?.maxBazar?.orders?.completedAmount || 0).toFixed(2)} USD</p>
              <p className="text-amber-400">− تەمىنلىگۈچىگە كەتكەن ھەقىقىي تەننەرخ: ${(data?.daily?.autoCash?.supplier?.totalCost + data?.daily?.maxBazar?.supplier?.totalCost || 0).toFixed(2)} USD</p>
              <p className="text-rose-400">− قايتۇرۇلغان پۇللار: ${(data?.daily?.autoCash?.orders?.refundedAmount + data?.daily?.maxBazar?.orders?.refundedAmount || 0).toFixed(2)} USD</p>
              <div className="h-[1px] bg-emerald-500/30 my-2" />
              <p className="text-base font-bold text-emerald-400">
                = ئاخىرقى ساپ پايدا: +${(data?.daily?.autoCash?.netProfit + data?.daily?.maxBazar?.netProfit || 0).toFixed(2)} USD
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ھەپتىلىك كىرىم دوكلاتى (WEEKLY INCOME REPORT) */}
      {activeSubTab === 'weekly_report' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-white font-alkatip">7 كۈنلۈك ھەپتىلىك يىغىنچاق مالىيە دوكلاتى</h2>
              <p className="text-xs text-slate-400 mt-0.5">ئارىلىق: {data?.weekly?.dateRangeStr}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerTelegramPdf('weekly')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ھەپتىلىك دوكلاتنى يوللاش</span>
              </button>
              <a
                href="/api/cron/financial-report?period=weekly&download=true"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">ھەپتىلىك دەلىللەنگەن كىرىم</span>
              <span className="text-2xl font-black text-white font-mono">${(data?.weekly?.autoCash?.inflow?.total || 0).toFixed(2)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">ھەپتىلىك تەمىنلىگۈچى تەننەرخى</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                ${(data?.weekly?.autoCash?.supplier?.totalCost + data?.weekly?.maxBazar?.supplier?.totalCost || 0).toFixed(2)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center">
              <span className="text-xs text-emerald-400 block mb-1 font-bold">ھەپتىلىك ساپ پايدا</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                +${(data?.weekly?.autoCash?.netProfit + data?.weekly?.maxBazar?.netProfit || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: شامكەش باشقۇرۇش (SHAMCASH LEDGER) */}
      {activeSubTab === 'shamcash' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-white font-alkatip">شامكەش (ShamCash) ھېساباتى ۋە تالونلار دەپتىرى</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                كىرىم ئادرېسى: <code className="text-amber-300 font-mono">{data?.shamcash?.merchantAddress}</code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold font-mono">
                1 USD = {data?.shamcash?.exchangeRate} SYP
              </span>
            </div>
          </div>

          {/* Shamcash Formula Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1 font-alkatip">
            <strong className="text-amber-400 block mb-1 font-bold">شامكەش قالدۇقىنى ئاپتوماتىك تەڭپۇڭلاشتۇرۇش فورمۇلاسى:</strong>
            <p className="font-mono text-[11px] text-slate-200">
              باشلىنىش قالدۇقى + دەلىللەنگەن كىرىم (${(data?.shamcash?.verifiedInflowTotal || 0).toFixed(2)}) − تەمىنلىگۈچىگە كەتكەن − چىقىرىلغان = ئاخىرقى نەق قالدۇق
            </p>
          </div>

          {/* Transactions List */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">سودا نومۇرى (Talon / ID)</th>
                  <th className="py-2.5 px-3">توربېكەت</th>
                  <th className="py-2.5 px-3">خېرىدار</th>
                  <th className="py-2.5 px-3">سوممىسى</th>
                  <th className="py-2.5 px-3">ھالىتى</th>
                  <th className="py-2.5 px-3">ۋاقتى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data?.shamcash?.transactions?.slice(0, 50).map((t: ShamcashTx) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-white">{t.txId}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        t.platform === 'MAX_BAZAR' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {t.platform === 'MAX_BAZAR' ? 'MAX BAZAR' : 'AUTO CASH'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{t.customer}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">+${t.amount.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> دەلىللەندى
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{new Date(t.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: خېرىدارلار قالدۇق پۇلى (CUSTOMER BALANCES) */}
      {activeSubTab === 'customer_balances' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-white font-alkatip">خېرىدارلارنىڭ ھېساباتىدىكى قالدۇق پۇل كۆلچىكى</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ئومۇمىي قەرز مەجبۇرىيىتى: <strong className="text-amber-400 font-mono text-sm">${(data?.overview?.totalCustomerBalances || 0).toFixed(2)} USD</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.customers?.filter((c: CustomerItem) => c.balance > 0).map((c: CustomerItem) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[150px]">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    c.platform === 'MAX_BAZAR' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {c.platformLabel}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[11px] text-slate-400">مەۋجۇت قالدۇقى:</span>
                  <span className="text-base font-black text-amber-400 font-mono">${c.balance.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>سودا: {c.ordersCount} زاكاز</span>
                  <span>ئالاقە: {c.telegramUsername || c.phone || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: خېرىدارلار تىزىملىكى (CUSTOMER DIRECTORY) */}
      {activeSubTab === 'customer_directory' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-white font-alkatip">ئىككى توربېكەتنىڭ تولۇق خېرىدارلار تىزىملىكى</h2>
              <p className="text-xs text-slate-400 mt-0.5">جەمئىي {filteredCustomers.length} نەپەر خېرىدار</p>
            </div>

            {/* Filter buttons & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  onClick={() => setCustomerPlatformFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    customerPlatformFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  ھەممىسى
                </button>
                <button
                  onClick={() => setCustomerPlatformFilter('AUTO_CASH')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    customerPlatformFilter === 'AUTO_CASH' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  AUTO CASH
                </button>
                <button
                  onClick={() => setCustomerPlatformFilter('MAX_BAZAR')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    customerPlatformFilter === 'MAX_BAZAR' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  MAX BAZAR
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="ئىسىم، تېلېفون، Telegram ياكى ID بويىچە ئىزدەش..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="pr-8 pl-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-56 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">خېرىدار نامى</th>
                  <th className="py-2.5 px-3">مەنبە توربېكەت</th>
                  <th className="py-2.5 px-3">Telegram / ئالاقە</th>
                  <th className="py-2.5 px-3">قالدۇق پۇلى</th>
                  <th className="py-2.5 px-3">سالغان پۇلى</th>
                  <th className="py-2.5 px-3">خەجلىگەن پۇلى</th>
                  <th className="py-2.5 px-3">پۈتكەن زاكاز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredCustomers.map((c: CustomerItem) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-white block">{c.name}</span>
                      <span className="text-[10px] text-slate-500">{c.id}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        c.platform === 'MAX_BAZAR' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {c.platformLabel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{c.telegramUsername || c.phone || '-'}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-400">${c.balance.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-emerald-400">${c.totalDeposited.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-purple-400">${c.totalSpent.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-200">{c.completedOrdersCount} دانە</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 7: زاكازلارنى باشقۇرۇش (ORDERS MANAGEMENT) */}
      {activeSubTab === 'orders_manager' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-white font-alkatip">ئىككى توربېكەتنىڭ بىرلىككە كەلگەن زاكاز مەركىزى</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ھەر بىر زاكازدا ئېنىق <code className="text-emerald-400 font-bold">[AUTO CASH]</code> ياكى <code className="text-amber-400 font-bold">[MAX BAZAR]</code> نامى كۆرسىتىلىدۇ.
              </p>
            </div>

            {/* Order Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  onClick={() => setOrderPlatformFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    orderPlatformFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  ھەممىسى
                </button>
                <button
                  onClick={() => setOrderPlatformFilter('AUTO_CASH')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    orderPlatformFilter === 'AUTO_CASH' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  AUTO CASH
                </button>
                <button
                  onClick={() => setOrderPlatformFilter('MAX_BAZAR')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    orderPlatformFilter === 'MAX_BAZAR' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  MAX BAZAR
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="زاكاز نومۇرى، خېرىدار ياكى تاۋار بويىچە ئىزدەش..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="pr-8 pl-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-56 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">زاكاز نومۇرى</th>
                  <th className="py-2.5 px-3">مەنبە توربېكەت</th>
                  <th className="py-2.5 px-3">مەھسۇلات / بولاق</th>
                  <th className="py-2.5 px-3">خېرىدار</th>
                  <th className="py-2.5 px-3">تۆلىگەن سومما</th>
                  <th className="py-2.5 px-3">تەمىنلىگۈچى چىقىمى</th>
                  <th className="py-2.5 px-3">ساپ پايدا</th>
                  <th className="py-2.5 px-3">ھالىتى</th>
                  <th className="py-2.5 px-3">ۋاقتى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredOrders.slice(0, 100).map((o: OrderItem) => (
                  <tr key={o.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-white">{o.id}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        o.platform === 'MAX_BAZAR' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {o.brandName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans text-xs">{o.productName}</td>
                    <td className="py-2.5 px-3 text-slate-300">{o.customer}</td>
                    <td className="py-2.5 px-3 font-bold text-white">${o.customerPaid.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-amber-400">${o.supplierCost.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">+${o.profit.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : o.status === 'refunded'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300 animate-pulse'
                      }`}>
                        {o.status === 'completed' ? 'تاماملاندى' : o.status === 'refunded' ? 'پۇل قايتۇرۇلدى' : 'ئىشلىنىۋاتىدۇ'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 8: تەمىنلىگۈچىلەر چىقىمى (SUPPLIER EXPENSES) */}
      {activeSubTab === 'supplier_expenses' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-black text-white font-alkatip">تەمىنلىگۈچىلەر چىقىمى ۋە ھەقىقىي تەننەرخ</h2>
            <p className="text-xs text-slate-400 mt-0.5">پەقەت ئەمەلىي تاماملانغان زاكازلارنىڭ ھەقىقىي تەننەرخىلا ھېسابلىنىدۇ.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-cyan-400">1. Othman Store API (Auto Cash)</h3>
              <p className="text-xs text-slate-400">ئادرېس: {data?.suppliers?.othmanStore?.baseUrl}</p>
              <div className="pt-2 border-t border-slate-900 flex justify-between text-xs">
                <span className="text-slate-400">بۈگۈنكى ھەقىقىي تەننەرخ:</span>
                <span className="text-amber-400 font-mono font-bold">${(data?.suppliers?.othmanStore?.todayCost || 0).toFixed(2)} USD</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400">2. MaxStore Wholesale (Max BAZAR)</h3>
              <p className="text-xs text-slate-400">ئادرېس: {data?.suppliers?.maxStore?.baseUrl}</p>
              <div className="pt-2 border-t border-slate-900 flex justify-between text-xs">
                <span className="text-slate-400">بۈگۈنكى ھەقىقىي تەننەرخ:</span>
                <span className="text-amber-400 font-mono font-bold">${(data?.suppliers?.maxStore?.todayCost || 0).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: پايدا ۋە زىيان ھېساباتى (PROFIT & LOSS) */}
      {activeSubTab === 'profit_loss' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-black text-white font-alkatip">پايدا ۋە زىيان ھېساباتى (P&L Financial Ledger)</h2>
            <p className="text-xs text-slate-400 mt-0.5">ئەمەلىي تاماملانغان زاكازلار ئاساسىدا ھېسابلانغان رەسمىي پايدا-زىيان دەپتىرى</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-900">
              <span className="text-slate-300 font-sans">ئومۇمىي تاماملانغان زاكاز كىرىمى (Gross Turnover):</span>
              <span className="text-white font-bold">${(data?.overview?.todayTurnover || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-900 text-amber-400">
              <span className="font-sans">− تەمىنلىگۈچىگە كەتكەن ھەقىقىي تەننەرخ (COGS):</span>
              <span className="font-bold">−${(data?.overview?.todaySupplierCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-900 text-rose-400">
              <span className="font-sans">− خېرىدارغا قايتۇرۇلغان مەبلەغلەر (Refunds):</span>
              <span className="font-bold">−$0.00</span>
            </div>
            <div className="flex justify-between py-2 bg-emerald-950/20 px-3 rounded-xl border border-emerald-500/30 text-emerald-400 font-bold text-sm">
              <span className="font-sans">= ھەقىقىي ساپ پايدا (Net Realized Profit):</span>
              <span>+${(data?.overview?.todayNetProfit || 0).toFixed(2)} USD</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 10: AUTO CASH TORBEKITI */}
      {activeSubTab === 'autocash_site' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-white font-alkatip">Auto Cash توربېكىتى مەركىزى</h2>
            <p className="text-xs text-slate-400">توربېكەت: https://www.auto-cash.app</p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-alkatip">
            Auto Cash توربېكىتى ئويۇن قاچىلاش، Wi-Fi كارتىلىرى ۋە مەۋھۇم نومۇرلار مۇلازىمىتىنى ئۆز ئىچىگە ئالىدۇ. بارلىق ھېساباتلار ئايرىم ئارخىپلانغان.
          </p>
        </div>
      )}

      {/* SECTION 11: MAX BAZAR TORBEKITI */}
      {activeSubTab === 'maxbazar_site' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-white font-alkatip">Max BAZAR توربېكىتى مەركىزى</h2>
            <p className="text-xs text-slate-400">توربېكەت: https://www.auto-cash.app/apps</p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-alkatip">
            Max BAZAR كۆچمە مىكرو ئەپلەر (Mobile Legends, PUBG, Honor of Kings, Syriatel, MTN) مۇلازىمىتىنى تېز يەتكۈزۈش مەركىزى.
          </p>
        </div>
      )}

      {/* SECTION 12: TELEGRAM TEŃSHEKLIRI */}
      {activeSubTab === 'telegram_settings' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-white font-alkatip">Telegram بوت ۋە قانال دوكلات تەڭشەكلىرى</h2>
            <p className="text-xs text-slate-400">كۈندىلىك ۋە ھەپتىلىك مالىيە دوكلاتىنى ئاپتوماتىك قانالغا يەتكۈزۈش تەڭشىكى</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">ھۆكۈمەت بوتى:</span>
                <span className="text-slate-400">{data?.telegram?.botUsername || '@Autocash_24_bot'}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">ئاكتىپ ✅</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">پۈتكەن زاكازلار قانىلى:</span>
                <span className="text-slate-400">{data?.telegram?.ordersChannel || '@autocash_cannel'}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">ھوقۇقى بار ✅</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">كۈندىلىك ۋە ھەپتىلىك دوكلات قانىلى:</span>
                <span className="text-slate-400">{data?.telegram?.reportsChannel || '@autocashkirim'}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                ھەر كۈنى كۈندۈزى 12:00 دە ئەۋەتىلىدۇ ⏰
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => triggerTelegramPdf('daily')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>بۈگۈنكى كۈندىلىك دوكلاتنى ھازىرلا ئەۋەتىپ سىناش</span>
            </button>
            <button
              onClick={() => triggerTelegramPdf('weekly')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>ھەپتىلىك دوكلاتنى ھازىرلا ئەۋەتىپ سىناش</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 13: SISTEMA TEŃSHEKLIRI */}
      {activeSubTab === 'system_settings' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-white font-alkatip">سىستېما ۋە بىخەتەرلىك تەڭشەكلىرى</h2>
            <p className="text-xs text-slate-400">ساندان، ئاپتوماتىك قەرەللىك ۋەزىپە (Cron) ۋە PIN مەخپىي نۇمۇرلار</p>
          </div>
          <div className="text-xs text-slate-300 space-y-2 font-mono">
            <p>Admin PIN: {data?.settings?.adminPin ? '******' : 'Default'}</p>
            <p>TSA Automated ShamCash: Enabled (كۈندۈزى 12:00 دە دوكلات تەييارلاش)</p>
            <p>Cron Schedule: 0 9 * * * (09:00 UTC = 12:00 PM Turkey Time)</p>
          </div>
        </div>
      )}
    </div>
  );
}
