'use client';

import React from 'react';
import SGCSubpageLayout from '@/components/SGCSubpageLayout';
import TelegramLinkCard from '@/components/TelegramLinkCard';
import { useLanguage } from '@/context/LanguageContext';

export default function TelegramAccountLinkingPage() {
  const { lang } = useLanguage();

  return (
    <SGCSubpageLayout
      title={
        lang === 'ar'
          ? 'ربط الحساب ببوت تيليغرام'
          : lang === 'ug'
          ? 'تېلېگرامما بوتقا باغلاش'
          : 'Telegram Bot Linking'
      }
      subtitle={
        lang === 'ar'
          ? 'اربط حسابك في الموقع مع بوت تيليغرام للاستمتاع برصيد موحد وإشعارات فورية'
          : lang === 'ug'
          ? 'توربەتتىكى ھېساباتىڭىزنى بوتقا تۇتاشتۇرۇپ، ئورتاق قالدۇق ۋە دەقىقىلىق ئۇقتۇرۇشلارغا ئېرىشىڭ'
          : 'Link your website account with Telegram bot for shared balance and real-time alerts'
      }
    >
      <div className="max-w-4xl mx-auto py-2 sm:py-6 px-2 sm:px-4">
        <TelegramLinkCard standalone={true} />
      </div>
    </SGCSubpageLayout>
  );
}
