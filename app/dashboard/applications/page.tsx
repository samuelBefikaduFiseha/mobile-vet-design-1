import Link from "next/link";
import { FileText, Plus, Trash2, Gavel, ArrowRight, CheckCheck, AlertTriangle, Landmark } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getApplications, getFarmerOptions, getFilterOptions, getProviders } from "@/lib/queries";
import { completeApplication, createApplication, deleteApplication, reviewApplication } from "@/lib/actions";
import { capitalize, compactETB, formatDate, formatETB, readParams, type SearchParams } from "@/lib/utils";
import { ActionButton, Field, FilterBar, FormDialog } from "@/components/client";
import { ApplicationFields } from "@/components/forms";
import { ApplicationBadge, Badge, EmptyState, Page, PageHeader, RiskBadge, StatCard, TableShell } from "@/components/ui";
import type { Application, SessionUser } from "@/lib/types";

const canActOn = (user: SessionUser, a: Application) =>
  allowed(user.role, can.reviewApplications) && (user.role === "admin" || a.provider === user.organization);

/** Debt the farmer holds *apart from* this application (so an active loan doesn't count itself). */
const otherDebt = (a: Application) =>
  a.farmer_active_debt_etb - (a.type === "loan" && a.status === "approved" ? a.amount_etb : 0);

export default async function ApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser(can.viewApplications);
  const p = await readParams(searchParams);
  const creator = allowed(user.role, can.createApplications);
  const reviewer = allowed(user.role, can.reviewApplications);
  const isBank = user.role === "bank_insurance";
  const [apps, farmers, providers, opts, all] = await Promise.all([
    getApplications(user, p),
    creator ? getFarmerOptions(user) : Promise.resolve([]),
    getProviders(),
    getFilterOptions(user, p),
    reviewer ? getApplications(user) : Promise.resolve([]),
  ]);
  // Full credit history per farmer, shown to the reviewer when deciding.
  const history = new Map<string, Application[]>();
  for (const a of all) history.set(a.farmer_id, [...(history.get(a.farmer_id) ?? []), a]);

  const mine = isBank ? apps.filter((a) => a.provider === user.organization) : apps;
  const open = mine.filter((a) => a.status === "pending" || a.status === "reviewing");
  const active = mine.filter((a) => a.status === "approved");
  const showActions = reviewer || allowed(user.role, can.deleteApplications);

  return (
    <Page>
      <PageHeader title="Loans & insurance" icon={FileText}
        description={isBank
          ? <>All farmer credit and insurance on the platform. You can decide on and close applications to <b>{user.organization}</b>.</>
          : "Credit and insurance across all partner institutions — active debt is visible to everyone"}
        actions={creator && (
          <FormDialog action={createApplication} title="New application" description="The farmer's current risk score and existing debt are shown to the reviewer." submitLabel="Submit"
            trigger={<><Plus className="h-4 w-4" /> New application</>}>
            <ApplicationFields farmers={farmers} providers={providers} />
          </FormDialog>
        )} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={isBank ? "Awaiting your decision" : "Awaiting decision"} value={open.length}
          hint={`${compactETB(open.reduce((s, a) => s + a.amount_etb, 0))} requested`} href="?status=open" />
        <StatCard label={isBank ? "Your active loans / policies" : "Active loans / policies"} value={active.length}
          hint={`${compactETB(active.filter((a) => a.type === "loan").reduce((s, a) => s + a.amount_etb, 0))} outstanding debt`} href="?status=active" />
        <StatCard label="Requests from farmers already in debt" value={open.filter((a) => a.type === "loan" && a.farmer_active_loans > 0).length}
          hint="Check existing obligations before approving" tone="warning" href="?status=open&debt=yes" />
        <StatCard label={isBank ? "Repaid / closed with you" : "Repaid / closed"} value={mine.filter((a) => a.status === "completed").length} href="?status=completed" />
      </div>

      <FilterBar placeholder="Search farmer, code, purpose or institution…" filters={[
        { name: "status", label: "Any status", options: [
          { value: "open", label: "Open (pending + review)" }, { value: "pending", label: "Pending" }, { value: "reviewing", label: "Under review" },
          { value: "active", label: "Active (approved)" }, { value: "completed", label: "Repaid / closed" }, { value: "rejected", label: "Declined" },
        ] },
        { name: "type", label: "Loans & insurance", options: [{ value: "loan", label: "Loans" }, { value: "insurance", label: "Insurance" }] },
        { name: "provider", label: "All institutions", options: [
          ...(isBank ? [{ value: "mine", label: `Only ${user.organization}` }] : []),
          ...providers.map((x) => ({ value: x.organization, label: x.organization })),
        ] },
        { name: "debt", label: "Any debt status", options: [{ value: "yes", label: "Farmer has active debt" }, { value: "no", label: "Farmer debt-free" }] },
        ...(user.role === "extension_worker" ? [] : [{ name: "region", label: "All regions", options: opts.regions, resets: ["farmer"], more: true }]),
        { name: "farmer", label: "All farmers", options: opts.farmers, more: true },
      ]} />

      <TableShell footer={`${apps.length} application${apps.length === 1 ? "" : "s"}`}>
        <thead className="border-b border-border bg-surface/60">
          <tr>
            <th className="th">Farmer</th><th className="th">Request</th><th className="th">Existing debt</th><th className="th">Risk then → now</th>
            <th className="th">Submitted</th><th className="th">Status</th>{showActions && <th className="th text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {apps.map((a) => {
            const debt = otherDebt(a);
            const isOpen = a.status === "pending" || a.status === "reviewing";
            const act = canActOn(user, a);
            const past = (history.get(a.farmer_id) ?? []).filter((h) => h.id !== a.id);
            return (
              <tr key={a.id} className={`hover:bg-card-hover ${isBank && a.provider !== user.organization ? "opacity-75" : ""}`}>
                <td className="td whitespace-nowrap">
                  <Link href={`/dashboard/farmers/${a.farmer_id}`} className="font-medium hover:text-primary">{a.farmer_name}</Link>
                  <div className="text-xs text-muted">{a.region_name} · {a.herd_size} animals</div>
                </td>
                <td className="td min-w-64">
                  <div className="font-medium">{capitalize(a.type)} · {formatETB(a.amount_etb)}</div>
                  <div className="text-xs text-muted">{a.purpose}</div>
                  <div className={`text-[11px] ${a.provider === user.organization ? "font-semibold text-primary" : "text-subtle"}`}>{a.provider}</div>
                  {a.decision_notes && <div className="mt-1 text-xs text-foreground/80">“{a.decision_notes}”</div>}
                </td>
                <td className="td whitespace-nowrap">
                  {debt > 0 ? (
                    <div>
                      <Badge tone={isOpen && a.type === "loan" ? "warning" : "info"}>
                        {isOpen && a.type === "loan" && <AlertTriangle className="h-3 w-3" />}{compactETB(debt)}
                      </Badge>
                      <div className="mt-0.5 text-[11px] text-muted">{a.farmer_active_loans - (a.type === "loan" && a.status === "approved" ? 1 : 0)} other active loan(s)</div>
                    </div>
                  ) : <span className="text-xs text-subtle">None</span>}
                  {a.farmer_repaid_loans > 0 && <div className="mt-0.5 text-[11px] text-success">{a.farmer_repaid_loans} repaid before</div>}
                </td>
                <td className="td whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <RiskBadge score={a.risk_score_at_submission} />
                    <ArrowRight className="h-3 w-3 text-subtle" />
                    <RiskBadge score={a.current_risk} />
                  </div>
                </td>
                <td className="td whitespace-nowrap text-xs text-muted">
                  {formatDate(a.submitted_at)}
                  <div className="text-[11px] text-subtle">{a.submitted_by_name ?? "—"}</div>
                </td>
                <td className="td whitespace-nowrap">
                  <ApplicationBadge type={a.type} status={a.status} />
                  {a.status === "completed" && a.completed_at && <div className="mt-1 text-[11px] text-subtle">{formatDate(a.completed_at)}{a.completed_by_name && ` · ${a.completed_by_name}`}</div>}
                  {a.status !== "completed" && a.reviewed_by_name && <div className="mt-1 text-[11px] text-subtle">{a.reviewed_by_name}, {formatDate(a.reviewed_at)}</div>}
                </td>
                {showActions && (
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      {act && isOpen && (
                        <FormDialog action={reviewApplication} title={`Review: ${a.farmer_name}`} maxWidth="max-w-xl" submitLabel="Save decision"
                          description={`${capitalize(a.type)} of ${formatETB(a.amount_etb)} to ${a.provider} · current risk ${a.current_risk ?? "—"}/100`}
                          triggerClassName="btn-secondary px-2.5 py-1 text-xs" trigger={<><Gavel className="h-3.5 w-3.5" /> Review</>}>
                          <input type="hidden" name="id" value={a.id} />
                          <div className="sm:col-span-2">
                            <div className="label">Farmer&apos;s credit history (all institutions)</div>
                            {past.length === 0 ? <p className="rounded-lg bg-surface px-3 py-2 text-sm text-muted">No previous loans or insurance.</p> : (
                              <ul className="divide-y divide-border rounded-lg border border-border">
                                {past.map((h) => (
                                  <li key={h.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                                    <span className="min-w-0">
                                      <span className="font-medium">{capitalize(h.type)} · {formatETB(h.amount_etb)}</span>
                                      <span className="block truncate text-xs text-muted">{h.provider} · {formatDate(h.submitted_at)}</span>
                                    </span>
                                    <ApplicationBadge type={h.type} status={h.status} />
                                  </li>
                                ))}
                              </ul>
                            )}
                            {debt > 0 && a.type === "loan" && (
                              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                Farmer already owes {formatETB(debt)}. Approving brings total debt to {formatETB(debt + a.amount_etb)}.
                              </p>
                            )}
                          </div>
                          <Field label="Decision" full>
                            <select name="status" defaultValue={a.status === "pending" ? "reviewing" : a.status} className="input">
                              <option value="pending">Pending</option>
                              <option value="reviewing">Under review</option>
                              <option value="approved">Approve</option>
                              <option value="rejected">Decline</option>
                            </select>
                          </Field>
                          <Field label="Notes to farmer / field team" hint="Required when declining." full>
                            <textarea name="decision_notes" rows={3} defaultValue={a.decision_notes} className="input resize-none" />
                          </Field>
                        </FormDialog>
                      )}
                      {act && a.status === "approved" && (
                        <FormDialog action={completeApplication} title={a.type === "loan" ? `Mark loan repaid: ${a.farmer_name}` : `Close policy: ${a.farmer_name}`}
                          description={`${capitalize(a.type)} of ${formatETB(a.amount_etb)} approved ${formatDate(a.reviewed_at)}`} maxWidth="max-w-md"
                          submitLabel={a.type === "loan" ? "Mark as repaid" : "Close policy"}
                          triggerClassName="btn-secondary px-2.5 py-1 text-xs" trigger={<><CheckCheck className="h-3.5 w-3.5" /> {a.type === "loan" ? "Mark repaid" : "Close"}</>}>
                          <input type="hidden" name="id" value={a.id} />
                          <p className="text-sm text-muted sm:col-span-2">
                            {a.type === "loan"
                              ? "This clears the loan from the farmer's active debt and records it as repaid in their credit history. It can't be undone."
                              : "This ends the policy; the farmer will no longer show as insured."}
                          </p>
                          <Field label="Note (optional)" full>
                            <input name="completion_notes" className="input" placeholder={a.type === "loan" ? "e.g. Final instalment received" : "e.g. Policy term ended"} />
                          </Field>
                        </FormDialog>
                      )}
                      {!act && isBank && (isOpen || a.status === "approved") && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-subtle" title="Only the institution that received this application can act on it">
                          <Landmark className="h-3 w-3" /> View only
                        </span>
                      )}
                      {allowed(user.role, can.deleteApplications) && (
                        <ActionButton action={deleteApplication.bind(null, a.id)} className="icon-btn hover:text-danger" title="Delete" danger confirmLabel="Delete"
                          confirm={{ title: "Delete application?", message: <>Delete {a.farmer_name}&apos;s {a.type} application for {formatETB(a.amount_etb)}?</> }}>
                          <Trash2 className="h-4 w-4" />
                        </ActionButton>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </TableShell>
      {apps.length === 0 && <EmptyState icon={FileText} title="No applications match these filters" />}
    </Page>
  );
}
