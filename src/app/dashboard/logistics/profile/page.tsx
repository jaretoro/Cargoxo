import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateLogisticsProfileAction } from "@/app/actions/logistics";
import { SubmitButton } from "@/components/SubmitButton";

// Blank route rows offered on top of whatever is already saved, so there's
// always somewhere to add a lane without needing JavaScript.
const SPARE_ROUTE_ROWS = 3;

export default async function LogisticsProfilePage(props: PageProps<"/dashboard/logistics/profile">) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const saved = sp.saved === "1";

  const [profile, allCargoTypes] = await Promise.all([
    prisma.logisticsProfile.findUnique({
      where: { userId: session.user.id },
      include: { cargoTypes: { select: { id: true } }, tradeRoutes: { orderBy: { origin: "asc" } } },
    }),
    prisma.cargoType.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!profile) redirect("/dashboard/logistics");

  const selectedCargoIds = new Set(profile.cargoTypes.map((c) => c.id));
  const routeRows = [
    ...profile.tradeRoutes.map((r) => ({ origin: r.origin, destination: r.destination })),
    ...Array.from({ length: SPARE_ROUTE_ROWS }, () => ({ origin: "", destination: "" })),
  ];

  const isIncomplete = selectedCargoIds.size === 0 || profile.tradeRoutes.length === 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink">Company profile</h1>
      <p className="mt-1 text-sm text-muted">
        This is what exporters see about you in search results.{" "}
        <Link href="/dashboard/logistics" className="font-medium text-ochre hover:underline">
          See the preview
        </Link>
        .
      </p>

      {saved && <div className="mt-4 bg-ok-tint px-4 py-3 text-sm text-ok">Profile saved.</div>}
      {error && <div className="mt-4 bg-bad-tint px-4 py-3 text-sm text-bad">{decodeURIComponent(error)}</div>}
      {isIncomplete && !saved && (
        <div className="mt-4 bg-wait-tint px-4 py-3 text-sm text-wait">
          Your listing is missing {selectedCargoIds.size === 0 ? "cargo types" : null}
          {selectedCargoIds.size === 0 && profile.tradeRoutes.length === 0 ? " and " : null}
          {profile.tradeRoutes.length === 0 ? "trade routes" : null}. Exporters filter by both, so adding them makes you far
          easier to find.
        </div>
      )}

      <form action={updateLogisticsProfileAction} className="mt-6 space-y-6">
        <section className="border border-rule bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Business details</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-ink-soft">Company name</label>
              <input
                id="companyName"
                name="companyName"
                required
                defaultValue={profile.companyName}
                className="mt-1 w-full border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-ink-soft">State / city</label>
                <input
                  id="location"
                  name="location"
                  required
                  defaultValue={profile.location}
                  className="mt-1 w-full border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
                />
              </div>
              <div>
                <label htmlFor="establishedYear" className="block text-sm font-medium text-ink-soft">
                  Year established <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="establishedYear"
                  name="establishedYear"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear()}
                  placeholder="e.g. 2018"
                  defaultValue={profile.establishedYear ?? ""}
                  className="mt-1 w-full border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-ink-soft">Business address</label>
              <input
                id="address"
                name="address"
                required
                defaultValue={profile.address}
                className="mt-1 w-full border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </div>
          </div>

          <div className="mt-4 bg-paper-deep px-3 py-2.5 text-xs text-muted">
            <p>
              <span className="font-medium text-ink-soft">ANCLA number:</span> {profile.anclaNumber}
              <span className="ml-2 text-muted">— can&rsquo;t be edited here</span>
            </p>
            <p className="mt-1">
              Your verification was granted against this number, so changing it needs an admin. Contact support if it&rsquo;s wrong.
            </p>
          </div>
        </section>

        <section className="border border-rule bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Cargo types you handle</h2>
          <p className="mt-1 text-xs text-muted">Exporters filter search results by these.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {allCargoTypes.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  name="cargo"
                  value={c.id}
                  defaultChecked={selectedCargoIds.has(c.id)}
                  className="h-4 w-4 accent-ochre"
                />
                {c.name}
              </label>
            ))}
          </div>
        </section>

        <section className="border border-rule bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Trade routes</h2>
          <p className="mt-1 text-xs text-muted">
            Lanes you service, e.g. Lagos → Rotterdam. Clear both fields of a row to remove it.
          </p>

          <div className="mt-4 space-y-2">
            {routeRows.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  name="origin"
                  defaultValue={r.origin}
                  placeholder="Origin"
                  aria-label={`Route ${i + 1} origin`}
                  className="min-w-0 flex-1 border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
                />
                <span aria-hidden="true" className="text-muted">→</span>
                <input
                  name="destination"
                  defaultValue={r.destination}
                  placeholder="Destination"
                  aria-label={`Route ${i + 1} destination`}
                  className="min-w-0 flex-1 border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Save to get more empty rows.</p>
        </section>

        <SubmitButton
          pendingLabel="Saving…"
          className="w-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink-hover"
        >
          Save profile
        </SubmitButton>
      </form>
    </div>
  );
}
