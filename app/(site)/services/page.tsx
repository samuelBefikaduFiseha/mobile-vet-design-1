import {
  Map,
  TrendingUp,
  Tag,
  MessageSquare,
  AlertTriangle,
  Landmark,
  Satellite,
  Brain,
  Smartphone,
  Globe,
  Radio,
} from "lucide-react";

const serviceCategories = [
  {
    title: "Geospatial Intelligence",
    icon: Map,
    description:
      "Integration of temperature, humidity, rainfall, vegetation and drought indicators using QGIS and satellite analysis.",
    features: [
      "Satellite imagery processing (Sentinel, MODIS, Landsat)",
      "QGIS-based geospatial dashboards",
      "NDVI vegetation health monitoring",
      "Drought index tracking (SPI, VCI)",
      "Rainfall anomaly detection",
      "Temperature and humidity trend analysis",
    ],
  },
  {
    title: "Predictive Analytics",
    icon: TrendingUp,
    description:
      "Machine learning algorithms analyse historical and real-time data to predict disease outbreaks and environmental threats.",
    features: [
      "Disease outbreak prediction models",
      "Environmental risk scoring",
      "Historical pattern analysis",
      "Real-time data ingestion pipelines",
      "Risk heatmaps and visualisations",
      "Automated model retraining",
    ],
  },
  {
    title: "Smart RFID-GPS Tags",
    icon: Tag,
    description:
      "Digital identity for each animal enabling real-time tracking, ownership verification and complete veterinary traceability.",
    features: [
      "Unique digital ID per animal",
      "GPS location tracking and geofencing",
      "Ownership verification",
      "Movement pattern analysis",
      "Health history logging",
      "Tamper-resistant hardware design",
    ],
  },
  {
    title: "SMS & USSD Alerts",
    icon: MessageSquare,
    description:
      "Timely warnings, vaccination reminders and grazing advisories delivered via basic mobile phones for universal accessibility.",
    features: [
      "SMS alerts in Amharic, English, and local languages",
      "USSD menu systems for feature phones",
      "Voice message alerts for non-readers",
      "Customisable alert thresholds",
      "Two-way communication (report back)",
      "Offline queue and retry logic",
    ],
  },
  {
    title: "Early Warning System",
    icon: AlertTriangle,
    description:
      "Risk assessments and proactive alerts help farmers and vets take preventive action before livestock losses occur.",
    features: [
      "Multi-source risk aggregation",
      "Automated alert escalation",
      "Vaccination schedule reminders",
      "Grazing advisory push notifications",
      "Drought early warning triggers",
      "Veterinary dispatch coordination",
    ],
  },
  {
    title: "Financial Inclusion",
    icon: Landmark,
    description:
      "Trusted digital records enable banks to provide livestock-collateralised loans and insurers to offer tailored products.",
    features: [
      "Verified livestock ownership records",
      "Animal health certificates",
      "Livestock valuation engine",
      "Insurance premium calculation",
      "Loan collateral documentation",
      "Bank API integration ready",
    ],
  },
];

const techStack = [
  { icon: Satellite, label: "Satellite & QGIS" },
  { icon: Brain, label: "Machine Learning" },
  { icon: Smartphone, label: "SMS / USSD / Voice" },
  { icon: Globe, label: "Multilingual" },
  { icon: Tag, label: "RFID-GPS Smart Tags" },
  { icon: Radio, label: "Real-time Monitoring" },
];

export default function ServicesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_85%_0%,var(--primary-soft)_0%,transparent_70%),radial-gradient(50%_50%_at_0%_100%,var(--accent-soft)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Services
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
              A complete digital ecosystem for livestock management
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">
              Mobile Vet integrates geospatial intelligence, predictive analytics
              and digital traceability — designed for the realities of remote
              pastoralist life.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center text-center gap-2"
              >
                <item.icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {serviceCategories.map((service) => (
              <div
                key={service.title}
                className="rounded-xl border border-border bg-card p-6 sm:p-8 hover:bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-lg bg-background p-2.5">
                    <service.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {service.title}
                  </h3>
                </div>
                <p className="text-sm text-muted leading-relaxed mb-5">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
