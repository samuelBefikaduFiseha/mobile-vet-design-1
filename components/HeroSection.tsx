import Link from "next/link";
import { ArrowRight, Satellite, Radio, Tag, Home, CloudRain } from "lucide-react";
import { getPublicRegions } from "@/lib/queries";

export async function HeroSection() {
  const regions = (await getPublicRegions()).slice(0, 4);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_85%_0%,var(--primary-soft)_0%,transparent_70%),radial-gradient(50%_50%_at_0%_100%,var(--accent-soft)_0%,transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.15fr_1fr] lg:px-8">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary shadow-sm">
            <Satellite className="h-3.5 w-3.5" />
            Satellite intelligence for pastoral livestock
          </div>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Protecting Ethiopia&apos;s <span className="text-primary">livestock</span>, securing{" "}
            <span className="text-accent">pastoralist futures</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Smart RFID ear tags, field health records, NDVI drought monitoring and SMS/USSD alerts, connected in one
            platform so families, vets, lenders and government can act before disaster strikes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/services" className="btn-primary px-5 py-3">
              Explore the platform <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="btn-secondary px-5 py-3">
              <Radio className="h-4 w-4" /> Partner with us
            </Link>
          </div>
        </div>

        {/* Live snapshot from the platform database */}
        <div className="card relative p-5 shadow-xl shadow-[#17251d]/5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted">Live drought watch</div>
              <div className="text-sm font-semibold">Pilot regions by drought index</div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live
            </span>
          </div>
          {regions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Start the database to see live data.</p>
          ) : (
            <ul className="space-y-3.5">
              {regions.map((r) => (
                <li key={r.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{r.name} <span className="text-xs font-normal text-muted">· {r.admin_region}</span></span>
                    <span className={`text-xs font-semibold capitalize ${r.drought_risk === "critical" ? "text-danger" : r.drought_risk === "high" ? "text-warning" : r.drought_risk === "medium" ? "text-accent" : "text-success"}`}>
                      {r.drought_risk} · {r.drought_index}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface">
                    <div className={`h-full rounded-full ${r.drought_risk === "critical" ? "bg-danger" : r.drought_risk === "high" ? "bg-warning" : r.drought_risk === "medium" ? "bg-accent" : "bg-success"}`} style={{ width: `${r.drought_index}%` }} />
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-subtle">
                    <span className="flex items-center gap-1"><CloudRain className="h-3 w-3" />NDVI {Number(r.ndvi).toFixed(2)}</span>
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{r.total_animals} tagged</span>
                    <span className="flex items-center gap-1"><Home className="h-3 w-3" />{r.total_farmers} households</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
