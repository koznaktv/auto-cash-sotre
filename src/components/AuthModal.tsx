'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { getBrowserSupabase } from '@/lib/supabaseBrowser';
import { storeLocalAuth } from '@/lib/clientAuth';

export interface UserSessionData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  totalSpent?: number;
  vipTier?: string;
  role?: string;
  avatarUrl?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserSessionData) => void;
  defaultTab?: 'login' | 'register';
  initialMode?: 'login' | 'register' | string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'login',
  initialMode,
}: AuthModalProps) {
  const effectiveDefaultTab: 'login' | 'register' =
    initialMode === 'register' || defaultTab === 'register' ? 'register' : 'login';
  const router = useRouter();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>(effectiveDefaultTab);
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, msg: message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3800);
  };

  useEffect(() => {
    if (isOpen) {
      setMode(effectiveDefaultTab);
      setSpinClass('');
      setIsSpinning(false);
    }
  }, [isOpen, effectiveDefaultTab]);

  // 3D Flip Tab Switcher
  const handleSwitchTab = (newMode: 'login' | 'register') => {
    if (isSpinning || mode === newMode) return;
    setIsSpinning(true);

    const nextSpinClass = newMode === 'register' ? 'spin-to-register' : 'spin-to-login';
    setSpinClass(nextSpinClass);

    // Midpoint switch at 320ms when card is edge-on (90deg)
    setTimeout(() => {
      setMode(newMode);
    }, 320);

    // End of animation at 650ms
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
            setTimeout(() => {
              onSuccess?.(pollData.user);
              onClose();
            }, 800);
          }
        } catch {}
      }, 1500);
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

      setTimeout(() => {
        onSuccess?.(data.user);
        onClose();
      }, 800);
    } catch (err: any) {
      showToast(err?.message || 'كىرىش مەغلۇپ بولدى', 'error');
    } finally {
      setTimeout(() => setFlyArrow(false), 900);
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

      setTimeout(() => {
        onSuccess?.(data.user);
        onClose();
      }, 900);
    } catch (err: any) {
      showToast(err?.message || 'تىزىملىتىش مەغلۇپ بولدى', 'error');
    } finally {
      setTimeout(() => setFlyArrow(false), 900);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="neumorphic-auth-root neumorphic-modal-overlay" onClick={onClose}>
      {/* ئەتراپتىكى لەيلىمە Neumorphic بېزەك شارچىلار */}
      <div className="bg-circle bg1" />
      <div className="bg-circle bg2" />
      <div className="bg-circle bg3" />

      {/* ئۇچۇر ئەسكەرتىش قەۋىتى (Toast Notification) */}
      <div className={`toast ${toast.show ? `show ${toast.type}` : ''}`}>
        <i className={`toast-icon fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
        <span className="toast-text">{toast.msg}</span>
      </div>

      {/* 3D پىرقىراش قاچىسى (3D Perspective Container) */}
      <div className="card-container" onClick={(e) => e.stopPropagation()}>
        <main className={`auth-card ${spinClass}`} id="authCard">
          {/* Close Button */}
          <button
            type="button"
            className="auth-close-btn"
            onClick={onClose}
            aria-label="يېپىش"
            title="يېپىش"
          >
            <i className="fas fa-times" />
          </button>

          {/* كارتىچكا ئۈستۈنكى نىشان بەلگىسى (Brand Lock/Avatar) */}
          <div className="card-header">
            <div className="brand-icon-box">
              <div className="brand-icon-inner overflow-hidden p-0.5">
                <img
                  src="/logo.png"
                  alt="AUTO CASH Logo"
                  className="w-full h-full object-cover rounded-full"
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
              className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('login')}
            >
              <i className="fas fa-sign-in-alt" />
              <span>كىرىش</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('register')}
            >
              <i className="fas fa-user-plus" />
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
                    <i className="fas fa-envelope" />
                  </span>
                  <input
                    type="text"
                    id="modalLoginEmail"
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
                  <label className="floating-label" htmlFor="modalLoginEmail">
                    ئېلخەت ياكى ئىشلەتكۈچى نامى
                  </label>
                </div>
              </div>

              {/* پارول */}
              <div className="input-group">
                <div className={`input-box ${loginPassword ? 'has-value' : ''}`}>
                  <span className="input-icon">
                    <i className="fas fa-lock" />
                  </span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="modalLoginPassword"
                    placeholder=" "
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="current-password"
                    required
                  />
                  <label className="floating-label" htmlFor="modalLoginPassword">
                    پارولىڭىزنى كىرگۈزۈڭ
                  </label>
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label="پارولنى كۆرسىتىش ياكى يوشۇرۇش"
                  >
                    <i className={`far ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
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
                className={`submit-btn ${flyArrow ? 'fly-arrow' : ''}`}
              >
                <span>{loading ? 'كىرىۋاتىدۇ...' : 'كىرىش'}</span>
                <i className="fas fa-arrow-left" />
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
                  className="social-btn"
                  title="Telegram ئارقىلىق 1 چېكىپ كىرىش"
                  aria-label="Telegram"
                  onClick={handleTelegramLogin}
                  disabled={tgLoading}
                >
                  <i className="fab fa-telegram text-[#229ED9] text-xl" />
                </button>
                <button
                  type="button"
                  className="social-btn"
                  title="Google ئارقىلىق كىرىش"
                  aria-label="Google"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  <i className="fab fa-google text-[#EA4335]" />
                </button>
                <button
                  type="button"
                  className="social-btn"
                  title="Apple ئارقىلىق كىرىش"
                  aria-label="Apple"
                  onClick={() => showToast('Apple بىلەن كىرىش پات ئارىدا ئېچىلىدۇ', 'success')}
                >
                  <i className="fab fa-apple text-slate-800" />
                </button>
              </div>

              {/* سىندىكى ئالاھىدە ئايلانما ئالماشتۇرۇش كۇنۇپكىسى */}
              <div className="switch-prompt">
                <span>ھېساباتىڭىز يوقمۇ؟</span>
                <button
                  type="button"
                  className="switch-circle"
                  onClick={() => handleSwitchTab('register')}
                  title="ھېسابات قۇرۇش"
                >
                  <i className="fas fa-plus" />
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
                    <i className="fas fa-user" />
                  </span>
                  <input
                    type="text"
                    id="modalRegName"
                    placeholder=" "
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                  <label className="floating-label" htmlFor="modalRegName">
                    تولۇق ئىسمىڭىز
                  </label>
                </div>
              </div>

              {/* ئېلخەت ئادرېسى */}
              <div className="input-group">
                <div className={`input-box ${regEmail ? 'has-value' : ''}`}>
                  <span className="input-icon">
                    <i className="fas fa-envelope" />
                  </span>
                  <input
                    type="email"
                    id="modalRegEmail"
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
                  <label className="floating-label" htmlFor="modalRegEmail">
                    ئېلخەت ئادرېسىڭىز
                  </label>
                </div>
              </div>

              {/* پارول بەلگىلەش */}
              <div className="input-group">
                <div className={`input-box ${regPassword ? 'has-value' : ''}`}>
                  <span className="input-icon">
                    <i className="fas fa-key" />
                  </span>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    id="modalRegPassword"
                    placeholder=" "
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="new-password"
                    required
                  />
                  <label className="floating-label" htmlFor="modalRegPassword">
                    يېڭى پارول (ئەڭ ئاز 6 خانە)
                  </label>
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label="پارولنى كۆرسىتىش ياكى يوشۇرۇش"
                  >
                    <i className={`far ${showRegPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              {/* پارول جەزملەشتۈرۈش */}
              <div className="input-group">
                <div className={`input-box ${regConfirmPassword ? 'has-value' : ''}`}>
                  <span className="input-icon">
                    <i className="fas fa-shield-alt" />
                  </span>
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    id="modalRegConfirmPassword"
                    placeholder=" "
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="new-password"
                    required
                  />
                  <label className="floating-label" htmlFor="modalRegConfirmPassword">
                    پارولنى قايتا جەزملەشتۈرۈڭ
                  </label>
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    aria-label="پارولنى كۆرسىتىش ياكى يوشۇرۇش"
                  >
                    <i className={`far ${showRegConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
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
                className={`submit-btn ${flyArrow ? 'fly-arrow' : ''}`}
              >
                <span>{loading ? 'ھېسابات قۇرۇۋاتىدۇ...' : 'ھېسابات قۇرۇش'}</span>
                <i className="fas fa-user-check" />
              </button>

              {/* ئايرىغۇچ */}
              <div className="divider">
                <span>ياكى بۇلار بىلەن تىزىملىتىڭ</span>
              </div>

              {/* ئىجتىمائىي تەمىنلىگۈچىلەر */}
              <div className="social-login">
                <button
                  type="button"
                  className="social-btn"
                  title="Telegram ئارقىلىق تىزىملىتىش"
                  aria-label="Telegram"
                  onClick={handleTelegramLogin}
                  disabled={tgLoading}
                >
                  <i className="fab fa-telegram text-[#229ED9] text-xl" />
                </button>
                <button
                  type="button"
                  className="social-btn"
                  title="Google ئارقىلىق تىزىملىتىش"
                  aria-label="Google"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  <i className="fab fa-google text-[#EA4335]" />
                </button>
                <button
                  type="button"
                  className="social-btn"
                  title="Apple ئارقىلىق تىزىملىتىش"
                  aria-label="Apple"
                  onClick={() => showToast('Apple بىلەن كىرىش پات ئارىدا ئېچىلىدۇ', 'success')}
                >
                  <i className="fab fa-apple text-slate-800" />
                </button>
              </div>

              {/* سىندىكى ئالاھىدە ئايلانما كىرىشكە قايتىش كۇنۇپكىسى */}
              <div className="switch-prompt">
                <span>ھېساباتىڭىز بارمۇ؟</span>
                <button
                  type="button"
                  className="switch-circle"
                  onClick={() => handleSwitchTab('login')}
                  title="كىرىشكە قايتىش"
                >
                  <i className="fas fa-arrow-right" />
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
