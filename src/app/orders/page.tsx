'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
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
  RefreshCw,
  Calendar,
  Clock,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { isOrderInProgress, type Order } from '@/lib/orders';
import { getCachedBalance, getCachedUser, storeLocalAuth, ClientUser } from '@/lib/clientAuth';
import { formatSmartPrice } from '@/lib/formatMoney';

export default function OrdersPage() {
  const { lang, t, isRTL, translatePackageTitle } = useLanguage();
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

  // While a provider order is still in progress, refresh swiftly so delivered codes appear automatically
  useEffect(() => {
    const inProgress = orders.filter((o) => isOrderInProgress(o.status));
    if (!inProgress.length) return;

    // Check if any in-flight order was created within the last 2 minutes for hyper-fast 4s polling
    const hasFreshOrder = inProgress.some(
      (o) => Date.now() - new Date(o.createdAt).getTime() < 2 * 60 * 1000
    );
    const intervalMs = hasFreshOrder ? 4000 : 10000;

    const timer = setInterval(fetchOrders, intervalMs);
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
              <span className="block text-slate-400 text-[10px] mb-1 font-alkatip">
                {t('fromDate')}
              </span>
              <div className="relative flex items-center justify-between bg-[#051120] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs hover:border-cyan-500/50 transition">
                <span className={`select-none ${startDate ? 'text-cyan-300 font-mono font-bold' : 'text-slate-400 font-alkatip'}`}>
                  {startDate ? startDate : t('datePlaceholder')}
                </span>
                <div className="flex items-center gap-1 text-slate-400">
                  {startDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStartDate('');
                      }}
                      className="relative z-20 text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer transition"
                      title={t('clear')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <Calendar className="w-3.5 h-3.5 pointer-events-none text-slate-400" />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.target as HTMLInputElement).showPicker?.();
                    } catch (_) {}
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
              </div>
            </div>

            <div>
              <span className="block text-slate-400 text-[10px] mb-1 font-alkatip">
                {t('toDate')}
              </span>
              <div className="relative flex items-center justify-between bg-[#051120] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs hover:border-cyan-500/50 transition">
                <span className={`select-none ${endDate ? 'text-cyan-300 font-mono font-bold' : 'text-slate-400 font-alkatip'}`}>
                  {endDate ? endDate : t('datePlaceholder')}
                </span>
                <div className="flex items-center gap-1 text-slate-400">
                  {endDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEndDate('');
                      }}
                      className="relative z-20 text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer transition"
                      title={t('clear')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <Calendar className="w-3.5 h-3.5 pointer-events-none text-slate-400" />
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.target as HTMLInputElement).showPicker?.();
                    } catch (_) {}
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
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
            <span>{t('results')}</span>
            <span className="font-mono font-bold text-cyan-400">{filteredOrders.length}</span>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('refresh')}</span>
          </button>
        </div>

        {/* Processing Orders Reassurance Banner */}
        {orders.some((o) => isOrderInProgress(o.status)) && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/40 text-amber-200 text-xs shadow-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <Hourglass className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
              <span>
                {lang === 'ug'
                  ? 'زاكاس بىر تەرەپ قىلىنىۋاتىدۇ (سەل تەخىر قىلىڭ ⚡️)'
                  : lang === 'ar'
                  ? 'الطلب قيد التنفيذ (يرجى الانتظار قليلاً ⚡️)'
                  : 'Order Processing (Please wait a moment ⚡️)'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-100/90 leading-relaxed font-alkatip">
              {lang === 'ug'
                ? 'سىستېمىمىز زاكاسنى ئاپتوماتىك تەستىقلاپ قاچىلاۋاتىدۇ (ئادەتتە بىر نەچچە سېكۇنتتىن 1-3 مىنۇتقىچە). ئەگەردە تەمىنلىگۈچى تەرەپتىن زاكاز ماقۇللانمىسا ياكى كاشىلا كۆرۈلسە، كېمەيتىلگەن قالدۇق پۇلىڭىز ھەميان ھېساباتىڭىزغا دەرھال ئاپتوماتىك 100% تولۇق قايتۇرۇلىدۇ. ھېچقانداق زىيان تارتمايسىز!'
                : lang === 'ar'
                ? 'نقوم بمعالجة وتنفيذ طلبك تلقائياً (1-3 دقائق). إذا لم تتم الموافقة على الطلب أو حدث خطأ، فسيتم إعادة كامل المبلغ إلى محفظتك فوراً وتلقائياً بنسبة 100% بدون أي خسارة!'
                : 'Your order is being automatically fulfilled (1-3 mins). If the order cannot be approved or fails, your money will be immediately and automatically refunded to your wallet balance in full!'}
            </p>
          </div>
        )}

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
                        title={t('copyOrderId')}
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
                        {translatePackageTitle(order.serviceName)}
                      </h3>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <span>{t('packageLabel')} </span>
                        <span className="text-amber-200">{translatePackageTitle(order.packageTitle)}</span>
                        <span className="mx-1.5">•</span>
                        <span>{t('accountLabel')} </span>
                        <span className="text-cyan-300 font-mono" dir="ltr">{order.targetAccount}</span>
                      </div>
                    </div>

                    <div className="text-left font-mono" dir="ltr">
                      <span className="font-extrabold text-amber-400 text-sm">
                        ${formatSmartPrice(Number(order.amount ?? (order as any).price ?? 0))}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Delivery payload details if available */}
                  {(() => {
                    const d: any = order.details || {};
                    const rawActivationUrl =
                      d.activationUrl ||
                      d.activationLink ||
                      d.inviteUrl ||
                      (d.delivery?.codes?.find((code: string) => /^https?:\/\//i.test(code))) ||
                      (typeof d.providerReply === 'string' && /^https?:\/\//i.test(d.providerReply) ? d.providerReply : undefined) ||
                      (typeof d.reply === 'string' && /^https?:\/\//i.test(d.reply) ? d.reply : undefined);

                    const nonUrlCodes = (d.delivery?.codes || []).filter((code: string) => !/^https?:\/\//i.test(code));
                    const textReply =
                      (!rawActivationUrl && typeof d.providerReply === 'string' && d.providerReply) ||
                      (!rawActivationUrl && typeof d.reply === 'string' && d.reply);

                    const hasDetails =
                      rawActivationUrl ||
                      textReply ||
                      nonUrlCodes.length > 0 ||
                      d.refundReason ||
                      d.accountCredentials ||
                      d.cardDetails ||
                      d.virtualNumber ||
                      d.smsCode;

                    if (!hasDetails) return null;

                    return (
                      <div className="mt-2.5 space-y-2 font-alkatip">
                        {/* 1. Dedicated Glowing Activation Link Card (Gemini AI, Subscriptions, Invite URLs) */}
                        {rawActivationUrl && (
                          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-[#072438] border-2 border-emerald-500/70 shadow-xl shadow-emerald-950/60 space-y-2.5 relative overflow-hidden">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-emerald-300 font-black text-xs sm:text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>{lang === 'ug' ? 'ئەزالىقنى ئاچقۇزۇش ئۇلانمىسى تەييار بولدى!' : lang === 'ar' ? 'رابط التفعيل جاهز للاستخدام!' : 'Activation Link Ready!'}</span>
                              </span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2.5 py-0.5 rounded-full font-bold">
                                {lang === 'ug' ? 'سېكۇنتتا قوزغىتىش' : lang === 'ar' ? 'تفعيل فوري' : 'Instant'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              {lang === 'ug'
                                ? 'تۆۋەندىكى كۇنۇپكىنى بېسىپ ئەزالىق ھېساباتىڭىزنى دەرھال ئاكتىپلاڭ ياكى ئۇلانمىنى كۆچۈرۈۋېلىڭ:'
                                : lang === 'ar'
                                ? 'اضغط على الزر أدناه لتفعيل اشتراكك فوراً أو نسخ الرابط:'
                                : 'Click the button below to activate your subscription or copy the link:'}
                            </p>

                            <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                              <a
                                href={rawActivationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-w-[150px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-xs transition shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transform active:scale-95"
                              >
                                <span>{lang === 'ug' ? '⚡️ ئەزالىقنى ئاكتىپلاش (ئېچىش)' : lang === 'ar' ? '⚡️ تفعيل الاشتراك (فتح)' : '⚡️ Open Activation Link'}</span>
                                <ExternalLink className="w-4 h-4 shrink-0" />
                              </a>
                              <button
                                type="button"
                                onClick={() => copyText(rawActivationUrl, `act-${order.id}`)}
                                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                {copiedId === `act-${order.id}` ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>{lang === 'ug' ? 'كۆچۈرۈلدى' : lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 shrink-0" />
                                    <span>{lang === 'ug' ? 'ئۇلانمىنى كۆچۈرۈش' : lang === 'ar' ? 'نسخ الرابط' : 'Copy Link'}</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="p-2 rounded-lg bg-black/60 border border-emerald-500/25 font-mono text-[10px] text-emerald-200/90 break-all select-all" dir="ltr">
                              {rawActivationUrl}
                            </div>
                          </div>
                        )}

                        {/* 2. Provider Text Reply (if non-URL note/reply) */}
                        {textReply && (
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">
                              {lang === 'ug' ? 'تەمىنلىگۈچى جاۋابى:' : lang === 'ar' ? 'رد المزود:' : 'Provider Note:'}
                            </span>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-emerald-300 font-mono text-[11px] break-all">{textReply}</span>
                              <button
                                type="button"
                                onClick={() => copyText(textReply, `reply-${order.id}`)}
                                className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                              >
                                {copiedId === `reply-${order.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 3. Non-URL Gift Card Codes, Vouchers, Credentials, etc. */}
                        {(nonUrlCodes.length > 0 || d.refundReason || d.accountCredentials || d.cardDetails || d.virtualNumber || d.smsCode) && (
                          <div className="pt-2 border-t border-slate-800/80 bg-slate-950/60 p-2.5 rounded-xl text-xs space-y-1.5">
                            {nonUrlCodes.map((code: string, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-2">
                                <span className="text-slate-400 text-[11px] shrink-0">{t('codeLabel')}</span>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-emerald-300 font-bold font-mono break-all" dir="ltr">
                                    {code}
                                  </span>
                                  <button
                                    onClick={() => copyText(code, `code-${order.id}-${idx}`)}
                                    className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                                  >
                                    {copiedId === `code-${order.id}-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            ))}

                            {d.refundReason && (
                              <div className="text-[11px] text-rose-300">
                                {t('refunded')} {d.refundReason}
                              </div>
                            )}

                            {d.accountCredentials && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-[11px]">{t('credentialsLabel')}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-300 font-bold font-mono" dir="ltr">
                                    {d.accountCredentials}
                                  </span>
                                  <button
                                    onClick={() => copyText(d.accountCredentials!, `cred-${order.id}`)}
                                    className="text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    {copiedId === `cred-${order.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            )}

                            {d.cardDetails && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-[11px]">{t('cardNumberLabel')}</span>
                                <span className="text-amber-300 font-bold font-mono" dir="ltr">
                                  {d.cardDetails.number}
                                </span>
                              </div>
                            )}

                            {d.virtualNumber && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-[11px]">{t('virtualNumberLabel')}</span>
                                <span className="text-cyan-300 font-bold font-mono" dir="ltr">
                                  {d.virtualNumber}
                                </span>
                              </div>
                            )}

                            {d.smsCode && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-[11px]">{t('smsCodeLabel')}</span>
                                <span className="text-amber-300 font-bold font-mono text-sm bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40" dir="ltr">
                                  {d.smsCode}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Reassurance Message for in-flight processing orders */}
                  {isProcessing && (
                    (() => {
                      const isOverOneHour = Date.now() - new Date(order.createdAt).getTime() >= 60 * 60 * 1000;
                      if (isOverOneHour) {
                        return (
                          <div className="mt-2.5 pt-2.5 border-t border-amber-500/40 bg-amber-950/40 p-3 rounded-xl text-xs space-y-1.5 text-amber-200 font-alkatip border border-amber-500/50 shadow-inner">
                            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                              <span>
                                {lang === 'ug'
                                  ? 'زاكاس بىر سائەتتىن ئاشتى (سەل سەۋر قىلىپ بەرگەيسىز):'
                                  : 'Order In Progress (> 1 hour):'}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-100/90 leading-relaxed">
                              {lang === 'ug'
                                ? 'بۇ مەھسۇلاتنىڭ باش تەمىنلىگۈچى سىستېمىسىدا زاكازلار بەك كۆپىيىپ كەتكەنلىكى ئۈچۈن قاچىلىنىش سۈرئىتى ئاستىلاپ كەتتى. ئەنسىرىمەڭ! زاكىسىڭىز قاچىلىنىش رېتىدە مېڭىۋاتىدۇ، چوقۇم يېتىپ بارىدۇ. ئەگەر بارماي قالغان تەقدىردىمۇ، پۇلىڭىز دۇكىنىمىز كاپالىتى بويىچە 100% ھەميىنىڭىزگە تولۇق قايتۇرۇلىدۇ.'
                                : 'Due to heavy server volume at the provider, delivery is taking longer than usual. Rest assured your order is queued and will arrive. If it fails, your payment will be 100% refunded to your wallet balance.'}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div className="mt-2 pt-2 border-t border-amber-500/20 bg-amber-950/30 p-2.5 rounded-xl text-xs space-y-1 text-amber-200 font-alkatip">
                          <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
                            <Hourglass className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span>
                              {lang === 'ug' ? 'سەل تەخىر قىلىڭ (تەستىقلىنىۋاتىدۇ):' : 'Please wait (Verifying):'}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-200/90 leading-relaxed">
                            {lang === 'ug'
                              ? 'زاكاس بىر نەچچە سېكۇنتتىن 1-3 مىنۇتتا ئاپتوماتىك قاچىلىنىدۇ. ئەگەر مەھسۇلات ماقۇللانماي قالسا، پۇلىڭىز ھەميان قالدۇقىڭىزغا دەرھال 100% تولۇق قايتۇرۇلىدۇ.'
                              : 'Order will be auto-delivered in 1-3 mins. If it fails or is not approved, your funds are immediately refunded to your wallet in full.'}
                          </p>
                        </div>
                      );
                    })()
                  )}

                  {/* Refund confirmation note for cancelled/refunded orders */}
                  {(isFailed || (order.status as string) === 'refunded') && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 bg-emerald-950/30 p-2.5 rounded-xl text-xs space-y-1 text-emerald-200 font-alkatip">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {lang === 'ug' ? 'پۇل قايتۇرۇلدى (100% كاپالەت):' : 'Refunded (100% Guarantee):'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                        {lang === 'ug'
                          ? 'بۇ زاكاز تەستىقلانمىغانلىقى ئۈچۈن، سومما دەرھال ھەميان قالدۇقىڭىزغا 100% تولۇق قايتۇرۇلدى.'
                          : 'Since this order was not approved, the amount was refunded to your wallet balance in full.'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
