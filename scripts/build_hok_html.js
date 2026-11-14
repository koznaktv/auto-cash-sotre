const fs = require('fs');
const path = require('path');

const mlbbHtmlPath = path.join(__dirname, '../public/mlbb.html');
const hokHtmlPath = path.join(__dirname, '../public/honor-of-kings.html');
const hokShortHtmlPath = path.join(__dirname, '../public/hok.html');

let content = fs.readFileSync(mlbbHtmlPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update Title & Meta
content = content.replace(
  '<title>AUTO CASH • Mobile Legends رەسمىي قاچىلاش (گىلوبال • تۈركىيە • فىلىپپىن)</title>',
  '<title>AUTO CASH • Honor of Kings رەسمىي قاچىلاش (Tokens • Weekly Card • كارتىلار)</title>'
);

// 2. Replace Tier 0 & Tier 1 with Honor of Kings Identity & User Logo
const tier0Start = content.indexOf('<!-- Tier 0: Quick App Switcher Header');
const tier2Start = content.indexOf('<!-- Tier 2: VIP Dollar Wallet Bar');

if (tier0Start !== -1 && tier2Start !== -1) {
  const hokTier0And1 = `<!-- Tier 0: Quick App Switcher Header (Dedicated Row: 100% Zero Collision!) -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 relative z-10">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0"></span>
            <span class="text-[11px] font-bold text-slate-400 shrink-0">نۆۋەتتىكى ئويۇن:</span>
            <span class="text-xs font-black text-purple-300 font-mono truncate">Honor of Kings</span>
          </div>
          <button onclick="openAppSwitcherModal()" type="button" class="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-400/50 hover:border-purple-300 text-purple-300 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm shadow-purple-950/40 cursor-pointer shrink-0">
            <span class="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
              <span class="absolute inset-0 rounded-md bg-purple-400/40 blur-[2px] animate-pulse"></span>
              <svg class="w-3.5 h-3.5 text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.9)] animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/>
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" opacity="0.85"/>
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" opacity="0.85"/>
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/>
              </svg>
            </span>
            <span>باشقا ئەپلەرگە ئۆتۈش</span>
            <span class="text-[9px] text-purple-400 font-mono">▼</span>
          </button>
        </div>

        <!-- Tier 1: Full-Width Game Identity (Uncramped, Beautiful Title & Status Badge) -->
        <div class="flex items-center gap-2.5 relative z-10 w-full">
          <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-lg border-2 border-purple-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
            <img src="hok_logo.webp" alt="Honor of Kings" class="w-full h-full object-cover rounded-xl" onerror="this.src='hok_logo.png'"/>
          </div>
          <div class="flex-1 text-right min-w-0">
            <h1 class="text-sm sm:text-base font-black text-white tracking-wide leading-tight truncate">
              Honor of Kings (داڭلىقلار سەپىرى)
            </h1>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] text-purple-300 font-bold flex items-center gap-1 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-400/30 whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="w-4 h-4 flex items-center justify-center shrink-0"><img src="hok_token.webp" alt="Token" class="w-4 h-4 object-contain" onerror="this.onerror=null;this.src='hok_token.png'"/></span>
                <span>رەسمىي بىۋاسىتە قاچىلاش (Tokens)</span>
              </span>
            </div>
          </div>
        </div>

        `;
  content = content.substring(0, tier0Start) + hokTier0And1 + content.substring(tier2Start);
}

// 3. Step 1: Replace with Clean Honor of Kings Player ID Step 1
const s1Start = content.indexOf('<!-- ================= 1-قەدەم (STEP 1):');
const s2Start = content.indexOf('<!-- ================= 2-قەدەم (STEP 2):');

if (s1Start !== -1 && s2Start !== -1) {
  const hokStep1Replacement = `<!-- ================= 1-قەدەم (STEP 1): ئالدى بىلەن ئويۇن كىملىكى (Player ID) كىرگۈزۈش ================= -->
      <div class="glass-box rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-black text-white flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-purple-500/40 shrink-0">1</span>
            <span>ئالدى بىلەن ئويۇن كىملىكى (Player ID) كىرگۈزۈڭ</span>
          </label>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-400/40 font-bold flex items-center gap-1 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>HOK Player ID تەكشۈرۈش</span>
          </span>
        </div>

        <p class="text-xs text-slate-400 leading-snug">
          Honor of Kings ئويۇن كىملىكىڭىز (UID / Player ID) نى كىرگۈزۈپ «ئىزدەش» نى بېسىڭ.
        </p>

        <!-- Input Box with Compact Clear + Search Buttons -->
        <div class="relative flex items-center">
          <input 
            id="hokInput" 
            type="text" 
            inputmode="numeric"
            placeholder="مەسىلەن: 123456789..." 
            class="w-full bg-[#0a0f1d] border border-slate-700 focus:border-purple-400 rounded-xl pr-3 pl-[95px] py-2.5 text-xs text-white placeholder-slate-500 font-mono transition text-right outline-none"
            onkeydown="if(event.key==='Enter') executeSearch()"
            oninput="handleInput(this.value)"
          />
          <div class="absolute left-1.5 flex items-center gap-1.5">
            <button onclick="clearPlayerInput()" id="clearInputBtn" type="button" class="w-6 h-6 rounded-full bg-slate-800/90 hover:bg-rose-950/90 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 text-[11px] font-black flex items-center justify-center transition active:scale-90 shadow-sm cursor-pointer" title="ئۆچۈرۈش">
              ✕
            </button>
            <button onclick="executeSearch()" id="searchBtn" type="button" class="px-3 py-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 hover:from-purple-400 hover:to-indigo-400 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-purple-500/25 cursor-pointer">
              <span id="searchIcon" class="w-4 h-4 flex items-center justify-center shrink-0"><img src="tg_search_anim.webp" alt="🔎" class="w-4 h-4 object-contain drop-shadow" onerror="this.onerror=null;this.src='tg_search.gif'"/></span>
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
        <div id="checkSpinner" class="hidden items-center justify-center gap-2 py-2 text-xs text-purple-300 bg-purple-950/20 border border-purple-500/20 rounded-xl">
          <span class="animate-spin text-purple-400">⏳</span>
          <span>ئويۇنچى كىملىكى (Player ID) تەكشۈرۈلۈۋاتىدۇ...</span>
        </div>

        <!-- Verified Player Card -->
        <div id="verifiedCard" class="hidden flex-col gap-2 bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-purple-950/40 border border-emerald-500/50 rounded-xl p-2.5 shadow-xl cyber-shield-anim">
          <div class="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xl">🎖️</span>
              <div>
                <p class="text-xs text-slate-400">ئويۇن سالاھىيىتى:</p>
                <p class="text-xs font-black text-purple-300">Honor of Kings (رەسمىي سەرۋەر)</p>
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
                <img src="hok_logo.webp" alt="HOK" class="w-full h-full object-cover rounded-lg" onerror="this.src='hok_logo.png'"/>
              </div>
              <div class="leading-tight">
                <p class="text-xs text-slate-400">ئويۇندىكى نامىڭىز:</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <p id="cardNickname" class="text-xs font-black text-emerald-300 font-mono">HOK Player</p>
                  <button onclick="editPlayerNickname(event)" type="button" class="text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded transition active:scale-95 cursor-pointer flex items-center gap-0.5" title="ئويۇندىكى نامنى تەھرىرلەش ياكى دەلىللەش">
                    <span>✏️</span>
                    <span>نامنى ئۆزگەرتىش</span>
                  </button>
                </div>
              </div>
            </div>
            <span class="text-emerald-400 text-base font-bold">✓</span>
          </div>
        </div>

      </div>

      `;
  content = content.substring(0, s1Start) + hokStep1Replacement + content.substring(s2Start);
}

// 4. Step 2 Header & Tabs:
const s2HeaderStart = content.indexOf('<div class="flex justify-between items-center px-1">');
const s2LockedNoticeStart = content.indexOf('<!-- Locked Notice');

if (s2HeaderStart !== -1 && s2LockedNoticeStart !== -1) {
  const hokStep2Header = `<div class="flex justify-between items-center px-1">
          <label class="text-xs font-black text-white flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-purple-500/40 shrink-0">2</span>
            <span class="flex items-center gap-1.5"><img src="hok_token.webp" alt="Token" class="w-5 h-5 object-contain inline-block drop-shadow" onerror="this.onerror=null;this.src='hok_token.png'"/><span class="text-sm font-black text-white tracking-wide">توكېن ياكى كارتىلارنى تاللاڭ</span></span>
          </label>
        </div>

        `;
  content = content.substring(0, s2HeaderStart) + hokStep2Header + content.substring(s2LockedNoticeStart);
}

// Replace Locked Notice texts in Step 2
content = content.replace(
  'ئالدى بىلەن ئويۇن كىملىكى (ID) نى دەلىللەڭ',
  'ئالدى بىلەن Honor of Kings Player ID نى دەلىللەڭ'
);
content = content.replace(
  '<span>سېرۋېرغا ماس ئەڭ ئەرزان باھالار ئېچىلىدۇ</span>',
  '<span>بىۋاسىتە ۋە ئەڭ ئەرزان Token باھالىرى</span>'
);
content = content.replace(
  'خاتا سېرۋېرغا پۇل سېلىۋېلىشتىن ساقلىنىش ئۈچۈن، 1-قەدەمدىن ID ۋە رايون كودى كىرگۈزۈلگەندە سىستېما باھالارنى تولۇق ئاچىدۇ.',
  'خاتا كىملىككە پۇل سېلىۋېلىشتىن ساقلىنىش ئۈچۈن، 1-قەدەمدىن Player ID كىرگۈزۈلگەندە سىستېما باھالارنى تولۇق ئاچىدۇ.'
);
content = content.replace(
  `onclick="document.getElementById('mlbbInput').focus();"`,
  `onclick="document.getElementById('hokInput').focus();"`
);
content = content.replace(
  `<button onclick="previewServerOnly('global')" class="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#192233] hover:from-slate-800 hover:to-[#222e44] text-amber-300 border border-amber-500/50 hover:border-amber-400 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-950/40 cursor-pointer">
              <span>سېرۋېر باھالىرىنى كۆرۈپ بېقىش</span>
            </button>`,
  `<button onclick="previewServerOnly('tokens')" class="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#192233] hover:from-slate-800 hover:to-[#222e44] text-purple-300 border border-purple-500/50 hover:border-purple-400 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-purple-950/40 cursor-pointer">
              <span>باھالارنى كۆرۈپ بېقىش</span>
            </button>`
);
content = content.replace(
  '<p class="font-bold text-white" id="previewBannerTitle">كۆرۈپ بېقىش ھالىتى: گىلوبال باھالىرى</p>',
  '<p class="font-bold text-white" id="previewBannerTitle">كۆرۈپ بېقىش ھالىتى: Honor of Kings Token باھالىرى</p>'
);

// 5. Replace Category Tabs
const tabsStart = content.indexOf('<div id="serverTabs"');
const tabsEnd = content.indexOf('<div id="packagesContainer"');

if (tabsStart !== -1 && tabsEnd !== -1) {
  const hokTabs = `<div id="serverTabs" class="grid grid-cols-2 gap-2 bg-[#0a101f] p-1.5 rounded-2xl border border-slate-800 text-xs shadow-lg">
          <button id="tabTokens" onclick="switchServer('tokens')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="w-4 h-4 flex items-center justify-center shrink-0"><img src="hok_token.webp" alt="Token" class="w-4 h-4 object-contain" onerror="this.onerror=null;this.src='hok_token.png'"/></span>
            <span class="text-[10.5px] sm:text-xs font-bold leading-tight">بىۋاسىتە توكېن</span>
          </button>
          <button id="tabBundles" onclick="switchServer('bundles')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="w-4 h-4 flex items-center justify-center shrink-0"><img src="tg_star_badge.webp" alt="Card" class="w-4 h-4 object-contain pass-glow-anim" onerror="this.src='tg_star_badge.png'"/></span>
            <span class="text-[10.5px] sm:text-xs font-bold leading-tight">ھەپتىلىك كارتىلار</span>
          </button>
        </div>

        `;
  content = content.substring(0, tabsStart) + hokTabs + content.substring(tabsEnd);
}

// 6. Generic Text Replacements
content = content.replace(/MLBB ئالماس/g, 'HOK توكېن');
content = content.replace(/Mobile Legends/g, 'Honor of Kings');
content = content.replace(/tg_mlbb_diamond_anim\.webp/g, 'hok_token.webp');
content = content.replace(/tg_mlbb_diamond\.gif/g, 'hok_token.png');
content = content.replace(/tg_mlbb_diamond\.webp/g, 'hok_token.webp');
content = content.replace(/ئالماس بوغچىسىنى تاللاڭ/g, 'توكېن بوغچىسىنى تاللاڭ');
content = content.replace('<!-- ================= 2-قەدەم (STEP 2): ئالماس بوغچىسى تاللاش ================= -->', '<!-- ================= 2-قەدەم (STEP 2): Honor of Kings تاللاش ================= -->');
content = content.replace('<span id="procId" class="text-cyan-300 font-bold">#ML-.....</span>', '<span id="procId" class="text-purple-300 font-bold">#HOK-.....</span>');
content = content.replace('<span class="font-sans">سېرۋېر:</span>\n            <span id="procServer" class="font-bold text-amber-300">🌐 گىلوبال</span>', '<span class="font-sans">ئويۇن:</span>\n            <span id="procServer" class="font-bold text-purple-300">Honor of Kings</span>');
content = content.replace("let playerNick = '亗 SULTAN_MLBB 亗';", "let playerNick = '亗 HOK_PLAYER 亗';");
content = content.replace("server: '🎮 MLBB',", "server: '👑 Honor of Kings',");
content = content.replace("pkg: o.package_name || 'ئالماس بوغچىسى',", "pkg: o.package_name || 'HOK Token',");
content = content.replace(/<span>ئالماس زاكازلىرى<\/span>/g, '<span>توكېن زاكازلىرى</span>');
content = content.replace(/alt="💎"/g, 'alt="Token"');
content = content.replace('ئالماس ياكى كارتىلارنى تاللاپ زاكاز قىلسىڭىز', 'توكېن ياكى كارتىلارنى تاللاپ زاكاز قىلسىڭىز');

// 7. Update App Switcher Modal (HOK active, MLBB & PUBG switchable)
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

          <!-- App 2: PUBG Mobile -->
          <a href="pubg.html" class="glass-box rounded-2xl p-3 border border-amber-500/30 hover:border-amber-400 bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-[#1e1708]/60 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-amber-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
                <img src="pubg_logo.jpg" alt="PUBG Mobile" class="w-full h-full object-cover rounded-xl" onerror="this.src='https://i.ibb.co/KpMvj9fw/3235269bedcbf914ba3e316af4169a3b.jpg'"/>
              </div>
              <div class="text-right min-w-0">
                <p class="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                  <span>PUBG Mobile (پابجى)</span>
                </p>
                <p class="text-[11px] text-amber-300/90 font-mono mt-0.5">🔥 بىۋاسىتە UC • Royale Pass • كودلار</p>
                <p class="text-[10px] text-slate-400">UID ئارقىلىق 3 سېكۇنتتا بىۋاسىتە كىملىككە كىرىدۇ</p>
              </div>
            </div>
            <div class="shrink-0 flex flex-col items-end gap-1">
              <span class="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10.5px] font-black group-hover:bg-amber-400 group-hover:text-slate-950 transition flex items-center gap-1 shadow-sm">
                <span>كىرىش</span>
                <span class="font-mono">➔</span>
              </span>
            </div>
          </a>

          <!-- App 3: Honor of Kings (ACTIVE) -->
          <a href="honor-of-kings.html" class="glass-box rounded-2xl p-3 border border-purple-500/50 bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-[#190e29]/80 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block relative overflow-hidden">
            <span class="absolute top-0 right-0 w-2 h-full bg-purple-400"></span>
            <div class="flex items-center gap-2.5 min-w-0 pr-1">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-purple-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
                <img src="hok_logo.webp" alt="Honor of Kings" class="w-full h-full object-cover rounded-xl" onerror="this.src='hok_logo.png'"/>
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
              <span class="px-2.5 py-1 rounded-xl bg-purple-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm">
                <span>نۆۋەتتىكى</span>
                <span class="font-mono">✓</span>
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

const hokCatalogsReplacement = `    // MaxStore Live Catalogs for Honor of Kings (Tokens, Bundles)
    let CATALOGS = {
      tokens: {
        serverName: 'بىۋاسىتە توكېن',
        serverTitle: 'بىۋاسىتە توكېن',
        flag: '<img src="hok_token.webp" alt="Token" class="w-4 h-4 object-contain inline-block shrink-0 drop-shadow" onerror="this.onerror=null;this.src=\\'hok_token.png\\'"/>',
        packages: [
          { id: 758, name: '16 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 0.25, isVip: false },
          { id: 764, name: '80 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 1.05, isVip: true },
          { id: 759, name: '240 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 2.95, isVip: true },
          { id: 761, name: '400 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 4.85, isVip: true },
          { id: 763, name: '560 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 6.75, isVip: true },
          { id: 765, name: '830 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 9.65, isVip: true },
          { id: 757, name: '1245 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 14.35, isVip: true },
          { id: 760, name: '2508 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 28.50, isVip: true },
          { id: 762, name: '4180 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 47.50, isVip: true },
          { id: 766, name: '8360 Tokens', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 94.90, isVip: true },
        ]
      },
      bundles: {
        serverName: 'ھەپتىلىك كارتىلار & تەمىنات',
        serverTitle: 'ھەپتىلىك كارتىلار',
        flag: '<img src="tg_star_badge.webp" alt="Card" class="w-4 h-4 object-contain inline-block shrink-0 drop-shadow pass-glow-anim" onerror="this.src=\\'tg_star_badge.png\\'"/>',
        packages: [
          { id: 772, name: 'Weekly Card', subtext: 'ھەپتىلىك كارتىسى (100 Token)', price: 1.15, isVip: true },
          { id: 773, name: 'Weekly Card Plus', subtext: 'ھەپتىلىك پىلۇس (280 Token)', price: 3.15, isVip: true },
          { id: 767, name: 'Double Token Lucky Bag', subtext: 'تەلىي بوغچىسى (60+20)', price: 0.35, isVip: true },
          { id: 769, name: 'Infernal Shadow Zilong Pack', subtext: 'زىلوڭ تېرىسى بوغچىسى', price: 0.58, isVip: true },
        ]
      }
    };`;

content = content.replace(oldCatalogsLogic, hokCatalogsReplacement);

// 9. Replace loadDynamicCatalog()
const oldLoadDynamicCatalog = `    async function loadDynamicCatalog() {
      try {
        const res = await fetch('/api/apps/catalog?app=mobile-legends');
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.ok || !data.catalogs) return;

        // Map live items into CATALOGS
        if (Array.isArray(data.catalogs.global) && data.catalogs.global.length > 0) {
          CATALOGS.global.packages = data.catalogs.global.map(p => ({
            id: p.id,
            name: p.name,
            subtext: p.subtext || 'رەسمىي قاچىلاش',
            price: Number(p.price),
            isVip: !!p.popular
          }));
        }
        if (Array.isArray(data.catalogs.turkey) && data.catalogs.turkey.length > 0) {
          CATALOGS.turkey.packages = data.catalogs.turkey.map(p => ({
            id: p.id,
            name: p.name,
            subtext: p.subtext || 'رەسمىي قاچىلاش',
            price: Number(p.price),
            isVip: !!p.popular
          }));
        }
        if (Array.isArray(data.catalogs.special) && data.catalogs.special.length > 0) {
          CATALOGS.special.packages = data.catalogs.special.map(p => ({
            id: p.id,
            name: p.name,
            subtext: p.subtext || 'رەسمىي قاچىلاش',
            price: Number(p.price),
            isVip: !!p.popular
          }));
        }

        renderPackages();
      } catch (err) {
        console.warn('Failed to load dynamic MaxStore catalogs, keeping ultra-fast fallback defaults:', err);
      }
    }`;

const hokLoadDynamicCatalog = `    async function loadDynamicCatalog() {
      try {
        const res = await fetch('/api/apps/catalog?app=honor-of-kings');
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.ok || !data.catalogs) return;

        if (Array.isArray(data.catalogs.tokens) && data.catalogs.tokens.length > 0) {
          CATALOGS.tokens.packages = data.catalogs.tokens.map(p => ({
            id: p.id,
            name: p.name,
            subtext: p.subtext || 'بىۋاسىتە كىملىككە (UID)',
            price: Number(p.price),
            isVip: !!p.popular
          }));
        }
        if (Array.isArray(data.catalogs.bundles) && data.catalogs.bundles.length > 0) {
          CATALOGS.bundles.packages = data.catalogs.bundles.map(p => ({
            id: p.id,
            name: p.name,
            subtext: p.subtext || 'رەسمىي ئالاھىدە تەمىنات',
            price: Number(p.price),
            isVip: !!p.popular
          }));
        }

        renderPackages();
      } catch (err) {
        console.warn('Failed to load dynamic MaxStore catalogs, keeping ultra-fast fallback defaults:', err);
      }
    }`;

content = content.replace(oldLoadDynamicCatalog, hokLoadDynamicCatalog);

// 10. Update state variables
content = content.replace("let currentServer = 'global';", "let currentServer = 'tokens';");

// 11. Update parseInput
const oldParseInput = `    function parseInput(val) {
      const clean = val.replace(/[^0-9() ]/g, '').trim();
      const match = clean.match(/^(\\d+)[\\s(]+(\\d+)\\)?$/);
      if (match) {
        return { uid: match[1], zone: match[2] };
      }
      return null;
    }`;

const hokParseInput = `    function parseInput(val) {
      const clean = val.replace(/[^0-9]/g, '').trim();
      if (clean.length >= 6 && clean.length <= 15) {
        return { uid: clean, zone: '' };
      }
      return null;
    }`;

content = content.replace(oldParseInput, hokParseInput);

// 12. Update executeSearch, previewServerOnly, switchServer
const oldExecuteSearch = `    async function executeSearch() {
      const input = document.getElementById('mlbbInput');
      const val = input.value.trim();
      const clearBtn = document.getElementById('clearInputBtn');
      if (clearBtn) clearBtn.classList.toggle('hidden', val.length === 0);

      const parsed = parseInput(val);
      if (!parsed) {
        showError('ئايدى ياكى سېرۋېر نۇمۇرى خاتا. مەسىلەن: 12345678 (1234)');
        return;
      }

      setLoading(true);
      hideError();

      try {
        const res = await fetch(\`https://api.maxstore.app/v1/mlbb/check?user_id=\${parsed.uid}&zone_id=\${parsed.zone}\`);
        const data = await res.json();

        if (data.status === 200 && data.data && data.data.username) {
          isLocked = false;
          detectedServer = data.data.country || 'global';
          playerNick = data.data.username;
          
          if (detectedServer.toLowerCase().includes('tr') || detectedServer.toLowerCase().includes('turkey')) {
            currentServer = 'turkey';
          } else if (detectedServer.toLowerCase().includes('ph') || detectedServer.toLowerCase().includes('philippines')) {
            currentServer = 'special';
          } else {
            currentServer = 'global';
          }

          showVerifiedCard(parsed.uid, parsed.zone, playerNick, detectedServer);
          unlockStep2(currentServer);
          updatePreviewBanner(false);
          saveAccount(parsed.uid, parsed.zone, playerNick);
        } else {
          showError('ئويۇنچى تېپىلمىدى. كىملىك نۇمۇرىنى قايتا تەكشۈرۈڭ.');
        }
      } catch (err) {
        // Fallback for demo / offline
        isLocked = false;
        detectedServer = 'global';
        currentServer = 'global';
        showVerifiedCard(parsed.uid, parsed.zone, playerNick, detectedServer);
        unlockStep2(currentServer);
        updatePreviewBanner(false);
      } finally {
        setLoading(false);
      }
    }`;

const hokExecuteSearch = `    async function executeSearch() {
      const input = document.getElementById('hokInput');
      const val = input.value.trim();
      const clearBtn = document.getElementById('clearInputBtn');
      if (clearBtn) clearBtn.classList.toggle('hidden', val.length === 0);

      const parsed = parseInput(val);
      if (!parsed) {
        showError('ئايدى نۇمۇرى خاتا. مەسىلەن: 123456789 (6 تىن 15 خانىغىچە)');
        return;
      }

      setLoading(true);
      hideError();

      try {
        const checkRes = await fetch('/api/apps/check-player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: parsed.uid, game: 'honor-of-kings' })
        });
        const data = await checkRes.json();

        if (data.success && data.nickname) {
          isLocked = false;
          playerNick = data.nickname;
          showVerifiedCard(parsed.uid, '', playerNick, 'Honor of Kings');
          unlockStep2(currentServer);
          updatePreviewBanner(false);
          saveAccount(parsed.uid, '', playerNick);
        } else {
          showError(data.error || 'ئويۇنچى تېپىلمىدى. Player ID نى قايتا تەكشۈرۈڭ.');
        }
      } catch (err) {
        isLocked = false;
        showVerifiedCard(parsed.uid, '', playerNick, 'Honor of Kings');
        unlockStep2(currentServer);
        updatePreviewBanner(false);
      } finally {
        setLoading(false);
      }
    }`;

content = content.replace(oldExecuteSearch, hokExecuteSearch);

// Update previewServerOnly
content = content.replace(
  `function previewServerOnly(serverKey) {`,
  `function previewServerOnly(serverKey) {
      serverKey = serverKey || 'tokens';`
);

// Update switchServer
const oldSwitchServer = `    function switchServer(serverKey) {
      currentServer = serverKey;
      ['global', 'turkey', 'special'].forEach(s => {
        const btn = document.getElementById('tab' + s.charAt(0).toUpperCase() + s.slice(1));
        if (!btn) return;
        const sTitle = CATALOGS[s] ? CATALOGS[s].serverTitle : s;
        const sFlag = CATALOGS[s] ? CATALOGS[s].flag : '';

        if (s === currentServer) {
          btn.className = 'py-2 px-1 rounded-xl font-black transition-all text-center bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300 flex items-center justify-center gap-1.5 scale-[1.02] cursor-pointer';
          btn.innerHTML = '<span class="w-4 h-4 flex items-center justify-center shrink-0">' + sFlag + '</span><span class="text-[10.5px] sm:text-xs leading-tight">' + sTitle + '</span>';
        } else {
          btn.className = 'py-2 px-1 rounded-xl font-bold transition text-center text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent cursor-pointer flex items-center justify-center gap-1.5';
          btn.innerHTML = '<span class="w-4 h-4 flex items-center justify-center shrink-0">' + sFlag + '</span><span class="text-[10.5px] sm:text-xs leading-tight">' + sTitle + '</span>';
        }
      });

      renderPackages();
      if (selectedPkg) {
        updateBottomBar();
        updateWalletBoxes();
      }
    }`;

const hokSwitchServer = `    function switchServer(serverKey) {
      currentServer = serverKey;
      ['tokens', 'bundles'].forEach(s => {
        const tabId = s === 'tokens' ? 'tabTokens' : 'tabBundles';
        const btn = document.getElementById(tabId);
        if (!btn) return;
        const sTitle = CATALOGS[s] ? CATALOGS[s].serverTitle : s;
        const sFlag = CATALOGS[s] ? CATALOGS[s].flag : '';

        if (s === currentServer) {
          btn.className = 'py-2 px-1 rounded-xl font-black transition-all text-center bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 border border-purple-300 flex items-center justify-center gap-1.5 scale-[1.02] cursor-pointer';
          btn.innerHTML = '<span class="w-4 h-4 flex items-center justify-center shrink-0">' + sFlag + '</span><span class="text-[10.5px] sm:text-xs leading-tight">' + sTitle + '</span>';
        } else {
          btn.className = 'py-2 px-1 rounded-xl font-bold transition text-center text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent cursor-pointer flex items-center justify-center gap-1.5';
          btn.innerHTML = '<span class="w-4 h-4 flex items-center justify-center shrink-0">' + sFlag + '</span><span class="text-[10.5px] sm:text-xs leading-tight">' + sTitle + '</span>';
        }
      });

      renderPackages();
      if (selectedPkg) {
        updateBottomBar();
        updateWalletBoxes();
      }
    }`;

content = content.replace(oldSwitchServer, hokSwitchServer);

// 13. Update renderPackages()
const oldRenderPackages = `    function renderPackages() {
      const container = document.getElementById('packagesContainer');
      const cat = CATALOGS[currentServer];
      if (!cat) return;

      container.innerHTML = cat.packages.map((pkg, idx) => {
        const isSelected = selectedPkg && selectedPkg.id === pkg.id;
        const isPass = pkg.name.includes('كارت') || pkg.name.includes('بوغچ') || pkg.name.includes('Pass') || pkg.name.includes('Pack');
        
        let iconHtml;
        if (isPass) {
          iconHtml = '<img src="tg_mlbb_weekly_pass.webp" alt="Pass" class="w-5 h-5 object-contain shrink-0 pass-glow-anim" onerror="this.src=\\'tg_mlbb_diamond_v2.webp\\'"/>';
        } else {
          iconHtml = '<img src="tg_mlbb_diamond_anim.webp" alt="💎" class="w-5 h-5 object-contain shrink-0 drop-shadow" onerror="this.onerror=null;this.src=\\'tg_mlbb_diamond.gif\\'"/>';
        }

        return \`
          <button 
            type="button"
            onclick="selectPackage(\${pkg.id})"
            class="relative rounded-2xl p-2.5 sm:p-3 text-right transition-all flex flex-col justify-between gap-1.5 cursor-pointer \${
              isSelected 
                ? 'bg-gradient-to-b from-[#1c2237] to-[#121727] border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]' 
                : 'bg-[#0d1322] hover:bg-[#12192c] border border-slate-800/90 hover:border-slate-700'
            }"
          >
            <div class="flex items-center justify-between gap-1.5 w-full">
              <span class="text-xs sm:text-sm font-black text-white leading-tight flex-1">
                \${pkg.name}
              </span>
              \${iconHtml}
            </div>

            <div class="pt-1 border-t border-slate-800/80 flex items-center justify-between w-full">
              <span class="text-[10px] sm:text-[11px] text-slate-400 font-bold">باھاسى:</span>
              <span class="text-xs sm:text-sm font-black text-amber-300 font-mono tracking-tight">
                \${pkg.price.toFixed(2)} $
              </span>
            </div>
          </button>
        \`;
      }).join('');
    }`;

const hokRenderPackages = `    function renderPackages() {
      const container = document.getElementById('packagesContainer');
      const cat = CATALOGS[currentServer];
      if (!cat) return;

      container.innerHTML = cat.packages.map((pkg, idx) => {
        const isSelected = selectedPkg && selectedPkg.id === pkg.id;
        const isBundle = currentServer === 'bundles' || pkg.name.includes('Card') || pkg.name.includes('Bag') || pkg.name.includes('Pack') || pkg.name.includes('كارتا');
        
        let iconHtml;
        if (isBundle) {
          iconHtml = '<img src="tg_star_badge.webp" alt="Pass" class="w-5 h-5 object-contain shrink-0 pass-glow-anim" onerror="this.src=\\'tg_star_badge.png\\'"/>';
        } else {
          iconHtml = '<img src="hok_token.webp" alt="Token" class="w-5 h-5 object-contain shrink-0 drop-shadow" onerror="this.onerror=null;this.src=\\'hok_token.png\\'"/>';
        }

        return \`
          <button 
            type="button"
            onclick="selectPackage(\${pkg.id})"
            class="relative rounded-2xl p-2.5 sm:p-3 text-right transition-all flex flex-col justify-between gap-1.5 cursor-pointer \${
              isSelected 
                ? 'bg-gradient-to-b from-[#221c37] to-[#171227] border-2 border-purple-400 shadow-lg shadow-purple-500/20 scale-[1.02]' 
                : 'bg-[#0d1322] hover:bg-[#12192c] border border-slate-800/90 hover:border-slate-700'
            }"
          >
            <div class="flex items-center justify-between gap-1.5 w-full">
              <span class="text-xs sm:text-sm font-black text-white leading-tight flex-1">
                \${pkg.name}
              </span>
              \${iconHtml}
            </div>

            <div class="pt-1 border-t border-slate-800/80 flex items-center justify-between w-full">
              <span class="text-[10px] sm:text-[11px] text-slate-400 font-bold">باھاسى:</span>
              <span class="text-xs sm:text-sm font-black text-amber-300 font-mono tracking-tight">
                \${pkg.price.toFixed(2)} $
              </span>
            </div>
          </button>
        \`;
      }).join('');
    }`;

content = content.replace(oldRenderPackages, hokRenderPackages);

// 14. Update clearPlayerInput()
content = content.replace(
  `function clearPlayerInput() {
      const input = document.getElementById('mlbbInput');`,
  `function clearPlayerInput() {
      const input = document.getElementById('hokInput');`
);

// 15. Update executeTopup()
const topupStart = content.indexOf('async function executeTopup() {');
const topupEnd = content.indexOf('function closeProcessingModal() {');

if (topupStart !== -1 && topupEnd !== -1) {
  const hokExecuteTopup = `async function executeTopup() {
      if (isSubmittingTopup) return;
      if (!selectedPkg) {
        showAppModal({
          title: 'توكېن بوغچىسى تاللانمىدى',
          message: 'داۋاملاشتۇرۇشتىن ئاۋۋال 2-قەدەمدىن لازىملىق توكېن ياكى ھەپتىلىك كارتىنى تاللاڭ.',
          icon: '⚠️',
          confirmText: 'چۈشەندىم'
        });
        return;
      }

      const input = document.getElementById('hokInput');
      const val = (input ? input.value : '').trim();
      const parsed = parseInput(val);
      if (!parsed || !parsed.uid) {
        showAppModal({
          title: 'ئويۇن كىملىكى تولۇق ئەمەس',
          message: '1-قەدەمدىن Honor of Kings ئويۇن كىملىكىڭىز (Player ID) نى تولۇق كىرگۈزۈڭ.',
          icon: '⚠️',
          confirmText: 'كىرگۈزۈش',
          confirmAction: function() {
            if (input) input.focus();
          }
        });
        return;
      }

      const uSession = getUserSession();
      if (!uSession || !uSession.identity) {
        openTelegramModal();
        return;
      }

      const walletBalance = Number(uSession.balance || 0);
      if (walletBalance < selectedPkg.price) {
        const missing = selectedPkg.price - walletBalance;
        showAppModal({
          title: 'ھەميان قالدۇقى يېتىشمىدى',
          message: 'نۆۋەتتىكى قالدۇقىڭىز: $' + walletBalance.toFixed(2) + '، بۇ بوغچىنى سېتىۋېلىشقا يەنە $' + missing.toFixed(2) + ' كەملىدى (جەمئىي باھاسى: $' + selectedPkg.price.toFixed(2) + '). ئالدى بىلەن شامكەش ئارقىلىق قالدۇق كىرگۈزۈڭ!',
          icon: '<img src="tg_wallet_dollar_anim.webp" alt="$" class="w-10 h-10 object-contain mx-auto" onerror="this.onerror=null;this.src=\\'tg_wallet_dollar.gif\\'"/>',
          confirmText: '⚡ قالدۇق قاچىلاش (ShamCash)',
          confirmAction: function() {
            openDepositModal();
          },
          cancelText: 'تاقاش'
        });
        return;
      }

      isSubmittingTopup = true;
      openProcessingModal();

      try {
        const targetPlayerId = parsed.uid;

        var res = await fetch('/api/apps/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: uSession.identity,
            player_id: targetPlayerId,
            server_id: '',
            package_id: selectedPkg.id,
            package_name: selectedPkg.name,
            price: selectedPkg.price,
            app_id: 'honor-of-kings'
          })
        });

        var data = await res.json();
        closeProcessingModal();

        if (data.ok || data.success) {
          var orderId = data.order_id || ('#HOK-' + Math.floor(100000 + Math.random() * 900000));
          var newBalance = typeof data.new_balance === 'number' ? data.new_balance : (walletBalance - selectedPkg.price);
          
          uSession.balance = Math.max(0, newBalance);
          localStorage.setItem('maxbazar_unified_session', JSON.stringify(uSession));
          localStorage.setItem('maxbazar_hok_session', JSON.stringify(uSession));
          window.dispatchEvent(new CustomEvent('maxbazar-auth-changed', { detail: uSession }));

          showAppModal({
            title: '🎉 زاكاز مۇۋەپپەقىيەتلىك بېرىلدى!',
            message: 'زاكاز نومۇرى: ' + orderId + '\\nبىۋاسىتە Honor of Kings كىملىكىڭىزگە قاچىلاندى. نۆۋەتتىكى قالدۇقىڭىز: $' + newBalance.toFixed(2),
            icon: '✅',
            confirmText: 'زاكاز تالونىنى كۆرۈش',
            confirmAction: function() {
              openHistoryModal();
            }
          });
        } else {
          showAppModal({
            title: 'زاكاز مەغلۇپ بولدى',
            message: data.error || 'سېرۋېردا كاشىلا كۆرۈلدى، قايتا سىناپ بېقىڭ.',
            icon: '❌',
            confirmText: 'قايتا سىناش'
          });
        }
      } catch (err) {
        closeProcessingModal();
        showAppModal({
          title: 'ئۇلىنىش خاتالىقى',
          message: 'تور ئۇلىنىشىڭىزنى تەكشۈرۈپ قايتا سىناڭ.',
          icon: '⚠️',
          confirmText: 'چۈشەندىم'
        });
      } finally {
        isSubmittingTopup = false;
      }
    }

    `;
  content = content.substring(0, topupStart) + hokExecuteTopup + content.substring(topupEnd);
}

// 16. Update input ID references: mlbbInput -> hokInput everywhere
content = content.replace(/mlbbInput/g, 'hokInput');

fs.writeFileSync(hokHtmlPath, content, 'utf8');
fs.writeFileSync(hokShortHtmlPath, content, 'utf8');
console.log('Successfully built public/honor-of-kings.html and public/hok.html with clean UI, zero-lag, and full HOK features!');
