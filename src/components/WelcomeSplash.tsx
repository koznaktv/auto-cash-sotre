'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, ArrowLeft, ArrowRight, Zap, ShieldCheck, Diamond } from 'lucide-react';

export default function WelcomeSplash({ onEnter }: { onEnter: () => void }) {
  const { t, isRTL } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [fading, setFading] = useState(false);

  // Auto transition after 4.2 seconds if user doesn't click
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerLaunch();
    }, 4200);
    return () => clearTimeout(timer);
  }, []);

  const triggerLaunch = () => {
    if (launching) return;
    setLaunching(true);

    // Smooth transition sequence
    setTimeout(() => {
      setFading(true);
    }, 450);

    setTimeout(() => {
      setVisible(false);
      onEnter();
    }, 950);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#01050c] text-center p-4 transition-all duration-700 ease-in-out select-none overflow-hidden ${
        fading
          ? 'opacity-0 scale-105 pointer-events-none filter blur-sm'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Atmospheric Deep Cosmic Glow */}
      <div className="absolute inset-0 bg-radial from-[#07182c]/90 via-[#030c18] to-[#01050c] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

      {/* 2. Sleek Vertical Speed Streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-75">
        <div
          className="absolute w-[2px] h-32 bg-gradient-to-b from-transparent via-white/80 to-transparent left-[8%]"
          style={{ animation: 'verticalSpeedLine 1.1s linear infinite', animationDelay: '0.1s' }}
        />
        <div
          className="absolute w-[2px] h-44 bg-gradient-to-b from-transparent via-amber-400/90 to-transparent left-[18%]"
          style={{ animation: 'verticalSpeedLine 0.9s linear infinite', animationDelay: '0.4s' }}
        />
        <div
          className="absolute w-[1.5px] h-28 bg-gradient-to-b from-transparent via-white/70 to-transparent left-[28%]"
          style={{ animation: 'verticalSpeedLine 1.3s linear infinite', animationDelay: '0.7s' }}
        />
        <div
          className="absolute w-[2px] h-40 bg-gradient-to-b from-transparent via-yellow-300/80 to-transparent left-[38%]"
          style={{ animation: 'verticalSpeedLine 1s linear infinite', animationDelay: '0.2s' }}
        />
        <div
          className="absolute w-[2px] h-36 bg-gradient-to-b from-transparent via-white/80 to-transparent right-[38%]"
          style={{ animation: 'verticalSpeedLine 1.2s linear infinite', animationDelay: '0.5s' }}
        />
        <div
          className="absolute w-[2.5px] h-48 bg-gradient-to-b from-transparent via-amber-400/90 to-transparent right-[28%]"
          style={{ animation: 'verticalSpeedLine 0.85s linear infinite', animationDelay: '0.15s' }}
        />
        <div
          className="absolute w-[1.5px] h-32 bg-gradient-to-b from-transparent via-white/70 to-transparent right-[16%]"
          style={{ animation: 'verticalSpeedLine 1.15s linear infinite', animationDelay: '0.6s' }}
        />
        <div
          className="absolute w-[2px] h-40 bg-gradient-to-b from-transparent via-yellow-200/80 to-transparent right-[7%]"
          style={{ animation: 'verticalSpeedLine 1.05s linear infinite', animationDelay: '0.35s' }}
        />
      </div>

      {/* 3. Main Center Content Container */}
      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
        {/* Crisp High-Definition AUTO CASH Master Emblem */}
        <div className={`relative mb-6 transition-transform duration-500 ${launching ? 'scale-110' : 'hover:scale-105'}`}>
          {/* Subtle Ambient Golden Energy Halo */}
          <div className="absolute -inset-5 rounded-full bg-gradient-to-tr from-amber-500/25 via-yellow-400/25 to-transparent blur-xl pointer-events-none animate-pulse" />

          {/* Golden Rotating Shimmer Ring */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-[0_0_35px_rgba(245,158,11,0.55)]">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#030c18] flex items-center justify-center shadow-inner">
              <img
                src="/logo.png"
                alt="AUTO CASH Official Logo"
                className="w-full h-full object-cover select-none transform transition-transform"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
                loading="eager"
              />
            </div>
          </div>
        </div>

        {/* Welcome Kicker */}
        <span className="font-alkatip text-amber-300 text-sm sm:text-base font-bold tracking-normal mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-star-twinkle" />
          <span>{t('welcomeTitle')}</span>
          <Sparkles className="w-4 h-4 text-amber-400 animate-star-twinkle" />
        </span>

        {/* Brand Name with Golden Shimmer */}
        <h1 className="font-ukij text-4xl sm:text-6xl font-black tracking-wider text-white mb-3">
          <span className="autocash-shimmer">
            AUTO CASH
          </span>
        </h1>

        {/* Subtitle */}
        <p className="font-alkatip text-slate-200 text-sm sm:text-base max-w-sm sm:max-w-md leading-relaxed mb-6 text-center px-4 font-normal">
          {t('welcomeSubtitle')}
        </p>

        {/* Feature Highlights Pills */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 flex-wrap px-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-alkatip">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>تېز سۈرئەتتە يېتىپ كېلىش</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-alkatip">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>بىخەتەر كاپالەت</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-alkatip">
            <Diamond className="w-3.5 h-3.5 text-cyan-400" />
            <span>ئەڭ ئەرزان باھا</span>
          </div>
        </div>

        {/* Enter Platform Button with Rotating Beam */}
        <button
          onClick={triggerLaunch}
          disabled={launching}
          className="relative group overflow-hidden gold-shimmer-btn px-8 sm:px-11 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-black flex items-center gap-2.5 shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all font-alkatip cursor-pointer"
        >
          {/* Rotating Beam on Button */}
          <div className="border-beam-pill" />
          <Sparkles className="w-4 h-4 text-slate-950 animate-star-twinkle" />
          <span>{t('enterPlatform')}</span>
          {isRTL ? <ArrowLeft className="w-4 h-4 text-slate-950" /> : <ArrowRight className="w-4 h-4 text-slate-950" />}
        </button>
      </div>
    </div>
  );
}
