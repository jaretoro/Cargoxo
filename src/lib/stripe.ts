import Stripe from "stripe";

// Server-only Stripe client. Never import this from a "use client" file —
// STRIPE_SECRET_KEY must stay on the server.
// No apiVersion is pinned here so the SDK's own default (matching the
// installed `stripe` package version) is used.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_xxx");
