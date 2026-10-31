'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  const contactChannels = [
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
        className="fixed bottom-[74px] sm:bottom-[82px] md:bottom-7 left-3 sm:left-4 md:left-6 z-[60] flex flex-col items-start"
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
          <div className="relative overflow-hidden rounded-2xl bg-[#0f172a]/95 border border-emerald-500/30 p-3 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(16,185,129,0.18)] backdrop-blur-xl">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

            {/* Menu Header */}
            <div className="relative pb-2 mb-2 border-b border-white/10 flex items-center justify-between font-alkatip">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
                  <Headphones className="w-3.5 h-3.5 animate-icon-gentle-gleam" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1">
                    ئالاقە مەركىزى
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  </h3>
                  <p className="text-[9px] text-gray-400 font-sans">24/7 Support & Bot</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                        ? 'bg-gradient-to-r from-emerald-950/60 via-[#0d2229]/50 to-emerald-950/40 border-emerald-500/40 hover:border-emerald-400 shadow-sm hover:scale-[1.01]'
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
                        <h4 className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
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
              : 'bg-gradient-to-tr from-[#047857] via-[#059669] to-[#10b981] border-emerald-300/90 dark:border-emerald-400 shadow-[0_6px_20px_rgba(5,150,105,0.45),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_10px_28px_rgba(16,185,129,0.55)] hover:scale-105 text-white'
          }`}
        >
          {/* Clean online status beacon dot - solid & crisp */}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#040d1a] shadow-xs pointer-events-none" />
          )}

          {/* Icon inside */}
          {isOpen ? (
            <X className="w-5 h-5 transition-transform duration-300 transform -rotate-90 stroke-[2.4]" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Headphones className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white stroke-[2.2] animate-icon-gleam" />
              <span className="absolute -bottom-1 -right-1 text-[9px] font-black text-amber-300 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                ✦
              </span>
            </div>
          )}

          {/* Tooltip Pill (on hover when closed) */}
          {!isOpen && (
            <span
              className="absolute left-full ml-2.5 whitespace-nowrap px-2.5 py-1 rounded-full bg-[#0a1120]/95 text-emerald-300 text-xs font-bold font-alkatip border border-emerald-500/40 shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              ئالاقىلىشىش
            </span>
          )}
        </button>
      </aside>
    </>
  );
}
