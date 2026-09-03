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

  const plan = formData.get("plan") as PlanId;
  const planConfig = PLANS[plan];
  if (!planConfig) redirect("/pricing?error=Invalid+plan+selected.");

  const priceId = process.env[planConfig.priceEnvVar];
  if (!priceId || priceId === "price_xxx") {
    redirect("/pricing?error=Stripe+isn%27t+configured+yet+%E2%80%94+add+real+STRIPE_PRICE_%2A+values+to+.env.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
      success_url: `${appUrl}/dashboard/exporter?subscribed=1`,
      cancel_url: `${appUrl}/pricing?canceled=1`,
      metadata: { userId: session.user.id, plan },
      subscription_data: { metadata: { userId: session.user.id, plan } },
    });
    checkoutUrl = checkoutSession.url;
  } catch (error) {
    console.error("Stripe checkout error:", error);
    redirect("/pricing?error=Could+not+reach+Stripe.+Check+your+API+keys.");
  }

  redirect(checkoutUrl ?? "/pricing?error=Could+not+start+checkout.");
}
