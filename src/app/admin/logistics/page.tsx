import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyLogisticsAction } from "@/app/actions/admin";
import { getPageInfo, parsePage } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";
import { SubmitButton } from "@/components/SubmitButton";

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "VERIFIED", label: "Verified" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
] as const;

export default async function AdminLogisticsQueue(props: PageProps<"/admin/logistics">) {
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const error = typeof sp.error === "string" ? sp.error : null;
  const activeTab = TABS.find((t) => t.key === status)?.key ?? "PENDING";

  const where = activeTab === "ALL" ? undefined : { verificationStatus: activeTab };
  const pageInfo = getPageInfo(await prisma.logisticsProfile.count({ where }), parsePage(sp.page));

  const [companies, pendingCount, verifiedCount, rejectedCount, totalCount] = await Promise.all([
    prisma.logisticsProfile.findMany({
      where,
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
      skip: pageInfo.skip,
      take: pageInfo.pageSize,
    }),
    prisma.logisticsProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.logisticsProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.logisticsProfile.count({ where: { verificationStatus: "REJECTED" } }),
    prisma.logisticsProfile.count(),
  ]);

  const counts: Record<(typeof TABS)[number]["key"], number> = {
    PENDING: pendingCount,
    VERIFIED: verifiedCount,
    REJECTED: rejectedCount,
    ALL: totalCount,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Logistics verification queue</h1>
      <p className="mt-1 text-sm text-muted">Approve or reject companies based on their ANCLA number and details.</p>

      {error && <div className="mt-4 bg-bad-tint px-4 py-3 text-sm text-bad">{decodeURIComponent(error)}</div>}

      <div className="mt-6 flex flex-wrap gap-1 border-b border-rule">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "PENDING" ? "/admin/logistics" : `/admin/logistics?status=${t.key}`}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
 activeTab === t.key
 ? "border-ochre text-ink"
 : "border-transparent text-muted hover:text-ink"
 }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === t.key ? "bg-wait-tint text-ochre" : "bg-paper-deep text-ink-soft"}`}>
              {counts[t.key]}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {companies.map((c) => (
          <div key={c.id} className="border border-rule bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">{c.companyName}</h3>
                <p className="text-sm text-muted">{c.user.name} · {c.user.email} · {c.user.phone}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
 c.verificationStatus === "VERIFIED"
 ? "bg-ok-tint text-ok"
 : c.verificationStatus === "REJECTED"
 ? "bg-bad-tint text-bad"
 : "bg-wait-tint text-wait"
 }`}
              >
                {c.verificationStatus}
              </span>
            </div>

            <dl className="mt-3 grid gap-1 text-sm text-ink-soft sm:grid-cols-2">
              <div><dt className="inline font-medium text-ink-soft">ANCLA number: </dt><dd className="inline">{c.anclaNumber}</dd></div>
              <div><dt className="inline font-medium text-ink-soft">Location: </dt><dd className="inline">{c.location}</dd></div>
              <div className="sm:col-span-2"><dt className="inline font-medium text-ink-soft">Address: </dt><dd className="inline">{c.address}</dd></div>
            </dl>

            {c.verificationStatus === "REJECTED" && c.rejectionReason && (
              <p className="mt-3 bg-bad-tint px-3 py-2 text-sm text-bad">
                <span className="font-medium">Rejected:</span> {c.rejectionReason}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <form action={verifyLogisticsAction}>
                <input type="hidden" name="userId" value={c.userId} />
                <input type="hidden" name="status" value="VERIFIED" />
                <SubmitButton
                  pendingLabel="Approving…"
                  disabled={c.verificationStatus === "VERIFIED"}
                  className="bg-ink px-3 py-2.5 text-sm font-medium text-paper hover:bg-ink-hover"
                >
                  Approve
                </SubmitButton>
              </form>

              {/* Rejecting requires a reason. Without one the company is just
                  told to "contact support" and has no idea what to fix. */}
              <form action={verifyLogisticsAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="userId" value={c.userId} />
                <input type="hidden" name="status" value="REJECTED" />
                <label className="text-xs text-muted">
                  <span className="sr-only">Reason for rejecting {c.companyName}</span>
                  <input
                    name="rejectionReason"
                    defaultValue={c.rejectionReason ?? ""}
                    placeholder="Reason, e.g. ANCLA number not found"
                    className="w-72 border border-rule px-3 py-2.5 text-sm outline-none focus:border-ink"
                  />
                </label>
                <SubmitButton
                  pendingLabel="Saving…"
                  className="border border-rule px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-deep"
                >
                  {c.verificationStatus === "REJECTED" ? "Update reason" : "Reject"}
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
        {companies.length === 0 && (
          <p className="border border-dashed border-rule p-8 text-center text-sm text-muted">
            {activeTab === "ALL" ? "No logistics companies registered yet." : `No ${activeTab.toLowerCase()} companies.`}
          </p>
        )}
      </div>

      <Pagination info={pageInfo} basePath="/admin/logistics" params={sp} label="companies" />
    </div>
  );
}
