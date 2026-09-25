import { SkeletonPage } from "@/components/Skeleton";

export default function LogisticsLoading() {
  return <SkeletonPage cards={4} columns="sm:grid-cols-2" />;
}
