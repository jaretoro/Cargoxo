import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AgentCard, type AgentCardData } from "@/components/AgentCard";
import { getPageInfo, parsePage } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

const SORTS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "rating", label: "Highest Rated" },
  { value: "shipments", label: "Most Shipments" },
  { value: "newest", label: "Newest" },
] as const;

export default async function ExporterBrowse(props: PageProps<"/dashboard/exporter">) {
  const session = await auth();
  if (!session?.user) return null; // guarded by layout

  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const states = toArray(sp.state);
  const cargoNames = toArray(sp.cargo);
  const verifiedOnly = sp.verified === "1";
  const sort = typeof sp.sort === "string" && SORTS.some((s) => s.value === sp.sort) ? sp.sort : "relevance";
  const error = typeof sp.error === "string" ? sp.error : null;
  const justSubscribed = sp.subscribed === "1";

  const [profiles, cargoTypeOptions, locationRows, subscription, savedRows, connectionRows, reviewAgg] = await Promise.all([
    prisma.logisticsProfile.findMany({
      where: {
        verificationStatus: verifiedOnly ? "VERIFIED" : { in: ["VERIFIED", "PENDING"] },
        ...(states.length ? { location: { in: states } } : {}),
        ...(cargoNames.length ? { cargoTypes: { some: { name: { in: cargoNames } } } } : {}),
        ...(q
          ? {
              OR: [
                { companyName: { contains: q } },
                { anclaNumber: { contains: q } },
                { location: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { phone: true, subscription: true } },
        cargoTypes: true,
        tradeRoutes: true,
      },
    }),
    prisma.cargoType.findMany({ orderBy: { name: "asc" } }),
    prisma.logisticsProfile.findMany({
      where: { verificationStatus: { in: ["VERIFIED", "PENDING"] } },
      select: { location: true },
      distinct: ["location"],
    }),
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    prisma.savedAgent.findMany({ where: { exporterId: session.user.id }, select: { logisticsId: true } }),
    prisma.connection.findMany({ where: { exporterId: session.user.id }, select: { id: true, logisticsId: true, status: true } }),
    prisma.review.groupBy({ by: ["logisticsProfileId"], _avg: { rating: true }, _count: { rating: true } }),
  ]);

  const isSubscribed = subscription?.status === "ACTIVE";
  const savedSet = new Set(savedRows.map((s) => s.logisticsId));
  const connByLogistics = new Map(connectionRows.map((c) => [c.logisticsId, c]));
  const reviewMap = new Map(reviewAgg.map((r) => [r.logisticsProfileId, { rating: r._avg.rating ?? 0, count: r._count.rating }]));

  const sortedProfiles = sort === "newest" ? [...profiles].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) : profiles;

  const agents: AgentCardData[] = sortedProfiles.map((p) => {
    const agg = reviewMap.get(p.id);
    const conn = connByLogistics.get(p.userId);
    return {
      logisticsProfileId: p.id,
      userId: p.userId,
      companyName: p.companyName,
      location: p.location,
      anclaNumber: p.anclaNumber,
      verificationStatus: p.verificationStatus,
      establishedYear: p.establishedYear,
      shipmentCount: p.shipmentCount,
      cargoTypes: p.cargoTypes.map((c) => c.name),
      routes: p.tradeRoutes.map((r) => ({ origin: r.origin, destination: r.destination })),
      rating: agg?.rating ?? 0,
      reviewCount: agg?.count ?? 0,
      membership: p.user.subscription?.status === "ACTIVE" ? p.user.subscription.plan : null,
      isSaved: savedSet.has(p.userId),
      phone: p.user.phone,
      connectionId: conn?.id ?? null,
      connectionStatus: conn?.status ?? null,
    };
  });

  if (sort === "rating") agents.sort((a, b) => b.rating - a.rating);
  else if (sort === "shipments") agents.sort((a, b) => b.shipmentCount - a.shipmentCount);
  else if (sort === "relevance") {
    agents.sort((a, b) => {
      if (a.verificationStatus !== b.verificationStatus) return a.verificationStatus === "VERIFIED" ? -1 : 1;
      return b.rating - a.rating;
    });
  }

  const verifiedInResults = agents.filter((a) => a.verificationStatus === "VERIFIED").length;

  // Paged after sorting rather than in the query, because two of the sort
  // options rank by rating, which is aggregated from Review rows on read
  // instead of cached on the profile. Sorting in SQL would mean
  // denormalising that back onto LogisticsProfile, which is exactly the
  // drift the aggregate-on-read choice avoids.
  //
  // So this bounds what gets rendered, not what gets read: every matching
  // company is still loaded. Fine at this size; revisit if the marketplace
  // reaches the point where that read hurts.
  const pageInfo = getPageInfo(agents.length, parsePage(sp.page));
  const pageAgents = agents.slice(pageInfo.skip, pageInfo.skip + pageInfo.pageSize);

  const currentQuery = new URLSearchParams();
  if (q) currentQuery.set("q", q);
  states.forEach((s) => currentQuery.append("state", s));
  cargoNames.forEach((c) => currentQuery.append("cargo", c));
  if (verifiedOnly) currentQuery.set("verified", "1");
  if (sort !== "relevance") currentQuery.set("sort", sort);
  const backTo = `/dashboard/exporter${currentQuery.toString() ? `?${currentQuery.toString()}` : ""}`;

  const locations = [...new Set(locationRows.map((l) => l.location))].sort();

  return (
    <div>
      {error && <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}
      {/* Stripe sends subscribers straight back here rather than to a
          receipt page — this is what they paid to reach. */}
      {justSubscribed && isSubscribed && (
        <div className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          Subscription active — contact details and messaging are unlocked.
        </div>
      )}

      {/* The filter controls are split across the toolbar and the sidebar,
          but they submit as one form. Rather than wrapping the whole page
          (which would nest the cards' own save forms inside this one —
          invalid HTML, and it breaks hydration), the form stays here and
          the sidebar inputs join it via form="agent-filters". */}
      <form id="agent-filters">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm">
          <div className="relative min-w-[220px] flex-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              <circle cx="8.5" cy="8.5" r="6" />
              <path d="M17 17l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by company name, state, ANCLA number…"
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-blue"
            />
          </div>

          <select name="sort" defaultValue={sort} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="h-4 w-4 accent-brand-blue" />
            Verified Only
          </label>

          <button type="submit" className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy">
            Search
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{agents.length} Logistics Companies</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#16a34a" strokeWidth="1.8" aria-hidden="true">
                <path d="M10 2l6 2.5v5c0 4-2.6 6.7-6 8-3.4-1.3-6-4-6-8v-5z" strokeLinejoin="round" />
                <path d="M7.5 10l1.8 1.8L12.5 8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {verifiedInResults} verified in results
            </p>
          </div>
          {!isSubscribed && (
            <Link href="/pricing" className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy">
              Subscribe to unlock contacts
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-56">
            <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-brand-navy">Refine Results</h2>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">State / Location</p>
                <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1 text-sm text-gray-600">
                  {locations.map((loc) => (
                    <label key={loc} className="flex items-center gap-2">
                      <input form="agent-filters" type="checkbox" name="state" value={loc} defaultChecked={states.includes(loc)} className="h-3.5 w-3.5 accent-brand-blue" />
                      {loc}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cargo Type</p>
                <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                  {cargoTypeOptions.map((c) => (
                    <label key={c.id} className="flex items-center gap-2">
                      <input form="agent-filters" type="checkbox" name="cargo" value={c.name} defaultChecked={cargoNames.includes(c.name)} className="h-3.5 w-3.5 accent-brand-blue" />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <button form="agent-filters" type="submit" className="mt-5 w-full rounded-md bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-navy">
                Apply filters
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageAgents.map((agent) => (
                <AgentCard key={agent.logisticsProfileId} agent={agent} isSubscribed={isSubscribed} backTo={backTo} />
              ))}
              {agents.length === 0 && (
                <p className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
                  No logistics companies match your filters.
                </p>
              )}
            </div>

            <Pagination info={pageInfo} basePath="/dashboard/exporter" params={sp} label="companies" />
          </div>
        </div>
    </div>
  );
}
