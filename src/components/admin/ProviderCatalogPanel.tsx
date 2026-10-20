'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Save, AlertTriangle, PlayCircle, Search, Eye, EyeOff, ScrollText } from 'lucide-react';
import { STOREFRONT_CATEGORIES, type ProviderSettings, type StorefrontCategory } from '@/lib/catalog/types';
import { formatSmartPrice } from '@/lib/formatMoney';

type Theme = Record<string, string>;

const CATEGORY_LABELS: Record<StorefrontCategory, string> = {
  games: 'ئويۇنلار',
  apps: 'ئەپلەر',
  ai: 'سۈنئىي ئەقىل',
  numbers: 'مەۋھۇم نومۇر',
  cards: 'كارتىلار',
  accounts: 'ھېساباتلار',
  crypto: 'USDT',
  social: 'ئىجتىمائىي',
  balance: 'ھەميان',
};

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('autocash_admin_token') : '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), ...(init?.headers || {}) } });
  const data = await res.json().catch(() => ({ success: false, message: `HTTP ${res.status}` }));
  if (!data.success) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}

interface CategoryRow {
  id: number;
  name: string;
  storefrontCategory: StorefrontCategory | null;
  mappedBy: 'override' | 'keyword' | null;
  hidden: boolean;
  productCount: number;
  visibleProductCount: number;
  override: { storefrontCategory?: StorefrontCategory | null; hidden?: boolean | null; markupPercent?: number | null } | null;
}

interface ProductRow {
  id: number;
  name: string;
  categoryName: string;
  costPrice: number;
  prevCostPrice?: number | null;
  sellPrice: number | null;
  available: boolean;
  onStorefront: boolean;
  productType: string;
  override: { hidden?: boolean | null; markupPercent?: number | null } | null;
}

export default function ProviderCatalogPanel({ themeClasses }: { themeClasses: Theme }) {
  const [settings, setSettings] = useState<ProviderSettings | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [form, setForm] = useState<Partial<ProviderSettings>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  const [catFilter, setCatFilter] = useState<'unmapped' | 'all' | 'mapped' | 'hidden'>('unmapped');
  const [catQuery, setCatQuery] = useState('');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [catTotal, setCatTotal] = useState(0);

  const [prodQuery, setProdQuery] = useState('');
  const [prodStatus, setProdStatus] = useState('');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [prodTotal, setProdTotal] = useState(0);

  const [calls, setCalls] = useState<any[] | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api('/api/admin/catalog/settings');
      setSettings(data.settings);
      setStats(data.catalogStats);
      setForm({});
    } catch (err: any) {
      setMessage(err.message);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api(`/api/admin/catalog/categories?filter=${catFilter}&q=${encodeURIComponent(catQuery)}`);
      setCategories(data.categories);
      setCatTotal(data.total);
    } catch (err: any) {
      setMessage(err.message);
    }
  }, [catFilter, catQuery]);

  const loadProducts = useCallback(async () => {
    try {
      const data = await api(`/api/admin/catalog/products?q=${encodeURIComponent(prodQuery)}&status=${prodStatus}`);
      setProducts(data.products);
      setProdTotal(data.total);
    } catch (err: any) {
      setMessage(err.message);
    }
  }, [prodQuery, prodStatus]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setMessage('');
    try {
      await fn();
    } catch (err: any) {
      setMessage(err.message || 'خاتالىق');
    } finally {
      setBusy('');
    }
  };

  const syncNow = () =>
    run('sync', async () => {
      const data = await api('/api/admin/catalog/sync', { method: 'POST' });
      setMessage(`Sync تاماملاندى: ${data.stats?.products ?? 0} مەھسۇلات، ${data.stats?.added ?? 0} يېڭى، ${data.stats?.priceChanged ?? 0} باھا ئۆزگەردى`);
      await Promise.all([loadSettings(), loadCategories(), loadProducts()]);
    });

  const saveSettings = (patch: Partial<ProviderSettings>) =>
    run('settings', async () => {
      const data = await api('/api/admin/catalog/settings', { method: 'PATCH', body: JSON.stringify(patch) });
      setSettings(data.settings);
      setForm({});
      setMessage('تەڭشەك ساقلاندى');
      await loadSettings();
    });

  const switchSource = (source: 'legacy' | 'provider') => {
    const text =
      source === 'provider'
        ? 'ماگىزىن Sahl Cash تىزىملىكىگە ئالماشسۇنمۇ؟ كونا مەھسۇلاتلار كۆرۈنمەيدۇ.'
        : 'كونا تىزىملىككە قايتسۇنمۇ؟';
    if (window.confirm(text)) saveSettings({ catalogSource: source });
  };

  const saveCategory = (id: number, patch: Record<string, unknown>) =>
    run(`cat-${id}`, async () => {
      await api('/api/admin/catalog/categories', { method: 'PATCH', body: JSON.stringify({ id, ...patch }) });
      await Promise.all([loadCategories(), loadSettings()]);
    });

  const saveProduct = (id: number, patch: Record<string, unknown>) =>
    run(`prod-${id}`, async () => {
      await api('/api/admin/catalog/products', { method: 'PATCH', body: JSON.stringify({ id, ...patch }) });
      await loadProducts();
    });

  const loadCalls = () =>
    run('calls', async () => {
      const data = await api('/api/admin/provider?action=calls');
      setCalls(data.calls);
    });

  const value = <K extends keyof ProviderSettings>(key: K) => (form[key] ?? settings?.[key]) as ProviderSettings[K];
  const numberInput = (key: keyof ProviderSettings, label: string, step = '0.01') => (
    <label className="block text-[11px] text-slate-400">
      {label}
      <input
        type="number"
        step={step}
        value={String(value(key) ?? '')}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value === '' ? undefined : Number(e.target.value) }))}
        className={`mt-1 w-full rounded-lg px-2.5 py-1.5 text-xs border ${themeClasses.input}`}
        dir="ltr"
      />
    </label>
  );

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-xl text-xs ${themeClasses.card} border border-cyan-500/30 text-cyan-200`}>{message}</div>
      )}

      {settings?.ordersPaused && (
        <div className="p-4 rounded-2xl border border-rose-500/50 bg-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-rose-200 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>سېتىۋېلىش توختىتىلدى: {settings.ordersPausedReason || '—'}</span>
          </div>
          <button
            onClick={() => saveSettings({ ordersPaused: false })}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
          >
            قايتا ئېچىش
          </button>
        </div>
      )}

      {/* Sync & source */}
      <div className={`p-5 rounded-2xl ${themeClasses.card} space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">مەھسۇلات تىزىملىكى (Sahl Cash Catalog)</h3>
            <p className={`text-[11px] ${themeClasses.subtext} mt-1`}>
              ئاخىرقى sync: {settings?.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString() : '—'} ·{' '}
              {settings?.lastSyncStatus || '—'}
              {settings?.lastSyncError ? ` · ${settings.lastSyncError}` : ''}
            </p>
            {stats && (
              <p className={`text-[11px] ${themeClasses.subtext} mt-1`}>
                ماگىزىندا: {stats.services} مۇلازىمەت / {stats.products} مەھسۇلات · بەلگىلەنمىگەن سەھىپە: {stats.unmappedCategories} · يوق:{' '}
                {stats.unavailable} · ئۆچۈرۈلگەن: {stats.removed} · كىرگۈزۈش مەيدانى بېكىتىلمىگەن: {stats.needsFieldMapping}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncNow}
              disabled={busy === 'sync'}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy === 'sync' ? 'animate-spin' : ''}`} />
              {busy === 'sync' ? 'Sync بولۇۋاتىدۇ...' : 'ھازىر Sync قىلىش'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={themeClasses.subtext}>ماگىزىن تىزىملىكى:</span>
          {(['legacy', 'provider'] as const).map((source) => (
            <button
              key={source}
              onClick={() => settings?.catalogSource !== source && switchSource(source)}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                settings?.catalogSource === source ? themeClasses.pillActive : themeClasses.pillInactive
              }`}
            >
              {source === 'legacy' ? 'كونا (قولدا)' : 'Sahl Cash (ئاپتوماتىك)'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {numberInput('globalMarkupPercent', 'پىرسەنتلىك پايدا % (Markup %)', '0.1')}
          {numberInput('fixedMarkupUsd', 'مۇقىم پايدا $ (Fixed Profit $)', '0.01')}
          {numberInput('minProfitUsd', 'ئەڭ ئاز پايدا $')}
          {numberInput('minOrderUsd', 'ئەڭ ئاز زاكاز $')}
          {numberInput('priceMaxAgeMinutes', 'باھا cache مۇددىتى (مىنۇت)', '1')}
          {numberInput('lowBalanceThresholdUsd', 'قالدۇق ئاگاھلاندۇرۇش $', '1')}
          {numberInput('maxPendingHours', 'كۈتۈش چېكى (سائەت)', '1')}
          <label className="flex items-center gap-2 text-[11px] text-slate-400 mt-5">
            <input
              type="checkbox"
              checked={Boolean(value('showUnavailable'))}
              onChange={(e) => setForm((f) => ({ ...f, showUnavailable: e.target.checked }))}
            />
            يوق مەھسۇلاتلارنىمۇ كۆرسىتىش
          </label>
          <div className="flex items-end">
            <button
              onClick={() => saveSettings(form)}
              disabled={busy === 'settings' || Object.keys(form).length === 0}
              className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" /> ساقلاش
            </button>
          </div>
        </div>
      </div>

      {/* Category mapping */}
      <div className={`p-5 rounded-2xl ${themeClasses.card} space-y-3`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">سەھىپە ماسلاشتۇرۇش ({catTotal})</h3>
          <div className="flex flex-wrap items-center gap-2">
            {(['unmapped', 'all', 'mapped', 'hidden'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCatFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer ${catFilter === f ? themeClasses.pillActive : themeClasses.pillInactive}`}
              >
                {{ unmapped: 'بەلگىلەنمىگەن', all: 'ھەممىسى', mapped: 'بەلگىلەنگەن', hidden: 'يوشۇرۇلغان' }[f]}
              </button>
            ))}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
                placeholder="ئىزدەش"
                className={`pr-7 pl-2 py-1 rounded-lg text-xs border ${themeClasses.input}`}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className={`border-b ${themeClasses.tableHead}`}>
                <th className="p-2">ID</th>
                <th className="p-2">نامى</th>
                <th className="p-2">مەھسۇلات</th>
                <th className="p-2">ماگىزىن سەھىپىسى</th>
                <th className="p-2">پايدا %</th>
                <th className="p-2">كۆرۈنۈش</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className={`border-b ${themeClasses.tableRow}`}>
                  <td className="p-2 font-mono text-slate-400" dir="ltr">{c.id}</td>
                  <td className="p-2 text-white">{c.name}</td>
                  <td className="p-2 font-mono">{c.visibleProductCount}/{c.productCount}</td>
                  <td className="p-2">
                    <select
                      value={c.override?.storefrontCategory || ''}
                      onChange={(e) => saveCategory(c.id, { storefrontCategory: e.target.value || null })}
                      className={`rounded-lg px-2 py-1 text-xs border ${themeClasses.input}`}
                    >
                      <option value="">
                        {c.mappedBy === 'keyword' && c.storefrontCategory ? `ئاپتوماتىك: ${CATEGORY_LABELS[c.storefrontCategory]}` : 'ئاپتوماتىك (يوق)'}
                      </option>
                      {STOREFRONT_CATEGORIES.map((sc) => (
                        <option key={sc} value={sc}>
                          {CATEGORY_LABELS[sc]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      defaultValue={c.override?.markupPercent ?? ''}
                      placeholder="ئومۇمىي"
                      onBlur={(e) => {
                        const next = e.target.value === '' ? null : Number(e.target.value);
                        if (next !== (c.override?.markupPercent ?? null)) saveCategory(c.id, { markupPercent: next });
                      }}
                      className={`w-20 rounded-lg px-2 py-1 text-xs border ${themeClasses.input}`}
                      dir="ltr"
                    />
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => saveCategory(c.id, { hidden: !c.override?.hidden })}
                      className="text-slate-300 hover:text-white cursor-pointer"
                      title={c.override?.hidden ? 'كۆرسىتىش' : 'يوشۇرۇش'}
                    >
                      {c.override?.hidden ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    بوش — ئاۋۋال Sync قىلىڭ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products */}
      <div className={`p-5 rounded-2xl ${themeClasses.card} space-y-3`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">مەھسۇلاتلار ({prodTotal})</h3>
          <div className="flex flex-wrap items-center gap-2">
            {[
              ['', 'ھەممىسى'],
              ['priceChanged', 'باھا ئۆزگەرگەن'],
              ['unavailable', 'يوق'],
              ['removed', 'ئۆچۈرۈلگەن'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setProdStatus(key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer ${prodStatus === key ? themeClasses.pillActive : themeClasses.pillInactive}`}
              >
                {label}
              </button>
            ))}
            <input
              value={prodQuery}
              onChange={(e) => setProdQuery(e.target.value)}
              placeholder="ئىزدەش (نام / ID)"
              className={`px-2 py-1 rounded-lg text-xs border ${themeClasses.input}`}
            />
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className={`border-b ${themeClasses.tableHead}`}>
                <th className="p-2">ID</th>
                <th className="p-2">نامى</th>
                <th className="p-2">سەھىپە</th>
                <th className="p-2">تەننەرخ</th>
                <th className="p-2">سېتىش</th>
                <th className="p-2">پايدا %</th>
                <th className="p-2">ھالەت</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={`border-b ${themeClasses.tableRow}`}>
                  <td className="p-2 font-mono text-slate-400" dir="ltr">{p.id}</td>
                  <td className="p-2 text-white">
                    {p.name}
                    {p.productType === 'amount' && <span className="text-[10px] text-cyan-400"> (بىرلىك)</span>}
                  </td>
                  <td className="p-2 text-slate-400">{p.categoryName}</td>
                  <td className="p-2 font-mono" dir="ltr">
                    ${formatSmartPrice(p.costPrice)}
                    {p.prevCostPrice !== null && p.prevCostPrice !== undefined && (
                      <span className="block text-[10px] text-slate-500 line-through">${formatSmartPrice(p.prevCostPrice)}</span>
                    )}
                  </td>
                  <td className="p-2 font-mono text-emerald-300" dir="ltr">{p.sellPrice !== null ? `$${formatSmartPrice(p.sellPrice)}` : '—'}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      defaultValue={p.override?.markupPercent ?? ''}
                      placeholder="—"
                      onBlur={(e) => {
                        const next = e.target.value === '' ? null : Number(e.target.value);
                        if (next !== (p.override?.markupPercent ?? null)) saveProduct(p.id, { markupPercent: next });
                      }}
                      className={`w-16 rounded-lg px-2 py-1 text-xs border ${themeClasses.input}`}
                      dir="ltr"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className={p.onStorefront ? 'text-emerald-400' : p.available ? 'text-amber-400' : 'text-rose-400'}>
                        {p.onStorefront ? 'سېتىلىۋاتىدۇ' : p.available ? 'كۆرۈنمەيدۇ' : 'يوق'}
                      </span>
                      <button
                        onClick={() => saveProduct(p.id, { hidden: !p.override?.hidden })}
                        className="text-slate-300 hover:text-white cursor-pointer"
                        title={p.override?.hidden ? 'كۆرسىتىش' : 'يوشۇرۇش'}
                      >
                        {p.override?.hidden ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider call log */}
      <div className={`p-5 rounded-2xl ${themeClasses.card} space-y-3`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-cyan-400" /> API چاقىرىق خاتىرىسى
          </h3>
          <button
            onClick={loadCalls}
            disabled={busy === 'calls'}
            className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 ${themeClasses.pillInactive}`}
          >
            <PlayCircle className="w-3.5 h-3.5" /> يۈكلەش
          </button>
        </div>
        {calls && (
          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {calls.map((c, i) => (
              <details key={i} className="rounded-lg bg-slate-950/50 border border-slate-800 p-2 text-[11px]">
                <summary className="cursor-pointer flex flex-wrap gap-3 font-mono" dir="ltr">
                  <span className="text-slate-500">{c.createdAt?.substring(0, 19).replace('T', ' ')}</span>
                  <span className="text-cyan-300">{c.endpoint}</span>
                  <span className={c.outcome === 'ok' ? 'text-emerald-400' : 'text-rose-400'}>
                    {c.httpStatus} {c.outcome}
                  </span>
                  <span className="text-slate-500">{c.durationMs}ms</span>
                  {c.orderId && <span className="text-amber-300">{c.orderId}</span>}
                </summary>
                <div className="mt-2 font-mono break-all text-slate-400" dir="ltr">{c.urlRedacted}</div>
                <pre className="mt-1 whitespace-pre-wrap break-all text-slate-300 max-h-48 overflow-y-auto" dir="ltr">
                  {c.responseBody}
                </pre>
              </details>
            ))}
            {calls.length === 0 && <p className="text-xs text-slate-500">خاتىرە يوق</p>}
          </div>
        )}
      </div>
    </div>
  );
}
