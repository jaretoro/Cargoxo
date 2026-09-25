import { LoginForm } from "@/components/LoginForm";
import { quickLoginAction } from "@/app/actions/auth";
import { isDemoModeEnabled } from "@/lib/demo";

const QUICK_LOGINS = [
  { email: "admin@cargoxo.com", label: "Admin", hint: "manage users + verification queue" },
  { email: "exporter@cargoxo.com", label: "Exporter", hint: "subscribed — full contact details" },
  { email: "swiftcargo@cargoxo.com", label: "Logistics", hint: "already verified" },
] as const;

const OTHER_DEMO_ACCOUNTS = [
  { email: "exporter2@cargoxo.com", label: "Exporter (no subscription)" },
  { email: "newagentco@cargoxo.com", label: "Logistics (pending verification)" },
  { email: "portlinkfreight@cargoxo.com", label: "Logistics (verified)" },
] as const;

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const callbackUrl = typeof searchParams.callbackUrl === "string" ? searchParams.callbackUrl : "/dashboard";
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const demoMode = isDemoModeEnabled();

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Log in to Cargoxo</h1>

      {error && <div className="mt-4 bg-bad-tint px-4 py-3 text-sm text-bad">{decodeURIComponent(error)}</div>}
      {searchParams.reset === "1" && (
        <div className="mt-4 bg-ok-tint px-4 py-3 text-sm text-ok">
          Password updated — log in with your new one.
        </div>
      )}

      <div className="mt-6 border border-rule bg-surface p-6">
        {demoMode && (
          <>
            <p className="text-sm font-semibold text-ink">Quick demo login</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {QUICK_LOGINS.map((a) => (
                <form key={a.email} action={quickLoginAction}>
                  <input type="hidden" name="email" value={a.email} />
                  <button
                    type="submit"
                    title={a.hint}
                    className="w-full border border-rule px-2 py-3 text-center text-sm font-medium text-ink-soft hover:border-ink hover:text-ink"
                  >
                    {a.label}
                  </button>
                </form>
              ))}
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-muted hover:text-ink-soft">Other demo accounts</summary>
              <div className="mt-2 flex flex-col gap-1.5">
                {OTHER_DEMO_ACCOUNTS.map((a) => (
                  <form key={a.email} action={quickLoginAction}>
                    <input type="hidden" name="email" value={a.email} />
                    <button type="submit" className="text-left text-xs font-medium text-ochre hover:underline">
                      {a.label} →
                    </button>
                  </form>
                ))}
              </div>
            </details>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-paper-deep" />
              <span className="text-xs text-muted">or log in manually</span>
              <div className="h-px flex-1 bg-paper-deep" />
            </div>
          </>
        )}

        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
