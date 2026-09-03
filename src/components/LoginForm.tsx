"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-blue"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-blue"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand-blue px-4 py-2 font-semibold text-white hover:bg-brand-navy disabled:opacity-50"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-gray-500">
        No account?{" "}
        <Link href="/register" className="font-medium text-brand-blue hover:underline">
          Register as an exporter
        </Link>{" "}
        or{" "}
        <Link href="/register/logistics" className="font-medium text-brand-blue hover:underline">
          as a logistics company
        </Link>
        .
      </p>
    </form>
  );
}
