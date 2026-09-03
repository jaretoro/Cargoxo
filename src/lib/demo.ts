// Demo mode powers the one-click login buttons on /login, which sign in as
// seeded accounts using a shared, publicly-documented password — including
// the admin account. That's a password-free path into full admin access, so
// it has to be impossible to reach from a real deployment.
//
// It is opt-in twice over: the build must not be production, AND the flag
// must be explicitly set. Anything else (including simply forgetting to set
// NODE_ENV) leaves it off.
export function isDemoModeEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
