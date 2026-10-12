// Generates db/init/02-seed.sql — realistic, internally consistent demo data.
// Deterministic (seeded PRNG) and date-relative (CURRENT_DATE - n), so the data
// always looks current whenever the database is initialised.
//
//   node scripts/generate-seed.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "init", "02-seed.sql");

// ---------- deterministic helpers ----------
let seed = 20261010;
function rand() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
function weighted(map) {
  const entries = Object.entries(map);
  let r = rand() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of entries) { if ((r -= w) <= 0) return k; }
  return entries[0][0];
}
let uuidN = 0;
const uuid = () => {
  const h = (++uuidN).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${h}`;
};
const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const day = (offset) => (offset === null ? "NULL" : offset === 0 ? "CURRENT_DATE" : offset < 0 ? `CURRENT_DATE - ${-offset}` : `CURRENT_DATE + ${offset}`);
const ts = (daysAgo, hours = 0) => `NOW() - INTERVAL '${daysAgo} days ${hours} hours'`;

// ---------- reference data ----------
const regions = [
  { id: 1, slug: "borena", name: "Borena", admin: "Oromia", code: "BOR", livelihood: "Pastoral",
    woredas: ["Dubluk", "Yabelo", "Moyale", "Dire", "Arero", "Teltele", "Dillo"],
    kebeles: ["Melbana", "Did Hara", "Haralo", "Bokola", "Tuqa", "Mega", "Dambi", "Hudat", "Kuku"],
    sites: ["Kalo enclosure", "Dry-season reserve", "Ela (deep well) watering point", "Homestead", "Communal rangeland"],
    rain: 35, normal: 110, ndvi: 0.14,
    species: { cattle: 45, goat: 28, sheep: 10, camel: 15, donkey: 2 } },
  { id: 2, slug: "guji", name: "Guji", admin: "Oromia", code: "GUJ", livelihood: "Agro-pastoral",
    woredas: ["Liben", "Gorodola", "Wadera", "Adola"],
    kebeles: ["Siminto", "Harawa", "Melka Soda", "Bidire", "Kiltu Sorsa"],
    sites: ["Homestead", "Communal rangeland", "Riverside grazing", "Crop-residue field"],
    rain: 210, normal: 240, ndvi: 0.44,
    species: { cattle: 55, goat: 22, sheep: 15, donkey: 8 } },
  { id: 3, slug: "afar-zone-1", name: "Afar Zone 1 (Awsi Rasu)", admin: "Afar", code: "AFR", livelihood: "Pastoral",
    woredas: ["Asaita", "Dubti", "Afambo", "Mille", "Chifra"],
    kebeles: ["Galifage", "Hinele", "Gurmudali", "Kurandi", "Sekoyta"],
    sites: ["Awash riverbank", "Dry-season reserve", "Borehole watering point", "Homestead", "Prosopis-cleared grazing"],
    rain: 62, normal: 150, ndvi: 0.19,
    species: { goat: 40, sheep: 18, cattle: 20, camel: 20, donkey: 2 } },
  { id: 4, slug: "afar-zone-3", name: "Afar Zone 3 (Gabi Rasu)", admin: "Afar", code: "AF3", livelihood: "Agro-pastoral",
    woredas: ["Amibara", "Awash Fentale", "Gewane", "Dulecha"],
    kebeles: ["Melka Werer", "Sabure", "Doho", "Hassoba", "Kada Bulo"],
    sites: ["Awash riverbank", "Irrigated pasture", "Homestead", "Communal rangeland"],
    rain: 120, normal: 170, ndvi: 0.27,
    species: { goat: 35, sheep: 20, cattle: 25, camel: 18, donkey: 2 } },
  { id: 5, slug: "shabelle", name: "Shabelle", admin: "Somali", code: "SHB", livelihood: "Pastoral",
    woredas: ["Gode", "Kelafo", "Mustahil", "Ferfer", "Adadle"],
    kebeles: ["Bursaredo", "Higlo", "Kudunbur", "Elale", "Dusmo"],
    sites: ["Shabelle riverbank", "Berkad (cistern) watering point", "Dry-season reserve", "Homestead"],
    rain: 22, normal: 60, ndvi: 0.18,
    species: { camel: 30, goat: 40, sheep: 20, cattle: 10 } },
  { id: 6, slug: "fafan", name: "Fafan", admin: "Somali", code: "FAF", livelihood: "Agro-pastoral",
    woredas: ["Jigjiga", "Kebribeyah", "Harshin", "Gursum", "Awbare"],
    kebeles: ["Karamara", "Lefe Isa", "Tuli Guled", "Koran", "Derwonaji"],
    sites: ["Homestead", "Communal rangeland", "Haffir dam watering point", "Crop-residue field"],
    rain: 170, normal: 190, ndvi: 0.39,
    species: { goat: 35, sheep: 30, cattle: 25, camel: 10 } },
  { id: 7, slug: "south-omo", name: "South Omo", admin: "South Ethiopia", code: "SOM", livelihood: "Agro-pastoral",
    woredas: ["Hamer", "Dasenech", "Nyangatom", "Bena Tsemay"],
    kebeles: ["Turmi", "Dimeka", "Omorate", "Kangaten", "Key Afer"],
    sites: ["Omo riverbank", "Communal rangeland", "Homestead", "Flood-recession pasture"],
    rain: 85, normal: 130, ndvi: 0.31,
    species: { cattle: 50, goat: 33, sheep: 15, donkey: 2 } },
];
const R = Object.fromEntries(regions.map((r) => [r.slug, r]));
const droughtIdx = (r) => Math.min(100, Math.max(0, Math.round(Math.max(0, (0.55 - r.ndvi) / 0.45) * 70 + Math.max(0, 1 - r.rain / r.normal) * 30)));

const breeds = {
  cattle: { borena: ["Boran"], guji: ["Guji zebu", "Boran"], "afar-zone-1": ["Afar (Danakil)"], "afar-zone-3": ["Afar (Danakil)", "Raya"],
    shabelle: ["Ogaden"], fafan: ["Ogaden", "Jijiga zebu"], "south-omo": ["Hamer zebu", "Mursi zebu"] },
  goat: { borena: ["Borana goat", "Somali goat"], guji: ["Woyto-Guji goat"], "afar-zone-1": ["Afar goat"], "afar-zone-3": ["Afar goat"],
    shabelle: ["Somali goat"], fafan: ["Somali goat"], "south-omo": ["Woyto-Guji goat"] },
  sheep: { borena: ["Blackhead Somali"], guji: ["Bonga", "Horro"], "afar-zone-1": ["Afar sheep"], "afar-zone-3": ["Afar sheep"],
    shabelle: ["Blackhead Somali"], fafan: ["Blackhead Somali"], "south-omo": ["Hamer sheep"] },
  camel: { borena: ["Borana camel"], "afar-zone-1": ["Afar camel"], "afar-zone-3": ["Afar camel"], shabelle: ["Somali camel (Hoor)"], fafan: ["Somali camel (Hoor)"] },
  donkey: { _: ["Abyssinian donkey"] },
};
const colors = {
  cattle: ["White", "Grey", "Red", "Brown", "Black & white", "Fawn"],
  goat: ["White", "Brown", "Black", "Spotted", "Tan"],
  sheep: ["White, black head", "Brown", "Tan", "White"],
  camel: ["Light brown", "Fawn", "Cream", "Dark brown"],
  donkey: ["Grey", "Brown", "Dark grey"],
};
// [min, max] adult live weight (kg) by species & sex
const weights = { cattle: { male: [300, 430], female: [240, 340] }, camel: { male: [420, 560], female: [360, 480] },
  goat: { male: [30, 45], female: [24, 36] }, sheep: { male: [28, 40], female: [22, 32] }, donkey: { male: [110, 150], female: [100, 135] } };
const maxAgeYears = { cattle: 12, camel: 18, goat: 7, sheep: 6, donkey: 15 };

const vaccines = {
  cattle: ["FMD (trivalent)", "Lumpy skin disease (Neethling)", "Anthrax spore", "Blackleg", "CBPP (T1/44)"],
  goat: ["PPR", "Sheep & goat pox", "CCPP", "Anthrax spore"],
  sheep: ["PPR", "Sheep & goat pox", "Pasteurellosis", "Anthrax spore"],
  camel: ["Camel pox", "Anthrax spore"],
  donkey: ["Anthrax spore", "Tetanus toxoid"],
};
const diseases = {
  cattle: [
    { dx: "Foot-and-mouth disease (FMD)", sx: "Fever, vesicles on tongue and feet, drooling, lameness", tx: "Oxytetracycline LA 20 mg/kg IM against secondary infection; antiseptic foot wash; movement restriction", sev: ["high", "moderate"], alert: "FMD" },
    { dx: "Lumpy skin disease", sx: "Firm skin nodules, fever, swollen prescapular lymph nodes, drop in milk", tx: "Penicillin-streptomycin 3 days for secondary infection; fly control; ring vaccination of in-contacts", sev: ["moderate", "high"] },
    { dx: "Bovine trypanosomiasis", sx: "Progressive weight loss, pale mucous membranes, intermittent fever", tx: "Diminazene aceturate 3.5 mg/kg deep IM; review in 14 days", sev: ["moderate"] },
    { dx: "Contagious bovine pleuropneumonia (CBPP)", sx: "Persistent cough, laboured breathing, extended neck, reluctance to move", tx: "Oxytetracycline 10 mg/kg for 5 days; isolate from herd; notify woreda vet office", sev: ["high", "emergency"] },
  ],
  goat: [
    { dx: "Peste des petits ruminants (PPR)", sx: "High fever, eye and nasal discharge, mouth erosions, diarrhoea", tx: "Oxytetracycline LA + oral rehydration; isolate; ring vaccination of in-contact flock", sev: ["high", "emergency"], alert: "PPR" },
    { dx: "Contagious caprine pleuropneumonia (CCPP)", sx: "Severe cough, laboured breathing, frothy nasal discharge", tx: "Tylosin 10 mg/kg IM for 5 days; isolate from flock", sev: ["high"] },
    { dx: "Sarcoptic mange", sx: "Hair loss, crusting around face and ears, intense itching", tx: "Ivermectin 0.2 mg/kg SC, repeat after 14 days", sev: ["moderate", "low"] },
    { dx: "Gastrointestinal parasites", sx: "Diarrhoea, bottle jaw, pale gums, poor body condition", tx: "Albendazole 7.5 mg/kg oral; pasture rotation advice", sev: ["low", "moderate"] },
  ],
  sheep: [
    { dx: "Sheep and goat pox", sx: "Fever, papules on hairless skin, nasal discharge", tx: "Supportive care, antibiotic cover; isolate; vaccinate in-contacts", sev: ["high", "moderate"] },
    { dx: "Peste des petits ruminants (PPR)", sx: "Fever, ocular-nasal discharge, oral lesions, diarrhoea", tx: "Oxytetracycline LA + oral rehydration; isolate", sev: ["high", "emergency"], alert: "PPR" },
    { dx: "Haemonchosis", sx: "Anaemia, bottle jaw, weakness, weight loss", tx: "Albendazole 7.5 mg/kg oral; FAMACHA follow-up", sev: ["moderate"] },
    { dx: "Ovine pasteurellosis", sx: "Fever, cough, nasal discharge, sudden deaths in flock", tx: "Oxytetracycline 10 mg/kg for 3 days", sev: ["moderate", "high"] },
  ],
  camel: [
    { dx: "Camel trypanosomiasis (surra)", sx: "Progressive emaciation, oedema of legs, fluctuating fever", tx: "Melarsomine (Cymelarsan) 0.25 mg/kg deep SC", sev: ["high", "moderate"] },
    { dx: "Camel pox", sx: "Pox lesions on lips, nostrils and udder, fever", tx: "Wound care and antibiotic cover; isolate young camels", sev: ["moderate"] },
    { dx: "Sarcoptic mange", sx: "Thickened skin, hair loss on neck and flanks, itching", tx: "Ivermectin 0.2 mg/kg SC, repeat after 14 days", sev: ["moderate", "low"] },
    { dx: "Camel respiratory disease complex", sx: "Cough, nasal discharge, fever, reduced feeding", tx: "Oxytetracycline LA 20 mg/kg IM", sev: ["moderate", "high"] },
  ],
  donkey: [
    { dx: "Harness and pack sores", sx: "Open wounds on back and withers", tx: "Wound cleaning, povidone-iodine, rest from work for 10 days", sev: ["low", "moderate"] },
    { dx: "Equine strangles", sx: "Fever, swollen submandibular lymph nodes, nasal discharge", tx: "Procaine penicillin 22,000 IU/kg IM for 5 days", sev: ["moderate"] },
  ],
};
const injuries = [
  { dx: "Acacia thorn puncture wound", sx: "Lameness, swelling at the sole", tx: "Thorn removed, wound flushed, topical oxytetracycline spray" },
  { dx: "Predator bite (hyena)", sx: "Lacerations on hindquarters", tx: "Wound debrided and sutured, penicillin-streptomycin 3 days, tetanus cover" },
  { dx: "Laceration from fence", sx: "Superficial skin wound on flank", tx: "Wound cleaned, fly repellent applied" },
];

const users = [
  { key: "admin", name: "Meron Tesfaye", email: "admin@mobilevet.et", role: "admin", org: "Mobile Vet HQ", phone: "+251911400100" },
  { key: "abebe", name: "Abebe Kebede", email: "abebe@mobilevet.et", role: "extension_worker", org: "Mobile Vet – Borena", region: "borena", phone: "+251916223411" },
  { key: "galgalo", name: "Galgalo Jarso", email: "galgalo@mobilevet.et", role: "extension_worker", org: "Mobile Vet – Borena", region: "borena", phone: "+251916550872" },
  { key: "gemechu", name: "Gemechu Dida", email: "gemechu@mobilevet.et", role: "extension_worker", org: "Mobile Vet – Guji", region: "guji", phone: "+251917334089" },
  { key: "fatima", name: "Fatima Ali", email: "fatima@mobilevet.et", role: "extension_worker", org: "Mobile Vet – Afar", region: "afar-zone-1", phone: "+251913778201" },
  { key: "yusuf", name: "Yusuf Hamadu", email: "yusuf@mobilevet.et", role: "extension_worker", org: "Mobile Vet – Afar", region: "afar-zone-3", phone: "+251913661945" },
  { key: "mohammed", name: "Mohammed Hussen", email: "mohammed@mobilevet.et", role: "extension_worker", org: "Mobile Vet – Somali", region: "shabelle", phone: "+251915092733" },
  { key: "hodan", name: "Hodan Abdi", email: "hodan@mobilevet.et", role: "extension_worker", org: "Mobile Vet – Somali", region: "fafan", phone: "+251915481106" },
  { key: "kalkidan", name: "Kalkidan Tesfaye", email: "kalkidan@mobilevet.et", role: "extension_worker", org: "Mobile Vet – South Omo", region: "south-omo", phone: "+251946127530" },
  { key: "lensa", name: "Lensa Bekele", email: "lensa@mobilevet.et", role: "extension_worker", org: "Mobile Vet – Guji", region: "guji", phone: "+251917902214", status: "pending" },
  { key: "dashen", name: "Hiwot Alemu", email: "loans@dashenbank.et", role: "bank_insurance", org: "Dashen Bank", phone: "+251115180000" },
  { key: "coop", name: "Tolera Negasa", email: "credit@coopbank.et", role: "bank_insurance", org: "Cooperative Bank of Oromia", phone: "+251115150229" },
  { key: "eic", name: "Bethlehem Assefa", email: "claims@ethiopiainsurance.et", role: "bank_insurance", org: "Ethiopian Insurance Corporation", phone: "+251115512400" },
  { key: "oic", name: "Dawit Gutema", email: "ibli@oromiainsurance.et", role: "bank_insurance", org: "Oromia Insurance Company", phone: "+251114700930", status: "inactive" },
  { key: "solomon", name: "Dr. Solomon Tadesse", email: "solomon@moaland.gov.et", role: "government", org: "Ministry of Agriculture", phone: "+251116462323" },
  { key: "amina", name: "Amina Yusuf", email: "amina@somali.gov.et", role: "government", org: "Somali Region Livestock & Pastoral Development Bureau", region: "shabelle", phone: "+251257752001" },
];
for (const u of users) u.id = uuid();
const U = Object.fromEntries(users.map((u) => [u.key, u]));
const workersFor = (slug) => users.filter((u) => u.role === "extension_worker" && u.region === slug && u.status !== "pending");

const farmerNames = {
  borena: [["Guyo Boru", "m"], ["Chaltu Waqo", "f"], ["Galgalo Dida", "m"], ["Gumato Jilo", "f"], ["Halake Wario", "m"], ["Jarso Dabasso", "m"], ["Darmi Liban", "f"], ["Boru Kanchora", "m"]],
  guji: [["Kebede Ganale", "m"], ["Dube Waqo", "m"], ["Shanko Uddessa", "f"], ["Bariso Adula", "m"]],
  "afar-zone-1": [["Ali Mohammed", "m"], ["Fatuma Hassan", "f"], ["Abdu Hamadu", "m"], ["Hassan Ahmed", "m"], ["Aisha Ibrahim", "f"], ["Mohammed Humed", "m"]],
  "afar-zone-3": [["Ahmed Kedir", "m"], ["Halima Ali", "f"], ["Ibrahim Yasin", "m"], ["Kedir Mohammed", "m"]],
  shabelle: [["Abdi Farah", "m"], ["Hawo Mohamed", "f"], ["Sahal Gedi", "m"], ["Ifrah Hassan", "f"], ["Abdirahman Yusuf", "m"], ["Mohamed Abdullahi", "m"]],
  fafan: [["Faadumo Ismail", "f"], ["Yasin Aden", "m"], ["Ayan Mohamed", "f"], ["Omar Sheikh", "m"]],
  "south-omo": [["Ayke Bona", "m"], ["Lalo Kara", "m"], ["Gelte Banki", "f"], ["Kerre Dore", "m"]],
};

// ---------- build rows ----------
const farmers = [];
const animals = [];
const records = [];
const visits = [];
const apps = [];
const tagSeq = {};

for (const r of regions) {
  const di = droughtIdx(r);
  const workers = workersFor(r.slug);
  for (const [name, g] of farmerNames[r.slug]) {
    const woreda = pick(r.woredas);
    const f = {
      id: uuid(), name, gender: g === "m" ? "male" : "female", region: r,
      phone: `+2519${pick(["1", "2", "3", "4", "7", "8"])}${String(int(0, 9999999)).padStart(7, "0")}`,
      woreda, kebele: pick(r.kebeles), household: int(4, 11), years: int(6, 35),
      registered: -int(60, 420), worker: workers.length ? pick(workers) : null,
    };
    farmers.push(f);

    // tagged animals for this household
    const n = int(4, 10);
    for (let i = 0; i < n; i++) {
      const species = weighted(r.species);
      const sex = chance(species === "cattle" || species === "camel" ? 0.7 : 0.65) ? "female" : "male";
      const ageYears = int(1, maxAgeYears[species]);
      const [lo, hi] = weights[species][sex];
      const growth = Math.min(1, 0.45 + ageYears * 0.18);
      const weight = Math.round((lo + rand() * (hi - lo)) * growth * 10) / 10;
      tagSeq[r.code] = (tagSeq[r.code] || 0) + 1;
      const status = weighted({
        healthy: 80, recovered: 8,
        sick: 4 + di * 0.14,
        deceased: di > 70 ? 3 : 1,
        missing: di > 70 ? 2 : 0.5,
      });
      const registered = Math.min(-1, f.registered + int(0, 30));
      const a = {
        id: uuid(), farmer: f, species, sex, status, registered,
        tag: `MV-${r.code}-${String(tagSeq[r.code]).padStart(5, "0")}`,
        rfid: `231${String(int(100000, 999999))}${String(int(100000, 999999))}`,
        breed: pick((breeds[species][r.slug] || breeds[species]._ || ["Local"])),
        birth: -(ageYears * 365 + int(0, 300)), color: pick(colors[species]), weight,
        location: `${f.woreda} – ${pick(r.sites)}`,
        lastSeen: status === "missing" ? -int(20, 60) : status === "deceased" ? -int(10, 90) : -int(0, 12),
      };
      animals.push(a);

      // vaccination history (last 12 months)
      const nv = chance(0.75) ? int(1, 2) : 0;
      const used = new Set();
      for (let k = 0; k < nv; k++) {
        const v = pick(vaccines[species]);
        if (used.has(v)) continue; used.add(v);
        records.push({ animal: a, by: f.worker, date: -int(15, 330), type: "vaccination",
          sx: "None — routine vaccination", dx: `Preventive: ${v}`, tx: `${v} vaccine, single dose`,
          notes: "Part of woreda vaccination campaign.", sev: "low", fu: null });
      }
      if (chance(0.35)) {
        const drug = species === "cattle" || species === "camel" ? "Ivermectin 1% injectable, 0.2 mg/kg SC" : "Albendazole 2.5% oral drench, 7.5 mg/kg";
        records.push({ animal: a, by: f.worker, date: -int(10, 200), type: "deworming", sx: "Routine strategic deworming",
          dx: "Parasite control", tx: drug, notes: "", sev: "low", fu: null });
      }
      if (chance(0.25)) {
        records.push({ animal: a, by: f.worker, date: -int(5, 150), type: "checkup", sx: "None observed",
          dx: `Body condition score ${pick(["2.5", "3", "3", "3.5"])}/5 — no clinical signs`, tx: "None required",
          notes: di > 60 ? "Body condition declining with pasture scarcity." : "", sev: "low", fu: null });
      }
      // clinical history consistent with current status
      if (status === "sick" || status === "recovered" || status === "deceased") {
        const d = pick(diseases[species]);
        const sev = status === "deceased" ? "emergency" : pick(d.sev);
        const date = status === "sick" ? -int(1, 25) : status === "deceased" ? a.lastSeen - int(1, 4) : -int(30, 110);
        const fu = status === "sick" ? int(-4, 10) : null;   // some follow-ups overdue
        records.push({ animal: a, by: f.worker, date, type: "disease", sx: d.sx, dx: d.dx, tx: d.tx, sev, fu, alert: d.alert,
          notes: status === "deceased" ? "Animal died despite treatment; carcass disposed of by burial. Herd placed under observation." :
                 status === "recovered" ? "Full recovery confirmed at follow-up." : "Isolated from herd. Owner advised on daily monitoring." });
        if (status === "sick" && chance(0.4)) {
          records.push({ animal: a, by: f.worker, date: date + int(1, Math.max(1, -date)), type: "treatment", sx: "Under treatment — reduced fever",
            dx: `${d.dx} (follow-up)`, tx: "Continued course; supportive care", notes: "", sev: "moderate", fu: null });
        }
      } else if (chance(0.06)) {
        const inj = pick(injuries);
        records.push({ animal: a, by: f.worker, date: -int(5, 120), type: "injury", sx: inj.sx, dx: inj.dx, tx: inj.tx,
          notes: "Healed well.", sev: pick(["low", "moderate"]), fu: null });
      }
    }

    // visits: completed history + some scheduled
    const herd = animals.filter((x) => x.farmer === f);
    const sickN = herd.filter((x) => x.status === "sick").length;
    const nVisits = int(1, 3);
    let last = f.registered;
    for (let k = 0; k < nVisits; k++) {
      const date = Math.min(-2, last + int(20, 90));
      if (date >= -2 && k > 0) break;
      last = date;
      const purpose = k === 0 ? "RFID ear-tag registration and baseline herd census"
        : sickN > 0 ? "Follow-up on sick animals and treatment compliance"
        : di > 60 ? "Drought preparedness and water-point assessment"
        : pick(["Routine herd health check", "Vaccination campaign", "Body condition scoring and feed advice"]);
      visits.push({ farmer: f, worker: f.worker, date, purpose, status: chance(0.08) ? "cancelled" : "completed",
        obs: k === 0 ? `${herd.length} animals tagged and registered. Owner trained on SMS/USSD alerts.`
          : sickN > 0 ? `${sickN} animal(s) showing clinical signs. Others in fair condition.`
          : di > 60 ? "Pasture severely depleted; nearest reliable water is over 15 km away. Animals losing condition."
          : "Herd in good condition. No clinical signs observed.",
        rec: sickN > 0 ? "Keep sick animals isolated, complete the treatment course and report new cases via USSD *8070#."
          : di > 60 ? "Move the herd toward the dry-season reserve, prioritise water for lactating females and consider selling mature males early."
          : "Continue current practices; next routine check in 60 days.",
        next: null });
    }
    if (chance(0.55) && f.worker) {
      visits.push({ farmer: f, worker: f.worker, date: int(1, 21), status: "scheduled", obs: "", rec: "", next: null,
        purpose: sickN > 0 ? "Treatment follow-up" : pick(["Routine herd health check", "Loan verification: herd count and condition", "Insurance enrolment and herd valuation", "Vaccination campaign"]) });
    }
    const completed = visits.filter((v) => v.farmer === f && v.status === "completed");
    const scheduled = visits.find((v) => v.farmer === f && v.status === "scheduled");
    if (completed.length) completed[completed.length - 1].next = scheduled ? scheduled.date : int(14, 60);

    // loan / insurance applications (credit history over ~1 year)
    const oromia = r.admin === "Oromia";
    const loanProviders = oromia ? ["Dashen Bank", "Cooperative Bank of Oromia"] : ["Dashen Bank"];
    const insProviders = oromia ? ["Ethiopian Insurance Corporation", "Oromia Insurance Company"] : ["Ethiopian Insurance Corporation"];
    const purposeFor = (type) => type === "loan"
      ? pick([`Restocking ${int(2, 5)} breeding heifers after drought losses`, "Small-ruminant fattening for the Arafa (Eid) market",
          "Feed and water trucking through the dry season", "Milk collection cans and cooling for the cooperative", "Camel milk marketing start-up"])
      : pick([`Index-based livestock insurance (IBLI) — ${int(4, 15)} TLU`, "Comprehensive herd cover against disease mortality",
          "Drought index cover for camels and cattle"]);
    const addApp = (type, provider, status, submitted) => {
      const reviewer = users.find((u) => u.org === provider);
      const decided = ["approved", "rejected", "completed"].includes(status);
      const reviewed = decided ? submitted + int(3, Math.min(30, -submitted - 1)) : null;
      const completed = status === "completed" ? Math.min(-1, reviewed + int(90, 240)) : null;
      apps.push({ farmer: f, type, provider, status, submitted, by: f.worker, purpose: purposeFor(type),
        amount: type === "loan" ? int(6, 50) * 5000 : int(8, 60) * 5000,
        reviewed, completed, reviewer: decided && reviewer ? reviewer : null,
        notes: status === "completed" ? (type === "loan" ? "Loan repaid in full after the livestock sales season." : "Policy term ended; no claim outstanding.")
          : status === "approved" ? (type === "loan" ? "Approved. Herd verified on field visit; repayment aligned to sales season." : "Policy issued. Premium partially subsidised under the pastoral resilience programme.")
          : status === "rejected" ? (type === "loan" ? "Declined: current herd value does not cover requested amount. Reapply with a smaller amount or a guarantor." : "Declined: active disease outbreak in herd. Reapply 90 days after a clean health check.")
          : status === "reviewing" ? "Awaiting field verification visit report." : "" });
    };
    const nApps = Number(weighted({ 0: 25, 1: 45, 2: 30 }));
    for (let k = 0; k < nApps; k++) {
      const type = k === 0 ? (chance(0.5) ? "insurance" : "loan") : apps.at(-1).type === "loan" ? "insurance" : "loan";
      const status = weighted(type === "loan"
        ? { approved: 32, completed: 18, rejected: 12, reviewing: 16, pending: 22 }
        : { approved: 45, completed: 8, rejected: 12, reviewing: 15, pending: 20 });
      // completed records are older; open requests are recent
      const submitted = status === "completed" ? -int(200, 360) : status === "pending" ? -int(2, 40) : -int(15, 180);
      addApp(type, pick(type === "loan" ? loanProviders : insProviders), status, submitted);
    }
    // Repeat borrowers: some farmers with an outstanding loan ask another bank for more credit,
    // so reviewers see the existing debt when deciding.
    const active = apps.find((a) => a.farmer === f && a.type === "loan" && a.status === "approved");
    if (active && chance(0.6)) {
      const other = loanProviders.find((p) => p !== active.provider) ?? active.provider;
      addApp("loan", other, chance(0.6) ? "pending" : "reviewing", -int(2, 20));
    }
  }
}

// ---------- emit SQL ----------
const out = [];
out.push("-- Generated by scripts/generate-seed.mjs — do not edit by hand.");
out.push("-- All demo accounts use the password: demo123\n");
out.push("BEGIN;\n");

out.push("INSERT INTO regions (id, slug, name, admin_region, woredas, livelihood, rainfall_mm, rainfall_normal_mm, ndvi, climate_updated_at) VALUES");
out.push(regions.map((r) => `  (${r.id}, ${q(r.slug)}, ${q(r.name)}, ${q(r.admin)}, ARRAY[${r.woredas.map(q).join(", ")}], ${q(r.livelihood)}, ${r.rain}, ${r.normal}, ${r.ndvi}, ${ts(int(1, 6))})`).join(",\n") + ";");
out.push(`SELECT setval('regions_id_seq', ${regions.length});\n`);

out.push("INSERT INTO users (id, name, email, password_hash, role, organization, region_id, phone, status, last_login_at, created_at) VALUES");
out.push(users.map((u) => `  (${q(u.id)}, ${q(u.name)}, ${q(u.email)}, crypt('demo123', gen_salt('bf', 8)), ${q(u.role)}, ${q(u.org)}, ${u.region ? R[u.region].id : "NULL"}, ${q(u.phone)}, ${q(u.status || "active")}, ${u.status ? "NULL" : ts(int(0, 9), int(1, 20))}, ${ts(int(200, 400))})`).join(",\n") + ";\n");

out.push("INSERT INTO farmers (id, full_name, gender, phone, region_id, woreda, kebele, household_size, years_herding, registered_at, extension_worker_id, notes) VALUES");
out.push(farmers.map((f) => {
  const herd = animals.filter((a) => a.farmer === f);
  const lost = herd.filter((a) => a.status === "deceased" || a.status === "missing").length;
  const note = lost ? `Lost ${lost} tagged animal(s) this season. Household depends on livestock for most of its income.`
    : droughtIdx(f.region) > 60 ? "Herd under drought stress; family has started moving animals toward the dry-season reserve."
    : "Stable household. Active member of the local pastoral cooperative.";
  return `  (${q(f.id)}, ${q(f.name)}, ${q(f.gender)}, ${q(f.phone)}, ${f.region.id}, ${q(f.woreda)}, ${q(f.kebele)}, ${f.household}, ${f.years}, ${day(f.registered)}, ${f.worker ? q(f.worker.id) : "NULL"}, ${q(note)})`;
}).join(",\n") + ";\n");

out.push("INSERT INTO animals (id, farmer_id, tag_number, rfid, species, breed, sex, birth_date, color, weight_kg, health_status, location, last_seen, registered_at) VALUES");
out.push(animals.map((a) => `  (${q(a.id)}, ${q(a.farmer.id)}, ${q(a.tag)}, ${q(a.rfid)}, ${q(a.species)}, ${q(a.breed)}, ${q(a.sex)}, ${day(a.birth)}, ${q(a.color)}, ${a.weight}, ${q(a.status)}, ${q(a.location)}, ${day(a.lastSeen)}, ${day(a.registered)})`).join(",\n") + ";\n");

out.push("INSERT INTO health_records (animal_id, recorded_by, record_date, type, symptoms, diagnosis, treatment, notes, severity, follow_up_date) VALUES");
out.push(records.map((h) => `  (${q(h.animal.id)}, ${h.by ? q(h.by.id) : "NULL"}, ${day(Math.max(h.date, h.animal.registered))}, ${q(h.type)}, ${q(h.sx)}, ${q(h.dx)}, ${q(h.tx)}, ${q(h.notes)}, ${q(h.sev)}, ${h.fu === null ? "NULL" : day(h.fu)})`).join(",\n") + ";\n");

out.push("INSERT INTO visits (farmer_id, extension_worker_id, visit_date, purpose, observations, recommendations, next_visit_date, status) VALUES");
out.push(visits.map((v) => `  (${q(v.farmer.id)}, ${v.worker ? q(v.worker.id) : "NULL"}, ${day(v.date)}, ${q(v.purpose)}, ${q(v.obs)}, ${q(v.rec)}, ${v.next === null ? "NULL" : day(v.next)}, ${q(v.status)})`).join(",\n") + ";\n");

out.push("INSERT INTO applications (farmer_id, type, provider, amount_etb, purpose, status, submitted_at, submitted_by, reviewed_at, reviewed_by, completed_at, completed_by, decision_notes) VALUES");
out.push(apps.map((a) => `  (${q(a.farmer.id)}, ${q(a.type)}, ${q(a.provider)}, ${a.amount}, ${q(a.purpose)}, ${q(a.status)}, ${day(a.submitted)}, ${a.by ? q(a.by.id) : "NULL"}, ${a.reviewed === null ? "NULL" : day(a.reviewed)}, ${a.reviewer ? q(a.reviewer.id) : "NULL"}, ${a.completed === null ? "NULL" : day(a.completed)}, ${a.completed !== null && a.reviewer ? q(a.reviewer.id) : "NULL"}, ${q(a.notes)})`).join(",\n") + ";\n");

// alerts — consistent with the generated health picture
const outbreak = (regionSlug, tag) => records.some((h) => h.alert === tag && h.animal.farmer.region.slug === regionSlug && h.date > -45);
const alerts = [
  { t: "Drought emergency: Borena", m: "NDVI has fallen to 0.14 and 90-day rainfall is 32% of normal. Activate destocking and water-trucking plans; prioritise lactating females and calves.", s: "danger", ty: "drought", r: "borena", d: 1 },
  { t: "Rainfall deficit: Shabelle", m: "Gode and Kelafo received 37% of normal rainfall. Berkads are drying; expect pressure on Shabelle riverbank grazing.", s: "danger", ty: "drought", r: "shabelle", d: 3 },
  { t: "Gode market prices down 18%", m: "Goat and sheep prices at Gode market fell 18% in two weeks as households destock. Advise delaying sales of young stock where possible.", s: "warning", ty: "financial", r: "shabelle", d: 5 },
  { t: "Below-normal kiremt: Afar Zone 1", m: "Seasonal rainfall at 41% of normal around Asaita and Dubti. Monitor body condition and water points closely.", s: "warning", ty: "drought", r: "afar-zone-1", d: 8 },
  outbreak("afar-zone-1", "PPR") || outbreak("shabelle", "PPR")
    ? { t: "PPR cases confirmed", m: "Peste des petits ruminants confirmed in small ruminants. Isolate affected flocks and request ring vaccination through the woreda vet office.", s: "danger", ty: "disease", r: outbreak("afar-zone-1", "PPR") ? "afar-zone-1" : "shabelle", d: 2 }
    : { t: "PPR risk elevated", m: "PPR reported in neighbouring woredas. Ensure small ruminants are vaccinated before the Deyr season.", s: "warning", ty: "disease", r: "afar-zone-1", d: 2 },
  { t: "FMD reported near Moyale", m: "Foot-and-mouth disease suspected in cattle around Moyale. Avoid shared watering points with unvaccinated herds.", s: "warning", ty: "disease", r: "borena", d: 6 },
  { t: "Trypanosomiasis season: Guji", m: "Tsetse activity rises with the Ganna rains along river grazing. Watch cattle for weight loss and pale gums.", s: "warning", ty: "disease", r: "guji", d: 10 },
  { t: "Omo river flood watch", m: "Upstream rainfall may raise the Omo river within 5 days. Move herds away from low riverbank grazing near Omorate.", s: "warning", ty: "weather", r: "south-omo", d: 4 },
  { t: "Deyr rains on track: Fafan", m: "Rainfall at 89% of normal and vegetation recovering around Jigjiga and Kebribeyah.", s: "success", ty: "weather", r: "fafan", d: 7 },
  { t: "National PPR & pox vaccination campaign", m: "Free PPR and sheep & goat pox vaccination runs for 3 weeks from next Monday. Extension workers: confirm flock lists by Friday.", s: "info", ty: "system", r: null, d: 2 },
  { t: "IBLI sales window open", m: "Index-based livestock insurance can be purchased until the end of the month for the coming season.", s: "info", ty: "financial", r: null, d: 9 },
];
out.push("INSERT INTO alerts (title, message, severity, type, region_id, created_by, created_at) VALUES");
out.push(alerts.map((a) => `  (${q(a.t)}, ${q(a.m)}, ${q(a.s)}, ${q(a.ty)}, ${a.r ? R[a.r].id : "NULL"}, ${q(a.ty === "financial" || a.ty === "system" ? U.admin.id : U.solomon.id)}, ${ts(a.d, int(1, 12))})`).join(",\n") + ";\n");
out.push(`-- Older alerts are already read by the admin account\nINSERT INTO alert_reads (alert_id, user_id) SELECT id, ${q(U.admin.id)} FROM alerts WHERE created_at < NOW() - INTERVAL '6 days';\n`);

out.push("INSERT INTO inquiries (name, email, organization, interest, message, status, created_at) VALUES");
out.push([
  ["Tsegaye Mulatu", "tsegaye@borena-coop.example", "Borena Pastoral Cooperative Union", "pilot", "We represent 40 primary cooperatives in Borena and would like to discuss tagging members' breeding stock before the Deyr season.", "new", 1],
  ["Nasra Abdillahi", "nasra@hornagrifinance.example", "Horn Agri-Finance", "finance", "Interested in using Mobile Vet herd and risk data to underwrite small-ruminant fattening loans in Fafan.", "contacted", 6],
  ["Dr. Yonas Haile", "yonas.haile@vetclinic.example", "Yabelo Veterinary Clinic", "veterinary", "Can private clinics log treatments in the platform? We see many referred cases from Dubluk and Dire.", "new", 2],
  ["Martha Gebre", "martha@resilience-ngo.example", "Pastoral Resilience Initiative", "government", "Exploring a partnership for early-warning SMS in South Omo. Please share pricing for 2,000 households.", "closed", 21],
].map(([n, e, o, i, m, s, d]) => `  (${q(n)}, ${q(e)}, ${q(o)}, ${q(i)}, ${q(m)}, ${q(s)}, ${ts(d, 3)})`).join(",\n") + ";\n");

out.push("-- Score every farmer with the risk model, then snapshot the score on their applications");
out.push(`SELECT assess_farmer_risk(id, ${q(U.admin.id)}) FROM farmers;`);
out.push("-- (older applications drift a few points from today's score, as risk changes over time)");
out.push("UPDATE applications a SET risk_score_at_submission = clamp100(lr.overall_risk + CASE WHEN a.submitted_at < CURRENT_DATE - 30 THEN (abs(hashtext(a.id::text)) % 15) - 7 ELSE 0 END) FROM latest_risk lr WHERE lr.farmer_id = a.farmer_id;\n");
out.push("COMMIT;");

writeFileSync(OUT, out.join("\n") + "\n");
console.log(`Wrote ${OUT}\n  ${regions.length} regions, ${users.length} users, ${farmers.length} farmers, ${animals.length} animals, ${records.length} health records, ${visits.length} visits, ${apps.length} applications, ${alerts.length} alerts`);
