'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Home, ReceiptText, Wallet, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  const navItems = [
    { href: '/', label: t('navHome'), icon: Home },
    { href: '/orders', label: t('navOrders'), icon: ReceiptText },
    { href: '/deposit', label: t('navDeposit'), icon: Wallet },
    { href: '/account', label: t('navAccount'), icon: User },
  ];

  const getActiveIndex = () => {
    if (pathname === '/') return 0;
    if (pathname.startsWith('/orders')) return 1;
    if (pathname.startsWith('/deposit')) return 2;
    if (pathname.startsWith('/account') || pathname.startsWith('/membership')) return 3;
    return 0;
  };

  const activeIndex = targetIndex !== null ? targetIndex : getActiveIndex();

  useEffect(() => {
    setTargetIndex(null);
  }, [pathname]);

  const translateX = isRTL ? -activeIndex * 100 : activeIndex * 100;

  return (
    <div className="md:hidden fixed bottom-[max(env(safe-area-inset-bottom,0px),12px)] left-3.5 right-3.5 z-50 pointer-events-auto">
      <nav
        className="relative bg-[#061426]/95 backdrop-blur-xl border border-cyan-500/25 rounded-2xl sm:rounded-full h-[64px] shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-around font-alkatip select-none"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Animated Sliding Lamp Indicator */}
        <div
          className="absolute top-0 bottom-0 w-1/4 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] z-0"
          style={{
            [isRTL ? 'right' : 'left']: 0,
            transform: `translateX(${translateX}%)`,
          }}
        >
          {/* Top Arch Dome Curve */}
          <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 w-16 h-4 pointer-events-none flex items-center justify-center overflow-visible">
            <svg viewBox="0 0 70 20" className="w-16 h-4 overflow-visible" fill="none">
              <defs>
                <linearGradient id="lampArchGrad" x1="0%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                  <stop offset="25%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                  <stop offset="75%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <filter id="lampArchFilter" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M 6 18 C 20 18, 24 3, 35 3 C 46 3, 50 18, 64 18"
                stroke="url(#lampArchGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#lampArchFilter)"
              />
            </svg>
            {/* Glowing Lamp Light Dot at Apex */}
            <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-200 ring-1 ring-cyan-400 shadow-[0_0_8px_#22d3ee,0_0_16px_#06b6d4,0_0_24px_rgba(34,211,238,0.9)] animate-pulse" />
          </div>

          {/* Spotlight Downward Light Beam Cone */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.28) 0%, rgba(6, 182, 212, 0.08) 55%, transparent 100%)',
              clipPath: 'polygon(36% 0%, 64% 0%, 95% 100%, 5% 100%)',
              filter: 'blur(1px)',
            }}
          />

          {/* Soft ambient radial glow */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-10 rounded-full bg-cyan-500/20 blur-md pointer-events-none" />
        </div>

        {/* Tab Links */}
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex === index;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setTargetIndex(index)}
              className="relative z-10 flex-1 flex flex-col items-center justify-center py-1 transition-all group cursor-pointer"
            >
              <span
                className={`transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'text-cyan-400 -translate-y-1 scale-110 drop-shadow-[0_0_10px_rgba(34,211,238,0.85)]'
                    : 'text-slate-400 group-hover:text-slate-200 group-active:scale-95'
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span
                className={`transition-all duration-300 mt-0.5 leading-tight ${
                  isActive
                    ? 'text-[11px] font-bold text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]'
                    : 'text-[10px] font-medium text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {item.label}
              </span>
              <span
                className={`transition-all duration-300 w-1.5 h-1.5 rounded-full mt-0.5 ${
                  isActive
                    ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee] opacity-100 scale-100'
                    : 'bg-transparent opacity-0 scale-50'
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
