"use client";

import { ErrorState } from "@/components/ErrorState";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorState
      error={error}
      retry={retry}
      title="This admin page failed to load"
      description="A query didn't come back. Nothing has been changed — trying again is safe."
      homeHref="/admin"
      homeLabel="Admin overview"
    />
  );
}
