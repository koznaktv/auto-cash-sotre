const fs = require('fs');

let token = process.env.TELEGRAM_BOT_TOKEN;
let adminId = process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493';

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('TELEGRAM_BOT_TOKEN=')) token = trimmed.split('=')[1].trim();
    if (trimmed.startsWith('TELEGRAM_ADMIN_CHAT_ID=')) adminId = trimmed.split('=')[1].trim();
  });
}

console.log('Sending message to Admin ID:', adminId);

const msg = 
  '🎉 <b>AUTO CASH سىستېمىسىدىن ئۇقتۇرۇش!</b>\n\n' +
  '✅ <b>Google One-Tap ۋە رەسمىي كىرىش تولۇق پۈتتى!</b>\n\n' +
  '• <b>Google Client ID:</b> <code>52186498509-dgp17p4mnjkchps38od50hsm289k0eu8.apps.googleusercontent.com</code> تولۇق ئۇلاندى.\n' +
  '• <b>AUTO CASH لوگوسى:</b> كىرىش كۆزنىكىدىكى كونا قولۇپ ئورنىغا رەسمىي ئالتۇن ماركا بەلگىسى قويۇلدى.\n' +
  '• <b>1 چېكىپلا كىرىش:</b> پۈتۈنلەي بىخەتەر ۋە قولايلىق ھالەتتە 100% قوزغىتىلدى.\n\n' +
  '🌐 <b>توربەت ئۇلانمىلىرى:</b>\n' +
  '• PUBG: https://auto-cash-sotre.vercel.app/pubg.html\n' +
  '• MLBB: https://auto-cash-sotre.vercel.app/mlbb.html\n\n' +
  '<i>بارلىق تەلەپلىرىڭىز مۇۋەپپەقىيەتلىك تاماملىنىپ، سىستېما نورمال ئىشلەۋاتىدۇ.</i> 🚀';

fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: adminId,
    text: msg,
    parse_mode: 'HTML'
  })
})
.then(r => r.json())
.then(d => {
  console.log('Telegram API Result:', JSON.stringify(d));
})
.catch(err => console.error('Telegram Send Error:', err));
