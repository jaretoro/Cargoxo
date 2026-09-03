"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/pricing";

export async function createCheckoutAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/pricing");
  }

  // Logistics companies subscribe too (that's what the membership tier on
  // their listing is), so none of these destinations can be hardcoded to
  // the exporter dashboard — a logistics subscriber would land on a page
  // the route guard bounces them straight out of.
  const isExporter = session.user.role === "EXPORTER";
  const backUrl = isExporter ? "/dashboard/exporter/billing" : "/dashboard/logistics";

  const plan = formData.get("plan") as PlanId;
  const planConfig = PLANS[plan];
  if (!planConfig) redirect(`${backUrl}?error=Invalid+plan+selected.`);

  const priceId = process.env[planConfig.priceEnvVar];
  if (!priceId || priceId === "price_xxx") {
    redirect(`${backUrl}?error=Stripe+isn%27t+configured+yet+%E2%80%94+add+real+STRIPE_PRICE_%2A+values+to+.env.`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const successUrl = isExporter
    ? `${appUrl}/dashboard/exporter?subscribed=1`
    : `${appUrl}/dashboard/logistics?subscribed=1`;
  const cancelUrl = isExporter ? `${appUrl}/dashboard/exporter/billing?canceled=1` : `${appUrl}/dashboard/logistics`;

  // Stripe's own call is isolated in this try/catch so we never risk
  // swallowing next/navigation's redirect() control-flow error (it works by
  // throwing, and redirect() itself is called outside this block below).
  let checkoutUrl: string | null = null;
  try {
    const existing = await prisma.subscription.findUnique({ where: { userId: session.user.id } });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: existing?.stripeCustomerId ?? undefined,
      customer_email: existing?.stripeCustomerId ? undefined : session.user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: session.user.id, plan },
      subscription_data: { metadata: { userId: session.user.id, plan } },
    });
    checkoutUrl = checkoutSession.url;
  } catch (error) {
    console.error("Stripe checkout error:", error);
    redirect(`${backUrl}?error=Could+not+reach+Stripe.+Check+your+API+keys.`);
  }

  redirect(checkoutUrl ?? `${backUrl}?error=Could+not+start+checkout.`);
}

// Sends an existing subscriber to Stripe's hosted customer portal to change
// plan, update their card or cancel. Deliberately not rebuilt in-app:
// Stripe already handles proration, dunning and invoices, and anything we
// wrote here would have to be kept in sync with the webhook.
export async function createPortalSessionAction() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/exporter/billing");

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  if (!subscription?.stripeCustomerId) {
    redirect("/dashboard/exporter/billing?error=No+billing+account+yet+%E2%80%94+subscribe+first.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let portalUrl: string | null = null;
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/dashboard/exporter/billing`,
    });
    portalUrl = portalSession.url;
  } catch (error) {
    console.error("Stripe portal error:", error);
    redirect("/dashboard/exporter/billing?error=Could+not+reach+Stripe.+Check+your+API+keys.");
  }

  redirect(portalUrl ?? "/dashboard/exporter/billing?error=Could+not+open+the+billing+portal.");
}
