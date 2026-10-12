'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { X, Mail, Lock, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { t, isRTL } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setGoogleLoading(true);

    try {
      const supabase = getBrowserSupabase();
      if (!supabase) {
        setErrorMsg(
          'Google بىلەن كىرىش تەڭشىكى تېخى تولۇقلانمىغان (NEXT_PUBLIC_SUPABASE_URL ۋە ANON_KEY كىرگۈزۈلۈشى كېرەك).'
        );
        setGoogleLoading(false);
        return;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setErrorMsg(err?.message || 'Google بىلەن كىرىش مەغلۇپ بولدى');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg(t('orEmail'));
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email: email.trim(), password }
          : { email: email.trim(), password, name: name.trim(), phone: phone.trim() };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'خاتالىق كۆرۈلدى');
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'مەشغۇلات مەغلۇپ بولدى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md bg-gradient-to-b from-[#07182c] to-[#040e1d] border border-amber-500/35 rounded-3xl p-6 sm:p-7 shadow-2xl ${
          isRTL ? 'text-right' : 'text-left'
        } font-alkatip`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 ${
            isRTL ? 'left-5' : 'right-5'
          } text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Head */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
            <User className="w-6 h-6 text-slate-950" />
          </div>
          <h2 className="font-ukij text-xl sm:text-2xl font-bold text-white mb-1">
            {mode === 'login' ? t('loginTab') : t('registerTab')}
          </h2>
          <p className="font-alkatip text-xs text-amber-200/70">
            {t('brandSlogan')}
          </p>
        </div>

        {/* Google One-Click Login Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-xs transition duration-200 shadow-md flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 border border-slate-200"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{t('googleSignIn')}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3.5">
            <div className="border-t border-slate-700/70 w-full" />
            <span className="bg-[#051426] px-3 text-[11px] text-amber-200/60 font-medium shrink-0">
              {t('orEmail')}
            </span>
            <div className="border-t border-slate-700/70 w-full" />
          </div>
        </div>

        {/* Toggle between Login and Register */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 mb-4 font-alkatip text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'login'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('loginTab')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'register'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('registerTab')}
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3 font-alkatip">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('nameOptional')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('nameOptional')}
                  className={`w-full bg-[#051120] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition ${
                    isRTL ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('phoneLabel')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+963 984 373 459"
                  dir="ltr"
                  className="w-full bg-[#051120] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              dir="ltr"
              required
              className="w-full bg-[#051120] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              required
              className="w-full bg-[#051120] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-mono"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl gold-shimmer-btn text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
            <span>{mode === 'login' ? t('loginTab') : t('registerTab')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
