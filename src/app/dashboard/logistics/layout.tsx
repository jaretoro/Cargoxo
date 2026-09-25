import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LogisticsTabs } from "@/components/LogisticsTabs";

export default async function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  const [profile, unreadCount, pendingRequests] = await Promise.all([
    prisma.logisticsProfile.findUnique({
      where: { userId: session.user.id },
      select: { companyName: true, verificationStatus: true },
    }),
    prisma.message.count({
      where: { readAt: null, senderId: { not: session.user.id }, connection: { logisticsId: session.user.id } },
    }),
    prisma.connection.count({ where: { logisticsId: session.user.id, status: "PENDING" } }),
  ]);

  return (
    <div className="min-h-full bg-[#f7f4ed]">
      <DashboardHeader
        userName={session.user.name ?? "Logistics"}
        subtitle={profile?.companyName}
        statusLabel={
          profile?.verificationStatus === "VERIFIED"
            ? "Verified"
            : profile?.verificationStatus === "REJECTED"
              ? "Not verified"
              : "Pending review"
        }
        statusTone={
          profile?.verificationStatus === "VERIFIED" ? "positive" : profile?.verificationStatus === "REJECTED" ? "negative" : "warning"
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <LogisticsTabs unreadCount={unreadCount} pendingRequests={pendingRequests} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
