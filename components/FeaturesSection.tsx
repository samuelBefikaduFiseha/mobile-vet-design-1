import { Map, TrendingUp, Tag, MessageSquare, AlertTriangle, Landmark } from "lucide-react";

const platformFeatures = [
  {
    icon: Map,
    title: "Geospatial Intelligence",
    description:
      "Integration of temperature, humidity, rainfall, vegetation and drought indicators using QGIS and satellite analysis.",
  },
  {
    icon: TrendingUp,
    title: "Predictive Analytics",
    description:
      "Machine learning algorithms analyse historical and real-time data to predict disease outbreaks and environmental threats.",
  },
  {
    icon: Tag,
    title: "Smart RFID-GPS Tags",
    description:
      "Digital identity for each animal enabling real-time tracking, ownership verification and complete veterinary traceability.",
  },
  {
    icon: MessageSquare,
    title: "SMS & USSD Alerts",
    description:
      "Timely warnings, vaccination reminders and grazing advisories delivered via basic mobile phones for universal accessibility.",
  },
  {
    icon: AlertTriangle,
    title: "Early Warning System",
    description:
      "Risk assessments and proactive alerts help farmers and vets take preventive action before livestock losses occur.",
  },
  {
    icon: Landmark,
    title: "Financial Inclusion",
    description:
      "Trusted digital records enable banks to provide livestock-collateralised loans and insurers to offer tailored products.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Platform Features
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Built for pastoralist realities
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            Designed for low-connectivity environments without compromising on
            predictive power.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {platformFeatures.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-6 hover:bg-card-hover transition-colors group"
            >
              <div className="mb-4 inline-flex rounded-lg bg-background p-2.5 group-hover:bg-primary/10 transition-colors">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
