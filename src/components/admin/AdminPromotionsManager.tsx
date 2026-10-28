'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ActivePromotion } from '@/lib/promotionsDb';
import { Flame, Clock, Plus, Trash2, AlertTriangle, CheckCircle, Send, Sparkles, RefreshCw } from 'lucide-react';
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
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [promoPriceInput, setPromoPriceInput] = useState('');
  const [endsAtInput, setEndsAtInput] = useState('');
  const [broadcastToChannel, setBroadcastToChannel] = useState(true);

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

  // Currently selected service & package details
  const activeService = useMemo(
    () => servicePackages.find((s) => s.serviceId === selectedServiceId),
    [servicePackages, selectedServiceId]
  );

  const activePackage = useMemo(
    () => activeService?.packages.find((p) => p.id === selectedPackageId),
    [activeService, selectedPackageId]
  );

  // Default time helper: Today at 23:59:59
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

    // Format for datetime-local (YYYY-MM-DDTHH:mm)
    const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEndsAtInput(localIso);
  };

  const handleOpenAddModal = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setSelectedServiceId(servicePackages[0]?.serviceId || '');
    setSelectedPackageId(servicePackages[0]?.packages[0]?.id || '');
    setPromoPriceInput('');
    setQuickEndsAt('midnight');
    setBroadcastToChannel(true);
    setModalOpen(true);
  };

  // Cost validation & Anti-loss check
  const costPrice = activePackage?.costPrice || 0;
  const regularPrice = activePackage?.price || 0;
  const numericPromoPrice = Number(promoPriceInput);
  const isPriceValidNumber = !isNaN(numericPromoPrice) && numericPromoPrice > 0;
  const isLossRisk = isPriceValidNumber && numericPromoPrice <= costPrice;
  const profitMargin = isPriceValidNumber ? numericPromoPrice - costPrice : 0;
  const discountPercent =
    isPriceValidNumber && regularPrice > numericPromoPrice
      ? Math.round(((regularPrice - numericPromoPrice) / regularPrice) * 100)
      : 0;

  const handleSetProfitMargin = (margin: number) => {
    if (costPrice > 0) {
      setPromoPriceInput((costPrice + margin).toFixed(2));
    }
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedPackageId || !promoPriceInput || !endsAtInput) {
      setErrorMsg('بارلىق تەلەپلەرنى تولۇق تولدۇرۇڭ');
      return;
    }

    if (isLossRisk) {
      setErrorMsg(`⛔️ زىيان تارتىش خەۋپى! باھا تەننەرختىن ($${costPrice}) تۆۋەن ياكى تەڭ بولالمايدۇ.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          packageId: selectedPackageId,
          promoPrice: numericPromoPrice,
          endsAt: new Date(endsAtInput).toISOString(),
          broadcastToChannel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions || []);
        setSuccessMsg('پائالىيەت مۇۋەپپەقىيەتلىك باشلاندى ۋە دەرھال كۈچكە ئىگە قىلىندى!');
        setModalOpen(false);
      } else {
        setErrorMsg(data.error || 'پائالىيەتنى باشلاشتا خاتالىق كۆرۈلدى');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'ساقلاشتا خاتالىق يۈز بەردى');
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
      {/* Top Banner & Action */}
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
              خالىغان مەھسۇلاتقا تەننەرختىن تۆۋەنلىمەيدىغان بىخەتەر ئېتىبار باھا تەڭشەڭ، توربەتتە ھەقىقىي ۋاقىت سانىقى بىلەن مېڭىدۇ.
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
            <span>ئاكتىپ يۈرۈشۈۋاتقان ئېتىبار پائالىيەتلىرى تىزىملىكى</span>
          </h3>
          <span className="text-xs text-slate-400">
            ۋاقىت توشقاندا سىستېما تەرىپىدىن ئۆزلۈكىدىن ئەسلى باھاسىغا قايتۇرۇلىدۇ
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
              <thead className="bg-slate-800/60 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">مۇلازىمەت & بولاق</th>
                  <th className="py-3 px-3">باش تەننەرخ (Cost)</th>
                  <th className="py-3 px-3">ئەسلى باھا</th>
                  <th className="py-3 px-3">پائالىيەت باھاسى</th>
                  <th className="py-3 px-3">پايدا & ئېتىبار</th>
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
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
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
                          <span className="text-[10px] text-emerald-400">ئاكتىپ</span>
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

      {/* Modal: Add New Promotion */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <h3 className="font-bold text-white text-base font-alkatip flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>يېڭى ئېتىبار پائالىيىتى قۇرۇش</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="p-5 space-y-4 overflow-y-auto flex-1 text-right">
              {/* Service Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                  1. مۇلازىمەتنى تاللاڭ
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    const nextSrvId = e.target.value;
                    setSelectedServiceId(nextSrvId);
                    const srv = servicePackages.find((s) => s.serviceId === nextSrvId);
                    if (srv && srv.packages.length > 0) {
                      setSelectedPackageId(srv.packages[0].id);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {servicePackages.map((s) => (
                    <option key={s.serviceId} value={s.serviceId}>
                      {s.serviceName} ({s.packages.length} بولاق)
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                  2. بولاقنى تاللاڭ
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {activeService?.packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — ئەسلى باھاسى: ${formatSmartPrice(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wholesale Cost Floor & Safety Monitor Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/80">
                  <span>🏢 باش مۇلازىمەتچى تەننەرخى:</span>
                  <span className="font-mono text-cyan-400 text-sm" dir="ltr">
                    ${costPrice > 0 ? formatSmartPrice(costPrice) : 'ھېسابلىنىۋاتىدۇ...'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>🛒 ھازىرقى نورمال سېتىلىش باھاسى:</span>
                  <span className="font-mono text-slate-200" dir="ltr">
                    ${formatSmartPrice(regularPrice)}
                  </span>
                </div>

                {/* Real-time Anti-Loss Guard Warning */}
                {isLossRisk && (
                  <div className="p-2.5 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-start gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">⛔️ زىيان تارتىش خەۋپى بار!</div>
                      <div className="text-[11px] text-rose-300">
                        پائالىيەت باھاسى ($${numericPromoPrice}) باش مۇلازىمەتچىنىڭ تەننەرخىدىن ($${costPrice}) تۆۋەن ياكى تەڭ بولۇپ قالدى. سىستېما زىيان چىقىشتىن ساقلىنىش ئۈچۈن بۇ باھانى قوبۇل قىلمايدۇ!
                      </div>
                    </div>
                  </div>
                )}

                {isPriceValidNumber && !isLossRisk && (
                  <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      بىخەتەر تەننەرخ! پايدا سوممىسى:
                    </span>
                    <span className="font-mono font-bold" dir="ltr">
                      +${profitMargin.toFixed(2)} USD ({discountPercent}% ئېتىبار)
                    </span>
                  </div>
                )}
              </div>

              {/* Set Promo Price */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                  3. پائالىيەت سېتىش باھاسى ($ USD)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-slate-400">تەننەرخكە پايدا قوشۇش:</span>
                  {[0.05, 0.10, 0.20, 0.50, 1.00].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSetProfitMargin(m)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-mono border border-slate-700"
                    >
                      +{m}$
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="مەسىلەن: 1.55"
                  value={promoPriceInput}
                  onChange={(e) => setPromoPriceInput(e.target.value)}
                  className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none ${
                    isLossRisk
                      ? 'border-rose-500 bg-rose-950/20 text-rose-300 focus:border-rose-400'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                  dir="ltr"
                />
              </div>

              {/* Duration / Ends At */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-alkatip">
                  4. پائالىيەت ۋاقتى ۋە ئاخىرلىشىش چېسلاسى
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

              {/* Channel Broadcast Checkbox */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white font-alkatip">تېلېگرامما قانىلىغا تەڭ يوللاش</div>
                    <div className="text-[10px] text-slate-400 font-alkatip">
                      @autocash_cannel قانىلىغا ئاپتوماتىك كۇنۇپكىلىرى بىلەن تەشۋىقات ئېلانى چىقىرىدۇ
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={broadcastToChannel}
                  onChange={(e) => setBroadcastToChannel(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  بىكار قىلىش
                </button>
                <button
                  type="submit"
                  disabled={submitting || isLossRisk || !isPriceValidNumber}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{submitting ? 'ساقلىنىۋاتىدۇ...' : 'پائالىيەتنى باشلاش'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
