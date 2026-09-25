// Shared presentation tokens.
//
// These were copy-pasted into six files, which is exactly how they drifted:
// a PENDING connection rendered amber-100/amber-700 in three places and
// yellow-100/yellow-700 in AgentCard, so the same state wore two different
// colours side by side in the product. Anything that maps a status or a name
// to a class belongs here, so there is one place to change it.

/** Connection request lifecycle, used on both sides of a conversation. */
export const STATUS_STYLES: Record<string, string> = {
  ACCEPTED: "bg-ok-tint text-ok",
  DECLINED: "bg-bad-tint text-bad",
  PENDING: "bg-wait-tint text-wait",
};

/** ANCLA verification lifecycle. Shares the palette above on purpose:
 *  approved is green, refused is red, waiting is amber, everywhere. */
export const VERIFICATION_STYLES: Record<string, string> = {
  VERIFIED: "bg-ok-tint text-ok",
  REJECTED: "bg-bad-tint text-bad",
  PENDING: "bg-wait-tint text-wait",
};

// Deterministic so a company keeps the same avatar colour on every page,
// rather than changing as you navigate.
const AVATAR_STYLES = [
  "bg-avatar-1 text-paper",
  "bg-avatar-2 text-paper",
  "bg-avatar-3 text-paper",
  "bg-avatar-4 text-paper",
  "bg-avatar-5 text-paper",
  "bg-avatar-6 text-paper",
];

export function avatarStyle(seed: string): string {
  const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_STYLES[hash % AVATAR_STYLES.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
