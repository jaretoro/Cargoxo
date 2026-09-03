import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/DashboardHeader";

export default async function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  const profile = await prisma.logisticsProfile.findUnique({
    where: { userId: session.user.id },
    select: { companyName: true, verificationStatus: true },
  });

  return (
    <div className="min-h-full bg-[#f7f8fa]">
      <DashboardHeader
        userName={session.user.name ?? "Logistics"}
        subtitle={profile?.companyName}
        statusLabel={profile?.verificationStatus === "VERIFIED" ? "Verified" : profile?.verificationStatus === "PENDING" ? "Pending review" : undefined}
        statusTone={profile?.verificationStatus === "VERIFIED" ? "positive" : "warning"}
      />
      {children}
    </div>
  );
}
