import { PawPrint, Heart, Target, Globe, Users, Zap } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Pastoralist First",
    description:
      "Every design decision starts with the realities of remote pastoralist life — low connectivity, basic phones, and illiteracy-friendly interfaces.",
  },
  {
    icon: Target,
    title: "Prevention Over Cure",
    description:
      "We believe stopping a disaster before it happens is more valuable than any response after the fact. Early warning saves lives and livelihoods.",
  },
  {
    icon: Globe,
    title: "Open & Accessible",
    description:
      "Open standards, multilingual support, and universal accessibility via SMS/USSD ensure no one is left behind.",
  },
  {
    icon: Users,
    title: "Community Led",
    description:
      "Our pilots are designed with pastoralist communities, not for them. Local knowledge is the foundation of our predictions.",
  },
  {
    icon: Zap,
    title: "Data Driven",
    description:
      "Satellite imagery, machine learning, and verified field data combine to create the most accurate livestock risk platform in East Africa.",
  },
  {
    icon: PawPrint,
    title: "Animal Welfare",
    description:
      "Healthy animals mean healthy communities. Veterinary traceability and disease prevention are at the heart of everything we build.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-[#0f2a12] to-[#1a2e1a]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              About Us
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
              Bridging technology and pastoralism
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">
              Mobile Vet is a technology-driven platform that leverages satellite
              intelligence, smart RFID-GPS ear tags, and SMS/USSD alerts to help
              pastoralist families in Ethiopia protect their animals and
              livelihoods before disaster strikes.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 sm:py-28 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-6">
                Our Mission
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Ethiopia's livestock sector contributes 45% of agricultural GDP
                and supports millions of pastoralists. Yet recurring droughts,
                disease outbreaks, and a lack of digital records put these
                livelihoods at risk every year.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                Mobile Vet was created to bridge the gap between advanced
                geospatial analytics and the realities of remote pastoralist life.
                We believe that every pastoralist family deserves access to the
                same predictive tools that industrial agriculture takes for granted.
              </p>
              <p className="text-muted leading-relaxed">
                By combining satellite intelligence, machine learning, and
                universal mobile technology, we create a digital safety net that
                protects animals, secures livelihoods, and opens doors to financial
                inclusion.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Agricultural GDP</span>
                  <span className="text-lg font-bold text-primary">45%</span>
                </div>
                <div className="h-2 rounded-full bg-background overflow-hidden">
                  <div className="h-full w-[45%] rounded-full bg-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Households Reached</span>
                  <span className="text-lg font-bold text-secondary">3,200+</span>
                </div>
                <div className="h-2 rounded-full bg-background overflow-hidden">
                  <div className="h-full w-[65%] rounded-full bg-secondary" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Animals Tagged</span>
                  <span className="text-lg font-bold text-accent-warm">12,400+</span>
                </div>
                <div className="h-2 rounded-full bg-background overflow-hidden">
                  <div className="h-full w-[80%] rounded-full bg-accent-warm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Pilot Regions</span>
                  <span className="text-lg font-bold text-accent-cool">3</span>
                </div>
                <div className="h-2 rounded-full bg-background overflow-hidden">
                  <div className="h-full w-[30%] rounded-full bg-accent-cool" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Our Values
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              What drives us
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-border bg-card p-6 hover:bg-card-hover transition-colors"
              >
                <div className="mb-4 inline-flex rounded-lg bg-background p-2.5">
                  <value.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
