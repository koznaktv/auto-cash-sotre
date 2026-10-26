'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Search, ShieldCheck } from 'lucide-react';

interface WifiCardItem {
  id: string;
  serviceId: string;
  serviceName: string;
  packageId: string;
  packageTitle: string;
  username: string;
  password: string;
  cardNumber: string;
  status: 'available' | 'sold';
  soldToUserEmail?: string;
  soldOrderId?: string;
  soldAt?: string;
  createdAt: string;
}

const NETWORKS = [
  {
    id: 'fursan_net',
    name: 'شبكة الفرسان (Fursan Net)',
    packages: [
      { id: 'fursan_6gb', title: '6 جيجا 7 كۈنلۈك (6GB 7 Days)', price: '$0.45' },
      { id: 'fursan_4gb', title: '4 جيجا 7 كۈنلۈك (4GB 7 Days)', price: '$0.34' },
      { id: 'fursan_2gb', title: '2 جيجا 5 كۈنلۈك (2GB 5 Days)', price: '$0.23' },
      { id: 'fursan_1gb', title: '1 جيجا 3 كۈنلۈك (1GB 3 Days)', price: '$0.12' },
    ],
  },
  {
    id: 'azez_net',
    name: 'شبكة عزيز نت (Azez Net)',
    packages: [
      { id: 'azez_6gb', title: '6 جيجا 7 كۈنلۈك (1 أجهزة)', price: '$0.44' },
      { id: 'azez_4gb', title: '4 جيجا 7 كۈنلۈك (4GB 7 Days)', price: '$0.34' },
      { id: 'azez_2gb', title: '2 جيجا 5 كۈنلۈك (2GB 5 Days)', price: '$0.23' },
      { id: 'azez_1gb', title: '1 جيجا 3 كۈنلۈك (1GB 3 Days)', price: '$0.12' },
    ],
  },
  {
    id: 'almujahid_net',
    name: 'شبكة المجاهد نت (Al Mujahid Net)',
    packages: [
      { id: 'mujahid_6gb', title: '6 جيجا 7 كۈنلۈك (6GB 7 Days)', price: '$0.45' },
      { id: 'mujahid_4gb', title: '4 جيجا 7 كۈنلۈك (4GB 7 Days)', price: '$0.34' },
      { id: 'mujahid_2gb', title: '2 جيجا 5 كۈنلۈك (2GB 5 Days)', price: '$0.23' },
      { id: 'mujahid_1gb', title: '1 جيجا 3 كۈنلۈك (1GB 3 Days)', price: '$0.12' },
    ],
  },
];

export default function AdminWifiInventory() {
  const [cards, setCards] = useState<WifiCardItem[]>([]);
  const [stockSummary, setStockSummary] = useState<Record<string, { available: number; sold: number }>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for bulk import
  const [selectedNetwork, setSelectedNetwork] = useState('fursan_net');
  const [selectedPackage, setSelectedPackage] = useState('fursan_4gb');
  const [rawText, setRawText] = useState('');
  const [importing, setImporting] = useState(false);

  // Filter state
  const [filterNet, setFilterNet] = useState<'all' | 'fursan_net' | 'azez_net' | 'almujahid_net'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/wifi-cards?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCards(data.cards || []);
        setStockSummary(data.stockSummary || {});
      } else {
        setMsg({ type: 'error', text: data.message || 'كارتىلارنى ئېلىش مەغلۇپ بولدى' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'ئۇلىنىش خاتالىقى' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleNetworkChange = (netId: string) => {
    setSelectedNetwork(netId);
    const net = NETWORKS.find((n) => n.id === netId);
    if (net && net.packages.length > 0) {
      setSelectedPackage(net.packages[0].id);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setMsg({ type: 'error', text: 'كارتىلارنىڭ نومۇر ۋە پارولىنى چاپلاڭ' });
      return;
    }

    const net = NETWORKS.find((n) => n.id === selectedNetwork);
    const pkg = net?.packages.find((p) => p.id === selectedPackage);

    try {
      setImporting(true);
      setMsg(null);
      const res = await fetch('/api/admin/wifi-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedNetwork,
          serviceName: net?.name || 'Wi-Fi',
          packageId: selectedPackage,
          packageTitle: pkg?.title || selectedPackage,
          rawText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: data.message });
        setRawText('');
        fetchCards();
      } else {
        setMsg({ type: 'error', text: data.message || 'كارتىلارنى قوشۇش مەغلۇپ بولدى' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'خاتالىق كۆرۈلدى' });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('بۇ كارتىنى ئامباردىن ئۆچۈرەمسىز؟ سېتىۋېلىش دەرھال توختايدۇ.')) return;
    // Instant optimistic removal from UI
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedIds((prev) => prev.filter((id) => id !== cardId));
    setMsg({ type: 'success', text: '✅ كارتا ئامباردىن دەرھال ئۆچۈرۈلدى (توربەت ۋە بوتتا شۇئان چىقىرىۋېتىلدى)' });
    try {
      const res = await fetch(`/api/admin/wifi-cards?id=${encodeURIComponent(cardId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchCards();
      }
    } catch {}
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`تاللانغان ${selectedIds.length} تال كارتىنى ئامباردىن تولۇق ئۆچۈرەمسىز؟`)) return;
    const idsToDelete = [...selectedIds];
    // Instant optimistic removal from UI
    setCards((prev) => prev.filter((c) => !idsToDelete.includes(c.id)));
    setSelectedIds([]);
    setMsg({ type: 'success', text: `✅ تاللانغان ${idsToDelete.length} تال كارتا ئامباردىن تولۇق ئۆچۈرۈلدى` });
    try {
      const res = await fetch('/api/admin/wifi-cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCards();
      }
    } catch {}
  };

  const handleClearPackage = async (serviceId: string, packageId: string, packageTitle: string) => {
    if (!confirm(`«${packageTitle}» بولىقىدىكى بارلىق سېتىلمىغان كارتىلارنى ئامباردىن تولۇق ئۆچۈرەمسىز؟`)) return;
    // Instant optimistic removal from UI
    setCards((prev) => prev.filter((c) => !(c.serviceId === serviceId && c.packageId === packageId && c.status === 'available')));
    setSelectedIds([]);
    setMsg({ type: 'success', text: `✅ «${packageTitle}» بولىقىدىكى سېتىلمىغان كارتىلار ئامباردىن تولۇق ئۆچۈرۈلدى` });
    try {
      const res = await fetch(`/api/admin/wifi-cards?clearPackage=1&serviceId=${encodeURIComponent(serviceId)}&packageId=${encodeURIComponent(packageId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchCards();
      }
    } catch {}
  };

  // Metrics
  const totalAvailable = cards.filter((c) => c.status === 'available').length;
  const totalSold = cards.filter((c) => c.status === 'sold').length;

  const currentNet = NETWORKS.find((n) => n.id === selectedNetwork) || NETWORKS[0];

  // Filtered Cards
  const filteredCards = cards.filter((c) => {
    if (filterNet !== 'all' && c.serviceId !== filterNet) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        c.username.toLowerCase().includes(q) ||
        c.password.toLowerCase().includes(q) ||
        c.cardNumber.toLowerCase().includes(q) ||
        (c.soldToUserEmail || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const availableFiltered = filteredCards.filter((c) => c.status === 'available');

  const toggleSelectAll = () => {
    if (availableFiltered.length > 0 && availableFiltered.every((c) => selectedIds.includes(c.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(availableFiltered.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 text-right font-alkatip" dir="rtl">
      {/* Top Banner & Refresh */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-2xl border border-emerald-500/30">
            📶
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Wi-Fi رەقەملىك كارتىلار ئامبىرى (Digital Voucher Stock)</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                يەرلىك ئامبار ⚡️
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              شبكة الفرسان ۋە شبكة عزيز نت كارتىلىرىنى توپ قاچىلاش ۋە سېتىلىش ھالىتىنى باشقۇرۇش
            </p>
          </div>
        </div>

        <button
          onClick={fetchCards}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>يېڭىلاش</span>
        </button>
      </div>

      {/* Alert Message */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 ${
            msg.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
            📦
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">ئامباردىكى قالدۇق كارتىلار</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{totalAvailable} تال</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl">
            ✅
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">سېتىلغان جەمئىي كارتىلار</div>
            <div className="text-2xl font-black text-blue-400 font-mono mt-0.5">{totalSold} تال</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
            🛡️
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">تەكرار سېتىلىشنىڭ ئالدىنى ئېلىش</div>
            <div className="text-sm font-bold text-amber-300 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>100% قۇلۇپلانغان</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Stock per Network & Package */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NETWORKS.map((net) => (
          <div key={net.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{net.name}</span>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                {net.packages.reduce((acc, p) => acc + (stockSummary[`${net.id}:${p.id}`]?.available || 0), 0)} تال بار
              </span>
            </div>

            <div className="space-y-2">
              {net.packages.map((pkg) => {
                const stock = stockSummary[`${net.id}:${pkg.id}`] || { available: 0, sold: 0 };
                return (
                  <div
                    key={pkg.id}
                    className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{pkg.title}</div>
                      <div className="text-[11px] text-amber-400 font-mono">{pkg.price}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                          stock.available > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {stock.available > 0 ? `ئامباردا: ${stock.available}` : 'تۈگىدى ⚠️'}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">سېتىلغىنى: {stock.sold}</span>
                      {stock.available > 0 && (
                        <button
                          type="button"
                          onClick={() => handleClearPackage(net.id, pkg.id, pkg.title)}
                          title="خاتا قاچىلانغان بولسا سېتىلمىغان كارتىلارنى ئۆچۈرۈش"
                          className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded text-[10px] flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>تازىلاش</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FAST BULK IMPORT FORM */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">كارتىلارنى ئامبارغا توپ قاچىلاش (Fast Bulk Import)</h3>
          </div>
          <span className="text-xs text-slate-400">1 چېكىپ يۈزلىگەن كارتىنى تىزىپ قاچىلاش</span>
        </div>

        <form onSubmit={handleBulkImport} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Network Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Wi-Fi تورىنى تاللاڭ:</label>
              <select
                value={selectedNetwork}
                onChange={(e) => handleNetworkChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              >
                {NETWORKS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Package Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">بولاق (كارتىنىڭ كۈنى/سىغىمى) نى تاللاڭ:</label>
              <select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              >
                {currentNet.packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — ({p.price})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Textarea for bulk cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>كارتىلارنىڭ نومۇرى ۋە پارولىنى چاپلاڭ:</span>
              <span className="text-[11px] text-emerald-400 font-normal">ھەر بىر قۇرغا: نومۇر پارول (مەسىلەن: 519637 681)</span>
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="519637 681&#10;90991 571&#10;782103 442&#10;884012 331"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">
              💡 بوشلۇق، قوش چېكىت ياكى پەش بىلەن ئايرىلغان نومۇر ۋە پاروللارنى سىستېما ئۆزى ئوقۇپ، سېكۇنتتا كارتىغا ئايلاندۇرىدۇ.
            </p>
            <button
              type="submit"
              disabled={importing || !rawText.trim()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-950"
            >
              {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>كارتىلارنى ئامبارغا قوشۇش ➔</span>
            </button>
          </div>
        </form>
      </div>

      {/* CARDS LIST & SEARCH */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">ئامباردىكى كارتىلار تىزىملىكى ({filteredCards.length} تال)</h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Net */}
            <select
              value={filterNet}
              onChange={(e) => setFilterNet(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">بارلىق تورلار</option>
              <option value="fursan_net">شبكة الفرسان</option>
              <option value="azez_net">شبكة عزيز نت</option>
              <option value="almujahid_net">شبكة المجاهد نت</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">بارلىق ھالەتلەر</option>
              <option value="available">ئامباردا بار</option>
              <option value="sold">سېتىلغان</option>
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="نومۇر، پارول ئىزدەش..."
                className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:outline-none w-44"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Batch Delete Selected Button */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-rose-950 animate-pulse"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تاللانغان ({selectedIds.length}) كارتىنى ئۆچۈرۈش</span>
              </button>
            )}
          </div>
        </div>

        {/* Cards Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      availableFiltered.length > 0 &&
                      availableFiltered.every((c) => selectedIds.includes(c.id))
                    }
                    onChange={toggleSelectAll}
                    title="ھەممە سېتىلمىغان كارتىلارنى تاللاش"
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">تەرتىپ</th>
                <th className="py-2.5 px-3">تور نامى</th>
                <th className="py-2.5 px-3">بولاق تۈرى</th>
                <th className="py-2.5 px-3">اسم المستخدم (Username)</th>
                <th className="py-2.5 px-3">كلمة المرور (Password)</th>
                <th className="py-2.5 px-3">ھالىتى</th>
                <th className="py-2.5 px-3">سېتىۋالغۇچى</th>
                <th className="py-2.5 px-3 text-center">مەشغۇلات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    ھېچقانداق كارتا تېپىلمىدى. يۇقىرىدىن يېڭى كارتا قوشۇڭ.
                  </td>
                </tr>
              ) : (
                filteredCards.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 text-center">
                      {c.status === 'available' ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700 cursor-pointer"
                        />
                      ) : (
                        <span className="text-slate-600 select-none text-xs">🔒</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{c.cardNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-200">{c.serviceName}</td>
                    <td className="py-3 px-3 text-slate-300">{c.packageTitle}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400 tracking-wider text-sm">
                      {c.username}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-teal-400 tracking-wider text-sm">
                      {c.password}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'available'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {c.status === 'available' ? 'ئامباردا بار ✅' : 'سېتىلدى 🔒'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {c.soldToUserEmail ? (
                        <div>
                          <div>{c.soldToUserEmail}</div>
                          <div className="text-[10px] text-slate-500">{c.soldOrderId}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {c.status === 'available' && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          title="ئۆچۈرۈش"
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
  );
}
