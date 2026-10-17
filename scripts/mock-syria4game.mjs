#!/usr/bin/env node
/**
 * Local stand-in for the syria4game reseller API, for end-to-end tests without spending money.
 *
 *   node scripts/mock-syria4game.mjs            # listens on :4545
 *   SYRIA4GAME_BASE_URL=http://localhost:4545 SYRIA4GAME_API_TOKEN=mock-token-123456 npm run dev
 *
 * The `playerId` sent with an order picks the scenario:
 *   ok-complete (default) | ok-pending | reject-later | reject | slow | http500 | html | err121 | err109
 * Response shapes are guesses (the real bodies are undocumented): replace them with captured
 * real responses from the admin "API call log" once a live token is available.
 */
import http from 'node:http';

const PORT = Number(process.env.MOCK_PORT || 4545);
const TOKEN = process.env.MOCK_TOKEN || 'mock-token-123456';

const categories = [
  { id: 1, parent_id: null, name: 'ألعاب' },
  { id: 2, parent_id: 1, name: 'Mock Legends', image: 'https://syria4game.com/mock.webp' },
  { id: 3, parent_id: null, name: 'تطبيقات الدردشة' },
  { id: 4, parent_id: 3, name: 'Mock Chat Coins' },
  { id: 5, parent_id: null, name: 'بطاقات' },
  { id: 6, parent_id: 5, name: 'Mock Gift Card' },
];

const products = [
  { id: 101, name: '100 Diamonds', price: 1.0, category_id: 2, product_type: 'package', input_schema: [], params: ['playerId'] },
  { id: 102, name: '500 Diamonds', price: 4.5, category_id: 2, product_type: 'package', input_schema: [], params: ['playerId'] },
  { id: 201, name: 'Chat Coins', price: 0.000016, category_id: 4, product_type: 'amount', qty_values: { min: 1000, max: 1000000 }, params: ['playerId'] },
  { id: 301, name: 'Gift Card $5', price: 5.0, category_id: 6, product_type: 'package', input_schema: [], params: [] },
].map((p) => ({ currency: 'USD', available: true, parent_id: p.category_id, category_name: '', qty_values: null, ...p }));

const orders = new Map(); // providerOrderId -> { status, codes, checks, scenario }
const byUuid = new Map(); // order_uuid -> providerOrderId
let nextOrderId = 9000;

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};
// Real error shape (sahl-cash): {"status":"ERROR","error_code":121,"message":"Token error"}
const error = (res, code, message, status = 200) => send(res, status, { status: 'ERROR', error_code: code, message });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  console.log(req.method, path + url.search);

  if (url.searchParams.has('api-token') || url.searchParams.has('api_token')) {
    console.error('!! token sent in the URL — the docs forbid this');
    return error(res, 121, 'token must not be in the URL', 400);
  }
  if (path === '/client/api/ping') return send(res, 200, { status: 'OK', pong: true });
  if (req.headers['api-token'] !== TOKEN) return error(res, 121, 'Invalid API token', 401);

  if (path === '/client/api/profile') return send(res, 200, { status: 'OK', data: { balance: 100.5, currency: 'USD', name: 'Mock Reseller' } });
  if (path === '/client/api/catalog') return send(res, 200, { status: 'OK', flat_categories: categories, products, count: products.length });
  if (path === '/client/api/products') {
    const id = Number(url.searchParams.get('products_id'));
    if (!id) return send(res, 200, products);
    const product = products.find((p) => p.id === id);
    return product ? send(res, 200, [product]) : error(res, 109, 'Product not found', 404);
  }

  const order = path.match(/^\/client\/api\/newOrder\/(\d+)\/params$/);
  if (order) {
    const product = products.find((p) => p.id === Number(order[1]));
    if (!product) return error(res, 109, 'Product not found', 404);
    const uuid = url.searchParams.get('order_uuid') || '';
    if (byUuid.has(uuid)) {
      const id = byUuid.get(uuid);
      return send(res, 200, { status: 'OK', data: { order_id: id, status: orders.get(id).status, duplicate: true } });
    }
    const scenario = url.searchParams.get('playerId') || 'ok-complete';
    switch (scenario) {
      case 'reject':
        return error(res, 140, 'Invalid player id', 400);
      case 'http500':
        return send(res, 500, 'Internal Server Error', 'text/plain');
      case 'html':
        return send(res, 200, '<html><body>Maintenance</body></html>', 'text/html');
      case 'err121':
        return error(res, 121, 'Invalid API token');
      case 'err109':
        return error(res, 109, 'Product deleted');
      case 'slow':
        await new Promise((r) => setTimeout(r, 30000));
        break;
      default:
        break;
    }
    const id = `ID_${(nextOrderId++).toString(16)}`;
    const pending = scenario === 'ok-pending' || scenario === 'reject-later';
    orders.set(id, { status: pending ? 'wait' : 'accept', codes: pending ? [] : [`CODE-${id}`], checks: 0, scenario });
    byUuid.set(uuid, id);
    // The order exists but the response is lost: only a uuid lookup can recover it
    if (scenario === 'lost') return send(res, 502, '<html>Bad Gateway</html>', 'text/html');
    return send(res, 200, {
      status: 'OK',
      // Documented shape: data.data echoes the params, replay_api is [{replay:[...]}]
      data: {
        order_id: id,
        status: orders.get(id).status,
        price: product.price,
        data: { playerId: scenario },
        replay_api: orders.get(id).codes.length ? [{ replay: orders.get(id).codes }] : null,
      },
    });
  }

  if (path === '/client/api/check') {
    let ids = (url.searchParams.get('orders') || '').replace(/[[\]]/g, '').split(',').filter(Boolean);
    if (url.searchParams.get('uuid') === '1') ids = ids.map((u) => byUuid.get(u)).filter(Boolean);
    const data = ids
      .filter((id) => orders.has(id))
      .map((id) => {
        const o = orders.get(id);
        o.checks++;
        if (o.status === 'wait' && o.checks >= 1) {
          o.status = o.scenario === 'reject-later' ? 'reject' : 'accept';
          if (o.status === 'accept') o.codes = [`CODE-${id}`];
        }
        return { order_id: id, status: o.status, replay_api: o.codes, ...(o.status === 'reject' ? { message: 'Rejected by mock' } : {}) };
      });
    return send(res, 200, { status: 'OK', data });
  }

  return error(res, 404, `Unknown endpoint ${path}`, 404);
});

server.listen(PORT, () => console.log(`mock syria4game listening on http://localhost:${PORT} (token ${TOKEN})`));
