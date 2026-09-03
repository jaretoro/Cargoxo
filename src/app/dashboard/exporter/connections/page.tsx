import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ExporterConnections() {
  const session = await auth();
  if (!session?.user) return null; // guarded by layout

  const connections = await prisma.connection.findMany({
    where: { exporterId: session.user.id },
    include: { logistics: { select: { name: true, logisticsProfile: { select: { companyName: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">My Connections</h1>
      <p className="mt-1 text-sm text-gray-500">Logistics companies you&rsquo;ve reached out to and their response.</p>

      <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-black/5 bg-white">
        {connections.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p className="font-medium text-gray-800">{c.logistics.logisticsProfile?.companyName ?? c.logistics.name}</p>
              <p className="text-sm text-gray-500">{c.message}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.status === "ACCEPTED" ? "bg-green-100 text-green-700" : c.status === "DECLINED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {c.status}
              </span>
              <Link href={`/dashboard/exporter/messages/${c.id}`} className="text-sm font-medium text-brand-blue hover:underline">
                Message →
              </Link>
            </div>
          </div>
        ))}
        {connections.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-400">
            No connections yet — head to{" "}
            <Link href="/dashboard/exporter" className="text-brand-blue hover:underline">
              All Agents
            </Link>{" "}
            to reach out to a logistics company.
          </p>
        )}
      </div>
    </div>
  );
}
