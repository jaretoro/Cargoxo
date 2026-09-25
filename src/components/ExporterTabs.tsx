"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ExporterTabs({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard/exporter", label: "All Agents", match: (p: string) => p === "/dashboard/exporter" },
    { href: "/dashboard/exporter/connections", label: "My Connections", match: (p: string) => p.startsWith("/dashboard/exporter/connections") },
    { href: "/dashboard/exporter/messages", label: "Messages", match: (p: string) => p.startsWith("/dashboard/exporter/messages"), badge: unreadCount },
    { href: "/dashboard/exporter/saved", label: "Saved", match: (p: string) => p.startsWith("/dashboard/exporter/saved") },
    // Billing rather than Pricing: a marketing page in a workspace nav is
    // wrong for the half of exporters who already subscribed. This one shows
    // their plan if they have one, and the plans if they don't.
    { href: "/dashboard/exporter/billing", label: "Billing", match: (p: string) => p.startsWith("/dashboard/exporter/billing") },
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
              <span className="rounded-full bg-ink px-1.5 py-0.5 text-xs font-semibold text-paper">{t.badge}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
