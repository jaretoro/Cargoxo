import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/MessageThread";

const VISIBLE_MESSAGES = 50;

export default async function LogisticsThread(props: PageProps<"/dashboard/logistics/messages/[connectionId]">) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  const { connectionId } = await props.params;
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
    include: { exporter: { select: { name: true, exporterProfile: { select: { companyName: true, address: true } } } } },
  });
  if (!connection || connection.logisticsId !== session.user.id) redirect("/dashboard/logistics/messages");

  await prisma.message.updateMany({
    where: { connectionId, senderId: { not: session.user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const total = await prisma.message.count({ where: { connectionId } });
  const recent = await prisma.message.findMany({
    where: { connectionId },
    orderBy: { createdAt: "desc" },
    take: VISIBLE_MESSAGES,
  });

  return (
    <MessageThread
      connectionId={connectionId}
      currentUserId={session.user.id}
      counterpartName={connection.exporter.exporterProfile?.companyName ?? connection.exporter.name}
      counterpartSubtitle={connection.exporter.exporterProfile?.address}
      status={connection.status}
      messages={recent.reverse()}
      olderCount={Math.max(0, total - recent.length)}
      backHref="/dashboard/logistics/messages"
      error={error}
    />
  );
}
