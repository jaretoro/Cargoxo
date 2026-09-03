"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import {
  RESET_REQUEST_LIMIT,
  RESET_REQUEST_WINDOW_MS,
  generateResetToken,
  hashResetToken,
  resetTokenExpiry,
} from "@/lib/password-reset";
import { passwordResetRequestSchema, passwordResetSchema } from "@/lib/validation";

export type RequestResetState = { error?: string; sent?: boolean; email?: string };
// tokenInvalid separates "your link is dead, get another" from "fix this
// field" — offering a fresh link after a simple password mismatch just
// confuses the fix.
export type ResetPasswordState = { error?: string; tokenInvalid?: boolean };

export async function requestPasswordResetAction(
  _prevState: RequestResetState | undefined,
  formData: FormData
): Promise<RequestResetState> {
  const parsed = passwordResetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address.", email: String(formData.get("email") ?? "") };
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // The response is identical whether or not the account exists. Saying "no
  // such account" here would turn this form into a way to discover who is
  // registered, which is exactly what the login error already avoids.
  if (user) {
    const recentRequests = await prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - RESET_REQUEST_WINDOW_MS) } },
    });

    // Silently stop issuing links past the limit — still reporting success,
    // so the rate limit doesn't leak account existence either.
    if (recentRequests < RESET_REQUEST_LIMIT) {
      const { token, tokenHash } = generateResetToken();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: resetTokenExpiry() },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const link = `${appUrl}/reset-password?token=${token}`;

      await sendMail({
        to: email,
        subject: "Reset your Cargoxo password",
        text: [
          `Hi ${user.name},`,
          "",
          "Someone asked to reset the password for your Cargoxo account.",
          "Open the link below to choose a new one. It expires in an hour and works once.",
          "",
          link,
          "",
          "If this wasn't you, ignore this email — your password stays as it is.",
        ].join("\n"),
      });
    }
  }

  return { sent: true, email };
}

export async function resetPasswordAction(
  _prevState: ResetPasswordState | undefined,
  formData: FormData
): Promise<ResetPasswordState | undefined> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    include: { user: { select: { id: true } } },
  });

  // One message for every failure mode — expired, already used, never
  // existed — so a probe can't tell a real-but-spent token from a guess.
  const invalid = { error: "This reset link is invalid or has expired.", tokenInvalid: true };
  if (!record || record.usedAt || record.expiresAt < new Date()) return invalid;

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Burn every other outstanding link for this account: after a reset,
    // older emails sitting in an inbox must not still grant access.
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=1");
}
