import { NextRequest, NextResponse } from 'next/server';
import {
  runFinancialReportCron,
  fetchFinancialData,
  generateFinancialPdf,
  getStandardReportFilename,
  getReportsLog,
} from '@/lib/financialReport';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds execution limit

export async function GET(req: NextRequest) {
  return handleReportRequest(req);
}

export async function POST(req: NextRequest) {
  return handleReportRequest(req);
}

async function handleReportRequest(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get('period'); // 'daily' | 'weekly'
    const forceWeekly = searchParams.get('force_weekly') === 'true';
    const forceSend = searchParams.get('force_send') === 'true';
    const targetChat = searchParams.get('chat_id') || '@autocashkirim';
    const downloadPdf = searchParams.get('download') === 'true';
    const checkLogs = searchParams.get('logs') === 'true';

    // Query dispatch log history
    if (checkLogs) {
      const logs = getReportsLog();
      return NextResponse.json({
        success: true,
        logs,
        timestamp: new Date().toISOString(),
      });
    }

    // Optional direct PDF download for inspection in browser / admin panel
    if (downloadPdf) {
      const targetPeriod = periodParam === 'weekly' ? 'weekly' : 'daily';
      const data = await fetchFinancialData(targetPeriod);
      const pdfBuffer = await generateFinancialPdf(data);
      const filename = getStandardReportFilename(targetPeriod, data.dateRangeStr);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Run the automated financial report dispatch to Telegram
    const period = periodParam === 'weekly' ? 'weekly' : periodParam === 'daily' ? 'daily' : undefined;

    const result = await runFinancialReportCron({
      period,
      forceWeekly,
      forceSend,
      targetChatId: targetChat,
    });

    const isSuccess = (result.dailySent || result.weeklySent || result.dailySkipped || result.weeklySkipped) && result.errors.length === 0;

    return NextResponse.json({
      success: isSuccess,
      target_channel: targetChat,
      daily_report_sent: result.dailySent,
      weekly_report_sent: result.weeklySent,
      daily_skipped: result.dailySkipped,
      weekly_skipped: result.weeklySkipped,
      daily_message_id: result.dailyMessageId,
      weekly_message_id: result.weeklyMessageId,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[FinancialReport API Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal Server Error while generating financial report',
      },
      { status: 500 }
    );
  }
}
