import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Landing spot right after login. The role isn't known until the session
// resolves, so we route from here rather than guessing a destination
// up front (see src/app/actions/auth.ts's redirectTo: "/dashboard").
export default async function DashboardRouter() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin");
    case "LOGISTICS":
      redirect("/dashboard/logistics");
    case "EXPORTER":
    default:
      redirect("/dashboard/exporter");
  }
}
