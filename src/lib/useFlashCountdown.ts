'use client';

import { useState, useEffect, useMemo } from 'react';
import { ActivePromotion } from './promotionsDb';

export function useFlashCountdown() {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
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
      }
    };

    fetchPromos();
    const interval = setInterval(fetchPromos, 20_000);

    try {
      bc = new BroadcastChannel('autocash_promotions_channel');
      bc.onmessage = () => fetchPromos();
    } catch {}

    return () => {
      mounted = false;
      clearInterval(interval);
      try {
        bc?.close();
      } catch {}
    };
  }, []);

  // Earliest deadline
  const targetEndTimestamp = useMemo(() => {
    if (promotions.length === 0) return 0;
    const timestamps = promotions
      .map((p) => new Date(p.endsAt).getTime())
      .filter((t) => t > Date.now());
    return timestamps.length > 0 ? Math.min(...timestamps) : 0;
  }, [promotions]);

  // Live second-by-second ticking
  useEffect(() => {
    if (!targetEndTimestamp) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = targetEndTimestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
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

  return { promotions, timeLeft };
}
