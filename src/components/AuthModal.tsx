'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { X } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabaseBrowser';

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
  onSuccess: (user: UserSessionData) => void;
}

// ==========================================
// Subcomponent: Isolated Login Form
// Typing in here does NOT re-render the modal, lamp, cord or canvas
// ==========================================
interface LoginFormProps {
  isFlipped: boolean;
  onSwitchTab: (toSignUp: boolean) => void;
  onTriggerSuccess: (title: string, subtitle: string, user: UserSessionData) => void;
  playArrowWhoosh: () => void;
}

const LoginForm = memo(function LoginForm({
  isFlipped,
  onSwitchTab,
  onTriggerSuccess,
  playArrowWhoosh,
}: LoginFormProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginArrowFlying, setLoginArrowFlying] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const supabase = getBrowserSupabase();
      if (!supabase) {
        setErrorMsg(t('loginFailed'));
        setGoogleLoading(false);
        return;
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setErrorMsg(err?.message || t('loginFailed'));
      setGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail || !loginPassword) {
      setErrorMsg(t('fillAllFields'));
      return;
    }

    playArrowWhoosh();
    setLoginArrowFlying(true);

    setTimeout(() => {
      setLoginLoading(true);
    }, 350);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || t('loginFailed'));
      }

      onTriggerSuccess(
        t('loginSuccessToast'),
        `${t('welcomeUser')} ${data.user?.name || loginEmail}`,
        data.user
      );
    } catch (err: any) {
      setErrorMsg(err?.message || t('loginFailed'));
    } finally {
      setLoginArrowFlying(false);
      setLoginLoading(false);
    }
  };

  return (
    <div className="login-card card-front">
      <div className="card-top-shine" />

      {/* Tabs */}
      <div className="auth-tabs">
        <button
          type="button"
          className={`tab-btn ${!isFlipped ? 'active' : ''}`}
          onClick={() => onSwitchTab(false)}
        >
          <span>{t('loginTab')}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${isFlipped ? 'active' : ''}`}
          onClick={() => onSwitchTab(true)}
        >
          <span>{t('registerTab')}</span>
        </button>
      </div>

      {/* Header */}
      <div className="card-header">
        <div className="badge-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C7.58 2 4 5.58 4 10c0 2.61 1.25 4.93 3.19 6.4L7 18c0 .55.45 1 1 1h8c.55 0 1-.45 1-1l-.19-1.6C18.75 14.93 20 12.61 20 10c0-4.42-3.58-8-8-8zm-2 19c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-1h-4v1zm2-17c3.31 0 6 2.69 6 6 0 1.96-.94 3.69-2.4 4.79l-.6.45.27.76.73 2H8l.73-2 .27-.76-.6-.45C6.94 13.69 6 11.96 6 10c0-3.31 2.69-6 6-6z" />
          </svg>
        </div>
        <h1 className="card-title">{t('welcomeCardTitle')}</h1>
        <p className="card-subtitle">{t('welcomeCardSubtitle')}</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLoginSubmit}>
        {errorMsg && !isFlipped && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email / Username */}
        <div className="form-group">
          <label className="field-label">{t('usernameOrEmail')}</label>
          <div className="input-wrapper">
            <div className="input-border-beam" />
            <input
              type="text"
              inputMode="email"
              dir="ltr"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="custom-input input-ltr"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder={t('usernamePlaceholder')}
              required
              autoComplete="username"
            />
            <svg className="input-icon" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="field-label">{t('password')}</label>
          <div className="input-wrapper">
            <div className="input-border-beam" />
            <input
              type={showLoginPassword ? 'text' : 'password'}
              dir="ltr"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="custom-input input-ltr input-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <svg className="input-icon" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              aria-label={t('showPassword')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Options */}
        <div className="form-options">
          <label className="remember-me">
            <input type="checkbox" className="checkbox-custom" defaultChecked />
            <span>{t('rememberMe')}</span>
          </label>
          <a
            href="#"
            className="forgot-pass"
            onClick={(e) => {
              e.preventDefault();
              alert(t('forgotPasswordAlert'));
            }}
          >
            {t('forgotPassword')}
          </a>
        </div>

        {/* Submit button with arrow flying */}
        <button
          type="submit"
          disabled={loginLoading}
          className={`btn-submit ${loginArrowFlying ? 'arrow-flying' : ''} ${loginLoading ? 'loading' : ''}`}
        >
          <span className="btn-text">{loginLoading ? t('loggingIn') : t('loginTab')}</span>
          <svg className="btn-arrow" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <div className="btn-spinner" />
        </button>

        {/* Google OAuth Button */}
        <div className="social-auth-grid">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="btn-social"
          >
            <svg viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-3.1z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.2-6.7-5.3L1.6 16C3.5 19.9 7.4 23 12 23z" />
            </svg>
            <span>{googleLoading ? t('googleSigningIn') : t('googleSignIn')}</span>
          </button>
        </div>

        {/* Footer Switch */}
        <div className="card-footer">
          <span>{t('dontHaveAccount')}</span>
          <a
            href="#"
            className="register-link"
            onClick={(e) => {
              e.preventDefault();
              onSwitchTab(true);
            }}
          >
            {t('registerNow')}
          </a>
        </div>
      </form>
    </div>
  );
});

// ==========================================
// Subcomponent: Isolated Signup Form
// Typing in here does NOT re-render the modal, lamp, cord or canvas
// ==========================================
interface SignupFormProps {
  isFlipped: boolean;
  onSwitchTab: (toSignUp: boolean) => void;
  onTriggerSuccess: (title: string, subtitle: string, user: UserSessionData) => void;
  playArrowWhoosh: () => void;
}

const SignupForm = memo(function SignupForm({
  isFlipped,
  onSwitchTab,
  onTriggerSuccess,
  playArrowWhoosh,
}: SignupFormProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [signupArrowFlying, setSignupArrowFlying] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const supabase = getBrowserSupabase();
      if (!supabase) {
        setErrorMsg(t('loginFailed'));
        setGoogleLoading(false);
        return;
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setErrorMsg(err?.message || t('loginFailed'));
      setGoogleLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signupName || !signupEmail || !signupPassword) {
      setErrorMsg(t('fillAllFields'));
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg(t('passwordsDoNotMatch'));
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg(t('passwordMinLength'));
      return;
    }

    playArrowWhoosh();
    setSignupArrowFlying(true);

    setTimeout(() => {
      setSignupLoading(true);
    }, 350);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail.trim(),
          password: signupPassword,
          name: signupName.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || t('registerFailed'));
      }

      onTriggerSuccess(
        t('registerSuccessToast'),
        `${t('welcomeUser')} ${signupName}`,
        data.user
      );
    } catch (err: any) {
      setErrorMsg(err?.message || t('registerFailed'));
    } finally {
      setSignupArrowFlying(false);
      setSignupLoading(false);
    }
  };

  return (
    <div className="login-card card-back">
      <div className="card-top-shine" />

      {/* Tabs */}
      <div className="auth-tabs">
        <button
          type="button"
          className={`tab-btn ${!isFlipped ? 'active' : ''}`}
          onClick={() => onSwitchTab(false)}
        >
          <span>{t('loginTab')}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${isFlipped ? 'active' : ''}`}
          onClick={() => onSwitchTab(true)}
        >
          <span>{t('registerTab')}</span>
        </button>
      </div>

      {/* Header */}
      <div className="card-header">
        <div className="badge-icon">
          <svg viewBox="0 0 24 24">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <h1 className="card-title">{t('createAccountTitle')}</h1>
        <p className="card-subtitle">{t('createAccountSubtitle')}</p>
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSignupSubmit}>
        {errorMsg && isFlipped && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Name */}
        <div className="form-group">
          <label className="field-label">{t('nameLabel')}</label>
          <div className="input-wrapper">
            <div className="input-border-beam" />
            <input
              type="text"
              dir="auto"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              className="custom-input"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              placeholder={t('namePlaceholder')}
              required
              autoComplete="name"
            />
            <svg className="input-icon" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="field-label">{t('emailLabel')}</label>
          <div className="input-wrapper">
            <div className="input-border-beam" />
            <input
              type="email"
              inputMode="email"
              dir="ltr"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="custom-input input-ltr"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              placeholder="example@mail.com"
              required
              autoComplete="email"
            />
            <svg className="input-icon" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="field-label">{t('password')}</label>
          <div className="input-wrapper">
            <div className="input-border-beam" />
            <input
              type={showSignupPassword ? 'text' : 'password'}
              dir="ltr"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="custom-input input-ltr input-password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              placeholder={t('passwordMinLengthPlaceholder')}
              required
              autoComplete="new-password"
            />
            <svg className="input-icon" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowSignupPassword(!showSignupPassword)}
              aria-label={t('showPassword')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label className="field-label">{t('confirmPassword')}</label>
          <div className="input-wrapper">
            <div className="input-border-beam" />
            <input
              type={showSignupConfirmPassword ? 'text' : 'password'}
              dir="ltr"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="custom-input input-ltr input-password"
              value={signupConfirmPassword}
              onChange={(e) => setSignupConfirmPassword(e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
              required
              autoComplete="new-password"
            />
            <svg className="input-icon" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
              aria-label={t('showPassword')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Terms agreement */}
        <div className="form-options">
          <label className="remember-me">
            <input
              type="checkbox"
              className="checkbox-custom"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            <span>{t('agreeTermsText')}</span>
          </label>
        </div>

        {/* Submit button with arrow flying */}
        <button
          type="submit"
          disabled={signupLoading}
          className={`btn-submit ${signupArrowFlying ? 'arrow-flying' : ''} ${signupLoading ? 'loading' : ''}`}
        >
          <span className="btn-text">{signupLoading ? t('registering') : t('createAccountBtn')}</span>
          <svg className="btn-arrow" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <div className="btn-spinner" />
        </button>

        {/* Google OAuth Button */}
        <div className="social-auth-grid">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="btn-social"
          >
            <svg viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-3.1z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.2-6.7-5.3L1.6 16C3.5 19.9 7.4 23 12 23z" />
            </svg>
            <span>{googleLoading ? t('googleSigningIn') : t('googleSignUp')}</span>
          </button>
        </div>

        {/* Footer Switch */}
        <div className="card-footer">
          <span>{t('alreadyHaveAccount')}</span>
          <a
            href="#"
            className="register-link"
            onClick={(e) => {
              e.preventDefault();
              onSwitchTab(false);
            }}
          >
            {t('signInNow')}
          </a>
        </div>
      </form>
    </div>
  );
});

// ==========================================
// Main Modal Shell Component
// ==========================================
export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const router = useRouter();
  const { t, isRTL, lang } = useLanguage();

  // Mode: false = login (front), true = register (back)
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLampOn, setIsLampOn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLampOn(false);
      setIsFlipped(false);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Success modal overlay state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successSubtitle, setSuccessSubtitle] = useState('');

  // Physics refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cordHandleRef = useRef<HTMLDivElement | null>(null);
  const cordPathRef = useRef<SVGPathElement | null>(null);
  const cordKnobRef = useRef<SVGCircleElement | null>(null);
  const cordMidBeadRef = useRef<SVGCircleElement | null>(null);
  const cordKnobShineRef = useRef<SVGCircleElement | null>(null);
  const cordHitAreaRef = useRef<SVGCircleElement | null>(null);

  // Cord physics state
  const physicsState = useRef({
    REST_X: 50,
    REST_Y: 105,
    MAX_STRETCH_Y: 85,
    MAX_SWING_X: 35,
    TRIGGER_THRESHOLD_Y: 38,
    currentX: 50,
    currentY: 105,
    targetX: 50,
    targetY: 105,
    vx: 0,
    vy: 0,
    isDragging: false,
    startPointerX: 0,
    startPointerY: 0,
    startKnobX: 50,
    startKnobY: 105,
    animFrameId: null as number | null,
    hasTriggeredInCurrentPull: false,
    lastClientX: 0,
    lastClientY: 0,
    lastTime: 0,
    pointerVx: 0,
    pointerVy: 0,
  });

  // Sound synthesis helpers
  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSwitchSound = (turningOn: boolean) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(turningOn ? 950 : 700, now);
      snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.03);
      snapGain.gain.setValueAtTime(0.25, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.035);
    } catch {}
  };

  const playCordTwangSound = (pitch = 440) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  };

  const playFlipSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.28);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.33);
    } catch {}
  };

  const playArrowWhoosh = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {}
  };

  const playSuccessChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.72);
      });
    } catch {}
  };

  // Lamp toggle handler
  const handleToggleLamp = () => {
    setIsLampOn(prev => {
      const next = !prev;
      playSwitchSound(next);
      return next;
    });
  };

  const switchTab = (toSignUp: boolean) => {
    if (toSignUp !== isFlipped) {
      playFlipSound();
      setIsFlipped(toSignUp);
    }
  };

  // Trigger success animation and callback
  const handleTriggerSuccess = (title: string, subtitle: string, user: UserSessionData) => {
    setSuccessTitle(title);
    setSuccessSubtitle(subtitle);
    setShowSuccess(true);
    playSuccessChime();

    setTimeout(() => {
      onSuccess(user);
      onClose();
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        router.replace('/');
      }
    }, 1600);
  };

  // Render SVG pull cord
  const renderCord = (x: number, y: number) => {
    const { REST_X } = physicsState.current;
    const ctrlX = REST_X + (x - REST_X) * 0.35;
    const ctrlY = y * 0.55 + 6;

    if (cordPathRef.current) {
      cordPathRef.current.setAttribute('d', `M ${REST_X} 0 Q ${ctrlX} ${ctrlY} ${x} ${y}`);
    }
    if (cordMidBeadRef.current) {
      cordMidBeadRef.current.setAttribute('cx', ctrlX.toString());
      cordMidBeadRef.current.setAttribute('cy', ctrlY.toString());
    }
    if (cordKnobRef.current) {
      cordKnobRef.current.setAttribute('cx', x.toString());
      cordKnobRef.current.setAttribute('cy', y.toString());
    }
    if (cordKnobShineRef.current) {
      cordKnobShineRef.current.setAttribute('cx', (x - 3.2).toString());
      cordKnobShineRef.current.setAttribute('cy', (y - 3.2).toString());
    }
    if (cordHitAreaRef.current) {
      cordHitAreaRef.current.setAttribute('cx', x.toString());
      cordHitAreaRef.current.setAttribute('cy', y.toString());
    }
  };

  const updateCordPhysics = () => {
    const s = physicsState.current;
    if (s.isDragging) {
      s.currentX += (s.targetX - s.currentX) * 0.45;
      s.currentY += (s.targetY - s.currentY) * 0.45;
      renderCord(s.currentX, s.currentY);
      s.animFrameId = requestAnimationFrame(updateCordPhysics);
      return;
    }

    // 1. Natural Pendulum Oscillation (X-axis)
    const stiffnessX = 0.052;
    const dampingX = 0.96;
    const forceX = -(s.currentX - s.REST_X) * stiffnessX;
    s.vx = (s.vx + forceX) * dampingX;
    s.currentX += s.vx;

    // 2. Elastic Spring + Geometric Pendulum Arc Lift (Y-axis)
    const stiffnessY = 0.16;
    const dampingY = 0.82;
    const arcLift = Math.pow((s.currentX - s.REST_X) / 38, 2) * 4.5;
    const naturalY = s.REST_Y - arcLift;
    const forceY = -(s.currentY - naturalY) * stiffnessY;
    s.vy = (s.vy + forceY) * dampingY;
    s.currentY += s.vy;

    renderCord(s.currentX, s.currentY);

    const isMoving =
      Math.abs(s.currentX - s.REST_X) > 0.15 ||
      Math.abs(s.vx) > 0.08 ||
      Math.abs(s.currentY - s.REST_Y) > 0.15 ||
      Math.abs(s.vy) > 0.08;

    if (isMoving) {
      s.animFrameId = requestAnimationFrame(updateCordPhysics);
    } else {
      s.currentX = s.REST_X;
      s.currentY = s.REST_Y;
      s.vx = 0;
      s.vy = 0;
      renderCord(s.REST_X, s.REST_Y);
      s.animFrameId = null;
    }
  };

  const ensurePhysicsRunning = () => {
    if (!physicsState.current.animFrameId) {
      physicsState.current.animFrameId = requestAnimationFrame(updateCordPhysics);
    }
  };

  // Wire pull cord pointer events
  useEffect(() => {
    if (!isOpen) return;

    const cordHandle = cordHandleRef.current;
    if (!cordHandle) return;

    const onPointerMove = (e: PointerEvent) => {
      const s = physicsState.current;
      if (!s.isDragging) return;

      const now = performance.now();
      const dt = Math.max(8, now - s.lastTime);
      s.pointerVx = (e.clientX - s.lastClientX) / dt;
      s.pointerVy = (e.clientY - s.lastClientY) / dt;
      s.lastClientX = e.clientX;
      s.lastClientY = e.clientY;
      s.lastTime = now;

      const deltaX = (e.clientX - s.startPointerX) * 0.45;
      const deltaY = (e.clientY - s.startPointerY) * 0.75;

      const clampedX = Math.max(-s.MAX_SWING_X, Math.min(s.MAX_SWING_X, deltaX));
      const clampedY = Math.max(-8, Math.min(s.MAX_STRETCH_Y, deltaY));

      const stretchResistance = clampedY > 30 ? 1 - ((clampedY - 30) / (s.MAX_STRETCH_Y * 1.5)) : 1;
      const resistedY = clampedY * Math.max(0.4, stretchResistance);

      s.targetX = s.startKnobX + clampedX;
      s.targetY = s.startKnobY + resistedY;

      if (resistedY >= s.TRIGGER_THRESHOLD_Y && !s.hasTriggeredInCurrentPull) {
        s.hasTriggeredInCurrentPull = true;
        handleToggleLamp();
      }

      ensurePhysicsRunning();
    };

    const releaseCord = () => {
      const s = physicsState.current;
      if (!s.isDragging) return;

      s.isDragging = false;
      s.hasTriggeredInCurrentPull = false;

      const releaseVelocityMultiplier = 8.5;
      s.vx = Math.max(-14, Math.min(14, s.pointerVx * releaseVelocityMultiplier));
      s.vy = Math.max(-12, Math.min(10, s.pointerVy * 6.0));

      const displacementDist = Math.hypot(s.currentX - s.REST_X, s.currentY - s.REST_Y);
      if (displacementDist > 20) {
        playCordTwangSound(380 + Math.min(220, displacementDist * 3));
      }

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', releaseCord);
      window.removeEventListener('pointercancel', releaseCord);

      ensurePhysicsRunning();
    };

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const s = physicsState.current;
      s.isDragging = true;
      s.hasTriggeredInCurrentPull = false;
      s.startPointerX = e.clientX;
      s.startPointerY = e.clientY;
      s.startKnobX = s.currentX;
      s.startKnobY = s.currentY;
      s.lastClientX = e.clientX;
      s.lastClientY = e.clientY;
      s.lastTime = performance.now();
      s.pointerVx = 0;
      s.pointerVy = 0;
      s.vx = 0;
      s.vy = 0;

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', releaseCord);
      window.addEventListener('pointercancel', releaseCord);

      ensurePhysicsRunning();
    };

    const onClick = (e: MouseEvent) => {
      e.stopPropagation();
      const s = physicsState.current;
      s.targetY = s.REST_Y + s.TRIGGER_THRESHOLD_Y + 6;
      s.vy = 6;
      handleToggleLamp();
      ensurePhysicsRunning();
      setTimeout(() => {
        s.targetY = s.REST_Y;
        s.vy = -10;
        ensurePhysicsRunning();
      }, 140);
    };

    cordHandle.addEventListener('pointerdown', onPointerDown);
    cordHandle.addEventListener('click', onClick);

    return () => {
      cordHandle.removeEventListener('pointerdown', onPointerDown);
      cordHandle.removeEventListener('click', onClick);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', releaseCord);
      window.removeEventListener('pointercancel', releaseCord);
      if (physicsState.current.animFrameId) {
        cancelAnimationFrame(physicsState.current.animFrameId);
      }
    };
  }, [isOpen]);

  // High Performance Canvas Particles (only active on desktop when lamp is ON)
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (isMobile || !isLampOn) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const glowSprite = document.createElement('canvas');
    glowSprite.width = 40;
    glowSprite.height = 40;
    const sCtx = glowSprite.getContext('2d');
    if (sCtx) {
      const sGrad = sCtx.createRadialGradient(20, 20, 0, 20, 20, 20);
      sGrad.addColorStop(0, '#ffffff');
      sGrad.addColorStop(0.25, 'rgba(255, 240, 180, 0.9)');
      sGrad.addColorStop(0.55, 'rgba(255, 196, 77, 0.35)');
      sGrad.addColorStop(1, 'rgba(255, 183, 3, 0)');
      sCtx.fillStyle = sGrad;
      sCtx.beginPath();
      sCtx.arc(20, 20, 20, 0, Math.PI * 2);
      sCtx.fill();
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    class Firefly {
      x = 0;
      y = 0;
      radius = 0;
      baseAlpha = 0;
      alpha = 0;
      vx = 0;
      vy = 0;
      phase = 0;
      phaseSpeed = 0;

      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = init ? Math.random() * canvas.height : canvas.height + 10;
        this.radius = 1.2 + Math.random() * 2.0;
        this.baseAlpha = 0.2 + Math.random() * 0.6;
        this.alpha = this.baseAlpha;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -0.25 - Math.random() * 0.4;
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = 0.02 + Math.random() * 0.02;
      }

      update() {
        if (!canvas) return;
        this.phase += this.phaseSpeed;
        this.x += this.vx + Math.sin(this.phase) * 0.3;
        this.y += this.vy;
        const pulse = (Math.sin(this.phase) + 1) * 0.5;
        this.alpha = this.baseAlpha * pulse;

        if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
          this.reset(false);
        }
      }

      draw() {
        if (!canvas || !ctx) return;
        ctx.globalAlpha = Math.min(1, this.alpha);
        const drawRadius = this.radius * 3.5;
        ctx.drawImage(glowSprite, this.x - drawRadius, this.y - drawRadius, drawRadius * 2, drawRadius * 2);
      }
    }

    const particles: Firefly[] = [];
    const NUM_PARTICLES = 16;
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(new Firefly());
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [isOpen, isLampOn]);

  if (!isOpen) return null;

  return (
    <div
      className={`nasrulla-modal-root ${isLampOn ? 'lamp-on' : ''} lang-${lang}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Close button at top-left */}
      <button
        type="button"
        className="btn-close-modal"
        onClick={onClose}
        data-modal-close="true"
        title={t('close')}
      >
        <X className="w-4 h-4 text-amber-400" />
        <span>{t('close')}</span>
      </button>

      {/* Firefly particles canvas */}
      <canvas ref={canvasRef} id="particle-canvas" />

      {/* Dark room vignette */}
      <div className="vignette-overlay" />

      {/* Main Interactive Scene */}
      <div className="scene-wrapper">

        {/* 3D Standing Floor Lamp Rig */}
        <div className="lamp-rig">
          <div className="lamp-ambient-glow" />

          {/* Lamp shade, bulb, finial */}
          <div className="lamp-shade-container">
            <div className="lamp-finial" />
            <div className="lamp-cap" />
            <div className="lamp-shade">
              <div className="lamp-shade-rim" />
              <div className="lamp-inner-reflector" />
            </div>
            <div className="lamp-bulb">
              <div className="bulb-filament" />
            </div>
          </div>

          <div className="cord-collar" />
          <div className="lamp-stem" />
          <div className="lamp-base" />

          {/* Volumetric feathered light beam */}
          <div className="light-beam" />
          <div className="light-beam-core" />
          <div className="desk-reflection" />

          {/* Interactive SVG pull cord */}
          <div
            ref={cordHandleRef}
            className="pull-cord-wrapper"
            title={t('cordPullPrompt')}
          >
            <svg className="pull-cord-svg" viewBox="0 0 100 240">
              <defs>
                <radialGradient id="modalHandleGrad" cx="28%" cy="28%" r="72%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="22%" stopColor="#fff4b8" />
                  <stop offset="50%" stopColor="#ffb703" />
                  <stop offset="80%" stopColor="#996300" />
                  <stop offset="100%" stopColor="#382100" />
                </radialGradient>
              </defs>
              <path ref={cordPathRef} className="cord-string" d="M 50 0 Q 50 53 50 105" />
              <circle ref={cordMidBeadRef} className="cord-mid-bead" cx="50" cy="53" r="4.5" />
              <circle ref={cordKnobRef} className="cord-handle" cx="50" cy="105" r="11" />
              <circle ref={cordKnobShineRef} cx="46.8" cy="101.8" r="3.2" fill="#ffffff" opacity="0.9" pointerEvents="none" />
              <circle ref={cordHitAreaRef} className="cord-hit-area" cx="50" cy="105" r="26" />
            </svg>
          </div>

          {/* Tooltip hint under knob */}
          <div
            className={`cord-hint ${isLampOn ? 'hidden' : ''}`}
            onClick={handleToggleLamp}
            title={t('lampTooltip')}
          >
            <span>👆</span>
            <span>{t('pullLampHint')}</span>
          </div>
        </div>

        {/* 3D Flip Card Container */}
        <div
          className={`login-card-container ${isFlipped ? 'flipped' : ''}`}
          onClick={() => {
            if (!isLampOn) handleToggleLamp();
          }}
        >
          <div className="card-flipper">
            {/* Front Side: Isolated Login Component */}
            <LoginForm
              isFlipped={isFlipped}
              onSwitchTab={switchTab}
              onTriggerSuccess={handleTriggerSuccess}
              playArrowWhoosh={playArrowWhoosh}
            />

            {/* Back Side: Isolated Signup Component */}
            <SignupForm
              isFlipped={isFlipped}
              onSwitchTab={switchTab}
              onTriggerSuccess={handleTriggerSuccess}
              playArrowWhoosh={playArrowWhoosh}
            />
          </div>
        </div>

      </div>

      {/* Success Portal Modal */}
      <div
        className={`success-overlay ${showSuccess ? 'active' : ''}`}
        onClick={() => setShowSuccess(false)}
      >
        <div className="success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-glow-aura" />

          <div className="success-circle-wrapper">
            <div className="ripple-ring ring-1" />
            <div className="ripple-ring ring-2" />
            <div className="success-circle">
              <svg className="w-12 h-12" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="23" fill="none" />
                <path className="checkmark-check" fill="none" d="M14 27 l8 8 l16 -16" />
              </svg>
            </div>
          </div>

          <h2 className="success-title">{successTitle}</h2>
          <p className="success-subtitle">{successSubtitle}</p>

          <div className="success-bar">
            <div className="success-bar-fill" />
          </div>

          <button
            type="button"
            className="success-btn-close"
            onClick={() => setShowSuccess(false)}
          >
            <span>{t('gotItClose')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
