const fs = require('fs');
const path = require('path');

const mlbbHtmlPath = path.join(__dirname, '../public/mlbb.html');
const numbersHtmlPath = path.join(__dirname, '../public/numbers.html');
const smsHtmlPath = path.join(__dirname, '../public/sms.html');

console.log('Reading mlbb.html foundation...');
const mlbbHtml = fs.readFileSync(mlbbHtmlPath, 'utf8');

// Build the complete standalone Virtual Numbers Micro-App
// It inherits the identical styling, Multi-Auth, Sham Cash Deposit Modal, VIP Dollar Wallet, and Mobile App Shell.

const numbersHtml = `<!DOCTYPE html>
<html lang="ug" dir="rtl" class="dark">
<head>
  <base href="/">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>AUTO CASH • مەۋھۇم نومۇرلار (Virtual SMS Verification • تېلېگرام • ۋاتساپ • ChatGPT)</title>
  
  <!-- Telegram WebApp SDK -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>

  <!-- Tailwind CSS & Inter Font -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#ecfdf5',
              100: '#d1fae5',
              400: '#34d399',
              500: '#10b981',
              600: '#059669',
              900: '#064e3b',
            }
          },
          animation: {
            'spin-slow': 'spin 8s linear infinite',
            'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }
        }
      }
    }
  </script>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "UKIJ Tuz Tom", "Alpida", Tahoma, sans-serif;
      background-color: #050811;
      color: #f8fafc;
      overflow-x: hidden;
      touch-action: manipulation;
    }

    input, textarea {
      user-select: text;
    }

    /* Modern Glassmorphic Cyber Box */
    .glass-box {
      background: rgba(13, 21, 39, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    
    .glass-box:hover {
      border-color: rgba(16, 185, 129, 0.4);
    }

    .glass-card-active {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.4) 100%);
      border: 2px solid #10b981 !important;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    ::-webkit-scrollbar-track {
      background: #050811;
    }
    ::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #10b981;
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Pulse Glow */
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
      50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.8); }
    }
    .pulse-glow {
      animation: pulseGlow 2s infinite;
    }
  </style>
</head>
<body class="min-h-screen bg-[#050811] text-slate-100 flex justify-center pb-24">

  <!-- ================= MOBILE APP SHELL (Native App View) ================= -->
  <div class="w-full max-w-md min-h-screen bg-[#070b16] flex flex-col relative shadow-2xl border-x border-slate-900/60 pb-16">

    <!-- ================= GAME / APP HERO BANNER ================= -->
    <div class="p-3.5 space-y-3 relative overflow-hidden bg-gradient-to-b from-[#0b1928] via-[#081220] to-[#070b16] border-b border-emerald-500/20">
      
      <!-- Tier 0: Quick App Switcher Header -->
      <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 relative z-10">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span class="text-[11px] font-bold text-slate-400 shrink-0">نۆۋەتتىكى ئەپ:</span>
          <span class="text-xs font-black text-emerald-300 font-mono truncate">📱 مەۋھۇم نومۇرلار (SMS)</span>
        </div>
        <button onclick="openAppSwitcherModal()" type="button" class="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/50 hover:border-emerald-300 text-emerald-300 text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm shadow-emerald-950/40 cursor-pointer shrink-0">
          <span class="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
            <span class="absolute inset-0 rounded-md bg-emerald-400/40 blur-[2px] animate-pulse"></span>
            <svg class="w-3.5 h-3.5 text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/>
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" opacity="0.85"/>
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" opacity="0.85"/>
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/>
            </svg>
          </span>
          <span>باشقا ئەپلەرگە ئۆتۈش</span>
          <span class="text-[9px] text-emerald-400 font-mono">▼</span>
        </button>
      </div>

      <!-- Tier 1: Full-Width App Identity -->
      <div class="flex items-center gap-2.5 relative z-10 w-full">
        <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-1 text-2xl">
          <span>📱</span>
        </div>
        <div class="flex-1 text-right min-w-0">
          <h1 class="text-sm sm:text-base font-black text-white tracking-wide leading-tight truncate">
            مەۋھۇم نومۇرلار مەركىزى (Virtual SMS)
          </h1>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="text-[10px] text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/30 whitespace-nowrap">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>200+ دۆلەت • سېكۇنتتا كود قوبۇللاش • 100% كاپالەت</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Tier 2: VIP Dollar Wallet Bar -->
      <div class="relative z-10 w-full rounded-2xl p-2.5 bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-amber-500/10 border border-amber-500/40 shadow-lg flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 text-sm shadow-inner shrink-0">
            💵
          </div>
          <div class="text-right leading-tight min-w-0">
            <p class="text-[10px] text-amber-300/80 font-bold flex items-center gap-1">
              <span>ھەميان قالدۇقىڭىز</span>
              <span id="userStatusTag" class="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-normal">مېھمان</span>
            </p>
            <p id="walletBalanceText" class="text-xs sm:text-sm font-black text-amber-300 font-mono tracking-tight truncate">
              $0.00
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="openDepositModal()" type="button" class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-[11px] font-black inline-flex items-center gap-1 shadow-md shadow-amber-500/30 active:scale-95 transition cursor-pointer">
            <span>+ پۇل قاچىلاش</span>
          </button>
          <button id="authBtn" onclick="handleAuthClick()" type="button" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold border border-slate-700 transition active:scale-95 cursor-pointer">
            كىرىش
          </button>
        </div>
      </div>

    </div>

    <!-- ================= MAIN SCROLLABLE CONTENT ================= -->
    <div class="p-3 space-y-3.5 flex-1">

      <!-- ================= ACTIVE LIVE SMS SESSION CARD (If user has waiting or active number) ================= -->
      <div id="activeSessionCard" class="hidden glass-box rounded-2xl p-4 border-2 border-emerald-400/80 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-[#061e16] space-y-3 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between border-b border-emerald-500/20 pb-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="text-xs font-black text-emerald-300">ئاكتىپ مەۋھۇم نومۇر (SMS كۈتۈلۈۋاتىدۇ)</span>
          </div>
          <span id="sessionTimerBadge" class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
            ⏳ 14:59
          </span>
        </div>

        <!-- Phone display with 1-click copy -->
        <div class="bg-slate-950/80 rounded-xl p-3 border border-emerald-500/30 flex items-center justify-between gap-2">
          <div class="text-right">
            <p id="sessionServiceInfo" class="text-[11px] text-slate-400">✈️ Telegram • 🇺🇦 ئۇكرائىنا</p>
            <p id="sessionPhoneNumber" class="text-base sm:text-lg font-black text-white font-mono tracking-wider mt-0.5">+380XXXXXXXXX</p>
          </div>
          <button onclick="copySessionPhone()" type="button" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1 shadow-md shadow-emerald-500/30 cursor-pointer">
            <span>📋</span>
            <span>كۆچۈرۈش</span>
          </button>
        </div>

        <p class="text-xs text-slate-400 leading-snug">
          💡 <b>مەزكۇر نومۇرنى كۆچۈرۈپ</b> ئەپكە كىرگۈزۈڭ. كود كەلگەن ھامان ئاستىدىكى يېشىل رامكىغا دەرھال چىقىدۇ:
        </p>

        <!-- Big OTP Code Box -->
        <div id="otpDisplayBox" class="bg-slate-950 rounded-2xl p-4 border border-dashed border-emerald-500/40 flex flex-col items-center justify-center text-center space-y-2">
          <div id="otpWaitingIndicator" class="flex flex-col items-center gap-1.5">
            <div class="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin"></div>
            <p class="text-xs font-bold text-emerald-300 animate-pulse">SMS كود كۈتۈلۈۋاتىدۇ... (ھەر 3 سېكۇنتتا تەكشۈرۈلىدۇ)</p>
          </div>

          <div id="otpResultWrap" class="hidden flex-col items-center gap-2 w-full">
            <span class="text-xs text-slate-400 font-bold">كەلگەن SMS كودى:</span>
            <div id="otpCodeDigits" class="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-widest bg-emerald-950/40 px-6 py-2 rounded-2xl border border-emerald-500/60 shadow-lg shadow-emerald-500/20">
              ------
            </div>
            <button onclick="copySmsCode()" type="button" class="mt-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer">
              <span>📋</span>
              <span>كودنى كۆچۈرۈش</span>
            </button>
          </div>
        </div>

        <!-- Cancel button with automatic refund -->
        <button id="cancelSessionBtn" onclick="cancelCurrentSession()" type="button" class="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
          <span>❌</span>
          <span>بىكار قىلىش (پۇلنى دەرھال قايتۇرۇش)</span>
        </button>
      </div>

      <!-- ================= 1-قەدەم (STEP 1): ئەپ تاللاش ================= -->
      <div class="glass-box rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-black text-white flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-emerald-500/40 shrink-0">1</span>
            <span>ئالدى بىلەن كود ئالماقچى بولغان ئەپنى تاللاڭ</span>
          </label>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold flex items-center gap-1">
            <span>500+ ئەپ</span>
          </span>
        </div>

        <!-- Search Bar for Apps -->
        <div class="relative flex items-center">
          <input 
            id="appSearchInput" 
            type="text" 
            placeholder="ئەپ نامىنى ئىزدەڭ (مەسىلەن: Telegram, WhatsApp, OpenAI...)" 
            class="w-full bg-[#0a0f1d] border border-slate-700 focus:border-emerald-400 rounded-xl pr-3 pl-8 py-2 text-xs text-white placeholder-slate-500 font-sans transition text-right outline-none"
            oninput="filterApps(this.value)"
          />
          <span class="absolute left-2.5 text-xs text-slate-500 pointer-events-none">🔍</span>
        </div>

        <!-- Apps Grid -->
        <div id="appsGrid" class="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
          <!-- Dynamically populated via JS -->
        </div>
      </div>

      <!-- ================= 2-قەدەم (STEP 2): دۆلەتنى تاللاش ================= -->
      <div id="countrySection" class="glass-box rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-black text-white flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-emerald-500/40 shrink-0">2</span>
            <span>دۆلەت ۋە رايوننى تاللاڭ</span>
          </label>
          <div id="selectedAppTag" class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold flex items-center gap-1">
            <span>✈️ Telegram</span>
          </div>
        </div>

        <!-- Search Bar for Countries -->
        <div class="relative flex items-center">
          <input 
            id="countrySearchInput" 
            type="text" 
            placeholder="دۆلەت نامى ياكى كودىنى ئىزدەڭ (مەسىلەن: ئۇكرائىنا، ئامېرىكا، تۈركىيە...)" 
            class="w-full bg-[#0a0f1d] border border-slate-700 focus:border-emerald-400 rounded-xl pr-3 pl-8 py-2 text-xs text-white placeholder-slate-500 font-sans transition text-right outline-none"
            oninput="filterCountries(this.value)"
          />
          <span class="absolute left-2.5 text-xs text-slate-500 pointer-events-none">🔍</span>
        </div>

        <!-- Countries Grid -->
        <div id="countriesGrid" class="grid grid-cols-2 gap-2 pt-1 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
          <!-- Dynamically populated via JS -->
        </div>
      </div>

      <!-- ================= 3-قەدەم (STEP 3): زاكاز جەزملەش ۋە سېتىۋېلىش ================= -->
      <div id="summarySection" class="glass-box rounded-2xl p-3.5 border border-slate-800 space-y-3">
        <label class="text-xs font-black text-white flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-black shadow-md shadow-emerald-500/40 shrink-0">3</span>
          <span>زاكاز تالونى ۋە دەلىللەش</span>
        </label>

        <div class="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-2 font-mono">
          <div class="flex justify-between items-center text-slate-400">
            <span class="font-sans">تاللانغان ئەپ:</span>
            <span id="sumApp" class="text-emerald-300 font-bold">✈️ Telegram</span>
          </div>
          <div class="flex justify-between items-center text-slate-400">
            <span class="font-sans">دۆلەت ۋە رايون:</span>
            <span id="sumCountry" class="text-cyan-300 font-bold">🇺🇦 ئۇكرائىنا (+380)</span>
          </div>
          <div class="flex justify-between items-center text-slate-400">
            <span class="font-sans">نۆۋەتتىكى زاپاس:</span>
            <span id="sumStock" class="text-slate-300 font-bold">يۈكلىنىۋاتىدۇ...</span>
          </div>
          <div class="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-800">
            <span class="font-sans">زاكاز باھاسى:</span>
            <span id="sumPrice" class="text-base text-amber-300 font-black font-mono">$0.25</span>
          </div>
        </div>

        <!-- Deficit notice if balance is low -->
        <div id="deficitNotice" class="hidden bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-300 flex items-center justify-between">
          <span id="deficitText">ھەمياندىكى قالدۇق يېتىشمىدى</span>
          <button onclick="openDepositModal()" type="button" class="px-2 py-1 bg-rose-500 text-slate-950 font-bold rounded-lg text-[10px]">
            + تولۇقلاش
          </button>
        </div>

        <button 
          id="buyBtn" 
          onclick="executeBuyNumber()" 
          type="button" 
          class="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span id="buyBtnIcon">⚡</span>
          <span id="buyBtnText">مەۋھۇم نومۇرنى ئېلىش ($0.25)</span>
        </button>

        <p class="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
          <span>🛡️</span>
          <span>100% كاپالەت: 15 مىنۇتتا SMS كود كەلمىسە، پۇل دەرھال ھەميانىڭىزغا قايتىدۇ.</span>
        </p>
      </div>

    </div>

    <!-- ================= ORDERS & TRANSACTIONS MODAL ================= -->
    <div id="ordersModal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 hidden opacity-0 transition-opacity duration-200">
      <div class="w-full max-w-md bg-[#0d1527] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-2xl flex flex-col max-h-[85vh]">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 class="text-sm font-black text-white flex items-center gap-1.5">
            <span>📱</span>
            <span>ئالغان مەۋھۇم نومۇرلار تارىخى</span>
          </h3>
          <button onclick="closeOrdersModal()" class="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs">✕</button>
        </div>
        <div id="ordersListWrap" class="flex-1 overflow-y-auto no-scrollbar space-y-2">
          <!-- Dynamically populated -->
        </div>
      </div>
    </div>

    <!-- ================= CUSTOM IN-APP ALERT MODAL ================= -->
    <div id="appAlertModal" onclick="if(event.target===this) closeAppModal()" class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden opacity-0 transition-opacity duration-200">
      <div id="appAlertCard" class="w-full max-w-[340px] bg-[#0c1424] border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 transform scale-95 transition-transform duration-200 text-center relative overflow-hidden select-none">
        <div class="relative z-10 flex flex-col items-center">
          <div id="appAlertIconBox" class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
            <span id="appAlertIcon" class="text-2xl">⚠️</span>
          </div>
          <h3 id="appAlertTitle" class="text-base font-black text-white tracking-wide">ئەسكەرتىش</h3>
        </div>
        <p id="appAlertMsg" class="relative z-10 text-xs text-slate-300 leading-relaxed font-sans px-1">
          مەزمۇن
        </p>
        <div class="relative z-10 flex flex-col gap-2 pt-1">
          <button id="appAlertConfirmBtn" type="button" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer">
            چۈشەندىم
          </button>
          <button id="appAlertCancelBtn" type="button" class="w-full py-2 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition border border-slate-800 active:scale-95 cursor-pointer hidden">
            كېيىنرەك
          </button>
        </div>
      </div>
    </div>

    <!-- ================= BEAUTIFIED SHAMCASH DEPOSIT MODAL ================= -->
    <div id="depositModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 hidden opacity-0 transition-opacity duration-300">
      <div id="depositCard" class="w-full max-w-md bg-[#0a101f] border-2 border-amber-500/50 rounded-3xl p-4 space-y-3.5 shadow-2xl relative">
        <button onclick="closeDepositModal()" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold">✕</button>

        <div class="flex items-center gap-2.5 border-b border-slate-800 pb-2.5">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md shadow-amber-500/30">
            💵
          </div>
          <div>
            <h3 class="text-sm font-black text-white">ھەميانغا پۇل قاچىلاش</h3>
            <p class="text-xs text-amber-300">Sham Cash • TSA Auto Pay • USDT</p>
          </div>
        </div>

        <!-- Quick Amount Buttons -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-300">مىقدارنى تاللاڭ ياكى كىرگۈزۈڭ (دوللار $):</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button onclick="setDepositAmount(1)" type="button" class="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs font-mono">$1</button>
            <button onclick="setDepositAmount(2)" type="button" class="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs font-mono">$2</button>
            <button onclick="setDepositAmount(5)" type="button" class="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs font-mono">$5</button>
            <button onclick="setDepositAmount(10)" type="button" class="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs font-mono">$10</button>
          </div>
          <input id="depositAmountInput" type="number" step="0.5" min="0.5" value="2" class="w-full bg-[#050811] border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold text-right font-mono outline-none" placeholder="باشقا مىقدار..." />
        </div>

        <button onclick="createShamCashDeposit()" type="button" class="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/30 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
          <span>⚡</span>
          <span>دەرھال تۆلەش ۋە قاچىلاش (Sham Cash)</span>
        </button>
      </div>
    </div>

    <!-- ================= UNIFIED MULTI-AUTH MODAL ================= -->
    <div id="telegramModal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 hidden opacity-0 transition-opacity duration-300">
      <div class="w-full max-w-md bg-[#0a101f] border border-emerald-500/40 rounded-3xl p-4 space-y-3.5 shadow-2xl relative">
        <button onclick="closeTelegramModal()" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold">✕</button>

        <div class="text-center pt-1">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 text-xl font-bold flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/30">
            🔐
          </div>
          <h3 class="text-sm font-black text-white">AUTO CASH ھېساباتقا كىرىش</h3>
          <p class="text-xs text-slate-400 mt-0.5">ھەميان قالدۇقىڭىزنى ساقلاش ۋە زاكازلارنى باشقۇرۇش ئۈچۈن كىرىڭ</p>
        </div>

        <!-- Telegram One-Tap Login -->
        <button onclick="executeTelegramWebAppLogin()" type="button" class="w-full py-2.5 px-3 rounded-xl bg-[#229ED9] hover:bg-[#1e8ec3] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 transition active:scale-95 cursor-pointer">
          <span class="text-sm">✈️</span>
          <span>تېلېگرام ئارقىلىق 1 سېكۇنتتا كىرىش</span>
        </button>

        <!-- Google Login -->
        <button onclick="executeGoogleLogin()" type="button" class="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-95 cursor-pointer">
          <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.33 21.45 7.37 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.33 2.55 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
          <span>Google ھېساباتى بىلەن كىرىش</span>
        </button>
      </div>
    </div>

    <!-- ================= BEAUTIFIED APP SWITCHER MODAL (باشقا ئەپلەرگە ئۆتۈش) ================= -->
    <div id="appSwitcherModal" onclick="if(event.target===this) closeAppSwitcherModal()" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 hidden opacity-0 transition-opacity duration-300">
      <div id="appSwitcherCard" class="w-full max-w-md bg-[#0a101f] border-2 border-emerald-500/50 rounded-3xl p-4 space-y-3.5 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <button onclick="closeAppSwitcherModal()" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold">✕</button>

        <div class="flex items-center gap-2.5 border-b border-slate-800 pb-2.5">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md shadow-emerald-500/30">
            📱
          </div>
          <div>
            <h3 class="text-sm font-black text-white">باشقا ئەپلەر ۋە ئويۇنلار</h3>
            <p class="text-xs text-emerald-300">AUTO CASH بىر گەۋدىلەشكەن رەقەملىك بازىرى</p>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-1">
          <!-- App 1: Mobile Legends -->
          <a href="/mlbb.html" class="glass-box rounded-2xl p-3 border border-cyan-500/30 hover:border-cyan-400 bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-[#0e192e] flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block">
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
                <p class="text-[10px] text-slate-400">UID ئارقىلىق 3 سېكۇنتتا كىرىدۇ</p>
              </div>
            </div>
            <div class="shrink-0 flex flex-col items-end gap-1">
              <span class="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10.5px] font-black group-hover:bg-amber-400 group-hover:text-slate-950 transition flex items-center gap-1 shadow-sm">
                <span>كىرىش</span>
                <span class="font-mono">➔</span>
              </span>
            </div>
          </a>

          <!-- App 3: Honor of Kings (HOK) -->
          <a href="/honor-of-kings.html" class="glass-box rounded-2xl p-3 border border-purple-500/30 hover:border-purple-400 bg-gradient-to-r from-purple-950/30 via-slate-900/80 to-[#190e29]/60 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block">
            <div class="flex items-center gap-2.5 min-w-0">
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
              <span class="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10.5px] font-black group-hover:bg-purple-500 group-hover:text-slate-950 transition flex items-center gap-1 shadow-sm">
                <span>كىرىش</span>
                <span class="font-mono">➔</span>
              </span>
            </div>
          </a>

          <!-- App 4: Virtual Numbers (ACTIVE) -->
          <a href="/numbers.html" class="glass-box rounded-2xl p-3 border border-emerald-500/50 bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-[#0e291e]/80 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block relative overflow-hidden">
            <span class="absolute top-0 right-0 w-2 h-full bg-emerald-400"></span>
            <div class="flex items-center gap-2.5 min-w-0 pr-1">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-400/60 flex items-center justify-center shrink-0 bg-slate-950 p-1 text-2xl">
                <span>📱</span>
              </div>
              <div class="text-right min-w-0">
                <p class="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition flex items-center gap-1.5">
                  <span>مەۋھۇم نومۇر (Virtual SMS)</span>
                </p>
                <p class="text-[11px] text-emerald-300/90 font-mono mt-0.5">⚡ 200+ دۆلەت • سېكۇنتتا كود قوبۇللاش</p>
                <p class="text-[10px] text-slate-400">Telegram • WhatsApp • OpenAI • Google</p>
              </div>
            </div>
            <div class="shrink-0 flex flex-col items-end gap-1">
              <span class="px-2.5 py-1 rounded-xl bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm">
                <span>نۆۋەتتىكى</span>
                <span class="font-mono">✓</span>
              </span>
            </div>
          </a>

          <!-- App 5: AUTO CASH Full Store -->
          <a href="/" class="glass-box rounded-2xl p-3 border border-slate-700 hover:border-slate-500 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer block">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-11 h-11 rounded-2xl overflow-hidden shadow-md border-2 border-amber-400/60 flex items-center justify-center shrink-0 bg-slate-950">
                <img src="/autocash_logo.jpg" alt="AUTO CASH STORE" class="w-full h-full object-cover" onerror="this.src='https://auto-cash-sotre.vercel.app/autocash_logo.jpg'"/>
              </div>
              <div class="text-right min-w-0">
                <p class="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                  <span>AUTO CASH باش دۇكىنى</span>
                </p>
                <p class="text-[11px] text-slate-300 font-mono mt-0.5">🏪 بارلىق مۇلازىمەتلەر ۋە تولۇق سەھىپىلەر</p>
                <p class="text-[10px] text-slate-400">تور كارتىلىرى، تېلېفون پۇلى ۋە ئويۇنلار</p>
              </div>
            </div>
            <div class="shrink-0 flex flex-col items-end gap-1">
              <span class="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-[10.5px] font-black group-hover:bg-slate-700 group-hover:text-white transition flex items-center gap-1 shadow-sm">
                <span>باش بەت</span>
                <span class="font-mono">➔</span>
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>

  </div>

  <!-- ================= JAVASCRIPT APPLICATION LOGIC ================= -->
  <script>
    // State Variables
    let currentUser = null;
    let currentTgUser = null;
    let userBalance = 0;

    let selectedApp = 'tg';
    let selectedCountryId = 1; // Default to Ukraine
    let currentServicePrice = 1.20;
    let currentStockCount = 0;

    let allCountries = [];
    let currentServices = [];
    let activeSession = null;
    let pollInterval = null;
    let timerInterval = null;

    // Static Top Apps
    const POPULAR_APPS = [
      { code: 'tg', name: 'Telegram', nameUg: 'تېلېگرام', color: '#229ED9', icon: '✈️' },
      { code: 'wa', name: 'WhatsApp', nameUg: 'ۋاتساپ', color: '#25D366', icon: '💬' },
      { code: 'dr', name: 'ChatGPT', nameUg: 'ChatGPT (OpenAI)', color: '#10A37F', icon: '🤖' },
      { code: 'go', name: 'Google', nameUg: 'گۇگۇل (Gmail)', color: '#EA4335', icon: '🔍' },
      { code: 'lf', name: 'TikTok', nameUg: 'تىكتوك', color: '#00F2FE', icon: '🎵' },
      { code: 'ig', name: 'Instagram', nameUg: 'ئىنستاگراملار', color: '#E1306C', icon: '📸' },
      { code: 'fb', name: 'Facebook', nameUg: 'فېيسبۇك', color: '#1877F2', icon: '👥' },
      { code: 'tw', name: 'Twitter (X)', nameUg: 'تۋىتتېر (X)', color: '#FFFFFF', icon: '🐦' },
      { code: 'sn', name: 'Snapchat', nameUg: 'سناپچات', color: '#FFFC00', icon: '👻' },
      { code: 'ds', name: 'Discord', nameUg: 'دىسكورد', color: '#5865F2', icon: '🎮' },
      { code: 'am', name: 'Amazon', nameUg: 'ئامازون', color: '#FF9900', icon: '🛒' },
      { code: 'wb', name: 'WeChat', nameUg: 'ۋېيشىن (WeChat)', color: '#07C160', icon: '💬' }
    ];

    // Static Fallback Countries
    const POPULAR_COUNTRIES = [
      { id: 1, name: 'Ukraine', nameUg: 'ئۇكرائىنا', code: 'ua', dialCode: '+380', flag: '🇺🇦' },
      { id: 0, name: 'Russia', nameUg: 'روسىيە', code: 'ru', dialCode: '+7', flag: '🇷🇺' },
      { id: 12, name: 'USA', nameUg: 'ئامېرىكا', code: 'us', dialCode: '+1', flag: '🇺🇸' },
      { id: 10, name: 'Vietnam', nameUg: 'ۋىيېتنام', code: 'vn', dialCode: '+84', flag: '🇻🇳' },
      { id: 2, name: 'Kazakhstan', nameUg: 'قازاقىستان', code: 'kz', dialCode: '+7', flag: '🇰🇿' },
      { id: 16, name: 'United Kingdom', nameUg: 'ئەنگلىيە', code: 'gb', dialCode: '+44', flag: '🇬🇧' },
      { id: 62, name: 'Turkey', nameUg: 'تۈركىيە', code: 'tr', dialCode: '+90', flag: '🇹🇷' },
      { id: 6, name: 'Indonesia', nameUg: 'ھىندونېزىيە', code: 'id', dialCode: '+62', flag: '🇮🇩' },
      { id: 4, name: 'Philippines', nameUg: 'فىلىپپىن', code: 'ph', dialCode: '+63', flag: '🇵🇭' },
      { id: 73, name: 'Brazil', nameUg: 'بىرازىلىيە', code: 'br', dialCode: '+55', flag: '🇧🇷' },
      { id: 21, name: 'Egypt', nameUg: 'مىسىر', code: 'eg', dialCode: '+20', flag: '🇪🇬' },
      { id: 40, name: 'Uzbekistan', nameUg: 'ئۆزبېكىستان', code: 'uz', dialCode: '+998', flag: '🇺🇿' }
    ];

    // --- Init on DOM Load ---
    document.addEventListener('DOMContentLoaded', async () => {
      initTelegramWebApp();
      initUserSession();
      renderAppsGrid();
      await loadCountries();
      await loadServicesForCountry(selectedCountryId);
      restoreActiveSession();
    });

    // --- Telegram WebApp ---
    function initTelegramWebApp() {
      try {
        if (window.Telegram && window.Telegram.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();
          if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            currentTgUser = tg.initDataUnsafe.user;
          }
        }
      } catch (e) {
        console.warn('Telegram init error:', e);
      }
    }

    // --- User Session & Dollar Balance ---
    async function initUserSession() {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.user) {
            currentUser = data.user;
            userBalance = Number(data.user.balance || 0);
            updateWalletDisplay();
            return;
          }
        }
      } catch (_) {}

      // Fallback to local storage
      try {
        const raw = localStorage.getItem('autocash_user_session');
        if (raw) {
          const u = JSON.parse(raw);
          if (u) {
            currentUser = u;
            userBalance = Number(u.balance || 0);
          }
        }
      } catch (_) {}
      updateWalletDisplay();
    }

    function updateWalletDisplay() {
      const balanceEl = document.getElementById('walletBalanceText');
      const tagEl = document.getElementById('userStatusTag');
      const authBtn = document.getElementById('authBtn');

      if (balanceEl) balanceEl.textContent = '$' + userBalance.toFixed(2);
      if (currentUser) {
        if (tagEl) {
          tagEl.textContent = currentUser.name || currentUser.username || 'ئەزا';
          tagEl.className = 'text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold';
        }
        if (authBtn) {
          authBtn.textContent = 'ھېسابات';
          authBtn.onclick = () => openOrdersModal();
        }
      } else {
        if (tagEl) {
          tagEl.textContent = 'مېھمان';
          tagEl.className = 'text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-normal';
        }
        if (authBtn) {
          authBtn.textContent = 'كىرىش';
          authBtn.onclick = () => openTelegramModal();
        }
      }

      checkDeficit();
    }

    function checkDeficit() {
      const notice = document.getElementById('deficitNotice');
      const text = document.getElementById('deficitText');
      const buyBtn = document.getElementById('buyBtn');

      if (userBalance < currentServicePrice) {
        const diff = (currentServicePrice - userBalance).toFixed(2);
        if (notice) notice.classList.remove('hidden');
        if (text) text.textContent = 'ھەمياندىكى قالدۇق يېتىشمىدى ($' + diff + ' كەم)';
      } else {
        if (notice) notice.classList.add('hidden');
      }
    }

    // --- Render Apps ---
    function renderAppsGrid(filter = '') {
      const container = document.getElementById('appsGrid');
      if (!container) return;

      const q = filter.toLowerCase().trim();
      const filtered = POPULAR_APPS.filter(a => 
        !q || a.name.toLowerCase().includes(q) || a.nameUg.toLowerCase().includes(q)
      );

      container.innerHTML = filtered.map(app => {
        const isSelected = app.code === selectedApp;
        return \`
          <button 
            onclick="selectApp('\${app.code}')" 
            type="button" 
            class="p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer border \${
              isSelected 
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/20' 
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }"
          >
            <span class="text-xl">\${app.icon}</span>
            <span class="text-[11px] font-bold truncate w-full">\${app.nameUg}</span>
          </button>
        \`;
      }).join('');
    }

    function filterApps(val) {
      renderAppsGrid(val);
    }

    function selectApp(code) {
      selectedApp = code;
      renderAppsGrid(document.getElementById('appSearchInput')?.value || '');
      
      const appObj = POPULAR_APPS.find(a => a.code === code);
      const tag = document.getElementById('selectedAppTag');
      const sumApp = document.getElementById('sumApp');

      if (tag && appObj) tag.innerHTML = \`<span>\${appObj.icon} \${appObj.nameUg}</span>\`;
      if (sumApp && appObj) sumApp.textContent = appObj.icon + ' ' + appObj.nameUg;

      updateCurrentPriceAndStock();
    }

    // --- Load & Render Countries ---
    async function loadCountries() {
      try {
        const res = await fetch('/api/sms/countries');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.countries) && data.countries.length > 0) {
            allCountries = data.countries;
            renderCountriesGrid();
            return;
          }
        }
      } catch (e) {
        console.warn('Countries API error, using popular:', e);
      }

      allCountries = POPULAR_COUNTRIES;
      renderCountriesGrid();
    }

    function renderCountriesGrid(filter = '') {
      const container = document.getElementById('countriesGrid');
      if (!container) return;

      const q = filter.toLowerCase().trim();
      const filtered = allCountries.filter(c => 
        !q || (c.nameUg && c.nameUg.toLowerCase().includes(q)) || 
        (c.name && c.name.toLowerCase().includes(q)) || 
        (c.dialCode && c.dialCode.includes(q))
      );

      container.innerHTML = filtered.slice(0, 50).map(c => {
        const isSelected = c.id === selectedCountryId;
        const flag = c.flag || '🌐';
        return \`
          <button 
            onclick="selectCountry(\${c.id})" 
            type="button" 
            class="p-2.5 rounded-xl text-right flex items-center justify-between gap-2 transition active:scale-95 cursor-pointer border \${
              isSelected 
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/20' 
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-lg shrink-0">\${flag}</span>
              <div class="leading-tight truncate">
                <p class="text-xs font-bold text-white truncate">\${c.nameUg || c.name}</p>
                <p class="text-[10px] text-slate-400 font-mono">\${c.dialCode || ''}</p>
              </div>
            </div>
            \${isSelected ? '<span class="text-emerald-400 font-bold text-xs">✓</span>' : ''}
          </button>
        \`;
      }).join('');
    }

    function filterCountries(val) {
      renderCountriesGrid(val);
    }

    async function selectCountry(countryId) {
      selectedCountryId = countryId;
      renderCountriesGrid(document.getElementById('countrySearchInput')?.value || '');
      
      const cObj = allCountries.find(c => c.id === countryId);
      const sumCountry = document.getElementById('sumCountry');
      if (sumCountry && cObj) {
        sumCountry.textContent = (cObj.flag || '🌐') + ' ' + (cObj.nameUg || cObj.name) + ' (' + (cObj.dialCode || '') + ')';
      }

      await loadServicesForCountry(countryId);
    }

    async function loadServicesForCountry(countryId) {
      const stockEl = document.getElementById('sumStock');
      if (stockEl) stockEl.textContent = 'يۈكلىنىۋاتىدۇ...';

      try {
        const res = await fetch('/api/sms/services?countryId=' + countryId);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.services)) {
            currentServices = data.services;
            updateCurrentPriceAndStock();
            return;
          }
        }
      } catch (e) {
        console.warn('Services load error:', e);
      }

      // Default fallback
      currentServicePrice = 0.25;
      currentStockCount = 1000;
      updateSummaryDisplay();
    }

    function updateCurrentPriceAndStock() {
      const s = currentServices.find(x => String(x.service_code).toLowerCase() === String(selectedApp).toLowerCase());
      if (s) {
        currentServicePrice = Number(s.sellPrice || s.price || 0.25);
        currentStockCount = Number(s.count || 0);
      } else {
        currentServicePrice = 0.25;
        currentStockCount = 500;
      }
      updateSummaryDisplay();
    }

    function updateSummaryDisplay() {
      const priceEl = document.getElementById('sumPrice');
      const stockEl = document.getElementById('sumStock');
      const buyText = document.getElementById('buyBtnText');

      if (priceEl) priceEl.textContent = '$' + currentServicePrice.toFixed(2);
      if (stockEl) {
        if (currentStockCount > 0) {
          stockEl.textContent = currentStockCount.toLocaleString() + ' تال بوش بار';
          stockEl.className = 'text-emerald-400 font-bold';
        } else {
          stockEl.textContent = 'تۈگىدى (باشقا دۆلەتنى تاللاڭ)';
          stockEl.className = 'text-rose-400 font-bold';
        }
      }
      if (buyText) buyText.textContent = 'مەۋھۇم نومۇرنى ئېلىش ($' + currentServicePrice.toFixed(2) + ')';

      checkDeficit();
    }

    // --- Execute Purchase ---
    async function executeBuyNumber() {
      if (!currentUser) {
        openTelegramModal();
        return;
      }

      if (userBalance < currentServicePrice) {
        openDepositModal();
        return;
      }

      const buyBtn = document.getElementById('buyBtn');
      const buyBtnText = document.getElementById('buyBtnText');
      const buyBtnIcon = document.getElementById('buyBtnIcon');

      if (buyBtn) buyBtn.disabled = true;
      if (buyBtnText) buyBtnText.textContent = 'نومۇر ئېلىنىۋاتىدۇ...';
      if (buyBtnIcon) buyBtnIcon.textContent = '⏳';

      const cObj = allCountries.find(c => c.id === selectedCountryId);
      const appObj = POPULAR_APPS.find(a => a.code === selectedApp);

      try {
        const res = await fetch('/api/sms/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceCode: selectedApp,
            countryId: selectedCountryId,
            serviceName: appObj?.name || selectedApp,
            countryName: cObj?.name || String(selectedCountryId)
          })
        });

        const data = await res.json();
        if (res.ok && data && data.success && data.phone) {
          userBalance = Math.max(0, userBalance - currentServicePrice);
          updateWalletDisplay();

          activeSession = {
            orderId: data.orderId,
            activationId: data.activationId,
            phone: data.phone,
            serviceCode: selectedApp,
            serviceName: appObj?.nameUg || selectedApp,
            countryName: cObj?.nameUg || String(selectedCountryId),
            expiresAt: data.expiresAt || (Date.now() + 15 * 60 * 1000),
            status: 'waiting'
          };

          saveActiveSession(activeSession);
          showActiveSessionUI();
          startSessionPolling();
          showAppModal({
            icon: '✅',
            title: 'مەۋھۇم نومۇر تەقسىملەندى!',
            message: 'نومۇرىڭىز: ' + data.phone + '\\nنومۇرنى كۆچۈرۈپ ئەپكە كىرگۈزۈڭ، SMS كودى ئېكرانغا چىقىدۇ.'
          });
        } else {
          showAppModal({
            icon: '⚠️',
            title: 'نومۇر ئېلىش مەغلۇپ بولدى',
            message: data?.message || 'نۆۋەتتە بۇ دۆلەتتە بوش نومۇر يوق ياكى تەمىنلىگۈچى ئىنكاس قايتۇرمىدى. باشقا دۆلەتنى سىناپ كۆرۈڭ.'
          });
        }
      } catch (err) {
        showAppModal({
          icon: '⚠️',
          title: 'خاتالىق',
          message: 'تور ئۇلىنىشىدا كاشىلا كۆرۈلدى: ' + (err.message || '')
        });
      } finally {
        if (buyBtn) buyBtn.disabled = false;
        if (buyBtnText) buyBtnText.textContent = 'مەۋھۇم نومۇرنى ئېلىش ($' + currentServicePrice.toFixed(2) + ')';
        if (buyBtnIcon) buyBtnIcon.textContent = '⚡';
      }
    }

    // --- Active Session Management ---
    function saveActiveSession(sess) {
      if (!sess) {
        localStorage.removeItem('autocash_active_sms_order');
      } else {
        localStorage.setItem('autocash_active_sms_order', JSON.stringify(sess));
      }
    }

    function restoreActiveSession() {
      try {
        const raw = localStorage.getItem('autocash_active_sms_order');
        if (raw) {
          const sess = JSON.parse(raw);
          if (sess && sess.expiresAt > Date.now() && sess.status === 'waiting') {
            activeSession = sess;
            showActiveSessionUI();
            startSessionPolling();
          } else {
            localStorage.removeItem('autocash_active_sms_order');
          }
        }
      } catch (_) {}
    }

    function showActiveSessionUI() {
      if (!activeSession) return;
      const card = document.getElementById('activeSessionCard');
      const phoneEl = document.getElementById('sessionPhoneNumber');
      const infoEl = document.getElementById('sessionServiceInfo');
      const optResult = document.getElementById('otpResultWrap');
      const optWait = document.getElementById('otpWaitingIndicator');

      if (card) {
        card.classList.remove('hidden');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (phoneEl) phoneEl.textContent = activeSession.phone;
      if (infoEl) infoEl.textContent = activeSession.serviceName + ' • ' + activeSession.countryName;
      if (optResult) optResult.classList.add('hidden');
      if (optWait) optWait.classList.remove('hidden');

      startCountdownTimer();
    }

    function startCountdownTimer() {
      if (timerInterval) clearInterval(timerInterval);
      const badge = document.getElementById('sessionTimerBadge');

      const update = () => {
        if (!activeSession) {
          clearInterval(timerInterval);
          return;
        }
        const rem = Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000));
        const m = Math.floor(rem / 60);
        const s = rem % 60;
        if (badge) badge.textContent = '⏳ ' + m + ':' + (s < 10 ? '0' : '') + s;

        if (rem <= 0) {
          clearInterval(timerInterval);
          cancelCurrentSession(true);
        }
      };

      update();
      timerInterval = setInterval(update, 1000);
    }

    function startSessionPolling() {
      if (pollInterval) clearInterval(pollInterval);
      if (!activeSession) return;

      pollInterval = setInterval(async () => {
        if (!activeSession) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const res = await fetch('/api/sms/check?orderId=' + activeSession.orderId + '&activationId=' + activeSession.activationId);
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.status === 'RECEIVED' && data.code) {
              clearInterval(pollInterval);
              clearInterval(timerInterval);
              activeSession.code = data.code;
              activeSession.status = 'received';
              saveActiveSession(null);
              showReceivedCodeUI(data.code);
            }
          }
        } catch (e) {
          console.warn('SMS Poll error:', e);
        }
      }, 3000);
    }

    function showReceivedCodeUI(code) {
      const optResult = document.getElementById('otpResultWrap');
      const optWait = document.getElementById('otpWaitingIndicator');
      const digitsEl = document.getElementById('otpCodeDigits');
      const cancelBtn = document.getElementById('cancelSessionBtn');

      if (optWait) optWait.classList.add('hidden');
      if (optResult) optResult.classList.remove('hidden');
      if (digitsEl) digitsEl.textContent = code;
      if (cancelBtn) cancelBtn.classList.add('hidden');

      showAppModal({
        icon: '🎉',
        title: 'SMS كودى كەلدى!',
        message: 'سىزنىڭ تەستىقلاش كودىڭىز: ' + code
      });
    }

    async function cancelCurrentSession(autoExpired = false) {
      if (!activeSession) return;

      const actId = activeSession.activationId;
      const ordId = activeSession.orderId;

      clearInterval(pollInterval);
      clearInterval(timerInterval);

      try {
        const res = await fetch('/api/sms/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: ordId,
            activationId: actId,
            reason: autoExpired ? 'ۋاقتى توشتى (كود كەلمىدى)' : 'خېرىدار بىكار قىلدى'
          })
        });

        const data = await res.json();
        saveActiveSession(null);
        activeSession = null;
        document.getElementById('activeSessionCard')?.classList.add('hidden');
        await initUserSession();

        showAppModal({
          icon: 'ℹ️',
          title: autoExpired ? 'ۋاقىت توشتى' : 'نومۇر بىكار قىلىندى',
          message: 'نومۇر بىكار قىلىندى ھەمدە تۇتۇلغان پۇل AUTO CASH ھەميانىڭىزغا دەرھال قايتۇرۇلدى.'
        });
      } catch (e) {
        console.warn('Cancel error:', e);
      }
    }

    function copySessionPhone() {
      if (!activeSession?.phone) return;
      navigator.clipboard.writeText(activeSession.phone).then(() => {
        showAppModal({ icon: '📋', title: 'كۆچۈرۈلدى!', message: 'نومۇر كۆچۈرۈلدى: ' + activeSession.phone });
      });
    }

    function copySmsCode() {
      if (!activeSession?.code) return;
      navigator.clipboard.writeText(activeSession.code).then(() => {
        showAppModal({ icon: '📋', title: 'كۆچۈرۈلدى!', message: 'SMS كودى كۆچۈرۈلدى: ' + activeSession.code });
      });
    }

    // --- Orders History Modal ---
    async function openOrdersModal() {
      const modal = document.getElementById('ordersModal');
      const list = document.getElementById('ordersListWrap');
      if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
      }
      if (list) list.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">يۈكلىنىۋاتىدۇ...</p>';

      try {
        const res = await fetch('/api/sms/orders');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.orders) && data.orders.length > 0) {
            list.innerHTML = data.orders.map(o => \`
              <div class="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1 text-xs">
                <div class="flex justify-between items-center text-slate-300">
                  <span class="font-bold">\${o.serviceName || 'مەۋھۇم نومۇر'}</span>
                  <span class="font-mono text-emerald-400">\${o.status === 'completed' ? '✓ پۈتتى' : o.status}</span>
                </div>
                <div class="flex justify-between items-center text-slate-400 font-mono">
                  <span>نومۇر: \${o.phone || o.targetAccount || '---'}</span>
                  <span class="text-amber-300 font-bold">\${o.code ? ('كود: ' + o.code) : ''}</span>
                </div>
              </div>
            \`).join('');
            return;
          }
        }
      } catch (_) {}

      if (list) list.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">تېخى مەۋھۇم نومۇر زاكاز قىلمىدىڭىز.</p>';
    }

    function closeOrdersModal() {
      const modal = document.getElementById('ordersModal');
      if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 200);
      }
    }

    // --- Modal Handlers ---
    function openAppSwitcherModal() {
      const m = document.getElementById('appSwitcherModal');
      if (m) {
        m.classList.remove('hidden');
        setTimeout(() => m.classList.remove('opacity-0'), 10);
      }
    }
    function closeAppSwitcherModal() {
      const m = document.getElementById('appSwitcherModal');
      if (m) {
        m.classList.add('opacity-0');
        setTimeout(() => m.classList.add('hidden'), 200);
      }
    }

    function openDepositModal() {
      const m = document.getElementById('depositModal');
      if (m) {
        m.classList.remove('hidden');
        setTimeout(() => m.classList.remove('opacity-0'), 10);
      }
    }
    function closeDepositModal() {
      const m = document.getElementById('depositModal');
      if (m) {
        m.classList.add('opacity-0');
        setTimeout(() => m.classList.add('hidden'), 200);
      }
    }
    function setDepositAmount(val) {
      const input = document.getElementById('depositAmountInput');
      if (input) input.value = val;
    }

    async function createShamCashDeposit() {
      const input = document.getElementById('depositAmountInput');
      const val = parseFloat(input?.value || '2');
      if (isNaN(val) || val <= 0) return;

      closeDepositModal();
      showAppModal({
        icon: '⏳',
        title: 'تۆلەش كۆزنىكى ئېچىلىۋاتىدۇ...',
        message: 'Sham Cash ئاپتوماتىك كۆزنەككە ئۇلىنىۋاتىدۇ...'
      });

      try {
        const res = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: val, method: 'shamcash' })
        });
        const data = await res.json();
        if (data && data.success && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          showAppModal({
            icon: '⚠️',
            title: 'قاچىلاش مەغلۇپ بولدى',
            message: data?.message || 'تۆلەش ئۇلىنىشى ھاسىل قىلىنمىدى.'
          });
        }
      } catch (e) {
        showAppModal({ icon: '⚠️', title: 'خاتالىق', message: e.message || 'ئۇلىنىش كاشىلىسى' });
      }
    }

    function openTelegramModal() {
      const m = document.getElementById('telegramModal');
      if (m) {
        m.classList.remove('hidden');
        setTimeout(() => m.classList.remove('opacity-0'), 10);
      }
    }
    function closeTelegramModal() {
      const m = document.getElementById('telegramModal');
      if (m) {
        m.classList.add('opacity-0');
        setTimeout(() => m.classList.add('hidden'), 200);
      }
    }
    function handleAuthClick() {
      if (currentUser) {
        openOrdersModal();
      } else {
        openTelegramModal();
      }
    }

    async function executeTelegramWebAppLogin() {
      closeTelegramModal();
      try {
        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData || '';
        const res = await fetch('/api/auth/telegram-webapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        });
        const data = await res.json();
        if (data && data.success && data.user) {
          currentUser = data.user;
          userBalance = Number(data.user.balance || 0);
          localStorage.setItem('autocash_user_session', JSON.stringify(data.user));
          updateWalletDisplay();
          showAppModal({ icon: '✅', title: 'مۇۋەپپەقىيەتلىك كىردىڭىز', message: 'خۇش كەپسىز، ' + (data.user.name || 'ئەزا') });
        } else {
          showAppModal({ icon: 'ℹ️', title: 'ئەسكەرتىش', message: 'بۇ تېلېگرام ئەپ ئىچىدىلا 1 چەكمە بىلەن ئىشلەيدۇ. ياكى Google ئارقىلىق كىرىڭ.' });
        }
      } catch (e) {
        showAppModal({ icon: '⚠️', title: 'كاشىلا', message: e.message || 'كىرىش مەغلۇپ بولدى' });
      }
    }

    function executeGoogleLogin() {
      window.location.href = '/api/auth/google';
    }

    function showAppModal({ icon = '⚠️', title = 'ئەسكەرتىش', message = '' }) {
      const m = document.getElementById('appAlertModal');
      const ic = document.getElementById('appAlertIcon');
      const ti = document.getElementById('appAlertTitle');
      const ms = document.getElementById('appAlertMsg');
      const cb = document.getElementById('appAlertConfirmBtn');

      if (ic) ic.textContent = icon;
      if (ti) ti.textContent = title;
      if (ms) ms.textContent = message;
      if (cb) cb.onclick = () => closeAppModal();

      if (m) {
        m.classList.remove('hidden');
        setTimeout(() => m.classList.remove('opacity-0'), 10);
      }
    }

    function closeAppModal() {
      const m = document.getElementById('appAlertModal');
      if (m) {
        m.classList.add('opacity-0');
        setTimeout(() => m.classList.add('hidden'), 200);
      }
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(numbersHtmlPath, numbersHtml, 'utf8');
fs.writeFileSync(smsHtmlPath, numbersHtml, 'utf8');
console.log('Successfully written public/numbers.html and public/sms.html!');
