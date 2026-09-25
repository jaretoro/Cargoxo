import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { respondConnectionAction } from "@/app/actions/connections";
import { SubmitButton } from "@/components/SubmitButton";
import { STATUS_STYLES, avatarStyle, initials } from "@/lib/ui";

export default async function LogisticsRequests(props: PageProps<"/dashboard/logistics/requests">) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  const requests = await prisma.connection.findMany({
    where: { logisticsId: session.user.id },
    include: {
      exporter: { select: { name: true, email: true, phone: true, exporterProfile: { select: { companyName: true, address: true } } } },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: session.user.id } } } } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Connection requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pending > 0
              ? `${pending} ${pending === 1 ? "exporter is" : "exporters are"} waiting on your response.`
              : "Exporters who have reached out to you."}
          </p>
        </div>
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <div className="mt-6 space-y-3">
        {requests.map((r) => {
          const name = r.exporter.exporterProfile?.companyName ?? r.exporter.name;
          return (
            <div key={r.id} className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarStyle(name)}`}>
                  {initials(name)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold text-brand-navy">{name}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                    {r._count.messages > 0 && (
                      <span className="rounded-full bg-brand-blue-deep px-1.5 py-0.5 text-xs font-semibold text-white">
                        {r._count.messages} new
                      </span>
                    )}
                  </div>

                  {/* The exporter reached out first, so their contact details
                      are shown here without a paywall — the subscription
                      gates exporters seeing agents, not the other way round. */}
                  <p className="mt-0.5 text-xs text-gray-500">
                    {r.exporter.email} · {r.exporter.phone}
                    {r.exporter.exporterProfile?.address && <> · {r.exporter.exporterProfile.address}</>}
                  </p>

                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">{r.message}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {r.status === "PENDING" && (
                      <>
                        <form action={respondConnectionAction}>
                          <input type="hidden" name="connectionId" value={r.id} />
                          <input type="hidden" name="status" value="ACCEPTED" />
                          <SubmitButton pendingLabel="Accepting…" className="rounded-md bg-brand-blue-deep px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-navy">
                            Accept
                          </SubmitButton>
                        </form>
                        <form action={respondConnectionAction}>
                          <input type="hidden" name="connectionId" value={r.id} />
                          <input type="hidden" name="status" value="DECLINED" />
                          <SubmitButton pendingLabel="Declining…" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Decline
                          </SubmitButton>
                        </form>
                      </>
                    )}

                    {/* Previously only Accept/Decline existed, and only while
                        pending — so once you accepted there was no way to
                        reply without hunting for the thread under Messages. */}
                    <Link
                      href={`/dashboard/logistics/messages/${r.id}`}
                      className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                        r.status === "PENDING"
                          ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          : "bg-brand-blue-deep text-white hover:bg-brand-navy"
                      }`}
                    >
                      Open conversation
                    </Link>

                    <span className="ml-auto text-xs text-gray-500">
                      {r.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-sm font-medium text-gray-700">No requests yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
              Exporters find you through search. A complete profile with cargo types and trade routes makes that far more likely.
            </p>
            <Link
              href="/dashboard/logistics/profile"
              className="mt-4 inline-block rounded-md bg-brand-blue-deep px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy"
            >
              Complete your profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
