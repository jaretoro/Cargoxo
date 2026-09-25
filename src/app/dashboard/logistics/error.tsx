"use client";

import { ErrorState } from "@/components/ErrorState";

export default function LogisticsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorState
      error={error}
      retry={retry}
      description="We couldn't load your workspace. Nothing has been lost — trying again usually works."
      homeHref="/dashboard/logistics"
      homeLabel="Back to overview"
    />
  );
}
