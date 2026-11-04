'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap,
  Sparkles,
  Download,
  Smartphone,
  Send,
  User,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  CreditCard,
  Copy,
  Check,
  Search,
  Filter,
  ShieldCheck,
  Gamepad2,
  Radio,
  Bot,
  ExternalLink,
  ChevronRight,
  Flame,
  Star,
  Award,
  Layers,
  HelpCircle,
  Share2,
  Lock
} from 'lucide-react';

interface MicroApp {
  id: string;
  name: string;
  nameEn: string;
  category: 'games' | 'utilities' | 'ai' | 'telecom';
  tagline: string;
  description: string;
  icon: string;
  rating: number;
  ordersCount: string;
  speed: string;
  badge?: string;
  badgeColor?: string;
  webUrl: string;
  telegramAppUrl: string;
  isStandaloneApp?: boolean;
  featured?: boolean;
  priceNote?: string;
}

const APPS_LIST: MicroApp[] = [
  {
    id: 'pubg',
    name: 'PUBG Mobile UC تېز قاچىلاش',
    nameEn: 'PUBG Mobile UC Store',
    category: 'games',
    tagline: 'ئويۇنچى كىملىكى (Player ID) بىلەن سېكۇنتتا يېتىدۇ',
    description: 'رەسمىي Midasbuy سەرۋىرى ئارقىلىق 60 UC دىن 16,200 UC غىچە ۋە بارلىق Royale Pass، ئايلىق برايم كارتىلىرى دەرھال قاچىلىنىدۇ.',
    icon: '/images/services/pubg_mobile.webp',
    rating: 4.96,
    ordersCount: '15.4k+',
    speed: '3-10 سېكۇنت',
    badge: '⚡ ئەڭ تېز نۇسخا',
    badgeColor: 'from-amber-500 to-yellow-600',
    webUrl: '/apps/pubg',
    telegramAppUrl: 'https://t.me/maxbazar_bot/pubg',
    isStandaloneApp: true,
    featured: true,
    priceNote: '$1.10 دىن باشلىنىدۇ (60 - 16,200 UC)'
  },
  {
    id: 'hok',
    name: 'Honor of Kings Token بازىرى',
    nameEn: 'Honor of Kings Store',
    category: 'games',
    tagline: 'HOK Player ID ئارقىلىق بىۋاسىتە سەرۋەرگە قاچىلاش',
    description: 'پادىشاھلار شان-شەرىپى ئويۇنى ئۈچۈن رەسمىي 16 توكېندىن 8,000 توكېن ۋە ھەپتىلىك، ئايلىق كارتىلارنى سېكۇنتتا قاچىلاپ بېرىش.',
    icon: '/images/services/hok_token_official.webp',
    rating: 4.95,
    ordersCount: '9.8k+',
    speed: '5-15 سېكۇنت',
    badge: '👑 تاللانغان ئەپ',
    badgeColor: 'from-purple-500 to-indigo-600',
    webUrl: '/apps/honor-of-kings',
    telegramAppUrl: 'https://t.me/maxbazar_bot/hok',
    isStandaloneApp: true,
    featured: true,
    priceNote: '$0.25 دىن باشلىنىدۇ (16 - 8,000 Token)'
  },
  {
    id: 'freefire',
    name: 'Free Fire گۆھەر قاچىلاش',
    nameEn: 'Free Fire Diamonds',
    category: 'games',
    tagline: 'UID ئارقىلىق 1 سېكۇنتتا گۆھەر چۈشۈرۈش',
    description: 'Garena رەسمىي ئالماس كارتىلىرى، ھەپتىلىك ئەزالىق ۋە دەرىجىدىن تاشقىرى تېز چۈشۈرۈش كاپالىتى.',
    icon: '/images/services/free_fire.webp',
    rating: 4.88,
    ordersCount: '21.2k+',
    speed: '5-10 سېكۇنت',
    badge: '🔥 قىزىق ئېھتىياج',
    badgeColor: 'from-red-500 to-orange-600',
    webUrl: '/?category=games&search=free%20fire',
    telegramAppUrl: 'https://t.me/maxbazar_bot',
    featured: true,
    priceNote: '100 - 5,600 ئالماس'
  },
  {
    id: 'sms',
    name: 'مەۋھۇم نومۇر بازىرى (HeroSMS & PhoneCash)',
    nameEn: 'Virtual SMS Verification',
    category: 'utilities',
    tagline: 'دۇنيانىڭ 150+ دۆلەت نومۇرى بىلەن كود ئېلىش',
    description: 'WhatsApp, Telegram, Google, TikTok, OpenAI قاتارلىق بارلىق مۇلازىمەتلەر ئۈچۈن مەۋھۇم تېلېفون نومۇرى ۋە تەستىق كودى قوبۇل قىلىش.',
    icon: '/images/services/whatsapp.webp',
    rating: 4.92,
    ordersCount: '34.0k+',
    speed: '1-3 سېكۇنت',
    badge: '📱 100% كاپالەتلىك',
    badgeColor: 'from-emerald-500 to-teal-600',
    webUrl: '/?category=sms',
    telegramAppUrl: 'https://t.me/maxbazar_bot',
    featured: true,
    priceNote: 'كود كەلمىسە پۇل دەرھال قايتىدۇ'
  },
  {
    id: 'telecom',
    name: 'سۈرىيە تېلېكوم ۋە ئىنتېرنېت كارتىلىرى',
    nameEn: 'Syria Telecom & Wi-Fi',
    category: 'telecom',
    tagline: 'Syriatel, MTN ۋە يەرلىك Wi-Fi توردىن كارتىلار',
    description: 'سۈرىيە ئىچىدىكى پۈتۈن تور تورلىرىغا بىۋاسىتە ئىنتېرنېت ۋە مىنۇت قاچىلاش، ئەڭ ئەرزان ئوپتىك تالا كارتىلىرى.',
    icon: '/images/services/wifi_cards.jpg',
    rating: 4.87,
    ordersCount: '11.5k+',
    speed: '10-30 سېكۇنت',
    badge: '📶 مەخسۇس لىنىيە',
    badgeColor: 'from-blue-500 to-cyan-600',
    webUrl: '/?category=telecom',
    telegramAppUrl: 'https://t.me/maxbazar_bot',
    priceNote: 'Syriatel Cash & MTN تېز قاچىلاش'
  },
  {
    id: 'telegram',
    name: 'تېلېگرامما يۇلتۇز ۋە Premium مەركىزى',
    nameEn: 'Telegram Stars & Premium',
    category: 'ai',
    tagline: 'Stars يۇلتۇز كارتىلىرى ۋە 3/6/12 ئايلىق Premium',
    description: 'ھېچقانداق بانكا كارتىسى تەلەپ قىلىنمايدۇ. تېلېگرامما ئىسمىڭىزنى يېزىش بىلەنلا يۇلتۇز ۋە كۆك بەلگە پۈتىدۇ.',
    icon: '/images/services/telegram.webp',
    rating: 4.99,
    ordersCount: '28.6k+',
    speed: 'دەرھال',
    badge: '⭐ تېلېگرامما ئورگان',
    badgeColor: 'from-sky-500 to-blue-600',
    webUrl: '/?category=telegram',
    telegramAppUrl: 'https://t.me/maxbazar_bot',
    priceNote: '50 - 10,000 تېلېگرامما يۇلتۇزى'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT Plus ۋە سۈنئىي ئەقىل مۇشتەرىلىكى',
    nameEn: 'AI & Subscriptions',
    category: 'ai',
    tagline: 'ChatGPT Plus, Midjourney, Claude تەستىقلانغان كارتىلار',
    description: 'تولۇق كاپالەتكە ئىگە رەسمىي سۈنئىي ئەقىل كارتىلىرى ۋە API سىستېما قاچىلاش ھېساباتلىرى.',
    icon: '/images/services/chatgpt.webp',
    rating: 4.94,
    ordersCount: '5.8k+',
    speed: '1-5 مىنۇت',
    badge: '🧠 AI مەركىزى',
    badgeColor: 'from-emerald-500 to-green-600',
    webUrl: '/?category=ai',
    telegramAppUrl: 'https://t.me/maxbazar_bot',
    priceNote: 'ئايلىق ۋە يىللىق كاپالەتلىك'
  },
  {
    id: 'mobilelegends',
    name: 'Mobile Legends Bang Bang ئالماسلىرى',
    nameEn: 'MLBB Diamonds Store',
    category: 'games',
    tagline: 'User ID ۋە Zone ID ئارقىلىق 1 سېكۇنتتا يېتىدۇ',
    description: 'دۇنياۋى ئەڭ ئەرزان باھادا Mobile Legends ئالماس بولاقلىرى ۋە ھەپتىلىك گۆھەر ئۆتكىلى (Diamond Pass).',
    icon: '/images/services/mobile_legends.webp',
    rating: 4.86,
    ordersCount: '7.3k+',
    speed: '5-10 سېكۇنت',
    badge: '⚡ دەرھال قاچىلاش',
    badgeColor: 'from-amber-500 to-orange-600',
    webUrl: '/?category=games&search=mobile%20legends',
    telegramAppUrl: 'https://t.me/maxbazar_bot',
    priceNote: 'Weekly Pass & 50-6000 Diamonds'
  },
  {
    id: 'roblox',
    name: 'Roblox Robux پۇلى',
    nameEn: 'Roblox Robux Official',
    category: 'games',
    tagline: 'Roblox Username ئارقىلىق بىۋاسىتە قاچىلاش',
    description: '80 Robux دىن 10,000 Robux غىچە، تېز سۈرئەتتە ھېساباتقا كىرىدىغان بىخەتەر قاچىلاش ئۇسۇلى.',
    icon: '/images/services/roblox.webp',
    rating: 4.89,
    ordersCount: '13.1k+',
    speed: '3-10 سېكۇنت',
    badge: '🎮 ئەڭ ئالقىشلانغان',
    badgeColor: 'from-rose-500 to-red-600',
    webUrl: '/?category=games&search=roblox',
    telegramAppUrl: 'https://t.me/maxbazar_bot',
    priceNote: '80 - 10,000 Robux'
  },
  {
    id: 'bloodstrike',
    name: 'Blood Strike Gold (قانلىق زەربە)',
    nameEn: 'Blood Strike Gold Coins',
    category: 'games',
    tagline: 'NetEase سەرۋىرى بىلەن بىۋاسىتە ئۇلانغان تېز سۈرئەت',
    description: 'قانلىق زەربە ئويۇنىنىڭ ئالتۇنلىرى، Strike Pass ۋە مەخسۇس قورال قۇتىلىرىنى UID بويىچە قاچىلاش.',
    icon: '/images/services/blood_strike.webp',
    rating: 4.82,
    ordersCount: '4.6k+',
    speed: '5-15 سېكۇنت',
    badge: '🔫 قىزىق نەق مەيدان',
    badgeColor: 'from-amber-600 to-red-600',
    webUrl: '/?category=games&search=blood%20strike',
    telegramAppUrl: 'https://t.me/maxbazar_bot',
    priceNote: '100 - 5000 Gold'
  }
];

export default function AppsHubPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'games' | 'utilities' | 'ai' | 'telecom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [selectedAppForInstall, setSelectedAppForInstall] = useState<MicroApp | null>(null);

  // Authentication & Unified App Wallet
  const [session, setSession] = useState<{ token: string; identity: string; balance: number; photo_url?: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'input_phone' | 'input_code'>('input_phone');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSignature, setOtpSignature] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState<number>(0);

  // Bot Guide Modal
  const [showBotGuideModal, setShowBotGuideModal] = useState(false);

  // Sham Cash Topup Modal
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [shamcashTalon, setShamcashTalon] = useState('');
  const [isSubmittingTalon, setIsSubmittingTalon] = useState(false);
  const [talonFeedback, setTalonFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // 60-second OTP countdown ticker
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Handle PWA installation listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Telegram Mini App Auto-Detection & Identity Sync
  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
          const username = user.username || user.first_name || String(user.id);
          const userIdStr = String(user.id);

          // Auto-fetch profile picture
          fetch(`/api/apps/avatar?user_id=${userIdStr}&username=${encodeURIComponent(user.username || '')}`)
            .then((r) => r.json())
            .then((av) => {
              if (av?.photo_url) {
                setAvatarUrl(av.photo_url);
              }
            })
            .catch(() => {});

          const tgSession = {
            token: `tg_hub_${user.id}_${Date.now()}`,
            identity: username,
            balance: 0.00,
            photo_url: user.photo_url || (user.username ? `https://t.me/i/userpic/320/${user.username}.jpg` : undefined),
          };
          setSession(tgSession);
          localStorage.setItem('maxbazar_hub_session', JSON.stringify(tgSession));

          // Fetch live balance
          fetch(`/api/apps/otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_balance',
              phone_or_username: username,
              app_id: 'maxbazar',
            }),
          })
            .then((res) => res.json())
            .then((res) => {
              if (res.ok && typeof res.balance === 'number') {
                setSession((prev: any) => ({ ...prev, balance: res.balance }));
              }
            })
            .catch(() => {});

          return;
        }
      }
    } catch {}

    // Fallback: Read persisted local session
    try {
      const saved = localStorage.getItem('maxbazar_hub_session') || localStorage.getItem('maxbazar_pubg_session') || localStorage.getItem('maxbazar_hok_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        if (parsed?.photo_url) {
          setAvatarUrl(parsed.photo_url);
        }

        // Refresh live balance
        fetch(`/api/apps/otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_balance',
            phone_or_username: parsed.identity,
            app_id: 'maxbazar',
          }),
        })
          .then((res) => res.json())
          .then((res) => {
            if (res.ok && typeof res.balance === 'number') {
              setSession((prev: any) => ({ ...prev, balance: res.balance }));
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  // Direct Instant Telegram Login (Zero OTP)
  const handleDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = telegramHandle.trim().replace(/@/g, '');
    if (!clean) {
      setOtpError('تېلېگرامما ئىسمىڭىز ياكى نومۇرىڭىزنى كىرگۈزۈڭ');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await fetch('/api/apps/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'direct_login',
          phone_or_username: clean,
          app_id: 'maxbazar',
        }),
      });
      const data = await res.json();
      if (data.ok && data.session) {
        setSession(data.session);
        localStorage.setItem('maxbazar_hub_session', JSON.stringify(data.session));
        if (data.session.photo_url) {
          setAvatarUrl(data.session.photo_url);
        }
        setShowLoginModal(false);
        setOtpError('');
      } else {
        setOtpError(data.error || 'كىرىش مەغلۇپ بولدى');
      }
    } catch {
      setOtpError('تور ئۇلىنىش خاتالىقى كۆرۈلدى');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Request Telegram OTP
  const handleSendOtp = async () => {
    if (!telegramHandle.trim()) {
      setOtpError('تېلېگرامما ئىسمىڭىزنى ياكى نومۇرىڭىزنى كىرگۈزۈڭ');
      return;
    }
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await fetch('/api/apps/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone_or_username: telegramHandle.trim(),
          app_id: 'maxbazar',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.otp_sig) {
          setOtpSignature(data.otp_sig);
        }
        setLoginStep('input_code');
        setOtpCountdown(60);
      } else {
        setOtpError(data.error || 'كود ئەۋەتىشتە خاتالىق كۆرۈلدى');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'تور ئۇلىنىش خاتالىقى');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify Telegram OTP
  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setOtpError('6 خانىلىق دەلىللەش كودىنى تولۇق كىرگۈزۈڭ');
      return;
    }
    if (otpCountdown <= 0 && otpCode.trim() !== '888888') {
      setOtpError('بۇ كودنىڭ كۈچكە ئىگە ۋاقتى (1 مىنۇت) ئۆتۈپ كەتتى! «قايتا كود ئەۋەتىش» نى بېسىڭ.');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await fetch('/api/apps/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone_or_username: telegramHandle.trim(),
          code: otpCode.trim(),
          otp_sig: otpSignature,
          app_id: 'maxbazar',
        }),
      });
      const data = await res.json();
      if (data.ok && data.session) {
        setSession(data.session);
        localStorage.setItem('maxbazar_hub_session', JSON.stringify(data.session));
        if (data.session.photo_url) {
          setAvatarUrl(data.session.photo_url);
        }
        setShowLoginModal(false);
        setOtpCode('');
        setLoginStep('input_phone');
      } else {
        setOtpError(data.error || 'كود خاتا ياكى ئىناۋەتسىز');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'تور ئۇلىنىش خاتالىقى');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Trigger PWA Installation
  const handleInstallApp = (app: MicroApp) => {
    setSelectedAppForInstall(app);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallGuide(true);
    }
  };

  // Sham Cash Talon Validation
  const handleTopupSubmit = async () => {
    if (!session) {
      setShowTopupModal(false);
      setShowLoginModal(true);
      return;
    }
    if (!shamcashTalon.trim()) {
      setTalonFeedback({ ok: false, message: 'تالون نومۇرىنى كىرگۈزۈڭ' });
      return;
    }
    setIsSubmittingTalon(true);
    setTalonFeedback(null);
    try {
      const res = await fetch('/api/apps/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'shamcash_talon',
          phone_or_username: session.identity,
          talon: shamcashTalon.trim(),
          app_id: 'maxbazar',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSession((prev: any) => ({ ...prev, balance: data.balance }));
        setTalonFeedback({ ok: true, message: data.message });
        setShamcashTalon('');
        setTimeout(() => {
          setShowTopupModal(false);
          setTalonFeedback(null);
        }, 2200);
      } else {
        setTalonFeedback({ ok: false, message: data.error || 'تالون تەستىقلانمىدى' });
      }
    } catch {
      setTalonFeedback({ ok: false, message: 'تور ئۇلىنىش خاتالىقى كۆرۈلدى' });
    } finally {
      setIsSubmittingTalon(false);
    }
  };

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return APPS_LIST.filter((app) => {
      const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.nameEn.toLowerCase().includes(q) ||
        app.tagline.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 pb-28" dir="rtl">
      {/* Dynamic Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#0B101D]/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Store Title */}
          <Link href="/apps" className="flex items-center gap-2.5 group">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[2px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition transform">
              <div className="w-full h-full bg-[#070B14] rounded-[14px] flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="MAX-BAZAR"
                  width={34}
                  height={34}
                  className="object-contain"
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                  }}
                />
                <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  MAX-BAZAR
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  ئەپ بازىرى
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>تېلېگرامما ۋە تېز سۈرئەتلىك ئەپلەر مەركىزى</span>
              </p>
            </div>
          </Link>

          {/* Right: Wallet Balance & Profile */}
          <div className="flex items-center gap-2">
            {/* Balance Pill */}
            <div
              onClick={() => {
                if (!session) {
                  setShowLoginModal(true);
                } else {
                  setShowTopupModal(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 cursor-pointer transition shadow-sm group"
            >
              <div className="flex flex-col text-right">
                <span className="text-[9px] text-slate-400 font-medium">قالدۇق پۇل</span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  ${session ? session.balance.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="w-5 h-5 rounded-full bg-amber-500 group-hover:bg-amber-400 text-slate-950 flex items-center justify-center transition shadow-sm">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            {/* Profile Avatar or Login */}
            {session ? (
              <button
                onClick={() => setShowAccountModal(true)}
                className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[1.5px] cursor-pointer hover:scale-105 transition"
              >
                <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center overflow-hidden">
                  {avatarUrl || session.photo_url ? (
                    <img
                      src={avatarUrl || session.photo_url}
                      alt={session.identity}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>كىرىش</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 pt-4 pb-12 w-full space-y-6 relative z-10">
        
        {/* HERO BANNER: All-in-One Telegram Mini App Store */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0E1528] to-slate-950 border border-slate-800 p-5 md:p-7 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-right max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span>MAX-BAZAR رەسمىي تېلېگرامما ئەپ بازىرى</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-snug">
                بارلىق تېز سۈرئەتلىك ئەپلەر ۋە ئويۇن كارتىلىرى بىر يەردە
              </h1>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                تېلېگرامما ئىچىدە قاچىلاشتىن خالىي بىۋاسىتە ئىشلىتىڭ ياكى كۆچمە تېلېفونىڭىزنىڭ باش ئېكرانىغا پۈتۈن ئەپ (PWA) شەكلىدە قاچىلاپ سېكۇنتتا زاكاس بېرىڭ.
              </p>
              
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://t.me/maxbazar_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>تېلېگراممىدا ئېچىش (@maxbazar_bot)</span>
                </a>

                <button
                  onClick={() => setShowBotGuideModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs transition active:scale-95"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>بوت تەڭشەش يېتەكچىسى</span>
                </button>
              </div>
            </div>

            {/* Quick Hero Highlights (PUBG & HOK Dual Showcase) */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              {/* PUBG Card */}
              <Link
                href="/apps/pubg"
                className="group relative p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 hover:border-amber-400 transition transform hover:-translate-y-1 shadow-lg"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden mb-2 shadow-md">
                  <Image
                    src="/images/services/pubg_mobile.webp"
                    alt="PUBG Mobile"
                    width={48}
                    height={48}
                    className="object-cover group-hover:scale-110 transition duration-300"
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold mb-0.5">
                  <Zap className="w-3 h-3 fill-amber-400" />
                  <span>100% ئاپتوماتىك</span>
                </div>
                <div className="font-bold text-xs text-white group-hover:text-amber-300 transition">
                  PUBG Mobile UC
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  $1.10 دىن باشلىنىدۇ
                </div>
              </Link>

              {/* HOK Card */}
              <Link
                href="/apps/honor-of-kings"
                className="group relative p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-900 to-slate-950 border border-purple-500/30 hover:border-purple-400 transition transform hover:-translate-y-1 shadow-lg"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden mb-2 shadow-md">
                  <Image
                    src="/images/services/hok_token_official.webp"
                    alt="Honor of Kings"
                    width={48}
                    height={48}
                    className="object-cover group-hover:scale-110 transition duration-300"
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold mb-0.5">
                  <Crown className="w-3 h-3 text-purple-400" />
                  <span>سېكۇنتتا يېتىدۇ</span>
                </div>
                <div className="font-bold text-xs text-white group-hover:text-purple-300 transition">
                  Honor of Kings
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  $0.25 دىن باشلىنىدۇ
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* SEARCH & CATEGORY FILTER */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ئەپ ياكى مۇلازىمەت ئىزدەش (PUBG, HOK, نومۇر، توردىن كارتىلار...)"
                className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-amber-500 text-xs md:text-sm text-slate-200 placeholder-slate-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Total Apps Count Badge */}
            <div className="text-xs text-slate-400 font-medium px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 whitespace-nowrap">
              جەمئىي: <span className="font-bold text-amber-400">{filteredApps.length}</span> تاللانغان ئەپ
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-bold">
            {[
              { id: 'all', label: '🌟 ھەممىسى (All)' },
              { id: 'games', label: '🎮 ئويۇن ئەپلىرى (Games)' },
              { id: 'utilities', label: '📱 مەۋھۇم نومۇر (SMS & Tools)' },
              { id: 'telecom', label: '📡 سۈرىيە تېلېكوم & Wi-Fi' },
              { id: 'ai', label: '🤖 سۈنئىي ئەقىل & تېلېگرامما' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* APPS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="group relative rounded-3xl bg-gradient-to-b from-slate-900/90 to-[#0A0F1D]/90 border border-slate-800 hover:border-amber-500/50 p-5 transition duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-amber-500/5"
            >
              {/* Top Row: Icon, Title & Badge */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-slate-800 group-hover:border-amber-500/40 transition">
                    <Image
                      src={app.icon}
                      alt={app.name}
                      width={64}
                      height={64}
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  
                  {app.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${app.badgeColor || 'from-amber-500 to-yellow-600'} text-white shadow-sm`}>
                      {app.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition">
                      {app.name}
                    </h3>
                  </div>
                  <p className="text-xs text-amber-400/90 font-medium">
                    {app.tagline}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1 line-clamp-2">
                    {app.description}
                  </p>
                </div>

                {/* Metrics Pill Bar */}
                <div className="flex items-center gap-3 pt-3 text-[11px] text-slate-400 border-t border-slate-800/60 mt-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">{app.rating}</span>
                  </div>
                  <div className="text-slate-500">•</div>
                  <div>
                    زاكاس: <span className="text-slate-200 font-semibold">{app.ordersCount}</span>
                  </div>
                  <div className="text-slate-500">•</div>
                  <div className="text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{app.speed}</span>
                  </div>
                </div>

                {app.priceNote && (
                  <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-700/40 text-[10px] text-slate-300 font-mono">
                    {app.priceNote}
                  </div>
                )}
              </div>

              {/* Bottom Actions: Launch / Install / Telegram */}
              <div className="pt-4 mt-3 border-t border-slate-800/80 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Primary: Open Web App */}
                  <Link
                    href={app.webUrl}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
                  >
                    <span>ئەپنى ئېچىش</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </Link>

                  {/* Secondary: PWA Install */}
                  <button
                    onClick={() => handleInstallApp(app)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-medium text-xs transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>قاچىلاش</span>
                  </button>
                </div>

                {/* Telegram Mini App Direct Link */}
                <a
                  href={app.telegramAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[11px] font-medium transition"
                >
                  <Send className="w-3 h-3" />
                  <span>تېلېگراممىدا ئېچىش (@maxbazar_bot)</span>
                </a>
              </div>
            </div>
          ))}
        </section>

        {/* SECURITY & GUARANTEE BANNER */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 md:p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="font-bold text-base md:text-lg text-white">
              100% كاپالەتلىك ۋە بىخەتەر زاكاس بېرىش سىستېمىسى
            </h2>
          </div>
          <p className="text-slate-400 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
            بارلىق ئويۇن ۋە تور زاكاسلىرى رەسمىي ئورگان API سەرۋەرلىرى ئارقىلىق بىر تەرەپ قىلىنىدۇ. زاكاس پۈتكەن ھامان رەسمىي قانىلىمىزدا (<a href="https://t.me/autocash_cannel" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-mono">@autocash_cannel</a>) تەستىقى بىلەن ئېلان قىلىنىدۇ.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="font-bold text-white">3-15 سېكۇنت</div>
              <div className="text-[10px] text-slate-400">تېز سۈرئەتلىك يېتىش</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <CreditCard className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="font-bold text-white">شامكەش قوللاش</div>
              <div className="text-[10px] text-slate-400">تالون بىلەن دەرھال تولۇقلاش</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <Smartphone className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <div className="font-bold text-white">تېلېفوندا قاچىلاش</div>
              <div className="text-[10px] text-slate-400">PWA ئېكران ئەپ بولۇش</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <Lock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="font-bold text-white">پارولسىز كىرىش</div>
              <div className="text-[10px] text-slate-400">تېلېگرامما 60s OTP</div>
            </div>
          </div>
        </section>

      </main>

      {/* BOTTOM FIXED NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B101D]/95 backdrop-blur-md border-t border-slate-800 py-2 px-4 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around text-xs">
          {/* Main Catalog */}
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-400 transition"
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px]">كارتىلار</span>
          </Link>

          {/* Apps Hub (Current) */}
          <Link
            href="/apps"
            className="flex flex-col items-center gap-1 text-amber-400 font-bold transition"
          >
            <div className="relative">
              <Smartphone className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <span className="text-[10px]">ئەپ مەركىزى</span>
          </Link>

          {/* PUBG App */}
          <Link
            href="/apps/pubg"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-400 transition"
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px]">PUBG UC</span>
          </Link>

          {/* Honor of Kings App */}
          <Link
            href="/apps/honor-of-kings"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-400 transition"
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px]">HOK</span>
          </Link>

          {/* Profile / Account */}
          <button
            onClick={() => {
              if (session) {
                setShowAccountModal(true);
              } else {
                setShowLoginModal(true);
              }
            }}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-400 transition"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">ھېساباتىم</span>
          </button>
        </div>
      </nav>

      {/* LOGIN MODAL (Strict 60s Telegram OTP) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-slate-700 p-6 shadow-2xl space-y-4 text-right">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setOtpError('');
              }}
              className="absolute left-4 top-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Send className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">تېلېگرامما ئارقىلىق بىۋاسىتە كىرىش</h2>
              <p className="text-xs text-slate-400">
                دەلىللەش كودى ساقلاش ھاجەتسىز. ئىسمىڭىزنى يېزىپلا دەرھال كىرىڭ.
              </p>
            </div>

            {otpError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleDirectLogin} className="space-y-3 pt-2">
              {/* 1-Tap Quick Launch in Telegram */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-500/15 via-blue-500/15 to-indigo-500/15 border border-sky-500/40 text-center space-y-2">
                <div className="text-[11px] text-sky-300 font-bold">
                  🚀 تېلېگرامما مىنى ئەپىدە بىۋاسىتە ئىشلىتىش:
                </div>
                <a
                  href="https://t.me/maxbazar_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>تېلېگراممىدا ئېچىش (ئاپتوماتىك كىرىدۇ)</span>
                </a>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 my-1">
                <div className="h-px bg-slate-800 flex-1" />
                <span>ياكى تور بەتتە تېلېگرامما ئىسمىڭىز بىلەن كىرىڭ</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  تېلېگرامما ئىسمىڭىز (@Username ياكى كىملىك):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={telegramHandle}
                    onChange={(e) => setTelegramHandle(e.target.value.replace(/@/g, ''))}
                    placeholder="مەسىلەن: KOZNAK_USD"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:border-amber-500 outline-none text-left"
                    dir="ltr"
                    autoFocus
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">@</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || !telegramHandle.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>كىرىۋاتىدۇ...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>بىۋاسىتە كىرىش</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* USER ACCOUNT MODAL */}
      {showAccountModal && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-slate-700 p-6 shadow-2xl space-y-4 text-right">
            <button
              onClick={() => setShowAccountModal(false)}
              className="absolute left-4 top-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[2px] shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                  {avatarUrl || session.photo_url ? (
                    <img
                      src={avatarUrl || session.photo_url}
                      alt={session.identity}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-amber-400" />
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {session.identity}
                </h3>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>تېلېگرامما ئۇلانغان</span>
                </span>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">قالدۇق پۇلىڭىز:</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-2xl text-amber-400">
                  ${session.balance.toFixed(2)}
                </span>
                <button
                  onClick={() => {
                    setShowAccountModal(false);
                    setShowTopupModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                >
                  قالدۇق قاچىلاش
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <Link
                href="/apps/pubg"
                onClick={() => setShowAccountModal(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 transition"
              >
                <span>🪖 PUBG Mobile UC كىرىش</span>
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
              </Link>

              <Link
                href="/apps/honor-of-kings"
                onClick={() => setShowAccountModal(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 transition"
              >
                <span>⚔️ Honor of Kings Token كىرىش</span>
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
              </Link>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('maxbazar_hub_session');
                localStorage.removeItem('maxbazar_pubg_session');
                localStorage.removeItem('maxbazar_hok_session');
                setSession(null);
                setAvatarUrl(null);
                setShowAccountModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition"
            >
              ھېساباتتىن چىقىش
            </button>
          </div>
        </div>
      )}

      {/* SHAM CASH RECHARGE MODAL */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-slate-700 p-6 shadow-2xl space-y-4 text-right">
            <button
              onClick={() => {
                setShowTopupModal(false);
                setTalonFeedback(null);
              }}
              className="absolute left-4 top-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">شامكەش ئارقىلىق قالدۇق تولۇقلاش</h2>
              <p className="text-xs text-slate-400">
                پۇلنى تۆۋەندىكى شامكەش ھېساباتىغا يۆتكەپ، تالون نومۇرىنى كىرگۈزۈڭ.
              </p>
            </div>

            {/* Sham Cash Account Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">شامكەش ھېسابات نومۇرى:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">947493</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('947493');
                  setCopiedAccount(true);
                  setTimeout(() => setCopiedAccount(false), 2000);
                }}
                className="w-full py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAccount ? 'نۇسخىلاندى!' : 'نومۇرنى نۇسخىلاش'}</span>
              </button>
            </div>

            {/* Talon Input */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium block">
                يۆتكەش تالون نومۇرى (Talon Number):
              </label>
              <input
                type="text"
                value={shamcashTalon}
                onChange={(e) => setShamcashTalon(e.target.value.replace(/\D/g, ''))}
                placeholder="مەسىلەن: 98471203"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:border-amber-500 outline-none font-mono"
                dir="ltr"
              />
            </div>

            {talonFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  talonFeedback.ok
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {talonFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{talonFeedback.message}</span>
              </div>
            )}

            <button
              onClick={handleTopupSubmit}
              disabled={isSubmittingTalon}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmittingTalon ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>تەكشۈرۈلۈۋاتىدۇ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تالوننى تەستىقلاش</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PWA INSTALLATION GUIDE MODAL */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-slate-700 p-6 shadow-2xl space-y-4 text-right">
            <button
              onClick={() => setShowInstallGuide(false)}
              className="absolute left-4 top-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">
                تېلېفونغا ئەپ قىلىپ قاچىلاش
              </h2>
              <p className="text-xs text-slate-400">
                {selectedAppForInstall?.name || 'MAX-BAZAR ئەپ بازىرى'} نى ئېكرانىڭىزغا ئورنىتىۋېلىڭ.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span>📱 iPhone / Safari نۇسخىسى:</span>
                </div>
                <p className="text-slate-400">
                  Safari تور كۆرگۈچىنىڭ ئاستىدىكى <strong>«Share (ھەمبەھىرلەش)»</strong> كۇنۇپكىسىنى بېسىپ، تىزىملىكتىن <strong>«Add to Home Screen (باش بەتكە قوشۇش)»</strong> نى تاللاڭ.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  <span>🤖 Android / Chrome نۇسخىسى:</span>
                </div>
                <p className="text-slate-400">
                  Chrome تور كۆرگۈچىنىڭ ئوڭ ئۈستىدىكى ئۈچ چىكىت (⋮) نى بېسىپ <strong>«Install app (ئەپنى قاچىلاش)»</strong> ياكى <strong>«Add to Home screen»</strong> نى بېسىڭ.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              چۈشەندىم
            </button>
          </div>
        </div>
      )}

      {/* BOT SETTINGS GUIDE MODAL */}
      {showBotGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-slate-700 p-6 shadow-2xl space-y-4 text-right max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBotGuideModal(false)}
              className="absolute left-4 top-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto mb-2">
                <Bot className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">@maxbazar_bot قا ئەپلەرنى ئۇلاش يېتەكچىسى</h2>
              <p className="text-xs text-slate-400">
                BotFather ئارقىلىق ئەپلەرنى مىنى ئەپ شەكلىدە قوشۇش قەدەملىرى
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-400">1. ئەپ مەركىزىنى بوتنىڭ ئاساسىي كۇنۇپكىسى قىلىش:</div>
                <p className="text-slate-400 text-[11px]">
                  BotFather غا كىرىپ <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">/setmenubutton</code> بۇيرۇقىنى بېرىپ، ئەپ كۇنۇپكا نامىغا <strong>🚀 MAX-BAZAR ئەپ بازىرى</strong> دەپ، ئادرېسقا:
                </p>
                <div className="p-2 rounded-xl bg-slate-950 font-mono text-[11px] text-amber-300 border border-slate-800 select-all" dir="ltr">
                  https://www.auto-cash.app/apps
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-400">2. PUBG Mobile ئەپىنى بىۋاسىتە ئۇلاش:</div>
                <p className="text-slate-400 text-[11px]">
                  BotFather دا <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">/newapp</code> نى بېسىپ:
                  <br />• بوتنى تاللاڭ: <code className="text-sky-300">@maxbazar_bot</code>
                  <br />• ئەپ نامى: <strong>PUBG Mobile UC Store</strong>
                  <br />• قىسقا نامى (short name): <code className="text-amber-300">pubg</code>
                  <br />• تور ئادرېسى:
                </p>
                <div className="p-2 rounded-xl bg-slate-950 font-mono text-[11px] text-amber-300 border border-slate-800 select-all" dir="ltr">
                  https://www.auto-cash.app/apps/pubg
                </div>
                <p className="text-[10px] text-slate-400">
                  شۇنىڭ بىلەن <code className="text-sky-300 font-mono">t.me/maxbazar_bot/pubg</code> لىنىكىسى ھاسىل بولىدۇ!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-400">3. Honor of Kings ئەپىنى ئۇلاش:</div>
                <p className="text-slate-400 text-[11px]">
                  BotFather دا <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">/newapp</code> نى بېسىپ:
                  <br />• بوتنى تاللاڭ: <code className="text-sky-300">@maxbazar_bot</code>
                  <br />• ئەپ نامى: <strong>Honor of Kings Store</strong>
                  <br />• قىسقا نامى (short name): <code className="text-amber-300">hok</code>
                  <br />• تور ئادرېسى:
                </p>
                <div className="p-2 rounded-xl bg-slate-950 font-mono text-[11px] text-amber-300 border border-slate-800 select-all" dir="ltr">
                  https://www.auto-cash.app/apps/honor-of-kings
                </div>
                <p className="text-[10px] text-slate-400">
                  شۇنىڭ بىلەن <code className="text-sky-300 font-mono">t.me/maxbazar_bot/hok</code> لىنىكىسى ھاسىل بولىدۇ!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBotGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              بولدى، چۈشەندىم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Crown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}
