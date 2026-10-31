import { NextResponse } from 'next/server';
import { sendAdminAlert } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, contact, type, message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'ئىنكاس مەزمۇنى بوش قالسا بولمايدۇ.' },
        { status: 400 }
      );
    }

    const safeName = (name || 'نامەلۇم خېرىدار').replace(/[<>]/g, '').trim();
    const safeContact = (contact || 'تەمىنلەنمىگەن').replace(/[<>]/g, '').trim();
    const safeType = (type || 'ئاددىي ئىنكاس').replace(/[<>]/g, '').trim();
    const safeMessage = message.replace(/[<>]/g, '').trim();

    // Formatted Beijing/Shanghai local time
    const now = new Date();
    const dateStr = now.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Elegant Telegram Admin notification template
    const telegramText = 
`📬 <b>يېڭى خېرىدار ئىنكاسى ۋە تەكلىپى</b>
━━━━━━━━━━━━━━━━━━━
👤 <b>خېرىدار:</b> ${safeName}
📱 <b>ئالاقە ئۇچۇرى:</b> <code>${safeContact}</code>
🏷️ <b>ئىنكاس تۈرى:</b> <b>${safeType}</b>
⏰ <b>ۋاقتى:</b> <code>${dateStr}</code>
━━━━━━━━━━━━━━━━━━━
💬 <b>ئىنكاس مەزمۇنى:</b>
<blockquote>${safeMessage}</blockquote>
━━━━━━━━━━━━━━━━━━━
⚡ <i>بۇ ئۇچۇر AUTO CASH تور بېكىتىنىڭ «ئىنكاس» سەھىپىسىدىن بىۋاسىتە ئەۋەتىلدى.</i>`;

    const delivered = await sendAdminAlert(telegramText);

    return NextResponse.json({
      success: true,
      delivered,
      message: 'ئىنكاسىڭىز مۇۋەپپەقىيەتلىك باشقۇرغۇچىغا يوللاندى!',
    });
  } catch (error: any) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'ئىنكاس ئەۋەتىشتە تېخنىكىلىق كاشىلا كۆرۈلدى، قايتا سىناڭ.' },
      { status: 500 }
    );
  }
}
