// Shared paging maths. Pages are 1-based in the URL because that's what a
// person reading "?page=2" expects; the offset maths stays in here.

export const DEFAULT_PAGE_SIZE = 20;

export type PageInfo = {
  page: number;
  pageSize: number;
  skip: number;
  totalPages: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  from: number;
  to: number;
};

export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function getPageInfo(total: number, requestedPage: number, pageSize = DEFAULT_PAGE_SIZE): PageInfo {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp rather than 404: deleting the last row on page 3 shouldn't strand
  // anyone on an empty page, and a hand-typed ?page=99 should still show
  // something sensible.
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    skip,
    totalPages,
    total,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    from: total === 0 ? 0 : skip + 1,
    to: Math.min(skip + pageSize, total),
  };
}

// Builds "?page=N" while keeping whatever filters are already in the URL —
// paging must not silently drop a search or a status tab.
export function pageHref(basePath: string, currentParams: Record<string, string | string[] | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(currentParams)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
