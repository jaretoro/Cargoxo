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
      <h1 className="text-xl font-bold text-brand-navy">Analytics</h1>
      <p className="mt-1 text-sm text-gray-500">Cargo demand across the logistics network.</p>

      <div className="mt-5 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-brand-navy">Cargo type demand</h2>
        <p className="text-xs text-gray-500">Verified companies offering each cargo type</p>
        <div className="mt-4 h-80">
          <CargoDemandChart data={data} />
        </div>
      </div>
    </div>
  );
}
