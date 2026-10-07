import { cookies } from "next/headers";
import { sql } from "@/lib/db";

const COOKIE_NAME = "queueless_staff_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type StaffSession = {
  staffId: string;
  schoolId: string;
  officeId: string | null;
  role: "admin" | "staff";
  name: string;
};

function getSecret() {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret) throw new Error("STAFF_SESSION_SECRET is missing");
  return secret;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(signature));
}

async function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

function encodePayload(session: StaffSession, expiresAt: number) {
  return btoa(JSON.stringify({ ...session, expiresAt }))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decodePayload(payload: string) {
  const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(atob(padded)) as StaffSession & { expiresAt: number };
}

export async function authenticateStaff(email: string, password: string): Promise<StaffSession | null> {
  const rows = await sql`
    SELECT su.id, su.school_id, su.office_id, su.name, su.role
    FROM staff_users su
    JOIN schools s ON s.id = su.school_id
    WHERE lower(su.email) = lower(${email})
      AND su.is_active = true
      AND s.is_active = true
      AND su.password_hash = crypt(${password}, su.password_hash)
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const staff = rows[0];
  return {
    staffId: String(staff.id),
    schoolId: String(staff.school_id),
    officeId: staff.office_id ? String(staff.office_id) : null,
    role: staff.role === "admin" ? "admin" : "staff",
    name: String(staff.name),
  };
}

export async function createStaffSession(session: StaffSession) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = encodePayload(session, expiresAt);
  const signature = await sign(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearStaffSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!(await safeEqual(signature, await sign(payload)))) return null;

  try {
    const decoded = decodePayload(payload);
    if (decoded.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return { staffId: decoded.staffId, schoolId: decoded.schoolId, officeId: decoded.officeId, role: decoded.role, name: decoded.name };
  } catch {
    return null;
  }
}

export async function requireStaff(): Promise<{ session: StaffSession } | { response: Response }> {
  const session = await getStaffSession();
  if (!session) return { response: Response.json({ error: "Staff authentication required" }, { status: 401 }) };
  return { session };
}

export function canAccessOffice(session: StaffSession, officeId: string) {
  return session.role === "admin" || session.officeId === officeId;
}
