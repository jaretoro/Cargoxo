import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <p className="text-5xl font-bold text-brand-navy">404</p>
      <h1 className="mt-3 text-xl font-bold text-brand-navy">We can&rsquo;t find that page</h1>
      <p className="mt-2 text-sm text-gray-600">
        The link may be out of date, or the page may have moved.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="rounded-md bg-brand-blue-deep px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy">
          Go home
        </Link>
        <Link href="/dashboard" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          My dashboard
        </Link>
      </div>
    </div>
  );
}
