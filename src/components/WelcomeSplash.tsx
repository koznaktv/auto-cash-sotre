'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

export default function WelcomeSplash({ onEnter }: { onEnter: () => void }) {
  const { t, isRTL } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  // Auto transition after 3.2 seconds or user can click to enter directly
  useEffect(() => {
    const timer = setTimeout(() => {
      handleExit();
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const handleExit = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      onEnter();
    }, 800);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-radial from-[#07182c] via-[#040e1d] to-[#01060e] text-center p-4 transition-all duration-1000 ease-in-out select-none ${
        fading
          ? 'opacity-0 scale-110 pointer-events-none filter blur-sm'
          : 'opacity-100 scale-100 backdrop-blur-3xl'
      }`}
    >
      {/* Background Animated Neon Rings */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-3xl animate-pulse" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-2xl animate-ping" style={{ animationDuration: '4s' }} />

      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
        {/* Custom Brand Logo */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-amber-400/80 p-0.5 shadow-2xl shadow-amber-500/50 mb-6 overflow-hidden bg-[#04101e] animate-bounce" style={{ animationDuration: '2.5s' }}>
          <img
            src="/logo.png"
            alt="AUTO CASH Logo"
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        {/* Welcome Kicker */}
        <span className="font-alkatip text-amber-300 text-sm sm:text-base font-bold tracking-widest mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{t('welcomeTitle')}</span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </span>

        {/* Brand Name */}
        <h1 className="font-ukij text-4xl sm:text-6xl font-black tracking-wider text-white mb-4 gold-text-glow">
          <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            AUTO CASH
          </span>
        </h1>

        {/* Subtitle */}
        <p className="font-alkatip text-slate-200 text-sm sm:text-base max-w-sm sm:max-w-md leading-relaxed mb-8 text-center px-4 font-normal">
          {t('welcomeSubtitle')}
        </p>

        {/* Enter Button */}
        <button
          onClick={handleExit}
          className="gold-shimmer-btn px-8 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl shadow-amber-500/30 hover:scale-105 transition-all font-alkatip cursor-pointer"
        >
          <span>{t('enterPlatform')}</span>
          {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
