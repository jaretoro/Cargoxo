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
cp .env.example .env
docker compose up -d    # local Postgres (or point DATABASE_URL at any Postgres)
npm install
npx prisma generate
npx prisma migrate deploy   # applies prisma/migrations
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
| `exporter3@cargoxo.com` | Exporter | subscribed (monthly) — extra data for the admin charts |
| `exporter4@cargoxo.com` | Exporter | subscribed (yearly) — extra data for the admin charts |
| `swiftcargo@cargoxo.com` | Logistics | already **VERIFIED** |
| `portlinkfreight@cargoxo.com` | Logistics | already **VERIFIED** |
| `newagentco@cargoxo.com` | Logistics | **PENDING** — approve it from `/admin/logistics` |

The seed also creates six more verified logistics companies (SeaLink,
NigerDelta, Kano Northern, Atlantic, Onne Port, Ogun State) so search,
filtering and sorting have something real to work against. Some carry an
active subscription, which is what renders the "Premium Yearly Member" /
"Monthly Member" badge on their card.

Those one-click buttons on `/login` only appear when `NEXT_PUBLIC_DEMO_MODE`
is `"true"` **and** the build isn't production — they sign in as seeded
accounts (including admin) with a publicly known password, so they must
never be enabled on a real deployment.

To reset the local database back to this seeded state at any point:
`npx prisma migrate reset` (drops everything, re-applies migrations and
re-seeds). Never run that against production.

## How the app is put together

**Stack:** Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS +
Prisma/PostgreSQL + Auth.js (NextAuth v5) + Stripe + OpenAI.

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
src/app/(marketing)/         public site — home, pricing, login, register.
                              A route group, so it supplies the Navbar and
                              Footer itself without imposing them on /admin
                              or /dashboard. Route groups don't affect URLs.
src/app/admin/               admin portal — its own sidebar shell, with
                              overview, verifications, users, subscriptions,
                              analytics, notifications
src/app/dashboard/           the two logged-in dashboards, exporter and
                              logistics, each with their own layout
src/components/              shared UI: Navbar, Footer, ChatWidget, forms,
                              AgentCard, admin sidebar/charts
```

Because the root layout is deliberately bare, each section owns its own
chrome. That's why `/admin` can have a full dark sidebar without the
marketing header sitting above it.

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
`PENDING` at registration, and an admin flips it to `VERIFIED` or `REJECTED`
from `/admin/logistics` (`verifyLogisticsAction` in
`src/app/actions/admin.ts`).

Search shows both `VERIFIED` and `PENDING` companies, with a badge marking
which is which, and a "Verified Only" toggle to hide the pending ones.
`REJECTED` companies never appear. Being verified is what unlocks
*contact*, not visibility: a `PENDING` company can't be messaged or called,
and `startConversationAction` re-checks that server-side rather than relying
on the card hiding the button.

### Company profiles

Registration collects only the essentials (company name, ANCLA number,
address, location). Everything else on a marketplace card — cargo types,
trade routes, year established — is filled in afterwards at
`/dashboard/logistics/profile`. A listing with no cargo types or routes is
effectively unfindable, since exporters filter on exactly those, so the
logistics dashboard nags about it until they're set.

The ANCLA number isn't editable there: verification was granted against that
specific number, so changing it needs an admin. Shipment counts aren't
self-service either — a company vouching for its own volume would be a claim
rather than a fact.

### Messaging, saved agents and reviews

A `Connection` doubles as the message thread between the two parties. An
exporter opens one from an agent's card, and both sides can then reply from
`/dashboard/exporter/messages` and `/dashboard/logistics/messages`, with
unread counts driven by `Message.readAt`. Exporters can also bookmark
companies (the "Saved" tab) — bookmarking is free, since it reveals nothing.

Ratings are aggregated from `Review` rows on every read rather than cached on
the profile, so a displayed rating can't drift from its underlying reviews.
There's no UI to *write* a review yet, so outside the seeded data every
company shows "No reviews yet".

## Configuration

Copy `.env.example` → `.env` (`.env` is gitignored). With the local Postgres
from `docker-compose.yml`, everything except Stripe and OpenAI works out of
the box.

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

The chat widget sits on the public marketing pages so prospects can ask
questions before signing up, which means the endpoint behind it can't
require a login and *anyone* who finds it is spending your OpenAI credit. It
defends itself with per-IP rate limiting, caps on message count and total
characters, a `max_tokens` ceiling per call, and a daily cap across all
visitors (`CHAT_DAILY_LIMIT`, default 2000 replies) as a hard ceiling on
spend. The limiter (`src/lib/rate-limit.ts`) keeps its counters in the
`RateLimit` table, so limits survive restarts and are shared by every
instance — no Redis needed. Set `CLIENT_IP_HEADER` to the header your host
fills with the real client IP; without it the per-IP limit trusts
`X-Forwarded-For`, which a client can fake.

**Demo mode** (`NEXT_PUBLIC_DEMO_MODE`): enables the one-click login buttons
on `/login`. Leave it `"false"` anywhere real — see the note under Quick
start.

**Email** (`EMAIL_FROM`, `SMTP_URL`): with both unset, mail is printed to the
server log instead of sent, which is enough to click through password reset
locally — copy the link out of the terminal. Set both and `src/lib/mail.ts`
sends over SMTP via nodemailer, so any SMTP provider works. Set them before
going live, since reset links are useless if they can't be delivered.

### Password reset

`/forgot-password` issues a link; `/reset-password?token=…` consumes it. The
security properties are deliberate, so don't loosen them casually: only a
SHA-256 hash of the token is stored (a database dump can't be used to take
over accounts), links expire after an hour and work exactly once, resetting
burns every other outstanding link for that account, requests are capped at
three per address per fifteen minutes, and the response is identical whether
or not the email is registered — as is the login error — so neither can be
used to discover who has an account.

One caveat: sessions are JWTs, so a reset does not sign out devices that are
already logged in. Those sessions run until the token expires.

## Known gaps

Worth knowing before you rely on any of it:

- **Email only covers password reset.** `src/lib/mail.ts` can send over SMTP
  once configured, but nobody is told they were verified, rejected, or
  messaged.
- **Verification has no evidence attached.** The admin sees a typed ANCLA
  number and address, with no document upload or registry lookup to check
  against, which is thin for the trust signal the product is sold on.
- **No profile editing for exporters.**
- **No tests.**
- Rejected companies get told to "contact support", but there's no support
  contact and no way to re-submit.

## Deploying (DigitalOcean App Platform + Managed PostgreSQL)

- Build command `npm run build` (generates the Prisma client first); run
  command `npm start`.
- Run `npm run db:migrate` against the production database on each deploy
  (a pre-deploy job, or manually from your machine with the production
  `DATABASE_URL`). Do **not** run the seed there.
- Set every variable from `.env.example` as an App Platform environment
  variable: a fresh `AUTH_SECRET`, `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`
  set to your domain, live Stripe keys, `NEXT_PUBLIC_DEMO_MODE=false`, and
  `EMAIL_FROM` / `SMTP_URL`.
- In Stripe, add a webhook endpoint at `https://<your-domain>/api/stripe/webhook`
  and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
- Set `CLIENT_IP_HEADER=do-connecting-ip` so the chat's per-IP limit sees
  the real visitor address. The limiter is database-backed, so running more
  than one app instance is fine.
- You'll need an admin account: the seed isn't run in production, so create
  one deliberately (register, then promote the row's `role` to `ADMIN`).

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
