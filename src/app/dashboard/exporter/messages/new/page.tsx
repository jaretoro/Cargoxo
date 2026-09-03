import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startConversationAction } from "@/app/actions/agents";

export default async function NewConversation(props: PageProps<"/dashboard/exporter/messages/new">) {
  const session = await auth();
  if (!session?.user) return null; // guarded by layout

  const sp = await props.searchParams;
  const logisticsId = typeof sp.logistics === "string" ? sp.logistics : null;
  const error = typeof sp.error === "string" ? sp.error : null;
  if (!logisticsId) redirect("/dashboard/exporter");

  const [logistics, existing] = await Promise.all([
    prisma.logisticsProfile.findUnique({ where: { userId: logisticsId } }),
    prisma.connection.findUnique({ where: { exporterId_logisticsId: { exporterId: session.user.id, logisticsId } } }),
  ]);
  if (!logistics || logistics.verificationStatus !== "VERIFIED") redirect("/dashboard/exporter");
  if (existing) redirect(`/dashboard/exporter/messages/${existing.id}`);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-brand-navy">Message {logistics.companyName}</h1>
      <p className="mt-1 text-sm text-gray-500">{logistics.location} · ANCLA {logistics.anclaNumber}</p>

      {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <form action={startConversationAction} className="mt-6 space-y-3 rounded-xl border border-black/5 bg-white p-5 shadow-sm">
        <input type="hidden" name="logisticsId" value={logisticsId} />
        <textarea
          name="body"
          required
          rows={4}
          placeholder="Describe your shipment — cargo type, volume, destination, timeline…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
        />
        <button type="submit" className="w-full rounded-md bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-navy">
          Send message
        </button>
      </form>
    </div>
  );
}
