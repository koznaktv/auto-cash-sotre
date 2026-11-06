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

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  completedCount: number;
  pendingCount: number;
  refundedCount: number;
}

export default function AdminMaxbazarManager() {
  const [orders, setOrders] = useState<MaxbazarOrder[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'زاكازلارنى ئېلىشتا مەسىلە كۆرۈلدى' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تور ئۇلىنىش خاتالىقى' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
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
  }, [orders, selectedAppFilter, selectedStatusFilter, searchTerm]);

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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/80 border border-amber-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/10 to-amber-600/30 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                MAX-BAZAR مەركىزى
              </span>
              <span className="text-xs text-slate-400">ئەڭ يېڭى 5 رەسمىي ئەپ</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white mt-1">
              📱 MAX-BAZAR ئەپلەر ۋە زاكازلار باشقۇرۇش
            </h1>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 self-end md:self-auto">
          <a
            href="/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-amber-400" />
            <span>توربەتنى كۆرۈش</span>
          </a>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>زاكازلارنى يېڭىلاش</span>
          </button>
        </div>
      </div>

      {/* Live Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>جەمئىي زاكاز</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats?.totalOrders ?? orders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">MAX-BAZAR ئومۇمىي مىقدارى</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>ئومۇمىي پۇل سوممىسى</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ${(stats?.totalRevenue ?? orders.reduce((s, o) => s + (Number(o.price) || 0), 0)).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ھەميان ۋە شامكەش ئارقىلىق</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>مۇۋەپپەقىيەتلىك</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-2">
            {stats?.completedCount ?? orders.filter((o) => o.status === 'completed').length}
          </div>
          <div className="text-[11px] text-emerald-400/70 mt-1">سېكۇنتتا قاچىلانغانلار</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>بىر تەرەپ قىلىنىۋاتقان</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {stats?.pendingCount ??
              orders.filter((o) => o.status === 'wait' || o.status === 'in_progress' || !o.status).length}
          </div>
          <div className="text-[11px] text-amber-400/70 mt-1">كۈتۈۋاتقان ياكى يوللانغان</div>
        </div>
      </div>

      {/* 5 Apps Control Panel Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <span>🎮 5 چوڭ ئەپ باشقۇرۇش ۋە بىۋاسىتە ئۇلىنىشلار</span>
          </h2>
          <span className="text-xs text-slate-400">ھالىتى، چۈشۈرۈش ئادرېسى ۋە باھاسى</span>
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
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
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
                    onClick={() => setSelectedAppFilter(app.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold text-center flex items-center justify-center gap-1 transition"
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

      {/* Orders Management Table Section */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>🛒 زاكازلار تىزىملىكى ۋە باشقۇرۇش</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 font-normal">
                {filteredOrders.length} زاكاز
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              MAX-BAZAR ئارقىلىق بېرىلگەن بارلىق پۇل قاچىلاش ۋە تور زاكازلىرى
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
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
              <option value="mtn">MTN سۈرىيە</option>
              <option value="syriatel">Syriatel سۈرىيەتەل</option>
            </select>

            {/* Status Filter Selector */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">بارلىق ھالەتلەر</option>
              <option value="completed">تاماملانغان</option>
              <option value="pending">بىر تەرەپ قىلىنىۋاتقان</option>
              <option value="refunded">قايتۇرۇلغان</option>
            </select>
          </div>
        </div>

        {/* Table / List View */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
            <p className="text-xs">زاكازلار ئوقۇلىۋاتىدۇ...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-14 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Smartphone className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-400">ھېچقانداق زاكاز تېپىلمىدى</p>
            <p className="text-xs text-slate-600 mt-1">سۈزگۈچنى قايتا تەڭشەپ بېقىڭ ياكى يېڭىلاڭ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300 text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 bg-slate-950/40">
                  <th className="py-3 px-3">زاكاز ID</th>
                  <th className="py-3 px-3">ئەپ تۈرى</th>
                  <th className="py-3 px-3">بولاق / تۈر</th>
                  <th className="py-3 px-3">نىشان كىملىك (ID / نومۇر)</th>
                  <th className="py-3 px-3">ئىشلەتكۈچى</th>
                  <th className="py-3 px-3">باھا ($)</th>
                  <th className="py-3 px-3">ھالەت</th>
                  <th className="py-3 px-3 text-center">باشقۇرۇش مەشغۇلاتى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((ord) => {
                  const isActioning = actionLoadingId === ord.order_id;
                  const isSuccess = ord.status === 'completed';
                  const isRefunded = ord.status === 'refunded';
                  const isPending = !isSuccess && !isRefunded;

                  return (
                    <tr
                      key={ord.order_id}
                      className="hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <button
                          onClick={() => copyToClipboard(ord.order_id, ord.order_id)}
                          className="flex items-center gap-1 text-slate-300 hover:text-amber-400 transition"
                          title="نۇسخىلاش"
                        >
                          <span>{ord.order_id}</span>
                          {copiedId === ord.order_id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* App Name */}
                      <td className="py-3 px-3 font-bold text-white">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px]">
                          {ord.app_id === 'pubg' || ord.app_id === 'pubg-mobile'
                            ? 'PUBG'
                            : ord.app_id === 'honor-of-kings' || ord.app_id === 'hok'
                            ? 'HOK'
                            : ord.app_id === 'mobile-legends' || ord.app_id === 'mlbb'
                            ? 'MLBB'
                            : ord.app_id === 'mtn-syria' || ord.app_id === 'mtn'
                            ? 'MTN'
                            : ord.app_id === 'syriatel'
                            ? 'Syriatel'
                            : ord.app_id}
                        </span>
                      </td>

                      {/* Package Name */}
                      <td className="py-3 px-3 text-amber-300 font-semibold max-w-[150px] truncate">
                        {ord.package_name}
                      </td>

                      {/* Target Account */}
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        <div>
                          <span>{ord.player_id}</span>
                          {ord.zone_id && (
                            <span className="text-[10px] text-slate-400 mr-1">({ord.zone_id})</span>
                          )}
                          {ord.nickname && (
                            <div className="text-[10px] text-emerald-400 font-sans font-normal truncate max-w-[120px]">
                              {ord.nickname}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Customer Identity */}
                      <td className="py-3 px-3 text-slate-400 max-w-[120px] truncate">
                        {ord.identity || 'نامەلۇم'}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 font-black text-emerald-400">
                        ${Number(ord.price || 0).toFixed(2)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            مۇۋەپپەقىيەتلىك
                          </span>
                        ) : isRefunded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <RotateCcw className="w-3 h-3" />
                            قايتۇرۇلغان
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3 animate-spin" />
                            بىر تەرەپ قىلىنماقتا
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending && (
                            <>
                              <button
                                disabled={isActioning}
                                onClick={() => handleUpdateStatus(ord.order_id, 'completed')}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition disabled:opacity-50"
                                title="مۇۋەپپەقىيەتلىك دەپ بەلگىلەش"
                              >
                                {isActioning ? '...' : 'تامام'}
                              </button>
                              <button
                                disabled={isActioning}
                                onClick={() => handleUpdateStatus(ord.order_id, 'refunded')}
                                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition disabled:opacity-50"
                                title="قالدۇقنى ھېسابىغا قايتۇرۇش"
                              >
                                {isActioning ? '...' : 'قايتۇرۇش'}
                              </button>
                            </>
                          )}
                          {isSuccess && (
                            <button
                              disabled={isActioning}
                              onClick={() => handleUpdateStatus(ord.order_id, 'refunded')}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[10px] font-medium transition"
                              title="قايتۇرۇش"
                            >
                              قايتۇرۇش
                            </button>
                          )}
                          {isRefunded && (
                            <span className="text-[10px] text-slate-500">تاماملانغان</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
