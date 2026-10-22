import type { ReactNode } from "react";
import { Icon, type IconName } from "@/design/icons";

// Shared building blocks for app content, so every app reads as one system.

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto space-y-7 p-6 ${wide ? "max-w-4xl" : "max-w-3xl"}`}>{children}</div>;
}

export function SectionHeader({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {detail && <p className="text-xs text-muted">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "", as: Tag = "div", id }: { children: ReactNode; className?: string; as?: "div" | "li" | "article" | "section"; id?: string }) {
  return (
    <Tag id={id} className={`rounded-card border border-line bg-raised p-4 shadow-1 ${className}`}>
      {children}
    </Tag>
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        tone === "accent" ? "bg-accent/15 text-accent-fg ring-1 ring-accent/30" : "bg-glass text-paper ring-1 ring-line"
      }`}
    >
      {children}
    </span>
  );
}

export function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Chip>{item}</Chip>
        </li>
      ))}
    </ul>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-raised p-3.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-display text-lg font-semibold leading-tight">{value}</dd>
    </div>
  );
}

// An empty state is an invitation, not an apology: what will appear here.
export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-glass text-muted ring-1 ring-line">
        <Icon name={icon} size={26} />
      </span>
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ButtonLink({ href, children, primary = false, download }: { href: string; children: ReactNode; primary?: boolean; download?: string }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      download={download}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-control px-3.5 py-2 text-sm font-medium ${
        primary ? "bg-accent text-on-accent hover:brightness-110" : "border border-line bg-glass hover:bg-glass-strong"
      }`}
    >
      {children}
    </a>
  );
}

// Loading placeholder that keeps the layout steady while an app's code loads.
export function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 p-6" aria-label="Loading" role="status">
      <div className="folio-shimmer h-6 w-1/2 rounded-md" />
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="folio-shimmer h-4 rounded-md" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}
