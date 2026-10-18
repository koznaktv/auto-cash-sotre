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
  const { t, isRTL, translatePackageTitle, translateInputLabel, translateInputPlaceholder } = useLanguage();

  const isProvider = Boolean(service && (service.source === 'provider' || service.id.startsWith('s4g-')));
  const [detail, setDetail] = useState<ServiceItem | null>(isProvider ? null : service);
  const [detailError, setDetailError] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [packageQuery, setPackageQuery] = useState('');
  const [accountInput, setAccountInput] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [qtyInput, setQtyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [confirmTotal, setConfirmTotal] = useState<number | null>(null);
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success'>('idle');
  const isSubmittingRef = useRef(false);

  // Provider services: the slim catalog has no fields / qty rules, load the full service
  useEffect(() => {
    if (!service) return;
    if (!isProvider) {
      setDetail(service);
      return;
    }
    let cancelled = false;
    setDetail(null);
    setDetailError('');
    fetch(`/api/catalog/${encodeURIComponent(service.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success && d.service) setDetail(d.service);
        else setDetailError(d.message || 'مەھسۇلات ئۇچۇرى يۈكلەنمىدى');
      })
      .catch(() => !cancelled && setDetailError('مەھسۇلات ئۇچۇرى يۈكلەنمىدى'));
    return () => {
      cancelled = true;
    };
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

  if (!service) return null;

  const submitOrder = async (expectedTotal: number) => {
    isSubmittingRef.current = true;
    setLoading(true);
    setButtonState('loading');
    setErrorMsg('');
    setInfoMsg('');
    try {
      const body = isProvider
        ? { serviceId: service.id, packageId: selectedPkgId, fields: fieldValues, qty, expectedTotal }
        : { serviceId: service.id, packageId: selectedPkgId, targetAccount: accountInput.trim() };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-idempotency-key': newIdempotencyKey() },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 409 && data.priceChanged && typeof data.newTotal === 'number') {
        setConfirmTotal(data.newTotal);
        setErrorMsg(data.message || 'باھا ئۆزگەردى');
        setButtonState('idle');
        return;
      }
      if (!data.success) throw new Error(data.message || 'زاكاز قوبۇل قىلىنمىدى');

      if (res.status === 202) {
        // Accepted but the provider's answer was unclear: the order is being verified
        setButtonState('success');
        setInfoMsg(data.message || 'زاكازىڭىز تەكشۈرۈلۈۋاتىدۇ');
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
      setErrorMsg(err.message || 'خاتالىق كۆرۈلدى');
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

    if (isProvider) {
      if (selectedPkg.available === false) {
        setErrorMsg('بۇ تۈر ھازىر يوق');
        return;
      }
      const fieldCheck = validateOrderFields(fieldValues, selectedPkg.fields || []);
      if (!fieldCheck.ok) {
        setErrorMsg(fieldCheck.message || 'ئۇچۇر خاتا');
        return;
      }
      const qtyCheck = validateQty(qty, selectedPkg.qty);
      if (!qtyCheck.ok) {
        setErrorMsg(qtyCheck.message || 'سانى خاتا');
        return;
      }
      await submitOrder(confirmTotal ?? estimatedTotal);
      return;
    }

    if (service.inputLabel && !accountInput.trim()) {
      setErrorMsg(`${translateInputLabel(service.inputLabel) || 'ID'} نى كىرگۈزۈڭ`);
      return;
    }
    if (service.category === 'games' || service.inputLabel) {
      const val = validateGameAccount(service.id, accountInput.trim());
      if (!val.isValid) {
        setErrorMsg(val.message || 'كىملىك فورماتى خاتا!');
        return;
      }
    }
    await submitOrder(selectedPkg.price);
  };

  const displayTotal = confirmTotal ?? estimatedTotal;
  const inputClass = `w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition ${
    isRTL ? 'text-right' : 'text-left'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 ${
          isRTL ? 'text-right' : 'text-left'
        } font-alkatip`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
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
          <div>
            <h3 className="text-lg font-bold text-white">{service.name}</h3>
            <p className="text-xs text-slate-400">{service.description}</p>
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
            <span>يۈكلىنىۋاتىدۇ...</span>
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
                    placeholder="ئىزدەش..."
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
                        <span className="font-medium">{isProvider ? pkg.title : translatePackageTitle(pkg.title)}</span>
                        {unavailable ? (
                          <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">يوق</span>
                        ) : (
                          pkg.duration && (
                            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{t('instant')}</span>
                          )
                        )}
                      </div>
                      <div className="font-bold text-cyan-400 font-mono shrink-0" dir="ltr">
                        {pkg.productType === 'amount' ? `${isRTL ? 'دىن' : 'from'} ` : ''}${pkg.price.toFixed(2)}
                      </div>
                    </button>
                  );
                })}
                {visiblePackages.length === 0 && <p className="text-xs text-slate-500 py-3 text-center">تېپىلمىدى</p>}
              </div>
            </div>

            {/* Quantity (per-unit "amount" products) */}
            {isProvider && selectedPkg?.qty && selectedPkg.qty.kind !== 'fixed' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">سانى</label>
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
                    {selectedPkg.unitPrice < 0.01
                      ? `$${(selectedPkg.unitPrice * 1000).toFixed(4)} / 1000`
                      : `$${selectedPkg.unitPrice.toFixed(4)} / 1`}
                  </p>
                )}
              </div>
            )}

            {/* Provider checkout fields */}
            {isProvider &&
              (selectedPkg?.fields || []).map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {field.label}
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
                      placeholder={field.placeholder || ''}
                      maxLength={field.maxLength || 100}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}

            {/* Legacy single account input */}
            {!isProvider && service.inputLabel && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {translateInputLabel(service.inputLabel)}
                </label>
                <input
                  type="text"
                  value={accountInput}
                  onChange={(e) => setAccountInput(e.target.value)}
                  placeholder={translateInputPlaceholder(service.inputPlaceholder)}
                  className={inputClass}
                />
                {service.id.toLowerCase().includes('mobile-legend') && (
                  <p className="mt-1.5 text-[11px] text-amber-300/80">
                    💡 ئەسكەرتىش: كىملىك ۋە رايون كودىنى بىللە كىرگۈزۈڭ، مەسىلەن:{' '}
                    <span dir="ltr" className="font-mono font-bold text-amber-300">
                      12345678 (1234)
                    </span>
                  </p>
                )}
                {service.id.toLowerCase().includes('pubg') && (
                  <p className="mt-1.5 text-[11px] text-amber-300/80">
                    💡 ئەسكەرتىش: پەقەت 8 دىن 12 خانىغىچە رەقەملىك UID كىرگۈزۈڭ، مەسىلەن:{' '}
                    <span dir="ltr" className="font-mono font-bold text-amber-300">
                      5123456789
                    </span>
                  </p>
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
                  ${displayTotal.toFixed(2)}
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
                  {isRTL ? 'تامام' : 'Done'}
                </button>
              ) : (
                <AnimatedOrderButton
                  status={buttonState}
                  disabled={loading || isSubmittingRef.current || !selectedPkg || selectedPkg.available === false}
                  label={
                    confirmTotal !== null
                      ? `يېڭى باھا $${confirmTotal.toFixed(2)} نى جەزملەش`
                      : t('confirmAndPay')
                  }
                  isRTL={isRTL}
                />
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
