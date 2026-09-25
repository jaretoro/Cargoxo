import Link from "next/link";
import { toggleSaveAction } from "@/app/actions/agents";
import { SubmitIconButton } from "@/components/SubmitButton";
import { VERIFICATION_STYLES, avatarStyle, initials } from "@/lib/ui";

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 018 0v3" strokeLinecap="round" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 20 20"
          fill={i < rounded ? "#f59e0b" : "none"}
          stroke={i < rounded ? "#f59e0b" : "#d1d5db"}
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.2-5.3 3.2 1.3-6-4.5-4.1 6-.6z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

export type AgentCardData = {
  logisticsProfileId: string;
  userId: string;
  companyName: string;
  location: string;
  anclaNumber: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  establishedYear: number | null;
  shipmentCount: number;
  cargoTypes: string[];
  routes: { origin: string; destination: string }[];
  rating: number;
  reviewCount: number;
  membership: "MONTHLY" | "YEARLY" | null;
  isSaved: boolean;
  phone: string;
  connectionId: string | null;
  connectionStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
};

export function AgentCard({
  agent,
  isSubscribed,
  backTo,
  // Renders the card without its action row, for showing a logistics company
  // their own listing as exporters see it — Message/Call/Save all point at
  // exporter-only routes and make no sense pointed at yourself.
  preview = false,
}: {
  agent: AgentCardData;
  isSubscribed: boolean;
  backTo: string;
  preview?: boolean;
}) {
  const visibleRoutes = agent.routes.slice(0, 2);
  const extraRoutes = agent.routes.length - visibleRoutes.length;
  const visibleCargo = agent.cargoTypes.slice(0, 3);
  const extraCargo = agent.cargoTypes.length - visibleCargo.length;

  return (
    <div className="flex flex-col rounded-xl border border-black/5 bg-white p-5 shadow-sm">
      {/* The badge used to sit beside the name, and being shrink-0 it took
          its width first — which in the 3-column desktop grid squeezed the
          name to about half the card and truncated most of them ("SeaLink
          Freight…", "Kano Norther…"). A title tooltip covered for it, but
          tooltips don't exist on a phone. The name now gets the full width
          and the badge sits on its own line beneath. */}
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarStyle(agent.companyName)}`}>
          {initials(agent.companyName)}
        </span>
        <div className="min-w-0">
          {/* Still capped at two lines so a very long name can't throw the
              row out of alignment — but two full-width lines fit almost
              every real company name. */}
          <h3 className="line-clamp-2 font-semibold leading-tight text-brand-navy" title={agent.companyName}>
            {agent.companyName}
          </h3>
          <p className="truncate text-xs text-gray-500">{agent.location}</p>
        </div>
      </div>

      <div className="mt-2.5">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${VERIFICATION_STYLES[agent.verificationStatus]}`}>
          {agent.verificationStatus === "VERIFIED" ? "ANCLA Verified" : agent.verificationStatus === "REJECTED" ? "Not verified" : "Pending"}
        </span>
      </div>

      <div className="mt-3 rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
        ANCLA: <span className="font-medium text-gray-800">{agent.anclaNumber}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
        {agent.reviewCount > 0 ? (
          <>
            <Stars rating={agent.rating} />
            <span className="font-medium text-gray-700">{agent.rating.toFixed(1)}</span>
            <span>({agent.reviewCount} reviews)</span>
          </>
        ) : (
          <span>No reviews yet</span>
        )}
        {agent.establishedYear && <span>· Est. {agent.establishedYear}</span>}
      </div>

      {visibleCargo.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleCargo.map((c) => (
            <span key={c} className="rounded-full bg-brand-sky/15 px-2 py-0.5 text-xs font-medium text-brand-navy">
              {c}
            </span>
          ))}
          {extraCargo > 0 && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">+{extraCargo} more</span>}
        </div>
      )}

      {visibleRoutes.length > 0 && (
        <div className="mt-3 space-y-0.5 text-xs text-gray-500">
          {visibleRoutes.map((r, i) => (
            <p key={i}>
              {r.origin} → {r.destination}
            </p>
          ))}
          {extraRoutes > 0 && <p className="text-gray-500">+{extraRoutes} more routes</p>}
        </div>
      )}

      <div className={`mt-3 flex items-center justify-between rounded-md px-3 py-1.5 text-xs ${agent.membership ? (agent.membership === "YEARLY" ? "bg-amber-50" : "bg-gray-50") : ""}`}>
        {agent.membership ? (
          <span className={`flex items-center gap-1 font-medium ${agent.membership === "YEARLY" ? "text-amber-700" : "text-gray-500"}`}>
            {agent.membership === "YEARLY" && (
              <svg width="12" height="12" viewBox="0 0 20 20" fill="#f59e0b" aria-hidden="true">
                <path d="M10 1.5l2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.2-5.3 3.2 1.3-6-4.5-4.1 6-.6z" />
              </svg>
            )}
            {agent.membership === "YEARLY" ? "Premium Yearly Member" : "Monthly Member"}
          </span>
        ) : (
          <span />
        )}
        <span className="text-gray-500">{agent.shipmentCount}+ shipments</span>
      </div>

      {/* mt-auto keeps the actions pinned to the card's bottom edge, so they
          line up across a row even when cards carry different amounts of
          detail (tags, routes, membership). */}
      <div className={`mt-auto flex items-center gap-2 pt-4 ${preview ? "hidden" : ""}`}>
        {agent.verificationStatus === "PENDING" ? (
          <p className="flex-1 rounded-md bg-gray-50 px-3 py-2 text-center text-xs text-gray-500">Not yet verified</p>
        ) : !isSubscribed ? (
          /* Short label so it stays on one line — "Subscribe to contact"
             wrapped and left this button taller than the ones beside it. */
          <Link
            href="/dashboard/exporter/billing"
            className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-brand-blue-deep px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy"
          >
            <LockIcon />
            Unlock
          </Link>
        ) : agent.connectionId ? (
          <Link
            href={`/dashboard/exporter/messages/${agent.connectionId}`}
            className="flex-1 whitespace-nowrap rounded-md bg-brand-blue-deep px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-navy"
          >
            {agent.connectionStatus === "ACCEPTED" ? "Message" : "View chat"}
          </Link>
        ) : (
          <Link
            href={`/dashboard/exporter/messages/new?logistics=${agent.userId}`}
            className="flex-1 whitespace-nowrap rounded-md bg-brand-blue-deep px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-navy"
          >
            Message
          </Link>
        )}

        {/* Only a real tel: link when it can actually dial. Unsubscribed, this
            used to be a "Call" button that silently navigated to pricing. */}
        {agent.verificationStatus === "VERIFIED" &&
          (isSubscribed ? (
            <a
              href={`tel:${agent.phone}`}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Call
            </a>
          ) : (
            <span
              title="Subscribe to see phone numbers"
              className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-400"
            >
              Call
            </span>
          ))}

        <form action={toggleSaveAction}>
          <input type="hidden" name="logisticsId" value={agent.userId} />
          <input type="hidden" name="redirectTo" value={backTo} />
          <SubmitIconButton
            aria-label={agent.isSaved ? "Remove from saved" : "Save"}
            className="rounded-md border border-gray-300 p-2.5 text-gray-600 hover:bg-gray-50"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill={agent.isSaved ? "#0b2d52" : "none"} stroke="#0b2d52" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 3h10a1 1 0 011 1v13l-6-3.5L4 17V4a1 1 0 011-1z" strokeLinejoin="round" />
            </svg>
          </SubmitIconButton>
        </form>
      </div>
    </div>
  );
}
