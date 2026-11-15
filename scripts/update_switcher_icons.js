const fs = require('fs');
const path = require('path');

const files = [
  'public/mlbb.html',
  'public/mobile-legends.html',
  'public/pubg.html',
  'public/pubg-mobile.html',
  'public/honor-of-kings.html',
  'public/hok.html'
];

files.forEach(f => {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  // Match the block with flexible whitespace/newlines
  const reg = /<div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-400\/60 flex items-center justify-center shrink-0 bg-slate-950 p-1 text-2xl">\s*<span>📱<\/span>\s*<\/div>/g;
  if (reg.test(c)) {
    c = c.replace(reg, `<div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-1">
                <img src="tg_virtual_sms_app_anim.webp" alt="SMS" class="w-9 h-9 object-contain drop-shadow" onerror="this.onerror=null;this.src='tg_virtual_sms_app.gif'"/>
              </div>`);
    fs.writeFileSync(p, c, 'utf8');
    console.log('Updated', f);
  } else {
    console.log('Regex not matched in', f);
  }
});
