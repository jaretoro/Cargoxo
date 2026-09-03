import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const AVATAR_STYLES = [
  "bg-brand-navy text-white",
  "bg-brand-blue text-white",
  "bg-purple-600 text-white",
  "bg-amber-700 text-white",
  "bg-emerald-700 text-white",
  "bg-rose-600 text-white",
];

function avatarStyle(seed: string) {
  const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_STYLES[hash % AVATAR_STYLES.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

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
          <h1 className="text-2xl font-bold text-brand-navy">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalUnread > 0
              ? `${totalUnread} unread ${totalUnread === 1 ? "message" : "messages"}`
              : "You're all caught up."}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        {threads.map((t, i) => (
          <Link
            key={t.id}
            href={`/dashboard/exporter/messages/${t.id}`}
            className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 ${
              i > 0 ? "border-t border-gray-100" : ""
            } ${t.unread > 0 ? "bg-brand-sky/5" : ""}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarStyle(t.companyName)}`}>
              {initials(t.companyName)}
            </span>

            <div className="min-w-0 flex-1">
              <p className={`truncate ${t.unread > 0 ? "font-semibold text-brand-navy" : "font-medium text-gray-800"}`}>
                {t.companyName}
              </p>
              <p className={`truncate text-sm ${t.unread > 0 ? "text-gray-700" : "text-gray-500"}`}>
                {!t.lastFromThem && <span className="text-gray-400">You: </span>}
                {t.lastMessage}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-xs text-gray-400">{shortDate(t.lastAt)}</span>
              {t.unread > 0 && (
                <span className="rounded-full bg-brand-blue px-1.5 py-0.5 text-xs font-semibold text-white">{t.unread}</span>
              )}
            </div>
          </Link>
        ))}

        {threads.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-gray-700">No conversations yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-400">
              Message a logistics company from their card and the thread will appear here.
            </p>
            <Link
              href="/dashboard/exporter"
              className="mt-4 inline-block rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy"
            >
              Browse agents
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
