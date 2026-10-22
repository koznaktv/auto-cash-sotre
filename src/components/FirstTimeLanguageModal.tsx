'use client';

import React, { useState, useEffect } from 'react';
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
  const { lang, setLang, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Language>(lang);

  useEffect(() => {
    try {
      // If user is in the native Android App, skip modal to maintain lightning-fast native UX
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
            setIsOpen(true);
          }, 200);
        };
        window.addEventListener('autocash-welcome-dismissed', onSplashDismiss, { once: true });

        // Fallback safety timer if splash doesn't fire event
        const fallbackTimer = setTimeout(() => {
          const checkAgain = localStorage.getItem('autocash_language_selected') === 'true';
          if (!checkAgain) {
            setIsOpen(true);
          }
        }, 2200);

        return () => {
          window.removeEventListener('autocash-welcome-dismissed', onSplashDismiss);
          clearTimeout(fallbackTimer);
        };
      } else {
        // If not on root or splash was already seen, open smoothly after a brief delay
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    } catch {
      // Silent error fallback
    }
  }, []);

  const handleSelectLanguage = (code: Language) => {
    setSelected(code);
    setLang(code);
  };

  const handleConfirm = () => {
    try {
      localStorage.setItem('autocash_language_selected', 'true');
    } catch {}
    setIsOpen(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('autocash_language_selected', 'true');
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-gradient-to-b from-[#081a2e] via-[#051322] to-[#020b16] border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden cursor-default"
        dir={selected === 'ug' || selected === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Ambient Glowing Background Halos */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button (Sets flag and closes permanently) */}
        <button
          onClick={handleDismiss}
          type="button"
          title="Close / ياپقۇچ"
          className="absolute top-4 ltr:right-4 rtl:left-4 z-10 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Center Header with Master 3D Logo */}
        <div className="text-center mb-5 relative z-10">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-xl shadow-amber-500/30 mx-auto mb-3 overflow-hidden">
            <img
              src="/brand_logo.png?v=2.1.0"
              alt="AUTO CASH"
              className="w-full h-full rounded-full object-cover"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
            <Globe2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Language • تىل تاللاڭ</span>
          </div>

          <h3 className="font-ukij text-xl sm:text-2xl font-black text-white gold-text-glow mb-1.5">
            خۇش كەپسىز • Welcome
          </h3>

          <p className="font-alkatip text-slate-300 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            سۇپىدىن پايدىلىنىشتىن بۇرۇن ئۆزىڭىزگە ئەڭ ماس كېلىدىغان تىلنى تاللاڭ:
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
                    ? 'bg-gradient-to-b from-amber-500/25 to-amber-500/10 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white'
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
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 animate-in zoom-in-50" />
                  )}
                </div>

                {/* Bottom Row: Language Name */}
                <div>
                  <div className="font-bold text-sm text-white tracking-wide">
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
            className="w-full py-3.5 rounded-2xl gold-shimmer-btn text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all font-alkatip cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>جەزملەش ۋە كىرىش • Confirm & Enter</span>
            {selected === 'ug' || selected === 'ar' ? (
              <ArrowLeft className="w-4 h-4 text-slate-950" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-950" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
