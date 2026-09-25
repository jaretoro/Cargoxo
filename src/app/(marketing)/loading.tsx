import { SkeletonLine } from "@/components/Skeleton";

export default function MarketingLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="flex flex-col items-center space-y-3">
        <SkeletonLine className="h-9 w-3/4 max-w-xl" />
        <SkeletonLine className="h-4 w-2/3 max-w-lg" />
        <SkeletonLine className="h-4 w-1/2 max-w-md" />
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <SkeletonLine className="h-56 w-full" />
        <SkeletonLine className="h-56 w-full" />
      </div>
    </div>
  );
}
