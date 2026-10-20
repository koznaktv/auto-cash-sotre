'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { ChevronRight, ChevronLeft, Sparkles, ExternalLink } from 'lucide-react';
import { DEFAULT_PROMO_SLIDES, PromoSlideData } from '@/lib/bannersData';

function getFieldText(field: Record<string, string> | string | undefined, lang: Language): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field['ug'] || field['en'] || field['ar'] || Object.values(field)[0] || '';
}

function extractMovingEmoji(text: string): { emoji: string | null; cleanText: string } {
  if (!text) return { emoji: null, cleanText: '' };
  const emojiMatch = text.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖|📲|💳)\s*/);
  if (emojiMatch) {
    return {
      emoji: emojiMatch[1],
      cleanText: text.substring(emojiMatch[0].length).trim(),
    };
  }
  return { emoji: null, cleanText: text };
}

export default function PromoCarousel({ onSelectCategory }: { onSelectCategory?: (catId: string) => void }) {
  const { lang, isRTL } = useLanguage();
  const [slides, setSlides] = useState<PromoSlideData[]>(DEFAULT_PROMO_SLIDES);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Fetch real-time customized banners from API
  useEffect(() => {
    let active = true;
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners', { cache: 'no-store' });
        const data = await res.json();
        if (active && data.success && Array.isArray(data.banners) && data.banners.length > 0) {
          setSlides(data.banners);
        }
      } catch (e) {
        // Fallback to default presets silently
      }
    };

    fetchBanners();
    return () => {
      active = false;
    };
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  if (!slides || slides.length === 0) return null;

  const validIdx = currentIdx < slides.length ? currentIdx : 0;
  const slide = slides[validIdx];

  const titleText = getFieldText(slide.title, lang);
  const subtitleText = getFieldText(slide.subtitle, lang);
  const rawBadge = getFieldText(slide.badge, lang);
  const rawTag = getFieldText(slide.tag, lang);
  const linkText = getFieldText(slide.linkText, lang) || 'تېخىمۇ كۆپ ⚡';

  const { emoji: badgeEmoji, cleanText: badgeText } = extractMovingEmoji(rawBadge);
  const { emoji: tagEmoji, cleanText: tagText } = extractMovingEmoji(rawTag);

  const handleActionClick = () => {
    if (slide.targetUrl) {
      if (slide.targetUrl.startsWith('http')) {
        window.open(slide.targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = slide.targetUrl;
      }
      return;
    }
    if (onSelectCategory && slide.category) {
      onSelectCategory(slide.category);
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-amber-500/35 bg-[#061424] shadow-2xl group select-none">
      {/* Background Image Banner */}
      <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden">
        <img
          src={slide.image}
          alt={titleText}
          className="w-full h-full object-cover transition-all duration-700 scale-105 group-hover:scale-100 filter brightness-90"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200';
          }}
        />
        {/* Gradient Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-${
            isRTL ? 'r' : 'l'
          } from-[#040d1a] via-[#040d1a]/85 to-transparent`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040d1a] via-transparent to-transparent" />

        {/* Content Box */}
        <div
          className={`absolute inset-0 p-5 sm:p-8 flex flex-col justify-between z-10 ${
            isRTL ? 'text-right' : 'text-left'
          }`}
        >
          {/* Top Badges with Animated Moving Emojis */}
          <div className="flex items-center justify-between gap-2">
            {rawBadge && (
              <span className="gold-badge text-[10px] sm:text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 font-alkatip shadow-md">
                <span className="animate-moving-icon inline-block text-xs sm:text-sm">
                  {badgeEmoji || <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
                </span>
                <span>{badgeText || rawBadge}</span>
              </span>
            )}
            {rawTag && (
              <span className="text-[10px] sm:text-xs text-amber-200 font-alkatip font-bold bg-slate-900/85 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shadow-sm">
                {tagEmoji && <span className="animate-moving-icon inline-block">{tagEmoji}</span>}
                <span>{tagText || rawTag}</span>
              </span>
            )}
          </div>

          {/* Title, Subtitle, and Call-to-Action Button */}
          <div className="max-w-xl">
            <h3 className="font-ukij text-lg sm:text-2xl md:text-3xl font-extrabold text-white mb-2 leading-snug gold-text-glow line-clamp-2">
              {titleText}
            </h3>
            {subtitleText && (
              <p className="font-alkatip text-xs sm:text-sm text-amber-100/85 mb-4 line-clamp-2 leading-relaxed">
                {subtitleText}
              </p>
            )}

            <button
              onClick={handleActionClick}
              className="gold-shimmer-btn px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer font-alkatip inline-flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <span>{linkText}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Prev / Next navigation buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/80 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 transition opacity-80 group-hover:opacity-100 cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/80 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 transition opacity-80 group-hover:opacity-100 cursor-pointer shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all rounded-full cursor-pointer ${
                  validIdx === i
                    ? 'w-6 h-2 bg-amber-400 shadow-md shadow-amber-400/50'
                    : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
