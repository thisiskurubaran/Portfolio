import type { SVGProps } from "react";

// The folioOS mark: three stacked windows, one portfolio across many shells.
// "color" keeps the brand teals; "mono" draws in currentColor at three
// strengths so it sits in a menu bar on any wallpaper.
interface LogoProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number;
  variant?: "tile" | "color" | "mono";
  title?: string;
}

const panes = [
  { x: 11, y: 11 },
  { x: 17, y: 18 },
  { x: 23, y: 25 },
];
const brand = ["#1d6b5a", "#2f9c82", "#4cc2a8"];
const monoOpacity = [0.35, 0.6, 1];

export function LogoMark({ size = 24, variant = "color", title, ...rest }: LogoProps) {
  const tile = variant === "tile";
  return (
    <svg width={size} height={size} viewBox={tile ? "0 0 64 64" : "9 9 46 42"} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} {...rest}>
      {tile && <rect width="64" height="64" rx="15" fill="#0e1116" />}
      {panes.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width="30"
          height="24"
          rx="5"
          fill={variant === "mono" ? "currentColor" : brand[i]}
          fillOpacity={variant === "mono" ? monoOpacity[i] : 1}
        />
      ))}
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      folio<span className="font-normal text-muted">OS</span>
    </span>
  );
}
