import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { PLANS, formatNaira } from "@/lib/pricing";
import { updateSettingsAction, addCargoTypeAction, deleteCargoTypeAction } from "@/app/actions/settings";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminSettings(props: PageProps<"/admin/settings">) {
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const saved = sp.saved === "1";
  const confirmingId = typeof sp.confirmDelete === "string" ? sp.confirmDelete : null;

  const [settings, cargoTypes] = await Promise.all([
    getSettings(),
    prisma.cargoType.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { logisticsProfiles: true } } },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-muted">Platform values you can change without a redeploy.</p>

      {saved && <div className="mt-4 bg-ok-tint px-4 py-3 text-sm text-ok">Settings saved.</div>}
      {error && <div className="mt-4 bg-bad-tint px-4 py-3 text-sm text-bad">{decodeURIComponent(error)}</div>}

      <form action={updateSettingsAction} className="mt-6 border border-rule bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Platform</h2>

        <div className="mt-4 space-y-5">
          <div>
            <label htmlFor="supportEmail" className="block text-sm font-medium text-ink-soft">Support email</label>
            <input
              id="supportEmail"
              name="supportEmail"
              type="email"
              required
              defaultValue={settings.supportEmail}
              className="mt-1 w-full max-w-sm border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <p className="mt-1 text-xs text-muted">
              Shown to logistics companies whose verification was rejected, so they have somewhere to go.
            </p>
          </div>

          <div>
            <label htmlFor="ngnPerUsd" className="block text-sm font-medium text-ink-soft">Naira per US dollar</label>
            <input
              id="ngnPerUsd"
              name="ngnPerUsd"
              type="number"
              min={1}
              step="1"
              required
              defaultValue={settings.ngnPerUsd}
              className="mt-1 w-40 border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <p className="mt-1 text-xs text-muted">
              Display only — Stripe still charges in USD. At this rate the {PLANS.MONTHLY.label.toLowerCase()} plan shows as{" "}
              <span className="font-medium text-ink-soft">{formatNaira(PLANS.MONTHLY.usd, settings.ngnPerUsd)}</span> and the{" "}
              {PLANS.YEARLY.label.toLowerCase()} plan as{" "}
              <span className="font-medium text-ink-soft">{formatNaira(PLANS.YEARLY.usd, settings.ngnPerUsd)}</span>.
            </p>
          </div>
        </div>

        <SubmitButton pendingLabel="Saving…" className="mt-6 bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-hover">
          Save settings
        </SubmitButton>
      </form>

      <div className="mt-6 border border-rule bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Cargo types</h2>
        <p className="mt-1 text-xs text-muted">
          The list logistics companies pick from and exporters filter by. Adding one makes it available in both places
          immediately.
        </p>

        <ul className="mt-4 divide-y divide-rule">
          {cargoTypes.map((c) => {
            const confirming = confirmingId === c.id;
            const inUse = c._count.logisticsProfiles;
            return (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-muted">
                    {inUse === 0 ? "Not used by any company" : `Used by ${inUse} ${inUse === 1 ? "company" : "companies"}`}
                  </p>
                </div>

                {confirming ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-bad">
                      {inUse > 0
                        ? `Remove it from ${inUse} ${inUse === 1 ? "company" : "companies"}?`
                        : "Delete this cargo type?"}
                    </span>
                    <form action={deleteCargoTypeAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="confirm" value="yes" />
                      <SubmitButton pendingLabel="Deleting…" className="bg-bad px-2.5 py-1 text-xs font-semibold text-paper hover:bg-ochre-hover">
                        Delete
                      </SubmitButton>
                    </form>
                    <Link href="/admin/settings" className="text-xs font-medium text-muted hover:text-ink">
                      Cancel
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/admin/settings?confirmDelete=${c.id}`}
                    className="text-sm font-medium text-bad hover:underline"
                  >
                    Remove
                  </Link>
                )}
              </li>
            );
          })}
          {cargoTypes.length === 0 && <li className="py-3 text-sm text-muted">No cargo types yet.</li>}
        </ul>

        <form action={addCargoTypeAction} className="mt-4 flex flex-wrap gap-2 border-t border-rule pt-4">
          <input
            name="name"
            required
            minLength={2}
            placeholder="Add a cargo type, e.g. Livestock"
            className="min-w-0 flex-1 border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <SubmitButton pendingLabel="Adding…" className="bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-hover">
            Add
          </SubmitButton>
        </form>
      </div>

      <p className="mt-4 text-xs text-muted">
        Plan prices live in <code className="bg-paper-deep px-1">src/lib/pricing.ts</code> alongside their Stripe price
        IDs, so changing them stays a code change —{" "}
        <Link href="/admin/pricing" className="text-ochre hover:underline">
          see the pricing page
        </Link>
        .
      </p>
    </div>
  );
}
