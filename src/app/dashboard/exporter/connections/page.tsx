import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_STYLES, avatarStyle, initials } from "@/lib/ui";

const STATUS_HINTS: Record<string, string> = {
  ACCEPTED: "They accepted — carry on in the thread.",
  DECLINED: "They declined this request.",
  PENDING: "Waiting for them to respond.",
};

export default async function ExporterConnections() {
  const session = await auth();
  if (!session?.user) return null; // guarded by layout

  const connections = await prisma.connection.findMany({
    where: { exporterId: session.user.id },
    include: {
      logistics: {
        select: { name: true, logisticsProfile: { select: { companyName: true, location: true, verificationStatus: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: session.user.id } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    total: connections.length,
    accepted: connections.filter((c) => c.status === "ACCEPTED").length,
    pending: connections.filter((c) => c.status === "PENDING").length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Connections</h1>
          <p className="mt-1 text-sm text-muted">Logistics companies you&rsquo;ve reached out to and their response.</p>
        </div>
        {counts.total > 0 && (
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-surface px-3 py-1.5 font-medium text-ink-soft">{counts.total} total</span>
            <span className="rounded-full bg-ok-tint px-3 py-1.5 font-medium text-ok">{counts.accepted} accepted</span>
            <span className="rounded-full bg-wait-tint px-3 py-1.5 font-medium text-wait">{counts.pending} pending</span>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {connections.map((c) => {
          const name = c.logistics.logisticsProfile?.companyName ?? c.logistics.name;
          return (
            <div key={c.id} className="border border-rule bg-surface p-5">
              <div className="flex items-start gap-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarStyle(name)}`}>
                  {initials(name)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold text-ink">{name}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                    {c._count.messages > 0 && (
                      <span className="rounded-full bg-ink px-1.5 py-0.5 text-xs font-semibold text-paper">
                        {c._count.messages} new
                      </span>
                    )}
                  </div>

                  {c.logistics.logisticsProfile?.location && (
                    <p className="mt-0.5 text-xs text-muted">{c.logistics.logisticsProfile.location}</p>
                  )}

                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{c.message}</p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted">
                      {STATUS_HINTS[c.status]}{" "}
                      <span className="text-muted">
                        · {(c.messages[0]?.createdAt ?? c.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </p>
                    <Link
                      href={`/dashboard/exporter/messages/${c.id}`}
                      className="bg-ink px-3 py-2.5 text-sm font-medium text-paper hover:bg-ink-hover"
                    >
                      Open conversation
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {connections.length === 0 && (
          <div className="border border-dashed border-rule bg-surface p-10 text-center">
            <p className="text-sm font-medium text-ink-soft">No connections yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              When you message a logistics company, it shows up here with their response.
            </p>
            <Link
              href="/dashboard/exporter"
              className="mt-4 inline-block bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-hover"
            >
              Browse agents
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
