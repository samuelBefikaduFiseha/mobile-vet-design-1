import Link from "next/link";
import { CalendarDays, Plus, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getExtensionWorkers, getFarmerOptions, getFilterOptions, getVisits } from "@/lib/queries";
import { deleteVisit, saveVisit } from "@/lib/actions";
import { formatDate, isoDaysFromToday, readParams, relativeDays, todayISO, toOptions, type SearchParams } from "@/lib/utils";
import { ActionButton, FilterBar, FormDialog } from "@/components/client";
import { VisitFields } from "@/components/forms";
import { PhotoGallery } from "@/components/photos";
import { EmptyState, Page, PageHeader, StatCard, StatusBadge, TableShell } from "@/components/ui";

export default async function VisitsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser(can.viewVisits);
  const p = await readParams(searchParams);
  const editable = allowed(user.role, can.editVisits);
  const scoped = user.role === "extension_worker";
  const [visits, farmers, workers, opts] = await Promise.all([
    getVisits(user, p),
    editable ? getFarmerOptions(user) : Promise.resolve([]),
    editable ? getExtensionWorkers(scoped ? user.region_id : null) : Promise.resolve([]),
    getFilterOptions(user, p),
  ]);
  const today = todayISO();
  const scheduled = visits.filter((v) => v.status === "scheduled");

  return (
    <Page>
      <PageHeader title="Field visits" icon={CalendarDays}
        description={editable ? "Schedule and log extension worker visits to households" : "Extension worker visits to households (read-only)"}
        actions={editable && (
          <FormDialog action={saveVisit} title="Log or schedule a visit" trigger={<><Plus className="h-4 w-4" /> New visit</>}>
            <VisitFields farmers={farmers} workers={workers} user={user} />
          </FormDialog>
        )} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Scheduled" value={scheduled.length} />
        <StatCard label="Next 7 days" value={scheduled.filter((v) => v.visit_date >= today && v.visit_date <= isoDaysFromToday(7)).length} />
        <StatCard label="Overdue" value={scheduled.filter((v) => v.visit_date < today).length} />
        <StatCard label="Completed" value={visits.filter((v) => v.status === "completed").length} />
      </div>

      <FilterBar placeholder="Search farmer, purpose, observations or kebele…" filters={[
        ...(scoped ? [] : [{ name: "region", label: "All regions", options: opts.regions, resets: ["woreda", "kebele", "farmer", "worker"] }]),
        { name: "farmer", label: "All farmers", options: opts.farmers },
        { name: "status", label: "Any status", options: toOptions(["scheduled", "completed", "cancelled"]) },
        { name: "when", label: "Any time", options: [{ value: "week", label: "Due in next 7 days" }, { value: "overdue", label: "Overdue" }] },
        { name: "woreda", label: "All woredas", options: opts.woredas, resets: ["kebele", "farmer"], more: true },
        { name: "kebele", label: "All kebeles", options: opts.kebeles, more: true },
        { name: "worker", label: "Any extension worker", options: opts.workers, more: true },
        ...(scoped ? [{ name: "mine", label: "All workers' visits", options: [{ value: "1", label: "Only my visits" }], more: true }] : []),
        { name: "from", label: "From", type: "date" as const, more: true },
        { name: "to", label: "To", type: "date" as const, more: true },
      ]} />

      <TableShell footer={`${visits.length} visit${visits.length === 1 ? "" : "s"}`}>
        <thead className="border-b border-border bg-surface/60">
          <tr>
            <th className="th">Date</th><th className="th">Farmer</th><th className="th">Purpose & notes</th><th className="th">Worker</th><th className="th">Status</th>
            {editable && <th className="th text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {visits.map((v) => (
            <tr key={v.id} className="hover:bg-card-hover">
              <td className="td whitespace-nowrap">
                <div className="font-medium">{formatDate(v.visit_date)}</div>
                <div className={`text-xs ${v.status === "scheduled" && v.visit_date < today ? "font-medium text-danger" : "text-muted"}`}>{relativeDays(v.visit_date)}</div>
              </td>
              <td className="td whitespace-nowrap">
                <Link href={`/dashboard/farmers/${v.farmer_id}`} className="font-medium hover:text-primary">{v.farmer_name}</Link>
                <div className="text-xs text-muted">{v.kebele} · {v.region_name}</div>
              </td>
              <td className="td min-w-72">
                <div className="font-medium">{v.purpose}</div>
                {v.observations && <div className="mt-0.5 text-xs text-muted">{v.observations}</div>}
                {v.recommendations && <div className="mt-0.5 text-xs text-foreground/80"><span className="font-medium">→</span> {v.recommendations}</div>}
                {v.photo_ids.length > 0 && <div className="mt-1.5"><PhotoGallery ids={v.photo_ids} size="sm" canDelete={editable} /></div>}
              </td>
              <td className="td whitespace-nowrap text-xs text-muted">{v.extension_worker_name ?? "—"}</td>
              <td className="td"><StatusBadge status={v.status} /></td>
              {editable && (
                <td className="td">
                  <div className="flex justify-end gap-1">
                    <FormDialog action={saveVisit} title={v.status === "scheduled" ? "Update visit" : "Edit visit"} triggerClassName="icon-btn" triggerTitle="Edit" trigger={<Pencil className="h-4 w-4" />}>
                      <VisitFields visit={v} farmers={farmers} workers={workers} user={user} />
                    </FormDialog>
                    <ActionButton action={deleteVisit.bind(null, v.id)} className="icon-btn hover:text-danger" title="Delete" danger confirmLabel="Delete"
                      confirm={{ title: "Delete visit?", message: <>Delete the visit to <b>{v.farmer_name}</b> on {formatDate(v.visit_date)}?</> }}>
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </TableShell>
      {visits.length === 0 && <EmptyState icon={CalendarDays} title="No visits match these filters" />}
    </Page>
  );
}
