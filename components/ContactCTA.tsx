import Link from "next/link";
import { ArrowRight, Mail, Phone, MapPin, Clock } from "lucide-react";

export function ContactCTA() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-card/20 to-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Get In Touch
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Partner with us
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              Whether you&apos;re a government agency, NGO, insurer or veterinary
              clinic, we&apos;d love to explore how Mobile Vet can work for your
              communities.
            </p>

            <div className="mt-6 text-sm text-muted">
              <p className="mb-2">
                We respond within two business days. Pilot partnerships open for
                Borena, Afar and the Somali Region in 2026 — 2027.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-6 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              Start the conversation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted">partnerships@mobilevet.et</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted">+251 996 995 878</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted">Addis Ababa, Ethiopia</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted">
                  Mon — Fri · 8:00 AM — 5:00 PM EAT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
