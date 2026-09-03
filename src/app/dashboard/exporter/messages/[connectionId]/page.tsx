import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageAction } from "@/app/actions/agents";

export default async function ExporterThread(props: PageProps<"/dashboard/exporter/messages/[connectionId]">) {
  const session = await auth();
  if (!session?.user) return null; // guarded by layout

  const { connectionId } = await props.params;
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
    include: { logistics: { select: { name: true, logisticsProfile: { select: { companyName: true, location: true } } } } },
  });
  if (!connection || connection.exporterId !== session.user.id) redirect("/dashboard/exporter/messages");

  await prisma.message.updateMany({
    where: { connectionId, senderId: { not: session.user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const messages = await prisma.message.findMany({ where: { connectionId }, orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-brand-navy">{connection.logistics.logisticsProfile?.companyName ?? connection.logistics.name}</h1>
      <p className="text-sm text-gray-500">{connection.logistics.logisticsProfile?.location}</p>

      {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <div className="mt-6 space-y-3 rounded-xl border border-black/5 bg-white p-4 shadow-sm">
        {messages.map((m) => {
          const mine = m.senderId === session.user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-700"}`}>
                <p>{m.body}</p>
                <p className={`mt-1 text-xs ${mine ? "text-white/70" : "text-gray-400"}`}>{m.createdAt.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-center text-sm text-gray-400">No messages yet.</p>}
      </div>

      <form action={sendMessageAction} className="mt-4 flex gap-2">
        <input type="hidden" name="connectionId" value={connectionId} />
        <input
          name="body"
          required
          placeholder="Type a message…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
        />
        <button type="submit" className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy">
          Send
        </button>
      </form>
    </div>
  );
}
