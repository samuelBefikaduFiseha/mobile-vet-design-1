import type { RiskLevel, UserRole } from "./types";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary" | "accent";

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? value + "T00:00:00" : value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** "3 days ago", "in 5 days", "today" for a YYYY-MM-DD or ISO value. */
export function relativeDays(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? value + "T00:00:00" : value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 864e5);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function ageFrom(birth: string | null): string {
  if (!birth) return "—";
  const months = Math.floor((Date.now() - new Date(birth).getTime()) / (30.44 * 864e5));
  if (months < 12) return `${months} mo`;
  return `${Math.floor(months / 12)} yr${months >= 24 ? "s" : ""}`;
}

export function formatNumber(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("en-US");
}

export function formatETB(n: number | null | undefined): string {
  return `ETB ${Math.round(n ?? 0).toLocaleString("en-US")}`;
}

export function compactETB(n: number): string {
  if (n >= 1e6) return `ETB ${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `ETB ${Math.round(n / 1e3)}k`;
  return `ETB ${n}`;
}

export function riskLevel(score: number | null | undefined): RiskLevel | null {
  if (score === null || score === undefined) return null;
  if (score <= 40) return "low";
  if (score <= 60) return "medium";
  if (score <= 80) return "high";
  return "critical";
}

export const riskTone: Record<RiskLevel, Tone> = { low: "success", medium: "accent", high: "warning", critical: "danger" };

export const riskBar: Record<RiskLevel, string> = {
  low: "bg-success", medium: "bg-accent", high: "bg-warning", critical: "bg-danger",
};

export function statusTone(status: string): Tone {
  switch (status) {
    case "active": case "approved": case "completed": case "healthy": case "low": case "success": case "closed":
      return "success";
    case "pending": case "moderate": case "warning": case "missing": case "medium": case "new":
      return "warning";
    case "inactive": case "rejected": case "declined": case "cancelled": case "sick": case "deceased": case "emergency": case "danger": case "critical":
      return "danger";
    case "high":
      return "warning";
    case "reviewing": case "recovered": case "info": case "scheduled": case "contacted":
      return "info";
    default:
      return "neutral";
  }
}

export const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface text-muted ring-border",
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning ring-warning/20",
  danger: "bg-danger-soft text-danger ring-danger/20",
  info: "bg-info-soft text-info ring-info/20",
  primary: "bg-primary-soft text-primary ring-primary/20",
  accent: "bg-accent-soft text-accent ring-accent/25",
};

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : s;
}

export function getRoleLabel(role: UserRole | string): string {
  switch (role) {
    case "extension_worker": return "Extension Worker";
    case "bank_insurance": return "Bank / Insurance";
    case "admin": return "Administrator";
    case "government": return "Government";
    default: return role;
  }
}

export function initials(name: string) {
  return name.replace(/^Dr\.\s*/, "").split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function speciesLabel(s: string) {
  return { cattle: "Cattle", goat: "Goat", sheep: "Sheep", camel: "Camel", donkey: "Donkey" }[s] ?? s;
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Flatten Next.js searchParams into plain strings. */
export async function readParams(sp: SearchParams): Promise<Record<string, string>> {
  const raw = await sp;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] ?? "" : v ?? ""]));
}

/** YYYY-MM-DD for today plus `n` days (negative for the past). */
export function isoDaysFromToday(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** ["sick","healthy"] → [{ value: "sick", label: "Sick" }, …] for filter dropdowns. */
export function toOptions(values: string[], label: (v: string) => string = capitalize) {
  return values.map((v) => ({ value: v, label: label(v) }));
}

/** Human status for a loan / insurance application. "approved" means it is currently active. */
export function applicationStatusLabel(type: "loan" | "insurance", status: string) {
  if (status === "approved") return type === "loan" ? "Active loan" : "Active policy";
  if (status === "completed") return type === "loan" ? "Repaid" : "Closed";
  if (status === "rejected") return "Declined";
  if (status === "reviewing") return "Under review";
  return capitalize(status);
}
