'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase } from '@/lib/supabaseBrowser';
import { storeLocalAuth } from '@/lib/clientAuth';
import SGCSubpageLayout from '@/components/SGCSubpageLayout';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  User,
  KeyRound,
  ShieldCheck,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinClass, setSpinClass] = useState('');

  // Form fields: Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form fields: Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [flyArrow, setFlyArrow] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgPollingToken, setTgPollingToken] = useState<string | null>(null);
  const [tgBotUrl, setTgBotUrl] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({
    show: false,
    msg: '',
    type: 'success',
  });
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lightning-fast prefetching of home page
  React.useEffect(() => {
    try {
      router.prefetch('/');
    } catch {}
  }, [router]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, msg: message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3800);
  };

  // 3D Flip Tab Switcher
  const handleSwitchTab = (newMode: 'login' | 'register') => {
    if (isSpinning || mode === newMode) return;
    setIsSpinning(true);

    const nextSpinClass = newMode === 'register' ? 'spin-to-register' : 'spin-to-login';
    setSpinClass(nextSpinClass);

    setTimeout(() => {
      setMode(newMode);
    }, 320);

    setTimeout(() => {
      setSpinClass('');
      setIsSpinning(false);
    }, 650);
  };

  // Google OAuth
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const supabase = getBrowserSupabase();
      if (!supabase) {
        showToast('Google كىرىش ئۇلىنىشى تېپىلمىدى', 'error');
        setGoogleLoading(false);
        return;
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      showToast(err?.message || 'Google بىلەن كىرىش مەغلۇپ بولدى', 'error');
      setGoogleLoading(false);
    }
  };

  // Telegram 1-click login
  const handleTelegramLogin = async () => {
    setTgLoading(true);
    try {
      const res = await fetch('/api/auth/telegram-session', { method: 'POST' });
      const data = await res.json();
      if (!data.success || !data.token || !data.botUrl) {
        throw new Error(data.message || 'Telegram ئارقىلىق كىرىش مەغلۇپ بولدى');
      }

      setTgPollingToken(data.token);
      setTgBotUrl(data.botUrl);

      if (typeof window !== 'undefined') {
        window.open(data.botUrl, '_blank');
      }

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > 80) {
          clearInterval(interval);
          setTgLoading(false);
          setTgPollingToken(null);
          return;
        }

        try {
          const pollRes = await fetch(`/api/auth/telegram-session?token=${encodeURIComponent(data.token)}`);
          const pollData = await pollRes.json();
          if (pollData.success && pollData.approved && pollData.user) {
            clearInterval(interval);
            setTgLoading(false);
            setTgPollingToken(null);
            storeLocalAuth(pollData.user);
            window.dispatchEvent(new Event('autocash_auth_changed'));
            showToast('مۇۋەپپەقىيەتلىك كىردىڭىز! قارشى ئالىمىز', 'success');
            router.push('/');
          }
        } catch {}
      }, 800);
    } catch (err: any) {
      console.error('Telegram login error:', err);
      showToast(err?.message || 'Telegram كىرىش مەغلۇپ بولدى', 'error');
      setTgLoading(false);
      setTgPollingToken(null);
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showToast('ئېلخەت ياكى پارولنى كىرگۈزۈڭ!', 'error');
      return;
    }

    setFlyArrow(true);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'كىرىش مەغلۇپ بولدى');
      }

      showToast(`كىرىش مۇۋەپپەقىيەتلىك بولدى! قارشى ئالىمىز، ${data.user?.name || loginEmail}`, 'success');
      storeLocalAuth(data.user);
      window.dispatchEvent(new Event('autocash_auth_changed'));

      // Instant entry - zero artificial delay
      router.push('/');
    } catch (err: any) {
      showToast(err?.message || 'كىرىش مەغلۇپ بولدى', 'error');
    } finally {
      setFlyArrow(false);
      setLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword || !regConfirmPassword) {
      showToast('بارلىق بۆلەكلەرنى تولۇق كىرگۈزۈڭ!', 'error');
      return;
    }

    if (regPassword.length < 6) {
      showToast('پارول ئەڭ ئاز دېگەندە 6 خانىلىق بولۇشى شەرت!', 'error');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      showToast('پارول ئۆز-ئارا ماس كەلمىدى، قايتا تەكشۈرۈڭ!', 'error');
      return;
    }

    if (!acceptTerms) {
      showToast('مۇلازىمەت شەرتلىرىگە قوشۇلۇشىڭىز كېرەك!', 'error');
      return;
    }

    setFlyArrow(true);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'تىزىملىتىش مەغلۇپ بولدى');
      }

      showToast(`ھۆرمەتلىك ${regName}، تىزىملىتىش مۇۋەپپەقىيەتلىك تاماملاندى!`, 'success');
      storeLocalAuth(data.user);
      window.dispatchEvent(new Event('autocash_auth_changed'));

      // Instant entry - zero artificial delay
      router.push('/');
    } catch (err: any) {
      showToast(err?.message || 'تىزىملىتىش مەغلۇپ بولدى', 'error');
    } finally {
      setFlyArrow(false);
      setLoading(false);
    }
  };

  return (
    <SGCSubpageLayout
      title={mode === 'login' ? 'ھېساباتقا كىرىش' : 'يېڭى تىزىملىتىش'}
      subtitle={
        mode === 'login'
          ? 'داۋاملاشتۇرۇش ئۈچۈن ھېساباتىڭىزغا كىرىڭ'
          : 'يېڭى مۇلازىمەتلەردىن بەھرىمەن بولۇش ئۈچۈن تىزىملىتىڭ'
      }
    >
      <div className="neumorphic-auth-root flex justify-center items-center py-4 sm:py-8 relative">
        {/* ئۇچۇر ئەسكەرتىش قەۋىتى (Toast Notification) */}
        <div className={`toast ${toast.show ? `show ${toast.type}` : ''}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 inline" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 inline" />
            )}
          </span>
          <span className="toast-text">{toast.msg}</span>
        </div>

        {/* 3D پىرقىراش قاچىسى (3D Perspective Container) */}
        <div className="card-container">
          <main className={`auth-card ${spinClass}`} id="authCard">
            {/* كارتىچكا ئۈستۈنكى نىشان بەلگىسى (Brand Lock/Avatar) */}
            <div className="card-header">
              <div className="brand-icon-box">
                <div className="brand-icon-inner overflow-hidden p-0.5">
                  <img
                    src="/logo.png"
                    alt="AUTO CASH Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>
              <h1 className="header-title">
                {mode === 'login' ? 'خوش كەپسىز' : 'ھېسابات قۇرۇش'}
              </h1>
              <p className="header-subtitle">
                {mode === 'login'
                  ? 'داۋاملاشتۇرۇش ئۈچۈن ھېساباتىڭىزغا كىرىڭ'
                  : 'يېڭى مۇلازىمەتلەردىن بەھرىمەن بولۇش ئۈچۈن تىزىملىتىڭ'}
              </p>
            </div>

            {/* ئالماشتۇرغۇچ بەلۋاغ (Segmented Tab Switcher) */}
            <div className="tab-switcher">
              <div
                className="tab-slider"
                style={{
                  transform: mode === 'register' ? 'translateX(-100%)' : 'translateX(0)',
                }}
              />
              <button
                type="button"
                className={`tab-btn flex items-center justify-center gap-1.5 ${mode === 'login' ? 'active' : ''}`}
                onClick={() => handleSwitchTab('login')}
              >
                <LogIn className="w-4 h-4" />
                <span>كىرىش</span>
              </button>
              <button
                type="button"
                className={`tab-btn flex items-center justify-center gap-1.5 ${mode === 'register' ? 'active' : ''}`}
                onClick={() => handleSwitchTab('register')}
              >
                <UserPlus className="w-4 h-4" />
                <span>تىزىملىتىش</span>
              </button>
            </div>

            {/* جەدۋەللەر بۆلىكى (Forms Wrapper) */}
            <div className="forms-wrapper">
              {/* ================= 1. كىرىش جەدۋىلى (Login Form) ================= */}
              <form
                className={`form ${mode === 'login' ? 'active' : ''}`}
                onSubmit={handleLoginSubmit}
                autoComplete="on"
              >
                {/* ئېلخەت / نامى */}
                <div className="input-group">
                  <div className={`input-box ${loginEmail ? 'has-value' : ''}`}>
                    <span className="input-icon">
                      <Mail className="w-4 h-4 text-emerald-500" />
                    </span>
                    <input
                      type="text"
                      id="pageLoginEmail"
                      placeholder=" "
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="username"
                      required
                    />
                    <label className="floating-label" htmlFor="pageLoginEmail">
                      ئېلخەت ياكى ئىشلەتكۈچى نامى
                    </label>
                  </div>
                </div>

                {/* پارول */}
                <div className="input-group">
                  <div className={`input-box ${loginPassword ? 'has-value' : ''}`}>
                    <span className="input-icon">
                      <Lock className="w-4 h-4 text-emerald-500" />
                    </span>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="pageLoginPassword"
                      placeholder=" "
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="current-password"
                      required
                    />
                    <label className="floating-label" htmlFor="pageLoginPassword">
                      پارولىڭىزنى كىرگۈزۈڭ
                    </label>
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label="پارولنى كۆرسىتىش ياكى يوشۇرۇش"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* تاللاشلار: ئەستە تۇتۇش ۋە ئۇنتۇش */}
                <div className="form-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="custom-checkbox" />
                    <span className="option-label">مېنى ئەستە تۇت</span>
                  </label>
                  <a
                    href="#"
                    className="forgot-link"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast('پارول ئەسلىگە كەلتۈرۈش ئۈچۈن خېرىدارلار مۇلازىمىتىگە ئالاقىلىشىڭ!', 'success');
                    }}
                  >
                    پارولنى ئۇنتۇدىڭىزمۇ؟
                  </a>
                </div>

                {/* كىرىش كۇنۇپكىسى */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`submit-btn flex items-center justify-center gap-2 ${flyArrow ? 'fly-arrow' : ''}`}
                >
                  <span>{loading ? 'كىرىۋاتىدۇ...' : 'كىرىش'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Telegram Login Active Polling Indicator */}
                {tgPollingToken && tgBotUrl && (
                  <div className="p-3 my-2 rounded-2xl bg-sky-50 border border-sky-300 text-center text-xs space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sky-700 font-bold">
                      <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span>Telegram دا «Start» نى بېسىڭ...</span>
                    </div>
                    <p className="text-[11px] text-sky-800 leading-relaxed">
                      تېلېگراممىدا ئېچىلغان بوتتا <b>Start</b> نى باسسىڭىز، بۇ يەرگە ئاپتوماتىك كىرىدۇ.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <a
                        href={tgBotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow flex items-center gap-1"
                      >
                        <span>بوتنى قايتا ئېچىش ➔</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setTgLoading(false);
                          setTgPollingToken(null);
                        }}
                        className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs"
                      >
                        بىكار قىلىش
                      </button>
                    </div>
                  </div>
                )}

                {/* ئايرىغۇچ */}
                <div className="divider">
                  <span>ياكى بۇلار بىلەن كىرىڭ</span>
                </div>

                {/* ئىجتىمائىي ھېساباتلار */}
                <div className="social-login">
                  <button
                    type="button"
                    className="social-btn flex items-center justify-center"
                    title="Telegram ئارقىلىق 1 چېكىپ كىرىش"
                    aria-label="Telegram"
                    onClick={handleTelegramLogin}
                    disabled={tgLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#229ED9">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="social-btn flex items-center justify-center"
                    title="Google ئارقىلىق كىرىش"
                    aria-label="Google"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="social-btn flex items-center justify-center text-slate-800 dark:text-white"
                    title="Apple ئارقىلىق كىرىش"
                    aria-label="Apple"
                    onClick={() => showToast('Apple بىلەن كىرىش پات ئارىدا ئېچىلىدۇ', 'success')}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-1.06 1.73-.93 2.76 1 .08 2.02-.51 2.64-1.26z"/>
                    </svg>
                  </button>
                </div>

                {/* سىندىكى ئالاھىدە ئايلانما ئالماشتۇرۇش كۇنۇپكىسى */}
                <div className="switch-prompt">
                  <span>ھېساباتىڭىز يوقمۇ؟</span>
                  <button
                    type="button"
                    className="switch-circle flex items-center justify-center"
                    onClick={() => handleSwitchTab('register')}
                    title="ھېسابات قۇرۇش"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>
              </form>

              {/* ================= 2. تىزىملىتىش جەدۋىلى (Register Form) ================= */}
              <form
                className={`form ${mode === 'register' ? 'active' : ''}`}
                onSubmit={handleRegisterSubmit}
                autoComplete="off"
              >
                {/* تولۇق ئىسىم */}
                <div className="input-group">
                  <div className={`input-box ${regName ? 'has-value' : ''}`}>
                    <span className="input-icon">
                      <User className="w-4 h-4 text-emerald-500" />
                    </span>
                    <input
                      type="text"
                      id="pageRegName"
                      placeholder=" "
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                    <label className="floating-label" htmlFor="pageRegName">
                      تولۇق ئىسمىڭىز
                    </label>
                  </div>
                </div>

                {/* ئېلخەت ئادرېسى */}
                <div className="input-group">
                  <div className={`input-box ${regEmail ? 'has-value' : ''}`}>
                    <span className="input-icon">
                      <Mail className="w-4 h-4 text-emerald-500" />
                    </span>
                    <input
                      type="email"
                      id="pageRegEmail"
                      placeholder=" "
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="email"
                      required
                    />
                    <label className="floating-label" htmlFor="pageRegEmail">
                      ئېلخەت ئادرېسىڭىز
                    </label>
                  </div>
                </div>

                {/* پارول بەلگىلەش */}
                <div className="input-group">
                  <div className={`input-box ${regPassword ? 'has-value' : ''}`}>
                    <span className="input-icon">
                      <KeyRound className="w-4 h-4 text-emerald-500" />
                    </span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      id="pageRegPassword"
                      placeholder=" "
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="new-password"
                      required
                    />
                    <label className="floating-label" htmlFor="pageRegPassword">
                      يېڭى پارول (ئەڭ ئاز 6 خانە)
                    </label>
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label="پارولنى كۆرسىتىش ياكى يوشۇرۇش"
                    >
                      {showRegPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* پارول جەزملەشتۈرۈش */}
                <div className="input-group">
                  <div className={`input-box ${regConfirmPassword ? 'has-value' : ''}`}>
                    <span className="input-icon">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </span>
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      id="pageRegConfirmPassword"
                      placeholder=" "
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="new-password"
                      required
                    />
                    <label className="floating-label" htmlFor="pageRegConfirmPassword">
                      پارولنى قايتا جەزملەشتۈرۈڭ
                    </label>
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      aria-label="پارولنى كۆرسىتىش ياكى يوشۇرۇش"
                    >
                      {showRegConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* كېلىشىم ۋە شەرتلەر */}
                <div className="form-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      required
                    />
                    <span className="custom-checkbox" />
                    <span className="option-label">مۇلازىمەت ۋە بىخەتەرلىك شەرتلىرىگە قوشۇلىمەن</span>
                  </label>
                </div>

                {/* تىزىملىتىش كۇنۇپكىسى */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`submit-btn flex items-center justify-center gap-2 ${flyArrow ? 'fly-arrow' : ''}`}
                >
                  <span>{loading ? 'ھېسابات قۇرۇۋاتىدۇ...' : 'ھېسابات قۇرۇش'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* ئايرىغۇچ */}
                <div className="divider">
                  <span>ياكى بۇلار بىلەن تىزىملىتىڭ</span>
                </div>

                {/* ئىجتىمائىي تەمىنلىگۈچىلەر */}
                <div className="social-login">
                  <button
                    type="button"
                    className="social-btn flex items-center justify-center"
                    title="Telegram ئارقىلىق تىزىملىتىش"
                    aria-label="Telegram"
                    onClick={handleTelegramLogin}
                    disabled={tgLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#229ED9">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="social-btn flex items-center justify-center"
                    title="Google ئارقىلىق تىزىملىتىش"
                    aria-label="Google"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="social-btn flex items-center justify-center text-slate-800 dark:text-white"
                    title="Apple ئارقىلىق تىزىملىتىش"
                    aria-label="Apple"
                    onClick={() => showToast('Apple بىلەن كىرىش پات ئارىدا ئېچىلىدۇ', 'success')}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-1.06 1.73-.93 2.76 1 .08 2.02-.51 2.64-1.26z"/>
                    </svg>
                  </button>
                </div>

                {/* سىندىكى ئالاھىدە ئايلانما كىرىشكە قايتىش كۇنۇپكىسى */}
                <div className="switch-prompt">
                  <span>ھېساباتىڭىز بارمۇ؟</span>
                  <button
                    type="button"
                    className="switch-circle flex items-center justify-center"
                    onClick={() => handleSwitchTab('login')}
                    title="كىرىشكە قايتىش"
                  >
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </SGCSubpageLayout>
  );
}
