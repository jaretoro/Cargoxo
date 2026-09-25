import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  EXPORTER: "/dashboard/exporter",
  LOGISTICS: "/dashboard/logistics",
};

export async function Footer() {
  const session = await auth();
  const dashboardHref = session?.user ? DASHBOARD_BY_ROLE[session.user.role] ?? "/dashboard" : null;

  return (
    <footer className="border-t border-rule bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
        <Logo size={24} />
        <p className="max-w-md text-sm text-muted">
          Connecting Nigerian exporters with verified logistics companies for cocoa, cashew,
          sesame, and every other shipment leaving the country.
        </p>
        {/* Signed-in visitors don't need register/log-in links — offering
            them is the same mistake as showing sign-up CTAs in the hero. */}
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.1em] text-muted">
          <Link href="/pricing" className="tap hover:text-ink">Pricing</Link>
          {dashboardHref ? (
            <Link href={dashboardHref} className="tap hover:text-ink">Dashboard</Link>
          ) : (
            <>
              <Link href="/register" className="tap hover:text-ink">Register as exporter</Link>
              <Link href="/register/logistics" className="tap hover:text-ink">Register as logistics company</Link>
              <Link href="/login" className="tap hover:text-ink">Log in</Link>
            </>
          )}
        </nav>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Cargoxo. All rights reserved.</p>
      </div>
    </footer>
  );
}
