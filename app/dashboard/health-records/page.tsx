import Link from "next/link";
import { HeartPulse, Plus, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getAnimalOptions, getFilterOptions, getHealthRecords } from "@/lib/queries";
import { deleteHealthRecord, saveHealthRecord } from "@/lib/actions";
import { capitalize, formatDate, isoDaysFromToday, readParams, relativeDays, speciesLabel, todayISO, toOptions, type SearchParams } from "@/lib/utils";
import { ActionButton, FilterBar, FormDialog } from "@/components/client";
import { HealthFields } from "@/components/forms";
import { Badge, EmptyState, Page, PageHeader, StatCard, StatusBadge, TableShell } from "@/components/ui";

export default async function HealthRecordsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser(can.viewHealth);
  const p = await readParams(searchParams);
  const editable = allowed(user.role, can.editHealth);
  const [records, animals, opts] = await Promise.all([getHealthRecords(user, p), editable ? getAnimalOptions(user) : Promise.resolve([]), getFilterOptions(user, p)]);
  const today = todayISO();
  const recent = records.filter((r) => r.record_date >= isoDaysFromToday(-30));

  return (
    <Page>
      <PageHeader title="Health records" icon={HeartPulse} description="Vaccinations, treatments and disease cases logged in the field"
        actions={editable && (
          <FormDialog action={saveHealthRecord} title="New health record" trigger={<><Plus className="h-4 w-4" /> New record</>}>
            <HealthFields animals={animals} />
          </FormDialog>
        )} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Records shown" value={records.length} />
        <StatCard label="Logged in last 30 days" value={recent.length} />
        <StatCard label="High / emergency" value={records.filter((r) => r.severity === "high" || r.severity === "emergency").length} />
        <StatCard label="Follow-ups due (7 days)" value={records.filter((r) => r.follow_up_date && r.follow_up_date <= isoDaysFromToday(7) && r.animal_status === "sick").length}
          hint={<Link href="?followup=due" className="text-primary hover:underline">Show follow-ups</Link>} />
      </div>

      <FilterBar placeholder="Search tag, diagnosis, symptoms, treatment or owner…" filters={[
        ...(user.role === "extension_worker" ? [] : [{ name: "region", label: "All regions", options: opts.regions, resets: ["woreda", "farmer", "animal"] }]),
        { name: "farmer", label: "All farmers", options: opts.farmers, resets: ["animal"] },
        { name: "animal", label: "All of this farmer's animals", options: opts.animals },
        { name: "type", label: "All types", options: toOptions(["disease", "treatment", "vaccination", "deworming", "checkup", "injury"]) },
        { name: "severity", label: "Any severity", options: toOptions(["emergency", "high", "moderate", "low"]) },
        { name: "woreda", label: "All woredas", options: opts.woredas, resets: ["farmer", "animal"], more: true },
        { name: "species", label: "All species", options: toOptions(["cattle", "goat", "sheep", "camel", "donkey"], speciesLabel), more: true },
        { name: "recorder", label: "Recorded by anyone", options: opts.workers, more: true },
        { name: "followup", label: "All records", options: [{ value: "due", label: "Follow-up due (sick)" }], more: true },
        { name: "from", label: "From", type: "date", more: true },
        { name: "to", label: "To", type: "date", more: true },
      ]} />

      <TableShell footer={`${records.length} record${records.length === 1 ? "" : "s"}`}>
        <thead className="border-b border-border bg-surface/60">
          <tr>
            <th className="th">Date</th><th className="th">Animal</th><th className="th">Record</th><th className="th">Treatment</th>
            <th className="th">Severity</th><th className="th">Follow-up</th>{editable && <th className="th text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {records.map((h) => (
            <tr key={h.id} className="hover:bg-card-hover">
              <td className="td whitespace-nowrap text-xs text-muted">{formatDate(h.record_date)}<div className="text-[11px] text-subtle">{h.recorded_by_name}</div></td>
              <td className="td whitespace-nowrap">
                <Link href={`/dashboard/livestock/${h.animal_id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{h.tag_number}</Link>
                <div className="text-xs text-muted"><Link href={`/dashboard/farmers/${h.farmer_id}`} className="hover:text-primary">{h.farmer_name}</Link> · {h.species}</div>
              </td>
              <td className="td min-w-56">
                <div className="font-medium">{h.diagnosis}</div>
                <div className="text-xs text-muted">{capitalize(h.type)}{h.symptoms && ` · ${h.symptoms}`}</div>
              </td>
              <td className="td max-w-64 text-xs text-muted">{h.treatment}</td>
              <td className="td"><StatusBadge status={h.severity} /></td>
              <td className="td whitespace-nowrap">
                {h.follow_up_date ? (
                  h.animal_status === "sick"
                    ? <Badge tone={h.follow_up_date < today ? "danger" : "warning"}>{h.follow_up_date < today ? "Overdue" : "Due"} {relativeDays(h.follow_up_date)}</Badge>
                    : <span className="text-xs text-muted">{formatDate(h.follow_up_date)}</span>
                ) : <span className="text-xs text-subtle">—</span>}
              </td>
              {editable && (
                <td className="td">
                  <div className="flex justify-end gap-1">
                    <FormDialog action={saveHealthRecord} title="Edit health record" triggerClassName="icon-btn" triggerTitle="Edit" trigger={<Pencil className="h-4 w-4" />}>
                      <HealthFields record={h} animals={animals} />
                    </FormDialog>
                    <ActionButton action={deleteHealthRecord.bind(null, h.id)} className="icon-btn hover:text-danger" title="Delete" danger confirmLabel="Delete"
                      confirm={{ title: "Delete health record?", message: <>Delete the {h.type} record for <b>{h.tag_number}</b> on {formatDate(h.record_date)}?</> }}>
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </TableShell>
      {records.length === 0 && <EmptyState icon={HeartPulse} title="No health records match these filters" />}
    </Page>
  );
}
