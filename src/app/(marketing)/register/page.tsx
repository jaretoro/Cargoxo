import Link from "next/link";
import { RegisterExporterForm } from "@/components/RegisterExporterForm";

export default function RegisterExporterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy">Register as an exporter</h1>
      <p className="mt-1 text-sm text-gray-500">
        Free to join.{" "}
        <Link href="/pricing" className="text-brand-blue-deep hover:underline">
          Subscribe
        </Link>{" "}
        once you&apos;re ready to see full contact details and connect with verified agents.
      </p>
      <div className="mt-6 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <RegisterExporterForm />
      </div>
      <p className="mt-4 text-center text-sm text-gray-500">
        Run a logistics company?{" "}
        <Link href="/register/logistics" className="font-medium text-brand-blue-deep hover:underline">
          Register here instead
        </Link>
        .
      </p>
    </div>
  );
}
