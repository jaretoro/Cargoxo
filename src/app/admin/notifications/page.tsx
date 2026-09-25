import { prisma } from "@/lib/prisma";

export default async function AdminNotifications() {
  const [recentSubmissions, recentSubs, recentUsers] = await Promise.all([
    prisma.logisticsProfile.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { companyName: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      where: { status: { in: ["ACTIVE", "PAST_DUE"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { name: true, role: true, createdAt: true },
    }),
  ]);

  const items = [
    ...recentSubmissions.map((c) => ({ id: `v-${c.companyName}`, at: c.createdAt, text: `${c.companyName} submitted verification documents — needs review.` })),
    ...recentSubs.map((s) => ({
      id: `s-${s.id}`,
      at: s.createdAt,
      text: s.status === "PAST_DUE" ? `${s.user.name}'s subscription payment failed.` : `${s.user.name} started a ${s.plan?.toLowerCase()} subscription.`,
    })),
    ...recentUsers.map((u) => ({ id: `u-${u.name}-${u.createdAt.getTime()}`, at: u.createdAt, text: `${u.name} signed up as ${u.role === "EXPORTER" ? "an exporter" : "a logistics company"}.` })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Notifications</h1>

      <div className="mt-5 divide-y divide-rule border border-rule bg-surface">
        {items.map((n) => (
          <div key={n.id} className="flex items-start gap-3 px-4 py-4">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
            <div>
              <p className="text-sm text-ink-soft">{n.text}</p>
              <p className="text-xs text-muted">{n.at.toLocaleString()}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">Nothing yet.</p>}
      </div>
    </div>
  );
}
