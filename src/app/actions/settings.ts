"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SETTING_KEYS } from "@/lib/settings";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Admin access required.");
}

function back(error?: string, saved?: string) {
  const params = new URLSearchParams();
  if (error) params.set("error", error);
  if (saved) params.set("saved", saved);
  redirect(`/admin/settings${params.toString() ? `?${params}` : ""}`);
}

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();

  const supportEmail = (formData.get("supportEmail") as string)?.trim();
  const ngnPerUsdRaw = (formData.get("ngnPerUsd") as string)?.trim();

  if (!supportEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(supportEmail)) {
    back("Enter a valid support email address.");
  }

  const rate = Number(ngnPerUsdRaw);
  if (!Number.isFinite(rate) || rate <= 0) {
    back("The naira rate must be a number greater than zero.");
  }

  // Upsert rather than update: an absent row is the normal starting state,
  // since settings.ts treats "missing" as "use the default".
  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.supportEmail },
      update: { value: supportEmail },
      create: { key: SETTING_KEYS.supportEmail, value: supportEmail },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.ngnPerUsd },
      update: { value: String(rate) },
      create: { key: SETTING_KEYS.ngnPerUsd, value: String(rate) },
    }),
  ]);

  // The rate shows on public pricing and billing; the support address shows
  // to rejected companies. Drop all of those caches, not just this page.
  revalidatePath("/admin/settings");
  revalidatePath("/pricing");
  revalidatePath("/");
  revalidatePath("/dashboard/exporter/billing");
  revalidatePath("/dashboard/logistics");
  back(undefined, "1");
}

export async function addCargoTypeAction(formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 2) back("Enter a cargo type name.");

  // Case-insensitive check so "Frozen foods" can't sit next to "Frozen
  // Foods" — exporters filter on these, and near-duplicates split results.
  // Compared in JS so the error can name the existing spelling; the list is
  // short enough that it doesn't matter.
  const all = await prisma.cargoType.findMany({ select: { name: true } });
  const clash = all.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (clash) back(`"${clash.name}" already exists.`);

  await prisma.cargoType.create({ data: { name } });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/exporter");
  revalidatePath("/dashboard/logistics/profile");
  back(undefined, "1");
}

export async function deleteCargoTypeAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  if (formData.get("confirm") !== "yes") back("Deleting a cargo type needs confirmation.");

  const cargoType = await prisma.cargoType.findUnique({
    where: { id },
    include: { _count: { select: { logisticsProfiles: true } } },
  });
  if (!cargoType) back("That cargo type no longer exists.");

  // Deleting only unlinks it from profiles (implicit many-to-many), it does
  // not touch the companies themselves — but those companies silently lose a
  // filter they were findable by, so the page warns with the usage count.
  await prisma.cargoType.delete({ where: { id } });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/exporter");
  revalidatePath("/dashboard/logistics/profile");
  back(undefined, "1");
}
