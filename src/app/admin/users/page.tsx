import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteUserAction } from "@/app/actions/admin";

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

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const activeTab = TABS.find((t) => t.key === role)?.key ?? "ALL";

  const users = await prisma.user.findMany({
    where: {
      role: activeTab === "ALL" ? { not: "ADMIN" } : activeTab,
    },
    include: { subscription: true, logisticsProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">Manage users</h1>

      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "ALL" ? "/admin/users" : `/admin/users?role=${t.key}`}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key ? "border-brand-blue text-brand-navy" : "border-transparent text-gray-500 hover:text-brand-navy"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
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
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-500";

              return (
                <tr key={u.id}>
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
                  <td className="px-4 py-3 text-right">
                    <form action={deleteUserAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
