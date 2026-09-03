import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// Split out from auth.ts on purpose: this file must stay free of anything
// that needs Node.js APIs (Prisma, bcrypt), because middleware.ts runs on
// the Edge runtime and only needs the JWT/session callbacks below — not the
// Credentials provider's `authorize` function, which does the Prisma
// lookup and only ever runs inside a real API route (Node runtime).
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // full provider list (with DB access) is added in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
