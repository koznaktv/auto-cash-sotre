'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceItem, ServicePackage } from '@/lib/data';
import DynamicIcon from './DynamicIcon';
import AnimatedOrderButton from './AnimatedOrderButton';
import { useLanguage } from '@/context/LanguageContext';
import { X, AlertCircle, Loader2, Search, Info, ExternalLink } from 'lucide-react';

import { validateGameAccount } from '@/lib/validation/gameAccountValidator';
import { minQty, validateOrderFields, validateQty } from '@/lib/catalog/fieldValidation';
import { estimateTotal } from '@/lib/catalog/pricing';
import { formatSmartPrice } from '@/lib/formatMoney';
import { getProductBio } from '@/lib/catalog/productBios';
import WifiVoucherCard from './WifiVoucherCard';

interface CheckoutModalProps {
  service: ServiceItem | null;
  user?: { id?: string; email?: string; name?: string; balance?: number } | null;
  onClose: () => void;
  onSuccess: (order: any, newBalance?: number) => void;
  onOpenAuth?: () => void;
}

const PACKAGE_SEARCH_THRESHOLD = 10;

function newIdempotencyKey(): string {
  return `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function CheckoutModal({ service, user, onClose, onSuccess, onOpenAuth }: CheckoutModalProps) {
  const router = useRouter();
  const { lang, t, isRTL, translatePackageTitle, translateInputLabel, translateInputPlaceholder } = useLanguage();

  const isProvider = Boolean(service && (service.source === 'provider' || service.id.startsWith('s4g-')));
  const isWifiService = Boolean(
    service &&
      (service.category === 'wifi' ||
        service.id === 'fursan_net' ||
        service.id === 'azez_net' ||
        service.id === 'almujahid_net' ||
        (service.name || '').toLowerCase().includes('wifi') ||
        (service.name || '').toLowerCase().includes('واي فاي'))
  );

  const [detail, setDetail] = useState<ServiceItem | null>(service || null);
  const [detailError, setDetailError] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [packageQuery, setPackageQuery] = useState('');
  const [accountInput, setAccountInput] = useState('');
  const [zoneInput, setZoneInput] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [qtyInput, setQtyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [confirmTotal, setConfirmTotal] = useState<number | null>(null);
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [purchasedWifiCard, setPurchasedWifiCard] = useState<any | null>(null);
  const [wifiStockMap, setWifiStockMap] = useState<Record<string, number> | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const isSubmittingRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Swipe horizontally to dismiss modal back to category
    if (Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      onClose();
    }
  };

  // Manage scroll and keyboard for modal
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Provider services: if package details or field rules need full load
  useEffect(() => {
    if (!service) return;

    // If service already has packages loaded, immediately populate detail
    if (service.packages && service.packages.length > 0) {
      setDetail(service);
      setDetailError('');
    }

    if (isProvider) {
      let cancelled = false;
      fetch(`/api/catalog/${encodeURIComponent(service.id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d.success && d.service) {
            setDetail(d.service);
            setDetailError('');
          } else {
            // Only show error if we don't have any packages at all
            if (!service.packages || service.packages.length === 0) {
              setDetailError(d.message || t('productLoadFailed'));
            }
          }
        })
        .catch(() => {
          if (!cancelled && (!service.packages || service.packages.length === 0)) {
            setDetailError(t('productLoadFailed'));
          }
        });
      return () => {
        cancelled = true;
      };
    }
  }, [service, isProvider]);

  // Fetch real-time Wi-Fi inventory stock
  useEffect(() => {
    if (!isWifiService || !service) return;
    let active = true;
    setLoadingStock(true);
    fetch(`/api/catalog/wifi-stock?_t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.success || !data?.stock) return;
        const map: Record<string, number> = {};
        for (const [key, val] of Object.entries<any>(data.stock)) {
          const [servId, pkgId] = key.split(':');
          if (servId === service.id && pkgId) {
            map[pkgId] = Number(val?.available || 0);
          }
        }
        setWifiStockMap(map);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingStock(false);
      });
    return () => {
      active = false;
    };
  }, [isWifiService, service?.id]);

  const subCategories = detail?.subCategories || service?.subCategories || [];
  const [activeSubCatId, setActiveSubCatId] = useState<string>(() => {
    const subs = service?.subCategories || [];
    return subs[0]?.id || '';
  });

  useEffect(() => {
    const subs = detail?.subCategories || service?.subCategories || [];
    if (subs.length > 0 && !subs.some(sc => sc.id === activeSubCatId)) {
      setActiveSubCatId(subs[0].id);
    }
  }, [detail, service, activeSubCatId]);

  const activeSubCat = useMemo(() => {
    const subs = detail?.subCategories || service?.subCategories || [];
    if (!subs.length) return null;
    return subs.find(s => s.id === activeSubCatId) || subs[0];
  }, [detail, service, activeSubCatId]);

  const allPackages: ServicePackage[] = detail?.packages || service?.packages || [];

  const packages: ServicePackage[] = useMemo(() => {
    if (!activeSubCat) return allPackages;
    const filtered = allPackages.filter(p => p.subCategoryId === activeSubCat.id);
    return filtered.length > 0 ? filtered : allPackages;
  }, [allPackages, activeSubCat]);

  const isPkgOutOfStock = (pkg: ServicePackage): boolean => {
    if (pkg.available === false) return true;
    if (isWifiService && wifiStockMap !== null) {
      return (wifiStockMap[pkg.id] ?? 0) <= 0;
    }
    return false;
  };

  const getPkgStockCount = (pkgId: string): number | null => {
    if (!isWifiService || wifiStockMap === null) return null;
    return wifiStockMap[pkgId] ?? 0;
  };

  const allWifiOutOfStock = useMemo(() => {
    if (!isWifiService || wifiStockMap === null || !packages.length) return false;
    return packages.every((p) => (wifiStockMap[p.id] ?? 0) <= 0);
  }, [isWifiService, wifiStockMap, packages]);

  useEffect(() => {
    if (!packages.length) return;
    const current = packages.find((p) => p.id === selectedPkgId);
    const isCurrentOut = current ? isPkgOutOfStock(current) : true;
    if (!current || isCurrentOut) {
      const firstInStock = packages.find((p) => !isPkgOutOfStock(p));
      if (firstInStock) {
        setSelectedPkgId(firstInStock.id);
      } else if (!current) {
        setSelectedPkgId(packages[0].id);
      }
    }
  }, [packages, selectedPkgId, wifiStockMap]);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId);

  // Reset per-package inputs when the package changes
  useEffect(() => {
    setFieldValues({});
    setQtyInput(selectedPkg?.qty && selectedPkg.qty.kind !== 'fixed' ? String(minQty(selectedPkg.qty)) : '');
    setConfirmTotal(null);
    setErrorMsg('');
  }, [selectedPkgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const visiblePackages = useMemo(() => {
    const q = packageQuery.trim().toLowerCase();
    return q ? packages.filter((p) => p.title.toLowerCase().includes(q)) : packages;
  }, [packages, packageQuery]);

  const qty = selectedPkg?.qty && selectedPkg.qty.kind !== 'fixed' ? Number(qtyInput) || 0 : 1;
  const estimatedTotal = useMemo(() => {
    if (!selectedPkg) return 0;
    if (selectedPkg.productType !== 'amount' || !selectedPkg.unitPrice) return selectedPkg.price;
    if (qty === minQty(selectedPkg.qty)) return selectedPkg.price;
    return estimateTotal(selectedPkg.unitPrice, qty);
  }, [selectedPkg, qty]);

  const isMlbb = useMemo(() => {
    if (!service) return false;
    const s = `${service.id} ${service.name} ${detail?.name || ''}`.toLowerCase();
    return /mobile\s*legend|mlbb|legend\s*mobile|موبايل\s*ليجند/i.test(s);
  }, [service, detail]);

  const requiresZoneId = Boolean(
    activeSubCat?.requiresZoneId !== undefined
      ? activeSubCat.requiresZoneId
      : (
          service?.requiresZoneId ||
          detail?.requiresZoneId ||
          isMlbb ||
          Boolean(service?.zoneIdLabel) ||
          Boolean(detail?.zoneIdLabel) ||
          (selectedPkg?.fields || []).some((f) => /zone\s*id|zoneid|zone_id|server/i.test(f.key) || /zone\s*id|رايون/i.test(f.label))
        )
  );

  const effectiveInputLabel = activeSubCat?.inputLabel || service?.inputLabel || detail?.inputLabel || 'ئويۇنچى كىملىكى (UID)';
  const effectiveInputPlaceholder = activeSubCat?.inputPlaceholder || service?.inputPlaceholder || detail?.inputPlaceholder || 'مەسىلەن: 12345678';
  const effectiveZoneIdLabel = activeSubCat?.zoneIdLabel || service?.zoneIdLabel || detail?.zoneIdLabel || 'رايون كودى (Zone ID)';
  const effectiveZoneIdPlaceholder = activeSubCat?.zoneIdPlaceholder || service?.zoneIdPlaceholder || detail?.zoneIdPlaceholder || 'مەسىلەن: 1234';

  const productBio = useMemo(() => {
    if (!service) return null;
    return getProductBio(service, selectedPkg, lang);
  }, [service, selectedPkg, lang]);

  if (!service) return null;

  const submitOrder = async (expectedTotal: number, customTarget?: string) => {
    isSubmittingRef.current = true;
    setLoading(true);
    setButtonState('loading');
    setErrorMsg('');
    setInfoMsg('');
    try {
      const targetStr = (customTarget ?? accountInput).trim();
      const body = isProvider
        ? {
            serviceId: service.id,
            packageId: selectedPkgId,
            fields: {
              ...fieldValues,
              ...(accountInput.trim() ? { playerId: accountInput.trim() } : {}),
              ...(zoneInput.trim() ? { zoneId: zoneInput.trim() } : {}),
            },
            targetAccount: targetStr,
            qty,
            expectedTotal,
          }
        : { serviceId: service.id, packageId: selectedPkgId, targetAccount: targetStr };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-idempotency-key': newIdempotencyKey() },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 409 && data.outOfStock) {
        setErrorMsg(
          data.message ||
            (lang === 'ug'
              ? '⚠️ كارتا تۈگەپ كەتتى، يېقىندا قوشۇلىدۇ'
              : lang === 'ar'
              ? '⚠️ نفدت البطاقات، سيتم التوفير قريباً'
              : '⚠️ Out of stock, coming soon')
        );
        setButtonState('idle');
        return;
      }
      if (res.status === 409 && data.priceChanged && typeof data.newTotal === 'number') {
        setConfirmTotal(data.newTotal);
        setErrorMsg(data.message || t('priceChanged'));
        setButtonState('idle');
        return;
      }
      if (!data.success) throw new Error(data.message || t('orderFailed'));

      if (data.wifiCard) {
        setPurchasedWifiCard(data.wifiCard);
        onSuccess(data.order, data.newBalance);
        return;
      }

      if (res.status === 202) {
        // Accepted but the provider's answer was unclear: the order is being verified
        setButtonState('success');
        setInfoMsg(data.message || t('orderUnderReview'));
        setTimeout(() => {
          onSuccess(data.order, data.newBalance);
          onClose();
          router.push('/orders');
        }, 1200);
        return;
      }

      // Order Success! Play celebratory checkmark animation, then jump to My Orders
      setButtonState('success');
      setTimeout(() => {
        onSuccess(data.order, data.newBalance);
        onClose();
        router.push('/orders');
      }, 1200);
    } catch (err: any) {
      setButtonState('idle');
      setErrorMsg(err.message || t('errorOccurred'));
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Synchronous and state-based guard against double clicks
    if (loading || isSubmittingRef.current || !selectedPkg) return;

    if (!user || !user.email) {
      setErrorMsg(t('loginToPurchasePrompt'));
      if (onOpenAuth) {
        onClose();
        onOpenAuth();
      }
      return;
    }

    // For Wi-Fi Local Voucher Cards
    if (isWifiService) {
      if (selectedPkg && isPkgOutOfStock(selectedPkg)) {
        setErrorMsg(
          lang === 'ug'
            ? '⚠️ كارتا تۈگەپ كەتتى، يېقىندا قوشۇلىدۇ'
            : lang === 'ar'
            ? '⚠️ نفدت البطاقات، سيتم التوفير قريباً'
            : '⚠️ Out of stock, coming soon'
        );
        return;
      }
      await submitOrder(selectedPkg.price, 'Wi-Fi كارتىسى');
      return;
    }

    // For services requiring Zone ID
    if (requiresZoneId) {
      if (!accountInput.trim()) {
        setErrorMsg(t('uidRequired'));
        return;
      }
      if (!zoneInput.trim()) {
        setErrorMsg(t('zoneIdRequired'));
        return;
      }
    }

    if (isProvider) {
      if (selectedPkg.available === false) {
        setErrorMsg(t('itemUnavailable'));
        return;
      }
      const updatedFields = {
        ...fieldValues,
        ...(accountInput.trim() ? { playerId: accountInput.trim() } : {}),
        ...(zoneInput.trim() ? { zoneId: zoneInput.trim() } : {}),
      };
      const fieldCheck = validateOrderFields(updatedFields, selectedPkg.fields || []);
      if (!fieldCheck.ok) {
        setErrorMsg(fieldCheck.message || t('invalidIdFormat'));
        return;
      }
      const qtyCheck = validateQty(qty, selectedPkg.qty);
      if (!qtyCheck.ok) {
        setErrorMsg(qtyCheck.message || t('quantity'));
        return;
      }
      const combined = requiresZoneId && zoneInput.trim()
        ? `${accountInput.trim()} (${zoneInput.trim()})`
        : accountInput.trim();
      await submitOrder(confirmTotal ?? estimatedTotal, combined);
      return;
    }

    const combinedAccount = requiresZoneId && zoneInput.trim()
      ? `${accountInput.trim()} (${zoneInput.trim()})`
      : accountInput.trim();

    if (service.inputLabel && !combinedAccount) {
      setErrorMsg(`${translateInputLabel(service.inputLabel) || 'ID'} ${t('accountInputFallbackPlaceholder')}`);
      return;
    }
    if (service.category === 'games' || service.inputLabel || requiresZoneId) {
      const val = validateGameAccount(service.id, combinedAccount);
      if (!val.isValid) {
        setErrorMsg(val.message || t('invalidIdFormat'));
        return;
      }
    }
    await submitOrder(selectedPkg.price, combinedAccount);
  };

  const displayTotal = confirmTotal ?? estimatedTotal;
  const inputClass = `w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition ${
    isRTL ? 'text-right' : 'text-left'
  }`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 ${
          isRTL ? 'text-right' : 'text-left'
        } font-alkatip`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          id="autocash-checkout-modal-close"
          onClick={onClose}
          data-modal-close="true"
          title={t('close')}
          className={`absolute top-5 ${
            isRTL ? 'left-5' : 'right-5'
          } text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-inner shrink-0 overflow-hidden">
            {service.image ? (
              <img
                src={
                  service.id === 'fursan_net'
                    ? 'https://i.ibb.co/f3X6BjQ/photo-2026-10-26-07-50-55.jpg'
                    : service.id === 'azez_net'
                    ? 'https://i.ibb.co/cSFZhGLB/photo-2026-10-26-07-50-39.jpg'
                    : service.id === 'almujahid_net'
                    ? 'https://i.ibb.co/9HqpZdVg/photo-2026-10-26-08-32-29.jpg'
                    : service.image
                }
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (service.id === 'fursan_net' && target.src !== '/images/services/fursan_net.jpg') {
                    target.src = '/images/services/fursan_net.jpg';
                    return;
                  }
                  if (service.id === 'azez_net' && target.src !== '/images/services/azez_net.jpg') {
                    target.src = '/images/services/azez_net.jpg';
                    return;
                  }
                  if (service.id === 'almujahid_net' && target.src !== '/images/services/mujahid_net.jpg') {
                    target.src = '/images/services/mujahid_net.jpg';
                    return;
                  }
                  target.src = '/brand_logo.png?v=2.1.0';
                }}
              />
            ) : (
              <DynamicIcon name={service.icon} className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white">{translatePackageTitle(service.name)}</h3>
              {service.badge && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-md font-alkatip">
                  <span className="animate-moving-icon">
                    {service.badge.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖)/)?.[0] || '⚡'}
                  </span>
                  <span>{service.badge.replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2B50|\u26A1|\uD83D[\uDE00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|⚡|🔥|👑|⭐|💎|🚀|🎉|✨|🔒|🏆|💫|🎮|🤖)\s*/, '')}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {service.description && service.description !== service.name
                ? translatePackageTitle(service.description)
                : isProvider
                ? t('instantDigitalDelivery')
                : service.description}
            </p>
          </div>
        </div>

        {/* Unauthenticated / Guest Warning Banner */}
        {(!user || !user.email) && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{t('loginToPurchasePrompt')}</span>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] transition cursor-pointer shadow-sm"
              >
                {t('loginRequiredBtn')}
              </button>
            )}
          </div>
        )}

        {!detail && !detailError && (
          <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('loading')}</span>
          </div>
        )}
        {detailError && (
          <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-900/60 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{detailError}</span>
          </div>
        )}

        {detail && (
          purchasedWifiCard ? (
          <div className="space-y-4 pt-2">
            <div className="text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                🎉 سېتىۋېلىش مۇۋەپپەقىيەتلىك بولدى!
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {service.name} كارتىڭىز ھازىر ئىشلىتىشكە تەييار
              </h3>
            </div>

            <WifiVoucherCard card={purchasedWifiCard} />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/orders');
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl text-xs sm:text-sm transition"
              >
                📦 بارلىق زاكازلىرىمنى كۆرۈش ➔
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm transition"
              >
                تامام
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Sub-category / Server Tabs Selector */}
            {subCategories && subCategories.length > 1 && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 font-alkatip">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>{isRTL ? 'مۇلازىمەت تۈرى ياكى سېرۋېرنى تاللاڭ:' : 'Select Server / Option:'}</span>
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                    {activeSubCat?.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {subCategories.map((sc) => {
                    const isSelected = sc.id === activeSubCatId;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          setActiveSubCatId(sc.id);
                        }}
                        className={`py-2 px-2 rounded-lg text-xs font-bold font-alkatip transition-all text-center border cursor-pointer leading-tight ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/25 scale-[1.02]'
                            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Package Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">{t('selectPackageLabel')}</label>

              {allWifiOutOfStock && (
                <div className="mb-3 p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl flex items-center gap-3 text-rose-200 text-xs shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/40 border border-rose-500/50 text-rose-200 flex items-center justify-center font-bold text-base shrink-0">
                    ⚠️
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-rose-300 text-xs font-alkatip">
                      {lang === 'ug'
                        ? 'كارتا تۈگەپ كەتتى، يېقىندا قوشۇلىدۇ'
                        : lang === 'ar'
                        ? 'نفدت البطاقات، سيتم التوفير قريباً'
                        : 'Cards out of stock, coming soon'}
                    </div>
                    <div className="text-[11px] text-rose-200/90 font-alkatip leading-relaxed">
                      {lang === 'ug'
                        ? 'بۇ تورنىڭ بارلىق كارتىلىرى ھازىر تۈگەپ كەتتى، باشقۇرغۇچى تەرىپىدىن يېقىندا يېڭى كارتىلار تولۇقلىنىدۇ.'
                        : lang === 'ar'
                        ? 'تم نفاد جميع كروت هذه الشبكة حالياً. سيتم تزويد كروت جديدة قريباً.'
                        : 'All cards for this network are currently sold out and will be replenished soon.'}
                    </div>
                  </div>
                </div>
              )}

              {packages.length > PACKAGE_SEARCH_THRESHOLD && (
                <div className="relative mb-2">
                  <Search className={`w-3.5 h-3.5 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    value={packageQuery}
                    onChange={(e) => setPackageQuery(e.target.value)}
                    placeholder={t('search')}
                    className={`${inputClass} py-2 text-xs ${isRTL ? 'pr-9' : 'pl-9'}`}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {visiblePackages.map((pkg) => {
                  const isSelected = pkg.id === selectedPkgId;
                  const outOfStock = isPkgOutOfStock(pkg);
                  const stockCount = getPkgStockCount(pkg.id);
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => !outOfStock && setSelectedPkgId(pkg.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm transition ${
                        isRTL ? 'text-right' : 'text-left'
                      } ${
                        outOfStock
                          ? 'opacity-60 cursor-not-allowed bg-rose-950/20 border-rose-900/40 text-slate-400'
                          : isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            outOfStock
                              ? 'border-rose-800 bg-rose-950/50'
                              : isSelected
                              ? 'border-cyan-400 bg-cyan-400'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && !outOfStock && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                        </div>
                        <span className={`font-medium ${outOfStock ? 'line-through text-slate-400' : ''}`}>
                          {translatePackageTitle(pkg.title)}
                        </span>
                        {outOfStock ? (
                          <span className="text-[10px] sm:text-[11px] bg-rose-950/90 border border-rose-500/50 text-rose-300 px-2 py-0.5 rounded font-bold font-alkatip">
                            {lang === 'ug'
                              ? '⚠️ كارتا تۈگەپ كەتتى، يېقىندا قوشۇلىدۇ'
                              : lang === 'ar'
                              ? '⚠️ نفدت، قريباً'
                              : '⚠️ Out of stock, coming soon'}
                          </span>
                        ) : stockCount !== null && stockCount > 0 ? (
                          <span className="text-[10px] sm:text-[11px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-medium">
                            قالدۇق: {stockCount}
                          </span>
                        ) : (
                          pkg.duration && (
                            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{t('instant')}</span>
                          )
                        )}
                      </div>
                      <div className="font-bold font-mono shrink-0 flex items-center gap-1.5" dir="ltr">
                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                          <span className="text-[11px] text-slate-500 line-through font-normal">
                            ${formatSmartPrice(pkg.originalPrice)}
                          </span>
                        )}
                        <span className="text-cyan-400">
                          {pkg.productType === 'amount' ? `${t('fromPrice')} ` : ''}${formatSmartPrice(pkg.price)}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {visiblePackages.length === 0 && <p className="text-xs text-slate-500 py-3 text-center">{t('itemNotFound')}</p>}
              </div>
            </div>

            {/* Quantity (per-unit "amount" products) */}
            {isProvider && selectedPkg?.qty && selectedPkg.qty.kind !== 'fixed' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('quantity')}</label>
                {selectedPkg.qty.kind === 'list' ? (
                  <select value={qtyInput} onChange={(e) => setQtyInput(e.target.value)} className={inputClass}>
                    {selectedPkg.qty.values.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    inputMode="numeric"
                    min={selectedPkg.qty.min}
                    max={selectedPkg.qty.max}
                    step={selectedPkg.qty.step}
                    value={qtyInput}
                    onChange={(e) => {
                      setQtyInput(e.target.value);
                      setConfirmTotal(null);
                    }}
                    className={inputClass}
                    dir="ltr"
                  />
                )}
                {selectedPkg.unitPrice !== undefined && (
                  <p className="mt-1 text-[11px] text-slate-500" dir="ltr">
                    {`$${formatSmartPrice(selectedPkg.unitPrice)} / 1`}
                    {selectedPkg.unitPrice < 0.01 && (
                      <span className="text-slate-400 ms-1.5">(${formatSmartPrice(selectedPkg.unitPrice * 1000)} / 1000)</span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Provider checkout fields */}
            {isProvider &&
              (selectedPkg?.fields || []).map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {translateInputLabel(field.label) || field.label}
                    {field.required && <span className="text-rose-400"> *</span>}
                  </label>
                  {field.type === 'select' && field.options ? (
                    <select
                      value={fieldValues[field.key] || ''}
                      onChange={(e) => setFieldValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="">—</option>
                      {field.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                      inputMode={field.type === 'number' ? 'numeric' : undefined}
                      value={fieldValues[field.key] || ''}
                      onChange={(e) => setFieldValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      placeholder={
                        translateInputPlaceholder(field.placeholder) ||
                        (lang === 'ar'
                          ? `أدخل ${translateInputLabel(field.label) || field.label}...`
                          : lang === 'en'
                          ? `Enter ${translateInputLabel(field.label) || field.label}...`
                          : `«${translateInputLabel(field.label) || field.label}» كىرگۈزۈڭ...`)
                      }
                      maxLength={field.maxLength || 100}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}

            {/* Legacy or custom service account input with UID + Zone ID support */}
            {(!isProvider || (selectedPkg?.fields || []).length === 0) && (service.inputLabel || requiresZoneId || service.category === 'games') && (
              <div className="space-y-3">
                {requiresZoneId ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>{translateInputLabel(effectiveInputLabel)}</span>
                          <span className="text-rose-400 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Smart auto-split: if user pastes "12345678 (1234)" or "12345678-1234"
                            const match = val.match(/^(\d{6,12})[\s\(\-_/\|]+(\d{3,6})\)?$/);
                            if (match) {
                              setAccountInput(match[1]);
                              setZoneInput(match[2]);
                            } else {
                              setAccountInput(val);
                            }
                          }}
                          placeholder={translateInputPlaceholder(effectiveInputPlaceholder)}
                          className={inputClass}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>{translateInputLabel(effectiveZoneIdLabel)}</span>
                          <span className="text-rose-400 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={zoneInput}
                          onChange={(e) => setZoneInput(e.target.value)}
                          placeholder={translateInputPlaceholder(effectiveZoneIdPlaceholder)}
                          className={inputClass}
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-amber-300/90 flex items-center gap-1 font-alkatip">
                      <span>{t('mlbbNotice')}</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    {isWifiService ? (
                      <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                        selectedPkg && isPkgOutOfStock(selectedPkg)
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                          : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                          selectedPkg && isPkgOutOfStock(selectedPkg) ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {selectedPkg && isPkgOutOfStock(selectedPkg) ? '⚠️' : '📶'}
                        </div>
                        <div className="text-xs space-y-0.5">
                          <div className="font-bold text-white font-alkatip">
                            {selectedPkg && isPkgOutOfStock(selectedPkg)
                              ? (lang === 'ug' ? 'بۇ كارتىنىڭ ئامبار قالدۇقى قالمىدى' : 'هذه البطاقة غير متوفرة بالمخزون حالياً')
                              : 'Wi-Fi رەقەملىك ئامبار كارتىسى'}
                          </div>
                          <div className="font-alkatip leading-relaxed text-[11px]">
                            {selectedPkg && isPkgOutOfStock(selectedPkg)
                              ? (lang === 'ug'
                                  ? 'بۇ كارتىنىڭ قالدۇقى تۈگەپ كەتتى، يېقىندا قوشۇلىدۇ. باشقا تۈردىكى كارتىلارنى تاللاڭ ياكى تەخىر قىلىڭ.'
                                  : 'نفدت هذه الفئة من الكروت حالياً، سيتم توفيرها قريباً.')
                              : 'نومۇر كىرگۈزۈش ھاجەتسىز. كارتىنى تاللاپ «سېتىۋېلىش» نى باسسىڭىزلا سىستېما نومۇر ۋە پارولنى دەرھال چىقىرىپ بېرىدۇ.'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>{translateInputLabel(effectiveInputLabel || 'ھېسابات / ئويۇنچى ID')}</span>
                          {service.category !== 'cards' && <span className="text-rose-400 font-bold">*</span>}
                        </label>
                    <input
                      type="text"
                      value={accountInput}
                      onChange={(e) => setAccountInput(e.target.value)}
                      placeholder={translateInputPlaceholder(effectiveInputPlaceholder || 'ئۇچۇرىڭىزنى كىرگۈزۈڭ')}
                      className={inputClass}
                      dir="ltr"
                    />
                    {service.id.toLowerCase().includes('pubg') && (
                      <p className="mt-1.5 text-[11px] text-amber-300/80">
                        {t('pubgUidNotice')}
                      </p>
                    )}
                    {service.id.toLowerCase().includes('free-fire') && (
                      <p className="mt-1.5 text-[11px] text-amber-300/80">
                        {t('freefireUidNotice')}
                      </p>
                    )}

                    {(service.id.toLowerCase().includes('instagram') ||
                      (service.name && /instagram|ئىنستاگرام/i.test(service.name))) && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-xs space-y-1.5 shadow-md font-alkatip">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>⚠️ مۇھىم ئەسكەرتىش (ۋاقىت ۋە كاپالەت تۈزۈمى):</span>
                        </div>
                        <div className="text-[11px] text-amber-200/90 space-y-1 leading-relaxed">
                          <p>• <b>ئورۇنلىنىش ۋاقتى:</b> بۇ خىل ئىنستاگرام كۆپەيتىش (رشق) زاكازلىرى سىستېمىدا بىرقەدەر ئۇزۇنراق ۋاقىتتا (1 سائەتتىن 24 سائەتكىچە) تەدرىجىي ئورۇنلىنىدۇ، سەۋرچانلىق بىلەن كۈتۈڭ.</p>
                          <p>• <b>كاپالەت تۈزۈمى:</b> تەمىنلىگۈچىنىڭ بەلگىلىمىسى بويىچە، بۇ خىل ئەرزان تىپتىكى كۆپەيتىش مۇلازىمەتلىرىگە سان چۈشۈپ كەتسە قايتا تولۇقلاپ بېرىش كاپالىتى (لا يوجد كفالة) بېرىلمەيدۇ.</p>
                        </div>
                      </div>
                    )}
                    {(service.id.toLowerCase().includes('syriatel') || service.id.toLowerCase().includes('mtn') || (service as any).inputHint) && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs space-y-1 shadow-inner">
                        <p className="text-rose-400 font-bold text-xs" dir="ltr">
                          {service.id.toLowerCase().includes('syriatel')
                            ? 'ارقام السيرياتيل تبدأ بـ 099 / 098 / 093'
                            : service.id.toLowerCase().includes('mtn')
                            ? 'ارقام MTN تبدأ بـ 094 / 095 / 096'
                            : ''}
                        </p>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          • {isRTL
                            ? 'تېلېفون نومۇرىنى خەلقئارا كودسىز (09xxxxxxxx) شەكىلدە كىرگۈزۈڭ.'
                            : 'يرجى إدخال رقم الهاتف بدون نداء مثال: 09xxxxxxxx'}
                        </p>
                        <p className="text-emerald-400 text-[11px] font-medium leading-relaxed">
                          • {isRTL
                            ? 'ئاندىن يۇقىرىدىن ئۆزىڭىزگە ماس كېلىدىغان بولاقنى تاللاڭ.'
                            : 'ومن ثم إختيار الباقة التي تناسب طلبك.'}
                        </p>
                      </div>
                    )}
                    {(service.id === 'othman_visa_cards' || service.name.toLowerCase().includes('tremendous') || service.name.includes('ترمندوس')) && (
                      <div className="mt-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-[#07192d] border-2 border-emerald-500/60 text-xs space-y-2 shadow-xl font-alkatip">
                        <div className="flex items-center justify-between gap-2 border-b border-emerald-500/30 pb-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs sm:text-sm">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>⚠️ {lang === 'ug' ? 'تنبيه: مۇھىم ئەسكەرتىش' : lang === 'ar' ? 'تنبيه هـام:' : 'Important Notice:'}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full font-bold">
                            ⚡ {lang === 'ug' ? 'ئاپتوماتىك تاپشۇرۇلىدۇ' : lang === 'ar' ? 'تسليم تلقائي' : 'Instant Delivery'}
                          </span>
                        </div>

                        <div className="text-[11px] space-y-1.5 leading-relaxed text-slate-200">
                          <p className="text-rose-300 font-medium">
                            • {lang === 'ug'
                              ? 'ئەگەر سىز كارتىنى ئىشلىتىش ئۇسۇلىنى بىلمىسىڭىز، سېتىۋالماسلىقىڭىزنى ئۈمىد قىلىمىز (اذا كنت لا تعلم طريقة استخدام البطاقة الرجاء عدم شرائها).'
                              : lang === 'ar'
                              ? 'إذا كنت لا تعلم طريقة استخدام البطاقة الرجاء عدم شرائها.'
                              : 'If you do not know how to use this card, please do not purchase it.'}
                          </p>
                          <p className="text-emerald-300 font-medium">
                            • {lang === 'ug'
                              ? 'كارتا %100 پۈتۈن، ئىناۋەتلىك ۋە كاپالەتلىك بولۇپ، Google مۇلازىمەتلىرى، Google Play ۋە ئىچكى ئەزالىقلار ئۈچۈن تولۇق ماس كېلىدۇ.'
                              : lang === 'ar'
                              ? 'البطاقة تعمل لخدمات جوجل والاشتراكات الداخلية..... البطاقة سليمة 100%'
                              : 'The card is 100% valid and works for Google services and in-app subscriptions.'}
                          </p>
                          <div className="pt-1.5 p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-[11px] space-y-1">
                            <span className="text-amber-300 font-bold flex items-center gap-1">
                              <span>🌟</span>
                              <span>{lang === 'ug' ? 'كارتا نورمال ئىشلىشى ئۈچۈن Google Wallet ھېساباتىڭىزغا قوشۇشىڭىز كېرەك:' : lang === 'ar' ? 'يجب اضافة البطاقة هنا لتعمل بشكل سليم ضمن حسابكم 🌟' : 'The card must be added here to work properly:'}</span>
                            </span>
                            <a
                              href="https://wallet.google.com"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline font-mono text-[11px] dir-ltr break-all font-bold pt-0.5"
                            >
                              <span>https://wallet.google.com</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Universal Provider / Othman Store Instructions & Notices */}
                    {service.id !== 'othman_visa_cards' &&
                      !service.name.toLowerCase().includes('tremendous') &&
                      !service.name.includes('ترمندوس') &&
                      Boolean((selectedPkg as any)?.instructions || (service as any)?.instructions) && (
                        <div className="mt-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-[#06182c] via-slate-900 to-[#040f1d] border border-amber-500/40 text-xs space-y-2 shadow-xl font-alkatip">
                          <div className="flex items-center justify-between gap-2 border-b border-amber-500/25 pb-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs sm:text-sm">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                {lang === 'ug'
                                  ? '📋 مەھسۇلات ئەسكەرتىشى ۋە تەلىپى:'
                                  : lang === 'ar'
                                  ? '📋 تعليمات وتنبيهات الخدمة:'
                                  : '📋 Service Instructions & Notices:'}
                              </span>
                            </div>
                            {Boolean(
                              (((selectedPkg as any)?.instructions || (service as any)?.instructions || '').includes('تلقائي') ||
                                ((selectedPkg as any)?.instructions || (service as any)?.instructions || '').includes('فوري'))
                            ) && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full font-bold">
                                ⚡ {lang === 'ug' ? 'ئاپتوماتىك تاپشۇرۇلىدۇ' : lang === 'ar' ? 'تسليم تلقائي' : 'Instant Delivery'}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] sm:text-xs text-slate-200 leading-relaxed whitespace-pre-line space-y-1 text-right" dir="rtl">
                            <p>{String((selectedPkg as any)?.instructions || (service as any)?.instructions || '')}</p>
                          </div>
                        </div>
                    )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-900/60 p-3 rounded-xl leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {infoMsg && (
              <div className="flex items-center gap-2 text-amber-300 text-xs bg-amber-950/30 border border-amber-800/50 p-3 rounded-xl leading-relaxed">
                <Info className="w-4 h-4 shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* 100% Automatic Refund Guarantee Reassurance */}
            <div className="rounded-xl bg-cyan-950/30 border border-cyan-800/40 p-2.5 text-xs text-cyan-200/90 leading-relaxed font-alkatip flex items-start gap-2">
              <span className="text-sm shrink-0">🛡️</span>
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-cyan-300">
                  {lang === 'ug' ? '100% قالدۇق كاپالىتى:' : '100% Balance Protection:'}
                </span>{' '}
                {lang === 'ug'
                  ? 'زاكاس تاپشۇرۇلغاندىن كېيىن سەل تەخىر قىلىڭ (ئادەتتە 1-3 مىنۇت). ئەگەر زاكاز ماقۇللانماي قالسا، كېمەيتىلگەن پۇلىڭىز ھەميان قالدۇقىڭىزغا دەرھال ئاپتوماتىك 100% تولۇق قايتۇرۇلىدۇ.'
                  : 'Please allow 1-3 minutes for automatic verification. If the order cannot be approved, your funds will be immediately and automatically refunded to your wallet in full.'}
              </div>
            </div>

            {/* Price Summary & Submit */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">{t('amount')}</span>
                <span className="text-xl font-extrabold text-cyan-400 font-mono" dir="ltr">
                  ${formatSmartPrice(displayTotal)}
                </span>
              </div>

              {!user || !user.email ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:opacity-95 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm transition cursor-pointer"
                >
                  <span>{t('loginRequiredBtn')}</span>
                </button>
              ) : infoMsg ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition cursor-pointer"
                >
                  {t('done')}
                </button>
              ) : selectedPkg && isPkgOutOfStock(selectedPkg) ? (
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2 bg-rose-950/70 border border-rose-600/70 text-rose-300 font-bold px-4 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm cursor-not-allowed opacity-90 font-alkatip"
                >
                  <span>
                    {lang === 'ug'
                      ? '⚠️ كارتا تۈگەپ كەتتى، يېقىندا قوشۇلىدۇ'
                      : lang === 'ar'
                      ? '⚠️ نفدت البطاقات، سيتم التوفير قريباً'
                      : '⚠️ Out of stock, coming soon'}
                  </span>
                </button>
              ) : (
                <AnimatedOrderButton
                  status={buttonState}
                  disabled={loading || isSubmittingRef.current || !selectedPkg || isPkgOutOfStock(selectedPkg)}
                  label={
                    confirmTotal !== null
                      ? `${t('confirmNewPrice')} ($${formatSmartPrice(confirmTotal)})`
                      : t('confirmAndPay')
                  }
                  isRTL={isRTL}
                />
              )}
            </div>

            {/* Product Bio & Instructions (matches user screenshot) */}
            {productBio && productBio.content && (
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div
                  className={`p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 ${
                    isRTL ? 'border-r-4 border-r-rose-500 text-right' : 'border-l-4 border-l-rose-500 text-left'
                  }`}
                >
                  <h4 className="text-xs sm:text-sm font-bold text-rose-400 mb-1.5 font-alkatip flex items-center gap-1.5" dir={isRTL ? 'rtl' : 'ltr'}>
                    <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{translatePackageTitle(productBio.title)}</span>
                  </h4>
                  <div className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-alkatip whitespace-pre-line">
                    {productBio.content}
                  </div>
                </div>
              </div>
            )}
          </form>
        ))
      }
      </div>
    </div>
  );
}
