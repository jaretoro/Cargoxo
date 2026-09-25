import Link from "next/link";
import { Logo } from "./Logo";
import { logoutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Minimal chrome for /dashboard/* now that they've opted out of the
// marketing Navbar (see (marketing)/layout.tsx). It also carries who you're
// signed in as — the bar was previously a logo and a Log out button with a
// wide empty gap between them.
export function DashboardHeader({
  userName,
  subtitle,
  statusLabel,
  statusTone = "neutral",
}: {
  userName: string;
  subtitle?: string | null;
  statusLabel?: string;
  statusTone?: "positive" | "warning" | "negative" | "neutral";
}) {
  const toneClasses = {
    positive: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    negative: "bg-red-100 text-red-700",
    neutral: "bg-gray-100 text-gray-600",
  }[statusTone];

  return (
    <header className="border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          {statusLabel && (
            <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-block ${toneClasses}`}>
              {statusLabel}
            </span>
          )}

          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-medium text-brand-navy">{userName}</p>
            {subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
            {initials(userName)}
          </span>

          <form action={logoutAction}>
            <SubmitButton
              pendingLabel="Signing out…"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Log out
            </SubmitButton>
          </form>
        </div>
      </div>
    </header>
  );
}
