'use client';

import { useEffect } from 'react';
import { storeLocalAuth } from '@/lib/clientAuth';

export default function TelegramAutoLogin() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running inside Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#040d1a');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#040d1a');
    } catch {}

    const initData = tg.initData;
    if (!initData) return;

    const isLoggedIn = localStorage.getItem('autocash_is_logged_in');
    const email = localStorage.getItem('autocash_email');

    // If not logged in, or if logged in as another temporary user, perform seamless auto-login
    if (isLoggedIn !== 'true' || !email) {
      fetch('/api/auth/telegram-webapp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            storeLocalAuth(data.user);
            window.dispatchEvent(new Event('autocash_auth_changed'));
          }
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
