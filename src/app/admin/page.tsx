'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ordersStore, Order } from '@/lib/orders';
import { SERVICES_DATA } from '@/lib/data';
import {
  ArrowRight,
  TrendingUp,
  Package,
  Users,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const processingOrders = orders.filter((o) => o.status === 'processing').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>ئالدى بەتكە قايتىش</span>
            </Link>
            <h1 className="text-base sm:text-lg font-bold text-white">
              باشقۇرۇش سۇپىسى (Admin Dashboard)
            </h1>
          </div>

          <button
            onClick={loadOrders}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>يېڭىلاش</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">جەمئىي كىرىم</p>
              <h3 className="text-2xl font-extrabold text-cyan-400 font-mono">
                ${totalRevenue.toFixed(2)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">جەمئىي زاكاز سانى</p>
              <h3 className="text-2xl font-extrabold text-white font-mono">{orders.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">مۇۋەپپەقىيەتلىك پۈتكەن</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 font-mono">
                {completedOrders}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">بىر تەرەپ قىلىنىۋاتقان</p>
              <h3 className="text-2xl font-extrabold text-amber-400 font-mono">
                {processingOrders}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">بارلىق زاكازلار تىزىملىكى</h3>
            <span className="text-xs text-slate-400">{orders.length} پارچە زاكاز تېپىلدى</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">زاكاز نومۇرى</th>
                  <th className="py-3 px-4">مۇلازىمەت</th>
                  <th className="py-3 px-4">تۈر تەپسىلاتى</th>
                  <th className="py-3 px-4">ئىشلەتكۈچى / نىشان</th>
                  <th className="py-3 px-4">سومما</th>
                  <th className="py-3 px-4">ھالىتى</th>
                  <th className="py-3 px-4">ۋاقتى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-300">{ord.id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{ord.serviceName}</td>
                    <td className="py-3 px-4 text-slate-300">{ord.packageTitle}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{ord.targetAccount}</td>
                    <td className="py-3 px-4 font-bold font-mono text-emerald-400">
                      ${ord.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {ord.status === 'completed' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] bg-emerald-950/50 text-emerald-400 border border-emerald-900/60">
                          پۈتتى
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] bg-amber-950/50 text-amber-400 border border-amber-900/60">
                          بىر تەرەپ قىلىنىۋاتىدۇ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Services & Inventory catalog */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-white text-base mb-4">
            مۇلازىمەتلەر ۋە باھا سەپلىمىسى ({SERVICES_DATA.length} خىل مۇلازىمەت بار)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES_DATA.map((srv) => (
              <div key={srv.id} className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-white">{srv.name}</h4>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {srv.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{srv.description}</p>
                <div className="text-[11px] text-slate-400">
                  سەپلەنگەن باھا پىلانى: <span className="text-cyan-400 font-bold">{srv.packages.length}</span> تۈر
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
