'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SGCSubpageLayout from '@/components/SGCSubpageLayout';
import AuthModal from '@/components/AuthModal';
import { useLanguage } from '@/context/LanguageContext';
import { getCachedBalance, getCachedUser, logout, type ClientUser } from '@/lib/clientAuth';
import {
  MessageSquareQuote,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bug,
  Lightbulb,
  Handshake,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Bot,
} from 'lucide-react';

const FEEDBACK_TYPES = [
  { id: 'تەكلىپ-پىكىر', label: 'تەكلىپ-پىكىر', icon: Lightbulb, color: 'text-amber-400' },
  { id: 'سۈرۈشتۈرۈش', label: 'سۈرۈشتۈرۈش ۋە سوئال', icon: HelpCircle, color: 'text-sky-400' },
  { id: 'مەسىلە-شىكايەت', label: 'مەسىلە ياكى كاشىلا', icon: Bug, color: 'text-rose-400' },
  { id: 'ھەمكارلىق', label: 'ھەمكارلىق تەكلىپى', icon: Handshake, color: 'text-emerald-400' },
  { id: 'باشقىلار', label: 'باشقا مەزمۇن', icon: MessageSquareQuote, color: 'text-purple-400' },
];

export default function FeedbackPage() {
  const { lang, isRTL } = useLanguage();
  const [userBalance, setUserBalance] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Form State
  const [feedbackType, setFeedbackType] = useState('تەكلىپ-پىكىر');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserBalance(getCachedBalance());
      const u = getCachedUser();
      setCurrentUser(u);
      if (u?.name) setName(u.name);
      if (u?.email) setContact(u.email);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('ئىنكاس مەزمۇنىنى كىرگۈزۈڭ.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || currentUser?.name || 'نامەلۇم خېرىدار',
          contact: contact.trim() || currentUser?.email || 'تەمىنلەنمىگەن',
          type: feedbackType,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ئۇچۇر يوللاشتا خاتالىق كۆرۈلدى');
      }

      setIsSuccess(true);
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'ئۇچۇر يوللاش مەغلۇپ بولدى، تورنى تەكشۈرۈپ قايتا سىناڭ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SGCSubpageLayout
      title="پىكىر-تەلەپ ۋە ئىنكاس"
      subtitle="خېرىدارلار ساداسى • تېز يەتكۈزۈش"
    >
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 font-alkatip">
        {/* Breadcrumb / Title Area */}
        <div className="mb-6 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خېرىدارلار ساداسى • تېز يەتكۈزۈش</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white flex items-center justify-end gap-2.5">
            <span>پىكىر-تەلەپ ۋە ئىنكاس يوللاش</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            سىز يازغان ھەر قانداق سۆز، تەلەپ ياكى تەكلىپ بىزنىڭ مەسئۇل باشقۇرغۇچىمىزنىڭ تېلېگراممىسىغا بىۋاسىتە ۋە دەل ۋاقتىدا يېتىپ بارىدۇ.
          </p>
        </div>

        {/* Success Modal / State */}
        {isSuccess ? (
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0f172a] border border-emerald-500/40 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
              ئىنكاسىڭىز مۇۋەپپەقىيەتلىك يەتكۈزۈلدى!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              پىكىر بەرگىنىڭىزگە چىن كۆڭلىمىزدىن رەھمەت ئېيتىمىز! باشقۇرغۇچىمىز ئۇچۇرىڭىزنى تەكشۈرۈپ چىقىپ، زۆرۈر تېپىلغاندا سىز بىلەن ئالاقىلىشىدۇ.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition active:scale-95 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                يەنە باشقا ئىنكاس يېزىش
              </button>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 text-center"
              >
                باشبەتكە قايتىش
              </Link>
            </div>
          </div>
        ) : (
          /* Main Feedback Form */
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl p-5 sm:p-7 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-xl space-y-5"
          >
            {/* Feedback Category Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5 text-right">
                ئىنكاس تۈرىنى تاللاڭ:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEEDBACK_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = feedbackType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFeedbackType(type.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${type.color}`} />
                      <span className="truncate">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-right">
                ئىسمىڭىز (تاللاشچان):
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مەسىلەن: ئەخمەت"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-right transition"
              />
            </div>

            {/* Contact / Telegram / Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-right">
                ئالاقىلىشىش ئۇچۇرىڭىز (تېلېگرامما ئادرېس ياكى تېلېفون نومۇر):
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="@username ياكى +90 5xx xxx xxxx"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-right transition"
                dir="ltr"
              />
            </div>

            {/* Message Content Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-400 font-sans">
                  {message.length} ھەرپ
                </span>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  ئىنكاس مەزمۇنى <span className="text-rose-500">*</span>:
                </label>
              </div>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="بۇ يەرگە ئۆزىڭىزنىڭ تەكلىپى، سوئالى ياكى ئۇچرىغان مەسىلىلىرىنى خالىغانچە يېزىڭ..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-right transition resize-none leading-relaxed"
              />
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>تېلېگراممىغا يوللىنىۋاتىدۇ...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ئىنكاسنى بىۋاسىتە يوللاش</span>
                </>
              )}
            </button>

            {/* Direct Bot Alternative Banner */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <a
                href="https://t.me/autocash_UYGHUR"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-500 hover:underline flex items-center gap-1 font-bold"
              >
                <span>تېلېگراممىدا سۆزلىشىش</span>
                {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </a>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                100% مەخپىيەتلىك كاپالىتى
              </span>
            </div>
          </form>
        )}
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode="login"
      />
    </SGCSubpageLayout>
  );
}
