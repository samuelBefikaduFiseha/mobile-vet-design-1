import { getPublicRegions } from "@/lib/queries";
import { PhotoBackdrop } from "@/components/PhotoBackdrop";
import { sitePhotos } from "@/lib/photo-credits";

const blurbs: Record<string, string> = {
  Borena: "Recurrent severe drought has caused heavy cattle losses. Highest urgency for early warning, water planning and restocking finance.",
  "Afar Zone 1 (Awsi Rasu)": "Arid lowlands along the Awash with large goat and camel herds. Strong need for drought prediction and veterinary traceability.",
  Shabelle: "Riverine and pastoral communities with limited access to finance. Ideal for testing insurance and credit linkage.",
};

const tone = {
  critical: "text-danger bg-danger-soft ring-danger/20",
  high: "text-warning bg-warning-soft ring-warning/20",
  medium: "text-accent bg-accent-soft ring-accent/20",
  low: "text-success bg-success-soft ring-success/20",
} as const;

export async function RegionsSection() {
  const regions = await getPublicRegions();
  const pilots = regions.filter((r) => blurbs[r.name]);

  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-28">
      <PhotoBackdrop photo={sitePhotos.caravan} tone="wash" position="center 70%" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Target regions</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Where we&apos;re piloting</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Priority pilot zones for 2026–2027, with drought conditions and enrolment figures shown live from the platform.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(pilots.length ? pilots : Object.keys(blurbs).map((name) => ({ name, admin_region: "", drought_risk: null, drought_index: null, total_farmers: null, total_animals: null, livelihood: "" }))).map((r) => (
            <div key={r.name} className="card p-6 transition-colors hover:border-border-strong">
              <div className="mb-4 flex items-center justify-between">
                {r.drought_risk ? (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${tone[r.drought_risk]}`}>
                    {r.drought_risk} drought · {r.drought_index}
                  </span>
                ) : <span />}
                <span className="text-xs text-muted">{r.admin_region}</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold">{r.name}</h3>
              <p className="text-sm leading-relaxed text-muted">{blurbs[r.name]}</p>
              {r.total_farmers !== null && (
                <div className="mt-5 flex gap-6 border-t border-border pt-4 text-sm">
                  <div><div className="font-semibold tabular-nums">{r.total_farmers}</div><div className="text-xs text-muted">households</div></div>
                  <div><div className="font-semibold tabular-nums">{r.total_animals}</div><div className="text-xs text-muted">tagged animals</div></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
