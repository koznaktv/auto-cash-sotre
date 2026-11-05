'use client';

import { useEffect } from 'react';
import { autoLoginTelegramMiniApp } from '@/lib/telegramMiniApp';

interface AppsTelegramAutoSyncProps {
  appId?: string;
  onSessionUpdated?: (session: any) => void;
}

export default function AppsTelegramAutoSync({
  appId = 'maxbazar',
  onSessionUpdated,
}: AppsTelegramAutoSyncProps) {
  useEffect(() => {
    let isMounted = true;

    // 1. Immediate attempt on mount
    autoLoginTelegramMiniApp(appId, (session) => {
      if (isMounted && onSessionUpdated) {
        onSessionUpdated(session);
      }
    });

    // 2. Poll for 3 seconds in case telegram-web-app.js initializes asynchronously
    let pollAttempts = 0;
    const timer = setInterval(async () => {
      pollAttempts++;
      const loggedIn = await autoLoginTelegramMiniApp(appId, (session) => {
        if (isMounted && onSessionUpdated) {
          onSessionUpdated(session);
        }
      });
      if (loggedIn || pollAttempts > 15) {
        clearInterval(timer);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [appId, onSessionUpdated]);

  return null;
}
