import { requireUser } from "@/lib/auth";
import { getAlerts } from "@/lib/queries";
import { DashboardShell } from "./shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const alerts = await getAlerts(user, 15);
  return (
    <DashboardShell user={user} alerts={alerts}>
      {children}
    </DashboardShell>
  );
}
