import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, formatNaira, yearlySavingsPercent } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  EXPORTER: "/dashboard/exporter",
  LOGISTICS: "/dashboard/logistics",
};

const STEPS = [
  {
    num: "01",
    title: "Register",
    exporter: "Sign up free and browse every listed agent.",
    logistics: "List your company with your ANCLA number and business details.",
  },
  {
    num: "02",
    title: "Get verified",
    exporter: "Filter to agents an admin has already checked.",
    logistics: "We review your ANCLA number before you appear as verified.",
  },
  {
    num: "03",
    title: "Connect",
    exporter: "Search by state and cargo type, then message an agent directly.",
    logistics: "Reply to exporters and win the shipment.",
  },
];

// What an admin actually checks before a company is marked verified — the
// specific list matters more than a paragraph saying "we verify".
const VERIFICATION_CHECKS = [
  "ANCLA registration number",
  "Registered business address",
  "Operating state and contact details",
  "Company name against the submitted registration",
];

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0"
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();

  // Real marketplace numbers rather than invented social proof — if the
  // marketplace is small, the page says so honestly.
  const [verifiedAgents, locationRows, cargoTypeCount, routeCount, settings] = await Promise.all([
    prisma.logisticsProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.logisticsProfile.findMany({
      where: { verificationStatus: "VERIFIED" },
      select: { location: true },
      distinct: ["location"],
    }),
    prisma.cargoType.count(),
    prisma.tradeRoute.count(),
    getSettings(),
  ]);

  const stats = [
    { value: verifiedAgents, label: verifiedAgents === 1 ? "Verified agent" : "Verified agents" },
    { value: locationRows.length, label: locationRows.length === 1 ? "State covered" : "States covered" },
    { value: cargoTypeCount, label: "Cargo types" },
    { value: routeCount, label: routeCount === 1 ? "Trade lane" : "Trade lanes" },
  ];

  const savings = yearlySavingsPercent();
  const dashboardHref = session?.user ? DASHBOARD_BY_ROLE[session.user.role] ?? "/dashboard" : null;

  return (
    <div>
      {/* Hero — left-aligned on the paper ground, with the marketplace
          figures set as a ledger down the right rather than a stat row.
          The dark ink surface is saved for the verification section below,
          where the contrast means something. */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="eyebrow text-ochre">Built for Nigeria&apos;s export trade</p>

            <h1 className="mt-6 text-5xl font-semibold leading-[0.98] text-ink sm:text-6xl lg:text-[76px]">
              Where Nigerian exporters meet verified logistics companies
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-soft">
              Find a vetted cargo agent for your shipment, or list your logistics company for
              exporters to find. Every agent is checked by an admin before they appear as verified.
            </p>

            {/* A logged-in visitor doesn't need sign-up CTAs — send them to
                their own dashboard instead of back through registration. */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {dashboardHref ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="bg-ink px-8 py-4 font-semibold text-paper hover:bg-ink-hover"
                  >
                    Go to my dashboard
                  </Link>
                  <Link
                    href="/pricing"
                    className="border border-ink px-8 py-4 font-semibold text-ink hover:bg-paper-deep"
                  >
                    See pricing
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="bg-ink px-8 py-4 font-semibold text-paper hover:bg-ink-hover"
                  >
                    I&apos;m an exporter
                  </Link>
                  <Link
                    href="/register/logistics"
                    className="border border-ink px-8 py-4 font-semibold text-ink hover:bg-paper-deep"
                  >
                    I run a logistics company
                  </Link>
                </>
              )}
            </div>
          </div>

          <dl className="lg:col-span-4 lg:col-start-9">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between border-b border-rule py-5">
                <dt className="text-sm uppercase tracking-[0.1em] text-muted">{s.label}</dt>
                <dd className="font-display text-4xl font-semibold leading-none text-ink">{s.value}</dd>
              </div>
            ))}
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Live marketplace figures, counted from the register.
            </p>
          </dl>
        </div>
      </section>

      {/* How it works — three columns divided by rules, not three cards. */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-6">
          <h2 className="text-3xl font-semibold text-ink sm:text-4xl">How it works</h2>
          <p className="text-sm text-muted">The same three steps from either side of the shipment.</p>
        </div>

        <div className="grid sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className={`py-9 sm:px-8 ${i === 0 ? "sm:pl-0" : ""} ${
                i < STEPS.length - 1 ? "border-b border-rule sm:border-b-0 sm:border-r" : ""
              }`}
            >
              <div className="flex items-baseline gap-4">
                <span className="font-display text-3xl font-semibold text-ochre">{step.num}</span>
                <h3 className="text-2xl font-semibold text-ink">{step.title}</h3>
              </div>

              <dl>
                <dt className="eyebrow mt-6 text-ochre">Exporters</dt>
                <dd className="mt-2 leading-relaxed text-ink-soft">{step.exporter}</dd>
                <dt className="eyebrow mt-5 text-muted">Logistics</dt>
                <dd className="mt-2 leading-relaxed text-ink-soft">{step.logistics}</dd>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* Verification — the one ink block on the page. */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 bg-ink px-8 py-14 text-on-ink sm:px-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <p className="eyebrow text-ochre-soft">What verification means</p>
            <h2 className="mt-6 text-3xl font-semibold leading-tight text-paper sm:text-4xl">
              An admin checks every company by hand
            </h2>
            <p className="mt-6 leading-relaxed text-on-ink-muted">
              Anyone can put up a website. A logistics company only carries the badge after an
              admin has reviewed their submission, so you aren&apos;t left guessing who is real.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-on-ink-muted">
              Companies awaiting review still appear in search, clearly marked as pending, and
              can&apos;t be contacted until they pass.
            </p>
          </div>

          <ul className="lg:col-span-6 lg:col-start-7">
            {VERIFICATION_CHECKS.map((check) => (
              <li
                key={check}
                className="flex items-start gap-4 border-b border-rule-dark py-5 text-lg text-on-ink"
              >
                <span className="text-ochre-soft">
                  <CheckIcon />
                </span>
                {check}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing teaser — a ledger, matching the hero's stats. */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <p className="eyebrow text-ochre">Pricing</p>
            <h2 className="mt-6 text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Browsing is free. Contacting is what you pay for.
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-ink-soft">
              Register, search and bookmark without a card. A subscription unlocks phone numbers
              and lets you start a conversation. Logistics companies list for free.
            </p>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            {Object.values(PLANS).map((plan, i) => (
              <div
                key={plan.id}
                className={`flex items-baseline justify-between border-b border-rule py-6 ${
                  i === 0 ? "border-t-2 border-t-ink" : ""
                }`}
              >
                <div>
                  <p className="flex items-center gap-2 text-sm uppercase tracking-[0.1em] text-muted">
                    {plan.label}
                    {plan.id === "YEARLY" && savings > 0 && (
                      <span className="bg-ok-tint px-2 py-0.5 text-xs font-semibold tracking-normal text-ok">
                        Save {savings}%
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 text-sm text-muted">
                    ≈ {formatNaira(plan.usd, settings.ngnPerUsd)} / {plan.interval}
                  </p>
                </div>
                <span className="font-display text-5xl font-semibold leading-none text-ink">
                  ${plan.usd}
                </span>
              </div>
            ))}

            <Link
              href="/pricing"
              className="mt-7 inline-block bg-ink px-8 py-4 font-semibold text-paper hover:bg-ink-hover"
            >
              See what a subscription unlocks
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
