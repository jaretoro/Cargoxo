import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/pricing";
import { MrrTrendChart, VerificationGauge } from "@/components/AdminCharts";

function TrendBadge({ deltaLabel }: { deltaLabel: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 13l5-5 3 3 5-6" />
        <path d="M13 5h4v4" />
      </svg>
      {deltaLabel}
    </span>
  );
}

function monthlyEquivalent(plan: "MONTHLY" | "YEARLY" | null) {
  if (plan === "YEARLY") return PLANS.YEARLY.usd / 12;
  if (plan === "MONTHLY") return PLANS.MONTHLY.usd;
  return 0;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export default async function AdminOverview() {
  const sevenDaysAgo = daysAgo(7);

  const [
    exporterCount,
    logisticsCount,
    pendingCount,
    verifiedCount,
    activeSubs,
    pastDueCount,
    newUsersThisWeek,
    verifiedThisWeek,
    newSubsThisWeek,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "EXPORTER" } }),
    prisma.user.count({ where: { role: "LOGISTICS" } }),
    prisma.logisticsProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.logisticsProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, select: { plan: true, createdAt: true } }),
    prisma.subscription.count({ where: { status: "PAST_DUE" } }),
    prisma.user.count({ where: { role: { not: "ADMIN" }, createdAt: { gte: sevenDaysAgo } } }),
    prisma.logisticsProfile.count({ where: { verificationStatus: "VERIFIED", verifiedAt: { gte: sevenDaysAgo } } }),
    prisma.subscription.count({ where: { status: "ACTIVE", createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const totalUsers = exporterCount + logisticsCount;
  const yearlySubs = activeSubs.filter((s) => s.plan === "YEARLY").length;
  const monthlySubs = activeSubs.filter((s) => s.plan === "MONTHLY").length;
  const yearlyAnnualRevenue = yearlySubs * PLANS.YEARLY.usd;
  const monthlyRevenue = monthlySubs * PLANS.MONTHLY.usd;
  const mrr = Math.round((monthlySubs * PLANS.MONTHLY.usd + yearlySubs * (PLANS.YEARLY.usd / 12)) * 100) / 100;
  const anclaVerificationRate = logisticsCount > 0 ? Math.round((verifiedCount / logisticsCount) * 1000) / 10 : 0;

  // Real month-over-month trend: for each of the last 12 months, sum the
  // monthly-equivalent revenue of every subscription that already existed
  // (and is still active) by that month's end.
  const now = new Date();
  const mrrTrend = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = now.getMonth() - (11 - i);
    const monthStart = new Date(now.getFullYear(), monthIndex, 1);
    const monthEnd = new Date(now.getFullYear(), monthIndex + 1, 0, 23, 59, 59);
    const cumulative = activeSubs
      .filter((s) => s.createdAt <= monthEnd)
      .reduce((sum, s) => sum + monthlyEquivalent(s.plan), 0);
    return { month: monthStart.toLocaleDateString("en-US", { month: "short" }), mrr: Math.round(cumulative * 100) / 100 };
  });
  const mrrGrowthPct =
    mrrTrend.length >= 2 && mrrTrend[mrrTrend.length - 2].mrr > 0
      ? Math.round(((mrrTrend[mrrTrend.length - 1].mrr - mrrTrend[mrrTrend.length - 2].mrr) / mrrTrend[mrrTrend.length - 2].mrr) * 1000) / 10
      : null;

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-brand-navy to-brand-navy-light p-6 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Monthly Recurring Revenue</p>
            <span className="rounded-lg bg-white/10 p-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M3 10h18" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-4xl font-bold">${mrr.toLocaleString()}</p>
          <p className="mt-2 text-xs text-white/60">
            {activeSubs.length} active subscriptions · {yearlySubs} yearly (${yearlyAnnualRevenue.toLocaleString()}/yr) + {monthlySubs} monthly (${monthlyRevenue.toLocaleString()}/mo)
          </p>
          {mrrGrowthPct !== null && (
            <p className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${mrrGrowthPct >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {mrrGrowthPct >= 0 ? "+" : ""}
              {mrrGrowthPct}% vs last month
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active Subscriptions</p>
            <span className="rounded-lg bg-brand-sky/15 p-2 text-brand-blue-deep">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M3 10h18" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-4xl font-bold text-brand-navy">{activeSubs.length}</p>
          <p className="mt-2 text-xs text-gray-500">
            {yearlySubs} yearly · {monthlySubs} monthly
          </p>
          {newSubsThisWeek > 0 && (
            <p className="mt-3">
              <TrendBadge deltaLabel={`+${newSubsThisWeek} this week`} />
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">ANCLA Verification Rate</p>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 3l7 3v5c0 4.5-3 8.3-7 9.5-4-1.2-7-5-7-9.5V6z" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-4xl font-bold text-brand-navy">{anclaVerificationRate}%</p>
          <p className="mt-2 text-xs text-gray-500">
            {verifiedCount} of {logisticsCount} companies verified
          </p>
          {verifiedThisWeek > 0 && (
            <p className="mt-3">
              <TrendBadge deltaLabel={`+${verifiedThisWeek} verified this week`} />
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pending Verifications</p>
            <span className="rounded-lg bg-red-50 p-2 text-red-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                <path d="M10.3 3.9L2.9 17a1.8 1.8 0 001.6 2.7h15a1.8 1.8 0 001.6-2.7L13.7 3.9a1.8 1.8 0 00-3.4 0z" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <p className={`mt-3 text-3xl font-bold ${pendingCount > 0 ? "text-red-600" : "text-brand-navy"}`}>{pendingCount}</p>
          {pendingCount > 0 && (
            <Link href="/admin/logistics" className="tap mt-2 inline-block text-xs font-medium text-brand-blue-deep hover:underline">
              Review queue →
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Registered Users</p>
            <span className="rounded-lg bg-brand-sky/15 p-2 text-brand-blue-deep">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3.2" />
                <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
                <circle cx="17.5" cy="9" r="2.6" />
                <path d="M17.8 20c0-2.4-1.1-4.3-3-5.4" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-brand-navy">{totalUsers.toLocaleString()}</p>
          <p className="mt-2 text-xs text-gray-500">
            {exporterCount.toLocaleString()} exporters · {logisticsCount} logistics cos.
          </p>
          {newUsersThisWeek > 0 && (
            <p className="mt-3">
              <TrendBadge deltaLabel={`+${newUsersThisWeek} this week`} />
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Past Due Subscriptions</p>
            <span className={`rounded-lg p-2 ${pastDueCount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <p className={`mt-3 text-3xl font-bold ${pastDueCount > 0 ? "text-amber-600" : "text-brand-navy"}`}>{pastDueCount}</p>
          <p className="mt-2 text-xs text-gray-500">{pastDueCount > 0 ? "Payment retry needed" : "No revenue at risk right now"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-brand-navy">Subscription MRR — Last 12 Months</h2>
              <p className="text-xs text-gray-500">Monthly recurring revenue trend</p>
            </div>
            {mrrGrowthPct !== null && (
              // Zero is flat, not growth: it used to render green with a
              // leading "+", which read as a rise that hadn't happened.
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  mrrGrowthPct > 0
                    ? "bg-emerald-50 text-emerald-600"
                    : mrrGrowthPct < 0
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {mrrGrowthPct > 0 ? "+" : ""}
                {mrrGrowthPct}% MoM
              </span>
            )}
          </div>
          <div className="mt-4 h-64">
            <MrrTrendChart data={mrrTrend} />
          </div>
        </div>

        {/* Flex column with the gauge on flex-1: the grid stretches this
            card to match the MRR chart beside it, and a fixed-height gauge
            left roughly 200px of empty white underneath. */}
        <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-brand-navy">Verification Progress</h2>
          <p className="text-xs text-gray-500">ANCLA verification completion rate</p>
          <div className="relative mt-2 min-h-48 flex-1">
            <VerificationGauge rate={anclaVerificationRate} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-brand-navy">{anclaVerificationRate}%</p>
              <p className="text-xs text-gray-500">verified</p>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500">
            {verifiedCount} of {logisticsCount} companies
          </p>
        </div>
      </div>
    </div>
  );
}
