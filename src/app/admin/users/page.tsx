import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteUserAction } from "@/app/actions/admin";
import { getPageInfo, parsePage } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";
import { SubmitButton } from "@/components/SubmitButton";

const TABS = [
  { key: "ALL", label: "All" },
  { key: "EXPORTER", label: "Exporters" },
  { key: "LOGISTICS", label: "Logistics" },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function AdminUsers(props: PageProps<"/admin/users">) {
  const sp = await props.searchParams;
  const role = typeof sp.role === "string" ? sp.role : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const confirmingId = typeof sp.confirmDelete === "string" ? sp.confirmDelete : null;
  const error = typeof sp.error === "string" ? sp.error : null;
  const activeTab = TABS.find((t) => t.key === role)?.key ?? "ALL";

  const where = {
    role: activeTab === "ALL" ? ({ not: "ADMIN" } as const) : activeTab,
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { logisticsProfile: { companyName: { contains: q } } },
            { exporterProfile: { companyName: { contains: q } } },
          ],
        }
      : {}),
  };

  // Count first so the page number can be clamped before the rows are
  // fetched — otherwise ?page=99 would run a query guaranteed to return
  // nothing.
  const total = await prisma.user.count({ where });
  const pageInfo = getPageInfo(total, parsePage(sp.page));

  const users = await prisma.user.findMany({
    where,
    include: { subscription: true, logisticsProfile: true },
    orderBy: { createdAt: "desc" },
    skip: pageInfo.skip,
    take: pageInfo.pageSize,
  });

  // Carry the current filter through the confirm/cancel round trip so
  // confirming a deletion doesn't dump you back on an unfiltered list.
  const filterQuery = (extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (activeTab !== "ALL") params.set("role", activeTab);
    if (q) params.set("q", q);
    // Keep the page too, so confirming a delete on page 3 doesn't bounce
    // you back to page 1.
    if (pageInfo.page > 1) params.set("page", String(pageInfo.page));
    for (const [k, v] of Object.entries(extra ?? {})) params.set(k, v);
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">Manage users</h1>

      {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/users${t.key === "ALL" ? (q ? `?q=${encodeURIComponent(q)}` : "") : `?role=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}`}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === t.key ? "border-brand-blue text-brand-navy" : "border-transparent text-gray-500 hover:text-brand-navy"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <form className="mb-2 flex gap-2">
          {activeTab !== "ALL" && <input type="hidden" name="role" value={activeTab} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email or company…"
            className="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-blue"
          />
          <button type="submit" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
            Search
          </button>
          {q && (
            <Link
              href={`/admin/users${activeTab === "ALL" ? "" : `?role=${activeTab}`}`}
              className="self-center text-sm text-gray-400 hover:text-brand-navy"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {q && (
        <p className="mt-3 text-sm text-gray-500">
          {/* the total, not users.length — that's only the current page */}
          {total} {total === 1 ? "result" : "results"} for &ldquo;{q}&rdquo;
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const statusLabel =
                u.role === "LOGISTICS"
                  ? u.logisticsProfile?.verificationStatus
                  : u.subscription?.status === "ACTIVE"
                    ? "Subscribed"
                    : "Not subscribed";
              const statusColor =
                statusLabel === "VERIFIED" || statusLabel === "Subscribed"
                  ? "bg-green-100 text-green-700"
                  : statusLabel === "REJECTED"
                    ? "bg-red-100 text-red-700"
                    : statusLabel === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500";
              const confirming = confirmingId === u.id;

              return (
                <tr key={u.id} className={confirming ? "bg-red-50/60" : undefined}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-sky/20 text-xs font-semibold text-brand-navy">
                        {initials(u.name)}
                      </span>
                      <span className="font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {u.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* Two steps, because deleting takes their messages,
                        connections and reviews with it and there's no undo. */}
                    {confirming ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-red-700">Delete permanently?</span>
                        <form action={deleteUserAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="confirm" value="yes" />
                          <SubmitButton pendingLabel="Deleting…" className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700">
                            Delete
                          </SubmitButton>
                        </form>
                        <Link href={`/admin/users${filterQuery()}`} className="text-xs font-medium text-gray-500 hover:text-brand-navy">
                          Cancel
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={`/admin/users${filterQuery({ confirmDelete: u.id })}`}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {q ? `No users match “${q}”.` : "No users yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination info={pageInfo} basePath="/admin/users" params={sp} label="users" />
    </div>
  );
}
