"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Toggles a logistics company in/out of the current exporter's saved list.
// Saving doesn't require a subscription — it's just a bookmark, not a
// contact reveal — so this is only gated on being a logged-in exporter.
export async function toggleSaveAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EXPORTER") redirect("/login");

  const logisticsId = formData.get("logisticsId") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard/exporter";
  if (!logisticsId) redirect(redirectTo);

  const existing = await prisma.savedAgent.findUnique({
    where: { exporterId_logisticsId: { exporterId: session.user.id, logisticsId } },
  });

  if (existing) {
    await prisma.savedAgent.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedAgent.create({ data: { exporterId: session.user.id, logisticsId } });
  }

  revalidatePath("/dashboard/exporter");
  revalidatePath("/dashboard/exporter/saved");
  redirect(redirectTo);
}

// Creates (or resumes) the Connection thread with a logistics company and
// logs the opening message, then drops the exporter straight into the
// thread. This is what the "Message" button on an agent card without an
// existing connection points at.
export async function startConversationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EXPORTER") redirect("/login");

  const logisticsId = formData.get("logisticsId") as string;
  const body = (formData.get("body") as string)?.trim();

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  if (subscription?.status !== "ACTIVE") {
    redirect("/dashboard/exporter?error=An+active+subscription+is+required+to+message+logistics+companies.");
  }
  if (!logisticsId || !body) {
    redirect(`/dashboard/exporter/messages/new?logistics=${logisticsId}&error=A+message+is+required.`);
  }

  const logistics = await prisma.logisticsProfile.findUnique({ where: { userId: logisticsId } });
  if (!logistics || logistics.verificationStatus !== "VERIFIED") {
    redirect("/dashboard/exporter?error=That+logistics+company+is+not+available.");
  }

  const connection = await prisma.connection.upsert({
    where: { exporterId_logisticsId: { exporterId: session.user.id, logisticsId } },
    update: { message: body, status: "PENDING" },
    create: { exporterId: session.user.id, logisticsId, message: body, status: "PENDING" },
  });

  await prisma.message.create({ data: { connectionId: connection.id, senderId: session.user.id, body } });

  revalidatePath("/dashboard/exporter/messages");
  revalidatePath("/dashboard/logistics");
  redirect(`/dashboard/exporter/messages/${connection.id}`);
}

// Posts a reply into an existing thread. Works for either side of the
// Connection — checked by membership, not by role — since both the
// exporter and the logistics company can reply once a thread exists.
export async function sendMessageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const connectionId = formData.get("connectionId") as string;
  const body = (formData.get("body") as string)?.trim();
  const base = session.user.role === "EXPORTER" ? "/dashboard/exporter" : "/dashboard/logistics";

  if (!connectionId || !body) {
    redirect(`${base}/messages/${connectionId}?error=A+message+is+required.`);
  }

  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection || (connection.exporterId !== session.user.id && connection.logisticsId !== session.user.id)) {
    redirect(base);
  }

  await prisma.message.create({ data: { connectionId, senderId: session.user.id, body } });

  revalidatePath(`/dashboard/exporter/messages/${connectionId}`);
  revalidatePath(`/dashboard/logistics/messages/${connectionId}`);
  revalidatePath("/dashboard/exporter/messages");
  revalidatePath("/dashboard/logistics/messages");
  redirect(`${base}/messages/${connectionId}`);
}
