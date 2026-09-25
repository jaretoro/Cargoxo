import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { avatarStyle, initials } from "@/lib/ui";

// "3 Sep", or the year too once it isn't this year — a bare date on every
// row reads as noise.
function shortDate(date: Date) {
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

export default async function ExporterMessages() {
  const session = await auth();
  if (!session?.user) return null; // guarded by layout

  const connections = await prisma.connection.findMany({
    where: { exporterId: session.user.id },
    include: {
      logistics: { select: { name: true, logisticsProfile: { select: { companyName: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: session.user.id } } } } },
    },
  });

  const threads = connections
    .map((c) => ({
      id: c.id,
      companyName: c.logistics.logisticsProfile?.companyName ?? c.logistics.name,
      lastMessage: c.messages[0]?.body ?? c.message,
      lastAt: c.messages[0]?.createdAt ?? c.createdAt,
      lastFromThem: c.messages[0] ? c.messages[0].senderId !== session.user.id : false,
      unread: c._count.messages,
    }))
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Messages</h1>
          <p className="mt-1 text-sm text-muted">
            {totalUnread > 0
              ? `${totalUnread} unread ${totalUnread === 1 ? "message" : "messages"}`
              : "You're all caught up."}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden border border-rule bg-surface">
        {threads.map((t, i) => (
          <Link
            key={t.id}
            href={`/dashboard/exporter/messages/${t.id}`}
            className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-deep ${
 i > 0 ? "border-t border-rule" : ""
 } ${t.unread > 0 ? "bg-paper-deep" : ""}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarStyle(t.companyName)}`}>
              {initials(t.companyName)}
            </span>

            <div className="min-w-0 flex-1">
              <p className={`truncate ${t.unread > 0 ? "font-semibold text-ink" : "font-medium text-ink"}`}>
                {t.companyName}
              </p>
              <p className={`truncate text-sm ${t.unread > 0 ? "text-ink-soft" : "text-muted"}`}>
                {!t.lastFromThem && <span className="text-muted">You: </span>}
                {t.lastMessage}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-xs text-muted">{shortDate(t.lastAt)}</span>
              {t.unread > 0 && (
                <span className="rounded-full bg-ink px-1.5 py-0.5 text-xs font-semibold text-paper">{t.unread}</span>
              )}
            </div>
          </Link>
        ))}

        {threads.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-ink-soft">No conversations yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Message a logistics company from their card and the thread will appear here.
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
