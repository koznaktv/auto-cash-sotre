#!/usr/bin/env node

/**
 * AUTO CASH & MAX BAZAR FINANCIAL REPORT SCRIPT
 * 
 * Usage:
 *   node scripts/generate_financial_report.js           # Runs daily (and weekly if Friday)
 *   node scripts/generate_financial_report.js daily     # Runs daily report
 *   node scripts/generate_financial_report.js weekly    # Runs weekly 7-day report
 *   node scripts/generate_financial_report.js both      # Runs both reports immediately
 */

const fs = require('fs');
const path = require('path');

// 1. Manually load .env.local if present
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const targetChannel = process.env.FINANCIAL_REPORT_CHANNEL || '@autocashkirim';
const botToken = process.env.TELEGRAM_BOT_TOKEN || '8886426395:AAHTtOA5ilIoNUfmcfVf44mCK6gJo7gjhd0';
const arg = (process.argv[2] || '').toLowerCase();

console.log('====================================================');
console.log('🚀 AUTO CASH & MAX BAZAR AUTOMATED FINANCIAL ENGINE');
console.log('====================================================');
console.log('📅 Date / Time:', new Date().toISOString());
console.log('🎯 Target Telegram Channel:', targetChannel);
console.log('🤖 Telegram Bot Token:', botToken.slice(0, 15) + '...');
console.log('⚙️ Execution Mode:', arg || 'auto');
console.log('----------------------------------------------------');

async function main() {
  try {
    // Dynamic import of our TypeScript module via ts-node/tsx or bundled version
    // If running in development, we can require through .next or directly invoke fetchFinancialData
    // We can compile/run via node using built Next.js server module or direct JS logic
    
    const isWeekly = arg === 'weekly';
    const isBoth = arg === 'both';
    const isDaily = arg === 'daily' || (!isWeekly && !isBoth);

    // Let's test calling our Next.js API endpoint if local server is running, or execute directly
    console.log('📊 Gathering database and micro-apps data...');

    // We can also call our local Next.js server or execute through the Next app
    // Let's check if the API is reachable locally or if we should run the module logic
    const port = process.env.PORT || 3000;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${port}`;

    let calledApi = false;
    try {
      const testRes = await fetch(`${siteUrl}/api/cron/financial-report?period=${arg || 'daily'}&chat_id=${encodeURIComponent(targetChannel)}`, {
        method: 'POST',
      });
      if (testRes.ok) {
        const data = await testRes.json();
        console.log('✅ Financial report executed successfully via Next.js API endpoint!');
        console.log(JSON.stringify(data, null, 2));
        calledApi = true;
      }
    } catch (e) {
      // Local dev server not running, run direct standalone generator
    }

    if (!calledApi) {
      console.log('ℹ️ Running direct standalone report generator...');
      await runStandaloneGenerator(arg);
    }

    console.log('====================================================');
    console.log('✨ Financial Report Engine completed successfully!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error executing financial report:', err);
    process.exit(1);
  }
}

async function runStandaloneGenerator(mode) {
  const PDFDocument = require('pdfkit');
  const TIMEZONE_OFFSET_HOURS = 3;

  function formatDate(d) {
    const local = new Date(d.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
    return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}-${String(local.getUTCDate()).padStart(2, '0')}`;
  }

  function formatUSD(val) {
    return '$' + (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const now = new Date();
  const offsetMs = TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
  const localNow = new Date(now.getTime() + offsetMs);

  const y = localNow.getUTCFullYear();
  const m = localNow.getUTCMonth();
  const d = localNow.getUTCDate();
  const dayOfWeek = localNow.getUTCDay(); // 5 = Friday

  const runDaily = mode !== 'weekly';
  const runWeekly = mode === 'weekly' || mode === 'both' || dayOfWeek === 5;

  // Read local DB and micro apps
  let users = [];
  let orders = [];
  let deposits = [];

  const dbPath = path.join(__dirname, '..', 'data', 'autocash_db.json');
  if (fs.existsSync(dbPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      users = raw.users || [];
      orders = raw.orders || [];
      deposits = raw.deposits || [];
    } catch {}
  }

  const microOrdersPath = path.join(__dirname, '..', 'data', 'micro_apps', 'orders.json');
  if (fs.existsSync(microOrdersPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(microOrdersPath, 'utf8'));
      if (Array.isArray(raw)) orders.push(...raw);
    } catch {}
  }

  let microWallets = {};
  const microWalletsPath = path.join(__dirname, '..', 'data', 'micro_apps', 'app_wallets.json');
  if (fs.existsSync(microWalletsPath)) {
    try {
      microWallets = JSON.parse(fs.readFileSync(microWalletsPath, 'utf8'));
    } catch {}
  }

  async function processPeriod(p) {
    const isWeek = p === 'weekly';
    const startUtc = isWeek
      ? new Date(Date.UTC(y, m, d - 6, 0, 0, 0, 0) - offsetMs)
      : new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - offsetMs);
    const endUtc = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - offsetMs);

    const startTs = startUtc.getTime();
    const endTs = endUtc.getTime();
    const dateRangeStr = isWeek ? `${formatDate(startUtc)} ~ ${formatDate(endUtc)}` : formatDate(startUtc);

    console.log(`\n⏳ Processing ${p.toUpperCase()} report (${dateRangeStr})...`);

    // Calculate metrics
    const acNewUsers = users.filter((u) => {
      const t = new Date(u.createdAt || 0).getTime();
      return t >= startTs && t <= endTs && !u.email?.endsWith('@maxbazar.user');
    });

    const acTotalBalances = users.reduce((s, u) => s + (u.email?.endsWith('@maxbazar.user') ? 0 : Number(u.balance || 0)), 0);

    const acDepositsInPeriod = deposits.filter((dep) => {
      const t = new Date(dep.reviewedAt || dep.date || 0).getTime();
      return t >= startTs && t <= endTs && dep.status === 'completed';
    });
    const acInflow = acDepositsInPeriod.reduce((s, dep) => s + Number(dep.amount || 0), 0);

    const acOrders = orders.filter((o) => {
      const isMb = (o.serviceId && o.serviceId.startsWith('maxbazar_')) || (o.details && o.details.store === 'maxbazar') || o.app_id;
      if (isMb) return false;
      const t = new Date(o.createdAt || o.created_at || 0).getTime();
      return t >= startTs && t <= endTs;
    });

    let acCompletedAmt = 0;
    let acCompletedCount = 0;
    let acRefundedAmt = 0;
    let acRefundedCount = 0;
    for (const o of acOrders) {
      const amt = Number(o.amount || o.price || 0);
      if (o.status === 'completed' || o.status === 'success') {
        acCompletedAmt += amt;
        acCompletedCount++;
      } else if (o.status === 'refunded' || o.status === 'failed') {
        acRefundedAmt += amt;
        acRefundedCount++;
      }
    }
    const acSupplierCost = Math.round(acCompletedAmt * 0.88 * 100) / 100;
    const acProfit = Math.round((acCompletedAmt - acSupplierCost) * 100) / 100;

    // Max Bazar
    const mbOrders = orders.filter((o) => {
      const isMb = (o.serviceId && o.serviceId.startsWith('maxbazar_')) || (o.details && o.details.store === 'maxbazar') || o.app_id;
      if (!isMb) return false;
      const t = new Date(o.createdAt || o.created_at || 0).getTime();
      return t >= startTs && t <= endTs;
    });

    let mbCompletedAmt = 0;
    let mbCompletedCount = 0;
    let mbRefundedAmt = 0;
    let mbRefundedCount = 0;
    for (const o of mbOrders) {
      const amt = Number(o.amount || o.price || 0);
      if (o.status === 'completed' || o.status === 'success') {
        mbCompletedAmt += amt;
        mbCompletedCount++;
      } else if (o.status === 'refunded' || o.status === 'failed') {
        mbRefundedAmt += amt;
        mbRefundedCount++;
      }
    }
    const mbSupplierCost = Math.round(mbCompletedAmt * 0.88 * 100) / 100;
    const mbProfit = Math.round((mbCompletedAmt - mbSupplierCost) * 100) / 100;

    let mbTotalBalances = 0;
    const seenW = new Set();
    for (const [k, v] of Object.entries(microWallets)) {
      const iden = k.replace(/^(unified|pubg|honor-of-kings):/, '');
      if (!seenW.has(iden) && typeof v === 'number') {
        seenW.add(iden);
        mbTotalBalances += Math.max(0, v);
      }
    }

    // Generate PDF with PDFKit
    console.log('📄 Rendering 2-page PDF document...');
    const pdfBuf = await new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      const bufs = [];
      doc.on('data', (c) => bufs.push(c));
      doc.on('end', () => resolve(Buffer.concat(bufs)));

      // Page 1: Auto Cash
      doc.rect(0, 0, 595.28, 75).fill('#0a192f');
      doc.rect(0, 75, 595.28, 3).fill('#f59e0b');
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('AUTO CASH', 36, 18);
      doc.fillColor('#fbbf24').fontSize(8.5).font('Helvetica-Bold').text('GLOBAL DIGITAL ASSET & WHOLESALE HUB', 36, 38);
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text(`Financial Statement & Ledger • Period: ${dateRangeStr}`, 36, 50);

      // KPI box
      doc.rect(36, 95, 523.28, 65).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#059669').fontSize(16).font('Helvetica-Bold').text(`Net Profit: ${formatUSD(acProfit)}`, 50, 108);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica').text(`Gross Revenue: ${formatUSD(acCompletedAmt)}  |  Supplier Wholesale: ${formatUSD(acSupplierCost)}  |  Completed Orders: ${acCompletedCount}`, 50, 130);
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(`Customer Inflow (Deposits): ${formatUSD(acInflow)}  |  Platform User Balances: ${formatUSD(acTotalBalances)}  |  New Users: ${acNewUsers.length}`, 50, 144);

      // Summary table
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Summary Performance Table', 36, 180);
      doc.rect(36, 198, 523.28, 22).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text('Metric Category', 46, 204);
      doc.text('Performance Details', 250, 204);
      doc.text('Settlement Amount', 440, 204, { align: 'right', width: 100 });

      let rowY = 224;
      const rows = [
        ['Customer Deposits (Inflow)', `${acDepositsInPeriod.length} verified deposits via ShamCash/TSA`, formatUSD(acInflow)],
        ['Completed Orders Delivery', `${acCompletedCount} orders successfully fulfilled`, formatUSD(acCompletedAmt)],
        ['Wholesale Provider Cost', 'Deducted by API wholesale providers (~88%)', formatUSD(acSupplierCost)],
        ['Net Realized Profit', 'Gross retail revenue minus supplier cost', formatUSD(acProfit)],
        ['Refunded / Failed Orders', `${acRefundedCount} orders refunded to balance`, formatUSD(acRefundedAmt)],
        ['Current Platform Balances', 'Total funds held in client wallets', formatUSD(acTotalBalances)],
        ['New Customer Acquisitions', `${acNewUsers.length} newly registered accounts`, '-'],
      ];

      for (const [title, desc, amt] of rows) {
        doc.rect(36, rowY, 523.28, 18).fill(rowY % 36 === 0 ? '#ffffff' : '#f8fafc');
        doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold').text(title, 46, rowY + 5);
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(desc, 250, rowY + 5);
        doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(amt, 440, rowY + 5, { align: 'right', width: 100 });
        rowY += 18;
      }

      // Page 1 footer
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text('AUTO CASH & MAX BAZAR FINANCIAL SYSTEM • PAGE 1 OF 2', 36, 800);

      // Page 2: Max Bazar
      doc.addPage();
      doc.rect(0, 0, 595.28, 75).fill('#064e3b');
      doc.rect(0, 75, 595.28, 3).fill('#10b981');
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('MAX BAZAR', 36, 18);
      doc.fillColor('#a7f3d0').fontSize(8.5).font('Helvetica-Bold').text('MICRO-APPS & HIGH-SPEED GAMING EXCHANGE', 36, 38);
      doc.fillColor('#6ee7b7').fontSize(7.5).font('Helvetica').text(`MaxStore Wholesale Reconciliation • Period: ${dateRangeStr}`, 36, 50);

      // KPI box
      doc.rect(36, 95, 523.28, 65).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#059669').fontSize(16).font('Helvetica-Bold').text(`Net Profit: ${formatUSD(mbProfit)}`, 50, 108);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica').text(`Gross Turnover: ${formatUSD(mbCompletedAmt)}  |  MaxStore Wholesale: ${formatUSD(mbSupplierCost)}  |  Delivered: ${mbCompletedCount}`, 50, 130);
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(`Unified App Balances: ${formatUSD(mbTotalBalances)}  |  Refunds: ${formatUSD(mbRefundedAmt)} (${mbRefundedCount})`, 50, 144);

      // Summary table
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Max Bazar Performance Breakdown', 36, 180);
      doc.rect(36, 198, 523.28, 22).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text('Service / Metric', 46, 204);
      doc.text('Fulfillment Details', 250, 204);
      doc.text('Settlement Amount', 440, 204, { align: 'right', width: 100 });

      rowY = 224;
      const mbRows = [
        ['PUBG Mobile & HOK Orders', `${mbCompletedCount} gaming packages successfully recharged`, formatUSD(mbCompletedAmt)],
        ['MaxStore API Wholesale Cost', 'Automated instant wholesale API settlement', formatUSD(mbSupplierCost)],
        ['Net Realized Profit', 'Retail margin realized', formatUSD(mbProfit)],
        ['Provider Rejected / Refunded', `${mbRefundedCount} orders rejected by provider & refunded`, formatUSD(mbRefundedAmt)],
        ['Unified App Wallets Reserve', 'Total unspent balance in micro-app wallets', formatUSD(mbTotalBalances)],
      ];

      for (const [title, desc, amt] of mbRows) {
        doc.rect(36, rowY, 523.28, 18).fill(rowY % 36 === 0 ? '#ffffff' : '#f8fafc');
        doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold').text(title, 46, rowY + 5);
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(desc, 250, rowY + 5);
        doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(amt, 440, rowY + 5, { align: 'right', width: 100 });
        rowY += 18;
      }

      // Page 2 footer
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text('AUTO CASH & MAX BAZAR FINANCIAL SYSTEM • PAGE 2 OF 2', 36, 800);

      doc.end();
    });

    // Send to Telegram
    console.log(`📤 Dispatching ${p} PDF to Telegram channel ${targetChannel}...`);
    const totalProfit = (acProfit + mbProfit).toFixed(2);
    const totalOrders = acCompletedCount + mbCompletedCount;
    const totalTurnover = (acCompletedAmt + mbCompletedAmt).toFixed(2);

    const caption = `${isWeek ? '📈' : '📊'} <b>AUTO CASH & MAX BAZAR | ${isWeek ? 'ھەپتىلىك مالىيە دوكلاتى (7 كۈنلۈك)' : 'كۈنلۈك رەسمىي مالىيە دوكلاتى'}</b>
📅 <b>ۋاقتى:</b> <code>${dateRangeStr}</code>

━━━━━━━━━━━━━━━━━━━━
💰 <b>ئومۇمىي سۇپىلار خۇلاسىسى:</b>
• ساپ پايدا: <b>+$${totalProfit}</b>
• مۇۋەپپەقىيەتلىك پۈتكەن زاكاز: <b>${totalOrders} دانە</b> ($${totalTurnover})

━━━━━━━━━━━━━━━━━━━━
💎 <b>1. AUTO CASH سۇپىسى:</b>
• ساپ پايدا: <b>+$${acProfit.toFixed(2)}</b>
• پۇل كىرىمى (خېرىدار): <b>$${acInflow.toFixed(2)}</b>
• پۈتكەن زاكاز: <b>${acCompletedCount} دانە</b> ($${acCompletedAmt.toFixed(2)})
• قايتۇرۇلغان: <b>${acRefundedCount} دانە</b> ($${acRefundedAmt.toFixed(2)})
• تەمىنلىگۈچى تەننەرخى: <b>$${acSupplierCost.toFixed(2)}</b>
• خېرىدار قالدۇق ئومۇمىي سوممىسى: <b>$${acTotalBalances.toFixed(2)}</b>
• يېڭى خېرىدار: <b>${acNewUsers.length} نەپەر</b>

━━━━━━━━━━━━━━━━━━━━
🛍️ <b>2. MAX BAZAR سۇپىسى:</b>
• ساپ پايدا: <b>+$${mbProfit.toFixed(2)}</b>
• ئومۇمىي ئايلانما: <b>$${mbCompletedAmt.toFixed(2)}</b>
• پۈتكەن زاكاز: <b>${mbCompletedCount} دانە</b>
• قايتۇرۇلغان: <b>${mbRefundedCount} دانە</b> ($${mbRefundedAmt.toFixed(2)})
• تەمىنلىگۈچى تەننەرخى (MaxStore): <b>$${mbSupplierCost.toFixed(2)}</b>
• مىكرو ئەپ قالدۇقى: <b>$${mbTotalBalances.toFixed(2)}</b>

📄 <i>تەپسىلىي 2 بەتلىك تەستىقلانغان PDF مالىيە دوكلاتى قوشۇپ يوللاندى.</i>
#مالىيە_دوكلاتى #${isWeek ? 'ھەپتىلىك' : 'كۈنلۈك'}`;

    const form = new FormData();
    form.append('chat_id', targetChannel);
    form.append('caption', caption);
    form.append('parse_mode', 'HTML');
    form.append(
      'document',
      new Blob([pdfBuf], { type: 'application/pdf' }),
      `${isWeek ? 'Weekly' : 'Daily'}_Financial_Report_${dateRangeStr.replace(/\s+/g, '_')}.pdf`
    );

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: form,
    });
    const tgData = await tgRes.json();
    if (tgData.ok) {
      console.log(`✅ ${p.toUpperCase()} PDF Report sent successfully! Message ID:`, tgData.result.message_id);
    } else {
      console.error(`❌ Telegram send error:`, tgData.description);
    }
  }

  if (runDaily) {
    await processPeriod('daily');
  }

  if (runWeekly) {
    await processPeriod('weekly');
  }
}

main();
