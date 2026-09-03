"use client";

import { useActionState } from "react";
import { registerExporterAction } from "@/app/actions/register";

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-blue";

export function RegisterExporterForm() {
  const [error, formAction, pending] = useActionState(registerExporterAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full name</label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone number</label>
        <input id="phone" name="phone" placeholder="08012345678" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
          Company name <span className="text-gray-400">(optional)</span>
        </label>
        <input id="companyName" name="companyName" className={inputClass} />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address <span className="text-gray-400">(optional)</span>
        </label>
        <input id="address" name="address" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
        <input id="password" name="password" type="password" required minLength={8} className={inputClass} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand-blue px-4 py-2 font-semibold text-white hover:bg-brand-navy disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create exporter account"}
      </button>
    </form>
  );
}
