import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <p className="text-5xl font-bold text-ink">404</p>
      <h1 className="mt-3 text-xl font-bold text-ink">We can&rsquo;t find that page</h1>
      <p className="mt-2 text-sm text-ink-soft">
        The link may be out of date, or the page may have moved.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-hover">
          Go home
        </Link>
        <Link href="/dashboard" className="border border-rule px-4 py-2 text-sm font-medium text-ink-soft hover:bg-paper-deep">
          My dashboard
        </Link>
      </div>
    </div>
  );
}
