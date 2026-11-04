'use client';

import React from 'react';
import Image from 'next/image';

interface MaxBazarCardArtworkProps {
  image: string;
  name: string;
  tag?: string;
  category?: string | null;
  className?: string;
  accentColor?: string;
  isHot?: boolean;
  isInstant?: boolean;
}

export const MaxBazarCardArtwork: React.FC<MaxBazarCardArtworkProps> = React.memo(
  function MaxBazarCardArtwork({
    image,
    name,
    tag,
    category,
    className = '',
    accentColor = '#3744D9',
    isHot = true,
    isInstant = true,
  }) {
    return (
      <div
        className={`relative aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden p-1.5 sm:p-2 flex items-center justify-center shadow-md border border-slate-200/80 dark:border-slate-800 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5 ${className}`}
        style={{ contain: 'content' }}
      >
        {/* Dynamic Gradient Background (Mint / Cyan / Royal Blue Hue matching user screenshot) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#cffafe] via-[#a5f3fc] to-[#67e8f9] dark:from-[#083344] dark:via-[#164e63] dark:to-[#0f172a]" />

        {/* Polka Dot Matrix Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#0891b2_1.2px,transparent_1.2px)] [background-size:10px_10px] dark:bg-[radial-gradient(#38bdf8_1.2px,transparent_1.2px)]" />

        {/* Top-Left: MAX-BAZAR Brand Lockup (Matching Screenshot's "AUTO CASH" Lockup) */}
        <div className="absolute top-1.5 start-1.5 sm:top-2 sm:start-2 z-10 flex items-center gap-1 bg-white/95 dark:bg-slate-950/90 px-1.5 py-0.5 rounded-full border border-white/70 dark:border-slate-800 shadow-xs pointer-events-none select-none max-w-[85%]">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FFD027] shadow-[0_0_6px_#f59e0b] inline-block shrink-0" />
          <span className="text-[6.5px] sm:text-[7.5px] font-black tracking-tight text-slate-800 dark:text-white uppercase whitespace-nowrap">
            MAX BAZAR
          </span>
        </div>

        {/* Diagonal Geometric Swoosh Graphics (Bottom-Left) */}
        <div className="absolute -bottom-2 -start-2 z-0 pointer-events-none">
          <svg width="45" height="45" viewBox="0 0 60 60" fill="none" className="sm:w-[55px] sm:h-[55px]">
            <path
              d="M-5 50L30 15C34 11 40 11 44 15C48 19 48 25 44 29L10 63H-5V50Z"
              fill="#0891b2"
              opacity="0.9"
            />
            <path
              d="M-10 65L20 35C24 31 30 31 34 35C38 39 38 45 34 49L5 78H-10V65Z"
              fill="#0f172a"
              opacity="0.95"
            />
          </svg>
        </div>

        {/* CENTER WRAPPING LOGO FRAME & APP/GAME ICON */}
        <div className="relative z-10 w-[68%] h-[68%] flex items-center justify-center">
          {/* Decorative Corner Bracket Lines */}
          <div className="absolute -inset-2 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-90" fill="none">
              <path
                d="M32 9H70C81 9 91 19 91 30V68"
                stroke="#0891b2"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M68 91H30C19 91 9 81 9 70V32"
                stroke="#0f172a"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Actual Squircle App / Game Logo */}
          <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border-[2px] sm:border-[2.5px] border-white/95 dark:border-slate-800 bg-slate-900 group-hover:scale-105 transition-transform duration-300">
            <Image
              src={image || '/brand_logo.png'}
              alt={name || 'Service'}
              fill
              sizes="(max-width: 640px) 25vw, 120px"
              className="object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    );
  }
);
