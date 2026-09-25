import { PLANS } from "@/lib/pricing";

export default function AdminPricing() {
  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy">Pricing Page</h1>
      <p className="mt-1 text-sm text-gray-500">
        Read from <code className="rounded bg-gray-100 px-1 text-xs">src/lib/pricing.ts</code> — the same source of truth used by
        /pricing and the Stripe checkout action.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {Object.values(PLANS).map((p) => (
          <div key={p.id} className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{p.label}</p>
            <p className="mt-2 text-3xl font-bold text-brand-navy">
              ${p.usd}
              <span className="text-sm font-normal text-gray-500">/{p.interval}</span>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Stripe price env var: <code className="rounded bg-gray-100 px-1">{p.priceEnvVar}</code>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-gray-500">
        To change a price: edit the <code className="rounded bg-gray-100 px-1">usd</code> value in{" "}
        <code className="rounded bg-gray-100 px-1">src/lib/pricing.ts</code>, and update the matching Stripe Price ID in the
        corresponding env var. There&rsquo;s no in-app editor for this yet — it&rsquo;s source-controlled by design so pricing changes go
        through review.
      </p>
    </div>
  );
}
