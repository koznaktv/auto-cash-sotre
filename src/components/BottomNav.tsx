'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Home, ReceiptText, Wallet, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/', label: t('navHome'), icon: Home },
    { href: '/orders', label: t('navOrders'), icon: ReceiptText },
    { href: '/deposit', label: t('navDeposit'), icon: Wallet },
    { href: '/account', label: t('navAccount'), icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-[max(env(safe-area-inset-bottom,0px),10px)] left-3.5 right-3.5 z-50">
      <nav className="bg-[#061426] border border-amber-500/25 rounded-2xl p-1.5 shadow-2xl shadow-black/80 flex items-center justify-around font-alkatip">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-tr from-cyan-500/25 to-indigo-500/25 text-cyan-400 font-bold border border-cyan-500/30 shadow-md shadow-cyan-500/20 animate-normal-float'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`inline-flex items-center justify-center mb-0.5 ${isActive ? 'animate-normal-icon' : ''}`}>
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-[10px] leading-tight font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
