# Cargoxo

A marketplace connecting Nigerian exporters with verified Nigerian logistics
companies (cargo agents). Exporters browse and connect with agents who've
passed admin verification; logistics companies register with their ANCLA
number and wait for approval; an admin portal manages both.

This is a **working demo/prototype**: every code path is real (real
database, real auth, real Stripe/OpenAI integration code), but it ships with
seeded sample data and placeholder API keys. Swap in real Stripe/OpenAI keys
(see [Configuration](#configuration)) to make billing and the chatbot fully
live.

## Quick start

```bash
npm install
npx prisma generate
npx prisma db push      # creates prisma/dev.db from the schema
npm run db:seed         # loads sample accounts (see below)
npm run dev
```

Open http://localhost:3000. Every seeded account uses the password
`Cargoxo123!`:

| Email | Role | Notes |
|---|---|---|
| `admin@cargoxo.com` | Admin | manages users + verification queue |
| `exporter@cargoxo.com` | Exporter | **has** an active subscription — sees full contact details |
| `exporter2@cargoxo.com` | Exporter | **no** subscription — sees the blurred/locked view |
| `swiftcargo@cargoxo.com` | Logistics | already **VERIFIED** |
| `portlinkfreight@cargoxo.com` | Logistics | already **VERIFIED** |
| `newagentco@cargoxo.com` | Logistics | **PENDING** — approve it from `/admin/logistics` to see it appear in exporter search |

To reset the database back to this seeded state at any point: delete
`prisma/dev.db` and re-run `npx prisma db push && npm run db:seed`.

## How the app is put together

**Stack:** Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS +
Prisma/SQLite + Auth.js (NextAuth v5) + Stripe + OpenAI.

> Next.js 16 is very new and changed some conventions since Next 14/15 —
> notably `middleware.ts` is now `proxy.ts` (same idea, renamed, and it now
> always runs on Node.js rather than the edge runtime). If you're used to
> older Next.js docs/tutorials, some filenames and APIs here will look
> different on purpose, not by mistake.

### Folder map

```
prisma/schema.prisma        the entire data model — read this first
prisma/seed.ts               sample data (see table above)
src/auth.ts                  Auth.js config: email/password login, JWT sessions
src/auth.config.ts           the subset of auth config safe to run in proxy.ts
src/proxy.ts                 route guard: redirects unauthenticated/wrong-role
                              users away from /admin and /dashboard/* before
                              the page even renders
src/lib/                     shared server-side helpers (db client, Stripe
                              client, OpenAI client, pricing constants, zod
                              validation schemas)
src/app/actions/             Server Actions — the actual mutations (login,
                              register, connect, verify, billing). Forms call
                              these directly instead of hitting a JSON API.
src/app/api/                 the 3 things that have to be a real HTTP route:
                              NextAuth's own handler, the Stripe webhook
                              (Stripe posts here directly), and /api/chat
                              (called from the browser via fetch)
src/app/(pages)/             one folder per route, matching the URL
src/components/              shared UI: Navbar, Footer, ChatWidget, forms
```

### Why Server Actions instead of a JSON API

Next.js's own docs (bundled in `node_modules/next/dist/docs/`, which is the
version-matched reference — worth checking directly if something here seems
off) push Server Actions as the default way to handle form submissions in
the App Router: a form's `action` prop points straight at an async function
that runs on the server, so there's no hand-written `fetch` + JSON
boilerplate, and it still works without JavaScript. That's what
`src/app/actions/*.ts` are — `registerExporterAction`, `createCheckoutAction`,
`verifyLogisticsAction`, etc. Each one re-checks the caller's session and
role itself (never trust the UI alone — someone could POST directly to the
action), so treat them as the real security boundary, not the page that
renders the form.

### Two layers of access control

1. **`src/proxy.ts`** — runs before any `/admin` or `/dashboard/*` page
   renders, and redirects to `/login` if the session's role doesn't match.
   This is just a fast, optimistic check on the JWT (per Next.js's own
   authentication guide, proxy/middleware should never be the *only* check).
2. **Every page and Server Action re-checks `auth()` itself** — e.g.
   `src/app/dashboard/exporter/page.tsx` calls `auth()` and verifies
   `role === "EXPORTER"` again, and `createConnectionAction` re-checks that
   the exporter has an `ACTIVE` subscription before letting a connection
   request through. This is the actual security boundary; proxy is just a
   UX shortcut on top of it.

### The subscription paywall

Exporters register for free but need `Subscription.status === "ACTIVE"` to
see logistics companies' real contact details and send connection requests
(`src/app/dashboard/exporter/page.tsx` — search for `isSubscribed`).
Logistics companies register and get verified for free; there's no
logistics-side subscription in this version. `Subscription` rows are only
ever written by the Stripe webhook (`src/app/api/stripe/webhook/route.ts`)
— never by the checkout redirect itself — so a user can't fake an active
subscription by just hitting the success URL without actually paying.

### Verification queue

A logistics company's `LogisticsProfile.verificationStatus` starts as
`PENDING` at registration. It only shows up in exporter search results once
an admin flips it to `VERIFIED` from `/admin/logistics`
(`verifyLogisticsAction` in `src/app/actions/admin.ts`).

## Configuration

Copy `.env.example` → `.env` if you haven't already (a working `.env` with
safe local defaults is already checked in for this demo — everything except
Stripe and OpenAI works out of the box).

**Stripe** (`src/lib/stripe.ts`, `src/app/actions/billing.ts`,
`src/app/api/stripe/webhook/route.ts`):
1. Create two recurring Prices in your Stripe dashboard (test mode is fine)
   — $5/month and $60/year — and put their IDs in `STRIPE_PRICE_MONTHLY` /
   `STRIPE_PRICE_YEARLY`.
2. Put your secret key in `STRIPE_SECRET_KEY`.
3. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   locally, and put the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.
   Without this, checkout will redirect correctly but the subscription will
   never actually flip to `ACTIVE` in the database, since that only happens
   via the webhook.
4. `NEXT_PUBLIC_NGN_PER_USD` controls the Naira-equivalent figure shown on
   `/pricing` — it's a display-only estimate (Stripe still charges USD).

**OpenAI** (`src/lib/openai.ts`, `src/app/api/chat/route.ts`): put a real
key in `OPENAI_API_KEY`. Until then, the chat widget stays fully functional
but replies with a fixed "not connected yet" message instead of erroring.

## Useful commands

```bash
npm run dev          # start the dev server (Turbopack)
npm run build         # production build — also the fastest way to
                       # type-check every route at once
npx prisma studio      # browse/edit the database in a GUI
npm run db:seed        # re-run the seed script (safe to re-run, it upserts)
```

## Logo

`src/components/Logo.tsx` is a hand-built SVG stand-in for the Cargoxo mark
(globe + plane, navy/sky-blue) — the original artwork was only shared as a
chat image, not a file this project could read from disk. Drop a real
exported file at `public/logo.png` (or `.svg`) and swap the `<Mark />`
usage in that component for an `<Image>`/`<img>` if you want the exact
original logo everywhere.
