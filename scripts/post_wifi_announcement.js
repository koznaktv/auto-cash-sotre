const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
let token = '';
for (const line of env.split('\n')) {
  if (line.startsWith('TELEGRAM_BOT_TOKEN=')) {
    token = line.replace('TELEGRAM_BOT_TOKEN=', '').trim();
    break;
  }
}

if (!token) {
  console.error('Token not found');
  process.exit(1);
}

const text = [
  '📶 <b>خۇش خەۋەر: ۋايفاي (Wi-Fi) تور كارتىلىرى تامامەن تولۇقلاندى!</b> ⚡️',
  '━━━━━━━━━━━━━━━━━━━━━━',
  '👋 ھۆرمەتلىك <b>AUTO CASH</b> خېرىدارلىرى!',
  '',
  'بارلىق تور رايونلىرى بويىچە رەقەملىك <b>Wi-Fi تور كارتىلىرى</b> يېڭىلىنىپ، تولۇق ئامبارغا قاچىلاندى! ئەمدى خالىغان ۋاقىتتا سېكۇنتتا سېتىۋالالايسىز.',
  '',
  '🌐 <b>تولۇقلانغان تور تۈرلىرى:</b>',
  '➊ <b>شبكة الفرسان (كفر جالس)</b> — Fursan Net Kafer Jalis',
  '➋ <b>شبكة الفرسان (كفريا)</b> — Fursan Net Kafraya',
  '➌ <b>شبكة عزيز نت</b> — Azez Net',
  '➍ <b>شبكة المجاهد نت</b> — Al Mujahid Net',
  '',
  '📦 <b>سىغىم ۋە تاللاش بولاقلىرى:</b>',
  '• <b>1 جيجا</b> (1GB / 3 كۈنلۈك) ➔ <b>$0.12</b>',
  '• <b>2 جيجا</b> (2GB / 5 كۈنلۈك) ➔ <b>$0.23</b>',
  '• <b>4 جيجا</b> (4GB / 7 كۈنلۈك) ➔ <b>$0.34</b>',
  '• <b>6 جيجا</b> (6GB / 7 كۈنلۈك) ➔ <b>$0.45</b>',
  '',
  '⚡️ <b>ئارتۇقچىلىقلىرى ۋە كاپالەت:</b>',
  '✅ پۇل چىقىرىلغان ھامان 1 سېكۇنتتا كارتىنىڭ <b>اسم المستخدم (Username)</b> ۋە <b>كلمة المرور (Password)</b> ئېكراندا چىقىدۇ!',
  '✅ تېلېگرامما بوتىمىز ۋە توربەت ئارقىلىق 24 سائەت توختاۋسىز سېتىۋېلىشقا بولىدۇ.',
  '✅ ئامبار ئاپتوماتىك باشقۇرۇلىدۇ، ھەر بىر كارتا 100% يېڭى ۋە تەكرارلانمايدۇ.',
  '',
  '🛒 <b>ھازىرلا تۆۋەندىكى كۇنۇپكىنى بېسىپ دۇكاندىن سېتىۋېلىڭ:</b>',
  '━━━━━━━━━━━━━━━━━━━━━━'
].join('\n');

const keyboard = {
  inline_keyboard: [
    [
      { text: '⚡️🛍️ دۇكاننى ئېچىش | كارتىلارنى كۆرۈش ➔', url: 'https://t.me/Autocash_24_bot?startapp=wifi' },
      { text: '🌐 توربەتتىن سېتىۋېلىش 🛒', url: 'https://www.auto-cash.app' }
    ],
    [
      { text: '🤖 قاچىلاش بوتى ⚡️', url: 'https://t.me/Autocash_24_bot' },
      { text: '💬 خېرىدارلار مۇلازىمىتى 👨‍💻', url: 'https://t.me/autocash_UYGHUR' }
    ]
  ]
};

async function broadcast() {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: '@autocash_cannel',
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: keyboard
    })
  });
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

broadcast();
