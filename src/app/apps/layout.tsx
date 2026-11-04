import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MAX-BAZAR ئەپ بازىرى - تاللاپ قاچىلاش مەركىزى',
  description: 'MAX-BAZAR رەسمىي ئەپ بازىرى',
  manifest: '/manifest-apps.json',
  icons: {
    icon: '/images/maxbazar_hd_logo.png',
    shortcut: '/images/maxbazar_icon.png',
    apple: '/images/maxbazar_icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MAX-BAZAR',
  },
};

export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="manifest" href="/manifest-apps.json" />
      <link rel="apple-touch-icon" href="/images/maxbazar_icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="MAX-BAZAR" />
      <meta name="application-name" content="MAX-BAZAR" />
      <meta name="theme-color" content="#0F172A" />
      {children}
    </>
  );
}
