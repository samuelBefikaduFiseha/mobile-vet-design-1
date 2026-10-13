// Shared row types (safe to import from Client Components).

export type UserRole = "extension_worker" | "bank_insurance" | "admin" | "government";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type Species = "cattle" | "goat" | "sheep" | "camel" | "donkey";
export type HealthStatus = "healthy" | "sick" | "recovered" | "deceased" | "missing";
export type RecordType = "vaccination" | "treatment" | "checkup" | "disease" | "deworming" | "injury";
export type Severity = "low" | "moderate" | "high" | "emergency";
export type VisitStatus = "scheduled" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "reviewing" | "approved" | "rejected" | "completed";
export type AlertSeverity = "info" | "warning" | "danger" | "success";
export type AlertType = "drought" | "disease" | "weather" | "system" | "financial";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  region_id: number | null;
  region_name: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  region_id: number | null;
  region_name: string | null;
  phone: string | null;
  status: "active" | "inactive" | "pending";
  last_login_at: string | null;
  created_at: string;
  farmer_count: number;
}

export interface Region {
  id: number;
  slug: string;
  name: string;
  admin_region: string;
  woredas: string[];
  livelihood: string;
  rainfall_mm: number;
  rainfall_normal_mm: number;
  ndvi: number;
  climate_updated_at: string;
  drought_index: number;
  drought_risk: RiskLevel;
  total_farmers: number;
  total_animals: number;
  sick_animals: number;
  avg_risk_score: number | null;
  disease_outbreaks: number;
  active_loans: number;
  active_insurance: number;
  extension_workers: number;
  recent_alerts: number;
}

export interface RegionOption {
  id: number;
  name: string;
  woredas: string[];
}

export interface Farmer {
  id: string;
  code: string;
  full_name: string;
  gender: "male" | "female";
  phone: string;
  region_id: number;
  region_name: string;
  admin_region: string;
  woreda: string;
  kebele: string;
  household_size: number;
  years_herding: number;
  registered_at: string;
  extension_worker_id: string | null;
  extension_worker_name: string | null;
  notes: string;
  herd_size: number;
  sick_count: number;
  risk_score: number | null;
  risk_level: RiskLevel | null;
  risk_assessed_at: string | null;
  has_insurance: boolean;
  has_loan: boolean;
  active_loans: number;
  active_debt_etb: number;
  insured_amount_etb: number;
  repaid_loans: number;
  open_requests: number;
  last_visit_date: string | null;
  /** Latest farmer photo (avatar). */
  photo_id: string | null;
  /** All farmer photos — only loaded on the profile page. */
  photo_ids?: string[];
}

export interface FarmerOption {
  id: string;
  full_name: string;
  code: string;
  region_name: string;
}

export interface Animal {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_code: string;
  region_name: string;
  tag_number: string;
  rfid: string;
  species: Species;
  breed: string;
  sex: "male" | "female";
  birth_date: string | null;
  color: string;
  weight_kg: number;
  health_status: HealthStatus;
  location: string;
  last_seen: string;
  registered_at: string;
  last_vaccination: string | null;
  record_count: number;
  photo_ids: string[];
}

export interface AnimalOption {
  id: string;
  tag_number: string;
  species: Species;
  farmer_name: string;
  health_status: HealthStatus;
}

export interface HealthRecord {
  id: string;
  animal_id: string;
  tag_number: string;
  species: Species;
  animal_status: HealthStatus;
  farmer_id: string;
  farmer_name: string;
  region_name: string;
  recorded_by: string | null;
  recorded_by_name: string | null;
  record_date: string;
  type: RecordType;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  severity: Severity;
  follow_up_date: string | null;
  photo_ids: string[];
}

export interface Visit {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_code: string;
  region_name: string;
  kebele: string;
  extension_worker_id: string | null;
  extension_worker_name: string | null;
  visit_date: string;
  purpose: string;
  observations: string;
  recommendations: string;
  next_visit_date: string | null;
  status: VisitStatus;
  photo_ids: string[];
}

export interface Application {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_code: string;
  region_name: string;
  current_risk: number | null;
  herd_size: number;
  type: "loan" | "insurance";
  provider: string;
  amount_etb: number;
  purpose: string;
  status: ApplicationStatus;
  risk_score_at_submission: number | null;
  submitted_at: string;
  submitted_by_name: string | null;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  completed_at: string | null;
  completed_by_name: string | null;
  decision_notes: string;
  /** The farmer's credit position across ALL institutions, for debt tracking. */
  farmer_active_loans: number;
  farmer_active_debt_etb: number;
  farmer_repaid_loans: number;
  farmer_insured_amount_etb: number;
}

export interface RiskAssessment {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_code: string;
  region_name: string;
  herd_size: number;
  assessed_at: string;
  overall_risk: number;
  drought_risk: number;
  disease_risk: number;
  market_risk: number;
  financial_risk: number;
  herd_value_etb: number;
  predicted_loss_etb: number;
  confidence: number;
  recommendation: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type: AlertType;
  region_id: number | null;
  region_name: string | null;
  created_by_name: string | null;
  created_at: string;
  read: boolean;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  organization: string;
  interest: string;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

export type ActionState = { ok: boolean; error?: string; message?: string } | null;
