import Image from "next/image";

// The real Cargoxo mark. It arrived as a JPEG lockup on a white background;
// public/logo-mark.png is that artwork with the surrounding background
// flood-filled to transparent (the aircraft is white, so a plain white key
// would have eaten it), cropped to the globe/ship/plane.
//
// public/logo-full.png is the same treatment applied to the whole stacked
// lockup, wordmark included — use that where there's vertical room.
const MARK_ASPECT = 542 / 260;

export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <Image
        src="/logo-mark.png"
        alt={withWordmark ? "" : "Cargoxo"}
        width={Math.round(size * MARK_ASPECT)}
        height={size}
        // Chrome in the header/footer of every page — worth having eagerly
        // rather than popping in after paint.
        priority
        className="h-auto w-auto"
        style={{ height: size, width: "auto" }}
      />
      {withWordmark && (
        <span className="font-display font-semibold tracking-tight text-ink" style={{ fontSize: size * 0.88 }}>
          Cargoxo
        </span>
      )}
    </span>
  );
}

// The stacked artwork exactly as supplied, for places with room to breathe.
export function LogoLockup({ height = 96, className }: { height?: number; className?: string }) {
  return (
    <Image
      src="/logo-full.png"
      alt="Cargoxo"
      width={Math.round(height * (713 / 434))}
      height={height}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
