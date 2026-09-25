"use client";

import { useState } from "react";

// A show/hide toggle matters more here than it normally would: there is no
// password reset flow yet, so a typo at signup locks the account for good.
export function PasswordField({
  id = "password",
  name = "password",
  label = "Password",
  autoComplete,
  minLength,
  hint,
}: {
  id?: string;
  name?: string;
  label?: string;
  autoComplete: "new-password" | "current-password";
  minLength?: number;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full rounded-md border border-gray-300 px-3 py-2 pr-16 outline-none focus:border-brand-blue"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-brand-navy"
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
