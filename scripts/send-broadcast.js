const fs = require('fs');

const token = process.env.TELEGRAM_BOT_TOKEN || '8886426395:AAGYz2nDCPrtOyqDH-mmqSwq_ctIAvIBcKY';
const channel = '@autocash_cannel';
const adminId = '7575664493';

const message = [
  '╭━━━ 🚀 <b>AUTO CASH | يېڭى ئىقتىدار: بىر چېكىش بىلەن تېلېگرامما بوتقا باغلاش!</b> 🚀 ━━━╮',
  '      💎 <i>توربەت بىلەن تېلېگرامما بوت پۈتۈنلەي بىر گەۋدە قىلىندى!</i> 💎',
  '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
  '',
  '👋 <b>ھۆرمەتلىك قەدىرلىك خېرىدارلار ۋە دوستلار!</b>',
  'سىلەرنىڭ مال سېتىۋېلىش تەجرىبەڭلارنى ئەڭ يۇقىرى چەككە يەتكۈزۈش ئۈچۈن، دۇكىنىمىزدا يېڭى بۆسۈش خاراكتېرلىك <b>«بىر چېكىش بىلەن تېلېگراممىغا تۇتاشتۇرۇش»</b> ئىقتىدارى رەسمىي ئىشقا كىرىشتۈرۈلدى! ⚡️',
  '',
  '🌟 <b>بۇنىڭدىن كېيىن سىزگە نېمە ئەۋزەللىكلەر بار؟</b>',
  '',
  '1️⃣ <b>ئورتاق ھەقىقىي قالدۇق پۇل (Shared Live Balance):</b>',
  'مەيلى سىز توربەتتە ياكى تېلېگرامما بوتىمىزدا شامكەش (Sham Cash) ياكى باشقا ئۇسۇلدا قالدۇق قاچىلىسىڭىز، ئىككى تەرەپتە بىردەك، دەرھال ئورتاق كۆرۈنىدۇ ۋە ئىشلىتىلىدۇ!',
  '',
  '2️⃣ <b>بىر سېكۇنتتا قولايلىق باغلاش:</b>',
  'پارول ياكى مۇرەككەپ كود كىرگۈزۈش ھاجەتسىز! توربەتتىكى <b>«مېنىڭ ھېساباتىم»</b> بېتىگە كىرىپ، <b>«1 چېكىپ بوتقا باغلاش»</b> كۇنۇپكىسىنى باسسىڭىزلا، تېلېگرامما ئېچىلىپ Start نى بېسىش بىلەنلا ھېساباتىڭىز تامامەن باغلىنىدۇ.',
  '',
  '3️⃣ <b>زاكاسلىرىڭىز بىر يەردە:</b>',
  'بارلىق تارىخى زاكاسلىرىڭىز، تەستىقلانغان ماللار ۋە VIP ئېتىبار ئەزالىق دەرىجىڭىز ھەم توربەتتە، ھەم تېلېگرامما بوتىدا ئاپتوماتىك تەڭ قەدەملىشىدۇ.',
  '',
  '4️⃣ <b>100% قالدۇق ۋە زاكاس كاپالىتى:</b>',
  'ئەگەر ھەرقانداق زاكاس 1 سائەتتىن ئېشىپ كەتسە سىستېما سىزگە ئالدىن ئەسكەرتىش بېرىدۇ، كىرگۈزۈلمەي قالغان ھەر بىر زاكاسنىڭ قالدۇق پۇلى %100 ھەميىنىڭىزگە دەرھال ئاپتوماتىك قايتۇرۇپ بېرىلىدۇ!',
  '',
  '━━━━━━━━━━━━━━━━━━',
  '🌐 <b>ھازىرلا ھېساباتىڭىزنى باغلاپ سىناپ بېقىڭ:</b>',
  '👉 <b>توربەت دۇكىنىمىز:</b> https://www.auto-cash.app/account',
  '🤖 <b>رەسمىي تېلېگرامما بوت:</b> @Autocash_24_bot',
  '📢 <b>رەسمىي قانىلىمىز:</b> @autocash_cannel',
  '💬 <b>خېرىدارلار مۇلازىمىتى:</b> @autocash_UYGHUR',
  '━━━━━━━━━━━━━━━━━━',
].join('\n');

const keyboard = {
  inline_keyboard: [
    [
      { text: '⚡️🛍️ توربەتتە تۇتاشتۇرۇش | Link Store ➔', url: 'https://www.auto-cash.app/account' },
    ],
    [
      { text: '🤖 تېلېگرامما بوتىمىز', url: 'https://t.me/Autocash_24_bot' },
      { text: '💬 خېرىدارلار مۇلازىمىتى', url: 'https://t.me/autocash_UYGHUR' },
    ],
  ],
};

async function broadcast() {
  console.log('--- Broadcasting Announcement ---');

  // 1. Channel
  try {
    const resChan = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channel,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard,
        disable_web_page_preview: true,
      }),
    });
    const dataChan = await resChan.json();
    console.log('Channel delivery result:', dataChan.ok ? `SUCCESS (Message ID: ${dataChan.result.message_id})` : dataChan);
  } catch (err) {
    console.error('Channel error:', err);
  }

  // 2. Admin & Subscribers
  const targetIds = [adminId];
  for (const sId of targetIds) {
    try {
      const resUser = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: sId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: keyboard,
          disable_web_page_preview: true,
        }),
      });
      const dataUser = await resUser.json();
      console.log(`User/Admin (${sId}) delivery result:`, dataUser.ok ? `SUCCESS (Message ID: ${dataUser.result.message_id})` : dataUser);
    } catch (err) {
      console.error(`User (${sId}) error:`, err);
    }
  }
}

broadcast();
