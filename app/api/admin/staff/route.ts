import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/staff-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;

    const rows = await sql`
      SELECT su.id, su.name, su.email, su.role, su.is_active, su.office_id,
             o.name AS office_name, su.created_at
      FROM staff_users su
      LEFT JOIN offices o ON o.id = su.office_id
      WHERE su.school_id = ${auth.session.schoolId}
      ORDER BY su.created_at ASC
    `;

    return Response.json(rows);
  } catch (error) {
    console.error("Failed to list staff:", error);
    return Response.json({ error: "Unable to load staff accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = body.role === "admin" ? "admin" : "staff";
    const officeId = body.officeId ? String(body.officeId) : null;

    if (!name || !email || !password) {
      return Response.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (role === "staff") {
      if (!officeId) return Response.json({ error: "Choose an office for staff accounts" }, { status: 400 });
      const office = await sql`
        SELECT id FROM offices
        WHERE id = ${officeId} AND school_id = ${auth.session.schoolId} AND is_active = true
        LIMIT 1
      `;
      if (office.length === 0) {
        return Response.json({ error: "That office is not available in your school" }, { status: 400 });
      }
    }

    const existing = await sql`
      SELECT id FROM staff_users
      WHERE school_id = ${auth.session.schoolId} AND lower(email) = lower(${email})
      LIMIT 1
    `;
    if (existing.length > 0) {
      return Response.json({ error: "A staff account with that email already exists" }, { status: 409 });
    }

    const created = await sql`
      INSERT INTO staff_users (school_id, office_id, name, email, password_hash, role)
      VALUES (
        ${auth.session.schoolId},
        ${role === "staff" ? officeId : null},
        ${name},
        ${email},
        crypt(${password}, gen_salt('bf')),
        ${role}
      )
      RETURNING id, name, email, role, office_id, is_active, created_at
    `;

    return Response.json(created[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create staff account:", error);
    return Response.json({ error: "Unable to create staff account" }, { status: 500 });
  }
}
