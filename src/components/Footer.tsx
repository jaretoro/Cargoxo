import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
        <Logo size={24} />
        <p className="max-w-md text-sm text-gray-500">
          Connecting Nigerian exporters with verified logistics companies for cocoa, cashew,
          sesame, and every other shipment leaving the country.
        </p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <Link href="/pricing" className="hover:text-brand-navy">Pricing</Link>
          <Link href="/register" className="hover:text-brand-navy">Register as exporter</Link>
          <Link href="/register/logistics" className="hover:text-brand-navy">Register as logistics company</Link>
          <Link href="/login" className="hover:text-brand-navy">Log in</Link>
        </nav>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Cargoxo. All rights reserved.</p>
      </div>
    </footer>
  );
}
