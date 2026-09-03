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
    { href: "/pricing", label: "Pricing", match: () => false },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "border-brand-blue text-brand-navy" : "border-transparent text-gray-500 hover:text-brand-navy"
            }`}
          >
            {t.label}
            {!!t.badge && (
              <span className="rounded-full bg-brand-blue px-1.5 py-0.5 text-xs font-semibold text-white">{t.badge}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
