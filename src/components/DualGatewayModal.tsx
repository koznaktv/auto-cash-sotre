'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStore, StoreType, STORE_METAS } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatSmartPrice } from '@/lib/clientAuth';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Wallet,
  Zap,
  ShieldCheck,
  Store,
  Layers,
} from 'lucide-react';

export default function DualGatewayModal() {
  const router = useRouter();
  const {
    activeStore,
    isGatewayOpen,
    closeGateway,
    switchStore,
    autocashBalance,
    maxstoreBalance,
  } = useStore();
  const { lang, isRTL } = useLanguage();

  if (!isGatewayOpen) return null;

  const handleSelect = (store: StoreType) => {
    switchStore(store);
    closeGateway();
    if (store === 'maxstore') {
      router.push('/apps');
    } else {
      router.push('/');
    }
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={closeGateway}
      />

      {/* Modal Dialog */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="relative w-full max-w-3xl my-auto bg-gradient-to-b from-[#0c182c] via-[#091222] to-[#040d1a] border border-cyan-500/20 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-cyan-950/50 z-10 overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-r from-emerald-500/20 via-cyan-500/30 to-blue-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeGateway}
          className="absolute top-4 end-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6 sm:mb-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs sm:text-sm font-semibold mb-3 shadow-inner">
            <Store className="w-4 h-4" />
            <span>قوش دەرۋازىلىق سۇپا مەركىزى • Dual Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide">
            قايسى دۇكانغا كىرمەكچى؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
            ئېھتىياجىڭىزغا ماس كېلىدىغان تەمىنلىگۈچى دۇكىنىنى تاللاڭ. دۇكانلارنىڭ قالدۇق پۇلى ئايرىم بولۇپ، خالىغان ۋاقىتتا بىرلا كۇنۇپكا بىلەن ئالماشتۇرالايسىز.
          </p>
        </div>

        {/* Two Storefront Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 relative z-10">
          {/* Card 1: AUTO CASH */}
          <div
            onClick={() => handleSelect('autocash')}
            className={`group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 border ${
              activeStore === 'autocash'
                ? 'bg-gradient-to-b from-emerald-950/60 via-slate-900/90 to-[#05141f] border-emerald-500/60 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/30'
                : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            {activeStore === 'autocash' && (
              <div className="absolute top-3 end-3 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ئاكتىپ</span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-3.5 mb-3.5">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/30 p-1 flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                  <Image
                    src="/images/autocash_official_logo.png"
                    alt="AUTO CASH"
                    fill
                    className="object-contain p-0.5"
                    onError={(e) => {
                      (e.target as any).src = '/brand_logo.png';
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      ئاساسىي دۇكان
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    AUTO CASH
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                سۈرىيە ۋايفاي، خەلقئارالىق ئويۇن كارتىلىرى، مەۋھۇم نومۇرلار ۋە بارلىق كۈندىلىك مۇلازىمەتلەر.
              </p>

              {/* Feature Tags */}
              <div className="space-y-1.5 text-[11px] text-slate-400 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>سۈرىيە كارتىلىرى (Fursan Net, Mujahid Net, Azez...)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>خەلقئارالىق ئويۇن ۋە ئەپ كارتىلىرى</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>دەل ۋاقتىدا ئاپتوماتىك تاپشۇرۇش سىستېمىسى</span>
                </div>
              </div>
            </div>

            {/* Wallet & CTA */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-3 bg-emerald-950/30 px-3 py-2 rounded-xl border border-emerald-500/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  AUTO CASH قالدۇقى:
                </span>
                <span className="font-bold text-emerald-400">
                  {formatSmartPrice(autocashBalance)}
                </span>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeStore === 'autocash'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200'
                }`}
              >
                <span>{activeStore === 'autocash' ? 'AUTO CASH نى كۆرۈش' : 'AUTO CASH قا كىرىش'}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: MAX-BAZAR */}
          <div
            onClick={() => handleSelect('maxstore')}
            className={`group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 border ${
              activeStore === 'maxstore'
                ? 'bg-gradient-to-b from-blue-950/70 via-slate-900/90 to-[#071120] border-blue-500/60 shadow-xl shadow-blue-950/40 ring-2 ring-blue-500/30'
                : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-orange-500/40'
            }`}
          >
            {activeStore === 'maxstore' && (
              <div className="absolute top-3 end-3 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ئاكتىپ</span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-3.5 mb-3.5">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#0B132B] border border-blue-500/30 p-1 flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                  <Image
                    src="/images/maxbazar_hd_logo.png"
                    alt="MAX-BAZAR"
                    fill
                    className="object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as any).src = '/images/maxstore_hd_logo.png';
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                      يېڭى تەمىنلىگۈچى
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 flex items-center gap-1.5">
                    MAX-BAZAR
                    <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                يېڭى تەمىنلىگۈچىگە خاس رەقەملىك بازار، ئالاھىدە VIP باھالار ۋە توپ سېتىش تۈرلىرى.
              </p>

              {/* Feature Tags */}
              <div className="space-y-1.5 text-[11px] text-slate-400 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span>يېڭى تەمىنلىگۈچىنىڭ بىۋاسىتە تەمىنلەش باھالىرى</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span>MAX-BAZAR مەخسۇس ئايرىم سېستىما</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span>ئايرىم مۇستەقىل ھەميان ۋە زاكازلار</span>
                </div>
              </div>
            </div>

            {/* Wallet & CTA */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-3 bg-blue-950/30 px-3 py-2 rounded-xl border border-blue-500/20">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-blue-400" />
                  MAX-BAZAR قالدۇقى:
                </span>
                <span className="font-bold text-blue-400">
                  {formatSmartPrice(maxstoreBalance)}
                </span>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeStore === 'maxstore'
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200'
                }`}
              >
                <span>{activeStore === 'maxstore' ? 'MAX-BAZAR نى كۆرۈش' : 'MAX-BAZAR غا كىرىش'}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Friendly Note Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>ھەر ئىككى دۇكاننىڭ قالدۇق پۇلى ئايرىم بولۇپ، خالىغان چاغدا ئۈستۈنكى تىزىملىكتىن ئالماشتۇرالايسىز.</span>
          </div>
          <button
            onClick={closeGateway}
            className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0 font-medium"
          >
            تاقاش
          </button>
        </div>
      </div>
    </div>
  );
}
