import { describe, expect, it } from 'vitest';
import {
  extractDelivery,
  normalizeFields,
  normalizeOrderResponse,
  normalizeProduct,
  normalizeQtyRule,
  parseCatalog,
  parseCheckResponse,
  parseProviderError,
} from '../syria4gameNormalize';

describe('normalizeProduct', () => {
  it('parses the documented product shape', () => {
    const p = normalizeProduct({
      id: 1618,
      name: 'BISHAR CHAT',
      price: 0.000016,
      currency: 'USD',
      parent_id: 242,
      category_id: 242,
      category_name: 'تطبيقات الدردشة',
      available: true,
      product_type: 'amount',
      input_schema: [],
      params: [],
      qty_values: null,
    });
    expect(p).toMatchObject({ id: 1618, costPrice: 0.000016, categoryId: 242, available: true, productType: 'amount' });
  });

  it('rejects items without id or price', () => {
    expect(normalizeProduct({ name: 'x', price: 1 })).toBeNull();
    expect(normalizeProduct({ id: 1, name: 'x' })).toBeNull();
  });
});

describe('parseCatalog', () => {
  it('creates missing categories from product data', () => {
    const catalog = parseCatalog([{ id: 1, name: 'A', price: 1, category_id: 9, category_name: 'ألعاب' }]);
    expect(catalog.categories).toEqual([{ id: 9, parentId: null, name: 'ألعاب', image: undefined }]);
  });

  it('flattens nested category trees', () => {
    const catalog = parseCatalog({
      categories: [{ id: 1, name: 'root', children: [{ id: 2, name: 'leaf' }] }],
      products: [{ id: 5, name: 'p', price: 2, category_id: 2 }],
    });
    expect(catalog.categories.find((c) => c.id === 2)?.parentId).toBe(1);
  });
});

describe('normalizeFields', () => {
  it('accepts string arrays and object arrays, merging by key', () => {
    const fields = normalizeFields([{ name: 'playerId', label: 'Player', required: true }], ['playerId', 'zoneId']);
    expect(fields.map((f) => f.key)).toEqual(['playerId', 'zoneId']);
    expect(fields[0].label).toBe('Player');
    expect(fields[1].label).toBe('رايون ID (Zone ID)');
  });

  it('drops unsafe and reserved keys in object-form schemas', () => {
    const fields = normalizeFields([{ name: 'a b' }, { name: 'qty' }, { name: 'order_uuid' }, { name: 'ok_key' }], []);
    expect(fields.map((f) => f.key)).toEqual(['ok_key']);
  });

  it('turns options into a select', () => {
    const [field] = normalizeFields([{ name: 'server', options: ['EU', 'US'] }], []);
    expect(field).toMatchObject({ type: 'select', options: ['EU', 'US'] });
  });
});

describe('sahl-cash formats', () => {
  it('maps a single display-label param to playerId, keeping the label', () => {
    expect(normalizeFields([], ['Account link'])).toEqual([
      { key: 'playerId', label: 'Account link', type: 'text', required: true },
    ]);
    expect(normalizeFields([], ['EMAIL'])[0]).toMatchObject({ key: 'playerId', type: 'email' });
  });

  it('sends extra label params as named keys (docs: anyKey=anyVal)', () => {
    expect(normalizeFields([], ['Email', 'Password']).map((f) => f.key)).toEqual(['playerId', 'password']);
    expect(normalizeFields([], ["Recipt's Name", 'Iban of Account']).map((f) => f.key)).toEqual(['playerId', 'iban_of_account']);
    // Arabic-only labels have no ASCII slug
    expect(normalizeFields([], ['الاسم', 'رقم الهاتف']).map((f) => f.key)).toEqual(['playerId', 'param2']);
  });

  it('parses the documented newOrder response', () => {
    const r = normalizeOrderResponse(
      {
        status: 'OK',
        data: {
          order_id: 'ID_9fffb0d849a45215',
          status: 'accept',
          price: 1.26048,
          data: { playerId: 'test' },
          replay_api: [{ replay: ['erg3eg'] }],
        },
      },
      200
    );
    expect(r).toMatchObject({ outcome: 'accepted', providerOrderId: 'ID_9fffb0d849a45215', status: 'COMPLETED' });
    // The echoed playerId must not be mistaken for a delivered code
    expect(r.delivery).toEqual({ codes: ['erg3eg'] });
  });

  it('parses the documented check response', () => {
    const map = parseCheckResponse(
      { status: 'OK', data: [{ order_id: 'ID_9fffb0d849a45215', quantity: 1, data: { playerId: 'test' }, status: 'accept', replay_api: ['erg3eg'] }] },
      ['ID_9fffb0d849a45215']
    );
    expect(map.get('ID_9fffb0d849a45215')).toMatchObject({ status: 'COMPLETED', delivery: { codes: ['erg3eg'] } });
  });

  it('maps documented order error codes', () => {
    const kind = (code: number) => parseProviderError({ status: 'ERROR', error_code: code, message: 'x' }, 200)?.kind;
    expect(kind(100)).toBe('insufficient_balance');
    expect(kind(108)).toBe('not_allowed');
    expect(kind(110)).toBe('not_found');
    expect(kind(112)).toBe('validation');
    // "Unknown error" doesn't prove nothing was bought: stays ambiguous
    expect(normalizeOrderResponse({ status: 'ERROR', error_code: 114, message: 'Unknown error' }, 200).outcome).toBe('ambiguous');
  });

  it('treats long notes as text, not inputs', () => {
    expect(normalizeFields([], ['تنفيذ هذا الطلب بشكل يدوي قد يستغرق بعض الوقت والمزيد من الكلام'])).toEqual([]);
  });

  it('specificPackage sells only the listed (decimal) quantities', () => {
    expect(normalizeQtyRule(['19', '23.07', '19'], 'specificPackage')).toEqual({ kind: 'list', values: [19, 23.07] });
    expect(normalizeQtyRule({ min: '10000', max: '10000000' }, 'amount')).toEqual({ kind: 'range', min: 10000, max: 10000000, step: 1 });
  });

  it('uses parent_id as the category and drops bare-host images', () => {
    const p = normalizeProduct({ id: 9, name: '30 days', price: 8.9585, params: ['USER ID'], parent_id: 48, category_img: 'https://api.sahl-cash.com/' });
    expect(p).toMatchObject({ categoryId: 48, categoryImage: undefined });
  });

  it('reads error_code and string balances', () => {
    expect(parseProviderError({ status: 'ERROR', error_code: 121, message: 'Token error' }, 401)?.kind).toBe('auth');
  });
});

describe('normalizeQtyRule', () => {
  it('fixed for non-amount products', () => {
    expect(normalizeQtyRule([1, 2], 'package')).toEqual({ kind: 'fixed' });
  });
  it('list / range / default for amount products', () => {
    expect(normalizeQtyRule([5, 1, 5], 'amount')).toEqual({ kind: 'list', values: [1, 5] });
    expect(normalizeQtyRule({ min: 10, max: 100 }, 'amount')).toEqual({ kind: 'range', min: 10, max: 100, step: 1 });
    expect(normalizeQtyRule('1-50', 'amount')).toEqual({ kind: 'range', min: 1, max: 50, step: 1 });
    expect(normalizeQtyRule(null, 'amount')).toMatchObject({ kind: 'range', min: 1 });
  });
});

describe('parseProviderError', () => {
  it('maps documented codes', () => {
    expect(parseProviderError({ status: 'ERROR', error: { code: 121, message: 'bad token' } }, 200)?.kind).toBe('auth');
    expect(parseProviderError({ error: { code: '123' } }, 403)?.kind).toBe('ip');
    expect(parseProviderError({ code: 109, message: 'deleted' }, 404)?.kind).toBe('not_found');
    expect(parseProviderError({ message: '130 maintenance' }, 503)?.kind).toBe('maintenance');
  });
  it('is null for successful bodies', () => {
    expect(parseProviderError({ status: 'OK', data: {} }, 200)).toBeNull();
    expect(parseProviderError({ status: 'OK', error: '' }, 200)).toBeNull();
  });
  it('treats a bare 5xx as unknown (not a definite rejection)', () => {
    expect(parseProviderError(null, 502)?.kind).toBe('unknown');
  });
});

describe('normalizeOrderResponse', () => {
  it('accepted + pending for an OK envelope with wait status', () => {
    expect(normalizeOrderResponse({ status: 'OK', data: { order_id: 77, status: 'wait' } }, 200)).toMatchObject({
      outcome: 'accepted',
      providerOrderId: '77',
      status: 'PENDING',
    });
  });
  it('accepted + completed with delivered codes', () => {
    const r = normalizeOrderResponse({ status: 'OK', data: { order_id: 5, status: 'accept', replay_api: ['CODE-1'] } }, 200);
    expect(r).toMatchObject({ outcome: 'accepted', status: 'COMPLETED', delivery: { codes: ['CODE-1'] } });
  });
  it('unknown status text defaults to PENDING, never COMPLETED', () => {
    expect(normalizeOrderResponse({ order_id: 5, status: 'something-new' }, 200).status).toBe('PENDING');
  });
  it('rejected on explicit error code or failed status', () => {
    expect(normalizeOrderResponse({ status: 'ERROR', error: { code: 121 } }, 200).outcome).toBe('rejected');
    expect(normalizeOrderResponse({ order_id: 9, status: 'reject' }, 200).outcome).toBe('rejected');
  });
  it('ambiguous when nothing proves the outcome', () => {
    expect(normalizeOrderResponse(null, 0).outcome).toBe('ambiguous'); // timeout
    expect(normalizeOrderResponse(null, 502).outcome).toBe('ambiguous'); // gateway error
    expect(normalizeOrderResponse(null, 200, '<html>').outcome).toBe('ambiguous'); // non-JSON
    expect(normalizeOrderResponse({ status: 'OK' }, 200).outcome).toBe('ambiguous'); // no order id
  });
});

describe('parseCheckResponse', () => {
  it('matches strictly by id and ignores other orders', () => {
    const map = parseCheckResponse({ status: 'OK', data: [{ order_id: 2, status: 'accept' }] }, ['1']);
    expect(map.size).toBe(0);
  });
  it('supports arrays and objects keyed by id', () => {
    expect(parseCheckResponse([{ id: 1, status: 'reject', message: 'bad id' }], ['1']).get('1')).toMatchObject({
      status: 'FAILED',
      message: 'bad id',
    });
    expect(parseCheckResponse({ data: { '7': { status: 'wait' } } }, ['7']).get('7')?.status).toBe('PENDING');
  });
});

describe('extractDelivery', () => {
  it('collects codes from common keys', () => {
    expect(extractDelivery({ codes: [{ code: 'A' }, { code: 'B' }] })).toEqual({ codes: ['A', 'B'] });
    expect(extractDelivery({ data: { pin: '1234' } })).toEqual({ codes: ['1234'] });
    expect(extractDelivery({ status: 'accept' })).toBeUndefined();
  });
});
