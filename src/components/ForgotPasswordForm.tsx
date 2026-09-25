"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type RequestResetState } from "@/app/actions/password";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<RequestResetState | undefined, FormData>(
    requestPasswordResetAction,
    undefined
  );

  if (state?.sent) {
    return (
      <div>
        <div className="bg-ok-tint px-4 py-3 text-sm text-ok">
          If an account exists for <span className="font-medium">{state.email}</span>, a reset link is on its way. It
          expires in an hour.
        </div>
        <p className="mt-4 text-sm text-muted">
          Didn&rsquo;t get it? Check spam, or{" "}
          <Link href="/forgot-password" className="font-medium text-ochre hover:underline">
            try again
          </Link>
          .
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-ochre hover:underline">
          ← Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
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

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink px-4 py-2 font-semibold text-paper hover:bg-ink-hover disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ochre hover:underline">
          Log in
        </Link>
        .
      </p>
    </form>
  );
}
