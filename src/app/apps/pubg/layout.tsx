import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PUBG Mobile UC Store - MAX-BAZAR',
  description: 'PUBG Mobile UC تېز قاچىلاش ۋە Royale Pass رەسمىي ئەپى',
  manifest: '/manifest-pubg.json',
  icons: {
    icon: '/images/apps/pubg/icon-512.png',
    shortcut: '/images/apps/pubg/icon-192.png',
    apple: '/images/apps/pubg/icon-512.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PUBG UC',
  },
};

export default function PubgLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="manifest" href="/manifest-pubg.json" />
      <link rel="apple-touch-icon" href="/images/apps/pubg/icon-512.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="PUBG UC" />
      <meta name="application-name" content="PUBG UC" />
      <meta name="theme-color" content="#0B101D" />
      {children}
    </>
  );
}
