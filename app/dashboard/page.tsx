import Link from "next/link";
import {
  Users, Tag, AlertTriangle, TrendingUp, ShieldCheck, CalendarDays, FileText, HeartPulse, ArrowRight, Stethoscope,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import {
  getApplications, getHealthRecords, getLatestRisk, getOverview, getRegions, getVisits,
} from "@/lib/queries";
import { compactETB, formatDate, formatNumber, getRoleLabel, relativeDays, speciesLabel } from "@/lib/utils";
import { BarList, Badge, Card, Page, RiskBadge, StatCard, StatusBadge } from "@/components/ui";
import { ColumnChart, RiskDistribution } from "@/components/charts";

export default async function OverviewPage() {
  const user = await requireUser();
  const role = user.role;
  const [o, topRisk] = await Promise.all([getOverview(user), getLatestRisk(user)]);
  const t = o.totals;

  const field = allowed(role, can.viewHealth);
  const [followUps, visits, apps, regions] = await Promise.all([
    field ? getHealthRecords(user, { followup: "due" }, 6) : Promise.resolve([]),
    allowed(role, can.viewVisits) ? getVisits(user, { status: "scheduled" }) : Promise.resolve([]),
    allowed(role, can.viewApplications) ? getApplications(user) : Promise.resolve([]),
    role === "government" || role === "admin" ? getRegions() : Promise.resolve([]),
  ]);
  const ownApps = role === "bank_insurance" ? apps.filter((a) => a.provider === user.organization) : apps;
  const openApps = ownApps.filter((a) => a.status === "pending" || a.status === "reviewing");
  const c = o.credit;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.name.replace(/^Dr\.\s*/, "").split(" ")[0];

  const appTotals = (status: string) => o.appStatus.filter((a) => a.status === status).reduce((s, a) => s + a.count, 0);
  const approvedValue = o.appStatus.filter((a) => a.status === "approved").reduce((s, a) => s + a.amount, 0);

  return (
    <Page>
      <div className="mb-6">
        <p className="text-sm text-muted">{getRoleLabel(role)} · {user.region_name ?? user.organization}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{greeting}, {firstName}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={user.region_name ? `Farmers in ${user.region_name}` : "Registered farmers"} value={formatNumber(t.farmers)} icon={Users}
          hint={`${t.insured} insured · ${t.loans} with active loans`} href="/dashboard/farmers" />
        <StatCard label="Tagged animals" value={formatNumber(t.animals)} icon={Tag}
          hint={<><span className="font-medium text-danger">{t.sick} sick</span> · {t.lost} lost or missing</>}
          href={allowed(role, can.viewLivestock) ? "/dashboard/livestock" : undefined} />
        <StatCard label="High & critical risk farmers" value={t.high_risk} icon={AlertTriangle} tone="warning"
          hint={`Average risk score ${t.avg_risk ?? "—"}/100`} href="/dashboard/risk?level=high" />
        {role === "bank_insurance" ? (
          <StatCard label="Applications to review" value={openApps.length} icon={FileText} tone="info"
            hint={`${compactETB(approvedValue)} approved to date`} href="/dashboard/applications?status=pending" />
        ) : role === "extension_worker" || role === "admin" ? (
          <StatCard label="Treatment follow-ups due" value={t.followups_due} icon={Stethoscope} tone="danger"
            hint={`${t.visits_upcoming} visits scheduled`} href="/dashboard/health-records?followup=due" />
        ) : (
          <StatCard label="Disease outbreaks (60 days)" value={regions.reduce((s, r) => s + r.disease_outbreaks, 0)} icon={HeartPulse} tone="danger"
            hint={`${regions.filter((r) => r.drought_risk === "high" || r.drought_risk === "critical").length} regions in high drought`} href="/dashboard/regions" />
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Disease & injury cases per week" description="Clinical health records over the last 12 weeks">
          <ColumnChart label="Cases per week"
            data={o.caseTrend.map((w) => ({ key: w.week, value: w.cases, label: new Date(w.week).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }))} />
        </Card>
        <Card title="Farmer risk bands" description="Latest model score per farmer">
          <RiskDistribution bands={o.riskBands} />
          <div className="mt-4 border-t border-border pt-3">
            <h3 className="mb-2 text-xs font-medium text-muted">Herd composition</h3>
            <BarList items={o.species.map((s) => ({ key: s.species, label: speciesLabel(s.species), value: s.count, hint: speciesLabel(s.species) }))} />
          </div>
        </Card>
      </div>

      <Card className="mt-4" title="Credit & insurance across all institutions" description="Active debt is visible to every partner so repeat borrowing can be tracked"
        actions={<Link href="/dashboard/applications" className="text-xs font-medium text-primary hover:underline">All applications</Link>}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Farmers in debt", value: c.debtors, href: "/dashboard/farmers?credit=debt" },
            { label: "Active loans", value: c.active_loans, href: "/dashboard/applications?status=active&type=loan" },
            { label: "Outstanding debt", value: compactETB(c.active_debt), href: "/dashboard/applications?status=active&type=loan" },
            { label: "In debt & asking for more", value: c.repeat_requests, href: "/dashboard/farmers?credit=repeat", warn: c.repeat_requests > 0 },
            { label: "Loans repaid", value: c.repaid_loans, href: "/dashboard/applications?status=completed&type=loan" },
            { label: "Insured farmers", value: `${c.insured} · ${compactETB(c.insured_amount)}`, href: "/dashboard/farmers?credit=insured" },
          ].map((k) => (
            <Link key={k.label} href={k.href} className="rounded-lg px-2 py-1 hover:bg-surface">
              <div className={`text-xl font-semibold tabular-nums ${k.warn ? "text-warning" : ""}`}>{k.value}</div>
              <div className="text-xs text-muted">{k.label}</div>
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Highest-risk farmers" bodyClassName="divide-y divide-border"
          actions={<Link href="/dashboard/risk" className="text-xs font-medium text-primary hover:underline">All predictions</Link>}>
          {topRisk.slice(0, 6).map((r) => (
            <Link key={r.id} href={`/dashboard/farmers/${r.farmer_id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-card-hover">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{r.farmer_name}</div>
                <div className="truncate text-xs text-muted">{r.region_name} · {r.herd_size} animals · loss risk {compactETB(r.predicted_loss_etb)}</div>
              </div>
              <RiskBadge score={r.overall_risk} />
            </Link>
          ))}
        </Card>

        {field && (
          <Card title="Sick animals needing follow-up" bodyClassName="divide-y divide-border"
            actions={<Link href="/dashboard/health-records?followup=due" className="text-xs font-medium text-primary hover:underline">View all</Link>}>
            {followUps.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No follow-ups due this week.</p>}
            {followUps.map((h) => (
              <Link key={h.id} href={`/dashboard/livestock/${h.animal_id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-card-hover">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{h.diagnosis}</div>
                  <div className="truncate text-xs text-muted">{h.tag_number} · {h.farmer_name}</div>
                </div>
                <Badge tone={h.follow_up_date! < new Date().toISOString().slice(0, 10) ? "danger" : "warning"}>
                  {h.follow_up_date! < new Date().toISOString().slice(0, 10) ? "Overdue" : "Due"} {relativeDays(h.follow_up_date)}
                </Badge>
              </Link>
            ))}
          </Card>
        )}

        {role === "bank_insurance" && (
          <Card title={`Applications to ${user.organization}`} bodyClassName="p-4"
            actions={<Link href="/dashboard/applications" className="text-xs font-medium text-primary hover:underline">Review queue</Link>}>
            <div className="mb-4 grid grid-cols-4 gap-2 text-center">
              {["pending", "reviewing", "approved", "completed"].map((s) => (
                <Link key={s} href={`/dashboard/applications?status=${s}`} className="rounded-lg bg-surface py-2 hover:bg-border">
                  <div className="text-lg font-semibold tabular-nums">{appTotals(s)}</div>
                  <div className="text-[11px] text-muted">{{ pending: "Pending", reviewing: "Reviewing", approved: "Active", completed: "Repaid / closed" }[s]}</div>
                </Link>
              ))}
            </div>
            <ul className="divide-y divide-border">
              {openApps.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{a.farmer_name} · {compactETB(a.amount_etb)}</div>
                    <div className="truncate text-xs text-muted">
                      {a.farmer_active_loans > 0 && a.type === "loan" ? <span className="font-medium text-warning">Already owes {compactETB(a.farmer_active_debt_etb)} · </span> : null}{a.purpose}
                    </div>
                  </div>
                  <RiskBadge score={a.current_risk} />
                </li>
              ))}
            </ul>
          </Card>
        )}

        {(role === "government") && (
          <Card title="Drought & disease by region" bodyClassName="divide-y divide-border"
            actions={<Link href="/dashboard/regions" className="text-xs font-medium text-primary hover:underline">Regions</Link>}>
            {[...regions].sort((a, b) => b.drought_index - a.drought_index).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted">NDVI {r.ndvi.toFixed(2)} · {Math.round((r.rainfall_mm / r.rainfall_normal_mm) * 100)}% of normal rain · {r.disease_outbreaks} outbreaks</div>
                </div>
                <StatusBadge status={r.drought_risk} />
              </div>
            ))}
          </Card>
        )}
      </div>

      {(visits.length > 0 || o.topDiagnoses.length > 0) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {visits.length > 0 && (
            <Card title="Upcoming visits" bodyClassName="divide-y divide-border"
              actions={<Link href="/dashboard/visits" className="text-xs font-medium text-primary hover:underline">Schedule</Link>}>
              {visits.slice(0, 6).map((v) => (
                <Link key={v.id} href={`/dashboard/farmers/${v.farmer_id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-card-hover">
                  <div className="flex min-w-0 items-center gap-3">
                    <CalendarDays className="h-4 w-4 shrink-0 text-subtle" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{v.farmer_name} <span className="font-normal text-muted">· {v.kebele}</span></div>
                      <div className="truncate text-xs text-muted">{v.purpose}</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatDate(v.visit_date)}</span>
                </Link>
              ))}
            </Card>
          )}
          {o.topDiagnoses.length > 0 && allowed(role, can.viewHealth) && (
            <Card title="Most common diagnoses" description="Disease records, last 6 months">
              <BarList items={o.topDiagnoses.map((d) => ({ key: d.diagnosis, label: d.diagnosis, value: d.count, hint: "Cases",
                href: `/dashboard/health-records?q=${encodeURIComponent(d.diagnosis.split(" (")[0])}` }))} />
            </Card>
          )}
        </div>
      )}

      {role !== "bank_insurance" && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border-strong bg-card/50 px-4 py-3 text-sm text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          Risk scores update automatically whenever herd, health, application or climate data changes.
          <Link href="/dashboard/risk" className="ml-auto inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline">
            How it works <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
      {role === "bank_insurance" && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border-strong bg-card/50 px-4 py-3 text-sm text-muted">
          <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
          Every application shows the farmer&apos;s score at submission and their live score today, so you can see how risk has moved.
        </div>
      )}
    </Page>
  );
}
