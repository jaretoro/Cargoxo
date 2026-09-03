import Link from "next/link";
import { PLANS, formatNaira } from "@/lib/pricing";

const STEPS = [
  {
    title: "Register",
    exporter: "Sign up as an exporter — free to browse, subscribe when you're ready to connect.",
    logistics: "Register your company with your name, phone, ANCLA number, address, and location.",
  },
  {
    title: "Get verified",
    exporter: "Every logistics company you see has passed Cargoxo's admin verification.",
    logistics: "Our admin team reviews your ANCLA number and business details before you go live.",
  },
  {
    title: "Connect",
    exporter: "Search by location, view verified profiles, and send a connection request.",
    logistics: "Receive connection requests from exporters and respond directly.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-navy to-[#123a63] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Where Nigerian exporters meet verified logistics companies
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
            Cargoxo is a marketplace built for Nigeria&apos;s export trade — find a vetted cargo
            agent for your shipment, or list your logistics company for exporters to find.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-md bg-brand-blue px-6 py-3 font-semibold text-white hover:bg-white hover:text-brand-navy"
            >
              I&apos;m an exporter
            </Link>
            <Link
              href="/register/logistics"
              className="rounded-md border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white hover:text-brand-navy"
            >
              I run a logistics company
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-brand-navy sm:text-3xl">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="font-semibold text-brand-navy">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-500">
                <span className="font-medium text-gray-700">Exporters: </span>
                {step.exporter}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                <span className="font-medium text-gray-700">Logistics: </span>
                {step.logistics}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / verification callout */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">Every agent is verified, not just listed</h2>
          <p className="mt-4 text-gray-600">
            Logistics companies submit their name, phone number, ANCLA number, business address,
            and location. A Cargoxo admin reviews every submission before the company appears in
            search results — so exporters aren&apos;t left guessing who they can trust.
          </p>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">Simple pricing for exporters</h2>
        <p className="mt-3 text-gray-600">
          {formatNaira(PLANS.MONTHLY.usd)}/mo or {formatNaira(PLANS.YEARLY.usd)}/yr equivalent —
          billed in USD via Stripe.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-block rounded-md bg-brand-navy px-6 py-3 font-semibold text-white hover:bg-brand-blue"
        >
          See full pricing
        </Link>
      </section>
    </div>
  );
}
