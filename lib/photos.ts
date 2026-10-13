import "server-only";
import type { PoolClient } from "pg";
import { query, queryOne } from "./db";
import { AuthError, regionScope } from "./auth";
import { can } from "./permissions";
import type { SessionUser } from "./types";

export type PhotoTarget = "farmer" | "animal" | "health_record" | "visit";

export const PHOTO_LIMITS = {
  perUpload: 6,
  perRecord: 24,
  fullBytes: 1_500_000, // browser resizes to ~1600px JPEG, typically 150–400 KB
  thumbBytes: 200_000,
};

const COLUMN: Record<PhotoTarget, string> = {
  farmer: "farmer_id",
  animal: "animal_id",
  health_record: "health_record_id",
  visit: "visit_id",
};

const EDIT_ROLES: Record<PhotoTarget, SessionUser["role"][]> = {
  farmer: can.editFarmers,
  animal: can.editLivestock,
  health_record: can.editHealth,
  visit: can.editVisits,
};

/** SQL resolving any photo/record to its farmer, for region-scoped access checks. */
const OWNER_FARMER: Record<PhotoTarget, string> = {
  farmer: "SELECT id AS farmer_id FROM farmers WHERE id = $1",
  animal: "SELECT farmer_id FROM animals WHERE id = $1",
  health_record: "SELECT a.farmer_id FROM health_records h JOIN animals a ON a.id = h.animal_id WHERE h.id = $1",
  visit: "SELECT farmer_id FROM visits WHERE id = $1",
};

export function isPhotoTarget(v: string): v is PhotoTarget {
  return v in COLUMN;
}

/** Throws unless `user` may add/remove photos on this record. */
export async function assertPhotoEdit(user: SessionUser, target: PhotoTarget, id: string) {
  if (!EDIT_ROLES[target].includes(user.role)) throw new AuthError("You don't have permission to change photos here.");
  const row = await queryOne<{ farmer_id: string }>(OWNER_FARMER[target], [id]);
  if (!row) throw new AuthError("Record not found.");
  const scope = regionScope(user);
  if (scope) {
    const f = await queryOne<{ region_id: number }>("SELECT region_id FROM farmers WHERE id = $1", [row.farmer_id]);
    if (f?.region_id !== scope) throw new AuthError("This record is outside your region.");
  }
}

/** Detects the real image type from the file's first bytes (never trust the browser's label). */
function sniff(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export class PhotoError extends Error {}

type Prepared = { type: string; data: Buffer; thumb: Buffer; width: number | null; height: number | null };

/** Reads and validates the `photos` / `photo_thumbs` / `photo_dims` fields sent by <PhotoInput>. */
export async function readPhotos(fd: FormData): Promise<Prepared[]> {
  const full = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const thumbs = fd.getAll("photo_thumbs").filter((f): f is File => f instanceof File && f.size > 0);
  if (!full.length) return [];
  if (full.length > PHOTO_LIMITS.perUpload) throw new PhotoError(`Upload at most ${PHOTO_LIMITS.perUpload} photos at a time.`);
  if (thumbs.length !== full.length) throw new PhotoError("Photos couldn't be processed. Please choose them again.");
  let dims: [number, number][] = [];
  try { dims = JSON.parse(String(fd.get("photo_dims") ?? "[]")); } catch { /* optional */ }

  const out: Prepared[] = [];
  for (let i = 0; i < full.length; i++) {
    if (full[i].size > PHOTO_LIMITS.fullBytes || thumbs[i].size > PHOTO_LIMITS.thumbBytes) throw new PhotoError("A photo is too large. Please try again.");
    const data = Buffer.from(await full[i].arrayBuffer());
    const thumb = Buffer.from(await thumbs[i].arrayBuffer());
    const type = sniff(data);
    if (!type || !sniff(thumb)) throw new PhotoError("Only JPEG, PNG or WebP images can be uploaded.");
    const [w, h] = Array.isArray(dims[i]) ? dims[i] : [null, null];
    out.push({ type, data, thumb, width: Number(w) || null, height: Number(h) || null });
  }
  return out;
}

/** Stores already-validated photos against a record (optionally inside a transaction). */
export async function storePhotos(target: PhotoTarget, id: string, photos: Prepared[], userId: string, client?: PoolClient) {
  if (!photos.length) return 0;
  const existing = await queryOne<{ n: number }>(`SELECT COUNT(*)::int AS n FROM photos WHERE ${COLUMN[target]} = $1`, [id]);
  if ((existing?.n ?? 0) + photos.length > PHOTO_LIMITS.perRecord) {
    throw new PhotoError(`A record can hold at most ${PHOTO_LIMITS.perRecord} photos.`);
  }
  const sql = `INSERT INTO photos (${COLUMN[target]}, content_type, data, thumb, width, height, size_bytes, uploaded_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
  for (const p of photos) {
    const params = [id, p.type, p.data, p.thumb, p.width, p.height, p.data.length, userId];
    if (client) await client.query(sql, params);
    else await query(sql, params);
  }
  return photos.length;
}

/** Loads a photo for display if `user` can see the record it belongs to. */
export async function getPhotoForUser(user: SessionUser, id: string, size: "full" | "thumb") {
  const row = await queryOne<{ content_type: string; bytes: Buffer; region_id: number }>(
    `SELECT p.content_type, ${size === "thumb" ? "p.thumb" : "p.data"} AS bytes, f.region_id
       FROM photos p
       LEFT JOIN animals a ON a.id = p.animal_id
       LEFT JOIN health_records h ON h.id = p.health_record_id
       LEFT JOIN animals ha ON ha.id = h.animal_id
       LEFT JOIN visits v ON v.id = p.visit_id
       JOIN farmers f ON f.id = COALESCE(p.farmer_id, a.farmer_id, ha.farmer_id, v.farmer_id)
      WHERE p.id = $1`, [id]);
  if (!row) return null;
  const scope = regionScope(user);
  if (scope && row.region_id !== scope) return null;
  return row;
}

/** Resolves which record a photo belongs to (for delete permission checks). */
export async function photoOwner(id: string): Promise<{ target: PhotoTarget; id: string } | null> {
  const row = await queryOne<Record<string, string | null>>(
    "SELECT farmer_id, animal_id, health_record_id, visit_id FROM photos WHERE id = $1", [id]);
  if (!row) return null;
  for (const t of Object.keys(COLUMN) as PhotoTarget[]) {
    const v = row[COLUMN[t]];
    if (v) return { target: t, id: v };
  }
  return null;
}
