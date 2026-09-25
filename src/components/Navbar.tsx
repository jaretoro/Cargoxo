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
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          <Link href="/#how-it-works" className="tap hover:text-brand-navy">How it works</Link>
          <Link href="/pricing" className="tap hover:text-brand-navy">Pricing</Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href={DASHBOARD_BY_ROLE[session.user.role] ?? "/"}
                className="tap text-sm font-medium text-gray-700 hover:text-brand-navy"
              >
                Dashboard
              </Link>
              <form action={logoutAction}>
                <SubmitButton
                  pendingLabel="Signing out…"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Log out
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="tap text-sm font-medium text-gray-700 hover:text-brand-navy">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand-blue-deep px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy"
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
