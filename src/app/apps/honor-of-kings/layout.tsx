import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Honor of Kings Token بازىرى - MAX-BAZAR',
  description: 'Honor of Kings Token بىۋاسىتە قاچىلاش ئەپى',
  manifest: '/manifest-hok.json',
  icons: {
    icon: '/images/apps/honor-of-kings/icon-512.png',
    shortcut: '/images/apps/honor-of-kings/icon-192.png',
    apple: '/images/apps/honor-of-kings/icon-512.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HOK Store',
  },
};

export default function HokLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="manifest" href="/manifest-hok.json" />
      <link rel="apple-touch-icon" href="/images/apps/honor-of-kings/icon-512.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="HOK Store" />
      <meta name="application-name" content="HOK Store" />
      <meta name="theme-color" content="#0F172A" />
      {children}
    </>
  );
}
