import React, { useState } from 'react';

interface WavingFlagProps {
  code: string;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function WavingFlag({
  code,
  name,
  className = '',
  size = 'md',
  animated = true,
}: WavingFlagProps) {
  const [hasError, setHasError] = useState(false);
  const cleanCode = (code || 'tr').toLowerCase().trim();

  // Size dimensions
  const dims = {
    sm: 'w-6 h-4',
    md: 'w-8 h-5',
    lg: 'w-10 h-6',
  }[size];

  if (hasError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-black uppercase text-amber-300 font-mono shadow-sm ${dims} ${className}`}
        title={name}
      >
        {cleanCode.slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-[5px] shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-white/20 select-none ${dims} ${className}`}
      title={name}
    >
      <img
        src={`https://flagcdn.com/w80/${cleanCode}.png`}
        srcSet={`https://flagcdn.com/w160/${cleanCode}.png 2x`}
        alt={name}
        loading="lazy"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover ${animated ? 'flag-flutter' : ''}`}
      />
      {/* 3D Wave glossy fabric sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/20 pointer-events-none rounded-[4px]" />
    </div>
  );
}
