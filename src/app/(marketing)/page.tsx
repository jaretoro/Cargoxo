import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, formatNaira, yearlySavingsPercent } from "@/lib/pricing";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  EXPORTER: "/dashboard/exporter",
  LOGISTICS: "/dashboard/logistics",
};

const STEPS = [
  {
    title: "Register",
    icon: "user" as const,
    exporter: "Sign up free and browse every listed agent.",
    logistics: "List your company with your ANCLA number and business details.",
  },
  {
    title: "Get verified",
    icon: "shield" as const,
    exporter: "Filter to agents an admin has already checked.",
    logistics: "We review your ANCLA number before you appear as verified.",
  },
  {
    title: "Connect",
    icon: "chat" as const,
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

function StepIcon({ name }: { name: "user" | "shield" | "chat" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true } as const;
  if (name === "user") {
    return (
      <svg {...common} strokeLinecap="round">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20c0-4 3.4-7 7.5-7s7.5 3 7.5 7" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg {...common} strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.5-3 8.3-7 9.5-4-1.2-7-5-7-9.5V6z" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common} strokeLinejoin="round">
      <path d="M4 5h16v11H8l-4 4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();

  // Real marketplace numbers rather than invented social proof — if the
  // marketplace is small, the page says so honestly.
  const [verifiedAgents, locationRows, cargoTypeCount, routeCount] = await Promise.all([
    prisma.logisticsProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.logisticsProfile.findMany({
      where: { verificationStatus: "VERIFIED" },
      select: { location: true },
      distinct: ["location"],
    }),
    prisma.cargoType.count(),
    prisma.tradeRoute.count(),
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
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-navy to-[#123a63] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-sky" />
            Built for Nigeria&apos;s export trade
          </span>

          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Where Nigerian exporters meet verified logistics companies
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
            Find a vetted cargo agent for your shipment, or list your logistics company for
            exporters to find. Every agent is checked by an admin before they appear as verified.
          </p>

          {/* A logged-in visitor doesn't need sign-up CTAs — send them to
              their own dashboard instead of back through registration. */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {dashboardHref ? (
              <>
                <Link
                  href={dashboardHref}
                  className="rounded-md bg-brand-blue px-6 py-3 font-semibold text-white hover:bg-white hover:text-brand-navy"
                >
                  Go to my dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-md border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white hover:text-brand-navy"
                >
                  See pricing
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-md bg-brand-blue px-6 py-3 font-semibold text-white hover:bg-white hover:text-brand-navy"
                >
                  I&apos;m an exporter
                </Link>
                <Link
                  href="/register/logistics"
                  className="rounded-md border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white hover:text-brand-navy"
                >
                  I run a logistics company
                </Link>
              </>
            )}
          </div>

          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-3xl font-bold">{s.value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wide text-white/60">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-brand-navy sm:text-3xl">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-500">
          The same three steps from either side of the shipment.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-sky/15 text-brand-blue">
                  <StepIcon name={step.icon} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Step {i + 1}</p>
                  <h3 className="font-semibold text-brand-navy">{step.title}</h3>
                </div>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Exporters</dt>
                  <dd className="mt-0.5 text-gray-600">{step.exporter}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Logistics</dt>
                  <dd className="mt-0.5 text-gray-600">{step.logistics}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / verification callout */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">Verified, not just listed</h2>
            <p className="mt-4 text-gray-600">
              Anyone can put up a website. On Cargoxo, a logistics company only carries the verified
              badge after an admin has reviewed their submission — so you aren&apos;t left guessing
              who is real.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Companies awaiting review still appear in search, clearly marked as pending, and
              can&apos;t be contacted until they pass.
            </p>
          </div>

          <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-brand-navy">What an admin checks</p>
            <ul className="mt-4 space-y-3">
              {VERIFICATION_CHECKS.map((check) => (
                <li key={check} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <CheckIcon />
                  {check}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-brand-navy sm:text-3xl">Simple pricing for exporters</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-500">
          Browsing and registering are free. A subscription unlocks agent contact details and
          messaging. Logistics companies list for free.
        </p>

        <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
          {Object.values(PLANS).map((plan) => (
            <div key={plan.id} className="rounded-xl border border-black/5 bg-white p-6 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{plan.label}</p>
                {plan.id === "YEARLY" && savings > 0 && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Save {savings}%
                  </span>
                )}
              </div>
              <p className="mt-2 text-3xl font-bold text-brand-navy">
                ${plan.usd}
                <span className="text-sm font-normal text-gray-400">/{plan.interval}</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">≈ {formatNaira(plan.usd)} · billed in USD via Stripe</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-block rounded-md bg-brand-navy px-6 py-3 font-semibold text-white hover:bg-brand-blue"
          >
            See full pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
