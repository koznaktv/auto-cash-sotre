'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Smartphone,
  Gamepad2,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Flame,
  Layers,
  Copy,
  Check,
  Filter,
  Eye,
  ArrowUpDown,
  RotateCcw,
  Users,
  Send,
  UserCheck,
  Wallet,
  Coins,
  BadgeDollarSign,
  PlusCircle,
  MinusCircle,
  X,
  MessageCircle,
} from 'lucide-react';
import { ACTIVE_CATALOG } from '@/lib/appsCatalog';

interface MaxbazarOrder {
  order_id: string;
  app_id: string;
  package_id: string;
  package_name: string;
  price: number;
  player_id: string;
  zone_id?: string;
  nickname?: string;
  identity: string;
  status: 'wait' | 'in_progress' | 'completed' | 'refunded' | string;
  provider_order_id?: string;
  created_at?: string;
  completed_at?: string;
  refunded_at?: string;
  refund_note?: string;
}

interface MaxbazarMember {
  id: string;
  name: string;
  username?: string;
  telegramChatId?: string | number;
  phone?: string;
  email: string;
  balance: number;
  totalSpent: number;
  orderCount: number;
  vipTier: string;
  lastActive?: string;
  createdAt: string;
}

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  completedCount: number;
  pendingCount: number;
  refundedCount: number;
  netProfit: number;
  profitMarginPercent: number;
  providerBalance: number | null;
  memberCount: number;
}

export default function AdminMaxbazarManager() {
  const [orders, setOrders] = useState<MaxbazarOrder[]>([]);
  const [members, setMembers] = useState<MaxbazarMember[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [providerBalance, setProviderBalance] = useState<number | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [providerProfile, setProviderProfile] = useState<{ username?: string; user_id?: number } | null>(null);
  const [refreshingProvider, setRefreshingProvider] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Navigation tabs inside MAX-BAZAR: 'orders' | 'active_orders' | 'members' | 'apps'
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'active_orders' | 'members' | 'apps'>('orders');

  const [selectedAppFilter, setSelectedAppFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Balance Adjust Modal
  const [selectedMemberForBalance, setSelectedMemberForBalance] = useState<MaxbazarMember | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustingLoading, setAdjustingLoading] = useState(false);

  // App active states in localStorage or default true
  const [appStates, setAppStates] = useState<Record<string, boolean>>({
    pubg: true,
    hok: true,
    mlbb: true,
    mtn: true,
    syriatel: true,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/apps/order?admin=true&app_id=all');
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders || []);
        if (data.stats) setStats(data.stats);
        if (data.members) setMembers(data.members || []);
        if (data.provider_balance !== undefined) setProviderBalance(data.provider_balance);
      } else {
        setMessage({ type: 'error', text: data.error || 'زاكازلارنى ئېلىشتا مەسىلە كۆرۈلدى' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تور ئۇلىنىش خاتالىقى' });
    } finally {
      setLoading(false);
    }
  };

  const refreshProviderBalance = async () => {
    try {
      setRefreshingProvider(true);
      setProviderError(null);
      const res = await fetch('/api/maxstore/status');
      const data = await res.json();
      if (data.ok && typeof data.balance === 'number') {
        setProviderBalance(data.balance);
        if (data.profile) setProviderProfile(data.profile);
        setProviderError(null);
        setMessage({ type: 'success', text: `تەمىنلىگۈچى قالدۇق پۇلى يېڭىلاندى: $${data.balance.toFixed(2)}` });
      } else {
        const errText = data.error || data.message || 'تەمىنلىگۈچىگە ئۇلىنالمىدى';
        setProviderError(errText);
        setMessage({ type: 'error', text: errText });
      }
    } catch (e: any) {
      const errText = e?.message || 'تەمىنلىگۈچى قالدۇقىنى يېڭىلاش مەغلۇپ بولدى';
      setProviderError(errText);
      setMessage({ type: 'error', text: errText });
    } finally {
      setRefreshingProvider(false);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  useEffect(() => {
    fetchOrders();
    refreshProviderBalance();
    try {
      const saved = localStorage.getItem('maxbazar_app_states');
      if (saved) setAppStates(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleAppState = (appId: string) => {
    const updated = { ...appStates, [appId]: !appStates[appId] };
    setAppStates(updated);
    try {
      localStorage.setItem('maxbazar_app_states', JSON.stringify(updated));
    } catch {}
    setMessage({
      type: 'success',
      text: `${appId} ئەپ ھالىتى ${updated[appId] ? 'ئاكتىپلاشتۇرۇلدى' : 'ۋاقىتلىق توختىتىلدى'}`,
    });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setActionLoadingId(orderId);
      const res = await fetch('/api/apps/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, new_status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({
          type: 'success',
          text: `زاكاز #${orderId} ھالىتى [${newStatus}] گە ئۆزگەرتىلدى`,
        });
        fetchOrders();
      } else {
        setMessage({ type: 'error', text: data.error || 'ھالەتنى يېڭىلاش مەغلۇپ بولدى' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'سېرۋېردا خاتالىق يۈز بەردى' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const handleBroadcastChannel = async (orderId: string) => {
    try {
      setActionLoadingId(orderId);
      const res = await fetch('/api/apps/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'broadcast_channel', order_id: orderId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: 'success', text: `📢 زاكاز #${orderId} مۇۋەپپەقىيەتلىك ھالدا @autocash_cannel قانىلىغا چىقىرىلدى!` });
      } else {
        setMessage({ type: 'error', text: data.error || 'قانالغا چىقىرىش مەغلۇپ بولدى' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'تور خاتالىقى' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForBalance) return;
    const val = parseFloat(adjustAmount);
    if (isNaN(val) || val <= 0) {
      setMessage({ type: 'error', text: 'مۇۋاپىق سومما كىرگۈزۈڭ' });
      return;
    }
    const finalDelta = adjustType === 'add' ? val : -val;
    try {
      setAdjustingLoading(true);
      const res = await fetch('/api/apps/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_user_balance',
          user_id: selectedMemberForBalance.id,
          identity: selectedMemberForBalance.username || selectedMemberForBalance.name,
          delta: finalDelta,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({
          type: 'success',
          text: `${selectedMemberForBalance.name} نىڭ قالدۇقىغا ${adjustType === 'add' ? '+' : '-'}$${val.toFixed(2)} مۇۋەپپەقىيەتلىك تەڭشەلدى!`,
        });
        setSelectedMemberForBalance(null);
        setAdjustAmount('');
        fetchOrders();
      } else {
        setMessage({ type: 'error', text: data.error || 'تەڭشەش مەغلۇپ بولدى' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تور خاتالىقى' });
    } finally {
      setAdjustingLoading(false);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Active / in-flight orders
  const activeOrdersList = useMemo(() => {
    return orders.filter((o) => o.status === 'wait' || o.status === 'in_progress' || o.status === 'processing' || !o.status);
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const listToFilter = activeSubTab === 'active_orders' ? activeOrdersList : orders;

    return listToFilter.filter((order) => {
      // App Filter
      if (selectedAppFilter !== 'all') {
        const matchesApp =
          order.app_id === selectedAppFilter ||
          (selectedAppFilter === 'pubg' && order.app_id === 'pubg-mobile') ||
          (selectedAppFilter === 'hok' && order.app_id === 'honor-of-kings') ||
          (selectedAppFilter === 'mlbb' && order.app_id === 'mobile-legends') ||
          (selectedAppFilter === 'mtn' && order.app_id === 'mtn-syria') ||
          (selectedAppFilter === 'syriatel' && order.app_id === 'syriatel');
        if (!matchesApp) return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'pending') {
          if (order.status !== 'wait' && order.status !== 'in_progress' && order.status) return false;
        } else if (order.status !== selectedStatusFilter) {
          return false;
        }
      }

      // Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesQuery =
          order.order_id?.toLowerCase().includes(query) ||
          order.identity?.toLowerCase().includes(query) ||
          order.player_id?.toLowerCase().includes(query) ||
          order.package_name?.toLowerCase().includes(query) ||
          order.nickname?.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [orders, activeOrdersList, activeSubTab, selectedAppFilter, selectedStatusFilter, searchTerm]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    if (!memberSearchTerm.trim()) return members;
    const q = memberSearchTerm.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.username && m.username.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.telegramChatId && String(m.telegramChatId).includes(q))
    );
  }, [members, memberSearchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans text-right" dir="rtl">
      {/* Top Banner Alert / Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-medium shadow-lg transition-all ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 transition px-2 py-1"
          >
            تاقاش
          </button>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/90 border border-amber-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/10 to-amber-600/30 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                MAX-BAZAR باشقۇرۇش مەركىزى
              </span>
              <span className="text-xs text-slate-400">ئورتاق ھەميان ۋە تەمىنلىگۈچى باشقۇرۇش</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white mt-1">
              📱 MAX-BAZAR ئەپلەر، ئەزالار ۋە پايدا مەركىزى
            </h1>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 self-end md:self-auto flex-wrap">
          <a
            href="/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-amber-400" />
            <span>توربەتنى ئېچىش</span>
          </a>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>ھەممىنى يېڭىلاش</span>
          </button>
        </div>
      </div>

      {/* 4 Executive Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ساپ پايدا (Net Profit) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-900 border border-emerald-500/30 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
              <span>قالغان ساپ پايدا</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              +{stats?.profitMarginPercent ?? 12.0}% نىسبەت
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
            +${(stats?.netProfit ?? 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>ئومۇمىي كىرىم: ${(stats?.totalRevenue ?? 0).toFixed(2)}</span>
            <span className="text-emerald-500/80 font-bold">ساپ كىرىم</span>
          </div>
        </div>

        {/* Card 2: تەمىنلىگۈچى قالدۇق پۇلى (Wholesale Provider Balance) */}
        <div 
          onClick={refreshProviderBalance}
          className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-900 border border-amber-500/30 shadow-xl relative overflow-hidden group cursor-pointer hover:border-amber-500/60 transition"
          title="قايتا سۈرۈشتۈرۈش ئۈچۈن چېكىڭ"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>تەمىنلىگۈچىدىن قالغان پۇل</span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshProviderBalance();
              }}
              disabled={refreshingProvider}
              className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition cursor-pointer"
              title="تەمىنلىگۈچى قالدۇقىنى قايتا سۈرۈشتۈرۈش"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingProvider ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2 font-mono">
            {refreshingProvider ? (
              <span className="text-amber-300/80 text-2xl animate-pulse">سۈرۈشتۈرۈۋاتىدۇ...</span>
            ) : providerBalance !== null ? (
              `$${providerBalance.toFixed(2)}`
            ) : providerError ? (
              <span className="text-rose-400 text-sm font-sans flex items-center gap-1">
                <span>ئۇلانمىدى (قايتا سىناڭ)</span>
              </span>
            ) : (
              'ئۇلىنىۋاتىدۇ...'
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${providerBalance !== null ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              MaxStore {providerProfile?.username ? `(${providerProfile.username})` : 'توپ تارقىتىش API'}
            </span>
            <span className="text-amber-400/80 font-bold">
              {providerBalance !== null ? 'ئاكتىپ' : 'قايتا سىناش'}
            </span>
          </div>
        </div>

        {/* Card 3: بولىۋاتقان زاكازلار (Active / In-progress Orders) */}
        <div
          onClick={() => setActiveSubTab('active_orders')}
          className="p-4 rounded-3xl bg-gradient-to-br from-orange-950/30 via-slate-900/80 to-slate-900 border border-orange-500/30 shadow-xl relative overflow-hidden cursor-pointer hover:border-orange-500/60 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold text-orange-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>بولىۋاتقان زاكازلار</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">
              ھازىر ئاكتىپ
            </span>
          </div>
          <div className="text-3xl font-black text-orange-400 mt-2 font-mono">
            {activeOrdersList.length} <span className="text-base font-normal text-slate-400">دانە</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>تەمىنلىگۈچىگە يوللانغان</span>
            <span className="text-orange-400 underline font-bold">كۆرۈش →</span>
          </div>
        </div>

        {/* Card 4: ماكس بازار ئەزالار سانى (Members & Customer Wallets) */}
        <div
          onClick={() => setActiveSubTab('members')}
          className="p-4 rounded-3xl bg-gradient-to-br from-cyan-950/30 via-slate-900/80 to-slate-900 border border-cyan-500/30 shadow-xl relative overflow-hidden cursor-pointer hover:border-cyan-500/60 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>ماكس بازار ئەزالىرى</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ئورتاق ھەميان
            </span>
          </div>
          <div className="text-3xl font-black text-cyan-400 mt-2 font-mono">
            {members.length} <span className="text-base font-normal text-slate-400">نەپەر</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>ئومۇمىي تامام: {stats?.completedCount ?? 0}</span>
            <span className="text-cyan-400 underline font-bold">ئەزالارنى كۆرۈش →</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'orders'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>بارلىق زاكازلار ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('active_orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'active_orders'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
              : 'text-orange-400 hover:text-orange-300 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>⚡ بولىۋاتقان زاكازلار ({activeOrdersList.length})</span>
          {activeOrdersList.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('members')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'members'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 ماكس بازار ئەزالار تىزىملىكى ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('apps')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'apps'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'text-purple-400 hover:text-purple-300 hover:bg-slate-800'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>🎮 5 ئەپ تىزىملىكى ۋە كونترول</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: MEMBERS LIST (ماكس بازار ئەزالار تىزىملىكى) */}
      {/* ======================================================== */}
      {activeSubTab === 'members' && (
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>ماكس بازار ئەزالىرى ۋە ھەميان قالدۇقى</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-cyan-500/20 text-cyan-300 font-bold">
                  {filteredMembers.length} ئەزا
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                MAX-BAZAR دا زاكاز بەرگەن ياكى تېلېگرامما ئارقىلىق كىرگەن بارلىق خېرىدارلارنىڭ ئورتاق قالدۇقى
              </p>
            </div>

            {/* Member Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ئىسىم، تېلېگرامما، ئېلخەت..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">خېرىدار / ئىشلەتكۈچى</th>
                  <th className="py-3 px-3">ئالاقە (تېلېگرامما / ئېلخەت)</th>
                  <th className="py-3 px-3 text-center">ئورتاق قالدۇق پۇلى</th>
                  <th className="py-3 px-3 text-center">ئەپكە خەجلىگىنى</th>
                  <th className="py-3 px-3 text-center">زاكاز سانى</th>
                  <th className="py-3 px-3 text-center">دەرىجە</th>
                  <th className="py-3 px-3 text-center">مەشغۇلات</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      ھېچقانداق ئەزا تېپىلمىدى.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition"
                    >
                      {/* Name / Avatar */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md">
                            {(member.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{member.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {member.id.slice(0, 10)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact / Telegram */}
                      <td className="py-3 px-3 font-mono">
                        {member.username ? (
                          <a
                            href={`https://t.me/${member.username.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 inline-flex"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>@{member.username.replace(/^@/, '')}</span>
                          </a>
                        ) : member.telegramChatId ? (
                          <span className="text-slate-400 text-[11px]">TG ID: {member.telegramChatId}</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">{member.email}</span>
                        )}
                        {member.phone && (
                          <span className="block text-[10px] text-slate-500">{member.phone}</span>
                        )}
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          ${member.balance.toFixed(2)}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        ${member.totalSpent.toFixed(2)}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-[11px]">
                          {member.orderCount} زاكاز
                        </span>
                      </td>

                      {/* VIP Tier */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase font-mono">
                          {member.vipTier}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedMemberForBalance(member);
                              setAdjustType('add');
                              setAdjustAmount('5.00');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="قالدۇق پۇل قوشۇش ياكى تەڭشەش"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>قالدۇق تەڭشەش</span>
                          </button>

                          {member.username && (
                            <a
                              href={`https://t.me/${member.username.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition"
                              title="تېلېگراممىدا پاراڭلىشىش"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </a>
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
      )}

      {/* ======================================================== */}
      {/* VIEW 2 & 3: ORDERS & ACTIVE ORDERS LIST */}
      {/* ======================================================== */}
      {(activeSubTab === 'orders' || activeSubTab === 'active_orders') && (
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>
                  {activeSubTab === 'active_orders' ? '⚡ ھازىر بىر تەرەپ قىلىنىۋاتقان زاكازلار' : '🛒 MAX-BAZAR بارلىق زاكازلار تىزىملىكى'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 font-normal">
                  {filteredOrders.length} زاكاز
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeSubTab === 'active_orders'
                  ? 'تەمىنلىگۈچى (MaxStore) قاچىلاۋاتقان زاكازلارنىڭ نەق مەيدان ھالىتى'
                  : 'MAX-BAZAR ئارقىلىق بېرىلگەن بارلىق پۇل قاچىلاش ۋە تور زاكازلىرى'}
              </p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 md:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ID، نومۇر ياكى ئىشلەتكۈچى..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* App Filter Selector */}
              <select
                value={selectedAppFilter}
                onChange={(e) => setSelectedAppFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">بارلىق ئەپلەر</option>
                <option value="pubg">PUBG Mobile</option>
                <option value="hok">Honor of Kings</option>
                <option value="mlbb">Mobile Legends</option>
                <option value="mtn">MTN Syria</option>
                <option value="syriatel">Syriatel</option>
              </select>

              {/* Status Filter Selector (if not active_orders) */}
              {activeSubTab === 'orders' && (
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">بارلىق ھالەتلەر</option>
                  <option value="pending">بولىۋاتقان (Wait / In Progress)</option>
                  <option value="completed">تاماملانغان (Completed)</option>
                  <option value="refunded">قايتۇرۇلغان (Refunded)</option>
                </select>
              )}
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">زاكاز ID / ۋاقتى</th>
                  <th className="py-3 px-3">ئەپ ۋە مەھسۇلات</th>
                  <th className="py-3 px-3">ئويۇنچى UID / نومۇرى</th>
                  <th className="py-3 px-3">خېرىدار</th>
                  <th className="py-3 px-3">تەمىنلىگۈچى (MaxStore)</th>
                  <th className="py-3 px-3 text-center">سومما</th>
                  <th className="py-3 px-3 text-center">ھالەت</th>
                  <th className="py-3 px-3 text-center">مەشغۇلات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      {activeSubTab === 'active_orders'
                        ? '🎉 ھازىر بىر تەرەپ قىلىنىۋاتقان كۈتۈش زاكازلىرى يوق، بارلىق زاكازلار پۈتكەن!'
                        : 'ھېچقانداق زاكاز تېپىلمىدى.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isPending = order.status === 'wait' || order.status === 'in_progress' || order.status === 'processing' || !order.status;
                    const isCompleted = order.status === 'completed' || order.status === 'success';
                    const isRefunded = order.status === 'refunded';

                    return (
                      <tr
                        key={order.order_id}
                        className="border-b border-slate-800/60 hover:bg-slate-800/40 transition"
                      >
                        {/* Order ID */}
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-cyan-300 block">{order.order_id}</span>
                          <span className="text-[10px] text-slate-500">
                            {order.created_at?.substring(0, 16).replace('T', ' ') || '-'}
                          </span>
                        </td>

                        {/* App & Package */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block uppercase">
                            {order.app_id}
                          </span>
                          <span className="text-[11px] text-amber-300 font-medium">
                            {order.package_name}
                          </span>
                        </td>

                        {/* Player ID / Target */}
                        <td className="py-3 px-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-400 select-all">
                              {order.player_id}
                            </span>
                            <button
                              onClick={() => copyToClipboard(order.player_id, order.order_id)}
                              className="text-slate-400 hover:text-white transition p-0.5"
                              title="UID كۆچۈرۈش"
                            >
                              {copiedId === order.order_id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {order.zone_id && (
                            <span className="text-[10px] text-slate-400 block">
                              Server/Zone: {order.zone_id}
                            </span>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {order.identity?.startsWith('@') ? (
                            <a
                              href={`https://t.me/${order.identity.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:underline"
                            >
                              {order.identity}
                            </a>
                          ) : (
                            <span>{order.identity}</span>
                          )}
                        </td>

                        {/* Wholesale Provider Order ID */}
                        <td className="py-3 px-3 font-mono">
                          {order.provider_order_id ? (
                            <span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded text-[10px] border border-purple-500/20 block w-max">
                              MaxStore #{order.provider_order_id}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">بىۋاسىتە</span>
                          )}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                          ${Number(order.price || 0).toFixed(2)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-center">
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              تاماملاندى
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                              بىر تەرەپ قىلىنىۋاتىدۇ
                            </span>
                          )}
                          {isRefunded && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              قايتۇرۇلدى
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {/* Broadcast to Channel */}
                            <button
                              onClick={() => handleBroadcastChannel(order.order_id)}
                              disabled={actionLoadingId === order.order_id}
                              className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="قانالغا چىقىرىش"
                            >
                              <Send className="w-3 h-3" />
                              <span>قانالغا</span>
                            </button>

                            {/* Mark completed */}
                            {!isCompleted && (
                              <button
                                onClick={() => handleUpdateStatus(order.order_id, 'completed')}
                                disabled={actionLoadingId === order.order_id}
                                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold transition cursor-pointer"
                              >
                                تامام
                              </button>
                            )}

                            {/* Refund */}
                            {!isRefunded && (
                              <button
                                onClick={() => handleUpdateStatus(order.order_id, 'refunded')}
                                disabled={actionLoadingId === order.order_id}
                                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold transition cursor-pointer"
                              >
                                قايتۇرۇش
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: 5 APPS HUB (5 چوڭ ئەپ باشقۇرۇش كۆزنىكى) */}
      {/* ======================================================== */}
      {activeSubTab === 'apps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              <span>5 چوڭ ئەپ ھالىتى ۋە تەمىنلىگۈچى ئۇلىنىشلىرى</span>
            </h2>
            <span className="text-xs text-slate-400">ھالىتىنى ئېچىش ياكى ۋاقىتلىق توختىتىش</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACTIVE_CATALOG.map((app) => {
              const isActive = appStates[app.id] ?? true;
              return (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-500/30 shadow-md shrink-0">
                          <Image
                            src={app.icon}
                            alt={app.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">{app.name}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{app.tagline}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleAppState(app.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                      >
                        {isActive ? '● ئاكتىپ' : '○ توختىتىلغان'}
                      </button>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center justify-between bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 text-[11px]">باھا تىزىملىكى:</span>
                        <span className="font-bold text-amber-400 text-[11px]">{app.priceNote}</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 text-[11px]">يەتكۈزۈش سۈرئىتى:</span>
                        <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {app.speed}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <a
                      href={app.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                      <span>ئەپكە كىرىش</span>
                    </a>
                    <button
                      onClick={() => {
                        setSelectedAppFilter(app.id);
                        setActiveSubTab('orders');
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold text-center flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Filter className="w-3 h-3" />
                      <span>زاكازلارنى سۈزۈش</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BALANCE ADJUST MODAL (خېرىدار قالدۇقىنى تەڭشەش كۆزنىكى) */}
      {/* ======================================================== */}
      {selectedMemberForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <Wallet className="w-5 h-5 text-amber-400" />
                <span>خېرىدار قالدۇقىنى تەڭشەش</span>
              </div>
              <button
                onClick={() => setSelectedMemberForBalance(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">خېرىدار ئىسمى:</span>
                <span className="font-bold text-white">{selectedMemberForBalance.name}</span>
              </div>
              {selectedMemberForBalance.username && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">تېلېگرامما:</span>
                  <span className="text-sky-400 font-mono font-bold">@{selectedMemberForBalance.username.replace(/^@/, '')}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400">ھازىرقى مەۋجۇت قالدۇق:</span>
                <span className="text-emerald-400 font-mono font-black text-sm">
                  ${selectedMemberForBalance.balance.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              {/* Add vs Deduct Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    adjustType === 'add'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>پۇل قوشۇش (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('deduct')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    adjustType === 'deduct'
                      ? 'bg-rose-500 text-white font-black'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>كېمەيتىش (-)</span>
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  تەڭشەيدىغان سومما ($ USD):
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-7 pl-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                {[1, 5, 10, 20, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAdjustAmount(preset.toFixed(2))}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono transition"
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={adjustingLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {adjustingLoading ? 'تەڭشىلىۋاتىدۇ...' : 'تەستىقلاش'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMemberForBalance(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  بىكار قىلىش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
