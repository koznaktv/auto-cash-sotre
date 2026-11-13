import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  getUnifiedWalletBalance,
  deductUnifiedWalletBalance,
  creditUnifiedWalletBalance,
  findOrCreateDbUserForIdentity,
} from '@/lib/appWallets';
import {
  createOrderDirectAsync,
  updateOrderAsync,
  getAllUsersAsync,
  adjustUserBalanceAsync,
  OrderRecord,
  getAllOrdersAsync,
} from '@/lib/db';
import { getMaxStoreBalance } from '@/lib/providers/maxstoreProvider';

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const SESSIONS_DIR = IS_SERVERLESS ? path.join('/tmp', 'micro_apps') : path.join(process.cwd(), 'data', 'micro_apps');
const BUNDLED_DIR = path.join(process.cwd(), 'data', 'micro_apps');

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
  const bundledFile = path.join(BUNDLED_DIR, 'app_wallets.json');
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    if (fs.existsSync(bundledFile)) {
      const data = fs.readFileSync(bundledFile, 'utf-8');
      try { fs.writeFileSync(filePath, data, 'utf-8'); } catch {}
      return JSON.parse(data);
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

function mapProviderStatusToDb(status: string): OrderRecord['status'] {
  const s = (status || '').toLowerCase().trim();
  if (['completed', 'success', 'done', 'delivered'].includes(s)) return 'completed';
  if (['wait', 'in_progress', 'processing', 'pending'].includes(s)) return 'processing';
  if (s === 'refunded') return 'refunded';
  if (['failed', 'rejected', 'cancel', 'cancelled'].includes(s)) return 'failed';
  return 'processing';
}

function getOrders(): any[] {
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, 'orders.json');
  const bundledFile = path.join(BUNDLED_DIR, 'orders.json');
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    if (fs.existsSync(bundledFile)) {
      const data = fs.readFileSync(bundledFile, 'utf-8');
      try { fs.writeFileSync(filePath, data, 'utf-8'); } catch {}
      return JSON.parse(data);
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

    const cleanAppId = String(app_id || '').toLowerCase();
    if (cleanAppId === 'mtn' || cleanAppId === 'mtn-syria' || cleanAppId === 'syriatel') {
      return NextResponse.json({ ok: false, error: '⚠️ بۇ مۇلازىمەت ھازىرچە ۋاقتىنچە توختىتىلدى (تېخنىكىلىق رېمونت قىلىنىۋاتىدۇ).' }, { status: 400 });
    }

    // 1. Authenticate user from session cookie if present
    let verifiedUser: any = null;
    try {
      const { getSessionUser } = await import('@/lib/session');
      verifiedUser = await getSessionUser(req);
    } catch {}

    let cleanIdentity = (identity || body.user_id || '').trim().replace(/^@/, '');
    if (verifiedUser) {
      cleanIdentity = verifiedUser.telegramUsername || verifiedUser.telegramChatId || verifiedUser.email || verifiedUser.phone || verifiedUser.name || cleanIdentity;
    }

    if (!cleanIdentity || cleanIdentity.toLowerCase() === 'user') {
      if (verifiedUser) {
        cleanIdentity = verifiedUser.email || verifiedUser.id;
      } else {
        return NextResponse.json({ ok: false, error: 'ئالدى بىلەن ھېساباتىڭىزغا كىرىڭ' }, { status: 401 });
      }
    }

    if (!player_id || !player_id.trim()) {
      return NextResponse.json({ ok: false, error: 'ئويۇنچى كىملىكى (UID) كىرگۈزۈلمىدى' }, { status: 400 });
    }

    const itemPrice = Number(price);
    if (isNaN(itemPrice) || itemPrice <= 0) {
      return NextResponse.json({ ok: false, error: 'باھا خاتا' }, { status: 400 });
    }

    // Check unified MAX-BAZAR wallet balance / verified user balance
    let currentBalance = await getUnifiedWalletBalance(cleanIdentity);
    if (body.user_id && String(body.user_id).trim() !== cleanIdentity) {
      const altBalance = await getUnifiedWalletBalance(String(body.user_id).trim());
      if (altBalance > currentBalance) {
        currentBalance = altBalance;
        cleanIdentity = String(body.user_id).trim();
      }
    }
    if (verifiedUser && typeof verifiedUser.balance === 'number' && verifiedUser.balance > currentBalance) {
      currentBalance = Number(verifiedUser.balance.toFixed(2));
    }

    if (currentBalance < itemPrice) {
      return NextResponse.json({
        ok: false,
        error: `قالدۇق پۇلىڭىز يەتمىدى! قالدۇقىڭىز: $${currentBalance.toFixed(2)}، تەلەپ قىلىنغىنى: $${itemPrice.toFixed(2)}`,
        current_balance: currentBalance,
      }, { status: 400 });
    }

    const prefix = (cleanAppId === 'mobile-legends' || cleanAppId === 'mlbb') ? 'ML_' : (cleanAppId === 'pubg' ? 'PUBG_' : 'HOK_');
    const orderId = prefix + Date.now().toString(36).toUpperCase() + Math.floor(100 + Math.random() * 900);
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

        // Clean any extraneous brackets
        targetPlayerId = targetPlayerId.replace(/[()]/g, '').trim();
        targetServerId = targetServerId.replace(/[()]/g, '').trim();

        // MaxStore strictly expects params according to params_meta:
        // For MLBB: { player_id, server_id }
        // For PUBG Mobile: { Player_ID } or { player_id }
        const orderParams: Record<string, any> = {
          player_id: targetPlayerId,
          Player_ID: targetPlayerId,
        };
        if (targetServerId) {
          orderParams.server_id = targetServerId;
          orderParams.Server_ID = targetServerId;
        }

        // Server-region guard: prevent cross-server exploitation / wrong server purchases
        if (app_id === 'mobile-legends' && targetServerId) {
          const zNum = parseInt(targetServerId, 10);
          const pkgIdNum = Number(package_id);
          const isTurkeyPkg = (pkgIdNum >= 967 && pkgIdNum <= 992);
          const isSpecialPkg = (pkgIdNum >= 954 && pkgIdNum <= 966);

          if (!isNaN(zNum)) {
            const isTurkeyZone = zNum >= 4000 && zNum <= 4999;
            const isSpecialZone = zNum >= 6000 && zNum <= 6999;

            if (isTurkeyPkg && !isTurkeyZone) {
              return NextResponse.json(
                { success: false, error: 'سېرۋېر رايونى خاتا: كىملىكىڭىز تۈركىيە رايونىغا تەۋە ئەمەس، گىلوبال باھاسى بىلەن سېتىۋېلىڭ.' },
                { status: 400 }
              );
            }
            if (isSpecialPkg && !isSpecialZone) {
              return NextResponse.json(
                { success: false, error: 'سېرۋېر رايونى خاتا: كىملىكىڭىز ئالاھىدە رايونغا تەۋە ئەمەس، ئۆز رايونىڭىزنىڭ باھاسىنى تاللاڭ.' },
                { status: 400 }
              );
            }
          }
        }

        const maxstoreRes = await fetch('https://maxstore1.com/api/v2/order', {
          method: 'POST',
          headers: {
            'api-token': maxstoreToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: Number(package_id),
            qty: 1, // CRITICAL: MaxStore strictly requires qty: 1, otherwise fails with code 106 "Missing required field"
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
            maxstoreData.error ||
            'تەمىنلىگۈچى تەرەپ زاكازنى رەت قىلدى';
          providerError = detailMsg;
        }
      } catch (providerErr: any) {
        providerError = 'تەمىنلىگۈچى تورى بىلەن ئۇلىنىش ئۈزۈلدى';
      }
    }

    // 3. IF provider rejected, DO NOT deduct customer balance! Protect customer funds 100%
    if (providerError) {
      try {
        const { notifyOrderError } = await import('@/lib/telegram');
        await notifyOrderError({
          serviceName: `[MAX-BAZAR] ${getAppServiceName(app_id)} - ${package_name}`,
          amount: itemPrice,
          targetAccount: player_id.trim(),
          userName: cleanIdentity,
          userEmail: verifiedUser?.email || cleanIdentity,
          provider: 'MaxStore',
          errorMessage: providerError,
          isRefunded: false,
        }).catch(() => {});
      } catch {}

      return NextResponse.json({
        ok: false,
        error: `تەمىنلىگۈچى زاكازنى قوبۇل قىلمىدى: ${providerError}. قالدۇقىڭىزدىن پۇل كېسىلمىدى! ئايدى نومۇرىڭىزنى تەكشۈرۈپ قايتا سىناڭ.`,
        current_balance: currentBalance,
      }, { status: 400 });
    }

    // 4. Provider accepted order: Deduct price atomically from verified user and unified wallet
    let newBalance = currentBalance - itemPrice;
    if (verifiedUser && verifiedUser.id) {
      try {
        const updated = await adjustUserBalanceAsync(verifiedUser.id, -itemPrice);
        if (updated && typeof updated.balance === 'number') {
          newBalance = updated.balance;
        }
      } catch {}
      try {
        await deductUnifiedWalletBalance(cleanIdentity, itemPrice);
      } catch {}
    } else {
      const deductRes = await deductUnifiedWalletBalance(cleanIdentity, itemPrice);
      newBalance = deductRes.newBalance;
    }

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

    // 5. ALSO persist permanently into the unified central database (db.ts / Supabase)
    try {
      const dbUser = verifiedUser || await findOrCreateDbUserForIdentity(cleanIdentity);
      await createOrderDirectAsync({
        id: orderId,
        userId: dbUser?.id,
        userEmail: dbUser?.email || cleanIdentity,
        serviceId: 'maxbazar_' + app_id,
        serviceName: `[MAX-BAZAR] ${getAppServiceName(app_id)}`,
        packageTitle: package_name,
        amount: itemPrice,
        targetAccount: player_id.trim(),
        status: mapProviderStatusToDb(providerStatus),
        createdAt: new Date().toISOString(),
        details: {
          store: 'maxbazar',
          app_id,
          provider: 'maxstore',
          providerOrderId: providerOrderId || undefined,
          playerId: player_id.trim(),
          zoneId: body.zone_id || '',
          identity: cleanIdentity,
        },
      });
    } catch (dbOrderErr: any) {
      console.warn('[Central DB Order Sync Warning]:', dbOrderErr?.message);
    }

    // Notify Admin immediately about the new micro-app order (Guaranteed Await)
    try {
      const { notifyNewOrder } = await import('@/lib/telegram');
      await notifyNewOrder({
        id: orderId,
        serviceName: `[MAX-BAZAR] ${getAppServiceName(app_id)}`,
        packageTitle: package_name,
        amount: itemPrice,
        targetAccount: player_id.trim(),
        userName: cleanIdentity,
        userEmail: verifiedUser?.email || cleanIdentity,
        status: providerStatus,
        fields: {
          'سۇپا': '🟢 MAX-BAZAR (Web/Micro-App)',
          'تەمىنلىگۈچى نومۇرى': providerOrderId || '—',
          'ئەپ ID': app_id,
        },
      }).catch(() => {});
    } catch {}

    // If MaxStore immediately completed the order, broadcast to Telegram Channel (@autocash_cannel)
    if (['completed', 'success', 'done', 'delivered', 'accept', 'ok'].includes(providerStatus.toLowerCase())) {
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

    // Authenticate session user from cookie if available
    let sessionUser: any = null;
    try {
      const { getSessionUser } = await import('@/lib/session');
      sessionUser = await getSessionUser(req);
    } catch {}

    const localOrders = getOrders();
    let cleanId = (identity || '').trim().replace(/^@/, '').toLowerCase();
    if ((!cleanId || cleanId === 'user') && sessionUser) {
      cleanId = (sessionUser.email || sessionUser.telegramUsername || sessionUser.name || sessionUser.phone || '').toLowerCase().trim();
    }

    // Fetch and merge central DB orders
    let dbOrders: any[] = [];
    try {
      const allDb = await getAllOrdersAsync();
      dbOrders = allDb.map((o) => {
        const details = (o.details as any) || {};
        let orderAppId = details.app_id;
        if (!orderAppId) {
          if (o.serviceId?.startsWith('maxbazar_')) {
            orderAppId = o.serviceId.replace('maxbazar_', '');
          } else if (o.serviceName?.toLowerCase().includes('pubg')) {
            orderAppId = 'pubg';
          } else if (o.serviceName?.toLowerCase().includes('honor')) {
            orderAppId = 'honor-of-kings';
          } else {
            orderAppId = 'general';
          }
        }
        return {
          order_id: o.id,
          provider_order_id: details.providerOrderId || null,
          app_id: orderAppId,
          identity: details.identity || o.userEmail || '',
          player_id: o.targetAccount || details.playerId || '',
          package_id: details.packageId || null,
          package_name: o.packageTitle || o.serviceName,
          price: o.amount,
          status: o.status,
          created_at: o.createdAt,
          user_id: o.userId,
        };
      });
    } catch (e: any) {
      console.warn('[getAllOrdersAsync in apps/order warn]:', e?.message);
    }

    const orderMap = new Map<string, any>();
    for (const o of localOrders) {
      if (o?.order_id) orderMap.set(o.order_id, o);
    }
    for (const o of dbOrders) {
      if (o?.order_id && !orderMap.has(o.order_id)) {
        orderMap.set(o.order_id, o);
      }
    }
    const allOrders = Array.from(orderMap.values());

    // Resolve all linked identities for the user (email, telegram, chat_id, id)
    let userIdentities = new Set<string>();
    if (sessionUser) {
      if (sessionUser.id) userIdentities.add(sessionUser.id.toLowerCase().trim());
      if (sessionUser.email) userIdentities.add(sessionUser.email.toLowerCase().trim());
      if (sessionUser.telegramUsername) userIdentities.add(sessionUser.telegramUsername.toLowerCase().trim().replace(/^@/, ''));
      if (sessionUser.telegramChatId) userIdentities.add(String(sessionUser.telegramChatId).trim());
      if (sessionUser.name) userIdentities.add(sessionUser.name.toLowerCase().trim());
    }
    if (cleanId) {
      userIdentities.add(cleanId);
      try {
        const dbUser = await findOrCreateDbUserForIdentity(cleanId);
        if (dbUser) {
          if (dbUser.email) userIdentities.add(dbUser.email.toLowerCase().trim());
          if (dbUser.telegramUsername) userIdentities.add(dbUser.telegramUsername.toLowerCase().trim().replace(/^@/, ''));
          if (dbUser.telegramChatId) userIdentities.add(String(dbUser.telegramChatId).trim());
          if (dbUser.id) userIdentities.add(dbUser.id.toLowerCase().trim());
          if (dbUser.name) userIdentities.add(dbUser.name.toLowerCase().trim());
        }
      } catch {}
    }

    let filtered = allOrders.filter((o) => {
      if (app_id && app_id !== 'all' && o.app_id !== app_id) return false;
      if (!isAdmin && cleanId) {
        const orderIden = (o.identity || '').toLowerCase().trim().replace(/^@/, '');
        const orderUserId = (o.user_id || '').toLowerCase().trim();
        const matches = userIdentities.has(orderIden) || (orderUserId && userIdentities.has(orderUserId));
        if (!matches) return false;
      }
      return true;
    });

    // Live Sync with MaxStore Wholesale API for pending orders
    const maxstoreToken = process.env.MAXSTORE_API_TOKEN || 'msk_6HAfwl0cSpjPJ0jeB25V52gC5ETq3seC29C1qlgpdvI';
    const pendingOrders = filtered.filter(
      (o) => (['wait', 'in_progress', 'pending_provider', 'processing', 'pending'].includes(o.status) || !o.status) && o.provider_order_id
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
              'completed', 'success', 'done', 'delivered', 'ok', 'accept', '1', '3',
              'تم', 'مكتمل', 'مكتملة', 'تم الشحن', 'مشحون', 'تم التنفيذ', 'تم التسليم', 'تم الطلب', 'منجز'
            ].includes(providerStatus) ||
              providerStatus.includes('مكتمل') ||
              providerStatus.includes('تم الشحن') ||
              providerStatus.includes('مشحون') ||
              providerStatus.includes('تم التنفيذ') ||
              providerStatus.includes('منجز');

            const isFailed = [
              'canceled', 'cancelled', 'rejected', 'reject', 'refunded', 'failed', 'error',
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

                // Sync status to central DB
                updateOrderAsync(matchedOrder.order_id, {
                  status: 'completed',
                  detailsPatch: {
                    completed_at: matchedOrder.completed_at,
                    completedAt: matchedOrder.completed_at,
                    providerStatus: 'COMPLETED',
                    needsReview: false,
                  },
                }).catch(() => null);

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

                // Sync refund to central DB
                updateOrderAsync(matchedOrder.order_id, {
                  status: 'refunded',
                  detailsPatch: {
                    refunded_at: matchedOrder.refunded_at,
                    refund_note: matchedOrder.refund_note,
                  },
                }).catch(() => null);
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
        if (!isAdmin && cleanId) {
        const orderIden = (o.identity || '').toLowerCase().trim().replace(/^@/, '');
        const orderUserId = (o.user_id || '').toLowerCase().trim();
        const matches = userIdentities.has(orderIden) || (orderUserId && userIdentities.has(orderUserId));
        if (!matches) return false;
      }
        return true;
      });
    }

    // Get live unified wallet balance
    let liveBalance: number | null = null;
    if (sessionUser && typeof sessionUser.balance === 'number') {
      liveBalance = Number(sessionUser.balance.toFixed(2));
    }
    if (cleanId) {
      const unifiedBal = await getUnifiedWalletBalance(cleanId);
      if (liveBalance === null || unifiedBal > liveBalance) {
        liveBalance = unifiedBal;
      }
    }

    // Calculate admin statistics, profit, and members if in admin mode
    let stats: any = null;
    let members: any[] = [];
    let providerBalance: number | null = null;

    if (isAdmin) {
      // 1. Fetch live wholesale balance from MaxStore API
      try {
        const balRes = await getMaxStoreBalance();
        if (balRes?.ok && typeof balRes.balance === 'number') {
          providerBalance = balRes.balance;
        }
      } catch (provErr: any) {
        console.warn('[Fetch MaxStore balance warn]:', provErr?.message);
      }

      // 2. Calculate pure net profit (completed orders revenue minus wholesale cost ~88%)
      const completedOrders = allOrders.filter((o) => o.status === 'completed');
      const completedRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
      const estimatedWholesaleCost = Math.round(completedRevenue * 0.88 * 100) / 100;
      const netProfit = Math.round((completedRevenue - estimatedWholesaleCost) * 100) / 100;
      const profitMarginPercent = completedRevenue > 0 ? Number(((netProfit / completedRevenue) * 100).toFixed(1)) : 12.0;

      // 3. Aggregate all MAX-BAZAR members
      try {
        const allDbUsers = await getAllUsersAsync();
        const orderIdentityMap = new Map<string, { count: number; spent: number; lastActive?: string }>();
        allOrders.forEach((o) => {
          const key = (o.identity || '').toLowerCase().trim();
          if (!key) return;
          const cur = orderIdentityMap.get(key) || { count: 0, spent: 0, lastActive: o.created_at };
          cur.count += 1;
          if (o.status === 'completed') cur.spent += Number(o.price || 0);
          if (o.created_at && (!cur.lastActive || o.created_at > cur.lastActive)) cur.lastActive = o.created_at;
          orderIdentityMap.set(key, cur);
        });

        const maxbazarUsers = allDbUsers.filter((u) => {
          const cleanName = (u.name || '').toLowerCase();
          const cleanTg = (u.telegramUsername || '').toLowerCase();
          const cleanEmail = (u.email || '').toLowerCase();
          return (
            cleanEmail.includes('@maxbazar.user') ||
            Boolean(u.telegramUsername) ||
            orderIdentityMap.has(cleanName) ||
            orderIdentityMap.has(cleanTg) ||
            orderIdentityMap.has(cleanEmail.split('@')[0])
          );
        });

        members = maxbazarUsers.map((u) => {
          const cleanName = (u.name || '').toLowerCase();
          const cleanTg = (u.telegramUsername || '').toLowerCase();
          const uStats = orderIdentityMap.get(cleanTg) || orderIdentityMap.get(cleanName) || { count: 0, spent: 0, lastActive: undefined };
          return {
            id: u.id,
            name: u.name || u.telegramUsername || 'خېرىدار',
            username: u.telegramUsername || u.name,
            telegramChatId: u.telegramChatId || undefined,
            phone: u.phone || undefined,
            email: u.email,
            balance: Number((u.balance || 0).toFixed(2)),
            totalSpent: Number(uStats.spent.toFixed(2)),
            orderCount: uStats.count,
            vipTier: u.vipTier || 'vip1',
            lastActive: uStats.lastActive || u.createdAt,
            createdAt: u.createdAt,
          };
        });
      } catch (usersErr: any) {
        console.warn('[Fetch MAX-BAZAR members warn]:', usersErr?.message);
      }

      stats = {
        totalOrders: allOrders.length,
        totalRevenue: Number(allOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0).toFixed(2)),
        completedCount: completedOrders.length,
        pendingCount: allOrders.filter((o) => o.status === 'wait' || o.status === 'in_progress' || !o.status).length,
        refundedCount: allOrders.filter((o) => o.status === 'refunded').length,
        netProfit,
        profitMarginPercent,
        providerBalance,
        memberCount: members.length,
      };
    }

    return NextResponse.json({
      ok: true,
      orders: filtered,
      live_balance: liveBalance,
      stats,
      members,
      provider_balance: providerBalance,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, new_status, refund_amount, action } = body;

    // Direct User Balance Adjustment from Admin
    if (action === 'adjust_user_balance') {
      const { user_id, identity, delta } = body;
      const numDelta = Number(delta);
      if (isNaN(numDelta) || numDelta === 0) {
        return NextResponse.json({ ok: false, error: 'سومما خاتا كىرگۈزۈلدى' }, { status: 400 });
      }
      if (user_id) {
        await adjustUserBalanceAsync(user_id, numDelta);
      } else if (identity) {
        if (numDelta > 0) {
          await creditUnifiedWalletBalance(identity, numDelta);
        } else {
          await deductUnifiedWalletBalance(identity, Math.abs(numDelta));
        }
      }
      return NextResponse.json({ ok: true, message: 'قالدۇق پۇل مۇۋەپپەقىيەتلىك تەڭشەلدى!' });
    }

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

    // Sync status change to central DB
    try {
      await updateOrderAsync(order.order_id, {
        status: mapProviderStatusToDb(order.status),
        detailsPatch: {
          completed_at: order.completed_at,
          refunded_at: order.refunded_at,
          refund_note: order.refund_note,
        },
      });
    } catch (syncDbErr: any) {
      console.warn('[PATCH central DB sync warn]:', syncDbErr?.message);
    }

    return NextResponse.json({ ok: true, order });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
