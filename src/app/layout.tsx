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
    icon: '/brand_logo.png?v=2.1.0',
    shortcut: '/brand_logo.png?v=2.1.0',
    apple: '/brand_logo.png?v=2.1.0',
  },
  openGraph: {
    title: 'AUTO CASH - ئەپلەرگە، ئويۇنلارغا پۇل قاچىلاش سۇپىسى',
    description: 'رەقەملىك ماللار، سۈنئىي ئەقىل، ئويۇن كارتىلىرى ۋە ھېساباتلارنى بىخەتەر قاچىلاش سۇپىسى',
    url: 'https://autocash.pro',
    siteName: 'AUTO CASH',
    images: [
      {
        url: '/brand_logo.png?v=2.1.0',
        width: 1024,
        height: 1024,
        alt: 'AUTO CASH Logo',
      },
    ],
    locale: 'ug_CN',
    type: 'website',
  },
};

import TelegramFloat from '@/components/TelegramFloat';
import BottomNav from '@/components/BottomNav';
import AppUpdateNotifier from '@/components/AppUpdateNotifier';
import FirstTimeLanguageModal from '@/components/FirstTimeLanguageModal';
import TelegramAutoLogin from '@/components/TelegramAutoLogin';
import { LanguageProvider } from '@/context/LanguageContext';
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ug" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://telegram.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://telegram.org" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function initTg() {
                  try {
                    if (window.Telegram && window.Telegram.WebApp) {
                      window.Telegram.WebApp.ready();
                      window.Telegram.WebApp.expand();
                      if (window.Telegram.WebApp.setHeaderColor) window.Telegram.WebApp.setHeaderColor('#040d1a');
                      if (window.Telegram.WebApp.setBackgroundColor) window.Telegram.WebApp.setBackgroundColor('#040d1a');
                      return true;
                    }
                  } catch(e) {}
                  return false;
                }
                if (!initTg()) {
                  var c = 0;
                  var t = setInterval(function() {
                    c++;
                    if (initTg() || c > 30) clearInterval(t);
                  }, 50);
                }
              })();
            `,
          }}
        />
        <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" as="style" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body className="bg-[#040d1a] text-slate-100 antialiased min-h-screen">
        <LanguageProvider>
          {children}
          <TelegramAutoLogin />
          <TelegramFloat />
          <BottomNav />
          <AppUpdateNotifier />
          <FirstTimeLanguageModal />
        </LanguageProvider>
      </body>
    </html>
  );
}
