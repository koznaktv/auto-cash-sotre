'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ActivePromotion } from '@/lib/promotionsDb';
import { useLanguage } from '@/context/LanguageContext';
import { Flame, Sparkles, ChevronLeft, ChevronRight, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import FlipCountdownClock from './FlipCountdownClock';

export default function TodayPromotionsBanner() {
  const { lang, isRTL } = useLanguage();
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    let bc: BroadcastChannel | null = null;

    const fetchPromos = async () => {
      try {
        const res = await fetch(`/api/promotions?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.success && Array.isArray(data.promotions)) {
            setPromotions(data.promotions);
          }
        }
      } catch (err) {
        console.warn('Failed to load promos banner:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPromos();
    const interval = setInterval(fetchPromos, 15_000);

    try {
      bc = new BroadcastChannel('autocash_promotions_channel');
      bc.onmessage = () => {
        if (mounted) fetchPromos();
      };
    } catch {}

    return () => {
      mounted = false;
      clearInterval(interval);
      try {
        bc?.close();
      } catch {}
    };
  }, []);

  const targetEndTimestamp = useMemo(() => {
    if (promotions.length === 0) return 0;
    const timestamps = promotions
      .map((p) => new Date(p.endsAt).getTime())
      .filter((t) => t > Date.now());
    return timestamps.length > 0 ? Math.min(...timestamps) : 0;
  }, [promotions]);

  useEffect(() => {
    if (!targetEndTimestamp) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = targetEndTimestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [targetEndTimestamp]);

  if (loading || promotions.length === 0 || !timeLeft) {
    return null;
  }

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="max-w-[1200px] mx-auto px-3.5 sm:px-4 my-3 sm:my-4">
      <Link
        href="/promotions"
        className="group relative block overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-amber-500/60 dark:border-amber-400/50 bg-gradient-to-br from-[#1c1206] via-[#0d1627] to-[#040e1b] p-3.5 sm:p-5 shadow-[0_12px_36px_rgba(245,158,11,0.22)] transition-all duration-300 hover:border-amber-400 hover:shadow-[0_16px_45px_rgba(245,158,11,0.35)] active:scale-[0.99] animate-flame-glow-box"
      >
        {/* Ambient background glows */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Laser Top Shimmer Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
          
          {/* Header Info: Flame Avatar & Texts */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Pulsing Flame Icon Avatar */}
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 text-white shadow-lg shadow-amber-500/35 shrink-0 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 fill-amber-100 animate-icon-sparkle drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-[8px] sm:text-[9px] font-black text-white border border-white/40 shadow-xs animate-pulse">
                VIP
              </span>
            </div>

            <div className="flex flex-col items-center sm:items-start text-center sm:text-right">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h3 className="font-alkatip text-sm sm:text-lg font-black text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {lang === 'ug' ? 'بۈگۈنكى ئالاھىدە پائالىيەتلەر' : 'Today’s Flash Deals'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                  FLASH SALE
                </span>
              </div>
              <p className="font-alkatip text-[11px] sm:text-xs text-amber-200/90 mt-1 line-clamp-1">
                {lang === 'ug'
                  ? '⚡️ چەكلىك ۋاقىتلىق ئالاھىدە تەننەرخ باھالار — ۋاقتى توشقاندا ئەسلى باھاسىغا قايتىدۇ!'
                  : '⚡️ Limited-time discounts: prices will revert to normal once timer ends!'}
              </p>
            </div>
          </div>

          {/* Luxury 3D Flip Clock & CTA Button */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
            {/* The 3D Mechanical Split-Flap Flip Clock */}
            <div className="p-1.5 sm:p-2 rounded-2xl bg-black/60 border border-amber-400/40 shadow-inner">
              <FlipCountdownClock
                hours={timeLeft.hours}
                minutes={timeLeft.minutes}
                seconds={timeLeft.seconds}
                lang={lang}
                size="md"
                showLabels={true}
              />
            </div>

            {/* Action Pill Button matching Image 3 */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-lg shadow-amber-500/30 group-hover:scale-105 active:scale-95 transition-all font-alkatip shrink-0 cursor-pointer">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{lang === 'ug' ? 'پائالىيەتكە كىرىش' : 'Enter Deals'}</span>
              <ArrowIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

        </div>
      </Link>
    </section>
  );
}
