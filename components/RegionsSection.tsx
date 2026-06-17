const regions = [
  {
    name: "Borena Zone",
    badge: "High Priority",
    tag: "Pastoralist",
    description:
      "Recently affected by severe drought causing massive livestock losses. High urgency for early warning systems and restocking support.",
    color: "from-orange-500/10 to-red-500/10",
    accent: "text-orange-400",
    border: "border-orange-500/20",
  },
  {
    name: "Afar Region",
    badge: "Arid Climate",
    tag: "Scale Potential",
    description:
      "Arid and semi-arid lands with significant livestock populations. Strong need for drought prediction and veterinary traceability.",
    color: "from-yellow-500/10 to-orange-500/10",
    accent: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  {
    name: "Somali Region",
    badge: "Financial Inclusion",
    tag: "Mobile First",
    description:
      "Large pastoralist communities with limited financial inclusion. Ideal for testing insurance and credit linkage models.",
    color: "from-green-500/10 to-emerald-500/10",
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
  },
];

export function RegionsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Target Regions
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Where we're piloting
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            Strategic pilot regions for initial deployment and community engagement
            (2026–2027).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {regions.map((region) => (
            <div
              key={region.name}
              className={`relative overflow-hidden rounded-xl border bg-card p-6 hover:bg-card-hover transition-colors ${region.border}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${region.color} opacity-50`}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-background/80 border ${region.border} ${region.accent}`}
                  >
                    {region.badge}
                  </span>
                  <span className="text-xs text-muted">{region.tag}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {region.name}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {region.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
