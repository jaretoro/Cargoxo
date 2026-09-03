import { createHash, randomBytes } from "crypto";

// One hour: long enough to find the email, short enough that a link left in
// an inbox or a shared browser stops working reasonably fast.
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// How many reset emails one address can trigger inside the window, so the
// form can't be used to flood somebody's inbox.
export const RESET_REQUEST_LIMIT = 3;
export const RESET_REQUEST_WINDOW_MS = 15 * 60 * 1000;

export function generateResetToken(): { token: string; tokenHash: string } {
  // 32 random bytes — not a uuid or a timestamp, both of which are guessable
  // enough to be worth avoiding for something that grants account access.
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

// Plain SHA-256 rather than bcrypt: the token already has 256 bits of
// entropy, so there is nothing to brute-force, and lookup needs to be a
// single indexed query rather than a scan-and-compare over every row.
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function resetTokenExpiry(now = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MS);
}
