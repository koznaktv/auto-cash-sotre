import { describe, expect, it } from 'vitest';
import { ceilCents, ceilPrecision, computeSellPrice, resolveMarkup } from '../pricing';
import { formatSmartPrice } from '../../formatMoney';
import { validateOrderFields, validateQty } from '../fieldValidation';
import { buildProviderCatalog } from '../storefront';
import { guessStorefrontCategory } from '../categoryMapping';
import { DEFAULT_PROVIDER_SETTINGS, type StoredCategory, type StoredProduct } from '../types';

describe('pricing', () => {
  it('ceilCents tolerates float noise', () => {
    expect(ceilCents(1.1)).toBe(1.1);
    expect(ceilCents(1.101)).toBe(1.11);
  });

  it('applies markup and rounds up', () => {
    expect(computeSellPrice({ unitCost: 10, qty: 1, markupPercent: 15, minProfit: 0.01 })).toBe(11.5);
  });

  it('enforces the minimum profit on tiny per-unit prices', () => {
    // 0.000016 × 1000 = $0.016 cost
    const price = computeSellPrice({ unitCost: 0.000016, qty: 1000, markupPercent: 15, minProfit: 0.01 });
    expect(price).toBe(0.03);
    expect(price).toBeGreaterThan(0.016);
  });

  it('preserves micro-cent precision for sub-cent wholesale products', () => {
    // Sahl Cash product #134 Party Star: costPrice 0.0010568041237113402
    const cost = 0.0010568041237113402;
    const price = computeSellPrice({ unitCost: cost, qty: 1, markupPercent: 15, minProfit: 0.01 });
    expect(price).toBeLessThan(0.01);
    expect(price).toBeGreaterThan(cost);
    expect(formatSmartPrice(cost)).toBe('0.0010568');
    expect(formatSmartPrice(price)).toMatch(/^0\.0012/);
  });

  it('formats standard and micro prices accurately with formatSmartPrice', () => {
    expect(formatSmartPrice(0)).toBe('0.00');
    expect(formatSmartPrice(null)).toBe('0.00');
    expect(formatSmartPrice(10)).toBe('10.00');
    expect(formatSmartPrice(1.5)).toBe('1.50');
    expect(formatSmartPrice(0.05)).toBe('0.05');
    expect(formatSmartPrice(0.0010568041237113402)).toBe('0.0010568');
    expect(formatSmartPrice('0.00005')).toBe('0.00005');
  });

  it('never sells at or below cost, even with 0% markup', () => {
    expect(computeSellPrice({ unitCost: 5, qty: 1, markupPercent: 0, minProfit: 0 })).toBe(5.01);
  });

  it('resolveMarkup prefers the first defined override and clamps', () => {
    expect(resolveMarkup([null, undefined, 30], 15)).toBe(30);
    expect(resolveMarkup([], 15)).toBe(15);
    expect(resolveMarkup([9999], 15)).toBe(500);
  });
});

describe('field validation', () => {
  const schema = [
    { key: 'playerId', label: 'Player', type: 'number' as const, required: true },
    { key: 'note', label: 'Note', type: 'text' as const, required: false },
  ];

  it('accepts valid input and drops unknown keys', () => {
    const r = validateOrderFields({ playerId: ' 123456 ', evil: 'x' }, schema);
    expect(r).toMatchObject({ ok: true, params: { playerId: '123456' }, summary: 'Player: 123456' });
  });

  it('rejects missing, non-numeric and injected values', () => {
    expect(validateOrderFields({}, schema).ok).toBe(false);
    expect(validateOrderFields({ playerId: '12a' }, schema).ok).toBe(false);
    expect(validateOrderFields({ playerId: '1', note: '<script>' }, schema).ok).toBe(false);
  });

  it('validates quantities', () => {
    expect(validateQty(undefined, { kind: 'fixed' })).toEqual({ ok: true, qty: 1 });
    expect(validateQty(5, { kind: 'list', values: [1, 5] }).ok).toBe(true);
    expect(validateQty(3, { kind: 'list', values: [1, 5] }).ok).toBe(false);
    expect(validateQty(150, { kind: 'range', min: 10, max: 100, step: 1 }).ok).toBe(false);
    expect(validateQty(2.5, { kind: 'range', min: 1, max: 100, step: 1 }).ok).toBe(false);
  });
});

describe('category mapping', () => {
  it('maps Arabic provider names', () => {
    expect(guessStorefrontCategory(['ألعاب'])).toBe('games');
    expect(guessStorefrontCategory(['تطبيقات الدردشة'])).toBe('apps');
    expect(guessStorefrontCategory(['بطاقات جوجل بلاي'])).toBe('cards');
    expect(guessStorefrontCategory(['شيء غير معروف'])).toBeNull();
  });
});

describe('buildProviderCatalog', () => {
  const now = new Date().toISOString();
  const category = (id: number, name: string, parentId: number | null = null): StoredCategory => ({
    id,
    name,
    parentId,
    rootId: parentId,
    depth: parentId ? 1 : 0,
  });
  const product = (id: number, categoryId: number, cost: number, extra: Partial<StoredProduct> = {}): StoredProduct => ({
    id,
    name: `P${id}`,
    costPrice: cost,
    currency: 'USD',
    categoryId,
    parentId: null,
    categoryName: '',
    available: true,
    productType: 'package',
    inputSchema: [],
    params: [],
    qtyValues: null,
    syncedAt: now,
    ...extra,
  });

  const base = {
    categories: [category(1, 'ألعاب'), category(2, 'PUBG Mobile', 1), category(3, 'مجهول'), category(4, 'Free Fire', 1)],
    products: [
      product(10, 2, 2),
      product(11, 2, 1),
      product(12, 3, 1), // unmapped category
      product(13, 2, 1, { currency: 'SYP' }),
      product(14, 2, 1, { removedAt: now }),
      product(15, 4, 1, { available: false }),
    ],
    overrides: [],
    settings: { ...DEFAULT_PROVIDER_SETTINGS },
  };

  it('groups products of a leaf category into one service, cheapest first', () => {
    const catalog = buildProviderCatalog(base);
    expect(catalog.services).toHaveLength(1);
    const [service] = catalog.services;
    expect(service).toMatchObject({ id: 's4g-c2', category: 'games', source: 'provider' });
    expect(service.packages.map((p) => p.id)).toEqual(['s4g-p11', 's4g-p10']);
    expect(service.packages[0].price).toBe(1.15);
    // Empty provider schema on a game → default player id field
    expect(service.packages[0].fields?.[0].key).toBe('playerId');
  });

  it('counts unmapped / non-USD / removed / unavailable products', () => {
    const { stats, orderable } = buildProviderCatalog(base);
    expect(stats).toMatchObject({ unmappedCategories: 1, nonUsd: 1, removed: 1, unavailable: 1 });
    expect(orderable.has(15)).toBe(false);
  });

  it('applies overrides: category mapping, hiding and markup', () => {
    const catalog = buildProviderCatalog({
      ...base,
      overrides: [
        { scope: 'category', targetId: 3, storefrontCategory: 'cards', markupPercent: 50 },
        { scope: 'product', targetId: 10, hidden: true },
      ],
    });
    const cards = catalog.services.find((s) => s.id === 's4g-c3');
    expect(cards?.category).toBe('cards');
    expect(cards?.packages[0].price).toBe(1.5);
    expect(catalog.services.find((s) => s.id === 's4g-c2')?.packages.map((p) => p.id)).toEqual(['s4g-p11']);
  });

  it('hiding a parent category hides its children', () => {
    const catalog = buildProviderCatalog({ ...base, overrides: [{ scope: 'category', targetId: 1, hidden: true }] });
    expect(catalog.services).toHaveLength(0);
  });

  it('assigns high-definition artwork when category image is missing or bare host', () => {
    const catalog = buildProviderCatalog({
      ...base,
      categories: [
        { id: 1, parentId: null, name: 'Free Fire', image: 'https://api.sahl-cash.com/', rootId: null, depth: 0 } as any,
        { id: 2, parentId: 1, name: 'PUBG Mobile', image: '', rootId: 1, depth: 1 } as any,
      ],
      products: [
        { id: 10, categoryId: 1, name: '100 Diamonds', costPrice: 1, currency: 'USD', available: true, productType: 'fixed' } as any,
        { id: 11, categoryId: 2, name: '60 UC', costPrice: 0.99, currency: 'USD', available: true, productType: 'fixed' } as any,
      ],
      overrides: [],
      settings: DEFAULT_PROVIDER_SETTINGS,
    });
    const ff = catalog.services.find((s) => s.id === 's4g-c1');
    const pubg = catalog.services.find((s) => s.id === 's4g-c2');
    expect(ff?.image).toContain('/images/services/free_fire.jpg');
    expect(pubg?.image).toContain('/images/services/pubg_mobile.jpg');
    expect(ff?.image).not.toBe('https://api.sahl-cash.com/');
  });
});
