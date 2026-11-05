'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Headphones, 
  MessageCircle, 
  Send, 
  Megaphone, 
  Bot, 
  X, 
  Sparkles, 
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function TelegramFloat() {
  const pathname = usePathname();
  const { isMaxStore } = useStore();
  const isHokApp = pathname?.startsWith('/apps/honor-of-kings');
  const isMicroApp = pathname?.startsWith('/apps');
  const isMaxBazar = isMaxStore || pathname?.startsWith('/maxbazar') || isMicroApp;
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const contactChannels = isHokApp
    ? [
        {
          id: 'admin',
          title: 'HOK مەخسۇس ياردەم',
          englishTitle: 'HOK Dedicated Support',
          subtitle: '@nasrulla0996 • 24/7 تېلېگرام سۈرئەتلىك مۇلازىمەت',
          href: 'https://t.me/nasrulla0996',
          icon: Send,
          badge: 'HOK 24/7',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gradient: 'from-amber-500 via-amber-600 to-amber-700',
          glowColor: 'shadow-amber-500/30',
          featured: true,
        },
        {
          id: 'bot',
          title: 'MAX-BAZAR رەسمىي بوتى',
          englishTitle: 'MAX-BAZAR Official Bot',
          subtitle: '@maxbazar_bot • تېز قاچىلاش ۋە تالون دەلىللەش',
          href: 'https://t.me/maxbazar_bot',
          icon: Bot,
          badge: 'رەسمىي',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          gradient: 'from-[#222ca3] to-[#4E5AE8]',
          glowColor: 'shadow-blue-500/25',
          featured: false,
        },
        {
          id: 'whatsapp',
          title: 'ۋاتساپ مۇلازىمىتى',
          englishTitle: 'WhatsApp Support',
          subtitle: '+963 984 373 459 • تەتقىقات ۋە مەسلىھەت',
          href: 'https://wa.me/963984373459',
          icon: MessageCircle,
          badge: 'تېز سۈرئەت',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          gradient: 'from-emerald-500 to-teal-600',
          glowColor: 'shadow-emerald-500/25',
          featured: false,
        },
        {
          id: 'channel',
          title: 'رەسمىي ئېلان قانىلى',
          englishTitle: 'Official Channel',
          subtitle: '@autocash_cannel • يېڭى ئۇقتۇرۇش ۋە ئېتىبارلار',
          href: 'https://t.me/autocash_cannel',
          icon: Megaphone,
          badge: 'ئېلانلار',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          gradient: 'from-amber-600 to-amber-800',
          glowColor: 'shadow-amber-500/25',
          featured: false,
        },
      ]
    : isMaxBazar
    ? [
        {
          id: 'bot',
          title: 'MAX-BAZAR رەسمىي بوتى',
          englishTitle: 'MAX-BAZAR Official Bot',
          subtitle: '@maxbazar_bot • تېز قاچىلاش ۋە مال سېتىۋېلىش',
          href: 'https://t.me/maxbazar_bot',
          icon: Bot,
          badge: 'رەسمىي',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          gradient: 'from-[#222ca3] to-[#4E5AE8]',
          glowColor: 'shadow-blue-500/25',
          featured: true,
        },
        {
          id: 'admin',
          title: 'بىۋاسىتە خېرىدارلار مۇلازىمىتى',
          englishTitle: 'Direct Telegram Support',
          subtitle: '@nasrulla0996 • 24/7 تېلېگرام سۈرئەتلىك مۇلازىمەت',
          href: 'https://t.me/nasrulla0996',
          icon: Send,
          badge: '24/7',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          gradient: 'from-sky-500 to-blue-600',
          glowColor: 'shadow-sky-500/25',
          featured: false,
        },
        {
          id: 'whatsapp',
          title: 'ۋاتساپ مۇلازىمىتى',
          englishTitle: 'WhatsApp Support',
          subtitle: '+963 984 373 459 • تەتقىقات ۋە مەسلىھەت',
          href: 'https://wa.me/963984373459',
          icon: MessageCircle,
          badge: 'تېز سۈرئەت',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          gradient: 'from-emerald-500 to-teal-600',
          glowColor: 'shadow-emerald-500/25',
          featured: false,
        },
        {
          id: 'channel',
          title: 'رەسمىي ئېلان قانىلى',
          englishTitle: 'Official Channel',
          subtitle: '@autocash_cannel • يېڭى ئۇقتۇرۇش ۋە ئېتىبارلار',
          href: 'https://t.me/autocash_cannel',
          icon: Megaphone,
          badge: 'ئېلانلار',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          gradient: 'from-indigo-500 to-violet-600',
          glowColor: 'shadow-indigo-500/25',
          featured: false,
        },
      ]
    : [
        {
          id: 'bot',
          title: '24 سائەتلىك قاچىلاش بوتى',
          englishTitle: 'AutoCash 24/7 Bot',
          subtitle: '@Autocash_24_bot • ئەڭ تېز ئاپتوماتىك قاچىلاش',
          href: 'https://t.me/Autocash_24_bot',
          icon: Bot,
          badge: 'تەۋسىيە',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          gradient: 'from-emerald-500 to-teal-600',
          glowColor: 'shadow-emerald-500/25',
          featured: true,
        },
        {
          id: 'whatsapp',
          title: 'ۋاتساپ مۇلازىمىتى',
          englishTitle: 'WhatsApp Support',
          subtitle: '+963 984 373 459 • بىۋاسىتە ئۇچۇر',
          href: 'https://wa.me/963984373459',
          icon: MessageCircle,
          badge: 'تېز سۈرئەت',
          badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
          gradient: 'from-green-500 to-emerald-600',
          glowColor: 'shadow-green-500/25',
          featured: false,
        },
        {
          id: 'admin',
          title: 'باشقۇرغۇچى (Telegram)',
          englishTitle: 'Admin Direct Support',
          subtitle: '@autocash_UYGHUR • مەسلىھەت ۋە ياردەم',
          href: 'https://t.me/autocash_UYGHUR',
          icon: Send,
          badge: 'بىۋاسىتە',
          badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
          gradient: 'from-sky-500 to-blue-600',
          glowColor: 'shadow-sky-500/25',
          featured: false,
        },
        {
          id: 'channel',
          title: 'رەسمىي ئېلان قانىلى',
          englishTitle: 'Official Channel',
          subtitle: '@autocash_cannel • يېڭى ئۇقتۇرۇشلار',
          href: 'https://t.me/autocash_cannel',
          icon: Megaphone,
          badge: 'ئېلانلار',
          badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          gradient: 'from-indigo-500 to-violet-600',
          glowColor: 'shadow-indigo-500/25',
          featured: false,
        },
      ];

  return (
    <>
      {/* Backdrop for easy dismiss */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Floating Widget: Proportional, Beautiful, Standard Size FAB above bottom nav */}
      <aside
        ref={containerRef}
        aria-label={t('contactSupport')}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(86px+env(safe-area-inset-bottom,0px))] md:bottom-7 left-3 sm:left-4 md:left-6 z-50 flex flex-col items-start"
        dir="ltr"
      >
        {/* Cascading Speed-Dial Popup Menu */}
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`absolute bottom-full left-0 mb-3 w-[285px] sm:w-[320px] origin-bottom-left transition-all duration-300 ease-out transform ${
            isOpen
              ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto'
              : 'scale-90 opacity-0 translate-y-3 pointer-events-none'
          }`}
          style={{ willChange: 'transform, opacity' }}
        >
          <div
            className={`relative overflow-hidden rounded-2xl p-3 backdrop-blur-xl border ${
              isHokApp
                ? 'bg-[#0b132b]/95 border-amber-500/40 shadow-[0_12px_36px_rgba(0,0,0,0.75),0_0_24px_rgba(251,191,36,0.3)]'
                : isMaxBazar
                ? 'bg-[#0b132b]/95 border-blue-500/40 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(55,68,217,0.25)]'
                : 'bg-[#0f172a]/95 border-emerald-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(16,185,129,0.18)]'
            }`}
          >
            {/* Ambient Corner Glow */}
            <div
              className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl pointer-events-none ${
                isHokApp ? 'bg-amber-500/20' : isMaxBazar ? 'bg-blue-600/20' : 'bg-emerald-500/10'
              }`}
            />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

            {/* Menu Header */}
            <div className="relative pb-2 mb-2 border-b border-white/10 flex items-center justify-between font-alkatip">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${
                    isHokApp
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-amber-500/40'
                      : isMaxBazar
                      ? 'bg-gradient-to-br from-[#222ca3] to-[#4E5AE8] text-white shadow-blue-500/30'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 animate-icon-gentle-gleam" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1">
                    {isHokApp ? 'HOK خېرىدارلار مۇلازىمىتى' : isMaxBazar ? 'MAX-BAZAR ئالاقە مەركىزى' : 'ئالاقە مەركىزى'}
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  </h3>
                  <p className="text-[9px] text-gray-400 font-sans">24/7 Support & Bot</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                  isHokApp
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : isMaxBazar
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                    : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isHokApp ? 'bg-amber-400' : isMaxBazar ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                توردا
              </div>
            </div>

            {/* Channels List */}
            <div className="flex flex-col gap-1.5">
              {contactChannels.map((channel, index) => {
                const IconComponent = channel.icon;
                return (
                  <a
                    key={channel.id}
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setIsOpen(false)}
                    style={{
                      transitionDelay: isOpen ? `${index * 35}ms` : '0ms',
                    }}
                    className={`group relative flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200 ${
                      channel.featured
                        ? isMaxBazar
                          ? 'bg-gradient-to-r from-blue-950/60 via-[#0d1b38]/50 to-blue-950/40 border-blue-500/40 hover:border-blue-400 shadow-sm hover:scale-[1.01]'
                          : 'bg-gradient-to-r from-emerald-950/60 via-[#0d2229]/50 to-emerald-950/40 border-emerald-500/40 hover:border-emerald-400 shadow-sm hover:scale-[1.01]'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Channel Icon */}
                    <div
                      className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${channel.gradient} flex items-center justify-center text-white shadow-md ${channel.glowColor} group-hover:scale-105 transition-transform duration-200 shrink-0`}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                      {channel.featured && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0f172a]" />
                      )}
                    </div>

                    {/* Texts */}
                    <div className="flex-1 min-w-0 font-alkatip text-right">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[8px] font-sans px-1 py-0.2 rounded border ${channel.badgeColor}`}
                        >
                          {channel.badge}
                        </span>
                        <h4
                          className={`text-[11px] font-bold text-white transition-colors truncate ${
                            isMaxBazar ? 'group-hover:text-blue-300' : 'group-hover:text-emerald-400'
                          }`}
                        >
                          {channel.title}
                        </h4>
                      </div>
                      <p className="text-[9px] text-gray-400 truncate mt-0.5" dir="ltr">
                        {channel.subtitle}
                      </p>
                    </div>

                    {/* Arrow icon */}
                    <div className="text-gray-500 group-hover:text-white transition-colors shrink-0">
                      {isRTL ? (
                        <ChevronLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Footer Notice */}
            <div className="mt-2 pt-1.5 border-t border-white/5 text-center font-alkatip">
              <span className="text-[9px] text-gray-400 flex items-center justify-center gap-1">
                <Sparkles className="w-2 h-2 text-amber-400" />
                سۈرئەتلىك خېرىدارلار مۇلازىمىتى
              </span>
            </div>
          </div>
        </div>

        {/* Floating Action Trigger Button: Clean, crisp, no ghost ping rings */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'تاقاش' : 'ئالاقىلىشىش سەھىپىسىنى ئېچىش'}
          className={`relative group flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-gradient-to-tr from-rose-600 to-red-500 border-white shadow-lg shadow-rose-500/50 rotate-90 text-white'
              : isHokApp
                ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 border-amber-200 shadow-[0_6px_22px_rgba(251,191,36,0.65),0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_10px_30px_rgba(251,191,36,0.85)] hover:scale-105 text-slate-950'
                : isMaxBazar
                ? 'bg-gradient-to-tr from-[#222ca3] via-[#3744D9] to-[#4E5AE8] border-blue-300/90 dark:border-blue-400 shadow-[0_6px_20px_rgba(55,68,217,0.5),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_10px_28px_rgba(78,90,232,0.65)] hover:scale-105 text-white'
                : 'bg-gradient-to-tr from-[#047857] via-[#059669] to-[#10b981] border-emerald-300/90 dark:border-emerald-400 shadow-[0_6px_20px_rgba(5,150,105,0.45),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_10px_28px_rgba(16,185,129,0.55)] hover:scale-105 text-white'
          }`}
        >
          {/* Clean online status beacon dot - solid & crisp */}
          {!isOpen && (
            <span
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#040d1a] shadow-xs pointer-events-none ${
                isHokApp ? 'bg-amber-300' : isMaxBazar ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
          )}

          {/* Icon inside */}
          {isOpen ? (
            <X className="w-5 h-5 transition-transform duration-300 transform -rotate-90 stroke-[2.4]" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Headphones className={`w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.4] ${isHokApp ? 'text-slate-950' : 'text-white'} animate-icon-gleam`} />
              <span className={`absolute -bottom-1 -right-1 text-[9px] font-black ${isHokApp ? 'text-amber-800' : 'text-amber-300'} filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
                ✦
              </span>
            </div>
          )}

          {/* Tooltip Pill (on hover when closed) */}
          {!isOpen && (
            <span
              className={`absolute left-full ml-2.5 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold font-alkatip border shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                isHokApp
                  ? 'bg-[#0a1120]/95 text-amber-300 border-amber-500/40'
                  : isMaxBazar
                  ? 'bg-[#0a1120]/95 text-blue-300 border-blue-500/40'
                  : 'bg-[#0a1120]/95 text-emerald-300 border-emerald-500/40'
              }`}
            >
              ئالاقىلىشىش
            </span>
          )}
        </button>
      </aside>
    </>
  );
}
