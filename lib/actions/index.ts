"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, queryOne, transaction } from "../db";
import { authorize, createSession, destroySession, regionScope, verifyCredentials, AuthError } from "../auth";
import { can } from "../permissions";
import type { ActionState, SessionUser } from "../types";
import { date, num, oneOf, run, str, ValidationError } from "./helpers";

const SPECIES = ["cattle", "goat", "sheep", "camel", "donkey"] as const;
const HEALTH = ["healthy", "sick", "recovered", "deceased", "missing"] as const;
const RECORD_TYPES = ["vaccination", "treatment", "checkup", "disease", "deworming", "injury"] as const;
const SEVERITY = ["low", "moderate", "high", "emergency"] as const;
const ROLES = ["extension_worker", "bank_insurance", "admin", "government"] as const;

/** Extension workers may only touch farmers in their own region. */
async function assertFarmerAccess(user: SessionUser, farmerId: string) {
  const scope = regionScope(user);
  const row = await queryOne<{ region_id: number }>("SELECT region_id FROM farmers WHERE id = $1", [farmerId]);
  if (!row) throw new ValidationError("Farmer not found.");
  if (scope && row.region_id !== scope) throw new AuthError("This farmer is outside your region.");
}

async function farmerOfAnimal(animalId: string) {
  const row = await queryOne<{ farmer_id: string }>("SELECT farmer_id FROM animals WHERE id = $1", [animalId]);
  if (!row) throw new ValidationError("Animal not found.");
  return row.farmer_id;
}

// ================================================================== auth
export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");
  let user;
  try {
    user = await verifyCredentials(email, password);
  } catch {
    return { ok: false, error: "Database is not reachable. Start it with: docker compose up -d" };
  }
  if (!user) return { ok: false, error: "Incorrect email or password." };
  if (user.status !== "active") {
    return { ok: false, error: user.status === "pending" ? "Your account is awaiting admin approval." : "This account has been deactivated." };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ================================================================== farmers
export async function saveFarmer(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.editFarmers);
    const id = str(fd, "id");
    const regionId = num(fd, "region_id", { required: true })!;
    const scope = regionScope(user);
    if (scope && regionId !== scope) throw new AuthError("You can only register farmers in your own region.");
    const phone = str(fd, "phone", { required: true, max: 20 });
    if (!/^\+?[0-9 ]{9,15}$/.test(phone)) throw new ValidationError("Enter a valid phone number, e.g. +251911234567.");
    const values = [
      str(fd, "full_name", { required: true, max: 120 }),
      oneOf(fd, "gender", ["male", "female"] as const),
      phone,
      regionId,
      str(fd, "woreda", { required: true, max: 80 }),
      str(fd, "kebele", { required: true, max: 80 }),
      num(fd, "household_size", { required: true, min: 1, max: 40 }),
      num(fd, "years_herding", { required: true, min: 0, max: 80 }),
      str(fd, "extension_worker_id") || (user.role === "extension_worker" ? user.id : null),
      str(fd, "notes"),
    ];
    if (id) {
      await assertFarmerAccess(user, id);
      await query(
        `UPDATE farmers SET full_name=$1, gender=$2, phone=$3, region_id=$4, woreda=$5, kebele=$6,
                household_size=$7, years_herding=$8, extension_worker_id=$9, notes=$10, updated_at=NOW()
          WHERE id=$11`, [...values, id]);
      await query("SELECT assess_farmer_risk($1, $2)", [id, user.id]);
      return "Farmer updated.";
    }
    const row = await queryOne<{ id: string }>(
      `INSERT INTO farmers (full_name, gender, phone, region_id, woreda, kebele, household_size, years_herding, extension_worker_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, values);
    await query("SELECT assess_farmer_risk($1, $2)", [row!.id, user.id]);
    return "Farmer registered and risk-scored.";
  });
}

export async function deleteFarmer(id: string): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.editFarmers);
    await assertFarmerAccess(user, id);
    await query("DELETE FROM farmers WHERE id = $1", [id]);
    return "Farmer and all related records deleted.";
  });
}

// ================================================================== animals
export async function saveAnimal(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.editLivestock);
    const id = str(fd, "id");
    const farmerId = str(fd, "farmer_id", { required: true });
    await assertFarmerAccess(user, farmerId);
    const values = [
      farmerId,
      str(fd, "tag_number", { required: true, max: 30 }).toUpperCase(),
      str(fd, "rfid", { required: true, max: 30 }),
      oneOf(fd, "species", SPECIES),
      str(fd, "breed", { required: true, max: 60 }),
      oneOf(fd, "sex", ["male", "female"] as const),
      date(fd, "birth_date"),
      str(fd, "color", { max: 40 }),
      num(fd, "weight_kg", { required: true, min: 1, max: 1500 }),
      oneOf(fd, "health_status", HEALTH),
      str(fd, "location", { max: 120 }),
      date(fd, "last_seen") ?? new Date().toISOString().slice(0, 10),
    ];
    if (id) {
      const oldFarmer = await farmerOfAnimal(id);
      await assertFarmerAccess(user, oldFarmer);
      await query(
        `UPDATE animals SET farmer_id=$1, tag_number=$2, rfid=$3, species=$4, breed=$5, sex=$6, birth_date=$7,
                color=$8, weight_kg=$9, health_status=$10, location=$11, last_seen=$12, updated_at=NOW()
          WHERE id=$13`, [...values, id]);
      if (oldFarmer !== farmerId) await query("SELECT assess_farmer_risk($1, $2)", [oldFarmer, user.id]);
    } else {
      await query(
        `INSERT INTO animals (farmer_id, tag_number, rfid, species, breed, sex, birth_date, color, weight_kg, health_status, location, last_seen)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, values);
    }
    await query("SELECT assess_farmer_risk($1, $2)", [farmerId, user.id]);
    return id ? "Animal updated." : "Animal registered.";
  });
}

export async function deleteAnimal(id: string): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.editLivestock);
    const farmerId = await farmerOfAnimal(id);
    await assertFarmerAccess(user, farmerId);
    await query("DELETE FROM animals WHERE id = $1", [id]);
    await query("SELECT assess_farmer_risk($1, $2)", [farmerId, user.id]);
    return "Animal removed.";
  });
}

// ================================================================== health records
export async function saveHealthRecord(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.editHealth);
    const id = str(fd, "id");
    const animalId = str(fd, "animal_id", { required: true });
    const farmerId = await farmerOfAnimal(animalId);
    await assertFarmerAccess(user, farmerId);
    const type = oneOf(fd, "type", RECORD_TYPES);
    const values = [
      animalId,
      date(fd, "record_date", { required: true }),
      type,
      str(fd, "symptoms", { max: 500 }),
      str(fd, "diagnosis", { required: true, max: 200 }),
      str(fd, "treatment", { max: 500 }),
      str(fd, "notes", { max: 1000 }),
      oneOf(fd, "severity", SEVERITY),
      date(fd, "follow_up_date"),
    ];
    // Optionally update the animal's status in the same step (e.g. mark sick / recovered).
    const newStatus = str(fd, "animal_status");
    await transaction(async (c) => {
      if (id) {
        await c.query(
          `UPDATE health_records SET animal_id=$1, record_date=$2, type=$3, symptoms=$4, diagnosis=$5, treatment=$6,
                  notes=$7, severity=$8, follow_up_date=$9 WHERE id=$10`, [...values, id]);
      } else {
        await c.query(
          `INSERT INTO health_records (animal_id, record_date, type, symptoms, diagnosis, treatment, notes, severity, follow_up_date, recorded_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [...values, user.id]);
      }
      if (newStatus) {
        if (!HEALTH.includes(newStatus as (typeof HEALTH)[number])) throw new ValidationError("Choose a valid animal status.");
        await c.query("UPDATE animals SET health_status=$1, last_seen=GREATEST(last_seen, $2::date), updated_at=NOW() WHERE id=$3",
          [newStatus, values[1], animalId]);
      }
    });
    await query("SELECT assess_farmer_risk($1, $2)", [farmerId, user.id]);
    return id ? "Health record updated." : "Health record saved.";
  });
}

export async function deleteHealthRecord(id: string): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.editHealth);
    const row = await queryOne<{ animal_id: string }>("SELECT animal_id FROM health_records WHERE id = $1", [id]);
    if (!row) throw new ValidationError("Record not found.");
    const farmerId = await farmerOfAnimal(row.animal_id);
    await assertFarmerAccess(user, farmerId);
    await query("DELETE FROM health_records WHERE id = $1", [id]);
    return "Health record deleted.";
  });
}

// ================================================================== visits
export async function saveVisit(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.editVisits);
    const id = str(fd, "id");
    const farmerId = str(fd, "farmer_id", { required: true });
    await assertFarmerAccess(user, farmerId);
    const status = oneOf(fd, "status", ["scheduled", "completed", "cancelled"] as const);
    const values = [
      farmerId,
      str(fd, "extension_worker_id") || user.id,
      date(fd, "visit_date", { required: true }),
      str(fd, "purpose", { required: true, max: 200 }),
      str(fd, "observations", { max: 2000 }),
      str(fd, "recommendations", { max: 2000 }),
      date(fd, "next_visit_date"),
      status,
    ];
    if (status === "completed" && !values[4]) throw new ValidationError("Add your observations to complete a visit.");
    if (id) {
      await query(
        `UPDATE visits SET farmer_id=$1, extension_worker_id=$2, visit_date=$3, purpose=$4, observations=$5,
                recommendations=$6, next_visit_date=$7, status=$8, updated_at=NOW() WHERE id=$9`, [...values, id]);
    } else {
      await query(
        `INSERT INTO visits (farmer_id, extension_worker_id, visit_date, purpose, observations, recommendations, next_visit_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, values);
    }
    // A completed visit with a next date automatically books the follow-up visit.
    const next = values[6] as string | null;
    if (status === "completed" && next) {
      await query(
        `INSERT INTO visits (farmer_id, extension_worker_id, visit_date, purpose, status)
         SELECT $1, $2, $3, 'Follow-up visit', 'scheduled'
          WHERE NOT EXISTS (SELECT 1 FROM visits WHERE farmer_id = $1 AND visit_date = $3 AND status = 'scheduled')`,
        [farmerId, values[1], next]);
    }
    return status === "completed" && next ? "Visit saved and follow-up scheduled." : "Visit saved.";
  });
}

export async function deleteVisit(id: string): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.editVisits);
    const row = await queryOne<{ farmer_id: string }>("SELECT farmer_id FROM visits WHERE id = $1", [id]);
    if (!row) throw new ValidationError("Visit not found.");
    await assertFarmerAccess(user, row.farmer_id);
    await query("DELETE FROM visits WHERE id = $1", [id]);
    return "Visit deleted.";
  });
}

// ================================================================== applications
export async function createApplication(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.createApplications);
    const farmerId = str(fd, "farmer_id", { required: true });
    await assertFarmerAccess(user, farmerId);
    const type = oneOf(fd, "type", ["loan", "insurance"] as const);
    const provider = str(fd, "provider", { required: true });
    const known = await queryOne("SELECT 1 FROM users WHERE role = 'bank_insurance' AND organization = $1", [provider]);
    if (!known) throw new ValidationError("Choose a partner institution from the list.");
    await query(
      `INSERT INTO applications (farmer_id, type, provider, amount_etb, purpose, submitted_by, risk_score_at_submission)
       VALUES ($1, $2, $3, $4, $5, $6, (SELECT overall_risk FROM latest_risk WHERE farmer_id = $1))`,
      [farmerId, type, provider, num(fd, "amount_etb", { required: true, min: 500, max: 10_000_000 }),
       str(fd, "purpose", { required: true, max: 300 }), user.id]);
    return "Application submitted to " + provider + ".";
  });
}

export async function reviewApplication(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.reviewApplications);
    const id = str(fd, "id", { required: true });
    const status = oneOf(fd, "status", ["pending", "reviewing", "approved", "rejected"] as const);
    const notes = str(fd, "decision_notes", { max: 1000 });
    if (status === "rejected" && !notes) throw new ValidationError("Give the farmer a reason when declining.");
    const app = await queryOne<{ provider: string; farmer_id: string; status: string }>(
      "SELECT provider, farmer_id, status FROM applications WHERE id = $1", [id]);
    if (!app) throw new ValidationError("Application not found.");
    if (user.role === "bank_insurance" && app.provider !== user.organization) throw new AuthError("This application belongs to another institution.");
    if (app.status === "completed") throw new ValidationError("This loan/policy is already closed and can't be re-reviewed.");
    const decided = status === "approved" || status === "rejected";
    await query(
      `UPDATE applications SET status=$1, decision_notes=$2, updated_at=NOW(),
              reviewed_at = CASE WHEN $3 THEN CURRENT_DATE ELSE NULL END,
              reviewed_by = CASE WHEN $3 THEN $4::uuid ELSE NULL END
        WHERE id=$5`, [status, notes, decided, user.id, id]);
    // Approved insurance / loans change the farmer's financial risk.
    await query("SELECT assess_farmer_risk($1, $2)", [app.farmer_id, user.id]);
    return { approved: "Application approved.", rejected: "Application declined.", reviewing: "Marked as under review.", pending: "Moved back to pending." }[status];
  });
}

/** Close an approved loan (fully repaid) or insurance policy (term ended). Clears the active debt. */
export async function completeApplication(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.reviewApplications);
    const id = str(fd, "id", { required: true });
    const notes = str(fd, "completion_notes", { max: 1000 });
    const app = await queryOne<{ provider: string; farmer_id: string; status: string; type: string; decision_notes: string }>(
      "SELECT provider, farmer_id, status, type, decision_notes FROM applications WHERE id = $1", [id]);
    if (!app) throw new ValidationError("Application not found.");
    if (user.role === "bank_insurance" && app.provider !== user.organization) throw new AuthError("This application belongs to another institution.");
    if (app.status !== "approved") throw new ValidationError("Only approved (active) loans and policies can be marked completed.");
    const fallback = app.type === "loan" ? "Loan repaid in full." : "Policy term ended.";
    await query(
      `UPDATE applications SET status='completed', completed_at=CURRENT_DATE, completed_by=$1, updated_at=NOW(),
              decision_notes = $2 WHERE id=$3`,
      [user.id, [app.decision_notes, notes || fallback].filter(Boolean).join(" · "), id]);
    // Repaying a loan removes the debt and adds to repayment history, lowering financial risk.
    await query("SELECT assess_farmer_risk($1, $2)", [app.farmer_id, user.id]);
    return app.type === "loan" ? "Loan marked as repaid. The farmer's debt has been cleared." : "Policy closed.";
  });
}

export async function deleteApplication(id: string): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.deleteApplications);
    const row = await queryOne<{ farmer_id: string }>("DELETE FROM applications WHERE id = $1 RETURNING farmer_id", [id]);
    if (row) await query("SELECT assess_farmer_risk($1, $2)", [row.farmer_id, user.id]);
    return "Application deleted.";
  });
}

// ================================================================== risk
export async function assessFarmer(farmerId: string): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.assessRisk);
    await assertFarmerAccess(user, farmerId);
    const r = await queryOne<{ overall_risk: number }>("SELECT (assess_farmer_risk($1, $2)).overall_risk", [farmerId, user.id]);
    return `Risk re-assessed: ${r?.overall_risk}/100.`;
  });
}

export async function assessAll(): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.assessRisk);
    const scope = regionScope(user);
    const rows = await query(
      "SELECT assess_farmer_risk(id, $1) FROM farmers WHERE $2::int IS NULL OR region_id = $2", [user.id, scope]);
    return `Re-assessed ${rows.length} farmers with the latest data.`;
  });
}

// ================================================================== regions
export async function updateRegionClimate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    await authorize(can.editRegions);
    const id = num(fd, "id", { required: true });
    await query(
      `UPDATE regions SET rainfall_mm=$1, rainfall_normal_mm=$2, ndvi=$3, climate_updated_at=NOW() WHERE id=$4`,
      [num(fd, "rainfall_mm", { required: true, min: 0, max: 3000 }),
       num(fd, "rainfall_normal_mm", { required: true, min: 1, max: 3000 }),
       num(fd, "ndvi", { required: true, min: 0, max: 1 }), id]);
    // Climate feeds the drought component of every farmer's risk in this region.
    await query("SELECT assess_farmer_risk(id) FROM farmers WHERE region_id = $1", [id]);
    return "Climate data updated and farmer risk re-scored.";
  });
}

// ================================================================== alerts
export async function createAlert(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await authorize(can.manageAlerts);
    await query(
      `INSERT INTO alerts (title, message, severity, type, region_id, created_by) VALUES ($1,$2,$3,$4,$5,$6)`,
      [str(fd, "title", { required: true, max: 120 }), str(fd, "message", { required: true, max: 600 }),
       oneOf(fd, "severity", ["info", "warning", "danger", "success"] as const),
       oneOf(fd, "type", ["drought", "disease", "weather", "system", "financial"] as const),
       num(fd, "region_id"), user.id]);
    return "Alert broadcast.";
  });
}

export async function deleteAlert(id: string): Promise<ActionState> {
  return run(async () => {
    await authorize(can.manageAlerts);
    await query("DELETE FROM alerts WHERE id = $1", [id]);
    return "Alert deleted.";
  });
}

export async function markAlertRead(id: string): Promise<ActionState> {
  return run(async () => {
    const user = await authorize();
    await query("INSERT INTO alert_reads (alert_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, user.id]);
  });
}

export async function markAllAlertsRead(): Promise<ActionState> {
  return run(async () => {
    const user = await authorize();
    await query(
      `INSERT INTO alert_reads (alert_id, user_id)
       SELECT id, $1 FROM alerts WHERE $2::int IS NULL OR region_id IS NULL OR region_id = $2
       ON CONFLICT DO NOTHING`, [user.id, user.role === "extension_worker" ? user.region_id : null]);
    return "All alerts marked as read.";
  });
}

// ================================================================== users
export async function saveUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const admin = await authorize(can.manageUsers);
    const id = str(fd, "id");
    const role = oneOf(fd, "role", ROLES);
    const email = str(fd, "email", { required: true, max: 120 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Enter a valid email address.");
    const password = str(fd, "password", { max: 100 });
    if ((!id || password) && password.length < 6) throw new ValidationError("Password must be at least 6 characters.");
    const regionId = num(fd, "region_id");
    if (role === "extension_worker" && !regionId) throw new ValidationError("Extension workers need an assigned region.");
    const status = oneOf(fd, "status", ["active", "inactive", "pending"] as const);
    if (id === admin.id && (status !== "active" || role !== "admin")) throw new ValidationError("You can't demote or deactivate your own account.");
    const values = [str(fd, "name", { required: true, max: 120 }), email, role,
      str(fd, "organization", { required: true, max: 120 }), regionId, str(fd, "phone", { max: 20 }) || null, status];
    if (id) {
      await query(
        `UPDATE users SET name=$1, email=$2, role=$3, organization=$4, region_id=$5, phone=$6, status=$7,
                password_hash = CASE WHEN $8 = '' THEN password_hash ELSE crypt($8, gen_salt('bf', 8)) END
          WHERE id=$9`, [...values, password, id]);
      if (status !== "active") await query("DELETE FROM sessions WHERE user_id = $1", [id]);
      return "User updated.";
    }
    await query(
      `INSERT INTO users (name, email, role, organization, region_id, phone, status, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7, crypt($8, gen_salt('bf', 8)))`, [...values, password]);
    return "User created.";
  });
}

// ================================================================== inquiries
export async function submitInquiry(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const email = str(fd, "email", { required: true, max: 120 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Enter a valid email address.");
    await query(
      "INSERT INTO inquiries (name, email, organization, interest, message) VALUES ($1,$2,$3,$4,$5)",
      [str(fd, "name", { required: true, max: 120 }), email, str(fd, "organization", { max: 160 }),
       oneOf(fd, "interest", ["pilot", "finance", "veterinary", "government", "general"] as const),
       str(fd, "message", { required: true, max: 3000 })]);
    revalidatePath("/dashboard/inquiries");
    return { ok: true, message: "Thanks — we'll be in touch within two business days." };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "We couldn't send your message right now. Please email partnerships@mobilevet.et." };
  }
}

export async function setInquiryStatus(id: string, status: "new" | "contacted" | "closed"): Promise<ActionState> {
  return run(async () => {
    await authorize(can.viewInquiries);
    if (!["new", "contacted", "closed"].includes(status)) throw new ValidationError("Invalid status.");
    await query("UPDATE inquiries SET status = $1 WHERE id = $2", [status, id]);
    return "Inquiry updated.";
  });
}
