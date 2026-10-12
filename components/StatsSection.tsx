import { Tag, Home, MapPin, Activity, Stethoscope, Users } from "lucide-react";
import { getPublicStats } from "@/lib/queries";

export async function StatsSection() {
  const live = await getPublicStats();
  const stats = [
    { icon: Tag, value: live ? live.animals.toLocaleString() : "—", label: "Animals tagged (pilot)" },
    { icon: Home, value: live ? live.farmers.toLocaleString() : "—", label: "Households registered" },
    { icon: MapPin, value: live ? String(live.regions) : "—", label: "Pastoral zones covered" },
    { icon: Stethoscope, value: live ? live.records.toLocaleString() : "—", label: "Health records logged" },
    { icon: Users, value: live ? String(live.workers) : "—", label: "Field extension workers" },
    { icon: Activity, value: "45%", label: "Agricultural GDP from livestock" },
  ];

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2 text-center">
              <s.icon className="h-5 w-5 text-primary" />
              <div className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{s.value}</div>
              <div className="text-xs leading-tight text-muted">{s.label}</div>
            </div>
          ))}
        </div>
        {live && <p className="mt-6 text-center text-[11px] text-subtle">Platform figures are live from the Mobile Vet database.</p>}
      </div>
    </section>
  );
}
