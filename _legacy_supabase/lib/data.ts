export type UserRole = "extension_worker" | "bank_insurance" | "admin" | "government";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  avatar?: string;
}

export interface Farmer {
  id: string;
  fullName: string;
  phone: string;
  region: string;
  zone: string;
  kebele: string;
  householdSize: number;
  yearsFarming: number;
  registeredAt: string;
  extensionWorkerId: string;
  livestockCount: number;
  riskScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  hasInsurance: boolean;
  hasLoan: boolean;
  notes: string;
}

export interface Animal {
  id: string;
  farmerId: string;
  tagNumber: string;
  rfidId: string;
  species: "cattle" | "goat" | "sheep" | "camel" | "donkey";
  breed: string;
  gender: "male" | "female";
  birthDate: string;
  color: string;
  weight: number; // kg
  healthStatus: "healthy" | "sick" | "recovered" | "deceased" | "missing";
  location: string;
  lastSeen: string;
  vaccinationHistory: string[];
  registeredAt: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  farmerId: string;
  recordedBy: string;
  date: string;
  type: "vaccination" | "treatment" | "checkup" | "disease" | "deworming" | "injury";
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  severity: "low" | "moderate" | "high" | "emergency";
  followUpRequired: boolean;
  followUpDate?: string;
}

export interface Visit {
  id: string;
  farmerId: string;
  extensionWorkerId: string;
  date: string;
  purpose: string;
  observations: string;
  recommendations: string;
  nextVisitDate: string;
  status: "completed" | "pending" | "cancelled";
}

export interface Application {
  id: string;
  farmerId: string;
  farmerName: string;
  type: "loan" | "insurance";
  status: "pending" | "approved" | "rejected" | "reviewing";
  amount: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes: string;
  riskScore: number;
  purpose: string;
}

export interface RegionData {
  name: string;
  zone: string;
  totalFarmers: number;
  totalAnimals: number;
  avgRiskScore: number;
  droughtRisk: "low" | "medium" | "high" | "critical";
  diseaseOutbreaks: number;
  activeLoans: number;
  activeInsurance: number;
  extensionWorkers: number;
  recentAlerts: number;
  rainfallMm: number;
  vegetationIndex: number; // NDVI 0-1
}

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  status: "active" | "inactive" | "pending";
  lastLogin: string;
  createdAt: string;
  region?: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger" | "success";
  type: "drought" | "disease" | "weather" | "system" | "financial";
  region: string;
  createdAt: string;
  read: boolean;
}

export interface RiskPrediction {
  farmerId: string;
  farmerName: string;
  region: string;
  overallRisk: number;
  droughtRisk: number;
  diseaseRisk: number;
  marketRisk: number;
  financialRisk: number;
  recommendation: string;
  predictedLoss: number;
  confidence: number;
}

const STORAGE_KEY = "mobile_vet_auth";
const DATA_KEY = "mobile_vet_data";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = "/login";
}

export function getAllData(): {
  farmers: Farmer[];
  animals: Animal[];
  healthRecords: HealthRecord[];
  visits: Visit[];
  applications: Application[];
  regions: RegionData[];
  users: DashboardUser[];
  alerts: Alert[];
  predictions: RiskPrediction[];
} {
  if (typeof window === "undefined") return seedData();
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) {
    const data = seedData();
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return data;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const data = seedData();
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return data;
  }
}

export function saveData(data: ReturnType<typeof getAllData>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function seedData() {
  const regions: RegionData[] = [
    {
      name: "Borena Zone", zone: "Borena", totalFarmers: 124, totalAnimals: 3840,
      avgRiskScore: 72, droughtRisk: "critical", diseaseOutbreaks: 3, activeLoans: 18,
      activeInsurance: 42, extensionWorkers: 8, recentAlerts: 12, rainfallMm: 120, vegetationIndex: 0.21,
    },
    {
      name: "Afar Region", zone: "Zone 1", totalFarmers: 89, totalAnimals: 2100,
      avgRiskScore: 68, droughtRisk: "high", diseaseOutbreaks: 1, activeLoans: 12,
      activeInsurance: 31, extensionWorkers: 5, recentAlerts: 7, rainfallMm: 85, vegetationIndex: 0.18,
    },
    {
      name: "Somali Region", zone: "Shabelle", totalFarmers: 156, totalAnimals: 4950,
      avgRiskScore: 65, droughtRisk: "medium", diseaseOutbreaks: 2, activeLoans: 22,
      activeInsurance: 55, extensionWorkers: 10, recentAlerts: 5, rainfallMm: 200, vegetationIndex: 0.34,
    },
    {
      name: "Oromia", zone: "East Hararghe", totalFarmers: 78, totalAnimals: 1890,
      avgRiskScore: 55, droughtRisk: "low", diseaseOutbreaks: 0, activeLoans: 15,
      activeInsurance: 28, extensionWorkers: 6, recentAlerts: 2, rainfallMm: 350, vegetationIndex: 0.52,
    },
  ];

  const users: DashboardUser[] = [
    { id: "u1", name: "Abebe Kebede", email: "abebe@mobilevet.et", role: "extension_worker", organization: "Mobile Vet - Borena", status: "active", lastLogin: "2026-06-17T08:30:00Z", createdAt: "2026-01-15T00:00:00Z", region: "Borena Zone" },
    { id: "u2", name: "Fatima Ali", email: "fatima@mobilevet.et", role: "extension_worker", organization: "Mobile Vet - Afar", status: "active", lastLogin: "2026-06-16T14:20:00Z", createdAt: "2026-02-01T00:00:00Z", region: "Afar Region" },
    { id: "u3", name: "Mohammed Hussen", email: "mohammed@mobilevet.et", role: "extension_worker", organization: "Mobile Vet - Somali", status: "active", lastLogin: "2026-06-17T09:10:00Z", createdAt: "2026-01-20T00:00:00Z", region: "Somali Region" },
    { id: "u4", name: "Dashen Bank", email: "loans@dashenbank.et", role: "bank_insurance", organization: "Dashen Bank", status: "active", lastLogin: "2026-06-15T11:00:00Z", createdAt: "2026-03-01T00:00:00Z" },
    { id: "u5", name: "Ethiopia Insurance", email: "claims@ethiopiainsurance.et", role: "bank_insurance", organization: "Ethiopia Insurance Corp", status: "active", lastLogin: "2026-06-14T10:30:00Z", createdAt: "2026-03-10T00:00:00Z" },
    { id: "u6", name: "Admin User", email: "admin@mobilevet.et", role: "admin", organization: "Mobile Vet HQ", status: "active", lastLogin: "2026-06-17T07:45:00Z", createdAt: "2026-01-01T00:00:00Z" },
    { id: "u7", name: "Dr. Solomon Tadesse", email: "solomon@moaland.gov.et", role: "government", organization: "Ministry of Agriculture", status: "active", lastLogin: "2026-06-16T16:00:00Z", createdAt: "2026-02-15T00:00:00Z" },
  ];

  const farmers: Farmer[] = [
    { id: "f1", fullName: "Gutu Boru", phone: "+251911234567", region: "Borena Zone", zone: "Borena", kebele: "Dubluk", householdSize: 6, yearsFarming: 22, registeredAt: "2026-02-15", extensionWorkerId: "u1", livestockCount: 45, riskScore: 78, riskLevel: "high", hasInsurance: true, hasLoan: false, notes: "Struggling with drought. Needs restocking support." },
    { id: "f2", fullName: "Chaltu Waqo", phone: "+251922345678", region: "Borena Zone", zone: "Borena", kebele: "Arero", householdSize: 4, yearsFarming: 15, registeredAt: "2026-03-01", extensionWorkerId: "u1", livestockCount: 32, riskScore: 45, riskLevel: "medium", hasInsurance: true, hasLoan: true, notes: "Good herd health. Strong repayment history." },
    { id: "f3", fullName: "Abdul Rashid", phone: "+251933456789", region: "Afar Region", zone: "Zone 1", kebele: "Asaita", householdSize: 8, yearsFarming: 30, registeredAt: "2026-02-20", extensionWorkerId: "u2", livestockCount: 28, riskScore: 82, riskLevel: "critical", hasInsurance: false, hasLoan: false, notes: "Lost 12 animals in recent drought. Urgent support needed." },
    { id: "f4", fullName: "Hawo Mohamed", phone: "+251944567890", region: "Somali Region", zone: "Shabelle", kebele: "Gode", householdSize: 5, yearsFarming: 18, registeredAt: "2026-03-10", extensionWorkerId: "u3", livestockCount: 67, riskScore: 38, riskLevel: "low", hasInsurance: true, hasLoan: true, notes: "Expanding herd. Interested in crop insurance." },
    { id: "f5", fullName: "Benti Jaldessa", phone: "+251955678901", region: "Borena Zone", zone: "Borena", kebele: "Moyale", householdSize: 7, yearsFarming: 25, registeredAt: "2026-01-20", extensionWorkerId: "u1", livestockCount: 51, riskScore: 91, riskLevel: "critical", hasInsurance: false, hasLoan: false, notes: "Multiple disease outbreaks. Quarantine recommended." },
    { id: "f6", fullName: "Sahal Gedi", phone: "+251966789012", region: "Somali Region", zone: "Shabelle", kebele: "Kelafo", householdSize: 3, yearsFarming: 10, registeredAt: "2026-04-01", extensionWorkerId: "u3", livestockCount: 19, riskScore: 55, riskLevel: "medium", hasInsurance: false, hasLoan: false, notes: "New farmer. Needs training and starter support." },
    { id: "f7", fullName: "Tigist Lemma", phone: "+251977890123", region: "Oromia", zone: "East Hararghe", kebele: "Kobo", householdSize: 4, yearsFarming: 12, registeredAt: "2026-03-15", extensionWorkerId: "u2", livestockCount: 34, riskScore: 42, riskLevel: "low", hasInsurance: true, hasLoan: false, notes: "Stable. Good pasture availability." },
  ];

  const animals: Animal[] = [
    { id: "a1", farmerId: "f1", tagNumber: "MV-2026-0001", rfidId: "RFID-BRN-001", species: "cattle", breed: "Boran", gender: "male", birthDate: "2022-03-15", color: "Brown", weight: 420, healthStatus: "healthy", location: "Dubluk Pasture A", lastSeen: "2026-06-17", vaccinationHistory: ["FMD - 2026-01-10", "LSD - 2026-02-20"], registeredAt: "2026-02-15" },
    { id: "a2", farmerId: "f1", tagNumber: "MV-2026-0002", rfidId: "RFID-BRN-002", species: "cattle", breed: "Boran", gender: "female", birthDate: "2021-05-20", color: "Brown", weight: 380, healthStatus: "healthy", location: "Dubluk Pasture A", lastSeen: "2026-06-17", vaccinationHistory: ["FMD - 2026-01-10", "LSD - 2026-02-20", "Brucellosis - 2026-03-15"], registeredAt: "2026-02-15" },
    { id: "a3", farmerId: "f1", tagNumber: "MV-2026-0003", rfidId: "RFID-BRN-003", species: "goat", breed: "Somali", gender: "female", birthDate: "2023-01-10", color: "White", weight: 35, healthStatus: "sick", location: "Dubluk Pasture B", lastSeen: "2026-06-16", vaccinationHistory: ["PPR - 2026-01-15"], registeredAt: "2026-02-15" },
    { id: "a4", farmerId: "f3", tagNumber: "MV-2026-0101", rfidId: "RFID-AFR-101", species: "camel", breed: "Afar", gender: "female", birthDate: "2019-08-05", color: "Cream", weight: 480, healthStatus: "recovered", location: "Asaita Zone 3", lastSeen: "2026-06-15", vaccinationHistory: ["Camel Pox - 2026-02-10"], registeredAt: "2026-02-20" },
    { id: "a5", farmerId: "f3", tagNumber: "MV-2026-0102", rfidId: "RFID-AFR-102", species: "goat", breed: "Afar", gender: "male", birthDate: "2022-11-20", color: "Black", weight: 28, healthStatus: "deceased", location: "Asaita Zone 3", lastSeen: "2026-05-30", vaccinationHistory: ["PPR - 2026-01-15"], registeredAt: "2026-02-20" },
    { id: "a6", farmerId: "f4", tagNumber: "MV-2026-0201", rfidId: "RFID-SML-201", species: "cattle", breed: "Somali", gender: "female", birthDate: "2020-04-12", color: "Red", weight: 410, healthStatus: "healthy", location: "Gode North", lastSeen: "2026-06-17", vaccinationHistory: ["FMD - 2026-01-20", "LSD - 2026-02-25"], registeredAt: "2026-03-10" },
    { id: "a7", farmerId: "f5", tagNumber: "MV-2026-0301", rfidId: "RFID-BRN-301", species: "cattle", breed: "Boran", gender: "male", birthDate: "2021-09-01", color: "Brown", weight: 395, healthStatus: "sick", location: "Moyale Zone 2", lastSeen: "2026-06-14", vaccinationHistory: ["FMD - 2026-01-10"], registeredAt: "2026-01-20" },
  ];

  const healthRecords: HealthRecord[] = [
    { id: "h1", animalId: "a3", farmerId: "f1", recordedBy: "u1", date: "2026-06-15", type: "disease", symptoms: "Fever, diarrhea, loss of appetite", diagnosis: "Coccidiosis", treatment: "Albendazole + electrolytes", notes: "Isolated from herd. Monitoring closely.", severity: "moderate", followUpRequired: true, followUpDate: "2026-06-18" },
    { id: "h2", animalId: "a5", farmerId: "f3", recordedBy: "u2", date: "2026-05-28", type: "disease", symptoms: "Sudden collapse, respiratory distress", diagnosis: "Contagious Caprine Pleuropneumonia (CCPP)", treatment: "Oxytetracycline - too late", notes: "Died within 24 hours. Herd quarantine initiated.", severity: "emergency", followUpRequired: false },
    { id: "h3", animalId: "a1", farmerId: "f1", recordedBy: "u1", date: "2026-01-10", type: "vaccination", symptoms: "None", diagnosis: "Routine FMD vaccination", treatment: "FMD vaccine", notes: "Annual vaccination. No adverse reaction.", severity: "low", followUpRequired: false },
    { id: "h4", animalId: "a7", farmerId: "f5", recordedBy: "u1", date: "2026-06-14", type: "disease", symptoms: "Fever, nasal discharge, lameness", diagnosis: "Foot-and-Mouth Disease (FMD)", treatment: "Supportive care, topical antiseptic", notes: "Outbreak confirmed in kebele. 5 animals affected.", severity: "high", followUpRequired: true, followUpDate: "2026-06-17" },
  ];

  const visits: Visit[] = [
    { id: "v1", farmerId: "f1", extensionWorkerId: "u1", date: "2026-06-10", purpose: "Routine health check and vaccination status review", observations: "3 animals showing signs of dehydration. Pasture water source dried up.", recommendations: "Move herd to Pasture B. Provide water supplementation. Deworming needed.", nextVisitDate: "2026-06-17", status: "completed" },
    { id: "v2", farmerId: "f3", extensionWorkerId: "u2", date: "2026-06-12", purpose: "Emergency visit - disease outbreak reported", observations: "1 goat deceased. 2 others showing respiratory symptoms. Quarantine in place.", recommendations: "Full CCPP vaccination for remaining herd. Report to district vet office.", nextVisitDate: "2026-06-15", status: "completed" },
    { id: "v3", farmerId: "f4", extensionWorkerId: "u3", date: "2026-06-18", purpose: "Loan application follow-up and herd verification", observations: "Herd in excellent condition. 67 animals verified. All tagged.", recommendations: "Recommend loan approval. Farmer has strong repayment capacity.", nextVisitDate: "2026-07-18", status: "pending" },
  ];

  const applications: Application[] = [
    { id: "app1", farmerId: "f2", farmerName: "Chaltu Waqo", type: "loan", status: "approved", amount: 50000, submittedAt: "2026-05-01", reviewedAt: "2026-05-10", reviewedBy: "u4", notes: "Approved for restocking. Strong collateral and repayment history.", riskScore: 45, purpose: "Purchase 5 breeding cattle" },
    { id: "app2", farmerId: "f4", farmerName: "Hawo Mohamed", type: "loan", status: "reviewing", amount: 75000, submittedAt: "2026-06-05", notes: "Under review. Awaiting field verification visit results.", riskScore: 38, purpose: "Expand dairy production" },
    { id: "app3", farmerId: "f1", farmerName: "Gutu Boru", type: "insurance", status: "pending", amount: 25000, submittedAt: "2026-06-10", notes: "Drought insurance application. High risk region.", riskScore: 78, purpose: "Drought livestock insurance coverage" },
    { id: "app4", farmerId: "f5", farmerName: "Benti Jaldessa", type: "insurance", status: "rejected", amount: 30000, submittedAt: "2026-04-20", reviewedAt: "2026-05-05", reviewedBy: "u5", notes: "Rejected due to active disease outbreak. Reapply after 90 days.", riskScore: 91, purpose: "Comprehensive herd insurance" },
  ];

  const alerts: Alert[] = [
    { id: "al1", title: "Drought Warning - Borena Zone", message: "NDVI below 0.25 for 3 consecutive weeks. Water sources depleting.", severity: "danger", type: "drought", region: "Borena Zone", createdAt: "2026-06-16T06:00:00Z", read: false },
    { id: "al2", title: "FMD Outbreak - Moyale", message: "5 cases confirmed in Moyale Zone 2. Quarantine in effect.", severity: "danger", type: "disease", region: "Borena Zone", createdAt: "2026-06-14T10:00:00Z", read: false },
    { id: "al3", title: "CCPP Alert - Asaita", message: "1 fatality confirmed. 2 animals symptomatic. Vaccination drive recommended.", severity: "warning", type: "disease", region: "Afar Region", createdAt: "2026-06-12T14:00:00Z", read: true },
    { id: "al4", title: "Heavy Rain Forecast - Somali", message: "Above-normal rainfall expected next 2 weeks. Flash flood risk in lowlands.", severity: "warning", type: "weather", region: "Somali Region", createdAt: "2026-06-15T08:00:00Z", read: false },
  ];

  const predictions: RiskPrediction[] = [
    { farmerId: "f1", farmerName: "Gutu Boru", region: "Borena Zone", overallRisk: 78, droughtRisk: 85, diseaseRisk: 62, marketRisk: 70, financialRisk: 88, recommendation: "Urgent: Move herd to southern pastures. Apply for drought insurance. Consider partial sale.", predictedLoss: 12, confidence: 0.82 },
    { farmerId: "f2", farmerName: "Chaltu Waqo", region: "Borena Zone", overallRisk: 45, droughtRisk: 55, diseaseRisk: 30, marketRisk: 40, financialRisk: 35, recommendation: "Stable. Continue current practices. Monitor water sources weekly.", predictedLoss: 3, confidence: 0.76 },
    { farmerId: "f3", farmerName: "Abdul Rashid", region: "Afar Region", overallRisk: 82, droughtRisk: 90, diseaseRisk: 75, marketRisk: 60, financialRisk: 95, recommendation: "Critical: Immediate restocking grant. Full vaccination protocol. Quarantine extension.", predictedLoss: 15, confidence: 0.89 },
    { farmerId: "f4", farmerName: "Hawo Mohamed", region: "Somali Region", overallRisk: 38, droughtRisk: 35, diseaseRisk: 25, marketRisk: 45, financialRisk: 40, recommendation: "Low risk profile. Excellent candidate for expansion loan. Consider crop diversification.", predictedLoss: 2, confidence: 0.74 },
  ];

  return { farmers, animals, healthRecords, visits, applications, regions, users, alerts, predictions };
}
