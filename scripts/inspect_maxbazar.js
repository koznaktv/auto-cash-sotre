const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'images', 'maxbazar');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));

console.log('Found', files.length, 'files');

// Create HTML
const html = `<!DOCTYPE html>
<html>
<head><title>MaxBazar Image Review</title></head>
<body style="background:#0f172a;color:#fff;font-family:sans-serif;padding:20px;display:flex;flex-wrap:wrap;gap:20px;">
${files.map(f => `
  <div style="background:#1e293b;padding:12px;border-radius:12px;text-align:center;width:180px;">
    <img src="/images/maxbazar/${f}" style="width:140px;height:140px;object-fit:contain;background:#334155;border-radius:8px;">
    <div style="font-size:11px;word-break:break-all;margin-top:8px;">${f}</div>
  </div>
`).join('')}
</body>
</html>`;

fs.writeFileSync(path.join(dir, 'preview.html'), html);
console.log('Preview written successfully');
