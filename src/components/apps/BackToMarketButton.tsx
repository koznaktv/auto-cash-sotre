'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ChevronLeft } from 'lucide-react';

interface BackToMarketButtonProps {
  className?: string;
  variant?: 'full' | 'compact' | 'pill';
}

export default function BackToMarketButton({
  className = '',
  variant = 'full',
}: BackToMarketButtonProps) {
  if (variant === 'pill') {
    return (
      <Link
        href="/apps"
        className={`group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0c1629]/95 via-[#101e38]/95 to-[#0a1222]/95 hover:from-[#132444] hover:to-[#0e1830] border border-amber-400/40 hover:border-amber-300 text-white text-xs font-black shadow-md transition-all active:scale-95 ${className}`}
        title="MAX-BAZAR ئاساسىي بازىرىغا قايتىش"
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform animate-pulse" />
        <span className="group-hover:text-amber-300 transition-colors">
          MAX-BAZAR ئاساسىي بازىرىغا قايتىش
        </span>
        <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 group-hover:-translate-x-0.5 transition-transform" />
      </Link>
    );
  }

  // Default 'full' variant matching the user's screenshot exactly with luxury touches
  return (
    <Link
      href="/apps"
      className={`group relative w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0c1629]/95 via-[#101e38]/95 to-[#0a1222]/95 hover:from-[#132444] hover:to-[#0e1830] border border-amber-400/35 hover:border-amber-300 text-white font-black text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-black/40 hover:shadow-amber-500/10 transition-all duration-300 active:scale-[0.98] select-none ${className}`}
      title="MAX-BAZAR ئاساسىي بازىرىغا قايتىش"
    >
      {/* Right side in RTL: Icon + Text matching user's screenshot */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-400 shadow-sm group-hover:scale-110 group-hover:border-amber-400/50 group-hover:text-amber-300 transition-all shrink-0">
          <Sparkles className="w-4 h-4 animate-star-glint" />
        </div>
        <div className="text-right">
          <span className="font-black text-white text-xs sm:text-sm block leading-tight group-hover:text-amber-300 transition-colors">
            MAX-BAZAR ئاساسىي بازىرىغا قايتىش
          </span>
          <span className="text-[10px] text-slate-400 font-normal hidden xs:block">
            باشقا بارلىق ئەپ ۋە ئويۇنلار بازىرىغا ئۆتۈش
          </span>
        </div>
      </div>

      {/* Left side in RTL: Fast Action Badge */}
      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] sm:text-xs bg-amber-500/10 px-2.5 sm:px-3 py-1 rounded-xl border border-amber-500/25 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shrink-0">
        <span>بازارغا كىرىش</span>
        <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
