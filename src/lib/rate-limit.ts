import { prisma } from "@/lib/prisma";

// Database-backed fixed-window rate limiter. Counters live in the RateLimit
// table instead of process memory, so a limit holds across restarts and is
// shared by every instance of the app. That makes it safe on serverless and
// behind a load balancer, without running Redis.
//
// Fixed windows are approximate: a client can land up to 2x the limit across
// a window boundary. That's acceptable for cost protection, which is what
// this is for.

const SWEEP_PROBABILITY = 0.01;
const SWEEP_OLDER_THAN_MS = 24 * 60 * 60_000;

/**
 * Records one hit against `key` and reports whether it went over `limit`
 * within the current window of `windowMs`.
 */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  // One atomic statement: insert the counter, or bump it if it's still in the
  // same window, or restart it at 1 if the stored window is stale. Doing the
  // read and the write separately would let concurrent requests both see
  // the old count and slip past the limit.
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" = EXCLUDED."windowStart" THEN "RateLimit"."count" + 1
        ELSE 1
      END,
      "windowStart" = EXCLUDED."windowStart"
    RETURNING "count"
  `;

  // Rows are one per key and reset in place, so the table only grows with
  // the number of distinct clients. Clear out ones nobody has used in a day,
  // occasionally, without making every request pay for it.
  if (Math.random() < SWEEP_PROBABILITY) {
    prisma.rateLimit
      .deleteMany({ where: { windowStart: { lt: new Date(now - SWEEP_OLDER_THAN_MS) } } })
      .catch((error) => console.error("Rate limit sweep failed:", error));
  }

  return (rows[0]?.count ?? 0) > limit;
}

/**
 * Best-effort client IP for rate limiting.
 *
 * The leftmost X-Forwarded-For entry is whatever the client chose to send,
 * so trusting it lets anyone dodge a per-IP limit by inventing a new address
 * on each request. Set CLIENT_IP_HEADER to the header your host's proxy
 * overwrites with the real address — `do-connecting-ip` on DigitalOcean App
 * Platform, `x-real-ip` on Vercel, `cf-connecting-ip` behind Cloudflare.
 * Unset, this falls back to the usual headers, which is fine locally but
 * spoofable in production.
 */
export function getClientIp(request: Request): string {
  const trustedHeader = process.env.CLIENT_IP_HEADER?.trim();
  if (trustedHeader) {
    return request.headers.get(trustedHeader)?.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
