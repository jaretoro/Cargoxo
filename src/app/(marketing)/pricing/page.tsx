import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, formatNaira, yearlySavingsPercent } from "@/lib/pricing";
import { createCheckoutAction } from "@/app/actions/billing";

const FEATURES = [
  "Browse every verified logistics company on Cargoxo",
  "Full contact details (name, phone, email, address)",
  "Unlimited connection requests to verified agents",
  "Priority placement when agents review requests",
  "AI chatbot support",
  "Cancel anytime",
];

export default async function PricingPage(props: PageProps<"/pricing">) {
  const session = await auth();
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const canceled = searchParams.canceled === "1";

  const subscription = session?.user
    ? await prisma.subscription.findUnique({ where: { userId: session.user.id } })
    : null;
  const currentPlan = subscription?.status === "ACTIVE" ? subscription.plan : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-navy sm:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-3 text-gray-600">
          One subscription unlocks the full Cargoxo marketplace for exporters. Prices are billed
          in USD via Stripe; Naira amounts below are an approximate equivalent.
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
            {plan.id === "YEARLY" && (
              <span className="absolute -top-3 left-6 rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold text-white">
                Save {yearlySavingsPercent()}%
              </span>
            )}
            <h2 className="text-lg font-semibold text-brand-navy">{plan.label}</h2>
            <p className="mt-2">
              <span className="text-4xl font-bold text-gray-900">${plan.usd}</span>
              <span className="text-gray-500">/{plan.interval}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">≈ {formatNaira(plan.usd)} / {plan.interval}</p>

            <form action={createCheckoutAction} className="mt-6">
              <input type="hidden" name="plan" value={plan.id} />
              {currentPlan === plan.id ? (
                <button type="button" disabled className="w-full rounded-md bg-gray-100 px-4 py-2.5 font-semibold text-gray-400">
                  Current plan
                </button>
              ) : (
                <button
                  type="submit"
                  className={`w-full rounded-md px-4 py-2.5 font-semibold text-white hover:bg-brand-navy ${
                    plan.id === "YEARLY" ? "bg-brand-blue" : "bg-gray-800"
                  }`}
                >
                  Subscribe {plan.label.toLowerCase()}
                </button>
              )}
            </form>
          </div>
        ))}
      </div>

      <div className="mt-12 overflow-hidden rounded-xl border border-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Included in every plan</th>
              <th className="px-4 py-3 text-center">Monthly</th>
              <th className="px-4 py-3 text-center">Yearly</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {FEATURES.map((feature) => (
              <tr key={feature}>
                <td className="px-4 py-3 text-gray-700">{feature}</td>
                <td className="px-4 py-3 text-center text-brand-blue">✓</td>
                <td className="px-4 py-3 text-center text-brand-blue">✓</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        Logistics companies register and get verified for free — this subscription is for
        exporters who want to browse and contact verified agents.
      </p>
    </div>
  );
}
