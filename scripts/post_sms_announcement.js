const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
let token = '';
for (const line of env.split('\n')) {
  if (line.startsWith('TELEGRAM_BOT_TOKEN=')) {
    token = line.replace('TELEGRAM_BOT_TOKEN=', '').trim().replace(/^['"]|['"]$/g, '');
    break;
  }
}

if (!token) {
  token = Buffer.from('ODg4NjQyNjM5NTpBQUhUdE9BNWlsSW9OVWZtY2ZWZjQ0bUNLNmdKbzdnamhkMA==', 'base64').toString('utf-8');
}

const text = [
  '📲 <b>خۇش خەۋەر: مەۋھۇم نومۇر (SMS) مۇلازىمىتى پۈتۈنلەي ئوڭشالدى ۋە يېڭىلاندى!</b> ⚡️',
  '━━━━━━━━━━━━━━━━━━━━━━',
  '👋 ھۆرمەتلىك <b>AUTO CASH</b> خېرىدارلىرى!',
  '',
  'تور بېكىتىمىز ۋە تېلېگرامما بوتىمىزدىكى <b>مەۋھۇم نومۇر (SMS Verification)</b> سىستېمىسى ئەڭ يېڭى كېلىشىم بويىچە تولۇق ئوڭشالدى ۋە ئەلالاشتۇرۇلدى! ئەمدى خالىغان ئەپكە دەل ۋاقتىدا سېكۇنتتا كود تاپشۇرۇۋالالايسىز.',
  '',
  '💡 <b>مۇھىم تەكلىپ (كودنىڭ تېز كېلىشى ئۈچۈن):</b>',
  'نومۇر سېتىۋېلىشتىن بۇرۇن، قايسى رايون/دۆلەتنىڭ نومۇرىنى تاللىغان بولسىڭىز، تېلېفونىڭىزدا <b>شۇ رايوننىڭ VPN سىنى قوزغىتىپ</b> ئاندىن ئەپكە نومۇر كىرگۈزۈشنى تەۋسىيە قىلىمىز. بۇ Telegram، WhatsApp ياكى باشقا ئەپلەرنىڭ تەستىق كودىنى تېز ۋە بىخەتەر ئەۋەتىشىگە ناھايىتى كۈچلۈك تۈرتكە بولىدۇ!',
  '',
  '🛡 <b>100% پۇل قايتۇرۇش كاپالىتى:</b>',
  'ئەگەر سېتىۋالغان نومۇرغا كود كەلمىسە ياكى ئېلىشتىن ۋاز كەچسىڭىز ئەنسىرىمەڭ! بەتتىكى <b>«نومۇرنى بىكار قىلىش» (إلغاء الرقم)</b> كۇنۇپكىسىنى باسسىڭىزلا، كېسىلگەن پۇلىڭىز 1 سېكۇنتتا ھەميانىڭىزغا تولۇق قايتۇرۇلىدۇ!',
  '',
  '📱 <b>قوللايدىغان ئالقىشلىق ئەپلەر:</b>',
  '• Telegram, WhatsApp, TikTok, Google',
  '• Discord, OpenAI (ChatGPT), Instagram, Facebook',
  '• Twitter (X), IMO, Snapchat ۋە باشقا 500 دىن ئارتۇق ئەپ!',
  '',
  '🛒 <b>ھازىرلا تۆۋەندىكى كۇنۇپكىنى بېسىپ مەۋھۇم نومۇر ئېلىڭ:</b>',
  '━━━━━━━━━━━━━━━━━━━━━━'
].join('\n');

const keyboard = {
  inline_keyboard: [
    [
      { text: '📲 مەۋھۇم نومۇر ئېلىش ➔', url: 'https://www.auto-cash.app/numbers' },
      { text: '🤖 تېلېگرامما بوتتا ئېچىش ⚡️', url: 'https://t.me/Autocash_24_bot?startapp=numbers' }
    ],
    [
      { text: '🌐 توربەت ئاساسىي بەت 🛒', url: 'https://www.auto-cash.app' },
      { text: '💬 خېرىدارلار مۇلازىمىتى 👨‍💻', url: 'https://t.me/autocash_UYGHUR' }
    ]
  ]
};

async function postAnnouncement() {
  const targets = ['@autocash_cannel', '7575664493'];

  for (const chatId of targets) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: keyboard,
        }),
      });
      const data = await res.json();
      console.log(`Sent to ${chatId}:`, data.ok ? 'SUCCESS' : data.description);
    } catch (e) {
      console.error(`Error sending to ${chatId}:`, e.message);
    }
  }
}

postAnnouncement();
