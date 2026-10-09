'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { ChevronRight, ChevronLeft, Sparkles, ExternalLink } from 'lucide-react';

interface PromoSlideData {
  id: string;
  category: string;
  image: string;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  badge: Record<Language, string>;
  linkText: Record<Language, string>;
  tag: Record<Language, string>;
}

const PROMO_SLIDES_DATA: PromoSlideData[] = [
  {
    id: 'slide-1',
    category: 'games',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    title: {
      ug: 'PUBG Mobile UC ۋە Royale Pass تولۇقلاش',
      ar: 'شحن شدات ببجي موبايل PUBG UC ورويال باس',
      en: 'PUBG Mobile UC & Royale Pass Instant Top-up',
    },
    subtitle: {
      ug: 'ئويۇنچى ID نومۇرىڭىز بىلەن 10 سېكۇنتتا بىۋاسىتە ھېساباتقا كىرىدۇ',
      ar: 'شحن فوري ومباشر إلى حسابك بالمعرف Player ID خلال ثوانٍ معدودة',
      en: 'Direct delivery to your game account via Player ID in seconds',
    },
    badge: {
      ug: 'ئەڭ قىزىق ئويۇن',
      ar: 'اللعبة الأكثر طلباً',
      en: 'Most Popular Game',
    },
    linkText: {
      ug: 'دەرھال قاچىلاش ⚡',
      ar: 'شحن فوري ⚡',
      en: 'Top-up Now ⚡',
    },
    tag: {
      ug: 'ئويۇن بۆلىكى',
      ar: 'قسم الألعاب',
      en: 'Games Section',
    },
  },
  {
    id: 'slide-2',
    category: 'ai',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
    title: {
      ug: 'ChatGPT Plus & Claude Pro ئايلىق / يىللىق',
      ar: 'اشتراكات ChatGPT Plus و Claude Pro الشهرية والسنوية',
      en: 'ChatGPT Plus & Claude Pro Subscriptions',
    },
    subtitle: {
      ug: 'GPT-4o Canvas، Claude 3.5 Sonnet چەكلىمىسىز يۇقىرى ئىقتىدار',
      ar: 'وصول غير محدود لأحدث نماذج الذكاء الاصطناعي GPT-4o و Claude 3.5',
      en: 'Unlimited access to GPT-4o, Claude 3.5 Sonnet & top AI models',
    },
    badge: {
      ug: 'سۈنئىي ئەقىل',
      ar: 'ذكاء اصطناعي',
      en: 'AI Premium',
    },
    linkText: {
      ug: 'ھېسابات ئېچىش 🤖',
      ar: 'تفعيل الحساب 🤖',
      en: 'Get Account 🤖',
    },
    tag: {
      ug: 'AI ئابۇنىتلىقى',
      ar: 'اشتراكات الذكاء الاصطناعي',
      en: 'AI Subscriptions',
    },
  },
  {
    id: 'slide-3',
    category: 'numbers',
    image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&auto=format&fit=crop&q=80',
    title: {
      ug: 'مەۋھۇم نومۇر (SMS) — Telegram, WhatsApp, TikTok',
      ar: 'أرقام وهمية لتفعيل تيليجرام وواتساب وتيك توك',
      en: 'Virtual Numbers (SMS) for Telegram & WhatsApp',
    },
    subtitle: {
      ug: 'خەلقئارالىق نومۇرلار بىلەن تىزىملىتىش، قىسقا ئۇچۇر كودىنى دەرھال تاپشۇرۇۋېلىش',
      ar: 'أرقام دولية مضمونة لاستقبال كود التحقق OTP بشكل فوري',
      en: 'International numbers for instant OTP verification and registration',
    },
    badge: {
      ug: 'مەۋھۇم نومۇر',
      ar: 'أرقام وهمية',
      en: 'Virtual Numbers',
    },
    linkText: {
      ug: 'نومۇر ئېلىش 📲',
      ar: 'شراء رقم 📲',
      en: 'Get Number 📲',
    },
    tag: {
      ug: 'OTP كاپالىتى',
      ar: 'ضمان التحقق OTP',
      en: 'Guaranteed OTP',
    },
  },
  {
    id: 'slide-4',
    category: 'cards',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    title: {
      ug: 'خەلقئارالىق مەۋھۇم ۋىزا كارتىلار (VCC) & Steam, Apple',
      ar: 'بطاقات دفع إلكتروني فيزا VCC وبطاقات ستيم وآبل',
      en: 'Virtual Visa Cards (VCC) & Steam, Apple Cards',
    },
    subtitle: {
      ug: 'چەتئەل ئەپلىرىگە پۇل تۆلەش، Google Play، PlayStation ۋە Steam كودلىرى',
      ar: 'دفع اشتراكات التطبيقات العالمية، وبطاقات بلايستيشن وجوجل بلاي',
      en: 'Pay for international services, Google Play, PlayStation & Steam',
    },
    badge: {
      ug: 'رەقەملىك كارتىلار',
      ar: 'بطاقات رقمية',
      en: 'Gift Cards & VCC',
    },
    linkText: {
      ug: 'كارتا تاللاش 💳',
      ar: 'اختر البطاقة 💳',
      en: 'Select Card 💳',
    },
    tag: {
      ug: 'كاپالەتلىك كود',
      ar: 'أكواد مضمونة',
      en: 'Verified Codes',
    },
  },
];

export default function PromoCarousel({ onSelectCategory }: { onSelectCategory?: (catId: string) => void }) {
  const { lang, isRTL } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % PROMO_SLIDES_DATA.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev === 0 ? PROMO_SLIDES_DATA.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % PROMO_SLIDES_DATA.length);
  };

  const slide = PROMO_SLIDES_DATA[currentIdx];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-amber-500/35 bg-[#061424] shadow-2xl group">
      {/* Background Image Banner */}
      <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden">
        <img
          src={slide.image}
          alt={slide.title[lang]}
          className="w-full h-full object-cover transition-all duration-700 scale-105 group-hover:scale-100 filter brightness-90"
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
          <div className="flex items-center justify-between">
            <span className="gold-badge text-[10px] sm:text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 font-alkatip">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>{slide.badge[lang]}</span>
            </span>
            <span className="text-[10px] sm:text-xs text-amber-200/90 font-alkatip font-bold bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {slide.tag[lang]}
            </span>
          </div>

          <div className="max-w-xl">
            <h3 className="font-ukij text-lg sm:text-2xl md:text-3xl font-extrabold text-white mb-2 leading-snug gold-text-glow">
              {slide.title[lang]}
            </h3>
            <p className="font-alkatip text-xs sm:text-sm text-amber-100/80 mb-4 line-clamp-2 leading-relaxed">
              {slide.subtitle[lang]}
            </p>

            <button
              onClick={() => onSelectCategory && onSelectCategory(slide.category)}
              className="gold-shimmer-btn px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer font-alkatip inline-flex items-center gap-1.5"
            >
              <span>{slide.linkText[lang]}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Prev / Next navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/80 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 transition opacity-80 group-hover:opacity-100 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/80 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 transition opacity-80 group-hover:opacity-100 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {PROMO_SLIDES_DATA.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`transition-all rounded-full cursor-pointer ${
              currentIdx === i
                ? 'w-6 h-2 bg-amber-400 shadow-md shadow-amber-400/50'
                : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
