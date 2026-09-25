"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "@/app/actions/password";
import { PasswordField } from "@/components/PasswordField";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordState | undefined, FormData>(
    resetPasswordAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <p role="alert" className="bg-bad-tint px-3 py-2 text-sm text-bad">
          {state.error}
          {state.tokenInvalid && (
            <>
              {" "}
              <Link href="/forgot-password" className="font-medium underline">
                Request a new one
              </Link>
              .
            </>
          )}
        </p>
      )}

      <PasswordField label="New password" autoComplete="new-password" minLength={8} hint="At least 8 characters." />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        minLength={8}
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink px-4 py-2 font-semibold text-paper hover:bg-ink-hover disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
