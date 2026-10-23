'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceItem, ServicePackage } from '@/lib/data';
import DynamicIcon from './DynamicIcon';
import AnimatedOrderButton from './AnimatedOrderButton';
import { useLanguage } from '@/context/LanguageContext';
import { X, AlertCircle, Loader2, Search, Info } from 'lucide-react';

import { validateGameAccount } from '@/lib/validation/gameAccountValidator';
import { minQty, validateOrderFields, validateQty } from '@/lib/catalog/fieldValidation';
import { estimateTotal } from '@/lib/catalog/pricing';
import { formatSmartPrice } from '@/lib/formatMoney';
import { getProductBio } from '@/lib/catalog/productBios';

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

  const packages: ServicePackage[] = detail?.packages || [];

  useEffect(() => {
    if (!packages.length) return;
    if (!packages.some((p) => p.id === selectedPkgId)) {
      setSelectedPkgId((packages.find((p) => p.available !== false) || packages[0]).id);
    }
  }, [packages, selectedPkgId]);

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
    service?.requiresZoneId ||
    detail?.requiresZoneId ||
    isMlbb ||
    Boolean(service?.zoneIdLabel) ||
    Boolean(detail?.zoneIdLabel) ||
    (selectedPkg?.fields || []).some((f) => /zone\s*id|zoneid|zone_id|server/i.test(f.key) || /zone\s*id|رايون/i.test(f.label))
  );

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

      if (res.status === 409 && data.priceChanged && typeof data.newTotal === 'number') {
        setConfirmTotal(data.newTotal);
        setErrorMsg(data.message || t('priceChanged'));
        setButtonState('idle');
        return;
      }
      if (!data.success) throw new Error(data.message || t('orderFailed'));

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
              <img src={service.image} alt="" className="w-full h-full object-cover" />
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Package Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">{t('selectPackageLabel')}</label>
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
                  const unavailable = pkg.available === false;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      disabled={unavailable}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm transition ${
                        isRTL ? 'text-right' : 'text-left'
                      } ${
                        unavailable
                          ? 'opacity-40 cursor-not-allowed bg-slate-800/20 border-slate-800 text-slate-500'
                          : isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                        </div>
                        <span className="font-medium">{translatePackageTitle(pkg.title)}</span>
                        {unavailable ? (
                          <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{t('outOfStock')}</span>
                        ) : (
                          pkg.duration && (
                            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{t('instant')}</span>
                          )
                        )}
                      </div>
                      <div className="font-bold text-cyan-400 font-mono shrink-0" dir="ltr">
                        {pkg.productType === 'amount' ? `${t('fromPrice')} ` : ''}${formatSmartPrice(pkg.price)}
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
                          <span>{translateInputLabel(service.inputLabel || detail?.inputLabel || 'ئويۇنچى كىملىكى (UID)')}</span>
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
                          placeholder={translateInputPlaceholder(service.inputPlaceholder || detail?.inputPlaceholder || 'مەسىلەن: 12345678')}
                          className={inputClass}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>{translateInputLabel(service.zoneIdLabel || detail?.zoneIdLabel || 'رايون كودى (Zone ID)')}</span>
                          <span className="text-rose-400 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={zoneInput}
                          onChange={(e) => setZoneInput(e.target.value)}
                          placeholder={translateInputPlaceholder(service.zoneIdPlaceholder || detail?.zoneIdPlaceholder || 'مەسىلەن: 1234')}
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>{translateInputLabel(service.inputLabel || detail?.inputLabel || 'ھېسابات / ئويۇنچى ID')}</span>
                      {service.category !== 'cards' && <span className="text-rose-400 font-bold">*</span>}
                    </label>
                    <input
                      type="text"
                      value={accountInput}
                      onChange={(e) => setAccountInput(e.target.value)}
                      placeholder={translateInputPlaceholder(service.inputPlaceholder || detail?.inputPlaceholder || 'ئۇچۇرىڭىزنى كىرگۈزۈڭ')}
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
              ) : (
                <AnimatedOrderButton
                  status={buttonState}
                  disabled={loading || isSubmittingRef.current || !selectedPkg || selectedPkg.available === false}
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
        )}
      </div>
    </div>
  );
}
