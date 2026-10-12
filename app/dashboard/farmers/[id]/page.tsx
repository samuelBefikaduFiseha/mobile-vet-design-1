import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Phone, MapPin, Users, Calendar, UserCheck, Tag, HeartPulse, CalendarDays, FileText, RefreshCw, Plus, Pencil, ShieldCheck, Landmark,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import {
  getAnimalOptions, getAnimals, getApplications, getExtensionWorkers, getFarmer, getFarmerOptions, getHealthRecords,
  getProviders, getRegionOptions, getRiskHistory, getVisits,
} from "@/lib/queries";
import { assessFarmer, createApplication, saveAnimal, saveFarmer, saveHealthRecord, saveVisit } from "@/lib/actions";
import { ageFrom, capitalize, compactETB, formatDate, formatDateTime, formatETB, relativeDays, speciesLabel } from "@/lib/utils";
import { ActionButton, FormDialog } from "@/components/client";
import { AnimalFields, ApplicationFields, FarmerFields, HealthFields, VisitFields } from "@/components/forms";
import { ApplicationBadge, Badge, Card, Detail, Page, RiskBadge, RiskMeter, StatusBadge } from "@/components/ui";

export default async function FarmerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(can.viewFarmers);
  const farmer = await getFarmer(user, id);
  if (!farmer) notFound();

  const r = user.role;
  const [animals, records, visits, apps, risk] = await Promise.all([
    allowed(r, can.viewLivestock) ? getAnimals(user, { farmer: id }) : Promise.resolve([]),
    allowed(r, can.viewHealth) ? getHealthRecords(user, { farmer: id }, 12) : Promise.resolve([]),
    allowed(r, can.viewVisits) ? getVisits(user, { farmer: id }) : Promise.resolve([]),
    allowed(r, can.viewApplications) ? getApplications(user, { farmer: id }) : Promise.resolve([]),
    getRiskHistory(id),
  ]);
  const latest = risk[0];
  const editFarmer = allowed(r, can.editFarmers);

  // Option lists for the quick-add forms (only loaded for editors).
  const [regions, workers, farmerOptions, animalOptions, providers] = editFarmer
    ? await Promise.all([getRegionOptions(), getExtensionWorkers(farmer.region_id), getFarmerOptions(user), getAnimalOptions(user, id),
        allowed(r, can.createApplications) ? getProviders() : Promise.resolve([])])
    : [[], [], [], [], []];
  const formRegions = r === "extension_worker" ? regions.filter((x) => x.id === user.region_id) : regions;

  return (
    <Page>
      <Link href="/dashboard/farmers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Farmers
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{farmer.full_name}</h1>
            <span className="font-mono text-xs text-muted">{farmer.code}</span>
            <RiskBadge score={farmer.risk_score} />
            {farmer.has_insurance && <Badge tone="success"><ShieldCheck className="h-3 w-3" />Insured</Badge>}
            {farmer.active_loans > 0 && <Badge tone="info"><Landmark className="h-3 w-3" />Debt {formatETB(farmer.active_debt_etb)}</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{farmer.kebele}, {farmer.woreda} · {farmer.region_name}</span>
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{farmer.phone}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {allowed(r, can.assessRisk) && <ActionButton action={assessFarmer.bind(null, id)} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Re-assess risk</ActionButton>}
          {editFarmer && (
            <FormDialog action={saveFarmer} title="Edit farmer" triggerClassName="btn-secondary" trigger={<><Pencil className="h-4 w-4" /> Edit</>}>
              <FarmerFields farmer={farmer} regions={formRegions} workers={workers} user={user} />
            </FormDialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card title="Household">
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="Gender">{capitalize(farmer.gender)}</Detail>
              <Detail label="Household size"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-subtle" />{farmer.household_size}</span></Detail>
              <Detail label="Years herding">{farmer.years_herding}</Detail>
              <Detail label="Registered"><span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-subtle" />{formatDate(farmer.registered_at)}</span></Detail>
              <Detail label="Extension worker"><span className="inline-flex items-center gap-1"><UserCheck className="h-3.5 w-3.5 text-subtle" />{farmer.extension_worker_name ?? "Unassigned"}</span></Detail>
              <Detail label="Last visit">{formatDate(farmer.last_visit_date)}</Detail>
            </dl>
            {farmer.notes && <p className="mt-4 rounded-lg bg-surface px-3 py-2.5 text-sm text-muted">{farmer.notes}</p>}
          </Card>

          <Card title="Risk assessment" description={latest ? `Model run ${formatDateTime(latest.assessed_at)} · ${Math.round(latest.confidence * 100)}% confidence` : undefined}>
            {latest ? (
              <>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-muted">Overall risk</div>
                    <div className="text-3xl font-semibold tabular-nums">{latest.overall_risk}<span className="text-base text-subtle">/100</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted">Expected loss</div>
                    <div className="text-sm font-semibold">{formatETB(latest.predicted_loss_etb)}</div>
                    <div className="text-[11px] text-subtle">of {compactETB(latest.herd_value_etb)} herd value</div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <RiskMeter label="Drought (regional NDVI & rainfall)" value={latest.drought_risk} />
                  <RiskMeter label="Disease (herd health records)" value={latest.disease_risk} />
                  <RiskMeter label="Market (herd diversification)" value={latest.market_risk} />
                  <RiskMeter label="Financial (insurance, debt, herd size)" value={latest.financial_risk} />
                </div>
                <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2.5 text-sm text-foreground">{latest.recommendation}</p>
                {risk.length > 1 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <div className="mb-1.5 text-xs font-medium text-muted">History</div>
                    <ul className="space-y-1 text-xs">
                      {risk.slice(0, 5).map((h) => (
                        <li key={h.id} className="flex justify-between"><span className="text-muted">{formatDateTime(h.assessed_at)}</span><span className="font-semibold tabular-nums">{h.overall_risk}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : <p className="text-sm text-muted">Not assessed yet.</p>}
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {allowed(r, can.viewLivestock) && (
            <Card title={`Herd · ${farmer.herd_size} active animals`} bodyClassName="overflow-x-auto"
              actions={allowed(r, can.editLivestock) && (
                <FormDialog action={saveAnimal} title="Register animal" triggerClassName="btn-ghost -my-1 px-2 py-1 text-xs" trigger={<><Plus className="h-3.5 w-3.5" /> Animal</>}>
                  <AnimalFields farmers={farmerOptions} farmerId={id} />
                </FormDialog>
              )}>
              {animals.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">No animals tagged yet.</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="th">Tag</th><th className="th">Animal</th><th className="th">Age / weight</th><th className="th">Status</th><th className="th">Last vaccinated</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {animals.map((a) => (
                      <tr key={a.id} className="hover:bg-card-hover">
                        <td className="td"><Link href={`/dashboard/livestock/${a.id}`} className="font-mono text-xs font-medium text-primary hover:underline">{a.tag_number}</Link></td>
                        <td className="td">{speciesLabel(a.species)} <span className="text-xs text-muted">· {a.breed} · {a.sex}</span></td>
                        <td className="td whitespace-nowrap text-xs text-muted">{ageFrom(a.birth_date)} · {a.weight_kg} kg</td>
                        <td className="td"><StatusBadge status={a.health_status} /></td>
                        <td className="td whitespace-nowrap text-xs text-muted">{formatDate(a.last_vaccination)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}

          {allowed(r, can.viewHealth) && (
            <Card title="Recent health records" bodyClassName="divide-y divide-border"
              actions={<div className="flex items-center gap-2">
                {allowed(r, can.editHealth) && animalOptions.length > 0 && (
                  <FormDialog action={saveHealthRecord} title="New health record" triggerClassName="btn-ghost -my-1 px-2 py-1 text-xs" trigger={<><Plus className="h-3.5 w-3.5" /> Record</>}>
                    <HealthFields animals={animalOptions} />
                  </FormDialog>
                )}
                <Link href={`/dashboard/health-records?q=${encodeURIComponent(farmer.full_name)}`} className="text-xs font-medium text-primary hover:underline">All</Link>
              </div>}>
              {records.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No health records.</p>}
              {records.map((h) => (
                <div key={h.id} className="flex items-start gap-3 px-4 py-3">
                  <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{h.diagnosis}</span>
                      <StatusBadge status={h.severity} />
                    </div>
                    <div className="text-xs text-muted">{capitalize(h.type)} · <Link href={`/dashboard/livestock/${h.animal_id}`} className="font-mono hover:text-primary">{h.tag_number}</Link> · {formatDate(h.record_date)} · {h.recorded_by_name ?? "—"}</div>
                    {h.treatment && <div className="mt-1 text-xs text-foreground/80">{h.treatment}</div>}
                  </div>
                </div>
              ))}
            </Card>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {allowed(r, can.viewVisits) && (
              <Card title="Visits" bodyClassName="divide-y divide-border"
                actions={allowed(r, can.editVisits) && (
                  <FormDialog action={saveVisit} title="Log or schedule visit" triggerClassName="btn-ghost -my-1 px-2 py-1 text-xs" trigger={<><Plus className="h-3.5 w-3.5" /> Visit</>}>
                    <VisitFields farmers={farmerOptions} farmerId={id} workers={workers} user={user} />
                  </FormDialog>
                )}>
                {visits.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No visits yet.</p>}
                {visits.slice(0, 6).map((v) => (
                  <div key={v.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium"><CalendarDays className="h-3.5 w-3.5 text-subtle" />{formatDate(v.visit_date)}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <div className="mt-0.5 text-xs text-muted">{v.purpose} · {v.extension_worker_name ?? "—"}</div>
                    {v.observations && <p className="mt-1 text-xs text-foreground/80">{v.observations}</p>}
                  </div>
                ))}
              </Card>
            )}

            {allowed(r, can.viewApplications) && (
              <Card title="Loans & insurance" bodyClassName="divide-y divide-border"
                actions={allowed(r, can.createApplications) && (
                  <FormDialog action={createApplication} title="New application" description="The farmer's current risk score is attached automatically."
                    triggerClassName="btn-ghost -my-1 px-2 py-1 text-xs" trigger={<><Plus className="h-3.5 w-3.5" /> Apply</>} submitLabel="Submit">
                    <ApplicationFields farmers={farmerOptions} farmerId={id} providers={providers} />
                  </FormDialog>
                )}>
                <div className="grid grid-cols-3 gap-2 bg-surface/60 px-4 py-3 text-center">
                  <div><div className="text-sm font-semibold tabular-nums">{compactETB(farmer.active_debt_etb)}</div><div className="text-[11px] text-muted">Active debt ({farmer.active_loans})</div></div>
                  <div><div className="text-sm font-semibold tabular-nums">{farmer.repaid_loans}</div><div className="text-[11px] text-muted">Loans repaid</div></div>
                  <div><div className="text-sm font-semibold tabular-nums">{compactETB(farmer.insured_amount_etb)}</div><div className="text-[11px] text-muted">Insured cover</div></div>
                </div>
                {apps.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No applications.</p>}
                {apps.map((a) => (
                  <div key={a.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium"><FileText className="h-3.5 w-3.5 text-subtle" />{capitalize(a.type)} · {formatETB(a.amount_etb)}</span>
                      <ApplicationBadge type={a.type} status={a.status} />
                    </div>
                    <div className="mt-0.5 text-xs text-muted">{a.provider} · submitted {relativeDays(a.submitted_at)}{a.completed_at && ` · closed ${formatDate(a.completed_at)}`}</div>
                    {a.decision_notes && <p className="mt-1 text-xs text-foreground/80">{a.decision_notes}</p>}
                  </div>
                ))}
              </Card>
            )}
          </div>

          {!allowed(r, can.viewLivestock) && (
            <Card title="Herd summary">
              <div className="flex items-center gap-3 text-sm"><Tag className="h-4 w-4 text-subtle" />{farmer.herd_size} tagged animals · {farmer.sick_count} currently sick</div>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
