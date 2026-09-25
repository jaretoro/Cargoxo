import { SkeletonLine } from "@/components/Skeleton";

export default function AdminLoading() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-3.5 w-72 max-w-full" />
      </div>
      {/* Mirrors the overview's 3-up stat cards then wide panels, so the
          layout doesn't shift when the real numbers land. */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonLine key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SkeletonLine className="h-80 w-full rounded-2xl lg:col-span-2" />
        <SkeletonLine className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}
