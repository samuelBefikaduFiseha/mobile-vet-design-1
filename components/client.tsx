"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Search, X, AlertCircle, SlidersHorizontal } from "lucide-react";
import { Modal } from "./Modal";
import type { ActionState } from "@/lib/types";

// ------------------------------------------------------------------ toasts
type ToastMsg = { id: number; ok: boolean; text: string };

export function toast(ok: boolean, text: string) {
  window.dispatchEvent(new CustomEvent("mv-toast", { detail: { ok, text } }));
}

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const { ok, text } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, ok, text }]);
      setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4000);
    };
    window.addEventListener("mv-toast", on);
    return () => window.removeEventListener("mv-toast", on);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg">
          {t.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />}
          <span className="text-foreground">{t.text}</span>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ form dialog
type FormAction = (state: ActionState, fd: FormData) => Promise<ActionState>;

/**
 * Button that opens a modal containing a form bound to a Server Action.
 * Closes and toasts on success; shows the error inline on failure.
 */
export function FormDialog({
  action, title, description, trigger, triggerClassName = "btn-primary", submitLabel = "Save",
  children, maxWidth = "max-w-xl", triggerTitle,
}: {
  action: FormAction; title: string; description?: ReactNode; trigger: ReactNode; triggerClassName?: string;
  submitLabel?: string; children: ReactNode; maxWidth?: string; triggerTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => { setInstance((n) => n + 1); setOpen(true); }} title={triggerTitle} aria-label={triggerTitle}>
        {trigger}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={description} maxWidth={maxWidth}>
        <ActionForm key={instance} action={action} submitLabel={submitLabel} onDone={() => setOpen(false)} onCancel={() => setOpen(false)}>
          {children}
        </ActionForm>
      </Modal>
    </>
  );
}

export function ActionForm({ action, submitLabel = "Save", children, onDone, onCancel, className = "" }: {
  action: FormAction; submitLabel?: string; children: ReactNode; onDone?: () => void; onCancel?: () => void; className?: string;
}) {
  // Toast from inside the action: a successful save can re-render the page so that this form
  // (e.g. a row's "Review" button) no longer exists, and an effect would never get to run.
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await action(prev, fd);
    if (res?.ok) toast(true, res.message ?? "Saved.");
    return res;
  }, null);
  const handled = useRef<ActionState>(null);
  useEffect(() => {
    if (state && state !== handled.current) {
      handled.current = state;
      if (state.ok) onDone?.();
    }
  }, [state, onDone]);
  return (
    <form action={formAction} className={className}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      {state && !state.ok && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>}
        <button type="submit" disabled={pending} className="btn-primary min-w-24">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

/** Labelled field wrapper; pass `full` to span both columns. */
export function Field({ label, children, full, hint }: { label: string; children: ReactNode; full?: boolean; hint?: string }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-subtle">{hint}</span>}
    </label>
  );
}

// ------------------------------------------------------------------ one-click actions
/** Runs a bound Server Action (optionally after confirming) and toasts the result. */
export function ActionButton({ action, children, className = "btn-secondary", confirm, title, confirmLabel = "Confirm", danger }: {
  action: () => Promise<ActionState>; children: ReactNode; className?: string; title?: string;
  confirm?: { title: string; message: ReactNode }; confirmLabel?: string; danger?: boolean;
}) {
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const go = () =>
    start(async () => {
      const res = await action();
      setAsking(false);
      if (res) toast(res.ok, res.ok ? res.message ?? "Done." : res.error ?? "Failed.");
    });
  return (
    <>
      <button type="button" className={className} disabled={pending} title={title} aria-label={title}
        onClick={() => (confirm ? setAsking(true) : go())}>
        {pending && !confirm ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </button>
      {confirm && (
        <Modal open={asking} onClose={() => setAsking(false)} title={confirm.title} maxWidth="max-w-sm">
          <div className="text-sm text-muted">{confirm.message}</div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAsking(false)}>Cancel</button>
            <button type="button" className={danger ? "btn-danger" : "btn-primary"} onClick={go} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ------------------------------------------------------------------ URL-driven filters
export type FilterDef = {
  name: string;
  label: string;
  /** "select" (default) or a "date" input. */
  type?: "select" | "date";
  options?: { value: string; label: string }[];
  /** Other filter keys to clear when this one changes (e.g. region → woreda, kebele, farmer). */
  resets?: string[];
  /** Shown under "More filters" instead of the main row. */
  more?: boolean;
};

export function FilterBar({ placeholder = "Search…", filters = [], children }: {
  placeholder?: string; filters?: FilterDef[]; children?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, start] = useTransition();
  const visible = filters.filter((f) => f.type === "date" || (f.options && f.options.length > 0));
  const extra = visible.filter((f) => f.more);
  const extraActive = extra.filter((f) => params.get(f.name)).length;
  const [showMore, setShowMore] = useState(extraActive > 0);

  const update = (key: string, value: string, resets: string[] = []) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    for (const r of resets) next.delete(r);
    start(() => router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false }));
  };

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update("q", q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeCount = visible.filter((f) => params.get(f.name)).length + (params.get("q") ? 1 : 0);

  const control = (f: FilterDef) => {
    const value = params.get(f.name) ?? "";
    const on = value ? "border-primary/50 bg-primary-soft/40" : "";
    if (f.type === "date") {
      return (
        <label key={f.name} className={`input flex w-auto items-center gap-2 py-1.5 ${on}`}>
          <span className="whitespace-nowrap text-xs text-muted">{f.label}</span>
          <input type="date" value={value} onChange={(e) => update(f.name, e.target.value, f.resets)} className="bg-transparent text-sm outline-none" aria-label={f.label} />
        </label>
      );
    }
    return (
      <select key={f.name} value={value} onChange={(e) => update(f.name, e.target.value, f.resets)} className={`input w-auto min-w-36 max-w-60 ${on}`} aria-label={f.label}>
        <option value="">{f.label}</option>
        {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        {value && !f.options!.some((o) => o.value === value) && <option value={value}>{value}</option>}
      </select>
    );
  };

  return (
    <div className="card mb-4 p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:w-72 lg:shrink-0">
          {pending ? <Loader2 className="absolute left-3 top-2.5 h-4 w-4 animate-spin text-subtle" /> : <Search className="absolute left-3 top-2.5 h-4 w-4 text-subtle" />}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="input pl-9" aria-label="Search" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {visible.filter((f) => !f.more).map(control)}
          {extra.length > 0 && (
            <button type="button" className="btn-ghost" onClick={() => setShowMore(!showMore)} aria-expanded={showMore}>
              <SlidersHorizontal className="h-4 w-4" />
              More filters{extraActive > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">{extraActive}</span>}
            </button>
          )}
          {activeCount > 0 && (
            <button type="button" className="btn-ghost text-danger hover:text-danger" onClick={() => { setQ(""); start(() => router.replace(pathname, { scroll: false })); }}>
              <X className="h-4 w-4" /> Clear ({activeCount})
            </button>
          )}
          {children}
        </div>
      </div>
      {showMore && extra.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">{extra.map(control)}</div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ dependent region → woreda picker
export function RegionWoredaFields({ regions, defaultRegion, defaultWoreda, lockRegion }: {
  regions: { id: number; name: string; woredas: string[] }[];
  defaultRegion?: number | null; defaultWoreda?: string; lockRegion?: boolean;
}) {
  const [regionId, setRegionId] = useState<number | "">(defaultRegion ?? (regions.length === 1 ? regions[0].id : ""));
  const woredas = regions.find((r) => r.id === regionId)?.woredas ?? [];
  return (
    <>
      <Field label="Region / zone">
        <select name="region_id" required value={regionId} disabled={lockRegion}
          onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : "")} className="input">
          <option value="">Select…</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {lockRegion && <input type="hidden" name="region_id" value={regionId} />}
      </Field>
      <Field label="Woreda">
        <select name="woreda" required defaultValue={defaultWoreda ?? ""} key={String(regionId)} className="input">
          <option value="">Select…</option>
          {woredas.map((w) => <option key={w} value={w}>{w}</option>)}
          {defaultWoreda && !woredas.includes(defaultWoreda) && <option value={defaultWoreda}>{defaultWoreda}</option>}
        </select>
      </Field>
    </>
  );
}
