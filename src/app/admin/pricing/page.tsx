import { PLANS } from "@/lib/pricing";

export default function AdminPricing() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Pricing Page</h1>
      <p className="mt-1 text-sm text-muted">
        Read from <code className="bg-paper-deep px-1 text-xs">src/lib/pricing.ts</code> — the same source of truth used by
        /pricing and the Stripe checkout action.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {Object.values(PLANS).map((p) => (
          <div key={p.id} className="border border-rule bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{p.label}</p>
            <p className="mt-2 text-3xl font-bold text-ink">
              ${p.usd}
              <span className="text-sm font-normal text-muted">/{p.interval}</span>
            </p>
            <p className="mt-2 text-xs text-muted">
              Stripe price env var: <code className="bg-paper-deep px-1">{p.priceEnvVar}</code>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-muted">
        To change a price: edit the <code className="bg-paper-deep px-1">usd</code> value in{" "}
        <code className="bg-paper-deep px-1">src/lib/pricing.ts</code>, and update the matching Stripe Price ID in the
        corresponding env var. There&rsquo;s no in-app editor for this yet — it&rsquo;s source-controlled by design so pricing changes go
        through review.
      </p>
    </div>
  );
}
