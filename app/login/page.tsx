import Link from "next/link";
import { redirect } from "next/navigation";
import { PawPrint, Satellite, ShieldCheck, Smartphone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in | Mobile Vet" };

export default async function LoginPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar-bg p-12 text-sidebar-text lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_80%_10%,#2e8a5c_0%,transparent_60%),radial-gradient(50%_40%_at_10%_90%,#b97a1f_0%,transparent_60%)]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e8a5c] text-white"><PawPrint className="h-5 w-5" /></span>
          <span className="text-lg font-semibold text-white">Mobile Vet</span>
        </Link>
        <div className="relative mt-auto max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            One record for every animal, from the kebele to the bank.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-muted">
            Extension workers, lenders, insurers and government teams work from the same live herd, health and climate data.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: Satellite, text: "Drought risk from NDVI and rainfall, updated per region" },
              { icon: ShieldCheck, text: "Risk scores computed from real herd and health records" },
              { icon: Smartphone, text: "Field data captured by extension workers on the ground" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><f.icon className="h-4 w-4 text-[#8fd3ab]" /></span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"><PawPrint className="h-5 w-5" /></span>
            <span className="text-lg font-semibold">Mobile Vet</span>
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use your organisation account, or pick a demo role below.</p>
          <LoginForm />
          <p className="mt-8 text-center text-xs text-subtle">© 2026 Mobile Vet · ሞባይል ቬት</p>
        </div>
      </main>
    </div>
  );
}
