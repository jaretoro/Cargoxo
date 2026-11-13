"use client";

import Link from "next/link";

// What an error.tsx boundary renders. Before these existed, a failed query
// showed the raw Next.js dev overlay in development and a blank screen in
// production — no way to retry, and nothing to tell the user whether the
// problem was theirs or ours.
//
// Next 16 names this prop `retry` (`reset` still exists, but only clears the
// boundary without re-fetching). retry() re-fetches and re-renders the failed
// segment, which is what the common causes here need — a dropped database
// connection or a timed-out query.
export function ErrorState({
  error,
  retry,
  title = "Something went wrong",
  description = "We couldn't load this page. This is our side, not yours — trying again usually works.",
  homeHref = "/",
  homeLabel = "Go home",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bad-tint text-bad">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16.5v.01" />
        </svg>
      </span>

      <h1 className="mt-4 text-xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-soft">{description}</p>

      {/* The digest is the only handle on a production error, where the real
          message is stripped before it reaches the browser. Showing it means
          a user can quote it in a support email and it can be matched to the
          server log. */}
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted">Reference: {error.digest}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={retry}
          className="bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-hover"
        >
          Try again
        </button>
        <Link
          href={homeHref}
          className="border border-rule px-4 py-2 text-sm font-medium text-ink-soft hover:bg-paper-deep"
        >
          {homeLabel}
        </Link>
      </div>

      {/* In development the actual message is far more useful than a generic
          apology; in production it is withheld, since it can leak internals. */}
      {process.env.NODE_ENV !== "production" && error.message && (
        <pre className="mt-6 w-full overflow-x-auto bg-paper-deep p-3 text-left font-mono text-xs text-ink-soft">
          {error.message}
        </pre>
      )}
    </div>
  );
}
