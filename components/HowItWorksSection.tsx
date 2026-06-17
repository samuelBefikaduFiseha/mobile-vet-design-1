import { Tag, ScanLine, Brain, ShieldCheck } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Tag,
    title: "Tag & Identify",
    description:
      "Each animal receives a smart RFID-GPS ear tag creating a unique digital profile with ownership and health history.",
  },
  {
    number: "2",
    icon: ScanLine,
    title: "Monitor & Collect",
    description:
      "Satellite data and field reports feed into the platform, tracking environment, health and movement patterns.",
  },
  {
    number: "3",
    icon: Brain,
    title: "Predict & Alert",
    description:
      "ML models identify risks and send early warnings via SMS/USSD to farmers and veterinary professionals.",
  },
  {
    number: "4",
    icon: ShieldCheck,
    title: "Protect & Finance",
    description:
      "Verified records unlock insurance and credit services while preventive action reduces livestock losses.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-transparent to-card/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            From field data to financial inclusion
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            Four simple steps connect satellite signals to actionable advice on a
            Nokia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line for desktop */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
              )}

              <div className="rounded-xl border border-border bg-card p-6 hover:bg-card-hover transition-colors h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-background text-sm font-bold">
                    {step.number}
                  </span>
                  <div className="rounded-lg bg-background p-2">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
