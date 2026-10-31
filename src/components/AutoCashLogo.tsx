'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Sparkles } from 'lucide-react';

interface AutoCashLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  enableIntroReveal?: boolean;
}

export default function AutoCashLogo({
  size = 'md',
  showText = true,
  className = '',
  enableIntroReveal = true,
}: AutoCashLogoProps) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [particles, setParticles] = useState(false);

  // Trigger cinematic logo intro/reveal on mount
  useEffect(() => {
    if (enableIntroReveal) {
      setIsRevealing(true);
      setParticles(true);
      const timer = setTimeout(() => {
        setIsRevealing(false);
        setParticles(false);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [enableIntroReveal]);

  // Interactive Logo Reveal replay on click/hover
  const handleLogoClick = () => {
    setIsRevealing(true);
    setParticles(true);
    setTimeout(() => {
      setIsRevealing(false);
      setParticles(false);
    }, 1200);
  };

  // Dimensions based on size
  const iconDimensions = {
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
  };

  const titleSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
  };

  const subSizes = {
    sm: 'text-[10px] sm:text-[11px]',
    md: 'text-[11px] sm:text-[12px]',
    lg: 'text-xs sm:text-sm',
  };

  return (
    <div
      onClick={handleLogoClick}
      className={`relative inline-flex items-center gap-2.5 sm:gap-3 select-none group cursor-pointer ${className}`}
    >
      {/* =========================================================================
          MOTION GRAPHIC TEXT & SUBTITLE
      ========================================================================= */}
      {showText && (
        <div className="flex flex-col text-right justify-center overflow-visible py-0.5 font-alkatip">
          {/* Main Title: AUTO CASH (Motion Graphic Liquid Gold Sweep) */}
          <div className="relative inline-block leading-tight">
            <span
              className={`font-black tracking-wider font-sans uppercase ${titleSizes[size]} animated-brand-title drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105`}
            >
              AUTO CASH
            </span>

            {/* Light beam flash during Reveal */}
            {isRevealing && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/60 to-transparent animate-shimmer pointer-events-none rounded" />
            )}
          </div>

          {/* Subtitle: ئاپتوماتىك پۇل قاچىلاش (Emerald Shimmer + Glint) */}
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span
              className={`font-bold tracking-normal ${subSizes[size]} animated-brand-sub`}
            >
              ئاپتوماتىك پۇل قاچىلاش
            </span>
            <span className="text-[10px] text-amber-400 animate-star-glint inline-block">
              ✦
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          3D ANIMATED ROTATING MEDALLION COIN (Motion Graphic Logo)
      ========================================================================= */}
      <div className="relative shrink-0">
        
        {/* Cinematic Outer Particle Sparkle Burst on Reveal */}
        {particles && (
          <div className="absolute -inset-3 pointer-events-none z-20 flex items-center justify-center animate-ping duration-1000">
            <Sparkles className="w-8 h-8 text-amber-400/80 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
          </div>
        )}

        {/* Ambient Pulsing Aura Glow */}
        <div
          className={`absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-500/40 via-emerald-400/40 to-cyan-500/40 blur-md transition-all duration-500 ${
            isRevealing ? 'scale-125 opacity-100' : 'opacity-70 animate-logo-aura'
          }`}
        />

        {/* 3D Beveled Coin Medallion Shell */}
        <div
          className={`relative ${iconDimensions[size]} rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 border border-amber-300/80 shadow-[0_4px_20px_rgba(245,158,11,0.45),0_0_15px_rgba(16,185,129,0.3)] transition-transform duration-500 overflow-hidden ${
            isRevealing ? 'scale-110 rotate-6 ring-4 ring-amber-400/60' : 'group-hover:scale-105'
          }`}
        >
          {/* Animated 3D Coin WebM Video with GIF & PNG Fallback */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full rounded-full object-cover bg-[#07152b] pointer-events-none"
            poster="/logo.png"
          >
            <source src="/brand_coin_360.webm" type="video/webm" />
            <img
              src="/brand_coin_360.gif"
              alt="AUTO CASH 3D Animated Logo"
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </video>

          {/* Lens Flare Sweep (on Reveal) */}
          <div
            className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent transition-opacity duration-700 pointer-events-none ${
              isRevealing ? 'opacity-100 animate-pulse' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
