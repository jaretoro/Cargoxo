import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  EXPORTER: "/dashboard/exporter",
  LOGISTICS: "/dashboard/logistics",
};

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          <Link href="/#how-it-works" className="tap text-xs font-medium uppercase tracking-[0.13em] text-muted hover:text-ink">How it works</Link>
          <Link href="/pricing" className="tap text-xs font-medium uppercase tracking-[0.13em] text-muted hover:text-ink">Pricing</Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href={DASHBOARD_BY_ROLE[session.user.role] ?? "/"}
                className="tap text-xs font-medium uppercase tracking-[0.13em] text-muted hover:text-ink"
              >
                Dashboard
              </Link>
              <form action={logoutAction}>
                <SubmitButton
                  pendingLabel="Signing out…"
                  className="border border-rule px-5 py-3 text-xs font-medium uppercase tracking-[0.13em] text-ink-soft hover:bg-paper-deep"
                >
                  Log out
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="tap text-xs font-medium uppercase tracking-[0.13em] text-muted hover:text-ink">
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.13em] text-paper hover:bg-ink-hover"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
