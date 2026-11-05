import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  getUnifiedWalletBalance,
  deductUnifiedWalletBalance,
  creditUnifiedWalletBalance,
} from '@/lib/appWallets';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'micro_apps');
function ensureDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    try {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    } catch {}
  }
}

function getAppWallets(): Record<string, number> {
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_wallets.json');
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveAppWallet(key: string, balance: number) {
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'app_wallets.json');
  try {
    const wallets = getAppWallets();
    wallets[key] = Math.max(0, Number(balance.toFixed(2)));
    fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2), 'utf-8');
  } catch {}
}

function getAppServiceName(appId: string): string {
  if (appId === 'pubg' || appId === 'pubg-mobile') return 'PUBG Mobile (پابجى كۆچمە نۇسخىسى)';
  if (appId === 'honor-of-kings') return 'Honor of Kings (داڭلىقلار سەپىرى)';
  return 'MaxStore تېز زاكاز';
}

function getOrders(): any[] {
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'orders.json');
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveOrder(order: any) {
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'orders.json');
  try {
    const orders = getOrders();
    orders.unshift(order);
    fs.writeFileSync(filePath, JSON.stringify(orders.slice(0, 100), null, 2), 'utf-8');
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identity, player_id, package_id, package_name, price, app_id = 'honor-of-kings' } = body;

    const cleanIdentity = (identity || '').trim().replace(/^@/, '');
    if (!cleanIdentity) {
      return NextResponse.json({ ok: false, error: 'ئالدى بىلەن تېلېگرامما كودى ئارقىلىق كىرىڭ' }, { status: 401 });
    }

    if (!player_id || !player_id.trim()) {
      return NextResponse.json({ ok: false, error: 'ئويۇنچى كىملىكى (UID) كىرگۈزۈلمىدى' }, { status: 400 });
    }

    const itemPrice = Number(price);
    if (isNaN(itemPrice) || itemPrice <= 0) {
      return NextResponse.json({ ok: false, error: 'باھا خاتا' }, { status: 400 });
    }

    // Check unified MAX-BAZAR wallet balance
    const currentBalance = await getUnifiedWalletBalance(cleanIdentity);

    if (currentBalance < itemPrice) {
      return NextResponse.json({
        ok: false,
        error: `قالدۇق پۇلىڭىز يەتمىدى! قالدۇقىڭىز: $${currentBalance.toFixed(2)}، تەلەپ قىلىنغىنى: $${itemPrice.toFixed(2)}`,
        current_balance: currentBalance,
      }, { status: 400 });
    }

    const orderId = 'HOK_' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1000);
    let providerOrderId: string | null = null;
    let providerStatus = 'in_progress';
    let providerError: string | null = null;

    // 2. Dispatch real wholesale order directly to MaxStore API
    const maxstoreToken = process.env.MAXSTORE_API_TOKEN || 'msk_6HAfwl0cSpjPJ0jeB25V52gC5ETq3seC29C1qlgpdvI';
    if (package_id && maxstoreToken) {
      try {
        const orderUuid = crypto.randomUUID();
        const maxstoreRes = await fetch('https://maxstore1.com/api/v2/order', {
          method: 'POST',
          headers: {
            'api-token': maxstoreToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: Number(package_id),
            order_uuid: orderUuid,
            params: {
              player_id: player_id.trim(),
            },
          }),
        });
        const maxstoreData = await maxstoreRes.json();
        if (maxstoreData.status === 'OK' && maxstoreData.data?.order_id) {
          providerOrderId = maxstoreData.data.order_id;
          providerStatus = maxstoreData.data.status || 'in_progress';
        } else {
          const detailMsg = maxstoreData.detail?.message || 
            (typeof maxstoreData.detail === 'string' ? maxstoreData.detail : null) ||
            (Array.isArray(maxstoreData.detail) ? maxstoreData.detail[0]?.msg : null) ||
            'تەمىنلىگۈچى تەرەپ زاكازنى رەت قىلدى';
          providerError = detailMsg;
        }
      } catch (providerErr: any) {
        providerError = 'تەمىنلىگۈچى تورى بىلەن ئۇلىنىش ئۈزۈلدى';
      }
    }

    // 3. IF provider rejected, DO NOT deduct customer balance! Protect customer funds 100%
    if (providerError) {
      return NextResponse.json({
        ok: false,
        error: `تەمىنلىگۈچى زاكازنى قوبۇل قىلمىدى: ${providerError}. قالدۇقىڭىزدىن پۇل كېسىلمىدى! ئايدى نومۇرىڭىزنى تەكشۈرۈپ قايتا سىناڭ.`,
        current_balance: currentBalance,
      }, { status: 400 });
    }

    // 4. Provider accepted order: Deduct price atomically from unified wallet
    const deductRes = await deductUnifiedWalletBalance(cleanIdentity, itemPrice);
    const newBalance = deductRes.newBalance;

    const newOrder = {
      order_id: orderId,
      provider_order_id: providerOrderId,
      app_id,
      identity: cleanIdentity,
      player_id: player_id.trim(),
      package_id,
      package_name,
      price: itemPrice,
      status: providerStatus,
      created_at: new Date().toISOString(),
    };

    saveOrder(newOrder);

    // If MaxStore immediately completed the order, broadcast to Telegram Channel (@autocash_cannel)
    if (['completed', 'success', 'done', 'delivered'].includes(providerStatus.toLowerCase())) {
      try {
        const { postOrderCompletedToChannel } = await import('@/lib/telegram');
        postOrderCompletedToChannel({
          id: newOrder.order_id,
          serviceName: getAppServiceName(newOrder.app_id),
          packageTitle: newOrder.package_name,
          amount: newOrder.price,
          targetAccount: newOrder.player_id,
          userName: newOrder.identity,
          details: {
            store: 'MaxStore',
            provider: 'maxstore',
            providerOrderId: newOrder.provider_order_id,
            app_id: newOrder.app_id,
            playerId: newOrder.player_id,
          },
        }).catch(() => null);
      } catch (e: any) {
        console.warn('[MaxStore Immediate Broadcast Warn]:', e?.message);
      }
    }

    return NextResponse.json({
      ok: true,
      order: newOrder,
      new_balance: newBalance,
      provider_order_id: providerOrderId,
      message: 'زاكاز تەمىنلىگۈچىگە تاپشۇرۇلدى! ⚡ قاچىلاش بېجىرىلىۋاتىدۇ.',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const identity = searchParams.get('identity');
    const app_id = searchParams.get('app_id') || 'honor-of-kings';

    const allOrders = getOrders();
    const cleanId = (identity || '').trim().replace(/^@/, '').toLowerCase();
    let filtered = allOrders.filter(
      (o) => o.app_id === app_id && (!cleanId || o.identity.toLowerCase() === cleanId)
    );

    // Live Sync with MaxStore Wholesale API for pending orders
    const maxstoreToken = process.env.MAXSTORE_API_TOKEN || 'msk_6HAfwl0cSpjPJ0jeB25V52gC5ETq3seC29C1qlgpdvI';
    const pendingOrders = filtered.filter(
      (o) => (o.status === 'wait' || o.status === 'in_progress' || !o.status) && o.provider_order_id
    );

    let ordersChanged = false;

    if (pendingOrders.length > 0 && maxstoreToken) {
      try {
        const queryIds = pendingOrders.map((o) => o.provider_order_id).join(',');
        const checkRes = await fetch(`https://maxstore1.com/api/v2/check?orders=${encodeURIComponent(queryIds)}`, {
          headers: {
            'api-token': maxstoreToken,
            Accept: 'application/json',
          },
        });
        const checkData = await checkRes.json();
        if (checkData.status === 'OK' && Array.isArray(checkData.data)) {
          for (const item of checkData.data) {
            const matchedOrder = allOrders.find((o) => o.provider_order_id === item.order_id);
            if (!matchedOrder) continue;

            const providerStatus = (item.status || '').toLowerCase();

            // 1. COMPLETED: Order finished successfully!
            if (['completed', 'success', 'done', 'delivered'].includes(providerStatus)) {
              if (matchedOrder.status !== 'completed') {
                matchedOrder.status = 'completed';
                matchedOrder.completed_at = new Date().toISOString();
                ordersChanged = true;

                // Broadcast completed order to Telegram Channel (@autocash_cannel)
                try {
                  const { postOrderCompletedToChannel } = await import('@/lib/telegram');
                  postOrderCompletedToChannel({
                    id: matchedOrder.order_id,
                    serviceName: getAppServiceName(matchedOrder.app_id),
                    packageTitle: matchedOrder.package_name,
                    amount: matchedOrder.price,
                    targetAccount: matchedOrder.player_id,
                    userName: matchedOrder.identity,
                    details: {
                      store: 'MaxStore',
                      provider: 'maxstore',
                      providerOrderId: matchedOrder.provider_order_id,
                      app_id: matchedOrder.app_id,
                      playerId: matchedOrder.player_id,
                    },
                  }).catch(() => null);
                } catch (broadErr: any) {
                  console.warn('[Broadcast to Channel Warn]:', broadErr?.message);
                }
              }
            }
            // 2. REJECTED / CANCELED: Automatic Refund & Notification!
            else if (['canceled', 'cancelled', 'rejected', 'refunded', 'failed', 'error'].includes(providerStatus)) {
              if (matchedOrder.status !== 'refunded') {
                matchedOrder.status = 'refunded';
                matchedOrder.refunded_at = new Date().toISOString();
                matchedOrder.refund_note = 'تەمىنلىگۈچى تەرەپتىن رەت قىلىندى، $ ' + matchedOrder.price.toFixed(2) + ' قالدۇقىڭىزغا قايتۇرۇلدى.';

                // Auto-refund balance back to customer unified wallet
                await creditUnifiedWalletBalance(matchedOrder.identity, matchedOrder.price);
                ordersChanged = true;
              }
            }
          }
        }
      } catch (syncErr: any) {
        console.warn('[MaxStore Sync Exception]:', syncErr?.message);
      }
    }

    if (ordersChanged) {
      try {
        const filePath = path.join(SESSIONS_DIR, 'orders.json');
        fs.writeFileSync(filePath, JSON.stringify(allOrders.slice(0, 100), null, 2), 'utf-8');
      } catch {}
      // Refresh filtered list after changes
      filtered = allOrders.filter(
        (o) => o.app_id === app_id && (!cleanId || o.identity.toLowerCase() === cleanId)
      );
    }

    // Get live unified wallet balance
    const liveBalance = cleanId ? await getUnifiedWalletBalance(cleanId) : null;

    return NextResponse.json({
      ok: true,
      orders: filtered,
      live_balance: liveBalance,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server Error' }, { status: 500 });
  }
}
