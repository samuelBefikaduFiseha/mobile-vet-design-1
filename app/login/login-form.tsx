"use client";

import { useActionState, useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff, Landmark, Loader2, LogIn, Settings2, Sprout, Building2 } from "lucide-react";
import { login } from "@/lib/actions";
import { getRoleLabel } from "@/lib/utils";

const demoAccounts = [
  { email: "abebe@mobilevet.et", name: "Abebe Kebede", role: "extension_worker", note: "Borena field team", icon: Sprout },
  { email: "loans@dashenbank.et", name: "Hiwot Alemu", role: "bank_insurance", note: "Dashen Bank", icon: Landmark },
  { email: "admin@mobilevet.et", name: "Meron Tesfaye", role: "admin", note: "Mobile Vet HQ", icon: Settings2 },
  { email: "solomon@moaland.gov.et", name: "Dr. Solomon Tadesse", role: "government", note: "Ministry of Agriculture", icon: Building2 },
];

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  const [showPw, setShowPw] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  const signInAs = (email: string) => {
    emailRef.current!.value = email;
    pwRef.current!.value = "demo123";
    formRef.current!.requestSubmit();
  };

  return (
    <>
      <form ref={formRef} action={action} className="mt-6 space-y-4">
        {state?.error && (
          <div className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
          </div>
        )}
        <label className="block">
          <span className="label">Email</span>
          <input ref={emailRef} name="email" type="email" required autoComplete="email" className="input py-2.5" placeholder="you@organisation.et" />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <span className="relative block">
            <input ref={pwRef} name="password" type={showPw ? "text" : "password"} required autoComplete="current-password" className="input py-2.5 pr-10" placeholder="••••••" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-2.5 text-subtle hover:text-foreground" aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
        <button type="submit" disabled={pending} className="btn-primary w-full py-2.5">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-8">
        <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">
          <span className="h-px flex-1 bg-border" /> Demo accounts · password demo123 <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {demoAccounts.map((a) => (
            <button key={a.email} type="button" disabled={pending} onClick={() => signInAs(a.email)}
              className="card flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-card-hover disabled:opacity-50">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><a.icon className="h-4 w-4" /></span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{getRoleLabel(a.role)}</span>
                <span className="block truncate text-[11px] text-muted">{a.name} · {a.note}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
