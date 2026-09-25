"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LogisticsTabs({ unreadCount, pendingRequests }: { unreadCount: number; pendingRequests: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard/logistics", label: "Overview", match: (p: string) => p === "/dashboard/logistics" },
    {
      href: "/dashboard/logistics/requests",
      label: "Requests",
      match: (p: string) => p.startsWith("/dashboard/logistics/requests"),
      badge: pendingRequests,
      tone: "amber" as const,
    },
    {
      href: "/dashboard/logistics/messages",
      label: "Messages",
      match: (p: string) => p.startsWith("/dashboard/logistics/messages"),
      badge: unreadCount,
      tone: "blue" as const,
    },
    { href: "/dashboard/logistics/profile", label: "Profile", match: (p: string) => p.startsWith("/dashboard/logistics/profile") },
  ];

  return (
    <div className="flex flex-wrap gap-1 border-b border-rule">
      {tabs.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
 active ? "border-ochre text-ink" : "border-transparent text-muted hover:text-ink"
 }`}
          >
            {t.label}
            {!!t.badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
 t.tone === "amber" ? "bg-wait-tint text-wait" : "bg-ink text-paper"
 }`}
              >
                {t.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
