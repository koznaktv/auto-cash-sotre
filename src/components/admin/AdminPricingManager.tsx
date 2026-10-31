'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Search,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  Gamepad2,
  Wifi,
  Smartphone,
  Bot,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

interface PricingRow {
  serviceId: string;
  serviceName: string;
  category: string;
  icon?: string;
  image?: string;
  packageId: string;
  title: string;
  costPrice: number;
  price: number;
  profit: number;
  marginPercent: number;
  originalPrice?: number;
  available: boolean;
}

const CATEGORY_NAMES: { [key: string]: { label: string; icon: any } } = {
  all: { label: 'بارلىق تۈرلەر', icon: Layers },
  wifi: { label: 'Wi-Fi كارتىلىرى', icon: Wifi },
  games: { label: 'ئويۇنلار تۈرى', icon: Gamepad2 },
  apps: { label: 'ئەپلەر ۋە VPN', icon: Smartphone },
  ai: { label: 'سۈنئىي ئەقىل (AI)', icon: Bot },
  cards: { label: 'تىلېكوم ۋە كارتىلار', icon: Tag },
  social: { label: 'ئىجتىمائىي تاراتقۇ', icon: Sparkles },
};

export default function AdminPricingManager() {
  const [items, setItems] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pendingChanges, setPendingChanges] = useState<{
    [packageId: string]: { serviceId: string; price: number; costPrice: number; profit: number };
  }>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isBatchSaving, setIsBatchSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; success: boolean } | null>(null);

  const getAdminToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('autocash_admin_token') || '';
    }
    return '';
  };

  const fetchPricingData = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/pricing');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setStatusMessage({ text: data.message || 'باھا تىزىملىكىنى ئېلىش مەغلۇپ بولدى', success: false });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: 'مۇلازىمېتىرغا ئۇلىنىش مەغلۇپ بولدى', success: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
  }, []);

  // When user edits Selling Price ($)
  const handlePriceChange = (row: PricingRow, newPriceStr: string) => {
    const val = parseFloat(newPriceStr);
    const newPrice = isNaN(val) ? 0 : val;
    const cost = row.costPrice;
    const newProfit = Number((newPrice - cost).toFixed(3));

    setPendingChanges((prev) => ({
      ...prev,
      [row.packageId]: {
        serviceId: row.serviceId,
        price: newPrice,
        costPrice: cost,
        profit: newProfit,
      },
    }));
  };

  // When user edits Net Profit ($)
  const handleProfitChange = (row: PricingRow, newProfitStr: string) => {
    const val = parseFloat(newProfitStr);
    const newProfit = isNaN(val) ? 0 : val;
    const cost = row.costPrice;
    const newPrice = Number((cost + newProfit).toFixed(3));

    setPendingChanges((prev) => ({
      ...prev,
      [row.packageId]: {
        serviceId: row.serviceId,
        price: newPrice,
        costPrice: cost,
        profit: newProfit,
      },
    }));
  };

  // Save single row
  const handleSaveRow = async (row: PricingRow) => {
    const change = pendingChanges[row.packageId];
    if (!change) return;

    setSavingId(row.packageId);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          serviceId: change.serviceId,
          packageId: row.packageId,
          price: change.price,
          costPrice: change.costPrice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local item
        setItems((prev) =>
          prev.map((item) =>
            item.packageId === row.packageId
              ? {
                  ...item,
                  price: change.price,
                  profit: change.profit,
                  marginPercent: item.costPrice > 0 ? Math.round((change.profit / item.costPrice) * 100) : 0,
                }
              : item
          )
        );

        // Remove from pending
        setPendingChanges((prev) => {
          const next = { ...prev };
          delete next[row.packageId];
          return next;
        });

        setSavedId(row.packageId);
        setTimeout(() => setSavedId(null), 2000);
      } else {
        setStatusMessage({ text: data.message || 'ساقلاش مەغلۇپ بولدى', success: false });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: 'ساقلاش جەريانىدا تور خاتالىقى كۆرۈلدى', success: false });
    } finally {
      setSavingId(null);
    }
  };

  // Save all modified rows in batch
  const handleSaveAll = async () => {
    const changeEntries = Object.entries(pendingChanges);
    if (changeEntries.length === 0) return;

    setIsBatchSaving(true);
    setStatusMessage(null);

    const itemsToSave = changeEntries.map(([packageId, val]) => ({
      serviceId: val.serviceId,
      packageId,
      price: val.price,
      costPrice: val.costPrice,
    }));

    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({ items: itemsToSave }),
      });

      const data = await res.json();
      if (data.success) {
        // Apply all changes to local items
        setItems((prev) =>
          prev.map((item) => {
            const ch = pendingChanges[item.packageId];
            if (ch) {
              return {
                ...item,
                price: ch.price,
                profit: ch.profit,
                marginPercent: item.costPrice > 0 ? Math.round((ch.profit / item.costPrice) * 100) : 0,
              };
            }
            return item;
          })
        );

        setPendingChanges({});
        setStatusMessage({
          text: `🎉 جەمئىي ${data.updatedCount || itemsToSave.length} مەھسۇلات باھاسى مۇۋەپپەقىيەتلىك توربەتكە يېڭىلاندى!`,
          success: true,
        });
      } else {
        setStatusMessage({ text: data.message || 'ھەممىنى ساقلاش مەغلۇپ بولدى', success: false });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: 'ساقلاش جەريانىدا خاتالىق كۆرۈلدى', success: false });
    } finally {
      setIsBatchSaving(false);
    }
  };

  // Filtered rows based on category and search
  const filteredRows = useMemo(() => {
    return items.filter((row) => {
      const matchCat = selectedCategory === 'all' || row.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        row.serviceName.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.serviceId.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, search]);

  const pendingCount = Object.keys(pendingChanges).length;

  return (
    <div className="space-y-4 font-alkatip text-slate-900 dark:text-slate-100" dir="rtl">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>باھا ۋە ساپ پايدا باشقۇرۇش مەركىزى</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                {items.length} مەھسۇلات
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تەمىنلىگۈچى تەننەرخى، سېتىش باھاسى ۋە قالىدىغان ساپ پايدىنى بىۋاسىتە ئۆزگەرتىپ توربەتتە شۇ ھامان كۈچكە ئىگە قىلىش
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={isBatchSaving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 animate-pulse"
            >
              {isBatchSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>ھەممىنى ساقلاش ({pendingCount})</span>
            </button>
          )}

          <button
            onClick={fetchPricingData}
            disabled={loading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-white/10"
            title="يېڭىلاش"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">يېڭىلاش</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
            statusMessage.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs px-2 py-0.5 rounded-lg opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Category Filter Pills */}
      <div className="p-3.5 rounded-3xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 مەھسۇلات نامى ياكى تۈرىنى ئىزدەڭ... (مەسىلەن: PUBG, Free Fire, Azez Net, Proton...)"
            className="w-full bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {Object.entries(CATEGORY_NAMES).map(([catKey, catInfo]) => {
            const Icon = catInfo.icon;
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{catInfo.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Pricing Table */}
      <div className="rounded-3xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-2 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
            <p className="text-xs font-bold">بارلىق باھالار يۈكلىنىۋاتىدۇ...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center space-y-2 text-slate-400">
            <Tag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-bold">بۇ تۈردە مەھسۇلات تېپىلمىدى</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 font-black">
                  <th className="py-3 px-3.5 sm:px-4">مەھسۇلات نامى</th>
                  <th className="py-3 px-3 sm:px-4">تۈرى / بوغچىسى</th>
                  <th className="py-3 px-2 sm:px-3 text-center">تەننەرخ ($)</th>
                  <th className="py-3 px-2 sm:px-3 text-center min-w-[130px]">سېتىش باھاسى ($)</th>
                  <th className="py-3 px-2 sm:px-3 text-center min-w-[130px]">ساپ پايدا ($)</th>
                  <th className="py-3 px-2 sm:px-3 text-center">پايدا %</th>
                  <th className="py-3 px-3 text-center">مەشغۇلات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredRows.map((row) => {
                  const pending = pendingChanges[row.packageId];
                  const currentPrice = pending ? pending.price : row.price;
                  const currentProfit = pending ? pending.profit : row.profit;
                  const isModified = pending !== undefined;
                  const isSavingThis = savingId === row.packageId;
                  const isJustSaved = savedId === row.packageId;

                  const marginPct =
                    row.costPrice > 0 ? Math.round((currentProfit / row.costPrice) * 100) : 0;

                  return (
                    <tr
                      key={row.packageId}
                      className={`hover:bg-slate-50/80 dark:hover:bg-white/5 transition ${
                        isModified ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Product Name */}
                      <td className="py-3 px-3.5 sm:px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {row.image && (
                            <img
                              src={row.image}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                              onError={(e) => ((e.target as any).style.display = 'none')}
                            />
                          )}
                          <div className="truncate max-w-[180px] sm:max-w-[240px]">
                            <span className="block truncate text-xs">{row.serviceName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              #{row.serviceId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Package Title */}
                      <td className="py-3 px-3 sm:px-4 font-medium text-slate-700 dark:text-slate-300">
                        <span className="block font-bold text-xs">{row.title}</span>
                      </td>

                      {/* Wholesale Cost ($) */}
                      <td className="py-3 px-2 sm:px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400" dir="ltr">
                        ${row.costPrice.toFixed(3)}
                      </td>

                      {/* Selling Price ($) - EDITABLE */}
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <div className="relative inline-flex items-center">
                          <span className="absolute left-2.5 text-slate-400 font-mono text-xs font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={currentPrice}
                            onChange={(e) => handlePriceChange(row, e.target.value)}
                            className={`w-24 sm:w-28 pl-6 pr-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-black text-center focus:outline-none transition ${
                              isModified
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/20'
                                : 'bg-white dark:bg-[#070d18] border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 focus:border-emerald-500'
                            }`}
                            dir="ltr"
                          />
                        </div>
                      </td>

                      {/* Net Profit ($) - EDITABLE */}
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <div className="relative inline-flex items-center">
                          <span className="absolute left-2.5 text-emerald-500 font-mono text-xs font-bold">+$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={currentProfit}
                            onChange={(e) => handleProfitChange(row, e.target.value)}
                            className={`w-24 sm:w-28 pl-7 pr-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-black text-center focus:outline-none transition ${
                              isModified
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/20'
                                : currentProfit > 0
                                ? 'bg-white dark:bg-[#070d18] border-slate-200 dark:border-white/10 text-emerald-700 dark:text-emerald-300 focus:border-emerald-500'
                                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-600'
                            }`}
                            dir="ltr"
                          />
                        </div>
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-black inline-block ${
                            marginPct >= 20
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : marginPct >= 10
                              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          %{marginPct}
                        </span>
                      </td>

                      {/* Action: Save Single Row */}
                      <td className="py-3 px-3 text-center">
                        {isJustSaved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ساقلاندى!</span>
                          </span>
                        ) : isModified ? (
                          <button
                            onClick={() => handleSaveRow(row)}
                            disabled={isSavingThis}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1 mx-auto active:scale-95"
                          >
                            {isSavingThis ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            <span>ساقلاش</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 select-none">
                            تەڭشەلگەن
                          </span>
                        )}
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
