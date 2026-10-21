import React from 'react';

interface LanguageFlagProps {
  code: string;
  className?: string;
}

export default function LanguageFlag({ code, className = 'w-4 h-3 rounded-[3px] object-cover shrink-0 shadow-sm inline-block' }: LanguageFlagProps) {
  switch (code) {
    case 'ug':
      return (
        <span className="text-sm shrink-0 leading-none select-none" role="img" aria-label="Uyghur">
          🌙
        </span>
      );

    case 'tr':
      // Turkey Flag SVG
      return (
        <svg className={className} viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="800" fill="#E30A17" />
          <circle cx="425" cy="400" r="200" fill="#ffffff" />
          <circle cx="475" cy="400" r="160" fill="#E30A17" />
          <polygon
            fill="#ffffff"
            points="583.3,400 706.7,440.1 630.5,335.2 630.5,464.8 706.7,359.9"
          />
        </svg>
      );

    case 'en':
      // UK Flag (Union Jack) SVG
      return (
        <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="s">
            <path d="M0,0 v30 h60 v-30 z" />
          </clipPath>
          <clipPath id="t">
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <g clipPath="url(#s)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      );

    case 'ar':
      // Saudi Arabia / Arabic Flag SVG
      return (
        <svg className={className} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
          <rect width="900" height="600" fill="#006C35" />
          {/* Stylized Arabic calligraphy representation */}
          <path
            d="M 220 280 Q 300 230 450 250 T 680 270 Q 640 290 450 285 T 220 280 Z"
            fill="#ffffff"
          />
          <path
            d="M 260 230 Q 350 210 500 215 T 640 235 Q 580 245 450 240 T 260 230 Z"
            fill="#ffffff"
          />
          {/* Saudi Arabian Sword */}
          <path
            d="M 230 365 L 640 365 L 670 360 L 670 370 L 640 370 L 250 370 L 250 380 L 235 380 L 235 355 L 250 355 L 250 365 Z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'uz':
      // Uzbekistan Flag SVG
      return (
        <svg className={className} viewBox="0 0 500 250" xmlns="http://www.w3.org/2000/svg">
          <rect width="500" height="80" fill="#0099B5" />
          <rect y="80" width="500" height="5" fill="#CE1126" />
          <rect y="85" width="500" height="80" fill="#ffffff" />
          <rect y="165" width="500" height="5" fill="#CE1126" />
          <rect y="170" width="500" height="80" fill="#1EB53A" />
          {/* Crescent */}
          <circle cx="50" cy="40" r="22" fill="#ffffff" />
          <circle cx="58" cy="40" r="18" fill="#0099B5" />
          {/* Stars */}
          <circle cx="95" cy="25" r="3" fill="#ffffff" />
          <circle cx="110" cy="25" r="3" fill="#ffffff" />
          <circle cx="125" cy="25" r="3" fill="#ffffff" />
          <circle cx="110" cy="40" r="3" fill="#ffffff" />
          <circle cx="125" cy="40" r="3" fill="#ffffff" />
          <circle cx="125" cy="55" r="3" fill="#ffffff" />
        </svg>
      );

    case 'ru':
      // Russia Flag SVG
      return (
        <svg className={className} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
          <rect width="900" height="600" fill="#d52b1e" />
          <rect width="900" height="400" fill="#0039a6" />
          <rect width="900" height="200" fill="#ffffff" />
        </svg>
      );

    default:
      return <span className="text-xs">🌐</span>;
  }
}
