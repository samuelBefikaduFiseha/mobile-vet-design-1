import { Megaphone, Plus, Trash2, Check, Sun, AlertTriangle, CloudRain, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getAlerts, getRegionOptions } from "@/lib/queries";
import { createAlert, deleteAlert, markAlertRead, markAllAlertsRead } from "@/lib/actions";
import { capitalize, formatDateTime } from "@/lib/utils";
import { ActionButton, Field, FormDialog } from "@/components/client";
import { Badge, EmptyState, Page, PageHeader } from "@/components/ui";

const icon = { drought: Sun, disease: AlertTriangle, weather: CloudRain, system: Megaphone, financial: Wallet };
const tone = { info: "info", warning: "warning", danger: "danger", success: "success" } as const;

export default async function AlertsPage() {
  const user = await requireUser(can.viewAlerts);
  const [alerts, regions] = await Promise.all([getAlerts(user, 200), getRegionOptions()]);
  const manage = allowed(user.role, can.manageAlerts);
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <Page>
      <PageHeader title="Alerts" icon={Megaphone}
        description={user.role === "extension_worker" ? `National alerts and alerts for ${user.region_name}` : "Early warnings broadcast to field teams and partners"}
        actions={<>
          {unread > 0 && <ActionButton action={markAllAlertsRead} className="btn-secondary"><Check className="h-4 w-4" /> Mark all read ({unread})</ActionButton>}
          {manage && (
            <FormDialog action={createAlert} title="Broadcast alert" submitLabel="Broadcast" trigger={<><Plus className="h-4 w-4" /> New alert</>}>
              <Field label="Title" full><input name="title" required maxLength={120} className="input" placeholder="e.g. PPR cases confirmed in Dubti" /></Field>
              <Field label="Message" full><textarea name="message" required rows={3} maxLength={600} className="input resize-none" /></Field>
              <Field label="Type">
                <select name="type" required className="input">{["drought", "disease", "weather", "financial", "system"].map((t) => <option key={t} value={t}>{capitalize(t)}</option>)}</select>
              </Field>
              <Field label="Severity">
                <select name="severity" required defaultValue="warning" className="input">
                  <option value="info">Info</option><option value="warning">Warning</option><option value="danger">Danger</option><option value="success">Good news</option>
                </select>
              </Field>
              <Field label="Region" full>
                <select name="region_id" className="input"><option value="">All regions</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              </Field>
            </FormDialog>
          )}
        </>} />

      <div className="space-y-3">
        {alerts.map((a) => {
          const Icon = icon[a.type];
          return (
            <div key={a.id} className={`card flex gap-4 p-4 ${a.read ? "" : "border-l-4 border-l-primary"}`}>
              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${{ info: "bg-info-soft text-info", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger", success: "bg-success-soft text-success" }[a.severity]}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-sm ${a.read ? "font-medium" : "font-semibold"}`}>{a.title}</h3>
                  <Badge tone={tone[a.severity]}>{a.severity === "success" ? "Good news" : capitalize(a.severity)}</Badge>
                  <Badge>{capitalize(a.type)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{a.message}</p>
                <p className="mt-1.5 text-xs text-subtle">{a.region_name ?? "All regions"} · {formatDateTime(a.created_at)}{a.created_by_name && ` · ${a.created_by_name}`}</p>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                {!a.read && <ActionButton action={markAlertRead.bind(null, a.id)} className="icon-btn" title="Mark as read"><Check className="h-4 w-4" /></ActionButton>}
                {manage && (
                  <ActionButton action={deleteAlert.bind(null, a.id)} className="icon-btn hover:text-danger" title="Delete" danger confirmLabel="Delete"
                    confirm={{ title: "Delete alert?", message: <>Remove “{a.title}” for everyone?</> }}>
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {alerts.length === 0 && <EmptyState icon={Megaphone} title="No alerts" />}
    </Page>
  );
}
