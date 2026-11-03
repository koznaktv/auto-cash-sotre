'use client';

import React from 'react';
import Image from 'next/image';
import { useStore, STORE_METAS } from '@/context/StoreContext';
import { ArrowLeftRight, Store, Zap, Wallet, ChevronDown } from 'lucide-react';
import { formatSmartPrice } from '@/lib/clientAuth';

interface StoreSwitcherButtonProps {
  variant?: 'compact' | 'full' | 'drawer';
  className?: string;
}

export default function StoreSwitcherButton({
  variant = 'compact',
  className = '',
}: StoreSwitcherButtonProps) {
  const {
    activeStore,
    isMaxStore,
    openGateway,
    toggleStore,
    autocashBalance,
    maxstoreBalance,
    storeMeta,
  } = useStore();

  if (variant === 'drawer') {
    return (
      <div className={`p-3 rounded-2xl bg-slate-900/80 border border-slate-800 ${className}`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Store className="w-4 h-4 text-cyan-400" />
            <span>ئاكتىپ دۇكان:</span>
          </div>
          <button
            onClick={openGateway}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
          >
            <span>دەرۋازا تاللاش</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* AUTO CASH option */}
          <button
            onClick={() => !isMaxStore ? null : toggleStore()}
            className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-start relative ${
              !isMaxStore
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
              {formatSmartPrice(autocashBalance)}
            </div>
          </button>

          {/* MAX-BAZAR option */}
          <button
            onClick={() => isMaxStore ? null : toggleStore()}
            className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-start relative ${
              isMaxStore
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
            <div className="text-[10px] text-blue-400 font-medium">
              {formatSmartPrice(maxstoreBalance)}
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
          onClick={openGateway}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            !isMaxStore
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="AUTO CASH ئاساسىي دۇكىنى"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AUTO CASH</span>
        </button>

        <button
          onClick={openGateway}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isMaxStore
              ? 'bg-gradient-to-r from-blue-500/20 to-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="MAX-BAZAR يېڭى تەمىنلىگۈچى بازىرى"
        >
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span>MAX-BAZAR</span>
        </button>

        <button
          onClick={openGateway}
          className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors border border-slate-700/50"
          title="دۇكان ئالماشتۇرۇش دەرۋازىسى"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Compact variant for mobile top header
  return (
    <button
      onClick={openGateway}
      className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
        isMaxStore
          ? 'bg-gradient-to-r from-blue-950/70 to-slate-900/90 border-blue-500/40 text-orange-300 hover:border-orange-500/60 shadow-blue-950/30'
          : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-500/70 shadow-emerald-950/30'
      } ${className}`}
      title="دۇكان ئالماشتۇرۇش"
    >
      <div className="relative w-4 h-4 rounded-md overflow-hidden flex-shrink-0 bg-slate-900">
        <Image
          src={isMaxStore ? '/images/maxstore_hd_logo.png' : '/images/autocash_official_logo.png'}
          alt={storeMeta.name}
          fill
          className={isMaxStore ? 'object-cover' : 'object-contain'}
        />
      </div>
      <span className="truncate max-w-[90px] sm:max-w-[120px]">
        {storeMeta.name}
      </span>
      <ArrowLeftRight className="w-3 h-3 text-slate-400 group-hover:text-white transition-transform group-hover:rotate-180 duration-300" />
    </button>
  );
}
