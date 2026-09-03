import Link from "next/link";
import { Logo } from "./Logo";
import { logoutAction } from "@/app/actions/auth";

// Minimal chrome for /dashboard/* now that they've opted out of the
// marketing Navbar (see (marketing)/layout.tsx) — just enough to get back
// home and sign out.
export function DashboardHeader() {
  return (
    <header className="border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
