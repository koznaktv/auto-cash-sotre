'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ActivePromotion } from '@/lib/promotionsDb';
import { useLanguage } from '@/context/LanguageContext';
import { Flame, Clock, Sparkles, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

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

  if (loading || promotions.length === 0) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <section className="relative my-3 sm:my-4">
      <Link
        href="/promotions"
        className="group relative block overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#141b29] via-[#091527] to-[#040e1b] p-3.5 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-amber-400 hover:shadow-[0_12px_40px_rgba(245,158,11,0.25)] active:scale-[0.99]"
      >
        {/* Soft Golden Laser Top Edge */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none" />

        {/* Ambient background glows */}
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-2.5 sm:gap-3">
          {/* Row 1: Header + Live Countdown Timer */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-md shadow-amber-500/30 shrink-0">
                <Flame className="w-4 h-4 text-white fill-white animate-pulse" />
              </span>
              <h3 className="font-alkatip text-sm sm:text-base font-black text-amber-200 truncate">
                {lang === 'ug' ? 'بۈگۈنكى ئالاھىدە پائالىيەتلەر' : 'Today’s Flash Deals'}
              </h3>
              <span className="px-1.5 py-0.5 rounded-full bg-red-600/90 text-white text-[9px] font-black uppercase tracking-wider shrink-0 shadow-sm">
                FLASH SALE
              </span>
            </div>

            {/* Countdown pill */}
            {timeLeft && (
              <div className="flex items-center gap-1 rounded-lg border border-amber-400/40 bg-black/70 px-2 py-1 shadow-inner shrink-0" dir="ltr">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="font-mono text-[11px] sm:text-xs font-black text-amber-300">
                  {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                </span>
              </div>
            )}
          </div>

          {/* Row 2: Subtitle */}
          <p className="font-alkatip text-xs sm:text-sm text-slate-300/90 leading-relaxed">
            {lang === 'ug'
              ? 'چەكلىك ۋاقىتلىق ئالاھىدە تەننەرخ باھالار — غەنىيمەت پۇرسەتنى چىڭ تۇتۇپ تېز سېتىۋېلىڭ!'
              : 'Special discounted prices for a limited time — enter to buy before expiration!'}
          </p>

          {/* Row 3: Full Width Sleek Action Bar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
            <div className="flex items-center gap-1.5 text-xs text-amber-300/90 font-bold font-alkatip">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {promotions.length} {lang === 'ug' ? 'تۈردە چوڭ ئېتىبار كۈتۈپ تۇرماقتا' : 'special discounts available'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform font-alkatip shrink-0">
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
