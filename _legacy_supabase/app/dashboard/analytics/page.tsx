"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Tag,
  HeartPulse,
  FileText,
  TrendingUp,
  Map,
  AlertTriangle,
  Shield,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import type {
  Farmer,
  Animal,
  HealthRecord,
  Visit,
  Application,
  Profile,
  RegionData,
  Alert,
  RiskPrediction,
} from "@/lib/data-service";
import { formatNumber, getRiskColor } from "@/lib/utils";

export default function AnalyticsPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const [fRes, aRes, hRes, vRes, appRes, uRes, rRes, alRes, pRes] = await Promise.all([
      supabase.from("farmers").select("*"),
      supabase.from("animals").select("*"),
      supabase.from("health_records").select("*"),
      supabase.from("visits").select("*"),
      supabase.from("applications").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("regions").select("*"),
      supabase.from("alerts").select("*"),
      supabase.from("risk_predictions").select("*").order("overall_risk", { ascending: false }),
    ]);

    const firstError = fRes.error || aRes.error || hRes.error || vRes.error || appRes.error || uRes.error || rRes.error || alRes.error || pRes.error;
    if (firstError) {
      setError("Failed to load some analytics data.");
    } else {
      setFarmers(fRes.data || []);
      setAnimals(aRes.data || []);
      setHealthRecords(hRes.data || []);
      setVisits(vRes.data || []);
      setApplications(appRes.data || []);
      setUsers(uRes.data || []);
      setRegions(rRes.data || []);
      setAlerts(alRes.data || []);
      setPredictions(pRes.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalFarmers = farmers.length;
  const totalAnimals = animals.length;
  const totalHealthRecords = healthRecords.length;
  const totalVisits = visits.length;
  const totalApplications = applications.length;
  const totalUsers = users.length;
  const avgRisk = Math.round(
    farmers.reduce((sum, f) => sum + f.risk_score, 0) / (totalFarmers || 1)
  );
  const insuredCount = farmers.filter((f) => f.has_insurance).length;
  const loanCount = farmers.filter((f) => f.has_loan).length;
  const criticalFarmers = farmers.filter((f) => f.risk_level === "critical").length;
  const highRiskFarmers = farmers.filter((f) => f.risk_level === "high").length;
  const approvedApps = applications.filter((a) => a.status === "approved").length;
  const rejectedApps = applications.filter((a) => a.status === "rejected").length;
  const activeAlerts = alerts.filter((a) => !a.read).length;

  const regionStats = regions.map((r) => ({
    name: r.name,
    farmers: r.total_farmers,
    animals: r.total_animals,
    risk: r.avg_risk_score,
    alerts: r.recent_alerts,
    loans: r.active_loans,
    insurance: r.active_insurance,
  }));

  const topRisks = [...predictions].sort((a, b) => b.overall_risk - a.overall_risk).slice(0, 5);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          System Analytics
        </h1>
        <p className="text-sm text-muted mt-1">Platform-wide metrics and insights</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <Users className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold text-foreground">{totalFarmers}</div>
          <div className="text-xs text-muted">Farmers</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Tag className="h-5 w-5 text-secondary mb-2" />
          <div className="text-2xl font-bold text-foreground">{totalAnimals}</div>
          <div className="text-xs text-muted">Animals</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <HeartPulse className="h-5 w-5 text-danger mb-2" />
          <div className="text-2xl font-bold text-foreground">{totalHealthRecords}</div>
          <div className="text-xs text-muted">Health Records</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <FileText className="h-5 w-5 text-info mb-2" />
          <div className="text-2xl font-bold text-foreground">{totalApplications}</div>
          <div className="text-xs text-muted">Applications</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Shield className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
          <div className="text-xs text-muted">Users</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <AlertTriangle className="h-5 w-5 text-warning mb-2" />
          <div className="text-2xl font-bold text-foreground">{activeAlerts}</div>
          <div className="text-xs text-muted">Active Alerts</div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted mb-1">Average Risk</div>
          <div className={`text-3xl font-bold ${getRiskColor(avgRisk)}`}>{avgRisk}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted mb-1">Insured</div>
          <div className="text-3xl font-bold text-success">{insuredCount}</div>
          <div className="text-xs text-muted">
            {Math.round((insuredCount / totalFarmers) * 100)}% of farmers
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted mb-1">With Loans</div>
          <div className="text-3xl font-bold text-info">{loanCount}</div>
          <div className="text-xs text-muted">
            {Math.round((loanCount / totalFarmers) * 100)}% of farmers
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted mb-1">Critical Risk</div>
          <div className="text-3xl font-bold text-danger">{criticalFarmers}</div>
          <div className="text-xs text-muted">{highRiskFarmers} high risk</div>
        </div>
      </div>

      {/* Applications Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Applications Breakdown</h3>
          <div className="space-y-3">
            {[
              {
                label: "Pending",
                value: applications.filter((a) => a.status === "pending").length,
                total: totalApplications,
                color: "bg-warning",
              },
              {
                label: "Reviewing",
                value: applications.filter((a) => a.status === "reviewing").length,
                total: totalApplications,
                color: "bg-info",
              },
              { label: "Approved", value: approvedApps, total: totalApplications, color: "bg-success" },
              { label: "Rejected", value: rejectedApps, total: totalApplications, color: "bg-danger" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">{item.label}</span>
                  <span className="text-foreground">
                    {item.value} ({item.total ? Math.round((item.value / item.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-background overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Health Severity Breakdown</h3>
          <div className="space-y-3">
            {[
              {
                label: "Emergency",
                value: healthRecords.filter((r) => r.severity === "emergency").length,
                total: totalHealthRecords,
                color: "bg-danger",
              },
              {
                label: "High",
                value: healthRecords.filter((r) => r.severity === "high").length,
                total: totalHealthRecords,
                color: "bg-warning",
              },
              {
                label: "Moderate",
                value: healthRecords.filter((r) => r.severity === "moderate").length,
                total: totalHealthRecords,
                color: "bg-accent-warm",
              },
              {
                label: "Low",
                value: healthRecords.filter((r) => r.severity === "low").length,
                total: totalHealthRecords,
                color: "bg-success",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">{item.label}</span>
                  <span className="text-foreground">
                    {item.value} ({item.total ? Math.round((item.value / item.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-background overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Region Table */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Regional Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {["Region", "Farmers", "Animals", "Avg Risk", "Alerts", "Loans", "Insurance"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {regionStats.map((r) => (
                <tr key={r.name} className="hover:bg-card-hover/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-foreground">{r.farmers}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-foreground">{r.animals}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${getRiskColor(r.risk)}`}>{r.risk}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-warning">{r.alerts}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-info">{r.loans}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-success">{r.insurance}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Risk Farmers */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Top Risk Farmers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {["Farmer", "Region", "Risk", "Drought", "Disease", "Financial", "Confidence"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topRisks.map((p) => (
                <tr key={p.id} className="hover:bg-card-hover/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{p.farmer_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-muted">{p.region}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${getRiskColor(p.overall_risk)}`}>
                      {p.overall_risk}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-accent-warm">{p.drought_risk}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-danger">{p.disease_risk}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-info">{p.financial_risk}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-success">{Math.round(p.confidence * 100)}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
