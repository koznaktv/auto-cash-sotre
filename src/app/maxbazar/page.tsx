import { Metadata } from 'next';
import MaxBazarApp from '@/components/maxbazar/MaxBazarApp';

export const metadata: Metadata = {
  title: 'MAX-BAZAR | متجر ماكس بازار',
  description: 'MAX-BAZAR رەقەملىك بازىرى ۋە تېلېگرامما مىنى ئەپ مۇلازىمەت مەركىزى',
  icons: {
    icon: '/images/maxbazar_icon.png',
    apple: '/images/maxbazar_icon.png',
  },
};

export default function MaxBazarPage() {
  return <MaxBazarApp />;
}
