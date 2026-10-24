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
      {/* Ambient Blurred Background from Slide Image */}
      <img
        src={slide.image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-25 scale-125 transition-all duration-700"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200';
        }}
      />

      {/* Atmospheric Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#040d1a]/95 via-[#061424]/90 to-[#040d1a]/95" />
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Foreground Container: Image & Text visible together */}
      <div
        className={`relative z-10 flex items-center justify-between gap-3 sm:gap-6 md:gap-8 p-4 sm:p-7 md:p-8 min-h-[210px] sm:min-h-[250px] md:min-h-[280px] ${
          isRTL ? 'flex-row text-right' : 'flex-row text-left'
        }`}
      >
        {/* Text & Content Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          {/* Top Badges with Animated Moving Emojis */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {rawBadge && (
              <span className="gold-badge text-[9px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-1.5 font-alkatip shadow-md shrink-0">
                <span className="animate-moving-icon inline-block text-xs sm:text-sm">
                  {badgeEmoji || <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
                </span>
                <span>{badgeText || rawBadge}</span>
              </span>
            )}
            {rawTag && (
              <span className="text-[9px] sm:text-xs text-amber-200 font-alkatip font-bold bg-slate-900/85 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shadow-sm shrink-0">
                {tagEmoji && <span className="animate-moving-icon inline-block">{tagEmoji}</span>}
                <span>{tagText || rawTag}</span>
              </span>
            )}
          </div>

          {/* Title, Subtitle, and Call-to-Action Button */}
          <div className="max-w-xl">
            <h3 className="font-ukij text-sm sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white mb-1.5 sm:mb-2 leading-snug gold-text-glow line-clamp-2">
              {titleText}
            </h3>
            {subtitleText && (
              <p className="font-alkatip text-[11px] sm:text-xs md:text-sm text-amber-100/80 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                {subtitleText}
              </p>
            )}

            <div>
              <button
                onClick={handleActionClick}
                className="gold-shimmer-btn px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-black transition-all cursor-pointer font-alkatip inline-flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                <span>{linkText}</span>
                <ExternalLink className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Prominent Image Showcase Card (Always clearly visible together with text) */}
        <div className="shrink-0 flex items-center justify-center">
          <div
            onClick={handleActionClick}
            className="relative w-24 h-24 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-60 lg:h-60 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-2xl shadow-amber-500/20 group-hover:border-amber-400 transition-all duration-500 group-hover:scale-105 bg-[#08182b] cursor-pointer"
          >
            <img
              src={slide.image}
              alt={titleText}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-100"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200';
              }}
            />
            {/* Subtle Gradient Rim for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

            {/* Corner Tag */}
            <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-[8px] sm:text-[10px] text-amber-300 font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-md font-alkatip">
              ⚡ AUTO CASH
            </div>
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
