// Field sets for each entity's create/edit form. Rendered inside <FormDialog>.
import { Field, RegionWoredaFields } from "./client";
import { todayISO } from "@/lib/utils";
import type {
  Animal, AnimalOption, Farmer, FarmerOption, HealthRecord, RegionOption, SessionUser, User, Visit,
} from "@/lib/types";

const opt = (values: string[]) => values.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>);

export function FarmerFields({ farmer, regions, workers, user }: {
  farmer?: Farmer; regions: RegionOption[]; workers: { id: string; name: string; region_id: number | null }[]; user: SessionUser;
}) {
  const lock = user.role === "extension_worker";
  return (
    <>
      {farmer && <input type="hidden" name="id" value={farmer.id} />}
      <Field label="Full name"><input name="full_name" required defaultValue={farmer?.full_name} className="input" placeholder="e.g. Guyo Boru" /></Field>
      <Field label="Gender">
        <select name="gender" required defaultValue={farmer?.gender ?? ""} className="input"><option value="">Select…</option>{opt(["male", "female"])}</select>
      </Field>
      <Field label="Phone (for SMS / USSD alerts)"><input name="phone" required defaultValue={farmer?.phone} className="input" placeholder="+251911234567" /></Field>
      <Field label="Kebele"><input name="kebele" required defaultValue={farmer?.kebele} className="input" placeholder="e.g. Melbana" /></Field>
      <RegionWoredaFields regions={regions} defaultRegion={farmer?.region_id ?? (lock ? user.region_id : null)} defaultWoreda={farmer?.woreda} lockRegion={lock} />
      <Field label="Household size"><input name="household_size" type="number" min={1} max={40} required defaultValue={farmer?.household_size ?? 5} className="input" /></Field>
      <Field label="Years herding"><input name="years_herding" type="number" min={0} max={80} required defaultValue={farmer?.years_herding ?? 10} className="input" /></Field>
      <Field label="Extension worker" full>
        <select name="extension_worker_id" defaultValue={farmer?.extension_worker_id ?? (lock ? user.id : "")} className="input">
          <option value="">Unassigned</option>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}{w.region_id ? ` — ${regions.find((r) => r.id === w.region_id)?.name ?? ""}` : ""}</option>)}
        </select>
      </Field>
      <Field label="Notes" full><textarea name="notes" rows={3} defaultValue={farmer?.notes} className="input resize-none" placeholder="Household situation, needs, observations…" /></Field>
    </>
  );
}

export function AnimalFields({ animal, farmers, farmerId }: { animal?: Animal; farmers: FarmerOption[]; farmerId?: string }) {
  return (
    <>
      {animal && <input type="hidden" name="id" value={animal.id} />}
      <Field label="Owner (farmer)" full>
        <select name="farmer_id" required defaultValue={animal?.farmer_id ?? farmerId ?? ""} className="input">
          <option value="">Select farmer…</option>
          {farmers.map((f) => <option key={f.id} value={f.id}>{f.full_name} · {f.code} · {f.region_name}</option>)}
        </select>
      </Field>
      <Field label="Ear-tag number"><input name="tag_number" required defaultValue={animal?.tag_number} className="input font-mono uppercase" placeholder="MV-BOR-00123" /></Field>
      <Field label="RFID (15 digits)"><input name="rfid" required defaultValue={animal?.rfid} className="input font-mono" placeholder="231004512398765" /></Field>
      <Field label="Species">
        <select name="species" required defaultValue={animal?.species ?? ""} className="input"><option value="">Select…</option>{opt(["cattle", "goat", "sheep", "camel", "donkey"])}</select>
      </Field>
      <Field label="Breed"><input name="breed" required defaultValue={animal?.breed} className="input" placeholder="e.g. Boran" /></Field>
      <Field label="Sex">
        <select name="sex" required defaultValue={animal?.sex ?? ""} className="input"><option value="">Select…</option>{opt(["female", "male"])}</select>
      </Field>
      <Field label="Birth date (approx.)"><input name="birth_date" type="date" max={todayISO()} defaultValue={animal?.birth_date ?? ""} className="input" /></Field>
      <Field label="Colour"><input name="color" defaultValue={animal?.color} className="input" placeholder="e.g. Grey" /></Field>
      <Field label="Weight (kg)"><input name="weight_kg" type="number" step="0.1" min={1} required defaultValue={animal?.weight_kg} className="input" /></Field>
      <Field label="Health status">
        <select name="health_status" required defaultValue={animal?.health_status ?? "healthy"} className="input">{opt(["healthy", "sick", "recovered", "missing", "deceased"])}</select>
      </Field>
      <Field label="Last seen"><input name="last_seen" type="date" max={todayISO()} defaultValue={animal?.last_seen ?? todayISO()} className="input" /></Field>
      <Field label="Location" full><input name="location" defaultValue={animal?.location} className="input" placeholder="Woreda – grazing site / watering point" /></Field>
    </>
  );
}

export function HealthFields({ record, animals, animalId }: { record?: HealthRecord; animals: AnimalOption[]; animalId?: string }) {
  return (
    <>
      {record && <input type="hidden" name="id" value={record.id} />}
      <Field label="Animal" full>
        <select name="animal_id" required defaultValue={record?.animal_id ?? animalId ?? ""} className="input">
          <option value="">Select animal…</option>
          {animals.map((a) => <option key={a.id} value={a.id}>{a.tag_number} · {a.species} · {a.farmer_name}{a.health_status === "sick" ? " (sick)" : ""}</option>)}
        </select>
      </Field>
      <Field label="Date"><input name="record_date" type="date" required max={todayISO()} defaultValue={record?.record_date ?? todayISO()} className="input" /></Field>
      <Field label="Type">
        <select name="type" required defaultValue={record?.type ?? ""} className="input"><option value="">Select…</option>{opt(["disease", "treatment", "vaccination", "deworming", "checkup", "injury"])}</select>
      </Field>
      <Field label="Diagnosis / vaccine" full><input name="diagnosis" required defaultValue={record?.diagnosis} className="input" placeholder="e.g. Peste des petits ruminants (PPR)" /></Field>
      <Field label="Symptoms" full><textarea name="symptoms" rows={2} defaultValue={record?.symptoms} className="input resize-none" placeholder="Clinical signs observed" /></Field>
      <Field label="Treatment given" full><textarea name="treatment" rows={2} defaultValue={record?.treatment} className="input resize-none" placeholder="Drug, dose and route" /></Field>
      <Field label="Severity">
        <select name="severity" required defaultValue={record?.severity ?? "low"} className="input">{opt(["low", "moderate", "high", "emergency"])}</select>
      </Field>
      <Field label="Follow-up date"><input name="follow_up_date" type="date" defaultValue={record?.follow_up_date ?? ""} className="input" /></Field>
      <Field label="Update animal status" hint="Optional — also changes the animal's record." full>
        <select name="animal_status" defaultValue="" className="input">
          <option value="">Leave unchanged</option>
          {opt(["healthy", "sick", "recovered", "deceased"])}
        </select>
      </Field>
      <Field label="Notes" full><textarea name="notes" rows={2} defaultValue={record?.notes} className="input resize-none" /></Field>
    </>
  );
}

export function VisitFields({ visit, farmers, farmerId, workers, user }: {
  visit?: Visit; farmers: FarmerOption[]; farmerId?: string; workers: { id: string; name: string }[]; user: SessionUser;
}) {
  return (
    <>
      {visit && <input type="hidden" name="id" value={visit.id} />}
      <Field label="Farmer" full>
        <select name="farmer_id" required defaultValue={visit?.farmer_id ?? farmerId ?? ""} className="input">
          <option value="">Select farmer…</option>
          {farmers.map((f) => <option key={f.id} value={f.id}>{f.full_name} · {f.code} · {f.region_name}</option>)}
        </select>
      </Field>
      <Field label="Visit date"><input name="visit_date" type="date" required defaultValue={visit?.visit_date ?? todayISO()} className="input" /></Field>
      <Field label="Status">
        <select name="status" required defaultValue={visit?.status ?? "scheduled"} className="input">{opt(["scheduled", "completed", "cancelled"])}</select>
      </Field>
      <Field label="Extension worker">
        <select name="extension_worker_id" defaultValue={visit?.extension_worker_id ?? user.id} className="input">
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          {!workers.some((w) => w.id === user.id) && <option value={user.id}>{user.name} (me)</option>}
        </select>
      </Field>
      <Field label="Next visit" hint="Completing a visit with a next date books the follow-up automatically.">
        <input name="next_visit_date" type="date" defaultValue={visit?.next_visit_date ?? ""} className="input" />
      </Field>
      <Field label="Purpose" full><input name="purpose" required defaultValue={visit?.purpose} className="input" placeholder="e.g. Routine herd health check" /></Field>
      <Field label="Observations" full hint="Required when marking a visit completed."><textarea name="observations" rows={3} defaultValue={visit?.observations} className="input resize-none" /></Field>
      <Field label="Recommendations" full><textarea name="recommendations" rows={2} defaultValue={visit?.recommendations} className="input resize-none" /></Field>
    </>
  );
}

export function ApplicationFields({ farmers, farmerId, providers }: {
  farmers: FarmerOption[]; farmerId?: string; providers: { organization: string; kind: string }[];
}) {
  return (
    <>
      <Field label="Farmer" full>
        <select name="farmer_id" required defaultValue={farmerId ?? ""} className="input">
          <option value="">Select farmer…</option>
          {farmers.map((f) => <option key={f.id} value={f.id}>{f.full_name} · {f.code} · {f.region_name}</option>)}
        </select>
      </Field>
      <Field label="Product">
        <select name="type" required defaultValue="" className="input"><option value="">Select…</option><option value="loan">Loan</option><option value="insurance">Insurance</option></select>
      </Field>
      <Field label="Institution">
        <select name="provider" required defaultValue="" className="input">
          <option value="">Select…</option>
          {providers.map((p) => <option key={p.organization} value={p.organization}>{p.organization} ({p.kind})</option>)}
        </select>
      </Field>
      <Field label="Amount (ETB)" hint="Loan principal, or sum insured."><input name="amount_etb" type="number" min={500} step={100} required className="input" placeholder="50000" /></Field>
      <Field label="Purpose" full><textarea name="purpose" rows={2} required className="input resize-none" placeholder="e.g. Restocking 3 breeding heifers after drought losses" /></Field>
    </>
  );
}

export function UserFields({ u, regions }: { u?: User; regions: RegionOption[] }) {
  return (
    <>
      {u && <input type="hidden" name="id" value={u.id} />}
      <Field label="Full name"><input name="name" required defaultValue={u?.name} className="input" /></Field>
      <Field label="Email"><input name="email" type="email" required defaultValue={u?.email} className="input" /></Field>
      <Field label="Role">
        <select name="role" required defaultValue={u?.role ?? "extension_worker"} className="input">
          <option value="extension_worker">Extension worker</option>
          <option value="bank_insurance">Bank / insurance</option>
          <option value="government">Government</option>
          <option value="admin">Administrator</option>
        </select>
      </Field>
      <Field label="Organisation" hint="Banks/insurers: must match the provider name on applications."><input name="organization" required defaultValue={u?.organization} className="input" /></Field>
      <Field label="Assigned region" hint="Required for extension workers.">
        <select name="region_id" defaultValue={u?.region_id ?? ""} className="input">
          <option value="">None (national)</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </Field>
      <Field label="Phone"><input name="phone" defaultValue={u?.phone ?? ""} className="input" /></Field>
      <Field label="Status">
        <select name="status" defaultValue={u?.status ?? "active"} className="input">{opt(["active", "pending", "inactive"])}</select>
      </Field>
      <Field label={u ? "New password" : "Password"} hint={u ? "Leave blank to keep the current password." : "At least 6 characters."}>
        <input name="password" type="password" required={!u} minLength={6} autoComplete="new-password" className="input" />
      </Field>
    </>
  );
}
