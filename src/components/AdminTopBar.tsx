function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" strokeLinejoin="round" />
      <path d="M10 18.5a2 2 0 004 0" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="10" cy="10" r="6.5" />
      <path d="M20 20l-5.5-5.5" />
    </svg>
  );
}

export function AdminTopBar({ adminName, hasUnread }: { adminName: string; hasUnread: boolean }) {
  const dateLabel = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <header className="flex items-center justify-end gap-3 border-b border-black/5 bg-white px-6 py-3">
      {/* A real search, not decoration — it used to be an input that looked
          functional and did nothing, which is worse than having none. */}
      <form action="/admin/users" className="relative hidden md:block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          <SearchIcon />
        </span>
        <input
          name="q"
          type="search"
          placeholder="Search users, companies…"
          aria-label="Search users and companies"
          className="w-64 rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-blue"
        />
      </form>
      <span className="hidden rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 lg:inline-block">{dateLabel}</span>
      <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
        <BellIcon />
        {hasUnread && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}
      </button>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-amber text-xs font-bold text-brand-navy">
        {adminName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join("")}
      </span>
      <span className="hidden text-sm font-medium text-gray-700 sm:inline">Admin</span>
    </header>
  );
}
