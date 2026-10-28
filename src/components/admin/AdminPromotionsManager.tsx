'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ActivePromotion } from '@/lib/promotionsDb';
import { Flame, Clock, Plus, Trash2, AlertTriangle, CheckCircle, Send, Sparkles, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { formatSmartPrice } from '@/lib/formatMoney';

interface ServicePackageOption {
  serviceId: string;
  serviceName: string;
  category: string;
  serviceImage?: string;
  packages: Array<{
    id: string;
    title: string;
    price: number;
    costPrice: number;
    originalPrice?: number;
    providerProductId?: number;
  }>;
}

interface PackagePromoRow {
  packageId: string;
  title: string;
  costPrice: number;
  regularPrice: number;
  promoPrice: string; // string for input editing
  selected: boolean;
}

export default function AdminPromotionsManager() {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [packageRows, setPackageRows] = useState<PackagePromoRow[]>([]);
  const [endsAtInput, setEndsAtInput] = useState('');
  const [broadcastToChannel, setBroadcastToChannel] = useState(true);
  const [packageSearchQuery, setPackageSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'selected' | 'unselected'>('all');

  const fetchPromotionsData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/promotions', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions || []);
        setServicePackages(data.servicePackages || []);
      } else {
        setErrorMsg(data.error || 'يۈكلەشتە خاتالىق كۆرۈلدى');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'تور ئۇلىنىشىدا خاتالىق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotionsData();
  }, []);

  // When serviceId changes, initialize all packages of that service
  const activeService = useMemo(
    () => servicePackages.find((s) => s.serviceId === selectedServiceId),
    [servicePackages, selectedServiceId]
  );

  useEffect(() => {
    if (activeService && activeService.packages) {
      const rows: PackagePromoRow[] = activeService.packages.map((p) => {
        // Default promo price: costPrice + 0.10$ or regularPrice
        const defaultPromo = p.costPrice > 0 ? (p.costPrice + 0.10).toFixed(2) : p.price.toFixed(2);
        return {
          packageId: p.id,
          title: p.title,
          costPrice: Number(p.costPrice),
          regularPrice: Number(p.price),
          promoPrice: defaultPromo,
          selected: true, // Selected by default, can be cherry-picked freely
        };
      });
      setPackageRows(rows);
      setPackageSearchQuery('');
      setFilterMode('all');
    } else {
      setPackageRows([]);
    }
  }, [activeService]);

  // Default time helper
  const setQuickEndsAt = (type: 'midnight' | '3h' | '6h' | '12h' | '24h' | '3d' | '7d') => {
    const now = new Date();
    let target = new Date();

    if (type === 'midnight') {
      target.setHours(23, 59, 59, 999);
    } else if (type === '3h') {
      target.setTime(now.getTime() + 3 * 3600 * 1000);
    } else if (type === '6h') {
      target.setTime(now.getTime() + 6 * 3600 * 1000);
    } else if (type === '12h') {
      target.setTime(now.getTime() + 12 * 3600 * 1000);
    } else if (type === '24h') {
      target.setTime(now.getTime() + 24 * 3600 * 1000);
    } else if (type === '3d') {
      target.setTime(now.getTime() + 3 * 24 * 3600 * 1000);
    } else if (type === '7d') {
      target.setTime(now.getTime() + 7 * 24 * 3600 * 1000);
    }

    const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEndsAtInput(localIso);
  };

  const handleOpenAddModal = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const firstSrvId = servicePackages[0]?.serviceId || '';
    setSelectedServiceId(firstSrvId);
    setQuickEndsAt('midnight');
    setBroadcastToChannel(true);
    setModalOpen(true);
  };

  // Bulk Apply Margin to All Selected Packages
  const handleBulkApplyMargin = (margin: number) => {
    setPackageRows((prev) =>
      prev.map((row) => {
        if (!row.selected) return row;
        const newPromo = (row.costPrice + margin).toFixed(2);
        return { ...row, promoPrice: newPromo };
      })
    );
  };

  // Bulk Apply Percent Discount with automatic wholesale cost floor guard
  const handleBulkApplyPercent = (percent: number) => {
    setPackageRows((prev) =>
      prev.map((row) => {
        if (!row.selected) return row;
        const discounted = row.regularPrice * (1 - percent / 100);
        const safePrice = Math.max(row.costPrice + 0.05, discounted);
        return { ...row, promoPrice: safePrice.toFixed(2) };
      })
    );
  };

  // Toggle select all
  const allSelected = packageRows.length > 0 && packageRows.every((r) => r.selected);
  const handleToggleSelectAll = (select: boolean) => {
    setPackageRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  // Check if any selected row has loss risk
  const selectedRows = useMemo(() => packageRows.filter((r) => r.selected), [packageRows]);
  const unselectedCount = packageRows.length - selectedRows.length;

  // Filtered rows for cherry-picking
  const displayRows = useMemo(() => {
    return packageRows
      .map((row, originalIndex) => ({ row, originalIndex }))
      .filter(({ row }) => {
        // Mode filter
        if (filterMode === 'selected' && !row.selected) return false;
        if (filterMode === 'unselected' && row.selected) return false;
        // Search filter
        if (packageSearchQuery.trim()) {
          const q = packageSearchQuery.toLowerCase();
          return row.title.toLowerCase().includes(q) || row.packageId.toLowerCase().includes(q);
        }
        return true;
      });
  }, [packageRows, filterMode, packageSearchQuery]);

  const handleSetRowMargin = (originalIndex: number, margin: number) => {
    setPackageRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== originalIndex) return r;
        const newPromo = (r.costPrice + margin).toFixed(2);
        return { ...r, promoPrice: newPromo, selected: true };
      })
    );
  };

  const handleSetRowPercent = (originalIndex: number, percent: number) => {
    setPackageRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== originalIndex) return r;
        const discounted = r.regularPrice * (1 - percent / 100);
        const safePrice = Math.max(r.costPrice + 0.05, discounted);
        return { ...r, promoPrice: safePrice.toFixed(2), selected: true };
      })
    );
  };

  const hasAnyLoss = useMemo(() => {
    return selectedRows.some((r) => {
      const p = Number(r.promoPrice);
      return isNaN(p) || p <= r.costPrice;
    });
  }, [selectedRows]);

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || selectedRows.length === 0 || !endsAtInput) {
      setErrorMsg('كەم دېگەندە بىر بولاقنى تاللاڭ ۋە ئاخىرلىشىش ۋاقتىنى بەلگىلەڭ');
      return;
    }

    if (hasAnyLoss) {
      setErrorMsg('⛔️ دىققەت! تاللانغان بولاقلار ئىچىدە تەننەرختىن تۆۋەن ياكى تەڭ باھا بايقالدى. زىياندىن ساقلىنىش ئۈچۈن قىزىل يېزىلغان باھالارنى توغرىلاڭ!');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payloadItems = selectedRows.map((r) => ({
        packageId: r.packageId,
        promoPrice: Number(r.promoPrice),
      }));

      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          items: payloadItems,
          endsAt: new Date(endsAtInput).toISOString(),
          broadcastToChannel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions || []);
        setSuccessMsg(`پائالىيەت مۇۋەپپەقىيەتلىك باشلاندى! (${payloadItems.length} بولاق پائالىيەتكە قوشۇلدى)`);
        setModalOpen(false);
      } else {
        setErrorMsg(data.error || 'پائالىيەتنى باشلاشتا خاتالىق كۆرۈلدى');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'ساقلاشتا تور خاتالىقى كۆرۈلدى');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!window.confirm('راستلا بۇ پائالىيەتنى توختىتىپ ئەسلى باھاسىغا قايتۇرامسىز؟')) return;

    try {
      const res = await fetch(`/api/admin/promotions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions || []);
        setSuccessMsg('پائالىيەت توختىتىلدى، مەھسۇلات باھاسى ئەسلىگە قايتتى.');
      } else {
        setErrorMsg(data.error || 'توختىتىش مەغلۇپ بولدى');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'ئۆچۈرۈشتە تور خاتالىقى');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-alkatip flex items-center gap-2">
              <span>چەكلىك ۋاقىتلىق ئېتىبار پائالىيىتى مەركىزى (Flash Sale)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-bold">
                {promotions.length} ئاكتىپ
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-alkatip mt-0.5">
              مەھسۇلاتلارنىڭ بارلىق بولاقلىرىنى سېلىشتۇرۇپ تاللاپ، باھا ۋە پايدىنى ئېنىق كۆرۈپ بىخەتەر ئېتىبار پائالىيىتى ئېچىڭ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPromotionsData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="يېڭىلاش"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/25 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>يېڭى ئېتىبار پائالىيىتى قوشۇش</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active Promotions Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm font-alkatip flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>ئاكتىپ يۈرۈشۈۋاتقان ئېتىبار پائالىيەتلىرى تىزىملىكى ({promotions.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-alkatip">
            سائەت 12:00 دە ياكى ۋاقىت توشقاندا سىستېما تەرىپىدىن ئۆزلۈكىدىن ئەسلى باھاسىغا قايتىدۇ
          </span>
        </div>

        {promotions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Flame className="w-10 h-10 mx-auto text-slate-700" />
            <p className="text-sm font-alkatip">ھازىرچە ئاكتىپ پائالىيەت يوق</p>
            <button
              onClick={handleOpenAddModal}
              className="text-xs text-amber-400 underline hover:text-amber-300 font-bold"
            >
              بۇ يەردىن يېڭى پائالىيەت قوشۇڭ
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-bold border-b border-slate-800 font-alkatip">
                <tr>
                  <th className="py-3 px-4">مۇلازىمەت & بولاق</th>
                  <th className="py-3 px-3">باش تەننەرخ (Cost)</th>
                  <th className="py-3 px-3">ئەسلى باھا</th>
                  <th className="py-3 px-3">پائالىيەت باھاسى</th>
                  <th className="py-3 px-3">ساپ پايدا</th>
                  <th className="py-3 px-4">ئاخىرلىشىش ۋاقتى</th>
                  <th className="py-3 px-4 text-center">مەشغۇلات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {promotions.map((p) => {
                  const ends = new Date(p.endsAt);
                  const isExpired = ends.getTime() <= Date.now();

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {p.serviceImage && (
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                              <Image src={p.serviceImage} alt={p.serviceName} fill className="object-cover" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white">{p.serviceName}</div>
                            <div className="text-[11px] text-amber-300/80 font-alkatip">{p.packageTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-400" dir="ltr">
                        ${formatSmartPrice(p.costPrice)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500 line-through" dir="ltr">
                        ${formatSmartPrice(p.regularPrice)}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-amber-400 text-sm" dir="ltr">
                        ${formatSmartPrice(p.promoPrice)}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                            +${p.profitMargin.toFixed(2)}
                          </span>
                          {p.discountPercent > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30 text-[10px] font-bold">
                              -{p.discountPercent}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300" dir="ltr">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{ends.toLocaleDateString()} {ends.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {isExpired ? (
                          <span className="text-[10px] text-rose-400">توختىغان</span>
                        ) : (
                          <span className="text-[10px] text-emerald-400">ئاكتىپ مېڭىۋاتىدۇ</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeletePromotion(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center gap-1 mx-auto"
                          title="پائالىيەتنى توختىتىپ باھانى ئەسلىگە قايتۇرۇش"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ئەسلىگە قايتۇرۇش</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add New Promotion with Full Package Comparison & Bulk Settings */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
              <h3 className="font-bold text-white text-base font-alkatip flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>ئېتىبار پائالىيىتى قۇرۇش — باھا، تەننەرخ ۋە پايدا كونترول تاختىسى</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="p-5 space-y-4 overflow-y-auto flex-1 text-right">
              {/* 1. Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                  1. پائالىيەت قىلىدىغان مەھسۇلاتنى تاللاڭ:
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                >
                  {servicePackages.map((s) => (
                    <option key={s.serviceId} value={s.serviceId}>
                      {s.serviceName} ({s.packages.length} بولاق بار)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Cherry-Picking Toolbar: Select/Deselect, Search & Quick Margin */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  {/* Select All / Clear Selection */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAll(true)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>بارلىقىنى تاللاش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAll(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-400 border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>تاللاشنى تازىلاش</span>
                    </button>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-alkatip">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded-md font-bold transition ${
                        filterMode === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ھەممىسى ({packageRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('selected')}
                      className={`px-2.5 py-1 rounded-md font-bold transition ${
                        filterMode === 'selected' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      تاللانغانلار ({selectedRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('unselected')}
                      className={`px-2.5 py-1 rounded-md font-bold transition ${
                        filterMode === 'unselected' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      تاللانمىغانلار ({unselectedCount})
                    </button>
                  </div>
                </div>

                {/* Search Bar & Global Bulk Margins */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
                  <div className="flex-1 min-w-[220px]">
                    <input
                      type="text"
                      placeholder="🔍 بولاق ئىزدەش (مەسىلەن: Weekly, Pass, 60)..."
                      value={packageSearchQuery}
                      onChange={(e) => setPackageSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-alkatip"
                    />
                  </div>

                  {/* Bulk Margin Quick Adder & Percent Off */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-amber-300 font-bold font-alkatip">
                        ⚡️ تەننەرخكە پايدا قوشۇش:
                      </span>
                      {[0.05, 0.10, 0.20, 0.50, 1.00].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleBulkApplyMargin(m)}
                          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold border border-amber-500/30 transition active:scale-95"
                        >
                          +{m}$
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-cyan-300 font-bold font-alkatip">
                        🏷️ ئىتىبار:
                      </span>
                      {[5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleBulkApplyPercent(pct)}
                          className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30 transition active:scale-95"
                          title={`ئەسلى باھادىن -${pct}% ئېتىبار قىلىش (تەننەرختىن تۆۋەن چۈشۈپ كەتمەيدۇ)`}
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Package Price Comparison Table */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 font-alkatip flex items-center justify-between">
                  <span>2. مەزكۇر مەھسۇلاتنىڭ بارلىق بولاقلىرى — تاللاپ باھا بەلگىلەش:</span>
                  <span className="text-[11px] text-amber-400 font-bold font-mono">
                    {selectedRows.length} بولاق تاللانغان (كۆرسىتىلگىنى: {displayRows.length})
                  </span>
                </label>

                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner max-h-80 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-800/90 text-slate-300 font-bold sticky top-0 z-10 font-alkatip border-b border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 w-28 text-center">تاللاش ھالىتى</th>
                        <th className="py-2.5 px-3">بولاق نامى</th>
                        <th className="py-2.5 px-3">🏢 باش تەننەرخ</th>
                        <th className="py-2.5 px-3">🛒 ھازىرقى توربەت باھاسى</th>
                        <th className="py-2.5 px-3">⚡️ پائالىيەت باھاسى ($)</th>
                        <th className="py-2.5 px-3">💰 قالىدىغان ساپ پايدا</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {displayRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 font-alkatip">
                            ماس كېلىدىغان بولاق تېپىلمىدى
                          </td>
                        </tr>
                      ) : (
                        displayRows.map(({ row, originalIndex }) => {
                          const numPromo = Number(row.promoPrice);
                          const isNumValid = !isNaN(numPromo) && numPromo > 0;
                          const isRowLoss = isNumValid && numPromo <= row.costPrice;
                          const profit = isNumValid ? numPromo - row.costPrice : 0;
                          const discount = isNumValid && row.regularPrice > numPromo
                            ? Math.round(((row.regularPrice - numPromo) / row.regularPrice) * 100)
                            : 0;

                          return (
                            <tr
                              key={row.packageId}
                              className={`transition ${
                                !row.selected
                                  ? 'opacity-60 bg-slate-950/30 hover:opacity-100 hover:bg-slate-900/60'
                                  : isRowLoss
                                  ? 'bg-rose-950/40 border-l-4 border-l-rose-500'
                                  : 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-400'
                              }`}
                            >
                              {/* Cherry Pick Toggle Cell */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPackageRows((prev) =>
                                      prev.map((r, i) => (i === originalIndex ? { ...r, selected: !r.selected } : r))
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-alkatip transition flex items-center justify-center gap-1 mx-auto w-full max-w-[100px] ${
                                    row.selected
                                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                  }`}
                                >
                                  {row.selected ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>تاللاندى</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>تاللاش</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              <td className="py-2.5 px-3 font-bold text-white font-alkatip">
                                <div>{row.title}</div>
                              </td>

                              <td className="py-2.5 px-3 font-mono text-cyan-400" dir="ltr">
                                ${formatSmartPrice(row.costPrice)}
                              </td>

                              <td className="py-2.5 px-3 font-mono text-slate-400" dir="ltr">
                                ${formatSmartPrice(row.regularPrice)}
                              </td>

                              {/* Promo Price Input & Per-Row Quick Margins */}
                              <td className="py-2 px-3">
                                <div className="space-y-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    disabled={!row.selected}
                                    value={row.promoPrice}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPackageRows((prev) =>
                                        prev.map((r, i) => (i === originalIndex ? { ...r, promoPrice: val } : r))
                                      );
                                    }}
                                    className={`w-28 bg-slate-800 border rounded-lg px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none ${
                                      isRowLoss
                                        ? 'border-rose-500 bg-rose-950/30 text-rose-300'
                                        : 'border-slate-700 focus:border-amber-400'
                                    }`}
                                    dir="ltr"
                                  />
                                  {/* Quick row-level margin chips */}
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {[0.05, 0.10, 0.20].map((m) => (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => handleSetRowMargin(originalIndex, m)}
                                        className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 transition"
                                        title={`تەننەرخكە +$${m} پايدا قوشۇپ تاللاش`}
                                      >
                                        +{m}$
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => handleSetRowPercent(originalIndex, 10)}
                                      className="text-[10px] font-mono px-1 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-700/60 transition"
                                      title="ئەسلى باھادىن -10% ئېتىبار (تەننەرختىن تۆۋەنلىمەيدۇ)"
                                    >
                                      -10%
                                    </button>
                                  </div>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 font-mono" dir="ltr">
                                {isRowLoss ? (
                                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-bold border border-rose-500/50">
                                    ⛔️ زىيان! (-${(row.costPrice - numPromo).toFixed(2)})
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                                      +${profit.toFixed(2)}
                                    </span>
                                    {discount > 0 && (
                                      <span className="text-[10px] text-red-400">(-{discount}%)</span>
                                    )}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {hasAnyLoss && (
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      ⚠️ دىققەت: قىزىل رەڭدە كۆرۈنگەن بولاقلارنىڭ باھاسى باش تەننەرختىن تۆۋەن ياكى تەڭ بولۇپ قالدى. سىستېما زىيان چىقماسلىق ئۈچۈن ساقلاشنى چەكلەيدۇ. باھانى ئۆستۈرۈڭ!
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Duration Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                  3. پائالىيەت ۋاقتى ۋە ئاخىرلىشىش مۆھلىتى:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setQuickEndsAt('midnight')}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30"
                  >
                    🌙 كېچە سائەت 12 گىچە
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickEndsAt('3h')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
                  >
                    3 سائەت
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickEndsAt('6h')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
                  >
                    6 سائەت
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickEndsAt('12h')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
                  >
                    12 سائەت
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickEndsAt('24h')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
                  >
                    24 سائەت (1 كۈن)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickEndsAt('3d')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
                  >
                    3 كۈن
                  </button>
                </div>
                <input
                  type="datetime-local"
                  required
                  value={endsAtInput}
                  onChange={(e) => setEndsAtInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  dir="ltr"
                />
              </div>

              {/* 5. Broadcast Checkbox */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white font-alkatip">تېلېگرامما قانىلىغا تەڭ يوللاش</div>
                    <div className="text-[10px] text-slate-400 font-alkatip">
                      @autocash_cannel قانىلىغا ئېتىبار بولاقلار تىزىملىكىنى ئاپتوماتىك ئېلان قىلىدۇ
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={broadcastToChannel}
                  onChange={(e) => setBroadcastToChannel(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400 font-mono">
                  جەمئىي <b className="text-amber-400">{selectedRows.length}</b> بولاق پائالىيەتكە قوشۇلىدۇ
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    بىكار قىلىش
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || hasAnyLoss || selectedRows.length === 0}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{submitting ? 'ساقلىنىۋاتىدۇ...' : `⚡️ پائالىيەتنى باشلاش (${selectedRows.length})`}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
