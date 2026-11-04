'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { useLanguage, Language } from '@/context/LanguageContext';
import LanguageFlag from '@/components/LanguageFlag';
import { Globe2, CheckCircle2, ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  subLabel: string;
  dir: 'rtl' | 'ltr';
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'ug',
    name: 'Uyghur',
    nativeName: 'ئۇيغۇرچە',
    subLabel: 'Uyghurche',
    dir: 'rtl',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    subLabel: 'Arabic',
    dir: 'rtl',
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    subLabel: 'Turkish',
    dir: 'ltr',
  },
  {
    code: 'uz',
    name: 'Uzbek',
    nativeName: "O'zbekcha",
    subLabel: 'Uzbek',
    dir: 'ltr',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    subLabel: 'Global',
    dir: 'ltr',
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    subLabel: 'Russian',
    dir: 'ltr',
  },
];

export default function FirstTimeLanguageModal() {
  const pathname = usePathname();
  const { isMaxStore } = useStore();
  const isMaxBazar = isMaxStore || pathname?.startsWith('/maxbazar');
  const { lang, setLang, isRTL, isLanguageModalOpen, closeLanguageModal } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const [selected, setSelected] = useState<Language>(lang);

  useEffect(() => {
    setSelected(lang);
  }, [lang]);

  useEffect(() => {
    const handleManualOpen = () => setInternalOpen(true);
    const handleManualClose = () => setInternalOpen(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('autocash-open-language-modal', handleManualOpen);
      window.addEventListener('open-language-modal', handleManualOpen);
      window.addEventListener('autocash-close-language-modal', handleManualClose);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('autocash-open-language-modal', handleManualOpen);
        window.removeEventListener('open-language-modal', handleManualOpen);
        window.removeEventListener('autocash-close-language-modal', handleManualClose);
      }
    };
  }, []);

  useEffect(() => {
    try {
      // If user is in the native Android App, skip automatic first-time popup
      const isNativeApp = typeof navigator !== 'undefined' && /AutoCashApp/i.test(navigator.userAgent || '');
      if (isNativeApp) {
        localStorage.setItem('autocash_language_selected', 'true');
        return;
      }

      // 1. Strictly check if the user has already seen and chosen/dismissed the language modal
      const alreadyChosen = localStorage.getItem('autocash_language_selected') === 'true';
      if (alreadyChosen) {
        return;
      }

      // 2. Check if welcome splash is currently displaying on root page
      const splashShown =
        localStorage.getItem('autocash_welcome_shown') === 'true' ||
        sessionStorage.getItem('autocash_welcome_shown') === 'true';

      const isRoot = typeof window !== 'undefined' && window.location.pathname === '/';

      if (!splashShown && isRoot) {
        // Wait for welcome splash to finish, then show language prompt smoothly
        const onSplashDismiss = () => {
          setTimeout(() => {
            setInternalOpen(true);
          }, 200);
        };
        window.addEventListener('autocash-welcome-dismissed', onSplashDismiss, { once: true });

        // Fallback safety timer if splash doesn't fire event
        const fallbackTimer = setTimeout(() => {
          const checkAgain = localStorage.getItem('autocash_language_selected') === 'true';
          if (!checkAgain) {
            setInternalOpen(true);
          }
        }, 2200);

        return () => {
          window.removeEventListener('autocash-welcome-dismissed', onSplashDismiss);
          clearTimeout(fallbackTimer);
        };
      } else {
        // If not on root or splash was already seen, open smoothly after a brief delay
        const timer = setTimeout(() => {
          setInternalOpen(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    } catch {
      // Silent error fallback
    }
  }, []);

  // ESC key listener to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    const isOpen = internalOpen || isLanguageModalOpen;
    if (isOpen && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [internalOpen, isLanguageModalOpen]);

  const handleSelectLanguage = (code: Language) => {
    setSelected(code);
    try {
      setLang(code);
      localStorage.setItem('autocash_language_selected', 'true');
    } catch {}

    // Instant smooth feedback: show selection checkmark for 150ms then smoothly dismiss
    setTimeout(() => {
      setInternalOpen(false);
      closeLanguageModal();
    }, 150);
  };

  const handleConfirm = () => {
    try {
      localStorage.setItem('autocash_language_selected', 'true');
    } catch {}
    setInternalOpen(false);
    closeLanguageModal();
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('autocash_language_selected', 'true');
    } catch {}
    setInternalOpen(false);
    closeLanguageModal();
  };

  const isOpen = internalOpen || isLanguageModalOpen;
  if (!isOpen) return null;

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto my-auto rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9)] cursor-default border transition-all ${
          isMaxBazar
            ? 'bg-gradient-to-b from-[#0b132b] via-[#080d20] to-[#040714] border-blue-500/40 shadow-blue-900/30'
            : 'bg-gradient-to-b from-[#06182a] via-[#041220] to-[#020b16] border-emerald-500/40 shadow-emerald-900/30'
        }`}
        dir={selected === 'ug' || selected === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Ambient Glowing Background Halos */}
        <div
          className={`absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl pointer-events-none ${
            isMaxBazar ? 'bg-blue-600/20' : 'bg-emerald-500/15'
          }`}
        />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button (Sets flag and closes permanently) */}
        <button
          onClick={handleDismiss}
          type="button"
          title="Close / ياپقۇچ"
          className="absolute top-4 ltr:right-4 rtl:left-4 z-10 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Center Header with Master 3D Logo */}
        <div className="text-center mb-5 relative z-10">
          <div
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full p-[2px] shadow-xl mx-auto mb-3 overflow-hidden ${
              isMaxBazar
                ? 'bg-gradient-to-tr from-[#1e3a8a] via-[#3744D9] to-[#f59e0b] shadow-blue-600/30'
                : 'bg-gradient-to-tr from-[#047857] via-[#059669] to-[#f59e0b] shadow-emerald-500/30'
            }`}
          >
            <img
              src={isMaxBazar ? '/images/maxbazar/v3/maxbazar_gold_round.png' : '/brand_logo.png?v=2.1.0'}
              alt={isMaxBazar ? 'MAX-BAZAR' : 'AUTO CASH'}
              className="w-full h-full rounded-full object-cover"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 font-alkatip border ${
              isMaxBazar
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            <Globe2 className={`w-3.5 h-3.5 ${isMaxBazar ? 'text-blue-400' : 'text-emerald-400'}`} />
            <span>Select Language • تىل تاللاڭ</span>
          </div>

          <h3 className="font-alkatip text-xl sm:text-2xl font-black text-white mb-1.5">
            تىل ئالماشتۇرۇش • Change Language
          </h3>

          <p className="font-alkatip text-slate-300 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            ئۆزىڭىزگە ماس كېلىدىغان تىلنى تاللاڭ (بېسىش بىلەنلا دەرھال ئۆزگىرىدۇ):
          </p>
        </div>

        {/* 6 Language Options Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6 relative z-10">
          {LANGUAGES.map((item) => {
            const isSelected = selected === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelectLanguage(item.code)}
                className={`relative p-3 rounded-2xl border transition-all text-start flex flex-col justify-between gap-2 cursor-pointer active:scale-95 ${
                  isSelected
                    ? isMaxBazar
                      ? 'bg-gradient-to-b from-blue-600/30 via-[#3744D9]/20 to-blue-500/10 border-blue-400 text-blue-200 shadow-lg shadow-blue-600/25 ring-1 ring-blue-400/70'
                      : 'bg-gradient-to-b from-emerald-500/25 to-emerald-500/10 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/60'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {/* Top Row: Flag & Checkmark */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <LanguageFlag
                      code={item.code}
                      className="w-5 h-3.5 rounded-[3px] object-cover shadow-sm shrink-0"
                    />
                  </div>
                  {isSelected && (
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 animate-in zoom-in-50 ${
                        isMaxBazar ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    />
                  )}
                </div>

                {/* Bottom Row: Language Name */}
                <div>
                  <div className="font-bold text-sm text-white tracking-wide font-alkatip">
                    {item.nativeName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">
                    {item.subLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Confirm Action */}
        <div className="relative z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full py-3.5 rounded-2xl text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all font-alkatip cursor-pointer ${
              isMaxBazar
                ? 'bg-gradient-to-r from-[#222ca3] via-[#3744D9] to-[#4E5AE8] hover:from-[#3744D9] hover:to-[#5c68f5] shadow-blue-600/40'
                : 'bg-gradient-to-r from-[#047857] via-[#059669] to-[#10b981] hover:from-[#059669] hover:to-[#34d399] shadow-emerald-500/30'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>جەزملەش ۋە ساقلاش • Confirm & Save</span>
            {selected === 'ug' || selected === 'ar' ? (
              <ArrowLeft className="w-4 h-4 text-white" />
            ) : (
              <ArrowRight className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
