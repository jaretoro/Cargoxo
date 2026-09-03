// Single source of truth for subscription pricing, used by the pricing page,
// the Stripe checkout route, and anywhere else a price needs to be displayed.

export const PLANS = {
  MONTHLY: {
    id: "MONTHLY",
    label: "Monthly",
    usd: 5,
    interval: "month",
    priceEnvVar: "STRIPE_PRICE_MONTHLY",
  },
  YEARLY: {
    id: "YEARLY",
    label: "Yearly",
    usd: 60,
    interval: "year",
    priceEnvVar: "STRIPE_PRICE_YEARLY",
  },
} as const;

export type PlanId = keyof typeof PLANS;

// Approximate display-only conversion — Stripe always charges the USD amount.
// Read from env so the rate can be updated without a code change/redeploy.
export function ngnPerUsd(): number {
  const raw = process.env.NEXT_PUBLIC_NGN_PER_USD;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 1600;
}

export function formatNaira(usd: number): string {
  const ngn = Math.round(usd * ngnPerUsd());
  return `₦${ngn.toLocaleString("en-NG")}`;
}

// Monthly-equivalent savings the yearly plan represents, e.g. "save 20 dollars a year -> X%".
export function yearlySavingsPercent(): number {
  const monthlyAnnualized = PLANS.MONTHLY.usd * 12;
  const savings = (monthlyAnnualized - PLANS.YEARLY.usd) / monthlyAnnualized;
  return Math.round(savings * 100);
}
