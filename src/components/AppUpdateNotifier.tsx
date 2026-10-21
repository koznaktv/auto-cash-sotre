'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { APP_VERSION_CONFIG } from '@/lib/appVersion';
import { Download, Sparkles, X, Smartphone } from 'lucide-react';

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
  const [currentVersion, setCurrentVersion] = useState(APP_VERSION_CONFIG.version);
  const [releaseNote, setReleaseNote] = useState(
    APP_VERSION_CONFIG.releaseNotes[lang] || APP_VERSION_CONFIG.releaseNotes.ug
  );

  useEffect(() => {
    // 1. Fetch latest settings from server to get dynamically configured app version
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        const latestVer = d?.settings?.appVersion || APP_VERSION_CONFIG.version;
        setCurrentVersion(latestVer);

        const customNote = d?.settings?.appVersionConfig?.releaseNotes?.[lang];
        if (customNote) {
          setReleaseNote(customNote);
        } else {
          setReleaseNote(
            APP_VERSION_CONFIG.releaseNotes[lang] || APP_VERSION_CONFIG.releaseNotes.ug
          );
        }

        checkAndNotify(latestVer);
      })
      .catch(() => {
        checkAndNotify(APP_VERSION_CONFIG.version);
      });
  }, [lang]);

  const checkAndNotify = (latestVer: string) => {
    try {
      if (typeof window === 'undefined') return;

      // 1. Check if customer was ALREADY notified for this specific version
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

      // 2. If customer is running inside the native Android App:
      // Check if installed app is already on this version or newer
      if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent || '';
        const match = ua.match(/AutoCashApp\/([0-9.]+)/i);
        if (match && match[1]) {
          const installedVer = match[1];
          if (compareVersions(installedVer, latestVer) >= 0) {
            // Already installed with latest or higher version -> mark seen and do not notify
            localStorage.setItem('autocash_notified_version', latestVer);
            localStorage.setItem('autocash_seen_app_version', latestVer);
            return;
          }
        }
      }

      // 3. Customer has NOT been notified for this version yet!
      // Immediately mark as notified so subsequent reloads/page changes will NOT double notify!
      localStorage.setItem('autocash_notified_version', latestVer);
      localStorage.setItem('autocash_seen_app_version', latestVer);
      sessionStorage.setItem(`autocash_notified_${latestVer}`, 'true');

      // Gracefully present the royal update card after 1.8 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1800);

      return () => clearTimeout(timer);
    } catch {
      // Storage error fallback
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('autocash_notified_version', currentVersion);
      localStorage.setItem('autocash_seen_app_version', currentVersion);
    } catch {}
    setIsVisible(false);
  };

  const handleDownload = () => {
    try {
      localStorage.setItem('autocash_notified_version', currentVersion);
      localStorage.setItem('autocash_seen_app_version', currentVersion);
    } catch {}
    setIsVisible(false);

    // Trigger direct download of latest APK
    const link = document.createElement('a');
    link.href = '/download/autocash.apk';
    link.download = `autocash_v${currentVersion}.apk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
