import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/pricing";

// Stripe posts here after checkout completes and on every subscription
// lifecycle change. This is the ONLY place subscription status actually
// gets written — never trust the client redirect back from Checkout alone,
// since a user could hit success_url without really paying.
export async function POST(request: Request) {
  const body = await request.text(); // raw body required for signature verification
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET === "whsec_xxx") {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as PlanId | undefined;
      if (!userId || !session.subscription) break;

      const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await upsertSubscription(userId, stripeSubscription, plan);
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      const userId = stripeSubscription.metadata?.userId;
      const plan = stripeSubscription.metadata?.plan as PlanId | undefined;
      if (!userId) break;

      await upsertSubscription(userId, stripeSubscription, plan);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function upsertSubscription(userId: string, sub: Stripe.Subscription, plan: PlanId | undefined) {
  const status =
    sub.status === "active" || sub.status === "trialing"
      ? "ACTIVE"
      : sub.status === "canceled" || sub.status === "unpaid"
        ? "CANCELED"
        : "PAST_DUE";

  // Stripe has moved current_period_end between the subscription object and
  // its line items across API versions — check both so this keeps working
  // regardless of which one the installed SDK/account is on.
  const currentPeriodEndUnix =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    sub.items.data[0]?.current_period_end;

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      status,
      plan: plan ? PLANS[plan].id : undefined,
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000) : undefined,
    },
    create: {
      userId,
      status,
      plan: plan ? PLANS[plan].id : null,
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000) : null,
    },
  });
}
