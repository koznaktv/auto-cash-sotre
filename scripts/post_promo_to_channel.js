const https = require('https');
const fs = require('fs');
const path = require('path');

function getBotToken() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const l of lines) {
      if (l.startsWith('TELEGRAM_BOT_TOKEN=')) {
        return l.replace('TELEGRAM_BOT_TOKEN=', '').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return process.env.TELEGRAM_BOT_TOKEN || '8886426395:AAGYz2nDCPrtOyqDH-mmqSwq_ctIAvIBcKY';
}

function broadcastPromoToChannel(customText) {
  const token = getBotToken();
  const channel = '@autocash_cannel';

  const defaultText = [
    '🔥💎 <b>MOBILE LEGENDS | بۈگۈنكى ئالاھىدە چوڭ ئېتىبار پائالىيىتى!</b> 💎🔥',
    '',
    '⏰ <b>بۈگۈن كېچە سائەت 12:00 گىچە پۇرسەت غەنىيمەت!</b>',
    '',
    '👑 <b>گىلوبال سېرۋېر (Global Server):</b>',
    '🎫 Weekly Elite Bundle (ھەپتىلىك ئېلىت) ➔ <s>0.99$</s> | <b>0.87$</b>',
    '💎 Weekly Diamond Pass (ھەپتىلىك ئالماس پاس) ➔ <s>1.65$</s> | <b>1.55$</b>',
    '',
    '🇹🇷 <b>تۈركىيە سېرۋېرى (Turkish Server):</b>',
    '🎫 Weekly Elite Pack TR (تۈركىيە ھەپتىلىك ئېلىت) ➔ <s>1.05$</s> | <b>0.94$</b>',
    '💎 Weekly Pass TR (تۈركىيە ھەپتىلىك كارتىسى) ➔ <s>2.09$</s> | <b>2.03$</b>',
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '⚡️ بۈگۈن پائالىيەت قىلدۇق، كېچە سائەت 12:00 گىچە پۇرسەت غەنىيمەت!',
    '📩 قاچىلىماقچى بولغانلار دەرھال ئايرىم ئۇچۇر قىلىڭ!',
  ].join('\n');

  const text = customText || defaultText;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '⚡️🛍️ توربەتتىن سېتىۋېلىش ➔', url: 'https://www.auto-cash.app' },
        { text: '🤖 تېلېگرامما بوتى', url: 'https://t.me/Autocash_24_bot' }
      ],
      [
        { text: '💬 خېرىدارلار مۇلازىمىتى (DM)', url: 'https://t.me/autocash_UYGHUR' }
      ]
    ]
  };

  const payload = JSON.stringify({
    chat_id: channel,
    text: text,
    parse_mode: 'HTML',
    reply_markup: keyboard
  });

  return new Promise((resolve, reject) => {
    const req = https.request('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.ok) {
            console.log('Successfully posted promo announcement to channel:', parsed.result?.message_id);
            resolve(parsed);
          } else {
            console.error('Telegram API error:', parsed);
            resolve(parsed);
          }
        } catch (e) {
          console.log('Response body:', body);
          resolve(body);
        }
      });
    });

    req.on('error', err => {
      console.error('Request error:', err);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

if (require.main === module) {
  broadcastPromoToChannel();
}

module.exports = { broadcastPromoToChannel };
