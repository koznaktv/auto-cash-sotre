'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { APP_VERSION_CONFIG } from '@/lib/appVersion';
import { Download, Sparkles, X, Smartphone, ShieldAlert, AlertTriangle, ExternalLink, Send } from 'lucide-react';

function compareVersions(v1: string, v2: string): number {
  const p1 = v1.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = v2.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export default function AppUpdateNotifier() {
  const { lang, t, isRTL } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isForceLocked, setIsForceLocked] = useState(false);
  const [installedVersion, setInstalledVersion] = useState('');
  const [currentVersion, setCurrentVersion] = useState(APP_VERSION_CONFIG.version);
  const [minRequiredVersion, setMinRequiredVersion] = useState(APP_VERSION_CONFIG.minRequiredVersion);
  const [releaseNote, setReleaseNote] = useState(
    APP_VERSION_CONFIG.releaseNotes[lang] || APP_VERSION_CONFIG.releaseNotes.ug
  );

  useEffect(() => {
    // 1. Fetch latest system settings to get active version and requirements
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        const latestVer = d?.settings?.appVersion || APP_VERSION_CONFIG.version;
        const minReq = d?.settings?.minRequiredVersion || APP_VERSION_CONFIG.minRequiredVersion || latestVer;
        const forceUpdate = d?.settings?.forceUpdate !== undefined ? Boolean(d?.settings?.forceUpdate) : APP_VERSION_CONFIG.forceUpdate;
        
        setCurrentVersion(latestVer);
        setMinRequiredVersion(minReq);

        const customNote = d?.settings?.appVersionConfig?.releaseNotes?.[lang];
        if (customNote) {
          setReleaseNote(customNote);
        } else {
          setReleaseNote(
            APP_VERSION_CONFIG.releaseNotes[lang] || APP_VERSION_CONFIG.releaseNotes.ug
          );
        }

        evaluateVersionStatus(latestVer, minReq, forceUpdate);
      })
      .catch(() => {
        evaluateVersionStatus(
          APP_VERSION_CONFIG.version,
          APP_VERSION_CONFIG.minRequiredVersion,
          APP_VERSION_CONFIG.forceUpdate
        );
      });
  }, [lang]);

  // Lock scroll when Force Update is active
  useEffect(() => {
    if (isForceLocked) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isForceLocked]);

  const evaluateVersionStatus = (latestVer: string, minReq: string, forceUpdate: boolean) => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const match = ua.match(/AutoCashApp\/([0-9.]+)/i);

    // ==============================================================
    // CASE A: User is inside the native Android App
    // ==============================================================
    if (match && match[1]) {
      const installed = match[1];
      setInstalledVersion(installed);

      // Check if installed version is lower than minimum required version
      const isOutdated = compareVersions(installed, minReq) < 0;

      if (isOutdated && forceUpdate) {
        // MANDATORY FORCE UPDATE: The old app version is completely disabled!
        setIsForceLocked(true);
        setIsVisible(false);
        return;
      }

      if (compareVersions(installed, latestVer) >= 0) {
        // Up to date! Nothing to show or warn
        setIsForceLocked(false);
        setIsVisible(false);
        return;
      }
    }

    // Ancient Android WebView without custom UA header
    const isOldAndroidWrapper = ua.includes('; wv') && ua.includes('Android') && !ua.includes('AutoCashApp');
    if (isOldAndroidWrapper && forceUpdate) {
      setInstalledVersion('1.0.0');
      setIsForceLocked(true);
      setIsVisible(false);
      return;
    }

    // ==============================================================
    // CASE B: Regular Web Visitors (Mobile / Desktop Browsers)
    // ==============================================================
    // Check if customer was ALREADY notified for this specific version
    const notifiedVer =
      localStorage.getItem('autocash_notified_version') ||
      localStorage.getItem('autocash_seen_app_version');

    if (notifiedVer === latestVer) {
      // Strictly ONCE: customer already received this version's notification -> Do not show again!
      return;
    }

    const sessionFlag = sessionStorage.getItem(`autocash_notified_${latestVer}`);
    if (sessionFlag === 'true') {
      return;
    }

    // Customer has NOT been notified for this version yet!
    // Immediately lock storage so subsequent reloads/page changes will NOT double notify!
    try {
      localStorage.setItem('autocash_notified_version', latestVer);
      localStorage.setItem('autocash_seen_app_version', latestVer);
      sessionStorage.setItem(`autocash_notified_${latestVer}`, 'true');
    } catch {}

    // Gracefully present the royal update card after 1.8 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1800);

    return () => clearTimeout(timer);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('autocash_notified_version', currentVersion);
      localStorage.setItem('autocash_seen_app_version', currentVersion);
    } catch {}
    setIsVisible(false);
  };

  const [downloadStarted, setDownloadStarted] = useState(false);

  const getDirectDownloadUrl = () => {
    const host = typeof window !== 'undefined' ? window.location.host : 'auto-cash-sotre.vercel.app';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    // ?ref=t.me triggers Android Intent.ACTION_VIEW in older APKs (v1.0.0, v1.1.0)
    return `${protocol}//${host}/download/autocash.apk?ref=t.me&v=${currentVersion}`;
  };

  const getWebDownloadPageUrl = () => {
    const host = typeof window !== 'undefined' ? window.location.host : 'auto-cash-sotre.vercel.app';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    return `${protocol}//${host}/download?ref=t.me`;
  };

  const handleForceDownload = (e?: React.MouseEvent) => {
    if (e) {
      try {
        e.preventDefault();
      } catch {}
    }
    setDownloadStarted(true);

    const targetUrl = getDirectDownloadUrl();

    // 1. Direct navigation which WebView intercepts via shouldOverrideUrlLoading
    window.location.href = targetUrl;

    // 2. Also open window in new target
    try {
      window.open(targetUrl, '_blank');
    } catch {}

    // 3. Fallback timer if still on page
    setTimeout(() => {
      try {
        const a = document.createElement('a');
        a.href = targetUrl;
        a.download = `autocash_v${currentVersion}.apk`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {}
    }, 500);
  };

  const handleDownload = () => {
    try {
      localStorage.setItem('autocash_notified_version', currentVersion);
      localStorage.setItem('autocash_seen_app_version', currentVersion);
    } catch {}
    setIsVisible(false);

    // Trigger direct download of latest APK
    const targetUrl = getDirectDownloadUrl();
    window.location.href = targetUrl;
  };

  // ==============================================================
  // 1. FULL-SCREEN UN-DISMISSIBLE FORCE UPDATE SCREEN
  // ==============================================================
  if (isForceLocked) {
    const forceMsgs = APP_VERSION_CONFIG.forceUpdateMessages[lang] || APP_VERSION_CONFIG.forceUpdateMessages.ug;
    const directUrl = getDirectDownloadUrl();

    return (
      <div
        className="fixed inset-0 z-[999999] bg-[#030a16] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Ambient Warning Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-md my-auto rounded-3xl bg-gradient-to-b from-[#0b172a] via-[#071120] to-[#040914] border-2 border-rose-500/60 p-6 sm:p-8 shadow-2xl shadow-rose-950/60 text-white text-center font-alkatip">
          {/* Animated Warning Shield */}
          <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-rose-500/20 animate-ping opacity-75" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-xl shadow-rose-600/40">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold mb-3 font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>نەشر ۋاقتى ئۆتتى · ئىشلىتىش توختىتىلدى</span>
          </div>

          {/* Title */}
          <h2 className="font-ukij text-lg sm:text-xl font-black text-white mb-3">
            {forceMsgs.title}
          </h2>

          {/* Version Comparison Pills */}
          <div className="flex items-center justify-center gap-2 mb-4 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              ھازىرقى: <strong className="text-rose-400">v{installedVersion || '1.0.0'}</strong>
            </span>
            <span className="text-slate-500">➔</span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-bold">
              يېڭىسى: <strong>v{currentVersion}</strong>
            </span>
          </div>

          {/* Message */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            {forceMsgs.message}
          </p>

          {/* Big Action Button (Direct APK Download via Android Intent trigger) */}
          <a
            href={directUrl}
            onClick={handleForceDownload}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-2xl shadow-amber-500/30 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className={`w-5 h-5 stroke-[2.5] ${downloadStarted ? 'animate-bounce' : ''}`} />
            <span>
              {downloadStarted
                ? (isRTL ? 'چۈشۈرۈش قوزغالدى... قايتا بېسىش' : 'Download Started... Click to retry')
                : (forceMsgs?.button || (isRTL ? 'يېڭى نەشرىنى توربەتتىن چۈشۈرۈڭ' : 'Download New Version from Website'))}
            </span>
          </a>

          {/* Alternative Links */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            <a
              href={getWebDownloadPageUrl()}
              className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition underline underline-offset-4 font-semibold cursor-pointer"
            >
              <span>توربەتتىكى چۈشۈرۈش بېتى</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <span className="text-slate-600">·</span>

            <a
              href="https://t.me/autocash_UYGHUR?ref=t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition underline underline-offset-4 font-semibold cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>تېلېگرام ئارقىلىق ئېلىش</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 2. NORMAL ONE-TIME NOTIFICATION CARD FOR WEBSITE VISITORS
  // ==============================================================
  if (!isVisible) return null;

  const titleMap: Record<string, string> = {
    ug: `AUTO CASH ئەپىنىڭ يېڭى نۇسخىسى (v${currentVersion}) چىقتى!`,
    en: `New AUTO CASH App Update (v${currentVersion}) Available!`,
    ar: `تحديث جديد لتطبيق AUTO CASH (v${currentVersion}) متوفر الآن!`,
    tr: `Yeni AUTO CASH Uygulama Güncellemesi (v${currentVersion}) Yayında!`,
    uz: `AUTO CASH ilovasining yangi (v${currentVersion}) talqini chiqdi!`,
    ru: `Доступно новое обновление AUTO CASH (v${currentVersion})!`,
  };

  const updateBtnMap: Record<string, string> = {
    ug: `ھازىرلا يېڭىلاش (APK چۈشۈرۈش)`,
    en: `Update Now (Download APK)`,
    ar: `تحديث الآن (تحميل APK)`,
    tr: `Şimdi Güncelle (APK İndir)`,
    uz: `Hozir yangilash (APK yuklash)`,
    ru: `Обновить сейчас (Скачать APK)`,
  };

  const dismissBtnMap: Record<string, string> = {
    ug: 'كېيىن كۆرەي',
    en: 'Later',
    ar: 'لاحقاً',
    tr: 'Daha Sonra',
    uz: 'Keyinroq',
    ru: 'Позже',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={handleDismiss} />

      {/* Royal Update Card */}
      <div
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#092244] via-[#06182f] to-[#041021] border border-amber-400/60 p-5 sm:p-6 shadow-2xl shadow-amber-500/20 text-white overflow-hidden animate-vip-card-glow"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Ambient Corner Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 animate-vip-float">
              <Smartphone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-mono inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>v{currentVersion}</span>
              </span>
              <h3 className="font-ukij font-black text-sm sm:text-base text-white mt-0.5">
                {titleMap[lang] || titleMap.ug}
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/80 cursor-pointer shrink-0"
            title={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="py-4 space-y-3 relative z-10 text-xs sm:text-sm text-slate-200 font-alkatip leading-relaxed">
          <p className="bg-[#051426]/80 p-3.5 rounded-2xl border border-slate-800/90 text-slate-300">
            {releaseNote}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-amber-300/90 font-mono">
            <Sparkles className="w-4 h-4 text-amber-400 animate-star-twinkle shrink-0" />
            <span>Android 7.0+ · ~5.7 MB · Official APK</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 relative z-10">
          <button
            onClick={handleDownload}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-alkatip"
          >
            <Download className="w-4 h-4" />
            <span>{updateBtnMap[lang] || updateBtnMap.ug}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition border border-slate-700/80 cursor-pointer font-alkatip"
          >
            <span>{dismissBtnMap[lang] || dismissBtnMap.ug}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
