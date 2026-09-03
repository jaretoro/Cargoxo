import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Next.js 16 renamed "middleware" to "proxy" (same mechanism, clearer name).
// It always runs on the Node.js runtime now. We still build this on the
// edge-safe authConfig (no Prisma/bcrypt) — it's a fast, optimistic check
// on the JWT only. The real, authoritative check happens in each
// admin/dashboard page via `auth()` — see the Next.js authentication guide's
// guidance that proxy/middleware should never be the sole line of defense.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;
  const role = req.auth?.user?.role;

  const requiresRole =
    pathname.startsWith("/admin") ? "ADMIN"
    : pathname.startsWith("/dashboard/logistics") ? "LOGISTICS"
    : pathname.startsWith("/dashboard/exporter") ? "EXPORTER"
    : null;

  if (requiresRole && role !== requiresRole) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
