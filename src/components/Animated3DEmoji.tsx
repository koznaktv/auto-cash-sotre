'use client';

import React from 'react';

export type EmojiType =
  | 'crown'
  | 'diamond'
  | 'coin'
  | 'zap'
  | 'fire'
  | 'check'
  | 'wave'
  | 'card'
  | 'bag'
  | 'rocket'
  | 'shield';

interface Animated3DEmojiProps {
  type: EmojiType;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Animated3DEmoji({
  type,
  size = 24,
  className = '',
  style = {},
}: Animated3DEmojiProps) {
  // Styles for hardware-accelerated 3D transforms
  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    verticalAlign: 'middle',
    userSelect: 'none',
    perspective: 800,
    transformStyle: 'preserve-3d',
    flexShrink: 0,
    ...style,
  };

  switch (type) {
    // =========================================================================
    // 1. 3D GOLDEN VIP CROWN 👑
    // =========================================================================
    case 'crown':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D VIP Crown"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.55)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dFloat 3.2s ease-in-out infinite, emoji3dShine 4s linear infinite',
            }}
          >
            <defs>
              <linearGradient id="goldBase" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF4D0" />
                <stop offset="25%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="75%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id="goldRim" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#92400E" />
                <stop offset="30%" stopColor="#FDE68A" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <radialGradient id="rubyGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF6B8B" />
                <stop offset="40%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </radialGradient>
              <radialGradient id="gemEmerald" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#A7F3D0" />
                <stop offset="40%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#064E3B" />
              </radialGradient>
              <radialGradient id="gemSapphire" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#BAE6FD" />
                <stop offset="40%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#0C4A6E" />
              </radialGradient>
              <filter id="crownGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>
            </defs>

            {/* Back rim shadow */}
            <ellipse cx="50" cy="74" rx="34" ry="7" fill="#78350F" opacity="0.6" />

            {/* Main Crown Body with 5 Peaks */}
            <path
              d="M16 68 L20 32 L36 50 L50 20 L64 50 L80 32 L84 68 Z"
              fill="url(#goldBase)"
              stroke="#FDE68A"
              strokeWidth="2"
              strokeLinejoin="round"
              filter="url(#crownGlow)"
            />

            {/* Facet Highlights */}
            <path d="M50 20 L50 68 L64 50 Z" fill="#FDE68A" opacity="0.35" />
            <path d="M50 20 L36 50 L50 68 Z" fill="#92400E" opacity="0.25" />
            <path d="M20 32 L36 50 L24 68 Z" fill="#FDE68A" opacity="0.4" />
            <path d="M80 32 L64 50 L76 68 Z" fill="#92400E" opacity="0.3" />

            {/* Front Arch Base Rim */}
            <path
              d="M16 68 C 28 78, 72 78, 84 68 C 84 76, 72 84, 50 84 C 28 84, 16 76, 16 68 Z"
              fill="url(#goldRim)"
              stroke="#FFF"
              strokeWidth="1.2"
            />

            {/* Crown Peak Spheres */}
            <circle cx="50" cy="18" r="6" fill="url(#rubyGlow)" stroke="#FFF" strokeWidth="1.5" />
            <circle cx="20" cy="30" r="5" fill="url(#gemSapphire)" stroke="#FFF" strokeWidth="1.2" />
            <circle cx="80" cy="30" r="5" fill="url(#gemSapphire)" stroke="#FFF" strokeWidth="1.2" />

            {/* Base Arch Embedded Jewels */}
            <circle cx="50" cy="76" r="4.2" fill="url(#rubyGlow)" stroke="#FDE68A" strokeWidth="1" />
            <circle cx="32" cy="74" r="3.2" fill="url(#gemEmerald)" stroke="#FDE68A" strokeWidth="0.8" />
            <circle cx="68" cy="74" r="3.2" fill="url(#gemEmerald)" stroke="#FDE68A" strokeWidth="0.8" />

            {/* Center Star Flare */}
            <polygon
              points="50,15 52,18 55,18 53,20 54,23 50,21 46,23 47,20 45,18 48,18"
              fill="#FFF"
              opacity="0.9"
            />
          </svg>
        </span>
      );

    // =========================================================================
    // 2. 3D GLOWING DIAMOND 💎
    // =========================================================================
    case 'diamond':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Glowing Diamond"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_14px_rgba(6,182,212,0.65)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dPulse 2.8s ease-in-out infinite, emoji3dFloat 3.5s ease-in-out infinite',
            }}
          >
            <defs>
              <linearGradient id="diaTable" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#A5F3FC" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <linearGradient id="diaFacetLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
              <linearGradient id="diaFacetRight" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="100%" stopColor="#0EA5E9" />
              </linearGradient>
              <linearGradient id="diaFacetBottom" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0369A1" />
                <stop offset="50%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#082F49" />
              </linearGradient>
            </defs>

            {/* Diamond Crown Table (Top) */}
            <polygon points="30,22 70,22 86,40 14,40" fill="url(#diaTable)" stroke="#FFF" strokeWidth="1" />

            {/* Star table reflection */}
            <polygon points="40,22 60,22 65,40 35,40" fill="#FFFFFF" opacity="0.6" />

            {/* Upper facets */}
            <polygon points="14,40 30,22 35,40" fill="url(#diaFacetLeft)" />
            <polygon points="70,22 86,40 65,40" fill="url(#diaFacetRight)" />

            {/* Lower Pavilion (Bottom V) */}
            <polygon points="14,40 35,40 50,86" fill="url(#diaFacetLeft)" />
            <polygon points="35,40 65,40 50,86" fill="url(#diaTable)" opacity="0.85" />
            <polygon points="65,40 86,40 50,86" fill="url(#diaFacetBottom)" />

            {/* Prism Gleam Line */}
            <line x1="14" y1="40" x2="86" y2="40" stroke="#FFFFFF" strokeWidth="1.8" />
            <line x1="35" y1="40" x2="50" y2="86" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
            <line x1="65" y1="40" x2="50" y2="86" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />

            {/* Sparkle Glint at top-right corner */}
            <polygon
              points="74,18 76,24 82,26 76,28 74,34 72,28 66,26 72,24"
              fill="#FFFFFF"
              opacity="0.95"
            />
          </svg>
        </span>
      );

    // =========================================================================
    // 3. 3D GOLDEN COIN 🪙
    // =========================================================================
    case 'coin':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Golden Coin"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_12px_rgba(234,179,8,0.6)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dCoinSpin 4s ease-in-out infinite, emoji3dFloat 3s ease-in-out infinite',
            }}
          >
            <defs>
              <linearGradient id="coinEdge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#78350F" />
                <stop offset="50%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <radialGradient id="coinFace" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="35%" stopColor="#F59E0B" />
                <stop offset="85%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#92400E" />
              </radialGradient>
              <linearGradient id="coinSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.0" />
                <stop offset="70%" stopColor="#FEF08A" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* 3D Coin Outer Rim / Thickness */}
            <circle cx="50" cy="54" r="42" fill="url(#coinEdge)" />
            <circle cx="50" cy="50" r="42" fill="url(#coinFace)" stroke="#FEF08A" strokeWidth="2.5" />

            {/* Inner Recessed Border */}
            <circle cx="50" cy="50" r="34" fill="none" stroke="#B45309" strokeWidth="2" strokeDasharray="5,2.5" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="#FDE68A" strokeWidth="1" />

            {/* Embossed Luxury Dollar / Currency Icon */}
            <text
              x="50"
              y="61"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="34"
              fontWeight="900"
              fill="#78350F"
              textAnchor="middle"
            >
              $
            </text>
            <text
              x="49"
              y="60"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="34"
              fontWeight="900"
              fill="#FEF08A"
              textAnchor="middle"
            >
              $
            </text>

            {/* Glossy Diagonal Specular Sweep */}
            <path
              d="M20 30 C 35 15, 65 15, 80 30 C 65 24, 35 24, 20 30 Z"
              fill="url(#coinSheen)"
            />
          </svg>
        </span>
      );

    // =========================================================================
    // 4. 3D NEON LIGHTNING ZAP ⚡
    // =========================================================================
    case 'zap':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Neon Lightning"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_0_14px_rgba(250,204,21,0.85)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dZapPulse 1.8s ease-in-out infinite',
            }}
          >
            <defs>
              <linearGradient id="zapGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#FEF08A" />
                <stop offset="70%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <filter id="zapAura">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Electric Halo */}
            <path
              d="M58 8 L24 52 L50 52 L36 92 L78 44 L52 44 Z"
              fill="rgba(250, 204, 21, 0.4)"
              filter="url(#zapAura)"
            />

            {/* Main 3D Bolt Body */}
            <path
              d="M58 10 L26 52 L50 52 L38 90 L76 46 L52 46 Z"
              fill="url(#zapGold)"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="miter"
            />

            {/* Core Superbright Lightning Streak */}
            <path
              d="M56 16 L34 50 L52 50 L42 80 L68 48 L52 48 Z"
              fill="#FFFFFF"
              opacity="0.8"
            />
          </svg>
        </span>
      );

    // =========================================================================
    // 5. 3D FLICKERING FIRE 🔥
    // =========================================================================
    case 'fire':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Flickering Fire"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_16px_rgba(239,68,68,0.7)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dFlame 1.9s ease-in-out infinite',
              transformOrigin: 'bottom center',
            }}
          >
            <defs>
              <linearGradient id="fireOuter" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#991B1B" />
                <stop offset="35%" stopColor="#DC2626" />
                <stop offset="70%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
              <linearGradient id="fireMid" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FDE047" />
              </linearGradient>
              <linearGradient id="fireCore" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>

            {/* Outer Flame Tongue */}
            <path
              d="M50 10 C 50 10, 68 34, 68 52 C 68 76, 56 88, 50 88 C 44 88, 20 76, 20 54 C 20 38, 34 26, 40 38 C 44 26, 50 10, 50 10 Z"
              fill="url(#fireOuter)"
            />
            {/* Secondary Right Tongue */}
            <path
              d="M50 20 C 58 35, 78 45, 78 62 C 78 78, 66 88, 50 88 C 66 82, 72 65, 62 52 C 58 45, 52 35, 50 20 Z"
              fill="url(#fireOuter)"
              opacity="0.8"
            />

            {/* Mid Flame Tongue */}
            <path
              d="M50 34 C 54 44, 62 52, 62 66 C 62 80, 54 86, 50 86 C 46 86, 32 80, 32 64 C 32 50, 42 44, 46 52 C 48 44, 50 34, 50 34 Z"
              fill="url(#fireMid)"
            />

            {/* White Hot Inner Heart */}
            <path
              d="M50 56 C 52 62, 56 66, 56 74 C 56 82, 52 84, 50 84 C 48 84, 42 82, 42 74 C 42 66, 46 62, 48 66 C 49 60, 50 56, 50 56 Z"
              fill="url(#fireCore)"
            />
          </svg>
        </span>
      );

    // =========================================================================
    // 6. 3D CELEBRATORY CHECKMARK ✅
    // =========================================================================
    case 'check':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Success Check"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_14px_rgba(16,185,129,0.7)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <defs>
              <linearGradient id="checkCircle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="checkGlint" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* 3D Sphere Base */}
            <circle cx="50" cy="50" r="42" fill="url(#checkCircle)" stroke="#A7F3D0" strokeWidth="2.5" />

            {/* Glossy Upper Dome Highlight */}
            <ellipse cx="50" cy="30" rx="30" ry="16" fill="url(#checkGlint)" />

            {/* Crisp 3D Beveled Checkmark */}
            <path
              d="M32 50 L44 64 L70 34"
              fill="none"
              stroke="#064E3B"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M32 48 L44 62 L70 32"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );

    // =========================================================================
    // 7. 3D WAVING HAND 👋
    // =========================================================================
    case 'wave':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Waving Hand"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)]"
            style={{
              animation: 'emoji3dWave 2s ease-in-out infinite',
              transformOrigin: '70% 85%',
            }}
          >
            <defs>
              <linearGradient id="handSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="40%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="handHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Palm & Wrist */}
            <path
              d="M35 55 C 30 45, 30 35, 40 30 C 45 28, 48 34, 48 40 L 48 24 C 48 18, 54 18, 56 24 L 56 22 C 56 16, 62 16, 64 22 L 64 25 C 64 20, 70 20, 72 26 L 72 50 C 72 65, 62 76, 50 78 L 44 86 L 34 82 L 40 70 C 35 66, 32 60, 35 55 Z"
              fill="url(#handSkin)"
              stroke="#B45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Thumb */}
            <path
              d="M38 52 C 32 48, 24 45, 26 38 C 28 32, 34 36, 40 44 Z"
              fill="url(#handSkin)"
              stroke="#B45309"
              strokeWidth="1.5"
            />

            {/* Fingernail / Knuckle Sheen */}
            <circle cx="48" cy="24" r="2.5" fill="#FFF" opacity="0.6" />
            <circle cx="56" cy="22" r="2.5" fill="#FFF" opacity="0.6" />
            <circle cx="64" cy="24" r="2.5" fill="#FFF" opacity="0.6" />
            <circle cx="72" cy="28" r="2.5" fill="#FFF" opacity="0.6" />

            {/* Motion Breeze Lines */}
            <path d="M18 20 C 14 26, 14 36, 18 42" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M24 14 C 20 22, 20 32, 24 38" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
          </svg>
        </span>
      );

    // =========================================================================
    // 8. 3D CYBER VIP CARD 💳
    // =========================================================================
    case 'card':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Cyber VIP Card"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_14px_rgba(99,102,241,0.55)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dFloat 3.4s ease-in-out infinite',
            }}
          >
            <defs>
              <linearGradient id="cardBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E1B4B" />
                <stop offset="40%" stopColor="#312E81" />
                <stop offset="80%" stopColor="#4338CA" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
              <linearGradient id="cardChip" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>

            {/* Card Body */}
            <rect x="12" y="24" width="76" height="52" rx="8" fill="url(#cardBody)" stroke="#818CF8" strokeWidth="2" />

            {/* Magnetic/Holo Stripe */}
            <rect x="12" y="34" width="76" height="10" fill="#0F172A" opacity="0.7" />

            {/* Gold EMV Chip */}
            <rect x="22" y="48" width="16" height="13" rx="2" fill="url(#cardChip)" stroke="#FFF" strokeWidth="0.8" />
            <line x1="22" y1="54" x2="38" y2="54" stroke="#78350F" strokeWidth="0.8" />
            <line x1="30" y1="48" x2="30" y2="61" stroke="#78350F" strokeWidth="0.8" />

            {/* Card Hologram Wave */}
            <path
              d="M44 54 C 55 48, 65 60, 78 52"
              stroke="#A5B4FC"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Contactless waves */}
            <path d="M72 62 A 5 5 0 0 1 72 68" stroke="#E0E7FF" strokeWidth="1.5" fill="none" />
            <path d="M75 60 A 8 8 0 0 1 75 70" stroke="#E0E7FF" strokeWidth="1.5" fill="none" />
          </svg>
        </span>
      );

    // =========================================================================
    // 9. 3D SHOPPING BAG 🛍️
    // =========================================================================
    case 'bag':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Shopping Bag"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_14px_rgba(236,72,153,0.55)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dFloat 3.1s ease-in-out infinite',
            }}
          >
            <defs>
              <linearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#BE185D" />
              </linearGradient>
            </defs>

            {/* Handles */}
            <path
              d="M38 34 C 38 18, 62 18, 62 34"
              fill="none"
              stroke="#FDE047"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Bag Body */}
            <path
              d="M24 34 L76 34 L82 82 C 82 86, 78 90, 74 90 L26 90 C 22 90, 18 86, 18 82 Z"
              fill="url(#bagGrad)"
              stroke="#FFF"
              strokeWidth="1.5"
            />

            {/* Fold & Sheen */}
            <path d="M24 34 L32 90" stroke="#BE185D" strokeWidth="1.5" opacity="0.5" />
            <path d="M76 34 L68 90" stroke="#BE185D" strokeWidth="1.5" opacity="0.5" />
            <ellipse cx="50" cy="40" rx="20" ry="4" fill="#FFFFFF" opacity="0.3" />
          </svg>
        </span>
      );

    // =========================================================================
    // 10. 3D ROCKET 🚀
    // =========================================================================
    case 'rocket':
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Rocket"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_16px_rgba(244,63,94,0.65)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dRocket 2.2s ease-in-out infinite',
            }}
          >
            <defs>
              <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
              <linearGradient id="rocketNose" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#9F1239" />
              </linearGradient>
            </defs>

            {/* Thruster Fire */}
            <path d="M30 70 L20 86 L36 78 Z" fill="#F59E0B" />
            <path d="M24 74 L14 94 L32 82 Z" fill="#EF4444" />
            <path d="M26 76 L20 88 L30 82 Z" fill="#FFF" />

            {/* Wings */}
            <path d="M26 48 L16 68 L36 64 Z" fill="url(#rocketNose)" stroke="#FFF" strokeWidth="1" />
            <path d="M52 24 L72 44 L56 48 Z" fill="url(#rocketNose)" stroke="#FFF" strokeWidth="1" />

            {/* Rocket Hull */}
            <path
              d="M72 16 C 55 18, 32 38, 30 64 L 40 74 C 66 72, 86 49, 88 32 C 88 20, 80 14, 72 16 Z"
              fill="url(#rocketBody)"
              stroke="#FFF"
              strokeWidth="1.5"
            />

            {/* Nose Cone */}
            <path d="M72 16 C 80 14, 88 20, 88 32 L 76 44 L 60 28 Z" fill="url(#rocketNose)" />

            {/* Porthole */}
            <circle cx="56" cy="42" r="7" fill="#0284C7" stroke="#FFF" strokeWidth="2" />
            <circle cx="54" cy="40" r="2.5" fill="#FFF" opacity="0.8" />
          </svg>
        </span>
      );

    // =========================================================================
    // 11. 3D SECURITY SHIELD 🛡️
    // =========================================================================
    case 'shield':
    default:
      return (
        <span
          className={`relative group inline-block ${className}`}
          style={containerStyle}
          aria-label="3D Security Shield"
        >
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_14px_rgba(59,130,246,0.6)] transition-transform duration-300 hover:scale-110"
            style={{
              animation: 'emoji3dPulse 3s ease-in-out infinite',
            }}
          >
            <defs>
              <linearGradient id="shieldBase" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="40%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
            </defs>

            {/* Shield Outline */}
            <path
              d="M50 14 C 68 22, 84 22, 84 34 C 84 66, 68 84, 50 90 C 32 84, 16 66, 16 34 C 16 22, 32 22, 50 14 Z"
              fill="url(#shieldBase)"
              stroke="#93C5FD"
              strokeWidth="2.5"
            />

            {/* Left/Right Facet Division */}
            <path
              d="M50 14 L50 90 C 68 84, 84 66, 84 34 C 84 22, 68 22, 50 14 Z"
              fill="#FFFFFF"
              opacity="0.18"
            />

            {/* Inner Golden Star */}
            <polygon
              points="50,34 54,46 66,46 56,54 60,66 50,58 40,66 44,54 34,46 46,46"
              fill="#FBBF24"
              stroke="#FFF"
              strokeWidth="1.2"
            />
          </svg>
        </span>
      );
  }
}
