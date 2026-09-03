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
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          If an account exists for <span className="font-medium">{state.email}</span>, a reset link is on its way. It
          expires in an hour.
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Didn&rsquo;t get it? Check spam, or{" "}
          <Link href="/forgot-password" className="font-medium text-brand-blue hover:underline">
            try again
          </Link>
          .
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-brand-blue hover:underline">
          ← Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.email ?? ""}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-blue"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand-blue px-4 py-2 font-semibold text-white hover:bg-brand-navy disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brand-blue hover:underline">
          Log in
        </Link>
        .
      </p>
    </form>
  );
}
