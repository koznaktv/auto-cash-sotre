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
  Flame,
  Award
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
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'input_phone' | 'input_code'>('input_phone');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState<number>(0);

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
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Ref for auto-scrolling to Player ID input upon package click
  const uidSectionRef = useRef<HTMLDivElement>(null);
  const uidInputRef = useRef<HTMLInputElement>(null);

  // Check PWA and LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
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

    // 2. Load User Session
    try {
      const saved = localStorage.getItem('maxbazar_pubg_session');
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

    if (otpCountdown <= 0) {
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
        `قالدۇق پۇلىڭىز يەتمەيدۇ! مەزكۇر ئەپتىكى قالدۇقىڭىز: $${session.balance.toFixed(2)}، بولاق باھاسى: $${selectedPackage.price.toFixed(2)}. ئالدى بىلەن شامكەش ئارقىلىق قالدۇق تولۇقلاڭ.`
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
        <div className="flex items-center gap-2.5">
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
                setShowTopupModal(true);
              }
            }}
            className="group flex items-center gap-2 bg-gradient-to-r from-[#121A2E] to-[#18233C] hover:from-[#18233C] hover:to-[#1E2D4E] border border-amber-400/40 hover:border-amber-400 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.15)] transition cursor-pointer active:scale-95"
            title="شامكەش ئارقىلىق قالدۇق قاچىلاش"
          >
            <div className="text-right">
              <span className="block text-[8.5px] text-amber-300/80 font-bold leading-none">PUBG قالدۇقى</span>
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
                onClick={() => setShowAccountModal(true)}
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
                onClick={() => setShowHistoryModal(true)}
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

      {/* HERO BANNER - PUBG AIRDROP MILITARY AESTHETIC */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#131F38] via-[#0E1729] to-[#070B14] px-4 pt-4 pb-2 border-b border-slate-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-xl mx-auto flex items-center justify-between relative z-10">
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
        <div className="max-w-xl mx-auto mt-4 flex items-center gap-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
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

      {/* MAIN CONTENT AREA */}
      <main className="max-w-xl mx-auto w-full px-3.5 sm:px-4 py-4 flex-1 space-y-4 pb-28">
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
      </main>

      {/* DEDICATED PUBG BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B101D]/95 backdrop-blur-xl border-t border-amber-500/30 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] px-3 py-1.5 max-w-xl mx-auto flex items-center justify-around select-none">
        {/* 1. باشبەت (Home / PUBG Packages) - Floating Elevated Center Tab */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center group relative -top-3.5 focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.65)] border-4 border-[#070B14] group-active:scale-95 transition-transform overflow-hidden p-0.5 shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden relative">
              <Image
                src="/images/services/pubg_mobile.webp"
                alt="PUBG Mobile"
                width={56}
                height={56}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            </div>
          </div>
          <span className="text-[10.5px] font-black text-amber-300 mt-0.5 tracking-tight flex items-center gap-0.5">
            <span>✦</span>
            <span>باشبەت</span>
          </span>
        </button>

        {/* 2. مېنىڭ تەلەپلىرىم (Orders) */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 text-slate-400 hover:text-amber-400 transition active:scale-95 relative"
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5 text-slate-300" />
            {ordersHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-300">مېنىڭ تەلەپلىرىم</span>
        </button>

        {/* 3. مېنىڭ ھەميانىم (Wallet - Sham Cash) */}
        <button
          onClick={() => {
            if (!session) setShowLoginModal(true);
            else setShowTopupModal(true);
          }}
          className="flex flex-col items-center gap-1 py-1 px-3 text-slate-400 hover:text-amber-400 transition active:scale-95"
        >
          <Wallet className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-bold text-slate-300">مېنىڭ ھەميانىم</span>
        </button>

        {/* 4. مېنىڭ ھېسابىم (Account - Telegram) */}
        <button
          onClick={() => {
            if (session) {
              setShowAccountModal(true);
            } else {
              setLoginStep('input_phone');
              setShowLoginModal(true);
            }
          }}
          className="flex flex-col items-center gap-1 py-1 px-3 text-slate-400 hover:text-amber-400 transition active:scale-95"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            {session && avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-5 h-5 rounded-full border border-amber-400 object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <User className="w-5 h-5 text-slate-300" />
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-300 truncate max-w-[75px]">
            {session ? session.identity : 'مېنىڭ ھېسابىم'}
          </span>
        </button>
      </nav>

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

      {/* TELEGRAM OTP LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-amber-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative text-center">
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-white">تېلېگرامما كودى بىلەن كىرىش</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              پارول ئەستە تۇتۇش ھاجەتسىز. تېلېگرامما كىملىكىڭىزگە 6 خانىلىق كود كېلىدۇ.
            </p>

            {otpError && (
              <div className="mb-3 p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                {otpError}
              </div>
            )}

            {loginStep === 'input_phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="text-left">
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    تېلېگرامما نومۇرى ياكى @Username
                  </label>
                  <input
                    type="text"
                    value={telegramHandle}
                    onChange={(e) => setTelegramHandle(e.target.value)}
                    placeholder="مەسىلەن: @user996 ياكى +963..."
                    className="w-full bg-[#1E293B] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>كود ئەۋەتىلىۋاتىدۇ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>دەلىللەش كودى ئېلىش</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="text-center space-y-2">
                  <label className="text-[11px] text-slate-400 font-medium block">
                    تېلېگراممىغا كەلگەن 6 خانىلىق كودنى كىرگۈزۈڭ:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-44 mx-auto bg-[#1E293B] text-amber-400 font-mono text-xl tracking-[0.3em] text-center font-black py-2 rounded-xl border border-amber-400 focus:ring-2 focus:ring-amber-400/50 outline-none"
                    autoFocus
                  />

                  {/* 1-Minute Live Countdown Timer */}
                  {otpCountdown > 0 ? (
                    <div className="text-xs text-amber-300 bg-amber-500/10 py-1.5 px-3 rounded-xl border border-amber-500/30 font-mono font-bold flex items-center justify-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>كودنىڭ كۈچكە ئىگە ۋاقتى: 00:{otpCountdown < 10 ? '0' + otpCountdown : otpCountdown}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-300 bg-rose-500/15 py-1.5 px-3 rounded-xl border border-rose-500/30 flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>كودنىڭ 1 مىنۇتلۇق ۋاقتى ئۆتتى (ئىناۋەتسىز).</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {otpCountdown <= 0 ? (
                    <button
                      type="button"
                      disabled={isSendingOtp}
                      onClick={() => handleSendOtp()}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1"
                    >
                      {isSendingOtp ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>🔄 يېڭى كود ئەۋەتىش</span>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLoginStep('input_phone')}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                    >
                      نومۇر ئۆزگەرتىش
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.trim().length !== 6 || otpCountdown <= 0}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-xs font-black transition"
                  >
                    {isVerifyingOtp ? 'تەكشۈرۈلۈۋاتىدۇ...' : 'كىرىش'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ACCOUNT DETAILS MODAL (FOR LOGGED IN USERS) */}
      {showAccountModal && session && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-amber-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative text-center">
            <button
              onClick={() => setShowAccountModal(false)}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Real Telegram Profile Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 mx-auto mb-3 shadow-[0_0_20px_rgba(251,191,36,0.4)] relative bg-[#1E293B] flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={session.identity}
                  className="w-full h-full object-cover rounded-full"
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-xl">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>

            <h3 className="text-base font-black text-white">{session.identity}</h3>
            <p className="text-xs text-slate-400 mt-0.5">PUBG Mobile ھېساباتىڭىز</p>

            <div className="my-4 p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">ھەميان قالدۇقى:</span>
              <span className="font-mono font-black text-amber-400 text-lg">${session.balance.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setShowTopupModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>شامكەش ئارقىلىق قالدۇق قاچىلاش</span>
              </button>

              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setShowHistoryModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <ClipboardList className="w-4 h-4" />
                <span>زاكاز خاتىرىسىنى كۆرۈش ({ordersHistory.length})</span>
              </button>

              <button
                onClick={() => {
                  setSession(null);
                  setAvatarUrl(null);
                  setShowAccountModal(false);
                  try {
                    localStorage.removeItem('maxbazar_pubg_session');
                  } catch {}
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ھېساباتتىن چىقىپ كېتىش</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECENT ORDERS MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-slate-700 w-full max-w-md rounded-3xl p-5 shadow-2xl relative max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>PUBG زاكاز خاتىرىسى</span>
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1 scrollbar-none">
              {ordersHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  تېخى زاكاز خاتىرىڭىز يوق
                </div>
              ) : (
                ordersHistory.map((ord: any) => (
                  <div
                    key={ord.order_id}
                    className="p-3 rounded-2xl bg-[#1E293B] border border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{ord.package_name}</span>
                        <span className="font-mono text-amber-400">${Number(ord.price).toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        UID: <span className="text-slate-300 font-bold">{ord.player_id}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {ord.created_at ? new Date(ord.created_at).toLocaleTimeString() : ''}
                      </div>
                    </div>
                    <div>
                      {['completed', 'success', 'done', 'delivered'].includes((ord.status || '').toLowerCase()) ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          ✓ پۈتتى
                        </span>
                      ) : ['canceled', 'cancelled', 'rejected', 'refunded'].includes((ord.status || '').toLowerCase()) ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                          قايتۇرۇلدى
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 animate-pulse">
                          بېجىرىلىۋاتىدۇ
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
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
