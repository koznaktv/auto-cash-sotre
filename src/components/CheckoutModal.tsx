'use client';

import React, { useState } from 'react';
import { ServiceItem } from '@/lib/data';
import DynamicIcon from './DynamicIcon';
import { useLanguage } from '@/context/LanguageContext';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CheckoutModalProps {
  service: ServiceItem | null;
  user?: { id?: string; email?: string; name?: string; balance?: number } | null;
  onClose: () => void;
  onSuccess: (order: any, newBalance?: number) => void;
}

export default function CheckoutModal({
  service,
  user,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const {
    t,
    isRTL,
    translatePackageTitle,
    translateInputLabel,
    translateInputPlaceholder,
  } = useLanguage();

  if (!service) return null;

  const [selectedPkgId, setSelectedPkgId] = useState(service.packages[0]?.id || '');
  const [accountInput, setAccountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedPkg = service.packages.find((p) => p.id === selectedPkgId) || service.packages[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (service.inputLabel && !accountInput.trim()) {
      setErrorMsg(`${translateInputLabel(service.inputLabel) || 'ID'}`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          packageId: selectedPkgId,
          targetAccount: accountInput.trim(),
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'زاكاز قوبۇل قىلىنمىدى');
      }

      onSuccess(data.order, data.newBalance);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'خاتالىق كۆرۈلدى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden ${
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
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-inner shrink-0">
            <DynamicIcon name={service.icon} className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{service.name}</h3>
            <p className="text-xs text-slate-400">{service.description}</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Package Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {t('selectPackageLabel')}
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {service.packages.map((pkg) => {
                const isSelected = pkg.id === selectedPkgId;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm transition ${
                      isRTL ? 'text-right' : 'text-left'
                    } ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-sm shadow-cyan-500/10'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                      </div>
                      <span className="font-medium">{translatePackageTitle(pkg.title)}</span>
                      {pkg.duration && (
                        <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                          {t('instant')}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-cyan-400 font-mono" dir="ltr">
                      ${pkg.price.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Input */}
          {service.inputLabel && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {translateInputLabel(service.inputLabel)}
              </label>
              <input
                type="text"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                placeholder={translateInputPlaceholder(service.inputPlaceholder)}
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              />
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-900/60 p-3 rounded-xl leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Price Summary & Submit */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">{t('amount')}</span>
              <span className="text-xl font-extrabold text-cyan-400 font-mono" dir="ltr">
                ${selectedPkg?.price.toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t('confirmAndPay')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
