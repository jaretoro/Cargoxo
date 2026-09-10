import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/MessageThread";

// Newest N are shown; anything older is summarised rather than loaded, so a
// long-running conversation doesn't pull its whole history on every view.
const VISIBLE_MESSAGES = 50;

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

  const total = await prisma.message.count({ where: { connectionId } });
  // Fetch the newest slice, then flip it so the thread still reads oldest
  // to newest on screen.
  const recent = await prisma.message.findMany({
    where: { connectionId },
    orderBy: { createdAt: "desc" },
    take: VISIBLE_MESSAGES,
  });

  return (
    <MessageThread
      connectionId={connectionId}
      currentUserId={session.user.id}
      counterpartName={connection.logistics.logisticsProfile?.companyName ?? connection.logistics.name}
      counterpartSubtitle={connection.logistics.logisticsProfile?.location}
      status={connection.status}
      messages={recent.reverse()}
      olderCount={Math.max(0, total - recent.length)}
      backHref="/dashboard/exporter/messages"
      error={error}
    />
  );
}
