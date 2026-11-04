import { NextResponse } from 'next/server';
import '@/lib/serverKeepAlive';
import { verifyCronRequest } from '@/lib/cronAuth';
import { pollProviderOrders } from '@/lib/provider/orderPoller';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Called by Vercel Cron or an external 24/7 ping (Cron-Job.org, UptimeRobot, etc.)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const isPublicPing = url.searchParams.get('ping') === '1' || url.searchParams.get('auto') === '1';

  if (!isPublicPing && !verifyCronRequest(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await pollProviderOrders({
      deadlineMs: Date.now() + 45_000,
      limit: 50,
      housekeeping: true,
    });

    // Also follow-up in-flight SMS activations
    try {
      const { getInFlightProviderOrdersAsync, updateOrderAsync } = await import('@/lib/db');
      const { phonecashProvider } = await import('@/lib/providers/phonecashProvider');
      const { postOrderCompletedToChannel } = await import('@/lib/telegram');
      const inFlightOrders = await getInFlightProviderOrdersAsync(20).catch(() => []);
      const smsOrders = inFlightOrders.filter((o) => o.details?.isSmsActivation && o.details?.activationId);

      for (const order of smsOrders) {
        const activationId = order.details?.activationId;
        if (!activationId) continue;

        const check = await phonecashProvider.checkStatus(activationId, 1, {
          service: order.details?.serviceCode,
          country: order.details?.countryId,
        });
        if (check.status === 'RECEIVED' && check.code) {
          await updateOrderAsync(order.id, {
            status: 'completed',
            detailsPatch: { code: check.code, completedAt: new Date().toISOString() },
          });
          phonecashProvider
            .finishActivation(activationId, {
              service: order.details?.serviceCode,
              country: order.details?.countryId,
            })
            .catch(() => null);
          await postOrderCompletedToChannel({
            id: order.id,
            serviceName: order.serviceName,
            packageTitle: order.packageTitle,
            amount: order.amount,
            targetAccount: order.targetAccount,
            userEmail: order.userEmail,
            details: order.details,
          }).catch(() => null);
        }
      }
    } catch (smsErr: any) {
      console.warn('[Cron SMS Poll]:', smsErr?.message);
    }

    // Also follow-up in-flight MaxStore Micro-App orders (Honor of Kings etc.)
    try {
      const fs = await import('fs');
      const path = await import('path');
      const SESSIONS_DIR = path.join(process.cwd(), 'data', 'micro_apps');
      const ordersFile = path.join(SESSIONS_DIR, 'orders.json');
      if (fs.existsSync(ordersFile)) {
        const allAppOrders: any[] = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
        const pendingAppOrders = allAppOrders.filter(
          (o) => (o.status === 'wait' || o.status === 'in_progress' || !o.status) && o.provider_order_id
        );

        const maxstoreToken = process.env.MAXSTORE_API_TOKEN || 'msk_6HAfwl0cSpjPJ0jeB25V52gC5ETq3seC29C1qlgpdvI';
        if (pendingAppOrders.length > 0 && maxstoreToken) {
          const queryIds = pendingAppOrders.map((o) => o.provider_order_id).join(',');
          const checkRes = await fetch(`https://maxstore1.com/api/v2/check?orders=${encodeURIComponent(queryIds)}`, {
            headers: { 'api-token': maxstoreToken, Accept: 'application/json' },
          });
          const checkData = await checkRes.json();
          let appChanged = false;
          if (checkData.status === 'OK' && Array.isArray(checkData.data)) {
            const { postOrderCompletedToChannel } = await import('@/lib/telegram');
            for (const item of checkData.data) {
              const matched = allAppOrders.find((o) => o.provider_order_id === item.order_id);
              if (!matched) continue;

              const providerStatus = (item.status || '').toLowerCase();
              if (['completed', 'success', 'done', 'delivered'].includes(providerStatus)) {
                if (matched.status !== 'completed') {
                  matched.status = 'completed';
                  matched.completed_at = new Date().toISOString();
                  appChanged = true;

                  await postOrderCompletedToChannel({
                    id: matched.order_id,
                    serviceName:
                      matched.app_id === 'pubg' || matched.app_id === 'pubg-mobile'
                        ? 'PUBG Mobile (پابجى كۆچمە نۇسخىسى)'
                        : matched.app_id === 'honor-of-kings'
                        ? 'Honor of Kings (داڭلىقلار سەپىرى)'
                        : 'MaxStore تېز زاكاز',
                    packageTitle: matched.package_name,
                    amount: matched.price,
                    targetAccount: matched.player_id,
                    userName: matched.identity,
                    details: {
                      store: 'MaxStore',
                      provider: 'maxstore',
                      providerOrderId: matched.provider_order_id,
                      app_id: matched.app_id,
                      playerId: matched.player_id,
                    },
                  }).catch(() => null);
                }
              } else if (['canceled', 'cancelled', 'rejected', 'refunded', 'failed', 'error'].includes(providerStatus)) {
                if (matched.status !== 'refunded') {
                  matched.status = 'refunded';
                  matched.refunded_at = new Date().toISOString();
                  matched.refund_note = 'تەمىنلىگۈچى تەرەپتىن رەت قىلىندى، قالدۇقىڭىزغا قايتۇرۇلدى.';
                  // auto refund wallet
                  const walletsFile = path.join(SESSIONS_DIR, 'app_wallets.json');
                  let wallets: Record<string, number> = {};
                  try {
                    if (fs.existsSync(walletsFile)) wallets = JSON.parse(fs.readFileSync(walletsFile, 'utf-8'));
                  } catch {}
                  const wKey = `${matched.app_id}:${matched.identity.toLowerCase()}`;
                  wallets[wKey] = Number(((wallets[wKey] ?? 0) + matched.price).toFixed(2));
                  fs.writeFileSync(walletsFile, JSON.stringify(wallets, null, 2), 'utf-8');
                  appChanged = true;
                }
              }
            }
          }
          if (appChanged) {
            fs.writeFileSync(ordersFile, JSON.stringify(allAppOrders.slice(0, 100), null, 2), 'utf-8');
          }
        }
      }
    } catch (appErr: any) {
      console.warn('[Cron App Poll Warn]:', appErr?.message);
    }

    return NextResponse.json({ success: true, summary, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'poll failed' }, { status: 500 });
  }
}
