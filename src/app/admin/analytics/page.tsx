import { prisma } from "@/lib/prisma";
import { CargoDemandChart } from "@/components/AdminAnalyticsCharts";

export default async function AdminAnalytics() {
  const cargoTypeCounts = await prisma.cargoType.findMany({
    select: { name: true, _count: { select: { logisticsProfiles: true } } },
    orderBy: { logisticsProfiles: { _count: "desc" } },
  });

  const data = cargoTypeCounts.map((c) => ({ name: c.name, count: c._count.logisticsProfiles }));

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Analytics</h1>
      <p className="mt-1 text-sm text-muted">Cargo demand across the logistics network.</p>

      <div className="mt-5 border border-rule bg-surface p-6">
        <h2 className="font-semibold text-ink">Cargo type demand</h2>
        <p className="text-xs text-muted">Verified companies offering each cargo type</p>
        <div className="mt-4 h-80">
          <CargoDemandChart data={data} />
        </div>
      </div>
    </div>
  );
}
