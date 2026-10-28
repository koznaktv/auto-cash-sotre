'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { ActivePromotion } from '@/lib/promotionsDb';
import { ServiceItem } from '@/lib/data';
import { formatSmartPrice } from '@/lib/formatMoney';

interface FlashSaleSectionProps {
  services: ServiceItem[];
  onSelectPackage?: (service: ServiceItem, packageId: string) => void;
  lang?: string;
}

export default function FlashSaleSection({
  services,
  onSelectPackage,
  lang = 'ug',
}: FlashSaleSectionProps) {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  // Fetch active promotions
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
        console.warn('Failed to load promotions:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPromos();
    const interval = setInterval(fetchPromos, 15_000); // Polling every 15s

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

  // Earliest deadline among active promos
  const targetEndTimestamp = useMemo(() => {
    if (promotions.length === 0) return 0;
    const timestamps = promotions
      .map((p) => new Date(p.endsAt).getTime())
      .filter((t) => t > Date.now());
    return timestamps.length > 0 ? Math.min(...timestamps) : 0;
  }, [promotions]);

  // Live countdown timer ticking every 1000ms
  useEffect(() => {
    if (!targetEndTimestamp) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = targetEndTimestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        // Refresh promotions when timer expires
        setPromotions((prev) => prev.filter((p) => new Date(p.endsAt).getTime() > Date.now()));
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

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="relative my-3 sm:my-5 rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-950 p-3 sm:p-5 shadow-xl shadow-amber-950/20 backdrop-blur-sm">
      {/* Background ambient neon glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br from-amber-500/10 to-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-gradient-to-tl from-red-500/10 to-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar with title and live countdown */}
      <div className="relative flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-lg shadow-red-600/30 animate-pulse">
            <span className="text-base sm:text-lg">🔥</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-red-400 font-alkatip">
                {lang === 'ug' ? 'چەكلىك ۋاقىتلىق ئالاھىدە چوڭ ئېتىبار' : 'Limited-Time Flash Sale'}
              </h2>
              <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full bg-red-600/80 text-white shadow-sm shadow-red-500/50 uppercase tracking-wider">
                FLASH SALE
              </span>
              <span className="sm:hidden text-[10px] text-amber-400/80 font-alkatip font-bold flex items-center gap-1">
                <span>↔️ سىيرىڭ</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-alkatip hidden sm:block">
              {lang === 'ug' ? 'پۇرسەت غەنىيمەت! ئەڭ ئەرزان تەننەرخ باھادا دەرھال كىرىدۇ' : 'Special wholesale rates, auto-delivery'}
            </p>
          </div>
        </div>

        {/* Luxury Grand VIP Countdown Clock */}
        <div className="relative flex items-center gap-2.5 sm:gap-3.5 bg-gradient-to-r from-zinc-950 via-amber-950/40 to-black border border-amber-400/50 rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2.5 shadow-[0_0_25px_rgba(245,158,11,0.25)] backdrop-blur-md ml-auto">
          {/* Subtle gold specular reflection */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />

          {/* RTL Label Side */}
          <div className="flex flex-col items-start gap-0.5 text-right font-alkatip">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] sm:text-xs shadow-[0_0_10px_rgba(245,158,11,0.4)] animate-pulse">
                ⏳
              </span>
              <span className="text-amber-200 text-[11px] sm:text-sm font-black tracking-wide">
                {lang === 'ug' ? 'قالدۇق ۋاقىت' : 'Sale Ends In'}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-amber-400/80 font-mono tracking-wider hidden sm:inline-block">
              ⚡️ {lang === 'ug' ? 'چەكلىك ئېتىبار' : 'LIMITED TIME'}
            </span>
          </div>

          <div className="h-7 sm:h-9 w-px bg-gradient-to-b from-transparent via-amber-400/50 to-transparent mx-0.5 sm:mx-1" />

          {/* LTR Digital Flip Cards */}
          <div className="flex items-center gap-1.5 sm:gap-2" dir="ltr">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="relative min-w-[34px] sm:min-w-[46px] h-8 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-b from-zinc-900 via-stone-950 to-black border border-amber-400/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center px-1">
                <span className="font-mono text-xs sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]">
                  {pad(timeLeft.hours)}
                </span>
                <div className="absolute top-0 inset-x-0 h-px bg-amber-200/50 rounded-t-lg sm:rounded-t-xl" />
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-amber-300/90 font-alkatip mt-0.5">
                {lang === 'ug' ? 'سائەت' : 'HRS'}
              </span>
            </div>

            {/* Pulsing separator */}
            <span className="text-amber-400 font-mono font-black text-xs sm:text-lg animate-pulse -mt-2.5 sm:-mt-4">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="relative min-w-[34px] sm:min-w-[46px] h-8 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-b from-zinc-900 via-stone-950 to-black border border-amber-400/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center px-1">
                <span className="font-mono text-xs sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]">
                  {pad(timeLeft.minutes)}
                </span>
                <div className="absolute top-0 inset-x-0 h-px bg-amber-200/50 rounded-t-lg sm:rounded-t-xl" />
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-amber-300/90 font-alkatip mt-0.5">
                {lang === 'ug' ? 'مىنۇت' : 'MIN'}
              </span>
            </div>

            {/* Pulsing separator */}
            <span className="text-amber-400 font-mono font-black text-xs sm:text-lg animate-pulse -mt-2.5 sm:-mt-4">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="relative min-w-[34px] sm:min-w-[46px] h-8 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-b from-zinc-900 via-stone-950 to-black border border-amber-400/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center px-1">
                <span className="font-mono text-xs sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-orange-400 to-amber-500 drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]">
                  {pad(timeLeft.seconds)}
                </span>
                <div className="absolute top-0 inset-x-0 h-px bg-amber-200/50 rounded-t-lg sm:rounded-t-xl" />
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-amber-300/90 font-alkatip mt-0.5">
                {lang === 'ug' ? 'سېكۇنت' : 'SEC'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Promotions List: Responsive horizontal reel on mobile, 2-4 cols grid on desktop */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-x-visible pb-2 pt-0.5 -mx-1 px-1 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-none">
        {promotions.map((promo) => {
          const matchedService = services.find((s) => s.id === promo.serviceId);
          const iconSrc = promo.serviceImage || matchedService?.image || '/images/default_app.png';

          return (
            <div
              key={promo.id}
              className="group relative flex flex-col justify-between bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3 sm:p-3.5 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10 w-[220px] sm:w-auto shrink-0 sm:shrink snap-start"
            >
              {/* Discount Tag */}
              {promo.discountPercent > 0 && (
                <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                  -{promo.discountPercent}%
                </div>
              )}

              {/* Service header */}
              <div className="flex items-start gap-2.5 mb-2.5">
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-800">
                  <Image
                    src={iconSrc}
                    alt={promo.serviceName}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-300 truncate" title={promo.serviceName}>
                    {promo.serviceName}
                  </h4>
                  <p className="text-xs font-bold text-white truncate font-alkatip mt-0.5" title={promo.packageTitle}>
                    {promo.packageTitle}
                  </p>
                </div>
              </div>

              {/* Pricing & CTA */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                <div className="flex flex-col" dir="ltr">
                  {promo.regularPrice > promo.promoPrice && (
                    <span className="text-[10px] sm:text-[11px] text-slate-500 line-through font-mono">
                      ${formatSmartPrice(promo.regularPrice)}
                    </span>
                  )}
                  <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono tracking-tight">
                    ${formatSmartPrice(promo.promoPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (matchedService && onSelectPackage) {
                      onSelectPackage(matchedService, promo.packageId);
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
                >
                  <span>⚡️</span>
                  <span>{lang === 'ug' ? 'سېتىۋېلىش' : 'Buy Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
