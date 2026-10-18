import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#040d1a',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://autocash.pro'),
  title: 'AUTO CASH - ئەپلەرگە، ئويۇنلارغا پۇل قاچىلاش ۋە رەقەملىك كارتىلار سۇپىسى',
  description: 'AUTO CASH رەقەملىك ماللار، ئويۇنلار، كارتىلار، مەۋھۇم نومۇرلار ۋە سۈنئىي ئەقىل مۇلازىمەت مەركىزى. ئىشەنچلىك، ئەرزان ۋە دەرھال يەتكۈزۈش.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'AUTO CASH - ئەپلەرگە، ئويۇنلارغا پۇل قاچىلاش سۇپىسى',
    description: 'رەقەملىك ماللار، سۈنئىي ئەقىل، ئويۇن كارتىلىرى ۋە ھېساباتلارنى بىخەتەر قاچىلاش سۇپىسى',
    url: 'https://autocash.pro',
    siteName: 'AUTO CASH',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 800,
        alt: 'AUTO CASH Logo',
      },
    ],
    locale: 'ug_CN',
    type: 'website',
  },
};

import TelegramFloat from '@/components/TelegramFloat';
import BottomNav from '@/components/BottomNav';
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
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
