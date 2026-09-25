import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function LogisticsMessages() {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  const connections = await prisma.connection.findMany({
    where: { logisticsId: session.user.id },
    include: {
      exporter: { select: { name: true, exporterProfile: { select: { companyName: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: session.user.id } } } } },
    },
  });

  const threads = connections
    .map((c) => ({
      id: c.id,
      name: c.exporter.exporterProfile?.companyName ?? c.exporter.name,
      lastMessage: c.messages[0]?.body ?? c.message,
      lastAt: c.messages[0]?.createdAt ?? c.createdAt,
      unread: c._count.messages,
    }))
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-navy">Messages</h1>

      <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-black/5 bg-white">
        {threads.map((t) => (
          <Link key={t.id} href={`/dashboard/logistics/messages/${t.id}`} className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-gray-50">
            <div className="min-w-0">
              <p className={`truncate font-medium ${t.unread > 0 ? "text-brand-navy" : "text-gray-800"}`}>{t.name}</p>
              <p className="truncate text-sm text-gray-500">{t.lastMessage}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-gray-500">{t.lastAt.toLocaleDateString()}</span>
              {t.unread > 0 && <span className="rounded-full bg-brand-blue-deep px-1.5 py-0.5 text-xs font-semibold text-white">{t.unread}</span>}
            </div>
          </Link>
        ))}
        {threads.length === 0 && <p className="p-8 text-center text-sm text-gray-500">No conversations yet.</p>}
      </div>
    </div>
  );
}
