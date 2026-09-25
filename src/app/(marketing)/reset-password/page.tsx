import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata = { title: "Choose a new password — Cargoxo" };

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : null;

  // The token is only checked properly when the form is submitted. Doing a
  // lookup here as well would mean a link could be silently spent by a mail
  // scanner or link preview fetching the page.
  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-ink">This link is incomplete</h1>
        <p className="mt-2 text-sm text-muted">
          The reset link is missing its token — it may have been cut short by your email client.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-hover"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted">Reset links work once and expire an hour after they&rsquo;re sent.</p>
      <div className="mt-6 border border-rule bg-surface p-6">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
