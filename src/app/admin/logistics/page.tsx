import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyLogisticsAction } from "@/app/actions/admin";

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

  const [companies, pendingCount, verifiedCount, rejectedCount, totalCount] = await Promise.all([
    prisma.logisticsProfile.findMany({
      where: activeTab === "ALL" ? undefined : { verificationStatus: activeTab },
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
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
      <h1 className="text-2xl font-bold text-brand-navy">Logistics verification queue</h1>
      <p className="mt-1 text-sm text-gray-500">Approve or reject companies based on their ANCLA number and details.</p>

      {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "PENDING" ? "/admin/logistics" : `/admin/logistics?status=${t.key}`}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "border-brand-blue text-brand-navy"
                : "border-transparent text-gray-500 hover:text-brand-navy"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === t.key ? "bg-brand-sky/20 text-brand-blue" : "bg-gray-100 text-gray-400"}`}>
              {counts[t.key]}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {companies.map((c) => (
          <div key={c.id} className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-brand-navy">{c.companyName}</h3>
                <p className="text-sm text-gray-500">{c.user.name} · {c.user.email} · {c.user.phone}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.verificationStatus === "VERIFIED"
                    ? "bg-green-100 text-green-700"
                    : c.verificationStatus === "REJECTED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {c.verificationStatus}
              </span>
            </div>

            <dl className="mt-3 grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
              <div><dt className="inline font-medium text-gray-700">ANCLA number: </dt><dd className="inline">{c.anclaNumber}</dd></div>
              <div><dt className="inline font-medium text-gray-700">Location: </dt><dd className="inline">{c.location}</dd></div>
              <div className="sm:col-span-2"><dt className="inline font-medium text-gray-700">Address: </dt><dd className="inline">{c.address}</dd></div>
            </dl>

            {c.verificationStatus === "REJECTED" && c.rejectionReason && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <span className="font-medium">Rejected:</span> {c.rejectionReason}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <form action={verifyLogisticsAction}>
                <input type="hidden" name="userId" value={c.userId} />
                <input type="hidden" name="status" value="VERIFIED" />
                <button
                  type="submit"
                  disabled={c.verificationStatus === "VERIFIED"}
                  className="rounded-md bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Approve
                </button>
              </form>

              {/* Rejecting requires a reason. Without one the company is just
                  told to "contact support" and has no idea what to fix. */}
              <form action={verifyLogisticsAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="userId" value={c.userId} />
                <input type="hidden" name="status" value="REJECTED" />
                <label className="text-xs text-gray-500">
                  <span className="sr-only">Reason for rejecting {c.companyName}</span>
                  <input
                    name="rejectionReason"
                    defaultValue={c.rejectionReason ?? ""}
                    placeholder="Reason, e.g. ANCLA number not found"
                    className="w-72 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-blue"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {c.verificationStatus === "REJECTED" ? "Update reason" : "Reject"}
                </button>
              </form>
            </div>
          </div>
        ))}
        {companies.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
            {activeTab === "ALL" ? "No logistics companies registered yet." : `No ${activeTab.toLowerCase()} companies.`}
          </p>
        )}
      </div>
    </div>
  );
}
