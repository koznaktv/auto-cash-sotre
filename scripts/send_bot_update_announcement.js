const fs = require('fs');
const path = require('path');

const dotenv = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
dotenv.split('\n').forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || '').trim();
});

const token = env.TELEGRAM_BOT_TOKEN;
const adminChatId = env.TELEGRAM_ADMIN_CHAT_ID || '7575664493';
const channelUsername = '@autocash_cannel';
const botUsername = 'Autocash_24_bot';
const storeUrl = env.NEXT_PUBLIC_SITE_URL || 'https://www.auto-cash.app';

const messageText = `
📢 <b>ھۆرمەتلىك خېرىدارلار، دىققىتىڭلارغا!</b>
━━━━━━━━━━━━━━━━━━━
❓ <b>بوتتا مەھسۇلات سېتىۋېلىشتىن قىينالغانمىدىڭىز؟ قالايمىقان تۇيۇلدىمۇ؟</b>

سىلەرنىڭ تەكلىپ-پىكىرلىرىڭلارغا ئاساسەن، <b>AUTO CASH</b> تېلېگرام بوتىنى تولۇق قايتا لاھىيەلەپ، قالايمىقانچىلىقلارنى چىقىرىۋېتىپ، ئەڭ ئاددىي، چۈشىنىشلىك ۋە راۋان ھالەتكە كەلتۈردۇق! ⚡️

✨ <b>يېڭى ئۆزگىرىش ۋە قولايلىقلار:</b>

1️⃣ <b>دۇكاننى بىۋاسىتە ئېچىش (WebApp):</b>
كۆپچىلىك ياقتۇرغان، چىرايلىق ۋە تېز رەسمىي توربەت دۇكىنىمىز ئەمدى تېلېگرامنىڭ ئىچىدىلا <b>«🛍️ دۇكاننى ئېچىش (مال سېتىۋېلىش)»</b> كۇنۇپكىسى ئارقىلىق 1 سېكۇنتتا تولۇق ئېچىلىدۇ! تېلېگرامدىن چىقمايلا تاللاپ دەرھال سېتىۋالالايسىز.

2️⃣ <b>كۇنۇپكىلار ئەڭ رەتلىك ۋە ئېنىق بولدى:</b>
ئارتۇقچە، قالايمىقان كۇنۇپكىلار چىقىرىۋېتىلىپ، ئاساسلىق:
• 🛍️ <b>دۇكاننى ئېچىش</b> (تولۇق كۆرۈنمە يۈز)
• 🎮 <b>بوت ئىچىدە سېتىۋېلىش</b> (تېز تىزىملىك)
• 💰 <b>ھېساباتىم & قالدۇق پۇل</b>
• 📥 <b>پۇل كىرگۈزۈش (شامكەش)</b>
• 📦 <b>زاكاز سۈرۈشتۈرۈش</b>
• 💬 <b>خېرىدارلار مۇلازىمىتى</b>
بولۇپ ئاددىيلاشتۇرۇلدى.

3️⃣ <b>ئويۇن ماۋزۇلىرى ۋە بولاقلار تېخىمۇ پاكىزلاندى:</b>
قالايمىقان بەلگىلەر يوقىتىلىپ، باھا ۋە سانلار ئېنىق كۆرسىتىلىدىغان بولدى.

👇 <b>ھازىرلا تۆۋەندىكى كۇنۇپكىنى بېسىپ يېڭى قولايلىقنى سىناپ بېقىڭ:</b>
`.trim();

const keyboard = {
  inline_keyboard: [
    [
      {
        text: '🛍️ دۇكاننى ئېچىش (مال سېتىۋېلىش) ➔',
        url: `https://t.me/${botUsername}?startapp=store`,
      },
    ],
    [
      { text: '🤖 تېلېگرام بوتقا كىرىش ⚡️', url: `https://t.me/${botUsername}` },
      { text: '🌐 توربەت دۇكىنى 🛒', url: storeUrl },
    ],
    [
      { text: '💬 خېرىدارلار مۇلازىمىتى (24/7)', url: 'https://t.me/autocash_UYGHUR' },
    ],
  ],
};

async function send() {
  console.log('1. Sending to Admin (' + adminChatId + ')...');
  const resAdmin = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: adminChatId,
      text: messageText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    }),
  });
  const dataAdmin = await resAdmin.json();
  console.log('Admin send result:', dataAdmin.ok ? 'SUCCESS' : dataAdmin);

  console.log('2. Sending to Channel (' + channelUsername + ')...');
  const resChannel = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: channelUsername,
      text: messageText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    }),
  });
  const dataChannel = await resChannel.json();
  console.log('Channel send result:', dataChannel.ok ? 'SUCCESS' : dataChannel);
}

send().catch((e) => console.error(e));
