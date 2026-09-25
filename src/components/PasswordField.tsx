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
      <label htmlFor={id} className="block text-sm font-medium text-ink-soft">
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
          className="w-full border border-rule px-3 py-2 pr-16 outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-2.5 text-xs font-medium text-muted hover:bg-paper-deep hover:text-ink"
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
