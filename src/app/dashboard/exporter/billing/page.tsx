import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, formatNaira, yearlySavingsPercent } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { createCheckoutAction, createPortalSessionAction } from "@/app/actions/billing";
import { SubmitButton } from "@/components/SubmitButton";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAST_DUE: "bg-red-100 text-red-700",
  CANCELED: "bg-gray-100 text-gray-600",
  NONE: "bg-gray-100 text-gray-600",
};

const SUBSCRIBER_BENEFITS = [
  "See agents' phone numbers and email addresses",
  "Message any verified logistics company",
  "Unlimited connection requests",
];

export default async function ExporterBilling(props: PageProps<"/dashboard/exporter/billing">) {
  const session = await auth();
  if (!session?.user) return null; // guarded by layout

  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const justSubscribed = sp.subscribed === "1";

  const [subscription, settings] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    getSettings(),
  ]);
  const isSubscribed = subscription?.status === "ACTIVE";
  const savings = yearlySavingsPercent();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-navy">Billing</h1>
      <p className="mt-1 text-sm text-gray-500">
        {isSubscribed
          ? "Your Cargoxo subscription and how to change it."
          : "Browsing is free. A subscription unlocks contact details and messaging."}
      </p>

      {justSubscribed && (
        <div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          Subscription active — agent contact details are unlocked.
        </div>
      )}
      {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      {isSubscribed ? (
        <>
          <div className="mt-6 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Current plan</p>
                <p className="mt-1 text-2xl font-bold text-brand-navy">
                  {subscription.plan ? PLANS[subscription.plan].label : "Subscribed"}
                  {subscription.plan && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ${PLANS[subscription.plan].usd}/{PLANS[subscription.plan].interval}
                    </span>
                  )}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[subscription.status]}`}>
                {subscription.status}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Renews on</dt>
                <dd className="mt-0.5 font-medium text-gray-800">
                  {subscription.currentPeriodEnd
                    ? subscription.currentPeriodEnd.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Subscribed since</dt>
                <dd className="mt-0.5 font-medium text-gray-800">
                  {subscription.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                </dd>
              </div>
            </dl>

            <form action={createPortalSessionAction} className="mt-5">
              <SubmitButton
                pendingLabel="Opening Stripe…"
                className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy"
              >
                Manage billing
              </SubmitButton>
              <p className="mt-2 text-xs text-gray-400">
                Change plan, update your card or cancel — handled securely by Stripe.
              </p>
            </form>
          </div>

          {subscription.status === "PAST_DUE" && (
            <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              Your last payment failed. Update your card from Manage billing to keep contact details unlocked.
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-brand-navy">What a subscription unlocks</p>
            <ul className="mt-3 space-y-2">
              {SUBSCRIBER_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Object.values(PLANS).map((plan) => (
              <form key={plan.id} action={createCheckoutAction} className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
                <input type="hidden" name="plan" value={plan.id} />
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{plan.label}</p>
                  {plan.id === "YEARLY" && savings > 0 && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Save {savings}%</span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-bold text-brand-navy">
                  ${plan.usd}
                  <span className="text-sm font-normal text-gray-400">/{plan.interval}</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">≈ {formatNaira(plan.usd, settings.ngnPerUsd)} · billed in USD via Stripe</p>
                <button
                  type="submit"
                  className="mt-4 w-full rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy"
                >
                  Subscribe {plan.label.toLowerCase()}
                </button>
              </form>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Full plan details are on the{" "}
            <Link href="/pricing" className="text-brand-blue hover:underline">
              pricing page
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
