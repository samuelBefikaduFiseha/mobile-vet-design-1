"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, PawPrint, LogIn, LayoutDashboard } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ signedIn = false }: { signedIn?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const account = signedIn
    ? { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
    : { href: "/login", label: "Sign in", icon: LogIn };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition-transform group-hover:scale-105">
              <PawPrint className="h-5 w-5" />
            </span>
            <span className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-foreground">Mobile Vet</span>
              <span className="text-[10px] leading-none tracking-wider text-muted">ሞባይል ቬት</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface hover:text-foreground"
                }`}>
                {link.label}
              </Link>
            ))}
            <Link href="/contact" className="btn-secondary ml-3">Partner with us</Link>
            <Link href={account.href} className="btn-primary ml-1">
              <account.icon className="h-4 w-4" />
              {account.label}
            </Link>
          </nav>

          <button className="icon-btn md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  pathname === link.href ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface hover:text-foreground"
                }`}>
                {link.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="btn-secondary">Partner with us</Link>
              <Link href={account.href} onClick={() => setMobileOpen(false)} className="btn-primary">
                <account.icon className="h-4 w-4" /> {account.label}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
