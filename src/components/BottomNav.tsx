'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Home, ReceiptText, Wallet, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();

  const navItems = useMemo(
    () => [
      { href: '/', label: t('navHome'), icon: Home },
      { href: '/orders', label: t('navOrders'), icon: ReceiptText },
      { href: '/deposit', label: t('navDeposit'), icon: Wallet },
      { href: '/account', label: t('navAccount'), icon: User },
    ],
    [t]
  );

  const getActiveIndex = () => {
    if (!pathname || pathname === '/') return 0;
    if (pathname.startsWith('/orders')) return 1;
    if (pathname.startsWith('/deposit')) return 2;
    if (pathname.startsWith('/account') || pathname.startsWith('/membership')) return 3;
    return 0;
  };

  const activeIndex = getActiveIndex();
  const [optimisticIndex, setOptimisticIndex] = useState<number | null>(null);

  const currentIndex = optimisticIndex !== null ? optimisticIndex : activeIndex;

  useEffect(() => {
    setOptimisticIndex(null);
  }, [pathname]);

  // Hide completely on admin routes
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const translateX = isRTL ? -currentIndex * 100 : currentIndex * 100;

  return (
    <div className="md:hidden fixed bottom-[max(env(safe-area-inset-bottom,0px),12px)] left-3.5 right-3.5 z-50 pointer-events-auto">
      <nav
        className="relative bg-[#061426]/95 backdrop-blur-xl border border-cyan-500/25 rounded-2xl sm:rounded-full h-[64px] shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-around font-alkatip select-none"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Animated Sliding Lamp Indicator (100% GPU Hardware Accelerated) */}
        <div
          className="absolute top-0 bottom-0 w-1/4 pointer-events-none z-0"
          style={{
            [isRTL ? 'right' : 'left']: 0,
            transform: `translate3d(${translateX}%, 0, 0)`,
            transition: 'transform 320ms cubic-bezier(0.34, 1.35, 0.64, 1)',
            willChange: 'transform',
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
                <linearGradient id="lampSpotlightGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
                  <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 6 18 C 20 18, 24 3, 35 3 C 46 3, 50 18, 64 18"
                stroke="url(#lampArchGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            {/* Glowing Lamp Bulb at Apex */}
            <div
              className="absolute top-[1px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-200 ring-1 ring-cyan-400"
              style={{
                boxShadow: '0 0 8px #22d3ee, 0 0 16px rgba(6,182,212,0.85)',
              }}
            />
          </div>

          {/* Spotlight Downward Light Beam Cone (GPU-accelerated SVG polygon) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 pointer-events-none overflow-hidden">
            <svg viewBox="0 0 64 64" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="24,0 40,0 60,64 4,64" fill="url(#lampSpotlightGrad)" />
            </svg>
          </div>

          {/* Soft ambient radial glow */}
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-10 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Tab Links */}
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentIndex === index;

          return (
            <Link
              key={item.href}
              href={item.href}
              replace={item.href === '/'}
              prefetch={true}
              scroll={false}
              onClick={() => setOptimisticIndex(index)}
              className="relative z-10 flex-1 flex flex-col items-center justify-center py-1 group cursor-pointer"
            >
              <span
                className={`transition-transform duration-300 flex items-center justify-center ${
                  isActive
                    ? 'text-cyan-400 -translate-y-1 scale-110'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
                style={
                  isActive
                    ? { filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.85))' }
                    : undefined
                }
              >
                <Icon className="w-5 h-5" />
              </span>
              <span
                className={`transition-colors duration-300 mt-0.5 leading-tight ${
                  isActive
                    ? 'text-[11px] font-bold text-cyan-300'
                    : 'text-[10px] font-medium text-slate-400 group-hover:text-slate-300'
                }`}
                style={
                  isActive
                    ? { textShadow: '0 0 8px rgba(34,211,238,0.6)' }
                    : undefined
                }
              >
                {item.label}
              </span>
              <span
                className={`transition-all duration-300 w-1.5 h-1.5 rounded-full mt-0.5 ${
                  isActive
                    ? 'bg-cyan-400 opacity-100 scale-100'
                    : 'bg-transparent opacity-0 scale-50'
                }`}
                style={
                  isActive
                    ? { boxShadow: '0 0 6px #22d3ee' }
                    : undefined
                }
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
