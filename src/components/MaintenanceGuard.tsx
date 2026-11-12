'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getCachedUser, storeLocalAuth } from '@/lib/clientAuth';
import Image from 'next/image';

const ALLOWED_ADMIN_EMAILS = new Set([
  'dronemax0996@gmail.com',
  'dronemax520@gmail.com',
]);

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  // In-page Admin Login Modal state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const checkAdminStatus = () => {
    try {
      if (typeof window === 'undefined') return;

      // 1. Direct admin panel paths are handled by admin auth
      if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/api') || pathname.startsWith('/mlbb'))) {
        setIsAdmin(true);
        setChecked(true);
        return;
      }

      // 2. Check localStorage cached user
      const user = getCachedUser();
      const localEmail = (user?.email || localStorage.getItem('autocash_email') || '').trim().toLowerCase();
      const localRole = (user?.role || localStorage.getItem('autocash_role') || '').trim().toLowerCase();

      if (ALLOWED_ADMIN_EMAILS.has(localEmail) || localRole === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setChecked(true);
    }
  };

  useEffect(() => {
    checkAdminStatus();

    const handleAuthChange = () => {
      checkAdminStatus();
    };

    window.addEventListener('autocash-auth-changed', handleAuthChange);
    window.addEventListener('autocash_auth_changed', handleAuthChange);
    window.addEventListener('maxbazar-auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('autocash-auth-changed', handleAuthChange);
      window.removeEventListener('autocash_auth_changed', handleAuthChange);
      window.removeEventListener('maxbazar-auth-changed', handleAuthChange);
    };
  }, [pathname]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const emailClean = loginEmail.trim().toLowerCase();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailClean, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || 'ئېلخەت ئادرېسى ياكى پارول خاتا!');
        setIsSubmitting(false);
        return;
      }

      const user = data.user;
      const returnedEmail = (user.email || '').trim().toLowerCase();

      if (!ALLOWED_ADMIN_EMAILS.has(returnedEmail) && user.role !== 'admin') {
        setLoginError('⚠️ كەچۈرۈڭ، پەقەت مەسئۇل باشقۇرغۇچى ھېساباتىلا كىرەلەيدۇ!');
        setIsSubmitting(false);
        return;
      }

      // Store auth
      storeLocalAuth(user);
      setIsAdmin(true);
      setShowLoginModal(false);
    } catch (err: any) {
      setLoginError(err?.message || 'تور ئۇلىنىشى مەغلۇپ بولدى');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If on admin routes, allow through without interruption
  if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/api'))) {
    return <>{children}</>;
  }

  // If verified as authorized admin, render the normal website + admin indicator
  if (isAdmin) {
    return (
      <>
        <div
          dir="rtl"
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] bg-amber-500/90 hover:bg-amber-500 text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border border-amber-300 transition-all select-none"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-700 animate-pulse"></span>
          <span>👑 باشقۇرغۇچى ھالىتى | توربەت ئاممىغا تاقاق (بوت نورمال)</span>
        </div>
        {children}
      </>
    );
  }

  // Prevent flash of maintenance screen during initial hydration check
  if (!checked) {
    return <div className="min-h-screen bg-[#040d1a]" />;
  }

  // -----------------------------------------------------------
  // PUBLIC VISITORS: NON-DISMISSIBLE FULL-SCREEN MAINTENANCE NOTICE
  // -----------------------------------------------------------
  return (
    <div dir="rtl" className="min-h-screen bg-[#040d1a] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="w-full max-w-4xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#071322] rounded-[10px] flex items-center justify-center overflow-hidden">
              <Image src="/brand_logo.png" alt="AUTO CASH" width={32} height={32} className="object-cover" />
            </div>
          </div>
          <div>
            <h2 className="font-extrabold text-base tracking-wide text-white flex items-center gap-1.5">
              <span>AUTO CASH</span>
              <span className="text-amber-400">|</span>
              <span className="text-xs text-amber-300/90 font-medium">MAX-BAZAR</span>
            </h2>
            <p className="text-[11px] text-slate-400">رەقەملىك ماللار ۋە ئويۇن مۇلازىمەت مەركىزى</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>تېلېگرامما بوت 100% پائال</span>
        </div>
      </header>

      {/* Main Center Message Box */}
      <main className="w-full max-w-xl mx-auto px-5 py-6 my-auto z-10 flex flex-col items-center text-center">
        {/* Animated Maintenance Icon Badge */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
            <span className="text-5xl animate-bounce">🛠️</span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-cyan-500 text-black text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
            24/7 BOT
          </div>
        </div>

        {/* Maintenance Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>توربەت ۋاقتىنچە تاقالدى | MAINTENANCE</span>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-3">
          توربەت مۇلازىمىتى قاتتىق ئىشلىنىۋاتىدۇ
        </h1>

        {/* Sub-text */}
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md mb-6">
          ھۆرمەتلىك خېرىدار، توربەت سىستېمىسى تېخىمۇ ياخشى يېڭىلىنىشلار ئۈچۈن قايتا تەڭشىلىۋاتىدۇ. <br />
          <b>ئوڭشالغاندا دەرھال خەۋەر قىلىنىدۇ.</b>
        </p>

        {/* Telegram Bot Action Highlight Card */}
        <div className="w-full bg-gradient-to-br from-[#0c1e34] to-[#081525] border border-cyan-500/30 rounded-2xl p-5 mb-6 text-right shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3.5">
            <span className="text-3xl mt-0.5">⚡</span>
            <div>
              <h3 className="font-bold text-white text-base mb-1">
                بارلىق زاكازلىرىڭىزنى بوتتىن سېتىۋېلىڭ!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Syriatel، MTN، Turkcell، PUBG UC، Free Fire، Honor of Kings، Wi-Fi كارتىلىرى قاتارلىق بارلىق مەھسۇلاتلار رەسمىي تېلېگرامما بوتىمىزدا <b>24 سائەت تولۇق ئاپتوماتىك قاچىلىنىۋاتىدۇ.</b>
              </p>
            </div>
          </div>
        </div>

        {/* MLBB Game Store Access Button */}
        <div className="w-full mb-3">
          <a
            href="/mlbb.html"
            className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-xl shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between group border border-cyan-400/40"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎮</span>
              <div className="text-right">
                <span className="block font-black text-sm">Mobile Legends رەسمىي قاچىلاش كىرىش</span>
                <span className="block text-[11px] text-cyan-200 font-normal">گىلوبال • تۈركىيە • فىلىپپىن (تولۇق ئوچۇق)</span>
              </div>
            </div>
            <span className="text-white text-lg font-bold group-hover:translate-x-[-4px] transition-transform">←</span>
          </a>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <a
            href="https://t.me/Autocash_24_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-extrabold text-base py-4 px-6 rounded-xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span className="text-xl">🤖</span>
            <span>بوتتىن سېتىۋېلىش (@Autocash_24_bot)</span>
            <span className="text-black/70 group-hover:translate-x-[-3px] transition-transform font-bold">↗</span>
          </a>

          <a
            href="https://t.me/autocash_cannel"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0b1c31] hover:bg-[#102744] text-cyan-300 border border-cyan-500/30 font-bold text-sm py-4 px-5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <span>📢</span>
            <span>رەسمىي قانال</span>
          </a>
        </div>
      </main>

      {/* Footer & Discreet Admin Entrance */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 z-10 border-t border-slate-800/50">
        <div>
          © 2026 AUTO CASH & MAX-BAZAR. بارلىق ھوقۇق قوغدىلىدۇ.
        </div>

        <button
          onClick={() => {
            setShowLoginModal(true);
            setLoginError('');
          }}
          className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-800/50"
        >
          <span>🔐</span>
          <span>باشقۇرغۇچى كىرىش (Admin)</span>
        </button>
      </footer>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a1829] border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative text-right">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4 text-amber-400">
              <span className="text-2xl">👑</span>
              <h3 className="font-extrabold text-lg text-white">باشقۇرغۇچى ھېساباتى بىلەن كىرىش</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              پەقەت تەستىقلانغان مەسئۇل باشقۇرغۇچى ئادرېسلىرى (dronemax0996@gmail.com ياكى dronemax520@gmail.com) كىرگەندە توربەت نورمال ئېچىلىدۇ.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">ئېلخەت ئادرېسى:</label>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full bg-[#050e18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">پارول:</label>
                <input
                  type="password"
                  dir="ltr"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#050e18] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>

              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl leading-relaxed">
                  {loginError}
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2.5 px-4 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'تەستىقلىنىۋاتىدۇ...' : 'توربەتنى ئېچىش'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all"
                >
                  تاقاش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
