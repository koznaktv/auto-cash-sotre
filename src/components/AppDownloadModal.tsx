'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  Download,
  Smartphone,
  Zap,
  Camera,
  MessageCircle,
  ShieldCheck,
  QrCode,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Send,
} from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const { t, isRTL } = useLanguage();
  const [showSteps, setShowSteps] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('/download/autocash.apk');
  const [currentOrigin, setCurrentOrigin] = useState('https://auto-cash-sotre.vercel.app');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = origOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `${currentOrigin}/download`
  )}&bgcolor=081c33&color=ffc44d&margin=4`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#081c33] via-[#051425] to-[#040e1b] border border-amber-500/40 shadow-2xl shadow-amber-500/10 p-5 sm:p-6 text-white overflow-hidden max-h-[90vh] flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Decorative corner glows */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                {t('androidAppTitle')}
              </h3>
              <span className="text-[11px] text-amber-300/80 font-medium">
                {t('downloadAppBadge')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
            title={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 py-3 custom-scrollbar flex-1 pr-1">
          {/* App Card Info */}
          <div className="p-4 rounded-2xl bg-[#04101e]/80 border border-slate-800/90 flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-600 shadow-lg shadow-amber-500/30">
                <img
                  src="/logo.png"
                  alt="AUTO CASH Logo"
                  className="w-full h-full rounded-[14px] object-cover bg-[#04101e]"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-base text-amber-300">AUTO CASH Store</h4>
              <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                {t('androidAppSubtitle')}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700">
                  {t('versionLabel')} 1.1.0
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700">
                  {t('sizeLabel')} ~4.5 MB
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-emerald-400">
                  Android 7.0+
                </span>
              </div>
            </div>
          </div>

          {/* Primary Download Buttons */}
          <div className="space-y-2">
            <a
              href={downloadUrl}
              download="autocash.apk"
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>{t('downloadApkBtn')}</span>
            </a>
            <p className="text-[11px] text-center text-slate-400 pt-1">
              {t('appInstalledHelp')}
            </p>
          </div>

          {/* QR Code (Helpful for users on desktop/laptop) */}
          <div className="p-3.5 rounded-2xl bg-[#04101e]/60 border border-slate-800/80 flex flex-col sm:flex-row items-center gap-3.5">
            <div className="p-1.5 rounded-xl bg-[#081c33] border border-amber-500/30 shrink-0 shadow-inner">
              <img
                src={qrCodeUrl}
                alt="Scan to Download App"
                className="w-24 h-24 sm:w-20 sm:h-20 rounded-lg object-contain"
              />
            </div>
            <div className="text-center sm:text-start flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-300 font-bold text-xs">
                <QrCode className="w-4 h-4" />
                <span>{t('scanQrToDownload')}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {t('scanQrHelp')}
              </p>
            </div>
          </div>

          {/* App Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200 text-[11px]">{t('appFeature1Title')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{t('appFeature1Desc')}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-2.5">
              <Camera className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200 text-[11px]">{t('appFeature2Title')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{t('appFeature2Desc')}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-2.5">
              <MessageCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200 text-[11px]">{t('appFeature3Title')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{t('appFeature3Desc')}</p>
              </div>
            </div>
          </div>

          {/* Collapsible Installation Steps */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowSteps(!showSteps)}
              className="w-full p-3 flex items-center justify-between text-slate-300 hover:text-white transition cursor-pointer"
            >
              <span className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                {t('installStepsTitle')}
              </span>
              {showSteps ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showSteps && (
              <div className="p-3 pt-0 border-t border-slate-800/60 space-y-2.5 text-[11px] text-slate-300">
                <div className="p-2 rounded-lg bg-[#04101e]/60">
                  <p className="font-bold text-amber-300">{t('installStep1Title')}</p>
                  <p className="text-slate-400 mt-0.5">{t('installStep1Desc')}</p>
                </div>
                <div className="p-2 rounded-lg bg-[#04101e]/60">
                  <p className="font-bold text-amber-300">{t('installStep2Title')}</p>
                  <p className="text-slate-400 mt-0.5">{t('installStep2Desc')}</p>
                </div>
                <div className="p-2 rounded-lg bg-[#04101e]/60">
                  <p className="font-bold text-emerald-400">{t('installStep3Title')}</p>
                  <p className="text-slate-400 mt-0.5">{t('installStep3Desc')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>AUTO CASH © 2026</span>
          <button
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
