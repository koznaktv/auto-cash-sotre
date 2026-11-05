'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeftRight, Store } from 'lucide-react';

interface StoreSwitcherButtonProps {
  variant?: 'compact' | 'full' | 'drawer';
  className?: string;
}

export default function StoreSwitcherButton({
  variant = 'compact',
  className = '',
}: StoreSwitcherButtonProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const isApps = pathname.startsWith('/apps');

  const goToMaxBazar = () => {
    router.push('/apps');
  };

  const goToAutoCash = () => {
    router.push('/');
  };

  if (variant === 'drawer') {
    return (
      <div className={`p-3 rounded-2xl bg-slate-900/80 border border-slate-800 ${className}`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Store className="w-4 h-4 text-cyan-400" />
            <span>بازار ئالماشتۇرۇش:</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* AUTO CASH option */}
          <button
            onClick={goToAutoCash}
            className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-start relative ${
              !isApps
                ? 'bg-emerald-950/50 border-emerald-500/50 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md overflow-hidden relative flex-shrink-0 bg-slate-900">
                <Image
                  src="/images/autocash_official_logo.png"
                  alt="AUTO CASH"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-[11px] font-bold text-white truncate">AUTO CASH</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              ئاساسىي دۇكان
            </div>
          </button>

          {/* MAX-BAZAR option */}
          <button
            onClick={goToMaxBazar}
            className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-start relative ${
              isApps
                ? 'bg-blue-950/50 border-blue-500/50 shadow-md shadow-blue-950/30 ring-1 ring-blue-500/30'
                : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md overflow-hidden relative flex-shrink-0 bg-slate-900">
                <Image
                  src="/images/maxbazar_hd_logo.png"
                  alt="MAX-BAZAR"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-[11px] font-bold text-white truncate">MAX-BAZAR</span>
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              ئەپ بازىرى
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-inner ${className}`}>
        <button
          onClick={goToAutoCash}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            !isApps
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="AUTO CASH تور بېكىتى"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AUTO CASH</span>
        </button>

        <button
          onClick={goToMaxBazar}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isApps
              ? 'bg-gradient-to-r from-blue-500/20 to-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="MAX-BAZAR ئەپ بازىرى"
        >
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span>MAX-BAZAR</span>
        </button>
      </div>
    );
  }

  // Compact variant for mobile top header
  return (
    <button
      onClick={() => {
        if (isApps) {
          goToAutoCash();
        } else {
          goToMaxBazar();
        }
      }}
      className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm shrink-0 active:scale-95 bg-slate-900/90 border-slate-700/60 hover:border-amber-400/80 text-slate-200 hover:text-white"
      title={isApps ? 'AUTO CASH تور بېكىتىگە كىرىش' : 'MAX-BAZAR ئەپ بازىرىغا ئۆتۈش'}
    >
      <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-300 shrink-0" />
      <div className="relative w-4 h-4 rounded-md overflow-hidden flex-shrink-0 bg-slate-900">
        <Image
          src={isApps ? '/images/autocash_official_logo.png' : '/images/maxbazar_hd_logo.png'}
          alt={isApps ? 'AUTO CASH' : 'MAX-BAZAR'}
          fill
          className={isApps ? 'object-contain' : 'object-cover'}
        />
      </div>
      <span className="hidden sm:inline text-[11px] font-black text-amber-300">
        {isApps ? 'AUTO CASH' : 'MAX-BAZAR'}
      </span>
    </button>
  );
}
