import Link from "next/link";
import { Map, CloudRain, Leaf, Pencil, Users, Tag, Bug, Landmark, ShieldCheck, UserCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getRegions } from "@/lib/queries";
import { updateRegionClimate } from "@/lib/actions";
import { relativeDays } from "@/lib/utils";
import { Field, FormDialog } from "@/components/client";
import { Card, Page, PageHeader, RiskBadge, RiskMeter, StatusBadge } from "@/components/ui";

export default async function RegionsPage() {
  const user = await requireUser(can.viewRegions);
  const regions = await getRegions();
  const editable = allowed(user.role, can.editRegions);

  return (
    <Page>
      <PageHeader title="Regions & climate" icon={Map}
        description="Satellite vegetation (NDVI) and rainfall per operating zone. All other figures are live counts from field records." />

      <div className="grid gap-4 lg:grid-cols-2">
        {regions.map((r) => {
          const rainPct = Math.round((r.rainfall_mm / r.rainfall_normal_mm) * 100);
          return (
            <Card key={r.id} bodyClassName="p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{r.name}</h2>
                  <p className="text-xs text-muted">{r.admin_region} · {r.livelihood} · {r.woredas.length} woredas</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.drought_risk} />
                  {editable && (
                    <FormDialog action={updateRegionClimate} title={`Update climate: ${r.name}`} maxWidth="max-w-md"
                      description="Saving re-scores every farmer in this region." triggerClassName="icon-btn" triggerTitle="Update climate data" trigger={<Pencil className="h-4 w-4" />}>
                      <input type="hidden" name="id" value={r.id} />
                      <Field label="Rainfall, last 90 days (mm)"><input name="rainfall_mm" type="number" min={0} required defaultValue={r.rainfall_mm} className="input" /></Field>
                      <Field label="Long-term normal (mm)"><input name="rainfall_normal_mm" type="number" min={1} required defaultValue={r.rainfall_normal_mm} className="input" /></Field>
                      <Field label="NDVI (0–1)" hint="Below 0.2 indicates severe vegetation stress." full><input name="ndvi" type="number" step="0.01" min={0} max={1} required defaultValue={r.ndvi} className="input" /></Field>
                    </FormDialog>
                  )}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-surface p-3">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-muted"><Leaf className="h-3 w-3" /> NDVI</div>
                  <div className="text-lg font-semibold tabular-nums">{r.ndvi.toFixed(2)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-muted"><CloudRain className="h-3 w-3" /> Rain (90d)</div>
                  <div className="text-lg font-semibold tabular-nums">{r.rainfall_mm}<span className="text-xs font-normal text-muted"> mm</span></div>
                  <div className={`text-[11px] ${rainPct < 60 ? "font-medium text-danger" : "text-muted"}`}>{rainPct}% of normal</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted">Avg farmer risk</div>
                  <div className="mt-1"><RiskBadge score={r.avg_risk_score} /></div>
                </div>
              </div>

              <RiskMeter label="Drought index" value={r.drought_index} />

              <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3 text-sm">
                {[
                  { icon: Users, label: "Farmers", value: r.total_farmers, href: `/dashboard/farmers?region=${r.id}` },
                  { icon: Tag, label: "Animals", value: r.total_animals, sub: r.sick_animals ? `${r.sick_animals} sick` : undefined, href: `/dashboard/livestock?region=${r.id}` },
                  { icon: Bug, label: "Outbreaks (60d)", value: r.disease_outbreaks },
                  { icon: Landmark, label: "Active loans", value: r.active_loans },
                  { icon: ShieldCheck, label: "Insured", value: r.active_insurance },
                  { icon: UserCheck, label: "Field workers", value: r.extension_workers },
                ].map((s) => {
                  const inner = (
                    <>
                      <dt className="flex items-center gap-1 text-[11px] text-muted"><s.icon className="h-3 w-3" />{s.label}</dt>
                      <dd className="font-semibold tabular-nums">{s.value}{s.sub && <span className="ml-1 text-[11px] font-medium text-danger">{s.sub}</span>}</dd>
                    </>
                  );
                  return s.href && allowed(user.role, can.viewLivestock)
                    ? <Link key={s.label} href={s.href} className="rounded-md hover:bg-surface">{inner}</Link>
                    : <div key={s.label}>{inner}</div>;
                })}
              </dl>
              <p className="mt-4 text-[11px] text-subtle">Woredas: {r.woredas.join(", ")} · climate updated {relativeDays(r.climate_updated_at)}</p>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
