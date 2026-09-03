import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExporterTabs } from "@/components/ExporterTabs";
import { DashboardHeader } from "@/components/DashboardHeader";

export default async function ExporterLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EXPORTER") redirect("/login");

  const unreadCount = await prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: session.user.id },
      connection: { exporterId: session.user.id },
    },
  });

  return (
    <div className="min-h-full bg-[#f7f8fa]">
      <DashboardHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ExporterTabs unreadCount={unreadCount} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
