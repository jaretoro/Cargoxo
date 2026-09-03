import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata = { title: "Reset your password — Cargoxo" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy">Reset your password</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enter the email you signed up with and we&rsquo;ll send you a link to choose a new password.
      </p>
      <div className="mt-6 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
