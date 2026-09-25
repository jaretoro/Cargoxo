import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, formatNaira, yearlySavingsPercent } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { createCheckoutAction, createPortalSessionAction } from "@/app/actions/billing";
import { SubmitButton } from "@/components/SubmitButton";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-ok-tint text-ok",
  PAST_DUE: "bg-bad-tint text-bad",
  CANCELED: "bg-paper-deep text-ink-soft",
  NONE: "bg-paper-deep text-ink-soft",
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
      <h1 className="text-2xl font-bold text-ink">Billing</h1>
      <p className="mt-1 text-sm text-muted">
        {isSubscribed
          ? "Your Cargoxo subscription and how to change it."
          : "Browsing is free. A subscription unlocks contact details and messaging."}
      </p>

      {justSubscribed && (
        <div className="mt-4 bg-ok-tint px-4 py-3 text-sm text-ok">
          Subscription active — agent contact details are unlocked.
        </div>
      )}
      {error && <div className="mt-4 bg-bad-tint px-4 py-3 text-sm text-bad">{decodeURIComponent(error)}</div>}

      {isSubscribed ? (
        <>
          <div className="mt-6 border border-rule bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current plan</p>
                <p className="mt-1 text-2xl font-bold text-ink">
                  {subscription.plan ? PLANS[subscription.plan].label : "Subscribed"}
                  {subscription.plan && (
                    <span className="ml-2 text-sm font-normal text-muted">
                      ${PLANS[subscription.plan].usd}/{PLANS[subscription.plan].interval}
                    </span>
                  )}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[subscription.status]}`}>
                {subscription.status}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 border-t border-rule pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Renews on</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {subscription.currentPeriodEnd
                    ? subscription.currentPeriodEnd.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Subscribed since</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {subscription.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                </dd>
              </div>
            </dl>

            <form action={createPortalSessionAction} className="mt-5">
              <SubmitButton
                pendingLabel="Opening Stripe…"
                className="bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-hover"
              >
                Manage billing
              </SubmitButton>
              <p className="mt-2 text-xs text-muted">
                Change plan, update your card or cancel — handled securely by Stripe.
              </p>
            </form>
          </div>

          {subscription.status === "PAST_DUE" && (
            <div className="mt-4 bg-bad-tint px-4 py-3 text-sm text-bad">
              Your last payment failed. Update your card from Manage billing to keep contact details unlocked.
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-6 border border-rule bg-surface p-6">
            <p className="text-sm font-semibold text-ink">What a subscription unlocks</p>
            <ul className="mt-3 space-y-2">
              {SUBSCRIBER_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2c5e3f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
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
              <form key={plan.id} action={createCheckoutAction} className="border border-rule bg-surface p-6">
                <input type="hidden" name="plan" value={plan.id} />
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{plan.label}</p>
                  {plan.id === "YEARLY" && savings > 0 && (
                    <span className="rounded-full bg-ok-tint px-2 py-0.5 text-xs font-semibold text-ok">Save {savings}%</span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-bold text-ink">
                  ${plan.usd}
                  <span className="text-sm font-normal text-muted">/{plan.interval}</span>
                </p>
                <p className="mt-1 text-xs text-muted">≈ {formatNaira(plan.usd, settings.ngnPerUsd)} · billed in USD via Stripe</p>
                <button
                  type="submit"
                  className="mt-4 w-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-hover"
                >
                  Subscribe {plan.label.toLowerCase()}
                </button>
              </form>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            Full plan details are on the{" "}
            <Link href="/pricing" className="text-ochre hover:underline">
              pricing page
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
