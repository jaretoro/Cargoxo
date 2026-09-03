"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { exporterRegisterSchema, logisticsRegisterSchema } from "@/lib/validation";

// Failed submissions hand the typed-in values back so the form can refill
// itself. Without this a single bad phone number emptied every field — an
// eight-field form asking to be retyped from scratch.
//
// The password is deliberately not echoed back: it would end up in the
// rendered payload and the browser cache, and it's one field to retype
// rather than eight.
export type RegisterState = {
  error?: string;
  values?: Record<string, string>;
};

function submittedValues(formData: FormData, fields: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }
  return values;
}

// Prisma raises P2002 when a unique constraint is violated. The explicit
// "already exists" checks below can still be beaten by two simultaneous
// signups, so this catches the loser of that race and turns a 500 into the
// same friendly message.
function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

const EXPORTER_FIELDS = ["name", "email", "phone", "companyName", "address"];
const LOGISTICS_FIELDS = ["name", "companyName", "email", "phone", "anclaNumber", "address", "location"];

export async function registerExporterAction(
  _prevState: RegisterState | undefined,
  formData: FormData
): Promise<RegisterState | undefined> {
  const values = submittedValues(formData, EXPORTER_FIELDS);

  const parsed = exporterRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
    address: formData.get("address"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again.", values };
  }
  const { name, email, phone, password, companyName, address } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists.", values };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
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
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "An account with that email already exists.", values };
    }
    throw error;
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard/exporter" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created — please log in." };
    }
    throw error;
  }
}

export async function registerLogisticsAction(
  _prevState: RegisterState | undefined,
  formData: FormData
): Promise<RegisterState | undefined> {
  const values = submittedValues(formData, LOGISTICS_FIELDS);

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
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again.", values };
  }
  const { name, email, phone, password, companyName, anclaNumber, address, location } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists.", values };
  }
  if (await prisma.logisticsProfile.findUnique({ where: { anclaNumber } })) {
    return { error: "That ANCLA number is already registered.", values };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
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
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "That email or ANCLA number is already registered.", values };
    }
    throw error;
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard/logistics" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created — please log in." };
    }
    throw error;
  }
}
