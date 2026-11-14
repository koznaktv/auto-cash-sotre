const fs = require('fs');
const path = require('path');

const mlbbHtmlPath = path.join(__dirname, '../public/mlbb.html');
const pubgHtmlPath = path.join(__dirname, '../public/pubg.html');
const pubgMobileHtmlPath = path.join(__dirname, '../public/pubg-mobile.html');

let content = fs.readFileSync(mlbbHtmlPath, 'utf8');

// 1. Update Title and Manifest
content = content.replace(
  '<title>AUTO CASH • Mobile Legends رەسمىي قاچىلاش (گىلوبال • تۈركىيە • فىلىپپىن)</title>',
  '<title>AUTO CASH • PUBG Mobile رەسمىي قاچىلاش (UC • Royale Pass • ۋاۋچېر)</title>'
);

// 2. Adapt 3-Tier Hero Section for PUBG Mobile (Zero Collision)
const mlbbTier0And1 = `        <!-- Tier 0: Quick App Switcher Header (Dedicated Row: 100% Zero Collision!) -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 relative z-10">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span class="text-[11px] font-bold text-slate-400 shrink-0">نۆۋەتتىكى ئويۇن:</span>
            <span class="text-xs font-black text-cyan-300 font-mono truncate">Mobile Legends</span>
          </div>
          <button onclick="openAppSwitcherModal()" type="button" class="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 hover:border-amber-300 text-amber-300 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm shadow-amber-950/40 cursor-pointer shrink-0">
            <span>✨</span>
            <span>باشقا ئەپلەرگە ئۆتۈش</span>
            <span class="text-[9px] text-amber-400 font-mono">▼</span>
          </button>
        </div>

        <!-- Tier 1: Full-Width Game Identity (Uncramped, Beautiful Title & Status Badge) -->
        <div class="flex items-center gap-2.5 relative z-10 w-full">
          <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-lg border-2 border-cyan-400/50 flex items-center justify-center shrink-0 bg-slate-950">
            <img src="https://play-lh.googleusercontent.com/MztmLpB1-_eFbHnqNzzvzl5zjiOH2BEb0D71uBxZYf_4BEmW3QEPWODhRtyqY7Qz4wRLwQ--Rg1RAjOFqtHSs-o=s256" alt="Mobile Legends: Bang Bang" class="w-full h-full object-cover" onerror="this.src='mlbb_icon.png'"/>
          </div>
          <div class="flex-1 text-right min-w-0">
            <h1 class="text-sm sm:text-base font-black text-white tracking-wide leading-tight truncate">
              Mobile Legends: Bang Bang
            </h1>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/30 whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>رەسمىي بىۋاسىتە قاچىلاش</span>
              </span>
            </div>
          </div>
        </div>`;

const pubgTier0And1 = `        <!-- Tier 0: Quick App Switcher Header (Dedicated Row: 100% Zero Collision!) -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 relative z-10">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span class="text-[11px] font-bold text-slate-400 shrink-0">نۆۋەتتىكى ئويۇن:</span>
            <span class="text-xs font-black text-amber-300 font-mono truncate">PUBG Mobile</span>
          </div>
          <button onclick="openAppSwitcherModal()" type="button" class="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 hover:border-amber-300 text-amber-300 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm shadow-amber-950/40 cursor-pointer shrink-0">
            <span>✨</span>
            <span>باشقا ئەپلەرگە ئۆتۈش</span>
            <span class="text-[9px] text-amber-400 font-mono">▼</span>
          </button>
        </div>

        <!-- Tier 1: Full-Width Game Identity (Uncramped, Beautiful Title & Status Badge) -->
        <div class="flex items-center gap-2.5 relative z-10 w-full">
          <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
            <img src="/images/apps/pubg/icon-192.png" alt="PUBG Mobile" class="w-full h-full object-cover rounded-xl" onerror="this.src='https://play-lh.googleusercontent.com/j1_81w71x9m9mN6L4Ld4b7Z2C4Yj9G_8x_N7'"/>
          </div>
          <div class="flex-1 text-right min-w-0">
            <h1 class="text-sm sm:text-base font-black text-white tracking-wide leading-tight truncate flex items-center gap-1.5">
              <span>PUBG Mobile</span>
              <span class="text-[10.5px] text-amber-300 font-normal font-sans">(پابجى كۆچمە نۇسخىسى)</span>
            </h1>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/30 whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>رەسمىي بىۋاسىتە قاچىلاش (UC)</span>
              </span>
            </div>
          </div>
        </div>`;

content = content.replace(mlbbTier0And1, pubgTier0And1);

// 3. Step 1: Replace ID & Zone input with Single PUBG UID (Player ID)
const mlbbStep1Old = `      <!-- ================= 1-قەدەم (STEP 1): ئالدى بىلەن ID كىرگۈزۈش ۋە سېرۋېر دەلىللەش ================= -->
      <div class="glass-box rounded-2xl p-3 sm:p-3.5 border border-cyan-500/30 space-y-3 relative overflow-hidden bg-gradient-to-b from-[#0b1222] to-[#070b14] shadow-xl">
        <!-- Ambient decorative cyber glow -->
        <div class="absolute -right-8 -top-8 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="flex items-center justify-between relative z-10">
          <label class="text-xs font-black text-white flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-cyan-500/40 shrink-0">1</span>
            <span class="text-sm font-black text-white tracking-wide">ئالدى بىلەن ئويۇن ID سى ۋە سېرۋېرىنى كىرگۈزۈڭ</span>
          </label>
          <span class="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-mono shadow-sm flex items-center gap-1">
            <span>سېرۋېر</span>
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>ئېنىقلاش</span>
          </span>
        </div>

        <p class="text-[11.5px] text-slate-300 leading-relaxed relative z-10">
          MLBB دا باھا ھەر قايسى سېرۋېرغا قاراپ پەرقلىنىدۇ. ئايدىڭىز جەزملەنگەندىن كېيىن شۇ سېرۋېرنىڭ AUTO CASH تىكى 100% توغرا باھاسى كۆرۈنىدۇ.
        </p>

        <!-- Modern Unified Input Container with Integrated Clear Button -->
        <div class="relative z-10">
          <div class="relative flex items-center">
            <input 
              id="mlbbInput"
              type="text" 
              inputmode="numeric"
              placeholder="مەسىلەن : 1718491609 (4485)..."
              dir="ltr"
              oninput="handleInput(this.value)"
              onkeydown="if(event.key === 'Enter') executeSearch();"
              autocomplete="off"
              spellcheck="false"
              class="w-full bg-[#0a101f] border border-cyan-500/40 focus:border-cyan-400 rounded-2xl py-3 pl-3 pr-10 text-white placeholder-slate-500 text-xs sm:text-sm font-mono tracking-wider focus:outline-none transition shadow-inner"
            />
            <!-- Unified Integrated Clear Button inside Input -->
            <button 
              type="button" 
              onclick="clearPlayerInput()" 
              class="absolute right-2.5 w-6 h-6 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition active:scale-90 cursor-pointer"
              title="تازىلاش"
            >
              ✕
            </button>
          </div>
          <p id="inputErrorMsg" class="hidden text-[11px] text-rose-400 font-bold mt-1 text-right flex items-center justify-end gap-1">
            <span>ئويۇن ID ۋە رايون كودىنى توغرا كىرگۈزۈڭ (مەسىلەن: 1718491609 4485)</span>
            <span class="text-xs">⚠️</span>
          </p>
        </div>

        <!-- Action Button -->
        <div class="flex items-center gap-2 pt-0.5 relative z-10">
          <button 
            id="searchBtn"
            type="button"
            onclick="executeSearch()"
            class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs transition active:scale-[0.98] shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span id="checkSpinner" class="hidden w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>
            <span>تېزدە تەكشۈرۈش</span>
          </button>
        </div>

        <!-- Verified Player Card (Shown dynamically after verification) -->
        <div id="verifiedCard" class="hidden glass-box rounded-xl p-2.5 border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between text-xs space-y-1 relative z-10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-sm font-bold text-emerald-300 font-mono">
              ✓
            </div>
            <div>
              <p class="font-bold text-white flex items-center gap-1">
                <span id="cardNickname">Player</span>
                <span class="text-[9.5px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold border border-emerald-500/30">تەستىقلاندى</span>
              </p>
              <p class="text-[11px] text-slate-400 font-mono mt-0.5">
                <span id="cardFlag">🌐</span> <span id="cardServerName">گىلوبال</span>
              </p>
            </div>
          </div>
          <div class="text-left font-mono text-xs bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span class="text-slate-400">ID: </span><span id="cardUserId" class="text-cyan-300 font-bold">1798505443</span><br>
            <span class="text-slate-400">Zone: </span><span id="cardZoneId" class="text-amber-400 font-bold">4503</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
          <span class="text-slate-400">قاچىلاش يولى:</span>
          <span class="text-cyan-300 font-mono font-bold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>رەسمىي بىۋاسىتە قاچىلاش (100% يېتىدۇ)</span>
          </span>
        </div>
      </div>`;

const pubgStep1Replacement = `      <!-- ================= 1-قەدەم (STEP 1): ئالدى بىلەن كىملىك (UID) كىرگۈزۈش ۋە دەلىللەش ================= -->
      <div class="glass-box rounded-2xl p-3 sm:p-3.5 border border-cyan-500/30 space-y-3 relative overflow-hidden bg-gradient-to-b from-[#0b1222] to-[#070b14] shadow-xl">
        <!-- Ambient decorative cyber glow -->
        <div class="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="flex items-center justify-between relative z-10">
          <label class="text-xs font-black text-white flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-amber-500/40 shrink-0">1</span>
            <span class="text-sm font-black text-white tracking-wide">ئالدى بىلەن ئويۇن كىملىكى (Player ID) كىرگۈزۈڭ</span>
          </label>
          <span class="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-mono shadow-sm flex items-center gap-1">
            <span>PUBG UID</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>تەكشۈرۈش</span>
          </span>
        </div>

        <p class="text-[11.5px] text-slate-300 leading-relaxed relative z-10">
          PUBG Mobile ئىچىدىكى 8 تىن 11 خانىغىچە نۇمۇرلۇق ئويۇن كىملىكىڭىز (UID) نى كىرگۈزۈپ «تېزدە تەكشۈرۈش» نى بېسىڭ.
        </p>

        <!-- Modern Unified Input Container with Integrated Clear Button -->
        <div class="relative z-10">
          <div class="relative flex items-center">
            <input 
              id="pubgInput"
              type="text" 
              inputmode="numeric"
              placeholder="مەسىلەن : 5123456789 (ئويۇن كىملىكى UID)..."
              dir="ltr"
              oninput="handleInput(this.value)"
              onkeydown="if(event.key === 'Enter') executeSearch();"
              autocomplete="off"
              spellcheck="false"
              class="w-full bg-[#0a101f] border border-cyan-500/40 focus:border-amber-400 rounded-2xl py-3 pl-3 pr-10 text-white placeholder-slate-500 text-xs sm:text-sm font-mono tracking-wider focus:outline-none transition shadow-inner"
            />
            <!-- Unified Integrated Clear Button inside Input -->
            <button 
              type="button" 
              onclick="clearPlayerInput()" 
              class="absolute right-2.5 w-6 h-6 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition active:scale-90 cursor-pointer"
              title="تازىلاش"
            >
              ✕
            </button>
          </div>
          <p id="inputErrorMsg" class="hidden text-[11px] text-rose-400 font-bold mt-1 text-right flex items-center justify-end gap-1">
            <span>ئويۇن كىملىكى (UID) نى توغرا كىرگۈزۈڭ (مەسىلەن: 5123456789)</span>
            <span class="text-xs">⚠️</span>
          </p>
        </div>

        <!-- Action Button -->
        <div class="flex items-center gap-2 pt-0.5 relative z-10">
          <button 
            id="searchBtn"
            type="button"
            onclick="executeSearch()"
            class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition active:scale-[0.98] shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span id="checkSpinner" class="hidden w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>
            <span>تېزدە تەكشۈرۈش</span>
          </button>
        </div>

        <!-- Verified Player Card (Shown dynamically after verification) -->
        <div id="verifiedCard" class="hidden glass-box rounded-xl p-2.5 border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between text-xs space-y-1 relative z-10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-sm font-bold text-emerald-300 font-mono">
              ✓
            </div>
            <div>
              <p class="font-bold text-white flex items-center gap-1">
                <span id="cardNickname">PUBG Player</span>
                <span class="text-[9.5px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold border border-emerald-500/30">تەستىقلاندى</span>
              </p>
              <p class="text-[11px] text-slate-400 font-mono mt-0.5">
                <span>🌐</span> <span id="cardServerName">Global (PUBG Mobile)</span>
              </p>
            </div>
          </div>
          <div class="text-left font-mono text-xs bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span class="text-slate-400">UID: </span><span id="cardUserId" class="text-amber-300 font-bold">5123456789</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
          <span class="text-slate-400">قاچىلاش ئۇسۇلى:</span>
          <span class="text-amber-300 font-mono font-bold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>بىۋاسىتە كىملىككە (UID) سېكۇنتتا يېتىدۇ</span>
          </span>
        </div>
      </div>`;

content = content.replace(mlbbStep1Old, pubgStep1Replacement);

// 4. Step 2: Replace Server Tabs with PUBG Category Tabs (Direct UC, Royale Pass, Vouchers)
const mlbbStep2TabsOld = `        <!-- 3 Server Tabs (گىلوبال ، تۈركىيە، فىلىپپىن) -->
        <div id="serverTabs" class="grid grid-cols-3 gap-1.5 bg-[#0a101f] p-1.5 rounded-2xl border border-slate-800 text-xs shadow-lg">
          <button id="tabGlobal" onclick="switchServer('global')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1.5">
            <span>🌐</span><span>گىلوبال</span>
          </button>
          <button id="tabTurkey" onclick="switchServer('turkey')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1.5">
            <span>🇹🇷</span><span>تۈركىيە</span>
          </button>
          <button id="tabSpecial" onclick="switchServer('special')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1.5">
            <span>🇵🇭</span><span>فىلىپپىن</span>
          </button>
        </div>`;

const pubgStep2TabsReplacement = `        <!-- 3 PUBG Category Tabs (بىۋاسىتە UC, Royale Pass & كارتىلار, UC كود PIN) -->
        <div id="serverTabs" class="grid grid-cols-3 gap-1.5 bg-[#0a101f] p-1.5 rounded-2xl border border-slate-800 text-xs shadow-lg">
          <button id="tabDirect" onclick="switchServer('direct')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1 cursor-pointer">
            <span>🔥</span><span>بىۋاسىتە UC</span>
          </button>
          <button id="tabPass" onclick="switchServer('pass')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1 cursor-pointer">
            <span>👑</span><span>Royale Pass</span>
          </button>
          <button id="tabVoucher" onclick="switchServer('voucher')" class="py-2 px-1 rounded-xl font-bold transition text-center flex items-center justify-center gap-1 cursor-pointer">
            <span>🎟️</span><span>UC كود (PIN)</span>
          </button>
        </div>`;

content = content.replace(mlbbStep2TabsOld, pubgStep2TabsReplacement);

// 5. Update Step 2 Label
content = content.replace(
  '<span class="text-sm font-black text-white tracking-wide">ئالماس بوغچىسىنى تاللاڭ</span>',
  '<span class="text-sm font-black text-white tracking-wide">UC ياكى كارتىلارنى تاللاڭ</span>'
);

// 6. Update step 2 locked box text
content = content.replace('خاتا سېرۋېرغا پۇل سېلىۋېلىشتىن ساقلىنىش ئۈچۈن، 1-قەدەمدىن ID ۋە رايون كودى كىرگۈزۈلگەندە سىستېما باھالارنى تولۇق ئاچىدۇ.',
                          'خاتا كىملىككە پۇل سېلىۋېلىشتىن ساقلىنىش ئۈچۈن، 1-قەدەمدىن PUBG UID كىرگۈزۈلگەندە سىستېما باھالارنى تولۇق ئاچىدۇ.');

// 7. Update bottom button & receipt texts for PUBG
content = content.replace("MLBB ئالماس", "PUBG UC");
content = content.replace("Mobile Legends", "PUBG Mobile");

// 8. Update App Switcher Modal active item (Mark PUBG as active, MLBB as switchable)
const oldModalApp1 = `          <!-- App 1: Mobile Legends: Bang Bang -->
          <a href="mlbb.html" class="glass-box rounded-2xl p-3 border border-cyan-500/50 bg-gradient-to-r from-blue-950/60 via-slate-900/90 to-[#0e192e] flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block relative overflow-hidden">
            <span class="absolute top-0 right-0 w-2 h-full bg-cyan-400"></span>
            <div class="flex items-center gap-2.5 min-w-0 pr-1">
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
              <span class="px-2.5 py-1 rounded-xl bg-cyan-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm">
                <span>نۆۋەتتىكى</span>
                <span class="font-mono">✓</span>
              </span>
            </div>
          </a>

          <!-- App 2: PUBG Mobile -->
          <a href="pubg.html" class="glass-box rounded-2xl p-3 border border-amber-500/30 hover:border-amber-400 bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-[#1e1708]/60 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-amber-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
                <img src="/images/apps/pubg/icon-192.png" alt="PUBG Mobile" class="w-full h-full object-cover rounded-xl" onerror="this.src='https://play-lh.googleusercontent.com/j1_81w71x9m9mN6L4Ld4b7Z2C4Yj9G_8x_N7'"/>
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
          </a>`;

const pubgModalApp1 = `          <!-- App 1: Mobile Legends: Bang Bang -->
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
          <a href="pubg.html" class="glass-box rounded-2xl p-3 border border-amber-500/50 bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-[#1e1708]/80 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block relative overflow-hidden">
            <span class="absolute top-0 right-0 w-2 h-full bg-amber-400"></span>
            <div class="flex items-center gap-2.5 min-w-0 pr-1">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-amber-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-0.5">
                <img src="/images/apps/pubg/icon-192.png" alt="PUBG Mobile" class="w-full h-full object-cover rounded-xl" onerror="this.src='https://play-lh.googleusercontent.com/j1_81w71x9m9mN6L4Ld4b7Z2C4Yj9G_8x_N7'"/>
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
              <span class="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm">
                <span>نۆۋەتتىكى</span>
                <span class="font-mono">✓</span>
              </span>
            </div>
          </a>`;

content = content.replace(oldModalApp1, pubgModalApp1);

// 9. Update JavaScript Logic: Replace CATALOGS
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
          { id: 60, name: '60 PUBG UC', subtext: 'بىۋاسىتە كىملىككە (UID)', price: 1.07, isVip: true },
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
          { id: 343, name: 'Royale Pass Elite (LV 1-50)', subtext: 'رەسمىي RP پاس كارتىسى', price: 5.95, isVip: true },
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
          { id: 444, name: '60 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', price: 1.07, isVip: false },
          { id: 445, name: '660 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', price: 10.30, isVip: true },
          { id: 446, name: '1800 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', price: 25.30, isVip: false },
          { id: 447, name: '3850 UC كود (PIN)', subtext: 'رەسمىي ئېلېكترونلۇق ۋاۋچېر', price: 50.50, isVip: false },
        ]
      }
    };`;

content = content.replace(oldCatalogsLogic, pubgCatalogsReplacement);

// 10. Update loadDynamicCatalog()
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

// 11. Update state variables: currentServer defaults to 'direct'
content = content.replace("let currentServer = 'global';", "let currentServer = 'direct';");
content = content.replace("let selectedPkg = CATALOGS.global.packages[0];", "let selectedPkg = CATALOGS.direct.packages[0];");

// 12. Update parseInput: In PUBG, only numeric UID (8-16 digits) is required, no Zone ID!
const oldParseInput = `    function parseInput(val) {
      if (!val) return null;
      let clean = val.replace(/\\s+/g, ' ').trim();
      let match = clean.match(/^(\\d{5,14})\\s*[\\(\\[\\{]?\\s*(\\d{3,6})\\s*[\\)\\]\\}]?$/);
      if (match) {
        return { id: match[1], zone: match[2] };
      }
      let parts = clean.split(/[^0-9]+/).filter(Boolean);
      if (parts.length >= 2) {
        return { id: parts[0], zone: parts[1] };
      }
      return null;
    }`;

const pubgParseInput = `    function parseInput(val) {
      if (!val) return null;
      let clean = val.replace(/[^0-9]/g, '').trim();
      if (clean.length >= 6 && clean.length <= 16) {
        return { id: clean, zone: '' };
      }
      return null;
    }`;

content = content.replace(oldParseInput, pubgParseInput);

// 13. Update executeSearch: call check-player with game: 'pubg-mobile'
const oldExecuteSearch = `    async function executeSearch() {
      clearErrorState();
      const val = document.getElementById('mlbbInput').value.trim();
      const res = parseInput(val);

      if (!res || !res.id || !res.zone || res.id.length < 5 || res.zone.length < 3) {
        showErrorState();
        return;
      }

      const searchBtn = document.getElementById('searchBtn');
      const spinner = document.getElementById('checkSpinner');
      searchBtn.disabled = true;
      spinner.classList.remove('hidden');

      try {
        const response = await fetch('/api/apps/check-player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game: 'mobile-legends',
            playerId: res.id,
            zoneId: res.zone
          })
        });

        const data = await response.json();

        if (!data || !data.success || !data.verified) {
          showErrorState();
          return;
        }

        // Successfully verified player
        isVerified = true;
        verifiedPlayer = {
          nickname: data.nickname || 'Unknown Hero',
          playerId: res.id,
          zoneId: res.zone,
          server: data.server || 'Global'
        };

        // Auto-detect server region from response
        const s = (data.server || '').toLowerCase();
        if (s.includes('turk') || s.includes('تۈركىيە') || s.includes('tr')) {
          detectedServer = 'turkey';
        } else if (s.includes('phil') || s.includes('فىلىپپىن') || s.includes('ph') || s.includes('special')) {
          detectedServer = 'special';
        } else {
          detectedServer = 'global';
        }

        currentServer = detectedServer;
        isPreviewMode = false;

        // Populate verified player card
        document.getElementById('cardNickname').textContent = verifiedPlayer.nickname;
        document.getElementById('cardUserId').textContent = verifiedPlayer.playerId;
        document.getElementById('cardZoneId').textContent = verifiedPlayer.zoneId;
        selectedPkg = CATALOGS[currentServer].packages[0];

        document.getElementById('cardFlag').textContent = CATALOGS[currentServer].flag;
        document.getElementById('cardServerName').textContent = CATALOGS[currentServer].serverTitle + ' سېرۋېرى';

        const vCard = document.getElementById('verifiedCard');
        vCard.classList.remove('hidden');
        vCard.classList.add('flex');

        // Render diamond packages and unlock
        renderPackages();
        updateDisplays();

      } catch (err) {
        console.error('Check player error:', err);
        showErrorState();
      } finally {
        searchBtn.disabled = false;
        spinner.classList.add('hidden');
      }
    }`;

const pubgExecuteSearch = `    async function executeSearch() {
      clearErrorState();
      const inputElem = document.getElementById('pubgInput');
      const val = inputElem ? inputElem.value.trim() : '';
      const res = parseInput(val);

      if (!res || !res.id || res.id.length < 6) {
        showErrorState();
        return;
      }

      const searchBtn = document.getElementById('searchBtn');
      const spinner = document.getElementById('checkSpinner');
      if (searchBtn) searchBtn.disabled = true;
      if (spinner) spinner.classList.remove('hidden');

      try {
        const response = await fetch('/api/apps/check-player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game: 'pubg-mobile',
            playerId: res.id
          })
        });

        const data = await response.json();

        if (!data || !data.success) {
          showErrorState();
          return;
        }

        // Successfully verified player
        isVerified = true;
        verifiedPlayer = {
          nickname: data.nickname || ('PUBG Player #' + res.id.slice(-4)),
          playerId: res.id,
          server: data.server || 'Global (PUBG Mobile)'
        };

        isPreviewMode = false;

        // Populate verified player card
        const cardNick = document.getElementById('cardNickname');
        if (cardNick) cardNick.textContent = verifiedPlayer.nickname;
        const cardUser = document.getElementById('cardUserId');
        if (cardUser) cardUser.textContent = verifiedPlayer.playerId;

        const vCard = document.getElementById('verifiedCard');
        if (vCard) {
          vCard.classList.remove('hidden');
          vCard.classList.add('flex');
        }

        // Render packages and unlock
        renderPackages();
        updateDisplays();

      } catch (err) {
        console.error('Check player error:', err);
        showErrorState();
      } finally {
        if (searchBtn) searchBtn.disabled = false;
        if (spinner) spinner.classList.add('hidden');
      }
    }`;

content = content.replace(oldExecuteSearch, pubgExecuteSearch);

// 14. Update switchServer for PUBG tabs ['direct', 'pass', 'voucher']
const oldSwitchServer = `    function switchServer(srv) {
      if (isVerified && detectedServer && srv !== detectedServer) {
        showAppModal({
          title: 'سېرۋېر قۇلۇپلانغان',
          message: 'سىز كىرگۈزگەن كىملىك «' + (CATALOGS[detectedServer]?.flag || '') + ' ' + (CATALOGS[detectedServer]?.serverTitle || '') + '» سېرۋېرىغا تەۋە بولغانلىقى ئۈچۈن، خاتا باھادا سېتىۋېلىشتىن مۇداپىئەلىنىش مەقسىتىدە باشقا سېرۋېر باھالىرى قۇلۇپلاندى.',
          icon: '🔒',
          confirmText: 'چۈشەندىم'
        });
        return;
      }

      currentServer = srv;
      if (!CATALOGS[currentServer]) currentServer = 'global';
      selectedPkg = CATALOGS[currentServer].packages[0];
      renderPackages();
      updateDisplays();
    }`;

const pubgSwitchServer = `    function switchServer(srv) {
      currentServer = srv;
      if (!CATALOGS[currentServer]) currentServer = 'direct';
      selectedPkg = CATALOGS[currentServer].packages[0];
      renderPackages();
      updateDisplays();
    }`;

content = content.replace(oldSwitchServer, pubgSwitchServer);

// 15. Update renderPackages tabs logic for ['direct', 'pass', 'voucher']
const oldTabsLoop = `      // Tabs active and locked class
      ['global', 'turkey', 'special'].forEach(s => {
        const btn = document.getElementById('tab' + s.charAt(0).toUpperCase() + s.slice(1));
        if (!btn) return;
        const sTitle = CATALOGS[s].serverTitle;
        const sFlag = CATALOGS[s].flag;

        if (s === currentServer) {
          btn.className = 'py-2 px-1 rounded-xl font-black transition-all text-center bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-300 flex items-center justify-center gap-1.5 scale-[1.02] cursor-pointer';
          btn.innerHTML = '<span>' + sFlag + '</span><span>' + sTitle + '</span>' + (isVerified ? '<span class=\"text-[8.5px] bg-emerald-400 text-slate-950 px-1 py-0.5 rounded font-black font-mono\">تەستىقلاندى</span>' : '<span class=\"w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping\"></span>');
          btn.title = '';
        } else {
          if (isVerified && detectedServer && s !== detectedServer) {
            btn.className = 'py-2 px-1 rounded-xl font-bold transition text-center text-slate-500 bg-slate-950/70 border border-slate-800/80 cursor-not-allowed opacity-40 flex items-center justify-center gap-1.5';
            btn.innerHTML = '<span>🔒</span><span class=\"line-through opacity-70\">' + sTitle + '</span>';
            btn.title = 'خاتا سېتىۋېلىشتىن مۇداپىئەلىنىش ئۈچۈن قۇلۇپلاندى';
          } else {
            btn.className = 'py-2 px-1 rounded-xl font-bold transition text-center text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent cursor-pointer flex items-center justify-center gap-1.5';
            btn.innerHTML = '<span>' + sFlag + '</span><span>' + sTitle + '</span>';
            btn.title = '';
          }
        }
      });`;

const pubgTabsLoop = `      // Category Tabs active class
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
      });`;

content = content.replace(oldTabsLoop, pubgTabsLoop);

// 16. Update coin icon in renderPackages: 🪙 for UC, 👑 for Royale Pass, 🎟️ for voucher
content = content.replace(
  "'<span class=\"' + (pkg.isVip ? 'mythic-crown-anim text-sm' : 'mlbb-gem-anim text-sm') + '\">' + (pkg.isVip ? '👑' : '💎') + '</span>' +",
  "'<span class=\"' + (pkg.isVip ? 'mythic-crown-anim text-sm' : 'mlbb-gem-anim text-sm') + '\">' + (currentServer === 'pass' ? '👑' : (currentServer === 'voucher' ? '🎟️' : '🪙')) + '</span>' +"
);

// 17. Update input references: mlbbInput -> pubgInput
content = content.replace(/mlbbInput/g, 'pubgInput');

// 18. Update executeTopup: send app_id: 'pubg'
const oldExecuteTopupPayload = `        const payload = {
          telegram_user_id: user ? user.id : 0,
          telegram_username: user ? user.username : '',
          first_name: user ? user.first_name : '',
          app_id: 'mobile-legends',
          service_name: 'Mobile Legends ' + selectedPkg.name,
          player_id: verifiedPlayer.playerId,
          zone_id: verifiedPlayer.zoneId,
          package_id: selectedPkg.id,
          unit_price: selectedPkg.price,
          total_price: selectedPkg.price,
          currency: 'USD',
          server: CATALOGS[currentServer].flag + ' ' + CATALOGS[currentServer].serverTitle
        };`;

const pubgExecuteTopupPayload = `        const payload = {
          telegram_user_id: user ? user.id : 0,
          telegram_username: user ? user.username : '',
          first_name: user ? user.first_name : '',
          app_id: 'pubg',
          service_name: 'PUBG Mobile ' + selectedPkg.name,
          player_id: verifiedPlayer.playerId,
          zone_id: '',
          package_id: selectedPkg.id,
          unit_price: selectedPkg.price,
          total_price: selectedPkg.price,
          currency: 'USD',
          server: 'Global (PUBG Mobile)'
        };`;

content = content.replace(oldExecuteTopupPayload, pubgExecuteTopupPayload);

// 19. Update clearPlayerInput
const oldClearPlayerInput = `    function clearPlayerInput() {
      const input = document.getElementById('mlbbInput');
      input.value = '';
      clearErrorState();
      isVerified = false;
      detectedServer = null;
      verifiedPlayer = null;
      isPreviewMode = true;

      // Hide verification success result
      var vCard = document.getElementById('verifiedCard');
      if (vCard) {
        vCard.classList.add('hidden');
        vCard.classList.remove('flex');
      }
      
      // Update UI state and packages
      renderPackages();
      updateDisplays();

      input.focus();
    }`;

const pubgClearPlayerInput = `    function clearPlayerInput() {
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
    }`;

content = content.replace(oldClearPlayerInput, pubgClearPlayerInput);

// Write to pubg.html and pubg-mobile.html
fs.writeFileSync(pubgHtmlPath, content, 'utf8');
fs.writeFileSync(pubgMobileHtmlPath, content, 'utf8');
console.log('Successfully generated public/pubg.html and public/pubg-mobile.html with App Switcher Modal!');
