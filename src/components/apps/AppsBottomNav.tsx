'use client';

import React from 'react';
import Image from 'next/image';
import { Home, ClipboardList, Wallet, User } from 'lucide-react';

export type AppsNavTab = 'home' | 'orders' | 'wallet' | 'account';

interface AppsBottomNavProps {
  activeTab: AppsNavTab;
  onTabChange: (tab: AppsNavTab) => void;
  ordersCount?: number;
  userPhoto?: string | null;
  homeAvatar?: string; // Optional custom avatar for home (e.g. HOK or PUBG)
  theme?: 'light' | 'dark';
}

export default function AppsBottomNav({
  activeTab,
  onTabChange,
  ordersCount = 0,
  userPhoto = null,
  homeAvatar,
  theme = 'light',
}: AppsBottomNavProps) {
  // 0: باشبەت (Home)
  // 1: مېنىڭ تەلەپلىرىم (Orders)
  // 2: مېنىڭ ھەميانىم (Wallet)
  // 3: مېنىڭ ھېسابىم (Account)
  const tabIndex = activeTab === 'home' ? 0 : activeTab === 'orders' ? 1 : activeTab === 'wallet' ? 2 : 3;
  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto pb-[env(safe-area-inset-bottom,0px)]">
      <div className="relative max-w-lg mx-auto select-none font-alkatip">
        
        {/* =========================================================================
            1. FROSTED GLASS TRANSLUCENT BASE BAR (Matches Auto-Cash Light & Dark Style)
        ========================================================================= */}
        <div className={`relative h-[66px] backdrop-blur-2xl border-t rounded-t-[24px] overflow-hidden ${
          isDark
            ? 'bg-[#0c1424]/95 border-slate-800 shadow-[0_-10px_35px_rgba(0,0,0,0.6)]'
            : 'bg-white/95 border-slate-200/90 shadow-[0_-8px_25px_rgba(0,0,0,0.06)]'
        }`}>
          {/* Amber subtle shimmer line */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        </div>

        {/* =========================================================================
            2. GPU-ACCELERATED SLIDING NOTCH & 3D JEWEL BUBBLE (100% Full Unclipped Circle!)
        ========================================================================= */}
        <div
          className="absolute top-0 right-0 w-1/4 h-[66px] pointer-events-none z-20 transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{
            transform: `translate3d(-${tabIndex * 100}%, 0, 0)`,
            willChange: 'transform',
          }}
        >
          {/* Authentic Curved Notch Cradle (Cuts out the bar with glowing neon lip) */}
          <svg
            viewBox="0 0 76 26"
            className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[76px] h-[26px] overflow-visible"
          >
            <defs>
              <linearGradient id="appsNotchGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.2)" />
                <stop offset="35%" stopColor="rgba(245, 158, 11, 0.85)" />
                <stop offset="50%" stopColor="rgba(251, 191, 36, 1)" />
                <stop offset="65%" stopColor="rgba(245, 158, 11, 0.85)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0.2)" />
              </linearGradient>
            </defs>

            {/* Notch Background Fill (Matches page background) */}
            <path
              d="M 0 0 C 16 0, 20 24, 38 24 C 56 24, 60 0, 76 0 Z"
              fill={isDark ? '#040d1a' : '#f4f7f5'}
            />

            {/* Glowing Neon Contour Lip */}
            <path
              d="M 0 0 C 16 0, 20 24, 38 24 C 56 24, 60 0, 76 0"
              fill="none"
              stroke="url(#appsNotchGlow)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* Elevated 3D Jewel Floating Bubble (Completely 100% Round & Glowing, Never Cut Off!) */}
          <div className="absolute -top-[16px] left-1/2 -translate-x-1/2 w-[50px] h-[50px] rounded-full p-[2px] shadow-[0_8px_24px_rgba(245,158,11,0.45),0_0_15px_rgba(251,191,36,0.25)]">
            {/* Outer Ambient Glow */}
            <span className="absolute -inset-1 rounded-full blur-sm animate-pulse bg-amber-400/30" />

            {/* Gem Shell */}
            <div className="relative w-full h-full rounded-full p-[2px] border-2 border-amber-300 bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center overflow-hidden">
              {/* Glossy Top Reflection */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/60 via-white/20 to-transparent rounded-t-full pointer-events-none" />

              {/* Active Icon Content */}
              <div className="relative flex items-center justify-center text-slate-950 z-10 w-full h-full">
                {activeTab === 'home' && (
                  homeAvatar ? (
                    <div className="w-9 h-9 rounded-full overflow-hidden p-0.5">
                      <Image
                        src={homeAvatar}
                        alt="Game"
                        width={36}
                        height={36}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <Home className="w-5 h-5 stroke-[2.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                  )
                )}

                {activeTab === 'orders' && (
                  <ClipboardList className="w-5 h-5 stroke-[2.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                )}

                {activeTab === 'wallet' && (
                  <Wallet className="w-5 h-5 stroke-[2.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                )}

                {activeTab === 'account' && (
                  userPhoto ? (
                    <div className="w-9 h-9 rounded-full overflow-hidden p-0.5">
                      <img
                        src={userPhoto}
                        alt="User"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <User className="w-5 h-5 stroke-[2.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                  )
                )}
                
                <span className="absolute -bottom-0.5 -right-0.5 text-[8px] text-amber-950 animate-star-glint font-black">
                  ✦
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. INTERACTIVE 4-TAB NAVIGATION (z-30, Instant Touch Response)
        ========================================================================= */}
        <nav
          className="absolute inset-0 top-0 h-[66px] grid grid-cols-4 z-30"
          dir="rtl"
        >
          {/* Tab 1: باشبەت (Home) */}
          <button
            onClick={() => onTabChange('home')}
            className="h-full flex flex-col items-center justify-center py-1 transition-all active:scale-95 group cursor-pointer"
          >
            {activeTab !== 'home' ? (
              <div className="flex flex-col items-center justify-center transition-all group-active:scale-90">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'text-slate-400 group-hover:text-amber-400' : 'text-slate-500 group-hover:text-amber-600'
                }`}>
                  <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <span className={`text-[10px] font-bold leading-none mt-0.5 transition-colors ${
                  isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                }`}>
                  باشبەت
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-end h-full pb-1.5">
                <span className={`text-[10px] font-black leading-none flex items-center gap-0.5 animate-fadeIn ${
                  isDark ? 'text-amber-400' : 'text-amber-600'
                }`}>
                  <span>باشبەت</span>
                  <span className="text-[8px] text-amber-500 animate-star-glint">✦</span>
                </span>
              </div>
            )}
          </button>

          {/* Tab 2: مېنىڭ تەلەپلىرىم (Orders) */}
          <button
            onClick={() => onTabChange('orders')}
            className="h-full flex flex-col items-center justify-center py-1 transition-all active:scale-95 group cursor-pointer"
          >
            {activeTab !== 'orders' ? (
              <div className="flex flex-col items-center justify-center transition-all group-active:scale-90">
                <div className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'text-slate-400 group-hover:text-amber-400' : 'text-slate-500 group-hover:text-amber-600'
                }`}>
                  <ClipboardList className="w-5 h-5 transition-transform group-hover:scale-110" />
                  {ordersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>
                <span className={`text-[10px] font-bold leading-none mt-0.5 transition-colors ${
                  isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                }`}>
                  مېنىڭ تەلەپلىرىم
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-end h-full pb-1.5">
                <span className={`text-[10px] font-black leading-none flex items-center gap-0.5 animate-fadeIn ${
                  isDark ? 'text-amber-400' : 'text-amber-600'
                }`}>
                  <span>مېنىڭ تەلەپلىرىم</span>
                  <span className="text-[8px] text-amber-500 animate-star-glint">✦</span>
                </span>
              </div>
            )}
          </button>

          {/* Tab 3: مېنىڭ ھەميانىم (Wallet) */}
          <button
            onClick={() => onTabChange('wallet')}
            className="h-full flex flex-col items-center justify-center py-1 transition-all active:scale-95 group cursor-pointer"
          >
            {activeTab !== 'wallet' ? (
              <div className="flex flex-col items-center justify-center transition-all group-active:scale-90">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'text-slate-400 group-hover:text-amber-400' : 'text-slate-500 group-hover:text-amber-600'
                }`}>
                  <Wallet className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <span className={`text-[10px] font-bold leading-none mt-0.5 transition-colors ${
                  isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                }`}>
                  مېنىڭ ھەميانىم
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-end h-full pb-1.5">
                <span className={`text-[10px] font-black leading-none flex items-center gap-0.5 animate-fadeIn ${
                  isDark ? 'text-amber-400' : 'text-amber-600'
                }`}>
                  <span>مېنىڭ ھەميانىم</span>
                  <span className="text-[8px] text-amber-500 animate-star-glint">✦</span>
                </span>
              </div>
            )}
          </button>

          {/* Tab 4: مېنىڭ ھېسابىم (Account) */}
          <button
            onClick={() => onTabChange('account')}
            className="h-full flex flex-col items-center justify-center py-1 transition-all active:scale-95 group cursor-pointer"
          >
            {activeTab !== 'account' ? (
              <div className="flex flex-col items-center justify-center transition-all group-active:scale-90">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'text-slate-400 group-hover:text-amber-400' : 'text-slate-500 group-hover:text-amber-600'
                }`}>
                  <User className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <span className={`text-[10px] font-bold leading-none mt-0.5 transition-colors ${
                  isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                }`}>
                  مېنىڭ ھېسابىم
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-end h-full pb-1.5">
                <span className={`text-[10px] font-black leading-none flex items-center gap-0.5 animate-fadeIn ${
                  isDark ? 'text-amber-400' : 'text-amber-600'
                }`}>
                  <span>مېنىڭ ھېسابىم</span>
                  <span className="text-[8px] text-amber-500 animate-star-glint">✦</span>
                </span>
              </div>
            )}
          </button>
        </nav>

      </div>
    </div>
  );
}
