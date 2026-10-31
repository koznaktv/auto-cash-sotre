'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Wallet, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Hide completely on admin routes
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  // Determine active route index
  // 0: باشبەت (Home)
  // 1: تەلەپلىرىم (Orders)
  // 2: ھەميانىم (Deposit / Wallet)
  // 3: ھېسابىم (Account / Membership)
  const routeIndex = useMemo(() => {
    if (!pathname || pathname === '/') return 0;
    if (pathname.startsWith('/orders')) return 1;
    if (pathname.startsWith('/deposit') || pathname.startsWith('/wallet')) return 2;
    if (pathname.startsWith('/account') || pathname.startsWith('/membership')) return 3;
    return 0;
  }, [pathname]);

  // Optimistic instant active state: Zero-lag immediate response on touch/click!
  const [activeTab, setActiveTab] = useState(routeIndex);

  // Sync with browser navigation (back/forward or external link)
  useEffect(() => {
    setActiveTab(routeIndex);
  }, [routeIndex]);

  // Tab definitions in RTL order (0 = rightmost, 3 = leftmost)
  const tabs = [
    {
      id: 'home',
      label: 'باشبەت',
      href: '/',
      icon: Home,
    },
    {
      id: 'orders',
      label: 'تەلەپلىرىم',
      href: '/orders',
      icon: ClipboardList,
    },
    {
      id: 'deposit',
      label: 'ھەميانىم',
      href: '/deposit',
      icon: Wallet,
    },
    {
      id: 'account',
      label: 'ھېسابىم',
      href: '/account',
      icon: User,
    },
  ];

  const ActiveIcon = tabs[activeTab]?.icon || Home;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-auto pb-[env(safe-area-inset-bottom,0px)]">
      <div className="relative max-w-[440px] mx-auto select-none font-alkatip">
        
        {/* =========================================================================
            1. FROSTED GLASS TRANSLUCENT BASE BAR (100% Hardware Accelerated)
        ========================================================================= */}
        <div className="relative h-[66px] bg-white/90 dark:bg-[#0c1424]/90 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 rounded-t-[24px] shadow-[0_-8px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-10px_35px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Subtle top shimmer line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </div>

        {/* =========================================================================
            2. GPU-ACCELERATED SLIDING NOTCH & 3D JEWEL BUBBLE (Instant, Silky-Smooth)
        ========================================================================= */}
        <div
          className="absolute top-0 right-0 w-1/4 h-[66px] pointer-events-none z-20 transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{
            transform: `translate3d(-${activeTab * 100}%, 0, 0)`,
            willChange: 'transform',
          }}
        >
          {/* Authentic Curved Notch Cradle (cuts out the bar top with glowing neon lip) */}
          <svg
            viewBox="0 0 76 26"
            className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[76px] h-[26px] overflow-visible"
          >
            <defs>
              <linearGradient id="notchLipGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
                <stop offset="35%" stopColor="rgba(16, 185, 129, 0.85)" />
                <stop offset="50%" stopColor="rgba(245, 158, 11, 0.95)" />
                <stop offset="65%" stopColor="rgba(16, 185, 129, 0.85)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.2)" />
              </linearGradient>
            </defs>

            {/* Notch Background Fill (matches page background) */}
            <path
              d="M 0 0 C 16 0, 20 24, 38 24 C 56 24, 60 0, 76 0 Z"
              className="fill-[#f8fafc] dark:fill-[#040d1a]"
            />

            {/* Glowing Neon Contour Lip */}
            <path
              d="M 0 0 C 16 0, 20 24, 38 24 C 56 24, 60 0, 76 0"
              fill="none"
              stroke="url(#notchLipGlow)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* Elevated 3D Jewel Floating Bubble */}
          <div className="absolute -top-[16px] left-1/2 -translate-x-1/2 w-[50px] h-[50px] rounded-full p-[2px] shadow-[0_8px_24px_rgba(5,150,105,0.55),0_0_15px_rgba(16,185,129,0.35)]">
            
            {/* Outer Ambient Glow */}
            <span className="absolute -inset-1 rounded-full bg-emerald-400/35 dark:bg-emerald-400/25 blur-sm animate-pulse" />

            {/* Gem Shell */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-[#047857] via-[#059669] to-[#10b981] p-[2.5px] border-2 border-emerald-200/95 dark:border-emerald-300/90 flex items-center justify-center overflow-hidden">
              
              {/* Glossy Top Reflection */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/45 via-white/10 to-transparent rounded-t-full pointer-events-none" />

              {/* Icon & Sparkle */}
              <div className="relative flex items-center justify-center text-white z-10">
                <ActiveIcon className="w-5 h-5 fill-current animate-nav-active drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
                <span className="absolute -bottom-1 -right-1 text-[8px] text-amber-300 animate-star-glint drop-shadow">
                  ✦
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. INTERACTIVE 4-TAB NAVIGATION LINKS (Instant Touch Response)
        ========================================================================= */}
        <nav
          className="absolute inset-0 top-0 h-[66px] flex items-center justify-around z-30"
          dir="rtl"
        >
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            const TabIcon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setActiveTab(idx)}
                className="flex-1 h-full flex flex-col items-center justify-center py-1 transition-all group cursor-pointer"
              >
                {/* When NOT active: Show icon and title */}
                {!isActive ? (
                  <div className="flex flex-col items-center justify-center transition-all group-active:scale-90">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <TabIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none mt-0.5 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {tab.label}
                    </span>
                  </div>
                ) : (
                  /* When ACTIVE: Icon is elevated in floating bubble, show active title below */
                  <div className="flex flex-col items-center justify-end h-full pb-1.5">
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 leading-none flex items-center gap-0.5 animate-fadeIn">
                      <span>{tab.label}</span>
                      <span className="text-[8px] text-amber-500 dark:text-amber-400 animate-star-glint">✦</span>
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
