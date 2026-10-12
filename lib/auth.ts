import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { query, queryOne } from "./db";
import type { SessionUser, UserRole } from "./types";

export const SESSION_COOKIE = "mv_session";
const SESSION_DAYS = 7;

export async function verifyCredentials(email: string, password: string) {
  // pgcrypto's crypt() re-hashes the input with the stored salt (bcrypt).
  return queryOne<{ id: string; status: string }>(
    `SELECT id, status FROM users
      WHERE lower(email) = lower($1) AND password_hash = crypt($2, password_hash)`,
    [email.trim(), password],
  );
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", [token, userId, expires]);
  await query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [userId]);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await query("DELETE FROM sessions WHERE token = $1", [token]);
  store.delete(SESSION_COOKIE);
}

/** Current signed-in user, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return queryOne<SessionUser>(
    `SELECT u.id, u.name, u.email, u.role, u.organization, u.region_id, r.name AS region_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN regions r ON r.id = u.region_id
      WHERE s.token = $1 AND s.expires_at > NOW() AND u.status = 'active'`,
    [token],
  );
});

/** For pages: redirect to /login when signed out, or to /dashboard when the role isn't allowed. */
export async function requireUser(roles?: UserRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export class AuthError extends Error {}

/** For Server Actions: throw instead of redirecting. */
export async function authorize(roles?: UserRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Your session has expired. Please sign in again.");
  if (roles && !roles.includes(user.role)) throw new AuthError("You don't have permission to do that.");
  return user;
}

/**
 * Extension workers only see farmers in their assigned region.
 * Returns the region id to filter on, or null for no restriction.
 */
export function regionScope(user: SessionUser): number | null {
  return user.role === "extension_worker" ? user.region_id : null;
}
