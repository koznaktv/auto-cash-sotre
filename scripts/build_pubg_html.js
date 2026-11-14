const fs = require('fs');
const path = require('path');

const mlbbHtmlPath = path.join(__dirname, '../public/mlbb.html');
const pubgHtmlPath = path.join(__dirname, '../public/pubg.html');
const pubgMobileHtmlPath = path.join(__dirname, '../public/pubg-mobile.html');

let content = fs.readFileSync(mlbbHtmlPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update Title & Meta
content = content.replace(
  '<title>AUTO CASH • Mobile Legends رەسمىي قاچىلاش (گىلوبال • تۈركىيە • فىلىپپىن)</title>',
  '<title>AUTO CASH • PUBG Mobile رەسمىي قاچىلاش (UC • Royale Pass • كارتىلار)</title>'
);

// 2. Replace Tier 0 & Tier 1 with PUBG Mobile Identity & User Logo
const tier0Start = content.indexOf('<!-- Tier 0: Quick App Switcher Header');
const tier2Start = content.indexOf('<!-- Tier 2: VIP Dollar Wallet Bar');

if (tier0Start !== -1 && tier2Start !== -1) {
  const pubgTier0And1 = `<!-- Tier 0: Quick App Switcher Header (Dedicated Row: 100% Zero Collision!) -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 relative z-10">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span class="text-[11px] font-bold text-slate-400 shrink-0">نۆۋەتتىكى ئويۇن:</span>
            <span class="text-xs font-black text-amber-300 font-mono truncate">PUBG Mobile</span>
          </div>
          <button onclick="openAppSwitcherModal()" type="button" class="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 hover:border-amber-300 text-amber-300 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm shadow-amber-950/40 cursor-pointer shrink-0">
            <span class="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
              <span class="absolute inset-0 rounded-md bg-amber-400/40 blur-[2px] animate-pulse"></span>
              <svg class="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/>
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" opacity="0.85"/>
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" opacity="0.85"/>
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/>
              </svg>
            </span>
            <span>باشقا ئەپلەرگە ئۆتۈش</span>
            <span class="text-[9px] text-amber-400 font-mono">▼</span>
          </button>
        </div>

        <!-- Tier 1: Full-Width Game Identity (Uncramped, Beautiful Title & Status Badge) -->
        <div class="flex items-center gap-2.5 relative z-10 w-full">
          <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
            <img src="pubg_logo.jpg" alt="PUBG Mobile" class="w-full h-full object-cover rounded-xl" onerror="this.src='https://i.ibb.co/KpMvj9fw/3235269bedcbf914ba3e316af4169a3b.jpg'"/>
          </div>
          <div class="flex-1 text-right min-w-0">
            <h1 class="text-sm sm:text-base font-black text-white tracking-wide leading-tight truncate">
              PUBG Mobile
            </h1>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/30 whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>رەسمىي بىۋاسىتە قاچىلاش (UC)</span>
              </span>
            </div>
          </div>
        </div>

        `;
  content = content.substring(0, tier0Start) + pubgTier0And1 + content.substring(tier2Start);
} else {
  console.warn('Warning: Tier 0/2 markers not found');
}

// 3. Step 1: Replace completely with Clean PUBG UID Step 1 (NO server buttons whatsoever)
const s1Start = content.indexOf('<!-- ================= 1-قەدەم (STEP 1):');
const s2Start = content.indexOf('<!-- ================= 2-قەدەم (STEP 2):');

if (s1Start !== -1 && s2Start !== -1) {
  const pubgStep1Replacement = `<!-- ================= 1-قەدەم (STEP 1): ئالدى بىلەن ئويۇن كىملىكى (UID) كىرگۈزۈش ================= -->
      <div class="glass-box rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-black text-white flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-amber-500/40 shrink-0">1</span>
            <span>ئالدى بىلەن ئويۇن كىملىكى (Player ID) كىرگۈزۈڭ</span>
          </label>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/40 font-bold flex items-center gap-1 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>PUBG UID تەكشۈرۈش</span>
          </span>
        </div>

        <p class="text-xs text-slate-400 leading-snug">
          PUBG Mobile ئىچىدىكى 8 تىن 11 خانىغىچە نۇمۇرلۇق ئويۇن كىملىكىڭىز (UID) نى كىرگۈزۈپ «ئىزدەش» نى بېسىڭ.
        </p>

        <!-- Input Box with Compact Clear + Search Buttons -->
        <div class="relative flex items-center">
          <input 
            id="pubgInput" 
            type="text" 
            inputmode="numeric"
            placeholder="مەسىلەن: 5123456789..." 
            class="w-full bg-[#0a0f1d] border border-slate-700 focus:border-amber-400 rounded-xl pr-3 pl-[95px] py-2.5 text-xs text-white placeholder-slate-500 font-mono transition text-right outline-none"
            onkeydown="if(event.key==='Enter') executeSearch()"
            oninput="handleInput(this.value)"
          />
          <div class="absolute left-1.5 flex items-center gap-1.5">
            <button onclick="clearPlayerInput()" id="clearInputBtn" type="button" class="w-6 h-6 rounded-full bg-slate-800/90 hover:bg-rose-950/90 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 text-[11px] font-black flex items-center justify-center transition active:scale-90 shadow-sm cursor-pointer" title="ئۆچۈرۈش">
              ✕
            </button>
            <button onclick="executeSearch()" id="searchBtn" type="button" class="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1 active:scale-95 shadow-md shadow-amber-500/25 cursor-pointer">
              <span id="searchIcon" class="text-xs">🔍</span>
              <span id="searchBtnText">ئىزدەش</span>
            </button>
          </div>
        </div>

        <!-- Error Alert Message -->
        <div id="errorAlert" class="hidden items-center gap-2 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/70 text-rose-200 text-xs shadow-lg animate-shake">
          <span class="text-sm shrink-0">⚠️</span>
          <span class="font-bold flex-1">ئايدى نۇمۇرىڭىز خاتا قايتا سىناڭ</span>
          <button onclick="clearErrorState()" class="text-rose-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer">✕</button>
        </div>

        <!-- Spinner -->
        <div id="checkSpinner" class="hidden items-center justify-center gap-2 py-2 text-xs text-amber-300 bg-amber-950/20 border border-amber-500/20 rounded-xl">
          <span class="animate-spin text-amber-400">⏳</span>
          <span>ئويۇنچى كىملىكى (UID) تەكشۈرۈلۈۋاتىدۇ...</span>
        </div>

        <!-- Verified Player Card -->
        <div id="verifiedCard" class="hidden flex-col gap-2 bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-amber-950/40 border border-emerald-500/50 rounded-xl p-2.5 shadow-xl cyber-shield-anim">
          <div class="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xl">🎖️</span>
              <div>
                <p class="text-xs text-slate-400">ئويۇن سالاھىيىتى:</p>
                <p class="text-xs font-black text-amber-300">PUBG Mobile (رەسمىي سەرۋەر)</p>
              </div>
            </div>
            <span class="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold flex items-center gap-1">
              <span>✓</span>
              <span>تەستىقلاندى</span>
            </span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/40 shadow-sm shrink-0 bg-slate-900 p-0.5">
                <img src="pubg_logo.jpg" alt="PUBG" class="w-full h-full object-cover rounded-lg" onerror="this.src='https://i.ibb.co/KpMvj9fw/3235269bedcbf914ba3e316af4169a3b.jpg'"/>
              </div>
              <div class="leading-tight">
                <p class="text-xs text-slate-400">ئويۇندىكى نامىڭىز:</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <p id="cardNickname" class="text-xs font-black text-emerald-300 font-mono">PUBG Player</p>
                  <button onclick="editPlayerNickname(event)" type="button" class="text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded transition active:scale-95 cursor-pointer flex items-center gap-0.5" title="ئويۇندىكى نامنى تەھرىرلەش ياكى دەلىللەش">
                    <span>✏️</span>
                    <span>نامنى تەھرىرلەش</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="text-left font-mono text-xs bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span class="text-slate-400">UID: </span><span id="cardUserId" class="text-amber-300 font-bold">5123456789</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
            <span class="text-slate-400">قاچىلاش يولى:</span>
            <span class="text-amber-300 font-mono font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>رەسمىي بىۋاسىتە كىملىككە (100% يېتىدۇ)</span>
            </span>
          </div>
        </div>

      </div>

      `;
  content = content.substring(0, s1Start) + pubgStep1Replacement + content.substring(s2Start);
}

// 4. Step 2 Header & Tabs:
// Remove activeServerTag completely from HTML as requested by user ("ئاندىن ئىككىنچى رەسىمدىكى خەتنى ئۆچۈرۋەتكىن")
const s2HeaderStart = content.indexOf('<div class="flex justify-between items-center px-1">');
const s2LockedNoticeStart = content.indexOf('<!-- Locked Notice');

if (s2HeaderStart !== -1 && s2LockedNoticeStart !== -1) {
  const pubgStep2Header = `<div class="flex justify-between items-center px-1">
          <label class="text-xs font-black text-white flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-amber-500/40 shrink-0">2</span>
            <span class="text-sm font-black text-white tracking-wide">UC ياكى كارتىلارنى تاللاڭ</span>
          </label>
        </div>

        `;
  content = content.substring(0, s2HeaderStart) + pubgStep2Header + content.substring(s2LockedNoticeStart);
}

// Replace Locked Notice texts in Step 2
content = content.replace(
  'ئالدى بىلەن ئويۇن كىملىكى (ID) نى دەلىللەڭ',
  'ئالدى بىلەن PUBG UID نى دەلىللەڭ'
);
content = content.replace(
  '<span>سېرۋېرغا ماس ئەڭ ئەرزان باھالار ئېچىلىدۇ</span>',
  '<span>بىۋاسىتە ۋە ئەڭ ئەرزان UC باھالىرى</span>'
);
content = content.replace(
  'خاتا سېرۋېرغا پۇل سېلىۋېلىشتىن ساقلىنىش ئۈچۈن، 1-قەدەمدىن ID ۋە رايون كودى كىرگۈزۈلگەندە سىستېما باھالارنى تولۇق ئاچىدۇ.',
  'خاتا كىملىككە پۇل سېلىۋېلىشتىن ساقلىنىش ئۈچۈن، 1-قەدەمدىن PUBG UID كىرگۈزۈلگەندە سىستېما باھالارنى تولۇق ئاچىدۇ.'
);
content = content.replace(
  `onclick="document.getElementById('mlbbInput').focus();"`,
  `onclick="document.getElementById('pubgInput').focus();"`
);
content = content.replace(
  `<button onclick="previewServerOnly('global')" class="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#192233] hover:from-slate-800 hover:to-[#222e44] text-amber-300 border border-amber-500/50 hover:border-amber-400 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-950/40 cursor-pointer">
              <span>سېرۋېر باھالىرىنى كۆرۈپ بېقىش</span>
            </button>`,
  `<button onclick="previewServerOnly('direct')" class="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#192233] hover:from-slate-800 hover:to-[#222e44] text-amber-300 border border-amber-500/50 hover:border-amber-400 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-950/40 cursor-pointer">
              <span>باھالارنى كۆرۈپ بېقىش</span>
            </button>`
);
content = content.replace(
  '<p class="font-bold text-white" id="previewBannerTitle">كۆرۈپ بېقىش ھالىتى: گىلوبال باھالىرى</p>',
  '<p class="font-bold text-white" id="previewBannerTitle">كۆرۈپ بېقىش ھالىتى: PUBG UC باھالىرى</p>'
);

// 5. Replace Category Tabs
const tabsStart = content.indexOf('<div id="serverTabs"');
const tabsEnd = content.indexOf('<div id="packagesContainer"');

if (tabsStart !== -1 && tabsEnd !== -1) {
  const pubgTabs = `<div id="serverTabs" class="grid grid-cols-3 gap-1.5 bg-[#0a101f] p-1.5 rounded-2xl border border-slate-800 text-xs shadow-lg">
          <button id="tabDirect" onclick="switchServer('direct')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1 cursor-pointer">
            <span>🔥</span><span>بىۋاسىتە UC</span>
          </button>
          <button id="tabPass" onclick="switchServer('pass')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1 cursor-pointer">
            <span>👑</span><span>Royale Pass</span>
          </button>
          <button id="tabVoucher" onclick="switchServer('voucher')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1 cursor-pointer">
            <span>🎟️</span><span>UC كود (PIN)</span>
          </button>
        </div>

        `;
  content = content.substring(0, tabsStart) + pubgTabs + content.substring(tabsEnd);
}

// 6. Generic Text Replacements
content = content.replace(/MLBB ئالماس/g, 'PUBG UC');
content = content.replace(/Mobile Legends/g, 'PUBG Mobile');
content = content.replace('<!-- ================= 2-قەدەم (STEP 2): ئالماس بوغچىسى تاللاش ================= -->', '<!-- ================= 2-قەدەم (STEP 2): PUBG UC تاللاش ================= -->');
content = content.replace('<span id="procId" class="text-cyan-300 font-bold">#ML-.....</span>', '<span id="procId" class="text-amber-300 font-bold">#PUBG-.....</span>');
content = content.replace('<span class="font-sans">سېرۋېر:</span>\n            <span id="procServer" class="font-bold text-amber-300">🌐 گىلوبال</span>', '<span class="font-sans">ئويۇن:</span>\n            <span id="procServer" class="font-bold text-amber-300">PUBG Mobile</span>');
content = content.replace("let playerNick = '亗 SULTAN_MLBB 亗';", "let playerNick = '亗 PUBG_PLAYER 亗';");
content = content.replace("server: '🎮 MLBB',", "server: '🔫 PUBG Mobile',");
content = content.replace("pkg: o.package_name || 'ئالماس بوغچىسى',", "pkg: o.package_name || 'PUBG UC',");
content = content.replace('💎 ئالماس زاكازلىرى', '🪙 PUBG UC زاكازلىرى');
content = content.replace('ئالماس ياكى كارتىلارنى تاللاپ زاكاز قىلسىڭىز', 'UC ياكى كارتىلارنى تاللاپ زاكاز قىلسىڭىز');

// 7. Update App Switcher Modal (PUBG active, MLBB switchable)
const modalAppGridStart = content.indexOf('<!-- App List Grid -->');
const modalAppGridEnd = content.indexOf('<!-- App 4: AUTO CASH Full Store -->');

if (modalAppGridStart !== -1 && modalAppGridEnd !== -1) {
  const newAppSection = `<!-- App List Grid -->
        <div class="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-1 relative z-10">
          
          <!-- App 1: Mobile Legends: Bang Bang -->
          <a href="mlbb.html" class="glass-box rounded-2xl p-3 border border-cyan-500/30 hover:border-cyan-400 bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-[#0e192e] flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-cyan-400/50 flex items-center justify-center shrink-0 bg-slate-950">
                <img src="https://play-lh.googleusercontent.com/MztmLpB1-_eFbHnqNzzvzl5zjiOH2BEb0D71uBxZYf_4BEmW3QEPWODhRtyqY7Qz4wRLwQ--Rg1RAjOFqtHSs-o=s256" alt="Mobile Legends" class="w-full h-full object-cover" onerror="this.src='mlbb_icon.png'"/>
              </div>
              <div class="text-right min-w-0">
                <p class="text-xs sm:text-sm font-black text-white group-hover:text-cyan-300 transition flex items-center gap-1.5">
                  <span>Mobile Legends: Bang Bang</span>
                </p>
                <p class="text-[11px] text-cyan-300/90 font-mono mt-0.5">⚔️ ئالماس ۋە كارتىلار • 3 سېكۇنتتا يېتىدۇ</p>
                <p class="text-[10px] text-slate-400">گىلوبال • تۈركىيە • فىلىپپىن سەرۋېرلىرى</p>
              </div>
            </div>
            <div class="shrink-0 flex flex-col items-end gap-1">
              <span class="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10.5px] font-black group-hover:bg-cyan-500 group-hover:text-slate-950 transition flex items-center gap-1 shadow-sm">
                <span>كىرىش</span>
                <span class="font-mono">➔</span>
              </span>
            </div>
          </a>

          <!-- App 2: PUBG Mobile (ACTIVE) -->
          <a href="pubg.html" class="glass-box rounded-2xl p-3 border border-amber-500/50 bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-[#1e1708]/80 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block relative overflow-hidden">
            <span class="absolute top-0 right-0 w-2 h-full bg-amber-400"></span>
            <div class="flex items-center gap-2.5 min-w-0 pr-1">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-amber-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
                <img src="pubg_logo.jpg" alt="PUBG Mobile" class="w-full h-full object-cover rounded-xl" onerror="this.src='https://i.ibb.co/KpMvj9fw/3235269bedcbf914ba3e316af4169a3b.jpg'"/>
              </div>
              <div class="text-right min-w-0">
                <p class="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                  <span>PUBG Mobile</span>
                </p>
                <p class="text-[11px] text-amber-300/90 font-mono mt-0.5">🔥 بىۋاسىتە UC • Royale Pass • كودلار</p>
                <p class="text-[10px] text-slate-400">UID ئارقىلىق 3 سېكۇنتتا بىۋاسىتە كىملىككە كىرىدۇ</p>
              </div>
            </div>
            <div class="shrink-0 flex flex-col items-end gap-1">
              <span class="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm">
                <span>نۆۋەتتىكى</span>
                <span class="font-mono">✓</span>
              </span>
            </div>
          </a>

          <!-- App 3: Honor of Kings (HOK) -->
          <a href="/apps/honor-of-kings" class="glass-box rounded-2xl p-3 border border-purple-500/30 hover:border-purple-400 bg-gradient-to-r from-purple-950/30 via-slate-900/80 to-[#190e29]/60 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-purple-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
                <img src="/images/apps/honor-of-kings/icon-512.png" alt="Honor of Kings" class="w-full h-full object-cover rounded-xl" onerror="this.src='https://play-lh.googleusercontent.com/4h_8'"/>
              </div>
              <div class="text-right min-w-0">
                <p class="text-xs sm:text-sm font-black text-white group-hover:text-purple-300 transition flex items-center gap-1.5">
                  <span>Honor of Kings (HOK)</span>
                </p>
                <p class="text-[11px] text-purple-300/90 font-mono mt-0.5">👑 رەسمىي توكېن بازىرى • لاقىم دەلىللەش</p>
                <p class="text-[10px] text-slate-400">Player ID ئارقىلىق 5 سېكۇنتتا كىرىدۇ</p>
              </div>
            </div>
            <div class="shrink-0 flex flex-col items-end gap-1">
              <span class="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10.5px] font-black group-hover:bg-purple-500 group-hover:text-slate-950 transition flex items-center gap-1 shadow-sm">
                <span>كىرىش</span>
                <span class="font-mono">➔</span>
              </span>
            </div>
          </a>

          `;
  content = content.substring(0, modalAppGridStart) + newAppSection + content.substring(modalAppGridEnd);
}

// 8. Replace JavaScript Catalogs
const oldCatalogsLogic = `    // MaxStore Live Catalogs with Guaranteed Dynamic Profit Margins
    let CATALOGS = {
      global: {
        serverName: 'گىلوبال',
        serverTitle: 'گىلوبال',
        flag: '🌐',
        packages: [
          { id: 1896, name: 'ھەپتىلىك ئالماس كارتىسى', subtext: 'Weekly Diamond Pass (210💎)', price: 1.51, isVip: true },
          { id: 1897, name: 'ھەپتىلىك ئېلىت بوغچىسى', subtext: 'Weekly Elite Pack', price: 0.83, isVip: true },
          { id: 1894, name: 'ئايلىق ئېلىت بوغچىسى', subtext: 'Monthly Elite Pack (30 كۈن)', price: 3.91, isVip: true },
          { id: 1895, name: 'Twilight Pass ئالىي كارتىسى', subtext: 'Twilight Pass • مەخسۇس Skin', price: 7.96, isVip: true },
          { id: 1891, name: '55 ئالماس (گىلوبال)', subtext: 'رەسمىي قاچىلاش', price: 0.82 },
          { id: 1893, name: '86 ئالماس (گىلوبال)', subtext: 'رەسمىي قاچىلاش', price: 1.26 },
          { id: 1883, name: '165 ئالماس (گىلوبال)', subtext: 'رەسمىي قاچىلاش', price: 2.38 },
          { id: 1886, name: '275 ئالماس (گىلوبال)', subtext: 'رەسمىي قاچىلاش', price: 3.79 },
          { id: 1890, name: '429 ئالماس (گىلوبال)', subtext: 'رەسمىي قاچىلاش', price: 5.95 },
          { id: 1892, name: '706 ئالماس (گىلوبال)', subtext: 'رەسمىي قاچىلاش', price: 9.49 },
          { id: 1880, name: '1050 ئالماس (گىلوبال)', subtext: 'رەسمىي قاچىلاش', price: 14.25 },
          { id: 1887, name: '3073 ئالماس (گىلوبال)', subtext: 'رەسمىي قاچىلاش', price: 39.99 },
        ]
      },
      turkey: {
        serverName: 'تۈركىيە',
        serverTitle: 'تۈركىيە',
        flag: '🇹🇷',
        packages: [
          { id: 967, name: 'ھەپتىلىك ئالماس كارتىسى (تۈركىيە)', subtext: 'Weekly Diamond Pass (210💎)', price: 1.76, isVip: true },
          { id: 968, name: 'ھەپتىلىك ئېلىت بوغچىسى (تۈركىيە)', subtext: 'Weekly Elite Pack', price: 0.91, isVip: true },
          { id: 966, name: 'ئايلىق ئېلىت بوغچىسى (تۈركىيە)', subtext: 'Monthly Elite Pack (30 كۈن)', price: 4.49, isVip: true },
          { id: 958, name: '16 ئالماس (تۈركىيە)', subtext: 'رەسمىي قاچىلاش', price: 0.29 },
          { id: 961, name: '44 ئالماس (تۈركىيە)', subtext: 'رەسمىي قاچىلاش', price: 0.73 },
          { id: 964, name: '88 ئالماس (تۈركىيە)', subtext: 'رەسمىي قاچىلاش', price: 1.39 },
          { id: 957, name: '133 ئالماس (تۈركىيە)', subtext: 'رەسمىي قاچىلاش', price: 2.10 },
          { id: 959, name: '221 ئالماس (تۈركىيە)', subtext: 'رەسمىي قاچىلاش', price: 3.49 },
          { id: 962, name: '494 ئالماس (تۈركىيە)', subtext: 'رەسمىي قاچىلاش', price: 7.69 },
          { id: 956, name: '1041 ئالماس (تۈركىيە)', subtext: 'رەسمىي قاچىلاش', price: 15.25 },
          { id: 960, name: '2645 ئالماس (تۈركىيە)', subtext: 'رەسمىي قاچىلاش', price: 37.99 },
          { id: 963, name: '6146 ئالماس (تۈركىيە)', subtext: 'رەسمىي قاچىلاش', price: 85.99 },
        ]
      },
      special: {
        serverName: 'فىلىپپىن',
        serverTitle: 'فىلىپپىن',
        flag: '🇵🇭',
        packages: [
          { id: 954, name: 'ھەپتىلىك ئالماس كارتىسى (ئالاھىدە)', subtext: 'Weekly Diamond Pass (210💎)', price: 2.25, isVip: true },
          { id: 955, name: 'ھەپتىلىك ئېلىت بوغچىسى (ئالاھىدە)', subtext: 'Weekly Elite Pack', price: 1.05, isVip: true },
          { id: 953, name: 'ئايلىق ئېلىت بوغچىسى (ئالاھىدە)', subtext: 'Monthly Elite Pack (30 كۈن)', price: 5.10, isVip: true },
          { id: 941, name: '14 ئالماس (ئالاھىدە)', subtext: 'رەسمىي قاچىلاش', price: 0.29 },
          { id: 948, name: '28 ئالماس (ئالاھىدە)', subtext: 'رەسمىي قاچىلاش', price: 0.57 },
          { id: 951, name: '42 ئالماس (ئالاھىدە)', subtext: 'رەسمىي قاچىلاش', price: 0.82 },
          { id: 952, name: '55 ئالماس (ئالاھىدە)', subtext: 'رەسمىي قاچىلاش', price: 1.05 },
          { id: 942, name: '140 ئالماس (ئالاھىدە)', subtext: 'رەسمىي قاچىلاش', price: 2.65 },
          { id: 943, name: '165 ئالماس (ئالاھىدە)', subtext: 'رەسمىي قاچىلاش', price: 3.09 },
          { id: 947, name: '275 ئالماس (ئالاھىدە)', subtext: 'رەسمىي قاچىلاش', price: 5.15 },
          { id: 950, name: '355 ئالماس (ئالاھىدە)', subtext: 'رەسمىي قاچىلاش', price: 6.59 },
        ]
      }
    };`;

const pubgCatalogsReplacement = `    // MaxStore Live Catalogs for PUBG Mobile (UC, Royale Pass, Vouchers)
    let CATALOGS = {
      direct: {
        serverName: 'بىۋاسىتە UC',
        serverTitle: 'بىۋاسىتە UC',
        flag: '🔥',
        packages: [
          { id: 60, name: '60 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 1.15, isVip: true },
          { id: 54, name: '325 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 5.25, isVip: true },
          { id: 62, name: '660 PUBG UC', subtext: '🔥 Royale Pass ئېچىشقا ماس', price: 10.35, isVip: true },
          { id: 55, name: '1800 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 25.50, isVip: true },
          { id: 56, name: '3850 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 50.80 },
          { id: 57, name: '8100 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 99.90 },
          { id: 59, name: '16200 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 198.00 },
        ]
      },
      pass: {
        serverName: 'Royale Pass & كارتىلار',
        serverTitle: 'Royale Pass & كارتىلار',
        flag: '👑',
        packages: [
          { id: 343, name: 'Royale Pass Elite (LV 1-50)', subtext: 'رەسمىي RP پاس كارتىسى', price: 10.35, isVip: true },
          { id: 344, name: 'Royale Pass Elite Plus (LV 1-100)', subtext: 'تولۇق RP پاس + قوشۇمچە تەمىنات', price: 25.50, isVip: true },
          { id: 341, name: 'Prime Plus ئايلىق كارتىسى', subtext: 'كۈندىلىك UC + نۇرغۇن ئېتىبارلار', price: 9.80, isVip: true },
          { id: 340, name: 'Prime ئەزالىق كارتىسى', subtext: 'ئەرزان باھالىق كۈندىلىك تەڭگە', price: 1.25, isVip: true },
        ]
      },
      voucher: {
        serverName: 'UC كود (PIN)',
        serverTitle: 'UC كود (PIN)',
        flag: '🎟️',
        packages: [
          { id: 444, name: '60 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', price: 1.15, isVip: false },
          { id: 445, name: '660 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', price: 10.30, isVip: true },
          { id: 446, name: '1800 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', price: 25.30, isVip: false },
        ]
      }
    };`;

content = content.replace(oldCatalogsLogic, pubgCatalogsReplacement);

// 9. Replace loadDynamicCatalog()
const oldLoadDynamicCatalog = `    async function loadDynamicCatalog() {
      try {
        const res = await fetch('/api/apps/catalog?app=mobile-legends');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.ok && data.catalogs) {
          if (Array.isArray(data.catalogs.global) && data.catalogs.global.length > 0) {
            CATALOGS.global.packages = data.catalogs.global.map(p => ({
              id: p.id,
              name: p.name,
              subtext: p.subtext || (p.type === 'pass' ? 'ئالاھىدە كارتا' : 'رەسمىي قاچىلاش'),
              price: p.price,
              isVip: p.type === 'pass' || Boolean(p.popular)
            }));
          }
          if (Array.isArray(data.catalogs.turkey) && data.catalogs.turkey.length > 0) {
            CATALOGS.turkey.packages = data.catalogs.turkey.map(p => ({
              id: p.id,
              name: p.name,
              subtext: p.subtext || (p.type === 'pass' ? 'تۈركىيە كارتىسى' : 'رەسمىي قاچىلاش'),
              price: p.price,
              isVip: p.type === 'pass' || Boolean(p.popular)
            }));
          }
          if (Array.isArray(data.catalogs.special) && data.catalogs.special.length > 0) {
            CATALOGS.special.packages = data.catalogs.special.map(p => ({
              id: p.id,
              name: p.name,
              subtext: p.subtext || (p.type === 'pass' ? 'ئالاھىدە كارتا' : 'رەسمىي قاچىلاش'),
              price: p.price,
              isVip: p.type === 'pass' || Boolean(p.popular)
            }));
          }
          if (isVerified || isPreviewMode) {
            renderPackages();
            updateDisplays();
          }
        }
      } catch (err) {
        console.warn('[Dynamic Catalog Warning]:', err);
      }
    }`;

const pubgLoadDynamicCatalog = `    async function loadDynamicCatalog() {
      try {
        const res = await fetch('/api/apps/catalog?app=pubg');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.ok && data.catalogs) {
          if (Array.isArray(data.catalogs.uc) && data.catalogs.uc.length > 0) {
            CATALOGS.direct.packages = data.catalogs.uc.map(p => ({
              id: p.id,
              name: p.name,
              subtext: p.subtext || 'بىۋاسىتە كىملىككە (UID)',
              price: p.price,
              isVip: Boolean(p.popular)
            }));
          }
          if (Array.isArray(data.catalogs.passes) && data.catalogs.passes.length > 0) {
            CATALOGS.pass.packages = data.catalogs.passes.map(p => ({
              id: p.id,
              name: p.name,
              subtext: p.subtext || 'Royale Pass & تەمىنات',
              price: p.price,
              isVip: true
            }));
          }
          if (Array.isArray(data.catalogs.vouchers) && data.catalogs.vouchers.length > 0) {
            CATALOGS.voucher.packages = data.catalogs.vouchers.map(p => ({
              id: p.id,
              name: p.name,
              subtext: p.subtext || 'رەسمىي ئېلېكترونلۇق كود',
              price: p.price,
              isVip: Boolean(p.popular)
            }));
          }
          if (isVerified || isPreviewMode) {
            renderPackages();
            updateDisplays();
          }
        }
      } catch (err) {
        console.warn('[Dynamic Catalog Warning]:', err);
      }
    }`;

content = content.replace(oldLoadDynamicCatalog, pubgLoadDynamicCatalog);

// 10. Update state variables
content = content.replace("let currentServer = 'global';", "let currentServer = 'direct';");
content = content.replace("let selectedPkg = CATALOGS.global.packages[0];", "let selectedPkg = CATALOGS.direct.packages[0];");

// 11. Update parseInput
const parseInputStart = content.indexOf('    function parseInput(val) {');
const parseInputEnd = content.indexOf('    function clearErrorState() {');

if (parseInputStart !== -1 && parseInputEnd !== -1) {
  const pubgParseInput = `    function parseInput(val) {
      if (!val) return null;
      let clean = String(val).replace(/[^0-9]/g, '').trim();
      if (clean.length >= 6 && clean.length <= 16) {
        return { id: clean, zone: '' };
      }
      return null;
    }

`;
  content = content.substring(0, parseInputStart) + pubgParseInput + content.substring(parseInputEnd);
}

// 12. Update executeSearch, previewServerOnly, switchServer
const execSearchStart = content.indexOf('    // Live Search ID & Zone');
const renderPkgStart = content.indexOf('    function renderPackages() {');

if (execSearchStart !== -1 && renderPkgStart !== -1) {
  const pubgFunctionsReplacement = `    // ================= PUBG ACCOUNT STORAGE & NICKNAME EDIT =================
    function savePubgAccount(uid, nickname) {
      if (!uid || !nickname) return;
      try {
        const raw = localStorage.getItem('maxbazar_pubg_saved_accounts');
        let list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];
        const idx = list.findIndex(a => (a.uid || a.id) === uid);
        if (idx !== -1) {
          list[idx].label = nickname;
          list[idx].nickname = nickname;
        } else {
          list.unshift({ uid, label: nickname, nickname });
        }
        if (list.length > 15) list = list.slice(0, 15);
        localStorage.setItem('maxbazar_pubg_saved_accounts', JSON.stringify(list));
      } catch (_) {}
    }

    function editPlayerNickname(e) {
      if (e && e.stopPropagation) e.stopPropagation();
      if (!parsedId) return;
      const currentName = playerNick || '';
      showAppModal({
        icon: '✏️',
        title: 'ئويۇندىكى نامنى تەھرىرلەش',
        message: 'PUBG Mobile ئويۇنىدىكى توغرا نامىڭىزنى كىرگۈزۈڭ ياكى دەلىللەڭ:',
        showInput: true,
        inputValue: currentName,
        inputPlaceholder: 'مەسىلەن: 『kisaskar』 ياكى سىزنىڭ نامىڭىز',
        confirmText: '💾 ساقلاش ۋە دەلىللەش',
        cancelText: 'بىكار قىلىش',
        confirmAction: async function(val) {
          const newName = (val || '').trim();
          if (!newName) return;
          playerNick = newName;
          const cardNick = document.getElementById('cardNickname');
          if (cardNick) cardNick.textContent = newName;

          savePubgAccount(parsedId, newName);

          try {
            await fetch('/api/apps/check-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                game: 'pubg-mobile',
                playerId: parsedId,
                customNickname: newName
              })
            });
          } catch (_) {}

          showAppToast('✅ ئويۇندىكى نامىڭىز مۇۋەپپەقىيەتلىك دەلىللەندى!');
        }
      });
    }

    // Live Search PUBG UID (No servers needed!)
    async function executeSearch() {
      clearErrorState();
      const val = document.getElementById('pubgInput').value.trim();
      const res = parseInput(val);

      if (!res || !res.id || res.id.length < 6) {
        showErrorState();
        return;
      }

      const searchBtn = document.getElementById('searchBtn');
      const searchIcon = document.getElementById('searchIcon');
      const searchBtnText = document.getElementById('searchBtnText');
      if (searchBtn) searchBtn.disabled = true;
      if (searchIcon) {
        searchIcon.className = 'text-xs inline-block animate-spin';
        searchIcon.textContent = '⏳';
      }
      if (searchBtnText) searchBtnText.textContent = 'ئىزدەۋاتىدۇ...';

      const spinner = document.getElementById('checkSpinner');
      if (spinner) {
        spinner.classList.remove('hidden');
        spinner.classList.add('flex');
      }
      const vCard = document.getElementById('verifiedCard');
      if (vCard) vCard.classList.add('hidden');

      parsedId = res.id;
      parsedZone = '';

      try {
        let liveName = null;

        // 1. Check local saved accounts first
        try {
          const rawSaved = localStorage.getItem('maxbazar_pubg_saved_accounts');
          if (rawSaved) {
            const savedList = JSON.parse(rawSaved);
            const found = savedList.find(a => (a.uid || a.id) === res.id);
            if (found && (found.label || found.nickname)) {
              liveName = found.label || found.nickname;
            }
          }
        } catch (_) {}

        // 2. Query /api/apps/check-player route
        if (!liveName) {
          try {
            const checkRes = await fetch('/api/apps/check-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ game: 'pubg-mobile', playerId: res.id })
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData && checkData.success && checkData.nickname) {
                liveName = checkData.nickname;
              }
            }
          } catch (_) {}
        }

        if (!liveName) {
          liveName = 'PUBG Player #' + res.id.slice(-4);
        }

        isVerified = true;
        isPreviewMode = false;
        playerNick = liveName;
        selectedPkg = CATALOGS[currentServer].packages[0];

        const cardNick = document.getElementById('cardNickname');
        if (cardNick) cardNick.textContent = liveName;
        const cardUser = document.getElementById('cardUserId');
        if (cardUser) cardUser.textContent = res.id;

        savePubgAccount(res.id, liveName);

        if (vCard) {
          vCard.classList.remove('hidden');
          vCard.classList.add('flex');
        }

        renderPackages();
        updateDisplays();

        setTimeout(() => {
          const step2 = document.getElementById('step2Section');
          if (step2) step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);

      } catch (err) {
        console.warn('Search query error:', err);
        showErrorState();
      } finally {
        if (searchBtn) searchBtn.disabled = false;
        if (searchIcon) {
          searchIcon.className = 'text-xs inline-block';
          searchIcon.textContent = '🔍';
        }
        if (searchBtnText) searchBtnText.textContent = 'ئىزدەش';
        if (spinner) {
          spinner.classList.add('hidden');
          spinner.classList.remove('flex');
        }
      }
    }

    // Browse category directly without UID
    function previewServerOnly(srv) {
      clearErrorState();
      isPreviewMode = true;
      currentServer = srv;
      if (!CATALOGS[currentServer]) currentServer = 'direct';
      selectedPkg = CATALOGS[currentServer].packages[0];

      renderPackages();
      updateDisplays();
    }

    // Category switcher (Direct UC, Royale Pass, Voucher PIN)
    function switchServer(srv) {
      currentServer = srv;
      if (!CATALOGS[currentServer]) currentServer = 'direct';
      selectedPkg = CATALOGS[currentServer].packages[0];
      renderPackages();
      updateDisplays();
    }

`;
  content = content.substring(0, execSearchStart) + pubgFunctionsReplacement + content.substring(renderPkgStart);
}

// 13. Update renderPackages(): completely remove any server tags and use PUBG categories
const renderPkgBodyStart = content.indexOf('    function renderPackages() {');
const selectPkgStart = content.indexOf('    function selectPackage(pkg) {');

if (renderPkgBodyStart !== -1 && selectPkgStart !== -1) {
  const pubgRenderPackagesReplacement = `    function renderPackages() {
      const locked = document.getElementById('lockedNotice');
      const tabs = document.getElementById('serverTabs');
      const container = document.getElementById('packagesContainer');
      const previewBanner = document.getElementById('previewBanner');

      if (locked) locked.classList.add('hidden');
      if (tabs) {
        tabs.classList.remove('hidden');
        tabs.classList.add('grid');
      }
      if (container) {
        container.classList.remove('hidden');
        container.classList.add('grid');
      }
      if (previewBanner) {
        previewBanner.classList.add('hidden');
      }

      // Category Tabs active class (Direct UC, Royale Pass, Voucher PIN)
      ['direct', 'pass', 'voucher'].forEach(s => {
        const btn = document.getElementById('tab' + s.charAt(0).toUpperCase() + s.slice(1));
        if (!btn) return;
        const sTitle = CATALOGS[s].serverTitle;
        const sFlag = CATALOGS[s].flag;

        if (s === currentServer) {
          btn.className = 'py-2 px-1 rounded-xl font-black transition-all text-center bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300 flex items-center justify-center gap-1.5 scale-[1.02] cursor-pointer';
          btn.innerHTML = '<span>' + sFlag + '</span><span>' + sTitle + '</span>';
        } else {
          btn.className = 'py-2 px-1 rounded-xl font-bold transition text-center text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent cursor-pointer flex items-center justify-center gap-1.5';
          btn.innerHTML = '<span>' + sFlag + '</span><span>' + sTitle + '</span>';
        }
      });

      // Render PUBG UC / Card items
      container.innerHTML = '';
      CATALOGS[currentServer].packages.forEach(pkg => {
        const isSel = selectedPkg && selectedPkg.id === pkg.id;
        const cls = isSel ? (pkg.isVip ? 'active-vip' : 'active-card') : 'glass-box';

        const div = document.createElement('div');
        div.setAttribute('data-pkg-id', pkg.id);
        div.className = cls + ' rounded-2xl p-2.5 cursor-pointer transition flex flex-col justify-between relative group hover:border-amber-400/50 select-none active:scale-[0.98]';
        div.onclick = () => {
          selectPackage(pkg);
        };

        const iconSymbol = (currentServer === 'pass' ? '👑' : (currentServer === 'voucher' ? '🎟️' : '🪙'));

        div.innerHTML = 
          '<div class="flex items-center justify-between mt-0.5">' +
            '<span class="text-xs font-black text-white">' + pkg.name + '</span>' +
            '<span class="' + (pkg.isVip ? 'mythic-crown-anim text-sm' : 'text-sm') + '">' + iconSymbol + '</span>' +
          '</div>' +
          '<div class="text-[10px] text-slate-400 mt-1 mb-2 leading-tight">' + pkg.subtext + '</div>' +
          '<div class="flex items-center justify-between pt-1 border-t border-slate-800/80">' +
            '<span class="text-[10px] text-slate-400 font-bold">باھاسى:</span>' +
            '<span class="text-xs font-black font-mono text-amber-300">$ ' + pkg.price.toFixed(2) + '</span>' +
          '</div>';

        container.appendChild(div);
      });
    }

`;
  content = content.substring(0, renderPkgBodyStart) + pubgRenderPackagesReplacement + content.substring(selectPkgStart);
}

// 14. Update clearPlayerInput()
const clearPlayerInputStart = content.indexOf('    function clearPlayerInput() {');
const clearPlayerInputEnd = content.indexOf('    // ================= CUSTOM IN-APP ALERT MODAL SYSTEM =================');

if (clearPlayerInputStart !== -1 && clearPlayerInputEnd !== -1) {
  const clearPlayerInputPubg = `    function clearPlayerInput() {
      const input = document.getElementById('pubgInput');
      if (input) input.value = '';
      clearErrorState();
      isVerified = false;
      detectedServer = null;
      verifiedPlayer = null;
      isPreviewMode = true;

      var vCard = document.getElementById('verifiedCard');
      if (vCard) {
        vCard.classList.add('hidden');
        vCard.classList.remove('flex');
      }
      
      renderPackages();
      updateDisplays();

      if (input) input.focus();
    }

`;
  content = content.substring(0, clearPlayerInputStart) + clearPlayerInputPubg + content.substring(clearPlayerInputEnd);
}

// 15. Update executeTopup() precisely between executeTopup and closeProcessingModal!
const topupStart = content.indexOf('    async function executeTopup() {');
const topupEnd = content.indexOf('    function closeProcessingModal() {');

if (topupStart !== -1 && topupEnd !== -1) {
  const pubgTopupReplacement = `    async function executeTopup() {
      // 1. Must be logged in via Multi-Auth!
      if (!currentTgUser) {
        showAppModal({
          title: 'ئالدى بىلەن تىزىملاپ كىرىڭ',
          message: 'زاكازلىرىڭىز ۋە ھەميان قالدۇقىڭىزنى بىخەتەر ساقلاش ھەم ھېساباتىڭىزنى باشقۇرۇش ئۈچۈن، ئالدى بىلەن تېلېگرامما ياكى Gmail ئارقىلىق كىرىڭ!',
          icon: '✨',
          confirmText: '✨ كىرىش ھالىتىنى ئېچىش',
          confirmAction: function() {
            openTelegramModal();
          },
          cancelText: 'كېيىنرەك'
        });
        return;
      }

      // 2. Must verify Game ID
      if (!isVerified) {
        showAppModal({
          title: 'ئويۇن كىملىكىڭىزنى كىرگۈزۈڭ',
          message: 'ئالدى بىلەن 1-قەدەمدىن ئۆزىڭىزنىڭ PUBG UID كىملىكىنى كىرگۈزۈپ «ئىزدەش» نى بېسىڭ!',
          icon: '🎮',
          confirmText: '🔍 كىملىك كىرگۈزۈش',
          confirmAction: function() {
            const inp = document.getElementById('pubgInput');
            if (inp) {
              inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => inp.focus(), 350);
            }
          },
          cancelText: 'يېپىش'
        });
        return;
      }

      // 3. Check wallet balance & calculate deficit
      if (walletBalance < selectedPkg.price) {
        const missing = selectedPkg.price - walletBalance;
        showAppModal({
          title: 'ھەميان قالدۇقى يېتىشمىدى',
          message: 'نۆۋەتتىكى قالدۇقىڭىز: $' + walletBalance.toFixed(2) + '، بۇ بوغچىنى سېتىۋېلىشقا يەنە $' + missing.toFixed(2) + ' كەملىدى (جەمئىي باھاسى: $' + selectedPkg.price.toFixed(2) + '). ئالدى بىلەن شامكەش ئارقىلىق قالدۇق كىرگۈزۈڭ!',
          icon: '💰',
          confirmText: '⚡ قالدۇق قاچىلاش (ShamCash)',
          confirmAction: function() {
            openDepositModal();
          },
          cancelText: 'كېيىنرەك'
        });
        return;
      }

      var payBtn = document.getElementById('payBtn');
      if (payBtn) {
        payBtn.disabled = true;
        payBtn.dataset.origText = payBtn.innerHTML;
        payBtn.innerHTML = '<span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> <span>زاكاز بېجىرىلىۋاتىدۇ...</span>';
      }

      // Open Modal in connecting state
      var tempId = 'PUBG-' + Math.floor(10000 + Math.random() * 90000);
      document.getElementById('procId').textContent = '#' + tempId;
      document.getElementById('procNick').textContent = playerNick;
      document.getElementById('procServer').textContent = 'PUBG Mobile (Global)';
      document.getElementById('procPkg').textContent = selectedPkg.name;
      document.getElementById('procStatusBadge').innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span><span>تەمىنلىگۈچىگە تاپشۇرۇلۇۋاتىدۇ...</span>';

      const modal = document.getElementById('processingModal');
      const card = document.getElementById('processingCard');
      const bar = document.getElementById('procBar');
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.classList.remove('opacity-0');
        card.classList.remove('translate-y-6');
        bar.style.width = '45%';
      }, 30);

      var cleanIdent = (currentTgUser.username || currentTgUser.id || '').replace(/^@/, '');
      var orderResult = null;
      var fetchError = null;

      try {
        var res = await fetch('/api/apps/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_id: 'pubg',
            package_id: String(selectedPkg.id || 'pubg-uc'),
            package_name: selectedPkg.name,
            price: selectedPkg.price,
            player_id: parsedId || '',
            identity: cleanIdent,
            zone_id: '',
            user_id: currentTgUser.id || ''
          })
        });
        orderResult = await res.json();
        if (!res.ok || !orderResult.ok) {
          fetchError = orderResult?.error || ('مۇلازىمىتېر خاتالىقى (' + res.status + ')');
        }
      } catch (err) {
        fetchError = err.message || 'تور باغلىنىش خاتالىقى كۆرۈلدى';
      }

      if (payBtn) {
        payBtn.disabled = false;
        if (payBtn.dataset.origText) payBtn.innerHTML = payBtn.dataset.origText;
      }

      if (fetchError || !orderResult || !orderResult.ok) {
        closeProcessingModal();
        showAppModal({
          title: 'زاكاز مەغلۇپ بولدى',
          message: fetchError || 'قاچىلاش مەغلۇپ بولدى، ھەميان قالدۇقىڭىزدىن پۇل تۇتۇلمىدى. قايتا سىناپ بېقىڭ.',
          icon: '❌',
          confirmText: 'چۈشەندىم'
        });
        return;
      }

      // Success! Update wallet balance
      if (typeof orderResult.new_balance === 'number') {
        walletBalance = Number(orderResult.new_balance.toFixed(2));
      } else if (typeof orderResult.remaining_balance === 'number') {
        walletBalance = Number(orderResult.remaining_balance.toFixed(2));
      } else {
        walletBalance = Math.max(0, walletBalance - selectedPkg.price);
      }
      updateDisplays();

      var realOrderId = orderResult.order?.order_id || ('#PUBG-' + (orderResult.provider_order_id || Math.floor(10000 + Math.random() * 90000)));
      document.getElementById('procId').textContent = realOrderId.startsWith('#') ? realOrderId : '#' + realOrderId;

      var newOrder = {
        id: realOrderId,
        pkg: selectedPkg.name,
        price: selectedPkg.price,
        nick: playerNick,
        server: 'PUBG Mobile',
        time: 'ھازىرلا',
        status: 'قاچىلاندى 100% ✓',
        gameId: parsedId,
        zoneId: '',
        providerOrderId: orderResult.provider_order_id || '',
        date: new Date().toISOString()
      };
      productOrders.unshift(newOrder);
      saveUserOrders();
      renderHistoryList();

      setTimeout(() => {
        bar.style.width = '100%';
        document.getElementById('procStatusBadge').innerHTML = '<span class="text-emerald-400 font-bold">100% رەسمىي ئويۇنغا قاچىلاندى ✓</span>';
      }, 300);
    }

`;
  content = content.substring(0, topupStart) + pubgTopupReplacement + content.substring(topupEnd);
}

// 16. Update input ID references: mlbbInput -> pubgInput everywhere
content = content.replace(/mlbbInput/g, 'pubgInput');

// Write to pubg.html and pubg-mobile.html
fs.writeFileSync(pubgHtmlPath, content, 'utf8');
fs.writeFileSync(pubgMobileHtmlPath, content, 'utf8');
console.log('Successfully built public/pubg.html and public/pubg-mobile.html with ZERO server text, clean UI, animated icon, and 3-mode Auth!');
