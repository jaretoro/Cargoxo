"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { isDemoModeEnabled } from "@/lib/demo";

// Server Action backing the login form. Auth.js's `signIn` performs a
// redirect internally on success by throwing a special Next.js redirect
// error — that must NOT be caught here, only real auth failures should be.
export type LoginState = { error?: string; email?: string };

export async function loginAction(
  _prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState | undefined> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Hand the email back so a mistyped password doesn't cost you both
      // fields. Deliberately the same message whether or not the account
      // exists, so this can't be used to discover registered emails.
      return { error: "Invalid email or password.", email: typeof email === "string" ? email : undefined };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

// One-click login for the seeded demo accounts (see README) — every seeded
// account shares the same password, so this just skips retyping it. Locked
// to that fixed list rather than accepting any email, so it can't be used
// as a generic "log in as anyone" shortcut.
const DEMO_ACCOUNTS = new Set([
  "admin@cargoxo.com",
  "exporter@cargoxo.com",
  "exporter2@cargoxo.com",
  "swiftcargo@cargoxo.com",
  "portlinkfreight@cargoxo.com",
  "newagentco@cargoxo.com",
]);

export async function quickLoginAction(formData: FormData) {
  if (!isDemoModeEnabled()) redirect("/login?error=Demo+login+is+disabled.");

  const email = formData.get("email") as string;
  if (!DEMO_ACCOUNTS.has(email)) redirect("/login?error=Unknown+demo+account.");

  try {
    await signIn("credentials", { email, password: "Cargoxo123!", redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=Quick+login+failed.");
    }
    throw error;
  }
}
