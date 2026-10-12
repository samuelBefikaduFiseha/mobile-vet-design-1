import { CloudRain, Bug, Fingerprint, Banknote } from "lucide-react";

const challenges = [
  {
    icon: CloudRain,
    title: "Recurring Droughts",
    description:
      "Climate change and erratic rainfall patterns cause massive livestock deaths and displacement, as seen recently in Borena.",
    accent: "text-accent-warm",
  },
  {
    icon: Bug,
    title: "Disease Outbreaks",
    description:
      "Limited veterinary access and poor traceability allow diseases to spread rapidly through herds with devastating economic impact.",
    accent: "text-red-700",
  },
  {
    icon: Fingerprint,
    title: "No Digital Identity",
    description:
      "Animals lack reliable identification and health records, preventing farmers from accessing insurance and financial services.",
    accent: "text-accent-cool",
  },
  {
    icon: Banknote,
    title: "Financial Exclusion",
    description:
      "Banks and insurers cannot assess livestock value or risk, leaving pastoralists without collateral-based loans or insurance.",
    accent: "text-yellow-700",
  },
];

export function ChallengeSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            The Challenge
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Ethiopia&apos;s livestock sector faces critical threats
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            Recurring droughts, disease outbreaks and a lack of digital records put
            millions of pastoralist livelihoods at risk every year.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {challenges.map((item) => (
            <div
              key={item.title}
              className="group rounded-xl border border-border bg-card p-6 hover:bg-card-hover transition-colors"
            >
              <div className="mb-4 inline-flex rounded-lg bg-background p-2.5">
                <item.icon className={`h-5 w-5 ${item.accent}`} />
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
