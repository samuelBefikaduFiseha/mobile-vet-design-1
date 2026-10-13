import {
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { PhotoBackdrop } from "@/components/PhotoBackdrop";
import { sitePhotos } from "@/lib/photo-credits";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden py-20 sm:py-28">
        <PhotoBackdrop photo={sitePhotos.camels} priority position="center 35%" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Contact
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
              Partner with us
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">
              Whether you&apos;re a government agency, NGO, insurer or veterinary
              clinic, we&apos;d love to explore how Mobile Vet can work for your
              communities.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-20 sm:py-28 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Start the conversation
                </h2>
                <p className="text-muted leading-relaxed">
                  We respond within two business days. Pilot partnerships are open
                  for Borena, Afar and the Somali Region in 2026–2027.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="rounded-lg bg-background p-2">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Email</div>
                    <div className="text-sm text-muted">partnerships@mobilevet.et</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="rounded-lg bg-background p-2">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Phone</div>
                    <div className="text-sm text-muted">+251 996 995 878</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="rounded-lg bg-background p-2">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Address</div>
                    <div className="text-sm text-muted">Addis Ababa, Ethiopia</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="rounded-lg bg-background p-2">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Hours</div>
                    <div className="text-sm text-muted">
                      Mon — Fri · 8:00 AM — 5:00 PM EAT
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
