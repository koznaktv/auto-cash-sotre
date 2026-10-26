'use client';

import React, { useState, useRef } from 'react';
import { Copy, Check, Download, Wifi, Lock, User, Calendar, Tag, Clock } from 'lucide-react';

export interface WifiCardData {
  network?: 'fursan' | 'azez' | string;
  networkName?: string;
  networkEn?: string;
  username: string;
  password?: string;
  cardNumber?: string;
  packageTitle?: string;
  price?: number | string;
  purchaseDate?: string;
  validity?: string;
}

interface WifiVoucherCardProps {
  card: WifiCardData;
  className?: string;
}

export default function WifiVoucherCard({ card, className = '' }: WifiVoucherCardProps) {
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isMujahid = card.network === 'mujahid' || (card.networkName || '').includes('مجاهد') || (card.networkEn || '').toLowerCase().includes('mujahid');
  const isFursan = !isMujahid && (card.network === 'fursan' || (card.networkName || '').includes('فرسان') || (card.networkEn || '').toLowerCase().includes('fursan'));
  const netNameEn = card.networkEn || (isMujahid ? 'AL MUJAHID NET' : (isFursan ? 'FURSAN NET' : 'AZEZ . NET'));
  const netNameAr = card.networkName || (isMujahid ? 'شبكة المجاهد نت' : (isFursan ? 'شبكة الفرسان' : 'شبكة عزيز نت'));
  const cardNumber = card.cardNumber || '#1001';
  const username = card.username || '—';
  const password = card.password || '—';
  const validity = card.validity || '7 كۈن (7 Days)';
  const packageTitle = card.packageTitle || 'Wi-Fi بولىقى';
  const priceDisplay = card.price ? `$${Number(card.price).toFixed(2)} USD` : '0.34 USD';
  const purchaseDate = card.purchaseDate || new Date().toISOString().replace('T', ' ').slice(0, 19);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopy = (val: string, field: 'username' | 'password', label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(val).then(() => {
        setCopiedField(field);
        showToast(`«${label}» كۆچۈرۈلدى: ${val}`);
        setTimeout(() => setCopiedField(null), 2000);
      });
    } else {
      const el = document.createElement('textarea');
      el.value = val;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedField(field);
      showToast(`«${label}» كۆچۈرۈلدى: ${val}`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleDownloadImage = () => {
    showToast('📸 كارتىنىڭ سۈزۈك رەسىمى تەييارلىنىۋاتىدۇ...');
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const pad = 30;
    const cardW = w - pad * 2;
    const cardH = h - pad * 2;
    const radius = 24;

    // Rounded clipping
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pad + radius, pad);
    ctx.lineTo(pad + cardW - radius, pad);
    ctx.quadraticCurveTo(pad + cardW, pad, pad + cardW, pad + radius);
    ctx.lineTo(pad + cardW, pad + cardH - radius);
    ctx.quadraticCurveTo(pad + cardW, pad + cardH, pad + cardW - radius, pad + cardH);
    ctx.lineTo(pad + radius, pad + cardH);
    ctx.quadraticCurveTo(pad, pad + cardH, pad, pad + cardH - radius);
    ctx.lineTo(pad, pad + radius);
    ctx.quadraticCurveTo(pad, pad, pad + radius, pad);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pad, pad, cardW, cardH);

    // Accent top bar
    ctx.fillStyle = isMujahid ? '#4f46e5' : (isFursan ? '#059669' : '#15803d');
    ctx.fillRect(pad, pad, cardW, 10);

    // Header background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(pad, pad + 10, cardW, 100);

    // Left: AUTO CASH
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('AUTO CASH', pad + 30, pad + 55);
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText('سريع . آمن . موثوق ⚡️', pad + 30, pad + 85);

    // Center Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(netNameEn, pad + cardW / 2, pad + 60);
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText(netNameAr, pad + cardW / 2, pad + 88);

    // Right: Badge
    ctx.fillStyle = isMujahid ? '#4338ca' : (isFursan ? '#1e40af' : '#166534');
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(netNameAr + ' 📶', pad + cardW - 30, pad + 65);
    ctx.fillStyle = isMujahid ? '#6366f1' : (isFursan ? '#3b82f6' : '#22c55e');
    ctx.font = '15px sans-serif';
    ctx.fillText(netNameEn + ' Wi-Fi Card', pad + cardW - 30, pad + 88);

    // Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, pad + 110);
    ctx.lineTo(pad + cardW, pad + 110);
    ctx.stroke();

    function drawBox(x: number, y: number, boxW: number, boxH: number, label: string, val: string, sublabel: string, isKey: boolean) {
      ctx!.fillStyle = isKey ? '#f0fdf4' : '#f8fafc';
      ctx!.strokeStyle = isKey ? '#bbf7d0' : '#e2e8f0';
      ctx!.lineWidth = 1.5;

      ctx!.beginPath();
      ctx!.roundRect(x, y, boxW, boxH, 16);
      ctx!.fill();
      ctx!.stroke();

      ctx!.textAlign = 'right';
      ctx!.fillStyle = '#64748b';
      ctx!.font = 'bold 16px sans-serif';
      ctx!.fillText(label, x + boxW - 20, y + 32);

      if (sublabel) {
        ctx!.fillStyle = '#94a3b8';
        ctx!.font = '13px sans-serif';
        ctx!.fillText(sublabel, x + boxW - 20, y + 52);
      }

      ctx!.fillStyle = isKey ? '#064e3b' : '#0f172a';
      ctx!.font = isKey ? 'bold 32px monospace' : 'bold 22px sans-serif';
      ctx!.fillText(val, x + boxW - 20, y + boxH - 22);
    }

    const colW = (cardW - 60) / 2;
    const rowH = 100;
    const startY = pad + 130;

    // Row 1
    drawBox(pad + 20, startY, colW, rowH, 'اسم المستخدم (Username)', username, 'كود الدخول / نومۇرى', true);
    drawBox(pad + 40 + colW, startY, colW, rowH, 'تاريخ الشراء (سېتىۋالغان ۋاقتى)', purchaseDate.slice(0, 16), 'Purchase Timestamp', false);

    // Row 2
    drawBox(pad + 20, startY + 115, colW, rowH, 'كلمة المرور (Password)', password, 'رمز الحماية / پارولى', true);
    drawBox(pad + 40 + colW, startY + 115, colW, rowH, 'صلاحية البطاقة (مۇددىتى)', validity, 'Card Validity Period', false);

    // Row 3
    drawBox(pad + 20, startY + 230, colW, rowH, 'نوع البطاقة (بولاق)', packageTitle, 'Card Type Package', false);
    drawBox(pad + 40 + colW, startY + 230, colW, rowH, 'السعر (باھاسى)', priceDisplay, 'Total Paid Price', false);

    // Bottom Bar
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(pad, pad + cardH - 55, cardW, 55);

    // Accent corner
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(pad + cardW - 140, pad + cardH - 55);
    ctx.lineTo(pad + cardW, pad + cardH - 55);
    ctx.lineTo(pad + cardW, pad + cardH);
    ctx.lineTo(pad + cardW - 180, pad + cardH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏪 AUTO CASH — دۇكىنىڭىزدىن تاللىغان كارتىڭىز', pad + 25, pad + cardH - 22);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('رقم البطاقة: ' + cardNumber, pad + cardW - 25, pad + cardH - 22);

    ctx.restore();

    const link = document.createElement('a');
    link.download = `wifi-card-${cardNumber.replace('#', '')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={`w-full max-w-xl mx-auto space-y-4 text-right ${className}`} dir="rtl">
      {/* Toast alert */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-50 flex items-center gap-2 border border-emerald-500/50 animate-bounce">
          <span className="text-emerald-400">✅</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden canvas for download */}
      <canvas ref={canvasRef} width={1000} height={600} style={{ display: 'none' }} />

      {/* THE VOUCHER CARD */}
      <div className="bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative select-none">
        {/* Top Decorative Accent Bar */}
        <div
          className={`h-2 bg-gradient-to-r ${
            isMujahid
              ? 'from-indigo-600 via-purple-500 to-amber-500'
              : isFursan
              ? 'from-emerald-600 via-teal-500 to-amber-500'
              : 'from-green-600 via-emerald-500 to-amber-500'
          }`}
        />

        {/* Header Section */}
        <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/80">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-base shadow-xs">
              📶
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-800 tracking-wider">AUTO CASH</div>
              <div className="text-[10px] text-slate-400">سريع . آمن . موثوق ⚡️</div>
            </div>
          </div>

          {/* Network Title */}
          <div className="text-center">
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wider border-b-2 border-emerald-600 pb-0.5 block">
              {netNameEn}
            </span>
            <div className="text-[11px] text-slate-500 font-bold mt-0.5">{netNameAr}</div>
          </div>

          {/* Network Badge */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${
              isMujahid
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                : isFursan
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg text-white flex items-center justify-center font-bold text-xs ${
                isMujahid ? 'bg-indigo-700' : isFursan ? 'bg-blue-600' : 'bg-green-600'
              }`}
            >
              {isMujahid ? 'M' : isFursan ? 'R' : '📶'}
            </div>
            <div className="text-right leading-tight">
              <span className="text-[11px] font-bold block">{netNameAr}</span>
              <span className="text-[9px] text-slate-500 block">{netNameEn}</span>
            </div>
          </div>
        </div>

        {/* Fields Grid */}
        <div className="p-4 sm:p-5 space-y-3 bg-white">
          {/* Row 1: Username & Purchase Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Username */}
            <div
              onClick={() => handleCopy(username, 'username', 'اسم المستخدم (نومۇرى)')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 active:scale-[0.98] transition-all cursor-pointer group"
              title="بېسىپ كۆچۈرۈڭ"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold">
                    اسم المستخدم <span className="text-[10px] text-slate-400 font-normal">(Username)</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 tracking-wider font-mono">
                    {username}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="px-2 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold shadow-xs group-hover:border-emerald-300 flex items-center gap-1 shrink-0"
              >
                {copiedField === 'username' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>كۆچۈرۈلدى</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>كۆچۈرۈش</span>
                  </>
                )}
              </button>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-semibold">
                  تاريخ الشراء <span className="text-[10px] text-slate-400 font-normal">(ۋاقتى)</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 font-mono">
                  {purchaseDate}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Password & Validity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Password */}
            <div
              onClick={() => handleCopy(password, 'password', 'كلمة المرور (پارولى)')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 active:scale-[0.98] transition-all cursor-pointer group"
              title="بېسىپ كۆچۈرۈڭ"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold">
                    كلمة المرور <span className="text-[10px] text-slate-400 font-normal">(Password)</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 tracking-wider font-mono">
                    {password}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="px-2 py-1 bg-white border border-teal-200 text-teal-700 rounded-lg text-xs font-bold shadow-xs group-hover:border-teal-300 flex items-center gap-1 shrink-0"
              >
                {copiedField === 'password' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                    <span>كۆچۈرۈلدى</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>كۆچۈرۈش</span>
                  </>
                )}
              </button>
            </div>

            {/* Validity */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-semibold">
                  صلاحية البطاقة <span className="text-[10px] text-slate-400 font-normal">(مۇددىتى)</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800">
                  {validity}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Card Type & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Card Type */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-emerald-900 text-white flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-semibold">
                  نوع البطاقة <span className="text-[10px] text-slate-400 font-normal">(تۈرى)</span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {packageTitle}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-amber-200 bg-amber-50/60">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                $
              </div>
              <div>
                <div className="text-[11px] text-amber-900 font-semibold">
                  السعر <span className="text-[10px] text-amber-700 font-normal">(باھاسى)</span>
                </div>
                <div className="text-base sm:text-lg font-black text-amber-700">
                  {priceDisplay}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Bar */}
        <div className="px-4 sm:px-5 py-3 bg-[#064e3b] text-white flex items-center justify-between text-xs font-semibold relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-36 bg-amber-500 transform -skew-x-12 translate-x-16 pointer-events-none opacity-90" />

          <div className="flex items-center gap-2 relative z-10">
            <span className="text-emerald-200 text-[11px] sm:text-xs">🏪 AUTO CASH — دۇكىنىڭىزدىن كارتىڭىز</span>
          </div>

          <div className="relative z-10 font-mono font-bold text-amber-300 tracking-wider text-xs sm:text-sm">
            رقم البطاقة: {cardNumber}
          </div>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => handleCopy(username, 'username', 'اسم المستخدم (نومۇرى)')}
          className="w-full py-3 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <User className="w-4 h-4 shrink-0" />
          <span>👤 نومۇرنى كۆچۈرۈش</span>
        </button>

        <button
          type="button"
          onClick={() => handleCopy(password, 'password', 'كلمة المرور (پارولى)')}
          className="w-full py-3 px-3 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <Lock className="w-4 h-4 shrink-0" />
          <span>🔑 پارولنى كۆچۈرۈش</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadImage}
          className="w-full py-3 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>📥 رەسىم قىلىپ ساقلاش</span>
        </button>
      </div>
    </div>
  );
}
