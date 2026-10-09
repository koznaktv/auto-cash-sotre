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
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-50">
      <nav className="backdrop-blur-xl bg-slate-900/90 border border-slate-700/60 rounded-2xl p-1.5 shadow-2xl flex items-center justify-around font-alkatip">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
