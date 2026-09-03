"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logisticsProfileUpdateSchema } from "@/lib/validation";

// Lets a logistics company fill in the details their marketplace card is
// built from. Until this existed, cargo types, routes and founding year
// could only be set by the seed script, so every genuine signup showed up
// in search as an empty card.
//
// The profile is always looked up by the session's own userId — the form
// never submits a profile id, so there's nothing to tamper with to edit
// somebody else's company.
export async function updateLogisticsProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  const parsed = logisticsProfileUpdateSchema.safeParse({
    companyName: formData.get("companyName"),
    address: formData.get("address"),
    location: formData.get("location"),
    establishedYear: formData.get("establishedYear") ?? "",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    redirect(`/dashboard/logistics/profile?error=${encodeURIComponent(message)}`);
  }

  const profile = await prisma.logisticsProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/dashboard/logistics");

  // Cargo types arrive as ids; intersect with what actually exists so a
  // hand-crafted POST can't attach an arbitrary id.
  const submittedCargoIds = formData.getAll("cargo").filter((v): v is string => typeof v === "string");
  const validCargoIds = (
    await prisma.cargoType.findMany({ where: { id: { in: submittedCargoIds } }, select: { id: true } })
  ).map((c) => c.id);

  // Routes are parallel origin/destination inputs, zipped back into pairs.
  // Blank rows are how you delete one, so they're simply dropped.
  const origins = formData.getAll("origin").map((v) => String(v).trim());
  const destinations = formData.getAll("destination").map((v) => String(v).trim());
  const routes = origins
    .map((origin, i) => ({ origin, destination: destinations[i]?.trim() ?? "" }))
    .filter((r) => r.origin && r.destination)
    .slice(0, 12);

  await prisma.$transaction([
    prisma.logisticsProfile.update({
      where: { id: profile.id },
      data: {
        companyName: parsed.data.companyName,
        address: parsed.data.address,
        location: parsed.data.location,
        establishedYear: parsed.data.establishedYear,
        cargoTypes: { set: validCargoIds.map((id) => ({ id })) },
      },
    }),
    // Routes have no natural key to diff against, so they're replaced wholesale.
    prisma.tradeRoute.deleteMany({ where: { logisticsProfileId: profile.id } }),
    prisma.tradeRoute.createMany({
      data: routes.map((r) => ({ ...r, logisticsProfileId: profile.id })),
    }),
  ]);

  revalidatePath("/dashboard/logistics/profile");
  revalidatePath("/dashboard/logistics");
  revalidatePath("/dashboard/exporter");
  redirect("/dashboard/logistics/profile?saved=1");
}
