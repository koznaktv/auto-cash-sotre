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
  if (appId === 'honor-of-kings' || appId === 'hok') return 'Honor of Kings (داڭلىقلار سەپىرى)';
  if (appId === 'mobile-legends' || appId === 'mlbb') return 'Mobile Legends (ئالماس ۋە كارتىلار)';
  if (appId === 'mtn-syria' || appId === 'mtn') return 'MTN سۈرىيە (تېلېفون ۋە تور)';
  if (appId === 'syriatel') return 'Syriatel سۈرىيەتەل (تېلېفون ۋە تور)';
  return 'MAX-BAZAR تېز زاكاز';
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
        const pIdStr = player_id.trim();
        let targetPlayerId = pIdStr;
        let targetServerId = '';

        // Extract ID and Server/Zone if formatted as "123456 (2045)"
        const match = pIdStr.match(/^([^(]+)(?:\(([^)]+)\))?/);
        if (match) {
          targetPlayerId = match[1].trim();
          if (match[2]) targetServerId = match[2].trim();
        }
        if (body.zone_id) {
          targetServerId = String(body.zone_id).trim();
        }

        const orderParams: any = {
          player_id: targetPlayerId,
        };
        if (targetServerId) {
          orderParams.server_id = targetServerId;
        }

        const maxstoreRes = await fetch('https://maxstore1.com/api/v2/order', {
          method: 'POST',
          headers: {
            'api-token': maxstoreToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: Number(package_id),
            order_uuid: orderUuid,
            params: orderParams,
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
    const app_id = searchParams.get('app_id');
    const isAdmin = searchParams.get('admin') === 'true';

    const allOrders = getOrders();
    const cleanId = (identity || '').trim().replace(/^@/, '').toLowerCase();

    let filtered = allOrders.filter((o) => {
      if (app_id && app_id !== 'all' && o.app_id !== app_id) return false;
      if (!isAdmin && cleanId && (o.identity || '').toLowerCase() !== cleanId) return false;
      return true;
    });

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

            const providerStatus = (item.status || '').toLowerCase().trim();

            const isCompleted = [
              'completed', 'success', 'done', 'delivered', 'ok', '1', '3',
              'تم', 'مكتمل', 'مكتملة', 'تم الشحن', 'مشحون', 'تم التنفيذ', 'تم التسليم', 'تم الطلب', 'منجز'
            ].includes(providerStatus) ||
              providerStatus.includes('مكتمل') ||
              providerStatus.includes('تم الشحن') ||
              providerStatus.includes('مشحون') ||
              providerStatus.includes('تم التنفيذ') ||
              providerStatus.includes('منجز');

            const isFailed = [
              'canceled', 'cancelled', 'rejected', 'refunded', 'failed', 'error',
              '-1', '4', '5', '6',
              'ملغي', 'مرفوض', 'فشل', 'خطأ'
            ].includes(providerStatus) ||
              providerStatus.includes('ملغي') ||
              providerStatus.includes('مرفوض') ||
              providerStatus.includes('فشل');

            // 1. COMPLETED: Order finished successfully!
            if (isCompleted) {
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
            else if (isFailed) {
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
        fs.writeFileSync(filePath, JSON.stringify(allOrders.slice(0, 500), null, 2), 'utf-8');
      } catch {}
      // Refresh filtered list after changes
      filtered = allOrders.filter((o) => {
        if (app_id && app_id !== 'all' && o.app_id !== app_id) return false;
        if (!isAdmin && cleanId && (o.identity || '').toLowerCase() !== cleanId) return false;
        return true;
      });
    }

    // Get live unified wallet balance
    const liveBalance = cleanId ? await getUnifiedWalletBalance(cleanId) : null;

    // Calculate admin statistics if in admin mode
    const stats = isAdmin
      ? {
          totalOrders: allOrders.length,
          totalRevenue: allOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0),
          completedCount: allOrders.filter((o) => o.status === 'completed').length,
          pendingCount: allOrders.filter((o) => o.status === 'wait' || o.status === 'in_progress' || !o.status).length,
          refundedCount: allOrders.filter((o) => o.status === 'refunded').length,
        }
      : null;

    return NextResponse.json({
      ok: true,
      orders: filtered,
      live_balance: liveBalance,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, new_status, refund_amount, action } = body;
    if (!order_id) {
      return NextResponse.json({ ok: false, error: 'order_id is required' }, { status: 400 });
    }

    const allOrders = getOrders();
    const orderIndex = allOrders.findIndex((o) => o.order_id === order_id);
    if (orderIndex === -1) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    const order = allOrders[orderIndex];

    // Manual broadcast action
    if (action === 'broadcast_channel') {
      try {
        const { postOrderCompletedToChannel } = await import('@/lib/telegram');
        const sent = await postOrderCompletedToChannel({
          id: order.order_id,
          serviceName: getAppServiceName(order.app_id),
          packageTitle: order.package_name,
          amount: order.price,
          targetAccount: order.player_id,
          userName: order.identity,
          details: {
            app_id: order.app_id,
            playerId: order.player_id,
            zoneId: order.zone_id,
            nickname: order.nickname,
          },
          force: true,
        });
        return NextResponse.json({
          ok: sent,
          message: sent ? 'زاكاز قانالغا مۇۋەپپەقىيەتلىك چىقىرىلدى!' : 'قانالغا يوللاش مەغلۇپ بولدى',
          order,
        });
      } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || 'Broadcast failed' }, { status: 500 });
      }
    }

    const prevStatus = order.status;
    order.status = new_status;

    if (new_status === 'completed') {
      order.completed_at = new Date().toISOString();

      // Broadcast completed order to Telegram Channel (@autocash_cannel)
      try {
        const { postOrderCompletedToChannel } = await import('@/lib/telegram');
        await postOrderCompletedToChannel({
          id: order.order_id,
          serviceName: getAppServiceName(order.app_id),
          packageTitle: order.package_name,
          amount: order.price,
          targetAccount: order.player_id,
          userName: order.identity,
          details: {
            app_id: order.app_id,
            playerId: order.player_id,
            zoneId: order.zone_id,
            nickname: order.nickname,
          },
          force: true,
        });
      } catch (broadErr: any) {
        console.warn('[Broadcast to Channel Warn]:', broadErr?.message);
      }
    } else if (new_status === 'refunded') {
      order.refunded_at = new Date().toISOString();
      if (prevStatus !== 'refunded') {
        const refundVal = refund_amount !== undefined ? Number(refund_amount) : Number(order.price || 0);
        if (refundVal > 0 && order.identity) {
          await creditUnifiedWalletBalance(order.identity, refundVal);
          order.refund_note = `باشقۇرغۇچى تەرىپىدىن قالدۇق قايتۇرۇلدى: $${refundVal.toFixed(2)}`;
        }
      }
    }

    const filePath = path.join(SESSIONS_DIR, 'orders.json');
    fs.writeFileSync(filePath, JSON.stringify(allOrders, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, order });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
