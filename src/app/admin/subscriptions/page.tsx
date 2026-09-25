import { prisma } from "@/lib/prisma";
import { getPageInfo, parsePage } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";

export default async function AdminSubscriptions(props: PageProps<"/admin/subscriptions">) {
  const sp = await props.searchParams;
  const where = { status: { not: "NONE" as const } };

  const total = await prisma.subscription.count({ where });
  const pageInfo = getPageInfo(total, parsePage(sp.page));

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
          exporterProfile: { select: { companyName: true } },
          logisticsProfile: { select: { companyName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: pageInfo.skip,
    take: pageInfo.pageSize,
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Subscriptions</h1>
      <p className="mt-1 text-sm text-muted">Every active, past-due, or canceled billing record — exporters and logistics companies both.</p>

      <div className="mt-5 overflow-x-auto border border-rule bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-rule text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Renews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {subscriptions.map((s) => {
              const companyName = s.user.exporterProfile?.companyName ?? s.user.logisticsProfile?.companyName ?? s.user.name;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{companyName}</p>
                    <p className="text-xs text-muted">{s.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{s.user.role}</td>
                  <td className="px-4 py-3 text-muted">{s.plan === "YEARLY" ? "Yearly" : "Monthly"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
 s.status === "ACTIVE" ? "bg-ok-tint text-ok" : s.status === "PAST_DUE" ? "bg-bad-tint text-bad" : "bg-paper-deep text-ink-soft"
 }`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{s.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-muted">{s.currentPeriodEnd ? s.currentPeriodEnd.toLocaleDateString() : "—"}</td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No subscriptions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination info={pageInfo} basePath="/admin/subscriptions" params={sp} label="subscriptions" />
    </div>
  );
}
