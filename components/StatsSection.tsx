import { Tag, Home, MapPin, Activity, TrendingUp, Users } from "lucide-react";

const stats = [
  { icon: Tag, value: "12,400+", label: "Animals tagged" },
  { icon: Home, value: "3,200+", label: "Households reached" },
  { icon: MapPin, value: "3", label: "Pilot regions" },
  { icon: Activity, value: "45%", label: "Agricultural GDP from Livestock" },
  { icon: TrendingUp, value: "100%", label: "Digital Traceability Per Animal" },
  { icon: Users, value: "Millions", label: "Pastoralists Dependent on Herds" },
];

export function StatsSection() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center gap-2"
            >
              <stat.icon className="h-5 w-5 text-primary/80" />
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-xs text-muted leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
