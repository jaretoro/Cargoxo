import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { PLANS, formatNaira } from "@/lib/pricing";
import { updateSettingsAction, addCargoTypeAction, deleteCargoTypeAction } from "@/app/actions/settings";

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
      <h1 className="text-2xl font-bold text-brand-navy">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Platform values you can change without a redeploy.</p>

      {saved && <div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">Settings saved.</div>}
      {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <form action={updateSettingsAction} className="mt-6 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-navy">Platform</h2>

        <div className="mt-4 space-y-5">
          <div>
            <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700">Support email</label>
            <input
              id="supportEmail"
              name="supportEmail"
              type="email"
              required
              defaultValue={settings.supportEmail}
              className="mt-1 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
            <p className="mt-1 text-xs text-gray-400">
              Shown to logistics companies whose verification was rejected, so they have somewhere to go.
            </p>
          </div>

          <div>
            <label htmlFor="ngnPerUsd" className="block text-sm font-medium text-gray-700">Naira per US dollar</label>
            <input
              id="ngnPerUsd"
              name="ngnPerUsd"
              type="number"
              min={1}
              step="1"
              required
              defaultValue={settings.ngnPerUsd}
              className="mt-1 w-40 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
            <p className="mt-1 text-xs text-gray-400">
              Display only — Stripe still charges in USD. At this rate the {PLANS.MONTHLY.label.toLowerCase()} plan shows as{" "}
              <span className="font-medium text-gray-600">{formatNaira(PLANS.MONTHLY.usd, settings.ngnPerUsd)}</span> and the{" "}
              {PLANS.YEARLY.label.toLowerCase()} plan as{" "}
              <span className="font-medium text-gray-600">{formatNaira(PLANS.YEARLY.usd, settings.ngnPerUsd)}</span>.
            </p>
          </div>
        </div>

        <button type="submit" className="mt-6 rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy">
          Save settings
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-navy">Cargo types</h2>
        <p className="mt-1 text-xs text-gray-500">
          The list logistics companies pick from and exporters filter by. Adding one makes it available in both places
          immediately.
        </p>

        <ul className="mt-4 divide-y divide-gray-100">
          {cargoTypes.map((c) => {
            const confirming = confirmingId === c.id;
            const inUse = c._count.logisticsProfiles;
            return (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">
                    {inUse === 0 ? "Not used by any company" : `Used by ${inUse} ${inUse === 1 ? "company" : "companies"}`}
                  </p>
                </div>

                {confirming ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-700">
                      {inUse > 0
                        ? `Remove it from ${inUse} ${inUse === 1 ? "company" : "companies"}?`
                        : "Delete this cargo type?"}
                    </span>
                    <form action={deleteCargoTypeAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="confirm" value="yes" />
                      <button type="submit" className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700">
                        Delete
                      </button>
                    </form>
                    <Link href="/admin/settings" className="text-xs font-medium text-gray-500 hover:text-brand-navy">
                      Cancel
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/admin/settings?confirmDelete=${c.id}`}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </Link>
                )}
              </li>
            );
          })}
          {cargoTypes.length === 0 && <li className="py-3 text-sm text-gray-400">No cargo types yet.</li>}
        </ul>

        <form action={addCargoTypeAction} className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <input
            name="name"
            required
            minLength={2}
            placeholder="Add a cargo type, e.g. Livestock"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
          <button type="submit" className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy">
            Add
          </button>
        </form>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Plan prices live in <code className="rounded bg-gray-100 px-1">src/lib/pricing.ts</code> alongside their Stripe price
        IDs, so changing them stays a code change —{" "}
        <Link href="/admin/pricing" className="text-brand-blue hover:underline">
          see the pricing page
        </Link>
        .
      </p>
    </div>
  );
}
