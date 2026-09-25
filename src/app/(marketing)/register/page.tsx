import Link from "next/link";
import { RegisterExporterForm } from "@/components/RegisterExporterForm";

export default function RegisterExporterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Register as an exporter</h1>
      <p className="mt-1 text-sm text-muted">
        Free to join.{" "}
        <Link href="/pricing" className="text-ochre hover:underline">
          Subscribe
        </Link>{" "}
        once you&apos;re ready to see full contact details and connect with verified agents.
      </p>
      <div className="mt-6 border border-rule bg-surface p-6">
        <RegisterExporterForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Run a logistics company?{" "}
        <Link href="/register/logistics" className="font-medium text-ochre hover:underline">
          Register here instead
        </Link>
        .
      </p>
    </div>
  );
}
