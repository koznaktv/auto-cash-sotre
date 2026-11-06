import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import {
  getAllUsersAsync,
  getAllOrdersAsync,
  getAllDepositsAsync,
  UserRecord,
  OrderRecord,
  DepositRecord,
} from './db';

const TIMEZONE_OFFSET_HOURS = 3; // UTC+3
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const MICRO_APPS_DIR = IS_SERVERLESS ? '/tmp/micro_apps' : path.join(process.cwd(), 'data', 'micro_apps');
const BUNDLED_MICRO_APPS_DIR = path.join(process.cwd(), 'data', 'micro_apps');

export interface PlatformMetrics {
  name: string;
  currency: string;
  newCustomers: {
    name: string;
    contact: string;
    registeredAt: string;
  }[];
  newCustomersCount: number;
  totalUserBalances: number;
  inflow: {
    total: number;
    completedCount: number;
    breakdown: {
      method: string;
      amount: number;
      count: number;
    }[];
  };
  orders: {
    totalCount: number;
    totalAmount: number;
    completedCount: number;
    completedAmount: number;
    refundedCount: number;
    refundedAmount: number;
    pendingCount: number;
    pendingAmount: number;
  };
  supplier: {
    totalCost: number;
    refundAmount: number;
  };
  netProfit: number;
  serviceBreakdown?: {
    serviceName: string;
    count: number;
    amount: number;
  }[];
}

export interface FinancialReportData {
  period: 'daily' | 'weekly';
  periodLabel: string;
  periodLabelUyghur: string;
  dateRangeStr: string;
  generatedAt: string;
  autoCash: PlatformMetrics;
  maxBazar: PlatformMetrics;
}

/**
 * Returns Start & End timestamps in UTC for the requested period (evaluated in UTC+3).
 */
export function getReportDateRange(
  period: 'daily' | 'weekly' = 'daily',
  referenceDate = new Date()
): { startDate: Date; endDate: Date; periodLabel: string; periodLabelUyghur: string; dateRangeStr: string } {
  const offsetMs = TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
  const localTime = new Date(referenceDate.getTime() + offsetMs);

  const y = localTime.getUTCFullYear();
  const m = localTime.getUTCMonth();
  const d = localTime.getUTCDate();

  // End of the target day: 23:59:59.999 in local UTC+3
  const endOfDayUtc = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - offsetMs);

  if (period === 'weekly') {
    // Past 7 days: 6 days ago 00:00:00 to today 23:59:59
    const startOfWeekUtc = new Date(Date.UTC(y, m, d - 6, 0, 0, 0, 0) - offsetMs);
    const startStr = formatDateLocal(startOfWeekUtc);
    const endStr = formatDateLocal(endOfDayUtc);
    return {
      startDate: startOfWeekUtc,
      endDate: endOfDayUtc,
      periodLabel: `Weekly Summary (${startStr} - ${endStr})`,
      periodLabelUyghur: `ھەپتىلىك يىغىنچاق دوكلات (${startStr} دىن ${endStr} غىچە)`,
      dateRangeStr: `${startStr} ~ ${endStr}`,
    };
  }

  // Daily
  const startOfDayUtc = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - offsetMs);
  const dayStr = formatDateLocal(startOfDayUtc);
  return {
    startDate: startOfDayUtc,
    endDate: endOfDayUtc,
    periodLabel: `Daily Financial Report (${dayStr})`,
    periodLabelUyghur: `كۈنلۈك مالىيە دوكلاتى (${dayStr})`,
    dateRangeStr: dayStr,
  };
}

function formatDateLocal(date: Date): string {
  const local = new Date(date.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTimeLocal(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    const local = new Date(date.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
    const y = local.getUTCFullYear();
    const m = String(local.getUTCMonth() + 1).padStart(2, '0');
    const d = String(local.getUTCDate()).padStart(2, '0');
    const hh = String(local.getUTCHours()).padStart(2, '0');
    const mm = String(local.getUTCMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  } catch {
    return isoString;
  }
}

function formatUSD(val: number): string {
  return '$' + (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function readMicroAppsOrders(): any[] {
  const list: any[] = [];
  const paths = [
    path.join(MICRO_APPS_DIR, 'orders.json'),
    path.join(BUNDLED_MICRO_APPS_DIR, 'orders.json'),
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (Array.isArray(raw)) {
          list.push(...raw);
        }
      }
    } catch {}
  }
  return list;
}

function readMicroAppsWallets(): Record<string, number> {
  const paths = [
    path.join(MICRO_APPS_DIR, 'app_wallets.json'),
    path.join(BUNDLED_MICRO_APPS_DIR, 'app_wallets.json'),
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch {}
  }
  return {};
}

/**
 * Fetches and aggregates complete financial data across Auto Cash and Max Bazar.
 */
export async function fetchFinancialData(
  period: 'daily' | 'weekly' = 'daily',
  referenceDate = new Date()
): Promise<FinancialReportData> {
  const dateRange = getReportDateRange(period, referenceDate);
  const startTs = dateRange.startDate.getTime();
  const endTs = dateRange.endDate.getTime();

  // 1. Fetch Central DB records
  let allUsers: UserRecord[] = [];
  let allOrders: OrderRecord[] = [];
  let allDeposits: DepositRecord[] = [];

  try {
    allUsers = await getAllUsersAsync();
  } catch (e: any) {
    console.warn('[fetchFinancialData] getAllUsersAsync error:', e?.message);
  }

  try {
    allOrders = await getAllOrdersAsync();
  } catch (e: any) {
    console.warn('[fetchFinancialData] getAllOrdersAsync error:', e?.message);
  }

  try {
    allDeposits = await getAllDepositsAsync();
  } catch (e: any) {
    console.warn('[fetchFinancialData] getAllDepositsAsync error:', e?.message);
  }

  // 2. Fetch Micro-Apps local files (Max Bazar)
  const microAppOrders = readMicroAppsOrders();
  const microAppWallets = readMicroAppsWallets();

  // Combine and deduplicate orders by order ID
  const allOrdersMap = new Map<string, any>();
  for (const o of allOrders) {
    if (o?.id) allOrdersMap.set(o.id, o);
  }
  for (const mo of microAppOrders) {
    const mId = mo.order_id || mo.id;
    if (mId && !allOrdersMap.has(mId)) {
      allOrdersMap.set(mId, {
        id: mId,
        userId: mo.user_id,
        userEmail: mo.identity?.includes('@') ? mo.identity : undefined,
        serviceId: 'maxbazar_' + (mo.app_id || 'pubg'),
        serviceName: `[MAX-BAZAR] ${mo.app_id || 'Game Topup'}`,
        packageTitle: mo.package_name || 'Item',
        amount: Number(mo.price) || 0,
        targetAccount: mo.player_id || '',
        status: mo.status === 'completed' || mo.status === 'success' ? 'completed' : mo.status === 'refunded' ? 'refunded' : 'processing',
        createdAt: mo.created_at || new Date().toISOString(),
        details: {
          store: 'maxbazar',
          app_id: mo.app_id,
          identity: mo.identity,
          playerId: mo.player_id,
          providerOrderId: mo.provider_order_id,
        },
      });
    }
  }

  const combinedOrders = Array.from(allOrdersMap.values());

  // ---------------------------------------------------------------------------
  // A. AUTO CASH DATA CALCULATION
  // ---------------------------------------------------------------------------
  // 1. New Customers
  const autoCashNewUsers = allUsers.filter((u) => {
    if (!u.createdAt) return false;
    const t = new Date(u.createdAt).getTime();
    if (t < startTs || t > endTs) return false;
    // Exclude purely micro-app synthetic accounts
    if (u.email?.endsWith('@maxbazar.user')) return false;
    return true;
  });

  const autoCashNewCustomersList = autoCashNewUsers.map((u) => ({
    name: u.name || u.email?.split('@')[0] || 'User',
    contact: u.phone || (u.telegramUsername ? '@' + u.telegramUsername : u.telegramChatId ? `TG:${u.telegramChatId}` : u.email || '-'),
    registeredAt: formatDateTimeLocal(u.createdAt),
  }));

  // Total User Balances (Platform liability)
  const autoCashTotalBalances = allUsers.reduce((sum, u) => {
    if (u.email?.endsWith('@maxbazar.user')) return sum;
    return sum + (Number(u.balance) || 0);
  }, 0);

  // 2. Deposits Inflow
  const autoCashDeposits = allDeposits.filter((d) => {
    if (d.status !== 'completed') return false;
    const dateStr = d.reviewedAt || d.date;
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return t >= startTs && t <= endTs;
  });

  const autoCashInflowTotal = autoCashDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const methodMap = new Map<string, { amount: number; count: number }>();
  for (const d of autoCashDeposits) {
    const m = (d.method || 'ShamCash').toUpperCase();
    const cur = methodMap.get(m) || { amount: 0, count: 0 };
    cur.amount += Number(d.amount) || 0;
    cur.count += 1;
    methodMap.set(m, cur);
  }
  const autoCashMethodBreakdown = Array.from(methodMap.entries()).map(([method, val]) => ({
    method,
    amount: val.amount,
    count: val.count,
  }));

  // 3. Orders Breakdown
  const autoCashOrdersInPeriod = combinedOrders.filter((o) => {
    const isMb = o.serviceId?.startsWith('maxbazar_') || o.details?.store === 'maxbazar' || o.details?.app_id;
    if (isMb) return false;
    if (!o.createdAt) return false;
    const t = new Date(o.createdAt).getTime();
    return t >= startTs && t <= endTs;
  });

  let acTotalAmount = 0;
  let acCompletedCount = 0;
  let acCompletedAmount = 0;
  let acRefundedCount = 0;
  let acRefundedAmount = 0;
  let acPendingCount = 0;
  let acPendingAmount = 0;
  let acSupplierCost = 0;
  let acSupplierRefund = 0;

  const acServiceMap = new Map<string, { count: number; amount: number }>();

  for (const o of autoCashOrdersInPeriod) {
    const amt = Number(o.amount) || 0;
    acTotalAmount += amt;

    const sName = o.serviceName || 'General Service';
    const sCur = acServiceMap.get(sName) || { count: 0, amount: 0 };
    sCur.count += 1;
    sCur.amount += amt;
    acServiceMap.set(sName, sCur);

    // Wholesale cost estimate from details.cost or standard 88%
    const itemCost = typeof o.details?.cost === 'number' ? o.details.cost : Math.round(amt * 0.88 * 100) / 100;

    if (o.status === 'completed') {
      acCompletedCount += 1;
      acCompletedAmount += amt;
      acSupplierCost += itemCost;
    } else if (o.status === 'refunded' || o.status === 'failed' || o.status === 'cancelled') {
      acRefundedCount += 1;
      acRefundedAmount += amt;
      acSupplierRefund += itemCost;
    } else {
      acPendingCount += 1;
      acPendingAmount += amt;
    }
  }

  const acNetProfit = Math.round((acCompletedAmount - acSupplierCost) * 100) / 100;

  // ---------------------------------------------------------------------------
  // B. MAX BAZAR DATA CALCULATION
  // ---------------------------------------------------------------------------
  // 1. New Customers
  const mbNewUsers = allUsers.filter((u) => {
    if (!u.createdAt) return false;
    const t = new Date(u.createdAt).getTime();
    if (t < startTs || t > endTs) return false;
    return u.email?.endsWith('@maxbazar.user') || (u.name && u.name.toLowerCase().includes('maxbazar'));
  });

  const mbNewCustomersList = mbNewUsers.map((u) => ({
    name: u.name?.replace('@maxbazar.user', '') || 'MB User',
    contact: u.telegramUsername ? '@' + u.telegramUsername : u.phone || u.email || '-',
    registeredAt: formatDateTimeLocal(u.createdAt),
  }));

  // Max Bazar Total Balances (app_wallets.json sum)
  let mbTotalBalances = 0;
  const seenWallets = new Set<string>();
  for (const [key, bal] of Object.entries(microAppWallets)) {
    if (typeof bal === 'number') {
      const cleanKey = key.replace(/^(unified|pubg|honor-of-kings|mobile-legends):/, '');
      if (!seenWallets.has(cleanKey)) {
        seenWallets.add(cleanKey);
        mbTotalBalances += Math.max(0, bal);
      }
    }
  }

  // 2. Orders Breakdown
  const mbOrdersInPeriod = combinedOrders.filter((o) => {
    const isMb = o.serviceId?.startsWith('maxbazar_') || o.details?.store === 'maxbazar' || o.details?.app_id;
    if (!isMb) return false;
    if (!o.createdAt) return false;
    const t = new Date(o.createdAt).getTime();
    return t >= startTs && t <= endTs;
  });

  let mbTotalAmount = 0;
  let mbCompletedCount = 0;
  let mbCompletedAmount = 0;
  let mbRefundedCount = 0;
  let mbRefundedAmount = 0;
  let mbPendingCount = 0;
  let mbPendingAmount = 0;
  let mbSupplierCost = 0;
  let mbSupplierRefund = 0;

  const mbServiceMap = new Map<string, { count: number; amount: number }>();

  for (const o of mbOrdersInPeriod) {
    const amt = Number(o.amount) || 0;
    mbTotalAmount += amt;

    const appId = o.details?.app_id || (o.serviceId?.startsWith('maxbazar_') ? o.serviceId.replace('maxbazar_', '') : 'pubg');
    const label = appId === 'pubg' ? 'PUBG Mobile UC' : appId === 'honor-of-kings' ? 'Honor of Kings Tokens' : appId === 'mobile-legends' ? 'Mobile Legends Diamonds' : 'MAX-BAZAR Order';

    const cur = mbServiceMap.get(label) || { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += amt;
    mbServiceMap.set(label, cur);

    // MaxStore wholesale rate (~88% of retail or recorded cost)
    const itemCost = typeof o.details?.cost === 'number' ? o.details.cost : Math.round(amt * 0.88 * 100) / 100;

    if (o.status === 'completed') {
      mbCompletedCount += 1;
      mbCompletedAmount += amt;
      mbSupplierCost += itemCost;
    } else if (o.status === 'refunded' || o.status === 'failed' || o.status === 'cancelled') {
      mbRefundedCount += 1;
      mbRefundedAmount += amt;
      mbSupplierRefund += itemCost;
    } else {
      mbPendingCount += 1;
      mbPendingAmount += amt;
    }
  }

  const mbNetProfit = Math.round((mbCompletedAmount - mbSupplierCost) * 100) / 100;

  return {
    period,
    periodLabel: dateRange.periodLabel,
    periodLabelUyghur: dateRange.periodLabelUyghur,
    dateRangeStr: dateRange.dateRangeStr,
    generatedAt: formatDateTimeLocal(new Date().toISOString()),
    autoCash: {
      name: 'Auto Cash Platform',
      currency: 'USD',
      newCustomers: autoCashNewCustomersList,
      newCustomersCount: autoCashNewCustomersList.length,
      totalUserBalances: autoCashTotalBalances,
      inflow: {
        total: autoCashInflowTotal,
        completedCount: autoCashDeposits.length,
        breakdown: autoCashMethodBreakdown,
      },
      orders: {
        totalCount: autoCashOrdersInPeriod.length,
        totalAmount: acTotalAmount,
        completedCount: acCompletedCount,
        completedAmount: acCompletedAmount,
        refundedCount: acRefundedCount,
        refundedAmount: acRefundedAmount,
        pendingCount: acPendingCount,
        pendingAmount: acPendingAmount,
      },
      supplier: {
        totalCost: acSupplierCost,
        refundAmount: acSupplierRefund,
      },
      netProfit: acNetProfit,
      serviceBreakdown: Array.from(acServiceMap.entries()).map(([k, v]) => ({
        serviceName: k,
        count: v.count,
        amount: v.amount,
      })),
    },
    maxBazar: {
      name: 'Max Bazar Platform',
      currency: 'USD',
      newCustomers: mbNewCustomersList,
      newCustomersCount: mbNewCustomersList.length,
      totalUserBalances: mbTotalBalances,
      inflow: {
        total: mbCompletedAmount, // Micro-app inflow directly equals settled sales / talon redemptions
        completedCount: mbCompletedCount,
        breakdown: [{ method: 'Talon / ShamCash Unified', amount: mbCompletedAmount, count: mbCompletedCount }],
      },
      orders: {
        totalCount: mbOrdersInPeriod.length,
        totalAmount: mbTotalAmount,
        completedCount: mbCompletedCount,
        completedAmount: mbCompletedAmount,
        refundedCount: mbRefundedCount,
        refundedAmount: mbRefundedAmount,
        pendingCount: mbPendingCount,
        pendingAmount: mbPendingAmount,
      },
      supplier: {
        totalCost: mbSupplierCost,
        refundAmount: mbSupplierRefund,
      },
      netProfit: mbNetProfit,
      serviceBreakdown: Array.from(mbServiceMap.entries()).map(([k, v]) => ({
        serviceName: k,
        count: v.count,
        amount: v.amount,
      })),
    },
  };
}

/**
 * Generates an executive 2-page PDF document:
 * Page 1: Auto Cash Platform Report
 * Page 2: Max Bazar Platform Report
 */
export async function generateFinancialPdf(data: FinancialReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `${data.periodLabel} - Auto Cash & Max Bazar`,
          Author: 'Auto Cash & Max Bazar Financial System',
          Subject: 'Executive Financial Settlement & Reconciliation',
          CreationDate: new Date(),
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      // -----------------------------------------------------------------------
      // HELPER: DRAW METRIC CARD
      // -----------------------------------------------------------------------
      const drawMetricCard = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        val: string,
        sub: string,
        colorHex: string
      ) => {
        doc.save();
        doc.roundedRect(x, y, w, h, 6).fillAndStroke('#f8fafc', '#e2e8f0');
        doc.rect(x, y, 4, h).fill(colorHex);

        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text(title.toUpperCase(), x + 10, y + 8, {
          width: w - 16,
          align: 'left',
        });
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(val, x + 10, y + 20, {
          width: w - 16,
          align: 'left',
        });
        doc.fillColor(colorHex).fontSize(7).font('Helvetica').text(sub, x + 10, y + 38, {
          width: w - 16,
          align: 'left',
        });
        doc.restore();
      };

      // -----------------------------------------------------------------------
      // HELPER: DRAW TABLE ROW
      // -----------------------------------------------------------------------
      const drawTableRow = (
        y: number,
        cols: { text: string; w: number; align?: 'left' | 'right' | 'center'; bold?: boolean; color?: string }[],
        isHeader = false,
        bgColor?: string
      ) => {
        doc.save();
        const rowH = isHeader ? 18 : 16;
        if (bgColor) {
          doc.rect(margin, y, contentWidth, rowH).fill(bgColor);
        } else if (isHeader) {
          doc.rect(margin, y, contentWidth, rowH).fill('#f1f5f9');
        }

        let curX = margin + 6;
        for (const col of cols) {
          doc.font(col.bold || isHeader ? 'Helvetica-Bold' : 'Helvetica');
          doc.fontSize(isHeader ? 7.5 : 7.5);
          doc.fillColor(col.color || (isHeader ? '#334155' : '#1e293b'));
          doc.text(col.text, curX, y + (isHeader ? 4.5 : 4), {
            width: col.w - 12,
            align: col.align || 'left',
          });
          curX += col.w;
        }

        // Row underline
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(margin, y + rowH).lineTo(margin + contentWidth, y + rowH).stroke();
        doc.restore();
        return rowH;
      };

      // =======================================================================
      // PAGE 1: AUTO CASH PLATFORM REPORT
      // =======================================================================
      // Top Header Banner
      doc.rect(0, 0, pageWidth, 75).fill('#0a192f');
      doc.rect(0, 75, pageWidth, 3).fill('#f59e0b');

      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('AUTO CASH', margin, 18);
      doc.fillColor('#fbbf24').fontSize(8.5).font('Helvetica-Bold').text('GLOBAL DIGITAL ASSET & WHOLESALE HUB', margin, 38);
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text('Automated Multi-Channel Financial Reconciliation Ledger', margin, 50);

      // Top Right Period Badge
      doc.roundedRect(pageWidth - margin - 170, 16, 170, 44, 4).fillAndStroke('#0f2442', '#1e3a5f');
      doc.fillColor('#38bdf8').fontSize(8.5).font('Helvetica-Bold').text(data.period.toUpperCase() + ' LEDGER', pageWidth - margin - 162, 22, { align: 'right', width: 154 });
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica').text(data.dateRangeStr, pageWidth - margin - 162, 34, { align: 'right', width: 154 });
      doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica').text(`Run: ${data.generatedAt} (UTC+3)`, pageWidth - margin - 162, 46, { align: 'right', width: 154 });

      // KPI CARDS ROW (5 Cards)
      let curY = 92;
      const cardW = (contentWidth - 4 * 8) / 5;
      const cardH = 50;

      drawMetricCard(margin + 0 * (cardW + 8), curY, cardW, cardH, 'Net Profit (ساپ پايدا)', formatUSD(data.autoCash.netProfit), `Margin: ${(data.autoCash.orders.completedAmount > 0 ? (data.autoCash.netProfit / data.autoCash.orders.completedAmount * 100).toFixed(1) : 0)}%`, '#059669');
      drawMetricCard(margin + 1 * (cardW + 8), curY, cardW, cardH, 'Inflow (پۇل كىرىمى)', formatUSD(data.autoCash.inflow.total), `${data.autoCash.inflow.completedCount} Deposits`, '#2563eb');
      drawMetricCard(margin + 2 * (cardW + 8), curY, cardW, cardH, 'Orders (پۈتكەن زاكاز)', formatUSD(data.autoCash.orders.completedAmount), `${data.autoCash.orders.completedCount} / ${data.autoCash.orders.totalCount} Orders`, '#7c3aed');
      drawMetricCard(margin + 3 * (cardW + 8), curY, cardW, cardH, 'Supplier (تەمىنلىگۈچى)', formatUSD(data.autoCash.supplier.totalCost), `Refunds: ${formatUSD(data.autoCash.supplier.refundAmount)}`, '#d97706');
      drawMetricCard(margin + 4 * (cardW + 8), curY, cardW, cardH, 'User Balances (قالدۇق)', formatUSD(data.autoCash.totalUserBalances), `${allUsersCountText(data.autoCash.newCustomersCount)}`, '#0f766e');

      curY += cardH + 16;

      // SECTION 1: INFLOW & SETTLEMENT
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('1. CAPITAL INFLOW & DEPOSIT METHODS (پۇل كىرىمى)', margin, curY);
      curY += 15;

      const colWInflow = [170, 110, 120, 123.28];
      drawTableRow(curY, [
        { text: 'Deposit Channel (تۆلەش ئۇسۇلى)', w: colWInflow[0] },
        { text: 'Completed Tx Count', w: colWInflow[1], align: 'center' },
        { text: 'Settled Amount (سوممىسى)', w: colWInflow[2], align: 'right' },
        { text: 'Channel Share (%)', w: colWInflow[3], align: 'right' },
      ], true);
      curY += 18;

      if (data.autoCash.inflow.breakdown.length === 0) {
        drawTableRow(curY, [
          { text: 'ShamCash Automated Talon Protocol (TSA)', w: colWInflow[0] },
          { text: '0', w: colWInflow[1], align: 'center' },
          { text: '$0.00', w: colWInflow[2], align: 'right' },
          { text: '0.0%', w: colWInflow[3], align: 'right' },
        ]);
        curY += 16;
      } else {
        for (const item of data.autoCash.inflow.breakdown) {
          const share = data.autoCash.inflow.total > 0 ? ((item.amount / data.autoCash.inflow.total) * 100).toFixed(1) + '%' : '0.0%';
          drawTableRow(curY, [
            { text: item.method, w: colWInflow[0], bold: true },
            { text: String(item.count), w: colWInflow[1], align: 'center' },
            { text: formatUSD(item.amount), w: colWInflow[2], align: 'right', bold: true },
            { text: share, w: colWInflow[3], align: 'right' },
          ]);
          curY += 16;
        }
      }

      curY += 12;

      // SECTION 2: ORDERS FULFILLMENT & COST ANALYSIS
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('2. ORDERS RECONCILIATION & SUPPLIER EXPENSES (زاكاز ۋە تەننەرخ)', margin, curY);
      curY += 15;

      const colWOrders = [150, 80, 95, 100, 98.28];
      drawTableRow(curY, [
        { text: 'Fulfillment Status (ھالىتى)', w: colWOrders[0] },
        { text: 'Orders', w: colWOrders[1], align: 'center' },
        { text: 'Gross Turnover', w: colWOrders[2], align: 'right' },
        { text: 'Wholesale Cost', w: colWOrders[3], align: 'right' },
        { text: 'Net Realized', w: colWOrders[4], align: 'right' },
      ], true);
      curY += 18;

      drawTableRow(curY, [
        { text: 'Completed / Delivered (مۇۋەپپەقىيەتلىك)', w: colWOrders[0], bold: true, color: '#059669' },
        { text: String(data.autoCash.orders.completedCount), w: colWOrders[1], align: 'center', bold: true },
        { text: formatUSD(data.autoCash.orders.completedAmount), w: colWOrders[2], align: 'right', bold: true },
        { text: formatUSD(data.autoCash.supplier.totalCost), w: colWOrders[3], align: 'right', color: '#d97706' },
        { text: formatUSD(data.autoCash.netProfit), w: colWOrders[4], align: 'right', bold: true, color: '#059669' },
      ]);
      curY += 16;

      drawTableRow(curY, [
        { text: 'Refunded / Rejected (پۇلى قايتۇرۇلغان)', w: colWOrders[0], color: '#e11d48' },
        { text: String(data.autoCash.orders.refundedCount), w: colWOrders[1], align: 'center' },
        { text: formatUSD(data.autoCash.orders.refundedAmount), w: colWOrders[2], align: 'right', color: '#e11d48' },
        { text: formatUSD(data.autoCash.supplier.refundAmount), w: colWOrders[3], align: 'right' },
        { text: '$0.00 (Customer Refunded)', w: colWOrders[4], align: 'right', color: '#64748b' },
      ]);
      curY += 16;

      drawTableRow(curY, [
        { text: 'Pending / Processing (بېجىرىلىۋاتقان)', w: colWOrders[0], color: '#f59e0b' },
        { text: String(data.autoCash.orders.pendingCount), w: colWOrders[1], align: 'center' },
        { text: formatUSD(data.autoCash.orders.pendingAmount), w: colWOrders[2], align: 'right' },
        { text: '-', w: colWOrders[3], align: 'right' },
        { text: 'In Escrow', w: colWOrders[4], align: 'right', color: '#f59e0b' },
      ]);
      curY += 16;

      curY += 12;

      // SECTION 3: NEW CUSTOMERS ACQUIRED
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(`3. RECENT CUSTOMER ONBOARDING (يېڭى خېرىدارلار: ${data.autoCash.newCustomersCount} نەپەر)`, margin, curY);
      curY += 15;

      const colWUsers = [40, 160, 180, 143.28];
      drawTableRow(curY, [
        { text: '#', w: colWUsers[0], align: 'center' },
        { text: 'Customer Name / Handle', w: colWUsers[1] },
        { text: 'Contact / Telegram / Phone', w: colWUsers[2] },
        { text: 'Registration Timestamp', w: colWUsers[3], align: 'right' },
      ], true);
      curY += 18;

      const displayUsers = data.autoCash.newCustomers.slice(0, 8);
      if (displayUsers.length === 0) {
        drawTableRow(curY, [
          { text: '-', w: colWUsers[0], align: 'center' },
          { text: 'No new registrations in this exact reporting window', w: colWUsers[1] },
          { text: 'Active users continue to transact', w: colWUsers[2] },
          { text: '-', w: colWUsers[3], align: 'right' },
        ]);
        curY += 16;
      } else {
        displayUsers.forEach((u, i) => {
          drawTableRow(curY, [
            { text: String(i + 1), w: colWUsers[0], align: 'center' },
            { text: u.name, w: colWUsers[1], bold: true },
            { text: u.contact, w: colWUsers[2] },
            { text: u.registeredAt, w: colWUsers[3], align: 'right' },
          ]);
          curY += 16;
        });
      }

      // Page 1 Footer
      doc.save();
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(margin, pageHeight - 45).lineTo(margin + contentWidth, pageHeight - 45).stroke();
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text('AUTO CASH FINANCIAL OPERATING SYSTEM • STRICTLY CONFIDENTIAL', margin, pageHeight - 36);
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('PAGE 1 OF 2  [ AUTO CASH ]', margin, pageHeight - 36, { align: 'right', width: contentWidth });
      doc.restore();

      // =======================================================================
      // PAGE 2: MAX BAZAR PLATFORM REPORT
      // =======================================================================
      doc.addPage();

      // Top Header Banner (Emerald & Amber Luxe Theme)
      doc.rect(0, 0, pageWidth, 75).fill('#064e3b');
      doc.rect(0, 75, pageWidth, 3).fill('#10b981');

      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('MAX BAZAR', margin, 18);
      doc.fillColor('#a7f3d0').fontSize(8.5).font('Helvetica-Bold').text('MICRO-APPS & HIGH-SPEED GAMING EXCHANGE', margin, 38);
      doc.fillColor('#6ee7b7').fontSize(7.5).font('Helvetica').text('MaxStore Wholesale Integration & Telegram Mini-App Ledger', margin, 50);

      // Top Right Period Badge
      doc.roundedRect(pageWidth - margin - 170, 16, 170, 44, 4).fillAndStroke('#022c22', '#047857');
      doc.fillColor('#34d399').fontSize(8.5).font('Helvetica-Bold').text(data.period.toUpperCase() + ' LEDGER', pageWidth - margin - 162, 22, { align: 'right', width: 154 });
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica').text(data.dateRangeStr, pageWidth - margin - 162, 34, { align: 'right', width: 154 });
      doc.fillColor('#a7f3d0').fontSize(6.5).font('Helvetica').text(`Run: ${data.generatedAt} (UTC+3)`, pageWidth - margin - 162, 46, { align: 'right', width: 154 });

      curY = 92;

      // KPI CARDS ROW (5 Cards)
      drawMetricCard(margin + 0 * (cardW + 8), curY, cardW, cardH, 'Net Profit (ساپ پايدا)', formatUSD(data.maxBazar.netProfit), `Margin: ${(data.maxBazar.orders.completedAmount > 0 ? (data.maxBazar.netProfit / data.maxBazar.orders.completedAmount * 100).toFixed(1) : 0)}%`, '#059669');
      drawMetricCard(margin + 1 * (cardW + 8), curY, cardW, cardH, 'Gross Turnover (ئايلانما)', formatUSD(data.maxBazar.orders.completedAmount), `${data.maxBazar.orders.completedCount} Deliveries`, '#0891b2');
      drawMetricCard(margin + 2 * (cardW + 8), curY, cardW, cardH, 'Wholesale Cost (تەننەرخ)', formatUSD(data.maxBazar.supplier.totalCost), 'MaxStore V2 API', '#d97706');
      drawMetricCard(margin + 3 * (cardW + 8), curY, cardW, cardH, 'Refunded Orders (قايتقان)', formatUSD(data.maxBazar.orders.refundedAmount), `${data.maxBazar.orders.refundedCount} Auto-Refunds`, '#e11d48');
      drawMetricCard(margin + 4 * (cardW + 8), curY, cardW, cardH, 'Wallet Reserve (ئومۇمىي)', formatUSD(data.maxBazar.totalUserBalances), 'Unified App Wallets', '#047857');

      curY += cardH + 16;

      // SECTION 1: GAMING & APP TOP-UP SERVICES BREAKDOWN
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('1. MICRO-APP SALES & SERVICE DISTRIBUTION (ئويۇن ۋە ئەپ تەقسىماتى)', margin, curY);
      curY += 15;

      const colWAppSales = [180, 100, 120, 123.28];
      drawTableRow(curY, [
        { text: 'Micro-App / Category (مۇلازىمەت تۈرى)', w: colWAppSales[0] },
        { text: 'Orders Count', w: colWAppSales[1], align: 'center' },
        { text: 'Gross Retail (سېتىلىش باھاسى)', w: colWAppSales[2], align: 'right' },
        { text: 'Est. Wholesale Cost', w: colWAppSales[3], align: 'right' },
      ], true);
      curY += 18;

      if (!data.maxBazar.serviceBreakdown || data.maxBazar.serviceBreakdown.length === 0) {
        drawTableRow(curY, [
          { text: 'PUBG Mobile UC Topup (Global / Turkey)', w: colWAppSales[0] },
          { text: '0', w: colWAppSales[1], align: 'center' },
          { text: '$0.00', w: colWAppSales[2], align: 'right' },
          { text: '$0.00', w: colWAppSales[3], align: 'right' },
        ]);
        curY += 16;
        drawTableRow(curY, [
          { text: 'Honor of Kings Tokens (Global)', w: colWAppSales[0] },
          { text: '0', w: colWAppSales[1], align: 'center' },
          { text: '$0.00', w: colWAppSales[2], align: 'right' },
          { text: '$0.00', w: colWAppSales[3], align: 'right' },
        ]);
        curY += 16;
      } else {
        for (const s of data.maxBazar.serviceBreakdown) {
          const sCost = Math.round(s.amount * 0.88 * 100) / 100;
          drawTableRow(curY, [
            { text: s.serviceName, w: colWAppSales[0], bold: true },
            { text: String(s.count), w: colWAppSales[1], align: 'center' },
            { text: formatUSD(s.amount), w: colWAppSales[2], align: 'right', bold: true },
            { text: formatUSD(sCost), w: colWAppSales[3], align: 'right' },
          ]);
          curY += 16;
        }
      }

      curY += 12;

      // SECTION 2: ORDERS FULFILLMENT & MAXSTORE RECONCILIATION
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('2. MAXSTORE WHOLESALE RECONCILIATION (تەمىنلىگۈچى ھېساباتى)', margin, curY);
      curY += 15;

      drawTableRow(curY, [
        { text: 'Fulfillment Status (ھالىتى)', w: colWOrders[0] },
        { text: 'Orders', w: colWOrders[1], align: 'center' },
        { text: 'Gross Turnover', w: colWOrders[2], align: 'right' },
        { text: 'Wholesale Cost', w: colWOrders[3], align: 'right' },
        { text: 'Net Realized', w: colWOrders[4], align: 'right' },
      ], true);
      curY += 18;

      drawTableRow(curY, [
        { text: 'Completed / Recharged (ماقۇللانغان)', w: colWOrders[0], bold: true, color: '#059669' },
        { text: String(data.maxBazar.orders.completedCount), w: colWOrders[1], align: 'center', bold: true },
        { text: formatUSD(data.maxBazar.orders.completedAmount), w: colWOrders[2], align: 'right', bold: true },
        { text: formatUSD(data.maxBazar.supplier.totalCost), w: colWOrders[3], align: 'right', color: '#d97706' },
        { text: formatUSD(data.maxBazar.netProfit), w: colWOrders[4], align: 'right', bold: true, color: '#059669' },
      ]);
      curY += 16;

      drawTableRow(curY, [
        { text: 'Provider Rejected / Auto-Refund (قايتۇرۇلغان)', w: colWOrders[0], color: '#e11d48' },
        { text: String(data.maxBazar.orders.refundedCount), w: colWOrders[1], align: 'center' },
        { text: formatUSD(data.maxBazar.orders.refundedAmount), w: colWOrders[2], align: 'right', color: '#e11d48' },
        { text: formatUSD(data.maxBazar.supplier.refundAmount), w: colWOrders[3], align: 'right' },
        { text: '$0.00 (Protected)', w: colWOrders[4], align: 'right', color: '#64748b' },
      ]);
      curY += 16;

      drawTableRow(curY, [
        { text: 'In Queue / API Polling (تەمىنلىگۈچىدە)', w: colWOrders[0], color: '#f59e0b' },
        { text: String(data.maxBazar.orders.pendingCount), w: colWOrders[1], align: 'center' },
        { text: formatUSD(data.maxBazar.orders.pendingAmount), w: colWOrders[2], align: 'right' },
        { text: '-', w: colWOrders[3], align: 'right' },
        { text: 'Pending Provider', w: colWOrders[4], align: 'right', color: '#f59e0b' },
      ]);
      curY += 16;

      curY += 12;

      // SECTION 3: NEW ACTIVE TELEGRAM & MICRO-APP CUSTOMERS
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(`3. RECENT MICRO-APP PARTICIPANTS (يېڭى كىرگەنلەر: ${data.maxBazar.newCustomersCount} نەپەر)`, margin, curY);
      curY += 15;

      drawTableRow(curY, [
        { text: '#', w: colWUsers[0], align: 'center' },
        { text: 'Customer Identifier', w: colWUsers[1] },
        { text: 'Telegram Handle / Channel', w: colWUsers[2] },
        { text: 'Joined / Active At', w: colWUsers[3], align: 'right' },
      ], true);
      curY += 18;

      const mbDisplay = data.maxBazar.newCustomers.slice(0, 8);
      if (mbDisplay.length === 0) {
        drawTableRow(curY, [
          { text: '-', w: colWUsers[0], align: 'center' },
          { text: 'No standalone registrations in this exact reporting window', w: colWUsers[1] },
          { text: 'Active users transact through Telegram bot', w: colWUsers[2] },
          { text: '-', w: colWUsers[3], align: 'right' },
        ]);
        curY += 16;
      } else {
        mbDisplay.forEach((u, i) => {
          drawTableRow(curY, [
            { text: String(i + 1), w: colWUsers[0], align: 'center' },
            { text: u.name, w: colWUsers[1], bold: true },
            { text: u.contact, w: colWUsers[2] },
            { text: u.registeredAt, w: colWUsers[3], align: 'right' },
          ]);
          curY += 16;
        });
      }

      // Page 2 Footer
      doc.save();
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(margin, pageHeight - 45).lineTo(margin + contentWidth, pageHeight - 45).stroke();
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text('MAX BAZAR FINANCIAL OPERATING SYSTEM • STRICTLY CONFIDENTIAL', margin, pageHeight - 36);
      doc.fillColor('#064e3b').fontSize(8).font('Helvetica-Bold').text('PAGE 2 OF 2  [ MAX BAZAR ]', margin, pageHeight - 36, { align: 'right', width: contentWidth });
      doc.restore();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function allUsersCountText(newCount: number): string {
  return newCount > 0 ? `+${newCount} New Today` : 'Active Pool';
}

/**
 * Builds the executive Uyghur message caption for Telegram.
 */
export function buildTelegramReportCaption(data: FinancialReportData): string {
  const isWeekly = data.period === 'weekly';
  const icon = isWeekly ? '📈' : '📊';
  const title = isWeekly ? 'ھەپتىلىك ئومۇمىي مالىيە دوكلاتى (7 كۈنلۈك)' : 'كۈنلۈك رەسمىي مالىيە دوكلاتى';

  const ac = data.autoCash;
  const mb = data.maxBazar;

  const totalCombinedProfit = (ac.netProfit + mb.netProfit).toFixed(2);
  const totalCombinedOrders = ac.orders.completedCount + mb.orders.completedCount;
  const totalCombinedTurnover = (ac.orders.completedAmount + mb.orders.completedAmount).toFixed(2);

  return `${icon} <b>AUTO CASH & MAX BAZAR | ${title}</b>
📅 <b>ۋاقتى:</b> <code>${data.dateRangeStr}</code>
⏰ <b>چىقىرىلغان ۋاقىت:</b> <code>${data.generatedAt} (UTC+3)</code>

━━━━━━━━━━━━━━━━━━━━
💰 <b>ئومۇمىي سۇپىلار خۇلاسىسى:</b>
• ساپ پايدا (Net Profit): <b>+$${totalCombinedProfit}</b>
• مۇۋەپپەقىيەتلىك پۈتكەن زاكاز: <b>${totalCombinedOrders} دانە</b> ($${totalCombinedTurnover})

━━━━━━━━━━━━━━━━━━━━
💎 <b>1. AUTO CASH سۇپىسى:</b>
• ساپ پايدا: <b>+$${ac.netProfit.toFixed(2)}</b>
• خېرىدار پۇل كىرىمى: <b>$${ac.inflow.total.toFixed(2)}</b> (${ac.inflow.completedCount} قېتىم)
• پۈتكەن زاكاز: <b>${ac.orders.completedCount} دانە</b> ($${ac.orders.completedAmount.toFixed(2)})
• رەت قىلىنغان / قايتۇرۇلغان: <b>${ac.orders.refundedCount} دانە</b> ($${ac.orders.refundedAmount.toFixed(2)})
• تەمىنلىگۈچى چىقىمى (تەننەرخ): <b>$${ac.supplier.totalCost.toFixed(2)}</b>
• سۇپىدىكى خېرىدارلار قالدۇقى: <b>$${ac.totalUserBalances.toFixed(2)}</b>
• يېڭى كىرگەن خېرىدار: <b>${ac.newCustomersCount} نەپەر</b>

━━━━━━━━━━━━━━━━━━━━
🛍️ <b>2. MAX BAZAR سۇپىسى:</b>
• ساپ پايدا: <b>+$${mb.netProfit.toFixed(2)}</b>
• ئومۇمىي ئايلانما: <b>$${mb.orders.completedAmount.toFixed(2)}</b>
• پۈتكەن زاكاز: <b>${mb.orders.completedCount} دانە</b>
• رەت قىلىنغان / قايتۇرۇلغان: <b>${mb.orders.refundedCount} دانە</b> ($${mb.orders.refundedAmount.toFixed(2)})
• تەمىنلىگۈچى تەننەرخى (MaxStore): <b>$${mb.supplier.totalCost.toFixed(2)}</b>
• مىكرو ئەپ ھەميان قالدۇقى: <b>$${mb.totalUserBalances.toFixed(2)}</b>
• يېڭى كىرگەنلەر: <b>${mb.newCustomersCount} نەپەر</b>

📄 <i>تەپسىلىي 2 بەتلىك مالىيە تەھلىل PDF ھۆججىتى تەكشۈرۈش ئۈچۈن قوشۇپ يوللاندى.</i>
#مالىيە_دوكلاتى #${isWeekly ? 'ھەپتىلىك' : 'كۈنلۈك'}`;
}

/**
 * Sends the generated PDF report to the specified Telegram channel (@autocashkirim).
 */
export async function sendFinancialReportToTelegram(
  pdfBuffer: Buffer,
  reportData: FinancialReportData,
  targetChatId = '@autocashkirim'
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8886426395:AAHTtOA5ilIoNUfmcfVf44mCK6gJo7gjhd0';
  const filename = `${reportData.period === 'weekly' ? 'Weekly' : 'Daily'}_Financial_Report_${reportData.dateRangeStr.replace(/\s+/g, '_')}.pdf`;
  const caption = buildTelegramReportCaption(reportData);

  try {
    const formData = new FormData();
    formData.append('chat_id', targetChatId);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    formData.append('document', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), filename);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    if (!result.ok) {
      console.error('[sendFinancialReportToTelegram] Telegram error:', result);
      return { success: false, error: result.description || 'Failed to send to Telegram' };
    }

    return { success: true, messageId: result.result?.message_id };
  } catch (err: any) {
    console.error('[sendFinancialReportToTelegram] Exception:', err);
    return { success: false, error: err?.message || 'Network exception' };
  }
}

/**
 * High-level orchestration function to generate and dispatch the financial report.
 * Automatically handles Friday weekly trigger if requested.
 */
export async function runFinancialReportCron(options?: {
  period?: 'daily' | 'weekly';
  forceWeekly?: boolean;
  targetChatId?: string;
  referenceDate?: Date;
}): Promise<{
  dailySent?: boolean;
  weeklySent?: boolean;
  dailyMessageId?: number;
  weeklyMessageId?: number;
  errors: string[];
}> {
  const targetChat = options?.targetChatId || '@autocashkirim';
  const refDate = options?.referenceDate || new Date();
  const errors: string[] = [];

  // Determine local day of week in UTC+3 (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat)
  const localTime = new Date(refDate.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
  const dayOfWeek = localTime.getUTCDay();
  const isFriday = dayOfWeek === 5;

  let dailySent = false;
  let weeklySent = false;
  let dailyMessageId: number | undefined;
  let weeklyMessageId: number | undefined;

  const shouldRunDaily = options?.period !== 'weekly';
  const shouldRunWeekly = options?.period === 'weekly' || options?.forceWeekly || isFriday;

  // 1. Generate & Send Daily Report
  if (shouldRunDaily) {
    try {
      const dailyData = await fetchFinancialData('daily', refDate);
      const dailyPdf = await generateFinancialPdf(dailyData);
      const sendRes = await sendFinancialReportToTelegram(dailyPdf, dailyData, targetChat);
      if (sendRes.success) {
        dailySent = true;
        dailyMessageId = sendRes.messageId;
      } else {
        errors.push(`Daily report failed: ${sendRes.error}`);
      }
    } catch (e: any) {
      errors.push(`Daily report exception: ${e?.message}`);
    }
  }

  // 2. Generate & Send Weekly Report (Every Friday, or when forced)
  if (shouldRunWeekly) {
    try {
      const weeklyData = await fetchFinancialData('weekly', refDate);
      const weeklyPdf = await generateFinancialPdf(weeklyData);
      const sendRes = await sendFinancialReportToTelegram(weeklyPdf, weeklyData, targetChat);
      if (sendRes.success) {
        weeklySent = true;
        weeklyMessageId = sendRes.messageId;
      } else {
        errors.push(`Weekly report failed: ${sendRes.error}`);
      }
    } catch (e: any) {
      errors.push(`Weekly report exception: ${e?.message}`);
    }
  }

  return {
    dailySent,
    weeklySent,
    dailyMessageId,
    weeklyMessageId,
    errors,
  };
}
