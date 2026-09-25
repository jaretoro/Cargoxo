import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startConversationAction } from "@/app/actions/agents";
import { SubmitButton } from "@/components/SubmitButton";

const AVATAR_STYLES = [
  "bg-brand-navy text-white",
  "bg-brand-blue text-white",
  "bg-purple-600 text-white",
  "bg-amber-700 text-white",
  "bg-emerald-700 text-white",
  "bg-rose-600 text-white",
];

function avatarStyle(seed: string) {
  const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_STYLES[hash % AVATAR_STYLES.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

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
      <Link href="/dashboard/exporter" className="text-sm font-medium text-brand-blue hover:underline">
        ← Back to agents
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarStyle(logistics.companyName)}`}>
          {initials(logistics.companyName)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-brand-navy">{logistics.companyName}</h1>
          <p className="truncate text-sm text-gray-500">
            {logistics.location} · ANCLA {logistics.anclaNumber}
          </p>
        </div>
      </div>

      {logistics.cargoTypes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {logistics.cargoTypes.map((c) => (
            <span key={c.id} className="rounded-full bg-brand-sky/15 px-2 py-0.5 text-xs font-medium text-brand-navy">
              {c.name}
            </span>
          ))}
        </div>
      )}

      {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <form action={startConversationAction} className="mt-6 space-y-3 rounded-xl border border-black/5 bg-white p-5 shadow-sm">
        <input type="hidden" name="logisticsId" value={logisticsId} />
        <label htmlFor="body" className="block text-sm font-medium text-gray-700">
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
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
        />
        <SubmitButton pendingLabel="Sending…" className="w-full rounded-md bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-navy">
          Send message
        </SubmitButton>
        <p className="text-xs text-gray-400">
          They&rsquo;ll see your contact details and can accept or decline. You can keep talking in the thread either way.
        </p>
      </form>
    </div>
  );
}
