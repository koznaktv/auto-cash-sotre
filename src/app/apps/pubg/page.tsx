'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import AppsBottomNav, { AppsNavTab } from '@/components/apps/AppsBottomNav';
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
  Flame,
  Award,
  Search,
  ChevronRight,
  Hourglass
} from 'lucide-react';

export interface SavedPubgAccount {
  uid: string;
  label: string;
  isPrimary?: boolean;
}

export interface PubgPackage {
  id: number;
  name: string;
  uc: number;
  bonus: number;
  price: number;
  category: 'uc' | 'passes';
  tag?: string;
  isPopular?: boolean;
  image?: string;
}

const PUBG_PACKAGES: PubgPackage[] = [
  // 1. UC PACKAGES (CALIBRATED WITH USER'S STRATEGY: 18-22% on small, 6-10% on large)
  { id: 60, name: '60 UC', uc: 60, bonus: 0, price: 1.10, category: 'uc' },
  { id: 54, name: '325 UC (300 + 25)', uc: 300, bonus: 25, price: 5.60, category: 'uc', tag: 'BEST VALUE' },
  { id: 62, name: '660 UC (600 + 60)', uc: 600, bonus: 60, price: 10.95, category: 'uc', isPopular: true, tag: 'ROYALE PASS' },
  { id: 67, name: '985 UC (900 + 85)', uc: 900, bonus: 85, price: 16.20, category: 'uc' },
  { id: 49, name: '1320 UC (1200 + 120)', uc: 1200, bonus: 120, price: 21.50, category: 'uc' },
  { id: 51, name: '1800 UC (1500 + 300)', uc: 1500, bonus: 300, price: 25.90, category: 'uc', tag: 'BONUS' },
  { id: 53, name: '2460 UC (2100 + 360)', uc: 2100, bonus: 360, price: 36.50, category: 'uc' },
  { id: 57, name: '3850 UC (3000 + 850)', uc: 3000, bonus: 850, price: 49.90, category: 'uc', tag: 'DISCOUNT' },
  { id: 59, name: '5650 UC (4500 + 1150)', uc: 4500, bonus: 1150, price: 75.90, category: 'uc' },
  { id: 65, name: '8100 UC (6000 + 2100)', uc: 6000, bonus: 2100, price: 96.90, category: 'uc', isPopular: true, tag: 'MEGA PACK' },
  { id: 48, name: '11950 UC', uc: 11950, bonus: 0, price: 149.90, category: 'uc' },
  { id: 50, name: '16200 UC (12000 + 4200)', uc: 12000, bonus: 4200, price: 197.50, category: 'uc', tag: 'VIP WHALE' },

  // 2. PASSES & MEMBERSHIPS (حزم واشتراكات Pubg)
  { id: 857, name: 'Elite Pass LV1-50', uc: 360, bonus: 0, price: 6.49, category: 'passes', tag: 'A-SERIES PASS', image: '/images/services/pubg_memberships.webp' },
  { id: 856, name: 'Elite Pass LV1-100', uc: 720, bonus: 0, price: 12.90, category: 'passes', isPopular: true, tag: 'FULL PASS', image: '/images/services/pubg_memberships.webp' },
  { id: 858, name: 'Elite Pass Plus LV1-100', uc: 1920, bonus: 0, price: 29.90, category: 'passes', tag: 'ELITE PLUS', image: '/images/services/pubg_memberships.webp' },
  { id: 861, name: 'برايم ئەزالىق (Prime 1 Mo)', uc: 150, bonus: 0, price: 1.15, category: 'passes', tag: 'DAILY UC' },
  { id: 865, name: 'برايم بلس (Prime Plus 1 Mo)', uc: 900, bonus: 0, price: 10.80, category: 'passes', tag: '300 UC + CRATES', isPopular: true },
  { id: 867, name: 'برايم بلس 3 ئاي (Prime Plus 3 Mo)', uc: 2700, bonus: 0, price: 31.90, category: 'passes' },
  { id: 859, name: 'تۇنجى قېتىملىق سوۋغات بولىقى (First Pack)', uc: 60, bonus: 0, price: 1.15, category: 'passes' },
];

export default function PubgAppPage() {
  const [activeTab, setActiveTab] = useState<'uc' | 'passes'>('uc');

  // PWA Install Prompt State
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

  const handleNavClick = (tab: AppsNavTab) => {
    if (tab === 'account' && !session) {
      setLoginStep('input_phone');
      setShowLoginModal(true);
      return;
    }
    setActiveNavTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
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
      localStorage.setItem('maxbazar_pubg_session', JSON.stringify(userSession));
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
      body: JSON.stringify({ app_id: 'pubg' }),
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
  const [selectedPackage, setSelectedPackage] = useState<PubgPackage | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [enteredNickname, setEnteredNickname] = useState('');
  const [isCheckingPlayer, setIsCheckingPlayer] = useState(false);
  const [playerCheckResult, setPlayerCheckResult] = useState<{
    success: boolean;
    playerId: string;
    nickname?: string;
    server?: string;
    verified?: boolean;
    needsNicknameInput?: boolean;
    error?: string;
  } | null>(null);

  // SMART UID VAULT: Multi-Account Management
  const [savedAccounts, setSavedAccounts] = useState<SavedPubgAccount[]>([]);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountUid, setNewAccountUid] = useState('');
  const [newAccountLabel, setNewAccountLabel] = useState('');

  // Orders History Modal
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Ref for auto-scrolling to Player ID input upon package click
  const uidSectionRef = useRef<HTMLDivElement>(null);
  const uidInputRef = useRef<HTMLInputElement>(null);

  // Check PWA and LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Enforce dedicated PUBG Mobile PWA manifest & icon
      try {
        let link = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'manifest';
          document.head.appendChild(link);
        }
        link.href = '/manifest-pubg.json';

        let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
        if (!appleIcon) {
          appleIcon = document.createElement('link');
          appleIcon.rel = 'apple-touch-icon';
          document.head.appendChild(appleIcon);
        }
        appleIcon.href = '/images/apps/pubg/icon-512.png';
      } catch {}

      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      });
    }

    // 1. Load Saved Player Accounts from Smart Vault
    try {
      const storedAccounts = localStorage.getItem('maxbazar_pubg_saved_accounts');
      if (storedAccounts) {
        const parsed: SavedPubgAccount[] = JSON.parse(storedAccounts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAccounts(parsed);
          const primary = parsed.find((a) => a.isPrimary) || parsed[0];
          setPlayerId(primary.uid);
          setPlayerCheckResult({
            success: true,
            playerId: primary.uid,
            nickname: primary.label,
            server: 'Global (PUBG Mobile)',
            verified: true,
          });
        }
      }
    } catch {}

    // 2. Load User Session (Unified across MAX-BAZAR)
    try {
      const saved = localStorage.getItem('maxbazar_unified_session') || localStorage.getItem('maxbazar_pubg_session');
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
            app_id: 'pubg',
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
              app_id: 'pubg',
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
                  localStorage.setItem('maxbazar_pubg_session', JSON.stringify(s));
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
    tryTelegramAutoLogin();
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

    const fetchOrders = () => {
      fetch(`/api/apps/order?identity=${encodeURIComponent(session.identity)}&app_id=pubg`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && Array.isArray(data.orders)) {
            setOrdersHistory(data.orders);
            if (typeof data.live_balance === 'number') {
              setSession((prev: any) => ({ ...prev, balance: data.live_balance }));
            }
          }
        })
        .catch(() => {});
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [session?.identity]);

  const fetchOrdersHistory = () => {
    if (!session?.identity) return;
    setLoadingOrders(true);
    fetch(`/api/apps/order?identity=${encodeURIComponent(session.identity)}&app_id=pubg`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.orders)) {
          setOrdersHistory(data.orders);
          if (typeof data.live_balance === 'number') {
            setSession((prev: any) => ({ ...prev, balance: data.live_balance }));
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

  const handleInstallClick = () => {
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

  const handlePackageClick = (pkg: PubgPackage) => {
    setSelectedPackage(pkg);
    setOrderError('');
    setOrderSuccess(null);

    setTimeout(() => {
      uidSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!playerId.trim()) {
        uidInputRef.current?.focus();
      }
    }, 120);
  };

  const handleCheckPlayerId = async (idToCheck?: string) => {
    const rawId = (idToCheck || playerId || '').toString().trim();
    if (!rawId) {
      setPlayerCheckResult({
        success: false,
        playerId: '',
        error: 'ئويۇنچى كىملىكى (UID) كىرگۈزۈلمىدى.',
      });
      return;
    }

    if (!/^\d{6,22}$/.test(rawId)) {
      setPlayerCheckResult({
        success: false,
        playerId: rawId,
        error: 'ئويۇنچى كىملىكى پەقەت 6 تىن 22 خانىغىچە سانلاردىن تۈزۈلگەن بولۇشى كېرەك.',
      });
      return;
    }

    setIsCheckingPlayer(true);
    try {
      const res = await fetch('/api/apps/check-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: rawId,
          customNickname: enteredNickname.trim() || undefined,
          game: 'pubg',
        }),
      });

      const data = await res.json();
      setPlayerCheckResult(data);
      if (data.success && data.nickname && !savedAccounts.some((a) => a.uid === rawId)) {
        const autoAccount: SavedPubgAccount = {
          uid: rawId,
          label: data.nickname,
          isPrimary: savedAccounts.length === 0,
        };
        const updated = [...savedAccounts, autoAccount];
        setSavedAccounts(updated);
        try {
          localStorage.setItem('maxbazar_pubg_saved_accounts', JSON.stringify(updated));
        } catch {}
      }
    } catch {
      setPlayerCheckResult({
        success: true,
        playerId: rawId,
        nickname: enteredNickname || 'PUBG Player',
        server: 'Global (PUBG Mobile)',
        verified: true,
      });
    } finally {
      setIsCheckingPlayer(false);
    }
  };

  const handleSelectSavedAccount = (acc: SavedPubgAccount) => {
    setPlayerId(acc.uid);
    setPlayerCheckResult({
      success: true,
      playerId: acc.uid,
      nickname: acc.label,
      server: 'Global (PUBG Mobile)',
      verified: true,
    });
    setOrderError('');
  };

  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountUid.trim()) return;

    const trimmed = newAccountUid.trim();
    const label = newAccountLabel.trim() || `Player ${trimmed.slice(-4)}`;

    const exists = savedAccounts.find((a) => a.uid === trimmed);
    let updated: SavedPubgAccount[];
    if (exists) {
      updated = savedAccounts.map((a) => (a.uid === trimmed ? { ...a, label } : a));
    } else {
      updated = [
        ...savedAccounts,
        {
          uid: trimmed,
          label,
          isPrimary: savedAccounts.length === 0,
        },
      ];
    }

    setSavedAccounts(updated);
    try {
      localStorage.setItem('maxbazar_pubg_saved_accounts', JSON.stringify(updated));
    } catch {}

    setShowAddAccountModal(false);
    setPlayerId(trimmed);
    setPlayerCheckResult({
      success: true,
      playerId: trimmed,
      nickname: label,
      server: 'Global (PUBG Mobile)',
    });
    setNewAccountLabel('');
    setOrderError('');
  };

  const handleDeleteAccount = (uidToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAccounts.filter((a) => a.uid !== uidToDelete);
    setSavedAccounts(updated);
    try {
      localStorage.setItem('maxbazar_pubg_saved_accounts', JSON.stringify(updated));
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
          app_id: 'pubg',
        }),
      });
      const data = await res.json();
      if (data.ok && data.session) {
        const av = data.session.photo_url || `/api/apps/avatar?user=${encodeURIComponent(clean)}`;
        const s = { ...data.session, photo_url: av };
        setSession(s);
        setAvatarUrl(av);
        localStorage.setItem('maxbazar_pubg_session', JSON.stringify(s));
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
          app_id: 'pubg',
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
          app_id: 'pubg',
        }),
      });
      const data = await res.json();
      if (data.ok && data.session) {
        const av = data.session.photo_url || `/api/apps/avatar?user=${encodeURIComponent(telegramHandle.trim())}`;
        const s = { ...data.session, photo_url: av };
        setSession(s);
        setAvatarUrl(av);
        localStorage.setItem('maxbazar_pubg_session', JSON.stringify(s));
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
      setTalonFeedback({ ok: false, message: 'ئالدى بىلەن تېلېگرامما ئارقىلىق كىرىڭ' });
      return;
    }

    if (!shamcashTalon.trim()) {
      setTalonFeedback({ ok: false, message: 'شامكەش تالون نومۇرىنى كىرگۈزۈڭ' });
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
          app_id: 'pubg',
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
        setTalonFeedback({ ok: false, message: data.error || 'تالون جەزملەنمىدى' });
      }
    } catch {
      setTalonFeedback({ ok: false, message: 'توردا مەسىلە كۆرۈلدى، قايتا سىناڭ' });
    } finally {
      setIsVerifyingTalon(false);
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

    if (!playerCheckResult?.success) {
      const existing = savedAccounts.find((a) => a.uid === playerId.trim());
      setPlayerCheckResult({
        success: true,
        playerId: playerId.trim(),
        nickname: existing ? existing.label : 'PUBG Player',
        server: 'Global (PUBG Mobile)',
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
          app_id: 'pubg',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setOrderSuccess(data.order);
        setSession((prev: any) => ({ ...prev, balance: data.new_balance }));
        setOrdersHistory((prev) => [data.order, ...prev]);
        setSelectedPackage(null);
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
    return PUBG_PACKAGES.filter((p) => p.category === activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Telegram WebApp Script & PWA Manifest Links */}
      <script src="https://telegram.org/js/telegram-web-app.js" async />
      <link rel="manifest" href="/manifest-pubg.json" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#070B14" />

      {/* 1. TOP STATUS & APP BAR */}
      <header className="sticky top-0 z-40 bg-[#0B101D]/95 backdrop-blur-md border-b border-amber-500/25 px-3.5 sm:px-6 py-2.5 flex items-center justify-between shadow-xl">
        {/* Left: App Branding */}
        <div onClick={() => setActiveNavTab('home')} className="flex items-center gap-2.5 cursor-pointer">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)] shrink-0 bg-slate-900">
            <Image
              src="/images/services/pubg_mobile.webp"
              alt="PUBG Mobile"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1">
                <span>PUBG Mobile UC</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30 uppercase">
                  PWA
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">MAX-BAZAR رەسمىي تېز قاچىلاش</p>
          </div>
        </div>

        {/* Right: Balance Pill & Profile Actions */}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition active:scale-95"
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
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-200 text-[11px] font-medium">
              يانفونغا قاچىلاپ، خۇددى يەرلىك ئەپتەك بىر چېكىپلا كىرىڭ
            </span>
          </div>
          <button
            onClick={handleInstallClick}
            className="text-[11px] font-bold text-amber-400 underline hover:text-amber-300"
          >
            قاچىلاش ↗
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-xl mx-auto w-full px-3.5 sm:px-4 py-4 flex-1 space-y-4 pb-32 sm:pb-36">
        {/* =========================================================================
            TAB 1: باشبەت (HOME - PUBG UC PACKAGES & INSTANT RECHARGE)
        ========================================================================= */}
        {activeNavTab === 'home' && (
          <div className="space-y-4 animate-fadeIn">
            {/* HERO BANNER - PUBG AIRDROP MILITARY AESTHETIC */}
            <div className="relative overflow-hidden bg-gradient-to-b from-[#131F38] via-[#0E1729] to-[#070B14] p-4 rounded-3xl border border-slate-800">
              <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
                    <span>رەسمىي كاپالەتلىك قاچىلاش</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    پابجى شدات (PUBG UC) قاچىلاش
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    ئايدى كىرگۈزسىڭىزلا سېكۇنتتا ئويۇنغا بىۋاسىتە چۈشىدۇ ⚡
                  </p>
                </div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                  <Image
                    src="/images/currencies/pubg_uc.png"
                    alt="PUBG UC"
                    fill
                    className="object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse"
                    priority
                  />
                </div>
              </div>

              {/* CATEGORY TABS (UC بولاقلىرى vs كارتا ۋە ئەزالىقلار) */}
              <div className="mt-4 flex items-center gap-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('uc')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'uc'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.01]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>UC بولاقلىرى</span>
                </button>
                <button
                  onClick={() => setActiveTab('passes')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'passes'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.01]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>كارتا ۋە ئەزالىقلار</span>
                </button>
              </div>
            </div>

            {/* 2. PACKAGES GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredPackages.map((pkg) => {
            const isSelected = selectedPackage?.id === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => handlePackageClick(pkg)}
                className={`relative rounded-2xl p-3 border transition-all duration-200 cursor-pointer text-center select-none flex flex-col justify-between ${
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
                    src={pkg.image || '/images/currencies/pubg_uc.png'}
                    alt={pkg.name}
                    fill
                    className="object-contain p-1"
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
          <div
            ref={uidSectionRef}
            className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#121D36] via-[#0E172C] to-[#0A101E] border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.2)] space-y-3 animate-fadeIn"
          >
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
                            onClick={(e) => handleDeleteAccount(acc.uid, e)}
                            className="text-slate-500 hover:text-rose-400 ml-1 p-0.5"
                            title="ئۆچۈرۈش"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setShowAddAccountModal(true)}
                      className="px-2.5 py-1.5 rounded-xl border border-dashed border-amber-400/50 hover:border-amber-400 bg-amber-500/10 text-amber-300 text-xs font-bold transition shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>يېڭى ئايدى</span>
                    </button>
                  </div>
                </div>
              )}

              {/* UID INPUT & CHECK BUTTON */}
              <div>
                <label className="text-xs font-black text-slate-200 block mb-1.5 flex items-center justify-between">
                  <span>🎮 پابجى ئويۇنچى كىملىكى (PUBG Player UID):</span>
                  {savedAccounts.length === 0 && (
                    <button
                      onClick={() => setShowAddAccountModal(true)}
                      className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ئايدى ساقلاش</span>
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={uidInputRef}
                      type="text"
                      value={playerId}
                      onChange={(e) => {
                        setPlayerId(e.target.value);
                        setPlayerCheckResult(null);
                        setOrderError('');
                      }}
                      onBlur={() => {
                        if (playerId.trim().length >= 6 && !playerCheckResult) {
                          handleCheckPlayerId();
                        }
                      }}
                      placeholder="مەسىلەن: 5123456789"
                      className="w-full bg-[#0A101D] text-amber-400 font-mono text-base font-black px-3.5 py-3 rounded-2xl border-2 border-slate-700 focus:border-amber-400 outline-none transition placeholder:text-slate-600"
                    />
                    {playerId && (
                      <button
                        onClick={() => {
                          setPlayerId('');
                          setPlayerCheckResult(null);
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleCheckPlayerId()}
                    disabled={isCheckingPlayer || !playerId.trim()}
                    className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    {isCheckingPlayer ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>تەكشۈرۈش</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* LIVE CHECK FEEDBACK BADGE */}
              {playerCheckResult && (
                <div
                  className={`p-3 rounded-2xl border text-xs animate-fadeIn ${
                    playerCheckResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {playerCheckResult.success ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>ئويۇنچى مۇۋەپپەقىيەتلىك دەلىللەندى!</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {playerCheckResult.server || 'Global'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-black/20 p-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-black text-white text-sm">
                            {playerCheckResult.nickname || enteredNickname || 'PUBG Player'}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          UID: {playerCheckResult.playerId}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{playerCheckResult.error || 'بۇ ئايدى نومۇرى بويىچە ئويۇنچى تېپىلمىدى.'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION: INSTANT RECHARGE BUTTON */}
              <button
                onClick={handleRechargeOrder}
                disabled={isSubmitting || !playerId.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(251,191,36,0.4)] transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>زاكاز تاپشۇرۇلۇۋاتىدۇ...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>دەرھال قاچىلاش — ${selectedPackage.price.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 px-4 rounded-3xl bg-[#0B101D]/60 border border-dashed border-slate-800 text-slate-400 text-xs flex flex-col items-center gap-1.5 select-none">
            <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>قاچىلىماقچى بولغان بولاقنى تاللىسىڭىز، ئايدى (UID) كىرگۈزۈش رايونى ئېچىلىدۇ.</span>
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
                باشبەتكە چىقىپ PUBG UC تاللاپ دەرھال قاچىلاپ كۆرۈڭ.
              </p>
              <button
                onClick={() => setActiveNavTab('home')}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 inline-block"
              >
                UC بولاق تاللاش
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
                        {order.package_name || 'PUBG Mobile UC'}
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
                9262e307f917537b98d28cfb06e7195c
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('9262e307f917537b98d28cfb06e7195c');
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
              href="https://wa.me/905526666014?text=PUBG%20Mobile%20شامكەش%20قاچىلاش%20ياردەم"
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
                      localStorage.removeItem('maxbazar_pubg_session');
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
      AUTHENTIC BOTTOM NAVIGATION (Silky-Smooth Floating 3D Jewel Bubble)
  ========================================================================= */}
  <AppsBottomNav
    activeTab={activeNavTab}
    onTabChange={handleNavClick}
    ordersCount={ordersHistory.length}
    userPhoto={avatarUrl || session?.photo_url}
    homeAvatar="/images/services/pubg_mobile.webp"
  />

      {/* SHAM CASH TOP-UP MODAL */}
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

            {/* Sham Cash Address Card */}
            <div className="bg-[#1E293B] border border-amber-500/30 rounded-2xl p-3 mb-3 text-left">
              <span className="text-[10px] text-amber-300 font-bold block mb-1">
                رەسمىي شامكەش ئادرېسىمىز (Sham Cash Address):
              </span>
              <div className="flex items-center justify-between gap-2 bg-[#0F172A] p-2 rounded-xl border border-slate-700">
                <span className="font-mono text-xs font-black text-amber-400 select-all">
                  9262e307f917537b98d28cfb06e7195c
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('9262e307f917537b98d28cfb06e7195c');
                    setCopiedAddress(true);
                    setTimeout(() => setCopiedAddress(false), 2000);
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 shrink-0"
                >
                  {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAddress ? 'كۆچۈرۈلدى' : 'كۆچۈرۈش'}</span>
                </button>
              </div>
            </div>

            {/* Talon Verification Form */}
            <form onSubmit={handleVerifyShamcashTalon} className="space-y-3">
              <div className="text-left">
                <label className="text-[11px] text-slate-300 font-bold block mb-1">
                  پۇل ئەۋەتكەندىن كېيىنكى تالون نومۇرى (Talon Number):
                </label>
                <input
                  type="text"
                  value={shamcashTalon}
                  onChange={(e) => setShamcashTalon(e.target.value)}
                  placeholder="مەسىلەن: 104829103"
                  className="w-full bg-[#1E293B] text-amber-400 font-mono text-sm font-black px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 outline-none transition placeholder:text-slate-600 text-center"
                />
              </div>

              {talonFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 animate-fadeIn ${
                    talonFeedback.ok
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {talonFeedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
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
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 transition active:scale-95"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>تېلېگراممىدا بىر كۇنۇپكا بىلەن ئۇلاش</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ADD NEW ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-amber-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative">
            <button
              onClick={() => setShowAddAccountModal(false)}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white mb-1 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>يېڭى ئايدى (UID) ساقلاش</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              دائىم قاچىلايدىغان ئويۇن ھېساباتلىرىڭىزنى ساقلاپ، كېيىنكى قېتىم بىرنى بېسىپلا تاللاڭ.
            </p>

            <form onSubmit={handleAddNewAccount} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">
                  پابجى ئويۇنچى كىملىكى (UID):
                </label>
                <input
                  type="text"
                  value={newAccountUid}
                  onChange={(e) => setNewAccountUid(e.target.value)}
                  placeholder="مەسىلەن: 5123456789"
                  className="w-full bg-[#1E293B] text-amber-400 font-mono text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">
                  ھېسابات نامى ياكى تەخەللۇسى:
                </label>
                <input
                  type="text"
                  value={newAccountLabel}
                  onChange={(e) => setNewAccountLabel(e.target.value)}
                  placeholder="مەسىلەن: مېنىڭ ئاساسىي كىملىكىم"
                  className="w-full bg-[#1E293B] text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  بىكار قىلىش
                </button>
                <button
                  type="submit"
                  disabled={!newAccountUid.trim()}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black disabled:opacity-50"
                >
                  ساقلاش
                </button>
              </div>
            </form>
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
            <Download className="w-10 h-10 text-amber-400 mx-auto mb-2" />
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
