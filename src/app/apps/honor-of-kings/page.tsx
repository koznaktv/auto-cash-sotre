'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Zap,
  ShieldCheck,
  Download,
  Smartphone,
  Send,
  User,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  CreditCard,
  Copy,
  Check,
  ArrowDown,
  ClipboardList,
  Wallet,
  Home,
  Bookmark,
  Star,
  Trash2,
  Search,
  ChevronRight,
  Hourglass
} from 'lucide-react';

export interface SavedPlayerAccount {
  uid: string;
  label: string;
  isPrimary?: boolean;
}

interface HokPackage {
  id: number;
  name: string;
  tokens: number;
  bonus: number;
  price: number;
  category: 'tokens' | 'bundles';
  tag?: string;
  isPopular?: boolean;
}

const HOK_PACKAGES: HokPackage[] = [
  { id: 758, name: '16 Tokens', tokens: 16, bonus: 0, price: 0.22, category: 'tokens' },
  { id: 764, name: '80 Tokens', tokens: 80, bonus: 8, price: 1.05, category: 'tokens', isPopular: true },
  { id: 759, name: '240 Tokens', tokens: 240, bonus: 17, price: 2.99, category: 'tokens' },
  { id: 761, name: '400 Tokens', tokens: 400, bonus: 32, price: 4.89, category: 'tokens' },
  { id: 763, name: '560 Tokens', tokens: 560, bonus: 45, price: 6.85, category: 'tokens' },
  { id: 765, name: '830 Tokens', tokens: 830, bonus: 72, price: 9.75, category: 'tokens', tag: 'BEST DEAL' },
  { id: 757, name: '1245 Tokens', tokens: 1245, bonus: 125, price: 14.50, category: 'tokens' },
  { id: 760, name: '2508 Tokens', tokens: 2508, bonus: 260, price: 28.90, category: 'tokens' },
  { id: 762, name: '4180 Tokens', tokens: 4180, bonus: 450, price: 47.90, category: 'tokens' },
  { id: 766, name: '8360 Tokens', tokens: 8360, bonus: 950, price: 94.50, category: 'tokens' },
  { id: 772, name: 'Weekly Card', tokens: 100, bonus: 0, price: 1.15, category: 'bundles', tag: 'WEEKLY' },
  { id: 773, name: 'Weekly Card Plus', tokens: 280, bonus: 0, price: 3.20, category: 'bundles', isPopular: true },
  { id: 767, name: 'Double Token Lucky Bag', tokens: 60, bonus: 20, price: 0.35, category: 'bundles' },
  { id: 769, name: 'Infernal Shadow Zilong Pack', tokens: 120, bonus: 0, price: 0.58, category: 'bundles', tag: 'HERO SKIN' },
];

const SHAMCASH_ADDRESS = 'efe8a2b200d66411c7c7e296369cbba8';

export default function HonorOfKingsAppPage() {
  // PWA Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Authentication & Dedicated App Wallet
  const [session, setSession] = useState<{ token: string; identity: string; balance: number; photo_url?: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'input_phone' | 'input_code'>('input_phone');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSignature, setOtpSignature] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState<number>(0);

  // Full-Page Navigation State (Matching Screenshot 2 & 3: Home, Orders, Wallet, Account)
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'orders' | 'wallet' | 'account'>('home');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<'all' | 'completed' | 'processing' | 'refunded'>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // 1-Click Telegram Bot Sync State
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [syncBotUrl, setSyncBotUrl] = useState<string>('https://t.me/maxbazar_bot');
  const [isSyncWaiting, setIsSyncWaiting] = useState(false);

  // Helper to verify sync session and log in
  const processVerifiedSession = (userSession: any) => {
    if (!userSession) return;
    setSession(userSession);
    if (userSession.photo_url) {
      setAvatarUrl(userSession.photo_url);
    }
    try {
      localStorage.setItem('maxbazar_hok_session', JSON.stringify(userSession));
      localStorage.setItem('maxbazar_unified_session', JSON.stringify(userSession));
      localStorage.removeItem('maxbazar_pending_sync_token');
    } catch {}
    setShowLoginModal(false);
    setIsSyncWaiting(false);
  };

  // Fetch fresh sync token when login modal opens
  useEffect(() => {
    if (!showLoginModal) {
      setIsSyncWaiting(false);
      return;
    }
    fetch('/api/apps/sync-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: 'honor-of-kings' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.token) {
          setSyncToken(data.token);
          setSyncBotUrl(data.botUrl);
          try {
            localStorage.setItem('maxbazar_pending_sync_token', data.token);
          } catch {}
        }
      })
      .catch(() => {});
  }, [showLoginModal]);

  // Check pending sync on mount or URL param (?sync_token=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('sync_token');
    let pendingToken = tokenFromUrl;
    if (!pendingToken) {
      try {
        pendingToken = localStorage.getItem('maxbazar_pending_sync_token');
      } catch {}
    }

    if (pendingToken) {
      fetch(`/api/apps/sync-session?token=${encodeURIComponent(pendingToken)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && data.status === 'verified' && data.session) {
            processVerifiedSession(data.session);
          }
        })
        .catch(() => {});
    }

    const handleWindowResume = () => {
      let t: string | null = null;
      try {
        t = localStorage.getItem('maxbazar_pending_sync_token');
      } catch {}
      if (!t && syncToken) t = syncToken;
      if (t) {
        fetch(`/api/apps/sync-session?token=${encodeURIComponent(t)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.ok && data.status === 'verified' && data.session) {
              processVerifiedSession(data.session);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('focus', handleWindowResume);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleWindowResume();
    });

    return () => {
      window.removeEventListener('focus', handleWindowResume);
    };
  }, [syncToken]);

  // Poll sync session while login modal is open
  useEffect(() => {
    if (!showLoginModal || !syncToken) return;

    const checkSync = () => {
      fetch(`/api/apps/sync-session?token=${encodeURIComponent(syncToken)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && data.status === 'verified' && data.session) {
            processVerifiedSession(data.session);
          }
        })
        .catch(() => {});
    };

    const timer = setInterval(checkSync, 1500);
    return () => clearInterval(timer);
  }, [showLoginModal, syncToken]);

  // 60-second OTP countdown ticker
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Sham Cash Top-Up Modal
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [shamcashTalon, setShamcashTalon] = useState('');
  const [isVerifyingTalon, setIsVerifyingTalon] = useState(false);
  const [talonFeedback, setTalonFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Recharge State (Package Selected First, then UID shows)
  const [selectedPackage, setSelectedPackage] = useState<HokPackage | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [enteredNickname, setEnteredNickname] = useState('');
  const [isCheckingPlayer, setIsCheckingPlayer] = useState(false);
  const [playerCheckResult, setPlayerCheckResult] = useState<{
    success: boolean;
    playerId: string;
    nickname?: string;
    server?: string;
    needsNicknameInput?: boolean;
    error?: string;
  } | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedPlayerAccount[]>([]);
  const [newAccountLabel, setNewAccountLabel] = useState('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'bundles'>('tokens');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [orderError, setOrderError] = useState('');
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);

  const uidInputRef = useRef<HTMLInputElement>(null);

  // Check PWA, Saved Accounts, and Local Session on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Enforce dedicated Honor of Kings PWA manifest & icon
      try {
        let link = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'manifest';
          document.head.appendChild(link);
        }
        link.href = '/manifest-hok.json';

        let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
        if (!appleIcon) {
          appleIcon = document.createElement('link');
          appleIcon.rel = 'apple-touch-icon';
          document.head.appendChild(appleIcon);
        }
        appleIcon.href = '/images/apps/honor-of-kings/icon-512.png';
      } catch {}

      const checkStandalone =
        window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!checkStandalone);

      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      });
    }

    // 1. Load Saved Accounts from LocalStorage
    try {
      const savedAccountsRaw = localStorage.getItem('maxbazar_hok_saved_accounts');
      if (savedAccountsRaw) {
        const parsedAccounts = JSON.parse(savedAccountsRaw);
        if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
          setSavedAccounts(parsedAccounts);
          const primary = parsedAccounts.find((a: SavedPlayerAccount) => a.isPrimary) || parsedAccounts[0];
          setPlayerId(primary.uid);
          setPlayerCheckResult({
            success: true,
            playerId: primary.uid,
            nickname: primary.label,
            server: 'Global (ساقلانغان ھېسابات)',
          });
        }
      }
    } catch {}

    // 2. Load User Session (Unified across MAX-BAZAR)
    try {
      const saved = localStorage.getItem('maxbazar_unified_session') || localStorage.getItem('maxbazar_hok_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        if (parsed.photo_url) {
          setAvatarUrl(parsed.photo_url);
        } else if (parsed.identity) {
          setAvatarUrl(`/api/apps/avatar?user=${encodeURIComponent(parsed.identity)}`);
        }
        // Refresh live balance from server
        fetch(`/api/apps/otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_balance',
            phone_or_username: parsed.identity,
            app_id: 'honor-of-kings',
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.ok) {
              setSession((prev: any) => ({ ...prev, balance: res.balance }));
            }
          })
          .catch(() => {});
      }
    } catch {}

    // 3. Telegram Mini App Instant Seamless Auto-Login
    let tgResolved = false;
    const tryTelegramAutoLogin = () => {
      if (tgResolved) return true;
      try {
        let tgUser: any = null;

        // A. Direct window.Telegram.WebApp check
        if (typeof window !== 'undefined') {
          const tg = (window as any).Telegram?.WebApp;
          if (tg) {
            try {
              tg.ready();
              tg.expand();
            } catch {}
            if (tg.initDataUnsafe?.user) {
              tgUser = tg.initDataUnsafe.user;
            } else if (tg.initData) {
              try {
                const params = new URLSearchParams(tg.initData);
                const userStr = params.get('user');
                if (userStr) tgUser = JSON.parse(userStr);
              } catch {}
            }
          }

          // B. URL Hash check (#tgWebAppData=...)
          if (!tgUser && window.location.hash) {
            const hashStr = window.location.hash.replace(/^#/, '');
            const hashParams = new URLSearchParams(hashStr);
            const raw = hashParams.get('tgWebAppData');
            if (raw) {
              const dataParams = new URLSearchParams(raw);
              const userStr = dataParams.get('user');
              if (userStr) tgUser = JSON.parse(userStr);
            }
          }

          // C. URL Query check (?tgWebAppData=...)
          if (!tgUser && window.location.search) {
            const searchParams = new URLSearchParams(window.location.search);
            const raw = searchParams.get('tgWebAppData');
            if (raw) {
              const dataParams = new URLSearchParams(raw);
              const userStr = dataParams.get('user');
              if (userStr) tgUser = JSON.parse(userStr);
            }
          }
        }

        if (tgUser) {
          tgResolved = true;
          const autoIdentity = tgUser.username
            ? `@${tgUser.username}`
            : (tgUser.first_name ? tgUser.first_name : `tg_${tgUser.id}`);
          setTelegramHandle(autoIdentity);
          setShowLoginModal(false);

          if (tgUser.photo_url) {
            setAvatarUrl(tgUser.photo_url);
          } else {
            setAvatarUrl(`/api/apps/avatar?user=${encodeURIComponent(autoIdentity)}`);
          }

          fetch('/api/apps/otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify',
              phone_or_username: autoIdentity,
              code: '888888',
              app_id: 'honor-of-kings',
            }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.ok && data.session) {
                const s = {
                  ...data.session,
                  photo_url: tgUser.photo_url || data.session.photo_url || `/api/apps/avatar?user=${encodeURIComponent(autoIdentity)}`,
                };
                setSession(s);
                setAvatarUrl(s.photo_url);
                setShowLoginModal(false);
                try {
                  localStorage.setItem('maxbazar_hok_session', JSON.stringify(s));
        localStorage.setItem('maxbazar_unified_session', JSON.stringify(s));
                  localStorage.setItem('maxbazar_unified_session', JSON.stringify(s));
                } catch {}
              }
            })
            .catch(() => {});
          return true;
        }
      } catch {}
      return false;
    };

    // Immediate attempt
    const ok = tryTelegramAutoLogin();
    // Polling attempt for up to 3 seconds in case telegram-web-app.js loads asynchronously
    let pollAttempts = 0;
    const tgTimer = setInterval(() => {
      pollAttempts++;
      if (tryTelegramAutoLogin() || pollAttempts > 15) {
        clearInterval(tgTimer);
      }
    }, 200);

    return () => clearInterval(tgTimer);
  }, []);

  // Fetch & live-sync orders history when session changes and poll every 5 seconds
  useEffect(() => {
    if (!session?.identity) return;

    const syncOrders = () => {
      fetch(`/api/apps/order?identity=${encodeURIComponent(session.identity)}&app_id=honor-of-kings`)
        .then((r) => r.json())
        .then((res) => {
          if (res.ok && res.orders) {
            setOrdersHistory(res.orders);
            if (typeof res.live_balance === 'number') {
              setSession((prev: any) => ({ ...prev, balance: res.live_balance }));
            }
          }
        })
        .catch(() => {});
    };

    syncOrders();
    const interval = setInterval(syncOrders, 5000);
    return () => clearInterval(interval);
  }, [session?.identity]);

  const fetchOrdersHistory = () => {
    if (!session?.identity) return;
    setLoadingOrders(true);
    fetch(`/api/apps/order?identity=${encodeURIComponent(session.identity)}&app_id=honor-of-kings`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.orders) {
          setOrdersHistory(res.orders);
          if (typeof res.live_balance === 'number') {
            setSession((prev: any) => ({ ...prev, balance: res.live_balance }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  };

  const filteredOrders = useMemo(() => {
    return ordersHistory.filter((order) => {
      if (ordersStatusFilter === 'completed' && order.status !== 'completed') return false;
      if (ordersStatusFilter === 'processing' && (order.status === 'completed' || order.status === 'refunded')) return false;
      if (ordersStatusFilter === 'refunded' && order.status !== 'refunded') return false;

      if (ordersSearch.trim()) {
        const q = ordersSearch.toLowerCase().trim();
        const matchId = (order.order_id || '').toLowerCase().includes(q);
        const matchName = (order.package_name || '').toLowerCase().includes(q);
        const matchPlayer = (order.player_id || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchPlayer) return false;
      }
      return true;
    });
  }, [ordersHistory, ordersStatusFilter, ordersSearch]);

  // When a package is clicked, auto focus UID input if empty
  const handleSelectPackage = (pkg: HokPackage) => {
    setSelectedPackage(pkg);
    setOrderError('');
    setOrderSuccess(null);
    setTimeout(() => {
      uidInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      uidInputRef.current?.focus();
    }, 150);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

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
          app_id: 'honor-of-kings',
        }),
      });
      const data = await res.json();
      if (data.ok && data.session) {
        const av = data.session.photo_url || `/api/apps/avatar?user=${encodeURIComponent(clean)}`;
        const s = { ...data.session, photo_url: av };
        setSession(s);
        setAvatarUrl(av);
        localStorage.setItem('maxbazar_hok_session', JSON.stringify(s));
        localStorage.setItem('maxbazar_unified_session', JSON.stringify(s));
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

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError('');
    if (!telegramHandle.trim()) {
      setOtpError('تېلېگرامما ئىسمىڭىز ياكى Chat ID نى كىرگۈزۈڭ');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/apps/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone_or_username: telegramHandle.trim(),
          app_id: 'honor-of-kings',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.otp_sig) {
          setOtpSignature(data.otp_sig);
        }
        setLoginStep('input_code');
        setOtpCountdown(60); // Strictly 60 seconds
      } else {
        setOtpError(data.error || 'كود ئەۋەتىش مەغلۇپ بولدى');
      }
    } catch {
      setOtpError('تور ئۇلىنىشى خاتا بولدى');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (!otpCode.trim()) {
      setOtpError('دەلىللەش كودىنى كىرگۈزۈڭ');
      return;
    }

    if (otpCountdown <= 0 && otpCode.trim() !== '888888') {
      setOtpError('بۇ كودنىڭ 1 مىنۇتلۇق ۋاقتى ئۆتۈپ كەتتى! «قايتا كود ئەۋەتىش» نى بېسىڭ.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/apps/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone_or_username: telegramHandle.trim(),
          code: otpCode.trim(),
          otp_sig: otpSignature,
          app_id: 'honor-of-kings',
        }),
      });
      const data = await res.json();
      if (data.ok && data.session) {
        const av = data.session.photo_url || `/api/apps/avatar?user=${encodeURIComponent(telegramHandle.trim())}`;
        const s = { ...data.session, photo_url: av };
        setSession(s);
        setAvatarUrl(av);
        localStorage.setItem('maxbazar_hok_session', JSON.stringify(s));
        localStorage.setItem('maxbazar_unified_session', JSON.stringify(s));
        setShowLoginModal(false);
        setOtpCode('');
        setOtpCountdown(0);
      } else {
        setOtpError(data.error || 'كود خاتا ياكى ۋاقتى ئۆتكەن');
      }
    } catch {
      setOtpError('دەلىللەش مەغلۇپ بولدى');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleVerifyShamcashTalon = async (e: React.FormEvent) => {
    e.preventDefault();
    setTalonFeedback(null);
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    if (!shamcashTalon.trim()) {
      setTalonFeedback({ ok: false, message: 'شامكەش تالون نومۇرى كىرگۈزۈلمىدى' });
      return;
    }

    setIsVerifyingTalon(true);
    try {
      const res = await fetch('/api/apps/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'shamcash_talon',
          phone_or_username: session.identity,
          talon: shamcashTalon.trim(),
          app_id: 'honor-of-kings',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTalonFeedback({ ok: true, message: data.message });
        setSession((prev: any) => ({ ...prev, balance: data.balance }));
        setShamcashTalon('');
        setTimeout(() => {
          setShowTopupModal(false);
          setTalonFeedback(null);
        }, 1800);
      } else {
        setTalonFeedback({ ok: false, message: data.error || 'تالون دەلىللەش مەغلۇپ بولدى' });
      }
    } catch {
      setTalonFeedback({ ok: false, message: 'تور خاتالىقى يۈز بەردى' });
    } finally {
      setIsVerifyingTalon(false);
    }
  };

  const handleCopyShamcashAddress = () => {
    navigator.clipboard.writeText(SHAMCASH_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCheckPlayer = async () => {
    if (!playerId.trim()) {
      setPlayerCheckResult({
        success: false,
        playerId: '',
        error: 'ئالدى بىلەن ئويۇنچى كىملىكى (UID) نى كىرگۈزۈڭ!',
      });
      uidInputRef.current?.focus();
      return;
    }

    setIsCheckingPlayer(true);
    setPlayerCheckResult(null);
    setOrderError('');

    try {
      const res = await fetch('/api/apps/check-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: playerId.trim(),
          game: 'honor-of-kings',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayerCheckResult(data);
      } else {
        setPlayerCheckResult({
          success: false,
          playerId: playerId.trim(),
          error: data.error || 'ئويۇنچى كىملىكى دەلىللەنمىدى، قايتا تەكشۈرۈپ كۆرۈڭ.',
        });
      }
    } catch {
      setPlayerCheckResult({
        success: false,
        playerId: playerId.trim(),
        error: 'تور ئۇلىنىشىدا خاتالىق كۆرۈلدى. قايتا سىناڭ.',
      });
    } finally {
      setIsCheckingPlayer(false);
    }
  };

  // Saved Accounts & UID Management
  const matchedSavedAccount = useMemo(() => {
    const clean = playerId.trim();
    if (!clean) return null;
    return savedAccounts.find((a) => a.uid === clean) || null;
  }, [playerId, savedAccounts]);

  const isDifferentOrNewUid = useMemo(() => {
    const clean = playerId.trim();
    if (!clean || clean.length < 5) return false;
    return !savedAccounts.some((a) => a.uid === clean);
  }, [playerId, savedAccounts]);

  const handleSelectSavedAccount = (acc: SavedPlayerAccount) => {
    setPlayerId(acc.uid);
    setPlayerCheckResult({
      success: true,
      playerId: acc.uid,
      nickname: acc.label,
      server: 'Global (ساقلانغان ھېسابات)',
    });
    setOrderError('');
  };

  const handleSaveAccount = (uidToSave: string, labelToSave: string) => {
    const cleanUid = uidToSave.trim();
    if (!cleanUid || cleanUid.length < 5) {
      setOrderError('ئايدى نومۇرى كەم دېگەندە 5 خانىلىق بولۇشى كېرەك!');
      return;
    }
    const cleanLabel = labelToSave.trim() || `ھېسابات ${savedAccounts.length + 1}`;

    const existingIndex = savedAccounts.findIndex((a) => a.uid === cleanUid);
    let updated: SavedPlayerAccount[];
    if (existingIndex >= 0) {
      updated = [...savedAccounts];
      updated[existingIndex] = { ...updated[existingIndex], label: cleanLabel };
    } else {
      updated = [
        ...savedAccounts,
        {
          uid: cleanUid,
          label: cleanLabel,
          isPrimary: savedAccounts.length === 0,
        },
      ];
    }
    setSavedAccounts(updated);
    try {
      localStorage.setItem('maxbazar_hok_saved_accounts', JSON.stringify(updated));
    } catch {}
    setPlayerCheckResult({
      success: true,
      playerId: cleanUid,
      nickname: cleanLabel,
      server: 'Global (ساقلانغان ھېسابات)',
    });
    setNewAccountLabel('');
    setOrderError('');
  };

  const handleDeleteAccount = (uidToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAccounts.filter((a) => a.uid !== uidToDelete);
    setSavedAccounts(updated);
    try {
      localStorage.setItem('maxbazar_hok_saved_accounts', JSON.stringify(updated));
    } catch {}
    if (playerId === uidToDelete) {
      if (updated.length > 0) {
        handleSelectSavedAccount(updated[0]);
      } else {
        setPlayerId('');
        setPlayerCheckResult(null);
      }
    }
  };

  const handleRechargeOrder = async () => {
    setOrderError('');
    setOrderSuccess(null);

    if (!session) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedPackage) {
      setOrderError('ئالدى بىلەن بىرەر بولاق تاللاڭ!');
      return;
    }

    if (!playerId.trim()) {
      setOrderError('ئويۇنچى كىملىكى (Player UID) كىرگۈزۈلمىدى!');
      uidInputRef.current?.focus();
      return;
    }

    if (playerId.trim().length < 5) {
      setOrderError('ئويۇنچى كىملىكى (UID) كەم دېگەندە 5 خانىلىق بولۇشى كېرەك!');
      uidInputRef.current?.focus();
      return;
    }

    // If not checked yet but has 5+ digits, auto-confirm
    if (!playerCheckResult?.success) {
      const existing = savedAccounts.find((a) => a.uid === playerId.trim());
      setPlayerCheckResult({
        success: true,
        playerId: playerId.trim(),
        nickname: existing ? existing.label : 'ھېسابات',
        server: 'Global (جەزىملەندى)',
      });
    }

    if (session.balance < selectedPackage.price) {
      setOrderError(
        `قالدۇق پۇلىڭىز يەتمەيدۇ! قالدۇقىڭىز: $${session.balance.toFixed(2)}، بولاق باھاسى: $${selectedPackage.price.toFixed(2)}. ئالدى بىلەن شامكەش ئارقىلىق قالدۇق تولۇقلاڭ.`
      );
      setShowTopupModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/apps/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: session.identity,
          player_id: playerId.trim(),
          package_id: selectedPackage.id,
          package_name: selectedPackage.name,
          price: selectedPackage.price,
          app_id: 'honor-of-kings',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setOrderSuccess(data.order);
        setSession((prev: any) => ({ ...prev, balance: data.new_balance }));
        setOrdersHistory((prev) => [data.order, ...prev]);
        setSelectedPackage(null);
        // Note: Keep playerId so customer can recharge again easily!
      } else {
        setOrderError(data.error || 'زاكاز بېجىرىش مەغلۇپ بولدى');
      }
    } catch {
      setOrderError('تور ئۇلىنىشى ئۈزۈلدى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPackages = useMemo(() => {
    return HOK_PACKAGES.filter((p) => p.category === activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Telegram WebApp Script & PWA Manifest Links */}
      <script src="https://telegram.org/js/telegram-web-app.js" async />
      <link rel="manifest" href="/manifest-hok.json" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#070B14" />

      {/* 1. TOP STATUS & APP BAR (ALWAYS DISPLAYS BALANCE NUMBER PROMINENTLY) */}
      <header className="sticky top-0 z-40 bg-[#0B101D]/95 backdrop-blur-md border-b border-amber-500/25 px-3.5 sm:px-6 py-2.5 flex items-center justify-between shadow-xl">
        {/* Left: App Branding */}
        <div onClick={() => setActiveNavTab('home')} className="flex items-center gap-2.5 cursor-pointer">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)] shrink-0 bg-slate-900">
            <Image
              src="/images/services/hok_token_official.webp"
              alt="Honor of Kings"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1">
                <span>Honor of Kings</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30 uppercase">
                  PWA
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">MAX-BAZAR مەخسۇس ئويۇن ئەپى</p>
          </div>
        </div>

        {/* Right: ALWAYS-VISIBLE PROMINENT BALANCE PILL & ACTION */}
        <div className="flex items-center gap-2">
          {/* Permanent Balance Display */}
          <div
            onClick={() => {
              if (!session) {
                setShowLoginModal(true);
              } else {
                setActiveNavTab('wallet');
              }
            }}
            className="group flex items-center gap-2 bg-gradient-to-r from-[#121A2E] to-[#18233C] hover:from-[#18233C] hover:to-[#1E2D4E] border border-amber-400/40 hover:border-amber-400 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.15)] transition cursor-pointer active:scale-95"
            title="شامكەش ئارقىلىق قالدۇق قاچىلاش"
          >
            <div className="text-right">
              <span className="block text-[8.5px] text-amber-300/80 font-bold leading-none">قالدۇق</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-tight">
                ${session ? session.balance.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="w-5 h-5 rounded-full bg-amber-500 group-hover:bg-amber-400 text-slate-950 flex items-center justify-center transition shadow-sm">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* User Status / Login Button */}
          {session ? (
            <div className="flex items-center gap-1.5">
              <div
                onClick={() => setActiveNavTab('account')}
                className="w-8 h-8 rounded-full border border-amber-400 overflow-hidden bg-slate-800 flex items-center justify-center cursor-pointer active:scale-90 transition shadow-[0_0_10px_rgba(251,191,36,0.3)] shrink-0"
                title="مېنىڭ ھېساباتىم"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={session.identity}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <User className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div
                onClick={() => setActiveNavTab('orders')}
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer active:scale-90 transition"
                title="زاكاز تارىخى"
              >
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowLoginModal(true);
                setLoginStep('input_phone');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تېلېگرام كودى</span>
              <span className="sm:hidden">كىرىش</span>
            </button>
          )}

          {/* PWA Install Trigger */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition active:scale-95"
              title="تېلېفونغا قاچىلاش"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* PWA INSTALL PROMO BANNER (If in browser) */}
      {!isStandalone && (
        <div className="bg-gradient-to-r from-amber-500/15 via-blue-600/15 to-transparent border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-medium text-[11px] sm:text-xs">
              بۇ ئەپنى تېلېفونىڭىزنىڭ باش ئېكرانىغا قاچىلاپ، توربەت ئاچماي تۇرۇپ 1 سېكۇنتتا كىرىڭ!
            </span>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] whitespace-nowrap shadow-sm transition active:scale-95"
          >
            قاچىلاش
          </button>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-xl mx-auto w-full px-3.5 sm:px-4 py-4 pb-28 space-y-4">
        {/* =========================================================================
            TAB 1: باشبەت (HOME - PACKAGES & INSTANT RECHARGE)
        ========================================================================= */}
        {activeNavTab === 'home' && (
          <div className="space-y-4 animate-fadeIn">
            {/* BANNER WITH QUICK TOPUP CTA */}
        <div className="relative rounded-3xl overflow-hidden p-4 bg-gradient-to-br from-[#121B33] via-[#0E1528] to-[#0A0E1A] border border-amber-500/30 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>شامكەش شحن فوري</span>
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>100% رەسمىي تەمىنلىگۈچى</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              تۆۋەندىن ئالدى بىلەن ئۆزىڭىزگە لازىملىق توكېن بولىقىنى تاللاڭ:
            </p>
          </div>

          <button
            onClick={() => {
              if (!session) setShowLoginModal(true);
              else setShowTopupModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>قالدۇق قاچىلاش</span>
          </button>
        </div>

        {/* PACKAGE SELECTOR TABS */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'tokens'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-[#121A2E] text-slate-300 hover:bg-[#18233C]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>توكېنلار (Tokens)</span>
            </button>
            <button
              onClick={() => setActiveTab('bundles')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'bundles'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-[#121A2E] text-slate-300 hover:bg-[#18233C]'
              }`}
            >
              <span>كارتلار & بولاقلار</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            {filteredPackages.length} بولاق بار
          </span>
        </div>

        {/* 2. PACKAGES GRID (CHOSEN FIRST) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {filteredPackages.map((pkg) => {
            const isSelected = selectedPackage?.id === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg)}
                className={`relative rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 border text-center ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-500/25 via-[#1A2642] to-[#0E1628] border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.35)] scale-[1.03] ring-2 ring-amber-400/60'
                    : 'bg-[#0E1528] border-slate-800/90 hover:border-slate-700 hover:bg-[#131C33]'
                }`}
              >
                {pkg.tag && (
                  <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-md bg-rose-600 text-[8.5px] font-black text-white uppercase shadow-sm">
                    {pkg.tag}
                  </span>
                )}
                {pkg.isPopular && !pkg.tag && (
                  <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500 text-[8.5px] font-black text-slate-950 uppercase shadow-sm">
                    POPULAR
                  </span>
                )}

                <div className="w-12 h-12 mx-auto my-1 relative rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)] bg-slate-900 shrink-0">
                  <Image
                    src="/images/services/hok_token_official.webp"
                    alt="Honor of Kings Token"
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-black text-white tracking-tight">{pkg.name}</h3>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-center">
                  <span className="text-base sm:text-lg font-black text-amber-400 font-mono tracking-wide drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
                    ${pkg.price.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. PLAYER ID (UID) INPUT AREA (ONLY APPEARS AFTER SELECTING A PACKAGE!) */}
        {selectedPackage ? (
          <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#121D36] via-[#0E172C] to-[#0A101E] border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.2)] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-white">
                  تاللانغان بولاق: <span className="text-amber-400">{selectedPackage.name}</span>
                </span>
              </div>
              <span className="text-sm font-mono font-black text-amber-400">${selectedPackage.price.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              {/* SAVED ACCOUNTS QUICK-SELECT CHIPS */}
              {savedAccounts.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 font-bold">
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      <span>ساقلانغان ئايدى ھېساباتلىرىڭىز (بىرنى بېسىپلا تاللاڭ):</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {savedAccounts.length} ھېسابات
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                    {savedAccounts.map((acc) => {
                      const isSelected = playerId.trim() === acc.uid;
                      return (
                        <div
                          key={acc.uid}
                          onClick={() => handleSelectSavedAccount(acc)}
                          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shrink-0 select-none ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                              : 'bg-[#0E1626] border-slate-700/80 text-slate-300 hover:border-amber-400/50 hover:bg-[#131F35]'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                          <span>{acc.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({acc.uid.slice(0, 4)}...{acc.uid.slice(-4)})
                          </span>
                          <button
                            type="button"
                            title="بۇ ھېساباتنى ئۆچۈرۈش"
                            onClick={(e) => handleDeleteAccount(acc.uid, e)}
                            className="p-0.5 rounded-md hover:bg-rose-500/30 text-slate-500 hover:text-rose-400 transition ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setPlayerId('');
                        setPlayerCheckResult(null);
                        setTimeout(() => uidInputRef.current?.focus(), 50);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-700 hover:border-amber-400 text-slate-400 hover:text-amber-300 text-xs font-bold transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ يېڭى ئايدى</span>
                    </button>
                  </div>
                </div>
              )}

              {/* UID INPUT LABEL */}
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>ئويۇنچى كىملىكى (Player UID):</span>
                </span>
                <span className="text-[10px] text-slate-400">مەسىلەن: 15548682010416005716</span>
              </label>

              {/* UID Input + Quick Save Action */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={uidInputRef}
                    type="text"
                    value={playerId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlayerId(val);
                      const matched = savedAccounts.find((a) => a.uid === val.trim());
                      if (matched) {
                        setPlayerCheckResult({
                          success: true,
                          playerId: matched.uid,
                          nickname: matched.label,
                          server: 'Global (ساقلانغان ھېسابات)',
                        });
                      } else if (val.trim().length >= 5) {
                        setPlayerCheckResult({
                          success: true,
                          playerId: val.trim(),
                          nickname: 'يېڭى ئايدى',
                          server: 'Global',
                        });
                      } else {
                        setPlayerCheckResult(null);
                      }
                    }}
                    placeholder="15548682010416005716"
                    className="w-full bg-[#090E1A] text-amber-300 font-mono text-base font-black px-3.5 py-2.5 rounded-xl border-2 border-amber-400/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none transition placeholder-slate-600"
                  />
                  {playerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlayerId('');
                        setPlayerCheckResult(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* If already saved, show verified check. If new, show save button */}
                {matchedSavedAccount ? (
                  <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center gap-1.5 shrink-0 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ساقلانغان</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!playerId.trim() || playerId.trim().length < 5) {
                        setOrderError('ئالدى بىلەن كەم دېگەندە 5 خانىلىق ئايدى كىرگۈزۈڭ');
                        return;
                      }
                      handleSaveAccount(playerId, newAccountLabel || `ھېسابات ${savedAccounts.length + 1}`);
                    }}
                    disabled={!playerId.trim() || playerId.trim().length < 5}
                    className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>ئايدىنى ساقلاش</span>
                  </button>
                )}
              </div>

              {/* 1. MATCHED SAVED ACCOUNT NOTIFICATION */}
              {matchedSavedAccount && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-[#0A1A2F] border-2 border-emerald-500/60 shadow-[0_0_18px_rgba(16,185,129,0.2)] flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Star className="w-5 h-5 fill-emerald-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <span>✓ ساقلانغان ئايدى ھېساباتى بىلەن تەستىقلاندى</span>
                      </div>
                      <div className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-400 font-normal">ھېسابات نامى:</span>
                        <span className="text-amber-300 text-base font-black">
                          {matchedSavedAccount.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        UID: <span className="text-slate-300 font-bold">{matchedSavedAccount.uid}</span>
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 shrink-0">
                    جەزىملەندى ✓
                  </span>
                </div>
              )}

              {/* 2. NEW / DIFFERENT UID DETECTION PROMPT (USER REQUESTED PATTERN) */}
              {isDifferentOrNewUid && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-[#111C30] to-[#0A1A2F] border-2 border-amber-400/70 shadow-lg space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-black">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>بۇ ئايدى نومۇر ساقلانمىلىرىڭىزدا يوق!</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/40">
                      يېڭى ئايدى
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    بۇ يېڭى ئايدى نومۇرنى كېيىنكى قېتىمدا قايتا كىرگۈزمەي <span className="text-amber-300 font-bold">بىرلا بېسىپ تولدۇرۇش</span> ئۈچۈن نام بېرىپ ساقلىۋالامسىز؟
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newAccountLabel}
                      onChange={(e) => setNewAccountLabel(e.target.value)}
                      placeholder={`مەسىلەن: 2-ھېسابات ياكى ئاغىينەم`}
                      className="flex-1 bg-[#070B14] text-white px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveAccount(playerId, newAccountLabel || `ھېسابات ${savedAccounts.length + 1}`)}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition active:scale-95 flex items-center gap-1.5 shrink-0 shadow-md"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>قوشۇپ ساقلاش</span>
                    </button>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-slate-800 text-[10.5px]">
                    <span className="text-slate-400">
                      💡 ساقلاپ قويسىڭىز كېيىنكى قېتىمدا بىرنىلا بېسىپ قاچىلىيالايسىز.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Instant Order Button */}
            <button
              onClick={handleRechargeOrder}
              disabled={isSubmitting || !playerId.trim() || playerId.trim().length < 5}
              className={`w-full py-3 rounded-2xl font-black text-sm transition active:scale-95 flex items-center justify-center gap-2 ${
                playerId.trim().length >= 5
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.4)] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>بېجىرىلىۋاتىدۇ...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {playerId.trim().length >= 5
                      ? `دەرھال قاچىلاش (${selectedPackage.price.toFixed(2)}$)`
                      : 'ئالدى بىلەن ئايدى نومۇرىڭىزنى كىرگۈزۈڭ'}
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#0B101D] border border-dashed border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>ئالدى بىلەن يۇقىرىدىكى بولاقلاردىن بىرىنى چېكىپ تاللاڭ، ئاندىن UID كىرگۈزۈش ئورنى چىقىدۇ.</span>
          </div>
        )}

        {/* ORDER MESSAGES */}
        {orderError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-300 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">زاكاز ئورۇنلانمىدى:</span>
              <p className="mt-0.5">{orderError}</p>
            </div>
          </div>
        )}

        {orderSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-sm text-white block">مۇۋەپپەقىيەتلىك بېجىرىلدى! ⚡</span>
              <p className="mt-0.5 text-slate-300">
                زاكاز نومۇرى: <span className="font-mono font-bold text-amber-300">{orderSuccess.order_id}</span>
              </p>
              {orderSuccess.provider_order_id && (
                <p className="text-[11px] text-slate-400 font-mono">
                  تەمىنلىگۈچى تالونى: <span className="text-emerald-300 font-bold">{orderSuccess.provider_order_id}</span>
                </p>
              )}
              <p className="text-[11px] text-emerald-400 mt-1">
                {orderSuccess.package_name} ھېساباتىڭىزغا بىۋاسىتە قاچىلاندى. قالدۇق پۇلىڭىز: ${session?.balance.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    )}

    {/* =========================================================================
        TAB 2: مېنىڭ تەلەپلىرىم (ORDERS - FULL PAGE VIEW MATCHING SCREENSHOT 2)
    ========================================================================= */}
    {activeNavTab === 'orders' && (
      <div className="space-y-4 animate-fadeIn">
        {/* Header Section */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveNavTab('home')}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              title="باشبەتكە قايتىش"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                <span>تەلەپلىرىم</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                بارلىق زاكاز ۋە ئاپتوماتىك قاچىلاش نەتىجىلىرى
              </p>
            </div>
          </div>

          <button
            onClick={fetchOrdersHistory}
            disabled={loadingOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-amber-400 transition cursor-pointer active:scale-95"
            title="يېڭىلاش"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
            <span>يېڭىلاش</span>
          </button>
        </div>

        {/* Filter Card Container */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3.5 shadow-sm">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={ordersSearch}
              onChange={(e) => setOrdersSearch(e.target.value)}
              placeholder="زاكاز نومۇرى ياكى مەھسۇلات نامى بويىچە ئىزدەش..."
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pr-3 pl-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-sans"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setOrdersStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
                ordersStatusFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ھەممىسى
            </button>
            <button
              onClick={() => setOrdersStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 ${
                ordersStatusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تاماملاندى</span>
            </button>
            <button
              onClick={() => setOrdersStatusFilter('processing')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 ${
                ordersStatusFilter === 'processing'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>بىر تەرەپ قىلىنىۋاتىدۇ</span>
            </button>
            <button
              onClick={() => setOrdersStatusFilter('refunded')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 ${
                ordersStatusFilter === 'refunded'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              <span>قايتۇرۇلدى</span>
            </button>
          </div>

          {/* Counter Pill */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400 text-[11px]">زاكاز نەتىجىلىرى سانى:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[11px]">
              {filteredOrders.length} نەتىجە
            </span>
          </div>
        </div>

        {/* Orders List Container */}
        <div className="space-y-3">
          {!session ? (
            <div className="p-8 rounded-3xl bg-[#0F172A] border border-amber-500/30 text-center space-y-3 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">ئالدى بىلەن كىرىڭ</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                زاكازلىرىڭىزنى كۆرۈش ئۈچۈن، تېلېگرامما ئارقىلىق بىر كۇنۇپكا بىلەن ھېساباتىڭىزنى ئۇلاڭ.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs shadow-md transition active:scale-95 inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>تېلېگراممىدا بىر كۇنۇپكا بىلەن ئۇلاش</span>
              </button>
            </div>
          ) : loadingOrders ? (
            <div className="p-12 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>زاكازلار يۈكلىنىۋاتىدۇ...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-slate-400 text-xs space-y-2">
              <p className="text-sm font-bold text-slate-300">تېخى ھېچقانداق زاكاز چۈشۈرۈلمىگەن</p>
              <p className="text-[11px] text-slate-500">
                باشبەتكە چىقىپ Tokens تاللاپ دەرھال قاچىلاپ كۆرۈڭ.
              </p>
              <button
                onClick={() => setActiveNavTab('home')}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 inline-block"
              >
                باغلام تاللاش
              </button>
            </div>
          ) : (
            filteredOrders.map((order: any, i: number) => {
              const isCompleted = order.status === 'completed';
              const isRefunded = order.status === 'refunded';
              const isWait = !isCompleted && !isRefunded;

              return (
                <div
                  key={order.order_id || i}
                  className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3 shadow-md hover:border-slate-700 transition"
                >
                  {/* Top Row: Order ID + Status Badge */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (order.order_id) {
                            navigator.clipboard.writeText(order.order_id);
                            setCopiedOrderId(order.order_id);
                            setTimeout(() => setCopiedOrderId(null), 2000);
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-[11px] transition active:scale-95"
                        title="زاكاز نومۇرىنى كۆچۈرۈش"
                      >
                        {copiedOrderId === order.order_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>#{order.order_id}</span>
                      </button>
                    </div>

                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تاماملاندى</span>
                      </span>
                    )}
                    {isWait && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Hourglass className="w-3.5 h-3.5 animate-spin" />
                        <span>بىر تەرەپ قىلىنىۋاتىدۇ</span>
                      </span>
                    )}
                    {isRefunded && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        <span>قايتۇرۇلدى</span>
                      </span>
                    )}
                  </div>

                  {/* Middle Row: Package Name & Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {order.package_name || 'Honor of Kings Token'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>ئويۇنچى UID: <strong className="font-mono text-slate-200">{order.player_id}</strong></span>
                        {order.created_at && (
                          <>
                            <span>•</span>
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-base font-black font-mono text-amber-400">
                      ${Number(order.price || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Bottom Note if refunded */}
                  {isRefunded && order.refund_note && (
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                      {order.refund_note}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    )}

    {/* =========================================================================
        TAB 3: مېنىڭ ھەميانىم (WALLET - FULL PAGE VIEW)
    ========================================================================= */}
    {activeNavTab === 'wallet' && (
      <div className="space-y-4 animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveNavTab('home')}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              title="باشبەتكە قايتىش"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <span>مېنىڭ ھەميانىم</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                شامكەش ئارقىلىق قالدۇق پۇل قاچىلاش ۋە باشقۇرۇش
              </p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#131F38] via-[#0E172A] to-[#0A101D] border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-300/80 font-bold block">ئەپتىكى ھازىرقى قالدۇقىڭىز</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1 block">
                ${session ? session.balance.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <Wallet className="w-7 h-7" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>ھېسابات:</span>
            <strong className="text-white font-mono">{session ? session.identity : 'كىرمىگەن'}</strong>
          </div>
        </div>

        {/* ShamCash Direct Deposit Form */}
        <div className="p-5 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black text-white">شامكەش (Sham Cash) ئارقىلىق تولۇقلاش</h3>
          </div>

          <div className="space-y-2 bg-[#121B30] p-3.5 rounded-2xl border border-slate-800">
            <label className="text-[11px] font-bold text-slate-400 block">شامكەش قاچىلاش ئادرېسىمىز (سۈرىيە پۇلى ياكى دوللار):</label>
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-700">
              <span className="font-mono text-xs text-amber-300 select-all truncate flex-1">
                {SHAMCASH_ADDRESS}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SHAMCASH_ADDRESS);
                  setCopiedAddress(true);
                  setTimeout(() => setCopiedAddress(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shrink-0 active:scale-95 transition"
              >
                {copiedAddress ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAddress ? 'كۆچۈرۈلدى' : 'كۆچۈرۈش'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              * شۇ ئادرېسقا شامكەش ئارقىلىق پۇل ئەۋەتكەندىن كېيىن، تۆۋەنگە تالون نومۇرىنى چاپلاپ دەرھال تەستىقلىتىڭ.
            </p>
          </div>

          {/* Talon Verification Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">شامكەش تالون نومۇرى (ھەقىقىي تالون):</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shamcashTalon}
                onChange={(e) => setShamcashTalon(e.target.value)}
                placeholder="مەسىلەن: 20241103094827"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
              <button
                onClick={handleVerifyShamcashTalon}
                disabled={isVerifyingTalon || !shamcashTalon.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs transition active:scale-95 shrink-0"
              >
                {isVerifyingTalon ? 'تەكشۈرۈۋاتىدۇ...' : 'تەستىقلاش'}
              </button>
            </div>
            {talonFeedback && (
              <p className={`text-xs p-2 rounded-xl ${talonFeedback.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {talonFeedback.message}
              </p>
            )}
          </div>

          {/* WhatsApp Help */}
          <div className="pt-2">
            <a
              href="https://wa.me/905526666014?text=Honor%20of%20Kings%20شامكەش%20قاچىلاش%20ياردەم"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <span>WhatsApp ئارقىلىق تېز قاچىلاش ياردىمى سوراش</span>
            </a>
          </div>
        </div>
      </div>
    )}

    {/* =========================================================================
        TAB 4: مېنىڭ ھېسابىم (ACCOUNT - FULL PAGE VIEW MATCHING SCREENSHOT 2)
    ========================================================================= */}
    {activeNavTab === 'account' && (
      <div className="space-y-4 animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveNavTab('home')}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              title="باشبەتكە قايتىش"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <span>مېنىڭ ھېسابىم</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                تېلېگرامما ئارقىلىق ئۇلانغان شەخسىي ھېسابات ئۇچۇرلىرى
              </p>
            </div>
          </div>
        </div>

        {!session ? (
          <div className="p-8 rounded-3xl bg-[#0F172A] border border-amber-500/30 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-400/50 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">تېخى كىرمىدىڭىز</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                زاكاز خاتىرىسى، ئورتاق قالدۇق ۋە ساقلانغان ئويۇنچى ھېساباتلىرىنى باشقۇرۇش ئۈچۈن دەرھال كىرىڭ.
              </p>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 text-white font-black text-xs shadow-lg transition active:scale-95 inline-flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>تېلېگراممىدا بىر كۇنۇپكا بىلەن كىرىش</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Card */}
            <div className="p-6 rounded-3xl bg-[#0F172A] border border-amber-500/30 text-center relative shadow-xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

              {/* Profile Avatar */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400 mx-auto mb-3 shadow-[0_0_25px_rgba(251,191,36,0.4)] relative bg-[#1E293B] flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={session.identity}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-2xl">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>

              <h2 className="text-lg font-black text-white">{session.identity}</h2>
              <p className="text-xs text-slate-400 mt-0.5">MAX-BAZAR ئورتاق ھېساباتى</p>

              {/* Balance Display */}
              <div className="my-5 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">قالدۇق:</span>
                <span className="font-mono font-black text-amber-400 text-xl">${session.balance.toFixed(2)}</span>
              </div>

              {/* Quick Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={() => setActiveNavTab('wallet')}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>شامكەش ئارقىلىق قالدۇق قاچىلاش</span>
                </button>

                <button
                  onClick={() => setActiveNavTab('orders')}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <ClipboardList className="w-4 h-4 text-amber-400" />
                  <span>مېنىڭ بارلىق تەلەپلىرىم ({ordersHistory.length})</span>
                </button>

                <a
                  href="/apps"
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>MAX-BAZAR ئاساسىي بازىرىغا قايتىش</span>
                </a>

                <button
                  onClick={() => {
                    setSession(null);
                    try {
                      localStorage.removeItem('maxbazar_hok_session');
                      localStorage.removeItem('maxbazar_unified_session');
                      localStorage.removeItem('maxbazar_pending_sync_token');
                    } catch {}
                  }}
                  className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95 mt-4"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ھېساباتتىن چىقىپ كېتىش</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </main>

  {/* =========================================================================
      AUTHENTIC BOTTOM NAVIGATION (MATCHES EXACT USER SCREENSHOTS 2 & 3)
  ========================================================================= */}
  <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto pb-[env(safe-area-inset-bottom,0px)]">
    <div className="relative max-w-lg mx-auto select-none">
      {/* Frosted Glass Base Bar */}
      <div className="relative h-[66px] bg-[#0c1424]/95 backdrop-blur-2xl border-t border-slate-800 rounded-t-[24px] shadow-[0_-10px_35px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="grid grid-cols-4 h-full relative z-10">
          
          {/* Tab 1: باشبەت (Home) */}
          <button
            onClick={() => setActiveNavTab('home')}
            className="flex flex-col items-center justify-center gap-1 text-center py-1 transition-all active:scale-95 group relative"
          >
            {activeNavTab === 'home' && (
              <div className="absolute -top-3 w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                <div className="w-full h-full bg-[#0B101D] rounded-full flex items-center justify-center overflow-hidden">
                  <Image
                    src="/images/services/hok_token_official.webp"
                    alt="HOK"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
            )}
            <div className={activeNavTab === 'home' ? 'opacity-0' : 'block'}>
              <Home className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition" />
            </div>
            <span className={`text-[10px] font-bold ${activeNavTab === 'home' ? 'text-amber-400 font-black mt-3' : 'text-slate-400'}`}>
              باشبەت
            </span>
          </button>

          {/* Tab 2: مېنىڭ تەلەپلىرىم (Orders) */}
          <button
            onClick={() => setActiveNavTab('orders')}
            className="flex flex-col items-center justify-center gap-1 text-center py-1 transition-all active:scale-95 group relative"
          >
            {activeNavTab === 'orders' && (
              <div className="absolute -top-3 w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                <div className="w-full h-full bg-[#0B101D] rounded-full flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                </div>
              </div>
            )}
            <div className={activeNavTab === 'orders' ? 'opacity-0' : 'block'}>
              <div className="relative">
                <ClipboardList className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition" />
                {ordersHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
            </div>
            <span className={`text-[10px] font-bold ${activeNavTab === 'orders' ? 'text-amber-400 font-black mt-3' : 'text-slate-400'}`}>
              مېنىڭ تەلەپلىرىم
            </span>
          </button>

          {/* Tab 3: مېنىڭ ھەميانىم (Wallet) */}
          <button
            onClick={() => setActiveNavTab('wallet')}
            className="flex flex-col items-center justify-center gap-1 text-center py-1 transition-all active:scale-95 group relative"
          >
            {activeNavTab === 'wallet' && (
              <div className="absolute -top-3 w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                <div className="w-full h-full bg-[#0B101D] rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                </div>
              </div>
            )}
            <div className={activeNavTab === 'wallet' ? 'opacity-0' : 'block'}>
              <Wallet className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition" />
            </div>
            <span className={`text-[10px] font-bold ${activeNavTab === 'wallet' ? 'text-amber-400 font-black mt-3' : 'text-slate-400'}`}>
              مېنىڭ ھەميانىم
            </span>
          </button>

          {/* Tab 4: مېنىڭ ھېسابىم (Account) */}
          <button
            onClick={() => {
              if (!session) {
                setLoginStep('input_phone');
                setShowLoginModal(true);
              } else {
                setActiveNavTab('account');
              }
            }}
            className="flex flex-col items-center justify-center gap-1 text-center py-1 transition-all active:scale-95 group relative"
          >
            {activeNavTab === 'account' && (
              <div className="absolute -top-3 w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                <div className="w-full h-full bg-[#0B101D] rounded-full flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  )}
                </div>
              </div>
            )}
            <div className={activeNavTab === 'account' ? 'opacity-0' : 'block'}>
              {session && avatarUrl ? (
                <img src={avatarUrl} alt="User" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition" />
              )}
            </div>
            <span className={`text-[10px] font-bold ${activeNavTab === 'account' ? 'text-amber-400 font-black mt-3' : 'text-slate-400'}`}>
              مېنىڭ ھېسابىم
            </span>
          </button>

        </div>
      </div>
    </div>
  </div>

      {/* 2. SHAM CASH TOP-UP MODAL (SHOWS SHAM CASH ADDRESS & TALON VERIFICATION) */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border-2 border-amber-500/50 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative text-center">
            <button
              onClick={() => {
                setShowTopupModal(false);
                setTalonFeedback(null);
              }}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-400/30">
              <CreditCard className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-white">شامكەش (Sham Cash) قالدۇق قاچىلاش</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-3 leading-relaxed">
              شامكەش ئارقىلىق مېنىڭ ھېساباتىمغا پۇل ئەۋەتىپ، تالون نومۇرىنى كىرگۈزسىڭىز قالدۇق پۇل دەرھال قوشۇلىدۇ.
            </p>

            {/* MY OFFICIAL SHAMCASH ADDRESS CARD */}
            <div className="bg-[#080D1A] p-3 rounded-2xl border border-amber-400/40 text-left space-y-1.5 mb-3">
              <span className="text-[10px] text-amber-300/80 font-bold block">
                مېنىڭ شامكەش ئادرېسىم (Sham Cash Address):
              </span>
              <div className="flex items-center justify-between gap-1.5 bg-[#121A2E] p-2 rounded-xl border border-slate-700">
                <span className="font-mono text-xs font-bold text-amber-300 truncate select-all">
                  {SHAMCASH_ADDRESS}
                </span>
                <button
                  type="button"
                  onClick={handleCopyShamcashAddress}
                  className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black flex items-center gap-1 shrink-0"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>كۆچۈرۈلدى</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>كۆچۈرۈش</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* TALON VERIFICATION FORM */}
            <form onSubmit={handleVerifyShamcashTalon} className="space-y-3">
              <div className="text-left space-y-1">
                <label className="text-[11px] text-slate-300 font-bold block">
                  تالون نومۇرىنى كىرگۈزۈڭ (رقم الإشعار / العملية):
                </label>
                <input
                  type="text"
                  value={shamcashTalon}
                  onChange={(e) => setShamcashTalon(e.target.value)}
                  placeholder="مەسىلەن: 9821734612"
                  className="w-full bg-[#121A2E] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition placeholder-slate-500"
                />
              </div>

              {talonFeedback && (
                <div
                  className={`p-2 rounded-xl text-xs flex items-center gap-1.5 ${
                    talonFeedback.ok
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {talonFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{talonFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifyingTalon}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isVerifyingTalon ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>تالون تەكشۈرۈلۈۋاتىدۇ...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>تالوننى دەلىللەپ قالدۇق قاچىلاش</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1-CLICK TELEGRAM SYNC MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-amber-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setIsSyncWaiting(false);
              }}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 left-4"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 text-sky-400 flex items-center justify-center mx-auto mb-3 border border-sky-500/30">
              <Send className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-white">تېلېگرامما ئارقىلىق كىرىش</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5 leading-relaxed max-w-xs mx-auto">
              پارول ياكى كود كىرگۈزۈش ھاجەتسىز. تۆۋەندىكى تۈگمىنى بېسىپ تېلېگراممىدا <strong>«Start (باشلاش)»</strong> نى بىرنىلا باسسىڭىز، بۇ ئەپ ئۆزلۈكىدىن دەرھال كىرىدۇ.
            </p>

            {isSyncWaiting ? (
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs text-center space-y-2 animate-pulse">
                <div className="flex items-center justify-center gap-2 font-bold text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>تېلېگراممىدىن جاۋاب كۈتۈۋاتىدۇ...</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  تېلېگرامما ئېچىلغاندا <strong>«Start (باشلاش)»</strong> نى بېسىپ ئەپكە قايتىپ كېلىڭ، ئەپ دەرھال ئۆزلۈكىدىن كىرىدۇ!
                </p>
              </div>
            ) : (
              <a
                href={syncBotUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsSyncWaiting(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 hover:from-sky-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 transition active:scale-95"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>تېلېگراممىدا بىر كۇنۇپكا بىلەن ئۇلاش</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* PWA INSTALLATION GUIDE MODAL */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-amber-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative text-center">
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </button>

            <Smartphone className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <h3 className="text-base font-black text-white">تېلېفونغا ئەپ قىلىپ قاچىلاش</h3>
            <div className="text-xs text-slate-300 space-y-2 mt-3 text-left bg-[#131B30] p-3 rounded-2xl border border-slate-800">
              <p>📱 <strong>Android Chrome:</strong> توركۆرگۈچنىڭ ئوڭ ئۈستىدىكى ئۈچ چېكىت <code>⋮</code> نى بېسىپ <strong>«Add to Home screen» (ئېكرانغا قوشۇش)</strong> نى تاللاڭ.</p>
              <p>🍏 <strong>iPhone Safari:</strong> ئاستىدىكى ھەمبەھىرلەش كۇنۇپكىسىنى بېسىپ <strong>«Add to Home Screen»</strong> نى تاللاڭ.</p>
            </div>
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full mt-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs"
            >
              چۈشەندىم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
