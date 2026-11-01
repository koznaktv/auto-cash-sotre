'use client';

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, Unlink, ExternalLink, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface TelegramLinkCardProps {
  userId?: string;
  isLoggedIn?: boolean;
  onStatusChange?: (isLinked: boolean) => void;
  standalone?: boolean;
}

export default function TelegramLinkCard({
  userId,
  isLoggedIn = true,
  onStatusChange,
  standalone = false,
}: TelegramLinkCardProps) {
  const { lang: currentLang } = useLanguage();
  const lang = currentLang === 'ar' || currentLang === 'ug' || currentLang === 'en' ? currentLang : 'ar';
  const isRTL = lang === 'ar' || lang === 'ug';

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [linkData, setLinkData] = useState<{
    isLinked: boolean;
    telegramChatId?: string | number | null;
    telegramUsername?: string | null;
    telegramLinkedAt?: string | null;
    linkUrl?: string;
  }>({
    isLinked: false,
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const uid = userId || (typeof window !== 'undefined' ? localStorage.getItem('autocash_userId') || '' : '');
      const url = uid ? `/api/auth/telegram-link?userId=${encodeURIComponent(uid)}` : '/api/auth/telegram-link';
      const res = await fetch(url, {
        headers: uid ? { 'x-user-id': uid } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLinkData({
            isLinked: Boolean(data.isLinked),
            telegramChatId: data.telegramChatId,
            telegramUsername: data.telegramUsername,
            telegramLinkedAt: data.telegramLinkedAt,
            linkUrl: data.linkUrl,
          });
          onStatusChange?.(Boolean(data.isLinked));
        }
      }
    } catch (err: any) {
      console.warn('Failed to load telegram link status:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [userId]);

  const handleOpenBot = () => {
    if (linkData.linkUrl) {
      window.open(linkData.linkUrl, '_blank');
    } else {
      window.open('https://t.me/Autocash_24_bot', '_blank');
    }
  };

  const handleConfirmCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = codeInput.trim();
    if (!cleanCode) {
      setErrorMsg(
        lang === 'ar'
          ? 'الرجاء إدخال كود الربط المكون من 6 أرقام'
          : lang === 'ug'
          ? '6 خانىلىق باغلاش كودىنى كىرگۈزۈڭ'
          : 'Please enter the 6-digit link code'
      );
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const uid = userId || (typeof window !== 'undefined' ? localStorage.getItem('autocash_userId') || '' : '');
      const res = await fetch('/api/auth/telegram-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, code: cleanCode }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          lang === 'ar'
            ? 'تم ربط حسابك في تيليغرام بنجاح! الرصيد والطلبات متزامنة بالكامل.'
            : lang === 'ug'
            ? 'تېلېگرامما ھېساباتىڭىز مۇۋەپپەقىيەتلىك باغلاندى! قالدۇق پۇل ۋە زاكاسلار بىر گەۋدە قىلىندى.'
            : 'Telegram account successfully linked!'
        );
        setCodeInput('');
        fetchStatus();
      } else {
        setErrorMsg(
          data.message ||
            (lang === 'ar'
              ? 'كود الربط غير صحيح أو منتهي الصلاحية'
              : lang === 'ug'
              ? 'باغلاش كودى خاتا ياكى ۋاقتى ئۆتكەن'
              : 'Invalid or expired link code')
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while verifying code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlink = async () => {
    const confirmText =
      lang === 'ar'
        ? 'هل أنت متأكد من رغبتك في فك الربط مع بوت تيليغرام؟'
        : lang === 'ug'
        ? 'راستلا تېلېگرامما بوتتىن ھېساباتنى ئۈزمەكچىمۇ؟'
        : 'Are you sure you want to unlink from the Telegram bot?';

    if (!window.confirm(confirmText)) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const uid = userId || (typeof window !== 'undefined' ? localStorage.getItem('autocash_userId') || '' : '');
      const res = await fetch('/api/auth/telegram-link', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          lang === 'ar'
            ? 'تم إلغاء الربط مع البوت بنجاح.'
            : lang === 'ug'
            ? 'تېلېگرامما بوت بىلەن ئالاقە مۇۋەپپەقىيەتلىك ئۈزۈلدى.'
            : 'Unlinked successfully.'
        );
        fetchStatus();
      } else {
        setErrorMsg(data.message || 'Failed to unlink');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to unlink');
    } finally {
      setActionLoading(false);
    }
  };

  const formatLinkedDate = (isoStr?: string | null) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toISOString().replace('T', ' ').slice(0, 19);
    } catch {
      return isoStr;
    }
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`w-full bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs transition-all ${
        standalone ? 'max-w-4xl mx-auto p-6 sm:p-10 my-6' : 'p-5 sm:p-8'
      }`}
    >
      {/* Top Header: Linked Telegram Details (Matching Image Reference) */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 mb-6 border-b border-slate-100 dark:border-white/10 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div>
          {linkData.isLinked ? (
            <div className="space-y-1">
              <div className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
                <span>{lang === 'ar' ? 'حساب تيليغرام المرتبط: ' : lang === 'ug' ? 'باغلانغان تېلېگرامما ھېساباتى: ' : 'Linked Telegram Account: '}</span>
                <span className="text-[#0088cc] font-mono">
                  {linkData.telegramUsername ? `@${linkData.telegramUsername}` : `ID: ${linkData.telegramChatId}`}
                </span>
              </div>
              {linkData.telegramLinkedAt && (
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>{lang === 'ar' ? 'تاريخ الربط: ' : lang === 'ug' ? 'باغلانغان ۋاقتى: ' : 'Linked At: '}</span>
                  <span>{formatLinkedDate(linkData.telegramLinkedAt)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span>{lang === 'ar' ? 'حالة الربط: ' : lang === 'ug' ? 'باغلىنىش ھالىتى: ' : 'Link Status: '}</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {lang === 'ar' ? 'غير مرتبط حالياً' : lang === 'ug' ? 'تېخى باغلانمىدى' : 'Not Linked Yet'}
              </span>
            </div>
          )}
        </div>

        {linkData.isLinked && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'متصل بنجاح' : lang === 'ug' ? 'مۇۋەپپەقىيەتلىك باغلاندى' : 'Active & Connected'}</span>
          </span>
        )}
      </div>

      {/* Section 1: خطوات الربط (Linking Steps) */}
      <div className={`mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mb-2.5">
          {lang === 'ar' ? 'خطوات الربط:' : lang === 'ug' ? 'باغلاش باسقۇچلىرى:' : 'Linking Steps:'}
        </h4>
        <ol className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed list-decimal list-inside">
          <li>
            <span>{lang === 'ar' ? 'الضغط على زر ' : lang === 'ug' ? 'تۆۋەندىكى ' : 'Click on '}</span>
            <button
              type="button"
              onClick={handleOpenBot}
              className="text-[#0088cc] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer mx-1"
            >
              <span>{lang === 'ar' ? 'فتح البوت' : lang === 'ug' ? '«بوتنى ئېچىش»' : 'Open Bot'}</span>
            </button>
            <span>{lang === 'ar' ? 'أدناه.' : lang === 'ug' ? 'كۇنۇپكىسىنى بېسىش.' : 'below.'}</span>
          </li>
          <li>
            <span>
              {lang === 'ar'
                ? 'بدء المحادثة مع البوت عبر الضغط على Start أو إرسال الأمر /start.'
                : lang === 'ug'
                ? 'بوتتا «Start» كۇنۇپكىسىنى بېسىش ياكى /start بۇيرۇقىنى يوللاش.'
                : 'Start the conversation with the bot by pressing Start or sending /start.'}
            </span>
          </li>
          <li>
            <span>
              {lang === 'ar'
                ? 'استلام كود الربط من البوت.'
                : lang === 'ug'
                ? 'بوتتىن 6 خانىلىق باغلاش كودىنى تاپشۇرۇۋېلىش.'
                : 'Receive the linking code from the bot.'}
            </span>
          </li>
          <li>
            <span>
              {lang === 'ar'
                ? 'إدخال كود الربط في الحقل أدناه، ثم الضغط على تأكيد الربط.'
                : lang === 'ug'
                ? 'باغلاش كودىنى تۆۋەندىكى بوش ئورۇنغا كىرگۈزۈپ، «باغلاشنى جەزملەش» كۇنۇپكىسىنى بېسىش.'
                : 'Enter the link code in the field below, then click Confirm Link.'}
            </span>
          </li>
        </ol>
      </div>

      {/* Section 2: مزايا استخدام البوت (Bot Advantages) */}
      <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mb-2.5">
          {lang === 'ar' ? 'مزايا استخدام البوت:' : lang === 'ug' ? 'بوت ئىشلىتىشنىڭ ئەۋزەللىكلىرى:' : 'Bot Advantages:'}
        </h4>
        <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-slate-400 select-none">•</span>
            <span>
              {lang === 'ar'
                ? 'إنشاء الطلبات وشراء الخدمات مباشرة من تيليغرام.'
                : lang === 'ug'
                ? 'بارلىق زاكاز ۋە مەھسۇلاتلارنى بىۋاستە تېلېگرامما ئارقىلىق سېتىۋېلىش.'
                : 'Create orders and buy services directly from Telegram.'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-400 select-none">•</span>
            <span>
              {lang === 'ar'
                ? 'استقبال إشعارات فورية بحالة الطلبات وحركات شحن الرصيد والاعتراضات.'
                : lang === 'ug'
                ? 'زاكازلارنىڭ ھالىتى، ھەميانغا پۇل كىرىش ۋە مۇلازىمەت ھەققىدىكى دەقىقىلىق ئۇقتۇرۇشلارنى تاپشۇرۇۋېلىش.'
                : 'Receive instant notifications on order status, balance recharge, and tickets.'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-400 select-none">•</span>
            <span>
              {lang === 'ar'
                ? 'عرض الرصيد وبعض بيانات الحساب من داخل البوت دون الحاجة لتسجيل الدخول إلى الموقع.'
                : lang === 'ug'
                ? 'توربەتكە كىرىپ يۈرمەيلا، بوت ئىچىدىن ئورتاق قالدۇق ۋە ھېسابات ئۇچۇرلىرىنى كۆرۈش.'
                : 'View balance and account info inside the bot without logging into the website.'}
            </span>
          </li>
        </ul>
      </div>

      {/* Notification Toasts */}
      {errorMsg && (
        <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Button 1: فتح البوت على تيليغرام (Open Bot on Telegram) */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={handleOpenBot}
          className="px-6 sm:px-8 py-2.5 rounded-full bg-[#00a651] hover:bg-[#008f45] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>
            {lang === 'ar'
              ? 'فتح البوت على تيليغرام'
              : lang === 'ug'
              ? 'تېلېگراممىدا بوتنى ئېچىش'
              : 'Open Bot on Telegram'}
          </span>
        </button>
      </div>

      {/* Action Area: Either Code Input (if not linked) OR Unlink Button (if linked) */}
      {!linkData.isLinked ? (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'ar'
                ? 'إدخال كود الربط من البوت:'
                : lang === 'ug'
                ? 'بوتتىن تاپشۇرۇۋالغان باغلاش كودىنى كىرگۈزۈڭ:'
                : 'Enter linking code from bot:'}
            </span>
          </div>

          <form onSubmit={handleConfirmCode} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'أدخل الكود (مثال: 849201)'
                  : lang === 'ug'
                  ? 'كودنى كىرگۈزۈڭ (مەسىلەن: 849201)'
                  : 'Enter code (e.g. 849201)'
              }
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono text-center tracking-widest focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              maxLength={12}
            />
            <button
              type="submit"
              disabled={actionLoading || !codeInput.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#00a651] hover:bg-[#008f45] disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{lang === 'ar' ? 'تأكيد الربط' : lang === 'ug' ? 'باغلاشنى جەزملەش' : 'Confirm Link'}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full mb-6">
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleUnlink}
            className="w-full py-3.5 rounded-2xl bg-[#00a651] hover:bg-[#008f45] disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-98"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
            <span>
              {lang === 'ar'
                ? 'فك الربط مع البوت'
                : lang === 'ug'
                ? 'بوتتىن ئۈزۈش'
                : 'Unlink from Bot'}
            </span>
          </button>
        </div>
      )}

      {/* Footer Note (Matching Image Reference) */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          {lang === 'ar'
            ? 'يمكنك إعادة ربط الحساب مع البوت في أي وقت لاحق باتباع خطوات الربط أعلاه.'
            : lang === 'ug'
            ? 'يۇقىرىدىكى باسقۇچلار بويىچە، خالىغان ۋاقىتتا ھېساباتنى قايتا باغلىيالايسىز.'
            : 'You can re-link the account with the bot at any time following the steps above.'}
        </p>
      </div>
    </div>
  );
}
