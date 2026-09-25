import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { AgentCard, type AgentCardData } from "@/components/AgentCard";

function StatCard({ value, label, href, tone = "neutral" }: { value: number | string; label: string; href?: string; tone?: "neutral" | "amber" | "blue" }) {
  const valueTone = { neutral: "text-ink", amber: "text-wait", blue: "text-ochre" }[tone];
  const body = (
    <div className="border border-rule bg-surface p-5">
      <p className={`text-3xl font-bold ${valueTone}`}>{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function LogisticsOverview(props: PageProps<"/dashboard/logistics">) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const justSubscribed = sp.subscribed === "1";

  const profile = await prisma.logisticsProfile.findUnique({
    where: { userId: session.user.id },
    include: { cargoTypes: true, tradeRoutes: true, _count: { select: { reviews: true } } },
  });
  if (!profile) redirect("/login");

  const [pendingRequests, acceptedRequests, unreadCount, reviewAgg, subscription, settings] = await Promise.all([
    prisma.connection.count({ where: { logisticsId: session.user.id, status: "PENDING" } }),
    prisma.connection.count({ where: { logisticsId: session.user.id, status: "ACCEPTED" } }),
    prisma.message.count({
      where: { readAt: null, senderId: { not: session.user.id }, connection: { logisticsId: session.user.id } },
    }),
    prisma.review.aggregate({ where: { logisticsProfileId: profile.id }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    getSettings(),
  ]);

  // The exact card an exporter sees in search — the most direct way to show
  // what filling in the profile actually buys.
  const listingPreview: AgentCardData = {
    logisticsProfileId: profile.id,
    userId: profile.userId,
    companyName: profile.companyName,
    location: profile.location,
    anclaNumber: profile.anclaNumber,
    verificationStatus: profile.verificationStatus,
    establishedYear: profile.establishedYear,
    shipmentCount: profile.shipmentCount,
    cargoTypes: profile.cargoTypes.map((c) => c.name),
    routes: profile.tradeRoutes.map((r) => ({ origin: r.origin, destination: r.destination })),
    rating: reviewAgg._avg.rating ?? 0,
    reviewCount: reviewAgg._count.rating,
    membership: subscription?.status === "ACTIVE" ? subscription.plan : null,
    isSaved: false,
    phone: "",
    connectionId: null,
    connectionStatus: null,
  };

  // One prioritised list rather than a stack of separate warning banners.
  const todos = [
    profile.verificationStatus === "PENDING" && {
      key: "verification",
      text: "Your ANCLA number is awaiting admin review. You'll show as verified once it passes.",
      tone: "amber" as const,
    },
    profile.verificationStatus === "REJECTED" && {
      key: "rejected",
      // The admin now has to give a reason, so show it — being told only
      // "contact support" left companies with nothing to act on.
      text: profile.rejectionReason
        ? `Verification was rejected: ${profile.rejectionReason} Fix it, then email ${settings.supportEmail} to be reviewed again.`
        : `Your verification was rejected. Email ${settings.supportEmail} to resolve it before exporters can contact you.`,
      tone: "red" as const,
    },
    profile.cargoTypes.length === 0 && {
      key: "cargo",
      text: "Add the cargo types you handle — exporters filter by them, so an empty list keeps you out of most searches.",
      tone: "amber" as const,
      href: "/dashboard/logistics/profile",
      cta: "Add cargo types",
    },
    profile.tradeRoutes.length === 0 && {
      key: "routes",
      text: "Add the trade lanes you service so exporters shipping those routes can find you.",
      tone: "amber" as const,
      href: "/dashboard/logistics/profile",
      cta: "Add trade routes",
    },
    pendingRequests > 0 && {
      key: "requests",
      text: `${pendingRequests} exporter ${pendingRequests === 1 ? "request is" : "requests are"} waiting on your response.`,
      tone: "blue" as const,
      href: "/dashboard/logistics/requests",
      cta: "Review requests",
    },
  ].filter(Boolean) as { key: string; text: string; tone: "amber" | "red" | "blue"; href?: string; cta?: string }[];

  return (
    <div>
      {error && <div className="mb-6 bg-bad-tint px-4 py-3 text-sm text-bad">{decodeURIComponent(error)}</div>}
      {justSubscribed && (
        <div className="mb-6 bg-ok-tint px-4 py-3 text-sm text-ok">
          Membership active — your listing now carries a member badge.
        </div>
      )}

      <h1 className="text-2xl font-bold text-ink">{profile.companyName}</h1>
      <p className="mt-1 text-sm text-muted">
        {profile.location} · ANCLA {profile.anclaNumber}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={pendingRequests} label="Requests awaiting reply" href="/dashboard/logistics/requests" tone={pendingRequests > 0 ? "amber" : "neutral"} />
        <StatCard value={acceptedRequests} label="Accepted connections" href="/dashboard/logistics/requests" />
        <StatCard value={unreadCount} label="Unread messages" href="/dashboard/logistics/messages" tone={unreadCount > 0 ? "blue" : "neutral"} />
        <StatCard
          value={reviewAgg._count.rating > 0 ? (reviewAgg._avg.rating ?? 0).toFixed(1) : "—"}
          label={reviewAgg._count.rating > 0 ? `Rating from ${reviewAgg._count.rating} reviews` : "No reviews yet"}
        />
      </div>

      {todos.length > 0 && (
        <div className="mt-6 border border-rule bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Next steps</h2>
          <ul className="mt-3 space-y-3">
            {todos.map((t) => (
              <li key={t.key} className="flex flex-wrap items-start justify-between gap-3 text-sm">
                <span className="flex items-start gap-2.5 text-ink-soft">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
 t.tone === "red" ? "bg-bad" : t.tone === "blue" ? "bg-ink" : "bg-wait-tint0"
 }`}
                  />
                  {t.text}
                </span>
                {t.href && t.cta && (
                  <Link href={t.href} className="shrink-0 text-sm font-medium text-ochre hover:underline">
                    {t.cta} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-ink">How exporters see you</h2>
            <p className="mt-1 text-sm text-muted">Your live listing in search results.</p>
          </div>
          <Link href="/dashboard/logistics/profile" className="tap text-sm font-medium text-ochre hover:underline">
            Edit profile →
          </Link>
        </div>

        <div className="mt-4 max-w-sm">
          <AgentCard agent={listingPreview} isSubscribed={false} backTo="/dashboard/logistics" preview />
        </div>
      </div>
    </div>
  );
}
