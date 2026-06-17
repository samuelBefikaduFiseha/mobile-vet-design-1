import Link from "next/link";
import { ArrowRight, Satellite, Shield, Radio } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-[#0f2a12] to-[#1a2e1a]" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--primary)_0%,_transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-primary mb-6">
            <Satellite className="h-3.5 w-3.5" />
            <span>Satellite Intelligence for Livestock</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            Protecting Ethiopia's{" "}
            <span className="text-primary">livestock</span>, securing{" "}
            <span className="text-primary">pastoralist futures</span>.
          </h1>

          <p className="text-lg sm:text-xl text-muted leading-relaxed mb-8 max-w-2xl">
            Satellite intelligence, smart RFID-GPS ear tags and SMS/USSD alerts
            that help pastoralist families protect their animals and livelihoods
            — before disaster strikes.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-background hover:bg-primary-hover transition-colors"
            >
              <Shield className="h-4 w-4" />
              Explore the platform
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-card-hover transition-colors"
            >
              <Radio className="h-4 w-4" />
              Partner with us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
