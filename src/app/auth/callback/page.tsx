'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabaseBrowser';
import { safeRedirectPath, syncSupabaseSession } from '@/lib/clientAuth';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Google ھېساباتى دەلىللىنىۋاتىدۇ...');

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const supabase = getBrowserSupabase();
        if (!supabase) {
          throw new Error('Supabase ئۇلىنىشى سەپلەنمىگەن (NEXT_PUBLIC_SUPABASE_URL تەلەپ قىلىنىدۇ)');
        }

        const code = searchParams.get('code');
        const errorDescription = searchParams.get('error_description') || searchParams.get('error');

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        // 1. If code is present in query parameters (PKCE flow), exchange it
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.warn('Code exchange warning:', exchangeErr.message);
          }
        }

        // 2. Fetch active session
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        if (!session?.user) {
          // Listen for brief delay in case auth event is propagating
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession?.access_token && isMounted) {
              authListener.subscription.unsubscribe();
              try {
                await syncUserAndRedirect(newSession.access_token);
              } catch (err: any) {
                if (!isMounted) return;
                setStatus('error');
                setMessage(err?.message || 'Google ئارقىلىق كىرىش مەغلۇپ بولدى');
              }
            }
          });

          // Timeout fallback
          setTimeout(() => {
            if (isMounted && status === 'loading') {
              setStatus('error');
              setMessage('Google ئارقىلىق كىرىش ۋاقتى ئۆتۈپ كەتتى ياكى دەلىللەنمىدى');
            }
          }, 6000);
          return;
        }

        await syncUserAndRedirect(session.access_token);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('OAuth Callback error:', err);
        setStatus('error');
        setMessage(err?.message || 'Google ئارقىلىق كىرىش مەغلۇپ بولدى');
      }
    }

    async function syncUserAndRedirect(accessToken: string) {
      if (!isMounted) return;
      setMessage('سىستېما ئۇچۇرى ماس قەدەملىنىۋاتىدۇ...');

      // The server verifies the token and sets the session cookie
      await syncSupabaseSession(accessToken);

      // Trigger global event for navbar/drawer listeners
      window.dispatchEvent(new Event('autocash-auth-changed'));

      setStatus('success');
      setMessage('مۇۋەپپەقىيەتلىك كىردىڭىز! بەتكە يۆتكىلىۋاتىدۇ...');

      const nextUrl = safeRedirectPath(searchParams.get('next'));
      setTimeout(() => {
        router.replace(nextUrl);
      }, 1000);
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#020b14] flex items-center justify-center p-4 font-alkatip text-right" dir="rtl">
      <div className="w-full max-w-md bg-gradient-to-b from-[#07182c] to-[#040e1d] border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-black/80">
        <div className="w-20 h-20 rounded-full bg-[#04101e] border-2 border-amber-400/60 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20 overflow-hidden p-1">
          <img src="/brand_logo.png?v=2.1.0" alt="AUTO CASH" className="w-full h-full object-cover rounded-full" />
        </div>

        <h2 className="font-ukij text-xl font-bold text-white mb-2 gold-text-glow">
          AUTO CASH سىستېمىسى
        </h2>

        {status === 'loading' && (
          <div className="py-6 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <p className="text-sm text-amber-200/90 font-medium">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-3 animate-in fade-in">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm text-emerald-300 font-bold">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-4 animate-in fade-in">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-xs text-rose-300/90 bg-rose-950/40 p-3 rounded-xl border border-rose-900/50 leading-relaxed">
              {message}
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-shimmer-btn text-xs font-black shadow-md cursor-pointer"
              >
                <span>باشبەتكە قايتىش</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020b14] flex items-center justify-center p-4 font-alkatip text-center text-amber-300">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
          <p className="text-xs">يۈكلىنىۋاتىدۇ...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
