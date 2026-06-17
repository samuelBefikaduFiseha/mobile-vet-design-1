import Link from "next/link";
import { ArrowRight, ScanLine, Satellite, Brain, Smartphone, FileCheck, Globe } from "lucide-react";

const features = [
  "Real-time livestock identification and movement tracking",
  "Satellite-based drought and vegetation monitoring",
  "ML-powered disease outbreak prediction",
  "SMS/USSD alerts for basic mobile phones",
  "Verified digital records for banks and insurers",
  "QGIS geospatial analysis integration",
];

export function SolutionSection() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-card/20 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Our Solution
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              A complete digital ecosystem for livestock management
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              Mobile Vet integrates geospatial intelligence, predictive analytics
              and digital traceability — designed for the realities of remote
              pastoralist life.
            </p>

            <ul className="mt-8 space-y-3">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/services"
              className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              See features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative rounded-2xl border border-border bg-card p-8 sm:p-10">
              <div className="absolute -top-3 -right-3 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
              <div className="absolute -bottom-3 -left-3 h-20 w-20 rounded-full bg-secondary/10 blur-2xl" />

              <div className="relative space-y-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-background p-3 border border-border">
                    <ScanLine className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Smart RFID-GPS Tags</div>
                    <div className="text-xs text-muted">Digital identity for every animal</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-background p-3 border border-border">
                    <Satellite className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Satellite Monitoring</div>
                    <div className="text-xs text-muted">Real-time vegetation & drought data</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-background p-3 border border-border">
                    <Brain className="h-6 w-6 text-accent-warm" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">ML Predictions</div>
                    <div className="text-xs text-muted">Disease outbreak forecasting</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-background p-3 border border-border">
                    <Smartphone className="h-6 w-6 text-accent-cool" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">SMS & USSD Alerts</div>
                    <div className="text-xs text-muted">Works on any basic mobile phone</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-background p-3 border border-border">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Verified Records</div>
                    <div className="text-xs text-muted">Bank & insurance ready data</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-background p-3 border border-border">
                    <Globe className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">QGIS Integration</div>
                    <div className="text-xs text-muted">Geospatial analysis & mapping</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
