import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { applicationStatusLabel, capitalize, riskBar, riskLevel, riskTone, statusTone, toneClasses, type Tone } from "@/lib/utils";

type Icon = ComponentType<{ className?: string }>;

export function PageHeader({ title, description, icon: IconC, actions }: {
  title: string; description?: ReactNode; icon?: Icon; actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-foreground">
          {IconC && (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <IconC className="h-5 w-5" />
            </span>
          )}
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>;
}

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{capitalize(status)}</Badge>;
}

export function RiskBadge({ score }: { score: number | null }) {
  const level = riskLevel(score);
  if (!level) return <span className="text-xs text-subtle">Not assessed</span>;
  return (
    <Badge tone={riskTone[level]}>
      <span className="tabular-nums">{score}</span> · {capitalize(level)}
    </Badge>
  );
}

/** Horizontal 0–100 meter; colour follows the risk band and the number is always shown. */
export function RiskMeter({ label, value }: { label: string; value: number }) {
  const level = riskLevel(value)!;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div className={`h-full rounded-full ${riskBar[level]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, icon: IconC, tone = "primary", href }: {
  label: string; value: ReactNode; hint?: ReactNode; icon?: Icon; tone?: Tone; href?: string;
}) {
  const body = (
    <div className={`card h-full p-4 ${href ? "transition-colors hover:border-border-strong hover:bg-card-hover" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted">{label}</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</div>
        </div>
        {IconC && (
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${toneClasses[tone]}`}>
            <IconC className="h-4 w-4" />
          </span>
        )}
      </div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export function Card({ title, description, actions, children, className = "", bodyClassName = "p-4" }: {
  title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string;
}) {
  return (
    <section className={`card min-w-0 ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: IconC, title, children }: { icon?: Icon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      {IconC && <IconC className="mb-3 h-8 w-8 text-subtle" />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function TableShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
      {footer && <div className="border-t border-border px-4 py-2.5 text-xs text-muted">{footer}</div>}
    </div>
  );
}

export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

/** Ranked horizontal bars for magnitudes — one hue, values labelled, hover tooltip via title. */
export function BarList({ items, format = (n) => String(n), max }: {
  items: { label: ReactNode; value: number; key: string; href?: string; hint?: string }[];
  format?: (n: number) => string; max?: number;
}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-sm text-muted">No data yet.</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => {
        const row = (
          <div className="group" title={`${i.hint ?? ""}${i.hint ? ": " : ""}${format(i.value)}`}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-foreground">{i.label}</span>
              <span className="font-semibold tabular-nums text-foreground">{format(i.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-surface">
              <div className="h-full rounded-full bg-chart transition-opacity group-hover:opacity-80" style={{ width: `${Math.max(2, (i.value / top) * 100)}%` }} />
            </div>
          </div>
        );
        return <li key={i.key}>{i.href ? <Link href={i.href} className="block">{row}</Link> : row}</li>;
      })}
    </ul>
  );
}

/** Application status, worded for credit tracking: an approved loan is an active debt; completed = repaid. */
export function ApplicationBadge({ type, status }: { type: "loan" | "insurance"; status: string }) {
  const tone: Tone =
    status === "approved" ? (type === "loan" ? "info" : "success")
    : status === "completed" ? (type === "loan" ? "success" : "neutral")
    : statusTone(status);
  return <Badge tone={tone}>{applicationStatusLabel(type, status)}</Badge>;
}

/** Farmer / animal avatar: the latest photo, or initials when there is none. */
export function Avatar({ photoId, name, size = "md" }: { photoId?: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const box = { sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-20 w-20 text-xl" }[size];
  const letters = name.replace(/^Dr\.\s*/, "").split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return photoId ? (
    // eslint-disable-next-line @next/next/no-img-element -- served by our authenticated photo route
    <img src={`/api/photos/${photoId}?size=thumb`} alt="" className={`${box} shrink-0 rounded-full border border-border object-cover`} />
  ) : (
    <span className={`${box} inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary`}>{letters}</span>
  );
}

/** Small square thumbnail for an animal (first photo), or a placeholder. */
export function AnimalThumb({ id, size = "sm" }: { id?: string | null; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8 rounded-md" : "h-11 w-11 rounded-lg";
  return id ? (
    // eslint-disable-next-line @next/next/no-img-element -- served by our authenticated photo route
    <img src={`/api/photos/${id}?size=thumb`} alt="" loading="lazy" className={`${box} shrink-0 border border-border object-cover`} />
  ) : (
    <span className={`${box} inline-block shrink-0 border border-dashed border-border bg-surface`} aria-hidden />
  );
}
