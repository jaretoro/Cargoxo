// Shared placeholders for the loading.tsx boundaries. They deliberately echo
// the real layout's shapes (a header block, then cards) so the page doesn't
// visibly jump when the data arrives.

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-rule ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="border border-rule bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-rule" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-3.5 w-2/3" />
          <SkeletonLine className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonLine className="mt-4 h-8 w-full" />
      <div className="mt-4 flex gap-2">
        <SkeletonLine className="h-4 w-20" />
        <SkeletonLine className="h-4 w-24" />
      </div>
      <SkeletonLine className="mt-4 h-9 w-full" />
    </div>
  );
}

export function SkeletonPage({
  title = true,
  cards = 6,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
}: {
  title?: boolean;
  cards?: number;
  columns?: string;
}) {
  return (
    // aria-busy + a visually hidden message, so a screen reader is told the
    // page is loading rather than reading out an empty region.
    <div aria-busy="true">
      <span className="sr-only">Loading…</span>
      {title && (
        <div className="space-y-2">
          <SkeletonLine className="h-6 w-56" />
          <SkeletonLine className="h-3.5 w-80 max-w-full" />
        </div>
      )}
      <div className={`mt-6 grid gap-4 ${columns}`}>
        {Array.from({ length: cards }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
