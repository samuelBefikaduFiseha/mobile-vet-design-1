import Link from "next/link";
import { Users, Plus, Phone, MapPin, Pencil, Trash2, ShieldCheck, Landmark } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getExtensionWorkers, getFarmers, getFilterOptions, getRegionOptions } from "@/lib/queries";
import { deleteFarmer, saveFarmer } from "@/lib/actions";
import { compactETB, formatDate, readParams, toOptions, type SearchParams } from "@/lib/utils";
import { ActionButton, FilterBar, FormDialog } from "@/components/client";
import { FarmerFields } from "@/components/forms";
import { Avatar, Badge, EmptyState, Page, PageHeader, RiskBadge, StatCard, TableShell } from "@/components/ui";

export default async function FarmersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser(can.viewFarmers);
  const p = await readParams(searchParams);
  const [farmers, regions, workers, opts] = await Promise.all([
    getFarmers(user, p), getRegionOptions(), getExtensionWorkers(user.role === "extension_worker" ? user.region_id : null),
    getFilterOptions(user, p),
  ]);
  const scoped = user.role === "extension_worker";
  const editable = allowed(user.role, can.editFarmers);
  const formRegions = user.role === "extension_worker" ? regions.filter((r) => r.id === user.region_id) : regions;

  return (
    <Page>
      <PageHeader title="Farmers" icon={Users}
        description={user.role === "extension_worker" ? `Pastoralist households in ${user.region_name}` : "Pastoralist households registered on the platform"}
        actions={editable && (
          <FormDialog action={saveFarmer} title="Register farmer" description="The household is risk-scored as soon as it's saved."
            submitLabel="Register" trigger={<><Plus className="h-4 w-4" /> Register farmer</>}>
            <FarmerFields regions={formRegions} workers={workers} user={user} />
          </FormDialog>
        )} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Households" value={farmers.length} />
        <StatCard label="High / critical risk" value={farmers.filter((f) => f.risk_level === "high" || f.risk_level === "critical").length} />
        <StatCard label="Insured" value={farmers.filter((f) => f.has_insurance).length} />
        <StatCard label="In debt" value={farmers.filter((f) => f.active_loans > 0).length}
          hint={`${compactETB(farmers.reduce((s, f) => s + f.active_debt_etb, 0))} outstanding`} />
      </div>

      <FilterBar placeholder="Search name, code, phone, woreda, kebele…" filters={[
        ...(scoped ? [] : [{ name: "region", label: "All regions", options: opts.regions, resets: ["woreda", "kebele", "worker"] }]),
        { name: "woreda", label: "All woredas", options: opts.woredas, resets: ["kebele"] },
        { name: "risk", label: "Any risk", options: toOptions(["critical", "high", "medium", "low"]) },
        { name: "credit", label: "Any credit status", options: [
          { value: "debt", label: "Has active loan (debt)" }, { value: "repeat", label: "In debt & requesting more" },
          { value: "insured", label: "Insured" }, { value: "repaid", label: "Has repaid a loan" }, { value: "none", label: "No loan or insurance" },
        ] },
        { name: "kebele", label: "All kebeles", options: opts.kebeles, more: true },
        { name: "worker", label: "Any extension worker", more: true, options: [
          ...(scoped ? [{ value: "me", label: "Assigned to me" }] : []), { value: "none", label: "Unassigned" }, ...opts.workers,
        ] },
        { name: "gender", label: "Any gender", options: toOptions(["female", "male"]), more: true },
        { name: "health", label: "Any herd health", more: true, options: [
          { value: "sick", label: "Has sick animals" }, { value: "unvisited", label: "Not visited in 90 days" },
        ] },
        { name: "sort", label: "Sort: highest risk", more: true, options: [
          { value: "name", label: "Sort: name" }, { value: "herd", label: "Sort: largest herd" }, { value: "debt", label: "Sort: most debt" },
          { value: "newest", label: "Sort: newest" }, { value: "visit", label: "Sort: longest since visit" },
        ] },
      ]} />

      <TableShell footer={`${farmers.length} farmer${farmers.length === 1 ? "" : "s"}`}>
        <thead className="border-b border-border bg-surface/60">
          <tr>
            <th className="th">Farmer</th><th className="th">Location</th><th className="th">Herd</th>
            <th className="th">Risk</th><th className="th">Credit & cover</th><th className="th">Last visit</th>
            {editable && <th className="th text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {farmers.map((f) => (
            <tr key={f.id} className="hover:bg-card-hover">
              <td className="td">
                <div className="flex items-center gap-3">
                  <Avatar photoId={f.photo_id} name={f.full_name} />
                  <div>
                    <Link href={`/dashboard/farmers/${f.id}`} className="font-medium text-foreground hover:text-primary">{f.full_name}</Link>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted"><span className="font-mono">{f.code}</span> · <Phone className="h-3 w-3" />{f.phone}</div>
                  </div>
                </div>
              </td>
              <td className="td">
                <div className="flex items-center gap-1 text-sm"><MapPin className="h-3.5 w-3.5 text-subtle" />{f.woreda}, {f.kebele}</div>
                <div className="text-xs text-muted">{f.region_name}</div>
              </td>
              <td className="td whitespace-nowrap">
                <span className="font-medium tabular-nums">{f.herd_size}</span> <span className="text-xs text-muted">animals</span>
                {f.sick_count > 0 && <div className="text-xs font-medium text-danger">{f.sick_count} sick</div>}
              </td>
              <td className="td"><RiskBadge score={f.risk_score} /></td>
              <td className="td">
                <div className="flex flex-wrap gap-1">
                  {f.has_insurance && <Badge tone="success"><ShieldCheck className="h-3 w-3" />Insured</Badge>}
                  {f.active_loans > 0 && <Badge tone="info"><Landmark className="h-3 w-3" />Debt {compactETB(f.active_debt_etb)}</Badge>}
                  {f.active_loans > 0 && f.open_requests > 0 && <Badge tone="warning">+ new request</Badge>}
                  {f.repaid_loans > 0 && <Badge tone="neutral">{f.repaid_loans} repaid</Badge>}
                  {!f.has_insurance && !f.active_loans && !f.repaid_loans && <span className="text-xs text-subtle">None</span>}
                </div>
              </td>
              <td className="td whitespace-nowrap text-xs text-muted">{formatDate(f.last_visit_date)}</td>
              {editable && (
                <td className="td">
                  <div className="flex justify-end gap-1">
                    <FormDialog action={saveFarmer} title={`Edit ${f.full_name}`} triggerClassName="icon-btn" triggerTitle="Edit" trigger={<Pencil className="h-4 w-4" />}>
                      <FarmerFields farmer={f} regions={formRegions} workers={workers} user={user} />
                    </FormDialog>
                    <ActionButton action={deleteFarmer.bind(null, f.id)} className="icon-btn hover:text-danger" title="Delete" danger confirmLabel="Delete"
                      confirm={{ title: "Delete farmer?", message: <>This permanently removes <b>{f.full_name}</b> and their {f.herd_size} animals, health records, visits and applications.</> }}>
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </TableShell>
      {farmers.length === 0 && <EmptyState icon={Users} title="No farmers match these filters" />}
    </Page>
  );
}
