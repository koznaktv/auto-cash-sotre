'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { useLanguage } from '@/context/LanguageContext';
import { getCachedBalance, getCachedUser, ClientUser } from '@/lib/clientAuth';
import { APP_VERSION_CONFIG } from '@/lib/appVersion';
import {
  Download,
  Smartphone,
  Zap,
  Camera,
  MessageCircle,
  ShieldCheck,
  QrCode,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Send,
  HelpCircle,
} from 'lucide-react';

export default function AppDownloadPage() {
  const { t, isRTL } = useLanguage();
  const [balance, setBalance] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null);
  const [currentOrigin, setCurrentOrigin] = useState('https://auto-cash-sotre.vercel.app');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
      setBalance(getCachedBalance());
      setCurrentUser(getCachedUser());
    }
  }, []);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `${currentOrigin}/download`
  )}&bgcolor=081c33&color=ffc44d&margin=6`;

  return (
    <div
      className="min-h-screen bg-[#030914] text-white flex flex-col selection:bg-amber-500/30 selection:text-amber-300"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Navbar balance={balance} user={currentUser} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* Breadcrumb / Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition"
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{t('store')}</span>
          </Link>
        </div>

        {/* Hero Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#081c33] via-[#051324] to-[#030914] border border-amber-500/40 p-6 sm:p-10 shadow-2xl shadow-amber-500/10">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* App Icon Mockup */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-600 shadow-2xl shadow-amber-500/30 transform hover:scale-105 transition duration-300">
                <img
                  src="/logo.png"
                  alt="AUTO CASH App Icon"
                  className="w-full h-full rounded-[22px] object-cover bg-[#04101e]"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-lg border-2 border-[#081c33]">
                {t('downloadAppBadge')}
              </div>
            </div>

            {/* Title & Desc */}
            <div className="flex-1 text-center md:text-start space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Android v{APP_VERSION_CONFIG.version}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {t('androidAppTitle')}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                {t('androidAppDesc')}
              </p>

              {/* Specs tags */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs text-slate-400 font-mono">
                <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80">
                  {t('versionLabel')} {APP_VERSION_CONFIG.version}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80">
                  {t('sizeLabel')} ~4.5 MB
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold">
                  {t('osRequirement')} Android 7.0+
                </span>
              </div>

              {/* Download Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href="/download/autocash.apk"
                  download="autocash.apk"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/30 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-6 h-6" />
                  <span>{t('downloadApkBtn')}</span>
                </a>
              </div>
              <p className="text-xs text-slate-400 mt-2">{t('appInstalledHelp')}</p>
            </div>
          </div>
        </section>

        {/* QR Code Card for Desktop Visitors */}
        <section className="rounded-2xl bg-[#061426] border border-amber-500/20 p-6 flex flex-col sm:flex-row items-center gap-6 shadow-lg">
          <div className="p-2 rounded-2xl bg-[#081c33] border border-amber-500/40 shrink-0 shadow-inner">
            <img
              src={qrCodeUrl}
              alt="Scan QR Code to Download App"
              className="w-32 h-32 sm:w-28 sm:h-28 rounded-xl object-contain"
            />
          </div>
          <div className="text-center sm:text-start space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-2 text-amber-300 font-bold text-sm">
              <QrCode className="w-4 h-4" />
              <span>{t('scanQrToDownload')}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('scanQrHelp')}
            </p>
            <p className="text-[11px] text-slate-500 font-mono" dir="ltr">
              {currentOrigin}/download
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('appFeatures')}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#061426]/70 border border-slate-800 hover:border-amber-500/30 transition space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-100">{t('appFeature1Title')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t('appFeature1Desc')}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#061426]/70 border border-slate-800 hover:border-emerald-500/30 transition space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-100">{t('appFeature2Title')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t('appFeature2Desc')}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#061426]/70 border border-slate-800 hover:border-cyan-500/30 transition space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-100">{t('appFeature3Title')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t('appFeature3Desc')}</p>
            </div>
          </div>
        </section>

        {/* Installation Steps Guide */}
        <section className="rounded-3xl bg-[#061426] border border-slate-800 p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-black text-amber-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <span>{t('installStepsTitle')}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#040e1b] border border-slate-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-white">{t('installStep1Title')}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{t('installStep1Desc')}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#040e1b] border border-slate-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-white">{t('installStep2Title')}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{t('installStep2Desc')}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#040e1b] border border-slate-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-white">{t('installStep3Title')}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{t('installStep3Desc')}</p>
            </div>
          </div>
        </section>

        {/* Telegram & WhatsApp Support Box */}
        <section className="p-5 rounded-2xl bg-gradient-to-r from-[#081c33] to-[#04101e] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">{t('contactSupport')}</p>
              <p className="text-xs text-slate-400">{t('telegramSupport')}</p>
            </div>
          </div>
          <a
            href="https://t.me/autocash_UYGHUR"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            <span>{t('connect')}</span>
          </a>
        </section>
      </main>

      <div className="h-16 sm:h-0" />
      <BottomNav />
    </div>
  );
}
