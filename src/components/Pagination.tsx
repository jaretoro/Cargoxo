import Link from "next/link";
import { pageHref, type PageInfo } from "@/lib/pagination";

// Plain links rather than buttons, so a page is shareable, opens in a new
// tab, and works with the back button.
export function Pagination({
  info,
  basePath,
  params,
  label = "results",
}: {
  info: PageInfo;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  label?: string;
}) {
  if (info.total === 0) return null;

  // A single page still shows the count — it's useful — but not the
  // controls, which would just be two dead buttons.
  const showControls = info.totalPages > 1;

  const linkClass = "rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50";
  const disabledClass = "rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-300";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-gray-500">
        Showing {info.from}–{info.to} of {info.total} {label}
      </p>

      {showControls && (
        <div className="flex items-center gap-2">
          {info.hasPrev ? (
            <Link href={pageHref(basePath, params, info.page - 1)} className={linkClass} rel="prev">
              Previous
            </Link>
          ) : (
            <span className={disabledClass}>Previous</span>
          )}

          <span className="text-xs text-gray-500">
            Page {info.page} of {info.totalPages}
          </span>

          {info.hasNext ? (
            <Link href={pageHref(basePath, params, info.page + 1)} className={linkClass} rel="next">
              Next
            </Link>
          ) : (
            <span className={disabledClass}>Next</span>
          )}
        </div>
      )}
    </div>
  );
}
