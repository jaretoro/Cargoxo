"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Logistics company accepting or declining an exporter's connection
// request. Starting a connection now happens via startConversationAction
// in actions/agents.ts (it creates the Connection and its first Message
// together); this only handles the accept/decline step.
export async function respondConnectionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") {
    redirect("/login");
  }

  const connectionId = formData.get("connectionId") as string;
  const status = formData.get("status") as "ACCEPTED" | "DECLINED";
  if (!["ACCEPTED", "DECLINED"].includes(status)) {
    redirect("/dashboard/logistics/requests?error=Invalid+status.");
  }

  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection || connection.logisticsId !== session.user.id) {
    redirect("/dashboard/logistics/requests?error=Connection+request+not+found.");
  }

  await prisma.connection.update({ where: { id: connectionId }, data: { status } });
  // The overview's counters and the tab badge both read this, so they have
  // to be refreshed alongside the list the button was pressed on.
  revalidatePath("/dashboard/logistics/requests");
  revalidatePath("/dashboard/logistics");
  revalidatePath("/dashboard/exporter/connections");
  revalidatePath("/dashboard/exporter");
}
