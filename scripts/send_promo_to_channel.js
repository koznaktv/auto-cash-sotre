const fs = require('fs');

function getBotToken() {
  const envFiles = ['AUTO_CASH/.env.local', 'AUTO_CASH/.env'];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      for (const l of lines) {
        if (l.startsWith('TELEGRAM_BOT_TOKEN=')) {
          let val = l.replace('TELEGRAM_BOT_TOKEN=', '').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (val) return val;
        }
      }
    }
  }
  return null;
}

const TELEGRAM_CONFIG = {
  botUsername: 'Autocash_24_bot',
  channelId: '-1004310150591',
  channelUsername: 'autocash_cannel',
  supportUrl: 'https://t.me/autocash_UYGHUR',
  supportUsername: 'autocash_UYGHUR',
  storeUrl: 'https://www.auto-cash.app',
};

const promoBody = `
📢 <b>كەڭ كۆلەملىك باھا چۈشۈرۈش خۇشخەۋىرى!</b> 🎉

ھۆرمەتلىك خېرىدارلار، سىلەرنىڭ تەلىپىڭىزگە ئاساسەن دۇكىنىمىزدىكى <b>MTN</b> ۋە <b>Syriatel</b> نىڭ بارلىق تۈرلىرىنىڭ باھاسى <b>كەڭ كۆلەمدە چۈشۈرۈلدى!</b> ئەڭ ئەرزان باھا ۋە سۈپەتلىك مۇلازىمەت سىزنى كۈتمەكتە.

⚡️ <b>MTN بىرلىكلىرى (وحدات MTN):</b>
🔹 100 بىرلىك ➜ <b>$0.80</b>
🔹 200 بىرلىك ➜ <b>$1.59</b>
🔹 300 بىرلىك ➜ <b>$2.39</b>
🔹 500 بىرلىك ➜ <b>$3.98</b>
🔹 1000 بىرلىك ➜ <b>$7.96</b>
🔹 2000 بىرلىك ➜ <b>$15.92</b>
🔹 3000 بىرلىك ➜ <b>$23.88</b>
🔹 5000 بىرلىك ➜ <b>$39.80</b>

⚡️ <b>Syriatel بىرلىكلىرى (وحدات سيريتيل):</b>
🔹 20.19 بىرلىك ➜ <b>$0.16</b>
🔹 48.07 بىرلىك ➜ <b>$0.38</b>
🔹 96.15 بىرلىك ➜ <b>$0.77</b>
🔹 144.23 بىرلىك ➜ <b>$1.15</b>
🔹 288.46 بىرلىك ➜ <b>$2.30</b>
🔹 576.92 بىرلىك ➜ <b>$4.61</b>

💰 <b>Syriatel كاش (SYRIATEL CASH):</b>
🔸 10,000 كاش ➜ <b>$0.78</b>
🔸 50,000 كاش ➜ <b>$3.92</b>
🔸 100,000 كاش ➜ <b>$7.84</b>
🔸 250,000 كاش ➜ <b>$19.60</b>
🔸 1,000,000 كاش ➜ <b>$78.40</b>

🚀 <b>ئالاھىدىلىكىمىز:</b>
✅ 24 سائەت تولۇق ئاپتوماتىك قاچىلاش (سېكۇنتتا كىرىدۇ)
✅ ئەڭ يېڭى، ئەڭ تۆۋەن ئەرزان باھا كاپالىتى
`.trim();

const formattedMessage = `
🔥 <b>AUTO CASH | ئالاھىدە خەۋەر & تەشۋىقات</b> 🔥
━━━━━━━━━━━━━━━━━━
${promoBody}
━━━━━━━━━━━━━━━━━━
⚡️ <b>ئەڭ ئەرزان باھا • 24/7 شۇئان قاچىلاش • بىخەتەر كاپالەت</b>
🛒 <b>رەسمىي دۇكان:</b> ${TELEGRAM_CONFIG.storeUrl}
📢 <b>تېلېگرام قانىلىمىز:</b> @${TELEGRAM_CONFIG.channelUsername}
💬 <b>خېرىدارلار مۇلازىمىتى:</b> @${TELEGRAM_CONFIG.supportUsername}
`.trim();

const keyboard = {
  inline_keyboard: [
    [
      { text: '⚡️🛍️ دۇكاننى ئېچىش ➔', url: `https://t.me/${TELEGRAM_CONFIG.botUsername}?startapp=store` },
      { text: '🌐 توربەت دۇكىنى 🛒', url: TELEGRAM_CONFIG.storeUrl },
    ],
    [
      { text: '🤖 قاچىلاش بوتى ⚡️', url: `https://t.me/${TELEGRAM_CONFIG.botUsername}` },
      { text: '💬 خېرىدارلار مۇلازىمىتى 👨‍💻', url: TELEGRAM_CONFIG.supportUrl },
    ],
  ],
};

async function send() {
  const token = getBotToken();
  if (!token) {
    console.error('Bot token missing!');
    process.exit(1);
  }

  const targets = [
    TELEGRAM_CONFIG.channelId,
    `@${TELEGRAM_CONFIG.channelUsername}`
  ];

  for (const target of targets) {
    console.log('Sending to target:', target);
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: target,
          text: formattedMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: keyboard,
        }),
      });
      const data = await res.json();
      console.log('Response for', target, ':', data);
      if (data.ok) {
        console.log('SUCCESS! Message ID:', data.result?.message_id);
        break;
      }
    } catch (e) {
      console.error('Error for', target, ':', e.message);
    }
  }
}

send();
