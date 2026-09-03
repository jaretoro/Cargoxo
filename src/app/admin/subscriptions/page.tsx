import { prisma } from "@/lib/prisma";

export default async function AdminSubscriptions() {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: { not: "NONE" } },
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
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy">Subscriptions</h1>
      <p className="mt-1 text-sm text-gray-500">Every active, past-due, or canceled billing record — exporters and logistics companies both.</p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Renews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subscriptions.map((s) => {
              const companyName = s.user.exporterProfile?.companyName ?? s.user.logisticsProfile?.companyName ?? s.user.name;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{companyName}</p>
                    <p className="text-xs text-gray-400">{s.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.user.role}</td>
                  <td className="px-4 py-3 text-gray-500">{s.plan === "YEARLY" ? "Yearly" : "Monthly"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === "ACTIVE" ? "bg-green-100 text-green-700" : s.status === "PAST_DUE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{s.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-400">{s.currentPeriodEnd ? s.currentPeriodEnd.toLocaleDateString() : "—"}</td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No subscriptions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
