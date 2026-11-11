'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getCachedBalance, getCachedMaxstoreBalance } from '@/lib/clientAuth';

export type StoreType = 'autocash' | 'maxstore';

export interface StoreMeta {
  id: StoreType;
  name: string;
  badge: string;
  tagline: string;
  logo: string;
  icon: string;
  themeColor: string;
  accentBg: string;
  borderGlow: string;
}

export const STORE_METAS: Record<StoreType, StoreMeta> = {
  autocash: {
    id: 'autocash',
    name: 'AUTO CASH',
    badge: 'ئاساسىي دۇكان',
    tagline: 'ئاساسىي رەقەملىك كارتىلار ۋە سۈرىيە ۋايفاي مۇلازىمەت مەركىزى',
    logo: '/images/autocash_official_logo.png',
    icon: '/images/autocash-icon.svg',
    themeColor: '#10B981',
    accentBg: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
    borderGlow: 'border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10',
  },
  maxstore: {
    id: 'maxstore',
    name: 'MAX-BAZAR',
    badge: 'يېڭى تەمىنلىگۈچى',
    tagline: 'يېڭى تەمىنلىگۈچى رەقەملىك بازىرى ۋە ئالاھىدە VIP باھالار',
    logo: '/images/maxbazar_hd_logo.png',
    icon: '/images/maxstore_app_icon.png',
    themeColor: '#3B82F6',
    accentBg: 'from-blue-600/20 via-orange-500/10 to-transparent',
    borderGlow: 'border-blue-500/30 hover:border-orange-500/60 shadow-blue-500/10',
  },
};

interface StoreContextValue {
  activeStore: StoreType;
  isMaxStore: boolean;
  isGatewayOpen: boolean;
  openGateway: () => void;
  closeGateway: () => void;
  switchStore: (store: StoreType) => void;
  toggleStore: () => void;
  autocashBalance: number;
  maxstoreBalance: number;
  currentStoreBalance: number;
  refreshBalances: () => void;
  storeMeta: StoreMeta;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const STORE_STORAGE_KEY = 'autocash_active_store';
const STORE_SELECTED_FLAG = 'autocash_store_selected';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [activeStore, setActiveStore] = useState<StoreType>('autocash');
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [autocashBalance, setAutocashBalance] = useState<number>(0);
  const [maxstoreBalance, setMaxstoreBalance] = useState<number>(0);

  const refreshBalances = useCallback(() => {
    if (typeof window !== 'undefined') {
      const unifiedBal = getCachedBalance('autocash');
      setAutocashBalance(unifiedBal);
      setMaxstoreBalance(unifiedBal); // 100% Unified
    }
  }, []);

  // Initialize store and balances
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const isHome = window.location.pathname === '/';
      if (isHome) {
        // The root homepage '/' is ALWAYS strictly AUTO CASH!
        setActiveStore('autocash');
        localStorage.setItem(STORE_STORAGE_KEY, 'autocash');
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const urlStore = urlParams.get('store');
        if (urlStore === 'maxstore' || urlStore === 'autocash') {
          setActiveStore(urlStore);
          localStorage.setItem(STORE_STORAGE_KEY, urlStore);
          localStorage.setItem(STORE_SELECTED_FLAG, 'true');
        } else {
          const savedStore = localStorage.getItem(STORE_STORAGE_KEY);
          if (savedStore === 'maxstore' || savedStore === 'autocash') {
            setActiveStore(savedStore);
          }
        }
      }
    } catch {}

    refreshBalances();

    // Listen for balance/auth updates
    const handleAuthChanged = () => {
      refreshBalances();
    };

    window.addEventListener('autocash-auth-changed', handleAuthChanged);
    window.addEventListener('autocash_auth_changed', handleAuthChanged);
    window.addEventListener('autocash-store-changed', handleAuthChanged);

    return () => {
      window.removeEventListener('autocash-auth-changed', handleAuthChanged);
      window.removeEventListener('autocash_auth_changed', handleAuthChanged);
      window.removeEventListener('autocash-store-changed', handleAuthChanged);
    };
  }, [refreshBalances]);

  const switchStore = useCallback((store: StoreType) => {
    setActiveStore(store);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORE_STORAGE_KEY, store);
        localStorage.setItem(STORE_SELECTED_FLAG, 'true');
        window.dispatchEvent(new CustomEvent('autocash-store-changed', { detail: { store } }));
      }
    } catch {}
    setIsGatewayOpen(false);
  }, []);

  const toggleStore = useCallback(() => {
    const next = activeStore === 'autocash' ? 'maxstore' : 'autocash';
    switchStore(next);
  }, [activeStore, switchStore]);

  const openGateway = useCallback(() => {
    setIsGatewayOpen(true);
  }, []);

  const closeGateway = useCallback(() => {
    setIsGatewayOpen(false);
  }, []);

  const isMaxStore = activeStore === 'maxstore';
  const currentStoreBalance = autocashBalance; // 100% Unified: both stores always share the same balance!
  const storeMeta = STORE_METAS[activeStore];

  const value = useMemo<StoreContextValue>(() => ({
    activeStore,
    isMaxStore,
    isGatewayOpen,
    openGateway,
    closeGateway,
    switchStore,
    toggleStore,
    autocashBalance,
    maxstoreBalance,
    currentStoreBalance,
    refreshBalances,
    storeMeta,
  }), [
    activeStore,
    isMaxStore,
    isGatewayOpen,
    openGateway,
    closeGateway,
    switchStore,
    toggleStore,
    autocashBalance,
    maxstoreBalance,
    currentStoreBalance,
    refreshBalances,
    storeMeta,
  ]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
