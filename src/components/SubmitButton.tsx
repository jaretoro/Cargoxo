"use client";

import { useFormStatus } from "react-dom";

// Every form in the app posts a Server Action, which means a full network
// round trip before anything on screen changes. Without this, the button
// looks dead after it's pressed: on a slow connection people press it again,
// which for checkout, messaging or an admin approval means doing the thing
// twice.
//
// useFormStatus only reports the status of the nearest parent <form>, so this
// has to be its own client component rendered inside the form — the form
// itself stays a Server Component.
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  name,
  value,
  title,
  "aria-label": ariaLabel,
  disabled,
}: {
  children: React.ReactNode;
  /** Shown in place of the label while the action runs. Omit to keep the label and just dim. */
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
  title?: string;
  "aria-label"?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const busy = pending || disabled;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      title={title}
      aria-label={ariaLabel}
      disabled={busy}
      // aria-busy so a screen reader announces the wait, not just a visual dim.
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

// Same idea for the icon-only and link-styled submits (bookmark toggle,
// "Reject", the logout item in the nav), where swapping the label would
// change the button's size and make the row jump.
export function SubmitIconButton({
  children,
  className = "",
  name,
  value,
  title,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
  title?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      title={title}
      aria-label={ariaLabel}
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}
