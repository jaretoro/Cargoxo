import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata = { title: "Reset your password — Cargoxo" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the email you signed up with and we&rsquo;ll send you a link to choose a new password.
      </p>
      <div className="mt-6 border border-rule bg-surface p-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
