import { Shield, Plus, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getRegionOptions, getUsers } from "@/lib/queries";
import { saveUser } from "@/lib/actions";
import { formatDateTime, getRoleLabel, initials } from "@/lib/utils";
import { FormDialog } from "@/components/client";
import { UserFields } from "@/components/forms";
import { Badge, Page, PageHeader, StatCard, StatusBadge, TableShell } from "@/components/ui";

const roleTone = { extension_worker: "primary", bank_insurance: "info", admin: "accent", government: "neutral" } as const;

export default async function UsersPage() {
  const me = await requireUser(can.manageUsers);
  const [users, regions] = await Promise.all([getUsers(), getRegionOptions()]);

  return (
    <Page>
      <PageHeader title="Users" icon={Shield} description="Platform accounts, roles and regional assignments"
        actions={
          <FormDialog action={saveUser} title="Add user" submitLabel="Create user" trigger={<><Plus className="h-4 w-4" /> Add user</>}>
            <UserFields regions={regions} />
          </FormDialog>
        } />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active accounts" value={users.filter((u) => u.status === "active").length} />
        <StatCard label="Awaiting approval" value={users.filter((u) => u.status === "pending").length} />
        <StatCard label="Extension workers" value={users.filter((u) => u.role === "extension_worker").length} />
        <StatCard label="Partner institutions" value={new Set(users.filter((u) => u.role === "bank_insurance").map((u) => u.organization)).size} />
      </div>

      <TableShell footer={`${users.length} users`}>
        <thead className="border-b border-border bg-surface/60">
          <tr><th className="th">User</th><th className="th">Role</th><th className="th">Organisation / region</th><th className="th">Farmers</th><th className="th">Status</th><th className="th">Last login</th><th className="th text-right">Edit</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-card-hover">
              <td className="td">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{initials(u.name)}</span>
                  <div className="min-w-0">
                    <div className="font-medium">{u.name}{u.id === me.id && <span className="ml-1 text-xs text-muted">(you)</span>}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </div>
                </div>
              </td>
              <td className="td"><Badge tone={roleTone[u.role]}>{getRoleLabel(u.role)}</Badge></td>
              <td className="td">
                <div className="text-sm">{u.organization}</div>
                {u.region_name && <div className="text-xs text-muted">{u.region_name}</div>}
              </td>
              <td className="td tabular-nums">{u.role === "extension_worker" ? u.farmer_count : <span className="text-subtle">—</span>}</td>
              <td className="td"><StatusBadge status={u.status} /></td>
              <td className="td whitespace-nowrap text-xs text-muted">{u.last_login_at ? formatDateTime(u.last_login_at) : "Never"}</td>
              <td className="td text-right">
                <FormDialog action={saveUser} title={`Edit ${u.name}`} triggerClassName="icon-btn" triggerTitle="Edit" trigger={<Pencil className="h-4 w-4" />}>
                  <UserFields u={u} regions={regions} />
                </FormDialog>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Page>
  );
}
