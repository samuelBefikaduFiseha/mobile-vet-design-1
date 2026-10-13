import Link from "next/link";
import { ArrowRight, Mail, Phone, MapPin, Clock } from "lucide-react";
import { PhotoBackdrop } from "@/components/PhotoBackdrop";
import { sitePhotos } from "@/lib/photo-credits";

export function ContactCTA() {
  return (
    <section className="relative isolate overflow-hidden py-20 text-white sm:py-28">
      <PhotoBackdrop photo={sitePhotos.herders} tone="green" position="center 60%" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-[#a7e0bf]">Get in touch</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Partner with us</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-white/85">
              Whether you&apos;re a government agency, NGO, insurer or veterinary clinic, we&apos;d love to explore how
              Mobile Vet can work for your communities.
            </p>
            <p className="mt-4 text-sm text-white/70">
              We respond within two business days. Pilot partnerships are open for Borena, Afar and the Somali Region in 2026–2027.
            </p>
            <Link href="/contact" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-[#e8f3ec]">
              Start the conversation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4 rounded-xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">Contact information</h3>
            <div className="space-y-3 text-sm text-white/85">
              <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#a7e0bf]" />partnerships@mobilevet.et</div>
              <div className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#a7e0bf]" />+251 996 995 878</div>
              <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#a7e0bf]" />Addis Ababa, Ethiopia</div>
              <div className="flex items-start gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#a7e0bf]" />Mon – Fri · 8:00 AM – 5:00 PM EAT</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
