'use client';

import { clearLocalAuth } from '@/lib/clientAuth';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import AuthModal from '@/components/AuthModal';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Wallet, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Send,
  MessageCircle
} from 'lucide-react';

interface DepositRecord {
  id: string;
  method: string;
  amount: number;
  status: 'completed' | 'processing' | 'failed';
  date: string;
  txId?: string;
}

export default function DepositPage() {
  const { lang, t, isRTL } = useLanguage();
  const [balance, setBalance] = useState<number>(0.0);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string; balance?: number } | null>(null);
  const [amount, setAmount] = useState<number>(25);
  const [copied, setCopied] = useState<boolean>(false);
  const [txNote, setTxNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Sham Cash payment method details
  const currentMethod = {
    id: 'shamcash',
    name: 'شامكەش (Sham Cash)',
    nameEn: 'Sham Cash',
    address: 'efe8a2b200d66411c7c7e296369cbba8',
    rate: '1 USD = شامكەش نىسبىتى',
  };

  const [depositHistory, setDepositHistory] = useState<DepositRecord[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedDeposit, setSubmittedDeposit] = useState<DepositRecord | null>(null);

  useEffect(() => {
    fetchDeposits();
    loadUserBalance();
  }, []);

  const loadUserBalance = async () => {
    try {
      const email = localStorage.getItem('autocash_email');
      const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
      const userId = localStorage.getItem('autocash_userId');
      const username = localStorage.getItem('autocash_username');
      if (isLoggedIn === 'true' && email) {
        setCurrentUser({
          id: userId || undefined,
          name: username || email.split('@')[0],
          email,
        });
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
          setBalance(data.user.balance || 0.0);
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
    if (amount <= 0 || isSubmitting) return;

    if (!currentUser || !currentUser.email) {
      setFormError('ھەميانغا پۇل كىرگۈزۈش ئۈچۈن ئالدى بىلەن ھېساباتىڭىزغا كىرىشىڭىز كېرەك!');
      setIsAuthOpen(true);
      return;
    }

    if (!txNote.trim()) {
      setFormError(t('proofRequiredError'));
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          method: currentMethod.name,
          txId: txNote.trim(),
          userName: currentUser.name,
          userEmail: currentUser.email,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newRecord = data.deposit;
        setDepositHistory((prev) => [newRecord, ...prev]);
        setSubmittedDeposit(newRecord);
        setIsSuccess(true);
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
    setTxNote('');
    setFormError('');
  };

  return (
    <div
      className={`min-h-screen bg-[#040e1d] text-slate-100 flex flex-col pb-24 md:pb-8 selection:bg-amber-400 selection:text-slate-950 font-alkatip ${
        isRTL ? 'text-right' : 'text-left'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Navbar balance={balance} />

      <main className="max-w-2xl mx-auto px-4 py-5 w-full flex-1 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-bold transition shadow cursor-pointer font-alkatip"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{t('store')}</span>
          </Link>

          <div className={isRTL ? 'text-left' : 'text-right'}>
            <h1 className="font-ukij text-2xl sm:text-3xl font-black text-white gold-text-glow leading-snug">
              {t('navDeposit')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ug'
                ? 'بۇ يەردىن ھەميان قالدۇقىڭىزنى تەكشۈرەلەيسىز ۋە يېڭىدىن پۇل كىرگۈزەلەيسىز.'
                : lang === 'ar'
                ? 'يمكنك هنا التحقق من رصيد محفظتك وإجراء عمليات إيداع جديدة.'
                : 'Check your wallet balance and make new deposits.'}
            </p>
          </div>
        </div>

        {/* Unauthenticated Login Prompt Banner */}
        {(!currentUser || !currentUser.email) && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-amber-300 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                {lang === 'ug'
                  ? 'ھەميانغا پۇل كىرگۈزۈش ئۈچۈن ئالدى بىلەن ھېساباتىڭىزغا كىرىشىڭىز كېرەك.'
                  : lang === 'ar'
                  ? 'يرجى تسجيل الدخول أولاً لشحن المحفظة برصيد جديد.'
                  : 'Please sign in to your account first to top up your wallet balance.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer w-full sm:w-auto"
            >
              {lang === 'ug'
                ? 'ھېساباتقا كىرىش / تىزىملىتىش (Gmail)'
                : lang === 'ar'
                ? 'تسجيل الدخول / إنشاء حساب (Gmail)'
                : 'Sign In / Register (Gmail)'}
            </button>
          </div>
        )}

        {/* Big Balance Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#051427] via-[#07192d] to-[#0a233f] border border-cyan-500/30 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Available Balance */}
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <span className="text-xs sm:text-sm text-slate-400 block mb-1 font-alkatip">
                {t('availableBalanceLabel')}
              </span>
              <div
                className={`text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight flex items-center gap-1.5 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="text-cyan-400 animate-dollar-float">$</span>
                <span>
                  {(() => {
                    const s = Number(balance || 0).toFixed(2);
                    if (s.endsWith('.00')) return s.slice(0, -3);
                    if (s.endsWith('0') && s.includes('.')) return s.slice(0, -1);
                    return s;
                  })()}
                </span>
              </div>
            </div>

            {/* New Deposit Button */}
            <button
              onClick={handleOpenDepositModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-[#0088cc] hover:bg-[#0099e6] text-white text-xs sm:text-sm font-black transition shadow-lg shadow-cyan-600/30 cursor-pointer active:scale-95 font-alkatip shrink-0 w-full sm:w-auto"
            >
              <span className="animate-plus-wiggle shrink-0">
                <Plus className="w-4 h-4 text-white stroke-[2.5]" />
              </span>
              <span>{t('newDepositBtn')}</span>
            </button>
          </div>

          {/* Sub summary metrics row */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
            <div className={`p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-[11px] text-slate-400 block mb-1">
                {lang === 'ug' ? 'ئومۇمىي كىرگۈزۈلگەن سومما' : lang === 'ar' ? 'إجمالي المبالغ المودعة' : 'Total Deposited'}
              </span>
              <span
                className={`font-mono text-base font-extrabold text-cyan-400 flex items-center gap-0.5 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
                dir="ltr"
              >
                <span className="animate-dollar-float text-cyan-400">$</span>
                <span>{totalSuccessfulAmount.toFixed(2)}</span>
              </span>
            </div>

            <div className={`p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-[11px] text-slate-400 block mb-1">
                {lang === 'ug' ? 'ئۇتۇقلۇق كىرگۈزۈش قېتىم سانى' : lang === 'ar' ? 'عدد عمليات الإيداع الناجحة' : 'Successful Deposits'}
              </span>
              <span className="font-mono text-base font-extrabold text-white">
                {successfulCount}
              </span>
            </div>
          </div>
        </div>

        {/* Deposit History */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>
                {lang === 'ug' ? 'ھەميان كىرگۈزۈش خاتىرىسى' : lang === 'ar' ? 'سجل عمليات الإيداع' : 'Deposit History'}
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({depositHistory.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {depositHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#07192d] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {t('shamcashName')}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5" dir="ltr">
                      {item.date} • #{item.id}
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono" dir="ltr">
                  <span className="font-extrabold text-emerald-400 text-sm">
                    +${item.amount.toFixed(2)}
                  </span>
                  <span className="block text-[9px] text-emerald-300/70">
                    {t('statusCompleted')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              onClick={handleCloseModal}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            />

            <div
              className={`relative z-10 w-full max-w-lg bg-[#07192d] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl ${
                isRTL ? 'text-right' : 'text-left'
              } max-h-[90vh] overflow-y-auto font-alkatip`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
                >
                  ✕ {t('close')}
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-5 rounded-full bg-amber-400" />
                  <h3 className="font-ukij font-bold text-base text-white">
                    {t('depositTitle')}
                  </h3>
                </div>
              </div>

              {/* Step 1: Payment Method */}
              <div className="space-y-2 mb-4">
                <label className="text-xs text-slate-300 font-bold block">
                  {t('paymentMethod')}
                </label>
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-[#0a1e36] to-[#041122] border-2 border-amber-400/80 text-white shadow-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-400/80 p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md shadow-amber-500/30 flex items-center justify-center flex-shrink-0">
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
                        <h4 className="font-extrabold text-sm text-white">{t('shamcashName')}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                          {t('officialActive')}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200/80 mt-0.5 font-alkatip">
                        {lang === 'ug' ? 'شامكەش ئارقىلىق بىۋاستە پۇل قاچىلاش' : lang === 'ar' ? 'شحن فوري ومباشر عبر شام كاش' : 'Direct deposit via Sham Cash'}
                      </p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                    ✓
                  </div>
                </div>
              </div>

              {/* Step 2: Amount Presets */}
              <div className="space-y-2 mb-4">
                <label className="text-xs text-slate-300 font-bold block">
                  {t('enterAmount')}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-2 rounded-xl border text-xs font-bold font-mono transition cursor-pointer ${
                        amount === amt
                          ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
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
                  placeholder="مىقدارىنى يېزىڭ (USD)"
                  className={`w-full bg-[#051120] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-mono ${
                    isRTL ? 'text-right' : 'text-left'
                  }`}
                  dir="ltr"
                />
              </div>

              {/* Instructions and Address Copy */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2 mb-4 text-xs">
                <p className="text-slate-300 font-semibold leading-relaxed">
                  {t('transferInstructions')}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopy(currentMethod.address)}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
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
                    className="text-cyan-300 font-mono font-bold text-xs sm:text-sm tracking-wider select-all break-all text-left"
                    dir="ltr"
                  >
                    {currentMethod.address}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                  <span className="text-slate-400">
                    {lang === 'ug' ? 'تۆلەيدىغان ئومۇمىي مىقدار:' : lang === 'ar' ? 'إجمالي المبلغ المطلوب دفعه:' : 'Total Amount to Pay:'}
                  </span>
                  <span className="font-mono font-black text-amber-400 text-sm sm:text-base" dir="ltr">
                    ${amount.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Payment Proof Number Input (پۇل ئاتقان ئىسپات نۇمۇرى) */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs text-amber-300 font-bold flex items-center justify-between">
                  <span>{t('enterTxId')}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {lang === 'ug' ? '(تالون نومۇرى ياكى پۇل يۆتكەش ئىسپات نومۇرى)' : lang === 'ar' ? '(رقم العملية / الإشعار)' : '(Proof / TxID)'}
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
                    placeholder={t('enterTxIdPlaceholder')}
                    className={`w-full bg-[#051120] border ${
                      formError ? 'border-rose-500 ring-1 ring-rose-500/40' : 'border-slate-700/80 focus:border-amber-400'
                    } rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition font-alkatip ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
                {formError && (
                  <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formError}</span>
                  </p>
                )}
              </div>

              {/* Submit Button or Success Confirmation */}
              {!isSuccess ? (
                <>
                  <button
                    disabled={isSubmitting}
                    onClick={handleDepositSubmit}
                    className="w-full py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span>دەلىللەنمەكتە...</span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 fill-current text-slate-950" />
                        <span>{t('completePaymentBtn')}</span>
                      </span>
                    )}
                  </button>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-center">
                    <a
                      href="https://t.me/autocash_UYGHUR"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold font-alkatip hover:underline"
                    >
                      <Send className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t('telegramSupport')}</span>
                    </a>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <a
                      href="https://wa.me/963984373459"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold font-alkatip hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp: <span dir="ltr" className="font-mono">+963 984 373 459</span></span>
                    </a>
                  </div>
                </>
              ) : (
                <div className="space-y-3.5 mt-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                      <span>تالونىڭىز قوبۇل قىلىندى (تەكشۈرۈلمەكتە)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-alkatip">
                      تالون نومۇرىڭىز: <span className="font-mono font-bold text-cyan-300">{submittedDeposit?.id}</span>
                      <br />
                      ئىسپات نومۇرى: <span className="font-mono font-bold text-amber-300">{submittedDeposit?.txId}</span>
                      <br />
                      باشقۇرغۇچى شامكەشتىكى كىرىمنى تەكشۈرۈپ تەستىقلىغاندىن كېيىن (5-15 مىنۇتتا) قالدۇقىڭىزغا ئاپتوماتىك قوشۇلىدۇ.
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/963984373459?text=${encodeURIComponent(
                      `ئەسسالامۇ ئەلەيكۇم، مەن AUTO CASH سۇپىسىدا پۇل كىرگۈزدۈم.\nتالون ID: ${submittedDeposit?.id}\nئىسپات نومۇرى: ${submittedDeposit?.txId}\nسوممىسى: $${submittedDeposit?.amount} USD\nتالون سۈرىتىمنى تەستىقلاپ بەرسىڭىز.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>تالوننى WhatsApp ئارقىلىق تېز تەستىقلىتىش</span>
                  </a>

                  <button
                    onClick={handleCloseModal}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    جەزملەش ۋە تاقاش
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

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

      <BottomNav />
    </div>
  );
}
