import { createClient } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "extension_worker" | "bank_insurance" | "admin" | "government";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  region?: string;
  status: "active" | "inactive" | "pending";
  last_login?: string;
  created_at: string;
}

export interface Farmer {
  id: string;
  full_name: string;
  phone: string;
  region: string;
  zone: string;
  kebele: string;
  household_size: number;
  years_farming: number;
  registered_at: string;
  extension_worker_id?: string;
  livestock_count: number;
  risk_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  has_insurance: boolean;
  has_loan: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Animal {
  id: string;
  farmer_id: string;
  tag_number: string;
  rfid_id: string;
  species: "cattle" | "goat" | "sheep" | "camel" | "donkey";
  breed: string;
  gender: "male" | "female";
  birth_date: string;
  color: string;
  weight: number;
  health_status: "healthy" | "sick" | "recovered" | "deceased" | "missing";
  location: string;
  last_seen: string;
  vaccination_history: string[];
  registered_at: string;
  created_at: string;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  animal_id: string;
  farmer_id: string;
  recorded_by: string;
  date: string;
  type: "vaccination" | "treatment" | "checkup" | "disease" | "deworming" | "injury";
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  severity: "low" | "moderate" | "high" | "emergency";
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at: string;
}

export interface Visit {
  id: string;
  farmer_id: string;
  extension_worker_id: string;
  date: string;
  purpose: string;
  observations: string;
  recommendations: string;
  next_visit_date: string;
  status: "completed" | "pending" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  farmer_id: string;
  farmer_name: string;
  type: "loan" | "insurance";
  status: "pending" | "approved" | "rejected" | "reviewing";
  amount: number;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes: string;
  risk_score: number;
  purpose: string;
  created_at: string;
  updated_at: string;
}

export interface RegionData {
  id: string;
  name: string;
  zone: string;
  total_farmers: number;
  total_animals: number;
  avg_risk_score: number;
  drought_risk: "low" | "medium" | "high" | "critical";
  disease_outbreaks: number;
  active_loans: number;
  active_insurance: number;
  extension_workers: number;
  recent_alerts: number;
  rainfall_mm: number;
  vegetation_index: number;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger" | "success";
  type: "drought" | "disease" | "weather" | "system" | "financial";
  region: string;
  created_at: string;
  read: boolean;
  user_id?: string;
}

export interface RiskPrediction {
  id: string;
  farmer_id: string;
  farmer_name: string;
  region: string;
  overall_risk: number;
  drought_risk: number;
  disease_risk: number;
  market_risk: number;
  financial_risk: number;
  recommendation: string;
  predicted_loss: number;
  confidence: number;
  created_at: string;
}

// ============================================================
// AUTH
// ============================================================

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp(email: string, password: string, metadata: { name: string; role: UserRole; organization: string }) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  return { data, error };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ============================================================
// FARMERS
// ============================================================

export async function getFarmers() {
  const supabase = createClient();
  const { data, error } = await supabase.from("farmers").select("*").order("created_at", { ascending: false });
  return { data: data as Farmer[] | null, error };
}

export async function getFarmerById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("farmers").select("*").eq("id", id).single();
  return { data: data as Farmer | null, error };
}

export async function createFarmer(farmer: Partial<Farmer>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("farmers").insert(farmer).select().single();
  return { data: data as Farmer | null, error };
}

export async function updateFarmer(id: string, farmer: Partial<Farmer>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("farmers").update(farmer).eq("id", id).select().single();
  return { data: data as Farmer | null, error };
}

export async function deleteFarmer(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("farmers").delete().eq("id", id);
  return { error };
}

// ============================================================
// ANIMALS
// ============================================================

export async function getAnimals() {
  const supabase = createClient();
  const { data, error } = await supabase.from("animals").select("*").order("created_at", { ascending: false });
  return { data: data as Animal[] | null, error };
}

export async function getAnimalsByFarmer(farmerId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("animals").select("*").eq("farmer_id", farmerId).order("created_at", { ascending: false });
  return { data: data as Animal[] | null, error };
}

export async function createAnimal(animal: Partial<Animal>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("animals").insert(animal).select().single();
  return { data: data as Animal | null, error };
}

export async function updateAnimal(id: string, animal: Partial<Animal>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("animals").update(animal).eq("id", id).select().single();
  return { data: data as Animal | null, error };
}

export async function deleteAnimal(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("animals").delete().eq("id", id);
  return { error };
}

// ============================================================
// HEALTH RECORDS
// ============================================================

export async function getHealthRecords() {
  const supabase = createClient();
  const { data, error } = await supabase.from("health_records").select("*").order("date", { ascending: false });
  return { data: data as HealthRecord[] | null, error };
}

export async function createHealthRecord(record: Partial<HealthRecord>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("health_records").insert(record).select().single();
  return { data: data as HealthRecord | null, error };
}

export async function updateHealthRecord(id: string, record: Partial<HealthRecord>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("health_records").update(record).eq("id", id).select().single();
  return { data: data as HealthRecord | null, error };
}

export async function deleteHealthRecord(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("health_records").delete().eq("id", id);
  return { error };
}

// ============================================================
// VISITS
// ============================================================

export async function getVisits() {
  const supabase = createClient();
  const { data, error } = await supabase.from("visits").select("*").order("date", { ascending: false });
  return { data: data as Visit[] | null, error };
}

export async function createVisit(visit: Partial<Visit>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("visits").insert(visit).select().single();
  return { data: data as Visit | null, error };
}

export async function updateVisit(id: string, visit: Partial<Visit>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("visits").update(visit).eq("id", id).select().single();
  return { data: data as Visit | null, error };
}

export async function deleteVisit(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("visits").delete().eq("id", id);
  return { error };
}

// ============================================================
// APPLICATIONS
// ============================================================

export async function getApplications() {
  const supabase = createClient();
  const { data, error } = await supabase.from("applications").select("*").order("submitted_at", { ascending: false });
  return { data: data as Application[] | null, error };
}

export async function createApplication(app: Partial<Application>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("applications").insert(app).select().single();
  return { data: data as Application | null, error };
}

export async function updateApplication(id: string, app: Partial<Application>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("applications").update(app).eq("id", id).select().single();
  return { data: data as Application | null, error };
}

export async function deleteApplication(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("applications").delete().eq("id", id);
  return { error };
}

// ============================================================
// PROFILES / USERS
// ============================================================

export async function getProfiles() {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  return { data: data as Profile[] | null, error };
}

export async function getProfileById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  return { data: data as Profile | null, error };
}

export async function updateProfile(id: string, profile: Partial<Profile>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").update(profile).eq("id", id).select().single();
  return { data: data as Profile | null, error };
}

export async function deleteProfile(id: string) {
  const supabase = createClient();
  // Note: deleting from auth.users requires admin privileges, so we deactivate instead
  const { error } = await supabase.from("profiles").update({ status: "inactive" }).eq("id", id);
  return { error };
}

// ============================================================
// REGIONS
// ============================================================

export async function getRegions() {
  const supabase = createClient();
  const { data, error } = await supabase.from("regions").select("*").order("name", { ascending: true });
  return { data: data as RegionData[] | null, error };
}

export async function updateRegion(id: string, region: Partial<RegionData>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("regions").update(region).eq("id", id).select().single();
  return { data: data as RegionData | null, error };
}

// ============================================================
// ALERTS
// ============================================================

export async function getAlerts() {
  const supabase = createClient();
  const { data, error } = await supabase.from("alerts").select("*").order("created_at", { ascending: false });
  return { data: data as Alert[] | null, error };
}

export async function createAlert(alert: Partial<Alert>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("alerts").insert(alert).select().single();
  return { data: data as Alert | null, error };
}

export async function markAlertRead(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("alerts").update({ read: true }).eq("id", id);
  return { error };
}

export async function markAllAlertsRead() {
  const supabase = createClient();
  const { error } = await supabase.from("alerts").update({ read: true }).eq("read", false);
  return { error };
}

export async function deleteAlert(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("alerts").delete().eq("id", id);
  return { error };
}

// ============================================================
// RISK PREDICTIONS
// ============================================================

export async function getRiskPredictions() {
  const supabase = createClient();
  const { data, error } = await supabase.from("risk_predictions").select("*").order("overall_risk", { ascending: false });
  return { data: data as RiskPrediction[] | null, error };
}

// ============================================================
// COMBINED DASHBOARD DATA
// ============================================================

export async function getDashboardData() {
  const supabase = createClient();

  const [farmers, animals, health, visits, apps, users, regions, alerts, predictions] = await Promise.all([
    supabase.from("farmers").select("*", { count: "exact" }),
    supabase.from("animals").select("*", { count: "exact" }),
    supabase.from("health_records").select("*", { count: "exact" }),
    supabase.from("visits").select("*", { count: "exact" }),
    supabase.from("applications").select("*", { count: "exact" }),
    supabase.from("profiles").select("*", { count: "exact" }),
    supabase.from("regions").select("*"),
    supabase.from("alerts").select("*").eq("read", false),
    supabase.from("risk_predictions").select("*").order("overall_risk", { ascending: false }).limit(5),
  ]);

  return {
    farmers: { count: farmers.count, data: farmers.data as Farmer[] | null },
    animals: { count: animals.count, data: animals.data as Animal[] | null },
    healthRecords: { count: health.count, data: health.data as HealthRecord[] | null },
    visits: { count: visits.count, data: visits.data as Visit[] | null },
    applications: { count: apps.count, data: apps.data as Application[] | null },
    users: { count: users.count, data: users.data as Profile[] | null },
    regions: regions.data as RegionData[] | null,
    alerts: alerts.data as Alert[] | null,
    predictions: predictions.data as RiskPrediction[] | null,
  };
}
