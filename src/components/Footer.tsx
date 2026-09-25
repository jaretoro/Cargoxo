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
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
        <Logo size={24} />
        <p className="max-w-md text-sm text-gray-500">
          Connecting Nigerian exporters with verified logistics companies for cocoa, cashew,
          sesame, and every other shipment leaving the country.
        </p>
        {/* Signed-in visitors don't need register/log-in links — offering
            them is the same mistake as showing sign-up CTAs in the hero. */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <Link href="/pricing" className="hover:text-brand-navy">Pricing</Link>
          {dashboardHref ? (
            <Link href={dashboardHref} className="hover:text-brand-navy">Dashboard</Link>
          ) : (
            <>
              <Link href="/register" className="hover:text-brand-navy">Register as exporter</Link>
              <Link href="/register/logistics" className="hover:text-brand-navy">Register as logistics company</Link>
              <Link href="/login" className="hover:text-brand-navy">Log in</Link>
            </>
          )}
        </nav>
        <p className="text-xs text-gray-500">© {new Date().getFullYear()} Cargoxo. All rights reserved.</p>
      </div>
    </footer>
  );
}
