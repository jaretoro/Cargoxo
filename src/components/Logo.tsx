// Stand-in Cargoxo mark (globe + plane, in the brand's navy/sky-blue palette)
// recreated as SVG since the original artwork was only shared as a chat
// image, not a file on disk. Drop a real export at /public/logo.png and swap
// the <Mark /> usage below for an <img>/<Image> if you want the exact logo.
function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="var(--brand-blue)" strokeWidth="1.5" />
      <ellipse cx="20" cy="20" rx="18" ry="7" stroke="var(--brand-sky)" strokeWidth="1" opacity="0.7" />
      <line x1="2" y1="20" x2="38" y2="20" stroke="var(--brand-sky)" strokeWidth="1" opacity="0.7" />
      <path
        d="M6 24 L34 14 L28 20 L34 20 L20 26 L15 23 L6 24Z"
        fill="var(--brand-navy)"
      />
      <path d="M34 14 L28 20 L23 18.5 Z" fill="var(--brand-blue)" />
    </svg>
  );
}

export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <Mark size={size} />
      {withWordmark && (
        <span className="font-bold tracking-tight text-brand-navy" style={{ fontSize: size * 0.75 }}>
          Cargoxo
        </span>
      )}
    </span>
  );
}
