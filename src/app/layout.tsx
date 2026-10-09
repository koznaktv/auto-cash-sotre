import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AUTO CASH - ئەپلەرگە، ئويۇنلارغا پۇل قاچىلاش ۋە سۈنئىي ئەقىل ئابۇنىتلىقى',
  description: 'AUTO CASH رەقەملىك ماللار، ئويۇنلار، كارتىلار، مەۋھۇم نومۇرلار ۋە سۈنئىي ئەقىل مۇلازىمەت مەركىزى',
};

import TelegramFloat from '@/components/TelegramFloat';
import { LanguageProvider } from '@/context/LanguageContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ug" dir="rtl" suppressHydrationWarning>
      <body className="bg-[#040d1a] text-slate-100 antialiased min-h-screen">
        <LanguageProvider>
          {children}
          <TelegramFloat />
        </LanguageProvider>
      </body>
    </html>
  );
}
