"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  User,
  Building,
  MessageSquare,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-[#0f2a12] to-[#1a2e1a]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Contact
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
              Partner with us
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">
              Whether you're a government agency, NGO, insurer or veterinary
              clinic, we'd love to explore how Mobile Vet can work for your
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

            {/* Form */}
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-secondary mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Message sent!
                  </h3>
                  <p className="text-sm text-muted">
                    Thank you for reaching out. We'll get back to you within two
                    business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pl-9 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pl-9 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="you@organization.org"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Organization
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                      <input
                        type="text"
                        value={form.organization}
                        onChange={(e) =>
                          setForm({ ...form, organization: e.target.value })
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pl-9 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="NGO, government agency, insurer, etc."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Message
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                      <textarea
                        required
                        rows={4}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pl-9 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        placeholder="Tell us about your organization and how you'd like to partner..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 w-full justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-background hover:bg-primary-hover transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Send message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
