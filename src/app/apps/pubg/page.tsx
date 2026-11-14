'use client';

import { useEffect } from 'react';

export default function PubgPage() {
  useEffect(() => {
    window.location.replace('/pubg.html');
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-center p-4">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-sm font-bold text-amber-300">PUBG Mobile ئەپىگە يۆتكىلىۋاتىدۇ...</p>
    </div>
  );
}
