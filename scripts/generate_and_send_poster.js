const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cwd = process.cwd();

// 1. Read .env.local for bot token
let botToken = '';
let adminChatId = '7575664493';
const envPath = path.join(cwd, '.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('TELEGRAM_BOT_TOKEN=')) {
      botToken = trimmed.split('=')[1].trim().replace(/^['\"]|['\"]$/g, '');
    }
    if (trimmed.startsWith('TELEGRAM_ADMIN_CHAT_ID=')) {
      adminChatId = trimmed.split('=')[1].trim().replace(/^['\"]|['\"]$/g, '');
    }
  });
}

console.log('Bot token present:', Boolean(botToken));
console.log('Admin Chat ID:', adminChatId);

// 2. Read font & images as Base64
const fontPath = path.join(cwd, 'public', 'fonts', 'ALKATIPBasmaTom-Bold.ttf');
const fontRegularPath = path.join(cwd, 'public', 'fonts', 'ALKATIPBasmaTom.ttf');
const fontBase64 = fs.existsSync(fontPath) ? fs.readFileSync(fontPath).toString('base64') : '';
const fontRegularBase64 = fs.existsSync(fontRegularPath) ? fs.readFileSync(fontRegularPath).toString('base64') : fontBase64;

const pubgImgPath = path.join(cwd, 'public', 'images', 'services', 'pubg_mobile.jpg');
const pubgImgBase64 = fs.existsSync(pubgImgPath) ? fs.readFileSync(pubgImgPath).toString('base64') : '';

const logoPath = path.join(cwd, 'public', 'brand_logo.png');
const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString('base64') : '';

// 3. Generate HTML with 100% proper Uyghur RTL typography & CSS gradients
const htmlContent = `<!DOCTYPE html>
<html lang="ug" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>AUTO CASH - PUBG Mobile Flash Sale</title>
  <style>
    @font-face {
      font-family: 'AlkatipBold';
      src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
      font-weight: bold;
    }
    @font-face {
      font-family: 'Alkatip';
      src: url('data:font/truetype;charset=utf-8;base64,${fontRegularBase64}') format('truetype');
      font-weight: normal;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      background-color: #030712;
      background-image: 
        radial-gradient(circle at 80% 15%, rgba(245, 158, 11, 0.18) 0%, transparent 40%),
        radial-gradient(circle at 20% 45%, rgba(239, 68, 68, 0.15) 0%, transparent 45%),
        radial-gradient(circle at 50% 85%, rgba(6, 182, 212, 0.16) 0%, transparent 50%),
        linear-gradient(180deg, #020617 0%, #090e1a 45%, #020617 100%);
      font-family: 'Alkatip', 'Segoe UI', Tahoma, sans-serif;
      color: #ffffff;
      padding: 38px 42px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    /* Subtle futuristic grid overlay */
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(245, 158, 11, 0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(245, 158, 11, 0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    /* Header Bar */
    .top-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid rgba(245, 158, 11, 0.25);
      padding-bottom: 20px;
      position: relative;
      z-index: 2;
    }

    .brand-area {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      width: 68px;
      height: 68px;
      border-radius: 18px;
      border: 2px solid #f59e0b;
      box-shadow: 0 0 25px rgba(245, 158, 11, 0.4);
      object-fit: cover;
    }

    .brand-title {
      font-family: 'AlkatipBold', sans-serif;
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(90deg, #fbbf24, #f59e0b, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 0.5px;
      line-height: 1.2;
    }

    .brand-sub {
      font-size: 14px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .header-badges {
      display: flex;
      gap: 12px;
    }

    .pill-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 9999px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(245, 158, 11, 0.4);
      font-size: 13px;
      color: #fde68a;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    }

    /* Hero Banner */
    .hero-banner {
      position: relative;
      z-index: 2;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
      border: 2px solid rgba(245, 158, 11, 0.45);
      border-radius: 28px;
      padding: 24px 30px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.15);
      margin-top: 15px;
      margin-bottom: 20px;
    }

    .hero-info {
      flex: 1;
    }

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(90deg, #dc2626, #b91c1c);
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
      margin-bottom: 10px;
    }

    .hero-title {
      font-family: 'AlkatipBold', sans-serif;
      font-size: 38px;
      font-weight: bold;
      line-height: 1.25;
      color: #ffffff;
      text-shadow: 0 3px 10px rgba(0, 0, 0, 0.8);
    }

    .hero-title span {
      background: linear-gradient(90deg, #fef08a, #f59e0b, #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-desc {
      font-size: 15px;
      color: #cbd5e1;
      margin-top: 8px;
      line-height: 1.5;
    }

    .hero-avatar {
      width: 110px;
      height: 110px;
      border-radius: 24px;
      border: 3px solid #f59e0b;
      box-shadow: 0 0 35px rgba(245, 158, 11, 0.5);
      object-fit: cover;
      margin-right: 20px;
    }

    /* 6-Card Grid: 2 Columns x 3 Rows */
    .deals-grid {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .deal-card {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(2, 6, 23, 0.95) 100%);
      border: 1.5px solid rgba(245, 158, 11, 0.35);
      border-radius: 22px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
      position: relative;
      overflow: hidden;
    }

    .deal-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #f59e0b, transparent);
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .uc-amount {
      display: flex;
      align-items: baseline;
      gap: 8px;
      direction: ltr;
    }

    .uc-number {
      font-family: 'Segoe UI', Impact, Arial, sans-serif;
      font-size: 34px;
      font-weight: 900;
      color: #38bdf8;
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
      letter-spacing: -0.5px;
    }

    .uc-label {
      font-size: 20px;
      font-weight: 800;
      color: #facc15;
    }

    .discount-pill {
      background: linear-gradient(135deg, #ef4444, #b91c1c);
      color: #ffffff;
      font-size: 13px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4);
      direction: ltr;
    }

    .card-pricing {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 10px 14px;
      margin-bottom: 8px;
    }

    .price-box {
      display: flex;
      flex-direction: column;
    }

    .price-label {
      font-size: 11px;
      color: #94a3b8;
    }

    .price-old {
      font-family: 'Segoe UI', Tahoma, monospace;
      font-size: 15px;
      color: #64748b;
      text-decoration: line-through;
      direction: ltr;
      font-weight: bold;
    }

    .price-new {
      font-family: 'Segoe UI', Tahoma, monospace;
      font-size: 24px;
      font-weight: 900;
      color: #34d399;
      text-shadow: 0 0 15px rgba(52, 211, 153, 0.5);
      direction: ltr;
      line-height: 1.1;
    }

    .card-footer-tip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #cbd5e1;
      padding-top: 4px;
    }

    .tip-tag {
      color: #fde047;
      font-size: 11px;
      font-weight: bold;
    }

    .buy-cue {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #38bdf8;
      font-weight: bold;
      font-size: 12px;
    }

    /* Trust Highlights */
    .trust-strip {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .trust-item {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 14px;
      padding: 10px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .trust-icon {
      font-size: 20px;
    }

    .trust-text {
      font-size: 12px;
      color: #e2e8f0;
      font-weight: bold;
      line-height: 1.3;
    }

    /* Footer CTA */
    .bottom-footer {
      position: relative;
      z-index: 2;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
      border: 2px solid rgba(245, 158, 11, 0.4);
      border-radius: 24px;
      padding: 18px 26px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .contacts-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .contact-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #f1f5f9;
    }

    .contact-row strong {
      color: #fde047;
      direction: ltr;
      font-family: 'Segoe UI', Tahoma, sans-serif;
    }

    .cta-button {
      background: linear-gradient(90deg, #f59e0b, #f97316);
      color: #030712;
      font-family: 'AlkatipBold', sans-serif;
      font-size: 18px;
      font-weight: bold;
      padding: 14px 30px;
      border-radius: 18px;
      box-shadow: 0 0 25px rgba(245, 158, 11, 0.6);
      display: flex;
      align-items: center;
      gap: 10px;
    }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header class="top-header">
    <div class="brand-area">
      <img src="data:image/png;base64,${logoBase64}" class="brand-logo" alt="Logo">
      <div>
        <h1 class="brand-title">AUTO CASH</h1>
        <p class="brand-sub">رەسمىي ئېلېكترونلۇق مۇلازىمەت ۋە ئويۇن قاچىلاش سۇپىسى</p>
      </div>
    </div>
    <div class="header-badges">
      <div class="pill-badge">
        <span>⚡</span>
        <span>24/7 ئاپتوماتىك</span>
      </div>
      <div class="pill-badge">
        <span>🛡</span>
        <span>100% رەسمىي كاپالەت</span>
      </div>
    </div>
  </header>

  <!-- Hero Banner -->
  <section class="hero-banner">
    <div class="hero-info">
      <div class="hero-tag">🔥 چەكلىك ۋاقىتلىق چوڭ ئېتىبار پائالىيىتى</div>
      <h2 class="hero-title">PUBG Mobile <span>UC تېز قاچىلاش</span></h2>
      <p class="hero-desc">پۇرسەتنى قولدىن بەرمەڭ! تەمىنلىگۈچىنىڭ تەننەرخ باھاسىدا دەرھال كىرىدۇ. پەقەت ئويۇنچى ID نومۇرىڭىز بولسىلا كۇپايە.</p>
    </div>
    <img src="data:image/jpeg;base64,${pubgImgBase64}" class="hero-avatar" alt="PUBG">
  </section>

  <!-- 6-Card Grid: 2 Columns x 3 Rows -->
  <main class="deals-grid">
    <!-- Card 1: 60 UC -->
    <div class="deal-card">
      <div class="card-top">
        <div class="uc-amount">
          <span class="uc-number">60</span>
          <span class="uc-label">UC</span>
        </div>
        <div class="discount-pill">-2%</div>
      </div>
      <div class="card-pricing">
        <div class="price-box">
          <span class="price-label">ئەسلى باھاسى:</span>
          <span class="price-old">$0.95</span>
        </div>
        <div class="price-box" style="align-items: flex-end;">
          <span class="price-label">ئېتىبار باھاسى:</span>
          <span class="price-new">$0.93</span>
        </div>
      </div>
      <div class="card-footer-tip">
        <span class="tip-tag">⚡ 1-3 سېكۇنتتا كىرىدۇ</span>
        <span class="buy-cue">سېتىۋېلىش &gt;</span>
      </div>
    </div>

    <!-- Card 2: 325 UC -->
    <div class="deal-card">
      <div class="card-top">
        <div class="uc-amount">
          <span class="uc-number">325</span>
          <span class="uc-label">UC</span>
        </div>
        <div class="discount-pill">-11%</div>
      </div>
      <div class="card-pricing">
        <div class="price-box">
          <span class="price-label">ئەسلى باھاسى:</span>
          <span class="price-old">$4.75</span>
        </div>
        <div class="price-box" style="align-items: flex-end;">
          <span class="price-label">ئېتىبار باھاسى:</span>
          <span class="price-new">$4.23</span>
        </div>
      </div>
      <div class="card-footer-tip">
        <span class="tip-tag">🔥 قىزىق سېتىلىۋاتىدۇ</span>
        <span class="buy-cue">سېتىۋېلىش &gt;</span>
      </div>
    </div>

    <!-- Card 3: 660 UC -->
    <div class="deal-card">
      <div class="card-top">
        <div class="uc-amount">
          <span class="uc-number">660</span>
          <span class="uc-label">UC</span>
        </div>
        <div class="discount-pill">-12%</div>
      </div>
      <div class="card-pricing">
        <div class="price-box">
          <span class="price-label">ئەسلى باھاسى:</span>
          <span class="price-old">$9.50</span>
        </div>
        <div class="price-box" style="align-items: flex-end;">
          <span class="price-label">ئېتىبار باھاسى:</span>
          <span class="price-new">$8.36</span>
        </div>
      </div>
      <div class="card-footer-tip">
        <span class="tip-tag">💎 ئالقىشقا ئېرىشكەن</span>
        <span class="buy-cue">سېتىۋېلىش &gt;</span>
      </div>
    </div>

    <!-- Card 4: 1800 UC -->
    <div class="deal-card">
      <div class="card-top">
        <div class="uc-amount">
          <span class="uc-number">1800</span>
          <span class="uc-label">UC</span>
        </div>
        <div class="discount-pill">-13%</div>
      </div>
      <div class="card-pricing">
        <div class="price-box">
          <span class="price-label">ئەسلى باھاسى:</span>
          <span class="price-old">$24.11</span>
        </div>
        <div class="price-box" style="align-items: flex-end;">
          <span class="price-label">ئېتىبار باھاسى:</span>
          <span class="price-new">$21.07</span>
        </div>
      </div>
      <div class="card-footer-tip">
        <span class="tip-tag">✨ كۆپ ئېتىبارلىق</span>
        <span class="buy-cue">سېتىۋېلىش &gt;</span>
      </div>
    </div>

    <!-- Card 5: 3850 UC -->
    <div class="deal-card">
      <div class="card-top">
        <div class="uc-amount">
          <span class="uc-number">3850</span>
          <span class="uc-label">UC</span>
        </div>
        <div class="discount-pill">-13%</div>
      </div>
      <div class="card-pricing">
        <div class="price-box">
          <span class="price-label">ئەسلى باھاسى:</span>
          <span class="price-old">$47.93</span>
        </div>
        <div class="price-box" style="align-items: flex-end;">
          <span class="price-label">ئېتىبار باھاسى:</span>
          <span class="price-new">$41.78</span>
        </div>
      </div>
      <div class="card-footer-tip">
        <span class="tip-tag">⭐ ئەڭ ياخشى قىممەت</span>
        <span class="buy-cue">سېتىۋېلىش &gt;</span>
      </div>
    </div>

    <!-- Card 6: 8100 UC -->
    <div class="deal-card" style="border-color: rgba(245, 158, 11, 0.7); box-shadow: 0 0 25px rgba(245, 158, 11, 0.25);">
      <div class="card-top">
        <div class="uc-amount">
          <span class="uc-number" style="color: #facc15;">8100</span>
          <span class="uc-label">UC</span>
        </div>
        <div class="discount-pill">-13%</div>
      </div>
      <div class="card-pricing" style="background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.3);">
        <div class="price-box">
          <span class="price-label">ئەسلى باھاسى:</span>
          <span class="price-old">$95.23</span>
        </div>
        <div class="price-box" style="align-items: flex-end;">
          <span class="price-label">ئېتىبار باھاسى:</span>
          <span class="price-new" style="color: #fde047;">$82.91</span>
        </div>
      </div>
      <div class="card-footer-tip">
        <span class="tip-tag" style="color: #facc15;">👑 VIP ئەڭ كۆپ ئېتىبار</span>
        <span class="buy-cue" style="color: #facc15;">سېتىۋېلىش &gt;</span>
      </div>
    </div>
  </main>

  <!-- Trust Highlights -->
  <section class="trust-strip">
    <div class="trust-item">
      <span class="trust-icon">⚡</span>
      <span class="trust-text">1-3 سېكۇنتتا كىرىش</span>
    </div>
    <div class="trust-item">
      <span class="trust-icon">🛡</span>
      <span class="trust-text">پەقەت ئويۇنچى ID نومۇرى</span>
    </div>
    <div class="trust-item">
      <span class="trust-icon">🤖</span>
      <span class="trust-text">24 سائەت ئاپتوماتىك</span>
    </div>
    <div class="trust-item">
      <span class="trust-icon">💳</span>
      <span class="trust-text">قولايلىق چىقىم</span>
    </div>
  </section>

  <!-- Bottom Footer -->
  <footer class="bottom-footer">
    <div class="contacts-list">
      <div class="contact-row">
        <span>🌐 تور بېتىمىز:</span>
        <strong>https://auto-cash-sotre.vercel.app</strong>
      </div>
      <div class="contact-row">
        <span>🤖 قاچىلاش بوتىمىز:</span>
        <strong>@Autocash_24_bot</strong>
      </div>
      <div class="contact-row">
        <span>📢 رەسمىي قانال:</span>
        <strong>@autocash_cannel</strong>
      </div>
    </div>
    <div class="cta-button">
      <span>⚡ سېتىۋېلىش</span>
      <span>&gt;</span>
    </div>
  </footer>

</body>
</html>`;

const outHtmlPath = path.join(cwd, 'scripts', 'pubg_promo_poster.html');
fs.writeFileSync(outHtmlPath, htmlContent, 'utf8');
console.log('Generated HTML poster at:', outHtmlPath);

// 4. Render with Chrome Headless
const outPngPath = path.join(cwd, 'scripts', 'pubg_promo_poster.png');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Rendering high-res screenshot via Chrome...');
const fileUrl = `file:///${outHtmlPath.replace(/\\/g, '/')}`;
const cmd = `"${chromePath}" --headless=new --disable-gpu --screenshot="${outPngPath}" --window-size=1080,1350 --hide-scrollbars "${fileUrl}"`;
execSync(cmd, { stdio: 'inherit' });

if (!fs.existsSync(outPngPath)) {
  console.error('Failed to generate PNG screenshot');
  process.exit(1);
}

const stats = fs.statSync(outPngPath);
console.log('Successfully generated poster PNG! File size:', stats.size, 'bytes');

// 5. Send to Telegram Admin via Bot API
async function sendToTelegram() {
  if (!botToken) {
    console.warn('Cannot send to Telegram: botToken is missing');
    return;
  }

  const caption = `🔥 <b>چەكلىك ۋاقىتلىق ئېتىبار پائالىيىتى تېز تەشۋىقات رەسىمى تەييار بولدى!</b>

🎮 <b>مەھسۇلات:</b> PUBG Mobile (پابجى) UC تېز قاچىلاش
⚡ <b>60 UC:</b> <s>$0.95</s> ➔ <b>$0.93</b>
⚡ <b>325 UC:</b> <s>$4.75</s> ➔ <b>$4.23</b>
⚡ <b>660 UC:</b> <s>$9.50</s> ➔ <b>$8.36</b>
⚡ <b>1800 UC:</b> <s>$24.11</s> ➔ <b>$21.07</b>
⚡ <b>3850 UC:</b> <s>$47.93</s> ➔ <b>$41.78</b>
⚡ <b>8100 UC:</b> <s>$95.23</s> ➔ <b>$82.91</b>

🛡 <i>100% رەسمىي، 1-3 سېكۇنتتا ئاپتوماتىك كىرىدۇ.</i>
🌐 تور بېكەت: https://auto-cash-sotre.vercel.app
🤖 تېلېگرام بوت: @Autocash_24_bot`;

  try {
    const fileBuffer = fs.readFileSync(outPngPath);
    const formData = new FormData();
    formData.append('chat_id', adminChatId);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('photo', blob, 'pubg_promo_poster.png');
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');

    console.log(`Sending photo to Telegram Admin (Chat ID: ${adminChatId})...`);
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    console.log('Telegram sendPhoto response:', JSON.stringify(data));
    if (data.ok) {
      console.log('Successfully delivered to admin Telegram!');
    } else {
      console.error('Telegram delivery error:', data.description);
    }
  } catch (err) {
    console.error('Error sending photo to Telegram:', err);
  }
}

sendToTelegram();
