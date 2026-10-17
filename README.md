# AUTO CASH — Digital Services & Game Top-Up Store

Next.js 14 storefront for game top-ups, app coins, gift cards and other digital services, in Uyghur, Arabic and English. Products are imported from a reseller API (sahl-cash.com / syria4game.com — same API family) and orders are fulfilled automatically. Buyers pay from an internal wallet funded by Sham Cash deposits that an admin approves.

## Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (Postgres) in production; a local JSON file fallback for development
- Vercel hosting + Vercel Cron

## How it works
- **Auth** — httpOnly HMAC-signed session cookie (`src/lib/session.ts`); Google sign-in via Supabase Auth, verified server-side in `/api/auth/oauth-sync`.
- **Admin** — PIN login (`ADMIN_PIN`), rate limited, HMAC admin token (`src/lib/adminAuth.ts`).
- **Money** — wallet debits, refunds, deposit approvals and balance edits run in atomic Postgres functions (`supabase_schema.sql`), callable only by the service role.
- **Catalog** — `src/lib/catalog/*`: the provider catalog is synced into Supabase, mapped to 9 storefront categories, priced at provider cost + markup %. Admin overrides (category mapping, hiding, per-item markup, custom checkout fields) survive re-syncs.
- **Orders** — `src/lib/provider/purchase.ts`: validate inputs → live price check → atomic charge → provider order → completed / pending (polled) / refunded. Unclear provider answers are kept for review, never auto-refunded.
- **Polling** — `src/lib/provider/orderPoller.ts` (provider has no webhooks), via `/api/cron/poll-orders`.

## Setup
```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000, admin at /admin
```

### Environment variables
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project (browser: Google sign-in) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server access to all tables (required in production) |
| `SESSION_SECRET`, `ADMIN_SECRET` | Two different random strings, 32+ characters (required in production) |
| `ADMIN_PIN` | Admin panel PIN (8+ characters; the old default is refused in production) |
| `SYRIA4GAME_BASE_URL` | Provider API base, e.g. `https://api.sahl-cash.com` |
| `SYRIA4GAME_API_TOKEN` | Provider API token (account menu → API) |
| `CRON_SECRET` | 16+ characters; sent by Vercel Cron as `Authorization: Bearer …` |

Generate secrets with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### Database
Run `supabase_schema.sql` in the Supabase SQL editor (safe to re-run). On Vercel Hobby, cron runs once a day: schedule order polling every 2 minutes with the `pg_cron` snippet in section 10 of the schema.

### Going live with the provider catalog
Admin panel → **تاشقى API** tab: *Sync now* → map unmapped categories → set markup % → place one test order → switch the storefront to the provider catalog.

## Scripts
```bash
npm test                          # unit tests (vitest)
npm run build && npm start        # production build
node scripts/mock-syria4game.mjs  # local mock of the provider API for end-to-end tests
```
