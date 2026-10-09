'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Send, MessageCircle } from 'lucide-react';

export default function TelegramFloat() {
  const { t, isRTL } = useLanguage();

  return (
    <aside
      aria-label={t('contactSupport')}
      className={`fixed bottom-20 md:bottom-6 ${
        isRTL ? 'left-4' : 'right-4'
      } z-40 flex items-center gap-2`}
    >
      {/* Telegram Button */}
      <a
        href="https://t.me/autocash_UYGHUR"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/35 border border-sky-300/40 hover:scale-105 active:scale-95 transition-all group font-alkatip"
        title={t('telegramSupport')}
      >
        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Send className="w-3 h-3 text-white -translate-x-0.5" />
        </span>
        <span className="hidden sm:inline">Telegram</span>
      </a>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/963984373459"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/35 border border-emerald-300/40 hover:scale-105 active:scale-95 transition-all group font-alkatip"
        title="WhatsApp: +963 984 373 459"
      >
        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <MessageCircle className="w-3.5 h-3.5 text-white" />
        </span>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </aside>
  );
}
