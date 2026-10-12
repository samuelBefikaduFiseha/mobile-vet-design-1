"use client";

import { usePathname } from "next/navigation";

export default function ConditionalFooter() {
  const pathname = usePathname();
  const hideFooter =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/login");

  if (hideFooter) return null;

  return (
    <footer className="border-t border-border bg-sidebar-bg text-sidebar-text py-4 px-6">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <p>© 2026 Mobile Vet. Built for Ethiopian pastoralist resilience.</p>
        <p className="text-sidebar-muted">
          Satellite & QGIS · SMS · USSD · Voice · Multilingual
        </p>
      </div>
    </footer>
  );
}
