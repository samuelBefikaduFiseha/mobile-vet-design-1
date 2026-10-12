import Link from "next/link";
import { TrendingUp, RefreshCw, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getLatestRisk, getRegionOptions } from "@/lib/queries";
import { assessAll, assessFarmer } from "@/lib/actions";
import { compactETB, formatDateTime, readParams, type SearchParams } from "@/lib/utils";
import { ActionButton, FilterBar } from "@/components/client";
import { Card, EmptyState, Page, PageHeader, RiskBadge, RiskMeter, StatCard } from "@/components/ui";

export default async function RiskPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser(can.viewRisk);
  const p = await readParams(searchParams);
  const [rows, regions] = await Promise.all([getLatestRisk(user, p), getRegionOptions()]);
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.overall_risk, 0) / rows.length) : 0;
  const exposure = rows.reduce((s, r) => s + r.predicted_loss_etb, 0);

  return (
    <Page>
      <PageHeader title="Risk & predictions" icon={TrendingUp}
        description="Household risk scored from herd health, regional climate and financial records"
        actions={allowed(user.role, can.assessRisk) && <ActionButton action={assessAll} className="btn-primary"><RefreshCw className="h-4 w-4" /> Re-run model{user.region_name ? ` for ${user.region_name}` : ""}</ActionButton>} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Farmers scored" value={rows.length} />
        <StatCard label="Average risk" value={`${avg}/100`} />
        <StatCard label="High or critical" value={rows.filter((r) => r.overall_risk > 60).length} />
        <StatCard label="Expected herd losses" value={compactETB(exposure)} hint="Sum of predicted loss across listed farmers" />
      </div>

      <details className="card mb-5 px-4 py-3 text-sm text-muted [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer items-center gap-2 font-medium text-foreground"><Info className="h-4 w-4 text-primary" /> How the score is calculated</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <p><b className="text-foreground">Drought (35%)</b> — the region&apos;s NDVI vegetation index and 90-day rainfall versus normal.</p>
          <p><b className="text-foreground">Disease (30%)</b> — share of sick animals, disease/injury cases in the last 120 days weighted by severity, losses, minus vaccination coverage.</p>
          <p><b className="text-foreground">Market (15%)</b> — how concentrated the herd is in one species, plus regional drought pressure on prices.</p>
          <p><b className="text-foreground">Financial (20%)</b> — whether the household is insured, carries an approved loan, herd size and dependants.</p>
        </div>
        <p className="mt-3 text-xs">Scores re-run automatically when animals, health records, applications or regional climate data change. Expected loss ≈ herd value × risk × 25%.</p>
      </details>

      <FilterBar placeholder="Search farmer…" filters={[
        ...(user.role === "extension_worker" ? [] : [{ name: "region", label: "All regions", options: regions.map((r) => ({ value: String(r.id), label: r.name })) }]),
        { name: "level", label: "Any level", options: ["critical", "high", "medium", "low"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
      ]} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <Card key={r.id} className="flex flex-col" bodyClassName="flex flex-1 flex-col p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/dashboard/farmers/${r.farmer_id}`} className="block truncate font-semibold hover:text-primary">{r.farmer_name}</Link>
                <div className="text-xs text-muted">{r.region_name} · {r.herd_size} animals</div>
              </div>
              <RiskBadge score={r.overall_risk} />
            </div>
            <div className="space-y-2">
              <RiskMeter label="Drought" value={r.drought_risk} />
              <RiskMeter label="Disease" value={r.disease_risk} />
              <RiskMeter label="Market" value={r.market_risk} />
              <RiskMeter label="Financial" value={r.financial_risk} />
            </div>
            <p className="mt-3 flex-1 rounded-lg bg-surface px-3 py-2 text-xs leading-relaxed text-foreground/85">{r.recommendation}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
              <span>Expected loss <b className="text-foreground">{compactETB(r.predicted_loss_etb)}</b> · {Math.round(r.confidence * 100)}% conf.</span>
              {allowed(user.role, can.assessRisk) && <ActionButton action={assessFarmer.bind(null, r.farmer_id)} className="icon-btn h-7 w-7" title="Re-assess"><RefreshCw className="h-3.5 w-3.5" /></ActionButton>}
            </div>
            <div className="mt-1 text-[10px] text-subtle">Updated {formatDateTime(r.assessed_at)}</div>
          </Card>
        ))}
      </div>
      {rows.length === 0 && <EmptyState icon={TrendingUp} title="No assessments match these filters" />}
    </Page>
  );
}
