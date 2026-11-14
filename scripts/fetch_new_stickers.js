const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BOT_TOKEN = '8886426395:AAHTtOA5ilIoNUfmcfVf44mCK6gJo7gjhd0';
const rootDir = path.resolve(__dirname, '..');

const stickersToFetch = [
  { id: '5334569747814055421', name: 'tg_pubg_uc_coin' },
  { id: '6170417452162225096', name: 'tg_mlbb_diamond_v2' },
  { id: '5879978238754692255', name: 'tg_mlbb_weekly_pass' }
];

function apiCall(method, params) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(params);
    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function downloadFile(filePath) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}

async function run() {
  console.log('Fetching sticker metadata...');
  const ids = stickersToFetch.map(s => s.id);
  const resp = await apiCall('getCustomEmojiStickers', { custom_emoji_ids: ids });
  if (!resp.ok) {
    console.error('Failed to get stickers:', resp);
    return;
  }
  console.log('Found stickers:', resp.result.length);
  for (let i = 0; i < resp.result.length; i++) {
    const st = resp.result[i];
    const def = stickersToFetch.find(s => s.id === st.custom_emoji_id);
    console.log(`Sticker: ${def ? def.name : st.custom_emoji_id}, is_animated: ${st.is_animated}, is_video: ${st.is_video}`);
    
    // 1. Download thumbnail if available
    if (st.thumbnail) {
      const thumbFile = await apiCall('getFile', { file_id: st.thumbnail.file_id });
      if (thumbFile.ok) {
        const thumbBuf = await downloadFile(thumbFile.result.file_path);
        const thumbPath = path.join(rootDir, 'public', `${def.name}_thumb.webp`);
        fs.writeFileSync(thumbPath, thumbBuf);
        console.log(`Saved thumb to ${thumbPath}`);
      }
    }
    
    // 2. Download main file
    const fileRes = await apiCall('getFile', { file_id: st.file_id });
    if (!fileRes.ok) {
      console.error('Failed to get file for', st.file_id);
      continue;
    }
    const fileBuf = await downloadFile(fileRes.result.file_path);
    if (st.is_animated) {
      // TGS file (gzipped lottie JSON)
      const decompressed = zlib.gunzipSync(fileBuf);
      const jsonPath = path.join(rootDir, 'public', `${def.name}.json`);
      fs.writeFileSync(jsonPath, decompressed);
      console.log(`Saved decompressed Lottie JSON to ${jsonPath}`);
    } else if (st.is_video) {
      // WebM
      const webmPath = path.join(rootDir, 'public', `${def.name}.webm`);
      fs.writeFileSync(webmPath, fileBuf);
      console.log(`Saved video WebM to ${webmPath}`);
    } else {
      // Static WebP
      const webpPath = path.join(rootDir, 'public', `${def.name}.webp`);
      fs.writeFileSync(webpPath, fileBuf);
      console.log(`Saved static WebP to ${webpPath}`);
    }
  }
}

run();
