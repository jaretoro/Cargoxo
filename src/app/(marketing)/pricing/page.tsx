import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, formatNaira, yearlySavingsPercent } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { createCheckoutAction } from "@/app/actions/billing";
import { SubmitButton } from "@/components/SubmitButton";

// These two lists are the honest answer to "what am I paying for?", and they
// are kept split on purpose.
//
// The page used to advertise six paid features in a comparison table. Three
// of them — browsing listings, the AI assistant, and (as written) seeing
// companies at all — are free to everyone; one, "priority placement when
// agents review requests", did not exist anywhere in the code; and "full
// contact details (name, phone, email, address)" over-promised, since only
// the phone number is ever revealed.
//
// Anything added to PAID must correspond to a real server-side check. Today
// there is exactly one: startConversationAction requires an ACTIVE
// subscription, and AgentCard only renders a tel: link when subscribed.
const PAID = [
  "Phone numbers for every verified company",
  "Start conversations with verified agents",
  "Unlimited connection requests — no cap while your plan is active",
  "Cancel anytime from the Billing tab",
];

const FREE = [
  "Browse every listing, with ratings, cargo types and trade routes",
  "Filter by state, cargo type and verification status",
  "Bookmark companies to your Saved list",
  "Ask the Cargoxo assistant anything",
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default async function PricingPage(props: PageProps<"/pricing">) {
  const session = await auth();
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const canceled = searchParams.canceled === "1";

  const [subscription, settings] = await Promise.all([
    session?.user ? prisma.subscription.findUnique({ where: { userId: session.user.id } }) : null,
    getSettings(),
  ]);
  const currentPlan = subscription?.status === "ACTIVE" ? subscription.plan : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-navy sm:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-3 text-gray-600">
          Browsing Cargoxo is free. A subscription is what lets you contact the companies you
          find. Billed in USD via Stripe; Naira amounts are an approximate guide.
        </p>
      </div>

      {error && (
        <div className="mx-auto mt-6 max-w-lg rounded-md bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      )}
      {canceled && (
        <div className="mx-auto mt-6 max-w-lg rounded-md bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">
          Checkout was canceled — no charge was made.
        </div>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {(Object.values(PLANS)).map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-6 shadow-sm ${
              plan.id === "YEARLY" ? "border-brand-blue ring-1 ring-brand-blue" : "border-black/10"
            }`}
          >
            {/* Only advertise a discount when there actually is one. At the
                current prices ($5/mo, $60/yr) the yearly plan costs exactly
                12 months, so this would otherwise render "Save 0%". */}
            {plan.id === "YEARLY" && yearlySavingsPercent() > 0 && (
              <span className="absolute -top-3 left-6 rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold text-white">
                Save {yearlySavingsPercent()}%
              </span>
            )}
            <h2 className="text-lg font-semibold text-brand-navy">{plan.label}</h2>
            <p className="mt-2">
              <span className="text-4xl font-bold text-gray-900">${plan.usd}</span>
              <span className="text-gray-500">/{plan.interval}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">≈ {formatNaira(plan.usd, settings.ngnPerUsd)} / {plan.interval}</p>

            <form action={createCheckoutAction} className="mt-6">
              <input type="hidden" name="plan" value={plan.id} />
              {currentPlan === plan.id ? (
                <button type="button" disabled className="w-full rounded-md bg-gray-100 px-4 py-2.5 font-semibold text-gray-500">
                  Current plan
                </button>
              ) : (
                <SubmitButton
                  pendingLabel="Opening checkout…"
                  className={`w-full rounded-md px-4 py-2.5 font-semibold text-white ${
                    plan.id === "YEARLY" ? "bg-brand-blue hover:bg-brand-navy" : "bg-gray-800 hover:bg-brand-navy"
                  }`}
                >
                  Subscribe {plan.label.toLowerCase()}
                </SubmitButton>
              )}
            </form>
          </div>
        ))}
      </div>

      {/* Two plain lists rather than a Monthly-vs-Yearly comparison table.
          The table showed a tick in both columns on every row, so it invited
          a comparison and then showed no difference — and inventing a
          difference would bake in a plan structure that isn't settled. */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-blue/30 bg-brand-sky/5 p-6">
          <h2 className="font-semibold text-brand-navy">What a subscription unlocks</h2>
          <p className="mt-1 text-xs text-gray-500">Identical on both plans — only the billing period differs.</p>
          <ul className="mt-4 space-y-2.5 text-sm text-gray-700">
            {PAID.map((f) => (
              <li key={f} className="flex gap-2.5">
                <span className="text-brand-blue">
                  <CheckIcon />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-black/10 p-6">
          <h2 className="font-semibold text-brand-navy">Free for everyone</h2>
          <p className="mt-1 text-xs text-gray-500">No card needed — just register as an exporter.</p>
          <ul className="mt-4 space-y-2.5 text-sm text-gray-700">
            {FREE.map((f) => (
              <li key={f} className="flex gap-2.5">
                <span className="text-gray-500">
                  <CheckIcon />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        Logistics companies list and get verified for free. They can also take a paid membership
        at these same prices, which shows a member badge on their listing.
      </p>
    </div>
  );
}
