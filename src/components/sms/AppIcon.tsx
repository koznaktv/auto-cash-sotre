import React from 'react';

interface AppIconProps {
  code: string;
  name: string;
  color?: string;
  className?: string;
  size?: number;
}

export default function AppIcon({
  code,
  name,
  color = '#38BDF8',
  className = '',
  size = 24,
}: AppIconProps) {
  const c = (code || '').toLowerCase().trim();

  // 1. Telegram
  if (c === 'tg') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#229ED9" />
        <path
          d="M17.8 7.2L5.8 11.8c-.8.3-.8.8-.2 1l3.1 1 7.1-4.5c.3-.2.6-.1.4.1l-5.8 5.2-.2 3.2c.3 0 .5-.1.6-.3l1.5-1.5 3.2 2.4c.6.3 1 .2 1.2-.5l2.1-9.9c.2-.9-.3-1.3-1-.9z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 2. WhatsApp
  if (c === 'wa') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#25D366" />
        <path
          d="M17.5 14.4c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.3-.4.1-.1.2-.2.2-.4 0-.1 0-.3-.1-.4-.1-.1-.5-1.2-.7-1.6-.2-.4-.4-.3-.5-.3h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.3c.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1.1.1-1.2 0-.2-.2-.3-.4-.4zM12 4.5c-4.1 0-7.5 3.4-7.5 7.5 0 1.4.4 2.7 1.1 3.8L4.5 19.5l3.8-1c1.1.6 2.4.9 3.7.9 4.1 0 7.5-3.4 7.5-7.5s-3.4-7.4-7.5-7.4z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 3. OpenAI / ChatGPT
  if (c === 'oi') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#10A37F" />
        <path
          d="M18.2 10.3a3.5 3.5 0 00-.3-2.6 3.6 3.6 0 00-3.3-1.8c-.3 0-.6.1-.9.2a3.5 3.5 0 00-4.7-1.5 3.6 3.6 0 00-1.8 3.1c0 .2 0 .4.1.7a3.5 3.5 0 00-2.3 2.8 3.6 3.6 0 00.9 3.6 3.5 3.5 0 00.3 2.6 3.6 3.6 0 003.3 1.8c.3 0 .6-.1.9-.2a3.5 3.5 0 004.7 1.5 3.6 3.6 0 001.8-3.1c0-.2 0-.4-.1-.7a3.5 3.5 0 002.3-2.8 3.6 3.6 0 00-.8-3.6zm-5.7 6.8c-.8 0-1.6-.4-2-1.1l1.3-.8c.2.4.5.6.8.6.6 0 1.1-.4 1.1-1.1v-2.3l-1.4.8c-.4.2-.8.3-1.2.3-.9 0-1.7-.5-2.1-1.2l1.3-.8c.2.4.6.6 1 .6.3 0 .6-.1.8-.2l1.9-1.1v-1.1c0-.6-.4-1.1-1-1.1-.5 0-.9.3-1.1.7l-1.3-.8c.4-.8 1.3-1.3 2.3-1.3 1.4 0 2.5 1.1 2.5 2.5v7c0 1.4-1.1 2.4-2.5 2.4z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 4. Google
  if (c === 'go') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="12" fill="#ffffff" />
        <path
          d="M18.2 12.2c0-.5-.1-.9-.1-1.4H12v2.7h3.5c-.2.9-.7 1.7-1.5 2.2v1.8h2.4c1.4-1.3 2.2-3.2 2.2-5.3z"
          fill="#4285F4"
        />
        <path
          d="M12 18.5c1.8 0 3.3-.6 4.4-1.6l-2.4-1.8c-.6.4-1.4.7-2 .7-1.6 0-2.9-1.1-3.4-2.5H6.1v1.9c1.1 2.1 3.3 3.3 5.9 3.3z"
          fill="#34A853"
        />
        <path
          d="M8.6 13.3c-.1-.4-.2-.9-.2-1.3s.1-.9.2-1.3V8.8H6.1c-.5 1-1 2.1-1 3.2s.5 2.2 1 3.2l2.5-1.9z"
          fill="#FBBC05"
        />
        <path
          d="M12 8.1c1 0 1.9.3 2.6 1l1.9-1.9C15.3 6.1 13.8 5.5 12 5.5 9.4 5.5 7.2 6.7 6.1 8.8l2.5 1.9c.5-1.4 1.8-2.6 3.4-2.6z"
          fill="#EA4335"
        />
      </svg>
    );
  }

  // 5. Instagram
  if (c === 'ig') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <defs>
          <radialGradient id="ig-grad" cx="20%" cy="100%" r="130%">
            <stop offset="0%" stopColor="#ffda77" />
            <stop offset="10%" stopColor="#fca939" />
            <stop offset="50%" stopColor="#d3246a" />
            <stop offset="100%" stopColor="#7024c4" />
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
        <rect x="5.5" y="5.5" width="13" height="13" rx="4" stroke="#ffffff" strokeWidth="1.8" fill="none" />
        <circle cx="12" cy="12" r="3.2" stroke="#ffffff" strokeWidth="1.8" fill="none" />
        <circle cx="15.8" cy="8.2" r="0.9" fill="#ffffff" />
      </svg>
    );
  }

  // 6. Facebook
  if (c === 'fb') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path
          d="M14.5 12.5h-2v7h-3v-7h-1.5v-2.5h1.5v-1.7c0-2 1.2-3.1 3-3.1.9 0 1.6.1 1.8.1v2.1h-1.2c-1 0-1.1.5-1.1 1.1v1.5h2.3l-.3 2.5z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 7. TikTok / Douyin
  if (c === 'tt' || c === 'lf' || c === 'ctkt' || c === 'gr_tk') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#000000" />
        <path
          d="M15.5 7.2c.7.8 1.6 1.3 2.5 1.4v2.2c-.9 0-1.8-.3-2.5-.8v5.5c0 2.4-1.9 4.3-4.3 4.3s-4.3-1.9-4.3-4.3 1.9-4.3 4.3-4.3c.3 0 .7 0 1 .1v2.3c-.3-.1-.6-.2-1-.2-1.2 0-2.1.9-2.1 2.1s.9 2.1 2.1 2.1 2.1-.9 2.1-2.1V5.5h2.2c0 .6.3 1.2.7 1.7z"
          fill="#FE2C55"
        />
        <path
          d="M15.1 6.8c.7.8 1.6 1.3 2.5 1.4v.8c-.9 0-1.8-.3-2.5-.8v5.5c0 2.4-1.9 4.3-4.3 4.3s-4.3-1.9-4.3-4.3c0-.8.2-1.6.7-2.2-.4.6-.7 1.4-.7 2.2 0 2.4 1.9 4.3 4.3 4.3s4.3-1.9 4.3-4.3V7.9c.7.5 1.6.8 2.5.8v-.8c-.9-.1-1.8-.6-2.5-1.1z"
          fill="#25F4EE"
        />
      </svg>
    );
  }

  // 8. Snapchat
  if (c === 'sn') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#FFFC00" />
        <path
          d="M12 5.5c-2.4 0-3.6 1.6-3.7 3.3 0 .8.2 1.8.4 2.2-.4.1-.9.3-1.2.6-.3.3-.2.6 0 .8.6.6 1.4.3 1.9.1.3.9.9 1.7 1.7 2.1-.5.3-1.3.4-2 .8-.3.2-.4.5-.2.8.2.3.8.4 1.4.3.4 0 .9-.1 1.4-.3.2.3.3.7.3 1.2 0 .5-.4.8-.8.9-.4.1-.7.4-.7.8s.4.7 1 .7c.9 0 1.6-.4 2.2-.4.6 0 1.3.4 2.2.4.6 0 1-.3 1-.7s-.3-.7-.7-.8c-.4-.1-.8-.4-.8-.9 0-.5.1-.9.3-1.2.5.2 1 .3 1.4.3.6.1 1.2 0 1.4-.3.2-.3.1-.6-.2-.8-.7-.4-1.5-.5-2-.8.8-.4 1.4-1.2 1.7-2.1.5.2 1.3.5 1.9-.1.2-.2.3-.5 0-.8-.3-.3-.8-.5-1.2-.6.2-.4.4-1.4.4-2.2-.1-1.7-1.3-3.3-3.7-3.3z"
          fill="#000000"
        />
      </svg>
    );
  }

  // 9. Discord
  if (c === 'ds') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#5865F2" />
        <path
          d="M16.5 7.5a11 11 0 00-2.8-.9.2.2 0 00-.2.1c-.1.3-.3.7-.4 1a10.2 10.2 0 00-3.2 0c-.1-.3-.3-.7-.4-1a.2.2 0 00-.2-.1 11 11 0 00-2.8.9.2.2 0 00-.1.1c-1.8 2.6-2.3 5.2-2 7.7a.2.2 0 00.1.1 11.2 11.2 0 003.4 1.7.2.2 0 00.2-.1c.3-.4.5-.8.8-1.2a.2.2 0 00-.1-.3 7.3 7.3 0 01-1.1-.5.2.2 0 010-.3c.1 0 .2-.1.3-.1 2.2 1 4.6 1 6.8 0 .1 0 .2.1.3.1a.2.2 0 010 .3c-.3.2-.7.4-1.1.5a.2.2 0 00-.1.3c.3.4.5.8.8 1.2a.2.2 0 00.2.1 11.2 11.2 0 003.4-1.7.2.2 0 00.1-.1c.4-2.9-.6-5.5-2.1-7.7a.2.2 0 00-.1-.1zM9.5 14c-.7 0-1.2-.6-1.2-1.4s.5-1.4 1.2-1.4 1.2.6 1.2 1.4-.5 1.4-1.2 1.4zm5 0c-.7 0-1.2-.6-1.2-1.4s.5-1.4 1.2-1.4 1.2.6 1.2 1.4-.5 1.4-1.2 1.4z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 10. WeChat
  if (c === 'wb') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#07C160" />
        <path
          d="M10.8 6.5C7.6 6.5 5 8.7 5 11.3c0 1.5.8 2.8 2 3.7l-.5 1.5 1.8-.9c.7.2 1.5.3 2.5.3.3 0 .7 0 1-.1-.2-.5-.3-1-.3-1.6 0-2.8 2.6-5.1 5.7-5.1.3 0 .6 0 .9.1-.8-1.6-3.3-2.7-6.3-2.7zm-2 2.8c.4 0 .8.3.8.8s-.3.8-.8.8-.8-.3-.8-.8.4-.8.8-.8zm3.8 0c.4 0 .8.3.8.8s-.4.8-.8.8-.8-.3-.8-.8.3-.8.8-.8zm4.6 4.3c-2.6 0-4.7 1.8-4.7 4 0 1.2.6 2.3 1.6 3l-.4 1.2 1.5-.7c.6.2 1.3.2 2 .2 2.6 0 4.7-1.8 4.7-4s-2.1-3.7-4.7-3.7zm-1.7 2.3c.3 0 .6.3.6.6s-.3.6-.6.6-.6-.3-.6-.6.3-.6.6-.6zm3.3 0c.3 0 .6.3.6.6s-.3.6-.6.6-.6-.3-.6-.6.3-.6.6-.6z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 11. X (Twitter)
  if (c === 'tw') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#000000" />
        <path
          d="M13.8 11.1L18.4 6h-1.1l-4 4.4L10.2 6H6.5l4.8 6.7L6.5 18h1.1l4.2-4.6 3.3 4.6h3.7l-5-6.9zm-1.5 1.6l-.5-.7-3.9-5.3h1.7l3.1 4.3.5.7 4.1 5.6h-1.7l-3.3-4.6z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 12. Netflix
  if (c === 'nf') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#000000" />
        <path d="M7.5 5.5h2.2v13H7.5z" fill="#E50914" />
        <path d="M14.3 5.5h2.2v13h-2.2z" fill="#E50914" />
        <path d="M7.5 5.5l6.8 13h2.2l-6.8-13z" fill="#B81D24" />
      </svg>
    );
  }

  // 13. Spotify
  if (c === 'sp') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#1ED760" />
        <path
          d="M16.5 15.3c-.2.3-.5.4-.8.2-2.1-1.3-4.8-1.6-8-.9-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 3.5-.8 6.5-.4 8.9 1 .3.2.4.5.2.8zm1.1-2.4c-.2.4-.7.5-1 .3-2.5-1.5-6.2-2-9.1-1.1-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 3.3-1 7.4-.5 10.2 1.2.3.2.5.7.3 1zm.1-2.5c-3-1.8-7.9-1.9-10.7-1.1-.5.1-.9-.2-1-.6-.1-.5.2-.9.6-1 3.3-1 8.7-.8 12.1 1.2.4.2.6.8.3 1.2-.2.4-.8.6-1.3.3z"
          fill="#000000"
        />
      </svg>
    );
  }

  // 14. Steam
  if (c === 'st') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#171A21" />
        <path
          d="M12 5.5c-3.6 0-6.5 2.9-6.5 6.5 0 2 .9 3.8 2.3 5l2.2-3.1c-.2-.6-.1-1.3.4-1.8.7-.7 1.8-.7 2.5 0 .7.7.7 1.8 0 2.5-.5.5-1.2.6-1.8.4l-2.2 3.1c1 .6 2.1.9 3.1.9 3.6 0 6.5-2.9 6.5-6.5s-2.9-7-6.5-7z"
          fill="#66C0F4"
        />
      </svg>
    );
  }

  // 15. Microsoft
  if (c === 'mb') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="12" fill="#001833" />
        <rect x="6.5" y="6.5" width="5" height="5" fill="#F25022" />
        <rect x="12.5" y="6.5" width="5" height="5" fill="#7FBA00" />
        <rect x="6.5" y="12.5" width="5" height="5" fill="#00A4EF" />
        <rect x="12.5" y="12.5" width="5" height="5" fill="#FFB900" />
      </svg>
    );
  }

  // 16. Apple
  if (c === 'ap') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#1C1C1E" />
        <path
          d="M15.5 12.3c0-2 1.6-3 1.7-3.1-1-.1.4-2.3 2.3-2.3-.9-1.3-2.3-1.5-2.8-1.5-1.2-.1-2.3.7-2.9.7-.6 0-1.5-.7-2.5-.7-1.3 0-2.5.8-3.2 2-1.4 2.4-.4 6 1 7.9.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.6-.7s1.6.7 2.6.7c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2-.8-2-3.3zm-1.8-5.7c.5-.7.9-1.6.8-2.6-.8 0-1.8.6-2.3 1.2-.5.6-.9 1.5-.8 2.5.9.1 1.8-.4 2.3-1.1z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 17. Uber
  if (c === 'ub') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#000000" />
        <circle cx="12" cy="12" r="4.5" stroke="#ffffff" strokeWidth="1.8" fill="none" />
        <rect x="11" y="7.5" width="2" height="4.5" fill="#ffffff" />
      </svg>
    );
  }

  // 18. Viber
  if (c === 'vi') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#7360F2" />
        <path
          d="M16.5 13.5c-.3-.2-.8-.4-1.2-.3-.3.1-.6.4-.8.6-.2.2-.4.2-.6.1-.8-.4-1.5-1-1.9-1.8-.1-.2-.1-.4.1-.6.2-.2.5-.5.6-.8.1-.4 0-.9-.3-1.2l-.7-.9c-.3-.4-.9-.4-1.2 0-.6.7-.9 1.6-.7 2.5.3 1.8 1.8 3.3 3.6 3.6.9.2 1.8-.1 2.5-.7.4-.3.4-.9 0-1.2l-.7-.9z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 19. Any other platform or custom fallback (crisp monogram badge)
  const letters = (c || name || 'AP').toUpperCase().slice(0, 2);
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl font-mono font-black text-xs uppercase shadow-md select-none shrink-0 ${className}`}
      style={{
        width: size + 8,
        height: size + 8,
        background: `linear-gradient(135deg, ${color}35, ${color}15)`,
        borderColor: `${color}60`,
        borderWidth: 1,
        color: color,
      }}
    >
      <span>{letters}</span>
      <div className="absolute inset-0 bg-white/5 rounded-xl pointer-events-none" />
    </div>
  );
}
