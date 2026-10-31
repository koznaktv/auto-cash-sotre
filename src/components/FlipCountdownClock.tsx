'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FlipCountdownClockProps {
  hours: number;
  minutes: number;
  seconds: number;
  lang?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export default function FlipCountdownClock({
  hours,
  minutes,
  seconds,
  lang = 'ug',
  size = 'lg',
  showLabels = true,
  className = '',
}: FlipCountdownClockProps) {
  // Pad number to at least 2 digits
  const pad = (n: number) => n.toString().padStart(2, '0');

  // Track previous values to trigger mechanical flip tick animation only on change
  const prevSecRef = useRef(seconds);
  const prevMinRef = useRef(minutes);
  const prevHourRef = useRef(hours);

  const [secFlipping, setSecFlipping] = useState(false);
  const [minFlipping, setMinFlipping] = useState(false);
  const [hourFlipping, setHourFlipping] = useState(false);

  useEffect(() => {
    if (prevSecRef.current !== seconds) {
      prevSecRef.current = seconds;
      setSecFlipping(true);
      const timer = setTimeout(() => setSecFlipping(false), 650);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  useEffect(() => {
    if (prevMinRef.current !== minutes) {
      prevMinRef.current = minutes;
      setMinFlipping(true);
      const timer = setTimeout(() => setMinFlipping(false), 650);
      return () => clearTimeout(timer);
    }
  }, [minutes]);

  useEffect(() => {
    if (prevHourRef.current !== hours) {
      prevHourRef.current = hours;
      setHourFlipping(true);
      const timer = setTimeout(() => setHourFlipping(false), 650);
      return () => clearTimeout(timer);
    }
  }, [hours]);

  // Labels
  const labels = {
    hours: lang === 'ug' ? 'سائەت' : lang === 'ar' ? 'ساعة' : 'HRS',
    minutes: lang === 'ug' ? 'مىنۇت' : lang === 'ar' ? 'دقيقة' : 'MIN',
    seconds: lang === 'ug' ? 'سېكۇنت' : lang === 'ar' ? 'ثانية' : 'SEC',
  };

  // Dimensions based on size
  const cardSizeClasses = {
    sm: 'min-w-[28px] h-7 sm:h-8 rounded-md text-xs sm:text-sm px-1.5',
    md: 'min-w-[42px] sm:min-w-[50px] h-10 sm:h-12 rounded-xl text-base sm:text-xl px-2 sm:px-3',
    lg: 'min-w-[58px] sm:min-w-[76px] h-14 sm:h-20 rounded-2xl sm:rounded-3xl text-2xl sm:text-4xl px-3 sm:px-4',
  }[size];

  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-1.5 sm:gap-2.5',
    lg: 'gap-2.5 sm:gap-4',
  }[size];

  const colonSizeClasses = {
    sm: 'text-xs -mt-1',
    md: 'text-base sm:text-xl -mt-2',
    lg: 'text-2xl sm:text-4xl -mt-3 sm:-mt-4',
  }[size];

  const labelSizeClasses = {
    sm: 'text-[7.5px] mt-0.5',
    md: 'text-[9.5px] sm:text-xs mt-1',
    lg: 'text-[11px] sm:text-sm mt-1.5 font-bold',
  }[size];

  return (
    <div className={`flex items-center ${gapClasses} ${className}`} dir="ltr">
      {/* =========================================================================
          1. HOURS FLIP CARD
      ========================================================================= */}
      <div className="flex flex-col items-center">
        <div
          className={`relative ${cardSizeClasses} bg-gradient-to-b from-[#1c1917] via-[#0c0a09] to-[#040404] dark:from-[#18181b] dark:via-[#09090b] dark:to-[#020202] border-2 border-amber-500/80 dark:border-amber-400/80 shadow-[0_8px_20px_rgba(245,158,11,0.25),inset_0_2px_4px_rgba(255,255,255,0.15)] flex items-center justify-center font-mono font-black select-none overflow-hidden ${
            hourFlipping ? 'animate-flip-tick' : ''
          }`}
          style={{ willChange: 'transform' }}
        >
          {/* Authentic Horizontal Split Seam / Hairline Divider */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#0c0a09] shadow-[0_1px_2px_rgba(255,255,255,0.12),0_-1px_2px_rgba(0,0,0,0.8)] z-20 pointer-events-none" />

          {/* Left & Right Mechanical Hinge Tabs */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[7px] bg-amber-400 rounded-r-xs shadow-xs z-30 pointer-events-none" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-[7px] bg-amber-400 rounded-l-xs shadow-xs z-30 pointer-events-none" />

          {/* Glossy Top Glass Reflection */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none z-10" />

          {/* Golden Digit with Metallic Shine */}
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">
            {hours > 99 ? hours : pad(hours)}
          </span>
        </div>

        {showLabels && (
          <span className={`${labelSizeClasses} text-amber-300/90 font-alkatip text-center`}>
            {labels.hours}
          </span>
        )}
      </div>

      {/* =========================================================================
          PULSING FIRE COLON SEPARATOR
      ========================================================================= */}
      <div className={`flex flex-col items-center justify-center ${colonSizeClasses} font-mono font-black text-amber-400 animate-colon-beat select-none`}>
        <span>:</span>
      </div>

      {/* =========================================================================
          2. MINUTES FLIP CARD
      ========================================================================= */}
      <div className="flex flex-col items-center">
        <div
          className={`relative ${cardSizeClasses} bg-gradient-to-b from-[#1c1917] via-[#0c0a09] to-[#040404] dark:from-[#18181b] dark:via-[#09090b] dark:to-[#020202] border-2 border-amber-500/80 dark:border-amber-400/80 shadow-[0_8px_20px_rgba(245,158,11,0.25),inset_0_2px_4px_rgba(255,255,255,0.15)] flex items-center justify-center font-mono font-black select-none overflow-hidden ${
            minFlipping ? 'animate-flip-tick' : ''
          }`}
          style={{ willChange: 'transform' }}
        >
          {/* Horizontal Split Seam */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#0c0a09] shadow-[0_1px_2px_rgba(255,255,255,0.12),0_-1px_2px_rgba(0,0,0,0.8)] z-20 pointer-events-none" />

          {/* Mechanical Hinges */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[7px] bg-amber-400 rounded-r-xs shadow-xs z-30 pointer-events-none" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-[7px] bg-amber-400 rounded-l-xs shadow-xs z-30 pointer-events-none" />

          {/* Top Glass Highlight */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none z-10" />

          {/* Digit */}
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">
            {pad(minutes)}
          </span>
        </div>

        {showLabels && (
          <span className={`${labelSizeClasses} text-amber-300/90 font-alkatip text-center`}>
            {labels.minutes}
          </span>
        )}
      </div>

      {/* =========================================================================
          PULSING FIRE COLON SEPARATOR
      ========================================================================= */}
      <div className={`flex flex-col items-center justify-center ${colonSizeClasses} font-mono font-black text-amber-400 animate-colon-beat select-none`}>
        <span>:</span>
      </div>

      {/* =========================================================================
          3. SECONDS FLIP CARD (Real-time active ticking every 1 second)
      ========================================================================= */}
      <div className="flex flex-col items-center">
        <div
          className={`relative ${cardSizeClasses} bg-gradient-to-b from-[#291708] via-[#140b02] to-[#050200] dark:from-[#261205] dark:via-[#130702] dark:to-[#040100] border-2 border-orange-500 dark:border-amber-400 shadow-[0_8px_25px_rgba(249,115,22,0.45),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center font-mono font-black select-none overflow-hidden ${
            secFlipping ? 'animate-flip-tick' : ''
          }`}
          style={{ willChange: 'transform' }}
        >
          {/* Horizontal Split Seam */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#0c0a09] shadow-[0_1px_2px_rgba(255,255,255,0.12),0_-1px_2px_rgba(0,0,0,0.8)] z-20 pointer-events-none" />

          {/* Mechanical Hinges */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[7px] bg-orange-400 rounded-r-xs shadow-xs z-30 pointer-events-none" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-[7px] bg-orange-400 rounded-l-xs shadow-xs z-30 pointer-events-none" />

          {/* Top Glass Highlight */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none z-10" />

          {/* Active Seconds Glowing Digit */}
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-orange-300 to-amber-500 drop-shadow-[0_2px_10px_rgba(249,115,22,0.8)]">
            {pad(seconds)}
          </span>

          {/* Corner Tiny Sparkle */}
          <span className="absolute top-1 right-1 text-[7px] text-amber-300 animate-pulse pointer-events-none">
            ✦
          </span>
        </div>

        {showLabels && (
          <span className={`${labelSizeClasses} text-orange-400 font-alkatip text-center font-black`}>
            {labels.seconds}
          </span>
        )}
      </div>
    </div>
  );
}
