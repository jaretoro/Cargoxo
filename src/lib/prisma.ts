import { PrismaClient } from "@prisma/client";

// Next.js reloads modules on every hot-reload in dev, which would otherwise
// spawn a fresh PrismaClient (and a fresh DB connection) on every edit.
// Stashing the client on `globalThis` makes dev reuse the same instance.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
