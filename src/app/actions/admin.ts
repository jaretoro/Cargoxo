"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Admin access required.");
  }
}

export async function verifyLogisticsAction(formData: FormData) {
  await requireAdmin();

  const userId = formData.get("userId") as string;
  const status = formData.get("status") as "VERIFIED" | "REJECTED";
  if (!["VERIFIED", "REJECTED"].includes(status)) throw new Error("Invalid status.");

  await prisma.logisticsProfile.update({
    where: { userId },
    data: { verificationStatus: status, verifiedAt: status === "VERIFIED" ? new Date() : null },
  });

  revalidatePath("/admin/logistics");
}

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}
