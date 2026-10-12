import "server-only";
import { query, queryOne } from "./db";
import { regionScope } from "./auth";
import type {
  Alert, Animal, AnimalOption, Application, Farmer, FarmerOption, HealthRecord, Inquiry,
  Region, RegionOption, RiskAssessment, SessionUser, User, Visit,
} from "./types";

/** Tiny helper to build parameterised WHERE clauses. */
class Where {
  parts: string[] = [];
  params: unknown[] = [];
  add(sql: string, ...values: unknown[]) {
    let s = sql;
    for (const v of values) {
      this.params.push(v);
      s = s.replace("?", `$${this.params.length}`);
    }
    this.parts.push(s);
    return this;
  }
  get sql() {
    return this.parts.length ? `WHERE ${this.parts.join(" AND ")}` : "";
  }
}

const like = (s: string) => `%${s.trim()}%`;

// ------------------------------------------------------------------ regions
export function getRegions() {
  return query<Region>("SELECT * FROM region_summary ORDER BY id");
}

export function getRegionOptions() {
  return query<RegionOption>("SELECT id, name, woredas FROM regions ORDER BY id");
}

// ------------------------------------------------------------------ farmers
export interface FarmerFilters {
  q?: string; region?: string; woreda?: string; kebele?: string; risk?: string; worker?: string;
  gender?: string; credit?: string; health?: string; sort?: string;
}

const FARMER_SORT: Record<string, string> = {
  risk: "risk_score DESC NULLS LAST, full_name",
  name: "full_name",
  herd: "herd_size DESC, full_name",
  debt: "active_debt_etb DESC, full_name",
  newest: "registered_at DESC, full_name",
  visit: "last_visit_date ASC NULLS FIRST, full_name",
};

export function getFarmers(user: SessionUser, f: FarmerFilters = {}) {
  const w = new Where();
  const scope = regionScope(user);
  if (scope) w.add("region_id = ?", scope);
  if (f.q) w.add("(full_name ILIKE ? OR code ILIKE ? OR phone ILIKE ? OR kebele ILIKE ? OR woreda ILIKE ?)", ...Array(5).fill(like(f.q)));
  if (f.region) w.add("region_id = ?", Number(f.region));
  if (f.woreda) w.add("woreda = ?", f.woreda);
  if (f.kebele) w.add("kebele = ?", f.kebele);
  if (f.risk) w.add("risk_level = ?", f.risk);
  if (f.gender) w.add("gender = ?", f.gender);
  if (f.worker === "me") w.add("extension_worker_id = ?", user.id);
  else if (f.worker === "none") w.add("extension_worker_id IS NULL");
  else if (f.worker) w.add("extension_worker_id = ?", f.worker);
  if (f.credit === "debt") w.add("active_loans > 0");
  else if (f.credit === "repeat") w.add("active_loans > 0 AND open_requests > 0");
  else if (f.credit === "insured") w.add("has_insurance");
  else if (f.credit === "repaid") w.add("repaid_loans > 0");
  else if (f.credit === "none") w.add("NOT has_insurance AND active_loans = 0");
  if (f.health === "sick") w.add("sick_count > 0");
  else if (f.health === "unvisited") w.add("(last_visit_date IS NULL OR last_visit_date < CURRENT_DATE - 90)");
  return query<Farmer>(`SELECT * FROM farmer_summary ${w.sql} ORDER BY ${FARMER_SORT[f.sort ?? ""] ?? FARMER_SORT.risk}`, w.params);
}

export async function getFarmer(user: SessionUser, id: string) {
  const w = new Where().add("id = ?", id);
  const scope = regionScope(user);
  if (scope) w.add("region_id = ?", scope);
  return queryOne<Farmer>(`SELECT * FROM farmer_summary ${w.sql}`, w.params);
}

export function getFarmerOptions(user: SessionUser, regionId?: string | number | null) {
  const w = new Where();
  const scope = regionScope(user);
  if (scope) w.add("f.region_id = ?", scope);
  if (regionId) w.add("f.region_id = ?", Number(regionId));
  return query<FarmerOption>(
    `SELECT f.id, f.full_name, f.code, r.name AS region_name
       FROM farmers f JOIN regions r ON r.id = f.region_id ${w.sql}
      ORDER BY f.full_name`, w.params);
}

export function getExtensionWorkers(regionId?: number | null) {
  return query<{ id: string; name: string; region_id: number | null }>(
    `SELECT id, name, region_id FROM users
      WHERE role = 'extension_worker' AND status = 'active' AND ($1::int IS NULL OR region_id = $1)
      ORDER BY name`, [regionId ?? null]);
}

/**
 * Option lists for the location / people filters, narrowed by what is already selected
 * (region → woreda → kebele, region → farmer → animal).
 */
export async function getFilterOptions(user: SessionUser, p: { region?: string; woreda?: string; farmer?: string; species?: string }) {
  const scope = regionScope(user);
  const region = scope ?? (p.region ? Number(p.region) : null);
  const [regions, woredas, kebeles, farmers, workers, breeds, animals] = await Promise.all([
    getRegionOptions(),
    query<{ v: string }>(
      `SELECT DISTINCT woreda AS v FROM farmers WHERE ($1::int IS NULL OR region_id = $1) ORDER BY 1`, [region]),
    query<{ v: string }>(
      `SELECT DISTINCT kebele AS v FROM farmers WHERE ($1::int IS NULL OR region_id = $1) AND ($2::text IS NULL OR woreda = $2) ORDER BY 1`,
      [region, p.woreda || null]),
    getFarmerOptions(user, region),
    getExtensionWorkers(region),
    query<{ v: string }>(
      `SELECT DISTINCT a.breed AS v FROM animals a JOIN farmers f ON f.id = a.farmer_id
        WHERE ($1::int IS NULL OR f.region_id = $1) AND ($2::text IS NULL OR a.species = $2) ORDER BY 1`, [region, p.species || null]),
    p.farmer ? getAnimalOptions(user, p.farmer, true) : Promise.resolve([] as AnimalOption[]),
  ]);
  return {
    regions: regions.map((r) => ({ value: String(r.id), label: r.name })),
    woredas: woredas.map((r) => ({ value: r.v, label: r.v })),
    kebeles: kebeles.map((r) => ({ value: r.v, label: r.v })),
    farmers: farmers.map((f) => ({ value: f.id, label: `${f.full_name} (${f.code})` })),
    workers: workers.map((u) => ({ value: u.id, label: u.name })),
    breeds: breeds.map((r) => ({ value: r.v, label: r.v })),
    animals: animals.map((a) => ({ value: a.id, label: `${a.tag_number} · ${a.species}` })),
  };
}

// ------------------------------------------------------------------ animals
const ANIMAL_SELECT = `
  SELECT a.*, f.full_name AS farmer_name, f.code AS farmer_code, r.name AS region_name,
         (SELECT MAX(h.record_date) FROM health_records h WHERE h.animal_id = a.id AND h.type = 'vaccination') AS last_vaccination,
         (SELECT COUNT(*) FROM health_records h WHERE h.animal_id = a.id)::int AS record_count
    FROM animals a
    JOIN farmers f ON f.id = a.farmer_id
    JOIN regions r ON r.id = f.region_id`;

export interface AnimalFilters {
  q?: string; species?: string; status?: string; farmer?: string; region?: string; woreda?: string;
  sex?: string; breed?: string; vaccinated?: string; age?: string; location?: string;
}

export function getAnimals(user: SessionUser, f: AnimalFilters = {}) {
  const w = new Where();
  const scope = regionScope(user);
  if (scope) w.add("f.region_id = ?", scope);
  if (f.q) w.add("(a.tag_number ILIKE ? OR a.rfid ILIKE ? OR a.breed ILIKE ? OR f.full_name ILIKE ? OR a.location ILIKE ?)", ...Array(5).fill(like(f.q)));
  if (f.species) w.add("a.species = ?", f.species);
  if (f.status) w.add("a.health_status = ?", f.status);
  if (f.farmer) w.add("a.farmer_id = ?", f.farmer);
  if (f.region) w.add("f.region_id = ?", Number(f.region));
  if (f.woreda) w.add("f.woreda = ?", f.woreda);
  if (f.sex) w.add("a.sex = ?", f.sex);
  if (f.breed) w.add("a.breed = ?", f.breed);
  if (f.location) w.add("a.location ILIKE ?", like(f.location));
  const vacc = "EXISTS (SELECT 1 FROM health_records h WHERE h.animal_id = a.id AND h.type = 'vaccination' AND h.record_date >= CURRENT_DATE - 365)";
  if (f.vaccinated === "yes") w.add(vacc);
  else if (f.vaccinated === "no") w.add(`NOT ${vacc}`);
  if (f.age === "young") w.add("a.birth_date > CURRENT_DATE - INTERVAL '2 years'");
  else if (f.age === "adult") w.add("a.birth_date BETWEEN CURRENT_DATE - INTERVAL '8 years' AND CURRENT_DATE - INTERVAL '2 years'");
  else if (f.age === "old") w.add("a.birth_date < CURRENT_DATE - INTERVAL '8 years'");
  return query<Animal>(`${ANIMAL_SELECT} ${w.sql}
    ORDER BY CASE a.health_status WHEN 'sick' THEN 0 WHEN 'missing' THEN 1 ELSE 2 END, a.tag_number`, w.params);
}

export async function getAnimal(user: SessionUser, id: string) {
  const w = new Where().add("a.id = ?", id);
  const scope = regionScope(user);
  if (scope) w.add("f.region_id = ?", scope);
  return queryOne<Animal>(`${ANIMAL_SELECT} ${w.sql}`, w.params);
}

export function getAnimalOptions(user: SessionUser, farmerId?: string, includeDeceased = false) {
  const w = new Where();
  if (!includeDeceased) w.add("a.health_status <> 'deceased'");
  const scope = regionScope(user);
  if (scope) w.add("f.region_id = ?", scope);
  if (farmerId) w.add("a.farmer_id = ?", farmerId);
  return query<AnimalOption>(
    `SELECT a.id, a.tag_number, a.species, a.health_status, f.full_name AS farmer_name
       FROM animals a JOIN farmers f ON f.id = a.farmer_id ${w.sql}
      ORDER BY f.full_name, a.tag_number`, w.params);
}

// ------------------------------------------------------------------ health records
const HEALTH_SELECT = `
  SELECT h.*, a.tag_number, a.species, a.health_status AS animal_status,
         f.id AS farmer_id, f.full_name AS farmer_name, r.name AS region_name, u.name AS recorded_by_name
    FROM health_records h
    JOIN animals a ON a.id = h.animal_id
    JOIN farmers f ON f.id = a.farmer_id
    JOIN regions r ON r.id = f.region_id
    LEFT JOIN users u ON u.id = h.recorded_by`;

export interface HealthFilters {
  q?: string; type?: string; severity?: string; followup?: string; animal?: string; farmer?: string;
  region?: string; woreda?: string; species?: string; recorder?: string; from?: string; to?: string;
}

const isDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function getHealthRecords(user: SessionUser, f: HealthFilters = {}, limit = 500) {
  const w = new Where();
  const scope = regionScope(user);
  if (scope) w.add("f.region_id = ?", scope);
  if (f.q) w.add("(a.tag_number ILIKE ? OR h.diagnosis ILIKE ? OR h.symptoms ILIKE ? OR h.treatment ILIKE ? OR f.full_name ILIKE ?)", ...Array(5).fill(like(f.q)));
  if (f.type) w.add("h.type = ?", f.type);
  if (f.severity) w.add("h.severity = ?", f.severity);
  if (f.followup === "due") w.add("h.follow_up_date IS NOT NULL AND h.follow_up_date <= CURRENT_DATE + 7 AND a.health_status = 'sick'");
  if (f.animal) w.add("h.animal_id = ?", f.animal);
  if (f.farmer) w.add("f.id = ?", f.farmer);
  if (f.region) w.add("f.region_id = ?", Number(f.region));
  if (f.woreda) w.add("f.woreda = ?", f.woreda);
  if (f.species) w.add("a.species = ?", f.species);
  if (f.recorder) w.add("h.recorded_by = ?", f.recorder);
  if (isDate(f.from)) w.add("h.record_date >= ?", f.from);
  if (isDate(f.to)) w.add("h.record_date <= ?", f.to);
  return query<HealthRecord>(`${HEALTH_SELECT} ${w.sql} ORDER BY h.record_date DESC, h.created_at DESC LIMIT ${Number(limit)}`, w.params);
}

// ------------------------------------------------------------------ visits
const VISIT_SELECT = `
  SELECT v.*, f.full_name AS farmer_name, f.code AS farmer_code, f.kebele, r.name AS region_name, u.name AS extension_worker_name
    FROM visits v
    JOIN farmers f ON f.id = v.farmer_id
    JOIN regions r ON r.id = f.region_id
    LEFT JOIN users u ON u.id = v.extension_worker_id`;

export interface VisitFilters {
  q?: string; status?: string; farmer?: string; mine?: string; region?: string; woreda?: string; kebele?: string;
  worker?: string; from?: string; to?: string; when?: string;
}

export function getVisits(user: SessionUser, f: VisitFilters = {}) {
  const w = new Where();
  const scope = regionScope(user);
  if (scope) w.add("f.region_id = ?", scope);
  if (f.q) w.add("(f.full_name ILIKE ? OR v.purpose ILIKE ? OR v.observations ILIKE ? OR f.kebele ILIKE ?)", ...Array(4).fill(like(f.q)));
  if (f.status) w.add("v.status = ?", f.status);
  if (f.farmer) w.add("v.farmer_id = ?", f.farmer);
  if (f.mine === "1") w.add("v.extension_worker_id = ?", user.id);
  if (f.worker) w.add("v.extension_worker_id = ?", f.worker);
  if (f.region) w.add("f.region_id = ?", Number(f.region));
  if (f.woreda) w.add("f.woreda = ?", f.woreda);
  if (f.kebele) w.add("f.kebele = ?", f.kebele);
  if (isDate(f.from)) w.add("v.visit_date >= ?", f.from);
  if (isDate(f.to)) w.add("v.visit_date <= ?", f.to);
  if (f.when === "overdue") w.add("v.status = 'scheduled' AND v.visit_date < CURRENT_DATE");
  else if (f.when === "week") w.add("v.status = 'scheduled' AND v.visit_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7");
  return query<Visit>(`${VISIT_SELECT} ${w.sql}
    ORDER BY CASE v.status WHEN 'scheduled' THEN 0 ELSE 1 END,
             CASE WHEN v.status = 'scheduled' THEN v.visit_date END ASC,
             v.visit_date DESC`, w.params);
}

// ------------------------------------------------------------------ applications
const APP_SELECT = `
  SELECT x.*, f.full_name AS farmer_name, f.code AS farmer_code, fs.region_name, fs.risk_score AS current_risk, fs.herd_size,
         fs.active_loans AS farmer_active_loans, fs.active_debt_etb AS farmer_active_debt_etb,
         fs.repaid_loans AS farmer_repaid_loans, fs.insured_amount_etb AS farmer_insured_amount_etb,
         sb.name AS submitted_by_name, rb.name AS reviewed_by_name, cb.name AS completed_by_name
    FROM applications x
    JOIN farmers f ON f.id = x.farmer_id
    JOIN farmer_summary fs ON fs.id = f.id
    LEFT JOIN users sb ON sb.id = x.submitted_by
    LEFT JOIN users rb ON rb.id = x.reviewed_by
    LEFT JOIN users cb ON cb.id = x.completed_by`;

export interface ApplicationFilters {
  q?: string; status?: string; type?: string; farmer?: string; provider?: string; region?: string; debt?: string;
}

/**
 * Every role can see every application, so a farmer's existing debt with any institution is
 * visible when they ask for more. Banks/insurers can only *act* on their own (enforced in actions).
 */
export function getApplications(user: SessionUser, f: ApplicationFilters = {}) {
  const w = new Where();
  const scope = regionScope(user);
  if (scope) w.add("f.region_id = ?", scope);
  if (f.q) w.add("(f.full_name ILIKE ? OR f.code ILIKE ? OR x.purpose ILIKE ? OR x.provider ILIKE ?)", ...Array(4).fill(like(f.q)));
  if (f.status === "active") w.add("x.status = 'approved'");
  else if (f.status === "open") w.add("x.status IN ('pending','reviewing')");
  else if (f.status) w.add("x.status = ?", f.status);
  if (f.type) w.add("x.type = ?", f.type);
  if (f.farmer) w.add("x.farmer_id = ?", f.farmer);
  if (f.provider === "mine") w.add("x.provider = ?", user.organization);
  else if (f.provider) w.add("x.provider = ?", f.provider);
  if (f.region) w.add("f.region_id = ?", Number(f.region));
  if (f.debt === "yes") w.add("fs.active_loans > 0");
  else if (f.debt === "no") w.add("fs.active_loans = 0");
  return query<Application>(`${APP_SELECT} ${w.sql}
    ORDER BY CASE x.status WHEN 'pending' THEN 0 WHEN 'reviewing' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END, x.submitted_at DESC`, w.params);
}

export function getProviders() {
  return query<{ organization: string; kind: "loan" | "insurance" }>(
    `SELECT DISTINCT organization,
            CASE WHEN organization ILIKE '%insurance%' THEN 'insurance' ELSE 'loan' END AS kind
       FROM users WHERE role = 'bank_insurance' ORDER BY organization`);
}

// ------------------------------------------------------------------ risk
const RISK_SELECT = `
  SELECT lr.*, fs.full_name AS farmer_name, fs.code AS farmer_code, fs.region_name, fs.herd_size
    FROM latest_risk lr JOIN farmer_summary fs ON fs.id = lr.farmer_id`;

export function getLatestRisk(user: SessionUser, f: { region?: string; level?: string; q?: string } = {}) {
  const w = new Where();
  const scope = regionScope(user);
  if (scope) w.add("fs.region_id = ?", scope);
  if (f.region) w.add("fs.region_id = ?", Number(f.region));
  if (f.level) w.add("risk_level(lr.overall_risk) = ?", f.level);
  if (f.q) w.add("fs.full_name ILIKE ?", like(f.q));
  return query<RiskAssessment>(`${RISK_SELECT} ${w.sql} ORDER BY lr.overall_risk DESC`, w.params);
}

export function getRiskHistory(farmerId: string) {
  return query<RiskAssessment>(
    `SELECT ra.*, '' AS farmer_name, '' AS farmer_code, '' AS region_name, 0 AS herd_size
       FROM risk_assessments ra WHERE ra.farmer_id = $1 ORDER BY ra.assessed_at DESC LIMIT 10`, [farmerId]);
}

// ------------------------------------------------------------------ alerts
export function getAlerts(user: SessionUser, limit = 50) {
  // Extension workers & regional officials see national alerts plus their own region's.
  return query<Alert>(
    `SELECT al.*, r.name AS region_name, u.name AS created_by_name,
            EXISTS (SELECT 1 FROM alert_reads ar WHERE ar.alert_id = al.id AND ar.user_id = $1) AS read
       FROM alerts al
       LEFT JOIN regions r ON r.id = al.region_id
       LEFT JOIN users u ON u.id = al.created_by
      WHERE ($2::int IS NULL OR al.region_id IS NULL OR al.region_id = $2)
      ORDER BY al.created_at DESC LIMIT $3`,
    [user.id, user.role === "extension_worker" ? user.region_id : null, limit]);
}

// ------------------------------------------------------------------ users & inquiries
export function getUsers() {
  return query<User>(
    `SELECT u.id, u.name, u.email, u.role, u.organization, u.region_id, r.name AS region_name, u.phone, u.status,
            u.last_login_at, u.created_at,
            (SELECT COUNT(*) FROM farmers f WHERE f.extension_worker_id = u.id)::int AS farmer_count
       FROM users u LEFT JOIN regions r ON r.id = u.region_id
      ORDER BY CASE u.status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, u.role, u.name`);
}

export function getInquiries() {
  return query<Inquiry>(
    "SELECT * FROM inquiries ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'contacted' THEN 1 ELSE 2 END, created_at DESC");
}

// ------------------------------------------------------------------ dashboard overview
export async function getOverview(user: SessionUser) {
  const scope = regionScope(user);
  const p = [scope];
  const [totals] = await query<{
    farmers: number; animals: number; sick: number; lost: number; high_risk: number; avg_risk: number | null;
    insured: number; loans: number; followups_due: number; visits_upcoming: number; apps_open: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM farmers WHERE $1::int IS NULL OR region_id = $1)::int AS farmers,
       (SELECT COUNT(*) FROM animals a JOIN farmers f ON f.id = a.farmer_id WHERE ($1::int IS NULL OR f.region_id = $1) AND a.health_status NOT IN ('deceased','missing'))::int AS animals,
       (SELECT COUNT(*) FROM animals a JOIN farmers f ON f.id = a.farmer_id WHERE ($1::int IS NULL OR f.region_id = $1) AND a.health_status = 'sick')::int AS sick,
       (SELECT COUNT(*) FROM animals a JOIN farmers f ON f.id = a.farmer_id WHERE ($1::int IS NULL OR f.region_id = $1) AND a.health_status IN ('deceased','missing'))::int AS lost,
       (SELECT COUNT(*) FROM farmer_summary WHERE ($1::int IS NULL OR region_id = $1) AND risk_level IN ('high','critical'))::int AS high_risk,
       (SELECT ROUND(AVG(risk_score)) FROM farmer_summary WHERE $1::int IS NULL OR region_id = $1)::int AS avg_risk,
       (SELECT COUNT(*) FROM farmer_summary WHERE ($1::int IS NULL OR region_id = $1) AND has_insurance)::int AS insured,
       (SELECT COUNT(*) FROM farmer_summary WHERE ($1::int IS NULL OR region_id = $1) AND has_loan)::int AS loans,
       (SELECT COUNT(*) FROM health_records h JOIN animals a ON a.id = h.animal_id JOIN farmers f ON f.id = a.farmer_id
         WHERE ($1::int IS NULL OR f.region_id = $1) AND a.health_status = 'sick' AND h.follow_up_date IS NOT NULL AND h.follow_up_date <= CURRENT_DATE + 7)::int AS followups_due,
       (SELECT COUNT(*) FROM visits v JOIN farmers f ON f.id = v.farmer_id WHERE ($1::int IS NULL OR f.region_id = $1) AND v.status = 'scheduled')::int AS visits_upcoming,
       (SELECT COUNT(*) FROM applications x JOIN farmers f ON f.id = x.farmer_id WHERE ($1::int IS NULL OR f.region_id = $1) AND x.status IN ('pending','reviewing'))::int AS apps_open`,
    p);

  const species = await query<{ species: string; count: number }>(
    `SELECT a.species, COUNT(*)::int AS count FROM animals a JOIN farmers f ON f.id = a.farmer_id
      WHERE ($1::int IS NULL OR f.region_id = $1) AND a.health_status NOT IN ('deceased','missing')
      GROUP BY a.species ORDER BY count DESC`, p);

  const riskBands = await query<{ level: string; count: number }>(
    `SELECT risk_level AS level, COUNT(*)::int AS count FROM farmer_summary
      WHERE ($1::int IS NULL OR region_id = $1) AND risk_level IS NOT NULL GROUP BY risk_level`, p);

  const caseTrend = await query<{ week: string; cases: number }>(
    `SELECT to_char(w.week, 'YYYY-MM-DD') AS week, COUNT(h.id)::int AS cases
       FROM generate_series(date_trunc('week', CURRENT_DATE) - INTERVAL '11 weeks', date_trunc('week', CURRENT_DATE), INTERVAL '1 week') AS w(week)
       LEFT JOIN (health_records h JOIN animals a ON a.id = h.animal_id JOIN farmers f ON f.id = a.farmer_id)
         ON h.type IN ('disease','injury') AND date_trunc('week', h.record_date) = w.week AND ($1::int IS NULL OR f.region_id = $1)
      GROUP BY w.week ORDER BY w.week`, p);

  const topDiagnoses = await query<{ diagnosis: string; count: number }>(
    `SELECT regexp_replace(h.diagnosis, ' \\(follow-up\\)$', '') AS diagnosis, COUNT(*)::int AS count
       FROM health_records h JOIN animals a ON a.id = h.animal_id JOIN farmers f ON f.id = a.farmer_id
      WHERE ($1::int IS NULL OR f.region_id = $1) AND h.type = 'disease' AND h.record_date >= CURRENT_DATE - 180
      GROUP BY 1 ORDER BY count DESC LIMIT 5`, p);

  const appStatus = await query<{ status: string; type: string; count: number; amount: number }>(
    `SELECT x.status, x.type, COUNT(*)::int AS count, COALESCE(SUM(x.amount_etb), 0) AS amount
       FROM applications x JOIN farmers f ON f.id = x.farmer_id
      WHERE ($1::int IS NULL OR f.region_id = $1) AND ($2::text IS NULL OR x.provider = $2)
      GROUP BY x.status, x.type`, [scope, user.role === "bank_insurance" ? user.organization : null]);

  // Credit position across all institutions (everyone can see who is in debt).
  const [credit] = await query<{
    debtors: number; active_loans: number; active_debt: number; repaid_loans: number;
    insured: number; insured_amount: number; repeat_requests: number;
  }>(
    `SELECT COUNT(*) FILTER (WHERE active_loans > 0)::int AS debtors,
            COALESCE(SUM(active_loans), 0)::int AS active_loans,
            COALESCE(SUM(active_debt_etb), 0) AS active_debt,
            COALESCE(SUM(repaid_loans), 0)::int AS repaid_loans,
            COUNT(*) FILTER (WHERE has_insurance)::int AS insured,
            COALESCE(SUM(insured_amount_etb), 0) AS insured_amount,
            COUNT(*) FILTER (WHERE active_loans > 0 AND open_requests > 0)::int AS repeat_requests
       FROM farmer_summary WHERE $1::int IS NULL OR region_id = $1`, p);

  return { totals, species, riskBands, caseTrend, topDiagnoses, appStatus, credit };
}

/** Public landing-page figures; falls back gracefully if the DB is down. */
export async function getPublicStats() {
  try {
    return await queryOne<{ animals: number; farmers: number; regions: number; records: number; workers: number }>(
      `SELECT (SELECT COUNT(*) FROM animals)::int AS animals,
              (SELECT COUNT(*) FROM farmers)::int AS farmers,
              (SELECT COUNT(*) FROM regions)::int AS regions,
              (SELECT COUNT(*) FROM health_records)::int AS records,
              (SELECT COUNT(*) FROM users WHERE role = 'extension_worker' AND status = 'active')::int AS workers`);
  } catch {
    return null;
  }
}

export async function getPublicRegions() {
  try {
    return await query<Pick<Region, "name" | "admin_region" | "livelihood" | "drought_index" | "drought_risk" | "ndvi" | "total_farmers" | "total_animals">>(
      `SELECT name, admin_region, livelihood, drought_index, drought_risk, ndvi, total_farmers, total_animals
         FROM region_summary ORDER BY drought_index DESC`);
  } catch {
    return [];
  }
}
