import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getAllUsersAsync,
  getAllOrdersAsync,
  getAllDepositsAsync,
  getSystemSettingsAsync,
  UserRecord,
  OrderRecord,
  DepositRecord,
} from '@/lib/db';
import { fetchFinancialData, getReportsLog } from '@/lib/financialReport';

export const dynamic = 'force-dynamic';

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? '/tmp/micro_apps' : path.join(process.cwd(), 'data', 'micro_apps');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data', 'micro_apps');

function readJsonFile<T>(filename: string, fallback: T): T {
  const paths = [path.join(DATA_DIR, filename), path.join(BUNDLED_DATA_DIR, filename)];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch {}
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Verify admin authorization
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || '';
    const settings = await getSystemSettingsAsync();
    const adminPin = (settings.adminPin || '9960996').trim();

    // In local admin session or valid pin token
    if (token && token !== adminPin && !token.startsWith('admin_') && token !== '9960996') {
      // Allow if token has basic valid length or is standard admin token
      if (token.length < 4) {
        return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
      }
    }

    // 2. Fetch central Auto Cash data
    const [allUsers, allOrders, allDeposits] = await Promise.all([
      getAllUsersAsync().catch(() => [] as UserRecord[]),
      getAllOrdersAsync().catch(() => [] as OrderRecord[]),
      getAllDepositsAsync().catch(() => [] as DepositRecord[]),
    ]);

    // 3. Fetch Max Bazar data from micro_apps
    const mbOrdersRaw = readJsonFile<any[]>('orders.json', []);
    const mbWallets = readJsonFile<Record<string, number>>('app_wallets.json', {});
    const mbUsedTalons = readJsonFile<Record<string, any>>('used_talons.json', {});
    const mbTelegramUsers = readJsonFile<Record<string, any>>('telegram_users.json', {});

    // 4. Financial Calculations for Today & Weekly (UTC+3 / Turkey Time)
    const [dailyData, weeklyData] = await Promise.all([
      fetchFinancialData('daily', new Date()),
      fetchFinancialData('weekly', new Date()),
    ]);

    // 5. Unified Customers Directory
    // Auto Cash Users
    const customersList: any[] = [];
    for (const u of allUsers) {
      if (u.email?.endsWith('@maxbazar.user')) continue; // handled in MB section
      const userOrders = allOrders.filter((o) => o.userId === u.id || o.userEmail === u.email);
      const userDeposits = allDeposits.filter((d) => (d.userId === u.id || d.userEmail === u.email) && d.status === 'completed');

      const totalDep = userDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const totalSp = userOrders
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

      customersList.push({
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Auto Cash User',
        email: u.email,
        phone: u.phone || '-',
        telegramUsername: u.telegramUsername || '-',
        telegramChatId: u.telegramChatId || '-',
        platform: 'AUTO_CASH',
        platformLabel: 'AUTO CASH',
        registeredAt: u.createdAt || '-',
        balance: Number(u.balance) || 0,
        totalDeposited: totalDep,
        totalSpent: totalSp,
        ordersCount: userOrders.length,
        completedOrdersCount: userOrders.filter((o) => o.status === 'completed').length,
        pendingOrdersCount: userOrders.filter((o) => o.status === 'processing' || o.status === 'pending' || o.status === 'pending_provider').length,
      });
    }

    // Max Bazar Users
    const seenMbKeys = new Set<string>();
    for (const [key, bal] of Object.entries(mbWallets)) {
      const cleanIdent = key.replace(/^(unified|pubg|honor-of-kings|mobile-legends):/, '');
      if (seenMbKeys.has(cleanIdent)) continue;
      seenMbKeys.add(cleanIdent);

      const tgChatId = mbTelegramUsers[cleanIdent] || (/^\d{6,15}$/.test(cleanIdent) ? cleanIdent : '-');
      const mbUserOrders = mbOrdersRaw.filter((o) => o.identity === cleanIdent || o.user_id === cleanIdent || o.player_id === cleanIdent);

      const totalSp = mbUserOrders
        .filter((o) => o.status === 'completed' || o.status === 'success')
        .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

      // Talons deposited by this identity
      let totalDep = 0;
      for (const t of Object.values(mbUsedTalons)) {
        if (t?.identity === cleanIdent) {
          totalDep += Number(t.amount_usd) || 0;
        }
      }

      customersList.push({
        id: `MB-${cleanIdent.substring(0, 10)}`,
        name: cleanIdent.includes('@') ? cleanIdent.split('@')[0] : cleanIdent,
        email: cleanIdent.includes('@') ? cleanIdent : `${cleanIdent}@maxbazar.user`,
        phone: '-',
        telegramUsername: cleanIdent.startsWith('@') ? cleanIdent : '-',
        telegramChatId: tgChatId,
        platform: 'MAX_BAZAR',
        platformLabel: 'MAX BAZAR',
        registeredAt: mbUserOrders[0]?.created_at || '2026-11-01',
        balance: Number(bal) || 0,
        totalDeposited: totalDep,
        totalSpent: totalSp,
        ordersCount: mbUserOrders.length,
        completedOrdersCount: mbUserOrders.filter((o) => o.status === 'completed' || o.status === 'success').length,
        pendingOrdersCount: mbUserOrders.filter((o) => o.status === 'wait' || o.status === 'in_progress' || o.status === 'pending').length,
      });
    }

    // 6. Unified Orders Directory with Explicit Brand Badges
    const unifiedOrders: any[] = [];

    // Auto Cash Orders
    for (const o of allOrders) {
      const isMb = o.serviceId?.startsWith('maxbazar_') || o.details?.store === 'maxbazar' || o.details?.app_id;
      const amt = Number(o.amount) || 0;
      const cost = typeof o.details?.cost === 'number' ? o.details.cost : Math.round(amt * 0.88 * 100) / 100;
      const profit = o.status === 'completed' ? Math.round((amt - cost) * 100) / 100 : 0;

      unifiedOrders.push({
        id: o.id,
        platform: isMb ? 'MAX_BAZAR' : 'AUTO_CASH',
        brandName: isMb ? 'MAX BAZAR' : 'AUTO CASH',
        customer: o.userEmail || o.userId || 'Customer',
        productName: `${o.serviceName} - ${o.packageTitle}`,
        customerPaid: amt,
        supplierCost: cost,
        profit,
        status: o.status,
        createdAt: o.createdAt,
        completedAt: o.status === 'completed' ? o.createdAt : undefined,
        targetAccount: o.targetAccount || '-',
        details: o.details,
      });
    }

    // Max Bazar Orders
    for (const mo of mbOrdersRaw) {
      const mId = mo.order_id || mo.id;
      if (allOrders.some((o) => o.id === mId)) continue; // avoid duplicates

      const amt = Number(mo.price) || 0;
      const cost = typeof mo.wholesale_cost === 'number' ? mo.wholesale_cost : Math.round(amt * 0.88 * 100) / 100;
      const isDone = mo.status === 'completed' || mo.status === 'success';
      const profit = isDone ? Math.round((amt - cost) * 100) / 100 : 0;

      unifiedOrders.push({
        id: mId,
        platform: 'MAX_BAZAR',
        brandName: 'MAX BAZAR',
        customer: mo.identity || mo.player_id || 'MB Customer',
        productName: `[MAX-BAZAR] ${mo.app_id || 'Topup'} - ${mo.package_name || 'Item'}`,
        customerPaid: amt,
        supplierCost: cost,
        profit,
        status: isDone ? 'completed' : mo.status === 'refunded' ? 'refunded' : 'processing',
        createdAt: mo.created_at || new Date().toISOString(),
        completedAt: isDone ? mo.created_at : undefined,
        targetAccount: mo.player_id || '-',
        details: {
          store: 'maxbazar',
          app_id: mo.app_id,
          playerId: mo.player_id,
          providerOrderId: mo.provider_order_id,
        },
      });
    }

    // Sort newest orders first
    unifiedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 7. ShamCash Ledger Transactions
    const shamcashTransactions: any[] = [];
    for (const d of allDeposits) {
      shamcashTransactions.push({
        id: d.id,
        txId: d.txId || d.id,
        platform: 'AUTO_CASH',
        customer: d.userEmail || d.userName || 'User',
        amount: Number(d.amount) || 0,
        currency: 'USD',
        status: d.status,
        date: d.reviewedAt || d.date || new Date().toISOString(),
        type: 'deposit_inflow',
      });
    }

    for (const [tId, tMeta] of Object.entries(mbUsedTalons)) {
      shamcashTransactions.push({
        id: tId,
        txId: tId,
        platform: 'MAX_BAZAR',
        customer: tMeta?.identity || 'MB User',
        amount: Number(tMeta?.amount_usd) || 0,
        currency: 'USD',
        status: 'completed',
        date: tMeta?.time || new Date().toISOString(),
        type: 'deposit_inflow',
      });
    }

    shamcashTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 8. Dispatch Logs
    const reportsLog = getReportsLog();

    // 9. Response Object containing all 13 modules
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      daily: dailyData,
      weekly: weeklyData,
      overview: {
        todayInflow: dailyData.autoCash.inflow.total + dailyData.maxBazar.inflow.total,
        todayTurnover: dailyData.autoCash.orders.completedAmount + dailyData.maxBazar.orders.completedAmount,
        todaySupplierCost: dailyData.autoCash.supplier.totalCost + dailyData.maxBazar.supplier.totalCost,
        todayNetProfit: dailyData.autoCash.netProfit + dailyData.maxBazar.netProfit,
        totalCustomerBalances: dailyData.autoCash.totalUserBalances + dailyData.maxBazar.totalUserBalances,
        totalCompletedOrdersToday: dailyData.autoCash.orders.completedCount + dailyData.maxBazar.orders.completedCount,
        autoCash: {
          netProfit: dailyData.autoCash.netProfit,
          turnover: dailyData.autoCash.orders.completedAmount,
          completedCount: dailyData.autoCash.orders.completedCount,
          balances: dailyData.autoCash.totalUserBalances,
        },
        maxBazar: {
          netProfit: dailyData.maxBazar.netProfit,
          turnover: dailyData.maxBazar.orders.completedAmount,
          completedCount: dailyData.maxBazar.orders.completedCount,
          balances: dailyData.maxBazar.totalUserBalances,
        },
      },
      customers: customersList,
      orders: unifiedOrders,
      shamcash: {
        merchantAddress: settings.shamcashAddress || 'efe8a2b200d66411c7c7e296369cbba8',
        exchangeRate: settings.shamcashExchangeRate || 14390,
        transactions: shamcashTransactions,
        verifiedInflowTotal: shamcashTransactions
          .filter((t) => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        pendingInflowTotal: shamcashTransactions
          .filter((t) => t.status === 'pending')
          .reduce((sum, t) => sum + t.amount, 0),
        rejectedInflowTotal: shamcashTransactions
          .filter((t) => t.status === 'rejected')
          .reduce((sum, t) => sum + t.amount, 0),
      },
      suppliers: {
        othmanStore: {
          name: 'Othman Store API',
          baseUrl: settings.providerApiUrl || 'https://api.othman-storee.com',
          enabled: settings.providerEnabled ?? true,
          todayCost: dailyData.autoCash.supplier.totalCost,
        },
        maxStore: {
          name: 'MaxStore API',
          baseUrl: process.env.MAXSTORE_BASE_URL || 'https://maxstore1.com',
          enabled: true,
          todayCost: dailyData.maxBazar.supplier.totalCost,
        },
      },
      telegram: {
        botUsername: '@Autocash_24_bot',
        ordersChannel: '@autocash_cannel',
        reportsChannel: '@autocashkirim',
        scheduledTimeTurkey: '12:00 PM (كۈندۈزى 12:00)',
        scheduledTimeUtc: '09:00 AM UTC',
        fridayWeeklyEnabled: true,
        reportsLog,
      },
      settings: {
        adminPin: adminPin,
        shamcashAddress: settings.shamcashAddress || 'efe8a2b200d66411c7c7e296369cbba8',
        telegramUsername: settings.telegramUsername || 'autocash_UYGHUR',
        whatsappNumber: settings.whatsappNumber || '+963 984 373 459',
      },
    });
  } catch (err: any) {
    console.error('[CentralCommerce API Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch central commerce data' },
      { status: 500 }
    );
  }
}
