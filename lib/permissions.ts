import type { UserRole } from "./types";

const ALL: UserRole[] = ["extension_worker", "bank_insurance", "admin", "government"];
const FIELD: UserRole[] = ["extension_worker", "admin"];

// Single source of truth for who can see and change what.
// Used for navigation (client) and enforced again in every page and Server Action.
//
// Government, banks and insurers have full READ access to farmers, livestock, health records,
// visits and the overview, but cannot change them. Banks/insurers can only decide on
// (and close) the loan and insurance applications addressed to their own institution.
export const can = {
  viewFarmers: ALL,
  editFarmers: FIELD,
  viewLivestock: ALL,
  editLivestock: FIELD,
  viewHealth: ALL,
  editHealth: FIELD,
  viewVisits: ALL,
  editVisits: FIELD,
  viewRisk: ALL,
  assessRisk: FIELD,
  viewApplications: ALL,
  createApplications: FIELD,
  reviewApplications: ["bank_insurance", "admin"] as UserRole[],
  deleteApplications: ["admin"] as UserRole[],
  viewRegions: ALL,
  editRegions: ["admin"] as UserRole[],
  viewAlerts: ALL,
  manageAlerts: ["admin"] as UserRole[],
  manageUsers: ["admin"] as UserRole[],
  viewInquiries: ["admin"] as UserRole[],
} satisfies Record<string, UserRole[]>;

export function allowed(role: UserRole, list: UserRole[]) {
  return list.includes(role);
}
