'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
        fetchPromos();
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
        className="group relative block overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#0b172a] to-[#081220] p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(245,158,11,0.15)] transition-all duration-300 hover:border-amber-400 hover:shadow-[0_12px_40px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 active:scale-[0.99]"
      >
        {/* Glow backdrop fx */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-amber-500/20 to-red-600/10 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-gradient-to-tr from-cyan-500/15 to-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left / Info Side */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Pulsing Flame Icon Avatar */}
            <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 shadow-[0_0_20px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform">
              <Flame className="h-6 w-6 sm:h-7 sm:w-7 text-white fill-amber-200 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 ring-2 ring-slate-900 text-[9px] font-bold text-white">
                %
              </div>
            </div>

            {/* Titles & Description */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-alkatip text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-orange-400">
                  {lang === 'ug' ? 'بۈگۈنكى پائالىيەتلەر' : 'Today’s Special Deals'}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/50 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
                  FLASH SALE
                </span>
              </div>
              <p className="mt-0.5 font-alkatip text-xs sm:text-sm text-slate-300 line-clamp-1">
                {lang === 'ug'
                  ? 'چەكلىك ۋاقىتلىق ئالاھىدە ئېتىبار باھالار — غەنىيمەت پۇرسەتنى چىڭ تۇتۇڭ!'
                  : 'Exclusive wholesale rates for a limited time — grab them before they expire!'}
              </p>
            </div>
          </div>

          {/* Right / Countdown & Action Button Side */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto border-t md:border-t-0 border-amber-500/20 pt-2 md:pt-0">
            {/* Live Timer Pill */}
            {timeLeft && (
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-black/60 px-2.5 py-1.5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)] backdrop-blur-md">
                <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black text-amber-300" dir="ltr">
                  <span>{pad(timeLeft.hours)}</span>:
                  <span>{pad(timeLeft.minutes)}</span>:
                  <span className="text-orange-400">{pad(timeLeft.seconds)}</span>
                </div>
              </div>
            )}

            {/* Glowing CTA Button */}
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all group-hover:brightness-110 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] font-alkatip shrink-0">
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>{lang === 'ug' ? 'كىرىپ كۆرۈش' : 'View Deals'}</span>
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* Featured Mini Thumbnails Preview */}
        {promotions.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-amber-400/80 font-alkatip shrink-0">
                {lang === 'ug' ? 'قاتناشقان ئەپلەر:' : 'Featured:'}
              </span>
              <div className="flex items-center -space-x-1.5 overflow-hidden">
                {promotions.slice(0, 5).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="relative h-6 w-6 rounded-full border border-amber-400/50 bg-slate-800 overflow-hidden shrink-0 shadow-sm"
                    title={p.serviceName}
                  >
                    <Image
                      src={p.serviceImage || '/images/default_app.png'}
                      alt={p.serviceName}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-400 font-alkatip">
                {promotions.length} {lang === 'ug' ? 'ئالاھىدە تۈر' : 'active deals'}
              </span>
              <span className="text-amber-400 text-xs font-bold">⚡️</span>
            </div>
          </div>
        )}
      </Link>
    </section>
  );
}
