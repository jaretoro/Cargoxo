"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { exporterRegisterSchema, logisticsRegisterSchema } from "@/lib/validation";

export async function registerExporterAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = exporterRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
    address: formData.get("address"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Please check the form and try again.";
  }
  const { name, email, phone, password, companyName, address } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return "An account with that email already exists.";
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "EXPORTER",
      exporterProfile: {
        create: { companyName: companyName || null, address: address || null },
      },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard/exporter" });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Account created — please log in.";
    }
    throw error;
  }
}

export async function registerLogisticsAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = logisticsRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
    anclaNumber: formData.get("anclaNumber"),
    address: formData.get("address"),
    location: formData.get("location"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Please check the form and try again.";
  }
  const { name, email, phone, password, companyName, anclaNumber, address, location } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return "An account with that email already exists.";
  }
  if (await prisma.logisticsProfile.findUnique({ where: { anclaNumber } })) {
    return "That ANCLA number is already registered.";
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "LOGISTICS",
      logisticsProfile: {
        create: { companyName, anclaNumber, address, location, verificationStatus: "PENDING" },
      },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard/logistics" });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Account created — please log in.";
    }
    throw error;
  }
}
