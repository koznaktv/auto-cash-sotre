'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
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
  const [balance, setBalance] = useState<number>(120.5);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(25);
  const [copied, setCopied] = useState<boolean>(false);
  const [txNote, setTxNote] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Sham Cash payment method details
  const currentMethod = {
    id: 'shamcash',
    name: 'شامكەش (Sham Cash)',
    nameEn: 'Sham Cash',
    address: '963984373459',
    rate: '1 USD = شامكەش نىسبىتى',
  };

  const [depositHistory, setDepositHistory] = useState<DepositRecord[]>([
    {
      id: 'DEP-8841',
      method: 'شامكەش (Sham Cash)',
      amount: 50.0,
      status: 'completed',
      date: '2026-10-08 18:24',
      txId: 'SC-99238411',
    },
    {
      id: 'DEP-8812',
      method: 'شامكەش (Sham Cash)',
      amount: 25.0,
      status: 'completed',
      date: '2026-10-06 14:10',
      txId: 'SC-77123990',
    },
    {
      id: 'DEP-8790',
      method: 'شامكەش (Sham Cash)',
      amount: 45.5,
      status: 'completed',
      date: '2026-10-03 21:05',
      txId: 'SC-55192834',
    },
  ]);

  const totalSuccessfulAmount = depositHistory
    .filter((d) => d.status === 'completed')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const successfulCount = depositHistory.filter((d) => d.status === 'completed').length;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = () => {
    if (amount <= 0) return;

    const newRecord: DepositRecord = {
      id: `DEP-${Math.floor(1000 + Math.random() * 9000)}`,
      method: currentMethod.name,
      amount: amount,
      status: 'completed',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      txId: txNote || `SC-${Math.floor(10000000 + Math.random() * 90000000)}`,
    };

    setIsSuccess(true);
    setTimeout(() => {
      setDepositHistory([newRecord, ...depositHistory]);
      setBalance((prev) => prev + amount);
      setIsSuccess(false);
      setShowDepositModal(false);
      setTxNote('');
    }, 1200);
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
          <div>
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

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-bold transition shadow cursor-pointer font-alkatip"
          >
            <span>{t('store')}</span>
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Link>
        </div>

        {/* Big Balance Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#051427] via-[#07192d] to-[#0a233f] border border-cyan-500/30 shadow-2xl space-y-4">
          <div className="flex items-start justify-between">
            {/* New Deposit Button */}
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0099e6] text-white text-xs font-black transition shadow-lg shadow-cyan-600/30 cursor-pointer active:scale-95 font-alkatip"
            >
              <span className="animate-plus-wiggle shrink-0">
                <Plus className="w-4 h-4 text-white stroke-[2.5]" />
              </span>
              <span>{t('newDepositBtn')}</span>
            </button>

            {/* Available Balance */}
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <span className="text-xs text-slate-400 block mb-1">
                {t('availableBalanceLabel')}
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight flex items-center gap-1.5" dir="ltr">
                <span className="text-cyan-400 animate-dollar-float">$</span>
                <span>{balance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Sub summary metrics row */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
            <div className={`p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-[11px] text-slate-400 block mb-1">
                {lang === 'ug' ? 'ئومۇمىي كىرگۈزۈلگەن سومما' : lang === 'ar' ? 'إجمالي المبالغ المودعة' : 'Total Deposited'}
              </span>
              <span className="font-mono text-base font-extrabold text-cyan-400 flex items-center gap-0.5" dir="ltr">
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
              onClick={() => setShowDepositModal(false)}
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
                  onClick={() => setShowDepositModal(false)}
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

              {/* Submit Button */}
              <button
                onClick={handleDepositSubmit}
                className="w-full py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer"
              >
                {t('completePaymentBtn')}
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

              {isSuccess && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('depositSubmittedSuccess')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
