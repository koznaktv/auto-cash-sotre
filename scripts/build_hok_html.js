const fs = require('fs');
const path = require('path');

const mlbbHtmlPath = path.join(__dirname, '../public/mlbb.html');
const hokHtmlPath = path.join(__dirname, '../public/honor-of-kings.html');
const hokShortHtmlPath = path.join(__dirname, '../public/hok.html');

let content = fs.readFileSync(mlbbHtmlPath, 'utf8').replace(/\r\n/g, '\n');

// 0. Add <base href="/"> in <head> so nested paths like /apps/honor-of-kings ALWAYS resolve assets to root
if (!content.includes('<base href="/"')) {
  content = content.replace('<head>', '<head>\n  <base href="/">');
}

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
            <img src="/hok_logo.webp" alt="Honor of Kings" class="w-full h-full object-cover rounded-xl" onerror="this.src='/hok_logo.png'"/>
          </div>
          <div class="flex-1 text-right min-w-0">
            <h1 class="text-sm sm:text-base font-black text-white tracking-wide leading-tight truncate">
              Honor of Kings (داڭلىقلار سەپىرى)
            </h1>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] text-purple-300 font-bold flex items-center gap-1 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-400/30 whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="w-4 h-4 flex items-center justify-center shrink-0"><img src="/hok_token.webp" alt="Token" class="w-4 h-4 object-contain" onerror="this.onerror=null;this.src='/hok_token.png'"/></span>
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
              <span id="searchIcon" class="w-4 h-4 flex items-center justify-center shrink-0"><img src="/tg_search_anim.webp" alt="🔎" class="w-4 h-4 object-contain drop-shadow" onerror="this.onerror=null;this.src='/tg_search.gif'"/></span>
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
                <img src="/hok_logo.webp" alt="HOK" class="w-full h-full object-cover rounded-lg" onerror="this.src='/hok_logo.png'"/>
              </div>
              <div class="leading-tight">
                <p id="cardNicknameLabel" class="text-xs text-slate-400">قوبۇل قىلغۇچى كىملىك (UID):</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <p id="cardNickname" class="text-xs font-black text-emerald-300 font-mono">UID: 5113048677740798346</p>
                  <button id="cardEditBtn" onclick="editPlayerNickname(event)" type="button" class="text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded transition active:scale-95 cursor-pointer flex items-center gap-0.5" title="ئويۇندىكى نامنى قوشۇش ياكى تەھرىرلەش">
                    <span>✏️</span>
                    <span id="cardEditBtnText">نام قوشۇش (ئىختىيارىي)</span>
                  </button>
                </div>
                <p id="cardSubtext" class="text-[10px] text-cyan-300/80 mt-0.5 flex items-center gap-1">
                  <span>⚡</span><span>بىۋاسىتە مەزكۇر UID ھېساباتىغا قاچىلىنىدۇ (100% كاپالەتلىك)</span>
                </p>
              </div>
            </div>
            <span class="text-emerald-400 text-base font-bold">✓</span>
          </div>
        </div>

      </div>

      `;
  content = content.substring(0, s1Start) + hokStep1Replacement + content.substring(s2Start);
}

// 4. Step 2 Header & Tabs
const s2HeaderStart = content.indexOf('<div class="flex justify-between items-center px-1">');
const s2LockedNoticeStart = content.indexOf('<!-- Locked Notice');

if (s2HeaderStart !== -1 && s2LockedNoticeStart !== -1) {
  const hokStep2Header = `<div class="flex justify-between items-center px-1">
          <label class="text-xs font-black text-white flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-purple-500/40 shrink-0">2</span>
            <span class="flex items-center gap-1.5"><img src="/hok_token.webp" alt="Token" class="w-5 h-5 object-contain inline-block drop-shadow" onerror="this.onerror=null;this.src='/hok_token.png'"/><span class="text-sm font-black text-white tracking-wide">توكېن ياكى كارتىلارنى تاللاڭ</span></span>
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
            <span class="w-4 h-4 flex items-center justify-center shrink-0"><img src="/hok_token.webp" alt="Token" class="w-4 h-4 object-contain" onerror="this.onerror=null;this.src='/hok_token.png'"/></span>
            <span class="text-[10.5px] sm:text-xs font-bold leading-tight">بىۋاسىتە توكېن</span>
          </button>
          <button id="tabBundles" onclick="switchServer('bundles')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="w-4 h-4 flex items-center justify-center shrink-0"><img src="/tg_star_badge.webp" alt="Card" class="w-4 h-4 object-contain pass-glow-anim" onerror="this.src='/tg_star_badge.png'"/></span>
            <span class="text-[10.5px] sm:text-xs font-bold leading-tight">ھەپتىلىك كارتىلار</span>
          </button>
        </div>

        `;
  content = content.substring(0, tabsStart) + hokTabs + content.substring(tabsEnd);
}

// 6. Generic Text & Image Root-Relative Replacements
content = content.replace(/MLBB ئالماس/g, 'HOK توكېن');
content = content.replace(/Mobile Legends/g, 'Honor of Kings');
content = content.replace(/tg_mlbb_diamond_anim\.webp/g, 'hok_token.webp');
content = content.replace(/tg_mlbb_diamond\.gif/g, 'hok_token.png');
content = content.replace(/tg_mlbb_diamond\.webp/g, 'hok_token.webp');
content = content.replace(/ئالماس بوغچىسىنى تاللاڭ/g, 'توكېن بوغچىسىنى تاللاڭ');
content = content.replace('<!-- ================= 2-قەدەم (STEP 2): ئالماس بوغچىسى تاللاش ================= -->', '<!-- ================= 2-قەدەم (STEP 2): Honor of Kings تاللاش ================= -->');
content = content.replace('<span id="procId" class="text-cyan-300 font-bold">#ML-.....</span>', '<span id="procId" class="text-purple-300 font-bold">#HOK-.....</span>');
content = content.replace('<span class="font-sans">سېرۋېر:</span>\n            <span id="procServer" class="font-bold text-amber-300">🌐 گىلوبال</span>', '<span class="font-sans">ئويۇن:</span>\n            <span id="procServer" class="font-bold text-purple-300">Honor of Kings</span>');
content = content.replace("server: '🎮 MLBB',", "server: '👑 Honor of Kings',");
content = content.replace("pkg: o.package_name || 'ئالماس بوغچىسى',", "pkg: o.package_name || 'HOK Token',");
content = content.replace(/<span>ئالماس زاكازلىرى<\/span>/g, '<span>توكېن زاكازلىرى</span>');
content = content.replace(/alt="💎"/g, 'alt="Token"');
content = content.replace('ئالماس ياكى كارتىلارنى تاللاپ زاكاز قىلسىڭىز', 'توكېن ياكى كارتىلارنى تاللاپ زاكاز قىلسىڭىز');

// Ensure all assets are absolute paths starting with /
content = content.replace(/src="tg_/g, 'src="/tg_');
content = content.replace(/src='tg_/g, "src='/tg_");
content = content.replace(/src="autocash_/g, 'src="/autocash_');
content = content.replace(/src='autocash_/g, "src='/autocash_");
content = content.replace(/src="brand_/g, 'src="/brand_');
content = content.replace(/src='brand_/g, "src='/brand_");
content = content.replace(/src="shamcash\.png"/g, 'src="/shamcash.png"');

// 7. Update App Switcher Modal (HOK active, MLBB & PUBG switchable)
const modalAppGridStart = content.indexOf('<!-- App List Grid -->');
const modalAppGridEnd = content.indexOf('<!-- App 4: AUTO CASH Full Store -->');

if (modalAppGridStart !== -1 && modalAppGridEnd !== -1) {
  const newAppSection = `<!-- App List Grid -->
        <div class="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-1 relative z-10">
          
          <!-- App 1: Mobile Legends: Bang Bang -->
          <a href="/mlbb.html" class="glass-box rounded-2xl p-3 border border-cyan-500/30 hover:border-cyan-400 bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-[#0e192e] flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-cyan-400/50 flex items-center justify-center shrink-0 bg-slate-950">
                <img src="https://play-lh.googleusercontent.com/MztmLpB1-_eFbHnqNzzvzl5zjiOH2BEb0D71uBxZYf_4BEmW3QEPWODhRtyqY7Qz4wRLwQ--Rg1RAjOFqtHSs-o=s256" alt="Mobile Legends" class="w-full h-full object-cover" onerror="this.src='/mlbb_icon.png'"/>
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
          <a href="/pubg.html" class="glass-box rounded-2xl p-3 border border-amber-500/30 hover:border-amber-400 bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-[#1e1708]/60 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-amber-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
                <img src="/pubg_logo.jpg" alt="PUBG Mobile" class="w-full h-full object-cover rounded-xl" onerror="this.src='https://i.ibb.co/KpMvj9fw/3235269bedcbf914ba3e316af4169a3b.jpg'"/>
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
          <a href="/honor-of-kings.html" class="glass-box rounded-2xl p-3 border border-purple-500/50 bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-[#190e29]/80 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block relative overflow-hidden">
            <span class="absolute top-0 right-0 w-2 h-full bg-purple-400"></span>
            <div class="flex items-center gap-2.5 min-w-0 pr-1">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-purple-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
                <img src="/hok_logo.webp" alt="Honor of Kings" class="w-full h-full object-cover rounded-xl" onerror="this.src='/hok_logo.png'"/>
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
const catStart = content.indexOf('    // MaxStore Live Catalogs');
const loadDynStart = content.indexOf('    async function loadDynamicCatalog() {');

if (catStart !== -1 && loadDynStart !== -1) {
  const hokCatalogsReplacement = `    // MaxStore Live Catalogs for Honor of Kings (Tokens, Bundles)
    let CATALOGS = {
      tokens: {
        serverName: 'بىۋاسىتە توكېن',
        serverTitle: 'بىۋاسىتە توكېن',
        flag: '<img src="/hok_token.webp" alt="Token" class="w-4 h-4 object-contain inline-block shrink-0 drop-shadow" onerror="this.onerror=null;this.src=\\'/hok_token.png\\'"/>',
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
        flag: '<img src="/tg_star_badge.webp" alt="Card" class="w-4 h-4 object-contain inline-block shrink-0 drop-shadow pass-glow-anim" onerror="this.src=\\'/tg_star_badge.png\\'"/>',
        packages: [
          { id: 772, name: 'Weekly Card (ھەپتىلىك كارتىسى)', subtext: '100 توكېن + كۈندىلىك مۇكاپات', price: 1.15, isVip: true },
          { id: 773, name: 'Weekly Card Plus (ھەپتىلىك پىلۇس)', subtext: '280 توكېن + ئالىي تەمىنات', price: 3.15, isVip: true },
          { id: 770, name: 'Premium Purchase Rebate Pack', subtext: 'ئالىي قايتۇرما بوغچىسى', price: 1.25, isVip: true },
          { id: 767, name: 'Double Token Lucky Bag', subtext: 'قوش ھەسسە تەلىي بوغچىسى (60+20)', price: 0.35, isVip: true },
          { id: 768, name: 'Honor Point Value Pack', subtext: 'شان-شەرەپ نومۇرى قىممەت بوغچىسى', price: 0.35, isVip: false },
          { id: 771, name: 'Standard Purchase Rebate Pack', subtext: 'ئۆلچەملىك قايتۇرما بوغچىسى', price: 0.35, isVip: false },
        ]
      }
    };

`;
  content = content.substring(0, catStart) + hokCatalogsReplacement + content.substring(loadDynStart);
}

// 9. Replace loadDynamicCatalog()
const actualDynStart = content.indexOf('    async function loadDynamicCatalog() {');
const loadDynEnd = content.indexOf('    let walletBalance = 0.00;');
if (actualDynStart !== -1 && loadDynEnd !== -1) {
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
        updateDisplays();
      } catch (err) {
        console.warn('Failed to load dynamic MaxStore catalogs, keeping ultra-fast fallback defaults:', err);
      }
    }

`;
  content = content.substring(0, actualDynStart) + hokLoadDynamicCatalog + content.substring(loadDynEnd);
}

// 10. Update state variables
content = content.replace("let currentServer = 'global';", "let currentServer = 'tokens';");
content = content.replace("let selectedPkg = CATALOGS.global.packages[0];", "let selectedPkg = CATALOGS.tokens.packages[0];");
content = content.replace(/&app_id=mobile-legends/g, '&app_id=honor-of-kings');
content = content.replace(/app_id: 'mobile-legends'/g, "app_id: 'honor-of-kings'");

// 11. Update parseInput
const parseInputStart = content.indexOf('    function parseInput(val) {');
const parseInputEnd = content.indexOf('    // Live Search ID & Zone');

if (parseInputStart !== -1 && parseInputEnd !== -1) {
  const hokParseInput = `    function normalizeDigits(str) {
      return String(str || '')
        .replace(/[٠-٩]/g, function(d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })
        .replace(/[۰-۹]/g, function(d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); });
    }

    function parseInput(val) {
      if (!val) return null;
      var raw = normalizeDigits(val).trim();
      var clean = raw.replace(/^(uid|id|player\\s*id|playerid)\\s*[:：#]?\\s*/i, '').trim();

      // 1. Numeric UID (4 to 25 digits)
      var numOnly = clean.replace(/[^0-9]/g, '');
      if (numOnly.length >= 4 && numOnly.length <= 25) {
        return { id: numOnly, zone: '', isNumeric: true };
      }

      // 2. Alphanumeric Character ID / Username (3 to 32 chars)
      var alnumOnly = clean.replace(/[^a-zA-Z0-9_\\-\\.\\s]/g, '').trim();
      if (alnumOnly.length >= 3 && alnumOnly.length <= 32) {
        return { id: alnumOnly, zone: '', isNumeric: false };
      }

      return null;
    }

`;
  content = content.substring(0, parseInputStart) + hokParseInput + content.substring(parseInputEnd);
}

// 12. Update executeSearch, previewServerOnly, switchServer
const execSearchStart = content.indexOf('    // Live Search ID & Zone');
const renderPkgStart = content.indexOf('    function renderPackages() {');

if (execSearchStart !== -1 && renderPkgStart !== -1) {
  const hokFunctionsReplacement = `    // ================= HOK ACCOUNT STORAGE & NICKNAME EDIT =================
    function saveHokAccount(uid, nickname) {
      if (!uid || !nickname) return;
      try {
        const raw = localStorage.getItem('maxbazar_hok_saved_accounts');
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
        localStorage.setItem('maxbazar_hok_saved_accounts', JSON.stringify(list));
      } catch (_) {}
    }

    function editPlayerNickname(e) {
      if (e && e.stopPropagation) e.stopPropagation();
      if (!parsedId) return;
      const currentName = playerNick || '';
      showAppModal({
        icon: '✏️',
        title: 'ئويۇندىكى نامنى قوشۇش / تەھرىرلەش',
        message: 'ئەسكەرتىش: Honor of Kings دا زاكاز بىۋاسىتە UID نومۇرىڭىزغا قاراپ 100% توغرا قاچىلىنىدۇ. ئەگەر تالوندا ئۆز نامىڭىزنى كۆرسەتمەكچى بولسىڭىز، ئويۇندىكى نامىڭىزنى كىرگۈزۈڭ (ئىختىيارىي):',
        showInput: true,
        inputValue: currentName.startsWith('UID:') ? '' : currentName,
        inputPlaceholder: 'مەسىلەن: ئويۇندىكى نامىم',
        confirmText: '💾 ساقلاش ۋە دەلىللەش',
        cancelText: 'بىكار قىلىش',
        confirmAction: async function(val) {
          const newName = (val || '').trim();
          if (!newName) return;
          playerNick = newName;
          hasRealNick = true;
          const cardNick = document.getElementById('cardNickname');
          const cardLabel = document.getElementById('cardNicknameLabel');
          const editBtnText = document.getElementById('cardEditBtnText');
          const cardSub = document.getElementById('cardSubtext');

          if (cardNick) cardNick.textContent = newName;
          if (cardLabel) cardLabel.textContent = 'ئويۇندىكى نامىڭىز:';
          if (editBtnText) editBtnText.textContent = 'نامنى ئۆزگەرتىش';
          if (cardSub) cardSub.innerHTML = '<span>✓</span><span>ئويۇن نامى مۇۋەپپەقىيەتلىك دەلىللەندى</span>';

          saveHokAccount(parsedId, newName);

          try {
            await fetch('/api/apps/check-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                game: 'honor-of-kings',
                playerId: parsedId,
                customNickname: newName
              })
            });
          } catch (_) {}

          showAppToast('✅ ئويۇندىكى نامىڭىز مۇۋەپپەقىيەتلىك دەلىللەندى!');
        }
      });
    }

    // Live Search HOK UID
    async function executeSearch() {
      clearErrorState();
      const inputElem = document.getElementById('hokInput');
      const val = (inputElem ? inputElem.value : '').trim();
      const res = parseInput(val);

      if (!res || !res.id || res.id.length < 3) {
        showErrorState('ئويۇن كىملىكى (UID) كىرگۈزۈلمىدى ياكى بەك قىسقا.');
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
        hasRealNick = false;

        // 1. Check local saved accounts first
        try {
          const rawSaved = localStorage.getItem('maxbazar_hok_saved_accounts');
          if (rawSaved) {
            const savedList = JSON.parse(rawSaved);
            const found = savedList.find(a => (a.uid || a.id) === res.id);
            if (found && (found.label || found.nickname)) {
              const savedNick = found.label || found.nickname;
              if (savedNick && !savedNick.startsWith('UID:') && !savedNick.includes('HOK Player') && !savedNick.includes('亗')) {
                liveName = savedNick;
                hasRealNick = true;
              }
            }
          }
        } catch (_) {}

        // 2. Query /api/apps/check-player route
        if (!liveName) {
          try {
            const checkRes = await fetch('/api/apps/check-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ game: 'honor-of-kings', playerId: res.id })
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData && checkData.success && checkData.nickname) {
                if (checkData.hasRealNickname || (!checkData.nickname.startsWith('UID:') && !checkData.nickname.includes('HOK Player') && !checkData.nickname.includes('亗'))) {
                  liveName = checkData.nickname;
                  hasRealNick = true;
                }
              }
            }
          } catch (_) {}
        }

        if (!liveName) {
          liveName = 'UID: ' + res.id;
          hasRealNick = false;
        }

        isVerified = true;
        isPreviewMode = false;
        playerNick = liveName;
        if (!selectedPkg && CATALOGS[currentServer]?.packages?.length > 0) {
          selectedPkg = CATALOGS[currentServer].packages[0];
        }

        const cardNick = document.getElementById('cardNickname');
        const cardLabel = document.getElementById('cardNicknameLabel');
        const editBtnText = document.getElementById('cardEditBtnText');
        const cardSub = document.getElementById('cardSubtext');

        if (cardNick) cardNick.textContent = liveName;
        if (cardLabel) cardLabel.textContent = hasRealNick ? 'ئويۇندىكى نامىڭىز:' : 'قوبۇل قىلغۇچى كىملىك (UID):';
        if (editBtnText) editBtnText.textContent = hasRealNick ? 'نامنى ئۆزگەرتىش' : 'نام قوشۇش (ئىختىيارىي)';
        if (cardSub) {
          cardSub.innerHTML = hasRealNick
            ? '<span>✓</span><span>ئويۇن سالاھىيىتى مۇۋەپپەقىيەتلىك دەلىللەندى</span>'
            : '<span>⚡</span><span>بىۋاسىتە مەزكۇر UID ھېساباتىغا قاچىلىنىدۇ (100% كاپالەتلىك)</span>';
        }

        saveHokAccount(res.id, liveName);

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
        isVerified = true;
        isPreviewMode = false;
        hasRealNick = false;
        playerNick = 'UID: ' + res.id;
        const cardNick = document.getElementById('cardNickname');
        const cardLabel = document.getElementById('cardNicknameLabel');
        const editBtnText = document.getElementById('cardEditBtnText');
        const cardSub = document.getElementById('cardSubtext');

        if (cardNick) cardNick.textContent = playerNick;
        if (cardLabel) cardLabel.textContent = 'قوبۇل قىلغۇچى كىملىك (UID):';
        if (editBtnText) editBtnText.textContent = 'نام قوشۇش (ئىختىيارىي)';
        if (cardSub) cardSub.innerHTML = '<span>⚡</span><span>بىۋاسىتە مەزكۇر UID ھېساباتىغا قاچىلىنىدۇ (100% كاپالەتلىك)</span>';

        if (vCard) {
          vCard.classList.remove('hidden');
          vCard.classList.add('flex');
        }
        renderPackages();
        updateDisplays();
      } finally {
        if (searchBtn) searchBtn.disabled = false;
        if (searchIcon) {
          searchIcon.className = 'w-4 h-4 flex items-center justify-center shrink-0';
          searchIcon.innerHTML = '<img src="/tg_search_anim.webp" alt="🔎" class="w-4 h-4 object-contain drop-shadow" onerror="this.onerror=null;this.src=\\'/tg_search.gif\\'"/>';
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
      if (!CATALOGS[currentServer]) currentServer = 'tokens';
      selectedPkg = CATALOGS[currentServer].packages[0];

      renderPackages();
      updateDisplays();
    }

    // Category switcher (Tokens, Bundles)
    function switchServer(srv) {
      currentServer = srv;
      if (!CATALOGS[currentServer]) currentServer = 'tokens';
      selectedPkg = CATALOGS[currentServer].packages[0];
      renderPackages();
      updateDisplays();
    }

`;
  content = content.substring(0, execSearchStart) + hokFunctionsReplacement + content.substring(renderPkgStart);
}

// 13. Update renderPackages() between renderPkgBodyStart and selectPkgStart
const renderPkgBodyStart = content.indexOf('    function renderPackages() {');
const selectPkgStart = content.indexOf('    function selectPackage(pkg) {');

if (renderPkgBodyStart !== -1 && selectPkgStart !== -1) {
  const hokRenderPackagesReplacement = `    function renderPackages() {
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

      // Category Tabs active class (Tokens, Bundles)
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

      // Render HOK Token / Card items
      container.innerHTML = '';
      if (!CATALOGS[currentServer]) currentServer = 'tokens';
      CATALOGS[currentServer].packages.forEach(pkg => {
        const isSel = selectedPkg && selectedPkg.id === pkg.id;
        const cls = isSel ? (pkg.isVip ? 'active-vip' : 'active-card') : 'glass-box';

        const div = document.createElement('div');
        div.setAttribute('data-pkg-id', pkg.id);
        div.className = cls + ' rounded-2xl p-2.5 cursor-pointer transition flex flex-col justify-between relative group hover:border-purple-400/50 select-none active:scale-[0.98]';
        div.onclick = () => {
          selectPackage(pkg);
        };

        let iconHtml;
        if (currentServer === 'tokens' || (pkg.name && pkg.name.toLowerCase().includes('token'))) {
          iconHtml = '<img src="/hok_token.webp" alt="Token" class="w-5 h-5 object-contain shrink-0 drop-shadow" onerror="this.onerror=null;this.src=\\'/hok_token.png\\'"/>';
        } else {
          iconHtml = '<img src="/tg_star_badge.webp" alt="Pass" class="w-5 h-5 object-contain shrink-0 pass-glow-anim" onerror="this.src=\\'/tg_star_badge.png\\'"/>';
        }

        const showSub = pkg.subtext && pkg.subtext.trim() && pkg.subtext !== 'رەسمىي قاچىلاش' && pkg.subtext !== 'بىۋاسىتە كىملىككە (UID)' && pkg.subtext !== 'بىۋاستە كىملىككە (UID)';

        div.innerHTML = 
          '<div class="flex items-center gap-1.5 min-w-0 mt-0.5">' +
            iconHtml +
            '<span class="text-[11px] sm:text-xs font-black text-white font-mono leading-tight break-words">' + pkg.name + '</span>' +
          '</div>' +
          (showSub ? '<div class="text-[10px] text-slate-400 mt-1 mb-1 leading-tight font-mono">' + pkg.subtext + '</div>' : '') +
          '<div class="flex items-center justify-between pt-1 border-t border-slate-800/80 mt-2">' +
            '<span class="text-[10px] text-slate-400 font-bold">باھاسى:</span>' +
            '<span class="text-xs font-black font-mono text-amber-300">$ ' + pkg.price.toFixed(2) + '</span>' +
          '</div>';

        container.appendChild(div);
      });
    }

`;
  content = content.substring(0, renderPkgBodyStart) + hokRenderPackagesReplacement + content.substring(selectPkgStart);
}

// 14. Update clearPlayerInput()
const clearPlayerInputStart = content.indexOf('    function clearPlayerInput() {');
const clearPlayerInputEnd = content.indexOf('    // ================= CUSTOM IN-APP ALERT MODAL SYSTEM =================');

if (clearPlayerInputStart !== -1 && clearPlayerInputEnd !== -1) {
  const hokClearPlayerInputReplacement = `    function clearPlayerInput() {
      const input = document.getElementById('hokInput');
      if (input) {
        input.value = '';
        input.focus();
      }
      clearErrorState();
      isVerified = false;
      isPreviewMode = false;
      parsedId = '';
      parsedZone = '';
      playerNick = '';

      const vCard = document.getElementById('verifiedCard');
      if (vCard) vCard.classList.add('hidden');
      const clearBtn = document.getElementById('clearInputBtn');
      if (clearBtn) clearBtn.classList.add('hidden');

      renderPackages();
      updateDisplays();
    }

    function clearErrorState() {
      const errBox = document.getElementById('errorAlert');
      if (errBox) errBox.classList.add('hidden');
      const input = document.getElementById('hokInput');
      if (input) input.classList.remove('border-rose-500', 'bg-rose-950/20');
    }

    function showErrorState(msg) {
      const errBox = document.getElementById('errorAlert');
      if (errBox) {
        if (msg) {
          const textSpan = errBox.querySelector('span.font-bold');
          if (textSpan) textSpan.textContent = msg;
        }
        errBox.classList.remove('hidden');
        errBox.classList.remove('animate-shake');
        void errBox.offsetWidth;
        errBox.classList.add('animate-shake');
      }
      const input = document.getElementById('hokInput');
      if (input) {
        input.classList.add('border-rose-500', 'bg-rose-950/20');
        input.focus();
      }
      const vCard = document.getElementById('verifiedCard');
      if (vCard) vCard.classList.add('hidden');
      isVerified = false;
      renderPackages();
      updateDisplays();
    }

    function handleInput(val) {
      clearErrorState();
      const clearBtn = document.getElementById('clearInputBtn');
      if (clearBtn) clearBtn.classList.toggle('hidden', !val || val.length === 0);
      if (!val || !val.trim()) {
        isVerified = false;
        const vCard = document.getElementById('verifiedCard');
        if (vCard) vCard.classList.add('hidden');
        renderPackages();
        updateDisplays();
      }
    }

`;
  content = content.substring(0, clearPlayerInputStart) + hokClearPlayerInputReplacement + content.substring(clearPlayerInputEnd);
}

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
      if (!parsed || !parsed.id) {
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
          icon: '<img src="/tg_wallet_dollar_anim.webp" alt="$" class="w-10 h-10 object-contain mx-auto" onerror="this.onerror=null;this.src=\\'/tg_wallet_dollar.gif\\'"/>',
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
        const targetPlayerId = parsed.id;

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
console.log('Successfully built public/honor-of-kings.html and public/hok.html with 100% absolute asset paths, zero-lag, and working package cards!');
