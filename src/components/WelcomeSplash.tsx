'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, ArrowLeft, ArrowRight, Rocket } from 'lucide-react';

export default function WelcomeSplash({ onEnter }: { onEnter: () => void }) {
  const { t, isRTL } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [fading, setFading] = useState(false);

  // Auto transition after 4 seconds if user doesn't click
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerLaunch();
    }, 4200);
    return () => clearTimeout(timer);
  }, []);

  const triggerLaunch = () => {
    if (launching) return;
    setLaunching(true);

    // Blast off sequence
    setTimeout(() => {
      setFading(true);
    }, 550);

    setTimeout(() => {
      setVisible(false);
      onEnter();
    }, 1100);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#01050c] text-center p-4 transition-all duration-700 ease-in-out select-none overflow-hidden ${
        fading
          ? 'opacity-0 scale-105 pointer-events-none filter blur-md'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Deep Space Atmospheric Nebula Glow */}
      <div className="absolute inset-0 bg-radial from-[#07182c]/80 via-[#030c18] to-[#01050c] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-cyan-500/10 blur-[90px] pointer-events-none" />

      {/* 2. After Effects Vertical Laser Speed Lines (Streaming Downwards) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Speed streak 1 */}
        <div
          className="absolute w-[2px] h-32 bg-gradient-to-b from-transparent via-white/80 to-transparent left-[8%]"
          style={{ animation: 'verticalSpeedLine 1.1s linear infinite', animationDelay: '0.1s' }}
        />
        {/* Speed streak 2 (Golden) */}
        <div
          className="absolute w-[2px] h-44 bg-gradient-to-b from-transparent via-amber-400/90 to-transparent left-[18%]"
          style={{ animation: 'verticalSpeedLine 0.9s linear infinite', animationDelay: '0.4s' }}
        />
        {/* Speed streak 3 */}
        <div
          className="absolute w-[1.5px] h-28 bg-gradient-to-b from-transparent via-white/70 to-transparent left-[28%]"
          style={{ animation: 'verticalSpeedLine 1.3s linear infinite', animationDelay: '0.7s' }}
        />
        {/* Speed streak 4 (Center left) */}
        <div
          className="absolute w-[2px] h-40 bg-gradient-to-b from-transparent via-yellow-300/80 to-transparent left-[38%]"
          style={{ animation: 'verticalSpeedLine 1s linear infinite', animationDelay: '0.2s' }}
        />
        {/* Speed streak 5 (Center right) */}
        <div
          className="absolute w-[2px] h-36 bg-gradient-to-b from-transparent via-white/80 to-transparent right-[38%]"
          style={{ animation: 'verticalSpeedLine 1.2s linear infinite', animationDelay: '0.5s' }}
        />
        {/* Speed streak 6 (Golden) */}
        <div
          className="absolute w-[2.5px] h-48 bg-gradient-to-b from-transparent via-amber-400/90 to-transparent right-[28%]"
          style={{ animation: 'verticalSpeedLine 0.85s linear infinite', animationDelay: '0.15s' }}
        />
        {/* Speed streak 7 */}
        <div
          className="absolute w-[1.5px] h-32 bg-gradient-to-b from-transparent via-white/70 to-transparent right-[16%]"
          style={{ animation: 'verticalSpeedLine 1.15s linear infinite', animationDelay: '0.6s' }}
        />
        {/* Speed streak 8 */}
        <div
          className="absolute w-[2px] h-40 bg-gradient-to-b from-transparent via-yellow-200/80 to-transparent right-[7%]"
          style={{ animation: 'verticalSpeedLine 1.05s linear infinite', animationDelay: '0.35s' }}
        />
      </div>

      {/* 3. Energy Blast Shockwave on Launch */}
      {launching && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-amber-400 animate-shockwave pointer-events-none" />
      )}

      {/* 4. Main Foreground Content Container */}
      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
        {/* Animated Rocket Launch Centerpiece (Matches After Effects Video) */}
        <div className={`relative mb-6 ${launching ? 'animate-rocket-launch' : 'animate-rocket-hover'}`}>
          {/* Subtle Ambient Golden Energy Ring behind Rocket */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-400/20 to-transparent blur-xl pointer-events-none" />

          {/* Precision SVG Rocket matching the video composition */}
          <svg
            className="w-24 h-36 sm:w-28 sm:h-44 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]"
            viewBox="0 0 100 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Rocket Exhaust Propulsion Flame (Dynamic Pulsing) */}
            <g className="animate-flame-pulse origin-[50px_106px]">
              {/* Outer Golden Orange Flame */}
              <path
                d="M36 108 C36 108 40 148 50 158 C60 148 64 108 64 108 Z"
                fill="url(#outerFlameGrad)"
              />
              {/* Inner Bright Yellow Core Flame */}
              <path
                d="M42 108 C42 108 45 138 50 146 C55 138 58 108 58 108 Z"
                fill="url(#innerFlameGrad)"
              />
              {/* Hot White Core Spark */}
              <ellipse cx="50" cy="118" rx="3.5" ry="8" fill="#ffffff" />
            </g>

            {/* Aerodynamic Rocket Left Fin */}
            <path
              d="M32 82 C22 84 14 96 12 108 C20 108 30 104 34 98"
              stroke="#ffffff"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#08182b"
            />

            {/* Aerodynamic Rocket Right Fin */}
            <path
              d="M68 82 C78 84 86 96 88 108 C80 108 70 104 66 98"
              stroke="#ffffff"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#08182b"
            />

            {/* Rocket Fuselage / Main Aerodynamic Body */}
            <path
              d="M50 12 C34 32 30 76 30 106 C42 110 58 110 70 106 C70 76 66 32 50 12 Z"
              stroke="#ffffff"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#051322"
            />

            {/* Rocket Central Golden Porthole (Matches Video's Gold Core) */}
            <circle
              cx="50"
              cy="58"
              r="10.5"
              fill="url(#portholeGrad)"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            {/* Inner Porthole Gloss Sparkle */}
            <circle cx="47.5" cy="55.5" r="2.5" fill="#ffffff" opacity="0.9" />

            {/* Bottom Engine Exhaust Nozzle Bracket */}
            <path
              d="M38 106 L40 114 L60 114 L62 106"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="outerFlameGrad" x1="50" y1="108" x2="50" y2="158" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="45%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="innerFlameGrad" x1="50" y1="108" x2="50" y2="146" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <radialGradient id="portholeGrad" cx="50" cy="58" r="10.5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Welcome Kicker (Unchanged) */}
        <span className="font-alkatip text-amber-300 text-sm sm:text-base font-bold tracking-widest mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-star-twinkle" />
          <span>{t('welcomeTitle')}</span>
          <Sparkles className="w-4 h-4 text-amber-400 animate-star-twinkle" />
        </span>

        {/* Brand Name with Golden Shimmer (Unchanged) */}
        <h1 className="font-ukij text-4xl sm:text-6xl font-black tracking-wider text-white mb-3 gold-text-glow">
          <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            AUTO CASH
          </span>
        </h1>

        {/* Subtitle (Unchanged) */}
        <p className="font-alkatip text-slate-300 text-sm sm:text-base max-w-sm sm:max-w-md leading-relaxed mb-8 text-center px-4 font-normal">
          {t('welcomeSubtitle')}
        </p>

        {/* Enter Platform Button with Rotating Beam (Unchanged text) */}
        <button
          onClick={triggerLaunch}
          disabled={launching}
          className="relative group overflow-hidden gold-shimmer-btn px-8 sm:px-10 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-black flex items-center gap-2.5 shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all font-alkatip cursor-pointer"
        >
          {/* Rotating Beam on Button */}
          <div className="border-beam-pill" />
          <Rocket className="w-4 h-4 text-slate-950 animate-bounce" style={{ animationDuration: '2s' }} />
          <span>{t('enterPlatform')}</span>
          {isRTL ? <ArrowLeft className="w-4 h-4 text-slate-950" /> : <ArrowRight className="w-4 h-4 text-slate-950" />}
        </button>
      </div>
    </div>
  );
}
