# AUTO CASH — ئىشلىتىش ۋە ئېلان قىلىش قوللانمىسى

بۇ تۈر Next.js 14، TypeScript ۋە Tailwind CSS ئاساسىدا ئىشلەنگەن رەقەملىك مۇلازىمەت ۋە ئويۇنغا پۇل قاچىلاش سۇپىسى. مەھسۇلاتلار sahl-cash.com (ياكى syria4game.com) دىن ئاپتوماتىك ئەكىرىلىدۇ، زاكازلارمۇ ئاپتوماتىك ئورۇندىلىدۇ.

---

## 🚀 1. كومپيۇتېردا ئىجرا قىلىش

كومپيۇتېرىڭىزدا Node.js (v18 ياكى ئۇنىڭدىن يۇقىرى) بولۇشى كېرەك.

```bash
npm install                  # بوغچىلارنى قاچىلاش
cp .env.example .env.local   # ئاندىن .env.local دىكى قىممەتلەرنى تولدۇرۇڭ
npm run dev                  # http://localhost:3000
```

- باش بەت: http://localhost:3000
- باشقۇرغۇچى بېتى: http://localhost:3000/admin (شىفىرى `ADMIN_PIN` دا بېكىتىلىدۇ)

---

## 🔐 2. مۇھىت ئۆزگەرگۈچىلىرى (Vercel → Settings → Environment Variables)

| ئىسىم | نېمە ئۈچۈن |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` ، `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase تۈرى (Google بىلەن كىرىش) |
| `SUPABASE_SERVICE_ROLE_KEY` | سېرۋېرنىڭ ساندانغا كىرىشى (مەجبۇرىي) |
| `SESSION_SECRET` ، `ADMIN_SECRET` | ئىككى خىل، ھەر بىرى 32+ ھەرپلىك ئىختىيارىي مەخپىي سۆز (مەجبۇرىي) |
| `ADMIN_PIN` | باشقۇرغۇچى شىفىرى (كەم دېگەندە 8 ھەرپ) |
| `SYRIA4GAME_BASE_URL` | تەمىنلىگۈچى ئادرېسى: `https://api.sahl-cash.com` |
| `SYRIA4GAME_API_TOKEN` | تەمىنلىگۈچى API ئاچقۇچى |
| `CRON_SECRET` | 16+ ھەرپلىك مەخپىي سۆز (ۋاقىتلىق ۋەزىپىلەر ئۈچۈن) |

مەخپىي سۆز ھاسىل قىلىش:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

⚠️ ئاچقۇچ ۋە مەخپىي سۆزلەرنى ھەرگىز GitHub قا يۈكلىمەڭ. `.env.local` ھۆججىتى GitHub قا چىقمايدۇ.

---

## 🗄️ 3. ساندان (Supabase)

1. Supabase تا تۈر قۇرۇڭ.
2. SQL Editor دا `supabase_schema.sql` نى ئىجرا قىلىڭ (قايتا ئىجرا قىلسىمۇ بولىدۇ).
3. Vercel نىڭ ھەقسىز پىلانىدا ۋاقىتلىق ۋەزىپە كۈندە بىرلا قېتىم ئىجرا بولىدۇ. زاكاز ھالىتىنى ھەر 2 مىنۇتتا تەكشۈرۈش ئۈچۈن ھۆججەتنىڭ 10-بۆلىكىدىكى `pg_cron` كودىنى ئىجرا قىلىڭ.

---

## 🛒 4. تەمىنلىگۈچى تىزىملىكىنى ئىشقا كىرگۈزۈش

باشقۇرغۇچى بېتى ← «تاشقى API» بەتكۈچى:
1. «ھازىر Sync قىلىش» نى بېسىڭ.
2. «بەلگىلەنمىگەن» سەھىپىلەرنى ماس سەھىپىگە تاللاڭ، لازىمسىزلىرىنى يوشۇرۇڭ.
3. پايدا پىرسەنتىنى بېكىتىڭ (دەسلەپتە 15%).
4. ئەڭ ئەرزان بىر مەھسۇلاتنى سىناپ سېتىۋېلىڭ.
5. «syria4game (ئاپتوماتىك)» تىزىملىكىگە ئالماشتۇرۇڭ.

تەمىنلىگۈچى ھېساباتىڭىزدا يېتەرلىك قالدۇق بولۇشى كېرەك، بولمىسا زاكازلار ئورۇندالماي، خېرىدارنىڭ پۇلى قايتۇرۇلىدۇ.

---

## 📁 5. مۇھىم ھۆججەتلەر

- `src/lib/session.ts` — ئىشلەتكۈچى سېئانسى (بىخەتەر cookie)
- `src/lib/adminAuth.ts` — باشقۇرغۇچى كىرىشى
- `src/lib/db.ts` — ئىشلەتكۈچى، زاكاز، پۇل كىرگۈزۈش (Supabase ياكى يەرلىك ھۆججەت)
- `src/lib/providers/syria4game.ts` — تەمىنلىگۈچى API ئۇلىنىشى
- `src/lib/catalog/` — مەھسۇلات تىزىملىكى، باھا ۋە سەھىپە ماسلاشتۇرۇش
- `src/lib/provider/purchase.ts` — سېتىۋېلىش جەريانى
- `src/lib/provider/orderPoller.ts` — زاكاز ھالىتىنى ئاپتوماتىك تەكشۈرۈش
- `supabase_schema.sql` — ساندان جەدۋەللىرى ۋە بىخەتەر پۇل فۇنكسىيەلىرى

---

## 🧪 6. سىناق

```bash
npm test                          # ئىچكى سىناقلار
npm run build                     # ئېلان قىلىش نەشرىنى قۇرۇش
node scripts/mock-syria4game.mjs  # پۇل خەجلىمەي سىناش ئۈچۈن ساختا تەمىنلىگۈچى
```


---

## 🤖 7. تېلېگرام سەپلىمىلىرى (Telegram Integrations)

- **رەسمىي تېلېگرام دۇكان بوتى:** [@Autocash_store_bot](https://t.me/Autocash_store_bot)
- **رەسمىي تېلېگرام قانىلى:** [@autocash_cannel](https://t.me/autocash_cannel)
- **تېلېگرام خېرىدارلار مۇلازىمىتى:** [@autocash_UYGHUR](https://t.me/autocash_UYGHUR)
- **باشقۇرغۇچى تېلېگرام ھېسابلىرى (Admins):** 
  - [@nasrulla0996](https://t.me/nasrulla0996) (ID: `7575664493`)
  - [@autochah_UYGHUR](https://t.me/autochah_UYGHUR) (ۋە [@autocash_UYGHUR](https://t.me/autocash_UYGHUR))
- **سەپلىمە ھۆججىتى:** `src/lib/telegram.ts` ۋە `.env.local` (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`)
