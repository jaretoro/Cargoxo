import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startConversationAction } from "@/app/actions/agents";
import { SubmitButton } from "@/components/SubmitButton";
import { avatarStyle, initials } from "@/lib/ui";

export default async function NewConversation(props: PageProps<"/dashboard/exporter/messages/new">) {
  const session = await auth();
  if (!session?.user) return null; // guarded by layout

  const sp = await props.searchParams;
  const logisticsId = typeof sp.logistics === "string" ? sp.logistics : null;
  const error = typeof sp.error === "string" ? sp.error : null;
  // Whatever was typed before a failed submit, handed back by the action.
  const draft = typeof sp.draft === "string" ? sp.draft : "";
  if (!logisticsId) redirect("/dashboard/exporter");

  const [logistics, existing] = await Promise.all([
    prisma.logisticsProfile.findUnique({ where: { userId: logisticsId }, include: { cargoTypes: true } }),
    prisma.connection.findUnique({ where: { exporterId_logisticsId: { exporterId: session.user.id, logisticsId } } }),
  ]);
  if (!logistics || logistics.verificationStatus !== "VERIFIED") redirect("/dashboard/exporter");
  if (existing) redirect(`/dashboard/exporter/messages/${existing.id}`);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/dashboard/exporter" className="text-sm font-medium text-ochre hover:underline">
        ← Back to agents
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarStyle(logistics.companyName)}`}>
          {initials(logistics.companyName)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-ink">{logistics.companyName}</h1>
          <p className="truncate text-sm text-muted">
            {logistics.location} · ANCLA {logistics.anclaNumber}
          </p>
        </div>
      </div>

      {logistics.cargoTypes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {logistics.cargoTypes.map((c) => (
            <span key={c.id} className="rounded-full bg-wait-tint px-2 py-0.5 text-xs font-medium text-ink">
              {c.name}
            </span>
          ))}
        </div>
      )}

      {error && <div className="mt-4 bg-bad-tint px-4 py-3 text-sm text-bad">{decodeURIComponent(error)}</div>}

      <form action={startConversationAction} className="mt-6 space-y-3 border border-rule bg-surface p-5">
        <input type="hidden" name="logisticsId" value={logisticsId} />
        <label htmlFor="body" className="block text-sm font-medium text-ink-soft">
          Your first message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={5}
          maxLength={2000}
          defaultValue={draft}
          placeholder="Describe your shipment — cargo type, volume, destination, timeline…"
          className="w-full border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <SubmitButton pendingLabel="Sending…" className="w-full bg-ink px-3 py-2 text-sm font-semibold text-paper hover:bg-ink-hover">
          Send message
        </SubmitButton>
        <p className="text-xs text-muted">
          They&rsquo;ll see your contact details and can accept or decline. You can keep talking in the thread either way.
        </p>
      </form>
    </div>
  );
}
