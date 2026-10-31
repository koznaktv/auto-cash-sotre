'use client';

import React from 'react';

export default function CyberFeatures() {
  const features = [
    {
      icon: 'fas fa-bolt',
      color: '#00f2fe',
      border: 'rgba(0, 242, 254, 0.3)',
      bg: 'rgba(0, 242, 254, 0.1)',
      title: '24/7 ئاپتوماتىك قاچىلاش',
      desc: 'ئادەم كۈچى ساقلاپ ئولتۇرمايدۇ، زاكاز تەستىقلانغان ھامان دەرھال ھېساباتىڭىزغا كىرىدۇ.',
    },
    {
      icon: 'fas fa-shield-alt',
      color: '#ffb703',
      border: 'rgba(255, 183, 3, 0.35)',
      bg: 'rgba(255, 183, 3, 0.1)',
      title: '100% بىخەتەر ۋە مەخپىي',
      desc: 'SSL 256-bit دەرىجىلىك مەخپىيلەشتۈرۈش ئارقىلىق پۇل تۆلەش ۋە شەخسىي ئۇچۇرلىرىڭىز تولۇق قوغدىلىدۇ.',
    },
    {
      icon: 'fas fa-tags',
      color: '#9d4edd',
      border: 'rgba(157, 78, 221, 0.35)',
      bg: 'rgba(157, 78, 221, 0.1)',
      title: 'ئەڭ ئەرزان ئورگان باھاسى',
      desc: 'بىۋاسىتە ئورگان ۋە زاۋۇت كېلىشىملىرى ئارقىلىق ئەڭ ئەرزان توپ سېتىش باھاسىدا تەمىنلىنىدۇ.',
    },
    {
      icon: 'fab fa-telegram-plane',
      color: '#229ed9',
      border: 'rgba(34, 158, 217, 0.35)',
      bg: 'rgba(34, 158, 217, 0.1)',
      title: 'بىۋاسىتە خېرىدارلار مۇلازىمىتى',
      desc: 'ھەر قانداق سوئال ياكى قىيىنچىلىقلارغا توربەت ۋە تېلېگرامما ئارقىلىق كەسپىي مۇلازىمەت خادىملىرىمىز دەرھال جاۋاب بېرىدۇ.',
    },
  ];

  return (
    <div className="w-full my-8 px-2">
      <div className="text-center mb-6">
        <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
          TRUST & SECURITY
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          نېمىشقا بىزنىڭ سىستېمىنى تاللايسىز؟
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          ئەڭ يېڭى پەن-تېخنىكىلىق بىخەتەر كېلىشىملەر بىلەن رەقەملىك ماللىرىڭىز بىر سېكۇنتتىمۇ زايە بولمايدۇ.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#091126]/80 border border-white/10 hover:border-cyan-400/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,242,254,0.15)] flex flex-col items-center text-center group"
          >
            <div
              className="w-13 h-13 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-inner transition-transform group-hover:scale-110"
              style={{
                backgroundColor: item.bg,
                borderColor: item.border,
                borderWidth: '1px',
                color: item.color,
              }}
            >
              <i className={item.icon} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
