import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Extends Auth.js's built-in types so `session.user.id` / `.role` and
// `user.role` (returned from `authorize`) type-check across the app.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
