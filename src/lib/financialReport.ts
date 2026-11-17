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

function getUyghurFontPaths() {
  const candidates = [
    path.join(process.cwd(), 'public', 'fonts'),
    path.join(process.cwd(), 'AUTO_CASH', 'public', 'fonts'),
    path.join(__dirname, '..', '..', '..', 'public', 'fonts'),
    path.join(__dirname, '..', '..', 'public', 'fonts'),
  ];
  for (const dir of candidates) {
    const regular = path.join(dir, 'ALKATIPBasmaTom.ttf');
    const bold = path.join(dir, 'ALKATIPBasmaTom-Bold.ttf');
    if (fs.existsSync(regular)) {
      return { regular, bold: fs.existsSync(bold) ? bold : regular };
    }
  }
  return null;
}

function isUyghurText(str: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);
}

function prepareUyghurRtl(str: string): string {
  if (!str) return '';
  // Reverse digits and percentages so fontkit rtla renders numbers LTR
  return str.replace(/([0-9]+(\.[0-9]+)?%?)/g, (match) => {
    return match.split('').reverse().join('');
  });
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
        margins: { top: 36, bottom: 20, left: 36, right: 36 },
        info: {
          Title: `${data.periodLabel} - Auto Cash & Max Bazar`,
          Author: 'Auto Cash & Max Bazar Financial System',
          Subject: 'Executive Financial Settlement & Reconciliation',
          CreationDate: new Date(),
        },
      });

      const fontPaths = getUyghurFontPaths();
      let hasAlkatip = false;
      if (fontPaths) {
        try {
          doc.registerFont('Alkatip', fontPaths.regular);
          doc.registerFont('Alkatip-Bold', fontPaths.bold);
          hasAlkatip = true;
        } catch (fontErr) {
          console.warn('Failed to register Alkatip font:', fontErr);
        }
      }

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      // -----------------------------------------------------------------------
      // HELPER: RENDER TEXT (AUTO DETECT UYGHUR / LATIN)
      // -----------------------------------------------------------------------
      const renderPdfText = (
        text: string,
        x: number,
        y: number,
        options: {
          bold?: boolean;
          size?: number;
          color?: string;
          align?: 'left' | 'right' | 'center';
          width?: number;
          forceLatin?: boolean;
          lineBreak?: boolean;
        } = {}
      ) => {
        const { bold = false, size = 8, color = '#1e293b', align, width, forceLatin = false, lineBreak = false } = options;
        doc.save();
        doc.fontSize(size).fillColor(color);

        const isUy = !forceLatin && isUyghurText(text);
        if (isUy && hasAlkatip) {
          doc.font(bold ? 'Alkatip-Bold' : 'Alkatip');
          doc.text(prepareUyghurRtl(text), x, y, {
            width,
            align: align || 'right',
            features: ['rtla'],
            lineBreak,
          });
        } else {
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
          doc.text(text, x, y, {
            width,
            align: align || 'left',
            lineBreak,
          });
        }
        doc.restore();
      };

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

        renderPdfText(title, x + 8, y + 8, {
          bold: true,
          size: 8,
          color: '#475569',
          width: w - 16,
          align: 'right',
        });

        renderPdfText(val, x + 8, y + 20, {
          bold: true,
          size: 13,
          color: '#0f172a',
          width: w - 16,
          align: 'left',
          forceLatin: true,
        });

        renderPdfText(sub, x + 8, y + 36, {
          size: 7,
          color: colorHex,
          width: w - 16,
          align: 'right',
        });

        doc.restore();
      };

      // -----------------------------------------------------------------------
      // HELPER: DRAW TABLE ROW
      // -----------------------------------------------------------------------
      const drawTableRow = (
        y: number,
        cols: { text: string; w: number; align?: 'left' | 'right' | 'center'; bold?: boolean; color?: string; forceLatin?: boolean }[],
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
          const isUy = !col.forceLatin && isUyghurText(col.text);
          const defaultAlign = isUy ? 'right' : 'left';

          renderPdfText(col.text, curX, y + (isHeader ? 4.5 : 4), {
            bold: col.bold || isHeader,
            size: 7.5,
            color: col.color || (isHeader ? '#334155' : '#1e293b'),
            align: col.align || defaultAlign,
            width: col.w - 12,
            forceLatin: col.forceLatin,
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

      renderPdfText('AUTO CASH', margin, 18, { bold: true, size: 18, color: '#ffffff', forceLatin: true });
      renderPdfText('مەركىزى رەقەملىك سودا ۋە توپ تارقىتىش سۇپىسى', margin, 40, { bold: true, size: 9, color: '#fbbf24' });
      renderPdfText('سودا سۇپىسىنىڭ كۈندىلىك مالىيە ۋە زاكاز ھېسابات دوكلاتى', margin, 54, { size: 7.5, color: '#94a3b8' });

      // Top Right Period Badge
      doc.roundedRect(pageWidth - margin - 170, 16, 170, 44, 4).fillAndStroke('#0f2442', '#1e3a5f');
      renderPdfText(data.periodLabel, pageWidth - margin - 162, 22, { bold: true, size: 8.5, color: '#38bdf8', align: 'right', width: 154 });
      renderPdfText(data.dateRangeStr, pageWidth - margin - 162, 35, { size: 8, color: '#ffffff', align: 'right', width: 154, forceLatin: true });
      renderPdfText(`Run: ${data.generatedAt} (UTC+3)`, pageWidth - margin - 162, 47, { size: 6.5, color: '#94a3b8', align: 'right', width: 154, forceLatin: true });

      // KPI CARDS ROW (5 Cards)
      let curY = 92;
      const cardW = (contentWidth - 4 * 8) / 5;
      const cardH = 50;

      const acMarginPct = (data.autoCash.orders.completedAmount > 0 ? (data.autoCash.netProfit / data.autoCash.orders.completedAmount * 100).toFixed(1) : '0.0');
      drawMetricCard(margin + 0 * (cardW + 8), curY, cardW, cardH, 'ساپ پايدا', formatUSD(data.autoCash.netProfit), `پايدا نىسبىتى: ${acMarginPct}%`, '#059669');
      drawMetricCard(margin + 1 * (cardW + 8), curY, cardW, cardH, 'پۇل كىرىمى', formatUSD(data.autoCash.inflow.total), `${data.autoCash.inflow.completedCount} قېتىم تولۇقلاندى`, '#2563eb');
      drawMetricCard(margin + 2 * (cardW + 8), curY, cardW, cardH, 'پۈتكەن زاكاز', formatUSD(data.autoCash.orders.completedAmount), `${data.autoCash.orders.completedCount} / ${data.autoCash.orders.totalCount} زاكاز`, '#7c3aed');
      drawMetricCard(margin + 3 * (cardW + 8), curY, cardW, cardH, 'تەمىنلىگۈچى چىقىمى', formatUSD(data.autoCash.supplier.totalCost), `قايتۇرۇلغىنى: ${formatUSD(data.autoCash.supplier.refundAmount)}`, '#d97706');
      drawMetricCard(margin + 4 * (cardW + 8), curY, cardW, cardH, 'خېرىدارلار قالدۇقى', formatUSD(data.autoCash.totalUserBalances), `${data.autoCash.newCustomersCount > 0 ? `+${data.autoCash.newCustomersCount} يېڭى خېرىدار` : 'پائال ھېساباتلار'}`, '#0f766e');

      curY += cardH + 16;

      // SECTION 1: INFLOW & SETTLEMENT
      renderPdfText('1. شامكەش ۋە ھېساباتقا كىرگەن ئامانەت پۇللار', margin, curY, { bold: true, size: 10, color: '#0f172a' });
      curY += 16;

      const colWInflow = [170, 110, 120, 123.28];
      drawTableRow(curY, [
        { text: 'پۇل كىرىش يولى', w: colWInflow[0] },
        { text: 'تاماملانغان قېتىم سانى', w: colWInflow[1], align: 'center' },
        { text: 'دەلىللەنگەن سومما', w: colWInflow[2], align: 'right' },
        { text: 'ئىگىلىگەن نىسبىتى', w: colWInflow[3], align: 'right' },
      ], true);
      curY += 18;

      if (data.autoCash.inflow.breakdown.length === 0) {
        drawTableRow(curY, [
          { text: 'شامكەش ئاپتوماتىك پۇل كىرىمى', w: colWInflow[0] },
          { text: '0', w: colWInflow[1], align: 'center', forceLatin: true },
          { text: '$0.00', w: colWInflow[2], align: 'right', forceLatin: true },
          { text: '0.0%', w: colWInflow[3], align: 'right', forceLatin: true },
        ]);
        curY += 16;
      } else {
        for (const item of data.autoCash.inflow.breakdown) {
          const share = data.autoCash.inflow.total > 0 ? ((item.amount / data.autoCash.inflow.total) * 100).toFixed(1) + '%' : '0.0%';
          drawTableRow(curY, [
            { text: item.method, w: colWInflow[0], bold: true },
            { text: String(item.count), w: colWInflow[1], align: 'center', forceLatin: true },
            { text: formatUSD(item.amount), w: colWInflow[2], align: 'right', bold: true, forceLatin: true },
            { text: share, w: colWInflow[3], align: 'right', forceLatin: true },
          ]);
          curY += 16;
        }
      }

      curY += 12;

      // SECTION 2: ORDERS FULFILLMENT & COST ANALYSIS
      renderPdfText('2. زاكازلار ۋە تەمىنلىگۈچى تەرەپ تەننەرخى', margin, curY, { bold: true, size: 10, color: '#0f172a' });
      curY += 16;

      const colWOrders = [150, 80, 95, 100, 98.28];
      drawTableRow(curY, [
        { text: 'زاكاز ھالىتى', w: colWOrders[0] },
        { text: 'زاكاز سانى', w: colWOrders[1], align: 'center' },
        { text: 'خېرىدار چىقىمى', w: colWOrders[2], align: 'right' },
        { text: 'تەمىنلىگۈچى تەننەرخى', w: colWOrders[3], align: 'right' },
        { text: 'ساپ پايدا', w: colWOrders[4], align: 'right' },
      ], true);
      curY += 18;

      drawTableRow(curY, [
        { text: 'مۇۋەپپەقىيەتلىك تاماملانغان', w: colWOrders[0], bold: true, color: '#059669' },
        { text: String(data.autoCash.orders.completedCount), w: colWOrders[1], align: 'center', bold: true, forceLatin: true },
        { text: formatUSD(data.autoCash.orders.completedAmount), w: colWOrders[2], align: 'right', bold: true, forceLatin: true },
        { text: formatUSD(data.autoCash.supplier.totalCost), w: colWOrders[3], align: 'right', color: '#d97706', forceLatin: true },
        { text: formatUSD(data.autoCash.netProfit), w: colWOrders[4], align: 'right', bold: true, color: '#059669', forceLatin: true },
      ]);
      curY += 16;

      drawTableRow(curY, [
        { text: 'پۇلى قايتۇرۇلغان / رەت قىلىنغان', w: colWOrders[0], color: '#e11d48' },
        { text: String(data.autoCash.orders.refundedCount), w: colWOrders[1], align: 'center', forceLatin: true },
        { text: formatUSD(data.autoCash.orders.refundedAmount), w: colWOrders[2], align: 'right', color: '#e11d48', forceLatin: true },
        { text: formatUSD(data.autoCash.supplier.refundAmount), w: colWOrders[3], align: 'right', forceLatin: true },
        { text: '$0.00 • قايتۇرۇلدى', w: colWOrders[4], align: 'right', color: '#64748b' },
      ]);
      curY += 16;

      drawTableRow(curY, [
        { text: 'تەمىنلىگۈچىدە ساقلىنىۋاتقان', w: colWOrders[0], color: '#f59e0b' },
        { text: String(data.autoCash.orders.pendingCount), w: colWOrders[1], align: 'center', forceLatin: true },
        { text: formatUSD(data.autoCash.orders.pendingAmount), w: colWOrders[2], align: 'right', forceLatin: true },
        { text: '-', w: colWOrders[3], align: 'right', forceLatin: true },
        { text: 'ساقلىنىۋاتىدۇ', w: colWOrders[4], align: 'right', color: '#f59e0b' },
      ]);
      curY += 16;

      curY += 12;

      // SECTION 3: NEW CUSTOMERS ACQUIRED
      renderPdfText(`3. يېڭىدىن قوشۇلغان خېرىدارلار تىزىملىكى: ${data.autoCash.newCustomersCount} نەپەر`, margin, curY, { bold: true, size: 10, color: '#0f172a' });
      curY += 16;

      const colWUsers = [40, 160, 180, 143.28];
      drawTableRow(curY, [
        { text: '#', w: colWUsers[0], align: 'center' },
        { text: 'خېرىدار ئىسمى', w: colWUsers[1] },
        { text: 'ئالاقە / تېلېگرامما / تېلېفون', w: colWUsers[2] },
        { text: 'تىزىملاتقان ۋاقتى', w: colWUsers[3], align: 'right' },
      ], true);
      curY += 18;

      const displayUsers = data.autoCash.newCustomers.slice(0, 8);
      if (displayUsers.length === 0) {
        drawTableRow(curY, [
          { text: '-', w: colWUsers[0], align: 'center', forceLatin: true },
          { text: 'بۇ دوكلات مەزگىلىدە يېڭى تىزىملاتقانلار يوق', w: colWUsers[1] },
          { text: 'پائال خېرىدارلار داۋاملىق سودا قىلماقتا', w: colWUsers[2] },
          { text: '-', w: colWUsers[3], align: 'right', forceLatin: true },
        ]);
        curY += 16;
      } else {
        displayUsers.forEach((u, i) => {
          drawTableRow(curY, [
            { text: String(i + 1), w: colWUsers[0], align: 'center', forceLatin: true },
            { text: u.name, w: colWUsers[1], bold: true },
            { text: u.contact, w: colWUsers[2] },
            { text: u.registeredAt, w: colWUsers[3], align: 'right', forceLatin: true },
          ]);
          curY += 16;
        });
      }

      // Page 1 Footer
      doc.save();
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(margin, pageHeight - 45).lineTo(margin + contentWidth, pageHeight - 45).stroke();
      renderPdfText('مەركىزى مالىيە باشقۇرۇش سىستېمىسى • مەخپىي ھۆججەت', margin, pageHeight - 32, { size: 7.5, color: '#64748b', lineBreak: false });
      renderPdfText('1-بەت • ئاپتو كەشنىڭ كۈندىلىك دوكلاتى', margin, pageHeight - 32, { bold: true, size: 8, color: '#0f172a', align: 'right', width: contentWidth, lineBreak: false });
      doc.restore();

      // =======================================================================
      // PAGE 2: MAX BAZAR PLATFORM REPORT
      // =======================================================================
      doc.addPage();

      // Top Header Banner (Emerald & Amber Luxe Theme)
      doc.rect(0, 0, pageWidth, 75).fill('#064e3b');
      doc.rect(0, 75, pageWidth, 3).fill('#10b981');

      renderPdfText('MAX BAZAR', margin, 18, { bold: true, size: 18, color: '#ffffff', forceLatin: true });
      renderPdfText('مىكرو ئەپلەر ۋە ئويۇن مۇلازىمەت سۇپىسى', margin, 40, { bold: true, size: 9, color: '#a7f3d0' });
      renderPdfText('تەمىنلىگۈچى ۋە تېلېگرامما كىچىك ئەپلىرىنىڭ كۈندىلىك دوكلاتى', margin, 54, { size: 7.5, color: '#6ee7b7' });

      // Top Right Period Badge
      doc.roundedRect(pageWidth - margin - 170, 16, 170, 44, 4).fillAndStroke('#022c22', '#047857');
      renderPdfText(data.periodLabel, pageWidth - margin - 162, 22, { bold: true, size: 8.5, color: '#34d399', align: 'right', width: 154 });
      renderPdfText(data.dateRangeStr, pageWidth - margin - 162, 35, { size: 8, color: '#ffffff', align: 'right', width: 154, forceLatin: true });
      renderPdfText(`Run: ${data.generatedAt} (UTC+3)`, pageWidth - margin - 162, 47, { size: 6.5, color: '#a7f3d0', align: 'right', width: 154, forceLatin: true });

      curY = 92;

      // KPI CARDS ROW (5 Cards)
      const mbMarginPct = (data.maxBazar.orders.completedAmount > 0 ? (data.maxBazar.netProfit / data.maxBazar.orders.completedAmount * 100).toFixed(1) : '0.0');
      drawMetricCard(margin + 0 * (cardW + 8), curY, cardW, cardH, 'ساپ پايدا', formatUSD(data.maxBazar.netProfit), `پايدا نىسبىتى: ${mbMarginPct}%`, '#059669');
      drawMetricCard(margin + 1 * (cardW + 8), curY, cardW, cardH, 'ئومۇمىي ئايلانما', formatUSD(data.maxBazar.orders.completedAmount), `${data.maxBazar.orders.completedCount} پۈتكەن زاكاز`, '#0891b2');
      drawMetricCard(margin + 2 * (cardW + 8), curY, cardW, cardH, 'تەمىنلىگۈچى تەننەرخى', formatUSD(data.maxBazar.supplier.totalCost), 'تەمىنلىگۈچى زاكاز تەستىقى', '#d97706');
      drawMetricCard(margin + 3 * (cardW + 8), curY, cardW, cardH, 'قايتۇرۇلغان زاكازلار', formatUSD(data.maxBazar.orders.refundedAmount), `${data.maxBazar.orders.refundedCount} قايتۇرۇلدى`, '#e11d48');
      drawMetricCard(margin + 4 * (cardW + 8), curY, cardW, cardH, 'ھەمبەھىر قالدۇق', formatUSD(data.maxBazar.totalUserBalances), 'ئومۇمىي خېرىدار قالدۇقى', '#047857');

      curY += cardH + 16;

      // SECTION 1: GAMING & APP TOP-UP SERVICES BREAKDOWN
      renderPdfText('1. مىكرو ئەپ ۋە ئويۇن مۇلازىمەتلىرى تەقسىماتى', margin, curY, { bold: true, size: 10, color: '#0f172a' });
      curY += 16;

      const colWAppSales = [180, 100, 120, 123.28];
      drawTableRow(curY, [
        { text: 'ئەپ ياكى ئويۇن تۈرى', w: colWAppSales[0] },
        { text: 'زاكاز سانى', w: colWAppSales[1], align: 'center' },
        { text: 'سېتىلىش باھاسى', w: colWAppSales[2], align: 'right' },
        { text: 'تەمىنلىگۈچى تەننەرخى', w: colWAppSales[3], align: 'right' },
      ], true);
      curY += 18;

      if (!data.maxBazar.serviceBreakdown || data.maxBazar.serviceBreakdown.length === 0) {
        drawTableRow(curY, [
          { text: 'PUBG Mobile UC Topup (Global / Turkey)', w: colWAppSales[0] },
          { text: '0', w: colWAppSales[1], align: 'center', forceLatin: true },
          { text: '$0.00', w: colWAppSales[2], align: 'right', forceLatin: true },
          { text: '$0.00', w: colWAppSales[3], align: 'right', forceLatin: true },
        ]);
        curY += 16;
        drawTableRow(curY, [
          { text: 'Honor of Kings Tokens (Global)', w: colWAppSales[0] },
          { text: '0', w: colWAppSales[1], align: 'center', forceLatin: true },
          { text: '$0.00', w: colWAppSales[2], align: 'right', forceLatin: true },
          { text: '$0.00', w: colWAppSales[3], align: 'right', forceLatin: true },
        ]);
        curY += 16;
      } else {
        for (const s of data.maxBazar.serviceBreakdown) {
          const sCost = Math.round(s.amount * 0.88 * 100) / 100;
          drawTableRow(curY, [
            { text: s.serviceName, w: colWAppSales[0], bold: true },
            { text: String(s.count), w: colWAppSales[1], align: 'center', forceLatin: true },
            { text: formatUSD(s.amount), w: colWAppSales[2], align: 'right', bold: true, forceLatin: true },
            { text: formatUSD(sCost), w: colWAppSales[3], align: 'right', forceLatin: true },
          ]);
          curY += 16;
        }
      }

      curY += 12;

      // SECTION 2: ORDERS FULFILLMENT & MAXSTORE RECONCILIATION
      renderPdfText('2. تەمىنلىگۈچى تەرەپ ھېساباتى ۋە زاكاز ھالىتى', margin, curY, { bold: true, size: 10, color: '#0f172a' });
      curY += 16;

      drawTableRow(curY, [
        { text: 'زاكاز ھالىتى', w: colWOrders[0] },
        { text: 'زاكاز سانى', w: colWOrders[1], align: 'center' },
        { text: 'خېرىدار چىقىمى', w: colWOrders[2], align: 'right' },
        { text: 'تەمىنلىگۈچى تەننەرخى', w: colWOrders[3], align: 'right' },
        { text: 'ساپ پايدا', w: colWOrders[4], align: 'right' },
      ], true);
      curY += 18;

      drawTableRow(curY, [
        { text: 'مۇۋەپپەقىيەتلىك تاماملانغان', w: colWOrders[0], bold: true, color: '#059669' },
        { text: String(data.maxBazar.orders.completedCount), w: colWOrders[1], align: 'center', bold: true, forceLatin: true },
        { text: formatUSD(data.maxBazar.orders.completedAmount), w: colWOrders[2], align: 'right', bold: true, forceLatin: true },
        { text: formatUSD(data.maxBazar.supplier.totalCost), w: colWOrders[3], align: 'right', color: '#d97706', forceLatin: true },
        { text: formatUSD(data.maxBazar.netProfit), w: colWOrders[4], align: 'right', bold: true, color: '#059669', forceLatin: true },
      ]);
      curY += 16;

      drawTableRow(curY, [
        { text: 'تەمىنلىگۈچى رەت قىلغان / قايتۇرۇلغان', w: colWOrders[0], color: '#e11d48' },
        { text: String(data.maxBazar.orders.refundedCount), w: colWOrders[1], align: 'center', forceLatin: true },
        { text: formatUSD(data.maxBazar.orders.refundedAmount), w: colWOrders[2], align: 'right', color: '#e11d48', forceLatin: true },
        { text: formatUSD(data.maxBazar.supplier.refundAmount), w: colWOrders[3], align: 'right', forceLatin: true },
        { text: '$0.00 • قوغدالغان', w: colWOrders[4], align: 'right', color: '#64748b' },
      ]);
      curY += 16;

      drawTableRow(curY, [
        { text: 'تەمىنلىگۈچىدە ساقلىنىۋاتقان', w: colWOrders[0], color: '#f59e0b' },
        { text: String(data.maxBazar.orders.pendingCount), w: colWOrders[1], align: 'center', forceLatin: true },
        { text: formatUSD(data.maxBazar.orders.pendingAmount), w: colWOrders[2], align: 'right', forceLatin: true },
        { text: '-', w: colWOrders[3], align: 'right', forceLatin: true },
        { text: 'تەمىنلىگۈچىدە ساقلىنىۋاتىدۇ', w: colWOrders[4], align: 'right', color: '#f59e0b' },
      ]);
      curY += 16;

      curY += 12;

      // SECTION 3: NEW ACTIVE TELEGRAM & MICRO-APP CUSTOMERS
      renderPdfText(`3. يېڭىدىن كىرگەن مىكرو ئەپ ئىشلەتكۈچىلىرى: ${data.maxBazar.newCustomersCount} نەپەر`, margin, curY, { bold: true, size: 10, color: '#0f172a' });
      curY += 16;

      drawTableRow(curY, [
        { text: '#', w: colWUsers[0], align: 'center' },
        { text: 'خېرىدار ئۇچۇرى', w: colWUsers[1] },
        { text: 'تېلېگرامما ئىسمى / تېلېفونى', w: colWUsers[2] },
        { text: 'قوشۇلغان ۋاقتى', w: colWUsers[3], align: 'right' },
      ], true);
      curY += 18;

      const mbDisplay = data.maxBazar.newCustomers.slice(0, 8);
      if (mbDisplay.length === 0) {
        drawTableRow(curY, [
          { text: '-', w: colWUsers[0], align: 'center', forceLatin: true },
          { text: 'بۇ دوكلات مەزگىلىدە ئايرىم تىزىملاتقانلار يوق', w: colWUsers[1] },
          { text: 'تېلېگرامما بوت ئارقىلىق سودا قىلىنماقتا', w: colWUsers[2] },
          { text: '-', w: colWUsers[3], align: 'right', forceLatin: true },
        ]);
        curY += 16;
      } else {
        mbDisplay.forEach((u, i) => {
          drawTableRow(curY, [
            { text: String(i + 1), w: colWUsers[0], align: 'center', forceLatin: true },
            { text: u.name, w: colWUsers[1], bold: true },
            { text: u.contact, w: colWUsers[2] },
            { text: u.registeredAt, w: colWUsers[3], align: 'right', forceLatin: true },
          ]);
          curY += 16;
        });
      }

      // Page 2 Footer
      doc.save();
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(margin, pageHeight - 45).lineTo(margin + contentWidth, pageHeight - 45).stroke();
      renderPdfText('تەمىنلەش ۋە كىچىك ئەپلەر سىستېمىسى • مەخپىي ھۆججەت', margin, pageHeight - 32, { size: 7.5, color: '#64748b', lineBreak: false });
      renderPdfText('2-بەت • ماكس بازارنىڭ كۈندىلىك دوكلاتى', margin, pageHeight - 32, { bold: true, size: 8, color: '#064e3b', align: 'right', width: contentWidth, lineBreak: false });
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

const REPORTS_LOG_FILE = path.join(MICRO_APPS_DIR, 'financial_reports_log.json');
const BUNDLED_REPORTS_LOG_FILE = path.join(BUNDLED_MICRO_APPS_DIR, 'financial_reports_log.json');

export interface ReportLogItem {
  id: string; // e.g. "daily_2026-11-17"
  period: 'daily' | 'weekly';
  dateStr: string;
  filename: string;
  sentAt: string;
  messageId?: number;
  channel: string;
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
}

export function getReportsLog(): Record<string, ReportLogItem> {
  const paths = [REPORTS_LOG_FILE, BUNDLED_REPORTS_LOG_FILE];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch {}
  }
  return {};
}

export function recordReportLog(item: ReportLogItem) {
  try {
    const log = getReportsLog();
    log[item.id] = item;
    if (!fs.existsSync(MICRO_APPS_DIR)) {
      try {
        fs.mkdirSync(MICRO_APPS_DIR, { recursive: true });
      } catch {}
    }
    fs.writeFileSync(REPORTS_LOG_FILE, JSON.stringify(log, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[financialReport] recordReportLog error:', e);
  }
}

/**
 * Formats standardized report filename strictly matching:
 * AUTO_CASH_DAILY_REPORT_YYYY-MM-DD.pdf
 * AUTO_CASH_WEEKLY_REPORT_YYYY-MM-DD.pdf
 */
export function getStandardReportFilename(period: 'daily' | 'weekly', dateStr: string): string {
  // Normalize date string to YYYY-MM-DD (or YYYY-MM-DD_YYYY-MM-DD for range)
  const clean = (dateStr || '').trim().replace(/[^0-9A-Za-z_-]+/g, '_').replace(/^_+|_+$/g, '');
  return period === 'weekly'
    ? `AUTO_CASH_WEEKLY_REPORT_${clean}.pdf`
    : `AUTO_CASH_DAILY_REPORT_${clean}.pdf`;
}

/**
 * Sends the generated PDF report to the specified Telegram channel (@autocashkirim)
 * with automatic exponential-backoff retry (up to 3 attempts).
 */
export async function sendFinancialReportToTelegram(
  pdfBuffer: Buffer,
  reportData: FinancialReportData,
  targetChatId = '@autocashkirim'
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8886426395:AAHTtOA5ilIoNUfmcfVf44mCK6gJo7gjhd0';
  const filename = getStandardReportFilename(reportData.period, reportData.dateRangeStr);
  const caption = buildTelegramReportCaption(reportData);

  let lastError: string = '';

  // Retry up to 3 attempts with progressive delay (0s, 2s, 4s)
  for (let attempt = 1; attempt <= 3; attempt++) {
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
      if (result.ok && result.result?.message_id) {
        return { success: true, messageId: result.result.message_id };
      }

      lastError = result.description || 'Unknown Telegram Error';
      console.warn(`[sendFinancialReportToTelegram] Attempt ${attempt} failed: ${lastError}`);
    } catch (err: any) {
      lastError = err?.message || 'Network exception';
      console.warn(`[sendFinancialReportToTelegram] Attempt ${attempt} exception: ${lastError}`);
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }

  // If all 3 attempts fail, send alert to Admin Telegram
  try {
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || 'autocash_UYGHUR';
    const alertMsg = `⚠️ <b>مالىيە دوكلاتى يوللاش مەغلۇپ بولدى!</b>\n\nھۆججەت: <code>${filename}</code>\nقانال: <code>${targetChatId}</code>\nخاتالىق: <i>${lastError}</i>\n\nتەكشۈرۈپ بېقىڭ!`;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: adminChatId, text: alertMsg, parse_mode: 'HTML' }),
    });
  } catch {}

  return { success: false, error: lastError };
}

/**
 * High-level orchestration function to generate and dispatch the financial report.
 * Automatically handles Friday weekly trigger if requested.
 * Strictly prevents duplicate sends for the same period unless forceSend: true.
 */
export async function runFinancialReportCron(options?: {
  period?: 'daily' | 'weekly';
  forceWeekly?: boolean;
  forceSend?: boolean;
  targetChatId?: string;
  referenceDate?: Date;
}): Promise<{
  dailySent?: boolean;
  weeklySent?: boolean;
  dailySkipped?: boolean;
  weeklySkipped?: boolean;
  dailyMessageId?: number;
  weeklyMessageId?: number;
  errors: string[];
}> {
  const targetChat = options?.targetChatId || '@autocashkirim';
  const refDate = options?.referenceDate || new Date();
  const forceSend = Boolean(options?.forceSend);
  const errors: string[] = [];

  // Determine local day of week in UTC+3 (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat)
  const localTime = new Date(refDate.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
  const dayOfWeek = localTime.getUTCDay();
  const isFriday = dayOfWeek === 5;

  let dailySent = false;
  let weeklySent = false;
  let dailySkipped = false;
  let weeklySkipped = false;
  let dailyMessageId: number | undefined;
  let weeklyMessageId: number | undefined;

  const shouldRunDaily = options?.period !== 'weekly';
  const shouldRunWeekly = options?.period === 'weekly' || options?.forceWeekly || isFriday;

  const existingLogs = getReportsLog();

  // 1. Generate & Send Daily Report
  if (shouldRunDaily) {
    try {
      const dailyData = await fetchFinancialData('daily', refDate);
      const dailyKey = `daily_${dailyData.dateRangeStr}`;
      const filename = getStandardReportFilename('daily', dailyData.dateRangeStr);

      if (!forceSend && existingLogs[dailyKey] && existingLogs[dailyKey].status === 'sent') {
        dailySkipped = true;
        dailyMessageId = existingLogs[dailyKey].messageId;
      } else {
        const dailyPdf = await generateFinancialPdf(dailyData);
        const sendRes = await sendFinancialReportToTelegram(dailyPdf, dailyData, targetChat);
        if (sendRes.success) {
          dailySent = true;
          dailyMessageId = sendRes.messageId;
          recordReportLog({
            id: dailyKey,
            period: 'daily',
            dateStr: dailyData.dateRangeStr,
            filename,
            sentAt: new Date().toISOString(),
            messageId: sendRes.messageId,
            channel: targetChat,
            status: 'sent',
          });
        } else {
          errors.push(`Daily report failed: ${sendRes.error}`);
          recordReportLog({
            id: dailyKey,
            period: 'daily',
            dateStr: dailyData.dateRangeStr,
            filename,
            sentAt: new Date().toISOString(),
            channel: targetChat,
            status: 'failed',
            error: sendRes.error,
          });
        }
      }
    } catch (e: any) {
      errors.push(`Daily report exception: ${e?.message}`);
    }
  }

  // 2. Generate & Send Weekly Report (Every Friday at 12:00, or when forced)
  if (shouldRunWeekly) {
    try {
      const weeklyData = await fetchFinancialData('weekly', refDate);
      const weeklyKey = `weekly_${weeklyData.dateRangeStr}`;
      const filename = getStandardReportFilename('weekly', weeklyData.dateRangeStr);

      if (!forceSend && existingLogs[weeklyKey] && existingLogs[weeklyKey].status === 'sent') {
        weeklySkipped = true;
        weeklyMessageId = existingLogs[weeklyKey].messageId;
      } else {
        const weeklyPdf = await generateFinancialPdf(weeklyData);
        const sendRes = await sendFinancialReportToTelegram(weeklyPdf, weeklyData, targetChat);
        if (sendRes.success) {
          weeklySent = true;
          weeklyMessageId = sendRes.messageId;
          recordReportLog({
            id: weeklyKey,
            period: 'weekly',
            dateStr: weeklyData.dateRangeStr,
            filename,
            sentAt: new Date().toISOString(),
            messageId: sendRes.messageId,
            channel: targetChat,
            status: 'sent',
          });
        } else {
          errors.push(`Weekly report failed: ${sendRes.error}`);
          recordReportLog({
            id: weeklyKey,
            period: 'weekly',
            dateStr: weeklyData.dateRangeStr,
            filename,
            sentAt: new Date().toISOString(),
            channel: targetChat,
            status: 'failed',
            error: sendRes.error,
          });
        }
      }
    } catch (e: any) {
      errors.push(`Weekly report exception: ${e?.message}`);
    }
  }

  return {
    dailySent,
    weeklySent,
    dailySkipped,
    weeklySkipped,
    dailyMessageId,
    weeklyMessageId,
    errors,
  };
}
