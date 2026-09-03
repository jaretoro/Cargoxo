import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardHeader } from "@/components/DashboardHeader";

export default async function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  return (
    <div className="min-h-full bg-[#f7f8fa]">
      <DashboardHeader />
      {children}
    </div>
  );
}
