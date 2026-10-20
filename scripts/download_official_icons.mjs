import fs from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'services');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const APPS = [
  // --- Games shown in User Screenshot ---
  { id: 'clash_of_clans', name: 'Clash of Clans', search: 'Clash of Clans' },
  { id: 'brawl_stars', name: 'Brawl Stars', search: 'Brawl Stars' },
  { id: 'blood_strike', name: 'Blood Strike', search: 'Blood Strike' },
  { id: 'ball_pool_8', name: '8 Ball Pool', search: '8 Ball Pool' },
  { id: 'honor_of_kings', name: 'Honor of Kings', search: 'Honor of Kings' },
  { id: 'genshin_impact', name: 'Genshin Impact', search: 'Genshin Impact' },
  { id: 'free_fire', name: 'Free Fire', search: 'Free Fire' },
  { id: 'farlight_84', name: 'Farlight 84', search: 'Farlight 84' },
  { id: 'jawaker', name: 'Jawaker', search: 'Jawaker' },
  {
    id: 'borneo_schematics',
    name: 'Borneo Schematics',
    fallbackDirectUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=512&auto=format&fit=crop&q=80',
  },
  {
    id: 'decoders_tools',
    name: 'Decoders Tools',
    search: 'GSM Tools',
    fallbackDirectUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=512&auto=format&fit=crop&q=80',
  },
  { id: 'playstation', name: 'PlayStation', search: 'PlayStation App' },

  // --- Other major games ---
  { id: 'pubg_mobile', name: 'PUBG Mobile', search: 'PUBG MOBILE' },
  { id: 'pubg_new_state', name: 'PUBG New State', search: 'NEW STATE Mobile' },
  { id: 'call_of_duty', name: 'Call of Duty Mobile', search: 'Call of Duty Mobile' },
  { id: 'roblox', name: 'Roblox', search: 'Roblox' },
  { id: 'clash_royale', name: 'Clash Royale', search: 'Clash Royale' },
  { id: 'hay_day', name: 'Hay Day', search: 'Hay Day' },
  { id: 'yalla_ludo', name: 'Yalla Ludo', search: 'Yalla Ludo' },
  { id: 'kamlna', name: 'Kamlna', search: 'Kamlna' },
  { id: 'weplay', name: 'WePlay', search: 'WePlay Party Game' },
  { id: 'top_war', name: 'Top War', search: 'Top War Battle Game' },
  { id: 'revenge_of_sultans', name: 'Revenge of Sultans', search: 'Revenge of Sultans' },
  { id: 'king_of_avalon', name: 'King of Avalon', search: 'King of Avalon' },
  { id: 'mobile_legends', name: 'Mobile Legends', search: 'Mobile Legends Bang Bang' },
  { id: 'fc_mobile', name: 'EA SPORTS FC Mobile', search: 'EA SPORTS FC Mobile' },
  { id: 'fortnite', name: 'Fortnite', search: 'Epic Games' },

  // --- Social & Chat Apps ---
  { id: 'tiktok', name: 'TikTok', search: 'TikTok' },
  { id: 'telegram', name: 'Telegram', search: 'Telegram Messenger' },
  { id: 'snapchat', name: 'Snapchat', search: 'Snapchat' },
  { id: 'imo', name: 'Imo', search: 'imo video calls' },
  { id: 'azar', name: 'Azar', search: 'Azar - Video Chat' },
  { id: 'livu', name: 'LivU', search: 'LivU' },
  { id: 'tumile', name: 'Tumile', search: 'Tumile' },
  { id: 'mixu', name: 'MixU', search: 'MixU' },
  { id: 'miyo', name: 'Miyo', search: 'Miyo Live' },
  { id: 'hicat', name: 'HiCat', search: 'HiCat' },
  { id: 'likee', name: 'Likee', search: 'Likee' },

  // --- AI, Productivity & Streaming ---
  { id: 'chatgpt', name: 'ChatGPT', search: 'ChatGPT' },
  { id: 'canva', name: 'Canva', search: 'Canva' },
  { id: 'capcut', name: 'CapCut', search: 'CapCut Video Editor' },
  { id: 'netflix', name: 'Netflix', search: 'Netflix' },
  { id: 'spotify', name: 'Spotify', search: 'Spotify' },
  { id: 'anghami', name: 'Anghami', search: 'Anghami' },
  { id: 'shahid', name: 'Shahid VIP', search: 'Shahid' },

  // --- Gift Cards & Storefronts ---
  { id: 'steam', name: 'Steam', search: 'Steam Mobile' },
  { id: 'google_play', name: 'Google Play', search: 'Google Play Games' },
  { id: 'apple_itunes', name: 'Apple Gift Cards', search: 'Apple Support' },
  { id: 'razer_gold', name: 'Razer Gold', search: 'Razer Cortex' },

  // --- Telecom & Financial ---
  { id: 'syriatel', name: 'Syriatel', search: 'Syriatel' },
  { id: 'mtn', name: 'MTN', search: 'MTN MoMo' },
  { id: 'turkcell', name: 'Turkcell', search: 'Turkcell' },
  { id: 'turk_telekom', name: 'Turk Telekom', search: 'Turk Telekom' },
  { id: 'crypto_usdt', name: 'Tether USDT', search: 'Binance' },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAppStoreIcon(term) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results[0]) {
      return data.results[0].artworkUrl512 || data.results[0].artworkUrl100 || null;
    }
  } catch (err) {}
  return null;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length < 500) throw new Error('File too small');
  fs.writeFileSync(destPath, buffer);
  return buffer.length;
}

async function main() {
  console.log(`Starting official icon downloads for ${APPS.length} services...`);
  const results = {};

  for (const app of APPS) {
    const targetFile = path.join(OUT_DIR, `${app.id}.jpg`);
    const targetFilePng = path.join(OUT_DIR, `${app.id}.png`);

    // Skip if already downloaded and size > 2KB
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 2000) {
      results[app.id] = { name: app.name, path: `/images/services/${app.id}.jpg`, size: fs.statSync(targetFile).size };
      continue;
    }
    if (fs.existsSync(targetFilePng) && fs.statSync(targetFilePng).size > 2000) {
      results[app.id] = { name: app.name, path: `/images/services/${app.id}.png`, size: fs.statSync(targetFilePng).size };
      continue;
    }

    let iconUrl = null;
    if (app.directUrl) {
      iconUrl = app.directUrl;
    } else if (app.search) {
      iconUrl = await fetchAppStoreIcon(app.search);
      await sleep(150);
    }

    if (!iconUrl && app.fallbackDirectUrl) {
      iconUrl = app.fallbackDirectUrl;
    }

    if (!iconUrl) {
      console.warn(`[FAIL] Could not find icon URL for: ${app.name}`);
      continue;
    }

    const isPng = /\.png($|\?)/i.test(iconUrl);
    const finalDest = isPng ? targetFilePng : targetFile;
    const publicRelPath = `/images/services/${path.basename(finalDest)}`;

    try {
      const bytes = await downloadImage(iconUrl, finalDest);
      console.log(`[OK] ${app.name} -> ${publicRelPath} (${(bytes / 1024).toFixed(1)} KB)`);
      results[app.id] = { name: app.name, path: publicRelPath, size: bytes };
    } catch (err) {
      console.error(`[ERR] Failed downloading ${app.name}:`, err.message);
    }
  }

  // Save the manifest
  const manifestPath = path.join(process.cwd(), 'public', 'images', 'services', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nAll done! Total official icons saved: ${Object.keys(results).length} / ${APPS.length}`);
}

main().catch(console.error);
