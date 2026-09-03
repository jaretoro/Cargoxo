"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

type IconName = "grid" | "shield" | "users" | "card" | "tag" | "chart" | "bell" | "gear" | "signout";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true } as const;
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common} strokeLinejoin="round">
          <path d="M12 3l7 3v5c0 4.5-3 8.3-7 9.5-4-1.2-7-5-7-9.5V6z" />
        </svg>
      );
    case "users":
      return (
        <svg {...common} strokeLinecap="round">
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
          <circle cx="17.5" cy="9" r="2.6" />
          <path d="M17.8 20c0-2.4-1.1-4.3-3-5.4" />
        </svg>
      );
    case "card":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 14h4" strokeLinecap="round" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common} strokeLinejoin="round">
          <path d="M12 3h6a2 2 0 012 2v6l-9 9-8-8z" />
          <circle cx="16" cy="8" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common} strokeLinecap="round">
          <path d="M4 20V10M12 20V4M20 20v-7" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common} strokeLinejoin="round">
          <path d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" />
          <path d="M10 18.5a2 2 0 004 0" strokeLinecap="round" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13.5a7.6 7.6 0 000-3l1.9-1.5-2-3.4-2.2.7a7.6 7.6 0 00-2.6-1.5L14 2.5h-4l-.5 2.3a7.6 7.6 0 00-2.6 1.5l-2.2-.7-2 3.4L4.6 10.5a7.6 7.6 0 000 3L2.7 15l2 3.4 2.2-.7a7.6 7.6 0 002.6 1.5l.5 2.3h4l.5-2.3a7.6 7.6 0 002.6-1.5l2.2.7 2-3.4z" />
        </svg>
      );
    case "signout":
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </svg>
      );
  }
}

export function AdminSidebar({
  adminName,
  adminEmail,
  pendingVerifications,
  attentionSubscriptions,
}: {
  adminName: string;
  adminEmail: string;
  pendingVerifications: number;
  attentionSubscriptions: number;
}) {
  const pathname = usePathname();

  const managementLinks = [
    { to: "/admin", label: "Overview", icon: "grid" as const, end: true, badge: 0 },
    { to: "/admin/logistics", label: "Verifications", icon: "shield" as const, badge: pendingVerifications },
    { to: "/admin/users", label: "Users", icon: "users" as const, badge: 0 },
    { to: "/admin/subscriptions", label: "Subscriptions", icon: "card" as const, badge: attentionSubscriptions },
  ];

  const reportLinks = [
    { to: "/admin/pricing", label: "Pricing Page", icon: "tag" as const },
    { to: "/admin/analytics", label: "Analytics", icon: "chart" as const },
  ];

  const isActive = (to: string, end?: boolean) => (end ? pathname === to : pathname.startsWith(to));

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-brand-navy text-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-amber text-brand-navy font-bold">C</span>
        <div>
          <p className="text-sm font-bold leading-tight">Cargoxo</p>
          <p className="text-[11px] leading-tight text-white/50">Admin Portal</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-6 overflow-y-auto px-3">
        <div>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-white/35">Management</p>
          <div className="mt-2 space-y-1">
            {managementLinks.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(l.to, l.end) ? "bg-brand-navy-light text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon name={l.icon} />
                  {l.label}
                </span>
                {l.badge > 0 && <span className="rounded-full bg-brand-amber px-1.5 py-0.5 text-[11px] font-semibold text-brand-navy">{l.badge}</span>}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-white/35">Reports</p>
          <div className="mt-2 space-y-1">
            {reportLinks.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(l.to) ? "bg-brand-navy-light text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon name={l.icon} />
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="space-y-1">
          <Link
            href="/admin/notifications"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/admin/notifications") ? "bg-brand-navy-light text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon name="bell" />
            Notifications
          </Link>
          <Link
            href="/admin/settings"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/admin/settings") ? "bg-brand-navy-light text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon name="gear" />
            Settings
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-amber text-xs font-bold text-brand-navy">
            {adminName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{adminName}</p>
            <p className="truncate text-[11px] text-white/50">{adminEmail}</p>
          </div>
        </div>

        <form action={logoutAction}>
          <button type="submit" className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">
            <Icon name="signout" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
