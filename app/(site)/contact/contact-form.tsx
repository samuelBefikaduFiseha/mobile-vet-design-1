"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { submitInquiry } from "@/lib/actions";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitInquiry, null);

  if (state?.ok) {
    return (
      <div className="card flex flex-col items-center justify-center p-8 py-16 text-center">
        <CheckCircle2 className="mb-4 h-12 w-12 text-success" />
        <h3 className="mb-2 text-xl font-semibold">Message sent</h3>
        <p className="max-w-sm text-sm text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-6 sm:p-8">
      <h2 className="text-lg font-semibold">Send us a message</h2>
      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">Name</span><input name="name" required className="input py-2.5" placeholder="Your full name" /></label>
        <label className="block"><span className="label">Email</span><input name="email" type="email" required className="input py-2.5" placeholder="you@organisation.org" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">Organisation</span><input name="organization" className="input py-2.5" placeholder="NGO, agency, insurer…" /></label>
        <label className="block">
          <span className="label">I&apos;m interested in</span>
          <select name="interest" defaultValue="pilot" className="input py-2.5">
            <option value="pilot">Joining a pilot</option>
            <option value="finance">Loans & insurance data</option>
            <option value="veterinary">Veterinary services</option>
            <option value="government">Government / early warning</option>
            <option value="general">Something else</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label">Message</span>
        <textarea name="message" required rows={5} className="input resize-none py-2.5" placeholder="Tell us about your organisation and how you'd like to partner…" />
      </label>
      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send message
      </button>
      <p className="text-center text-xs text-subtle">Messages go straight to the Mobile Vet partnerships team.</p>
    </form>
  );
}
