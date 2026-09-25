"use client";

import { ErrorState } from "@/components/ErrorState";

export default function ExporterError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorState
      error={error}
      retry={retry}
      description="We couldn't load your dashboard. Nothing has been lost — trying again usually works."
      homeHref="/dashboard/exporter"
      homeLabel="Back to agents"
    />
  );
}
