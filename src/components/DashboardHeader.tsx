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
    positive: "bg-ok-tint text-ok",
    warning: "bg-wait-tint text-wait",
    negative: "bg-bad-tint text-bad",
    neutral: "bg-paper-deep text-ink-soft",
  }[statusTone];

  return (
    <header className="border-b border-rule bg-surface">
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
            <p className="truncate text-sm font-medium text-ink">{userName}</p>
            {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
            {initials(userName)}
          </span>

          <form action={logoutAction}>
            <SubmitButton
              pendingLabel="Signing out…"
              className="border border-rule px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-deep"
            >
              Log out
            </SubmitButton>
          </form>
        </div>
      </div>
    </header>
  );
}
