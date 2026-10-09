'use client';

import React from 'react';
import { Order } from '@/lib/orders';
import { useLanguage } from '@/context/LanguageContext';
import { CheckCircle2, Clock, AlertTriangle, Copy, CreditCard } from 'lucide-react';

interface OrdersListProps {
  orders: Order[];
}

export default function OrdersList({ orders }: OrdersListProps) {
  const { lang, t, isRTL } = useLanguage();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
        <p className="text-slate-400 text-sm font-alkatip">{t('noOrdersFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-alkatip">
      {orders.map((order) => {
        const isCompleted = order.status === 'completed';
        const isProcessing = order.status === 'processing';

        return (
          <div
            key={order.id}
            className={`p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm ${
              isRTL ? 'text-right' : 'text-left'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-300" dir="ltr">
                  #{order.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {isCompleted && (
                  <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('statusCompleted')}</span>
                  </span>
                )}
                {isProcessing && (
                  <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2.5 py-1 rounded-full animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('statusProcessing')}</span>
                  </span>
                )}
                {order.status === 'failed' && (
                  <span className="flex items-center gap-1 text-rose-400 bg-rose-950/40 border border-rose-900/60 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t('statusCancelled')}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-white text-base">{order.serviceName}</h4>
                <p className="text-xs text-slate-400">
                  {isRTL ? 'تۈر:' : 'Package:'} <span className="text-slate-200">{order.packageTitle}</span> | {isRTL ? 'ئابۇنىت:' : 'Account:'}{' '}
                  <span className="text-cyan-400 font-mono" dir="ltr">{order.targetAccount}</span>
                </p>
              </div>

              <div className="text-left font-bold text-lg text-cyan-400 font-mono" dir="ltr">
                ${order.amount.toFixed(2)}
              </div>
            </div>

            {/* Extra details (SMS verification, Card, Credentials) */}
            {order.details && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 bg-slate-950/50 p-3 rounded-xl flex flex-col gap-2">
                {order.details.virtualNumber && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{isRTL ? 'مەۋھۇم تېلېفون نومۇرى:' : 'Virtual Number:'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-300 font-bold" dir="ltr">
                        {order.details.virtualNumber}
                      </span>
                      <button
                        onClick={() => copyToClipboard(order.details!.virtualNumber!)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {order.details.smsCode && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{isRTL ? 'قىسقا ئۇچۇر دەلىللەش كودى:' : 'SMS Code:'}</span>
                    <span className="font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold" dir="ltr">
                      {order.details.smsCode}
                    </span>
                  </div>
                )}

                {order.details.cardDetails && (
                  <div className="flex flex-col gap-1 text-xs bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-purple-400" /> {isRTL ? 'مەۋھۇم كارتا:' : 'Virtual Card:'}
                      </span>
                      <span className="font-mono text-purple-300" dir="ltr">
                        {order.details.cardDetails.number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>EXP: {order.details.cardDetails.exp}</span>
                      <span>CVV: {order.details.cardDetails.cvv}</span>
                    </div>
                  </div>
                )}

                {order.details.accountCredentials && (
                  <div className="text-xs text-emerald-400 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/30 font-mono" dir="ltr">
                    {order.details.accountCredentials}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
