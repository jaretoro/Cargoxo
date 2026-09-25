"use client";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    // global-error replaces the root layout, so global styles (and therefore
    // every Tailwind class) never load here. These have to be inline.
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#101828" }}>
        <title>Cargoxo — something went wrong</title>
        <div style={{ maxWidth: "32rem", margin: "0 auto", padding: "5rem 1rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0b2d52" }}>Cargoxo couldn&rsquo;t start</h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#4a5565" }}>
            Something failed before the page could load. Trying again usually works.
          </p>
          {error.digest && (
            <p style={{ marginTop: "0.75rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#6a7282" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={retry}
            style={{
              marginTop: "1.5rem", padding: "0.5rem 1rem", borderRadius: "0.375rem", border: 0,
              background: "#1a8fe3", color: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
