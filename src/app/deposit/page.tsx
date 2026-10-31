'use client';

import { clearLocalAuth, getCachedBalance, getCachedUser, storeLocalAuth, formatCurrencyAmount, ClientUser } from '@/lib/clientAuth';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SGCSubpageLayout from '@/components/SGCSubpageLayout';
import AuthModal from '@/components/AuthModal';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Wallet, 
  CheckCircle2, 
  Clock,
  Hourglass,
  XCircle,
  AlertCircle, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Send,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  Megaphone
} from 'lucide-react';

interface DepositRecord {
  id: string;
  method: string;
  amount: number;
  status: 'completed' | 'processing' | 'failed' | 'pending' | 'rejected';
  date: string;
  txId?: string;
  reviewedAt?: string;
}

export default function DepositPage() {
  const { lang, t, isRTL } = useLanguage();
  const [balance, setBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return getCachedBalance();
    }
    return 0.0;
  });
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(() => {
    if (typeof window !== 'undefined') {
      return getCachedUser();
    }
    return null;
  });
  const [selectedMethod, setSelectedMethod] = useState<'shamcash' | 'usdt' | 'syriatel'>('shamcash');
  const [amount, setAmount] = useState<number>(0);
  const [showManualAmount, setShowManualAmount] = useState<boolean>(false);
  const [showVisualGuide, setShowVisualGuide] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [txNote, setTxNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<{ amount: number; txId: string; auto: boolean } | null>(null);

  // Dynamic Sham Cash config loaded from server
  const [shamAddress, setShamAddress] = useState<string>('efe8a2b200d66411c7c7e296369cbba8');
  const [exchangeRate, setExchangeRate] = useState<number>(143);
  const [autoDepositEnabled, setAutoDepositEnabled] = useState<boolean>(true);

  const [depositHistory, setDepositHistory] = useState<DepositRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedDeposit, setSubmittedDeposit] = useState<DepositRecord | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<{ id: string; text: string; success: boolean } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchDeposits();
    loadUserBalance();
    fetchDepositConfig();
  }, []);

  // Poll pending deposits
  useEffect(() => {
    const hasPending = depositHistory.some((d) => d.status === 'pending' || d.status === 'processing');
    if (!hasPending) return;
    const timer = setInterval(() => {
      fetchDeposits();
      loadUserBalance();
    }, 7000);
    return () => clearInterval(timer);
  }, [depositHistory]);

  const fetchDepositConfig = async () => {
    try {
      const res = await fetch(`/api/deposits/config?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        if (data.shamcashAddress) setShamAddress(data.shamcashAddress);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
        if (data.autoDepositEnabled !== undefined) setAutoDepositEnabled(data.autoDepositEnabled);
      }
    } catch (e) {
      console.warn('Failed to load deposit config:', e);
    }
  };

  const loadUserBalance = async () => {
    try {
      const cached = getCachedUser();
      if (cached) {
        setCurrentUser(cached);
        setBalance(cached.balance ?? 0.0);
      }

      const email = localStorage.getItem('autocash_email');
      const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
      if (isLoggedIn === 'true' && email) {
        const res = await fetch('/api/auth/me');
        if (res.status === 401) {
          clearLocalAuth();
          setCurrentUser(null);
          setBalance(0.0);
          return;
        }
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setBalance(data.user.balance ?? 0.0);
          storeLocalAuth(data.user);
        }
      } else {
        setCurrentUser(null);
        setBalance(0.0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDepositModal = () => {
    if (!currentUser || !currentUser.email) {
      setIsAuthOpen(true);
      return;
    }
    setShowDepositModal(true);
  };

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem('autocash_email');
      const url = email ? `/api/deposits?userEmail=${encodeURIComponent(email)}` : '/api/deposits';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.deposits) {
        setDepositHistory(data.deposits);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPending = async (depositId: string) => {
    setVerifyingId(depositId);
    setVerifyMessage(null);
    try {
      const res = await fetch('/api/deposits/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId }),
      });
      const data = await res.json();

      if (data.success && data.verified) {
        setVerifyMessage({
          id: depositId,
          text: data.message || 'تالون دەلىللەندى! ھېساباتىڭىزغا پۇل قوشۇلدى.',
          success: true,
        });
        await loadUserBalance();
        await fetchDeposits();
      } else {
        setVerifyMessage({
          id: depositId,
          text: data.message || 'شامكەشتىن تېخى تېپىلمىدى. 10-30 سېكۇنت ساقلاپ قايتا سىناڭ.',
          success: false,
        });
      }
    } catch (err: any) {
      setVerifyMessage({
        id: depositId,
        text: err?.message || 'دەلىللەش جەريانىدا خاتالىق كۆرۈلدى',
        success: false,
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const totalSuccessfulAmount = depositHistory
    .filter((d) => d.status === 'completed')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const successfulCount = depositHistory.filter((d) => d.status === 'completed').length;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = async () => {
    if (isSubmitting) return;

    if (!currentUser || !currentUser.email) {
      setFormError(t('loginToDepositAlert'));
      setIsAuthOpen(true);
      return;
    }

    if (!txNote.trim()) {
      setFormError('شامكەش تالون نومۇرى (رقم العملية) نى كىرگۈزۈڭ');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount > 0 ? amount : 0,
          method: 'شامكەش (Sham Cash)',
          txId: txNote.trim(),
          userName: currentUser.name,
          userEmail: currentUser.email,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newRecord = data.deposit;
        setDepositHistory((prev) => [newRecord, ...prev.filter((d) => d.id !== newRecord.id)]);
        setSubmittedDeposit(newRecord);
        setTxNote('');

        if (data.autoApproved) {
          // Instant automated approval
          setIsSuccess(true);
          setSuccessInfo({
            amount: data.creditedAmount || (amount > 0 ? amount : 0),
            txId: newRecord.txId || txNote.trim(),
            auto: true,
          });
          await loadUserBalance();
        } else {
          // Pending review
          setIsSuccess(true);
          setSuccessInfo({
            amount: data.creditedAmount || (amount > 0 ? amount : 0),
            txId: newRecord.txId || txNote.trim(),
            auto: false,
          });
        }

        setTimeout(() => {
          const el = document.getElementById('deposit-history-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        setFormError(data.message || 'خاتالىق كۆرۈلدى');
      }
    } catch (err) {
      console.error(err);
      setFormError('ئۇلىنىش خاتالىقى كۆرۈلدى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowDepositModal(false);
    setIsSuccess(false);
    setSuccessInfo(null);
    setTxNote('');
    setFormError('');
  };

  return (
    <SGCSubpageLayout
      title={lang === 'ug' ? 'ھەميانىم' : t('navDeposit')}
      subtitle={lang === 'ug' ? 'پۇل كىرگۈزۈش ۋە ھەميان قالدۇقى تارىخى' : 'إيداع الرصيد وسجل المحفظة'}
      headerActions={
        <button
          onClick={() => {
            fetchDeposits();
            loadUserBalance();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition cursor-pointer"
          title="يېڭىلاش"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'animate-icon-gleam'}`} />
          <span>يېڭىلاش</span>
        </button>
      }
    >
      <div className="space-y-4">
        {/* Unauthenticated Login Prompt Banner */}
        {(!currentUser || !currentUser.email) && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-amber-600 dark:text-amber-300 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 dark:text-amber-400" />
              <span>
                {t('loginToDepositAlert')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer w-full sm:w-auto"
            >
              {t('loginRequiredBtn')}
            </button>
          </div>
        )}

        {/* SGC Game Luxury Emerald Balance Card */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden space-y-5 border border-emerald-500/30">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Available Balance */}
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-emerald-100 font-alkatip font-bold">
                  {t('availableBalanceLabel')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 font-mono">
                  VIP 1
                </span>
              </div>
              <div
                className={`text-3xl sm:text-4xl font-black text-white font-mono tracking-tight flex items-center gap-1.5 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="text-amber-300 font-bold">$</span>
                <span>{formatCurrencyAmount(balance)}</span>
              </div>
            </div>

            {/* New Deposit Button */}
            <button
              onClick={handleOpenDepositModal}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-105 text-slate-950 text-xs sm:text-sm font-black transition shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 font-alkatip shrink-0 animate-nav-pill-glow"
            >
              <Zap className="w-4 h-4 fill-current text-slate-950 stroke-[2.5] animate-icon-sparkle" />
              <span>{t('newDepositBtn')}</span>
            </button>
          </div>

          {/* Sub summary metrics row */}
          <div className="relative z-10 grid grid-cols-2 gap-3 pt-3.5 border-t border-white/15">
            <div className={`p-3 sm:p-3.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-[11px] text-emerald-200 block mb-0.5 font-bold">
                {t('totalDepositedAmount')}
              </span>
              <span
                className={`font-mono text-base font-extrabold text-white flex items-center gap-0.5 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="text-amber-300 font-bold">$</span>
                <span>{totalSuccessfulAmount.toFixed(2)}</span>
              </span>
            </div>

            <div className={`p-3 sm:p-3.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-[11px] text-emerald-200 block mb-0.5 font-bold">
                {t('successfulDepositsCount')}
              </span>
              <span className="font-mono text-base font-extrabold text-white">
                {successfulCount}
              </span>
            </div>
          </div>
        </div>

        {/* Deposit History */}
        <div id="deposit-history-section" className="space-y-3 pt-2">
          {/* Submission alert if recently submitted */}
          {submittedDeposit && submittedDeposit.status === 'pending' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                  <Hourglass className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 text-sm">
                      {t('depositUnderReviewTitle')}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px]">
                      #{submittedDeposit.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed font-alkatip">
                    {t('depositPendingNotice')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleVerifyPending(submittedDeposit.id)}
                disabled={verifyingId === submittedDeposit.id}
                className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95 font-alkatip"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === submittedDeposit.id ? 'animate-spin' : ''}`} />
                <span>{verifyingId === submittedDeposit.id ? t('verifying') : t('verifyNow')}</span>
              </button>
            </div>
          )}

          {/* Verification feedback message */}
          {verifyMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                verifyMessage.success
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border border-amber-300 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {verifyMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />}
                <span>{verifyMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setVerifyMessage(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pb-1">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {t('depositHistoryTitle')}
              </span>
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              {depositHistory.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {depositHistory.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#101726] border border-dashed border-slate-300 dark:border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-alkatip font-bold">
                  {t('noDepositHistory')}
                </p>
                <button
                  type="button"
                  onClick={handleOpenDepositModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer font-alkatip shadow-xs"
                >
                  {t('newDepositBtn')}
                </button>
              </div>
            ) : (
              depositHistory.map((item) => {
                const isCompleted = item.status === 'completed';
                const isRejected = item.status === 'rejected' || (item as any).status === 'failed';
                const isPending = !isCompleted && !isRejected;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#101726] border ${
                      isPending ? 'border-amber-400 dark:border-amber-500/50 shadow-xs' : 'border-slate-200/90 dark:border-white/10'
                    } flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition gap-3`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                            : isRejected
                            ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isRejected ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <Hourglass className="w-4 h-4 animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {item.method || t('shamcashName')}
                          </h4>
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800 shrink-0 font-alkatip">
                              {t('underReview')}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 shrink-0 font-alkatip">
                              {t('autoCredited')}
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800 shrink-0 font-alkatip">
                              {t('rejected')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5 truncate" dir="ltr">
                          {item.date} • #{item.id} {item.txId ? `• Tx: ${item.txId}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleVerifyPending(item.id)}
                          disabled={verifyingId === item.id}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 font-alkatip"
                          title={t('verifyNow')}
                        >
                          <RefreshCw className={`w-3 h-3 ${verifyingId === item.id ? 'animate-spin' : ''}`} />
                          <span>{verifyingId === item.id ? '...' : t('verifyNow')}</span>
                        </button>
                      )}

                      <div className="text-left font-mono shrink-0" dir="ltr">
                        <span
                          className={`font-black text-sm sm:text-base block ${
                            isCompleted
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isRejected
                              ? 'text-slate-400 line-through'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isCompleted ? '+' : ''}${formatCurrencyAmount(item.amount)}
                        </span>
                        <span
                          className={`block text-[9px] font-alkatip font-bold ${
                            isCompleted
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isRejected
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isCompleted
                            ? t('statusCompleted')
                            : isRejected
                            ? t('rejected')
                            : t('underReview')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal: Deposit Modal - SGC Game Unified Sham Cash Design */}
        {showDepositModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/75 backdrop-blur-md animate-in fade-in"
            />

            <div
              className={`relative z-10 w-full max-w-lg bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl ${
                isRTL ? 'text-right' : 'text-left'
              } max-h-[92vh] overflow-y-auto font-alkatip text-slate-800 dark:text-slate-100`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 mb-4">
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-1 rounded-full text-xs cursor-pointer font-bold transition flex items-center gap-1"
                >
                  ✕ {t('close')}
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-5 rounded-full bg-emerald-500 animate-icon-sparkle" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-alkatip flex items-center gap-1.5">
                    <span>{t('depositTitle')}</span>
                  </h3>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>چىقىمدان تۈرىنى تاللاڭ:</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">1 USD = {exchangeRate.toLocaleString()} SYP</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* ShamCash Tab - Active */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('shamcash')}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 relative ${
                      selectedMethod === 'shamcash'
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-extrabold text-xs">ShamCash</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold font-alkatip">
                      ئاكتىپ
                    </span>
                  </button>

                  {/* USDT Tab - Coming Soon */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('usdt')}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 relative ${
                      selectedMethod === 'usdt'
                        ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-sm'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="font-extrabold text-xs">USDT (TRC20)</span>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold font-alkatip flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>يېقىندا</span>
                    </span>
                  </button>

                  {/* Syriatel & MTN Tab - Coming Soon */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('syriatel')}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 relative ${
                      selectedMethod === 'syriatel'
                        ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-sm'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="font-extrabold text-xs truncate max-w-full">Syriatel / MTN</span>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold font-alkatip flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>يېقىندا</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Notice for USDT (Coming soon) */}
              {selectedMethod === 'usdt' && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3 mb-4 text-center animate-in fade-in">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-amber-900 dark:text-amber-200 font-alkatip">
                      USDT (TRC20) ئارقىلىق ھەميان تولۇقلاش پات ئارىدا قوشۇلىدۇ
                    </h4>
                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed font-alkatip">
                      USDT ئاپتوماتىك قاچىلاش تۈگۈنى تەڭشەلمەكتە. سىز ھازىرچە <b>شامكەش (ShamCash)</b> ئارقىلىق 10 سېكۇنتتا نەق مەيدان پۇل قاچىلىيالايسىز.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('shamcash')}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>شامكەش (ShamCash) ئارقىلىق داۋاملاشتۇرۇش</span>
                  </button>
                </div>
              )}

              {/* Notice for Syriatel & MTN Cash (Coming soon) */}
              {selectedMethod === 'syriatel' && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3 mb-4 text-center animate-in fade-in">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-amber-900 dark:text-amber-200 font-alkatip">
                      Syriatel ۋە MTN Cash ئارقىلىق ھەميان تولۇقلاش پات ئارىدا قوشۇلىدۇ
                    </h4>
                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed font-alkatip">
                      سۈرىيەتېل ۋە ئىمتىئېن كاش كۆۋرۈكى سىناق باسقۇچىدا بولۇپ، يېقىن كۈنلەردە ئىشقا كىرىشتۈرۈلىدۇ. ھازىرچە <b>شامكەش (ShamCash)</b> ئارقىلىق پۇل كىرگۈزەلەيسىز.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('shamcash')}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>شامكەش (ShamCash) ئارقىلىق داۋاملاشتۇرۇش</span>
                  </button>
                </div>
              )}

              {selectedMethod === 'shamcash' && (
                <>
                  {/* Step 1: Payment Method Pill (Sham Cash) */}
              <div className="space-y-2 mb-3.5">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-500/80 text-slate-900 dark:text-white shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500 p-0.5 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-sm flex items-center justify-center flex-shrink-0 animate-nav-pill-glow">
                      <img
                        src="https://i.ibb.co/MkYW8ynm/images.jpg"
                        alt="Sham Cash"
                        className="w-full h-full rounded-lg object-cover bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/shamcash.png';
                        }}
                      />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white font-alkatip">{t('shamcashName')}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-current text-emerald-600 dark:text-emerald-400 animate-icon-sparkle" />
                          <span>{t('autoVerification')}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5 font-alkatip font-bold">
                        {t('instantAutoViaShamCash')}
                      </p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs animate-icon-sparkle">
                    ✓
                  </div>
                </div>
              </div>

              {/* Step 2: Instructions and Address Copy */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 space-y-2 mb-3 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-slate-700 dark:text-slate-200 font-bold">{t('ourShamCashAccount')}</span>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-lg shadow-2xs" dir="ltr">
                    1 USD = {exchangeRate.toLocaleString()} SYP
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 shadow-2xs">
                  <button
                    onClick={() => handleCopy(shamAddress)}
                    className="flex items-center gap-1 text-[11px] text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 animate-nav-pill-glow"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('copyAddress')}</span>
                      </>
                    )}
                  </button>
                  <span
                    className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs sm:text-sm tracking-wider select-all break-all text-left"
                    dir="ltr"
                  >
                    {shamAddress}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pt-1 font-alkatip leading-relaxed font-medium">
                  <p>1. Sham Cash ئەپىڭىزنى ئېچىپ، يۇقىرىدىكى ئادرېسقا پۇل ئەۋەتىڭ.</p>
                  <p>2. چىققان تالوندىكى <b>«رقم العملية»</b> (تالون نومۇرى) نى كۆچۈرۈپ تۆۋەنگە چاپلاڭ.</p>
                </div>
              </div>

              {/* Step 3 (Visual Guide): Sham Cash Receipt Mock Guide */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setShowVisualGuide(!showVisualGuide)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-emerald-800 dark:text-emerald-300 font-bold transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-star-glint" />
                    <span>📸 تالون كۆرسەتمىسى (رقم العملية قەيەردە؟)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {showVisualGuide ? '▲ يوشۇرۇش' : '▼ كۆرۈش'}
                  </span>
                </button>

                {showVisualGuide && (
                  <div className="mt-2 p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0c1424] border border-slate-200 dark:border-white/10 space-y-2 text-xs shadow-xs animate-in fade-in">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-white/10 text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                        <span>🇸🇾 شام كاش (Sham Cash) - إشعار عملية</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                        ✅ تم التحويل بنجاح
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#070d18] border-2 border-dashed border-emerald-400 dark:border-emerald-600 shadow-2xs flex items-center justify-between gap-2">
                      <div className="space-y-0.5 text-left" dir="ltr">
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-alkatip font-bold block">
                          رقم العملية (مۇشۇ نومۇرنى كۆچۈرۈڭ):
                        </span>
                        <span className="font-mono font-black text-amber-500 text-sm sm:text-base tracking-wider">
                          84920183
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black shrink-0 shadow-2xs animate-icon-sparkle">
                        👈 مۇشۇ نومۇرنى چاپلاڭ
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-alkatip leading-relaxed pt-0.5 font-bold">
                      💡 شامكەش ئەپى چىقىرىپ بەرگەن تالوندىكى «<b>رقم العملية</b>» دېگەن نومۇرنى كۆچۈرۈۋېلىڭ.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 4: Transaction ID Input (رقم العملية) — PRIMARY 1-STEP INPUT */}
              <div className="space-y-1.5 mb-3 p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/25 border-2 border-emerald-400 dark:border-emerald-600/70 shadow-xs">
                <label className="text-xs text-emerald-900 dark:text-emerald-200 font-black flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-icon-sparkle" />
                    <span>⚡️ تالون نومۇرى (رقم العملية) نى بۇ يەرگە چاپلاڭ:</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    {t('txIdExample')}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={txNote}
                    onChange={(e) => {
                      setTxNote(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="مەسىلەن: 84920183 (بۇ يەرگە چاپلاڭ)"
                    className={`w-full bg-white dark:bg-[#070d18] border ${
                      formError ? 'border-rose-500 ring-1 ring-rose-500/40' : 'border-emerald-400 dark:border-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/50'
                    } rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition font-mono ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                    dir="ltr"
                    autoFocus
                  />
                </div>
                {formError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formError}</span>
                  </p>
                )}
                <p className="text-[10px] text-emerald-900 dark:text-emerald-300 font-alkatip pt-0.5 leading-relaxed font-bold">
                  💡 <b>دوللار ھېسابلاپ ئولتۇرۇشىڭىزنىڭ ھاجىتى يوق!</b> پەقەت تالون نومۇرىنى كىرگۈزسىڭىزلا، سىستېما شامكەشتىن پۇل مىقدارىنى ئۆزى ئوقۇپ، سېكۇنتتا دوللارغا ئايلاندۇرۇپ ھەميىنىڭىزگە چۈشۈرۈپ بېرىدۇ.
                </p>
              </div>

              {/* Optional Helper: Calculator / Preset Amount for Pre-Transfer Planning */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowManualAmount(!showManualAmount)}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer font-alkatip font-bold"
                >
                  <span>{showManualAmount ? '▲ دوللار / پۇل ھېسابلىغۇچنى يوشۇرۇش' : '▼ (ئىختىيارىي) پۇل ئەۋەتىشتىن بۇرۇن دوللار كۇرسىنى ھېسابلاش'}</span>
                </button>

                {showManualAmount && (
                  <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2 animate-in fade-in text-xs">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[10, 25, 50, 100].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt)}
                          className={`py-1.5 rounded-xl border text-xs font-bold font-mono transition cursor-pointer ${
                            amount === amt
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm animate-nav-pill-glow'
                              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="دوللار مىقدارى (مەسىلەن: 25)"
                      className={`w-full bg-white dark:bg-[#070d18] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition font-mono ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                      dir="ltr"
                    />
                    {amount > 0 && (
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                        <span>سورىيە پۇلىدىكى مىقدارى:</span>
                        <span className="font-bold text-emerald-900 dark:text-white font-mono" dir="ltr">
                          {(amount * exchangeRate).toLocaleString()} SYP
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button or Success State */}
              {!isSuccess ? (
                <>
                  <button
                    disabled={isSubmitting}
                    onClick={handleDepositSubmit}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:brightness-105 text-white text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-[0.98] animate-nav-pill-glow"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t('verifyingShamCash')}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 fill-current text-white animate-icon-sparkle" />
                        <span>{t('verifyAndCreditAuto')}</span>
                      </span>
                    )}
                  </button>

                  <div className="pt-2.5 flex flex-wrap items-center justify-center gap-3 text-center">
                    <a
                      href="https://t.me/autocash_cannel"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-sky-500 hover:text-sky-400 font-bold font-alkatip hover:underline"
                    >
                      <Megaphone className="w-3.5 h-3.5 text-sky-500 animate-icon-gleam" />
                      <span>{t('telegramChannel')}</span>
                    </a>
                    <span className="text-slate-400 dark:text-white/20 hidden sm:inline">•</span>
                    <a
                      href="https://t.me/autocash_UYGHUR"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-cyan-500 hover:text-cyan-400 font-bold font-alkatip hover:underline"
                    >
                      <Send className="w-3.5 h-3.5 text-cyan-500 animate-icon-gleam" />
                      <span>{t('telegramSupport')}</span>
                    </a>
                    <span className="text-slate-400 dark:text-white/20 hidden sm:inline">•</span>
                    <a
                      href="https://wa.me/963984373459"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-emerald-500 hover:text-emerald-400 font-bold font-alkatip hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500 animate-icon-sparkle" />
                      <span>WhatsApp: <span dir="ltr" className="font-mono">+963 984 373 459</span></span>
                    </a>
                  </div>
                </>
              ) : (
                <div className="space-y-3.5 mt-2 animate-in fade-in zoom-in-95 duration-200">
                  {successInfo?.auto ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs space-y-2 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400 animate-nav-pill-glow">
                        <CheckCircle2 className="w-7 h-7 animate-icon-sparkle" />
                      </div>
                      <h4 className="font-bold text-sm text-emerald-300">
                        {t('depositSuccessTitle')}
                      </h4>
                      <p className="text-base font-extrabold text-white font-mono">
                        +${formatCurrencyAmount(successInfo.amount)} USD
                      </p>
                      <p className="text-[11px] text-emerald-300/80 leading-relaxed font-alkatip">
                        {t('receiptNumber')} <span className="font-mono font-bold text-white">{successInfo.txId}</span>
                        <br />
                        {t('depositSuccessDesc')}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                        <span>{t('depositUnderReviewTitle')}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-alkatip">
                        {t('receiptNumber')} <span className="font-mono font-bold text-cyan-300">{submittedDeposit?.id}</span>
                        <br />
                        Tx: <span className="font-mono font-bold text-amber-300">{successInfo?.txId}</span>
                        <br />
                        {t('depositPendingNotice')}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCloseModal}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
                  >
                    {t('confirmAndClose')}
                  </button>
                </div>
              )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal for Unauthenticated Users */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          loadUserBalance();
          fetchDeposits();
        }}
      />
    </SGCSubpageLayout>
  );
}
