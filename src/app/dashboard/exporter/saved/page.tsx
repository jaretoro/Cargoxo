import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AgentCard, type AgentCardData } from "@/components/AgentCard";

export default async function ExporterSaved() {
  const session = await auth();
  if (!session?.user) return null; // guarded by layout

  const [savedRows, subscription, connectionRows, reviewAgg] = await Promise.all([
    prisma.savedAgent.findMany({
      where: { exporterId: session.user.id },
      include: {
        logistics: {
          select: {
            phone: true,
            logisticsProfile: { include: { cargoTypes: true, tradeRoutes: true } },
            subscription: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    prisma.connection.findMany({ where: { exporterId: session.user.id }, select: { id: true, logisticsId: true, status: true } }),
    prisma.review.groupBy({ by: ["logisticsProfileId"], _avg: { rating: true }, _count: { rating: true } }),
  ]);

  const isSubscribed = subscription?.status === "ACTIVE";
  const connByLogistics = new Map(connectionRows.map((c) => [c.logisticsId, c]));
  const reviewMap = new Map(reviewAgg.map((r) => [r.logisticsProfileId, { rating: r._avg.rating ?? 0, count: r._count.rating }]));

  const agents: AgentCardData[] = savedRows
    .filter((s) => s.logistics.logisticsProfile)
    .map((s) => {
      const p = s.logistics.logisticsProfile!;
      const agg = reviewMap.get(p.id);
      const conn = connByLogistics.get(s.logisticsId);
      return {
        logisticsProfileId: p.id,
        userId: s.logisticsId,
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
        membership: s.logistics.subscription?.status === "ACTIVE" ? s.logistics.subscription.plan : null,
        isSaved: true,
        phone: s.logistics.phone,
        connectionId: conn?.id ?? null,
        connectionStatus: conn?.status ?? null,
      };
    });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Saved</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.logisticsProfileId} agent={agent} isSubscribed={isSubscribed} backTo="/dashboard/exporter/saved" />
        ))}
        {agents.length === 0 && (
          <p className="col-span-full border border-dashed border-rule p-8 text-center text-sm text-muted">
            Nothing saved yet — bookmark a company from{" "}
            <Link href="/dashboard/exporter" className="text-ochre hover:underline">
              All Agents
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
