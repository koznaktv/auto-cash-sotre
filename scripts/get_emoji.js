const fs = require('fs');
const path = require('path');

let token = '';
const envPath = fs.existsSync('.env.local') ? '.env.local' : path.join(__dirname, '../.env.local');
const content = fs.readFileSync(envPath, 'utf8');
content.split('\n').forEach(line => {
  if (line.trim().startsWith('TELEGRAM_BOT_TOKEN=')) token = line.trim().split('=')[1].trim();
});

async function run() {
  try {
    const url = 'https://api.telegram.org/bot' + token + '/getCustomEmojiStickers?custom_emoji_ids=%5B%226296218646284863141%22%5D';
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    console.log('Result:', JSON.stringify(data, null, 2));

    if (data.ok && data.result && data.result.length > 0) {
      const fileId = data.result[0].file_id;
      console.log('Sticker info:', data.result[0]);
      const fileRes = await fetch('https://api.telegram.org/bot' + token + '/getFile?file_id=' + fileId);
      const fileData = await fileRes.json();
      console.log('File info:', fileData);
    }
  } catch(e) {
    console.error('Fetch error:', e.message);
  }
}
run();
