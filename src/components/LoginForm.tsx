"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { PasswordField } from "@/components/PasswordField";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state?.error && (
        <p role="alert" className="bg-bad-tint px-3 py-2 text-sm text-bad">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink-soft">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.email ?? ""}
          className="mt-1 w-full border border-rule px-3 py-2 outline-none focus:border-ink"
        />
      </div>

      <div>
        <PasswordField autoComplete="current-password" />
        <p className="mt-1 text-right">
          <Link href="/forgot-password" className="text-xs font-medium text-ochre hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink px-4 py-2 font-semibold text-paper hover:bg-ink-hover disabled:opacity-50"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="font-medium text-ochre hover:underline">
          Register as an exporter
        </Link>{" "}
        or{" "}
        <Link href="/register/logistics" className="font-medium text-ochre hover:underline">
          as a logistics company
        </Link>
        .
      </p>
    </form>
  );
}
