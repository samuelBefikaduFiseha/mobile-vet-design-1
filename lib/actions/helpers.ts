import "server-only";
import { revalidatePath } from "next/cache";
import { AuthError } from "../auth";
import type { ActionState } from "../types";

export class ValidationError extends Error {}

export function str(fd: FormData, key: string, { required = false, max = 2000 } = {}): string {
  const v = String(fd.get(key) ?? "").trim();
  if (required && !v) throw new ValidationError(`${label(key)} is required.`);
  if (v.length > max) throw new ValidationError(`${label(key)} is too long.`);
  return v;
}

export function num(fd: FormData, key: string, { required = false, min = -Infinity, max = Infinity } = {}): number | null {
  const raw = String(fd.get(key) ?? "").trim();
  if (!raw) {
    if (required) throw new ValidationError(`${label(key)} is required.`);
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) throw new ValidationError(`${label(key)} must be between ${min} and ${max}.`);
  return n;
}

export function oneOf<T extends string>(fd: FormData, key: string, options: readonly T[]): T {
  const v = String(fd.get(key) ?? "");
  if (!options.includes(v as T)) throw new ValidationError(`Choose a valid ${label(key).toLowerCase()}.`);
  return v as T;
}

export function date(fd: FormData, key: string, { required = false } = {}): string | null {
  const v = String(fd.get(key) ?? "").trim();
  if (!v) {
    if (required) throw new ValidationError(`${label(key)} is required.`);
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ValidationError(`${label(key)} must be a valid date.`);
  return v;
}

function label(key: string) {
  const s = key.replace(/_id$/, "").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Runs a mutation, refreshes dashboard data and converts errors into form state. */
export async function run(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await fn();
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: message || "Saved." };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

function friendly(err: unknown): string {
  if (err instanceof ValidationError || err instanceof AuthError) return err.message;
  const e = err as { code?: string; constraint?: string; message?: string };
  if (e?.code === "23505") {
    if (e.constraint?.includes("tag_number")) return "That ear-tag number is already registered.";
    if (e.constraint?.includes("rfid")) return "That RFID is already registered.";
    if (e.constraint?.includes("email")) return "A user with that email already exists.";
    return "That record already exists.";
  }
  if (e?.code === "23503") return "This record is linked to other data and can't be changed that way.";
  if (e?.code === "23514") return "One of the values isn't allowed.";
  if (e?.code === "ECONNREFUSED") return "Database is not reachable. Is Docker running? (docker compose up -d)";
  console.error(err);
  return "Something went wrong. Please try again.";
}
