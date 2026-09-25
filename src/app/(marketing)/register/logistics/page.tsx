import Link from "next/link";
import { RegisterLogisticsForm } from "@/components/RegisterLogisticsForm";

export default function RegisterLogisticsPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Register your logistics company</h1>
      <p className="mt-1 text-sm text-muted">
        Free to list. An admin reviews your ANCLA number and details before your profile goes
        live to exporters.
      </p>
      <div className="mt-6 border border-rule bg-surface p-6">
        <RegisterLogisticsForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Looking for a logistics company instead?{" "}
        <Link href="/register" className="font-medium text-ochre hover:underline">
          Register as an exporter
        </Link>
        .
      </p>
    </div>
  );
}
