'use client';

import { useEffect } from 'react';

export default function HonorOfKingsPage() {
  useEffect(() => {
    window.location.replace('/honor-of-kings.html');
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-center p-4">
      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-sm font-bold text-purple-300">Honor of Kings ئەپىگە يۆتكىلىۋاتىدۇ...</p>
    </div>
  );
}
