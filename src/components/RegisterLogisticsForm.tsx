"use client";

import { useActionState } from "react";
import { registerLogisticsAction, type RegisterState } from "@/app/actions/register";
import { PasswordField } from "@/components/PasswordField";

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-blue";

export function RegisterLogisticsForm() {
  const [state, formAction, pending] = useActionState<RegisterState | undefined, FormData>(
    registerLogisticsAction,
    undefined
  );
  const v = state?.values ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Contact person&apos;s name</label>
        <input id="name" name="name" required autoComplete="name" defaultValue={v.name ?? ""} className={inputClass} />
      </div>
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company name</label>
        <input id="companyName" name="companyName" required autoComplete="organization" defaultValue={v.companyName ?? ""} className={inputClass} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={v.email ?? ""} className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08012345678"
          required
          defaultValue={v.phone ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="anclaNumber" className="block text-sm font-medium text-gray-700">ANCLA number</label>
        <input
          id="anclaNumber"
          name="anclaNumber"
          placeholder="ANCLA/LAG/00123"
          required
          defaultValue={v.anclaNumber ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">Used by our admin team to verify your company before you go live.</p>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Business address</label>
        <input id="address" name="address" required autoComplete="street-address" defaultValue={v.address ?? ""} className={inputClass} />
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location (state/city)</label>
        <input
          id="location"
          name="location"
          placeholder="Lagos"
          required
          autoComplete="address-level1"
          defaultValue={v.location ?? ""}
          className={inputClass}
        />
      </div>

      <PasswordField autoComplete="new-password" minLength={8} hint="At least 8 characters." />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand-blue-deep px-4 py-2 font-semibold text-white hover:bg-brand-navy disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit for verification"}
      </button>
    </form>
  );
}
