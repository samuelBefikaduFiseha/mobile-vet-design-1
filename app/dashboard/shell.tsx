"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PawPrint, Users, Tag, HeartPulse, CalendarDays, TrendingUp, FileText, Shield, LayoutDashboard,
  Map, LogOut, Bell, Search, Menu, X, AlertTriangle, CloudRain, Sun, Megaphone, Inbox, Wallet, Check,
} from "lucide-react";
import { logout, markAlertRead, markAllAlertsRead } from "@/lib/actions";
import { can } from "@/lib/permissions";
import { getRoleLabel, initials, relativeDays } from "@/lib/utils";
import type { Alert, SessionUser, UserRole } from "@/lib/types";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: UserRole[] };

const sections: { title: string; items: NavItem[] }[] = [
  { title: "", items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: can.viewFarmers }] },
  {
    title: "Field",
    items: [
      { href: "/dashboard/farmers", label: "Farmers", icon: Users, roles: can.viewFarmers },
      { href: "/dashboard/livestock", label: "Livestock", icon: Tag, roles: can.viewLivestock },
      { href: "/dashboard/health-records", label: "Health records", icon: HeartPulse, roles: can.viewHealth },
      { href: "/dashboard/visits", label: "Visits", icon: CalendarDays, roles: can.viewVisits },
    ],
  },
  {
    title: "Risk & finance",
    items: [
      { href: "/dashboard/risk", label: "Risk & predictions", icon: TrendingUp, roles: can.viewRisk },
      { href: "/dashboard/applications", label: "Loans & insurance", icon: FileText, roles: can.viewApplications },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { href: "/dashboard/regions", label: "Regions & climate", icon: Map, roles: can.viewRegions },
      { href: "/dashboard/alerts", label: "Alerts", icon: Megaphone, roles: can.viewAlerts },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/dashboard/users", label: "Users", icon: Shield, roles: can.manageUsers },
      { href: "/dashboard/inquiries", label: "Inquiries", icon: Inbox, roles: can.viewInquiries },
    ],
  },
];

const alertIcon = { drought: Sun, disease: AlertTriangle, weather: CloudRain, system: Megaphone, financial: Wallet };
const alertTone = { info: "text-info bg-info-soft", warning: "text-warning bg-warning-soft", danger: "text-danger bg-danger-soft", success: "text-success bg-success-soft" };

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function DashboardShell({ user, alerts, children }: { user: SessionUser; alerts: Alert[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visible = sections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.roles.includes(user.role)) }))
    .filter((s) => s.items.length);
  const current = visible.flatMap((s) => s.items).filter((i) => isActive(pathname, i.href)).at(-1);

  const nav = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {visible.map((s) => (
        <div key={s.title || "main"}>
          {s.title && <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted/80">{s.title}</div>}
          <div className="space-y-0.5">
            {s.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-sidebar-active text-white" : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
                  }`}>
                  <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-[#8fd3ab]" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e8a5c] text-white"><PawPrint className="h-4.5 w-4.5" /></span>
      <span>
        <span className="block text-sm font-semibold text-white">Mobile Vet</span>
        <span className="block text-[10px] text-sidebar-muted">{user.region_name ?? user.organization}</span>
      </span>
    </Link>
  );

  const userBox = (
    <div className="border-t border-sidebar-hover p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-xs font-semibold text-[#8fd3ab]">{initials(user.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-sidebar-text">{user.name}</div>
          <div className="truncate text-[11px] text-sidebar-muted">{getRoleLabel(user.role)}</div>
        </div>
        <form action={logout}>
          <button type="submit" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-white" title="Sign out" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar-bg md:flex">
        <div className="flex h-16 items-center px-5">{brand}</div>
        {nav}
        {userBox}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar-bg">
            <div className="flex h-16 items-center justify-between px-5">
              {brand}
              <button onClick={() => setMobileOpen(false)} className="text-sidebar-muted" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            {nav}
            {userBox}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="icon-btn md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden text-sm font-medium text-muted lg:block lg:w-48">{current?.label ?? "Dashboard"}</div>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1">
            <Notifications alerts={alerts} />
            <span className="ml-2 hidden items-center gap-2 border-l border-border pl-3 sm:flex">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{initials(user.name)}</span>
              <span className="leading-tight">
                <span className="block text-xs font-semibold text-foreground">{user.name}</span>
                <span className="block text-[11px] text-muted">{user.organization}</span>
              </span>
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form className="relative w-full max-w-md" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/dashboard/search?q=${encodeURIComponent(q.trim())}`); }}>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-subtle" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search farmers, ear tags, RFID, diagnoses…" className="input bg-background pl-9" aria-label="Search everything" />
    </form>
  );
}

function Notifications({ alerts }: { alerts: Alert[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const unread = alerts.filter((a) => !a.read).length;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="icon-btn relative" aria-label={`Notifications (${unread} unread)`}>
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Alerts</h3>
            {unread > 0 && (
              <button disabled={pending} onClick={() => start(async () => { await markAllAlertsRead(); })} className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] divide-y divide-border overflow-y-auto">
            {alerts.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No alerts</p>}
            {alerts.map((a) => {
              const Icon = alertIcon[a.type] ?? AlertTriangle;
              return (
                <div key={a.id} className={`flex gap-3 px-4 py-3 ${a.read ? "opacity-60" : ""}`}>
                  <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${alertTone[a.severity]}`}><Icon className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-foreground">{a.title}</p>
                      {!a.read && (
                        <button onClick={() => start(async () => { await markAlertRead(a.id); })} className="icon-btn h-6 w-6 shrink-0" title="Mark as read" aria-label="Mark as read">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{a.message}</p>
                    <p className="mt-1 text-[11px] text-subtle">{a.region_name ?? "All regions"} · {relativeDays(a.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/dashboard/alerts" onClick={() => setOpen(false)} className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-surface">
            View all alerts
          </Link>
        </div>
      )}
    </div>
  );
}
