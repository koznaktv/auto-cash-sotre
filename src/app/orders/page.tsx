'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Hourglass, 
  ChevronLeft, 
  ChevronRight,
  Copy, 
  Check, 
  RefreshCw
} from 'lucide-react';
import { isOrderInProgress, type Order } from '@/lib/orders';
import { getCachedBalance, getCachedUser, storeLocalAuth, ClientUser } from '@/lib/clientAuth';

export default function OrdersPage() {
  const { lang, t, isRTL } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return getCachedBalance();
    }
    return 0.0;
  });
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(() => {
    if (typeof window !== 'undefined') {
      return getCachedUser();
    }
    return null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'processing'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // While a provider order is still in progress, refresh so delivered codes show up on their own
  useEffect(() => {
    if (!orders.some((o) => isOrderInProgress(o.status))) return;
    const timer = setInterval(fetchOrders, 15000);
    return () => clearInterval(timer);
  }, [orders]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOrders();

    const cached = getCachedUser();
    if (cached) {
      setCurrentUser(cached);
      setBalance(cached.balance ?? 0.0);
    }

    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('autocash_is_logged_in') === 'true';
    if (isLoggedIn) {
      fetch('/api/auth/me')
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            if (data.success && data.user) {
              setCurrentUser(data.user);
              setBalance(data.user.balance ?? 0.0);
              storeLocalAuth(data.user);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'processing' ? isOrderInProgress(order.status) : order.status === statusFilter);
    if (!matchesFilter) {
      return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.serviceName.toLowerCase().includes(q);
      const matchPkg = order.packageTitle.toLowerCase().includes(q);
      const matchAcc = order.targetAccount.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPkg && !matchAcc) return false;
    }

    if (startDate) {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (orderDate < startDate) return false;
    }
    if (endDate) {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (orderDate > endDate) return false;
    }

    return true;
  });

  return (
    <div
      className={`min-h-screen bg-[#040e1d] text-slate-100 flex flex-col pb-24 md:pb-8 selection:bg-cyan-500 selection:text-white font-alkatip ${
        isRTL ? 'text-right' : 'text-left'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Navbar balance={balance} user={currentUser} />

      <main className="max-w-2xl mx-auto px-4 py-5 w-full flex-1 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition shadow cursor-pointer font-alkatip"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{t('store')}</span>
          </Link>

          <div className={isRTL ? 'text-left' : 'text-right'}>
            <h1 className="font-ukij text-2xl sm:text-3xl font-black text-white gold-text-glow leading-snug">
              {t('ordersTitle')}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('ordersSubtitle')}
            </p>
          </div>
        </div>

        {/* Filter Card container */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#071628]/90 border border-slate-800 shadow-xl space-y-3.5">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('orderSearchPlaceholder')}
              className={`w-full bg-[#051120] border border-slate-700/80 rounded-xl ${
                isRTL ? 'pr-3 pl-10 text-right' : 'pl-3 pr-10 text-left'
              } py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition font-alkatip`}
            />
            <Search className={`w-4 h-4 text-slate-400 absolute ${isRTL ? 'left-3' : 'right-3'} top-3 pointer-events-none`} />
          </div>

          {/* Date Picker Row */}
          <div className="grid grid-cols-2 gap-2.5 text-[11px]">
            <div>
              <span className="block text-slate-400 text-[10px] mb-1">
                {isRTL ? 'تارىختىن:' : 'From:'}
              </span>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#051120] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <span className="block text-slate-400 text-[10px] mb-1">
                {isRTL ? 'بۈگۈنگە قەدەر:' : 'To:'}
              </span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#051120] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('statusAll')}
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('statusCompleted')}</span>
            </button>

            <button
              onClick={() => setStatusFilter('processing')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === 'processing'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('statusProcessing')}</span>
            </button>

            <button
              onClick={() => setStatusFilter('failed')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === 'failed'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{t('statusCancelled')}</span>
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
          <div className="flex items-center gap-2">
            <span>{isRTL ? 'نەتىجىلەر:' : 'Results:'}</span>
            <span className="font-mono font-bold text-cyan-400">{filteredOrders.length}</span>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{isRTL ? 'يېڭىلاش' : 'Refresh'}</span>
          </button>
        </div>

        {/* Orders List / Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-[#061424]/40 my-3">
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-1">
              {t('noOrdersFound')}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {filteredOrders.map((order) => {
              const isCompleted = order.status === 'completed';
              const isProcessing = isOrderInProgress(order.status);
              const isFailed = order.status === 'failed';

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-[#07192d] border border-slate-800 hover:border-amber-500/40 transition shadow-lg space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded-md text-amber-300" dir="ltr">
                        #{order.id}
                      </span>
                      <button
                        onClick={() => copyText(order.id, `id-${order.id}`)}
                        className="text-slate-500 hover:text-white p-1 cursor-pointer"
                        title={isRTL ? 'نومۇرنى كۆچۈرۈش' : 'Copy Order ID'}
                      >
                        {copiedId === `id-${order.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="text-xs">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t('statusCompleted')}</span>
                        </span>
                      )}
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          <Hourglass className="w-3 h-3 animate-spin" />
                          <span>{t('statusProcessing')}</span>
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          <XCircle className="w-3 h-3" />
                          <span>{t('statusCancelled')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {order.serviceName}
                      </h3>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <span>{isRTL ? 'بولاق:' : 'Package:'} </span>
                        <span className="text-amber-200">{order.packageTitle}</span>
                        <span className="mx-1.5">•</span>
                        <span>{isRTL ? 'ئابۇنىت:' : 'Account:'} </span>
                        <span className="text-cyan-300 font-mono" dir="ltr">{order.targetAccount}</span>
                      </div>
                    </div>

                    <div className="text-left font-mono" dir="ltr">
                      <span className="font-extrabold text-amber-400 text-sm">
                        ${Number(order.amount ?? (order as any).price ?? 0).toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Delivery payload details if available */}
                  {order.details &&
                    (order.details.delivery?.codes?.length ||
                      order.details.refundReason ||
                      order.details.accountCredentials ||
                      order.details.cardDetails ||
                      order.details.virtualNumber ||
                      order.details.smsCode) && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 bg-slate-950/60 p-2.5 rounded-xl text-xs space-y-1.5 font-alkatip">
                      {order.details.delivery?.codes?.map((code, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 text-[11px] shrink-0">{isRTL ? 'كود:' : 'Code:'}</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-emerald-300 font-bold font-mono break-all" dir="ltr">
                              {code}
                            </span>
                            <button
                              onClick={() => copyText(code, `code-${order.id}-${idx}`)}
                              className="text-slate-400 hover:text-white shrink-0"
                            >
                              {copiedId === `code-${order.id}-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      ))}
                      {order.details.refundReason && (
                        <div className="text-[11px] text-rose-300">
                          {isRTL ? 'پۇل قايتۇرۇلدى: ' : 'Refunded: '}
                          {order.details.refundReason}
                        </div>
                      )}
                      {order.details.accountCredentials && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">
                            {isRTL ? 'ھېسابات ئۇچۇرى:' : 'Credentials:'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-300 font-bold font-mono" dir="ltr">
                              {order.details.accountCredentials}
                            </span>
                            <button
                              onClick={() => copyText(order.details!.accountCredentials!, `cred-${order.id}`)}
                              className="text-slate-400 hover:text-white"
                            >
                              {copiedId === `cred-${order.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {order.details.cardDetails && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">
                            {isRTL ? 'كارتا نومۇرى:' : 'Card Number:'}
                          </span>
                          <span className="text-amber-300 font-bold font-mono" dir="ltr">
                            {order.details.cardDetails.number}
                          </span>
                        </div>
                      )}
                      {order.details.virtualNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">
                            {isRTL ? 'مەۋھۇم نومۇر:' : 'Number:'}
                          </span>
                          <span className="text-cyan-300 font-bold font-mono" dir="ltr">
                            {order.details.virtualNumber}
                          </span>
                        </div>
                      )}
                      {order.details.smsCode && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">
                            {isRTL ? 'SMS كود:' : 'SMS Code:'}
                          </span>
                          <span className="text-amber-300 font-bold font-mono text-sm bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40" dir="ltr">
                            {order.details.smsCode}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
