import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { respondConnectionAction } from "@/app/actions/connections";

const STATUS_STYLES: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function LogisticsDashboard(props: PageProps<"/dashboard/logistics">) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LOGISTICS") redirect("/login");

  const profile = await prisma.logisticsProfile.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { cargoTypes: true, tradeRoutes: true } } },
  });
  if (!profile) redirect("/login");

  // A listing with no cargo types or routes is invisible to the filters
  // exporters actually search with, so it's worth nudging about.
  const profileIncomplete = profile._count.cargoTypes === 0 || profile._count.tradeRoutes === 0;

  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;

  const [requests, unreadCount] = await Promise.all([
    prisma.connection.findMany({
      where: { logisticsId: session.user.id },
      include: { exporter: { select: { name: true, email: true, phone: true, exporterProfile: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.count({
      where: { readAt: null, senderId: { not: session.user.id }, connection: { logisticsId: session.user.id } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {error && (
        <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      )}
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-brand-navy">{profile.companyName}</h1>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/logistics/messages" className="flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline">
              Messages
              {unreadCount > 0 && <span className="rounded-full bg-brand-blue px-1.5 py-0.5 text-xs font-semibold text-white">{unreadCount}</span>}
            </Link>
            <Link href="/dashboard/logistics/profile" className="text-sm font-medium text-brand-blue hover:underline">
              Edit profile
            </Link>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[profile.verificationStatus]}`}>
              {profile.verificationStatus}
            </span>
          </div>
        </div>

        {profileIncomplete && (
          <p className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Your listing has no {profile._count.cargoTypes === 0 ? "cargo types" : null}
            {profile._count.cargoTypes === 0 && profile._count.tradeRoutes === 0 ? " or " : null}
            {profile._count.tradeRoutes === 0 ? "trade routes" : null} yet — exporters filter by both, so you won&apos;t show up
            in most searches.{" "}
            <Link href="/dashboard/logistics/profile" className="font-medium underline">
              Complete your profile
            </Link>
            .
          </p>
        )}

        {profile.verificationStatus === "PENDING" && (
          <p className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Your account is awaiting admin review. You&apos;ll appear in exporter search results
            once your ANCLA number and details are verified.
          </p>
        )}
        {profile.verificationStatus === "REJECTED" && (
          <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
            Your verification was rejected. Contact support to resolve this.
          </p>
        )}

        <dl className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
          <div><dt className="inline font-medium text-gray-700">ANCLA number: </dt><dd className="inline">{profile.anclaNumber}</dd></div>
          <div><dt className="inline font-medium text-gray-700">Location: </dt><dd className="inline">{profile.location}</dd></div>
          <div className="sm:col-span-2"><dt className="inline font-medium text-gray-700">Address: </dt><dd className="inline">{profile.address}</dd></div>
        </dl>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand-navy">Connection requests</h2>
      <div className="mt-3 space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-gray-800">
                  {r.exporter.exporterProfile?.companyName ?? r.exporter.name}
                </p>
                <p className="text-xs text-gray-500">{r.exporter.email} · {r.exporter.phone}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.status === "ACCEPTED"
                    ? "bg-green-100 text-green-700"
                    : r.status === "DECLINED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {r.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{r.message}</p>

            {r.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <form action={respondConnectionAction}>
                  <input type="hidden" name="connectionId" value={r.id} />
                  <input type="hidden" name="status" value="ACCEPTED" />
                  <button type="submit" className="rounded-md bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-navy">
                    Accept
                  </button>
                </form>
                <form action={respondConnectionAction}>
                  <input type="hidden" name="connectionId" value={r.id} />
                  <input type="hidden" name="status" value="DECLINED" />
                  <button type="submit" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
                    Decline
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
            No connection requests yet.
          </p>
        )}
      </div>
    </div>
  );
}
