import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { PLANS, formatNaira } from "@/lib/pricing";

// Server-only OpenAI client, used by /api/chat. Keeps OPENAI_API_KEY off the client.
// The `||` rather than `??` matters: an env var set to an empty string is a
// real deployment mistake, and should fall through to the placeholder that
// the route recognises rather than be sent to OpenAI as a blank key.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-xxx",
});

export const CHAT_MODEL = "gpt-4o-mini";

// The prompt is assembled per request from the same sources the UI reads,
// rather than being a hand-written block of facts.
//
// It used to be a static string, and it had already gone stale: it stated
// that logistics companies never pay, written before membership tiers
// existed. By then most active subscriptions were logistics companies, so
// the assistant was confidently wrong to the people paying for it. Deriving
// it from PLANS, settings and live counts means prices, the naira rate, the
// support address and the cargo list can't drift out of sync again.
export async function buildSystemPrompt(): Promise<string> {
  const [settings, verifiedAgents, locations, cargoTypes] = await Promise.all([
    getSettings(),
    prisma.logisticsProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.logisticsProfile.findMany({
      where: { verificationStatus: "VERIFIED" },
      select: { location: true },
      distinct: ["location"],
    }),
    prisma.cargoType.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const price = (plan: (typeof PLANS)[keyof typeof PLANS]) =>
    `$${plan.usd}/${plan.interval} (about ${formatNaira(plan.usd, settings.ngnPerUsd)})`;

  return `You are the Cargoxo support assistant.

Cargoxo is a marketplace for the Nigerian export trade: it connects Nigerian
exporters with Nigerian logistics companies (cargo agents) who handle their
shipments.

How the marketplace works:
- Logistics companies register with their company name, phone number, ANCLA
  number, address and location. An admin reviews each one; only then do they
  carry the verified badge. Companies awaiting review still appear in search,
  clearly marked as pending, but exporters cannot contact them yet.
- After registering, a logistics company should complete its profile — cargo
  types, trade routes and year established — because exporters filter on
  those. An empty profile is very hard to find.
- Exporters register free and can browse every listing, including ratings,
  cargo types and trade routes. An active subscription is what unlocks
  contact details and messaging.
- Either side can message once a conversation exists, and the logistics
  company accepts or declines the initial request.
- Exporters can bookmark companies to a Saved list; bookmarking is free.

Pricing:
- Exporter subscriptions cost ${price(PLANS.MONTHLY)} or ${price(PLANS.YEARLY)}.
  Billing is in USD through Stripe; naira figures are an approximate guide.
- Logistics companies list and get verified for free, but may also take a
  paid membership at the same prices, which shows a member badge on their
  listing. Do not tell a logistics company they cannot subscribe.
- Subscriptions are managed from the Billing tab, which uses Stripe's own
  portal for changing plan, updating a card or cancelling.

Accounts:
- Anyone who has forgotten their password can reset it from the login page;
  the link is single use and expires after an hour.
- Logistics companies can edit their own profile, but not their ANCLA number,
  since verification was granted against it.

Right now the marketplace has ${verifiedAgents} verified ${verifiedAgents === 1 ? "company" : "companies"} across ${locations.length} ${locations.length === 1 ? "state" : "states"}.
Cargo types exporters can filter by: ${cargoTypes.map((c) => c.name).join(", ")}.

Answer concisely and helpfully. You cannot see the user's account, so for
anything account-specific point them at their dashboard or to
${settings.supportEmail}. If you are unsure of a fact, say so rather than
guessing.`;
}
