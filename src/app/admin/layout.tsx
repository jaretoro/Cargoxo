import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopBar } from "@/components/AdminTopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [pendingVerifications, attentionSubscriptions] = await Promise.all([
    prisma.logisticsProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.subscription.count({ where: { status: "PAST_DUE" } }),
  ]);

  return (
    <div className="flex min-h-full bg-[#f3f4f7]">
      <AdminSidebar
        adminName={session.user.name ?? "Admin"}
        adminEmail={session.user.email ?? ""}
        pendingVerifications={pendingVerifications}
        attentionSubscriptions={attentionSubscriptions}
      />
      <div className="min-w-0 flex-1">
        <AdminTopBar adminName={session.user.name ?? "Admin"} hasUnread={pendingVerifications > 0} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
