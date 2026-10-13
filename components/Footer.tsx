import Link from "next/link";
import { PawPrint, Mail, Phone, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-sidebar-bg text-sidebar-text">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <PawPrint className="h-6 w-6 text-[#7fc29b]" />
              <span className="text-lg font-bold text-sidebar-text">Mobile Vet</span>
            </Link>
            <p className="text-sm text-sidebar-muted leading-relaxed">
              Bridging technology and pastoralism to protect Ethiopia&apos;s livestock, 
              livelihoods and future through data-driven innovation.
            </p>
            <p className="text-sm text-[#7fc29b] font-medium">
              ሰላም · Selam · Welcome
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-sidebar-text uppercase tracking-wider">
              Platform
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/services", label: "Services" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-sidebar-muted hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-sidebar-text uppercase tracking-wider">
              Get In Touch
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-[#7fc29b] mt-0.5 shrink-0" />
                <span className="text-sm text-sidebar-muted">partnerships@mobilevet.et</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-[#7fc29b] mt-0.5 shrink-0" />
                <span className="text-sm text-sidebar-muted">+251 996 995 878</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#7fc29b] mt-0.5 shrink-0" />
                <span className="text-sm text-sidebar-muted">Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-[#7fc29b] mt-0.5 shrink-0" />
                <span className="text-sm text-sidebar-muted">Mon — Fri · 8:00 AM — 5:00 PM EAT</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-sidebar-hover flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-sidebar-muted">
            © 2026 Mobile Vet. Built for Ethiopian pastoralist resilience. · <Link href="/credits" className="underline-offset-2 hover:text-white hover:underline">Photo credits</Link>
          </p>
          <div className="flex gap-4 text-xs text-sidebar-muted">
            <span>Satellite & QGIS</span>
            <span>·</span>
            <span>SMS · USSD · Voice</span>
            <span>·</span>
            <span>Multilingual</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
