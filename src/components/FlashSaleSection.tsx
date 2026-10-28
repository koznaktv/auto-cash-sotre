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
    const fetchPromos = async () => {
      try {
        const res = await fetch('/api/promotions', { cache: 'no-store' });
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
    const interval = setInterval(fetchPromos, 30_000); // Polling every 30s
    return () => {
      mounted = false;
      clearInterval(interval);
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
    <section className="relative my-6 rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-xl shadow-amber-950/20 backdrop-blur-sm">
      {/* Background ambient neon glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br from-amber-500/10 to-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-gradient-to-tl from-red-500/10 to-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar with title and live countdown */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-lg shadow-red-600/30 animate-pulse">
            <span className="text-lg">🔥</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-red-400 font-alkatip">
                {lang === 'ug' ? 'چەكلىك ۋاقىتلىق ئالاھىدە چوڭ ئېتىبار' : 'Limited-Time Flash Sale'}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-600/80 text-white shadow-sm shadow-red-500/50 uppercase tracking-wider">
                FLASH SALE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-alkatip">
              {lang === 'ug' ? 'پۇرسەت غەنىيمەت! ئەڭ ئەرزان تەننەرخ باھادا دەرھال كىرىدۇ' : 'Special wholesale rates, auto-delivery'}
            </p>
          </div>
        </div>

        {/* Live Countdown Box */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-amber-500/40 rounded-xl px-3 py-1.5 shadow-inner" dir="ltr">
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider mr-1">
            ⏳ {lang === 'ug' ? 'قالدۇق ۋاقىت' : 'Ends in'}:
          </span>
          <div className="flex items-center gap-1 font-mono text-sm font-bold text-amber-300">
            <span className="bg-amber-950/80 border border-amber-500/30 px-1.5 py-0.5 rounded text-white min-w-[28px] text-center">
              {pad(timeLeft.hours)}
            </span>
            <span className="text-amber-400 animate-ping">:</span>
            <span className="bg-amber-950/80 border border-amber-500/30 px-1.5 py-0.5 rounded text-white min-w-[28px] text-center">
              {pad(timeLeft.minutes)}
            </span>
            <span className="text-amber-400 animate-ping">:</span>
            <span className="bg-amber-950/80 border border-amber-500/30 px-1.5 py-0.5 rounded text-amber-400 min-w-[28px] text-center">
              {pad(timeLeft.seconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {promotions.map((promo) => {
          const matchedService = services.find((s) => s.id === promo.serviceId);
          const iconSrc = promo.serviceImage || matchedService?.image || '/images/default_app.png';

          return (
            <div
              key={promo.id}
              className="group relative flex flex-col justify-between bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3.5 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10"
            >
              {/* Discount Tag */}
              {promo.discountPercent > 0 && (
                <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                  -{promo.discountPercent}%
                </div>
              )}

              {/* Service header */}
              <div className="flex items-start gap-2.5 mb-2.5">
                <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-800">
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
                    <span className="text-[11px] text-slate-500 line-through font-mono">
                      ${formatSmartPrice(promo.regularPrice)}
                    </span>
                  )}
                  <span className="text-base font-extrabold text-amber-400 font-mono tracking-tight">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
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
