"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Admin access required.");
  }
  return session.user;
}

export async function verifyLogisticsAction(formData: FormData) {
  await requireAdmin();

  const userId = formData.get("userId") as string;
  const status = formData.get("status") as "VERIFIED" | "REJECTED";
  if (!["VERIFIED", "REJECTED"].includes(status)) throw new Error("Invalid status.");

  const rejectionReason = (formData.get("rejectionReason") as string)?.trim();
  if (status === "REJECTED" && !rejectionReason) {
    redirect("/admin/logistics?error=Give+a+reason+so+the+company+knows+what+to+fix.");
  }

  await prisma.logisticsProfile.update({
    where: { userId },
    data: {
      verificationStatus: status,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
      rejectionReason: status === "REJECTED" ? rejectionReason : null,
    },
  });

  // Verifying changes who appears in exporter search and what the overview
  // counters say, so those caches have to be dropped too — previously only
  // the queue itself was revalidated and everything else went stale.
  revalidatePath("/admin/logistics");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/dashboard/exporter");
  revalidatePath("/dashboard/logistics");
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = formData.get("userId") as string;

  // Deleting cascades to their profile, subscription, connections, messages,
  // reviews and saved agents, so this needs more than a stray click. The
  // page asks for confirmation first and passes it back here; the action
  // re-checks rather than trusting the UI to have asked.
  if (formData.get("confirm") !== "yes") {
    redirect("/admin/users?error=Deletion+needs+confirmation.");
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target) redirect("/admin/users?error=That+user+no+longer+exists.");

  // Admins are filtered out of the list, but the action is what actually
  // enforces it — otherwise a hand-made POST could delete the last admin
  // and lock everyone out of the portal.
  if (target.role === "ADMIN" || target.id === admin.id) {
    redirect("/admin/users?error=Admin+accounts+can%27t+be+deleted+here.");
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/dashboard/exporter");
}
